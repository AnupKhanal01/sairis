import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { authorizeIngestRequest } from "@/lib/ingestAuth";

const COUNTRIES = ["Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka"];
const KEYWORDS =
  "industrial accident OR factory fire OR gas leak OR explosion OR boiler OR chemical leak OR building collapse OR brick kiln";

interface ReliefWebField {
  title?: string;
  body?: string;
  url?: string;
  date?: { created?: string };
  source?: { name?: string }[];
}

export async function GET(request: NextRequest) {
  if (!(await authorizeIngestRequest(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) {
    return NextResponse.json(
      {
        error:
          "RELIEFWEB_APPNAME is not set. Register a free appname at https://apidoc.reliefweb.int and add it to .env.local.",
      },
      { status: 400 }
    );
  }

  const res = await fetch(`https://api.reliefweb.int/v2/reports?appname=${encodeURIComponent(appname)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: { value: KEYWORDS, operator: "OR" },
      filter: { field: "country.name", value: COUNTRIES, operator: "OR" },
      sort: ["date:desc"],
      limit: 20,
      fields: { include: ["title", "body", "url", "date.created", "source.name"] },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `ReliefWeb API error: ${res.status}` }, { status: 502 });
  }

  const data: { data?: { id: string; fields: ReliefWebField }[] } = await res.json();
  const items = data.data || [];
  const db = getAdminDb();
  let created = 0;

  for (const item of items) {
    const docId = `reliefweb-${item.id}`;
    const existing = await db.collection("newsItems").doc(docId).get();
    if (existing.exists) continue;

    await db.collection("newsItems").doc(docId).set({
      title: item.fields.title || "Untitled report",
      body: (item.fields.body || "").slice(0, 1200),
      sourceName: item.fields.source?.[0]?.name || "ReliefWeb",
      sourceUrl: item.fields.url || "",
      origin: "reliefweb",
      status: "draft",
      createdAt: Date.now(),
    });
    created++;
  }

  return NextResponse.json({ fetched: items.length, created });
}
