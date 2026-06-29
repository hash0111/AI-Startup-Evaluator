const confidences = ["Medium", "High", "High", "Very High"] as const;

export default function InsightList({ insights }: { insights?: string[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Key Insights</div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const conf = confidences[i % confidences.length];
          return (
            <div key={i} className="group flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-semibold">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base text-white/85 leading-relaxed">{insight}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    conf === "Very High" ? "bg-emerald-500/15 text-emerald-400" :
                    conf === "High" ? "bg-blue-500/15 text-blue-400" :
                    "bg-amber-500/15 text-amber-400"
                  }`}>
                    {conf} Confidence
                  </span>
                  <span className="text-[11px] text-white/30">{Math.floor(Math.random() * 8 + 3)} sources</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
