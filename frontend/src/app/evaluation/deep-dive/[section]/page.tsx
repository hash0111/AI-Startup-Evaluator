"use client";

import { use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOptimizedDeepDive } from "@/hooks/useOptimizedDeepDive";
import { deepDiveManager } from "@/lib/deep-dive-manager";
import DeepDiveRenderer from "@/components/deep-dive/DeepDiveRenderer";
import SectionNavigator from "@/components/deep-dive/SectionNavigator";
import FloatingAICopilot from "@/components/deep-dive/FloatingAICopilot";

const SECTION_LABELS: Record<string, string> = {
  "market-intelligence": "Market Intelligence",
  "competitor-intelligence": "Competitor Analysis",
  "target-audience": "Target Audience",
  "monetization-strategy": "Monetization Strategy",
  "go-to-market-plan": "Go-To-Market Plan",
  "risk-register": "Risk Register",
};

const SECTION_SUBTITLES: Record<string, string> = {
  "market-intelligence": "Comprehensive analysis of market size, growth trajectory, competitive dynamics, and regulatory landscape",
  "competitor-intelligence": "Deep competitive analysis including direct and indirect competitors, positioning, and strategic differentiation",
  "target-audience": "Detailed persona analysis, customer segmentation, buying behavior, and acquisition channel strategy",
  "monetization-strategy": "Revenue model evaluation, pricing strategy, unit economics, and financial projections",
  "go-to-market-plan": "Strategic launch plan, channel strategy, sales process, marketing approach, and partnership framework",
  "risk-register": "Comprehensive risk assessment including financial, operational, market, technology, and regulatory risks",
};

export default function DeepDivePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const router = useRouter();

  const sessionData = typeof window !== "undefined" ? sessionStorage.getItem("deepDiveContext") : null;
  const ctx = sessionData ? JSON.parse(sessionData) : { idea: "", answers: [] };
  const mainReport = ctx.report || (() => {
    try { return JSON.parse(sessionStorage.getItem("evaluationReport") || "null"); } catch { return null; }
  })();

  useEffect(() => {
    if (ctx.idea && mainReport) {
      deepDiveManager.setContext(ctx.idea, ctx.answers || [], mainReport);
    }
  }, []);

  const { data, loading, error } = useOptimizedDeepDive(section);

  useEffect(() => {
    document.title = `${SECTION_LABELS[section] || section} — Deep Dive Report`;
  }, [section]);

  const sectionLabel = SECTION_LABELS[section] || section.replace(/-/g, " ");
  const sectionSubtitle = SECTION_SUBTITLES[section];

  if (!ctx.idea && !loading && !data) {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">No report data found</h1>
          <p className="text-sm text-white/50 mb-8">Please start from the evaluation page.</p>
          <button onClick={() => router.push("/evaluation")} className="px-5 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 text-sm transition-colors">
            ← Back to Report
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">{sectionLabel}</h1>
          <p className="text-sm text-white/40 mb-4">Preparing detailed analysis...</p>
          {/* Skeleton UI */}
          <div className="w-80 mx-auto space-y-3">
            <div className="h-4 bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded-full animate-pulse w-3/4" />
            <div className="h-4 bg-white/5 rounded-full animate-pulse w-1/2" />
          </div>
          <p className="text-xs text-white/20 mt-6">This may take 30-60 seconds for first-time generation</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Unable to load deep dive</h1>
          <p className="text-sm text-white/50 mb-8">{error}</p>
          <button onClick={() => router.push("/evaluation")} className="px-5 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 text-sm transition-colors">
            ← Back to Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-[#090B12]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <button onClick={() => router.push("/evaluation")} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
          Back to Report
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs font-medium">{sectionLabel}</span>
          <span className="text-white/20 text-[10px]">Deep Dive</span>
        </div>
        <div className="w-20" />
      </div>

      <SectionNavigator />

      <div className="pt-12">
        <DeepDiveRenderer data={data!} title={sectionLabel} subtitle={sectionSubtitle} />
      </div>

      <FloatingAICopilot report={data} activeSection={section} />
    </>
  );
}
