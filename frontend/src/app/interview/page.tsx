"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateStartup,
  classifyIdea,
  interviewStep,
  IdeaClassification,
  InterviewStepResponse,
} from "@/lib/api";

type Phase = "classifying" | "assumptions" | "questions" | "review" | "submitting";

interface QAPair {
  question: string;
  answer: string;
}

interface AssumptionState {
  text: string;
  status: "pending" | "correct" | "different";
  correction: string;
}

function PhaseDots({ phase }: { phase: Phase }) {
  const map: Record<Phase, number> = {
    classifying: 0,
    assumptions: 0,
    questions: 0,
    review: 1,
    submitting: 1,
  };
  const labels = ["Interview", "Review"];
  const idx = map[phase];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === idx ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : i < idx ? "bg-green-500" : "bg-zinc-700"
            }`}
          />
          <span
            className={`text-[10px] uppercase tracking-wider font-medium ${
              i === idx ? "text-blue-400" : i < idx ? "text-green-400" : "text-zinc-600"
            }`}
          >
            {l}
          </span>
          {i === 0 && <span className="w-6 h-px bg-white/[0.06] mx-1" />}
        </div>
      ))}
    </div>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("classifying");
  const [cls, setCls] = useState<IdeaClassification | null>(null);
  const [classifyError, setClassifyError] = useState("");

  // Assumptions
  const [assumptions, setAssumptions] = useState<AssumptionState[]>([]);

  // Questions
  const [history, setHistory] = useState<QAPair[]>([]);
  const [currentQ, setCurrentQ] = useState<InterviewStepResponse | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState("");

  // Review
  const [reviewAnswers, setReviewAnswers] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");

  // Load idea & classify
  useEffect(() => {
    const stored = sessionStorage.getItem("startupIdea");
    if (!stored) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    setIdea(stored);
    (async () => {
      try {
        const c = await classifyIdea(stored);
        if (cancelled) return;
        setCls(c);
        setAssumptions(
          (c.assumptions || []).map((a: string) => ({ text: a, status: "pending" as const, correction: "" }))
        );
        setPhase("assumptions");
      } catch {
        if (!cancelled) setClassifyError("Could not analyze your idea. Please try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch first question when transitioning to questions phase
  const startQuestions = useCallback(async () => {
    if (!cls) return;
    setPhase("questions");
    setQLoading(true);
    setQError("");
    try {
      const q = await interviewStep(idea, cls.startup_type, cls.industry, []);
      setCurrentQ(q);
      setQLoading(false);
    } catch {
      setQError("Failed to load next question. Try again.");
      setQLoading(false);
    }
  }, [idea, cls]);

  // Handle assumption toggle
  const toggleAssumption = useCallback((idx: number, status: "correct" | "different") => {
    setAssumptions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, status, correction: status === "correct" ? "" : a.correction } : a))
    );
  }, []);

  const setAssumptionCorrection = useCallback((idx: number, correction: string) => {
    setAssumptions((prev) => prev.map((a, i) => (i === idx ? { ...a, correction } : a)));
  }, []);

  const allAssumptionsDone = assumptions.every((a) => a.status !== "pending");

  // Handle option selection (auto-advance)
  const selectOption = useCallback(
    async (option: string) => {
      if (!currentQ || !currentQ.title || !cls) return;
      const newPair: QAPair = { question: currentQ.title, answer: option };
      const newHistory = [...history, newPair];
      setHistory(newHistory);
      setCurrentQ(null);
      setQLoading(true);
      setQError("");
      try {
        const next = await interviewStep(idea, cls.startup_type, cls.industry, newHistory);
        if (next.done) {
          const ans = newHistory.map((h) => h.answer);
          setReviewAnswers(ans);
          setPhase("review");
        } else {
          setCurrentQ(next);
        }
        setQLoading(false);
      } catch {
        setQError("Failed to load next question.");
        setQLoading(false);
      }
    },
    [currentQ, cls, history, idea]
  );

  // Back
  const goBack = useCallback(async () => {
    if (history.length === 0) {
      setPhase("assumptions");
      return;
    }
    const shorter = history.slice(0, -1);
    setHistory(shorter);
    setCurrentQ(null);
    setQLoading(true);
    setQError("");
    try {
      const q = await interviewStep(idea, cls!.startup_type, cls!.industry, shorter);
      setCurrentQ(q);
      setQLoading(false);
    } catch {
      setQError("Failed to load previous question.");
      setQLoading(false);
    }
  }, [history, cls, idea]);

  // Submit
  const handleSubmit = useCallback(async () => {
    setPhase("submitting");
    setSubmitError("");
    try {
      const report = await evaluateStartup(idea, reviewAnswers);
      sessionStorage.setItem("evaluationReport", JSON.stringify(report));
      router.push("/evaluation");
    } catch {
      setPhase("review");
      setSubmitError("Evaluation failed. Please try again.");
    }
  }, [idea, reviewAnswers, router]);

  // Restart
  const handleRestart = useCallback(() => {
    sessionStorage.removeItem("startupIdea");
    router.push("/#input");
  }, [router]);

  // ── Classifying ──
  if (phase === "classifying") {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-[#F8FAFC] flex flex-col items-center justify-center px-4">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Analyzing your idea...</p>
        <p className="text-xs text-zinc-600 mt-2 max-w-xs text-center">{idea}</p>
        {classifyError && (
          <>
            <p className="text-sm text-red-400 mt-4">{classifyError}</p>
            <button onClick={handleRestart} className="text-sm text-blue-400 hover:underline mt-2">
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Assumptions ──
  if (phase === "assumptions") {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-[#F8FAFC] flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-xl">
          <PhaseDots phase={phase} />
          <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-6 sm:p-8 mt-8">
            <h2 className="text-lg font-semibold tracking-tight mb-1">
              We analyzed your idea and made some assumptions
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Confirm or correct each one so we understand your business accurately.
            </p>
            <div className="space-y-4">
              {assumptions.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4 transition-all duration-200"
                >
                  <p className="text-sm text-zinc-300 mb-3">{a.text}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAssumption(i, "correct")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                        a.status === "correct"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-[#0A0B0F] text-zinc-400 border-white/[0.06] hover:text-zinc-300"
                      }`}
                    >
                      Correct
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAssumption(i, "different")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                        a.status === "different"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-[#0A0B0F] text-zinc-400 border-white/[0.06] hover:text-zinc-300"
                      }`}
                    >
                      Different
                    </button>
                  </div>
                  {a.status === "different" && (
                    <input
                      type="text"
                      value={a.correction}
                      onChange={(e) => setAssumptionCorrection(i, e.target.value)}
                      placeholder="Tell us what's different..."
                      className="mt-3 w-full rounded-lg border border-white/[0.06] bg-[#0A0B0F] px-3 py-2 text-sm text-[#F8FAFC] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={startQuestions}
              disabled={!allAssumptionsDone}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              Begin Interview
            </button>
          </div>
          <button onClick={handleRestart} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            &larr; Change idea
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ──
  if (phase === "questions") {
    const qCount = history.length + (currentQ && !currentQ.done ? 1 : 0);
    const progress = Math.min((history.length / 4) * 100, 100);
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-[#F8FAFC] flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-xl">
          <PhaseDots phase={phase} />
          <div className="flex items-center justify-between text-xs text-zinc-500 mt-6 mb-2">
            <span>Question {qCount} of 4</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {qError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 mb-4">
              <p className="text-sm text-red-400">{qError}</p>
              <button
                onClick={goBack}
                className="text-xs text-blue-400 hover:underline mt-1"
              >
                Go back
              </button>
            </div>
          )}

          {qLoading && !currentQ && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {currentQ && currentQ.title && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-6 sm:p-8 animate-fade-in">
              <p className="text-sm font-semibold text-[#F8FAFC] mb-1">{currentQ.title}</p>
              {currentQ.description && (
                <p className="text-sm text-zinc-400 mb-6">{currentQ.description}</p>
              )}
              {currentQ.reasoning && (
                <p className="text-[10px] text-zinc-500 italic mb-4 border-l-2 border-blue-500/30 pl-3">
                  {currentQ.reasoning}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectOption(opt)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-white/[0.06] bg-[#171A21] text-zinc-300 transition-all duration-200 hover:bg-[#1F232E] hover:text-[#F8FAFC] hover:border-blue-500/30"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {history.length > 0 && (
                <button
                  onClick={goBack}
                  className="mt-5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  &larr; Previous question
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Review / Submitting ──
  const isSubmitting = phase === "submitting";
  const questionsList = history.map((h) => h.question);
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#F8FAFC] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <PhaseDots phase={phase} />
        <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-6 sm:p-8 mt-8">
          <h2 className="text-lg font-semibold tracking-tight mb-1">Review Your Responses</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Confirm your answers before generating the report.
          </p>
          <div className="space-y-3 mb-6">
            {history.map((h, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-[#171A21] p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-1">
                  {questionsList[i]}
                </p>
                <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  {h.answer}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={goBack}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-white/[0.06] bg-[#171A21] px-4 py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-[#1F232E] disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Report...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
          {submitError && (
            <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-center">
              {submitError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
