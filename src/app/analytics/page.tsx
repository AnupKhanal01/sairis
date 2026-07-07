"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CitizenReport, HistoricalAccident, MisinfoItem } from "@/lib/types";

const COUNTRY_COLOR: Record<string, string> = {
  Nepal: "green",
  Pakistan: "red",
  Bangladesh: "red",
  "Sri Lanka": "blue",
  India: "",
};

export default function AnalyticsPage() {
  const [accidents, setAccidents] = useState<HistoricalAccident[]>([]);
  const [misinfo, setMisinfo] = useState<MisinfoItem[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);

  useEffect(() => {
    const unsubA = onSnapshot(collection(db, "historicalAccidents"), (snap) => {
      setAccidents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoricalAccident, "id">) }))
      );
    });
    const unsubM = onSnapshot(collection(db, "misinfoItems"), (snap) => {
      setMisinfo(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MisinfoItem, "id">) })));
    });
    const unsubR = onSnapshot(query(collection(db, "citizenReports"), orderBy("ts", "desc")), (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CitizenReport, "id">) })));
    });
    return () => {
      unsubA();
      unsubM();
      unsubR();
    };
  }, []);

  const byCountry: Record<string, number> = {};
  accidents.forEach((h) => {
    byCountry[h.country] = (byCountry[h.country] || 0) + 1;
  });
  const maxCountry = Math.max(1, ...Object.values(byCountry));

  const verifyCounts = { verified: 0, review: 0, false: 0 };
  misinfo.forEach((i) => {
    verifyCounts[i.status]++;
  });
  const maxVerify = Math.max(1, ...Object.values(verifyCounts));
  const verifyLabels: Record<keyof typeof verifyCounts, [string, string]> = {
    verified: ["Verified", "green"],
    review: ["Under verification", "blue"],
    false: ["False information", "red"],
  };

  return (
    <section className="view">
      <h2 className="view-title">Analytics &amp; Dashboard</h2>
      <p className="view-sub">
        Computed live from the historical dataset plus whatever citizen reports and
        misinformation submissions have been added.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3>Historical industrial accidents by country</h3>
          <div>
            {Object.entries(byCountry)
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <div className="bar-row" key={c}>
                  <div className="bar-label">{c}</div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${COUNTRY_COLOR[c] || ""}`}
                      style={{ width: `${(n / maxCountry) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-val">{n}</div>
                </div>
              ))}
          </div>
        </div>
        <div className="card">
          <h3>Verification status of tracked claims</h3>
          <div>
            {(Object.entries(verifyCounts) as [keyof typeof verifyCounts, number][]).map(
              ([k, n]) => (
                <div className="bar-row" key={k}>
                  <div className="bar-label">{verifyLabels[k][0]}</div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${verifyLabels[k][1]}`}
                      style={{ width: `${(n / maxVerify) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-val">{n}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Historical accident register (South Asia, industrial accident scenario)</h3>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Event</th>
                <th>Country</th>
                <th>Location</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {accidents
                .slice()
                .sort((a, b) => a.year - b.year)
                .map((h) => (
                  <tr key={h.id}>
                    <td>{h.year}</td>
                    <td>{h.event}</td>
                    <td>{h.country}</td>
                    <td>{h.location}</td>
                    <td>{h.impact}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Citizen reports logged</h3>
        {reports.length === 0 ? (
          <div className="empty">
            No citizen reports yet — submit one in module 04 and it will appear here.
          </div>
        ) : (
          reports.map((r) => (
            <div className="report-card" key={r.id}>
              <div className="meta">
                <span>{r.type}</span>
                <span>{new Date(r.ts).toLocaleString()}</span>
              </div>
              <p>
                <b>{r.location}</b> — {r.desc}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
