import { cacheManager } from "./cache/cache-manager";
import { combineAndHash } from "./cache/hash";
import { globalQueue } from "./background-queue";
import { generateDeepDive } from "./api";
import type { DeepDiveData } from "@/components/deep-dive/types";

export type SectionStatus = "idle" | "queued" | "generating" | "ready" | "error";

interface SectionState {
  status: SectionStatus;
  error?: string;
  data?: DeepDiveData;
}

type StatusListener = (section: string, status: SectionStatus, data?: DeepDiveData) => void;

const ALL_SECTIONS = [
  "market-intelligence", "competitor-intelligence", "target-audience",
  "monetization-strategy", "go-to-market-plan", "risk-register",
];

class DeepDiveManager {
  private sections = new Map<string, SectionState>();
  private reportHash = "";
  private listeners = new Set<StatusListener>();
  private memoryCache = new Map<string, DeepDiveData>();
  private idea = "";
  private answers: string[] = [];
  private report: Record<string, unknown> = {};

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(section: string) {
    const state = this.sections.get(section);
    if (!state) return;
    for (const listener of this.listeners) {
      listener(section, state.status, state.data);
    }
  }

  async setContext(idea: string, answers: string[], report: unknown) {
    this.idea = idea;
    this.answers = answers;
    this.report = report as Record<string, unknown>;
    const hash = await combineAndHash(idea, JSON.stringify(answers), JSON.stringify(report));
    this.reportHash = hash;
    this.memoryCache.clear();
    this.sections.clear();

    for (const section of ALL_SECTIONS) {
      this.sections.set(section, { status: "idle" });
    }

    await this.prefetchFromCache();
  }

  private async prefetchFromCache() {
    for (const section of ALL_SECTIONS) {
      const cached = await this.getCached(section);
      if (cached) {
        this.memoryCache.set(this.cacheKey(section), cached);
        this.sections.set(section, { status: "ready", data: cached });
        this.notify(section);
      }
    }
  }

  private cacheKey(section: string): string {
    return `${this.reportHash}::${section}`;
  }

  private async getCached(section: string): Promise<DeepDiveData | null> {
    const memKey = this.cacheKey(section);
    const mem = this.memoryCache.get(memKey);
    if (mem) return mem;
    return cacheManager.get<DeepDiveData>("deepDive", `${this.reportHash}::${section}`);
  }

  private async setCached(section: string, data: DeepDiveData) {
    const memKey = this.cacheKey(section);
    this.memoryCache.set(memKey, data);
    await cacheManager.set("deepDive", `${this.reportHash}::${section}`, data);
  }

  async startPrefetching() {
    const priority = [
      "market-intelligence", "competitor-intelligence", "target-audience",
      "monetization-strategy", "go-to-market-plan", "risk-register",
    ];

    for (const section of priority) {
      const state = this.sections.get(section);
      if (state?.status === "ready") continue;

      this.sections.set(section, { status: "queued" });
      this.notify(section);

      globalQueue.enqueue(
        `deepdive::${this.reportHash}::${section}`,
        async (signal) => {
          const state = this.sections.get(section);
          if (state?.status === "ready") return state.data;

          this.sections.set(section, { status: "generating" });
          this.notify(section);

          const data = await generateDeepDive(this.idea, this.answers, this.report, section, signal) as DeepDiveData;
          await this.setCached(section, data);

          this.sections.set(section, { status: "ready", data });
          this.notify(section);
          return data;
        },
        0,
      ).promise.catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        this.sections.set(section, { status: "error", error: String(err) });
        this.notify(section);
      });
    }
  }

  async getOrGenerate(section: string): Promise<DeepDiveData> {
    const cached = await this.getCached(section);
    if (cached) {
      this.sections.set(section, { status: "ready", data: cached });
      this.notify(section);
      return cached;
    }

    const state = this.sections.get(section);
    if (state?.status === "generating" || state?.status === "queued") {
      return new Promise((resolve, reject) => {
        const unsub = this.subscribe((s, status, data) => {
          if (s === section && (status === "ready" || status === "error")) {
            unsub();
            if (status === "ready" && data) resolve(data);
            else reject(new Error(state?.error || "Generation failed"));
          }
        });
      });
    }

    this.sections.set(section, { status: "generating" });
    this.notify(section);

    const abort = new AbortController();
    try {
      const data = await generateDeepDive(this.idea, this.answers, this.report, section, abort.signal) as DeepDiveData;
      await this.setCached(section, data);
      this.sections.set(section, { status: "ready", data });
      this.notify(section);
      return data;
    } catch (err) {
      const errorMsg = String(err);
      this.sections.set(section, { status: "error", error: errorMsg });
      this.notify(section);
      throw err;
    }
  }

  getSectionStatus(section: string): SectionStatus {
    return this.sections.get(section)?.status ?? "idle";
  }

  cancelAll() {
    globalQueue.cancelAll();
    this.sections.clear();
    this.memoryCache.clear();
  }
}

export const deepDiveManager = new DeepDiveManager();
