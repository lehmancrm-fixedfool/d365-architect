#!/usr/bin/env python3
"""
D365 Architect OS — CLI
Usage:
  d365-architect chat "Your question here"
  d365-architect chat "Design architecture" --mode architecture --project my-project
  d365-architect artifact --type exec-summary --context "D365 Contact Center migration"
  d365-architect projects list
  d365-architect projects create "My Project"
"""
import sys
import os
import json
import argparse
import textwrap
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env.local")

import anthropic
from prompts import CORE_SYSTEM_PROMPT, get_mode_prompt, get_artifact_prompt, INTENT_CLASSIFIER_PROMPT
from services.project_service import (
    list_projects, get_project, get_project_by_slug,
    create_project, get_project_context_string
)
from models.project import ProjectCreate

# ANSI colors
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
BLUE = "\033[94m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
WHITE = "\033[97m"
GRAY = "\033[90m"


def print_header():
    print(f"\n{BOLD}{BLUE}╔══════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{BLUE}║   D365 Architect OS  │  CLI v1.0     ║{RESET}")
    print(f"{BOLD}{BLUE}╚══════════════════════════════════════╝{RESET}\n")


def print_mode_badge(mode: str):
    mode_colors = {
        'ARCHITECTURE': BLUE,
        'STRATEGY': MAGENTA,
        'DELIVERY': GREEN,
        'TROUBLESHOOT': RED,
        'INNOVATION': YELLOW,
        'RESEARCH': CYAN,
        'ARTIFACT': MAGENTA,
        'DEFAULT': GRAY,
    }
    color = mode_colors.get(mode.upper(), GRAY)
    print(f"{DIM}Mode: {RESET}{color}{BOLD}[{mode.upper()}]{RESET}")


def classify_intent(client: anthropic.Anthropic, message: str) -> dict:
    """Quick intent classification."""
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"{INTENT_CLASSIFIER_PROMPT}\n\nUser message:\n{message}"
            }]
        )
        text = response.content[0].text.strip()
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {"intent": "DEFAULT", "confidence": 0.5}


def build_system_prompt(mode: str, project_context: str = "") -> str:
    parts = [CORE_SYSTEM_PROMPT, get_mode_prompt(mode)]
    if project_context:
        parts.append(f"\n## Current Project Context\n{project_context}")
    return "\n\n---\n".join(parts)


def cmd_chat(args):
    """Run a chat query."""
    client = anthropic.Anthropic()

    if not args.message:
        print(f"{RED}Error: No message provided.{RESET}")
        print(f"{DIM}Usage: d365-architect chat \"Your question here\"{RESET}")
        sys.exit(1)

    message = " ".join(args.message)

    # Get project context
    project_context = ""
    if args.project:
        project = get_project(args.project) or get_project_by_slug(args.project)
        if project:
            project_context = get_project_context_string(project.id)
            print(f"{DIM}Project: {project.name}{RESET}")
        else:
            print(f"{YELLOW}Warning: Project '{args.project}' not found. Running without project context.{RESET}")

    # Determine mode
    if args.mode:
        mode = args.mode.upper()
    else:
        print(f"{DIM}Detecting intent...{RESET}", end='\r')
        intent = classify_intent(client, message)
        mode_map = {
            'ARCHITECTURE': 'ARCHITECTURE',
            'ARTIFACT': 'ARTIFACT',
            'TROUBLESHOOT': 'TROUBLESHOOT',
            'RESEARCH': 'RESEARCH',
            'DELIVERY': 'DELIVERY',
            'DECISION': 'DECISION',
            'INNOVATION': 'INNOVATION',
            'REVIEW': 'REVIEW',
            'EXPLAIN': 'EXPLAIN',
            'QUESTION': 'DEFAULT',
        }
        mode = mode_map.get(intent.get('intent', 'DEFAULT'), 'DEFAULT')
        print(f"                    \r", end='')  # Clear line

    print_mode_badge(mode)
    print(f"\n{DIM}{'─' * 60}{RESET}")
    print(f"{BOLD}{WHITE}Q:{RESET} {message}")
    print(f"{DIM}{'─' * 60}{RESET}\n")

    system_prompt = build_system_prompt(mode, project_context)

    # Stream response
    full_response = ""
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        system=system_prompt,
        messages=[{"role": "user", "content": message}]
    ) as stream:
        for text in stream.text_stream:
            print(text, end='', flush=True)
            full_response += text

    print(f"\n\n{DIM}{'─' * 60}{RESET}")

    # Save option
    if args.save and args.project:
        from services.project_service import save_artifact
        from models.project import SaveArtifactRequest
        project = get_project(args.project) or get_project_by_slug(args.project)
        if project:
            title = args.save_title or f"Chat: {message[:50]}..."
            save_artifact(SaveArtifactRequest(
                project_id=project.id,
                title=title,
                artifact_type="notes",
                content=f"# Question\n{message}\n\n# Answer\n{full_response}",
            ))
            print(f"{GREEN}✓ Saved to project: {project.name}{RESET}")


def cmd_artifact(args):
    """Generate a specific artifact."""
    client = anthropic.Anthropic()

    if not args.type:
        from prompts import list_artifact_types
        types = list_artifact_types()
        print(f"\n{BOLD}Available artifact types:{RESET}")
        for t in types:
            print(f"  {CYAN}{t['type']:<20}{RESET} {t['description']}")
        return

    # Get context
    context = args.context or ""
    if args.project:
        project = get_project(args.project) or get_project_by_slug(args.project)
        if project:
            project_context = get_project_context_string(project.id)
            context = f"{project_context}\n\n{context}".strip()
            print(f"{DIM}Project: {project.name}{RESET}")

    artifact_prompt = get_artifact_prompt(args.type)
    print(f"{BOLD}Generating {args.type}...{RESET}\n")
    print(f"{DIM}{'─' * 60}{RESET}\n")

    system = build_system_prompt("ARTIFACT", context)
    full_content = ""

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        system=system,
        messages=[{
            "role": "user",
            "content": f"Generate a {args.type} artifact. Context: {context}\n\n{artifact_prompt}"
        }]
    ) as stream:
        for text in stream.text_stream:
            print(text, end='', flush=True)
            full_content += text

    print(f"\n\n{DIM}{'─' * 60}{RESET}")

    # Save to file
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(full_content)
        print(f"{GREEN}✓ Saved to: {output_path}{RESET}")


def cmd_projects(args):
    """Project management commands."""
    if args.action == 'list':
        projects = list_projects()
        if not projects:
            print(f"{YELLOW}No projects found.{RESET}")
            print(f"{DIM}Create one with: d365-architect projects create \"My Project\"{RESET}")
            return

        print(f"\n{BOLD}Projects ({len(projects)}){RESET}")
        print(f"{DIM}{'─' * 60}{RESET}")
        for p in projects:
            status_color = GREEN if p.status == 'active' else YELLOW
            print(f"  {BOLD}{WHITE}{p.name}{RESET}")
            print(f"    {DIM}ID: {p.id} │ Status: {status_color}{p.status}{RESET}{DIM} │ Artifacts: {len(p.artifacts)}{RESET}")
            if p.context.client_name:
                print(f"    {DIM}Client: {p.context.client_name}{RESET}")
            print()

    elif args.action == 'create':
        name = ' '.join(args.name) if args.name else None
        if not name:
            print(f"{RED}Error: Provide a project name.{RESET}")
            sys.exit(1)
        project = create_project(ProjectCreate(name=name))
        print(f"{GREEN}✓ Created project: {project.name} (ID: {project.id}){RESET}")

    elif args.action == 'show':
        project_id = args.id
        project = get_project(project_id) or get_project_by_slug(project_id)
        if not project:
            print(f"{RED}Project not found: {project_id}{RESET}")
            sys.exit(1)

        print(f"\n{BOLD}{project.name}{RESET}")
        print(f"{DIM}ID: {project.id} │ Slug: {project.slug} │ Status: {project.status}{RESET}")
        if project.description:
            print(f"\n{project.description}")

        ctx = project.context
        if ctx.client_name:
            print(f"\n{BOLD}Client:{RESET} {ctx.client_name}")
        if ctx.d365_modules:
            print(f"{BOLD}Modules:{RESET} {', '.join(ctx.d365_modules)}")

        if project.decisions:
            print(f"\n{BOLD}Decisions ({len(project.decisions)}):{RESET}")
            for d in project.decisions[-5:]:
                print(f"  • {d.title}: {d.description[:80]}...")

        if project.raid_items:
            open_risks = [r for r in project.raid_items if r.category == 'risk' and r.status == 'open']
            if open_risks:
                print(f"\n{BOLD}{RED}Open Risks ({len(open_risks)}):{RESET}")
                for r in open_risks:
                    print(f"  [{r.severity.upper()}] {r.title}")

        if project.artifacts:
            print(f"\n{BOLD}Artifacts ({len(project.artifacts)}):{RESET}")
            for a in project.artifacts[-5:]:
                print(f"  • {a.title} ({a.artifact_type})")


def main():
    parser = argparse.ArgumentParser(
        prog='d365-architect',
        description='D365 Architect OS — AI-powered architecture assistant',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Examples:
          d365-architect chat "How does voice routing work in D365 Contact Center?"
          d365-architect chat "Design a CCaaS architecture" --mode architecture
          d365-architect chat "Troubleshoot routing issue" --mode troubleshoot --project my-client
          d365-architect artifact --type exec-summary --context "D365 migration project"
          d365-architect artifact --type architecture-doc --project my-project --output arch.md
          d365-architect projects list
          d365-architect projects create "EY Contact Center Migration"
          d365-architect projects show my-project
        """)
    )

    subparsers = parser.add_subparsers(dest='command', help='Command')

    # chat command
    chat_parser = subparsers.add_parser('chat', help='Ask the Architect Console a question')
    chat_parser.add_argument('message', nargs='*', help='Your question or request')
    chat_parser.add_argument('--mode', '-m', help='Mode: ARCHITECTURE, STRATEGY, DELIVERY, TROUBLESHOOT, INNOVATION, RESEARCH, ARTIFACT, REVIEW, DECISION, EXPLAIN')
    chat_parser.add_argument('--project', '-p', help='Project ID or slug for context')
    chat_parser.add_argument('--save', action='store_true', help='Save the response to the project')
    chat_parser.add_argument('--save-title', help='Title for saved artifact')

    # artifact command
    artifact_parser = subparsers.add_parser('artifact', help='Generate a specific artifact')
    artifact_parser.add_argument('--type', '-t', help='Artifact type (e.g. architecture-doc, exec-summary)')
    artifact_parser.add_argument('--context', '-c', help='Context for the artifact')
    artifact_parser.add_argument('--project', '-p', help='Project ID or slug')
    artifact_parser.add_argument('--output', '-o', help='Output file path')

    # projects command
    proj_parser = subparsers.add_parser('projects', help='Manage projects')
    proj_subparsers = proj_parser.add_subparsers(dest='action')
    proj_subparsers.add_parser('list', help='List all projects')
    create_p = proj_subparsers.add_parser('create', help='Create a new project')
    create_p.add_argument('name', nargs='*', help='Project name')
    show_p = proj_subparsers.add_parser('show', help='Show project details')
    show_p.add_argument('id', help='Project ID or slug')

    args = parser.parse_args()

    print_header()

    if not os.getenv('ANTHROPIC_API_KEY'):
        print(f"{RED}Error: ANTHROPIC_API_KEY not set.{RESET}")
        print(f"{DIM}Add it to your .env file or set it as an environment variable.{RESET}")
        sys.exit(1)

    if args.command == 'chat':
        cmd_chat(args)
    elif args.command == 'artifact':
        cmd_artifact(args)
    elif args.command == 'projects':
        if not args.action:
            proj_parser.print_help()
        else:
            cmd_projects(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
