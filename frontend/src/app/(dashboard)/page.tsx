'use client';

import React from 'react';
import { ChatFeed } from '@/components/chat/ChatFeed';
import { AuraInput } from '@/components/chat/AuraInput';
import { useChatStore } from '@/store/useChatStore';
import { useDocumentStore } from '@/store/useDocumentStore';

export default function WorkspacePage() {
  const { sendMessage, isStreaming, activeChatId, createChat } = useChatStore();
  const { documents } = useDocumentStore();

  const activeSourcesCount = documents.filter((d) => d.status === 'COMPLETED').length;

  const handleSendMessage = async (content: string) => {
    let currentId = activeChatId;

    // If no active chat, create one automatically on first message
    if (!currentId) {
      const newChat = await createChat(content.substring(0, 30) + '...');
      currentId = newChat.id;
    }

    await sendMessage(content, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
      {/* Workspace Header - Orbit Light Bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-slate-900">Engineering Assistant</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            <span className={`w-2 h-2 rounded-full ${activeSourcesCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>
              {activeSourcesCount} {activeSourcesCount === 1 ? 'source' : 'sources'} active
            </span>
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
