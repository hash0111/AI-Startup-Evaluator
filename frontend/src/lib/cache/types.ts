export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  version: number;
}

export type DeepDiveStatus = "idle" | "queued" | "generating" | "ready" | "error";

export interface DeepDiveSectionState {
  section: string;
  status: DeepDiveStatus;
  error?: string;
  promise: Promise<unknown> | null;
  abortController: AbortController | null;
}

export interface ReportHash {
  report: string;
  idea: string;
  answers: string;
}

export const CACHE_VERSION = 1;

export const DEEP_DIVE_SECTIONS = [
  "market-intelligence",
  "competitor-intelligence",
  "target-audience",
  "monetization-strategy",
  "go-to-market-plan",
  "risk-register",
] as const;

export type DeepDiveSection = (typeof DEEP_DIVE_SECTIONS)[number];

export const HIGH_PRIORITY_SECTIONS: DeepDiveSection[] = [
  "market-intelligence",
  "competitor-intelligence",
  "target-audience",
  "monetization-strategy",
];

export const LOW_PRIORITY_SECTIONS: DeepDiveSection[] = [
  "go-to-market-plan",
  "risk-register",
];
