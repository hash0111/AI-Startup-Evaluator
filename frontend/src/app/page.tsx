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

const STORY_CARDS = [
  { title: "Describe Your Startup", description: "Tell us about your idea in one sentence — we handle the rest." },
  { title: "AI Interview", description: "Our engine asks smart questions to understand your business deeply." },
  { title: "Investment-Grade Report", description: "A full due diligence report with scores, risks, and strategy." },
  { title: "Chat With Your Report", description: "Ask questions, explore scenarios, and dig deeper into any section." },
];

const getChipDelay = (i: number) => 0.45 + i * 0.035;

// ── Component ──

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    speechPrefixRef.current = idea;
    speechProviderRef.current?.start();
  }, [idea]);

  const handleSpeechStop = useCallback(() => speechProviderRef.current?.stop(), []);

  const handleSpeechCancel = useCallback(() => {
    speechProviderRef.current?.cancel();
    setSpeechState('idle');
  }, []);

  // ── Viewport height tracking ──
  const [vh, setVh] = useState(600);

  useEffect(() => {
    setVh(window.innerHeight);
    const handle = () => setVh(window.innerHeight);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // ── Scroll: reveal transforms (window scrollY, first 100vh) ──
  const { scrollY } = useScroll();

  const revealProgress = useTransform(scrollY, [0, vh], [0, 1]);

  const reportScale = useTransform(revealProgress, [0, 0.5, 1], [0.82, 0.92, 1]);
  const reportOpacity = useTransform(revealProgress, [0, 1], [0.8, 1]);
  const reportY = useTransform(revealProgress, [0, 1], [60, 0]);

  // ── Scroll: section highlights (container progress) ──
  const { scrollYProgress: sectionProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const sectionActive1 = useTransform(sectionProgress, [0.00, 0.04, 0.10], [0, 1, 0]);
  const sectionActive2 = useTransform(sectionProgress, [0.08, 0.13, 0.19], [0, 1, 0]);
  const sectionActive3 = useTransform(sectionProgress, [0.17, 0.23, 0.29], [0, 1, 0]);
  const sectionActive4 = useTransform(sectionProgress, [0.27, 0.33, 0.39], [0, 1, 0]);
  const sectionActive5 = useTransform(sectionProgress, [0.37, 0.44, 0.51], [0, 1, 0]);
  const sectionActive6 = useTransform(sectionProgress, [0.49, 0.56, 0.63], [0, 1, 0]);
  const sectionActive7 = useTransform(sectionProgress, [0.61, 0.69, 0.78], [0, 1, 0]);

  const sectionHighlights = [sectionActive1, sectionActive2, sectionActive3, sectionActive4, sectionActive5, sectionActive6, sectionActive7];

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

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center text-center w-full max-w-[820px]">
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em]">
            Validate your startup<br />before you build it.
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 mt-4 max-w-[580px] leading-relaxed tracking-tight">
            Describe your startup in one sentence. We&apos;ll interview you intelligently and generate an investor-grade due diligence report.
          </p>
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
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5 max-w-md">
              {error}
            </motion.p>
          )}
          {speechErrorMsg && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-2.5 max-w-md">
              {speechErrorMsg}
            </motion.p>
          )}
          <div className="mt-6">
            <div className="flex flex-wrap justify-center gap-2 max-w-[600px]">
              {STARTUP_CHIPS.map((chip, i) => (
                <motion.button
                  key={chip.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: getChipDelay(i), ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
                  whileHover={{ y: -2, scale: 1.02, borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC", boxShadow: "0 0 24px rgba(59,130,246,0.08)" }}
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
      </section>

      {/* ═══════ REPORT SECTION ═══════ */}
      {/* As the hero scrolls out, the report emerges from below, scales up, 
          and takes over the viewport — no gap, no sticky, no fake scrolling. */}
      <section ref={containerRef} className="relative z-10 pt-24 pb-32">

        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-zinc-400 tracking-tight leading-snug">
            Your report will look like this
          </h2>
          <p className="text-sm text-zinc-600 mt-2">
            An investment-grade due diligence report generated in under 60 seconds.
          </p>
        </div>

        <div className="flex justify-center px-4 mt-10">
          <motion.div
            className="w-[min(88vw,1200px)]"
            style={{
              scale: reportScale,
              opacity: reportOpacity,
              y: reportY,
              transformOrigin: 'center top',
            }}
          >
            <div className="relative rounded-[20px] border border-white/[0.06] bg-[#111827] overflow-hidden shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]">
              {/* Scroll progress indicator */}
              <div className="absolute top-0 left-0 w-[3px] h-full bg-white/[0.03] z-30">
                <motion.div
                  className="w-full bg-blue-500/40 rounded-full"
                  style={{ height: useTransform(sectionProgress, [0, 1], ['0%', '100%']) }}
                />
              </div>

              {/* Executive Summary */}
              <motion.div
                className="px-6 sm:px-8 py-6 border-b border-white/[0.06]"
                style={{
                  background: useTransform(sectionHighlights[0], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[0], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-zinc-500 uppercase tracking-[0.18em] font-medium mb-2">Executive Summary</p>
                <p className="text-[14px] text-zinc-300 leading-relaxed">
                  AI-powered customer support automation for e-commerce brands. The platform reduces response times by 70% while maintaining CSAT scores above 92%. Built on proprietary LLM fine-tuning, the system understands brand voice, product catalog, and policy documents to deliver accurate, context-aware responses.
                </p>
              </motion.div>

              {/* Header + Score */}
              <motion.div
                className="px-6 sm:px-8 py-5 border-b border-white/[0.06] flex items-center justify-between"
                style={{
                  background: useTransform(sectionHighlights[1], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[1], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.18em] font-medium">Due Diligence Report</p>
                  <h3 className="text-lg font-bold text-white mt-0.5 tracking-tight">AI-Powered Customer Support Platform</h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-sm font-bold text-green-400">GO</span>
                  </div>
                  <span className="text-sm text-zinc-600">74/100</span>
                </div>
              </motion.div>

              {/* Health Radar */}
              <motion.div
                className="px-6 sm:px-8 py-6 border-b border-white/[0.06]"
                style={{
                  background: useTransform(sectionHighlights[2], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[2], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Health Radar</p>
                <div className="grid grid-cols-5 gap-4 mb-2">
                  {SAMPLE_RADAR.map((r) => (
                    <div key={r.category}>
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-zinc-500">{r.category}</span>
                        <span className="text-white font-semibold">{r.value}</span>
                      </div>
                      <div className="w-full h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r.value / 10) * 100}%`, backgroundColor: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Investment Thesis */}
              <motion.div
                className="px-6 sm:px-8 py-6 border-b border-white/[0.06]"
                style={{
                  background: useTransform(sectionHighlights[3], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[3], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Investment Thesis</p>
                <p className="text-[14px] text-zinc-300 leading-relaxed">
                  E-commerce customer support automation addresses a rapidly growing market. AI-powered approach targets SMBs seeking to reduce costs while maintaining quality. The combination of LLM-based understanding and workflow automation creates a defensible moat.
                </p>
              </motion.div>

              {/* Risk Register */}
              <motion.div
                className="px-6 sm:px-8 py-6 border-b border-white/[0.06]"
                style={{
                  background: useTransform(sectionHighlights[4], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[4], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Risk Register</p>
                {SAMPLE_RISKS.map((r) => (
                  <div key={r.risk} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium border shrink-0 mt-0.5 ${
                      r.severity === "High"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : r.severity === "Low"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{r.severity}</span>
                    <div>
                      <p className="text-[13px] text-zinc-300">{r.risk}</p>
                      <p className="text-[12px] text-zinc-600 mt-0.5">{r.mitigation}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Financial Metrics */}
              <motion.div
                className="px-6 sm:px-8 py-6 border-b border-white/[0.06]"
                style={{
                  background: useTransform(sectionHighlights[5], (v) =>
                    `rgba(59,130,246,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[5], (v) =>
                    `${v * 3}px solid rgba(59,130,246,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium mb-4">Financial Metrics</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <div>
                    <p className="text-[12px] text-zinc-500 mb-0.5">Total Addressable Market</p>
                    <p className="text-lg font-semibold text-white">$12.4B</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-zinc-500 mb-0.5">Market Growth Rate</p>
                    <p className="text-lg font-semibold text-white">22% YoY</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-zinc-500 mb-0.5">Target Gross Margin</p>
                    <p className="text-lg font-semibold text-white">72%</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-zinc-500 mb-0.5">Burn Multiple (Est.)</p>
                    <p className="text-lg font-semibold text-white">1.8x</p>
                  </div>
                </div>
              </motion.div>

              {/* Final Verdict */}
              <motion.div
                className="px-6 sm:px-8 py-6"
                style={{
                  background: useTransform(sectionHighlights[6], (v) =>
                    `rgba(34,197,94,${v * 0.06})`
                  ),
                  borderLeft: useTransform(sectionHighlights[6], (v) =>
                    `${v * 3}px solid rgba(34,197,94,${0.3 + v * 0.4})`
                  ),
                }}
              >
                <p className="text-[11px] text-green-400 font-medium uppercase tracking-wider mb-2">Final Verdict</p>
                <p className="text-[14px] text-zinc-300 leading-relaxed">
                  This is a viable idea with strong market tailwinds. The primary risk is customer acquisition cost. Recommended: focus on a niche segment first, expand after product-market fit. The AI moat and e-commerce focus provide meaningful differentiation.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ WORKFLOW SECTION ═══════ */}
      <section className="relative z-10 py-32 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-300">
              From idea to insight
            </h2>
            <p className="text-sm text-zinc-600 mt-3 max-w-lg mx-auto">
              Four simple steps from describing your startup to exploring a full due diligence report.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
            {STORY_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                className="flex items-start gap-5 p-6 rounded-2xl border border-white/[0.04] bg-[rgba(15,15,22,0.4)]"
                initial={{ scale: 0.92, y: 30 }}
                whileInView={{ scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-base font-medium text-zinc-200">{card.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-zinc-800">Startup Evaluator</span>
          <span className="text-xs text-zinc-800">Founder Due Diligence Platform</span>
        </div>
      </footer>
    </main>
  );
}
