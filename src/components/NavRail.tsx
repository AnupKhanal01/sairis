"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", num: "01", label: "Home" },
  { href: "/gis", num: "02", label: "GIS & Mapping" },
  { href: "/social", num: "03", label: "Social Monitoring" },
  { href: "/report", num: "04", label: "Citizen Reporting" },
  { href: "/misinfo", num: "05", label: "Misinformation" },
  { href: "/crisis", num: "06", label: "Crisis Comms" },
  { href: "/analytics", num: "07", label: "Analytics" },
];

export default function NavRail() {
  const pathname = usePathname();

  return (
    <nav className="rail">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          <span className="num">{link.num}</span>
          <span className="label">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
