"""
D365 Architect OS — Full test suite
Run from the backend/ directory:
    pytest tests/ -v

Sections:
  1. Module imports
  2. Environment / API key
  3. Health & config endpoints
  4. Console metadata endpoints
  5. Project CRUD
  6. SSE streaming (lightweight — uses EXPLAIN mode + minimal prompt)
  7. Claude API direct connectivity
"""
import json
import os
import re
import uuid
import pytest


# ─────────────────────────────────────────────────────────────
# 1. Module imports — every backend module must import cleanly
# ─────────────────────────────────────────────────────────────

def test_import_main():
    import main  # noqa: F401

def test_import_api_console():
    from api import console  # noqa: F401

def test_import_api_projects():
    from api import projects  # noqa: F401

def test_import_services_claude():
    from services import claude_service  # noqa: F401

def test_import_services_project():
    from services import project_service  # noqa: F401

def test_import_prompts():
    from prompts import system, modes, artifacts, classifier  # noqa: F401

def test_import_models():
    from models import project  # noqa: F401


# ─────────────────────────────────────────────────────────────
# 2. Environment — ANTHROPIC_API_KEY must be present and valid
# ─────────────────────────────────────────────────────────────

def test_env_api_key_present():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    assert key, "ANTHROPIC_API_KEY is not set in environment"

def test_env_api_key_format():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    assert key.startswith("sk-ant"), (
        f"ANTHROPIC_API_KEY looks wrong — starts with: {key[:12]!r}. "
        "Check your .env for a doubled prefix like 'ANTHROPIC_API_KEY=ANTHROPIC_API_KEY=sk-ant-...'"
    )

def test_get_client_initialises():
    """Lazy client init must succeed (no AuthenticationError)."""
    from services.claude_service import get_client
    client = get_client()
    assert client is not None


# ─────────────────────────────────────────────────────────────
# 3. Health & config endpoints
# ─────────────────────────────────────────────────────────────

def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "ok"
    assert body["system"] == "D365 Architect OS"
    assert "version" in body
    assert "model" in body

def test_health_api_key_set(client):
    r = client.get("/api/health")
    body = r.json()
    assert body["api_key_set"] is True, (
        f"api_key_set is False — preview: {body.get('api_key_preview')}"
    )

def test_config_ok(client):
    r = client.get("/api/config")
    assert r.status_code == 200
    body = r.json()
    assert "model" in body
    assert "features" in body
    assert body["features"]["streaming"] is True


# ─────────────────────────────────────────────────────────────
# 4. Console metadata endpoints
# ─────────────────────────────────────────────────────────────

def test_get_modes(client):
    r = client.get("/api/console/modes")
    assert r.status_code == 200
    body = r.json()
    assert "modes" in body
    assert len(body["modes"]) >= 5, "Expected at least 5 modes"

def test_get_artifact_types(client):
    r = client.get("/api/console/artifact-types")
    assert r.status_code == 200
    body = r.json()
    assert "artifact_types" in body
    assert len(body["artifact_types"]) >= 3, "Expected at least 3 artifact types"


# ─────────────────────────────────────────────────────────────
# 5. Project CRUD
# ─────────────────────────────────────────────────────────────

PROJECT_NAME = f"__test_project_{uuid.uuid4().hex[:8]}"
_created_project_id = None


def test_create_project(client):
    global _created_project_id
    payload = {"name": PROJECT_NAME, "description": "Automated test project"}
    r = client.post("/api/projects", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["name"] == PROJECT_NAME
    assert "id" in body
    _created_project_id = body["id"]

def test_list_projects_contains_created(client):
    r = client.get("/api/projects")
    assert r.status_code == 200
    projects = r.json()
    ids = [p["id"] for p in projects]
    assert _created_project_id in ids, f"Created project {_created_project_id} not in list"

def test_get_project(client):
    r = client.get(f"/api/projects/{_created_project_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == _created_project_id
    assert body["name"] == PROJECT_NAME

def test_update_project(client):
    r = client.put(
        f"/api/projects/{_created_project_id}",
        json={"description": "Updated by test suite"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["description"] == "Updated by test suite"

def test_get_nonexistent_project(client):
    r = client.get("/api/projects/does-not-exist-xyz")
    assert r.status_code == 404

def test_delete_project(client):
    r = client.delete(f"/api/projects/{_created_project_id}")
    assert r.status_code == 200
    # Confirm gone
    r2 = client.get(f"/api/projects/{_created_project_id}")
    assert r2.status_code == 404


# ─────────────────────────────────────────────────────────────
# 6. SSE Streaming — /api/console/stream
# Uses EXPLAIN mode with a very short prompt to keep cost/latency low.
# ─────────────────────────────────────────────────────────────

def _collect_sse_events(client, payload: dict) -> list[dict]:
    """POST to /api/console/stream and collect all SSE events as dicts."""
    events = []
    with client.stream("POST", "/api/console/stream", json=payload) as resp:
        assert resp.status_code == 200, f"Stream returned {resp.status_code}"
        for raw_line in resp.iter_lines():
            if raw_line.startswith("data: "):
                try:
                    events.append(json.loads(raw_line[6:]))
                except json.JSONDecodeError:
                    pass
    return events


def test_stream_returns_intent_event(client):
    events = _collect_sse_events(client, {
        "message": "What is D365 Contact Center?",
        "mode": "EXPLAIN",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    types = [e["type"] for e in events]
    assert "intent" in types, f"No 'intent' event. Got types: {types}"

def test_stream_returns_mode_event(client):
    events = _collect_sse_events(client, {
        "message": "What is D365 Contact Center?",
        "mode": "EXPLAIN",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    mode_events = [e for e in events if e["type"] == "mode"]
    assert mode_events, "No 'mode' event in stream"
    assert mode_events[0]["data"] == "EXPLAIN"

def test_stream_returns_chunk_events(client):
    events = _collect_sse_events(client, {
        "message": "Reply with exactly one word: Hello",
        "mode": "EXPLAIN",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    chunks = [e for e in events if e["type"] == "chunk"]
    assert len(chunks) > 0, "No 'chunk' events received — response is empty"
    full_text = "".join(e["data"] for e in chunks)
    assert len(full_text) > 0, "Accumulated chunk content is empty"

def test_stream_returns_done_event(client):
    events = _collect_sse_events(client, {
        "message": "Say OK",
        "mode": "EXPLAIN",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    types = [e["type"] for e in events]
    assert "done" in types, f"No 'done' event. Got: {types}"
    # done must be the last meaningful event
    assert types[-1] == "done", f"'done' is not last. Order: {types}"

def test_stream_no_error_event(client):
    events = _collect_sse_events(client, {
        "message": "What is Unified Routing?",
        "mode": "EXPLAIN",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    error_events = [e for e in events if e["type"] == "error"]
    assert not error_events, f"Stream returned error(s): {error_events}"

def test_stream_auto_mode_detects_intent(client):
    """AUTO mode (no mode specified) should classify intent and still return done."""
    events = _collect_sse_events(client, {
        "message": "Design a high-level architecture for a D365 contact center",
        "include_project_context": False,
        "include_conversation_history": False,
    })
    types = [e["type"] for e in events]
    assert "intent" in types
    assert "done" in types
    # In AUTO mode the intent data should have a confidence field
    intent_event = next(e for e in events if e["type"] == "intent")
    assert "confidence" in intent_event["data"], f"Intent missing confidence: {intent_event['data']}"


# ─────────────────────────────────────────────────────────────
# 7. Claude API direct connectivity — /api/test-claude
# ─────────────────────────────────────────────────────────────

def test_claude_api_reachable(client):
    r = client.post("/api/test-claude")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "ok", (
        f"Claude API error: {body.get('error')}\n{body.get('trace', '')[:400]}"
    )
    assert body.get("response"), "Empty response from Claude"
