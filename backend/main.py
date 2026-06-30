import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from models.schemas import (
    FounderAnswers,
    EvaluationReport,
    ClassifyIdeaRequest,
    IdeaClassification,
    InterviewStepRequest,
    InterviewStepResponse,
    FounderInterviewRequest,
    FounderInterviewResponse,
    InterviewQuestion,
)
from services.mistral_client import mistral_chat_stream, build_report_context, SYSTEM_PROMPT
from services.groq_deep_dive import generate_deep_dive
from services.report_generator import generate_report, REPORT_SYSTEM_PROMPT
from config import DEEPSEEK_MODEL
from agents.interview_agent import generate_next_question
from agents.founder_interview import generate_questions
from agents.classifier_agent import classify_idea


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


class ChatRequest(BaseModel):
    report: dict
    messages: list[dict]
    system_prompt: str | None = None


@app.post("/api/chat")
async def chat_with_report(req: ChatRequest):
    report_context = build_report_context(req.report)
    system = req.system_prompt or SYSTEM_PROMPT

    full_messages = [
        {"role": "system", "content": f"{system}\n\nREPORT DATA:\n{report_context}"},
    ]
    for msg in req.messages:
        full_messages.append({"role": msg["role"], "content": msg["content"]})

    async def generate():
        try:
            resp = await mistral_chat_stream(full_messages)
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield f"data: {json.dumps({'content': content})}\n\n"
                    except json.JSONDecodeError:
                        continue
            yield "data: {\"content\": \"[DONE]\"}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}


class DeepDiveRequest(BaseModel):
    idea: str
    answers: list[str]
    report: dict
    section: str


@app.post("/api/deep-dive")
async def deep_dive(req: DeepDiveRequest):
    try:
        result = await generate_deep_dive(
            section=req.section,
            idea=req.idea,
            answers=req.answers,
            report_json=req.report,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    try:
        raw = await generate_report(req.idea, req.answers)
        return EvaluationReport(**raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@app.post("/api/evaluate/stream")
async def evaluate_startup_stream(req: FounderAnswers):
    from services.groq_client import groq_chat_stream
    from models.schemas import EvaluationReport

    SECTION_STAGES = [
        ("market_research", "Generating market analysis"),
        ("competitor_analysis", "Evaluating competition"),
        ("risk_analysis", "Running strategic checks"),
        ("strategic_challenges", "Running strategic checks"),
        ("improvement_suggestions", "Preparing investment memo"),
        ("mvp_recommendation", "Building final report"),
        ("evaluation", "Calculating business score"),
        ("founder_blueprint", "Building final report"),
    ]

    async def event_stream():
        try:
            yield f"event: status\ndata: {json.dumps({'stage': 'preparing'})}\n\n"

            answers_text = "\n".join(f"Q{i+1}: {a}" for i, a in enumerate(req.answers))
            user_prompt = f"""Startup Idea: {req.idea}

Founder Interview Responses:
{answers_text}

Generate the complete due diligence report as a single valid JSON object. Every section must be fully populated with detailed analysis."""

            buffer = ""
            detected = set()

            async for token in groq_chat_stream(
                model=DEEPSEEK_MODEL,
                system_prompt=REPORT_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                max_tokens=8192,
            ):
                buffer += token

                for key, stage_name in SECTION_STAGES:
                    if key not in detected and f'"{key}"' in buffer:
                        detected.add(key)
                        yield f"event: status\ndata: {json.dumps({'stage': stage_name})}\n\n"

            yield f"event: status\ndata: {json.dumps({'stage': 'formatting'})}\n\n"

            raw = buffer.strip()
            if raw.startswith("```"):
                raw = raw.strip("`").strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
            report_dict = json.loads(raw)
            validated = EvaluationReport(**report_dict)
            report_json = validated.model_dump()

            yield f"event: complete\ndata: {json.dumps({'report': report_json})}\n\n"
            yield f"event: status\ndata: {json.dumps({'stage': 'complete'})}\n\n"

        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
