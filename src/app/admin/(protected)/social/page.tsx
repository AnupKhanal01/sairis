"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { GovFeedPost } from "@/lib/types";

const BLANK = { agency: "", agencyHandle: "", body: "", postUrl: "", postedAt: "" };

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<GovFeedPost[]>([]);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "govFeedPosts"), orderBy("postedAt", "desc")), (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GovFeedPost, "id">) })));
    });
    return () => unsub();
  }, []);

  async function submit() {
    if (!form.agency.trim() || !form.body.trim() || !form.postUrl.trim()) {
      setError("Agency, post text and the original post URL are required — this feed only carries posts you've verified.");
      return;
    }
    setError("");
    await addDoc(collection(db, "govFeedPosts"), {
      agency: form.agency.trim(),
      agencyHandle: form.agencyHandle.trim(),
      body: form.body.trim(),
      postUrl: form.postUrl.trim(),
      postedAt: form.postedAt ? new Date(form.postedAt).getTime() : Date.now(),
      addedBy: auth.currentUser?.email || "",
      createdAt: Date.now(),
    });
    setForm(BLANK);
  }

  async function remove(id: string) {
    if (!confirm("Delete this government agency post?")) return;
    await deleteDoc(doc(db, "govFeedPosts", id));
  }

  return (
    <div>
      <h2 className="view-title">Government Agency Feed</h2>
      <p className="view-sub">
        NDRRMA, Nepal Police and NEOC don&apos;t expose a public API, so this feed is manual:
        read the agency&apos;s real Twitter/X, Facebook, or press-release post, then paste it here
        with a link back to the original.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3>Add a verified post</h3>
          <div className="grid cols-2">
            <div className="field">
              <label>Agency</label>
              <input
                placeholder="e.g. Nepal Police"
                value={form.agency}
                onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Handle (optional)</label>
              <input
                placeholder="e.g. @NepalPolice"
                value={form.agencyHandle}
                onChange={(e) => setForm((f) => ({ ...f, agencyHandle: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Post text</label>
            <textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </div>
          <div className="field">
            <label>Original post URL</label>
            <input value={form.postUrl} onChange={(e) => setForm((f) => ({ ...f, postUrl: e.target.value }))} />
          </div>
          <div className="field">
            <label>Posted at (optional, defaults to now)</label>
            <input
              type="datetime-local"
              value={form.postedAt}
              onChange={(e) => setForm((f) => ({ ...f, postedAt: e.target.value }))}
            />
          </div>
          {error && <div className="status-msg error">{error}</div>}
          <button className="btn-primary" onClick={submit}>
            Publish to feed
          </button>
        </div>
        <div className="card">
          <h3>Live feed ({posts.length})</h3>
          {posts.length === 0 ? (
            <div className="empty">No agency posts yet.</div>
          ) : (
            posts.map((p) => (
              <div className="feed-item" key={p.id}>
                <div className="meta">
                  <span>{p.agency}</span>
                  <span>{new Date(p.postedAt).toLocaleString()}</span>
                </div>
                <p>{p.body}</p>
                <button className="btn-danger" style={{ marginTop: "6px" }} onClick={() => remove(p.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
