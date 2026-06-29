import type { DeepDiveData } from "./types";

function safeStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return "";
}

function extractMetrics(data: DeepDiveData): { label: string; value: string; description: string }[] {
  const metrics: { label: string; value: string; description: string }[] = [];

  if (data.market_data) {
    const md = data.market_data;
    const tam = safeStr(md.tam);
    const sam = safeStr(md.sam);
    const som = safeStr(md.som);
    const growth = safeStr(md.growth_rate);

    if (tam) {
      metrics.push({
        label: tam.replace(/[^0-9.$\-BMTbmtk%]/g, "").substring(0, 16) || "TAM",
        value: tam.substring(0, 24),
        description: "Total Addressable Market",
      });
    }
    if (sam) {
      metrics.push({
        label: sam.replace(/[^0-9.$\-BMTbmtk%]/g, "").substring(0, 16) || "SAM",
        value: sam.substring(0, 24),
        description: "Serviceable Addressable Market",
      });
    }
    if (som) {
      metrics.push({
        label: som.replace(/[^0-9.$\-BMTbmtk%]/g, "").substring(0, 16) || "SOM",
        value: som.substring(0, 24),
        description: "Serviceable Obtainable Market",
      });
    }
    if (growth) {
      const num = growth.match(/\d+/);
      metrics.push({
        label: num ? `${num[0]}%` : "Growth",
        value: growth.substring(0, 24),
        description: "Annual Growth Rate",
      });
    }
  }

  if (data.unit_economics) {
    const ue = data.unit_economics;
    const cac = safeStr(ue.cac);
    const ltv = safeStr(ue.ltv);
    const ratio = safeStr(ue.ltv_cac_ratio);

    if (cac) metrics.push({ label: "CAC", value: cac.substring(0, 24), description: "Customer Acquisition Cost" });
    if (ltv) metrics.push({ label: "LTV", value: ltv.substring(0, 24), description: "Lifetime Value" });
    if (ratio) metrics.push({ label: "LTV/CAC", value: ratio.substring(0, 12), description: "Unit Economics Ratio" });
  }

  if (data.competitor_table?.length) {
    metrics.push({ label: `${data.competitor_table.length}`, value: "Competitors", description: "Competitive Landscape Density" });
  }

  return metrics.slice(0, 6);
}

export default function MetricGrid({ data }: { data: DeepDiveData }) {
  const metrics = extractMetrics(data);
  if (metrics.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Metrics & Statistics</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">{m.label}</div>
            <div className="text-xs text-white/50">{m.description}</div>
            <div className="mt-3 text-[11px] text-white/30">{m.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
