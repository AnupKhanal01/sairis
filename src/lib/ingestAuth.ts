import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function authorizeIngestRequest(request: NextRequest): Promise<boolean> {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) return false;

  // Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when a
  // CRON_SECRET env var is configured on the project.
  if (process.env.CRON_SECRET && bearer === process.env.CRON_SECRET) {
    return true;
  }

  const idToken = bearer;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const adminDoc = await getAdminDb().collection("admins").doc(decoded.uid).get();
    return adminDoc.exists;
  } catch {
    return false;
  }
}
