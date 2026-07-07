export type Country = "Nepal" | "India" | "Bangladesh" | "Pakistan" | "Sri Lanka";

export type SiteStatus = "normal" | "watch" | "incident";

export interface IndustrialSite {
  id: string;
  name: string;
  country: Country;
  district?: string;
  province?: string;
  lat: number;
  lng: number;
  industryType: string;
  riskNotes: string;
  hospital: string;
  police: string;
  status: SiteStatus;
  approximate?: boolean;
  updatedAt?: number;
}

export interface HistoricalAccident {
  id: string;
  year: number;
  date?: string;
  event: string;
  country: Country;
  location: string;
  cause?: string;
  deaths?: number;
  injured?: number;
  impact: string;
  lat?: number;
  lng?: number;
  source?: string;
}

export type NewsOrigin = "reliefweb" | "gdacs" | "admin";
export type NewsStatus = "draft" | "published" | "rejected";

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  origin: NewsOrigin;
  status: NewsStatus;
  createdAt: number;
  publishedAt?: number;
}

export interface GovFeedPost {
  id: string;
  agency: string;
  agencyHandle?: string;
  body: string;
  postUrl: string;
  postedAt: number;
  addedBy?: string;
  createdAt: number;
}

export type MisinfoStatus = "verified" | "review" | "false";

export interface MisinfoItem {
  id: string;
  text: string;
  src: string;
  status: MisinfoStatus;
  createdAt: number;
  updatedAt?: number;
}

export type ReportType =
  | "Incident / accident"
  | "Damage report"
  | "Request for assistance"
  | "Missing person";

export interface CitizenReport {
  id: string;
  type: ReportType;
  location: string;
  desc: string;
  photo?: string;
  ts: number;
}

export interface AdminRecord {
  email: string;
}
