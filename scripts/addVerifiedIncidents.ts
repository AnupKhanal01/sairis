import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// One-off addition of real, sourced current/recent South Asia industrial accidents,
// added manually while RELIEFWEB_APPNAME approval is pending. Each entry is verified
// against at least one named news outlet (see sourceUrl) — no fabricated content.

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  console.warn("No .env.local found — relying on already-set environment variables.");
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* env vars in .env.local.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const NEWS = [
  {
    slug: "sigachi-telangana-explosion-2025",
    title: "Explosion at Sigachi Industries pharmaceutical factory kills 46 in Telangana, India",
    body:
      "A dust explosion at a microcrystalline cellulose (MCC) production unit run by Sigachi Industries Ltd in the Pashamylaram industrial area, Sangareddy district, Telangana, on 30 June 2025 killed 46 people and injured 33 others. MCC is a binding compound used in pharmaceutical manufacturing.",
    sourceName: "Wikipedia (sourced from Washington Post, NBC News)",
    sourceUrl: "https://en.wikipedia.org/wiki/Telangana_chemical_factory_explosion",
  },
  {
    slug: "dhaka-mirpur-garment-fire-2025",
    title: "Garment factory fire linked to illegal chemical warehouse kills 16 in Dhaka, Bangladesh",
    body:
      "On 14 October 2025, a fire that began in an unlicensed chemical warehouse spread to an adjoining garment factory in the Rupnagar area of Mirpur, Dhaka, killing at least 16 workers. Neither building had fire-safety approval; a locked grilled door on the factory's tin roof blocked an escape route, and the chemical flashover released toxic gas.",
    sourceName: "Wikipedia (sourced from The Business Standard, NBC News)",
    sourceUrl: "https://en.wikipedia.org/wiki/2025_Dhaka_garment_factory_fire",
  },
  {
    slug: "anakapalli-pyrolysis-explosion-2026",
    title: "Pyrolysis tank explosion kills 2 at Dakshin Energy plant, Andhra Pradesh, India",
    body:
      "On 24 June 2026, a tank recycling plastic waste into pyrolysis oil and synthetic fuel exploded at a Dakshin Energy unit in Parawada Industrial Park, Anakapalli district, killing two workers (Vepada Venkatesh, 34, and B. Trinadh, 24) and injuring several others.",
    sourceName: "The Hans India",
    sourceUrl: "https://www.thehansindia.com/amp/andhra-pradesh/2-workers-die-in-industrial-explosion-in-anakapalli-1089679",
  },
  {
    slug: "janakpur-refinery-fire-2026",
    title: "Fire causes Rs 150 million damage at Janakpur Refinery, Nepal",
    body:
      "In April 2026, a fire broke out at the Janakpur Refinery in Mithila Municipality-7, Dhalkebar, Dhanusha district, destroying steam and thermofuel machines and causing an estimated Rs 150 million (Rs 15 crore) in damage. Five fire engines from Janakpur, Mahendranagar and Dhalkebar, along with Nepal Police, Armed Police Force and Nepal Army personnel, brought it under control after two hours. No casualties were reported; the cause was undetermined at time of reporting.",
    sourceName: "Ratopati / Himal Press",
    sourceUrl: "https://english.ratopati.com/story/59325/fire-at-janakpur-refinery-damage-worth-rs-150-million",
  },
];

const ACCIDENTS = [
  {
    slug: "sigachi-telangana-explosion-2025",
    year: 2025,
    date: "2025-06-30",
    event: "Sigachi Industries pharmaceutical factory explosion",
    country: "India",
    location: "Pashamylaram, Sangareddy district, Telangana",
    cause: "Dust explosion (microcrystalline cellulose production)",
    deaths: 46,
    injured: 33,
    impact: "46 dead, 33 injured — dust explosion at an MCC pharmaceutical binder plant",
    lat: 17.658,
    lng: 78.173,
    source: "https://en.wikipedia.org/wiki/Telangana_chemical_factory_explosion",
  },
  {
    slug: "dhaka-mirpur-garment-fire-2025",
    year: 2025,
    date: "2025-10-14",
    event: "Mirpur garment factory / chemical warehouse fire",
    country: "Bangladesh",
    location: "Rupnagar, Mirpur, Dhaka",
    cause: "Fire spread from an unlicensed adjoining chemical warehouse",
    deaths: 16,
    impact: "16 dead — fire from an illegal chemical warehouse spread into a garment factory",
    lat: 23.807,
    lng: 90.369,
    source: "https://en.wikipedia.org/wiki/2025_Dhaka_garment_factory_fire",
  },
  {
    slug: "anakapalli-pyrolysis-explosion-2026",
    year: 2026,
    date: "2026-06-24",
    event: "Dakshin Energy pyrolysis tank explosion",
    country: "India",
    location: "Parawada Industrial Park, Anakapalli district, Andhra Pradesh",
    cause: "Plastic-waste pyrolysis tank explosion",
    deaths: 2,
    impact: "2 dead, several injured — pyrolysis tank explosion at a plastic-to-fuel recycling plant",
    lat: 17.63,
    lng: 83.21,
    source: "https://www.thehansindia.com/amp/andhra-pradesh/2-workers-die-in-industrial-explosion-in-anakapalli-1089679",
  },
  {
    slug: "janakpur-refinery-fire-2026",
    year: 2026,
    date: "2026-04",
    event: "Janakpur Refinery fire",
    country: "Nepal",
    location: "Mithila Municipality-7, Dhalkebar, Dhanusha district",
    cause: "Undetermined (steam/thermofuel machinery destroyed)",
    impact: "No casualties reported; ~Rs 150 million damage",
    lat: 26.85,
    lng: 85.95,
    source: "https://english.ratopati.com/story/59325/fire-at-janakpur-refinery-damage-worth-rs-150-million",
  },
];

async function main() {
  const now = Date.now();
  for (const n of NEWS) {
    const { slug, ...data } = n;
    await db
      .collection("newsItems")
      .doc(`admin-${slug}`)
      .set({ ...data, origin: "admin", status: "published", createdAt: now, publishedAt: now }, { merge: true });
  }
  console.log(`✔ newsItems: ${NEWS.length} verified items published`);

  for (const a of ACCIDENTS) {
    const { slug, ...data } = a;
    await db.collection("historicalAccidents").doc(slug).set(data, { merge: true });
  }
  console.log(`✔ historicalAccidents: ${ACCIDENTS.length} records seeded/updated`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
