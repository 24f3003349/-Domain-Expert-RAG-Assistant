'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Database, Info } from 'lucide-react';
import { DropZone } from './DropZone';
import { DocumentItem } from './DocumentItem';
import { useDocumentStore } from '@/store/useDocumentStore';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultModal = ({ isOpen, onClose }: VaultModalProps) => {
  const { documents, fetchDocuments, isLoading } = useDocumentStore();

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen, fetchDocuments]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-slate-900" />
                  <h2 className="text-lg font-bold text-slate-900">Data Sources</h2>
                </div>
                <p className="text-xs text-slate-500">Manage connected domain documents and files</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              {/* Upload Section */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Cpu size={15} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Add New Source</span>
                </div>
                <DropZone />
              </section>

              {/* Document List */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Database size={15} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Connected Sources</span>
                  </div>
                  <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    {documents.length} connected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {isLoading && documents.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center space-y-3">
                      <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                      <p className="text-xs text-slate-500">Loading data sources...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="py-16 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <Info size={32} className="mb-2 text-slate-300" />
                      <p className="text-xs italic text-slate-500">No data sources connected yet.</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <DocumentItem key={doc.id} doc={doc} />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                All connected sources are securely indexed for domain retrieval
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

