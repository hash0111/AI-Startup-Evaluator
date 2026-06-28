"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import MicrophoneButton from "@/components/speech/MicrophoneButton";
import { BrowserSpeechRecognitionProvider } from "@/lib/speech";
import type { SpeechState } from "@/lib/speech/types";

// ── Data ──

const STARTUP_CHIPS = [
  { label: "AI SaaS", example: "An AI-powered platform that helps e-commerce brands automate customer support and reduce response times." },
  { label: "Marketing Agency", example: "An AI-driven marketing agency that generates personalized ad creatives at scale for DTC brands." },
  { label: "Automation Agency", example: "An automation agency that helps real estate agents automate lead follow-up and appointment scheduling." },
  { label: "Healthcare AI", example: "A telemedicine platform connecting patients with specialists for asynchronous video consultations." },
  { label: "Developer Tool", example: "A CLI tool that automatically generates API documentation from TypeScript type definitions." },
  { label: "Fintech", example: "A mobile-first neobank for freelancers with automated tax withholding and invoice management." },
  { label: "Marketplace", example: "A peer-to-peer marketplace connecting local food artisans with nearby consumers for same-day delivery." },
  { label: "EdTech", example: "An interactive learning platform using AI to create personalized curricula for K-12 students." },
];

const SAMPLE_RADAR = [
  { category: "Market", value: 8, color: "#3b82f6" },
  { category: "Competition", value: 5, color: "#f59e0b" },
  { category: "Feasibility", value: 7, color: "#3b82f6" },
  { category: "Monetization", value: 6, color: "#3b82f6" },
  { category: "Distribution", value: 5, color: "#f59e0b" },
];

const SAMPLE_RISKS = [
  { risk: "Low barriers to entry", severity: "High", mitigation: "Develop proprietary data moat and network effects" },
  { risk: "Customer acquisition cost", severity: "Medium", mitigation: "Focus on organic channels and viral loops" },
  { risk: "Regulatory compliance", severity: "Low", mitigation: "Engage regulatory counsel early" },
  { risk: "Technology dependency", severity: "Medium", mitigation: "Build abstraction layers for model flexibility" },
];

const getChipDelay = (i: number) => 0.45 + i * 0.035;

// ── Component ──

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportHovered, setReportHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [reportHeight, setReportHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  // ── Speech-to-text ──
  const speechProviderRef = useRef<BrowserSpeechRecognitionProvider | null>(null);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechErrorMsg, setSpeechErrorMsg] = useState('');
  const speechPrefixRef = useRef('');

  useEffect(() => {
    const provider = new BrowserSpeechRecognitionProvider();
    speechProviderRef.current = provider;
    setSpeechSupported(provider.isSupported());
    provider.setEventHandlers({
      onResult: (finalText, interimText) => {
        try {
          const prefix = speechPrefixRef.current;
          const combined = prefix + finalText + interimText;
          console.log('[PAGE] onResult final:', JSON.stringify(finalText), 'interim:', JSON.stringify(interimText), 'prefix:', JSON.stringify(prefix), 'combined:', JSON.stringify(combined));
          setIdea(combined);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
              textareaRef.current.selectionStart = combined.length;
              textareaRef.current.selectionEnd = combined.length;
            }
          });
        } catch (err) {
          console.error('[PAGE] onResult error:', err);
        }
      },
      onStateChange: (s) => {
        setSpeechState(s);
        if (s === 'idle') setSpeechErrorMsg('');
      },
      onError: (err) => {
        setSpeechState('error');
        setSpeechErrorMsg(err.message);
      },
    });
    return () => provider.destroy();
  }, []);

  useEffect(() => {
    if (speechState === 'completed') {
      const t = setTimeout(() => setSpeechState('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [speechState]);

  useEffect(() => {
    if (speechErrorMsg) {
      const t = setTimeout(() => setSpeechErrorMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [speechErrorMsg]);

  const handleSpeechStart = useCallback(() => {
    console.log('[PAGE] handleSpeechStart called, current idea:', JSON.stringify(idea));
    speechPrefixRef.current = idea;
    if (speechProviderRef.current) {
      console.log('[PAGE] provider exists, calling start()');
      speechProviderRef.current.start();
    } else {
      console.error('[PAGE] provider is null!');
    }
  }, [idea]);

  const handleSpeechStop = useCallback(() => speechProviderRef.current?.stop(), []);

  const handleSpeechCancel = useCallback(() => {
    speechProviderRef.current?.cancel();
    setSpeechState('idle');
  }, []);

  // ── Measure report and viewport heights ──
  useEffect(() => {
    const measure = () => {
      setViewportHeight(window.innerHeight);
      if (reportContentRef.current) {
        setReportHeight(reportContentRef.current.scrollHeight);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (reportContentRef.current) ro.observe(reportContentRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ── Scroll tracking ──
  const containerHeight = reportHeight > 0 ? `${reportHeight + viewportHeight}px` : "250vh";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Report slides upward as a continuous sheet.
  // At progress 0: report is below viewport (translateY = viewportHeight)
  // At progress 1: report's bottom aligns with viewport bottom (translateY = viewportHeight - reportHeight)
  const depsRef = useRef({ reportHeight, viewportHeight });
  depsRef.current = { reportHeight, viewportHeight };

  const reportTranslateY = useTransform(scrollYProgress, (progress) => {
    const { reportHeight: rh, viewportHeight: vh } = depsRef.current;
    if (rh === 0 || vh === 0) return `${vh || 1080}px`;
    return `${vh - progress * rh}px`;
  });

  // Subtle perspective tilt only at the very beginning (first 10%)
  const reportRotateX = useTransform(scrollYProgress, [0, 0.1], [2.5, 0]);

  // ── Cinematic zoom-in transforms ──
  // Card grows from a small preview into a full-size report
  const reportScale = useTransform(scrollYProgress, (p) => +(0.82 + p * 0.18).toFixed(3));

  const reportWidth = useTransform(scrollYProgress, (p) => `${80 + p * 20}%`);

  const reportBorderRadius = useTransform(scrollYProgress, (p) => `${28 - p * 22}px`);

  const reportShadow = useTransform(scrollYProgress, (p) => {
    const y1 = 32 - p * 24;
    const b1 = 64 - p * 40;
    const o1 = +(0.45 - p * 0.33).toFixed(3);
    const o2 = +(0.08 - p * 0.05).toFixed(3);
    return `0 ${y1}px ${b1}px rgba(0,0,0,${o1}), 0 0 0 1px rgba(255,255,255,${o2})`;
  });

  // ── Handlers ──

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!idea.trim() || loading) return;
      setLoading(true);
      setError("");
      sessionStorage.setItem("startupIdea", idea);
      router.push("/interview");
    },
    [idea, loading, router]
  );

  const handleChipClick = useCallback((example: string) => {
    setIdea(example);
    setError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, []);

  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  return (
    <main className="bg-[#06070A] text-[#F8FAFC]">
      {/* ── Ambient glow (fixed) ── */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none z-0">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,rgba(139,92,246,0.04)_35%,transparent_70%)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)]" style={{ filter: "blur(60px)" }} />
      </div>

      {/* ── Scroll container ── */}
      <div ref={containerRef} className="relative z-10" style={{ height: containerHeight }}>
        <div className="sticky top-0 h-screen overflow-hidden bg-[#06070A]">
          {/* ═══════ HERO LAYER — static, never fades ═══════ */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center text-center w-full max-w-[820px]">
              {/* Heading */}
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                Validate your startup<br />before you build it.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-500 mt-4 max-w-[580px] leading-relaxed tracking-tight">
                Describe your startup in one sentence. We&apos;ll interview you intelligently and generate an investor-grade due diligence report.
              </p>

              {/* Chat Input */}
              <div className="w-full mt-10">
                <form onSubmit={handleSubmit}>
                  <div className="relative w-full rounded-[22px] border border-white/[0.08] bg-[rgba(15,15,22,0.72)] backdrop-blur-xl shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300 focus-within:border-blue-500/25 focus-within:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,130,246,0.12)_inset,0_0_40px_rgba(59,130,246,0.06)]">
                    <textarea
                      ref={textareaRef}
                      value={idea}
                      onChange={(e) => { setIdea(e.target.value); setError(""); }}
                      onInput={handleTextareaInput}
                      placeholder="Describe your startup idea..."
                      rows={1}
                      className="w-full bg-transparent text-base sm:text-lg text-[#F8FAFC] placeholder-zinc-600 resize-none focus:outline-none leading-relaxed px-6 pt-6 pb-3"
                      style={{ minHeight: "56px", maxHeight: "180px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (idea.trim() && !loading) handleSubmit(e);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between px-6 pb-5 pt-2">
                      <MicrophoneButton
                        state={speechState}
                        isSupported={speechSupported}
                        onStart={handleSpeechStart}
                        onStop={handleSpeechStop}
                        onCancel={handleSpeechCancel}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-700 select-none">
                          {idea.trim() ? "Ready" : ""}
                        </span>
                        <button
                          type="submit"
                          disabled={!idea.trim() || loading}
                          className="w-[46px] h-[46px] rounded-full bg-blue-600 flex items-center justify-center text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_24px_rgba(59,130,246,0.3)] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                          {loading ? (
                            <svg className="animate-spin w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5 max-w-md"
                >
                  {error}
                </motion.p>
              )}

              {speechErrorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-sm text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-2.5 max-w-md"
                >
                  {speechErrorMsg}
                </motion.p>
              )}

              {/* Quick Suggestions */}
              <div className="mt-6">
                <div className="flex flex-wrap justify-center gap-2 max-w-[600px]">
                  {STARTUP_CHIPS.map((chip, i) => (
                    <motion.button
                      key={chip.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: getChipDelay(i), ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
                      whileHover={{
                        y: -2,
                        scale: 1.02,
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "#F8FAFC",
                        boxShadow: "0 0 24px rgba(59,130,246,0.08)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleChipClick(chip.example)}
                      className="px-4 py-2 rounded-full text-[12px] font-medium border border-white/[0.06] bg-[rgba(15,15,22,0.5)] text-zinc-500 transition-colors duration-200"
                    >
                      {chip.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-700 mt-4 text-center max-w-md leading-relaxed">
                Try clicking a suggestion above or type your own idea.
              </p>
            </div>
          </div>

          {/* ═══════ REPORT LAYER — grows from preview card → full-size report ═══════ */}
          <motion.div
            className="absolute left-0 right-0 z-20"
            style={{ top: 0, y: reportTranslateY }}
          >
            {/* Width container — interpolates from 80% → 100% */}
            <motion.div className="mx-auto" style={{ width: reportWidth }}>
              {/* Card — scale, border-radius, shadow all animate */}
              <motion.div
                className="overflow-hidden bg-[#06070A]"
                style={{
                  scale: reportScale,
                  borderRadius: reportBorderRadius,
                  boxShadow: reportShadow,
                  transformOrigin: "center center",
                }}
              >
                <div
                  ref={reportContentRef}
                  className="bg-[#06070A] max-w-5xl mx-auto px-4 sm:px-8 pt-16 pb-32"
                >
                  <motion.div
                    style={{
                      rotateX: reportRotateX,
                      transformPerspective: 1200,
                      transformStyle: "preserve-3d",
                    }}
                  >
                {/* Report heading */}
                <h2 className="text-center text-xl sm:text-2xl font-semibold text-zinc-400 max-w-xl mx-auto tracking-tight leading-snug mb-8">
                  Your report will look like this — an investment-grade due diligence document.
                </h2>

              {/* ── Report Shell ── */}
              <div
                className="relative rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden transition-all duration-[400ms] ease-out cursor-default"
                style={{
                  transform: reportHovered
                    ? "perspective(1200px) rotateX(0deg) scale(1.005) translateY(-2px)"
                    : "perspective(1200px) rotateX(1.5deg)",
                  transformOrigin: "center center",
                  boxShadow: reportHovered
                    ? "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)"
                    : "0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
                }}
                onMouseEnter={() => setReportHovered(true)}
                onMouseLeave={() => setReportHovered(false)}
              >
                {/* Report Header */}
                <div className="px-6 sm:px-10 py-5 border-b border-white/[0.06] bg-gradient-to-r from-[#0B0F14] to-[#111827]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">Due Diligence Report</p>
                      <h3 className="text-lg font-bold text-white mt-0.5 tracking-tight">
                        AI-Powered Customer Support Platform
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-bold text-green-400">GO</span>
                      </div>
                      <span className="text-xs text-zinc-600">74/100</span>
                    </div>
                  </div>
                </div>

                {/* Report Body */}
                <div className="relative">
                  <div className="px-6 sm:px-10 py-6 space-y-6">
                    {/* Radar + KPIs */}
                    <div className="grid lg:grid-cols-2 gap-5">
                      <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Startup Health Radar</p>
                        <div className="space-y-2.5">
                          {SAMPLE_RADAR.map((r) => (
                            <div key={r.category}>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-zinc-400">{r.category}</span>
                                <span className="text-white font-semibold">{r.value}/10</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(r.value / 10) * 100}%`, backgroundColor: r.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Investment Thesis</p>
                          <p className="text-[13px] text-zinc-300 leading-relaxed">
                            E-commerce customer support automation addresses a rapidly growing market. The AI-powered approach targets SMBs seeking to reduce support costs while maintaining quality.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</p>
                            <p className="text-2xl font-bold text-white mt-0.5">74</p>
                            <span className="text-[10px] text-zinc-500">/ 100</span>
                          </div>
                          <div className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Confidence</p>
                            <p className="text-2xl font-bold text-white mt-0.5">82<span className="text-sm font-normal text-zinc-400">%</span></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { label: "Market", score: 8 },
                        { label: "Competition", score: 5 },
                        { label: "Feasibility", score: 7 },
                        { label: "Monetization", score: 6 },
                        { label: "Distribution", score: 5 },
                      ].map((k) => (
                        <div key={k.label} className="rounded-xl border border-white/[0.06] bg-[#171A21] p-3">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{k.label}</p>
                          <p className="text-lg font-bold text-white mt-0.5">{k.score}<span className="text-[10px] font-normal text-zinc-500">/10</span></p>
                        </div>
                      ))}
                    </div>

                    {/* Risk Register */}
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Risk Register</p>
                      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                              <th className="text-left px-3 py-2.5 font-semibold text-zinc-400 uppercase tracking-wider">Risk</th>
                              <th className="text-left px-3 py-2.5 font-semibold text-zinc-400 uppercase tracking-wider w-20">Severity</th>
                              <th className="hidden md:table-cell text-left px-3 py-2.5 font-semibold text-zinc-400 uppercase tracking-wider">Mitigation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {SAMPLE_RISKS.slice(0, 3).map((r, i) => (
                              <tr key={i} className="hover:bg-white/[0.02]">
                                <td className="px-3 py-2.5 font-medium text-white">{r.risk}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                    r.severity === "High"
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : r.severity === "Low"
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`}>{r.severity}</span>
                                </td>
                                <td className="hidden md:table-cell px-3 py-2.5 text-zinc-500">{r.mitigation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Verdict */}
                    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-4">
                      <p className="text-[10px] text-green-400 font-medium uppercase tracking-wider mb-1">Executive Verdict</p>
                      <p className="text-[13px] text-zinc-300 leading-relaxed">
                        This is a viable idea with strong market tailwinds. The primary risk is customer acquisition cost in a competitive space. Recommended approach: focus on a niche segment first and expand after product-market fit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-zinc-800">Startup Evaluator</span>
          <span className="text-xs text-zinc-800">Founder Due Diligence Platform</span>
        </div>
      </footer>
    </main>
  );
}
