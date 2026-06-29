"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { DeepDiveData } from "./types";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

function extractChartData(data: DeepDiveData) {
  const charts: { type: string; title: string; data: { name: string; value: number }[] }[] = [];

  const md = data.market_data;
  if (md?.tam || md?.sam || md?.som) {
    const points = [
      { name: "TAM", value: parseFloat((md.tam || "0").replace(/[^0-9.]/g, "")) || 0 },
      { name: "SAM", value: parseFloat((md.sam || "0").replace(/[^0-9.]/g, "")) || 0 },
      { name: "SOM", value: parseFloat((md.som || "0").replace(/[^0-9.]/g, "")) || 0 },
    ];
    if (points.some(p => p.value > 0)) charts.push({ type: "bar", title: "Market Sizing", data: points });
  }

  if (data.competitor_table && data.competitor_table.length >= 3) {
    const threats: Record<string, number> = {};
    for (const c of data.competitor_table) {
      const t = c.threat_level || "Medium";
      threats[t] = (threats[t] || 0) + 1;
    }
    const compData = Object.entries(threats).map(([name, value]) => ({ name, value }));
    if (compData.length) charts.push({ type: "pie", title: "Competitive Threat Distribution", data: compData });
  }

  if (data.risk_table && data.risk_table.length >= 3) {
    const byScore: Record<string, number> = {};
    for (const r of data.risk_table) {
      const s = r.risk_score || r.probability || "Medium";
      byScore[s] = (byScore[s] || 0) + 1;
    }
    const riskData = Object.entries(byScore).map(([name, value]) => ({ name, value }));
    if (riskData.length >= 2) charts.push({ type: "bar", title: "Risk Distribution", data: riskData });
  }

  return charts;
}

export default function DynamicChart({ data }: { data: DeepDiveData }) {
  const charts = extractChartData(data);
  if (charts.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Charts & Visualizations</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, ci) => (
          <div key={ci} className="bg-white/[0.015] border border-white/[0.06] rounded-xl p-6">
            <div className="text-sm font-medium text-white mb-4">{chart.title}</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === "bar" ? (
                  <BarChart data={chart.data}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                    <Bar dataKey="value" fill={CHART_COLORS[ci]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                ) : chart.type === "pie" ? (
                  <PieChart>
                    <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: PieLabelRenderProps) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {chart.data.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                ) : null}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
