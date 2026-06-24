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
)
from agents.founder_interview import generate_questions
from agents.research_agent import conduct_research
from agents.competitor_agent import discover_competitors
from agents.risk_agent import analyze_risks
from agents.contrarian_agent import generate_contrarian_report
from agents.improvement_agent import suggest_improvements
from agents.mvp_agent import recommend_mvp
from agents.evaluation_agent import evaluate


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

    market = await conduct_research(idea, req.answers)
    await asyncio.sleep(2.5)
    competitors = await discover_competitors(idea, full_context)
    await asyncio.sleep(2.5)
    risks = await analyze_risks(idea, full_context)
    await asyncio.sleep(2.5)
    contrarian = await generate_contrarian_report(idea, full_context)
    await asyncio.sleep(2.5)
    improvements = await suggest_improvements(idea, full_context)
    await asyncio.sleep(2.5)
    mvp = await recommend_mvp(idea, full_context)
    await asyncio.sleep(2.5)
    evaluation_score = await evaluate(
        idea, market, competitors, risks, contrarian, improvements, mvp
    )

    return EvaluationReport(
        idea=idea,
        market_research=market,
        competitor_analysis=competitors,
        risk_analysis=risks,
        contrarian_report=contrarian,
        improvement_suggestions=improvements,
        mvp_recommendation=mvp,
        evaluation=evaluation_score,
    )
