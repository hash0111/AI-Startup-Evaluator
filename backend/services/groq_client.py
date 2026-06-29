import json
import asyncio
import random
import time
import httpx
from config import GROQ_API_KEY, GROQ_BASE_URL, DEEPSEEK_MODEL

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

_MAX_CONCURRENT = 1
_semaphore = asyncio.Semaphore(_MAX_CONCURRENT)
_request_times: list[float] = []


def configure(max_concurrent: int = 1):
    global _semaphore, _MAX_CONCURRENT
    _MAX_CONCURRENT = max_concurrent
    _semaphore = asyncio.Semaphore(max_concurrent)


async def groq_chat(
    model: str,
    system_prompt: str,
    user_prompt: str,
    response_format: type | None = None,
    max_tokens: int = 4096,
) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    body: dict = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    if response_format:
        body["response_format"] = {"type": "json_object"}

    max_retries = 5
    last_status = 0
    start_time = time.time()

    async with _semaphore:
        async with httpx.AsyncClient(timeout=180) as client:
            for attempt in range(max_retries):
                attempt_start = time.time()
                try:
                    resp = await client.post(
                        f"{GROQ_BASE_URL}/chat/completions",
                        headers=HEADERS,
                        json=body,
                    )
                    last_status = resp.status_code

                    if resp.status_code == 429:
                        ra_header = resp.headers.get("Retry-After") or resp.headers.get("retry-after")
                        try:
                            retry_after = int(ra_header) if ra_header else 0
                        except ValueError:
                            retry_after = 0
                        wait = max(retry_after, 2 ** (attempt + 2)) + random.uniform(0, 1)
                        print(f"  Groq 429, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(wait)
                        continue

                    if resp.status_code >= 500:
                        wait = 2 ** (attempt + 2) + random.uniform(0, 1)
                        print(f"  Groq {resp.status_code}, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(wait)
                        continue

                    if resp.status_code >= 400:
                        body_text = resp.text[:500]
                        print(f"  Groq {resp.status_code}: {body_text}")
                        resp.raise_for_status()

                    resp.raise_for_status()
                    data = resp.json()

                    duration = time.time() - start_time
                    tokens_in = data.get("usage", {}).get("prompt_tokens", 0)
                    tokens_out = data.get("usage", {}).get("completion_tokens", 0)

                    print(f"  Groq OK [{model}] {duration:.1f}s | in={tokens_in} out={tokens_out} | attempt={attempt + 1}")

                    return data["choices"][0]["message"]["content"]

                except httpx.TimeoutException:
                    wait = 2 ** (attempt + 2)
                    print(f"  Groq timeout, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait)
                    continue

    raise Exception(f"Groq API request failed after {max_retries} retries (last status: {last_status})")


async def groq_chat_json(
    model: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4096,
) -> dict:
    content = await groq_chat(
        model, system_prompt, user_prompt,
        response_format=dict, max_tokens=max_tokens,
    )
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`").strip()
        if content.startswith("json"):
            content = content[4:].strip()
    return json.loads(content)
