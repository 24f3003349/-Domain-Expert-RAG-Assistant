'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatFeed } from '@/components/chat/ChatFeed';
import { AuraInput } from '@/components/chat/AuraInput';
import { useChatStore } from '@/store/useChatStore';

export default function ChatSessionPage() {
  const { id } = useParams();
  const { fetchMessages, activeChatId, sendMessage, isStreaming } = useChatStore();

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchMessages(id);
    }
  }, [id, fetchMessages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
      {/* Session Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-slate-900">Sync Session Verified</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Connected</span>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <ChatFeed />

      {/* Input Area */}
      <AuraInput onSend={handleSendMessage} isLoading={isStreaming} />
    </div>
  );
}

