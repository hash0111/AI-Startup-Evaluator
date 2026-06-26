const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function evaluateStartup(idea: string, answers: string[]) {
  const res = await fetch(`${BASE_URL}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, answers }),
  });
  if (!res.ok) throw new Error("Evaluation failed");
  return res.json();
}

export interface IdeaClassification {
  startup_type: string;
  industry: string;
  target_customer_suggestions: string[];
  problem_suggestions: string[];
  monetization_suggestions: string[];
  assumptions: string[];
}

export async function classifyIdea(idea: string): Promise<IdeaClassification> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${BASE_URL}/api/classify-idea`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Classification failed");
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export interface InterviewStepResponse {
  title: string | null;
  description: string | null;
  options: string[];
  reasoning: string | null;
  done: boolean;
}

export async function interviewStep(
  idea: string,
  startupType: string,
  industry: string,
  history: { question: string; answer: string }[]
): Promise<InterviewStepResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${BASE_URL}/api/interview/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, startup_type: startupType, industry, history }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Interview step failed");
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}
