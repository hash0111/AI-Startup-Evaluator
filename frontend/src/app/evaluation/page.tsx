"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface MarketResearch {
  market: string;
  market_growth: string;
  opportunities: string[];
  threats: string[];
  sources: string[];
}

interface Competitor {
  name: string;
  website: string;
  type: string;
  key_differentiator: string;
  source: string;
}

interface CompetitorAnalysis {
  competitors: Competitor[];
}

interface RiskAnalysis {
  market_risk: string;
  technical_risk: string;
  distribution_risk: string;
  monetization_risk: string;
}

interface ContrarianReport {
  weaknesses: string[];
}

interface Improvement {
  current: string;
  improved: string;
  reason: string;
}

interface ImprovementSuggestions {
  suggestions: Improvement[];
}

interface MVPBuildFirst {
  features: string[];
}
interface MVPBuildLater {
  features: string[];
}
interface MVPDoNotBuild {
  features: string[];
}
interface MVPRecommendation {
  build_first: MVPBuildFirst;
  build_later: MVPBuildLater;
  do_not_build: MVPDoNotBuild;
}

interface EvaluationScore {
  market_opportunity: number;
  competition: number;
  technical_feasibility: number;
  monetization: number;
  distribution: number;
  overall_verdict: string;
  confidence_score: number;
}

interface EvaluationReport {
  idea: string;
  market_research: MarketResearch;
  competitor_analysis: CompetitorAnalysis;
  risk_analysis: RiskAnalysis;
  contrarian_report: ContrarianReport;
  improvement_suggestions: ImprovementSuggestions;
  mvp_recommendation: MVPRecommendation;
  evaluation: EvaluationScore;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "risks", label: "Risks" },
  { id: "competitors", label: "Competitors" },
  { id: "improvements", label: "Improvements" },
  { id: "mvp", label: "MVP" },
];

function parseRisk(text: string): { severity: string; description: string } {
  const lower = text.toLowerCase();
  let severity = "Medium";
  if (lower.startsWith("high")) severity = "High";
  else if (lower.startsWith("low")) severity = "Low";

  let description = text;
  for (const sep of [" - ", " – ", ": ", "; "]) {
    const idx = text.indexOf(sep);
    if (idx > 0 && idx < 12) {
      description = text.slice(idx + sep.length).trim();
      break;
    }
  }
  if (description === text && severity !== "Medium") {
    description = text.slice(severity.length).trim().replace(/^[-:;–\s]+/, "");
  }
  return { severity, description };
}

function parseWeakness(text: string): { severity: string; description: string } {
  const { severity, description } = parseRisk(text);
  if (!description) return { severity, description: text };
  return { severity, description };
}

function riskColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes("high")) return "text-red-700 bg-red-50 border-red-200";
  if (s.includes("low")) return "text-green-700 bg-green-50 border-green-200";
  return "text-yellow-700 bg-yellow-50 border-yellow-200";
}

function riskDot(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes("high")) return "bg-red-500";
  if (s.includes("low")) return "bg-green-500";
  return "bg-yellow-500";
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const color =
    score >= 7 ? "text-green-700" : score >= 4 ? "text-yellow-700" : "text-red-700";
  const bg =
    score >= 7 ? "bg-green-50" : score >= 4 ? "bg-yellow-50" : "bg-red-50";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col items-center gap-1.5">
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs font-medium text-gray-500 text-center leading-tight">
        {label}
      </span>
      <div className="w-full max-w-[80px] h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict.toLowerCase();
  let cls = "bg-blue-50 text-blue-700 border-blue-200";
  if (lower.includes("not recommended") || lower.includes("avoid")) {
    cls = "bg-red-50 text-red-700 border-red-200";
  } else if (lower.includes("high risk")) {
    cls = "bg-orange-50 text-orange-700 border-orange-200";
  } else if (lower.includes("promising") && (lower.includes("but") || lower.includes("needs"))) {
    cls = "bg-yellow-50 text-yellow-700 border-yellow-200";
  } else if (lower.includes("promising")) {
    cls = "bg-green-50 text-green-700 border-green-200";
  }
  return (
    <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold border ${cls}`}>
      {verdict}
    </span>
  );
}

function ConfidenceGauge({ value }: { value: number }) {
  const color =
    value >= 70 ? "stroke-green-500" : value >= 40 ? "stroke-yellow-500" : "stroke-red-500";
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.5"
          fill="none" strokeWidth="3" strokeLinecap="round"
          className={color}
          strokeDasharray={`${value * 0.97} 97`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
        {value}%
      </span>
    </div>
  );
}

function SectionNav({ active }: { active: string }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-1 overflow-x-auto py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              active === item.id
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function EvaluationPage() {
  const router = useRouter();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [progress] = useState([
    "Founder Interview",
    "Market Research",
    "Competitor Discovery",
    "Risk Analysis",
    "Generating Final Verdict",
  ]);
  const [progressIdx, setProgressIdx] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("evaluationReport");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as EvaluationReport;
      setReport(parsed);
      const interval = setInterval(() => {
        setProgressIdx((i) => {
          if (i >= progress.length - 1) {
            clearInterval(interval);
            setLoading(false);
            return i;
          }
          return i + 1;
        });
      }, 500);
      return () => clearInterval(interval);
    } catch {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!loading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
            }
          }
        },
        { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
      );
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) observerRef.current.observe(el);
      }
      return () => observerRef.current?.disconnect();
    }
  }, [loading]);

  if (loading && !report) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 min-h-[70vh]">
        <div className="w-full max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Evaluating Your Startup
          </h2>
          <div className="space-y-2">
            {progress.map((p, i) => (
              <div
                key={p}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-all ${
                  i <= progressIdx
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                <span className="text-base">
                  {i < progressIdx ? "✓" : i === progressIdx ? "●" : "○"}
                </span>
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
  const lowerVerdict = ev.overall_verdict.toLowerCase();
  let verdictSummary = "";
  if (lowerVerdict.includes("not recommended") || lowerVerdict.includes("avoid")) {
    verdictSummary = "This idea faces significant challenges that make it difficult to recommend pursuing at this time. Major structural or market issues need to be addressed.";
  } else if (lowerVerdict.includes("high risk")) {
    verdictSummary = "The idea has potential but carries substantial risk. Proceed with caution and validate key assumptions before committing significant resources.";
  } else if (lowerVerdict.includes("promising")) {
    if (lowerVerdict.includes("but") || lowerVerdict.includes("needs")) {
      verdictSummary = "The idea addresses a real customer problem and is technically feasible, but faces strong competition and needs clearer differentiation.";
    } else {
      verdictSummary = "Strong potential with solid market opportunity, feasible technical approach, and reasonable competitive positioning.";
    }
  } else {
    verdictSummary = "Assessing overall viability based on market conditions, competition, and execution capability.";
  }

  const riskItems = [
    { label: "Market Risk", value: report.risk_analysis.market_risk },
    { label: "Technical Risk", value: report.risk_analysis.technical_risk },
    { label: "Distribution Risk", value: report.risk_analysis.distribution_risk },
    { label: "Monetization Risk", value: report.risk_analysis.monetization_risk },
  ];

  const totalScore = Math.round(
    (ev.market_opportunity + ev.competition + ev.technical_feasibility + ev.monetization + ev.distribution) / 5 * 10
  );

  return (
    <>
      <SectionNav active={activeSection} />
      <div className="flex flex-1 justify-center px-4 sm:px-6 py-8 sm:py-12">
        <main className="w-full max-w-5xl space-y-10">

          {/* ───────── Executive Verdict ───────── */}
          <section id="overview">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Executive Verdict
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {report.idea}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceGauge value={ev.confidence_score ?? 75} />
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-medium">Confidence</p>
                    <p className="text-sm font-semibold text-gray-900">{ev.confidence_score ?? 75}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-5">
                <VerdictBadge verdict={ev.overall_verdict} />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  Overall Score: <span className="font-semibold text-gray-900">{totalScore}%</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                {verdictSummary}
              </p>

              {report.market_research.market && (
                <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Category</span>
                    <p className="font-medium text-gray-900">{report.market_research.market}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Growth</span>
                    <p className="font-medium text-gray-900">{report.market_research.market_growth}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ───────── Evaluation Scores ───────── */}
          <section id="overview">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              <ScoreCard label="Market Opportunity" score={ev.market_opportunity} />
              <ScoreCard label="Competition" score={ev.competition} />
              <ScoreCard label="Technical Feasibility" score={ev.technical_feasibility} />
              <ScoreCard label="Monetization" score={ev.monetization} />
              <ScoreCard label="Distribution" score={ev.distribution} />
            </div>
          </section>

          {/* ───────── Risk Analysis + Contrarian ───────── */}
          <section id="risks" className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="inline-block w-1.5 h-5 bg-gray-900 rounded-full" />
              Risk Assessment
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {riskItems.map((item) => {
                const { severity, description } = parseRisk(item.value);
                return (
                  <div
                    key={item.label}
                    className={`rounded-xl border p-4 ${riskColor(severity)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${riskDot(severity)}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="ml-auto text-xs font-bold opacity-70">{severity}</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">
                      {description || "No details provided."}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ───── Contrarian: Why This Startup Could Fail ───── */}
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-red-800 mb-1">
                Why This Startup Could Fail
              </h3>
              <p className="text-xs text-red-600/70 mb-5 max-w-xl">
                Honest assessment of the most critical threats to this idea.
              </p>
              <div className="space-y-3">
                {report.contrarian_report.weaknesses.map((w, i) => {
                  const { severity, description } = parseWeakness(w);
                  const dot = riskDot(severity);
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                      <div>
                        <span className={`text-xs font-semibold uppercase ${
                          severity === "High" ? "text-red-600" : severity === "Low" ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {severity} Risk
                        </span>
                        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                          {description || w}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ───────── Competitor Intelligence ───────── */}
          <section id="competitors" className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="inline-block w-1.5 h-5 bg-gray-900 rounded-full" />
              Competitor Intelligence
            </h2>
            {report.competitor_analysis.competitors.length === 0 ? (
              <p className="text-sm text-gray-500">No competitors identified.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Company</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider hidden sm:table-cell">Website</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider hidden md:table-cell">Differentiator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.competitor_analysis.competitors.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {c.website ? (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {c.website.replace(/^https?:\/\//, "")}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={
                            c.type === "direct"
                              ? "inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                              : "inline-block rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700"
                          }>
                            {c.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell max-w-[200px] truncate" title={c.key_differentiator}>
                          {c.key_differentiator || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.market_research.sources.length > 0 && (
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700 font-medium text-xs">
                  Research Sources ({report.market_research.sources.length})
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.market_research.sources.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate max-w-[250px]"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* ───────── Improvement Opportunities ───────── */}
          {report.improvement_suggestions.suggestions.length > 0 && (
            <section id="improvements" className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 bg-gray-900 rounded-full" />
                Improvement Opportunities
              </h2>
              <div className="space-y-3">
                {report.improvement_suggestions.suggestions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-start">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs font-medium text-gray-400 mb-1">Current</p>
                        <p className="text-sm text-gray-600 line-through">{s.current}</p>
                      </div>
                      <div className="flex items-center justify-center py-2 sm:py-0">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
                          →
                        </span>
                      </div>
                      <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-medium text-blue-500 mb-1">Improved</p>
                        <p className="text-sm font-semibold text-blue-800">{s.improved}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-medium text-gray-700">Why: </span>{s.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ───────── MVP Roadmap ───────── */}
          <section id="mvp" className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="inline-block w-1.5 h-5 bg-gray-900 rounded-full" />
              MVP Roadmap
            </h2>
            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <h3 className="text-sm font-bold text-green-800">Build First</h3>
                </div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.build_first.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5 flex-shrink-0">+</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <h3 className="text-sm font-bold text-yellow-800">Build Later</h3>
                </div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.build_later.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-yellow-600 mt-0.5 flex-shrink-0">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <h3 className="text-sm font-bold text-red-800">Avoid Initially</h3>
                </div>
                <ul className="space-y-1.5">
                  {report.mvp_recommendation.do_not_build.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-600 mt-0.5 flex-shrink-0">−</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <div className="h-8" />
        </main>
      </div>
    </>
  );
}
