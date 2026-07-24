// D365 Architect OS — Type Definitions

export type Mode =
  | 'AUTO'
  | 'ARCHITECTURE'
  | 'STRATEGY'
  | 'DELIVERY'
  | 'TROUBLESHOOT'
  | 'INNOVATION'
  | 'RESEARCH'
  | 'ARTIFACT'
  | 'REVIEW'
  | 'DECISION'
  | 'EXPLAIN'
  | 'DEFAULT';

export type ArtifactType =
  | 'architecture-doc'
  | 'exec-summary'
  | 'raid-log'
  | 'adr'
  | 'backlog'
  | 'integration-spec'
  | 'data-model'
  | 'security-model'
  | 'presentation';

export type ExplainLevel = 'default' | 'executive' | 'developer' | 'simple';

export interface IntentClassification {
  intent: string;
  confidence: number;
  artifact_type: string;
  diagram_needed: boolean;
  complexity: string;
  domain: string;
  reasoning: string;
}

export interface ArtifactSuggestion {
  type: string;
  label: string;
  description: string;
}

export interface FollowUpSuggestion {
  label: string;
  prompt: string;
  mode: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  intent?: IntentClassification;
  diagram?: string;
  artifactSuggestions?: ArtifactSuggestion[];
  followUps?: FollowUpSuggestion[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ProjectContext {
  client_name: string;
  engagement_name: string;
  industry: string;
  region: string;
  d365_modules: string[];
  azure_services: string[];
  current_state: string;
  desired_state: string;
  key_challenges: string[];
  constraints: string[];
  stakeholders: string[];
}

export interface Assumption {
  id: string;
  text: string;
  validated: boolean;
  impact_if_wrong: string;
  created_at: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  alternatives: string[];
  status: string;
  created_at: string;
}

export interface RAIDItem {
  id: string;
  category: 'risk' | 'assumption' | 'issue' | 'dependency';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  owner: string;
  due_date?: string;
  mitigation?: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  title: string;
  artifact_type: string;
  content: string;
  metadata: Record<string, unknown>;
  version: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  context: ProjectContext;
  assumptions: Assumption[];
  decisions: Decision[];
  raid_items: RAIDItem[];
  artifacts: Artifact[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsoleState {
  messages: ChatMessage[];
  currentMode: Mode;
  currentProjectId: string | null;
  includeProjectContext: boolean;
  includeConversationHistory: boolean;
  isStreaming: boolean;
  activeArtifactType: ArtifactType | null;
  explainLevel: ExplainLevel;
}

export const MODE_COLORS: Record<string, string> = {
  ARCHITECTURE: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  STRATEGY: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  DELIVERY: 'text-green-400 bg-green-400/10 border-green-400/30',
  TROUBLESHOOT: 'text-red-400 bg-red-400/10 border-red-400/30',
  INNOVATION: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  RESEARCH: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  ARTIFACT: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  REVIEW: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  DECISION: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  EXPLAIN: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  DEFAULT: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  AUTO: 'text-slate-300 bg-slate-300/10 border-slate-300/30',
};

export const MODE_ICONS: Record<string, string> = {
  ARCHITECTURE: '🏗️',
  STRATEGY: '🎯',
  DELIVERY: '🚀',
  TROUBLESHOOT: '🔍',
  INNOVATION: '💡',
  RESEARCH: '📚',
  ARTIFACT: '📄',
  REVIEW: '🔎',
  DECISION: '⚖️',
  EXPLAIN: '🎓',
  DEFAULT: '💬',
  AUTO: '✨',
};

export const DOMAIN_LABELS: Record<string, string> = {
  'contact-center': 'Contact Center',
  'customer-service': 'Customer Service',
  'power-platform': 'Power Platform',
  'dataverse': 'Dataverse',
  'azure': 'Azure',
  'copilot': 'Copilot',
  'entra-id': 'Entra ID',
  'general': 'General',
};

export const ARTIFACT_TYPE_META: Record<string, { label: string; icon: string }> = {
  'architecture-doc': { label: 'Architecture Document', icon: '🏗️' },
  'exec-summary': { label: 'Executive Summary', icon: '📋' },
  'raid-log': { label: 'RAID Log', icon: '⚠️' },
  'adr': { label: 'Architecture Decision Record', icon: '📝' },
  'backlog': { label: 'User Story Backlog', icon: '📋' },
  'integration-spec': { label: 'Integration Specification', icon: '🔗' },
  'data-model': { label: 'Data Model', icon: '🗄️' },
  'security-model': { label: 'Security Model', icon: '🔒' },
  'presentation': { label: 'Presentation Outline', icon: '📊' },
};
