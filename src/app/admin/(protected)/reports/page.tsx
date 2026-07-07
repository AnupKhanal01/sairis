"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CitizenReport } from "@/lib/types";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "citizenReports"), orderBy("ts", "desc")), (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CitizenReport, "id">) })));
    });
    return () => unsub();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this citizen report?")) return;
    await deleteDoc(doc(db, "citizenReports", id));
  }

  return (
    <div>
      <h2 className="view-title">Citizen Reports</h2>
      <div className="card">
        {reports.length === 0 ? (
          <div className="empty">No reports submitted yet.</div>
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
              {r.photo && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--muted)" }}>photo: {r.photo}</div>
              )}
              <button className="btn-danger" style={{ marginTop: "8px" }} onClick={() => remove(r.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
