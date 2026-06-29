"use client";

import { type DeepDiveData } from "./types";

function estimateReadingTime(data: DeepDiveData): number {
  const texts: string[] = [];
  if (data.executive_summary) texts.push(data.executive_summary);
  if (data.key_findings) texts.push(...data.key_findings);
  if (data.detailed_analysis) {
    for (const block of data.detailed_analysis) {
      texts.push(block.content);
      if (block.evidence) texts.push(...block.evidence);
    }
  }
  if (data.analyst_notes) texts.push(data.analyst_notes);
  const wordCount = texts.join(" ").split(/\s+/).length;
  return Math.max(2, Math.ceil(wordCount / 200));
}

export default function DeepDiveHero({ data, title, subtitle }: { data: DeepDiveData; title?: string; subtitle?: string }) {
  const sourceCount = data.sources?.length ?? 0;
  const readingTime = estimateReadingTime(data);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const insightCount = data.key_findings?.length ?? 0;
  const analysisCount = data.detailed_analysis?.length ?? 0;
  const hasMetrics = data.market_data || data.unit_economics || data.competitor_table?.length;
  const metricCount = hasMetrics
    ? (data.market_data ? 1 : 0) + (data.unit_economics ? 1 : 0) + (data.competitor_table?.length ? 1 : 0)
    : 0;

  const confidenceScore = sourceCount > 12 ? 94 : sourceCount > 6 ? 87 : sourceCount > 2 ? 78 : 65;

  return (
    <div className="mb-20">
      <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
        <span className="text-blue-400">Deep Dive</span>
        <span>·</span>
        <span>{today}</span>
        <span>·</span>
        <span>{readingTime} min read</span>
      </div>

      <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-4">
        {title || "Deep Dive Report"}
      </h1>

      <p className="text-lg text-white/50 max-w-2xl mb-10 leading-relaxed">
        {subtitle || data.executive_summary?.split(".")[0] || data.competitive_landscape?.split(".")[0] || data.market_segmentation?.split(".")[0] || "Comprehensive due diligence report"}
      </p>

      <div className="flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <span className="text-emerald-400 text-sm font-bold">{confidenceScore}%</span>
          </div>
          <div>
            <div className="text-sm font-medium text-white">Confidence Score</div>
            <div className="text-xs text-white/40">{confidenceScore >= 90 ? "High confidence" : confidenceScore >= 75 ? "Good confidence" : "Moderate confidence"}</div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/[0.06]" />

        <div>
          <div className="text-sm font-medium text-white">{sourceCount} Sources</div>
          <div className="text-xs text-white/40">Referenced in analysis</div>
        </div>

        <div className="w-px h-10 bg-white/[0.06]" />

        <div>
          <div className="text-sm font-medium text-white">{insightCount} Key Insights</div>
          <div className="text-xs text-white/40">{analysisCount} analysis sections</div>
        </div>
      </div>
    </div>
  );
}
