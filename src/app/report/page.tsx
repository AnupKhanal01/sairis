"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CitizenReport, ReportType } from "@/lib/types";

const REPORT_TYPES: ReportType[] = [
  "Incident / accident",
  "Damage report",
  "Request for assistance",
  "Missing person",
];

export default function ReportPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [type, setType] = useState<ReportType>("Incident / accident");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "citizenReports"), orderBy("ts", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CitizenReport, "id">) })));
    });
    return () => unsub();
  }, []);

  async function submit() {
    if (!location.trim() || !desc.trim()) {
      setError("Please add a location and description.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "citizenReports"), {
        type,
        location: location.trim(),
        desc: desc.trim(),
        photo: photo.trim(),
        ts: Date.now(),
      });
      setLocation("");
      setDesc("");
      setPhoto("");
    } catch {
      setError("Could not submit report — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view">
      <h2 className="view-title">Citizen Reporting Module</h2>
      <p className="view-sub">
        Submitted reports save to Firestore — everyone viewing this portal sees new reports
        appear instantly, the same way a real crowdsourced incident map would work.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3>Submit a report</h3>
          <div className="field">
            <label>Report type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hetauda Industrial Estate, Makawanpur"
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Bridge damaged by flood near the industrial estate access road."
            />
          </div>
          <div className="field">
            <label>Photo URL (optional)</label>
            <input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {error && <div className="status-msg error">{error}</div>}
          <button className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </div>
        <div className="card">
          <h3>
            Live report feed <span className="tag" style={{ marginLeft: "8px" }}>shared</span>
          </h3>
          {reports.length === 0 ? (
            <div className="empty">No reports yet. Be the first to submit one.</div>
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
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--muted)" }}>
                    photo: {r.photo}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
