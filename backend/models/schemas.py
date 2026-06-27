from pydantic import BaseModel
from typing import Optional, Literal


class InterviewQuestion(BaseModel):
    id: int
    question: str


class FounderInterviewRequest(BaseModel):
    idea: str


class FounderInterviewResponse(BaseModel):
    questions: list[InterviewQuestion]


class FounderAnswers(BaseModel):
    idea: str
    answers: list[str]


class ClassifyIdeaRequest(BaseModel):
    idea: str


class IdeaClassification(BaseModel):
    startup_type: str
    industry: str
    target_customer_suggestions: list[str]
    problem_suggestions: list[str]
    monetization_suggestions: list[str]
    assumptions: list[str]


class InterviewStepRequest(BaseModel):
    idea: str
    startup_type: str
    industry: str
    history: list[dict[str, str]]


class InterviewStepResponse(BaseModel):
    title: str | None
    description: str | None
    options: list[str]
    reasoning: str | None
    done: bool


class DemandDriver(BaseModel):
    driver: str
    evidence: str


class MarketKeyRisk(BaseModel):
    risk: str
    why_it_matters: str


class MarketResearch(BaseModel):
    industry: str
    growth_direction: str
    market_maturity: str
    demand_drivers: list[DemandDriver]
    key_risks: list[MarketKeyRisk]
    confidence: int = 75
    sources: list[str]


class CompetitorInsight(BaseModel):
    name: str
    strength: str
    weakness: str
    typical_customer: str
    opportunity_for_founder: str


class CompetitorAnalysis(BaseModel):
    competitors: list[CompetitorInsight]


class RiskItem(BaseModel):
    risk_name: str
    probability: str
    impact: str
    evidence: str
    mitigation_strategy: str
    early_warning_signal: str
    owner: str


class RiskAnalysis(BaseModel):
    risks: list[RiskItem]


class StrategicChallenge(BaseModel):
    assumption: str
    why_wrong: str
    evidence: str
    alternative_approach: str


class StrategicChallenges(BaseModel):
    challenges: list[StrategicChallenge]


class ImprovementAction(BaseModel):
    current_situation: str
    problem: str
    recommendation: str
    expected_impact: str
    estimated_difficulty: str
    priority: str
    timeline: str


class ImprovementSuggestions(BaseModel):
    suggestions: list[ImprovementAction]


class MVPBuildFirst(BaseModel):
    features: list[str]


class MVPBuildLater(BaseModel):
    features: list[str]


class MVPDoNotBuild(BaseModel):
    features: list[str]


class MVPRecommendation(BaseModel):
    build_first: MVPBuildFirst
    build_later: MVPBuildLater
    do_not_build: MVPDoNotBuild


class EvaluationScore(BaseModel):
    market_opportunity: int
    competition: int
    technical_feasibility: int
    monetization: int
    distribution: int
    overall_verdict: str
    confidence_score: int = 75


class Persona(BaseModel):
    title: str
    industry: str
    company_size: str
    budget_range: str
    buying_trigger: str
    buying_objection: str
    urgency: str
    expected_lifetime_value: str


class MonetizationOption(BaseModel):
    model: str
    implementation_difficulty: str
    revenue_predictability: str
    scalability: str
    cash_flow: str
    recommendation: str


class Milestone(BaseModel):
    title: str
    objective: str
    action: str
    expected_result: str
    success_metric: str


class AcquisitionChannel(BaseModel):
    platform: str
    strategy: str
    expected_outcome: str


class ToolRecommendation(BaseModel):
    category: str
    tool: str
    pricing: str


class ExecutiveRecommendation(BaseModel):
    action: str
    reason: str
    expected_outcome: str
    priority: str
    time_horizon: str


class FounderBlueprint(BaseModel):
    verdict: Literal["GO", "REFINE", "DROP"]
    verdict_explanation: str
    target_audience: list[Persona]
    monetization_models: list[MonetizationOption]
    launch_plan_90_days: list[Milestone]
    acquisition_channels: list[AcquisitionChannel]
    tools_stack: list[ToolRecommendation]
    executive_recommendations: list[ExecutiveRecommendation]


class EvaluationReport(BaseModel):
    idea: str
    market_research: MarketResearch
    competitor_analysis: CompetitorAnalysis
    risk_analysis: RiskAnalysis
    strategic_challenges: StrategicChallenges
    improvement_suggestions: ImprovementSuggestions
    mvp_recommendation: MVPRecommendation
    evaluation: EvaluationScore
    founder_blueprint: Optional[FounderBlueprint] = None


class ProgressUpdate(BaseModel):
    step: str
    status: str
