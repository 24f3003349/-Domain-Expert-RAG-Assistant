'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { RightDataSourcesPanel } from '@/components/dashboard/RightDataSourcesPanel';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { SourcesView } from '@/components/dashboard/SourcesView';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { AuraInput } from '@/components/chat/AuraInput';
import { VaultModal } from '@/components/vault/VaultModal';
import { Database, Sparkles, Share2, Plus } from 'lucide-react';

const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    content: 'What are the deployment steps for Project X?',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: `Here are the deployment steps for Project X, based on the latest Confluence runbook and Jira tickets:

## Deployment Overview
* **Pre-deploy checks** — Ensure all CI tests pass in the staging environment.
* **Database Migration** — Run \`migrate-prod\` script for the new schema updates.
* **Service Rollout** — Deploy the microservices via Kubernetes using the blue-green strategy.`,
    created_at: new Date().toISOString(),
    sources: [
      { id: 's1', filename: 'Confluence: Deploy Runbook', page_number: 4, score: 0.94 },
      { id: 's2', filename: 'PROJ-481', page_number: 1, score: 0.87 }
    ]
  }
];

export default function PreviewPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'overview' | 'sources' | 'agents' | 'settings'>('chat');

  const handleSend = (text: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      created_at: new Date().toISOString()
    };

    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: `### Synthesized Query Analysis\n* Evaluated document chunks regarding "${text}".\n* Verified deployment pipeline steps across active domain sources.`,
      created_at: new Date().toISOString(),
      sources: [
        { id: 's1', filename: 'Confluence: Deploy Runbook', page_number: 2, score: 0.95 }
      ]
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main Center Area */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
        {activeTab === 'overview' ? (
          <OverviewView />
        ) : activeTab === 'sources' ? (
          <SourcesView />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header matching Orbit Screenshot 2 */}
            <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-bold text-slate-900">Engineering Assistant</h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>4 sources active</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button title="Share" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 shadow-2xs">
                  <Share2 size={14} />
                </button>
              </div>
            </header>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-2 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600 shrink-0" />
                    <span><strong>Orbit Pixel-Perfect Replica Live</strong> — Use left sidebar tabs to view <strong>Chat</strong>, <strong>Overview</strong>, or <strong>Sources</strong>.</span>
                  </div>
                </div>

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    sources={msg.sources}
                  />
                ))}
              </div>
            </div>

            {/* Floating Input Bar */}
            <AuraInput onSend={handleSend} />
          </div>
        )}
      </main>

      {/* Right Data Sources Panel */}
      {activeTab === 'chat' && <RightDataSourcesPanel onAddClick={() => setIsModalOpen(true)} />}

      {/* Global Vault Modal */}
      <VaultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
