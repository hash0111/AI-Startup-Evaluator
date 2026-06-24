"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateStartup } from "@/lib/api";

interface Question {
  id: number;
  question: string;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Who is your primary customer?",
    placeholder: "e.g. College students, small businesses, tourists",
  },
  {
    id: 2,
    question: "What problem are you solving?",
    placeholder: "e.g. Planning trips takes too much time",
  },
  {
    id: 3,
    question: "How are people solving this today?",
    placeholder: "e.g. Excel sheets, travel agents, Google Search",
  },
  {
    id: 4,
    question: "How will you make money?",
    placeholder: "e.g. Subscription, one-time payment, commission",
  },
  {
    id: 5,
    question: "What makes your solution different?",
    placeholder: "e.g. AI-generated itineraries, local language support",
  },
  {
    id: 6,
    question: "How difficult is this to build?",
    options: ["Easy", "Medium", "Hard"],
  },
  {
    id: 7,
    question: "Who are your biggest competitors?",
    placeholder: "Optional — names or URLs",
    optional: true,
  },
  {
    id: 8,
    question: "Why is now the right time?",
    placeholder: "Optional — one sentence maximum",
    optional: true,
  },
];

export default function InterviewPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    new Array(QUESTIONS.length).fill("")
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("startupIdea");
    if (!stored) {
      router.push("/");
      return;
    }
    setIdea(stored);
  }, [router]);

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const progress = Math.round(((step + 1) / total) * 100);

  function setAnswer(val: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = val;
      return next;
    });
  }

  function canProceed(): boolean {
    if (q.optional) return true;
    if (q.options) return answers[step] !== "";
    return answers[step].trim().length > 0;
  }

  function next() {
    if (step < total - 1) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      sessionStorage.setItem("founderAnswers", JSON.stringify(answers));
      const report = await evaluateStartup(idea, answers);
      sessionStorage.setItem("evaluationReport", JSON.stringify(report));
      router.push("/evaluation");
    } catch {
      alert("Evaluation failed. Make sure the backend is running on port 8000.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>
              Question {step + 1} of {total}
            </span>
            <span>{progress}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Question {q.id}
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {q.question}
          </h2>

          {q.options ? (
            <div className="flex gap-3 mb-4">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(opt)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    answers[step] === opt
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <input
                type="text"
                value={answers[step]}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceed()) {
                    e.preventDefault();
                    if (step === total - 1) handleSubmit();
                    else next();
                  }
                }}
                placeholder={q.placeholder}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step === total - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="btn-primary"
              >
                {submitting ? "Evaluating..." : "Submit & Evaluate"}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={!canProceed()}
                className="btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
