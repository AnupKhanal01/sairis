"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { NewsItem } from "@/lib/types";

export default function AdminNewsPage() {
  const [drafts, setDrafts] = useState<NewsItem[]>([]);
  const [published, setPublished] = useState<NewsItem[]>([]);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const [manual, setManual] = useState({ title: "", body: "", sourceName: "", sourceUrl: "" });
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    const unsubDraft = onSnapshot(
      query(collection(db, "newsItems"), where("status", "==", "draft"), orderBy("createdAt", "desc")),
      (snap) => setDrafts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsItem, "id">) })))
    );
    const unsubPub = onSnapshot(
      query(collection(db, "newsItems"), where("status", "==", "published"), orderBy("publishedAt", "desc")),
      (snap) => setPublished(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsItem, "id">) })))
    );
    return () => {
      unsubDraft();
      unsubPub();
    };
  }, []);

  async function publish(id: string) {
    // Event handler invoked from a list-rendered button, not during render itself —
    // react-hooks/purity can't trace that through the onClick closure.
    // eslint-disable-next-line react-hooks/purity
    const publishedAt = Date.now();
    await updateDoc(doc(db, "newsItems", id), { status: "published", publishedAt });
  }

  async function unpublish(id: string) {
    await updateDoc(doc(db, "newsItems", id), { status: "draft" });
  }

  async function reject(id: string) {
    await deleteDoc(doc(db, "newsItems", id));
  }

  async function refresh(source: "gdacs") {
    setRefreshing(source);
    setRefreshMsg("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/ingest/${source}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setRefreshMsg(`${source}: ${data.error || "failed"}`);
      } else {
        setRefreshMsg(`${source}: fetched ${data.fetched}, added ${data.created} new draft(s)`);
      }
    } catch {
      setRefreshMsg(`${source}: network error`);
    } finally {
      setRefreshing(null);
    }
  }

  async function submitManual() {
    if (!manual.title.trim() || !manual.body.trim()) {
      setManualError("Title and body are required.");
      return;
    }
    setManualError("");
    await addDoc(collection(db, "newsItems"), {
      title: manual.title.trim(),
      body: manual.body.trim(),
      sourceName: manual.sourceName.trim() || "SAIRIS admin",
      sourceUrl: manual.sourceUrl.trim(),
      origin: "admin",
      status: "published",
      createdAt: Date.now(),
      publishedAt: Date.now(),
    });
    setManual({ title: "", body: "", sourceName: "", sourceUrl: "" });
  }

  return (
    <div>
      <h2 className="view-title">News Queue</h2>
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Pull latest from automated sources</h3>
        <p style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: 0 }}>
          Pulls into the draft queue below — nothing publishes automatically. ReliefWeb
          ingestion is disabled for now (pending an approved RELIEFWEB_APPNAME) — see the
          &quot;Add news manually&quot; form below for verified items in the meantime.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => refresh("gdacs")} disabled={refreshing !== null}>
            {refreshing === "gdacs" ? "Refreshing…" : "Refresh from GDACS"}
          </button>
        </div>
        {refreshMsg && <div className="status-msg ok">{refreshMsg}</div>}
      </div>

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Add news manually (publishes immediately)</h3>
        <div className="field">
          <label>Title</label>
          <input value={manual.title} onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))} />
        </div>
        <div className="field">
          <label>Body</label>
          <textarea rows={3} value={manual.body} onChange={(e) => setManual((m) => ({ ...m, body: e.target.value }))} />
        </div>
        <div className="grid cols-2">
          <div className="field">
            <label>Source name</label>
            <input
              value={manual.sourceName}
              onChange={(e) => setManual((m) => ({ ...m, sourceName: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Source URL</label>
            <input
              value={manual.sourceUrl}
              onChange={(e) => setManual((m) => ({ ...m, sourceUrl: e.target.value }))}
            />
          </div>
        </div>
        {manualError && <div className="status-msg error">{manualError}</div>}
        <button className="btn-primary" onClick={submitManual}>
          Publish
        </button>
      </div>

      <div className="card" style={{ marginBottom: "16px" }}>
        <h3>Draft queue ({drafts.length})</h3>
        {drafts.length === 0 ? (
          <div className="empty">No drafts awaiting review.</div>
        ) : (
          drafts.map((n) => (
            <div className="feed-item" key={n.id}>
              <div className="meta">
                <span className="tag review">{n.origin}</span>
                <span>{n.sourceName}</span>
              </div>
              <h4>{n.title}</h4>
              <p>{n.body}</p>
              {n.sourceUrl && (
                <p style={{ marginTop: "4px" }}>
                  <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer">
                    source ↗
                  </a>
                </p>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button className="btn-primary" onClick={() => publish(n.id)}>
                  Publish
                </button>
                <button className="btn-danger" onClick={() => reject(n.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3>Published ({published.length})</h3>
        {published.length === 0 ? (
          <div className="empty">Nothing published yet.</div>
        ) : (
          published.map((n) => (
            <div className="feed-item" key={n.id}>
              <div className="meta">
                <span className="tag verified">live</span>
                <span>{n.sourceName}</span>
              </div>
              <h4>{n.title}</h4>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button className="btn-ghost" onClick={() => unpublish(n.id)}>
                  Unpublish
                </button>
                <button className="btn-danger" onClick={() => reject(n.id)}>
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
