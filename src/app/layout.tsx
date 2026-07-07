import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import NavRail from "@/components/NavRail";

const oswald = Oswald({
  variable: "--font-disp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SAIRIS — South Asia Industrial Risk Information System",
  description:
    "Regional situational-awareness portal for industrial hazards across South Asia, centered on Nepal's industrial corridors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <div className="hazard-strip"></div>
        <TopBar />
        <div className="shell">
          <NavRail />
          <main>{children}</main>
        </div>
        <footer className="foot">
          SAIRIS · South Asia Industrial Risk Information System · Disaster Information
          Portal, Industrial Accident scenario · Sites flagged &quot;approximate&quot; in the
          admin panel use district-center coordinates pending on-site survey verification
        </footer>
      </body>
    </html>
  );
}
