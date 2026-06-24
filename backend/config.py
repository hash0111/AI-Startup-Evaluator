import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

QWEN_MODEL = "qwen/qwen3-32b"
DEEPSEEK_MODEL = "llama-3.3-70b-versatile"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
