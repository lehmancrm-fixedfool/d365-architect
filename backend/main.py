"""
D365 Architect OS — FastAPI Backend
"""
import os
from pathlib import Path

# Load environment FIRST — before any module imports that use API keys
from dotenv import load_dotenv
_base = Path(__file__).parent.parent
load_dotenv(_base / ".env")            # d365-architect/.env
load_dotenv(_base / ".env.local")
load_dotenv(_base.parent / ".env")     # AIProjects/.env (fallback / shared key)
load_dotenv(_base.parent / ".env.local")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.console import router as console_router
from api.projects import router as projects_router


app = FastAPI(
    title="D365 Architect OS",
    description="AI-powered architecture assistant for Microsoft Dynamics 365 Solution Architects",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(console_router)
app.include_router(projects_router)


@app.get("/api/health")
async def health():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    return {
        "status": "ok",
        "system": "D365 Architect OS",
        "version": "1.0.0",
        "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "api_key_set": bool(api_key and api_key.startswith("sk-ant")),
        "api_key_preview": api_key[:12] + "..." if api_key else "MISSING",
    }


@app.post("/api/test-claude")
async def test_claude():
    """Quick test that Claude API is reachable."""
    import traceback
    try:
        from services.claude_service import get_client, MODEL
        client = get_client()
        resp = client.messages.create(
            model=MODEL,
            max_tokens=20,
            messages=[{"role": "user", "content": "Say OK"}]
        )
        return {"status": "ok", "response": resp.content[0].text}
    except Exception as e:
        return {"status": "error", "error": str(e), "trace": traceback.format_exc()[-500:]}


@app.get("/api/config")
async def config():
    return {
        "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "projects_dir": os.environ.get("PROJECTS_DIR", "../projects"),
        "features": {
            "streaming": True,
            "artifact_generation": True,
            "intent_classification": True,
            "diagram_generation": True,
            "project_context": True,
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
