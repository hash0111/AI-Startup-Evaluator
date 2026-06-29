import type { Risk } from "./types";

const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  "Critical": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  "High": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  "Medium": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  "Low": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
};

type RiskItem = Risk & { risk?: string; severity?: string; mitigation?: string };

export default function RiskCard({ risks }: { risks?: RiskItem[] }) {
  if (!risks || risks.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Risks & Opportunities</div>
      <div className="space-y-3">
        {risks.map((r, i) => {
          const sev = (r.severity || "Medium") as string;
          const colors = severityColors[sev] || severityColors["Medium"];
          return (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.015]">
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full ${colors.dot} mt-2 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-sm font-semibold text-white">{r.risk || "Risk"}</div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {sev}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{r.description || "No description"}</p>
                  {r.mitigation && (
                    <div className="mt-3 text-xs text-white/40">
                      <span className="text-white/50 font-medium">Mitigation: </span>
                      {r.mitigation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
