'use client';

import React, { useEffect } from 'react';
import { Plus, MessageSquare, LayoutDashboard, Database, Users, Settings, LogOut, Layers } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDocumentStore } from '@/store/useDocumentStore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SidebarProps {
  activeTab?: 'chat' | 'overview' | 'sources' | 'agents' | 'settings';
  onTabChange?: (tab: 'chat' | 'overview' | 'sources' | 'agents' | 'settings') => void;
}

export const Sidebar = ({ activeTab = 'chat', onTabChange }: SidebarProps) => {
  const { chats, fetchChats, createChat, isLoading } = useChatStore();
  const { openModal } = useDocumentStore();
  const { user, logout } = useAuthStore();
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleNewChat = async () => {
    try {
      if (onTabChange) onTabChange('chat');
      const chat = await createChat('New Intelligence Sync');
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sources', label: 'Sources', icon: Database },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 h-full flex flex-col bg-white border-r border-slate-200 relative z-20 shrink-0 select-none">
      {/* App Branding */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <Layers size={16} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Orbit</span>
        </div>
      </div>

      {/* Main Navigation Links with Spring Layout Animation */}
      <div className="px-3 py-4 space-y-1 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onTabChange) onTabChange(item.id);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors font-medium relative",
                isActive ? "text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTabPill"
                  className="absolute inset-0 bg-slate-100/90 rounded-xl"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Icon size={16} className={cn("relative z-10 transition-colors", isActive ? "text-slate-900" : "text-slate-400")} />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar border-t border-slate-100">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent</p>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNewChat} 
            title="New Chat" 
            className="text-slate-400 hover:text-slate-700 p-0.5"
          >
            <Plus size={14} />
          </motion.button>
        </div>

        {chats.length === 0 && !isLoading && (
          <p className="text-xs text-slate-400 italic px-3">Deployment steps for Project X</p>
        )}

        {[
          "Deployment steps for Project X",
          "Login bug Jira tickets",
          "Engineering updates summary",
          "Q3 release notes",
          "Auth service architecture",
          "Onboarding doc review"
        ].map((title, idx) => (
          <motion.button
            key={idx}
            whileHover={{ x: 2 }}
            onClick={() => { if (onTabChange) onTabChange('chat'); }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 truncate block transition-all"
          >
            {title}
          </motion.button>
        ))}
      </div>

      {/* User Actions Footer */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-200">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
            {user?.email?.substring(0, 1).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.email ? user.email.split('@')[0] : 'Alex'}</p>
            <p className="text-[10px] text-slate-500">Domain Expert</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Log Out"
          >
            <LogOut size={14} />
          </motion.button>
        </div>
      </div>
    </aside>
  );
};

