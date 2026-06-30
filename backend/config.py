import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_DEEP_DIVE_API_KEY = os.getenv("GROQ_DEEP_DIVE_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")

QWEN_MODEL = "qwen/qwen3-32b"
DEEPSEEK_MODEL = "llama-3.3-70b-versatile"
MISTRAL_MODEL = "mistral-large-latest"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MISTRAL_BASE_URL = "https://api.mistral.ai/v1"
