"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { IndustrialSite, HistoricalAccident } from "@/lib/types";
import { VOTE_THRESHOLD_COUNT, VOTE_FLAG_RATIO } from "@/lib/types";
import type * as LeafletNS from "leaflet";

const STATUS_COLOR: Record<string, string> = {
  normal: "#F2A900",
  watch: "#F2A900",
  incident: "#D6483C",
};

const VOTED_KEY_PREFIX = "sairis:voted:";

function votePopupHtml(site: IndustrialSite): string {
  const alreadyVoted =
    typeof window !== "undefined" && localStorage.getItem(VOTED_KEY_PREFIX + site.id) !== null;
  const fine = site.votesFine || 0;
  const problem = site.votesProblem || 0;
  const total = fine + problem;

  const flagBanner = site.crowdFlagged
    ? `<div style="margin-top:8px;padding:7px 9px;border:1px solid #D6483C;border-radius:4px;color:#D6483C;font-size:11px;">⚠ Community-flagged as having a problem (${problem}/${total} reports) — pending admin verification</div>`
    : "";

  const voteBlock = alreadyVoted
    ? `<div style="margin-top:10px;font-size:11px;color:#8B95A1;">You've already reported on this site${total ? ` · ${total} community reports so far` : ""}.</div>`
    : `<div style="margin-top:10px;">
        <div style="font-size:10.5px;color:#8B95A1;margin-bottom:5px;">Is this site operating normally right now?</div>
        <button class="btn-ghost sairis-vote-btn" data-site="${site.id}" data-vote="fine" style="margin-right:6px;">✅ Working fine</button>
        <button class="btn-danger sairis-vote-btn" data-site="${site.id}" data-vote="problem">⚠️ Report a problem</button>
        <div class="sairis-vote-status" data-status-for="${site.id}" style="margin-top:6px;font-size:10.5px;color:#8B95A1;">${total ? `${total} community reports so far` : ""}</div>
      </div>`;

  return (
    `<b>${site.name}</b><br><i>${site.industryType}</i><br><br>${site.riskNotes}<br><br>` +
    `<b>Nearest hospital:</b> ${site.hospital}<br><b>Nearest police:</b> ${site.police}` +
    flagBanner +
    voteBlock
  );
}

async function castVote(siteId: string, vote: "fine" | "problem") {
  const ref = doc(db, "industrialSites", siteId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as IndustrialSite;
    const fine = (data.votesFine || 0) + (vote === "fine" ? 1 : 0);
    const problem = (data.votesProblem || 0) + (vote === "problem" ? 1 : 0);
    const total = fine + problem;
    const alreadyFlagged = !!data.crowdFlagged;
    const shouldFlag =
      alreadyFlagged || (total >= VOTE_THRESHOLD_COUNT && problem / total > VOTE_FLAG_RATIO);

    tx.update(ref, {
      votesFine: fine,
      votesProblem: problem,
      crowdFlagged: shouldFlag,
      ...(shouldFlag && !alreadyFlagged ? { crowdFlaggedAt: Date.now() } : {}),
    });
  });
  localStorage.setItem(VOTED_KEY_PREFIX + siteId, "1");
}

export default function MapView() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletNS.Map | null>(null);
  const layersRef = useRef<{
    industry: LeafletNS.LayerGroup;
    history: LeafletNS.LayerGroup;
    hospital: LeafletNS.LayerGroup;
    police: LeafletNS.LayerGroup;
    buffer: LeafletNS.LayerGroup;
  } | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);

  const [sites, setSites] = useState<IndustrialSite[]>([]);
  const [accidents, setAccidents] = useState<HistoricalAccident[]>([]);
  const [toggles, setToggles] = useState({
    industry: true,
    history: true,
    hospital: true,
    police: true,
    buffer: true,
  });

  useEffect(() => {
    const unsubSites = onSnapshot(collection(db, "industrialSites"), (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IndustrialSite, "id">) })));
    });
    const unsubAccidents = onSnapshot(collection(db, "historicalAccidents"), (snap) => {
      setAccidents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoricalAccident, "id">) }))
      );
    });
    return () => {
      unsubSites();
      unsubAccidents();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapDivRef.current || leafletMapRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapDivRef.current, { scrollWheelZoom: true }).setView([25.5, 81], 5);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 18,
      }).addTo(map);

      const industry = L.layerGroup().addTo(map);
      const history = L.layerGroup().addTo(map);
      const hospital = L.layerGroup().addTo(map);
      const police = L.layerGroup().addTo(map);
      const buffer = L.layerGroup().addTo(map);

      map.on("popupopen", (e: LeafletNS.PopupEvent) => {
        const el = e.popup.getElement();
        if (!el) return;
        el.querySelectorAll<HTMLButtonElement>(".sairis-vote-btn").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const siteId = btn.dataset.site;
            const vote = btn.dataset.vote as "fine" | "problem" | undefined;
            if (!siteId || !vote) return;
            const buttons = el.querySelectorAll<HTMLButtonElement>(".sairis-vote-btn");
            const status = el.querySelector<HTMLDivElement>(`[data-status-for="${siteId}"]`);
            buttons.forEach((b) => (b.disabled = true));
            if (status) status.textContent = "Recording your report…";
            try {
              await castVote(siteId, vote);
              if (status) status.textContent = "Thanks — recorded. Reopen this popup to see updated counts.";
            } catch {
              if (status) status.textContent = "Couldn't record your report — try again.";
              buttons.forEach((b) => (b.disabled = false));
            }
          });
        });
      });

      leafletMapRef.current = map;
      layersRef.current = { industry, history, hospital, police, buffer };
    })();
    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layers = layersRef.current;
    if (!L || !layers) return;

    layers.industry.clearLayers();
    layers.hospital.clearLayers();
    layers.police.clearLayers();
    layers.buffer.clearLayers();

    sites.forEach((site) => {
      const color = STATUS_COLOR[site.status] || "#F2A900";

      if (site.crowdFlagged) {
        L.circleMarker([site.lat, site.lng], {
          radius: 13,
          color: "#D6483C",
          weight: 2,
          fill: false,
          dashArray: "3,4",
          className: "sairis-crowd-flag-ring",
        }).addTo(layers.industry);
      }

      L.circleMarker([site.lat, site.lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindPopup(votePopupHtml(site))
        .addTo(layers.industry);

      L.circle([site.lat, site.lng], {
        radius: 3000,
        color: "#D6483C",
        weight: 1,
        fillColor: "#D6483C",
        fillOpacity: 0.08,
        dashArray: "4,4",
      }).addTo(layers.buffer);

      L.circleMarker([site.lat + 0.012, site.lng + 0.01], {
        radius: 6,
        color: "#4E9A6E",
        fillColor: "#4E9A6E",
        fillOpacity: 0.9,
        weight: 1,
      })
        .bindPopup(`<b>${site.hospital}</b><br>Nearest hospital to ${site.name}`)
        .addTo(layers.hospital);

      L.circleMarker([site.lat - 0.012, site.lng - 0.01], {
        radius: 6,
        color: "#5A88A8",
        fillColor: "#5A88A8",
        fillOpacity: 0.9,
        weight: 1,
      })
        .bindPopup(`<b>${site.police}</b><br>Nearest police station to ${site.name}`)
        .addTo(layers.police);
    });
  }, [sites]);

  useEffect(() => {
    const L = leafletRef.current;
    const layers = layersRef.current;
    if (!L || !layers) return;

    layers.history.clearLayers();
    accidents
      .filter((h) => typeof h.lat === "number" && typeof h.lng === "number")
      .forEach((h) => {
        L.marker([h.lat as number, h.lng as number], {
          icon: L.divIcon({
            className: "",
            html: '<div style="width:14px;height:14px;background:#D6483C;border:2px solid #12161B;border-radius:2px;transform:rotate(45deg);"></div>',
          }),
        })
          .bindPopup(`<b>${h.year} — ${h.event}</b><br>${h.location}, ${h.country}<br><br>${h.impact}`)
          .addTo(layers.history);
      });
  }, [accidents]);

  useEffect(() => {
    const map = leafletMapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;
    (Object.keys(toggles) as Array<keyof typeof toggles>).forEach((key) => {
      const layer = layers[key];
      if (toggles[key]) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
  }, [toggles]);

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 250px", gap: "16px" }}>
      <div id="map" ref={mapDivRef}></div>
      <div className="card">
        <h3>Layers</h3>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={toggles.industry}
            onChange={(e) => setToggles((t) => ({ ...t, industry: e.target.checked }))}
          />
          <span className="dot" style={{ background: "var(--amber)" }}></span> Industrial zones
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={toggles.history}
            onChange={(e) => setToggles((t) => ({ ...t, history: e.target.checked }))}
          />
          <span className="dot" style={{ background: "var(--red)" }}></span> Historical accidents
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={toggles.hospital}
            onChange={(e) => setToggles((t) => ({ ...t, hospital: e.target.checked }))}
          />
          <span className="dot" style={{ background: "var(--green)" }}></span> Hospitals
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={toggles.police}
            onChange={(e) => setToggles((t) => ({ ...t, police: e.target.checked }))}
          />
          <span className="dot" style={{ background: "var(--blue)" }}></span> Police stations
        </label>
        <label className="layer-toggle">
          <input
            type="checkbox"
            checked={toggles.buffer}
            onChange={(e) => setToggles((t) => ({ ...t, buffer: e.target.checked }))}
          />{" "}
          3km risk buffer
        </label>
        <div className="legend-row" style={{ marginTop: "14px" }}>
          <span
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              border: "2px dashed var(--red)",
              flexShrink: 0,
            }}
          ></span>
          Dashed red ring — community-flagged, pending admin verification
        </div>
        <div className="disclaimer" style={{ marginTop: "10px", fontSize: "11px" }}>
          Click any marker for risk notes, nearest responders, and to report whether the site
          looks like it&apos;s operating normally. Once 50+ community reports come in for a site
          and over 80% say &quot;problem,&quot; it&apos;s flagged here for an admin to verify —
          it does not change the official status until reviewed.
        </div>
      </div>
    </div>
  );
}
