'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Loader2, AtSign } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuraInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
}

export const AuraInput = ({ onSend, isLoading }: AuraInputProps) => {
  const [content, setContent] = useState('');
  const { openModal } = useDocumentStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (content.trim() && !isLoading) {
      onSend(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2 select-none">
      <div className={cn(
        "relative flex items-end gap-2 bg-white border border-slate-200 rounded-2xl p-2.5 transition-all duration-200 shadow-2xs",
        "focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-400/20 focus-within:shadow-md"
      )}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Orbit searches across your active sources..."
          className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 resize-none px-2 py-2 outline-none text-xs sm:text-sm max-h-[200px] custom-scrollbar"
          rows={1}
        />

        <div className="flex items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={openModal}
            title="Attach Source Document"
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-50"
          >
            <Paperclip size={18} />
          </motion.button>

          <motion.button
            whileHover={content.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={content.trim() && !isLoading ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!content.trim() || isLoading}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
              content.trim() && !isLoading 
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-2xs" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} />}
          </motion.button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
        <AtSign size={12} className="text-slate-400" /> Use <span className="font-semibold text-slate-600">@mention</span> a source to narrow the search
      </p>
    </div>
  );
};
