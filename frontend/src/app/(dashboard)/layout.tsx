'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { RightDataSourcesPanel } from '@/components/dashboard/RightDataSourcesPanel';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { SourcesView } from '@/components/dashboard/SourcesView';
import { VaultModal } from '@/components/vault/VaultModal';
import { useDocumentStore } from '@/store/useDocumentStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isModalOpen, closeModal, openModal } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'overview' | 'sources' | 'agents' | 'settings'>('chat');

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
        
        {/* Main Workspace Area */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
          {activeTab === 'overview' ? (
            <OverviewView />
          ) : activeTab === 'sources' ? (
            <SourcesView />
          ) : (
            children
          )}
        </main>

        {/* Right Data Sources Side Panel (Screenshot 1 & 2) */}
        {activeTab === 'chat' && <RightDataSourcesPanel onAddClick={openModal} />}

        {/* Global Vault Modal */}
        <VaultModal isOpen={isModalOpen} onClose={closeModal} />
      </div>
    </ProtectedRoute>
  );
}


