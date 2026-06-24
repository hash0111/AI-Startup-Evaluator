from pydantic import BaseModel
from typing import Optional


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


class MarketResearch(BaseModel):
    market: str
    market_growth: str
    opportunities: list[str]
    threats: list[str]
    sources: list[str]


class Competitor(BaseModel):
    name: str
    website: str
    type: str
    key_differentiator: str = ""
    source: str = ""


class CompetitorAnalysis(BaseModel):
    competitors: list[Competitor]


class RiskAnalysis(BaseModel):
    market_risk: str
    technical_risk: str
    distribution_risk: str
    monetization_risk: str


class ContrarianReport(BaseModel):
    weaknesses: list[str]


class Improvement(BaseModel):
    current: str
    improved: str
    reason: str


class ImprovementSuggestions(BaseModel):
    suggestions: list[Improvement]


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


class EvaluationReport(BaseModel):
    idea: str
    market_research: MarketResearch
    competitor_analysis: CompetitorAnalysis
    risk_analysis: RiskAnalysis
    contrarian_report: ContrarianReport
    improvement_suggestions: ImprovementSuggestions
    mvp_recommendation: MVPRecommendation
    evaluation: EvaluationScore


class ProgressUpdate(BaseModel):
    step: str
    status: str
