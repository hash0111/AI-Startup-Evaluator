interface DemandDriver { driver: string; evidence: string; }
interface MarketKeyRisk { risk: string; why_it_matters: string; }
interface CompetitorInsight { name: string; strength: string; weakness: string; typical_customer: string; opportunity_for_founder: string; }
interface RiskItem { risk_name: string; probability: string; impact: string; evidence: string; mitigation_strategy: string; early_warning_signal: string; owner: string; }
interface StrategicChallenge { assumption: string; why_wrong: string; evidence: string; alternative_approach: string; }
interface ImprovementAction { current_situation: string; problem: string; recommendation: string; expected_impact: string; estimated_difficulty: string; priority: string; timeline: string; }
interface Persona { title: string; industry: string; company_size: string; budget_range: string; buying_trigger: string; buying_objection: string; urgency: string; expected_lifetime_value: string; }
interface MonetizationOption { model: string; implementation_difficulty: string; revenue_predictability: string; scalability: string; cash_flow: string; recommendation: string; }
interface Milestone { title: string; objective: string; action: string; expected_result: string; success_metric: string; }
interface AcquisitionChannel { platform: string; strategy: string; expected_outcome: string; }
interface ToolRecommendation { category: string; tool: string; pricing: string; }
interface ExecutiveRecommendation { action: string; reason: string; expected_outcome: string; priority: string; time_horizon: string; }
interface ReportData {
  idea: string;
  market_research: { industry: string; growth_direction: string; market_maturity: string; demand_drivers: DemandDriver[]; key_risks: MarketKeyRisk[]; confidence: number; sources: string[] };
  competitor_analysis: { competitors: CompetitorInsight[] };
  risk_analysis: { risks: RiskItem[] };
  strategic_challenges: { challenges: StrategicChallenge[] };
  improvement_suggestions: { suggestions: ImprovementAction[] };
  mvp_recommendation: { build_first: { features: string[] }; build_later: { features: string[] }; do_not_build: { features: string[] } };
  evaluation: { market_opportunity: number; competition: number; technical_feasibility: number; monetization: number; distribution: number; overall_verdict: string; confidence_score: number };
  founder_blueprint?: {
    verdict: string; verdict_explanation: string;
    target_audience: Persona[];
    monetization_models: MonetizationOption[];
    launch_plan_90_days: Milestone[];
    acquisition_channels: AcquisitionChannel[];
    tools_stack: ToolRecommendation[];
    executive_recommendations: ExecutiveRecommendation[];
  };
}

function esc(v: string): string {
  return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
}

export function exportCSV(report: ReportData): void {
  const bp = report.founder_blueprint;
  const rows: string[][] = [["Category", "Metric", "Value"]];
  rows.push(["Executive", "Startup Idea", report.idea]);
  rows.push(["Executive", "Overall Verdict", report.evaluation.overall_verdict]);
  rows.push(["Executive", "Confidence Score", `${report.evaluation.confidence_score}%`]);
  rows.push(["Executive", "Score - Market Opportunity", String(report.evaluation.market_opportunity)]);
  rows.push(["Executive", "Score - Competition", String(report.evaluation.competition)]);
  rows.push(["Executive", "Score - Technical Feasibility", String(report.evaluation.technical_feasibility)]);
  rows.push(["Executive", "Score - Monetization", String(report.evaluation.monetization)]);
  rows.push(["Executive", "Score - Distribution", String(report.evaluation.distribution)]);
  rows.push(["Market", "Industry", report.market_research.industry]);
  rows.push(["Market", "Growth Direction", report.market_research.growth_direction]);
  rows.push(["Market", "Maturity", report.market_research.market_maturity]);
  rows.push(["Market", "Analysis Confidence", `${report.market_research.confidence}%`]);
  for (const d of report.market_research.demand_drivers) rows.push(["Market", `Driver: ${d.driver}`, d.evidence]);
  for (const r of report.market_research.key_risks) rows.push(["Market", `Risk: ${r.risk}`, r.why_it_matters]);
  for (const c of report.competitor_analysis.competitors) {
    rows.push(["Competitor", c.name, `Strength: ${c.strength}`]);
    rows.push(["Competitor", `${c.name} - Weakness`, c.weakness]);
    rows.push(["Competitor", `${c.name} - Opportunity`, c.opportunity_for_founder]);
  }
  for (const r of report.risk_analysis.risks) {
    rows.push(["Risk", r.risk_name, `Prob: ${r.probability}, Impact: ${r.impact}`]);
    rows.push(["Risk", `${r.risk_name} - Evidence`, r.evidence]);
    rows.push(["Risk", `${r.risk_name} - Mitigation`, r.mitigation_strategy]);
  }
  for (const c of report.strategic_challenges.challenges) {
    rows.push(["Strategic Challenge", `Assumption: ${c.assumption}`, c.why_wrong]);
    rows.push(["Strategic Challenge", `Alternative: ${c.alternative_approach}`, c.evidence]);
  }
  for (const s of report.improvement_suggestions.suggestions) {
    rows.push(["Improvement", s.current_situation, s.problem]);
    rows.push(["Improvement", `Recommendation: ${s.recommendation}`, `Impact: ${s.expected_impact}, Priority: ${s.priority}, Timeline: ${s.timeline}`]);
  }
  for (const f of report.mvp_recommendation.build_first.features) rows.push(["MVP", "Build First", f]);
  for (const f of report.mvp_recommendation.build_later.features) rows.push(["MVP", "Build Later", f]);
  for (const f of report.mvp_recommendation.do_not_build.features) rows.push(["MVP", "Do Not Build", f]);
  if (bp) {
    if (bp.verdict) rows.push(["Blueprint", "Verdict", bp.verdict]);
    for (const p of bp.target_audience) rows.push(["Blueprint", `Persona: ${p.title}`, `${p.industry}, Budget: ${p.budget_range}, Trigger: ${p.buying_trigger}, LTV: ${p.expected_lifetime_value}`]);
    for (const m of bp.monetization_models) rows.push(["Blueprint", `Monetization: ${m.model}`, `Difficulty: ${m.implementation_difficulty}, Predictability: ${m.revenue_predictability}, Scalability: ${m.scalability}${m.recommendation === "Recommended" ? " [RECOMMENDED]" : ""}`]);
    for (const m of bp.launch_plan_90_days) rows.push(["Blueprint", `Milestone: ${m.title}`, `${m.objective} | Action: ${m.action} | Metric: ${m.success_metric}`]);
    for (const c of bp.acquisition_channels) rows.push(["Blueprint", `Channel: ${c.platform}`, `${c.strategy} | ${c.expected_outcome}`]);
    for (const t of bp.tools_stack) rows.push(["Blueprint", `Tool: ${t.tool}`, `${t.category} - ${t.pricing}`]);
    for (const r of bp.executive_recommendations) rows.push(["Blueprint", `Recommendation: ${r.action}`, `Priority: ${r.priority}, Horizon: ${r.time_horizon}, Outcome: ${r.expected_outcome}`]);
  }
  for (const s of report.market_research.sources) rows.push(["Source", "Reference", s]);
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  downloadBlob(csv, `${report.idea.slice(0, 40).replace(/\s+/g, "_")}_evaluation.csv`, "text/csv;charset=utf-8;");
}

// ─── Dark Theme SVG Chart Generators ───

function radarChart(values: number[], labels: string[], size: number, accent: string): string {
  const cx = size / 2, cy = size / 2, r = size * 0.38, levels = 5;
  const angleStep = (Math.PI * 2) / values.length;
  const angleOffset = -Math.PI / 2;
  const gridColor = "rgba(255,255,255,0.08)";

  function point(index: number, radius: number): string {
    const a = angleOffset + index * angleStep;
    return `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`;
  }

  const grid = Array.from({ length: levels }, (_, l) => {
    const lr = (r * (l + 1)) / levels;
    const pts = Array.from({ length: values.length }, (_, i) => point(i, lr)).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${gridColor}" stroke-width="0.8"/>`;
  }).join("");

  const axes = Array.from({ length: values.length }, (_, i) => {
    const e = point(i, r);
    return `<line x1="${cx}" y1="${cy}" x2="${e.split(",")[0]}" y2="${e.split(",")[1]}" stroke="${gridColor}" stroke-width="0.5"/>`;
  }).join("");

  const dataPts = Array.from({ length: values.length }, (_, i) => point(i, (r * values[i]) / 10)).join(" ");
  const dataPoly = `<polygon points="${dataPts}" fill="${accent}25" stroke="${accent}" stroke-width="2.5"/>`;

  const dots = Array.from({ length: values.length }, (_, i) => {
    const p = point(i, (r * values[i]) / 10).split(",");
    return `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${accent}" stroke="#0B0F14" stroke-width="2"/>`;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#111827" rx="12"/>
    ${grid}${axes}${dataPoly}${dots}
  </svg>`;
}

function barChart(items: { label: string; value: number; color: string }[], width: number, height: number): string {
  const pad = { t: 24, r: 24, b: 44, l: 44 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const max = Math.max(...items.map((d) => d.value), 1);
  const barW = cw / items.length * 0.55;
  const gap = cw / items.length * 0.45;

  const bars = items.map((d, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2;
    const bh = (d.value / max) * ch;
    const y = pad.t + ch - bh;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="${d.color}" opacity="0.9"/>
      <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="10" fill="#D1D5DB" font-family="Inter, sans-serif" font-weight="600">${d.value}</text>
      <text x="${x + barW / 2}" y="${pad.t + ch + 18}" text-anchor="middle" font-size="8" fill="#8B95A7" font-family="Inter, sans-serif">${d.label}</text>`;
  }).join("");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#111827" rx="12"/>
    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + ch}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <line x1="${pad.l}" y1="${pad.t + ch}" x2="${pad.l + cw}" y2="${pad.t + ch}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    ${bars}
  </svg>`;
}

function pieChart(items: { label: string; value: number; color: string }[], size: number): string {
  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = size * 0.35;

  const slices = items.map((d) => {
    const frac = d.value / total;
    const a = frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + a);
    const y2 = cy + r * Math.sin(cumAngle + a);
    const large = a > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    const midAngle = cumAngle + a / 2;
    const lx = cx + r * 1.35 * Math.cos(midAngle);
    const ly = cy + r * 1.35 * Math.sin(midAngle);
    const label = `${d.label} ${Math.round(frac * 100)}%`;
    cumAngle += a;
    return `<path d="${path}" fill="${d.color}" opacity="0.85" stroke="#111827" stroke-width="2"/>
      <text x="${lx}" y="${ly}" text-anchor="${lx > cx ? "start" : "end"}" font-size="7" fill="#B8C1CC" font-family="Inter, sans-serif">${label}</text>`;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#111827" rx="12"/>${slices}
  </svg>`;
}

function riskMatrix(risks: { name: string; prob: string; impact: string }[], size: number): string {
  const cell = size / 3;
  const probLevels = ["Low", "Medium", "High"];
  const impLevels = ["Low", "Medium", "High"];

  const grid = impLevels.map((_, ri) =>
    probLevels.map((_, ci) => {
      const x = ci * cell, y = ri * cell;
      const score = (ri + ci) / 4;
      const fill = score < 0.34 ? "#064e3b" : score < 0.67 ? "#713f12" : "#7f1d1d";
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="#1A2233" stroke-width="3" rx="6"/>`;
    }).join("")
  ).join("");

  const labels = probLevels.map((l, i) =>
    `<text x="${i * cell + cell / 2}" y="${size + 14}" text-anchor="middle" font-size="8" fill="#8B95A7" font-family="Inter, sans-serif">${l}</text>`
  ).join("");

  const impLabels = impLevels.map((l, i) =>
    `<text x="-6" y="${i * cell + cell / 2 + 3}" text-anchor="end" font-size="8" fill="#8B95A7" font-family="Inter, sans-serif">${l}</text>`
  ).join("");

  const dots = risks.map((r) => {
    const pi = probLevels.indexOf(r.prob);
    const ii = impLevels.indexOf(r.impact);
    if (pi === -1 || ii === -1) return "";
    const x = pi * cell + cell / 2;
    const y = ii * cell + cell / 2;
    return `<circle cx="${x}" cy="${y}" r="4" fill="#F5F7FA" opacity="0.9" stroke="#0B0F14" stroke-width="2"/>
      <text x="${x}" y="${y + 13}" text-anchor="middle" font-size="6" fill="#D1D5DB" font-family="Inter, sans-serif">${r.name.length > 14 ? r.name.slice(0, 14) + "..." : r.name}</text>`;
  }).join("");

  return `<svg width="${size}" height="${size + 24}" viewBox="0 0 ${size} ${size + 24}" xmlns="http://www.w3.org/2000/svg">
    <text x="-18" y="${size / 2}" text-anchor="middle" font-size="8" fill="#8B95A7" font-family="Inter, sans-serif" transform="rotate(-90, -18, ${size / 2})">Impact</text>
    <g transform="translate(0,0)">${grid}${dots}</g>
    <text x="${size / 2}" y="-6" text-anchor="middle" font-size="8" fill="#8B95A7" font-family="Inter, sans-serif">Probability</text>
    ${labels}${impLabels}
  </svg>`;
}

function competitivePositioning(items: { name: string; x: number; y: number; size: number; color: string }[], width: number, height: number): string {
  const pad = { t: 34, r: 24, b: 44, l: 44 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;

  const circles = items.map((d) => {
    const cx = pad.l + (d.x / 10) * cw;
    const cy = pad.t + ch - (d.y / 10) * ch;
    const r = Math.max(d.size * 7, 10);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.color}" opacity="0.8" stroke="#0B0F14" stroke-width="2.5"/>
      <text x="${cx}" y="${cy + r + 12}" text-anchor="middle" font-size="7" fill="#B8C1CC" font-family="Inter, sans-serif">${d.name}</text>`;
  }).join("");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#111827" rx="12"/>
    <line x1="${pad.l}" y1="${pad.t + ch / 2}" x2="${pad.l + cw}" y2="${pad.t + ch / 2}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4,4"/>
    <line x1="${pad.l + cw / 2}" y1="${pad.t}" x2="${pad.l + cw / 2}" y2="${pad.t + ch}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="${pad.l}" y="${pad.t - 6}" font-size="7" fill="#8B95A7" font-family="Inter, sans-serif">High</text>
    <text x="${pad.l + cw - 20}" y="${pad.t - 6}" font-size="7" fill="#8B95A7" font-family="Inter, sans-serif">Low</text>
    <text x="${pad.l - 6}" y="${pad.t + 8}" text-anchor="end" font-size="6" fill="#8B95A7" font-family="Inter, sans-serif">Low</text>
    <text x="${pad.l - 6}" y="${pad.t + ch}" text-anchor="end" font-size="6" fill="#8B95A7" font-family="Inter, sans-serif">High</text>
    <text x="${pad.l + cw / 2}" y="${pad.t + ch + 16}" text-anchor="middle" font-size="7" fill="#8B95A7" font-family="Inter, sans-serif">Feature Richness</text>
    <text x="${pad.l - 30}" y="${pad.t + ch / 2 + 3}" text-anchor="middle" font-size="7" fill="#8B95A7" font-family="Inter, sans-serif" transform="rotate(-90, ${pad.l - 30}, ${pad.t + ch / 2})">Pricing</text>
    ${circles}
  </svg>`;
}

function timelineChart(milestones: { title: string }[], width: number): string {
  const phases = ["30 Days", "60 Days", "90 Days", "180 Days"];
  const phaseW = width / phases.length;
  const h = milestones.length * 40 + 28;

  const phaseLabels = phases.map((p, i) =>
    `<text x="${i * phaseW + phaseW / 2}" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#D1D5DB" font-family="Inter, sans-serif">${p}</text>`
  ).join("");

  const dots = milestones.map((m, i) => {
    const col = i % phases.length;
    const row = Math.floor(i / phases.length);
    const cx = col * phaseW + phaseW / 2;
    const cy = 36 + row * 40;
    const colors = ["#3B82F6", "#F59E0B", "#22C55E", "#A855F7"];
    const c = colors[i % colors.length];
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" stroke="#0B0F14" stroke-width="2.5"/>
      <text x="${cx}" y="${cy + 17}" text-anchor="middle" font-size="6.5" fill="#B8C1CC" font-family="Inter, sans-serif" font-weight="600">${m.title.length > 18 ? m.title.slice(0, 18) + "..." : m.title}</text>`;
  }).join("");

  return `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${h}" fill="#111827" rx="12"/>
    ${phaseLabels}
    <line x1="0" y1="28" x2="${width}" y2="28" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
    ${dots}
  </svg>`;
}

// ─── PDF Export ───

export function exportPDF(report: ReportData): void {
  const bp = report.founder_blueprint;
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const totalScore = Math.round(
    (report.evaluation.market_opportunity + report.evaluation.competition +
     report.evaluation.technical_feasibility + report.evaluation.monetization +
     report.evaluation.distribution) / 5 * 10
  );

  const isGo = totalScore >= 60;
  const scoreLabel = isGo ? "GO" : "REFINE";
  const scoreColor = isGo ? "#22C55E" : "#F59E0B";
  const scoreBg = isGo ? "#064e3b" : "#713f12";

  const sec = (s: number) => s >= 7 ? "#22C55E" : s >= 4 ? "#F59E0B" : "#EF4444";

  const radarLabels = ["Market\nOpportunity", "Competition", "Technical\nFeasibility", "Monetization", "Distribution"];
  const radarVals = [
    report.evaluation.market_opportunity,
    report.evaluation.competition,
    report.evaluation.technical_feasibility,
    report.evaluation.monetization,
    report.evaluation.distribution,
  ];

  const bestRec = bp?.executive_recommendations?.[0];
  const topRec = bestRec ? bestRec.action : report.evaluation.overall_verdict;
  const topRecReason = bestRec ? bestRec.reason : "Based on comprehensive analysis across all dimensions.";
  const topRecOutcome = bestRec ? bestRec.expected_outcome : "Improved market positioning and execution readiness.";

  const dims: [string, number][] = [
    ["Market Opportunity", report.evaluation.market_opportunity],
    ["Competition", report.evaluation.competition],
    ["Technical Feasibility", report.evaluation.technical_feasibility],
    ["Monetization", report.evaluation.monetization],
    ["Distribution", report.evaluation.distribution],
  ];
  const sortedDims = [...dims].sort((a, b) => b[1] - a[1]);
  const bestDim = sortedDims[0][0];
  const worstDim = sortedDims[sortedDims.length - 1][0];
  const bestScore = sortedDims[0][1];
  const worstScore = sortedDims[sortedDims.length - 1][1];

  const criticalRisk = report.risk_analysis.risks.length > 0
    ? report.risk_analysis.risks.reduce((a, b) => {
        const aw = a.probability === "High" ? 3 : a.probability === "Medium" ? 2 : 1;
        const bw = b.probability === "High" ? 3 : b.probability === "Medium" ? 2 : 1;
        return aw > bw ? a : b;
      })
    : null;

  document.title = `${report.idea} — Due Diligence Report`;

  const w = window.open("", "_blank");
  if (!w) return;

  // ─── Color palette ───
  const C = {
    bg: "#0B0F14",
    card: "#111827",
    panel: "#1A2233",
    border: "rgba(255,255,255,0.08)",
    text: "#F5F7FA",
    sec: "#B8C1CC",
    muted: "#8B95A7",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    accent: "#3B82F6",
  };

  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.idea} — Due Diligence Report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Inter, "SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: ${C.text}; background: ${C.bg};
    font-size: 11pt; line-height: 1.65;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  .page {
    width: 210mm; min-height: 297mm;
    padding: 22mm 24mm;
    position: relative;
    page-break-after: always;
    background: ${C.bg};
  }
  .page:last-child { page-break-after: auto; }

  .footer {
    position: absolute; bottom: 10mm; left: 24mm; right: 24mm;
    font-size: 7pt; color: ${C.muted};
    display: flex; justify-content: space-between;
    border-top: 0.5pt solid ${C.border}; padding-top: 5pt;
  }

  /* Typography */
  h1 { font-size: 30pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; color: ${C.text}; }
  h2 { font-size: 24pt; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; color: ${C.text}; margin-bottom: 12pt; }
  h3 { font-size: 18pt; font-weight: 600; line-height: 1.3; color: ${C.text}; margin-bottom: 10pt; }
  h4 { font-size: 13pt; font-weight: 600; color: ${C.text}; margin-bottom: 6pt; }
  p  { font-size: 10.5pt; line-height: 1.65; color: ${C.sec}; margin-bottom: 8pt; }
  .cap { font-size: 8pt; color: ${C.muted}; letter-spacing: 0.04em; }
  .sm  { font-size: 9pt; color: ${C.sec}; }
  .xs  { font-size: 7.5pt; color: ${C.muted}; }

  /* Cover */
  .c-top { margin-bottom: 48pt; }
  .c-label { font-size: 9pt; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.muted}; }
  .c-title { font-size: 44pt; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: ${C.text}; margin-top: 12pt; margin-bottom: 8pt; }
  .c-meta { font-size: 9pt; color: ${C.muted}; }
  .c-score { display: flex; align-items: center; gap: 18pt; margin-bottom: 32pt; }
  .c-badge {
    display: inline-flex; align-items: center; gap: 12pt;
    padding: 10pt 22pt; border-radius: 12pt;
    background: ${scoreBg}; border: 1pt solid ${scoreColor}50;
  }
  .c-badge-lbl { font-size: 16pt; font-weight: 800; color: ${scoreColor}; letter-spacing: 0.08em; }
  .c-badge-num { font-size: 32pt; font-weight: 800; color: ${C.text}; }
  .c-badge-den { font-size: 14pt; font-weight: 400; color: ${C.muted}; }
  .c-desc { font-size: 11pt; color: ${C.sec}; line-height: 1.7; max-width: 75%; }

  /* Section header */
  .sec-hdr { margin-bottom: 18pt; }
  .sec-hdr .bar { width: 36pt; height: 2.5pt; background: ${C.accent}; margin-bottom: 8pt; border-radius: 2pt; }
  .sec-hdr .sub { font-size: 8.5pt; font-weight: 500; color: ${C.muted}; letter-spacing: 0.12em; text-transform: uppercase; }
  .sec-hdr h2 { margin-bottom: 2pt; }

  /* Cards */
  .card {
    background: ${C.card}; border: 0.5pt solid ${C.border};
    border-radius: 12pt; padding: 18pt 20pt;
    break-inside: avoid;
  }
  .card-sm {
    background: ${C.card}; border: 0.5pt solid ${C.border};
    border-radius: 10pt; padding: 14pt 16pt;
    break-inside: avoid;
  }
  .card-label { font-size: 7.5pt; font-weight: 600; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4pt; }
  .card-val  { font-size: 11pt; font-weight: 600; color: ${C.text}; }

  /* Grids */
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16pt; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14pt; }
  .g4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12pt; }
  .g5 { display: flex; gap: 10pt; }
  .g5 > * { flex: 1; }
  .gap-b { margin-bottom: 16pt; }

  /* KPI mini */
  .kpi {
    background: ${C.card}; border: 0.5pt solid ${C.border};
    border-radius: 10pt; padding: 12pt 14pt;
  }
  .kpi-num { font-size: 20pt; font-weight: 700; }
  .kpi-lbl { font-size: 7.5pt; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2pt; }

  /* Tables */
  .tbl-wrap { border: 0.5pt solid ${C.border}; border-radius: 10pt; overflow: hidden; margin-top: 4pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th {
    text-align: left; padding: 8pt 12pt; font-weight: 600;
    color: ${C.muted}; text-transform: uppercase; font-size: 7pt; letter-spacing: 0.06em;
    background: ${C.panel}; border-bottom: 0.5pt solid ${C.border};
  }
  td {
    padding: 7pt 12pt; border-bottom: 0.5pt solid rgba(255,255,255,0.04);
    color: ${C.sec}; vertical-align: top; font-size: 8.5pt;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: rgba(255,255,255,0.02); }

  /* Persona */
  .pers {
    background: ${C.card}; border: 0.5pt solid ${C.border};
    border-radius: 12pt; padding: 20pt; break-inside: avoid;
  }
  .pers-name { font-size: 14pt; font-weight: 700; color: ${C.text}; margin-bottom: 10pt; }
  .pers-g { display: grid; grid-template-columns: 1fr 1fr; gap: 3pt; }
  .pers-a { font-size: 8.5pt; color: ${C.sec}; padding: 2pt 0; }
  .pers-a .lbl { color: ${C.muted}; }

  /* Milestone */
  .ms {
    border-left: 3pt solid ${C.accent}; padding: 3pt 0 3pt 10pt;
    margin-bottom: 10pt; break-inside: avoid;
  }
  .ms-t { font-size: 10pt; font-weight: 600; color: ${C.text}; }
  .ms-m { font-size: 8pt; color: ${C.muted}; margin-top: 2pt; }

  /* Risk */
  .rk { break-inside: avoid; margin-bottom: 8pt; background: ${C.card}; border: 0.5pt solid ${C.border}; border-radius: 10pt; padding: 12pt 14pt; }
  .rk-n { font-size: 9.5pt; font-weight: 600; color: ${C.text}; }

  /* Recommendation */
  .rec { break-inside: avoid; background: ${C.card}; border: 0.5pt solid ${C.border}; border-radius: 10pt; padding: 12pt 14pt; margin-bottom: 8pt; }
  .rec-t { font-size: 10pt; font-weight: 600; color: ${C.text}; }

  /* Tags */
  .tag {
    display: inline-block; padding: 1pt 8pt; border-radius: 4pt;
    font-size: 6.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  }

  /* Journey */
  .jny { display: flex; align-items: center; gap: 4pt; margin-top: 12pt; flex-wrap: wrap; }
  .jny-s { padding: 5pt 10pt; border: 0.5pt solid ${C.border}; border-radius: 6pt; font-size: 7.5pt; color: ${C.sec}; background: ${C.card}; }
  .jny-a { font-size: 10pt; color: ${C.muted}; }

  /* Memo section */
  .memo { margin-bottom: 20pt; }
  .memo h4 { font-size: 13pt; font-weight: 600; color: ${C.text}; margin-bottom: 6pt; }
  .memo p { font-size: 10.5pt; color: ${C.sec}; line-height: 1.7; }
  .memo ul { list-style: none; font-size: 10pt; color: ${C.sec}; line-height: 1.7; }
  .memo ul li { padding-left: 14pt; position: relative; }
  .memo ul li::before { content: "\u2014"; position: absolute; left: 0; color: ${C.muted}; }

  /* Detail blocks */
  .db { margin-bottom: 10pt; }
  .db .dl { font-size: 7pt; font-weight: 600; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2pt; }
  .db .dv { font-size: 9.5pt; color: ${C.text}; font-weight: 500; }

  /* Misc */
  .src { font-size: 8pt; color: ${C.muted}; padding: 2pt 0; word-break: break-all; }
  .spacer { height: 24pt; }

  /* Keep together */
  .kt { break-inside: avoid; }

  /* Progress bar */
  .pbar { display: flex; align-items: center; gap: 8pt; margin-top: 4pt; }
  .pbar-track { flex: 1; height: 6pt; background: ${C.panel}; border-radius: 3pt; overflow: hidden; }
  .pbar-fill { height: 100%; border-radius: 3pt; }
</style></head><body>

<!-- ═══════════════════════════ PAGE 1: COVER ═══════════════════════════ -->
<div class="page">
  <div class="c-top">
    <div class="c-label">Due Diligence Report</div>
    <div class="c-title">${report.idea}</div>
    <div class="c-meta">
      Generated ${now} &nbsp;·&nbsp; Prepared by Startup Intelligence Engine &nbsp;·&nbsp; Confidential
    </div>
  </div>

  <div class="c-score">
    <div class="c-badge">
      <span class="c-badge-lbl">${scoreLabel}</span>
      <span><span class="c-badge-num">${totalScore}</span><span class="c-badge-den">/100</span></span>
    </div>
  </div>

  <p class="c-desc">
    ${report.evaluation.overall_verdict}. ${bp?.verdict_explanation ?? `A ${report.market_research.growth_direction.toLowerCase()} opportunity in the ${report.market_research.industry} space with a ${report.market_research.market_maturity.toLowerCase()} market structure.`}
  </p>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>1 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 2: EXECUTIVE SUMMARY ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 2</div>
    <h2>Executive Summary</h2>
  </div>

  <div class="g2 gap-b">
    <div class="card-sm">
      <div style="display:flex;align-items:center;gap:8pt;margin-bottom:4pt">
        <span class="tag" style="background:${scoreBg};color:${scoreColor}">${scoreLabel}</span>
        <span style="font-size:18pt;font-weight:700;color:${C.text}">${totalScore}/100</span>
      </div>
      <p class="sm">${report.evaluation.overall_verdict} — ${report.evaluation.confidence_score}% confidence</p>
    </div>
    <div class="card-sm">
      <div class="card-label">Investment Recommendation</div>
      <div style="font-size:11pt;font-weight:600;color:${C.text};margin-top:2pt">${topRec}</div>
      <p class="sm" style="margin-top:3pt">${topRecReason}</p>
    </div>
  </div>

  <div style="margin-bottom:14pt">
    <div class="card-label" style="font-size:8pt;margin-bottom:6pt">Business Snapshot</div>
    <div class="tbl-wrap">
    <table>
      <tr><th style="width:22%">Dimension</th><th style="width:58%">Detail</th><th style="width:20%;text-align:right">Score</th></tr>
      <tr><td style="font-weight:600">Market</td><td>${report.market_research.industry} — ${report.market_research.growth_direction}</td><td style="text-align:right;color:${sec(report.evaluation.market_opportunity)};font-weight:600">${report.evaluation.market_opportunity}/10</td></tr>
      <tr><td style="font-weight:600">Customers</td><td>${(bp?.target_audience ?? []).map((p) => p.title).join(", ") || "Defined during evaluation"}</td><td style="text-align:right;color:${sec(report.evaluation.distribution)};font-weight:600">${report.evaluation.distribution}/10</td></tr>
      <tr><td style="font-weight:600">Revenue Model</td><td>${(bp?.monetization_models ?? []).find((m) => m.recommendation === "Recommended")?.model || "Multiple models"}</td><td style="text-align:right;color:${sec(report.evaluation.monetization)};font-weight:600">${report.evaluation.monetization}/10</td></tr>
      <tr><td style="font-weight:600">Stage</td><td>${report.market_research.market_maturity}</td><td style="text-align:right;color:${sec(report.evaluation.technical_feasibility)};font-weight:600">${report.evaluation.technical_feasibility}/10</td></tr>
    </table>
    </div>
  </div>

  <div class="g2">
    <div class="card-sm">
      <div class="card-label">Key Opportunity</div>
      <div style="font-size:10pt;font-weight:500;color:${C.text};margin-top:3pt">${report.market_research.demand_drivers[0]?.driver || "Market opportunity identified"}</div>
      <p class="sm" style="margin-top:2pt">${report.market_research.demand_drivers[0]?.evidence || ""}</p>
    </div>
    <div class="card-sm">
      <div class="card-label">Critical Risk</div>
      <div style="font-size:10pt;font-weight:500;color:${C.text};margin-top:3pt">${criticalRisk?.risk_name || "No critical risks identified"}</div>
      <p class="sm" style="margin-top:2pt">${criticalRisk?.evidence || ""}</p>
    </div>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>2 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 3: INVESTMENT MEMO ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 3</div>
    <h2>Investment Memo</h2>
  </div>

  <div class="memo">
    <h4>Opportunity</h4>
    <p>${report.market_research.industry} presents a <strong style="color:${C.text}">${report.market_research.growth_direction.toLowerCase()}</strong> opportunity in a <strong style="color:${C.text}">${report.market_research.market_maturity.toLowerCase()}</strong> market. ${report.market_research.demand_drivers.slice(0, 2).map((d) => d.driver).join(". ")}.</p>
  </div>

  <div class="memo">
    <h4>Why Now</h4>
    <p>${report.market_research.growth_direction === "High Growth" ? "Market conditions are favorable with strong tailwinds." : report.market_research.growth_direction === "Stable" ? "The market is mature but presents steady opportunities for differentiation." : "Early movers are establishing positioning in an expanding market."} Market maturity is <strong style="color:${C.text}">${report.market_research.market_maturity.toLowerCase()}</strong>, suggesting ${report.market_research.market_maturity === "Growing" ? "timely entry before saturation." : report.market_research.market_maturity === "Established" ? "differentiation through specialization." : "execution-focused capture of existing demand."}</p>
  </div>

  <div class="memo">
    <h4>Market Timing</h4>
    <p>${report.market_research.growth_direction} trajectory with ${report.market_research.demand_drivers.length} identified demand drivers and ${report.market_research.key_risks.length} key risk factors. Market research confidence: <strong style="color:${C.text}">${report.market_research.confidence}%</strong>.</p>
  </div>

  <div class="memo">
    <h4>Founder Advantage</h4>
    <p>${bp?.verdict ? `Assessment: ${bp.verdict}. ` : ""}Overall evaluation confidence of <strong style="color:${C.text}">${report.evaluation.confidence_score}%</strong> with a composite score of <strong style="color:${C.text}">${totalScore}/100</strong> (${scoreLabel}), indicating ${isGo ? "a viable opportunity ready for execution." : "an opportunity that requires refinement before pursuing."}</p>
  </div>

  <div class="memo">
    <h4>Key Unknowns</h4>
    <ul>${report.strategic_challenges.challenges.slice(0, 3).map((c) => `<li><strong style="color:${C.text}">${c.assumption}</strong>: ${c.why_wrong}</li>`).join("") || "<li>No significant unknowns identified.</li>"}</ul>
  </div>

  <div class="memo">
    <h4>Recommendation</h4>
    <p style="font-size:11pt;font-weight:600;color:${C.text}">${topRec}</p>
    <p>${topRecReason} Expected outcome: ${topRecOutcome}.</p>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>3 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 4: STARTUP HEALTH ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 4</div>
    <h2>Startup Health</h2>
  </div>

  <div style="display:flex;gap:20pt;align-items:flex-start">
    <div class="kt">${radarChart(radarVals, radarLabels, 280, C.accent)}</div>
    <div style="flex:1">
      <div class="g2">
        ${[
          { label: "Market Opportunity", score: report.evaluation.market_opportunity, color: sec(report.evaluation.market_opportunity) },
          { label: "Competition", score: report.evaluation.competition, color: sec(report.evaluation.competition) },
          { label: "Monetization", score: report.evaluation.monetization, color: sec(report.evaluation.monetization) },
          { label: "Distribution", score: report.evaluation.distribution, color: sec(report.evaluation.distribution) },
          { label: "Technical Feasibility", score: report.evaluation.technical_feasibility, color: sec(report.evaluation.technical_feasibility) },
        ].map((k) => `
        <div class="kpi" style="border-color:${k.color}30">
          <div class="kpi-num" style="color:${k.color}">${k.score}<span style="font-size:11pt;color:${C.muted}">/10</span></div>
          <div class="kpi-lbl">${k.label}</div>
        </div>`).join("")}
      </div>
    </div>
  </div>

  <div class="card-sm" style="margin-top:16pt">
    <p style="font-size:10pt;color:${C.sec};line-height:1.7;margin:0">
      <strong style="color:${C.text}">Health Assessment:</strong> ${report.idea} scores <strong style="color:${C.text}">${totalScore}/100</strong> overall. The strongest dimension is <strong style="color:${C.text}">${bestDim}</strong> (${bestScore}/10), while <strong style="color:${C.text}">${worstDim}</strong> (${worstScore}/10) presents the primary improvement area. ${isGo ? "The overall assessment supports proceeding with execution." : "Focused refinement in weaker areas is recommended before scaling."}
    </p>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>4 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 5: MARKET INTELLIGENCE ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 5</div>
    <h2>Market Intelligence</h2>
  </div>

  <div class="g3 gap-b">
    <div class="card-sm">
      <div class="card-label">Market Size</div>
      <div style="font-size:11pt;font-weight:600;color:${C.text};margin-top:3pt">${report.market_research.industry}</div>
      <p class="sm">${report.market_research.market_maturity} market</p>
    </div>
    <div class="card-sm">
      <div class="card-label">Growth Direction</div>
      <div style="font-size:11pt;font-weight:600;color:${C.text};margin-top:3pt">${report.market_research.growth_direction}</div>
      <p class="sm">${report.market_research.market_maturity} sector</p>
    </div>
    <div class="card-sm">
      <div class="card-label">Analysis Confidence</div>
      <div style="font-size:11pt;font-weight:600;color:${C.text};margin-top:3pt">${report.market_research.confidence}%</div>
      <p class="sm">Research quality rating</p>
    </div>
  </div>

  <div class="g2 gap-b">
    <div>
      <div class="card-label" style="margin-bottom:6pt">Growth Drivers</div>
      ${report.market_research.demand_drivers.slice(0, 4).map((d) => `
      <div class="db">
        <div style="font-size:9.5pt;font-weight:600;color:${C.text}">${d.driver}</div>
        <p class="xs">${d.evidence}</p>
      </div>`).join("")}
    </div>
    <div>
      <div class="card-label" style="margin-bottom:6pt">Key Risks</div>
      ${report.market_research.key_risks.slice(0, 4).map((r) => `
      <div class="db">
        <div style="font-size:9.5pt;font-weight:600;color:${C.warning}">${r.risk}</div>
        <p class="xs">${r.why_it_matters}</p>
      </div>`).join("")}
    </div>
  </div>

  <div>
    <div class="card-label" style="margin-bottom:6pt">Growth Trajectory</div>
    ${barChart(
      [
        { label: "2024", value: Math.max(1, Math.round(report.evaluation.market_opportunity * 3 + 2)), color: "#334155" },
        { label: "2025", value: Math.max(2, Math.round(report.evaluation.market_opportunity * 4 + 3)), color: "#475569" },
        { label: "2026", value: Math.max(3, Math.round(report.evaluation.market_opportunity * 5 + 5)), color: "#64748b" },
        { label: "2027", value: Math.max(4, Math.round(report.evaluation.market_opportunity * 6 + 7)), color: "#94a3b8" },
        { label: "2028", value: Math.max(5, Math.round(report.evaluation.market_opportunity * 7 + 9)), color: C.accent },
      ], 490, 200
    )}
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>5 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 6: TARGET CUSTOMERS ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 6</div>
    <h2>Target Customers</h2>
  </div>

  ${(bp?.target_audience ?? []).length ? bp!.target_audience.map((p, i) => `
  <div class="pers"${i > 0 ? ' style="margin-top:14pt"' : ""}>
    <div class="pers-name">${p.title} ${i === 0 ? '<span class="tag" style="background:rgba(59,130,246,0.15);color:#3B82F6;margin-left:8pt;vertical-align:middle">Primary</span>' : ""}</div>
    <div class="pers-g">
      <div class="pers-a"><span class="lbl">Industry:</span> ${p.industry}</div>
      <div class="pers-a"><span class="lbl">Company Size:</span> ${p.company_size}</div>
      <div class="pers-a"><span class="lbl">Budget Range:</span> ${p.budget_range}</div>
      <div class="pers-a"><span class="lbl">Urgency:</span> ${p.urgency}</div>
      <div class="pers-a"><span class="lbl">Buying Trigger:</span> ${p.buying_trigger}</div>
      <div class="pers-a"><span class="lbl">Buying Objection:</span> ${p.buying_objection}</div>
      <div class="pers-a"><span class="lbl">Expected LTV:</span> ${p.expected_lifetime_value}</div>
    </div>
  </div>`).join("") : '<p class="sm">No persona data available.</p>'}

  <div class="kt" style="margin-top:18pt">
    <div class="card-label" style="margin-bottom:6pt">Customer Journey</div>
    <div class="jny">
      <span class="jny-s">Problem Awareness</span>
      <span class="jny-a">→</span>
      <span class="jny-s">Research &amp; Compare</span>
      <span class="jny-a">→</span>
      <span class="jny-s">Evaluation</span>
      <span class="jny-a">→</span>
      <span class="jny-s">Purchase</span>
      <span class="jny-a">→</span>
      <span class="jny-s">Retention &amp; Expansion</span>
    </div>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>6 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 7: COMPETITION ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 7</div>
    <h2>Competitive Landscape</h2>
  </div>

  <div class="tbl-wrap" style="margin-bottom:16pt">
  <table>
    <tr>
      <th style="width:15%">Dimension</th>
      <th style="width:21%">You</th>
      ${report.competitor_analysis.competitors.slice(0, 3).map(() => '<th style="width:21%">Competitor</th>').join("")}
    </tr>
    <tr>
      <td style="font-weight:600">Pricing</td>
      <td>${(bp?.monetization_models ?? []).find((m) => m.recommendation === "Recommended")?.model || "Competitive"}</td>
      ${report.competitor_analysis.competitors.slice(0, 3).map(() => '<td class="sm">Market standard</td>').join("")}
    </tr>
    <tr>
      <td style="font-weight:600">Differentiation</td>
      <td style="color:${C.success};font-weight:600">${report.competitor_analysis.competitors[0]?.opportunity_for_founder?.split(".")[0] || "Unique positioning"}</td>
      ${report.competitor_analysis.competitors.slice(0, 3).map((c) => `<td>${c.strength.split(".")[0]}</td>`).join("")}
    </tr>
    <tr>
      <td style="font-weight:600">Weakness</td>
      <td style="color:${C.danger}">${report.strategic_challenges.challenges[0]?.assumption?.split(".")[0] || "Execution risk"}</td>
      ${report.competitor_analysis.competitors.slice(0, 3).map((c) => `<td style="color:${C.danger}">${c.weakness.split(".")[0]}</td>`).join("")}
    </tr>
    <tr>
      <td style="font-weight:600">Target</td>
      <td>${(bp?.target_audience ?? [])[0]?.industry || "Defined segment"}</td>
      ${report.competitor_analysis.competitors.slice(0, 3).map((c) => `<td>${c.typical_customer}</td>`).join("")}
    </tr>
  </table>
  </div>

  <div style="text-align:center">
    <div class="card-label" style="margin-bottom:8pt">Competitive Positioning Map</div>
    ${competitivePositioning(
      [
        { name: report.idea.length > 16 ? report.idea.slice(0, 16) + "..." : report.idea, x: report.evaluation.market_opportunity, y: report.evaluation.monetization, size: 2.2, color: C.accent },
        ...report.competitor_analysis.competitors.slice(0, 4).map((c, i) => ({
          name: c.name.length > 16 ? c.name.slice(0, 16) + "..." : c.name,
          x: Math.max(1, 8 - i * 1.5),
          y: Math.max(1, 7 - i),
          size: 1.6,
          color: ["#EF4444", "#F59E0B", "#A855F7", "#22C55E"][i],
        })),
      ],
      480, 270
    )}
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>7 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 8: BUSINESS MODEL ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 8</div>
    <h2>Business Model</h2>
  </div>

  <div class="g2 gap-b">
    <div>
      <div class="card-label" style="margin-bottom:6pt">Revenue Streams</div>
      ${(bp?.monetization_models ?? []).length ? `
      <div class="tbl-wrap">
      <table>
        <tr><th>Model</th><th>Difficulty</th><th>Scalability</th><th>Cash Flow</th><th></th></tr>
        ${bp!.monetization_models.map((m) => `
        <tr>
          <td style="font-weight:600">${m.model}</td>
          <td class="xs">${m.implementation_difficulty}</td>
          <td class="xs">${m.scalability}</td>
          <td class="xs">${m.cash_flow}</td>
          <td style="text-align:center">${m.recommendation === "Recommended" ? '<span style="color:' + C.success + ';font-weight:600">★</span>' : ""}</td>
        </tr>`).join("")}
      </table>
      </div>` : '<p class="sm">No monetization data available.</p>'}
    </div>
    <div style="text-align:center">
      ${(bp?.monetization_models ?? []).length ? pieChart(
        bp!.monetization_models.map((m, i) => ({
          label: m.model,
          value: m.recommendation === "Recommended" ? 4 : 1,
          color: ["#3B82F6", "#F59E0B", "#22C55E", "#A855F7", "#EF4444"][i % 5],
        })),
        240
      ) : ""}
    </div>
  </div>

  <div style="margin-bottom:14pt">
    <div class="card-label" style="margin-bottom:6pt">Key Assumptions</div>
    <div class="g3">
      <div class="card-sm">
        <div class="card-label">CAC Estimate</div>
        <p class="sm" style="margin-top:3pt">Based on ${(bp?.acquisition_channels ?? []).length || "multiple"} acquisition channels including ${(bp?.acquisition_channels ?? []).map((c) => c.platform).join(", ") || "various channels"}.</p>
      </div>
      <div class="card-sm">
        <div class="card-label">LTV Estimate</div>
        <p class="sm" style="margin-top:3pt">${(bp?.target_audience ?? [])[0]?.expected_lifetime_value || "Estimated based on market benchmarks"}.</p>
      </div>
      <div class="card-sm">
        <div class="card-label">Margins</div>
        <p class="sm" style="margin-top:3pt">${report.evaluation.monetization >= 7 ? "Strong margin potential due to scalable model." : report.evaluation.monetization >= 4 ? "Moderate margins with room for optimization." : "Margin improvement needed for sustainable growth."}</p>
      </div>
    </div>
  </div>

  <div class="card-sm">
    <div class="card-label">Scaling Difficulty</div>
    <div class="pbar">
      <div class="pbar-track"><div class="pbar-fill" style="width:${report.evaluation.technical_feasibility * 10}%;background:${sec(report.evaluation.technical_feasibility)}"></div></div>
      <span style="font-size:10pt;font-weight:600;color:${sec(report.evaluation.technical_feasibility)}">${report.evaluation.technical_feasibility}/10</span>
    </div>
    <p class="xs" style="margin-top:4pt">${report.evaluation.technical_feasibility >= 7 ? "Infrastructure supports rapid scaling." : report.evaluation.technical_feasibility >= 4 ? "Moderate scaling complexity; plan for incremental growth." : "Significant technical investment required before scaling."}</p>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>8 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 9: RISK REGISTER ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 9</div>
    <h2>Risk Register</h2>
  </div>

  <div style="display:flex;gap:16pt;margin-bottom:18pt">
    <div class="kt">${riskMatrix(
      report.risk_analysis.risks.map((r) => ({ name: r.risk_name, prob: r.probability, impact: r.impact })),
      220
    )}</div>
    <div style="flex:1">
      <div class="card-label" style="margin-bottom:8pt">Risk Summary</div>
      <div class="g3" style="gap:8pt">
        <div class="card-sm" style="text-align:center;padding:10pt">
          <div style="font-size:16pt;font-weight:700;color:${C.danger}">${report.risk_analysis.risks.filter((r) => r.probability === "High").length || 0}</div>
          <div class="cap">High</div>
        </div>
        <div class="card-sm" style="text-align:center;padding:10pt">
          <div style="font-size:16pt;font-weight:700;color:${C.warning}">${report.risk_analysis.risks.filter((r) => r.probability === "Medium").length || 0}</div>
          <div class="cap">Medium</div>
        </div>
        <div class="card-sm" style="text-align:center;padding:10pt">
          <div style="font-size:16pt;font-weight:700;color:${C.success}">${report.risk_analysis.risks.filter((r) => r.probability === "Low").length || 0}</div>
          <div class="cap">Low</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card-label" style="margin-bottom:8pt">Top Risks &amp; Mitigation</div>
  ${report.risk_analysis.risks.slice(0, 5).map((r) => {
    const pc = r.probability === "High" ? C.danger : r.probability === "Medium" ? C.warning : C.success;
    return `<div class="rk">
      <div style="display:flex;align-items:center;gap:8pt;margin-bottom:3pt">
        <span class="rk-n">${r.risk_name}</span>
        <span class="tag" style="background:${pc}18;color:${pc}">${r.probability}/${r.impact}</span>
      </div>
      <p class="xs">${r.evidence}</p>
      <p style="font-size:8.5pt;color:${C.success};margin-top:2pt"><strong>Mitigation:</strong> ${r.mitigation_strategy}</p>
      <p class="xs" style="margin-top:1pt">Warning: ${r.early_warning_signal} | Owner: ${r.owner}</p>
    </div>`;
  }).join("")}

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>9 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 10: ACTION PLAN ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 10</div>
    <h2>Action Plan</h2>
  </div>

  ${(bp?.launch_plan_90_days ?? []).length ? `
  <div style="margin-bottom:16pt">
    <div class="card-label" style="margin-bottom:8pt">Implementation Roadmap</div>
    <div class="kt">${timelineChart(
      bp!.launch_plan_90_days.map((m) => ({ title: m.title })),
      490
    )}</div>
  </div>

  <div class="card-label" style="margin-bottom:8pt">Milestones</div>
  ${bp!.launch_plan_90_days.map((m, i) => {
    const colors = ["#3B82F6", "#F59E0B", "#22C55E", "#A855F7"];
    const cl = colors[i % colors.length];
    return `<div class="ms" style="border-left-color:${cl}">
      <div class="ms-t">${m.title}</div>
      <div class="ms-m"><strong>Objective:</strong> ${m.objective}</div>
      <div class="ms-m"><strong>Action:</strong> ${m.action}</div>
      <div class="ms-m"><strong>Expected Result:</strong> ${m.expected_result}</div>
      <div class="ms-m"><strong>Success Metric:</strong> ${m.success_metric}</div>
    </div>`;
  }).join("")}` : '<p class="sm">No action plan data available.</p>'}

  ${(bp?.executive_recommendations ?? []).length ? `
  <div style="margin-top:16pt">
    <div class="card-label" style="margin-bottom:8pt">Executive Recommendations</div>
    ${bp!.executive_recommendations.map((r) => {
      const pc = r.priority === "High" ? C.danger : r.priority === "Medium" ? C.warning : C.success;
      return `<div class="rec">
        <div class="rec-t">${r.action}</div>
        <p class="sm" style="margin-top:3pt">${r.reason}</p>
        <div style="display:flex;gap:10pt;margin-top:4pt">
          <span class="tag" style="background:${pc}18;color:${pc}">${r.priority}</span>
          <span class="xs">${r.time_horizon}</span>
          <span class="xs" style="color:${C.success}">${r.expected_outcome}</span>
        </div>
      </div>`;
    }).join("")}
  </div>` : ""}

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>10 / 11</span>
  </div>
</div>

<!-- ═══════════════════════════ PAGE 11: APPENDIX ═══════════════════════════ -->
<div class="page">
  <div class="sec-hdr">
    <div class="bar"></div>
    <div class="sub">Page 11</div>
    <h2>Appendix</h2>
  </div>

  <div class="card-sm" style="margin-bottom:14pt">
    <h4 style="font-size:13pt;margin-bottom:4pt">Questionnaire Responses</h4>
    <p class="sm">The initial founder questionnaire provided context on the startup idea, target market, and business model. Responses informed the adaptive interview and subsequent analysis.</p>
  </div>

  <div class="card-sm" style="margin-bottom:14pt">
    <h4 style="font-size:13pt;margin-bottom:4pt">Sources</h4>
    ${report.market_research.sources.length ? report.market_research.sources.map((s) => `<div class="src">${s}</div>`).join("") : '<p class="sm">No external sources were referenced.</p>'}
  </div>

  <div class="card-sm" style="margin-bottom:14pt">
    <h4 style="font-size:13pt;margin-bottom:4pt">Methodology</h4>
    <p class="sm">This report was generated by the Startup Intelligence Engine, an AI-powered analysis platform. The evaluation combines web research, market data analysis, and multi-agent LLM reasoning across 8 specialized dimensions: market research, competitor analysis, risk assessment, strategic challenge identification, improvement planning, evaluation scoring, founder blueprint generation, and MVP recommendation.</p>
  </div>

  <div class="card-sm" style="margin-bottom:14pt">
    <h4 style="font-size:13pt;margin-bottom:4pt">Confidence &amp; Score Calculation</h4>
    <p class="sm">Overall confidence: <strong style="color:${C.text}">${report.evaluation.confidence_score}%</strong>. Market research confidence: <strong style="color:${C.text}">${report.market_research.confidence}%</strong>. The composite score (${totalScore}/100) is derived from five equally-weighted dimensions: Market Opportunity (${report.evaluation.market_opportunity}/10), Competition (${report.evaluation.competition}/10), Technical Feasibility (${report.evaluation.technical_feasibility}/10), Monetization (${report.evaluation.monetization}/10), and Distribution (${report.evaluation.distribution}/10).</p>
  </div>

  <div class="card-sm" style="margin-bottom:14pt">
    <h4 style="font-size:13pt;margin-bottom:4pt">Score Breakdown</h4>
    <div class="tbl-wrap">
    <table>
      <tr><th>Dimension</th><th style="text-align:right">Score</th><th style="text-align:right">Weight</th><th style="text-align:right">Contribution</th></tr>
      ${[
        { label: "Market Opportunity", score: report.evaluation.market_opportunity },
        { label: "Competition", score: report.evaluation.competition },
        { label: "Technical Feasibility", score: report.evaluation.technical_feasibility },
        { label: "Monetization", score: report.evaluation.monetization },
        { label: "Distribution", score: report.evaluation.distribution },
      ].map((d) => `<tr>
        <td>${d.label}</td>
        <td style="text-align:right;color:${sec(d.score)};font-weight:600">${d.score}/10</td>
        <td style="text-align:right">20%</td>
        <td style="text-align:right;font-weight:600">${d.score * 2}/20</td>
      </tr>`).join("")}
      <tr style="border-top:0.5pt solid ${C.border}"><td style="font-weight:700">Total</td><td></td><td style="text-align:right">100%</td><td style="text-align:right;font-weight:700;font-size:10pt;color:${C.text}">${totalScore}/100</td></tr>
    </table>
    </div>
  </div>

  <div class="card-sm">
    <h4 style="font-size:13pt;margin-bottom:4pt">AI Limitations</h4>
    <p class="sm">This report is generated by artificial intelligence and should be treated as a supplementary analysis tool, not as a substitute for professional due diligence, legal advice, or financial consulting. The analysis is based on publicly available information and AI reasoning, which may contain inaccuracies or biases. Always verify critical findings through independent research and consult qualified professionals before making investment decisions.</p>
  </div>

  <div class="footer">
    <span>Startup Intelligence Engine — Confidential</span>
    <span>11 / 11</span>
  </div>
</div>

</body></html>`);

  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
