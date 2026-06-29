const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function evaluateStartup(idea: string, answers: string[]) {
  const res = await fetch(`${BASE_URL}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, answers }),
  });
  if (!res.ok) {
    let detail = "Evaluation failed";
    try { const body = await res.json(); detail = body.detail || detail; } catch {}
    throw new Error(detail);
  }
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithReport(
  report: unknown,
  messages: ChatMessage[],
  systemPrompt?: string,
  signal?: AbortSignal
): Promise<Response> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      report,
      messages,
      system_prompt: systemPrompt,
    }),
    signal,
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res;
}

export async function generateDeepDive(
  idea: string,
  answers: string[],
  report: unknown,
  section: string,
  signal?: AbortSignal
) {
  const res = await fetch(`${BASE_URL}/api/deep-dive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, answers, report, section }),
    signal,
  });
  if (!res.ok) {
    let detail = "Deep dive generation failed";
    try { const body = await res.json(); detail = body.detail || detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}
