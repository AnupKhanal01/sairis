"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewsItem, GovFeedPost } from "@/lib/types";

export default function SocialPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [govPosts, setGovPosts] = useState<GovFeedPost[]>([]);
  const [lastSync, setLastSync] = useState("—");

  useEffect(() => {
    const q = query(
      collection(db, "newsItems"),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsItem, "id">) })));
      setLastSync(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "govFeedPosts"), orderBy("postedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGovPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GovFeedPost, "id">) })));
    });
    return () => unsub();
  }, []);

  return (
    <section className="view">
      <h2 className="view-title">Social &amp; News Monitoring</h2>
      <p className="view-sub">
        Published news is pulled from ReliefWeb and GDACS, reviewed and approved by an admin
        before it appears here. The government agency feed is curated by an admin directly from
        NDRRMA / Nepal Police / NEOC&apos;s own public posts, since none of those agencies expose a
        public API — see the disclaimer below.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <div className="sync-bar">
            <span>VERIFIED NEWS FEED</span>
            <span>last synced {lastSync}</span>
          </div>
          {news.length === 0 ? (
            <div className="empty">No published news yet.</div>
          ) : (
            news.map((n) => (
              <div className="feed-item" key={n.id}>
                <div className="meta">
                  <span className="tag verified">Verified</span>
                  <span>{n.sourceName}</span>
                  <span>{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}</span>
                </div>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                {n.sourceUrl && (
                  <p style={{ marginTop: "6px" }}>
                    <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer">
                      source ↗
                    </a>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        <div className="card">
          <div className="sync-bar">
            <span>GOVERNMENT AGENCY FEED</span>
            <span>#IndustrialSafety #DisasterNP</span>
          </div>
          {govPosts.length === 0 ? (
            <div className="empty">No curated agency posts yet.</div>
          ) : (
            govPosts.map((p) => (
              <div className="feed-item" key={p.id}>
                <div className="meta">
                  <span className="tag verified">Official</span>
                  <span>
                    {p.agency}
                    {p.agencyHandle ? ` (${p.agencyHandle})` : ""}
                  </span>
                  <span>{new Date(p.postedAt).toLocaleString()}</span>
                </div>
                <p>{p.body}</p>
                {p.postUrl && (
                  <p style={{ marginTop: "6px" }}>
                    <a href={p.postUrl} target="_blank" rel="noopener noreferrer">
                      view original post ↗
                    </a>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="disclaimer">
        NDRRMA, Nepal Police and NEOC do not expose a public API or RSS feed — they publish via
        Twitter/X and Facebook only. The government agency feed above is added by an admin after
        reading the agency&apos;s real post, so every entry links back to its original source. The
        verified news feed on the left is genuinely automated: it pulls from ReliefWeb&apos;s public
        API and GDACS&apos;s public hazard feeds, but lands in a draft queue for an admin to review
        before publishing — nothing reaches this page unverified.
      </div>
    </section>
  );
}
