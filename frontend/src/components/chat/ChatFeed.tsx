'use client';

import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '@/store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';

const STARTER_PROMPTS = [
  'Summarize the core methodology and architecture of the uploaded PDF',
  'Extract key mathematical equations and loss functions',
  'List all empirical findings and performance metrics',
  'Explain the main limitations and constraints discussed',
];

export const ChatFeed = () => {
  const { messages, isStreaming, activeChatId, createChat, sendMessage } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePromptClick = async (prompt: string) => {
    if (isStreaming) return;
    let currentId = activeChatId;
    if (!currentId) {
      const newChat = await createChat(prompt.substring(0, 30) + '...');
      currentId = newChat.id;
    }
    await sendMessage(prompt, true);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Engineering Assistant</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Search or ask anything across your connected PDF documents and technical papers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {STARTER_PROMPTS.map((prompt, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              disabled={isStreaming}
              className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:border-slate-400 hover:text-slate-900 transition-all text-left shadow-xs group disabled:opacity-50"
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
                thinking={msg.thinking}
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
