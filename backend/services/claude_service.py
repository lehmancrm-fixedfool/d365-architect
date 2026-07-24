"""
D365 Architect OS — Claude Service
Handles all Claude API interactions with intelligent routing.
"""
import json
import re
from typing import AsyncGenerator, Optional

import anthropic

from prompts import (
    CORE_SYSTEM_PROMPT, get_mode_prompt, get_artifact_prompt,
    INTENT_CLASSIFIER_PROMPT, ARTIFACT_DETECTION_PROMPT,
    FOLLOW_UP_SUGGESTIONS_PROMPT, GROUNDING_PROMPT,
    EXECUTIVE_LAYER_PROMPT, DEVELOPER_LAYER_PROMPT
)
from models.project import (
    ConsoleRequest, IntentClassification, ArtifactSuggestion,
    FollowUpSuggestion
)

_client: anthropic.Anthropic | None = None
MODEL = "claude-sonnet-4-6"


def get_client() -> anthropic.Anthropic:
    """Lazy-init the Anthropic client so it reads ANTHROPIC_API_KEY after dotenv loads."""
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


async def classify_intent(message: str, history: list) -> IntentClassification:
    """Classify the intent of a user message."""
    history_context = ""
    if history:
        last_few = history[-4:]
        history_context = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')[:200]}" for m in last_few])

    prompt = f"{INTENT_CLASSIFIER_PROMPT}\n\n"
    if history_context:
        prompt += f"Recent conversation context:\n{history_context}\n\n"
    prompt += f"User message to classify:\n{message}"

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()

    # Extract JSON from response
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            return IntentClassification(**data)
        except Exception:
            pass

    return IntentClassification(
        intent="QUESTION",
        confidence=0.5,
        diagram_needed=False,
        complexity="medium",
        domain="general",
        reasoning="Classification failed, defaulting to QUESTION"
    )


def build_system_prompt(
    mode: str,
    project_context: str = "",
    explain_level: Optional[str] = None,
    artifact_type: Optional[str] = None
) -> str:
    """Build the complete system prompt for a request."""
    parts = [CORE_SYSTEM_PROMPT]

    # Add mode-specific prompt
    mode_prompt = get_mode_prompt(mode)
    parts.append(f"\n\n---\n{mode_prompt}")

    # Add artifact prompt if generating artifact
    if artifact_type:
        artifact_prompt = get_artifact_prompt(artifact_type)
        parts.append(f"\n\n---\n## Artifact Generation Instructions\n{artifact_prompt}")

    # Add explain level modifier
    if explain_level == "executive":
        parts.append(f"\n\n---\n## Audience Modifier\n{EXECUTIVE_LAYER_PROMPT}")
    elif explain_level == "developer":
        parts.append(f"\n\n---\n## Audience Modifier\n{DEVELOPER_LAYER_PROMPT}")

    # Add project context
    if project_context:
        parts.append(f"\n\n---\n## Current Project Context\n{project_context}")

    # Add grounding reminder
    parts.append(f"\n\n---\n## Grounding Checklist\n{GROUNDING_PROMPT}")

    return "\n".join(parts)


def extract_diagram(content: str) -> Optional[str]:
    """Extract Mermaid diagram source from response."""
    match = re.search(r'```mermaid\n(.*?)```', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None


async def get_artifact_suggestions(content: str) -> list[ArtifactSuggestion]:
    """Detect what artifacts should be suggested based on response content."""
    prompt = f"{ARTIFACT_DETECTION_PROMPT}\n\nResponse content:\n{content[:2000]}"

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            if data.get("suggest_artifact") and data.get("artifact_suggestions"):
                return [ArtifactSuggestion(**s) for s in data["artifact_suggestions"][:4]]
        except Exception:
            pass
    return []


async def get_follow_up_suggestions(message: str, content: str) -> list[FollowUpSuggestion]:
    """Generate intelligent follow-up suggestions."""
    prompt = f"{FOLLOW_UP_SUGGESTIONS_PROMPT}\n\nOriginal question: {message[:300]}\n\nResponse summary: {content[:1000]}"

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.content[0].text.strip()
    json_match = re.search(r'\[.*\]', text, re.DOTALL)
    if json_match:
        try:
            suggestions = json.loads(json_match.group())
            return [FollowUpSuggestion(**s) for s in suggestions[:5]]
        except Exception:
            pass
    return []


async def stream_console_response(
    request: ConsoleRequest,
    mode: str,
    project_context: str = "",
    intent: Optional[IntentClassification] = None
) -> AsyncGenerator[str, None]:
    """Stream a response from Claude for the Architect Console."""

    system_prompt = build_system_prompt(
        mode=mode,
        project_context=project_context if request.include_project_context else "",
        explain_level=request.explain_level,
        artifact_type=request.artifact_type
    )

    # Build message history
    messages = []
    if request.include_conversation_history and request.conversation_history:
        for msg in request.conversation_history[-10:]:  # Last 10 messages
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    with get_client().messages.stream(
        model=MODEL,
        max_tokens=8096,
        system=system_prompt,
        messages=messages
    ) as stream:
        for text in stream.text_stream:
            yield text


async def generate_artifact_content(
    artifact_type: str,
    context: str,
    project_context: str = ""
) -> str:
    """Generate a complete artifact."""
    system_prompt = build_system_prompt(
        mode="ARTIFACT",
        project_context=project_context,
        artifact_type=artifact_type
    )

    artifact_instruction = get_artifact_prompt(artifact_type)

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=8096,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"Generate the following artifact based on this context:\n\n{context}\n\n{artifact_instruction}"
            }
        ]
    )

    return response.content[0].text


async def challenge_thinking(content: str, project_context: str = "") -> str:
    """Challenge the architect's thinking — identify blind spots and risks."""
    system_prompt = build_system_prompt(mode="REVIEW", project_context=project_context)

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=3000,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"""As a senior architect peer reviewer, challenge the thinking in this design/approach.
Be direct and specific. Identify:
1. What's missing or overlooked
2. Hidden risks or failure modes
3. Questionable assumptions
4. Better alternatives that weren't considered
5. Licensing or support implications

Architecture/design to review:
{content}"""
            }
        ]
    )
    return response.content[0].text


async def what_am_i_missing(context: str, project_context: str = "") -> str:
    """Proactively identify what the architect might be missing."""
    system_prompt = build_system_prompt(mode="DEFAULT", project_context=project_context)

    response = get_client().messages.create(
        model=MODEL,
        max_tokens=2000,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"""Based on this architecture context, what is the architect likely missing or not considering?

Think about:
- Common failure patterns in D365/Power Platform implementations
- Non-functional requirements often overlooked
- Operational readiness (monitoring, alerting, runbooks)
- Security posture gaps
- Data migration and cutover risks
- Training and change management
- Licensing cost surprises
- Microsoft product gaps or known issues

Context:
{context}"""
            }
        ]
    )
    return response.content[0].text
