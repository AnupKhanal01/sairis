"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({
    sites: 0,
    accidents: 0,
    draftNews: 0,
    reviewMisinfo: 0,
    reports: 0,
  });

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "industrialSites"), (s) =>
        setCounts((c) => ({ ...c, sites: s.size }))
      ),
      onSnapshot(collection(db, "historicalAccidents"), (s) =>
        setCounts((c) => ({ ...c, accidents: s.size }))
      ),
      onSnapshot(query(collection(db, "newsItems"), where("status", "==", "draft")), (s) =>
        setCounts((c) => ({ ...c, draftNews: s.size }))
      ),
      onSnapshot(query(collection(db, "misinfoItems"), where("status", "==", "review")), (s) =>
        setCounts((c) => ({ ...c, reviewMisinfo: s.size }))
      ),
      onSnapshot(collection(db, "citizenReports"), (s) =>
        setCounts((c) => ({ ...c, reports: s.size }))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div className="grid cols-3">
      <div className="card">
        <h3>Industrial sites</h3>
        <div className="hero-metric" style={{ textAlign: "left" }}>
          <div className="n">{counts.sites}</div>
        </div>
      </div>
      <div className="card">
        <h3>Historical accidents</h3>
        <div className="hero-metric" style={{ textAlign: "left" }}>
          <div className="n">{counts.accidents}</div>
        </div>
      </div>
      <div className="card">
        <h3>News awaiting review</h3>
        <div className="hero-metric" style={{ textAlign: "left" }}>
          <div className="n">{counts.draftNews}</div>
        </div>
      </div>
      <div className="card">
        <h3>Rumors under verification</h3>
        <div className="hero-metric" style={{ textAlign: "left" }}>
          <div className="n">{counts.reviewMisinfo}</div>
        </div>
      </div>
      <div className="card">
        <h3>Citizen reports logged</h3>
        <div className="hero-metric" style={{ textAlign: "left" }}>
          <div className="n">{counts.reports}</div>
        </div>
      </div>
    </div>
  );
}
