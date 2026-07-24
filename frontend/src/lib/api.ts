// D365 Architect OS — API Client
import axios from 'axios';
import type { Project, ProjectContext, RAIDItem, Decision, Assumption } from '../types';

const api = axios.create({ baseURL: '/api' });

// ---- Projects ----

export const getProjects = () => api.get<Project[]>('/projects').then(r => r.data);

export const getProject = (id: string) => api.get<Project>(`/projects/${id}`).then(r => r.data);

export const createProject = (data: { name: string; description?: string; tags?: string[] }) =>
  api.post<Project>('/projects', data).then(r => r.data);

export const updateProject = (id: string, data: Partial<{
  name: string;
  description: string;
  status: string;
  context: Partial<ProjectContext>;
  tags: string[];
}>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data);

export const deleteProject = (id: string) => api.delete(`/projects/${id}`).then(r => r.data);

export const addRAIDItem = (projectId: string, item: Omit<RAIDItem, 'id' | 'created_at'>) =>
  api.post(`/projects/${projectId}/raid`, { id: '', created_at: '', ...item }).then(r => r.data);

export const addDecision = (projectId: string, decision: Omit<Decision, 'id' | 'created_at'>) =>
  api.post(`/projects/${projectId}/decisions`, { id: '', created_at: '', ...decision }).then(r => r.data);

export const addAssumption = (projectId: string, assumption: Omit<Assumption, 'id' | 'created_at'>) =>
  api.post(`/projects/${projectId}/assumptions`, { id: '', created_at: '', ...assumption }).then(r => r.data);

export const getProjectArtifacts = (id: string) =>
  api.get(`/projects/${id}/artifacts`).then(r => r.data);


// ---- Console ----

export const getModes = () => api.get('/console/modes').then(r => r.data);

export const getArtifactTypes = () => api.get('/console/artifact-types').then(r => r.data);

export const saveArtifact = (data: {
  project_id: string;
  title: string;
  artifact_type: string;
  content: string;
  tags?: string[];
}) => api.post('/console/save-artifact', data).then(r => r.data);

export const challengeDesign = (content: string, projectId?: string) =>
  api.post('/console/challenge', null, { params: { content, project_id: projectId } }).then(r => r.data);

export const whatAmIMissing = (context: string, projectId?: string) =>
  api.post('/console/what-am-i-missing', null, { params: { context, project_id: projectId } }).then(r => r.data);

export const generateArtifact = (artifactType: string, context: string, projectId?: string) =>
  api.post('/console/generate-artifact', null, {
    params: { artifact_type: artifactType, context, project_id: projectId }
  }).then(r => r.data);

export const getHealth = () => api.get('/health').then(r => r.data);


// ---- Streaming Console ----

export interface StreamEvent {
  type: 'intent' | 'mode' | 'chunk' | 'diagram' | 'artifact_suggestions' | 'follow_ups' | 'done' | 'error';
  data: unknown;
}

export interface StreamOptions {
  message: string;
  mode?: string;
  projectId?: string;
  includeProjectContext?: boolean;
  includeConversationHistory?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
  artifactType?: string;
  explainLevel?: string;
  onEvent: (event: StreamEvent) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
  signal?: AbortSignal;
}

export async function streamConsole(options: StreamOptions) {
  const {
    message, mode, projectId, includeProjectContext = true,
    includeConversationHistory = true, conversationHistory = [],
    artifactType, explainLevel, onEvent, onError, onDone, signal
  } = options;

  const body = {
    message,
    mode: mode === 'AUTO' ? null : mode,
    project_id: projectId || null,
    include_project_context: includeProjectContext,
    include_conversation_history: includeConversationHistory,
    conversation_history: conversationHistory,
    artifact_type: artifactType || null,
    explain_level: explainLevel === 'default' ? null : explainLevel,
  };

  try {
    const response = await fetch('/api/console/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    let gotDone = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            if (event.type === 'error') {
              onError?.(new Error(event.data as string));
            } else {
              onEvent(event);
            }
            if (event.type === 'done') {
              gotDone = true;
              onDone?.();
            }
          } catch {
            // ignore parse errors on individual lines
          }
        }
      }
    }
    // Stream closed without a 'done' event — still call onDone to unblock UI
    if (!gotDone) {
      onDone?.();
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      onError?.(err);
    }
  }
}
