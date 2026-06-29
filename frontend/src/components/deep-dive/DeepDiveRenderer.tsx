"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { DeepDiveData } from "./types";
import DeepDiveHero from "./DeepDiveHero";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";
import InsightList from "./InsightList";
import MetricGrid from "./MetricGrid";
import DynamicChart from "./DynamicChart";
import ExpandableAnalysis from "./ExpandableAnalysis";
import RiskCard from "./RiskCard";
import RecommendationCard from "./RecommendationCard";
import SourceCard from "./SourceCard";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function DeepDiveRenderer({
  data,
  title,
  subtitle,
}: {
  data: DeepDiveData;
  title?: string;
  subtitle?: string;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const risksRef = useRef<HTMLDivElement>(null);
  const recsRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);

  const hasExecutiveSummary = !!data.executive_summary;
  const hasInsights = !!(data.key_findings && data.key_findings.length > 0);
  const hasMetrics = !!(
    data.market_data ||
    data.unit_economics ||
    data.competitor_table?.length
  );
  const hasCharts = !!(
    data.market_data?.tam ||
    (data.competitor_table && data.competitor_table.length >= 3) ||
    (data.risk_table && data.risk_table.length >= 3)
  );
  const hasAnalysis = !!(data.detailed_analysis && data.detailed_analysis.length > 0);
  const hasRisks = !!(
    (data.risks && data.risks.length > 0) ||
    (data.risk_table && data.risk_table.length > 0) ||
    (data.competitive_threats && data.competitive_threats.length > 0)
  );
  const hasRecommendations = !!(
    data.recommendations && data.recommendations.length > 0
  );
  const hasSources = !!(data.sources && data.sources.length > 0);

  const renderSection = (condition: boolean, id: string, ref: React.RefObject<HTMLDivElement | null>, children: React.ReactNode) => {
    if (!condition) return null;
    return (
      <motion.section
        id={id}
        ref={ref}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </motion.section>
    );
  };

  const combinedRisks = [...(data.risks || []), ...(data.risk_table || []).map(r => ({ risk: r.risk, severity: r.probability || r.risk_score, mitigation: r.mitigation })), ...(data.competitive_threats || []).map(t => ({ risk: t.threat, severity: t.severity }))];

  return (
    <div className="min-h-screen bg-[#090B12]">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {/* Hero */}
        <div id="hero" ref={heroRef}>
          <DeepDiveHero data={data} title={title} subtitle={subtitle} />
        </div>

        {/* Executive Summary */}
        {renderSection(hasExecutiveSummary, "executive-summary", summaryRef as any, (
          <ExecutiveSummaryCard summary={data.executive_summary} takeaways={data.key_findings?.slice(0, 3)} />
        ))}

        {/* Key Insights */}
        {renderSection(hasInsights, "insights", insightsRef as any, (
          <InsightList insights={data.key_findings} />
        ))}

        {/* Metrics */}
        {renderSection(hasMetrics, "metrics", metricsRef as any, (
          <MetricGrid data={data} />
        ))}

        {/* Charts */}
        {renderSection(hasCharts, "charts", chartsRef as any, (
          <DynamicChart data={data} />
        ))}

        {/* Strategic Implications */}
        {data.strategic_implications && data.strategic_implications.length > 0 && (
          <motion.section
            id="implications"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-20"
          >
            <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Strategic Implications</div>
            <ul className="space-y-3">
              {data.strategic_implications.map((s, i) => (
                <li key={i} className="flex gap-3 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
                  <span className="text-purple-400 shrink-0 mt-0.5 text-sm">▸</span>
                  <span className="text-sm text-white/75 leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Detailed Analysis */}
        {renderSection(hasAnalysis, "analysis", analysisRef as any, (
          <ExpandableAnalysis blocks={data.detailed_analysis} />
        ))}

        {/* Risks */}
        {renderSection(hasRisks, "risks", risksRef as any, (
          <RiskCard risks={combinedRisks as any} />
        ))}

        {/* Recommendations */}
        {renderSection(hasRecommendations, "recommendations", recsRef as any, (
          <RecommendationCard recommendations={data.recommendations} />
        ))}

        {/* Analyst Notes */}
        {data.analyst_notes && (
          <motion.section
            id="analyst-notes"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-20"
          >
            <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Analyst Notes</div>
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-8">
              <p className="text-sm text-white/70 leading-relaxed italic whitespace-pre-line">{data.analyst_notes}</p>
            </div>
          </motion.section>
        )}

        {/* Sources */}
        {renderSection(hasSources, "sources", sourcesRef as any, (
          <SourceCard sources={data.sources} />
        ))}
      </div>
    </div>
  );
}
