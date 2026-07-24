"""
MCP (Model Context Protocol) Tools for Artifact Generation Skills

Exposes artifact generation skills as MCP tools that can be invoked by:
- Copilot Studio agents
- Other AI agents through MCP protocol
- External applications via REST API

MCP Tool Specification:
Each skill is wrapped as an MCP tool with:
- Name and description
- Input schema
- Output schema
- Error handling
"""

import json
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class MCPToolDefinition:
    """Defines an MCP tool specification."""
    
    def __init__(self, name: str, description: str, 
                 input_schema: Dict[str, Any],
                 category: str = "artifact_generation"):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.category = category
        self.created_at = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to MCP tool definition dict."""
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "input_schema": self.input_schema,
            "created_at": self.created_at,
        }


# =============================================================================
# MCP TOOL: PowerPoint Deck Generator
# =============================================================================

POWERPOINT_TOOL = MCPToolDefinition(
    name="generate_powerpoint_deck",
    description="Generate a management consulting-grade PowerPoint presentation based on architecture recommendations. Supports multiple templates: strategy_recommendation, architecture_deep_dive, findings_report, implementation_roadmap.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["template_type", "customer_name"],
        "properties": {
            "template_type": {
                "type": "string",
                "enum": [
                    "strategy_recommendation",
                    "architecture_deep_dive",
                    "findings_report",
                    "implementation_roadmap"
                ],
                "description": "Type of presentation template to use"
            },
            "customer_name": {
                "type": "string",
                "description": "Customer/organization name for the presentation"
            },
            "architecture_summary": {
                "type": "string",
                "description": "Executive summary of the architecture recommendation"
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of key recommendations"
            },
            "risks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "risk": {"type": "string"},
                        "impact": {"type": "string"},
                        "mitigation": {"type": "string"}
                    }
                },
                "description": "List of risks with mitigation strategies"
            },
            "benefits": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Expected benefits of the solution"
            },
            "success_metrics": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Success metrics and KPIs"
            },
            "roadmap": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Implementation phases and timeline"
            },
            "output_path": {
                "type": "string",
                "description": "Path to save the generated presentation (optional, defaults to ./generated_decks)"
            }
        }
    }
)


# =============================================================================
# MCP TOOL: Excel Dashboard Generator
# =============================================================================

EXCEL_TOOL = MCPToolDefinition(
    name="generate_excel_dashboard",
    description="Generate an executive dashboard or analysis spreadsheet in Excel. Useful for cost-benefit analysis, integration inventory, risk assessment matrices.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["customer_name"],
        "properties": {
            "customer_name": {
                "type": "string",
                "description": "Customer/organization name"
            },
            "dashboard_type": {
                "type": "string",
                "enum": [
                    "cost_benefit",
                    "integration_inventory",
                    "risk_assessment",
                    "implementation_timeline",
                    "comparison_matrix"
                ],
                "description": "Type of dashboard/analysis"
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of recommendations"
            },
            "risks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "risk": {"type": "string"},
                        "impact": {"type": "string"},
                        "mitigation": {"type": "string"}
                    }
                },
                "description": "Risk register data"
            },
            "integration_inventory": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "system": {"type": "string"},
                        "data_flow": {"type": "string"},
                        "frequency": {"type": "string"},
                        "complexity": {"type": "string"}
                    }
                },
                "description": "List of integrations"
            },
            "output_path": {
                "type": "string",
                "description": "Path to save the Excel file (optional)"
            }
        }
    }
)


# =============================================================================
# MCP TOOL: Process Flow Diagram Generator
# =============================================================================

PROCESS_FLOW_TOOL = MCPToolDefinition(
    name="generate_process_flow_diagram",
    description="Generate architecture, integration flow, or process diagrams in Mermaid format (can be converted to Visio, PNG, SVG). Supports architecture diagrams, integration flows, BPMN processes.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["diagram_type"],
        "properties": {
            "diagram_type": {
                "type": "string",
                "enum": [
                    "architecture",
                    "integration",
                    "process",
                    "dataflow",
                    "swimlane"
                ],
                "description": "Type of diagram to generate"
            },
            "output_format": {
                "type": "string",
                "enum": ["mermaid", "bpmn", "svg", "png"],
                "default": "mermaid",
                "description": "Output format for the diagram"
            },
            "customer_name": {
                "type": "string",
                "description": "Customer/organization name"
            },
            "architecture_components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "category": {"type": "string"},
                        "description": {"type": "string"}
                    }
                },
                "description": "Architecture components for the diagram"
            },
            "integrations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "source": {"type": "string"},
                        "target": {"type": "string"},
                        "data_flow": {"type": "string"}
                    }
                },
                "description": "Integration connections"
            },
            "output_path": {
                "type": "string",
                "description": "Path to save the diagram (optional)"
            }
        }
    }
)


# =============================================================================
# MCP TOOL: Figma Design Asset Generator
# =============================================================================

FIGMA_TOOL = MCPToolDefinition(
    name="generate_figma_design_asset",
    description="Create design assets and prototypes in Figma (requires Figma API token). Useful for UI mockups, user journey maps, design system components.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["asset_type"],
        "properties": {
            "asset_type": {
                "type": "string",
                "enum": [
                    "ui_mockup",
                    "user_journey_map",
                    "workflow_prototype",
                    "design_system",
                    "wireframe"
                ],
                "description": "Type of design asset"
            },
            "project_name": {
                "type": "string",
                "description": "Figma project name"
            },
            "description": {
                "type": "string",
                "description": "Description of the design asset"
            },
            "requirements": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Design requirements or user stories"
            },
            "figma_api_token": {
                "type": "string",
                "description": "Figma API token (will be securely retrieved from env if not provided)"
            },
            "output_url": {
                "type": "boolean",
                "default": True,
                "description": "Return Figma URL for the created asset"
            }
        }
    }
)


# =============================================================================
# MCP TOOL: Visio Diagram Generator
# =============================================================================

VISIO_TOOL = MCPToolDefinition(
    name="generate_visio_diagram",
    description="Create professional Visio diagrams for architecture, process flows, and system designs. Outputs .vsdx format compatible with Microsoft Visio.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["diagram_type"],
        "properties": {
            "diagram_type": {
                "type": "string",
                "enum": [
                    "network_diagram",
                    "database_diagram",
                    "flowchart",
                    "organization_chart",
                    "timeline"
                ],
                "description": "Type of Visio diagram"
            },
            "title": {
                "type": "string",
                "description": "Diagram title"
            },
            "elements": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "shape": {"type": "string"},
                        "properties": {"type": "object"}
                    }
                },
                "description": "Diagram elements and shapes"
            },
            "connections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "from": {"type": "string"},
                        "to": {"type": "string"},
                        "label": {"type": "string"}
                    }
                },
                "description": "Connections between elements"
            },
            "output_path": {
                "type": "string",
                "description": "Path to save the Visio file"
            }
        }
    }
)


# =============================================================================
# MCP TOOL: Artifact Bundle Generator
# =============================================================================

ARTIFACT_BUNDLE_TOOL = MCPToolDefinition(
    name="generate_artifact_bundle",
    description="Generate a complete customer deliverable bundle including PowerPoint, Excel, diagrams, and documentation. This orchestrates multiple artifact skills into a cohesive package.",
    category="artifact_generation",
    input_schema={
        "type": "object",
        "required": ["bundle_type", "customer_name"],
        "properties": {
            "bundle_type": {
                "type": "string",
                "enum": [
                    "architecture_recommendation",
                    "implementation_plan",
                    "assessment_report",
                    "executive_briefing"
                ],
                "description": "Type of artifact bundle"
            },
            "customer_name": {
                "type": "string",
                "description": "Customer/organization name"
            },
            "include_powerpoint": {
                "type": "boolean",
                "default": True,
                "description": "Include PowerPoint presentation"
            },
            "include_excel": {
                "type": "boolean",
                "default": True,
                "description": "Include Excel analysis"
            },
            "include_diagrams": {
                "type": "boolean",
                "default": True,
                "description": "Include architecture diagrams"
            },
            "include_documentation": {
                "type": "boolean",
                "default": True,
                "description": "Include technical documentation"
            },
            "architecture_data": {
                "type": "object",
                "description": "Complete architecture analysis data"
            },
            "output_path": {
                "type": "string",
                "description": "Path to save the artifact bundle (creates timestamped folder)"
            }
        }
    }
)


# =============================================================================
# MCP Tools Registry
# =============================================================================

class MCPToolsRegistry:
    """Registry of all MCP tools for artifact generation."""
    
    def __init__(self):
        self.tools = {
            "generate_powerpoint_deck": POWERPOINT_TOOL,
            "generate_excel_dashboard": EXCEL_TOOL,
            "generate_process_flow_diagram": PROCESS_FLOW_TOOL,
            "generate_figma_design_asset": FIGMA_TOOL,
            "generate_visio_diagram": VISIO_TOOL,
            "generate_artifact_bundle": ARTIFACT_BUNDLE_TOOL,
        }
    
    def get_tool(self, tool_name: str) -> Dict[str, Any]:
        """Get MCP tool definition."""
        tool = self.tools.get(tool_name)
        if not tool:
            return {"error": f"Tool not found: {tool_name}"}
        return tool.to_dict()
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available MCP tools."""
        return [tool.to_dict() for tool in self.tools.values()]
    
    def export_for_copilot_studio(self) -> Dict[str, Any]:
        """
        Export tool definitions in format suitable for Copilot Studio.
        
        This format can be imported into Copilot Studio to make artifact
        generation skills available as agent actions.
        """
        return {
            "integration_type": "mcp_tools",
            "integration_name": "D365_Architect_Artifact_Generation",
            "description": "Artifact generation skills for D365 architect agent (PowerPoint, Excel, Diagrams, Figma)",
            "version": "1.0",
            "created_at": datetime.utcnow().isoformat(),
            "tools": self.list_tools(),
            "dependencies": {
                "python_pptx": "pip install python-pptx",
                "openpyxl": "pip install openpyxl",
                "figma_api": "pip install figma-api",
                "python_vsdx": "pip install python-vsdx (optional for Visio)"
            },
            "usage": {
                "powerpoint": "Generate strategy decks, architecture presentations, findings reports",
                "excel": "Generate cost-benefit analysis, risk matrices, integration inventory",
                "diagrams": "Generate architecture, integration flow, and process diagrams",
                "figma": "Create UI mockups and design prototypes",
                "visio": "Create professional engineering diagrams"
            }
        }


# =============================================================================
# Artifact Generation API Endpoint Specs
# =============================================================================

ARTIFACT_API_SPEC = {
    "openapi": "3.0.0",
    "info": {
        "title": "D365 Architect Artifact Generation API",
        "version": "1.0.0",
        "description": "REST API for generating management consulting-level artifacts"
    },
    "paths": {
        "/artifacts/powerpoint": {
            "post": {
                "summary": "Generate PowerPoint presentation",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": POWERPOINT_TOOL.input_schema
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "PowerPoint file generated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "artifact_path": {"type": "string"},
                                        "artifact_type": {"type": "string"},
                                        "download_url": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/artifacts/excel": {
            "post": {
                "summary": "Generate Excel dashboard",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": EXCEL_TOOL.input_schema
                        }
                    }
                }
            }
        },
        "/artifacts/diagrams": {
            "post": {
                "summary": "Generate process flow diagrams",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": PROCESS_FLOW_TOOL.input_schema
                        }
                    }
                }
            }
        },
        "/artifacts/bundle": {
            "post": {
                "summary": "Generate complete artifact bundle",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": ARTIFACT_BUNDLE_TOOL.input_schema
                        }
                    }
                }
            }
        },
        "/tools": {
            "get": {
                "summary": "List available artifact generation tools",
                "responses": {
                    "200": {
                        "description": "List of MCP tools"
                    }
                }
            }
        }
    }
}


if __name__ == "__main__":
    # Export tool registry
    registry = MCPToolsRegistry()
    
    print("=== Available MCP Tools ===\n")
    for tool in registry.list_tools():
        print(f"Tool: {tool['name']}")
        print(f"  Description: {tool['description']}")
        print(f"  Category: {tool['category']}\n")
    
    print("\n=== Copilot Studio Integration ===\n")
    cs_config = registry.export_for_copilot_studio()
    print(json.dumps(cs_config, indent=2))
