'use client';

import React from 'react';
import { FileText, Trash2, CheckCircle2, Loader2, AlertCircle, Cpu } from 'lucide-react';
import { useDocumentStore, type Document, type DocumentStatus } from '@/store/useDocumentStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig: Record<DocumentStatus, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Queued', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: Loader2 },
  PROCESSING: { label: 'Indexing', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Cpu },
  COMPLETED: { label: 'Connected', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-700 bg-red-50 border-red-200', icon: AlertCircle },
};

export const DocumentItem = ({ doc }: { doc: Document }) => {
  const { deleteDocument } = useDocumentStore();
  const config = statusConfig[doc.status];
  const Icon = config.icon;

  const fileSize = (doc.file_size / (1024 * 1024)).toFixed(2);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 hover:border-slate-300 transition-all duration-200 shadow-xs">
      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
        <FileText size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-slate-900 truncate">{doc.filename}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-500 font-mono">{fileSize} MB</span>
          <span className="text-slate-300">•</span>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
            config.color
          )}>
            <Icon size={10} className={cn(doc.status === 'PROCESSING' && "animate-spin")} />
            {config.label}
          </div>
        </div>
      </div>

      <button
        onClick={() => deleteDocument(doc.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 transition-all rounded-md hover:bg-red-50"
        title="Remove source"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

