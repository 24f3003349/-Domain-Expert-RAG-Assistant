'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Only redirect AFTER client mount and hydration have verified there is no valid token
    if (mounted && isHydrated && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isHydrated, isAuthenticated, isLoading, router]);

  // Keep spinner while mounting or validating credentials from localStorage
  if (!mounted || !isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Restoring session...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
