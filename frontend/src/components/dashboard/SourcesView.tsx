'use client';

import React, { useState } from 'react';
import { FileText, Globe, Database, CheckCircle2, ChevronRight, UploadCloud, Info } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { motion } from 'framer-motion';

export const SourcesView = () => {
  const { openModal, documents } = useDocumentStore();
  const [selectedTab, setSelectedTab] = useState<'vault' | 'planned'>('vault');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Sources</span>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 font-bold">Data Management</span>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition-all"
        >
          <UploadCloud size={14} />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Active Integration: PDF Vault */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">PDF Document Vault</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Domain-specific PDF parsing via SentenceSplitter (1024 token chunks, 256 overlap) and Nomic Embeddings in ChromaDB.
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all"
              >
                Manage Vault ({documents.length})
              </button>
            </div>

            {/* Document list summary */}
            {documents.length > 0 && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documents.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-blue-600 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 truncate">{doc.filename}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{doc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planned Future Connectors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Integration Roadmap</h3>
              <span className="text-[11px] text-slate-400 font-medium">(Planned External Ingestion Connectors)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-2xs space-y-3 opacity-75">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 w-fit">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Confluence & Notion</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Direct OAuth synchronization for engineering runbooks and enterprise workspaces.</p>
                </div>
                <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Phase 2 Roadmap
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-2xs space-y-3 opacity-75">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 w-fit">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Web Crawler</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Automated sitemap crawling and DOM content cleaning for technical documentation.</p>
                </div>
                <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Phase 2 Roadmap
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-2xs space-y-3 opacity-75">
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 w-fit">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">PostgreSQL / SQL DWH</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Structured tabular querying and Text-to-SQL schema retrieval engine.</p>
                </div>
                <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Phase 2 Roadmap
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
