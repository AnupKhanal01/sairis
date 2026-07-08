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
  votesFine?: number;
  votesProblem?: number;
  crowdFlagged?: boolean;
  crowdFlaggedAt?: number;
  crowdReviewedAt?: number;
  crowdReviewedBy?: string;
}

// A crowdFlagged site (>=50 public reports, >80% saying "problem") is a pending
// signal only — it shows on the map as needing verification, not as a confirmed
// incident, until an admin reviews it in /admin/crowd-flags.
export const VOTE_THRESHOLD_COUNT = 50;
export const VOTE_FLAG_RATIO = 0.8;

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

export type NewsOrigin = "gdacs" | "admin";
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
