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
