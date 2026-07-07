import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { authorizeIngestRequest } from "@/lib/ingestAuth";

const COUNTRIES = ["Nepal", "India", "Bangladesh", "Pakistan", "Sri Lanka"];
const GDACS_FEED_URL = "https://www.gdacs.org/xml/rss.xml";

function mentionsSouthAsia(text: string): string | null {
  return COUNTRIES.find((c) => text.toLowerCase().includes(c.toLowerCase())) || null;
}

export async function GET(request: NextRequest) {
  if (!(await authorizeIngestRequest(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parser = new Parser();
  let feed;
  try {
    feed = await parser.parseURL(GDACS_FEED_URL);
  } catch {
    return NextResponse.json({ error: "Could not fetch GDACS feed" }, { status: 502 });
  }

  const db = getAdminDb();
  let created = 0;
  let matched = 0;

  for (const item of feed.items) {
    const haystack = `${item.title || ""} ${item.contentSnippet || item.content || ""}`;
    const country = mentionsSouthAsia(haystack);
    if (!country || !item.link) continue;
    matched++;

    const docId = `gdacs-${Buffer.from(item.link).toString("base64").slice(0, 60)}`;
    const existing = await db.collection("newsItems").doc(docId).get();
    if (existing.exists) continue;

    await db.collection("newsItems").doc(docId).set({
      title: item.title || "GDACS hazard alert",
      body: (item.contentSnippet || item.content || "").slice(0, 1200),
      sourceName: `GDACS (regional hazard alert, ${country})`,
      sourceUrl: item.link,
      origin: "gdacs",
      status: "draft",
      createdAt: Date.now(),
    });
    created++;
  }

  return NextResponse.json({ fetched: feed.items.length, matched, created });
}
