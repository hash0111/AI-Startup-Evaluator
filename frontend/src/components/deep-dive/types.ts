export interface DeepDiveData {
  executive_summary?: string;
  key_findings?: string[];
  detailed_analysis?: AnalysisBlock[];
  opportunities?: Opportunity[];
  risks?: Risk[];
  strategic_implications?: string[];
  recommendations?: Recommendation[];
  analyst_notes?: string;
  sources?: string[];
  market_data?: MarketData;
  competitive_landscape?: string;
  competitor_table?: CompetitorRow[];
  persona_table?: PersonaRow[];
  revenue_models?: RevenueModel[];
  unit_economics?: UnitEconomics;
  launch_timeline?: TimelinePhase[];
  channels?: ChannelRow[];
  risk_table?: RiskTableRow[];
  risk_heatmap?: string;
  risk_monitoring_plan?: string;
  positioning_recommendations?: PositioningRec[];
  competitive_advantages?: string[];
  competitive_threats?: CompetitiveThreat[];
  market_segmentation?: string;
}

export interface AnalysisBlock {
  heading: string;
  content: string;
  evidence?: string[];
}

export interface Opportunity {
  opportunity: string;
  impact?: string;
  effort?: string;
  timeframe?: string;
  revenue_impact?: string;
}

export interface Risk {
  risk?: string;
  severity?: string;
  mitigation?: string;
  description?: string;
  timeframe?: string;
}

export interface Recommendation {
  recommendation: string;
  rationale?: string;
  priority?: string;
}

export interface MarketData {
  tam?: string;
  sam?: string;
  som?: string;
  growth_rate?: string;
  market_maturity?: string;
}

export interface CompetitorRow {
  name?: string;
  strength?: string;
  weakness?: string;
  threat_level?: string;
  differentiator?: string;
}

export interface PersonaRow {
  name?: string;
  pain_points?: string[];
  ltv_estimate?: string;
}

export interface RevenueModel {
  model?: string;
  description?: string;
  margin?: string;
  risk?: string;
  recommendation?: string;
}

export interface UnitEconomics {
  cac?: string;
  ltv?: string;
  ltv_cac_ratio?: string;
}

export interface TimelinePhase {
  phase?: string;
  duration?: string;
  activities?: string[];
  milestones?: string[];
}

export interface ChannelRow {
  channel?: string;
  strategy?: string;
  expected_cac?: string;
  scale_potential?: string;
}

export interface RiskTableRow {
  risk?: string;
  category?: string;
  probability?: string;
  impact?: string;
  risk_score?: string;
  mitigation?: string;
}

export interface PositioningRec {
  strategy?: string;
  rationale?: string;
  expected_outcome?: string;
}

export interface CompetitiveThreat {
  threat?: string;
  severity?: string;
  timeframe?: string;
}
