"""
D365 Architect OS — Project Data Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ON_HOLD = "on-hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ArtifactType(str, Enum):
    ARCHITECTURE_DOC = "architecture-doc"
    EXEC_SUMMARY = "exec-summary"
    RAID_LOG = "raid-log"
    ADR = "adr"
    BACKLOG = "backlog"
    INTEGRATION_SPEC = "integration-spec"
    DATA_MODEL = "data-model"
    SECURITY_MODEL = "security-model"
    PRESENTATION = "presentation"
    DIAGRAM = "diagram"
    NOTES = "notes"
    OTHER = "other"


class RAIDItem(BaseModel):
    id: str
    category: str  # risk, assumption, issue, dependency
    title: str
    description: str
    severity: str = "medium"  # high, medium, low
    status: str = "open"
    owner: str = ""
    due_date: Optional[str] = None
    mitigation: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Decision(BaseModel):
    id: str
    title: str
    description: str
    rationale: str
    alternatives: List[str] = []
    status: str = "proposed"  # proposed, accepted, rejected, superseded
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Assumption(BaseModel):
    id: str
    text: str
    validated: bool = False
    impact_if_wrong: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Artifact(BaseModel):
    id: str
    title: str
    artifact_type: str
    content: str
    metadata: Dict[str, Any] = {}
    version: str = "1.0"
    status: str = "draft"  # draft, review, approved
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ProjectContext(BaseModel):
    client_name: str = ""
    engagement_name: str = ""
    industry: str = ""
    region: str = ""
    d365_modules: List[str] = []
    azure_services: List[str] = []
    current_state: str = ""
    desired_state: str = ""
    key_challenges: List[str] = []
    constraints: List[str] = []
    stakeholders: List[str] = []


class Project(BaseModel):
    id: str
    name: str
    slug: str
    description: str = ""
    status: ProjectStatus = ProjectStatus.ACTIVE
    context: ProjectContext = Field(default_factory=ProjectContext)
    assumptions: List[Assumption] = []
    decisions: List[Decision] = []
    raid_items: List[RAIDItem] = []
    artifacts: List[Artifact] = []
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    context: Optional[ProjectContext] = None
    tags: List[str] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    context: Optional[ProjectContext] = None
    tags: Optional[List[str]] = None


class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    metadata: Optional[Dict[str, Any]] = None


class ConsoleRequest(BaseModel):
    message: str
    mode: Optional[str] = None  # auto-detect if not specified
    project_id: Optional[str] = None
    include_project_context: bool = True
    include_conversation_history: bool = True
    conversation_history: List[ChatMessage] = []
    artifact_type: Optional[str] = None  # if explicitly generating artifact
    explain_level: Optional[str] = None  # executive, developer, simple


class IntentClassification(BaseModel):
    intent: str
    confidence: float
    artifact_type: str = "none"
    diagram_needed: bool = False
    complexity: str = "medium"
    domain: str = "general"
    reasoning: str = ""


class ArtifactSuggestion(BaseModel):
    type: str
    label: str
    description: str


class FollowUpSuggestion(BaseModel):
    label: str
    prompt: str
    mode: str = "DEFAULT"
    icon: str = "question"


class ConsoleResponse(BaseModel):
    content: str
    intent: IntentClassification
    mode_used: str
    has_diagram: bool = False
    diagram_source: Optional[str] = None
    artifact_suggestions: List[ArtifactSuggestion] = []
    follow_up_suggestions: List[FollowUpSuggestion] = []
    assumptions: List[str] = []
    sources: List[str] = []
    confidence_level: str = "high"
    metadata: Dict[str, Any] = {}


class SaveArtifactRequest(BaseModel):
    project_id: str
    title: str
    artifact_type: str
    content: str
    tags: List[str] = []
