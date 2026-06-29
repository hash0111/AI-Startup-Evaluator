"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie,
  CartesianGrid, Legend,
} from "recharts";
import { exportPDF, exportCSV } from "@/lib/export";
import AICopilot from "@/components/evaluation/AICopilot";
import SidebarHeader from "@/components/evaluation/sidebar/SidebarHeader";
import SidebarNavigation from "@/components/evaluation/sidebar/SidebarNavigation";
import SidebarUtilities from "@/components/evaluation/sidebar/SidebarUtilities";
import { deepDiveManager } from "@/lib/deep-dive-manager";

// ── Types ──

interface DemandDriver { driver: string; evidence: string; }
interface MarketKeyRisk { risk: string; why_it_matters: string; }
interface MarketResearch { industry: string; growth_direction: string; market_maturity: string; demand_drivers: DemandDriver[]; key_risks: MarketKeyRisk[]; confidence: number; sources: string[]; }
interface CompetitorInsight { name: string; strength: string; weakness: string; typical_customer: string; opportunity_for_founder: string; }
interface CompetitorAnalysis { competitors: CompetitorInsight[]; }
interface RiskItem { risk_name: string; probability: string; impact: string; evidence: string; mitigation_strategy: string; early_warning_signal: string; owner: string; }
interface RiskAnalysis { risks: RiskItem[]; }
interface StrategicChallenge { assumption: string; why_wrong: string; evidence: string; alternative_approach: string; }
interface StrategicChallenges { challenges: StrategicChallenge[]; }
interface ImprovementAction { current_situation: string; problem: string; recommendation: string; expected_impact: string; estimated_difficulty: string; priority: string; timeline: string; }
interface ImprovementSuggestions { suggestions: ImprovementAction[]; }
interface MVPBuildFirst { features: string[]; }
interface MVPBuildLater { features: string[]; }
interface MVPDoNotBuild { features: string[]; }
interface MVPRecommendation { build_first: MVPBuildFirst; build_later: MVPBuildLater; do_not_build: MVPDoNotBuild; }
interface EvaluationScore { market_opportunity: number; competition: number; technical_feasibility: number; monetization: number; distribution: number; overall_verdict: string; confidence_score: number; }
interface Persona { title: string; industry: string; company_size: string; budget_range: string; buying_trigger: string; buying_objection: string; urgency: string; expected_lifetime_value: string; }
interface MonetizationOption { model: string; implementation_difficulty: string; revenue_predictability: string; scalability: string; cash_flow: string; recommendation: string; }
interface Milestone { title: string; objective: string; action: string; expected_result: string; success_metric: string; }
interface AcquisitionChannel { platform: string; strategy: string; expected_outcome: string; }
interface ToolRecommendation { category: string; tool: string; pricing: string; }
interface ExecutiveRecommendation { action: string; reason: string; expected_outcome: string; priority: string; time_horizon: string; }
interface FounderBlueprint { verdict: string; verdict_explanation: string; target_audience: Persona[]; monetization_models: MonetizationOption[]; launch_plan_90_days: Milestone[]; acquisition_channels: AcquisitionChannel[]; tools_stack: ToolRecommendation[]; executive_recommendations: ExecutiveRecommendation[]; }
interface EvaluationReport { idea: string; market_research: MarketResearch; competitor_analysis: CompetitorAnalysis; risk_analysis: RiskAnalysis; strategic_challenges: StrategicChallenges; improvement_suggestions: ImprovementSuggestions; mvp_recommendation: MVPRecommendation; evaluation: EvaluationScore; founder_blueprint?: FounderBlueprint; }

// ── Animations ──

const ANIM_STYLES = `
@keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes countUp { from { opacity: 0; } to { opacity: 1; } }
.anim-section { animation: fadeInUp 0.7s ease-out both; }
.anim-section:nth-child(1) { animation-delay: 0.05s; }
.anim-section:nth-child(2) { animation-delay: 0.1s; }
.anim-section:nth-child(3) { animation-delay: 0.15s; }
.anim-section:nth-child(4) { animation-delay: 0.2s; }
.anim-section:nth-child(5) { animation-delay: 0.25s; }
.anim-section:nth-child(6) { animation-delay: 0.3s; }
.anim-section:nth-child(7) { animation-delay: 0.35s; }
.anim-section:nth-child(8) { animation-delay: 0.4s; }
.anim-section:nth-child(9) { animation-delay: 0.45s; }
.anim-section:nth-child(10) { animation-delay: 0.5s; }
.anim-section:nth-child(11) { animation-delay: 0.55s; }
.anim-section:nth-child(12) { animation-delay: 0.6s; }
.anim-section:nth-child(13) { animation-delay: 0.65s; }
.anim-section:nth-child(14) { animation-delay: 0.7s; }
.card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
.card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.12); }
`;

// ── Count-up ──

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setVal(Math.round(t * target));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

// ── Shared components ──

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict.toLowerCase();
  let variant = "border-blue-500/30 text-blue-400";
  if (lower.includes("not recommended") || lower.includes("drop")) variant = "border-red-500/30 text-red-400";
  else if (lower.includes("high risk") || lower.includes("refine")) variant = "border-amber-500/30 text-amber-400";
  else if (lower.includes("promising") || lower.includes("go")) variant = "border-green-500/30 text-green-400";
  return <span className={`inline-block border px-5 py-1.5 text-sm font-semibold tracking-wide rounded ${variant}`}>{verdict}</span>;
}

function HealthGauge({ score }: { score: number }) {
  const animated = useCountUp(score);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
      </svg>
      <div className="text-center -mt-24">
        <span className="text-4xl font-bold text-white" style={{ animation: "countUp 0.3s ease-out" }}>{animated}</span>
        <span className="text-xs text-zinc-600 block tracking-wider uppercase mt-1">Score</span>
      </div>
    </div>
  );
}

function KpiCard({ label, score }: { label: string; score: number }) {
  const animated = useCountUp(score);
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="border-b border-white/[0.06] pb-3">
      <p className="text-xs text-zinc-500 tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-3xl font-bold text-white" style={{ color }}>{animated}</span>
        <span className="text-sm text-zinc-600">/ 10</span>
      </div>
      <div className="w-full h-0.5 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(animated / 10) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Main ──

export default function EvaluationPage() {
  const router = useRouter();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressIdx, setProgressIdx] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const containerRef = useRef<HTMLDivElement>(null!);

  const SIDEBAR_SECTIONS = [
    { label: "Executive Overview", id: "executive-overview" },
    { label: "Executive Recommendations", id: "executive-recommendations" },
    { label: "Market Intelligence", id: "market-intelligence" },
    { label: "Target Audience", id: "target-audience" },
    { label: "Monetization Strategy", id: "monetization-strategy" },
    { label: "Go-To-Market Plan", id: "go-to-market-plan" },
    { label: "Customer Acquisition", id: "customer-acquisition" },
    { label: "Tool Stack", id: "tool-stack" },
    { label: "Risk Register", id: "risk-register" },
    { label: "Competitor Intelligence", id: "competitor-intelligence" },
    { label: "Improvement Strategy", id: "improvement-strategy" },
    { label: "Strategic Challenges", id: "strategic-challenges" },
    { label: "MVP Roadmap", id: "mvp-roadmap" },
    { label: "Sources", id: "sources" },
  ];

  const scrollTo = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }, []);

  const navigateToDeepDive = useCallback((section: string) => {
    const stored = sessionStorage.getItem("deepDiveContext") || "{}";
    const ctx = JSON.parse(stored);
    ctx.report = report;
    sessionStorage.setItem("deepDiveContext", JSON.stringify(ctx));
    router.push(`/evaluation/deep-dive/${section}`);
  }, [report, router]);

  const progressLabels = ["Founder Interview", "Market Research", "Competitor Discovery", "Risk Analysis", "Generating Final Verdict"];

  useEffect(() => {
    const stored = sessionStorage.getItem("evaluationReport");
    if (!stored) { router.push("/"); return; }
    try {
      const parsed = JSON.parse(stored) as EvaluationReport;
      setReport(parsed);
      // Initialize background deep dive generation
      const ctx = sessionStorage.getItem("deepDiveContext");
      if (ctx) {
        try {
          const { idea, answers } = JSON.parse(ctx);
          if (idea && answers) {
            deepDiveManager.setContext(idea, answers, parsed);
            // Start background prefetching for likely sections
            if (idea && answers) {
              setTimeout(() => deepDiveManager.startPrefetching(), 100);
            }
          }
        } catch {}
      }
      const interval = setInterval(() => {
        setProgressIdx((i) => {
          if (i >= progressLabels.length - 1) { clearInterval(interval); setLoading(false); setTimeout(() => setShowReport(true), 100); return i; }
          return i + 1;
        });
      }, 500);
      return () => clearInterval(interval);
    } catch { router.push("/"); }
  }, [router]);

  useEffect(() => {
    if (!showReport || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    containerRef.current.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showReport]);

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-zinc-300 mb-8 text-center">Evaluating Your Startup</h2>
          <div className="space-y-3">
            {progressLabels.map((p, i) => (
              <div key={p} className={`flex items-center gap-3 rounded-lg border px-5 py-3 text-sm transition-all ${
                i <= progressIdx ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-white/10 text-zinc-600"
              }`}>
                <span className="text-base">{i < progressIdx ? "✓" : i === progressIdx ? "●" : "○"}</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;
  if (!showReport) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const ev = report.evaluation;
  const bp = report.founder_blueprint;
  const totalScore = Math.round((ev.market_opportunity + ev.competition + ev.technical_feasibility + ev.monetization + ev.distribution) / 5 * 10);

  const radarData = [
    { category: "Market Opportunity", value: ev.market_opportunity, fullMark: 10 },
    { category: "Competition", value: ev.competition, fullMark: 10 },
    { category: "Feasibility", value: ev.technical_feasibility, fullMark: 10 },
    { category: "Monetization", value: ev.monetization, fullMark: 10 },
    { category: "Distribution", value: ev.distribution, fullMark: 10 },
  ];

  const revenueBarData = bp?.monetization_models.map((m) => ({
    name: m.model,
    Scalability: m.scalability === "High" ? 8 : m.scalability === "Medium" ? 5 : 2,
    Predictability: m.revenue_predictability === "High" ? 8 : m.revenue_predictability === "Medium" ? 5 : 2,
    Difficulty: m.implementation_difficulty === "Hard" ? 7 : m.implementation_difficulty === "Medium" ? 5 : 3,
  })) || [];

  const milestoneTimeline = bp?.launch_plan_90_days.map((m, i) => ({
    phase: m.title, progress: [30, 60, 95][i] || 50,
  })) || [];

  const personaDonut = bp?.target_audience.map((p, i) => ({
    name: p.title, value: [40, 35, 25][i] || 30, color: ["#22c55e", "#3b82f6", "#a855f7"][i] || "#6366f1",
  })) || [];

  const sevColor = (v: string) => {
    const l = v.toLowerCase();
    if (l.startsWith("high")) return "text-red-400";
    if (l.startsWith("low")) return "text-green-400";
    return "text-amber-400";
  };

  // ── Render ──

  return (
    <div className="h-screen bg-[#09090B] flex overflow-hidden">
      <style>{ANIM_STYLES}</style>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`rounded-xl border px-5 py-3 text-sm shadow-2xl flex items-center gap-3 bg-[#111318] ${
            toast.type === "success" ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400"
          }`}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* ─── Sidebar — 15% ─── */}
      <aside className={`${sidebarOpen ? "flex-[0_0_15%]" : "flex-[0_0_0%]"} overflow-hidden transition-all duration-300 border-r border-white/[0.06] bg-[#0B0D12] hidden lg:flex flex-col h-screen`}>
        <SidebarHeader onToggle={() => setSidebarOpen(false)} />
        <SidebarNavigation
          sections={SIDEBAR_SECTIONS}
          activeSection={activeSection}
          onScrollTo={scrollTo}
          onDeepDive={(section) => {
            const stored = sessionStorage.getItem("deepDiveContext") || "{}";
            const ctx = JSON.parse(stored);
            ctx.report = report;
            sessionStorage.setItem("deepDiveContext", JSON.stringify(ctx));
            router.push(`/evaluation/deep-dive/${section}`);
          }}
        />
        <SidebarUtilities
          onDeepDiveNavigate={(section) => {
            const stored = sessionStorage.getItem("deepDiveContext") || "{}";
            const ctx = JSON.parse(stored);
            ctx.report = report;
            sessionStorage.setItem("deepDiveContext", JSON.stringify(ctx));
            router.push(`/evaluation/deep-dive/${section}`);
          }}
        />
      </aside>

      {/* ─── Report Content — fills remaining width ─── */}
      <div ref={containerRef} className="flex-1 min-w-0 overflow-y-auto relative">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="absolute left-0 top-0 z-10 text-zinc-500 hover:text-zinc-300 transition-colors p-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        )}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16">

          {/* ─── Header + Export ─── */}
          <div className="flex items-start justify-between mb-16">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-zinc-600 tracking-[0.2em] uppercase font-medium mb-2">Due Diligence Report</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl tracking-tight">
                  {report.idea}
                </h1>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 border border-white/[0.08] bg-[#0E1015] hover:text-white hover:border-white/[0.15] transition-all"
              >
                Export <span className="ml-1.5 opacity-60">↓</span>
              </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-44 rounded-xl border border-white/[0.08] bg-[#111318] shadow-2xl overflow-hidden">
                  <button onClick={() => { setExportOpen(false); setToast({ msg: "Opening print dialog...", type: "success" }); try { exportPDF(report); setTimeout(() => setToast(null), 2500); } catch { setToast({ msg: "Unable to generate export.", type: "error" }); setTimeout(() => setToast(null), 3000); } }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors">Export as PDF</button>
                  <button onClick={() => { setExportOpen(false); setToast({ msg: "CSV Downloaded", type: "success" }); try { exportCSV(report); setTimeout(() => setToast(null), 2500); } catch { setToast({ msg: "Unable to generate export.", type: "error" }); setTimeout(() => setToast(null), 3000); } }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors border-t border-white/[0.06]">Export as CSV</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
           HERO: Executive Summary
           ══════════════════════════════════════════════ */}
        <section className="anim-section mb-32" data-section="executive-overview" id="executive-overview">
          <div className="border border-white/[0.08] rounded-2xl bg-gradient-to-b from-[#111318] to-[#0E1015] p-8 sm:p-10 lg:p-12 card-hover">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <VerdictBadge verdict={bp?.verdict || ev.overall_verdict} />
                  <span className="text-sm text-zinc-500">{ev.confidence_score}% confidence</span>
                </div>
                <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                  {bp?.verdict_explanation || "Due diligence analysis complete. Detailed breakdown below."}
                </p>
                <div className="flex flex-wrap gap-8 pt-2">
                  <div>
                    <span className="text-xs text-zinc-600 block tracking-wide">Industry</span>
                    <span className="text-base font-medium text-white mt-1 block">{report.market_research.industry}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-600 block tracking-wide">Growth</span>
                    <span className="text-base font-medium text-white mt-1 block">{report.market_research.growth_direction}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-600 block tracking-wide">Maturity</span>
                    <span className="text-base font-medium text-white mt-1 block">{report.market_research.market_maturity}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-600 block tracking-wide">Market Confidence</span>
                    <span className="text-base font-medium text-white mt-1 block">{report.market_research.confidence}%</span>
                  </div>
                </div>
              </div>
              <HealthGauge score={totalScore} />
            </div>
          </div>

          {/* KPI row — flat, no card wrappers */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 sm:gap-10 mt-10">
            <KpiCard label="Market Opportunity" score={ev.market_opportunity} />
            <KpiCard label="Competition" score={ev.competition} />
            <KpiCard label="Feasibility" score={ev.technical_feasibility} />
            <KpiCard label="Monetization" score={ev.monetization} />
            <KpiCard label="Distribution" score={ev.distribution} />
          </div>

          {/* Radar — spacious */}
          <div className="mt-10">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
           EXECUTIVE RECOMMENDATIONS (roadmap style)
           ══════════════════════════════════════════════ */}
        {bp && bp.executive_recommendations.length > 0 && (
          <section className="anim-section mb-32" data-section="executive-recommendations" id="executive-recommendations">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Executive Recommendations</h2>
            <div className="space-y-4">
              {bp.executive_recommendations.map((r, i) => {
                const priorityColor = r.priority.toLowerCase() === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : r.priority.toLowerCase() === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20";
                const horizonColor = r.time_horizon.toLowerCase().includes("day") ? "bg-zinc-800 text-zinc-400"
                  : "bg-zinc-800 text-zinc-400";
                return (
                  <div key={i} className="border-b border-white/[0.06] pb-5 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-5">
                      <span className="text-lg font-bold text-zinc-600 w-8 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <p className="text-lg font-semibold text-white">{r.action}</p>
                          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded border ${priorityColor}`}>{r.priority}</span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded ${horizonColor}`}>{r.time_horizon}</span>
                        </div>
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-3xl"><span className="text-zinc-400">Why: </span>{r.reason}</p>
                        <p className="text-sm text-green-400/80 mt-1.5">{r.expected_outcome}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           MARKET INTELLIGENCE (insight list, no cards)
           ══════════════════════════════════════════════ */}
        <section className="anim-section mb-32" data-section="market-intelligence" id="market-intelligence">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Market Intelligence</h2>
            <button onClick={() => navigateToDeepDive("market-intelligence")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
              Deep Dive →
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-xs text-zinc-600 tracking-wide uppercase mb-2">Industry</p>
              <p className="text-xl font-semibold text-white">{report.market_research.industry}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 tracking-wide uppercase mb-2">Growth Direction</p>
              <p className="text-xl font-semibold text-white">{report.market_research.growth_direction}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 tracking-wide uppercase mb-2">Market Maturity</p>
              <p className="text-xl font-semibold text-white">{report.market_research.market_maturity}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Demand Drivers — insight list */}
            <div>
              <p className="text-lg font-semibold text-white mb-6">Demand Drivers</p>
              <div className="space-y-6">
                {report.market_research.demand_drivers.map((d, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-base font-medium text-white">{d.driver}</p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed ml-5">{d.evidence}</p>
                    {i < report.market_research.demand_drivers.length - 1 && <div className="border-t border-white/[0.06] mt-5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Risks — insight list */}
            <div>
              <p className="text-lg font-semibold text-white mb-6">Key Risks</p>
              <div className="space-y-6">
                {report.market_research.key_risks.map((r, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <p className="text-base font-medium text-white">{r.risk}</p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed ml-5">{r.why_it_matters}</p>
                    {i < report.market_research.key_risks.length - 1 && <div className="border-t border-white/[0.06] mt-5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-10 max-w-md">
            <p className="text-xs text-zinc-600 tracking-wide uppercase mb-2">Analysis Confidence</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${report.market_research.confidence}%`,
                  backgroundColor: report.market_research.confidence >= 70 ? "#22c55e" : report.market_research.confidence >= 40 ? "#f59e0b" : "#ef4444"
                }} />
              </div>
              <span className="text-sm font-semibold text-zinc-300">{report.market_research.confidence}%</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
           TARGET AUDIENCE (premium profiles)
           ══════════════════════════════════════════════ */}
        {bp && (
          <section className="anim-section mb-32" data-section="target-audience" id="target-audience">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Target Audience</h2>
              <button onClick={() => navigateToDeepDive("target-audience")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
                Deep Dive →
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {bp.target_audience.map((p, i) => (
                <div key={i} className="border border-white/[0.08] rounded-2xl p-8 bg-[#0E1015] card-hover">
                  <p className="text-xl font-semibold text-white mb-6">{p.title}</p>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Industry</span>
                      <span className="text-white mt-0.5 block">{p.industry}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Company Size</span>
                      <span className="text-white mt-0.5 block">{p.company_size}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Budget Range</span>
                      <span className="text-white mt-0.5 block">{p.budget_range}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Buying Trigger</span>
                      <span className="text-white mt-0.5 block">{p.buying_trigger}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Key Objection</span>
                      <span className="text-amber-400 mt-0.5 block">{p.buying_objection}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Urgency</span>
                      <span className={`mt-0.5 block font-medium ${sevColor(p.urgency)}`}>{p.urgency}</span>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06]">
                      <span className="text-xs text-zinc-600 block tracking-wide uppercase">Expected LTV</span>
                      <span className="text-green-400 mt-0.5 block font-medium text-base">{p.expected_lifetime_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Persona distribution — clean donut */}
            {personaDonut.length > 0 && (
              <div className="mt-12 border border-white/[0.08] rounded-2xl p-8 sm:p-10 bg-[#0E1015] card-hover">
                <p className="text-lg font-semibold text-white mb-6">Audience Distribution</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={personaDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" stroke="none">
                      {personaDonut.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-4">
                  {personaDonut.map((e, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                      {e.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════
           MONETIZATION STRATEGY (comparison table)
           ══════════════════════════════════════════════ */}
        {bp && (
          <section className="anim-section mb-32" data-section="monetization-strategy" id="monetization-strategy">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Monetization Strategy</h2>
              <button onClick={() => navigateToDeepDive("monetization-strategy")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
                Deep Dive →
              </button>
            </div>
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0E1015]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Model</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden sm:table-cell">Difficulty</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden md:table-cell">Predictability</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden md:table-cell">Scalability</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Cash Flow</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {bp.monetization_models.map((m, i) => (
                    <tr key={i} className={m.recommendation === "Recommended" ? "bg-green-500/[0.03]" : ""}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{m.model}</p>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={sevColor(m.implementation_difficulty)}>{m.implementation_difficulty}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-zinc-300">{m.revenue_predictability}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-zinc-300">{m.scalability}</td>
                      <td className="px-6 py-4 text-zinc-300">{m.cash_flow}</td>
                      <td className="px-6 py-4">
                        {m.recommendation === "Recommended"
                          ? <span className="text-green-400 font-semibold text-xs tracking-wide">★ Recommended</span>
                          : <span className="text-zinc-600 text-xs">Alternative</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {revenueBarData.length > 0 && (
              <div className="mt-8 border border-white/[0.08] rounded-2xl p-8 sm:p-10 bg-[#0E1015] card-hover">
                <p className="text-lg font-semibold text-white mb-6">Revenue Model Comparison</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBarData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#171A21", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F8FAFC", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                    <Bar dataKey="Scalability" fill="#22c55e" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                    <Bar dataKey="Predictability" fill="#3b82f6" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                    <Bar dataKey="Difficulty" fill="#ef4444" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════
           GO-TO-MARKET PLAN (3-column, flat)
           ══════════════════════════════════════════════ */}
        {bp && (
          <section className="anim-section mb-32" data-section="go-to-market-plan" id="go-to-market-plan">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Go-To-Market Plan</h2>
              <button onClick={() => navigateToDeepDive("go-to-market-plan")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
                Deep Dive →
              </button>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {bp.launch_plan_90_days.map((m, i) => {
                const colors = ["border-l-blue-500", "border-l-amber-500", "border-l-green-500"];
                return (
                  <div key={i} className={`border border-white/[0.08] rounded-2xl p-8 bg-[#0E1015] border-l-4 card-hover ${colors[i]}`}>
                    <p className="text-xs text-zinc-500 tracking-wide uppercase font-medium mb-1">{m.title}</p>
                    <p className="text-lg font-semibold text-white mb-4">{m.objective}</p>
                    <p className="text-sm text-zinc-400 mb-4 leading-relaxed"><span className="text-zinc-500">Action: </span>{m.action}</p>
                    <p className="text-sm text-green-400/80 mb-3">{m.expected_result}</p>
                    <div className="pt-3 border-t border-white/[0.06]">
                      <span className="text-xs text-zinc-600 tracking-wide">Success Metric: </span>
                      <span className="text-sm text-blue-400 font-medium">{m.success_metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {milestoneTimeline.length > 0 && (
              <div className="mt-8 border border-white/[0.08] rounded-2xl p-8 sm:p-10 bg-[#0E1015] card-hover">
                <p className="text-lg font-semibold text-white mb-6">Execution Readiness</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={milestoneTimeline} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="phase" tick={{ fill: "#a1a1aa", fontSize: 12 }} width={90} />
                    <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={24}>
                      {milestoneTimeline.map((e, i) => <Cell key={i} fill={["#3b82f6", "#f59e0b", "#22c55e"][i] || "#6366f1"} fillOpacity={0.8} />)}
                    </Bar>
                    <Tooltip contentStyle={{ background: "#171A21", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#F8FAFC", fontSize: "12px" }} formatter={(v: unknown) => `${v}%`} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════
           CUSTOMER ACQUISITION
           ══════════════════════════════════════════════ */}
        {bp && bp.acquisition_channels.length > 0 && (
          <section className="anim-section mb-32" data-section="customer-acquisition" id="customer-acquisition">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Customer Acquisition</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bp.acquisition_channels.map((c, i) => (
                <div key={i} className="border border-white/[0.08] rounded-2xl p-6 bg-[#0E1015] card-hover">
                  <p className="text-lg font-semibold text-white mb-2">{c.platform}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{c.strategy}</p>
                  {c.expected_outcome && <p className="text-sm text-green-400/80 mt-3">{c.expected_outcome}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           TOOL STACK
           ══════════════════════════════════════════════ */}
        {bp && bp.tools_stack.length > 0 && (
          <section className="anim-section mb-32" data-section="tool-stack" id="tool-stack">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Tool Stack</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {bp.tools_stack.map((t, i) => (
                <div key={i} className="border border-white/[0.08] rounded-2xl p-6 bg-[#0E1015] card-hover">
                  <p className="text-xs text-zinc-500 tracking-wide uppercase mb-1">{t.category}</p>
                  <p className="text-base font-semibold text-white">{t.tool}</p>
                  <p className="text-xs text-zinc-600 mt-2">{t.pricing}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           RISK REGISTER (table + accordion)
           ══════════════════════════════════════════════ */}
        {report.risk_analysis.risks.length > 0 && (
          <section className="anim-section mb-32" data-section="risk-register" id="risk-register">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Risk Register</h2>
              <button onClick={() => navigateToDeepDive("risk-register")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
                Deep Dive →
              </button>
            </div>
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0E1015]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Risk</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Probability</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden sm:table-cell">Impact</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden md:table-cell">Owner</th>
                    <th className="w-8 px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {report.risk_analysis.risks.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedRisk(expandedRisk === i ? null : i)}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{r.risk_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={sevColor(r.probability)}>{r.probability}</span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={sevColor(r.impact)}>{r.impact}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{r.owner}</td>
                      <td className="px-6 py-4 text-zinc-600 text-sm">{expandedRisk === i ? "−" : "+"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expandable risk detail — only one at a time */}
            {expandedRisk !== null && report.risk_analysis.risks[expandedRisk] && (
              <div className="mt-4 border border-white/[0.08] rounded-2xl p-8 bg-[#0E1015] animate-fade-in card-hover">
                <p className="text-lg font-semibold text-white mb-4">{report.risk_analysis.risks[expandedRisk].risk_name}</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Evidence</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{report.risk_analysis.risks[expandedRisk].evidence}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Mitigation Strategy</p>
                    <p className="text-sm text-green-400/80 leading-relaxed">{report.risk_analysis.risks[expandedRisk].mitigation_strategy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Early Warning Signal</p>
                    <p className="text-sm text-amber-400/80">{report.risk_analysis.risks[expandedRisk].early_warning_signal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Owner</p>
                    <p className="text-sm text-zinc-300">{report.risk_analysis.risks[expandedRisk].owner}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════
           COMPETITOR INTELLIGENCE (comparison layout)
           ══════════════════════════════════════════════ */}
        {report.competitor_analysis.competitors.length > 0 && (
          <section className="anim-section mb-32" data-section="competitor-intelligence" id="competitor-intelligence">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Competitor Intelligence</h2>
              <button onClick={() => navigateToDeepDive("competitor-intelligence")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 ml-4 font-medium">
                Deep Dive →
              </button>
            </div>
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0E1015]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase">Competitor</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden sm:table-cell">Strengths</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden md:table-cell">Weaknesses</th>
                    <th className="text-left px-6 py-4 font-medium text-zinc-500 text-xs tracking-wide uppercase hidden lg:table-cell">Opportunity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {report.competitor_analysis.competitors.map((c, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{c.typical_customer}</p>
                      </td>
                      <td className="px-6 py-4 text-green-400/80 hidden sm:table-cell">{c.strength}</td>
                      <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{c.weakness}</td>
                      <td className="px-6 py-4 text-blue-400/80 hidden lg:table-cell text-sm">{c.opportunity_for_founder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           IMPROVEMENT STRATEGY (consulting roadmap)
           ══════════════════════════════════════════════ */}
        {report.improvement_suggestions.suggestions.length > 0 && (
          <section className="anim-section mb-32" data-section="improvement-strategy" id="improvement-strategy">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Improvement Strategy</h2>
            <div className="space-y-6">
              {report.improvement_suggestions.suggestions.map((s, i) => (
                <div key={i} className="border border-white/[0.08] rounded-2xl p-8 bg-[#0E1015] card-hover">
                  <div className="flex items-start gap-5">
                    <span className="text-lg font-bold text-zinc-600 w-8 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Current State</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">{s.current_situation}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-600 tracking-wide uppercase mb-1">Desired Future State</p>
                          <p className="text-sm text-zinc-300 font-medium leading-relaxed">{s.recommendation}</p>
                        </div>
                      </div>
                      <p className="text-xs text-red-400/80 mb-4">{s.problem}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-green-400/80"><span className="text-zinc-500">Impact: </span>{s.expected_impact}</span>
                        <span className={sevColor(s.estimated_difficulty)}><span className="text-zinc-500">Difficulty: </span>{s.estimated_difficulty}</span>
                        <span className="text-zinc-300"><span className="text-zinc-500">Priority: </span>{s.priority}</span>
                        <span className="text-blue-400"><span className="text-zinc-500">Timeline: </span>{s.timeline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           STRATEGIC CHALLENGES
           ══════════════════════════════════════════════ */}
        {report.strategic_challenges.challenges.length > 0 && (
          <section className="anim-section mb-32" data-section="strategic-challenges" id="strategic-challenges">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Strategic Challenges</h2>
            <div className="space-y-6">
              {report.strategic_challenges.challenges.map((c, i) => (
                <div key={i} className="border border-purple-500/10 rounded-2xl p-8 bg-purple-500/[0.02] card-hover">
                  <div className="flex items-start gap-5">
                    <span className="text-lg font-bold text-purple-500/60 w-8 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-white mb-4">{c.assumption}</p>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-red-400 tracking-wide uppercase mb-1">Why It May Be Wrong</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">{c.why_wrong}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-400 tracking-wide uppercase mb-1">Alternative Approach</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">{c.alternative_approach}</p>
                        </div>
                      </div>
                      {c.evidence && <p className="text-xs text-zinc-600 mt-4 italic">{c.evidence}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
           MVP ROADMAP
           ══════════════════════════════════════════════ */}
        <section className="anim-section mb-32" data-section="mvp-roadmap" id="mvp-roadmap">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">MVP Roadmap</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="border border-green-500/10 rounded-2xl p-8 bg-green-500/[0.02] card-hover">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Build First</h3>
              <ul className="space-y-3">
                {report.mvp_recommendation.build_first.features.map((f, i) => (
                  <li key={i} className="text-sm text-zinc-300 leading-relaxed pl-4 border-l-2 border-green-500/30">{f}</li>
                ))}
              </ul>
            </div>
            <div className="border border-amber-500/10 rounded-2xl p-8 bg-amber-500/[0.02] card-hover">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Build Later</h3>
              <ul className="space-y-3">
                {report.mvp_recommendation.build_later.features.map((f, i) => (
                  <li key={i} className="text-sm text-zinc-300 leading-relaxed pl-4 border-l-2 border-amber-500/30">{f}</li>
                ))}
              </ul>
            </div>
            <div className="border border-red-500/10 rounded-2xl p-8 bg-red-500/[0.02] card-hover">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Avoid Initially</h3>
              <ul className="space-y-3">
                {report.mvp_recommendation.do_not_build.features.map((f, i) => (
                  <li key={i} className="text-sm text-zinc-300 leading-relaxed pl-4 border-l-2 border-red-500/30">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SOURCES
           ══════════════════════════════════════════════ */}
        {report.market_research.sources.length > 0 && (
          <section className="anim-section mb-32" data-section="sources" id="sources">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-10">Sources</h2>
            <div className="border border-white/[0.08] rounded-2xl p-8 bg-[#0E1015] card-hover">
              <div className="space-y-4">
                {report.market_research.sources.map((url, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm">
                    <span className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0">{i + 1}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">{url}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="h-16" />
      </div>
      </div>

      {/* ─── Floating AI Copilot ─── */}
      <AICopilot report={report} activeSection={activeSection} />
    </div>
  );
}
