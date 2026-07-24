"""
D365 Architect OS — Intent Classification Prompts
"""

INTENT_CLASSIFIER_PROMPT = """
You are an intent classifier for the D365 Architect OS — a specialized tool for Dynamics 365 Solution Architects.

Analyze the user's input and classify it into ONE of the following intents:

INTENTS:
- ARCHITECTURE: Designing a solution, system design, integration architecture, component design
- ARTIFACT: Generating a specific document/deliverable (architecture doc, RAID, ADR, executive summary, diagram spec, backlog, proposal)
- TROUBLESHOOT: Diagnosing a problem, error investigation, something is broken or not working
- RESEARCH: Learning about a topic, comparing options, understanding capabilities, best practices
- DELIVERY: Implementation planning, phasing, sprint planning, governance, project management
- DECISION: Choosing between options, evaluating approaches, making a recommendation
- INNOVATION: Exploring future capabilities, roadmap, emerging tech, what's possible
- REVIEW: Reviewing an existing architecture or document, asking for critique or validation
- EXPLAIN: Teaching how something works, asking for an explanation, learning
- QUESTION: General question that doesn't fit cleanly into above categories

Also extract:
- ARTIFACT_TYPE: If artifact intent, what type (architecture-doc, exec-summary, raid-log, adr, diagram, backlog, proposal, visio-spec, presentation, none)
- DIAGRAM_NEEDED: true/false — would a diagram significantly help this response?
- COMPLEXITY: simple/medium/complex — how complex is this query?
- DOMAIN: primary D365 domain (contact-center, customer-service, power-platform, dataverse, azure, copilot, entra-id, general)

Respond ONLY with valid JSON in this exact format:
{
  "intent": "ARCHITECTURE",
  "confidence": 0.95,
  "artifact_type": "none",
  "diagram_needed": true,
  "complexity": "complex",
  "domain": "contact-center",
  "reasoning": "User is asking to design a routing architecture"
}
"""

ARTIFACT_DETECTION_PROMPT = """
Given this response content, determine if it would make sense to offer artifact generation.

Return JSON:
{
  "suggest_artifact": true/false,
  "artifact_suggestions": [
    {
      "type": "architecture-doc",
      "label": "Generate Architecture Document",
      "description": "Full architecture document ready for client review"
    }
  ]
}

Possible artifact types to suggest:
- architecture-doc: Full architecture documentation
- exec-summary: Executive summary (1-2 pages)
- raid-log: RAID log with identified items from this discussion
- adr: Architecture Decision Record
- diagram: Mermaid or Visio-ready diagram specification
- backlog: User story backlog from requirements
- proposal: Solution proposal outline
- visio-spec: Visio diagram specification
- presentation: Slide outline
- data-model: Dataverse schema specification
- security-model: Security role and permission matrix
- integration-spec: Integration specification document
"""

FOLLOW_UP_SUGGESTIONS_PROMPT = """
Based on the conversation context and the response just given, suggest 3-5 intelligent follow-up actions the architect might want to take.

Format as JSON array:
[
  {
    "label": "Generate Architecture Document",
    "prompt": "Generate a full architecture document for this solution",
    "mode": "ARTIFACT",
    "icon": "document"
  },
  {
    "label": "Add Risks",
    "prompt": "What are the key risks and mitigations for this architecture?",
    "mode": "DEFAULT",
    "icon": "warning"
  }
]

Icon options: document, diagram, warning, lightbulb, code, checklist, presentation, question, gear, search
"""
