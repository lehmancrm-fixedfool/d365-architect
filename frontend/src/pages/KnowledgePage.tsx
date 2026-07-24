// Knowledge Page — quick reference for D365/Power Platform capabilities
import { useState } from 'react';
import { Boxes, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { useConsoleStore } from '../store/useConsoleStore';
import { useNavigate } from 'react-router-dom';

interface KnowledgeEntry {
  title: string;
  description: string;
  tags: string[];
  quickPrompt: string;
  category: string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    category: 'Contact Center',
    title: 'Unified Routing',
    description: 'Work classification, assignment rules, queues, and ML-based overflow routing',
    tags: ['routing', 'queues', 'contact-center'],
    quickPrompt: 'Explain how Unified Routing works in D365 Contact Center from work item creation to agent assignment'
  },
  {
    category: 'Contact Center',
    title: 'Voice Channel',
    description: 'Azure Communication Services integration, PSTN, BYOC, call recording',
    tags: ['voice', 'acs', 'pstn', 'contact-center'],
    quickPrompt: 'How do I set up the Voice Channel in D365 Contact Center? What are the ACS requirements and licensing?'
  },
  {
    category: 'Contact Center',
    title: 'Supervisor Analytics',
    description: 'Real-time dashboards, historical analytics, supervisor desktop capabilities',
    tags: ['analytics', 'supervisor', 'reporting'],
    quickPrompt: 'What supervisor analytics capabilities are available in D365 Contact Center?'
  },
  {
    category: 'Contact Center',
    title: 'Digital Channels',
    description: 'Chat, SMS, Email, WhatsApp, Facebook, Twitter/X integration patterns',
    tags: ['chat', 'sms', 'digital', 'omnichannel'],
    quickPrompt: 'What digital channels are supported in D365 Contact Center and how do I architect a multi-channel strategy?'
  },
  {
    category: 'AI & Copilot',
    title: 'Agent Copilot',
    description: 'AI-powered agent assistance — suggested replies, case summarization, knowledge search',
    tags: ['copilot', 'ai', 'agent-assist'],
    quickPrompt: 'What does Copilot for Customer Service provide agents? How does it reduce handle time?'
  },
  {
    category: 'AI & Copilot',
    title: 'Copilot Studio',
    description: 'Bot authoring, generative AI topics, Generative Answers, channel deployment',
    tags: ['copilot-studio', 'bots', 'pvaa', 'ai'],
    quickPrompt: 'How do I design an enterprise customer service bot in Copilot Studio with generative AI and D365 integration?'
  },
  {
    category: 'AI & Copilot',
    title: 'Azure OpenAI Integration',
    description: 'RAG patterns, GPT-4o, embeddings, content filtering with Power Platform',
    tags: ['azure-openai', 'rag', 'gpt', 'ai'],
    quickPrompt: 'How do I integrate Azure OpenAI with D365 Customer Service using Power Automate and Dataverse?'
  },
  {
    category: 'Power Platform',
    title: 'Dataverse Security Model',
    description: 'Business units, security roles, field-level security, record ownership, sharing',
    tags: ['dataverse', 'security', 'roles'],
    quickPrompt: 'Explain the Dataverse security model hierarchy and how to design roles for a Customer Service implementation'
  },
  {
    category: 'Power Platform',
    title: 'ALM & DevOps',
    description: 'Solution management, environments, pipelines, managed vs unmanaged solutions',
    tags: ['alm', 'devops', 'solutions', 'pipelines'],
    quickPrompt: 'Design an ALM strategy for a D365 Customer Service implementation using Power Platform pipelines'
  },
  {
    category: 'Power Platform',
    title: 'Power Automate',
    description: 'Cloud flows, business process flows, error handling, retry patterns, governance',
    tags: ['power-automate', 'flows', 'automation'],
    quickPrompt: 'What are the best practices for Power Automate flows in a D365 Customer Service context?'
  },
  {
    category: 'Azure',
    title: 'Azure Communication Services',
    description: 'Phone numbers, PSTN connectivity, SMS, email, video for Contact Center',
    tags: ['acs', 'azure', 'pstn', 'voice'],
    quickPrompt: 'How do I architect Azure Communication Services for D365 Contact Center voice integration?'
  },
  {
    category: 'Azure',
    title: 'Entra ID Integration',
    description: 'SSO, Conditional Access, App Registrations, Managed Identities, PIM',
    tags: ['entra', 'identity', 'sso', 'security'],
    quickPrompt: 'How should I design Entra ID integration for a D365 Customer Service deployment with external customers?'
  },
  {
    category: 'Architecture',
    title: 'D365 Contact Center Architecture',
    description: 'End-to-end reference architecture for contact center implementation',
    tags: ['architecture', 'contact-center', 'reference'],
    quickPrompt: 'Generate a comprehensive reference architecture for a D365 Contact Center implementation'
  },
  {
    category: 'Architecture',
    title: 'Integration Patterns',
    description: 'Common integration patterns: async, sync, event-driven, middleware',
    tags: ['integration', 'api', 'middleware', 'patterns'],
    quickPrompt: 'What are the recommended integration patterns for connecting D365 Customer Service with external systems?'
  },
  {
    category: 'Licensing',
    title: 'D365 Customer Service Licensing',
    description: 'Professional, Enterprise, Contact Center add-ons, Copilot licensing',
    tags: ['licensing', 'cost', 'commercial'],
    quickPrompt: 'Explain the D365 Customer Service licensing model including Contact Center and Copilot add-ons'
  },
];

const CATEGORIES = ['All', 'Contact Center', 'AI & Copilot', 'Power Platform', 'Azure', 'Architecture', 'Licensing'];

export function KnowledgePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const navigate = useNavigate();
  const { setMode } = useConsoleStore();

  const filtered = KNOWLEDGE_BASE.filter(entry => {
    const matchCategory = category === 'All' || entry.category === category;
    const matchSearch = !search ||
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase()) ||
      entry.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleExplore = (entry: KnowledgeEntry) => {
    // Navigate to console and pre-fill the prompt
    navigate('/');
    setMode('RESEARCH');
    // Small delay to allow navigation
    setTimeout(() => {
      const event = new CustomEvent('d365-quick-prompt', { detail: entry.quickPrompt });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-sm text-muted-lighter mt-1">
          Quick reference cards for D365, Power Platform, Azure, and Copilot capabilities
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full bg-surface-800 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-300 placeholder-muted focus:border-accent/50 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-surface-800 text-muted-lighter border border-white/5 hover:border-white/10 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((entry, i) => (
          <div
            key={i}
            className="group bg-surface-800 hover:bg-surface-700 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs text-accent font-medium">{entry.category}</span>
                <h3 className="text-base font-semibold text-white mt-0.5">{entry.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-lighter mb-4 leading-relaxed">{entry.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-surface-700 border border-white/10 text-muted-lighter rounded-full">
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleExplore(entry)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent/30 rounded-lg text-xs text-accent transition-all"
              >
                Explore
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes size={32} className="text-muted opacity-30 mb-4" />
          <p className="text-sm text-muted-lighter">No knowledge entries match your search</p>
        </div>
      )}
    </div>
  );
}
