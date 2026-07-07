import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function authorizeIngestRequest(request: NextRequest): Promise<boolean> {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return false;

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const adminDoc = await getAdminDb().collection("admins").doc(decoded.uid).get();
    return adminDoc.exists;
  } catch {
    return false;
  }
}
