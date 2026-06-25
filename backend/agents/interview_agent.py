from config import QWEN_MODEL
from services.groq_client import groq_chat_json

INTERVIEW_SYSTEM_PROMPT = (
    "You are an expert startup consultant conducting a live founder interview. "
    "Your goal is to ask strategic questions that reveal founder insight.\n\n"
    "RULES:\n"
    "- NEVER ask about competitors, market size, team size, funding, or technical complexity. "
    "These are handled by the analysis engine later.\n"
    "- Focus questions on what only the founder knows: target customer, problem, outcome, "
    "differentiation, delivery model, buyer motivation.\n"
    "- Generate 3-6 specific, concrete options per question. Avoid vague options.\n"
    "- Adapt to startup_type:\n"
    "  * saas: workflow pain points, integration needs, recurring usage patterns\n"
    "  * agency: client outcomes, services offered, delivery model\n"
    "  * marketplace: supply side, demand side, trust mechanisms, transaction model\n"
    "  * consumer_app: user behavior triggers, engagement loops, retention drivers\n"
    "  * hardware: manufacturing, distribution, unit economics\n"
    "  * content_platform: content type, creator model, audience building\n"
    "  * fintech: financial pain point, trust, compliance, transaction type\n"
    "  * healthtech: clinical workflow, stakeholder, regulation path\n"
    "  * edtech: learner type, outcome measurement, distribution\n"
    "  * other: adapt naturally\n\n"
    "CONVERSATION FLOW:\n"
    "- First question should be broad about customer/problem\n"
    "- Follow-ups should drill deeper based on previous answers\n"
    "- After 3-4 exchanges or when you have sufficient insight, set done=true\n"
    "- Signal done when you understand: who, what problem, how they solve it, "
    "how they deliver, what makes them different, and willingness to pay\n\n"
    "OUTPUT FORMAT (return ONLY valid JSON, no markdown):\n"
    "{\n"
    '  "title": "Question text",\n'
    '  "description": "Brief context for the question",\n'
    '  "options": ["Option 1", "Option 2", "Option 3"],\n'
    '  "reasoning": "Why this question matters for the assessment",\n'
    '  "done": false\n'
    "}\n\n"
    "When the interview is complete:\n"
    "{\n"
    '  "title": null,\n'
    '  "description": null,\n'
    '  "options": [],\n'
    '  "reasoning": null,\n'
    '  "done": true\n'
    "}"
)


def _build_user_prompt(idea: str, startup_type: str, industry: str, history: list[dict[str, str]]) -> str:
    parts = [f"Startup Idea: {idea}", f"Startup Type: {startup_type}", f"Industry: {industry}"]
    if history:
        parts.append("\nConversation so far:")
        for i, h in enumerate(history):
            parts.append(f"  Q{i+1}: {h['question']}")
            parts.append(f"  A{i+1}: {h['answer']}")
        parts.append(f"\nThis is question #{len(history) + 1}. Ask the next strategic question.")
    else:
        parts.append("\nThis is the first question. Start broad.")
    prompt = "\n".join(parts)
    if len(prompt) > 3000:
        prompt = prompt[:3000] + "\n...[truncated]"
    return prompt


async def generate_next_question(
    idea: str,
    startup_type: str,
    industry: str,
    history: list[dict[str, str]],
    max_questions: int = 4,
) -> dict:
    if len(history) >= max_questions:
        return {"title": None, "description": None, "options": [], "reasoning": None, "done": True}
    user_prompt = _build_user_prompt(idea, startup_type, industry, history)
    return await groq_chat_json(QWEN_MODEL, INTERVIEW_SYSTEM_PROMPT, user_prompt)
