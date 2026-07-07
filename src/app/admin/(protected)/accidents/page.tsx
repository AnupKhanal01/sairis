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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Country, HistoricalAccident } from "@/lib/types";

const COUNTRIES: Country[] = ["Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka"];

const BLANK = {
  year: "",
  date: "",
  event: "",
  country: "Nepal" as Country,
  location: "",
  cause: "",
  deaths: "",
  injured: "",
  impact: "",
  lat: "",
  lng: "",
  source: "",
};

export default function AdminAccidentsPage() {
  const [accidents, setAccidents] = useState<HistoricalAccident[]>([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "historicalAccidents"), orderBy("year")), (snap) => {
      setAccidents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoricalAccident, "id">) }))
      );
    });
    return () => unsub();
  }, []);

  function startEdit(a: HistoricalAccident) {
    setEditingId(a.id);
    setForm({
      year: String(a.year),
      date: a.date || "",
      event: a.event,
      country: a.country,
      location: a.location,
      cause: a.cause || "",
      deaths: a.deaths !== undefined ? String(a.deaths) : "",
      injured: a.injured !== undefined ? String(a.injured) : "",
      impact: a.impact,
      lat: a.lat !== undefined ? String(a.lat) : "",
      lng: a.lng !== undefined ? String(a.lng) : "",
      source: a.source || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(BLANK);
    setError("");
  }

  async function submit() {
    const year = parseInt(form.year, 10);
    if (!form.event.trim() || Number.isNaN(year)) {
      setError("Event and year are required.");
      return;
    }
    setError("");
    setSaving(true);
    const payload: Record<string, unknown> = {
      year,
      date: form.date.trim(),
      event: form.event.trim(),
      country: form.country,
      location: form.location.trim(),
      cause: form.cause.trim(),
      impact: form.impact.trim(),
      source: form.source.trim(),
    };
    if (form.deaths.trim() !== "") payload.deaths = parseInt(form.deaths, 10);
    if (form.injured.trim() !== "") payload.injured = parseInt(form.injured, 10);
    if (form.lat.trim() !== "") payload.lat = parseFloat(form.lat);
    if (form.lng.trim() !== "") payload.lng = parseFloat(form.lng);

    try {
      if (editingId) {
        await updateDoc(doc(db, "historicalAccidents", editingId), payload);
      } else {
        await addDoc(collection(db, "historicalAccidents"), payload);
      }
      resetForm();
    } catch {
      setError("Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this historical accident record?")) return;
    await deleteDoc(doc(db, "historicalAccidents", id));
    if (editingId === id) resetForm();
  }

  return (
    <div>
      <h2 className="view-title">Historical Accidents</h2>
      <div className="grid cols-2">
        <div className="card">
          <h3>{editingId ? "Edit accident" : "Add accident"}</h3>
          <div className="grid cols-2">
            <div className="field">
              <label>Year</label>
              <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
            </div>
            <div className="field">
              <label>Exact date (optional)</label>
              <input
                placeholder="YYYY-MM-DD"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Event</label>
            <input value={form.event} onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))} />
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value as Country }))}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Cause (optional)</label>
            <input value={form.cause} onChange={(e) => setForm((f) => ({ ...f, cause: e.target.value }))} />
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>Deaths (optional)</label>
              <input value={form.deaths} onChange={(e) => setForm((f) => ({ ...f, deaths: e.target.value }))} />
            </div>
            <div className="field">
              <label>Injured (optional)</label>
              <input
                value={form.injured}
                onChange={(e) => setForm((f) => ({ ...f, injured: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Impact summary</label>
            <textarea rows={2} value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} />
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>Latitude (optional — for map marker)</label>
              <input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </div>
            <div className="field">
              <label>Longitude (optional)</label>
              <input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label>Source (optional)</label>
            <input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
          </div>
          {error && <div className="status-msg error">{error}</div>}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add accident"}
            </button>
            {editingId && (
              <button className="btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
        <div className="card">
          <h3>All records ({accidents.length})</h3>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Event</th>
                  <th>Country</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accidents.map((a) => (
                  <tr key={a.id}>
                    <td>{a.year}</td>
                    <td>{a.event}</td>
                    <td>{a.country}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => startEdit(a)} style={{ marginRight: "6px" }}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => remove(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
