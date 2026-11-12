'use client';

import React from 'react';
import { Calendar, MessageSquare, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import { useDocumentStore } from '@/store/useDocumentStore';
import Link from 'next/link';

export const OverviewView = () => {
  const { chats } = useChatStore();
  const { documents } = useDocumentStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-[#f8fafc]"
    >
      {/* Overview Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status of connected intelligence vaults and sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar size={14} className="text-slate-400" />
            <span>Live Session</span>
          </div>
        </div>
      </motion.div>

      {/* Real Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Indexed Documents */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Indexed Documents</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{documents.length}</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> PDF Vault Active
          </p>
        </motion.div>

        {/* Metric 2: Active Chat Sessions */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Intelligence Sessions</p>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{chats.length}</p>
          </div>
          <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <MessageSquare size={14} /> Synced Sessions
          </p>
        </motion.div>

        {/* Metric 3: Active LLM Engine */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">LLM Engine</p>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">Granite 4.2:8b</p>
          </div>
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Layers size={14} /> Local Ollama (Active)
          </p>
        </motion.div>

        {/* Metric 4: Vector Index Engine */}
        <motion.div 
          whileHover={{ y: -2 }} 
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
        >
          <p className="text-xs font-medium text-slate-500">Vector Store</p>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">ChromaDB</p>
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> Nomic + BM25 + FlashRank
          </p>
        </motion.div>
      </motion.div>

      {/* Middle Section: Recent Sessions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
          <h3 className="text-base font-bold text-slate-900">Recent Sessions</h3>

          <div className="space-y-3">
            {chats.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 italic">No sessions recorded yet. Start a conversation from the sidebar.</p>
            ) : (
              chats.slice(0, 5).map((chat) => (
                <Link 
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-none pb-3.5 block"
                >
                  <div className="p-2.5 rounded-xl border bg-blue-50 text-blue-600 border-blue-100 shrink-0">
                    <MessageSquare size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{chat.title || 'Untitled Session'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(chat.created_at).toLocaleString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Stack: Vault Storage Details */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Document Vault</h3>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
              ) : (
                documents.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <p className="text-xs font-medium text-slate-800 truncate">{doc.filename}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                      {doc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
