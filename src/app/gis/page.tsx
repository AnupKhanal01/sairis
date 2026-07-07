"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function GisPage() {
  return (
    <section className="view">
      <h2 className="view-title">GIS &amp; Mapping Module</h2>
      <p className="view-sub">
        Industrial zones, historical accident sites, and the nearest hospitals &amp; police
        stations that would respond. Coordinates are approximate — refine with district-level
        survey data before operational use.
      </p>
      <MapView />
    </section>
  );
}
