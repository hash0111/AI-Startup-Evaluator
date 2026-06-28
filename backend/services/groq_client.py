import json
import asyncio
import random
import httpx
from config import GROQ_API_KEY, GROQ_BASE_URL

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

_last_request_time = 0
_request_lock = asyncio.Lock()
MIN_INTERVAL = 15.0
"""Minimum seconds between consecutive Groq API requests (free-tier rate limiting)."""


async def _throttle():
    """Ensure at least MIN_INTERVAL seconds since the last Groq API call."""
    global _last_request_time
    async with _request_lock:
        now = asyncio.get_event_loop().time()
        elapsed = now - _last_request_time
        if elapsed < MIN_INTERVAL:
            wait = MIN_INTERVAL - elapsed
            print(f"  throttling Groq: waiting {wait:.1f}s (minimum {MIN_INTERVAL}s between calls)")
            await asyncio.sleep(wait)
        _last_request_time = asyncio.get_event_loop().time()


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

    max_retries = 10

    async with httpx.AsyncClient(timeout=120) as client:
        for attempt in range(max_retries):
            await _throttle()

            resp = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers=HEADERS,
                json=body,
            )

            if resp.status_code == 429:
                retry_after = 0
                ra_header = resp.headers.get("Retry-After") or resp.headers.get("retry-after")
                if ra_header:
                    try:
                        retry_after = int(ra_header)
                    except ValueError:
                        pass
                base_wait = max(retry_after, 2 ** (attempt + 2))
                jitter = random.uniform(0, 2)
                wait = base_wait + jitter
                print(f"  Groq 429, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
                continue

            if resp.status_code >= 500:
                base_wait = 2 ** (attempt + 2)
                jitter = random.uniform(0, 2)
                wait = base_wait + jitter
                print(f"  Groq {resp.status_code}, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
                continue

            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    raise Exception(f"Groq API request failed after {max_retries} retries (last status: {resp.status_code})")


async def groq_chat_json(model: str, system_prompt: str, user_prompt: str) -> dict:
    content = await groq_chat(model, system_prompt, user_prompt, response_format=dict)
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`").strip()
        if content.startswith("json"):
            content = content[4:].strip()
    return json.loads(content)
