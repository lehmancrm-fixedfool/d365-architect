"""
D365 Architect OS — Architect Console API
Primary endpoint for the unified prompt interface.
"""
import json
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.project import (
    ConsoleRequest, ConsoleResponse, IntentClassification,
    SaveArtifactRequest
)
from services import (
    classify_intent, stream_console_response, generate_artifact_content,
    get_artifact_suggestions, get_follow_up_suggestions,
    challenge_thinking, what_am_i_missing, extract_diagram,
    get_project_context_string, save_artifact
)
from prompts import list_modes, list_artifact_types

router = APIRouter(prefix="/api/console", tags=["console"])

# Map intent to mode
INTENT_TO_MODE = {
    "ARCHITECTURE": "ARCHITECTURE",
    "ARTIFACT": "ARTIFACT",
    "TROUBLESHOOT": "TROUBLESHOOT",
    "RESEARCH": "RESEARCH",
    "DELIVERY": "DELIVERY",
    "DECISION": "DECISION",
    "INNOVATION": "INNOVATION",
    "REVIEW": "REVIEW",
    "EXPLAIN": "EXPLAIN",
    "QUESTION": "DEFAULT",
    "DEFAULT": "DEFAULT",
}


@router.post("/stream")
async def stream_response(request: ConsoleRequest):
    """
    Primary streaming endpoint for the Architect Console.
    Supports intelligent intent detection and mode routing.
    """

    # Get project context if specified
    project_context = ""
    if request.project_id and request.include_project_context:
        project_context = get_project_context_string(request.project_id)

    # Classify intent if mode not specified
    if request.mode:
        mode = request.mode.upper()
        intent = IntentClassification(
            intent=mode,
            confidence=1.0,
            reasoning="User-specified mode"
        )
    else:
        intent = await classify_intent(
            request.message,
            [m.model_dump() for m in request.conversation_history]
        )
        mode = INTENT_TO_MODE.get(intent.intent, "DEFAULT")

    async def event_stream() -> AsyncGenerator[str, None]:
        import traceback
        full_content = ""
        try:
            # Send intent classification first
            yield f"data: {json.dumps({'type': 'intent', 'data': intent.model_dump()})}\n\n"
            yield f"data: {json.dumps({'type': 'mode', 'data': mode})}\n\n"

            # Stream the main response
            async for chunk in stream_console_response(
                request=request,
                mode=mode,
                project_context=project_context,
                intent=intent
            ):
                full_content += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'data': chunk})}\n\n"

            # Post-processing: diagram
            diagram_source = extract_diagram(full_content)
            if diagram_source:
                yield f"data: {json.dumps({'type': 'diagram', 'data': diagram_source})}\n\n"

            # Artifact suggestions
            try:
                artifact_suggestions = await get_artifact_suggestions(full_content)
                if artifact_suggestions:
                    yield f"data: {json.dumps({'type': 'artifact_suggestions', 'data': [s.model_dump() for s in artifact_suggestions]})}\n\n"
            except Exception:
                pass

            # Follow-up suggestions
            try:
                follow_ups = await get_follow_up_suggestions(request.message, full_content)
                if follow_ups:
                    yield f"data: {json.dumps({'type': 'follow_ups', 'data': [f.model_dump() for f in follow_ups]})}\n\n"
            except Exception:
                pass

        except Exception as e:
            error_msg = str(e)
            print(f"[STREAM ERROR] {error_msg}\n{traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'data': error_msg})}\n\n"

        finally:
            yield f"data: {json.dumps({'type': 'done', 'data': True})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/generate-artifact")
async def generate_artifact(
    artifact_type: str,
    context: str,
    project_id: str = None
):
    """Generate a complete artifact."""
    project_context = ""
    if project_id:
        project_context = get_project_context_string(project_id)

    content = await generate_artifact_content(artifact_type, context, project_context)
    return {"content": content, "artifact_type": artifact_type}


@router.post("/save-artifact")
async def save_artifact_endpoint(request: SaveArtifactRequest):
    """Save an artifact to a project."""
    artifact = save_artifact(request)
    if not artifact:
        raise HTTPException(status_code=404, detail="Project not found")
    return artifact


@router.post("/challenge")
async def challenge_design(content: str, project_id: str = None):
    """Challenge architectural thinking — identify blind spots."""
    project_context = get_project_context_string(project_id) if project_id else ""
    result = await challenge_thinking(content, project_context)
    return {"content": result}


@router.post("/what-am-i-missing")
async def missing_analysis(context: str, project_id: str = None):
    """Proactively identify what might be overlooked."""
    project_context = get_project_context_string(project_id) if project_id else ""
    result = await what_am_i_missing(context, project_context)
    return {"content": result}


@router.get("/modes")
async def get_modes():
    """Get all available modes."""
    return {"modes": list_modes()}


@router.get("/artifact-types")
async def get_artifact_types():
    """Get all available artifact types."""
    return {"artifact_types": list_artifact_types()}
