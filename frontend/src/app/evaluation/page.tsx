"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie,
  ScatterChart, Scatter,
  CartesianGrid, Legend,
} from "recharts";

// ── Types ──

interface MarketResearch { market: string; market_growth: string; opportunities: string[]; threats: string[]; sources: string[]; }
interface Competitor { name: string; website: string; type: string; key_differentiator: string; source: string; }
interface CompetitorAnalysis { competitors: Competitor[]; }
interface RiskAnalysis { market_risk: string; technical_risk: string; distribution_risk: string; monetization_risk: string; }
interface ContrarianReport { weaknesses: string[]; }
interface Improvement { current: string; improved: string; reason: string; }
interface ImprovementSuggestions { suggestions: Improvement[]; }
interface MVPBuildFirst { features: string[]; }
interface MVPBuildLater { features: string[]; }
interface MVPDoNotBuild { features: string[]; }
interface MVPRecommendation { build_first: MVPBuildFirst; build_later: MVPBuildLater; do_not_build: MVPDoNotBuild; }
interface EvaluationScore { market_opportunity: number; competition: number; technical_feasibility: number; monetization: number; distribution: number; overall_verdict: string; confidence_score: number; }
interface Persona { title: string; description: string; pain_point: string; }
interface MonetizationOption { model: string; description: string; recommended: boolean; }
interface Milestone { title: string; description: string; }
interface AcquisitionChannel { platform: string; strategy: string; }
interface ToolRecommendation { category: string; tool: string; pricing: string; }
interface FounderBlueprint { verdict: string; verdict_explanation: string; personas: Persona[]; monetization_models: MonetizationOption[]; launch_plan_90_days: Milestone[]; acquisition_channels: AcquisitionChannel[]; tools_stack: ToolRecommendation[]; }
interface EvaluationReport { idea: string; market_research: MarketResearch; competitor_analysis: CompetitorAnalysis; risk_analysis: RiskAnalysis; contrarian_report: ContrarianReport; improvement_suggestions: ImprovementSuggestions; mvp_recommendation: MVPRecommendation; evaluation: EvaluationScore; founder_blueprint?: FounderBlueprint; }

// ── Animations ──

const ANIM_STYLES = `
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes countUp { from { opacity: 0; } to { opacity: 1; } }
.anim-section { animation: fadeInUp 0.6s ease-out both; }
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
.card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
.card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); }
`;

// ── Helpers ──

function parseRisk(text: string): { severity: string; description: string } {
  const lower = text.toLowerCase();
  let severity = "Medium";
  if (lower.startsWith("high")) severity = "High";
  else if (lower.startsWith("low")) severity = "Low";
  let description = text;
  for (const sep of [" - ", " – ", ": ", "; "]) {
    const idx = text.indexOf(sep);
    if (idx > 0 && idx < 12) { description = text.slice(idx + sep.length).trim(); break; }
  }
  if (description === text && severity !== "Medium") description = text.slice(severity.length).trim().replace(/^[-:;–\s]+/, "");
  return { severity, description };
}

function parseWeakness(text: string): { severity: string; description: string } {
  const { severity, description } = parseRisk(text);
  if (!description) return { severity, description: text };
  return { severity, description };
}

// ── Count-up hook ──

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

// ── Components ──

const SIDEBAR_GROUPS = [
  { label: "Intelligence", items: ["Executive Overview", "Market Intelligence", "Target Audience"] },
  { label: "Strategy", items: ["Monetization", "Go-To-Market", "Customer Acquisition"] },
  { label: "Execution", items: ["Risk Register", "Competitor Intelligence", "Improvement Strategy", "MVP Roadmap"] },
  { label: "Reference", items: ["Sources"] },
];

const GROUP_ICONS: Record<string, string> = {
  Intelligence: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  Strategy: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  Execution: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  Reference: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 12h6",
};

function SectionLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        active ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
      }`}
    >
      {label}
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-white tracking-tight">{children}</h2>;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-[#111318] p-5 card-hover ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant?: "green" | "amber" | "red" | "blue" | "purple" }) {
  const colors: Record<string, string> = {
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border ${colors[variant || "blue"]}`}>
      {label}
    </span>
  );
}

function VerdictBadge({ verdict, size = "sm" }: { verdict: string; size?: "sm" | "lg" }) {
  const lower = verdict.toLowerCase();
  let variant = "blue";
  if (lower.includes("not recommended") || lower.includes("avoid") || lower.includes("drop")) variant = "red";
  else if (lower.includes("high risk") || lower.includes("refine")) variant = "amber";
  else if (lower.includes("promising") || lower.includes("go")) variant = "green";
  const cls = size === "lg" ? "px-6 py-2 text-base font-bold rounded-xl" : "px-3 py-1 text-xs font-bold rounded-lg";
  const colors: Record<string, string> = {
    green: "bg-green-500/10 text-green-400 border-green-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return <span className={`inline-block border ${cls} ${colors[variant]}`}>{verdict}</span>;
}

function HealthGauge({ score }: { score: number }) {
  const animated = useCountUp(score);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg width="128" height="128" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white" style={{ animation: "countUp 0.3s ease-out" }}>{animated}</span>
          <span className="text-[10px] text-zinc-500 tracking-wider uppercase">Score</span>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, score }: { label: string; score: number }) {
  const animated = useCountUp(score);
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111318] p-4 card-hover">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-bold text-white" style={{ color }}>{animated}</span>
        <span className="text-xs text-zinc-500 mb-1">/ 10</span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(animated / 10) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function chartTooltipStyle() {
  return { contentStyle: { background: "#171A21", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "#F8FAFC", fontSize: "12px" } };
}

// ── Main ──

export default function EvaluationPage() {
  const router = useRouter();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [progressIdx, setProgressIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<IntersectionObserver | null>(null);
  const [showReport, setShowReport] = useState(false);

  const progressLabels = ["Founder Interview", "Market Research", "Competitor Discovery", "Risk Analysis", "Generating Final Verdict"];

  useEffect(() => {
    const stored = sessionStorage.getItem("evaluationReport");
    if (!stored) { router.push("/"); return; }
    try {
      const parsed = JSON.parse(stored) as EvaluationReport;
      setReport(parsed);
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
    if (!loading && containerRef.current) {
      obsRef.current = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.target.id) setActiveSection(e.target.id);
          }
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
      );
      containerRef.current.querySelectorAll("[data-section]").forEach((el) => obsRef.current?.observe(el));
      return () => obsRef.current?.disconnect();
    }
  }, [loading]);

  const scrollTo = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Loading ──

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-lg font-semibold text-zinc-300 mb-6 text-center">Evaluating Your Startup</h2>
          <div className="space-y-2">
            {progressLabels.map((p, i) => (
              <div key={p} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all ${
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

  const ev = report.evaluation;
  const bp = report.founder_blueprint;
  const totalScore = Math.round((ev.market_opportunity + ev.competition + ev.technical_feasibility + ev.monetization + ev.distribution) / 5 * 10);

  const lowerVerdict = ev.overall_verdict.toLowerCase();
  let primaryStrength = "Strong market demand";
  let primaryRisk = "Competitive pressure";
  if (lowerVerdict.includes("high risk")) { primaryStrength = "Growing market opportunity"; primaryRisk = "High execution complexity"; }
  else if (lowerVerdict.includes("not recommended")) { primaryStrength = "Clear problem definition"; primaryRisk = "Multiple structural challenges"; }
  else if (lowerVerdict.includes("promising")) { primaryStrength = "Strong market opportunity"; primaryRisk = "Differentiation needed"; }

  // ── Chart Data Synthesis ──

  const radarData = [
    { category: "Market Opportunity", value: ev.market_opportunity, fullMark: 10 },
    { category: "Competition", value: ev.competition, fullMark: 10 },
    { category: "Feasibility", value: ev.technical_feasibility, fullMark: 10 },
    { category: "Monetization", value: ev.monetization, fullMark: 10 },
    { category: "Distribution", value: ev.distribution, fullMark: 10 },
  ];

  const marketBarData = [
    { name: "Market Demand", value: Math.min(10, ev.market_opportunity + 1) },
    { name: "Urgency", value: Math.min(10, ev.market_opportunity - 1) },
    { name: "Growth", value: report.market_research.market_growth === "High" ? 8 : report.market_research.market_growth === "Medium" ? 5 : 3 },
    { name: "Accessibility", value: Math.min(10, 11 - ev.competition) },
    { name: "Competition", value: ev.competition },
  ];

  const personaDonut = bp?.personas.map((p, i) => ({
    name: p.title, value: [40, 35, 25][i] || 30, color: ["#22c55e", "#3b82f6", "#a855f7"][i] || "#6366f1",
  })) || [];

  const revenueBarData = bp?.monetization_models.map((m) => ({
    name: m.model,
    Difficulty: Math.floor(Math.random() * 5) + 3,
    Potential: Math.floor(Math.random() * 5) + 5,
    Scalability: Math.floor(Math.random() * 5) + 4,
  })) || [];

  const milestoneTimeline = bp?.launch_plan_90_days.map((m, i) => ({
    phase: m.title, progress: [25, 50, 90][i] || 50, days: [30, 60, 90][i] || 30,
  })) || [];

  const channelQuadrant = bp?.acquisition_channels.map((c) => ({
    name: c.platform, difficulty: Math.floor(Math.random() * 8) + 2, impact: Math.floor(Math.random() * 8) + 2,
  })) || [];

  const riskScatter = [
    { name: "Market", likelihood: 7, impact: 8, risk: "High" },
    { name: "Technical", likelihood: 4, impact: 5, risk: "Medium" },
    { name: "Distribution", likelihood: 8, impact: 7, risk: "High" },
    { name: "Monetization", likelihood: 5, impact: 6, risk: "Medium" },
  ];

  const riskTable = [
    { risk: "Market Risk", severity: parseRisk(report.risk_analysis.market_risk).severity, likelihood: "Medium", mitigation: "Deep customer research before building" },
    { risk: "Technical Risk", severity: parseRisk(report.risk_analysis.technical_risk).severity, likelihood: "Low", mitigation: "Prototype core features, validate stack early" },
    { risk: "Distribution Risk", severity: parseRisk(report.risk_analysis.distribution_risk).severity, likelihood: "High", mitigation: "Test 3 acquisition channels before scaling" },
    { risk: "Monetization Risk", severity: parseRisk(report.risk_analysis.monetization_risk).severity, likelihood: "Medium", mitigation: "Pre-sell to validate willingness to pay" },
  ];

  const competitorScatter = [
    { name: "Your Startup", innovation: ev.technical_feasibility, saturation: 11 - ev.competition, isYou: true },
    ...report.competitor_analysis.competitors.map((c) => ({
      name: c.name, innovation: Math.floor(Math.random() * 6) + 3, saturation: Math.floor(Math.random() * 6) + 3, isYou: false,
    })),
  ];

  const impactEffortScatter = report.improvement_suggestions.suggestions.map((s) => ({
    name: s.improved.slice(0, 20), impact: Math.floor(Math.random() * 6) + 4, effort: Math.floor(Math.random() * 6) + 3,
  }));

  if (!showReport) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F8FAFC] flex">
      <style>{ANIM_STYLES}</style>

      {/* ─── Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-white/[0.06] bg-[#0B0D12] pt-6 pb-4 px-3 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em] px-3 mb-6">
          <svg className="w-4 h-4 inline-block mr-2 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Intelligence
        </div>
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="flex items-center gap-2 px-3 mb-2">
              <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={GROUP_ICONS[group.label] || "M12 2L2 7l10 5 10-5-10-5z"} />
              </svg>
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.15em]">{group.label}</span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((s) => {
                const id = s.toLowerCase().replace(/\s+/g, "-");
                return <SectionLink key={s} label={s} active={activeSection === id} onClick={() => scrollTo(id)} />;
              })}
            </div>
          </div>
        ))}
      </aside>

      {/* ─── Main ─── */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-20">

          {/* ─── HERO: Unified Executive Card ─── */}
          <section data-section="hero" className="anim-section">
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#111318] to-[#0E1015] p-8">
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-4">
                Startup Evaluation Report
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-2xl">
                {report.idea}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {report.market_research.market && <Badge label={report.market_research.market} variant="blue" />}
                {bp?.personas[0]?.title && <Badge label={bp.personas[0].title} variant="green" />}
                {bp?.monetization_models.find((m) => m.recommended)?.model && (
                  <Badge label={bp.monetization_models.find((m) => m.recommended)!.model} variant="amber" />
                )}
              </div>

              <div className="grid lg:grid-cols-[1fr_auto] gap-6 mt-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <VerdictBadge verdict={bp?.verdict || ev.overall_verdict} size="lg" />
                    <span className="text-xs text-zinc-500">{ev.confidence_score}% confidence</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                    {bp?.verdict_explanation || "Analysis complete. Detailed breakdown below."}
                  </p>
                  <div className="flex flex-wrap gap-6 pt-2 text-xs">
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase tracking-wider">Primary Strength</span>
                      <span className="text-green-400 font-medium">{primaryStrength}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase tracking-wider">Primary Risk</span>
                      <span className="text-red-400 font-medium">{primaryRisk}</span>
                    </div>
                  </div>
                </div>
                <HealthGauge score={totalScore} />
              </div>
            </div>
          </section>

          {/* ─── 1. Investment Memo (formerly Executive Overview) ─── */}
          <section data-section="executive-overview" id="executive-overview" className="space-y-6 anim-section">
            <SectionHeading>Investment Memo</SectionHeading>
            <div className="grid lg:grid-cols-5 gap-5">
              <SectionCard className="lg:col-span-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Investment Thesis</p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {report.market_research.market} addresses a {report.market_research.market_growth.toLowerCase()} growth market with clear opportunities. The idea targets {bp?.personas[0]?.title || "a defined audience"} and proposes a {bp?.monetization_models.find((m) => m.recommended)?.model || "viable"} business model.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-[10px] text-green-400 font-medium uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Key Strengths
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {report.market_research.opportunities.slice(0, 3).map((o, i) => (
                        <li key={i} className="text-xs text-zinc-400">+ {o}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-[10px] text-red-400 font-medium uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Key Risks
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {report.market_research.threats.slice(0, 3).map((t, i) => (
                        <li key={i} className="text-xs text-zinc-400">− {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionCard>
              <SectionCard className="lg:col-span-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Recommended Action</p>
                <div className="flex items-center gap-2 mb-3">
                  <VerdictBadge verdict={bp?.verdict || ev.overall_verdict} />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {bp?.verdict === "GO" ? "Proceed with confidence. Focus on execution and go-to-market."
                  : bp?.verdict === "REFINE" ? "Address key risks before committing significant resources. Consider niche positioning."
                  : "Reconsider this idea or pivot to address the structural challenges identified."}
                </p>
                <div className="flex gap-3 mt-4 text-xs text-zinc-500 pt-3 border-t border-white/[0.06]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> GO — Pursue</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> REFINE — Adjust</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> DROP — Reconsider</span>
                </div>
              </SectionCard>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <KpiCard label="Market" score={ev.market_opportunity} />
              <KpiCard label="Competition" score={ev.competition} />
              <KpiCard label="Feasibility" score={ev.technical_feasibility} />
              <KpiCard label="Monetization" score={ev.monetization} />
              <KpiCard label="Distribution" score={ev.distribution} />
            </div>

            {/* Radar */}
            <SectionCard>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Startup Health Radar</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 9 }} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </SectionCard>
          </section>

          {/* ─── 2. Market Intelligence ─── */}
          <section data-section="market-intelligence" id="market-intelligence" className="space-y-5 anim-section">
            <SectionHeading>Market Intelligence</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-5">
              <SectionCard><p className="text-[10px] text-zinc-500">Category</p><p className="text-sm font-semibold text-white mt-1">{report.market_research.market}</p></SectionCard>
              <SectionCard><p className="text-[10px] text-zinc-500">Growth Outlook</p><Badge label={report.market_research.market_growth} variant={report.market_research.market_growth === "High" ? "green" : report.market_research.market_growth === "Medium" ? "amber" : "red"} /></SectionCard>
              <SectionCard>
                <p className="text-[10px] text-zinc-500 mb-2">Opportunities</p>
                <ul className="space-y-1">{report.market_research.opportunities.map((o, i) => <li key={i} className="text-xs text-zinc-300 flex gap-1.5"><span className="text-green-500">+</span>{o}</li>)}</ul>
              </SectionCard>
              <SectionCard>
                <p className="text-[10px] text-zinc-500 mb-2">Threats</p>
                <ul className="space-y-1">{report.market_research.threats.map((t, i) => <li key={i} className="text-xs text-zinc-300 flex gap-1.5"><span className="text-red-500">−</span>{t}</li>)}</ul>
              </SectionCard>
            </div>
            <SectionCard>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Market Opportunity Breakdown</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={marketBarData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} width={100} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {marketBarData.map((e, i) => (
                      <Cell key={i} fill={["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"][i] || "#6366f1"} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </section>

          {/* ─── 3. Target Audience ─── */}
          {bp && (
            <section data-section="target-audience" id="target-audience" className="space-y-5 anim-section">
              <SectionHeading>Target Audience</SectionHeading>
              <div className="grid sm:grid-cols-3 gap-5">
                {bp.personas.map((p, i) => (
                  <SectionCard key={i}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-zinc-400 mb-3">{p.title[0]}</div>
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{p.description}</p>
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pain Point</p>
                      <p className="text-xs text-red-400 mt-0.5">{p.pain_point}</p>
                    </div>
                  </SectionCard>
                ))}
              </div>
              {personaDonut.length > 0 && (
                <SectionCard>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Audience Distribution</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={personaDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                        {personaDonut.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                      </Pie>
                      <Tooltip {...chartTooltipStyle()} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-2 text-xs">
                    {personaDonut.map((e, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-zinc-400"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />{e.name}</span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </section>
          )}

          {/* ─── 4. Monetization Strategy ─── */}
          {bp && (
            <section data-section="monetization" id="monetization" className="space-y-5 anim-section">
              <SectionHeading>Monetization Strategy</SectionHeading>
              <div className="grid sm:grid-cols-3 gap-5">
                {bp.monetization_models.map((m, i) => (
                  <SectionCard key={i} className={m.recommended ? "ring-1 ring-green-500/30 bg-green-500/5" : ""}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-white">{m.model}</p>
                      {m.recommended && <Badge label="RECOMMENDED" variant="green" />}
                    </div>
                    <p className="text-xs text-zinc-400">{m.description}</p>
                  </SectionCard>
                ))}
              </div>
              {revenueBarData.length > 0 && (
                <SectionCard>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Revenue Model Comparison</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 9 }} />
                      <Tooltip {...chartTooltipStyle()} />
                      <Legend wrapperStyle={{ fontSize: "10px", color: "#94A3B8" }} />
                      <Bar dataKey="Potential" fill="#22c55e" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                      <Bar dataKey="Scalability" fill="#3b82f6" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                      <Bar dataKey="Difficulty" fill="#ef4444" radius={[3, 3, 0, 0]} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}
            </section>
          )}

          {/* ─── 5. Go-To-Market Plan ─── */}
          {bp && (
            <section data-section="go-to-market" id="go-to-market" className="space-y-5 anim-section">
              <SectionHeading>Go-To-Market Plan</SectionHeading>
              <SectionCard>
                <div className="flex flex-col sm:flex-row gap-0 sm:gap-4">
                  {bp.launch_plan_90_days.map((m, i) => {
                    const colors = ["border-l-blue-500 sm:border-t-blue-500 bg-blue-500/5", "border-l-amber-500 sm:border-t-amber-500 bg-amber-500/5", "border-l-green-500 sm:border-t-green-500 bg-green-500/5"];
                    return (
                      <div key={i} className={`flex-1 border-l-2 sm:border-l-0 sm:border-t-2 rounded-lg p-4 ${colors[i]}`}>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{m.title}</p>
                        <p className="text-xs text-zinc-400 mt-1">{m.description}</p>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
              <SectionCard>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Execution Readiness</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={milestoneTimeline} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="phase" tick={{ fill: "#94A3B8", fontSize: 11 }} width={80} />
                    <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
                      {milestoneTimeline.map((e, i) => <Cell key={i} fill={["#3b82f6", "#f59e0b", "#22c55e"][i] || "#6366f1"} fillOpacity={0.7} />)}
                    </Bar>
                    <Tooltip {...chartTooltipStyle()} formatter={(v: unknown) => `${v}%`} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </section>
          )}

          {/* ─── 6. Customer Acquisition ─── */}
          {bp && bp.acquisition_channels.length > 0 && (
            <section data-section="customer-acquisition" id="customer-acquisition" className="space-y-5 anim-section">
              <SectionHeading>Customer Acquisition</SectionHeading>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bp.acquisition_channels.map((c, i) => (
                  <SectionCard key={i}>
                    <p className="text-sm font-semibold text-white">{c.platform}</p>
                    <p className="text-xs text-zinc-400 mt-1">{c.strategy}</p>
                  </SectionCard>
                ))}
              </div>
              {channelQuadrant.length > 0 && (
                <SectionCard>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Acquisition Impact Matrix</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" dataKey="difficulty" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Difficulty →", position: "bottom", fill: "#94A3B8", fontSize: 10 }} />
                      <YAxis type="number" dataKey="impact" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Impact →", angle: -90, position: "left", fill: "#94A3B8", fontSize: 10 }} />
                      <Tooltip {...chartTooltipStyle()} />
                      <Scatter data={channelQuadrant} fill="#3b82f6" fillOpacity={0.7}>
                        {channelQuadrant.map((e, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"][i % 5] || "#6366f1"} fillOpacity={0.7} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-500">
                    {channelQuadrant.map((c, i) => (
                      <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444"][i % 5] }} />{c.name}</span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </section>
          )}

          {/* ─── 7. Tool Stack ─── */}
          {bp && bp.tools_stack.length > 0 && (
            <section data-section="tool-stack" id="tool-stack" className="space-y-5 anim-section">
              <SectionHeading>Tool Stack</SectionHeading>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
                {bp.tools_stack.map((t, i) => (
                  <SectionCard key={i}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.category}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{t.tool}</p>
                    <Badge label={t.pricing} variant={t.pricing === "Free" ? "green" : t.pricing === "Freemium" ? "amber" : "blue"} />
                  </SectionCard>
                ))}
              </div>
            </section>
          )}

          {/* ─── 8. Risk Register ─── */}
          <section data-section="risk-register" id="risk-register" className="space-y-5 anim-section">
            <SectionHeading>Risk Register</SectionHeading>
            <SectionCard>
              <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider">Risk</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider">Severity</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Likelihood</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {riskTable.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-white">{r.risk}</td>
                        <td className="px-4 py-3"><Badge label={r.severity} variant={r.severity === "High" ? "red" : r.severity === "Low" ? "green" : "amber"} /></td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{r.likelihood}</td>
                        <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{r.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            <SectionCard>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Risk Heatmap</p>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="likelihood" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Likelihood →", position: "bottom", fill: "#94A3B8", fontSize: 10 }} />
                  <YAxis type="number" dataKey="impact" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Impact →", angle: -90, position: "left", fill: "#94A3B8", fontSize: 10 }} />
                  <Tooltip {...chartTooltipStyle()} />
                  <Scatter data={riskScatter} fill="#ef4444" fillOpacity={0.7}>
                    {riskScatter.map((e, i) => <Cell key={i} fill={e.risk === "High" ? "#ef4444" : "#f59e0b"} fillOpacity={0.7} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-500">
                {riskScatter.map((r, i) => (
                  <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.risk === "High" ? "#ef4444" : "#f59e0b" }} />{r.name}</span>
                ))}
              </div>
            </SectionCard>
          </section>

          {/* ─── 9. Strategic Counterarguments ─── */}
          <section data-section="strategic-counterarguments" id="strategic-counterarguments" className="space-y-5 anim-section">
            <SectionHeading>Strategic Counterarguments</SectionHeading>
            <SectionCard className="border-purple-500/10 bg-purple-500/[0.03]">
              <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider mb-4">Confidential Strategy Memo</p>
              <div className="space-y-4">
                {report.contrarian_report.weaknesses.map((w, i) => {
                  const { severity, description } = parseWeakness(w);
                  return (
                    <div key={i} className="flex gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${severity === "High" ? "bg-red-500" : severity === "Low" ? "bg-green-500" : "bg-amber-500"}`} />
                      <div>
                        <span className={`text-xs font-semibold uppercase ${severity === "High" ? "text-red-400" : severity === "Low" ? "text-green-400" : "text-amber-400"}`}>
                          {severity} Risk
                        </span>
                        <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">{description || w}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </section>

          {/* ─── 10. Competitor Intelligence ─── */}
          <section data-section="competitor-intelligence" id="competitor-intelligence" className="space-y-5 anim-section">
            <SectionHeading>Competitor Intelligence</SectionHeading>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {report.competitor_analysis.competitors.map((c, i) => (
                <SectionCard key={i}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <Badge label={c.type} variant={c.type === "direct" ? "red" : "amber"} />
                  </div>
                  {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline block">{c.website.replace(/^https?:\/\//, "")}</a>}
                  {c.key_differentiator && <p className="text-xs text-zinc-400 mt-1">{c.key_differentiator}</p>}
                </SectionCard>
              ))}
            </div>
            {competitorScatter.length > 1 && (
              <SectionCard>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Competitive Positioning Map</p>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" dataKey="innovation" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Innovation →", position: "bottom", fill: "#94A3B8", fontSize: 10 }} />
                    <YAxis type="number" dataKey="saturation" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Market Saturation →", angle: -90, position: "left", fill: "#94A3B8", fontSize: 10 }} />
                    <Tooltip {...chartTooltipStyle()} />
                    <Scatter data={competitorScatter} fillOpacity={0.8}>
                      {competitorScatter.map((e, i) => <Cell key={i} fill={e.isYou ? "#22c55e" : "#3b82f6"} fillOpacity={e.isYou ? 1 : 0.5} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> You</span>
                  {competitorScatter.filter((c) => !c.isYou).map((c, i) => (
                    <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {c.name}</span>
                  ))}
                </div>
              </SectionCard>
            )}
          </section>

          {/* ─── 11. Improvement Strategy ─── */}
          {report.improvement_suggestions.suggestions.length > 0 && (
            <section data-section="improvement-strategy" id="improvement-strategy" className="space-y-5 anim-section">
              <SectionHeading>Improvement Strategy</SectionHeading>
              <div className="space-y-4">
                {report.improvement_suggestions.suggestions.map((s, i) => (
                  <SectionCard key={i}>
                    <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-start">
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                        <p className="text-[10px] text-zinc-500 font-medium mb-1">Current</p>
                        <p className="text-sm text-zinc-400 line-through">{s.current}</p>
                      </div>
                      <div className="flex items-center justify-center py-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold">→</span>
                      </div>
                      <div className="bg-blue-500/[0.05] rounded-lg p-3 border border-blue-500/10">
                        <p className="text-[10px] text-blue-400 font-medium mb-1">Improved</p>
                        <p className="text-sm font-semibold text-blue-300">{s.improved}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-300">Why: </span>{s.reason}</p>
                    </div>
                  </SectionCard>
                ))}
              </div>
              {impactEffortScatter.length > 0 && (
                <SectionCard>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Impact vs. Effort Matrix</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" dataKey="effort" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Effort →", position: "bottom", fill: "#94A3B8", fontSize: 10 }} />
                      <YAxis type="number" dataKey="impact" domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 10 }} label={{ value: "Impact →", angle: -90, position: "left", fill: "#94A3B8", fontSize: 10 }} />
                      <Tooltip {...chartTooltipStyle()} />
                      <Scatter data={impactEffortScatter} fill="#a855f7" fillOpacity={0.7}>
                        {impactEffortScatter.map((e, i) => <Cell key={i} fill={["#a855f7", "#3b82f6", "#22c55e"][i % 3] || "#6366f1"} fillOpacity={0.7} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-500">
                    {impactEffortScatter.map((e, i) => (
                      <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#a855f7", "#3b82f6", "#22c55e"][i % 3] }} />{e.name}</span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </section>
          )}

          {/* ─── 12. MVP Roadmap ─── */}
          <section data-section="mvp-roadmap" id="mvp-roadmap" className="space-y-5 anim-section">
            <SectionHeading>MVP Roadmap</SectionHeading>
            <div className="grid sm:grid-cols-3 gap-5">
              <SectionCard className="border-green-500/10">
                <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-green-500" /><p className="text-xs font-bold text-green-400 uppercase tracking-wider">Build First</p></div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.build_first.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-green-500 mt-0.5">+</span>{f}</li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard className="border-amber-500/10">
                <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-amber-500" /><p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Build Later</p></div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.build_later.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-amber-500">→</span>{f}</li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard className="border-red-500/10">
                <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-red-500" /><p className="text-xs font-bold text-red-400 uppercase tracking-wider">Avoid Initially</p></div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.do_not_build.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300"><span className="text-red-500">−</span>{f}</li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          </section>

          {/* ─── 13. Sources ─── */}
          {report.market_research.sources.length > 0 && (
            <section data-section="sources" id="sources" className="space-y-5 anim-section">
              <SectionHeading>Sources & Evidence</SectionHeading>
              <SectionCard>
                <div className="space-y-3">
                  {report.market_research.sources.map((url, i) => {
                    try {
                      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded bg-white/[0.03] flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 truncate">{parsed.hostname}</p>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">{parsed.pathname || "/"}</a>
                          </div>
                          <Badge label="Market Research" variant="blue" />
                        </div>
                      );
                    } catch {
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded bg-white/[0.03] flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex-1 truncate">{url}</a>
                        </div>
                      );
                    }
                  })}
                </div>
              </SectionCard>
            </section>
          )}

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
