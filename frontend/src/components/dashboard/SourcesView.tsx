'use client';

import React from 'react';
import { FileText, CheckCircle2, ChevronRight, UploadCloud } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { DocumentItem } from '@/components/vault/DocumentItem';

export const SourcesView = () => {
  const { openModal, documents } = useDocumentStore();
  const completedCount = documents.filter((d) => d.status === 'COMPLETED').length;

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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">PDF Document Vault</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} /> {completedCount} Indexed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PDF parsing via SentenceSplitter (1024 token chunks, 256 overlap), Hybrid BM25 + ChromaDB Nomic Embeddings, and FlashRank Reranker.
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all shrink-0"
              >
                Manage Vault ({documents.length})
              </button>
            </div>

            {/* Full Document List with Delete Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              {documents.length === 0 ? (
                <div className="py-10 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                  <p className="text-xs text-slate-500">No PDF documents uploaded in your vault yet.</p>
                  <button
                    onClick={openModal}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Upload your first PDF →
                  </button>
                </div>
              ) : (
                documents.map((doc) => (
                  <DocumentItem key={doc.id} doc={doc} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
