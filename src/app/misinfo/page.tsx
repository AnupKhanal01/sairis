"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MisinfoItem } from "@/lib/types";

export default function MisinfoPage() {
  const [items, setItems] = useState<MisinfoItem[]>([]);
  const [text, setText] = useState("");
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "misinfoItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MisinfoItem, "id">) })));
    });
    return () => unsub();
  }, []);

  async function submit() {
    if (!text.trim()) {
      setError("Please describe the claim you saw.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "misinfoItems"), {
        text: text.trim(),
        src: src.trim() || "citizen submission",
        status: "review",
        createdAt: Date.now(),
      });
      setText("");
      setSrc("");
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: { key: MisinfoItem["status"]; title: string; color: string }[] = [
    { key: "verified", title: "Verified", color: "var(--green)" },
    { key: "review", title: "Under verification", color: "var(--blue)" },
    { key: "false", title: "False information", color: "var(--red)" },
  ];

  return (
    <section className="view">
      <h2 className="view-title">Misinformation Verification Module</h2>
      <p className="view-sub">
        Applying the SIFT method — Stop, Investigate the source, Find better coverage, Trace
        claims to the original context — before anything is labelled verified.
      </p>
      <div className="grid cols-3">
        {columns.map((col) => (
          <div className="misinfo-col" key={col.key}>
            <h4 style={{ color: col.color }}>{col.title}</h4>
            {items.filter((i) => i.status === col.key).length === 0 ? (
              <div className="empty">Nothing here yet.</div>
            ) : (
              items
                .filter((i) => i.status === col.key)
                .map((i) => (
                  <div className="misinfo-item" key={i.id}>
                    {i.text}
                    <div className="src">source: {i.src}</div>
                  </div>
                ))
            )}
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Report a rumor for checking</h3>
        <div className="grid cols-2">
          <div>
            <div className="field">
              <label>Claim you saw circulating</label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 'The gas leak has spread to the whole district, evacuate everywhere.'"
              />
            </div>
            <div className="field">
              <label>Where did you see it?</label>
              <input
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                placeholder="e.g. Facebook group, WhatsApp forward"
              />
            </div>
            {error && <div className="status-msg error">{error}</div>}
            <button className="btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for verification"}
            </button>
          </div>
          <div className="disclaimer" style={{ margin: 0 }}>
            New submissions land in <b>Under verification</b>. Only a signed-in admin (DEOC/PIO
            account) can move a card to Verified or False — that reclassification happens in the
            admin panel, not on this public page.
          </div>
        </div>
      </div>
    </section>
  );
}
