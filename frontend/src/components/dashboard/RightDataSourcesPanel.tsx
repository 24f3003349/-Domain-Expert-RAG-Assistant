'use client';

import React from 'react';
import { Plus, FileText, Cpu } from 'lucide-react';
import { useDocumentStore, type DocumentStatus } from '@/store/useDocumentStore';

interface RightDataSourcesPanelProps {
  onAddClick?: () => void;
}

const statusDotColor: Record<DocumentStatus, string> = {
  COMPLETED: 'bg-emerald-500',
  PROCESSING: 'bg-blue-500 animate-pulse',
  PENDING: 'bg-amber-400 animate-pulse',
  FAILED: 'bg-rose-500',
};

export const RightDataSourcesPanel = ({ onAddClick }: RightDataSourcesPanelProps) => {
  const { documents, openModal } = useDocumentStore();
  const handleAdd = onAddClick || openModal;

  const completedCount = documents.filter((d) => d.status === 'COMPLETED').length;

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
        {/* Active Vault Summary */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Active Vault</p>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between group hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">PDF Vault Documents</p>
                <p className="text-[11px] text-slate-400">
                  {completedCount} of {documents.length} {documents.length === 1 ? 'file' : 'files'} indexed
                </p>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${completedCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
              title={completedCount > 0 ? 'Active' : 'Empty'}
            />
          </button>
        </div>

        {/* Real Uploaded Documents List */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Connected Files ({documents.length})
          </p>

          {documents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500">No PDF files uploaded yet.</p>
              <button
                type="button"
                onClick={handleAdd}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Upload a PDF to start →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={handleAdd}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">
                        {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • {doc.status}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor[doc.status]}`}
                    title={doc.status}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Engine Status (Static truth matching backend configuration) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active RAG Pipeline</p>
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Cpu size={14} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">granite4.2:8b</p>
              <p className="text-[10px] text-slate-400 truncate">BM25 + Chroma + FlashRank</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Local Ollama" />
        </div>
      </div>
    </aside>
  );
};
