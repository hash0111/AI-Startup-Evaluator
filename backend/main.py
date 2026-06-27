import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from models.schemas import (
    FounderInterviewRequest,
    FounderInterviewResponse,
    InterviewQuestion,
    FounderAnswers,
    EvaluationReport,
    MarketResearch,
    DemandDriver,
    MarketKeyRisk,
    CompetitorAnalysis,
    CompetitorInsight,
    RiskAnalysis,
    RiskItem,
    StrategicChallenges,
    StrategicChallenge,
    ImprovementSuggestions,
    ImprovementAction,
    MVPRecommendation,
    MVPBuildFirst,
    MVPBuildLater,
    MVPDoNotBuild,
    EvaluationScore,
    ClassifyIdeaRequest,
    IdeaClassification,
    InterviewStepRequest,
    InterviewStepResponse,
)
from agents.founder_interview import generate_questions
from agents.research_agent import conduct_research
from agents.competitor_agent import discover_competitors
from agents.risk_agent import analyze_risks
from agents.contrarian_agent import generate_contrarian_report
from agents.improvement_agent import suggest_improvements
from agents.mvp_agent import recommend_mvp
from agents.evaluation_agent import evaluate
from agents.blueprint_generator import generate_blueprint
from agents.classifier_agent import classify_idea
from agents.interview_agent import generate_next_question


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Startup Evaluator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/classify-idea", response_model=IdeaClassification)
async def classify_startup_idea(req: ClassifyIdeaRequest):
    result = await classify_idea(req.idea)
    return IdeaClassification(**result)


@app.post("/api/interview/step", response_model=InterviewStepResponse)
async def interview_step(req: InterviewStepRequest):
    result = await generate_next_question(
        idea=req.idea,
        startup_type=req.startup_type,
        industry=req.industry,
        history=req.history,
    )
    return InterviewStepResponse(**result)


@app.post("/api/interview/questions", response_model=FounderInterviewResponse)
async def interview_questions(req: FounderInterviewRequest):
    questions = await generate_questions(req.idea)
    items = [
        InterviewQuestion(id=i + 1, question=q)
        for i, q in enumerate(questions)
    ]
    return FounderInterviewResponse(questions=items)


@app.post("/api/evaluate", response_model=EvaluationReport)
async def evaluate_startup(req: FounderAnswers):
    idea = req.idea
    answers_context = "\n".join(
        [f"Q{i+1}: {a}" for i, a in enumerate(req.answers)]
    )
    full_context = f"Startup Idea: {idea}\n\nFounder Responses:\n{answers_context}"
    if len(full_context) > 3000:
        full_context = full_context[:3000] + "\n...[truncated]"

    try:
        market = await conduct_research(idea, req.answers)
    except Exception as e:
        print(f"  Market research failed: {e}")
        market = MarketResearch(
            industry=idea, growth_direction="Growing", market_maturity="Growing",
            demand_drivers=[], key_risks=[], confidence=50, sources=[]
        )
    await asyncio.sleep(6)
    try:
        competitors = await discover_competitors(idea, full_context)
    except Exception as e:
        print(f"  Competitor discovery failed: {e}")
        competitors = CompetitorAnalysis(competitors=[])
    await asyncio.sleep(6)
    try:
        risks = await analyze_risks(idea, full_context)
    except Exception as e:
        print(f"  Risk analysis failed: {e}")
        risks = RiskAnalysis(risks=[])
    await asyncio.sleep(6)
    try:
        contrarian = await generate_contrarian_report(idea, full_context)
    except Exception as e:
        print(f"  Strategic challenges failed: {e}")
        contrarian = StrategicChallenges(challenges=[])
    await asyncio.sleep(6)
    try:
        improvements = await suggest_improvements(idea, full_context)
    except Exception as e:
        print(f"  Improvement suggestions failed: {e}")
        improvements = ImprovementSuggestions(suggestions=[])
    await asyncio.sleep(6)
    try:
        mvp = await recommend_mvp(idea, full_context)
    except Exception as e:
        print(f"  MVP recommendation failed: {e}")
        mvp = MVPRecommendation(
            build_first=MVPBuildFirst(features=["Core feature set"]),
            build_later=MVPBuildLater(features=["Advanced features"]),
            do_not_build=MVPDoNotBuild(features=["Non-essential features"]),
        )
    await asyncio.sleep(6)
    try:
        evaluation_score = await evaluate(
            idea, market, competitors, risks, contrarian, improvements, mvp
        )
    except Exception as e:
        print(f"  Evaluation failed: {e}")
        evaluation_score = EvaluationScore(
            market_opportunity=5, competition=5, technical_feasibility=5,
            monetization=5, distribution=5, overall_verdict="Unable to Evaluate",
            confidence_score=50,
        )
    await asyncio.sleep(6)
    try:
        blueprint = await generate_blueprint(
            idea, req.answers, market, competitors, risks, contrarian, improvements, mvp, evaluation_score
        )
    except Exception as e:
        print(f"  Blueprint generation failed: {e}")
        blueprint = None

    return EvaluationReport(
        idea=idea,
        market_research=market,
        competitor_analysis=competitors,
        risk_analysis=risks,
        strategic_challenges=contrarian,
        improvement_suggestions=improvements,
        mvp_recommendation=mvp,
        evaluation=evaluation_score,
        founder_blueprint=blueprint,
    )
