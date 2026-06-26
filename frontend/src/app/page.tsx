"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const EXAMPLE_CHIPS = [
  "AI Travel Planner",
  "Creator Marketplace",
  "Vertical SaaS",
  "Healthcare AI",
  "AI Automation Agency",
];

const CAPABILITIES = [
  {
    title: "Market Validation",
    desc: "Total addressable market sizing, growth trajectory, and segment analysis.",
  },
  {
    title: "Customer Analysis",
    desc: "Target persona identification, pain point mapping, and willingness to pay.",
  },
  {
    title: "Competitive Landscape",
    desc: "Direct and indirect competitor mapping with positioning analysis.",
  },
  {
    title: "Business Model Review",
    desc: "Revenue model evaluation, unit economics, and margin structure.",
  },
  {
    title: "Monetization Assessment",
    desc: "Pricing tier analysis, monetization strategy, and revenue projections.",
  },
  {
    title: "Risk Identification",
    desc: "Market, technical, distribution, and financial risk assessment.",
  },
  {
    title: "Go-To-Market Strategy",
    desc: "Channel strategy, customer acquisition cost, and launch sequencing.",
  },
  {
    title: "MVP Roadmap",
    desc: "Build vs. defer prioritization with phased feature delivery.",
  },
  {
    title: "Tool Recommendations",
    desc: "Technology stack evaluation with cost and scalability analysis.",
  },
  {
    title: "Founder Action Plan",
    desc: "90-day execution plan with milestones, metrics, and checkpoints.",
  },
];

const METHODOLOGY_STEPS = [
  {
    number: "01",
    title: "Describe Your Idea",
    desc: "Enter your startup concept in a single sentence. The system immediately begins contextual analysis.",
  },
  {
    number: "02",
    title: "Answer Founder Questions",
    desc: "Complete a structured questionnaire designed to surface critical business assumptions and market positioning.",
  },
  {
    number: "03",
    title: "Research & Validation",
    desc: "Multi-dimensional analysis across market data, competitive intelligence, and business model evaluation.",
  },
  {
    number: "04",
    title: "Receive Strategic Report",
    desc: "A comprehensive intelligence report with executive verdict, risk register, and actionable roadmap.",
  },
];

const SAMPLE_RADAR = [
  { category: "Market", value: 8 },
  { category: "Competition", value: 5 },
  { category: "Feasibility", value: 7 },
  { category: "Monetization", value: 6 },
  { category: "Distribution", value: 5 },
];

const SAMPLE_RISKS = [
  { risk: "Low barriers to entry", severity: "High", likelihood: "High", mitigation: "Develop proprietary data moat and network effects" },
  { risk: "Customer acquisition cost", severity: "Medium", likelihood: "Medium", mitigation: "Focus on organic channels and viral loops" },
  { risk: "Regulatory compliance", severity: "Low", likelihood: "Low", mitigation: "Engage regulatory counsel early" },
  { risk: "Technology dependency", severity: "Medium", likelihood: "Medium", mitigation: "Build abstraction layers for model flexibility" },
];

const SAMPLE_COMPETITORS = [
  { name: "Market Leader Inc", type: "direct", diff: "Established brand, larger sales team" },
  { name: "TechUp Startup", type: "direct", diff: "Faster iteration, modern tech stack" },
  { name: "EnterpriseSuite", type: "indirect", diff: "Different use case, overlaps in features" },
  { name: "LegacyCorp", type: "direct", diff: "Slower to innovate, higher pricing" },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function SmoothAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [navScrolled, setNavScrolled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!idea.trim()) return;
      setLoading(true);
      setError("");
      sessionStorage.setItem("startupIdea", idea);
      router.push("/interview");
    },
    [idea, router]
  );

  const handleChipClick = useCallback((chip: string) => {
    setIdea(chip);
    textareaRef.current?.focus();
  }, []);

  return (
    <>
      <style>{`
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
      `}</style>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-[#0A0B0F]/80 border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
        style={navScrolled ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-sm font-semibold text-[#F8FAFC] tracking-tight">Startup Evaluator</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <SmoothAnchor href="#analysis">
              <span className="text-sm text-zinc-400 hover:text-[#F8FAFC] transition-colors">Analysis</span>
            </SmoothAnchor>
            <SmoothAnchor href="#sample">
              <span className="text-sm text-zinc-400 hover:text-[#F8FAFC] transition-colors">Sample Report</span>
            </SmoothAnchor>
            <SmoothAnchor href="#methodology">
              <span className="text-sm text-zinc-400 hover:text-[#F8FAFC] transition-colors">Methodology</span>
            </SmoothAnchor>
            <SmoothAnchor href="#input">
              <span className="text-sm font-medium text-[#F8FAFC] bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg transition-all duration-200">
                Start Evaluation
              </span>
            </SmoothAnchor>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="pt-28 pb-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-[#111318] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-zinc-400 tracking-wider uppercase">
                Founder Due Diligence Platform
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#F8FAFC] leading-[1.08] tracking-tight mb-5 max-w-3xl mx-auto">
              Validate Startup Ideas Before You Build
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Analyze market opportunity, competition, risks, monetization strategy, customer
              acquisition channels, and launch roadmap in a single intelligence report.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <SmoothAnchor href="#input">
                <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500">
                  Start Evaluation
                </button>
              </SmoothAnchor>
              <SmoothAnchor href="#sample">
                <button className="inline-flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#111318] px-6 py-3 text-base font-semibold text-[#F8FAFC] transition-all duration-200 hover:bg-[#171A21]">
                  View Sample Report
                </button>
              </SmoothAnchor>
            </div>
          </div>
        </section>

        {/* ─── INPUT FORM ─── */}
        <section id="input" className="px-4 sm:px-8 pb-20">
          <div className="max-w-2xl mx-auto reveal">
            <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[#F8FAFC] tracking-tight mb-1">
                Describe Your Startup
              </h2>
              <p className="text-sm text-zinc-400 mb-5">
                Enter your startup idea in one or two sentences.
              </p>
              <form onSubmit={handleSubmit}>
                <textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="An AI-powered platform that helps e-commerce brands automate customer support."
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0A0B0F] px-5 py-4 text-base text-[#F8FAFC] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all duration-200"
                />
                {error && (
                  <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {EXAMPLE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 border border-white/[0.06] bg-[#171A21] hover:bg-[#1F232E] hover:text-[#F8FAFC] hover:border-white/[0.12] transition-all duration-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || !idea.trim()}
                  className="mt-6 w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Starting Evaluation...
                    </span>
                  ) : (
                    "Start Evaluation"
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ─── SAMPLE REPORT ─── */}
        <section id="sample" className="px-4 sm:px-8 pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 reveal">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-3">
                Explore a Sample Intelligence Report
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                See exactly what founders receive after evaluation.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#111318] overflow-hidden reveal">
              <div className="px-6 sm:px-8 py-5 border-b border-white/[0.06] bg-[#0A0B0F]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">
                      Startup Evaluation Report
                    </p>
                    <h3 className="text-lg font-bold text-white mt-1">
                      AI-Powered E-Commerce Customer Support Platform
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-bold text-green-400">GO</span>
                    </div>
                    <span className="text-xs text-zinc-500">82% confidence</span>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-8">
                {/* Radar + KPIs */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Startup Health Radar</p>
                    <div className="space-y-3">
                      {SAMPLE_RADAR.map((r) => (
                        <div key={r.category}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-zinc-400">{r.category}</span>
                            <span className="text-white font-semibold">{r.value}/10</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${(r.value / 10) * 100}%`,
                                backgroundColor: r.category === "Competition" || r.category === "Distribution" ? "#f59e0b" : "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Investment Thesis</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        E-commerce customer support automation addresses a rapidly growing market. The
                        AI-powered approach targets SMBs and mid-market retailers seeking to reduce support
                        costs while maintaining quality.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Overall Score</p>
                        <p className="text-2xl font-bold text-white mt-1">72</p>
                        <span className="text-[10px] text-zinc-500">/ 100</span>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Confidence</p>
                        <p className="text-2xl font-bold text-white mt-1">82<span className="text-sm font-normal text-zinc-400">%</span></p>
                        <span className="text-[10px] text-zinc-500">High confidence</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Market", score: 8 },
                    { label: "Competition", score: 5 },
                    { label: "Feasibility", score: 7 },
                    { label: "Monetization", score: 6 },
                    { label: "Distribution", score: 5 },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-white/[0.06] bg-[#171A21] p-3">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{k.label}</p>
                      <p className="text-xl font-bold text-white mt-0.5">{k.score}<span className="text-xs font-normal text-zinc-500">/10</span></p>
                      <div className="w-full h-1 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${k.score * 10}%`, backgroundColor: k.score >= 7 ? "#22c55e" : k.score >= 4 ? "#f59e0b" : "#ef4444" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risk Register Table */}
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Risk Register</p>
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
                        {SAMPLE_RISKS.map((r, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3 font-medium text-white">{r.risk}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                                r.severity === "High"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : r.severity === "Low"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>{r.severity}</span>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{r.likelihood}</td>
                            <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{r.mitigation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Competitor Intelligence */}
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Competitor Intelligence</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {SAMPLE_COMPETITORS.map((c, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold text-white">{c.name}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            c.type === "direct"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>{c.type}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{c.diff}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Founder Blueprint + Timeline */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Founder Blueprint</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        GO
                      </span>
                      <span className="text-xs text-zinc-500">Proceed with focus on distribution</span>
                    </div>
                    <div className="space-y-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        Target: SMB e-commerce managers
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        Model: Usage-based + premium tiers
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        Channels: Content + partnerships
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Go-To-Market Timeline</p>
                    <div className="space-y-3">
                      {[
                        { phase: "Months 1-2", title: "MVP Build", color: "bg-blue-500", desc: "Core automation engine" },
                        { phase: "Month 3", title: "Beta Launch", color: "bg-amber-500", desc: "10 design partners" },
                        { phase: "Month 4-6", title: "Scale", color: "bg-green-500", desc: "Paid acquisition + team" },
                      ].map((t, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${t.color} mt-1`} />
                            {i < 2 && <div className="w-px h-8 bg-white/[0.06]" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{t.title}</p>
                            <p className="text-[10px] text-zinc-500">{t.phase} — {t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verdict */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
                  <p className="text-[10px] text-green-400 font-medium uppercase tracking-wider mb-1">Executive Verdict</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    This is a viable idea with strong market tailwinds. The primary risk is customer
                    acquisition cost in a competitive space. Recommended approach: focus on a niche
                    segment first, build case studies, and expand horizontally after product-market fit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHAT THE ANALYSIS COVERS ─── */}
        <section id="analysis" className="px-4 sm:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 reveal">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-3">
                What The Analysis Covers
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Every evaluation examines ten dimensions to produce a comprehensive strategic assessment.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-white/[0.06] bg-[#111318] p-5 card-hover reveal"
                >
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1.5 tracking-tight">
                    {c.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── METHODOLOGY ─── */}
        <section id="methodology" className="px-4 sm:px-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 reveal">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-3">
                Methodology
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                A structured process from idea to intelligence report.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {METHODOLOGY_STEPS.map((s) => (
                <div
                  key={s.number}
                  className="rounded-xl border border-white/[0.06] bg-[#111318] p-5 card-hover reveal"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-500">
                      {s.number}
                    </div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed ml-11">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="px-4 sm:px-8 pb-32">
          <div className="max-w-2xl mx-auto text-center reveal">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-4">
              Ready to Validate Your Idea?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Receive the same type of analysis a venture capital firm would conduct before making an
              investment decision.
            </p>
            <SmoothAnchor href="#input">
              <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500">
                Start Evaluation
              </button>
            </SmoothAnchor>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-zinc-600">Startup Evaluator</span>
          <span className="text-xs text-zinc-600">Founder Due Diligence Platform</span>
        </div>
      </footer>
    </>
  );
}
