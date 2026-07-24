"""
D365 Architect OS — Project Service
Handles CRUD operations for projects stored as JSON files.
"""
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from models.project import (
    Project, ProjectCreate, ProjectUpdate, Artifact, RAIDItem,
    Decision, Assumption, SaveArtifactRequest
)


PROJECTS_DIR = Path(os.environ.get("PROJECTS_DIR", Path(__file__).parent.parent.parent / "projects"))


def _projects_path() -> Path:
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    return PROJECTS_DIR


def _project_file(project_id: str) -> Path:
    return _projects_path() / f"{project_id}.json"


def _load_project(project_id: str) -> Optional[Project]:
    path = _project_file(project_id)
    if not path.exists():
        return None
    with open(path, "r") as f:
        data = json.load(f)
    return Project(**data)


def _save_project(project: Project) -> None:
    path = _project_file(project.id)
    project.updated_at = datetime.now().isoformat()
    with open(path, "w") as f:
        json.dump(project.model_dump(), f, indent=2)


def list_projects() -> List[Project]:
    projects = []
    for p in _projects_path().glob("*.json"):
        try:
            with open(p) as f:
                data = json.load(f)
            projects.append(Project(**data))
        except Exception:
            pass
    return sorted(projects, key=lambda x: x.updated_at, reverse=True)


def get_project(project_id: str) -> Optional[Project]:
    return _load_project(project_id)


def get_project_by_slug(slug: str) -> Optional[Project]:
    for project in list_projects():
        if project.slug == slug:
            return project
    return None


def create_project(data: ProjectCreate) -> Project:
    project_id = str(uuid.uuid4())[:8]
    slug = data.name.lower().replace(" ", "-").replace("_", "-")

    # Ensure slug uniqueness
    existing = get_project_by_slug(slug)
    if existing:
        slug = f"{slug}-{project_id}"

    project = Project(
        id=project_id,
        name=data.name,
        slug=slug,
        description=data.description,
        context=data.context or {},
        tags=data.tags,
    )
    _save_project(project)
    return project


def update_project(project_id: str, data: ProjectUpdate) -> Optional[Project]:
    project = _load_project(project_id)
    if not project:
        return None

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status
    if data.context is not None:
        project.context = data.context
    if data.tags is not None:
        project.tags = data.tags

    _save_project(project)
    return project


def delete_project(project_id: str) -> bool:
    path = _project_file(project_id)
    if not path.exists():
        return False
    path.unlink()
    return True


def save_artifact(request: SaveArtifactRequest) -> Optional[Artifact]:
    project = _load_project(request.project_id)
    if not project:
        return None

    artifact = Artifact(
        id=str(uuid.uuid4())[:8],
        title=request.title,
        artifact_type=request.artifact_type,
        content=request.content,
        tags=request.tags,
    )
    project.artifacts.append(artifact)
    _save_project(project)

    # Also save as markdown file in project artifacts directory
    artifacts_dir = _projects_path() / request.project_id / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    safe_title = "".join(c for c in request.title if c.isalnum() or c in " -_").strip()
    safe_title = safe_title.replace(" ", "-").lower()
    artifact_file = artifacts_dir / f"{artifact.id}-{safe_title}.md"
    with open(artifact_file, "w") as f:
        f.write(f"---\ntitle: {request.title}\ntype: {request.artifact_type}\nversion: 1.0\nstatus: draft\ncreated: {artifact.created_at}\n---\n\n")
        f.write(request.content)

    return artifact


def add_raid_item(project_id: str, item: RAIDItem) -> Optional[Project]:
    project = _load_project(project_id)
    if not project:
        return None
    item.id = item.id or str(uuid.uuid4())[:8]
    project.raid_items.append(item)
    _save_project(project)
    return project


def add_decision(project_id: str, decision: Decision) -> Optional[Project]:
    project = _load_project(project_id)
    if not project:
        return None
    decision.id = decision.id or str(uuid.uuid4())[:8]
    project.decisions.append(decision)
    _save_project(project)
    return project


def add_assumption(project_id: str, assumption: Assumption) -> Optional[Project]:
    project = _load_project(project_id)
    if not project:
        return None
    assumption.id = assumption.id or str(uuid.uuid4())[:8]
    project.assumptions.append(assumption)
    _save_project(project)
    return project


def get_project_context_string(project_id: str) -> str:
    """Build a rich context string for injection into prompts."""
    project = _load_project(project_id)
    if not project:
        return ""

    ctx = project.context
    lines = [
        f"## Active Project: {project.name}",
        f"**Description:** {project.description}" if project.description else "",
    ]

    if ctx.client_name:
        lines.append(f"**Client:** {ctx.client_name}")
    if ctx.engagement_name:
        lines.append(f"**Engagement:** {ctx.engagement_name}")
    if ctx.industry:
        lines.append(f"**Industry:** {ctx.industry}")
    if ctx.d365_modules:
        lines.append(f"**D365 Modules in Scope:** {', '.join(ctx.d365_modules)}")
    if ctx.azure_services:
        lines.append(f"**Azure Services:** {', '.join(ctx.azure_services)}")
    if ctx.current_state:
        lines.append(f"**Current State:** {ctx.current_state}")
    if ctx.desired_state:
        lines.append(f"**Desired State:** {ctx.desired_state}")
    if ctx.key_challenges:
        lines.append(f"**Key Challenges:** {'; '.join(ctx.key_challenges)}")
    if ctx.constraints:
        lines.append(f"**Constraints:** {'; '.join(ctx.constraints)}")

    if project.assumptions:
        lines.append("\n**Active Assumptions:**")
        for a in project.assumptions[-5:]:  # last 5
            validated = "✅" if a.validated else "❓"
            lines.append(f"- {validated} {a.text}")

    if project.decisions:
        lines.append("\n**Key Decisions Made:**")
        for d in project.decisions[-5:]:
            lines.append(f"- {d.title}: {d.description[:100]}...")

    if project.raid_items:
        open_risks = [r for r in project.raid_items if r.category == "risk" and r.status == "open"]
        if open_risks:
            lines.append(f"\n**Open Risks ({len(open_risks)}):**")
            for r in open_risks[:3]:
                lines.append(f"- [{r.severity.upper()}] {r.title}")

    return "\n".join(line for line in lines if line)
