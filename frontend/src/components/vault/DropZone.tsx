'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DropZone = () => {
  const { uploadDocument, isUploading, error } = useDocumentStore();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        await uploadDocument(file);
      } catch (err) {
        // Error handled in store
      }
    }
  }, [uploadDocument]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await uploadDocument(e.target.files[0]);
      } catch (err) {
        // Error handled in store
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center text-center space-y-3 group overflow-hidden",
          isDragActive 
            ? "border-blue-600 bg-blue-50/50 scale-[1.01]" 
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50",
          isUploading && "opacity-60 cursor-not-allowed border-blue-400"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
          isDragActive ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500 shadow-xs"
        )}>
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <Upload size={22} className={cn(isDragActive && "animate-pulse")} />
          )}
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="text-xs font-bold text-slate-900">
            {isUploading ? "Uploading & Indexing Source..." : "Upload Document Source"}
          </h3>
          <p className="text-xs text-slate-500">
            {isDragActive ? "Drop PDF file to connect" : "Drag and drop PDF documents or click to browse"}
          </p>
        </div>

        <input
          type="file"
          accept=".pdf"
          disabled={isUploading}
          onChange={onFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {/* Status Indicators */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-3 flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        Supports PDF documents up to 25MB • Page level citation enabled
      </p>
    </div>
  );
};

