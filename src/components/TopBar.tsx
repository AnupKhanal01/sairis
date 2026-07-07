"use client";

import Clock from "./Clock";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">DEOC</div>
        <div>
          <h1>SAIRIS</h1>
          <p>South Asia Industrial Risk Information System — Industrial Accident Scenario</p>
        </div>
      </div>
      <div className="status-cluster">
        <div className="pulse">
          <span className="pulse-dot"></span> SYSTEM ACTIVE
        </div>
        <Clock />
        <select id="countryFocus" defaultValue="Nepal" style={{ width: "auto", padding: "6px 8px", fontSize: "11.5px" }}>
          <option value="ALL">All South Asia</option>
          <option value="Nepal">Nepal (primary)</option>
          <option value="India">India</option>
          <option value="Bangladesh">Bangladesh</option>
          <option value="Pakistan">Pakistan</option>
          <option value="Sri Lanka">Sri Lanka</option>
        </select>
      </div>
    </header>
  );
}
