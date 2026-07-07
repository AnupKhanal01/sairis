"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notAdmin = searchParams.get("err") === "notadmin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/admin");
    } catch {
      setError("Sign-in failed — check your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card login-card">
      <h3>Admin sign-in</h3>
      {notAdmin && (
        <div className="status-msg error">
          That account signed in but is not registered as a SAIRIS admin.
        </div>
      )}
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      {error && <div className="status-msg error">{error}</div>}
      <button className="btn-primary" onClick={submit} disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <section className="view">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
