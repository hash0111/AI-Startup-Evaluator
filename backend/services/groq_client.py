import json
import asyncio
import random
import httpx
from config import GROQ_API_KEY, GROQ_BASE_URL

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}


async def groq_chat(
    model: str,
    system_prompt: str,
    user_prompt: str,
    response_format: type | None = None,
) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    body: dict = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    if response_format:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=120) as client:
        for attempt in range(5):
            resp = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers=HEADERS,
                json=body,
            )
            if resp.status_code == 429:
                base_wait = 2 ** (attempt + 1)
                jitter = random.uniform(0, 1)
                wait = base_wait + jitter
                print(f"  rate limited, retrying in {wait:.1f}s (attempt {attempt + 1})")
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    raise Exception("Groq API rate limit exceeded after 5 retries")


async def groq_chat_json(model: str, system_prompt: str, user_prompt: str) -> dict:
    content = await groq_chat(model, system_prompt, user_prompt, response_format=dict)
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`").strip()
        if content.startswith("json"):
            content = content[4:].strip()
    return json.loads(content)
