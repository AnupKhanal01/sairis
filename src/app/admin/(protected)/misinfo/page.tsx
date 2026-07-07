"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MisinfoItem, MisinfoStatus } from "@/lib/types";

const STATUSES: MisinfoStatus[] = ["verified", "review", "false"];

export default function AdminMisinfoPage() {
  const [items, setItems] = useState<MisinfoItem[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "misinfoItems"), orderBy("createdAt", "desc")), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MisinfoItem, "id">) })));
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: MisinfoStatus) {
    // Event handler invoked from a list-rendered button, not during render itself —
    // react-hooks/purity can't trace that through the onClick closure.
    // eslint-disable-next-line react-hooks/purity
    const updatedAt = Date.now();
    await updateDoc(doc(db, "misinfoItems", id), { status, updatedAt });
  }

  async function remove(id: string) {
    if (!confirm("Delete this claim?")) return;
    await deleteDoc(doc(db, "misinfoItems", id));
  }

  return (
    <div>
      <h2 className="view-title">Misinformation Board — Moderation</h2>
      <div className="card">
        {items.length === 0 ? (
          <div className="empty">Nothing submitted yet.</div>
        ) : (
          items.map((i) => (
            <div className="feed-item" key={i.id}>
              <div className="meta">
                <span className={`tag ${i.status}`}>{i.status}</span>
                <span>source: {i.src}</span>
              </div>
              <p>{i.text}</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button key={s} className="btn-ghost" onClick={() => setStatus(i.id, s)} disabled={i.status === s}>
                    Mark {s}
                  </button>
                ))}
                <button className="btn-danger" onClick={() => remove(i.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
