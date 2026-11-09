'use client';

import React, { useState } from 'react';
import { Plus, FileText, Globe, Database, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';

interface RightDataSourcesPanelProps {
  onAddClick?: () => void;
}

export const RightDataSourcesPanel = ({ onAddClick }: RightDataSourcesPanelProps) => {
  const { documents, openModal } = useDocumentStore();
  const [selectedModel, setSelectedModel] = useState('Ollama granite4.2:8b');

  const handleAdd = onAddClick || openModal;

  return (
    <aside className="w-80 h-full bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 hidden xl:flex">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Data sources</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      {/* Main Sources List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Connected Sources */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Active Vault</p>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between group hover:border-slate-300 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">PDF Vault Documents</p>
                  <p className="text-[11px] text-slate-400">{documents.length} files indexed</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
            </div>
          </div>
        </div>

        {/* Available Sources */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Planned Integrations</p>

          <div className="space-y-2 opacity-70">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Domain Specifications</p>
                  <p className="text-[11px] text-slate-400">Roadmap</p>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                  <Globe size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Web Crawler Index</p>
                  <p className="text-[11px] text-slate-400">Roadmap</p>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                  <Database size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">PostgreSQL Connector</p>
                  <p className="text-[11px] text-slate-400">Roadmap</p>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Model Selector */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active LLM Engine</p>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-slate-400 pr-8 cursor-pointer"
          >
            <option value="Ollama granite4.2:8b">Ollama granite4.2:8b (Active)</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </aside>
  );
};
