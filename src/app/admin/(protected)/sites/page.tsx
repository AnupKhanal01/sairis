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
import type { Country, IndustrialSite, SiteStatus } from "@/lib/types";

const COUNTRIES: Country[] = ["Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka"];
const STATUSES: SiteStatus[] = ["normal", "watch", "incident"];

const BLANK = {
  name: "",
  country: "Nepal" as Country,
  district: "",
  province: "",
  lat: "",
  lng: "",
  industryType: "",
  riskNotes: "",
  hospital: "",
  police: "",
  status: "normal" as SiteStatus,
  approximate: false,
};

export default function AdminSitesPage() {
  const [sites, setSites] = useState<IndustrialSite[]>([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "industrialSites"), orderBy("name")), (snap) => {
      setSites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IndustrialSite, "id">) })));
    });
    return () => unsub();
  }, []);

  function startEdit(site: IndustrialSite) {
    setEditingId(site.id);
    setForm({
      name: site.name,
      country: site.country,
      district: site.district || "",
      province: site.province || "",
      lat: String(site.lat),
      lng: String(site.lng),
      industryType: site.industryType,
      riskNotes: site.riskNotes,
      hospital: site.hospital,
      police: site.police,
      status: site.status,
      approximate: !!site.approximate,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(BLANK);
    setError("");
  }

  async function submit() {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!form.name.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Name, latitude and longitude are required.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      country: form.country,
      district: form.district.trim(),
      province: form.province.trim(),
      lat,
      lng,
      industryType: form.industryType.trim(),
      riskNotes: form.riskNotes.trim(),
      hospital: form.hospital.trim(),
      police: form.police.trim(),
      status: form.status,
      approximate: form.approximate,
      updatedAt: Date.now(),
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "industrialSites", editingId), payload);
      } else {
        await addDoc(collection(db, "industrialSites"), payload);
      }
      resetForm();
    } catch {
      setError("Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this industrial site?")) return;
    await deleteDoc(doc(db, "industrialSites", id));
    if (editingId === id) resetForm();
  }

  return (
    <div>
      <h2 className="view-title">Industrial Sites</h2>
      <div className="grid cols-2">
        <div className="card">
          <h3>{editingId ? "Edit site" : "Add site"}</h3>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
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
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SiteStatus }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>District</label>
              <input
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Province</label>
              <input
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>Latitude</label>
              <input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label>Industry type</label>
            <input
              value={form.industryType}
              onChange={(e) => setForm((f) => ({ ...f, industryType: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Risk notes</label>
            <textarea
              rows={3}
              value={form.riskNotes}
              onChange={(e) => setForm((f) => ({ ...f, riskNotes: e.target.value }))}
            />
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label>Nearest hospital</label>
              <input
                value={form.hospital}
                onChange={(e) => setForm((f) => ({ ...f, hospital: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Nearest police</label>
              <input
                value={form.police}
                onChange={(e) => setForm((f) => ({ ...f, police: e.target.value }))}
              />
            </div>
          </div>
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={form.approximate}
              onChange={(e) => setForm((f) => ({ ...f, approximate: e.target.checked }))}
            />
            Coordinates are approximate (district-center estimate)
          </label>
          {error && <div className="status-msg error">{error}</div>}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add site"}
            </button>
            {editingId && (
              <button className="btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
        <div className="card">
          <h3>All sites ({sites.length})</h3>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.country}</td>
                    <td>{s.status}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => startEdit(s)} style={{ marginRight: "6px" }}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => remove(s.id)}>
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
