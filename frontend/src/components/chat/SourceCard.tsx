'use client';

import React from 'react';
import { FileText, ExternalLink, Zap } from 'lucide-react';
import { type Source } from '@/store/useChatStore';
import { useDocumentStore } from '@/store/useDocumentStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SourceCardProps {
  source: Source;
}

export const SourceCard = ({ source }: SourceCardProps) => {
  const { openModal } = useDocumentStore();
  
  // Calculate a visual "relevance" width based on score
  const relevanceWidth = Math.min(Math.max(source.score * 100, 10), 100);

  return (
    <div className="group flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500">
            <FileText size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {source.filename}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Fragment p.{source.page_number}
            </p>
          </div>
        </div>
        
        <button 
          onClick={openModal}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
          title="Inspect Source"
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Relevance Meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Zap size={8} className="text-blue-600" /> Relevance
          </span>
          <span>{Math.round(relevanceWidth)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${relevanceWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

