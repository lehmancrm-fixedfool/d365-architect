# D365 Architect OS

**The unified AI architecture assistant for Microsoft Dynamics 365 Solution Architects.**

Built for senior architects working with:
- Dynamics 365 Contact Center & Customer Service
- Power Platform & Dataverse
- Azure (ACS, OpenAI, Functions, Service Bus)
- Microsoft Entra ID
- Copilot Studio & AI-driven enterprise design

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key

### 2. Setup

```bash
cd d365-architect

# Copy and configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start everything (Windows)
./start.bat

# Start everything (Mac/Linux)
chmod +x start.sh && ./start.sh
```

Then open **http://localhost:5173** in your browser.

---

## Architecture

```
d365-architect/
├── backend/          FastAPI backend + Claude API
│   ├── main.py       API server
│   ├── api/          REST endpoints
│   ├── prompts/      System prompts & mode prompts
│   ├── services/     Claude service + project service
│   └── models/       Pydantic data models
├── frontend/         React + TypeScript + Tailwind UI
│   └── src/
│       ├── components/ArchitectConsole/  Primary console UI
│       ├── components/Sidebar/          Project sidebar
│       ├── components/TopBar/           Navigation
│       ├── pages/                       App pages
│       ├── store/                       Zustand state
│       └── lib/                         API client + utils
├── cli/              Command-line interface
│   └── d365_architect.py
└── projects/         Project workspaces (JSON + markdown)
```

---

## Features

### Architect Console
The primary AI interface. Ask anything:
- Architecture design & system diagrams
- How-to questions & capability explanations
- Artifact generation (docs, RAID, ADR, backlogs)
- Troubleshooting & root cause analysis
- Research, comparisons & best practices
- Delivery planning & RAID management

**Intelligent intent detection** automatically selects the right mode and format.

### Modes
| Mode | Purpose |
|---|---|
| AUTO | Detects intent automatically |
| ARCHITECTURE | Solution design & system architecture |
| STRATEGY | Roadmap, business case, decisions |
| DELIVERY | Implementation planning, RAID, governance |
| TROUBLESHOOT | Debug, diagnose, resolve |
| INNOVATION | Emerging capabilities, future-state |
| RESEARCH | Deep dives, comparisons, best practices |
| ARTIFACT | Generate client-ready deliverables |
| REVIEW | Critique architecture, identify gaps |
| DECISION | Evaluate options, recommend path |
| EXPLAIN | Learn how something works |

### Artifact Generation
Generate complete, client-ready deliverables:
- Architecture Document
- Executive Summary
- RAID Log
- Architecture Decision Record (ADR)
- User Story Backlog
- Integration Specification
- Data Model (Dataverse schema)
- Security Model & Role Matrix
- Presentation Outline

### Project System
Organize by engagement:
- Client context (name, industry, modules, state)
- Key decisions log
- Assumptions register
- RAID log (Risks, Assumptions, Issues, Dependencies)
- Artifact library

### Mermaid Diagrams
Automatic diagram generation for:
- Context diagrams
- Sequence diagrams
- Flow diagrams
- Architecture component diagrams

---

## CLI Usage

```bash
# Ask anything
python cli/d365_architect.py chat "How does voice routing work in D365 Contact Center?"

# Architecture mode
python cli/d365_architect.py chat "Design a CCaaS architecture" --mode architecture

# With project context
python cli/d365_architect.py chat "What risks should I flag?" --project contoso-contact-center

# Generate artifact
python cli/d365_architect.py artifact --type exec-summary --context "D365 migration project"

# Save to file
python cli/d365_architect.py artifact --type architecture-doc --project my-project --output arch.md

# Project management
python cli/d365_architect.py projects list
python cli/d365_architect.py projects create "EY Contact Center Migration"
python cli/d365_architect.py projects show contoso-contact-center
```

---

## API

Backend runs at `http://localhost:8000`

- `GET /api/health` — System status
- `POST /api/console/stream` — Streaming console (SSE)
- `POST /api/console/generate-artifact` — Generate artifact
- `POST /api/console/save-artifact` — Save artifact to project
- `POST /api/console/challenge` — Challenge thinking
- `POST /api/console/what-am-i-missing` — Gap analysis
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/{id}` — Get project

Full docs: `http://localhost:8000/docs`

---

## Stack

| Layer | Technology |
|---|---|
| AI | Claude Sonnet 4.6 (Anthropic) |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Diagrams | Mermaid.js |
| State | Zustand |
| Storage | Local JSON files |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | Model override (default: claude-sonnet-4-6) |
| `PROJECTS_DIR` | No | Projects directory path |

---

*Built for Microsoft Dynamics 365 Solution Architects.*
