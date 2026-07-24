// D365 Architect OS — Console State Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatMessage, Mode, ArtifactType, ExplainLevel,
  IntentClassification, ArtifactSuggestion, FollowUpSuggestion
} from '../types';
import { generateId } from '../lib/utils';

interface ConsoleStore {
  // State
  messages: ChatMessage[];
  currentMode: Mode;
  currentProjectId: string | null;
  includeProjectContext: boolean;
  includeConversationHistory: boolean;
  isStreaming: boolean;
  activeArtifactType: ArtifactType | null;
  explainLevel: ExplainLevel;
  sidebarOpen: boolean;
  activeTab: 'answer' | 'diagram' | 'artifacts' | 'assumptions' | 'sources';

  // Actions
  setMode: (mode: Mode) => void;
  setProjectId: (id: string | null) => void;
  toggleProjectContext: () => void;
  toggleConversationHistory: () => void;
  setArtifactType: (type: ArtifactType | null) => void;
  setExplainLevel: (level: ExplainLevel) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: ConsoleStore['activeTab']) => void;

  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: () => ChatMessage;
  updateAssistantMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  setIntent: (id: string, intent: IntentClassification) => void;
  setDiagram: (id: string, diagram: string) => void;
  setArtifactSuggestions: (id: string, suggestions: ArtifactSuggestion[]) => void;
  setFollowUps: (id: string, followUps: FollowUpSuggestion[]) => void;
  setStreaming: (streaming: boolean) => void;
  finishMessage: (id: string) => void;
  clearMessages: () => void;

  getConversationHistory: () => Array<{ role: string; content: string }>;
  getLastAssistantMessage: () => ChatMessage | null;
}

export const useConsoleStore = create<ConsoleStore>()(
  persist(
    (set, get) => ({
      messages: [],
      currentMode: 'AUTO',
      currentProjectId: null,
      includeProjectContext: true,
      includeConversationHistory: true,
      isStreaming: false,
      activeArtifactType: null,
      explainLevel: 'default',
      sidebarOpen: true,
      activeTab: 'answer',

      setMode: (mode) => set({ currentMode: mode }),
      setProjectId: (id) => set({ currentProjectId: id }),
      toggleProjectContext: () => set(s => ({ includeProjectContext: !s.includeProjectContext })),
      toggleConversationHistory: () => set(s => ({ includeConversationHistory: !s.includeConversationHistory })),
      setArtifactType: (type) => set({ activeArtifactType: type }),
      setExplainLevel: (level) => set({ explainLevel: level }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      addUserMessage: (content) => {
        const msg: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        set(s => ({ messages: [...s.messages, msg] }));
        return msg;
      },

      addAssistantMessage: () => {
        const msg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };
        set(s => ({ messages: [...s.messages, msg] }));
        return msg;
      },

      updateAssistantMessage: (id, updates) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, ...updates } : m)
        }));
      },

      appendToMessage: (id, chunk) => {
        set(s => ({
          messages: s.messages.map(m =>
            m.id === id ? { ...m, content: m.content + chunk } : m
          )
        }));
      },

      setIntent: (id, intent) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, intent, mode: intent.intent } : m)
        }));
      },

      setDiagram: (id, diagram) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, diagram } : m)
        }));
      },

      setArtifactSuggestions: (id, suggestions) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, artifactSuggestions: suggestions } : m)
        }));
      },

      setFollowUps: (id, followUps) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, followUps } : m)
        }));
      },

      setStreaming: (isStreaming) => set({ isStreaming }),

      finishMessage: (id) => {
        set(s => ({
          messages: s.messages.map(m => m.id === id ? { ...m, isStreaming: false } : m),
          isStreaming: false,
        }));
      },

      clearMessages: () => set({ messages: [] }),

      getConversationHistory: () => {
        const { messages } = get();
        return messages
          .filter(m => !m.isStreaming)
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content }));
      },

      getLastAssistantMessage: () => {
        const { messages } = get();
        const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.isStreaming);
        return assistantMessages[assistantMessages.length - 1] ?? null;
      },
    }),
    {
      name: 'd365-architect-console',
      partialize: (state) => ({
        currentMode: state.currentMode,
        currentProjectId: state.currentProjectId,
        includeProjectContext: state.includeProjectContext,
        includeConversationHistory: state.includeConversationHistory,
        explainLevel: state.explainLevel,
        sidebarOpen: state.sidebarOpen,
        // Don't persist messages — fresh start each session
      }),
    }
  )
);

// Project store
interface ProjectStore {
  projects: import('../types').Project[];
  activeProject: import('../types').Project | null;
  setProjects: (projects: import('../types').Project[]) => void;
  setActiveProject: (project: import('../types').Project | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
}));
