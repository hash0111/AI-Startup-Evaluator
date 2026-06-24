"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const trustItems = [
  "Market Analysis",
  "Competitor Research",
  "Risk Assessment",
  "MVP Recommendations",
];

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError("");

    sessionStorage.setItem("startupIdea", idea);
    router.push("/interview");
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-5">
            Validate Your Startup Idea
            <br />
            Before You Build It
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            AI-powered market research, competitor analysis, and risk assessment
            in under 60 seconds.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your startup idea..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2 w-full">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !idea.trim()}
              className="btn-primary text-base px-10 py-3 w-full sm:w-auto"
            >
              {loading ? "Analyzing..." : "Evaluate My Startup"}
            </button>
          </form>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <svg
                  className="w-4 h-4 text-green-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
