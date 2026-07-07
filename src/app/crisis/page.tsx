export default function CrisisPage() {
  return (
    <section className="view">
      <h2 className="view-title">Crisis Communication Module</h2>
      <p className="view-sub">
        Official-style advisories and standing guidance for industrial accident scenarios, plus
        rumor corrections and FAQs.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3>Standing safety advisory — industrial zones</h3>
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#C9C4B8" }}>
            If a chemical release, fire, or explosion is reported near an industrial estate: move
            crosswind and uphill from the site, not simply &quot;away&quot; in a random direction.
            Close doors and windows if a gas release is announced rather than fleeing through a
            visible plume. Do not use vehicles or open flame near a reported gas leak. Wait for an
            official all-clear from the District Administration Office or Nepal Police before
            returning.
          </p>
        </div>
        <div className="card">
          <h3>Rumor corrections</h3>
          <div className="feed-item">
            <div className="meta">
              <span className="tag false">Corrected</span>
            </div>
            <h4>&quot;Tap water in the district is unsafe&quot; — not confirmed</h4>
            <p>
              No water contamination advisory has been issued by any tracked authority for this
              scenario. Boil-water notices, when real, are issued by name by the municipal water
              authority, not shared as unattributed forwards.
            </p>
          </div>
          <div className="feed-item">
            <div className="meta">
              <span className="tag false">Corrected</span>
            </div>
            <h4>Evacuation radius rumors</h4>
            <p>
              Evacuation perimeters are set by the incident commander based on wind direction and
              substance released — a single fixed &quot;danger radius&quot; shared on social media
              before an official announcement should be treated as unverified.
            </p>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Frequently asked questions</h3>
        <div className="faq-item">
          <h4>How do I report a hazard I can see right now?</h4>
          <p>
            Use the Citizen Reporting module (section 04) or call the numbers listed on the Home
            page for your country.
          </p>
        </div>
        <div className="faq-item">
          <h4>How is &quot;verified&quot; defined on this portal?</h4>
          <p>
            A claim is marked verified only once it is confirmed by an identifiable authority —
            police, the District Administration Office, the employer, or a named news outlet with
            on-the-record sourcing — not by volume of shares.
          </p>
        </div>
        <div className="faq-item">
          <h4>What should I do if I smell gas or chemicals near an industrial estate?</h4>
          <p>
            Move crosswind, avoid ignition sources, and call the emergency numbers on the Home
            page. Do not investigate the source yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
