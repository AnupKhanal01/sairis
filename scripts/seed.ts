import path from "node:path";
import readline from "node:readline/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { ALL_SITES, HISTORICAL_ACCIDENTS } from "./seedData";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  console.warn("No .env.local found next to this script — relying on already-set environment variables.");
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
const auth = getAuth(app);

async function seedSites() {
  let written = 0;
  for (const site of ALL_SITES) {
    const { slug, ...data } = site;
    await db.collection("industrialSites").doc(slug).set({ ...data, updatedAt: Date.now() }, { merge: true });
    written++;
  }
  console.log(`✔ industrialSites: ${written} records seeded/updated`);
}

async function seedAccidents() {
  let written = 0;
  for (const accident of HISTORICAL_ACCIDENTS) {
    const { slug, ...data } = accident;
    await db.collection("historicalAccidents").doc(slug).set(data, { merge: true });
    written++;
  }
  console.log(`✔ historicalAccidents: ${written} records seeded/updated`);
}

async function registerAdmin() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = (
    await rl.question("Admin email to register (must already exist in Firebase Auth, or leave blank to skip): ")
  ).trim();
  rl.close();

  if (!email) {
    console.log("Skipped admin registration.");
    return;
  }

  try {
    const user = await auth.getUserByEmail(email);
    await db.collection("admins").doc(user.uid).set({ email });
    console.log(`✔ Registered ${email} (uid ${user.uid}) as a SAIRIS admin.`);
  } catch (err) {
    console.error(
      `Could not find a Firebase Auth user for ${email}. Create the user first in the Firebase console (Authentication tab), then re-run this script.`,
      err
    );
  }
}

async function main() {
  await seedSites();
  await seedAccidents();
  await registerAdmin();
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
