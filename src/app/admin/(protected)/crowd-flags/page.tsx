"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { IndustrialSite } from "@/lib/types";

function ratioLabel(site: IndustrialSite): string {
  const fine = site.votesFine || 0;
  const problem = site.votesProblem || 0;
  const total = fine + problem;
  if (total === 0) return "no reports yet";
  return `${problem}/${total} reported a problem (${Math.round((problem / total) * 100)}%)`;
}

export default function AdminCrowdFlagsPage() {
  const [sites, setSites] = useState<IndustrialSite[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "industrialSites"), orderBy("name")), (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IndustrialSite, "id">) })));
    });
    return () => unsub();
  }, []);

  const flagged = sites.filter((s) => s.crowdFlagged);
  const reported = sites.filter((s) => !s.crowdFlagged && ((s.votesFine || 0) + (s.votesProblem || 0)) > 0);

  async function confirmHazard(site: IndustrialSite) {
    if (!confirm(`Confirm ${site.name} as an active incident? This sets its status to "incident" on the map.`)) return;
    // Event handler invoked from a list-rendered button, not during render itself —
    // react-hooks/purity can't trace that through the onClick closure.
    // eslint-disable-next-line react-hooks/purity
    const crowdReviewedAt = Date.now();
    await updateDoc(doc(db, "industrialSites", site.id), {
      status: "incident",
      crowdFlagged: false,
      votesFine: 0,
      votesProblem: 0,
      crowdReviewedAt,
      crowdReviewedBy: auth.currentUser?.email || "",
    });
  }

  async function revert(site: IndustrialSite) {
    if (!confirm(`Dismiss the community flag on ${site.name} as a false alarm? Report counts will reset.`)) return;
    const crowdReviewedAt = Date.now();
    await updateDoc(doc(db, "industrialSites", site.id), {
      crowdFlagged: false,
      votesFine: 0,
      votesProblem: 0,
      crowdReviewedAt,
      crowdReviewedBy: auth.currentUser?.email || "",
    });
  }

  return (
    <div>
      <h2 className="view-title">Crowd Reports</h2>
      <p className="view-sub">
        Visitors on the /gis map can report whether a site looks like it&apos;s operating
        normally. Once a site gets 50+ reports and over 80% say &quot;problem,&quot; it&apos;s
        flagged here — nothing changes on the public map&apos;s official status until you confirm
        or dismiss it.
      </p>

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Pending verification ({flagged.length})</h3>
        {flagged.length === 0 ? (
          <div className="empty">No sites are currently crowd-flagged.</div>
        ) : (
          flagged.map((site) => (
            <div className="feed-item" key={site.id}>
              <div className="meta">
                <span className="tag critical">crowd-flagged</span>
                <span>{site.country}</span>
              </div>
              <h4>{site.name}</h4>
              <p>{ratioLabel(site)}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button className="btn-primary" onClick={() => confirmHazard(site)}>
                  Confirm hazard → mark incident
                </button>
                <button className="btn-ghost" onClick={() => revert(site)}>
                  Revert (false alarm)
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3>Other sites with community reports ({reported.length})</h3>
        {reported.length === 0 ? (
          <div className="empty">No other sites have community reports yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Country</th>
                  <th>Reports</th>
                </tr>
              </thead>
              <tbody>
                {reported.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.country}</td>
                    <td>{ratioLabel(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
