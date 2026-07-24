"""
D365 Architect OS — Artifact Generation Prompts
"""

ARTIFACT_PROMPTS = {
    "architecture-doc": """
Generate a complete, professional Architecture Document for the described solution.

Structure:
# Solution Architecture Document
**Version:** 1.0 | **Status:** Draft | **Date:** {date} | **Author:** [Architect Name]

## 1. Executive Summary
[2-3 paragraph business-focused summary]

## 2. Business Context
### 2.1 Business Objectives
### 2.2 Success Criteria
### 2.3 Constraints

## 3. Solution Overview
### 3.1 Architecture Principles
### 3.2 High-Level Design
[Mermaid context diagram]

## 4. Architecture Components
### 4.1 [Component 1]
### 4.2 [Component 2]
[For each: purpose, technology, key decisions, interfaces]

## 5. Integration Architecture
### 5.1 Integration Points
### 5.2 Data Flows
[Mermaid sequence or flow diagrams]

## 6. Data Architecture
### 6.1 Data Model
### 6.2 Data Flows
### 6.3 Data Governance

## 7. Security Architecture
### 7.1 Identity & Access
### 7.2 Data Security
### 7.3 Network Security

## 8. Infrastructure & Deployment
### 8.1 Environments
### 8.2 Deployment Topology
### 8.3 DevOps & ALM

## 9. Architecture Decisions
[Table of key decisions]

## 10. Assumptions & Dependencies

## 11. Risks & Mitigations

## 12. Open Items & Next Steps

Make it genuinely complete and client-ready. Use professional language.
""",

    "exec-summary": """
Generate a concise Executive Summary for the described solution.

Structure:
# Executive Summary: [Solution Name]
**For:** [Client Name] | **Date:** {date} | **Prepared By:** [Architect Name]

## Business Challenge
[2-3 sentences: the problem being solved]

## Proposed Solution
[3-4 sentences: what we're building and why this approach]

## Key Benefits
- [Benefit 1 with quantification where possible]
- [Benefit 2]
- [Benefit 3]
- [Benefit 4]

## Solution Highlights
| Capability | Description |
|---|---|
| [Feature] | [Value] |

## Investment Summary
[Indicative phases, timeline, and effort level — avoid hard numbers without more context]

## Recommended Next Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

Keep it to 1-2 pages. Business language only. No technical jargon.
""",

    "raid-log": """
Generate a comprehensive RAID Log from the architectural discussion.

# RAID Log — [Solution Name]
**Version:** 1.0 | **Date:** {date} | **Owner:** [Architect Name]

## Risks
| ID | Risk | Probability | Impact | Score | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| R001 | [Risk] | H/M/L | H/M/L | H/M/L | [Mitigation] | [Owner] | Open |

## Assumptions
| ID | Assumption | Validated? | Impact if Wrong | Action Required |
|---|---|---|---|---|
| A001 | [Assumption] | Yes/No/TBC | [Impact] | [Action] |

## Issues
| ID | Issue | Severity | Description | Resolution | Owner | Due Date | Status |
|---|---|---|---|---|---|---|---|
| I001 | [Issue] | H/M/L | [Description] | [Resolution] | [Owner] | TBD | Open |

## Dependencies
| ID | Dependency | Type | Owner | Required By | Status |
|---|---|---|---|---|---|
| D001 | [Dependency] | Internal/External | [Owner] | [Date] | Pending |

Include all items surfaced in the architectural discussion. Flag unvalidated assumptions as priority actions.
""",

    "adr": """
Generate an Architecture Decision Record (ADR) for the key decision discussed.

# ADR-[NUMBER]: [Decision Title]

**Date:** {date}
**Status:** Proposed | Accepted | Deprecated | Superseded
**Deciders:** [Names/Roles]
**Technical Story:** [Brief context]

## Context and Problem Statement
[What is the architectural question and why does it need to be decided now?]

## Decision Drivers
- [Driver 1: constraint, requirement, or principle]
- [Driver 2]
- [Driver 3]

## Considered Options
1. [Option A]
2. [Option B]
3. [Option C]

## Decision Outcome
**Chosen option:** [Option X]

**Rationale:** [Why this option wins given the decision drivers]

**Positive Consequences:**
- [Pro 1]
- [Pro 2]

**Negative Consequences / Trade-offs:**
- [Con 1]
- [Con 2]

## Pros and Cons of the Options

### Option A: [Name]
- ✅ [Pro]
- ❌ [Con]

### Option B: [Name]
- ✅ [Pro]
- ❌ [Con]

## Links
- [Related ADR if applicable]
- [Microsoft documentation reference]
""",

    "backlog": """
Generate a structured User Story backlog from the solution requirements discussed.

# Product Backlog — [Solution Name]
**Version:** 1.0 | **Date:** {date}

## Epic Structure
[Organize stories by Epic]

## Stories

For each story use this format:

### [EPIC-XXX] Epic Name

#### US-XXX: [Story Title]
**As a** [role]
**I want to** [capability]
**So that** [business value]

**Acceptance Criteria:**
- Given [context] When [action] Then [expected result]
- [Additional AC]

**Technical Notes:**
- [Implementation note]
- [D365 component involved]
- [Dependencies]

**Story Points:** [Fibonacci: 1,2,3,5,8,13]
**Priority:** Must Have / Should Have / Could Have / Won't Have (MoSCoW)

Generate at least 15-20 stories covering core functionality. Include non-functional requirements as stories.
""",

    "integration-spec": """
Generate a detailed Integration Specification document.

# Integration Specification — [Integration Name]
**Version:** 1.0 | **Date:** {date} | **Status:** Draft

## 1. Overview
### 1.1 Purpose
### 1.2 Scope
### 1.3 Systems Involved

## 2. Integration Architecture
[Mermaid sequence diagram of the integration flow]

## 3. Interface Definitions
### 3.1 [API/Endpoint Name]
- **Method:** GET/POST/PUT/PATCH/DELETE
- **Endpoint:** [URL pattern]
- **Authentication:** [OAuth 2.0 / API Key / etc.]
- **Request Payload:** [Schema or example]
- **Response Payload:** [Schema or example]
- **Error Codes:** [Relevant HTTP/custom errors]

## 4. Data Mapping
| Source Field | Source System | Target Field | Target System | Transformation |
|---|---|---|---|---|

## 5. Authentication & Security
### 5.1 Auth Flow
### 5.2 Credentials Management
### 5.3 Network Requirements

## 6. Error Handling
### 6.1 Retry Logic
### 6.2 Dead Letter Queue
### 6.3 Alerting

## 7. Performance Requirements
| Metric | Requirement |
|---|---|
| Throughput | [X] messages/second |
| Latency | < [X] ms |
| Availability | [X]% |

## 8. Testing Requirements

## 9. Assumptions & Constraints
""",

    "data-model": """
Generate a Dataverse Data Model specification.

# Dataverse Data Model — [Solution Name]
**Version:** 1.0 | **Date:** {date}

## 1. Data Architecture Overview
[Mermaid entity-relationship diagram]

## 2. Table Definitions

For each table:
### [Publisher_TableName] — [Display Name]
**Type:** Standard / Activity / Elastic / Virtual
**Primary Name Column:** [field name]
**Description:** [Purpose of this table]

| Column Name | Display Name | Type | Required | Description |
|---|---|---|---|---|
| [schema name] | [display] | Text/Number/DateTime/Lookup/OptionSet/etc | Yes/No | [Description] |

**Relationships:**
| Type | Related Table | Relationship Name | Behavior |
|---|---|---|---|
| N:1 | [Table] | [Name] | Parental/Referential |

**Indexes:** [Any custom indexes needed]
**Permissions Note:** [Who needs access to this table]

## 3. Option Sets (Choice Columns)
| Name | Values |
|---|---|
| [OptionSet Name] | Value1, Value2, Value3 |

## 4. Business Rules
[Key business rules to implement in Dataverse]

## 5. Data Governance Notes
- Retention policy
- PII fields
- Encryption requirements
""",

    "security-model": """
Generate a Security Architecture and Role Matrix.

# Security Model — [Solution Name]
**Version:** 1.0 | **Date:** {date}

## 1. Security Principles
[Key principles driving this security model]

## 2. Identity Architecture
[Mermaid diagram of authentication flows]

### 2.1 User Authentication
### 2.2 Service Authentication
### 2.3 External User Access (if applicable)

## 3. Dataverse Security Model
### 3.1 Business Unit Structure
### 3.2 Security Roles

| Role Name | Description | Typical User |
|---|---|---|
| [Role] | [Description] | [Who] |

### 3.3 Role Privilege Matrix
| Table | [Role 1] | [Role 2] | [Role 3] |
|---|---|---|---|
| [Table] | Read | Read/Write | Full |

### 3.4 Field-Level Security (if applicable)
### 3.5 Record-Level Security (sharing rules, teams)

## 4. Azure / Entra ID
### 4.1 App Registrations
### 4.2 Managed Identities
### 4.3 Conditional Access Policies
### 4.4 PIM / Privileged Access

## 5. Network Security
### 5.1 IP Restrictions
### 5.2 Private Endpoints
### 5.3 Firewall Rules

## 6. Data Classification & Protection
| Classification | Examples | Controls |
|---|---|---|
| Confidential | [PII, financial] | [Controls] |

## 7. Audit & Compliance
### 7.1 Audit Logging
### 7.2 Compliance Requirements
""",

    "presentation": """
Generate a presentation outline for the solution.

# Presentation Outline — [Solution Name]

## Slide 1: Title
[Solution Name]
Subtitle: [tagline]
Presenter: [Name], [Role]
Date: {date}

## Slide 2: Agenda
[4-6 topics]

## Slide 3: Business Context / Challenge
[Key slide: why are we here?]
Visual suggestion: [icon or diagram type]

## Slide 4: Executive Vision
[What success looks like — outcomes first]

## Slide 5: Solution Overview
[High-level architecture — keep it simple]
Visual: Context diagram

## Slides 6-N: Key Capabilities
[One slide per major capability area]
Each: capability title | 3-4 bullets | visual suggestion

## Slide N+1: Architecture Deep Dive
[For technical audience]

## Slide N+2: Implementation Roadmap
[Phased approach, timeline]
Visual: Gantt or phase swim lane

## Slide N+3: Investment Summary
[Effort/cost/timeline framing]

## Slide N+4: Next Steps
[3-5 concrete actions with owners]

## Slide N+5: Q&A / Thank You

---
Speaker Notes suggestions included for key slides.
"""
}

def get_artifact_prompt(artifact_type: str, date: str = "") -> str:
    """Get the prompt for generating a specific artifact type."""
    import datetime
    if not date:
        date = datetime.date.today().strftime("%B %d, %Y")

    template = ARTIFACT_PROMPTS.get(artifact_type, "Generate the requested artifact in a professional, client-ready format.")
    return template.format(date=date)

def list_artifact_types() -> list[dict]:
    """List all available artifact types with metadata."""
    return [
        {"type": "architecture-doc", "label": "Architecture Document", "description": "Full solution architecture documentation"},
        {"type": "exec-summary", "label": "Executive Summary", "description": "1-2 page business-level summary"},
        {"type": "raid-log", "label": "RAID Log", "description": "Risks, Assumptions, Issues, Dependencies"},
        {"type": "adr", "label": "Architecture Decision Record", "description": "Formal record of an architectural decision"},
        {"type": "backlog", "label": "User Story Backlog", "description": "Structured product backlog with user stories"},
        {"type": "integration-spec", "label": "Integration Specification", "description": "Detailed integration interface specification"},
        {"type": "data-model", "label": "Data Model", "description": "Dataverse schema and entity specification"},
        {"type": "security-model", "label": "Security Model", "description": "Security architecture and role matrix"},
        {"type": "presentation", "label": "Presentation Outline", "description": "Slide deck structure with speaker notes"},
    ]
