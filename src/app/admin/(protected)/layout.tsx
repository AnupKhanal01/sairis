"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sites", label: "Industrial sites" },
  { href: "/admin/crowd-flags", label: "Crowd reports" },
  { href: "/admin/accidents", label: "Historical accidents" },
  { href: "/admin/news", label: "News queue" },
  { href: "/admin/social", label: "Government agency feed" },
  { href: "/admin/misinfo", label: "Misinformation board" },
  { href: "/admin/reports", label: "Citizen reports" },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/admin/login");
        return;
      }
      const snap = await getDoc(doc(db, "admins", u.uid));
      if (!snap.exists()) {
        await signOut(auth);
        router.replace("/admin/login?err=notadmin");
        return;
      }
      setUser(u);
      setAuthorized(true);
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  if (checking || !authorized) {
    return (
      <section className="view">
        <p className="view-sub">Checking admin session…</p>
      </section>
    );
  }

  return (
    <section className="view admin-shell">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {ADMIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost" style={{ display: "inline-block" }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="status-msg" style={{ padding: 0 }}>
            {user?.email}
          </span>
          <button className="btn-ghost" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
