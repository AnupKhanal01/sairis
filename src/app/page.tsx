"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [incidentCount, setIncidentCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubAccidents = onSnapshot(collection(db, "historicalAccidents"), (snap) => {
      setIncidentCount(snap.size);
    });
    return () => unsubAccidents();
  }, []);

  return (
    <section className="view">
      <div className="hero">
        <div className="hero-top">
          <div>
            <h2>Industrial Accident Watch</h2>
            <p>
              A regional situational-awareness layer for industrial hazards across South
              Asia, built around Nepal&apos;s industrial corridors (Hetauda, Birgunj–Pathlaiya,
              Biratnagar) and cross-referenced against major historical industrial disasters
              in India, Bangladesh, Pakistan and Sri Lanka. Built for use by DEOCs,
              municipalities and citizens.
            </p>
          </div>
          <div className="hero-metric">
            <div className="n">{incidentCount === null ? "—" : incidentCount}</div>
            <div className="l">Logged incidents in dataset</div>
          </div>
        </div>
        <div className="quicklinks">
          <Link href="/gis">Open hazard map →</Link>
          <Link href="/report">File a report →</Link>
          <Link href="/misinfo">Check a rumor →</Link>
          <Link href="/crisis">Safety advisories →</Link>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <span className="eyebrow">Situation summary</span>Current regional posture
          </h3>
          <p style={{ fontSize: "13px", color: "#C9C4B8", lineHeight: 1.6, margin: "0 0 10px" }}>
            Site status and alert levels below reflect the admin-managed industrial site
            register — updated the moment an operator edits a record in the admin panel, and
            synced live to every visitor via Firestore.
          </p>
          <div className="legend-row">
            <span className="dot" style={{ background: "var(--green)" }}></span> Normal
            operations
          </div>
          <div className="legend-row">
            <span className="dot" style={{ background: "var(--amber)" }}></span> Elevated
            watch
          </div>
          <div className="legend-row">
            <span className="dot" style={{ background: "var(--red)" }}></span> Active
            incident
          </div>
        </div>
        <div className="card">
          <h3>
            <span className="eyebrow">Emergency contacts</span>Nepal — national numbers
          </h3>
          <div className="contact-row">
            <span>Nepal Police</span>
            <span className="num">100</span>
          </div>
          <div className="contact-row">
            <span>Nepal Police (alt. helpline)</span>
            <span className="num">1113</span>
          </div>
          <div className="contact-row">
            <span>Fire Brigade</span>
            <span className="num">101</span>
          </div>
          <div className="contact-row">
            <span>Ambulance</span>
            <span className="num">102</span>
          </div>
          <div className="contact-row">
            <span>Traffic Police</span>
            <span className="num">103</span>
          </div>
          <div className="contact-row">
            <span>Nepal Red Cross</span>
            <span className="num">1130</span>
          </div>
          <div className="contact-row">
            <span>National Emergency Operation Center (NEOC)</span>
            <span className="num">1155</span>
          </div>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: "16px" }}>
        <div className="card">
          <h3>
            <span className="eyebrow">India</span>Key numbers
          </h3>
          <div className="contact-row">
            <span>All-purpose emergency</span>
            <span className="num">112</span>
          </div>
          <div className="contact-row">
            <span>Fire</span>
            <span className="num">101</span>
          </div>
          <div className="contact-row">
            <span>Disaster Mgmt (NDMA)</span>
            <span className="num">1078</span>
          </div>
        </div>
        <div className="card">
          <h3>
            <span className="eyebrow">Bangladesh</span>Key numbers
          </h3>
          <div className="contact-row">
            <span>National emergency</span>
            <span className="num">999</span>
          </div>
          <div className="contact-row">
            <span>Fire Service</span>
            <span className="num">102</span>
          </div>
        </div>
        <div className="card">
          <h3>
            <span className="eyebrow">Pakistan</span>Key numbers
          </h3>
          <div className="contact-row">
            <span>Rescue 1122</span>
            <span className="num">1122</span>
          </div>
          <div className="contact-row">
            <span>Police</span>
            <span className="num">15</span>
          </div>
        </div>
      </div>

      <div className="disclaimer">
        <b>About the &quot;real-time&quot; claims on this portal.</b> Industrial site records,
        historical accidents, published news, the government agency feed, citizen reports and
        the misinformation board are all backed by Firestore and update live for every visitor
        the moment an admin publishes or edits a record — no page refresh needed. News and
        government-agency posts are admin-verified before publishing (see the Social Monitoring
        module); this portal does not claim a direct live wire into Twitter/X or Facebook, since
        neither NDRRMA, Nepal Police nor NEOC expose a public API — see the Social Monitoring
        module for how that feed is actually sourced.
      </div>
    </section>
  );
}
