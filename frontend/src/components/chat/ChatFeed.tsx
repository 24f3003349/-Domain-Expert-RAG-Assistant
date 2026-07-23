'use client';

import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '@/store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatFeed = () => {
  const { messages, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Engineering Assistant</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Search or ask anything across your connected documents, research papers, and domain data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {[
            "Deployment steps for current project",
            "Identify potential risk bottlenecks",
            "Synthesize RAG architecture optimization",
            "Extract key performance metrics"
          ].map((prompt, idx) => (
            <button 
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:border-slate-400 hover:text-slate-900 transition-all text-left shadow-xs group"
            >
              <span className="opacity-0 group-hover:opacity-100 mr-1.5 text-blue-600 transition-opacity">→</span>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-8 space-y-2">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id || idx} 
                role={msg.role} 
                content={msg.content} 
                sources={msg.sources}
                isStreaming={isStreaming && idx === messages.length - 1}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} className="h-6" />
        </div>
      </div>
    </div>
  );
};

