import type { Recommendation } from "./types";

const priorityColors: Record<string, { bg: string; text: string }> = {
  "Critical": { bg: "bg-red-500/10", text: "text-red-400" },
  "High": { bg: "bg-blue-500/10", text: "text-blue-400" },
  "Medium": { bg: "bg-amber-500/10", text: "text-amber-400" },
  "Low": { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

export default function RecommendationCard({ recommendations }: { recommendations?: Recommendation[] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Strategic Recommendations</div>
      <div className="space-y-4">
        {recommendations.map((r, i) => {
          const pri = (r.priority || "Medium") as string;
          const colors = priorityColors[pri] || priorityColors["Medium"];
          return (
            <div key={i} className="border border-white/[0.06] rounded-xl p-6 bg-gradient-to-r from-white/[0.02] to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm font-semibold text-white">{r.recommendation}</div>
                    {r.priority && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {pri}
                      </span>
                    )}
                  </div>
                  {r.rationale && <p className="text-xs text-white/60 leading-relaxed">{r.rationale}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
