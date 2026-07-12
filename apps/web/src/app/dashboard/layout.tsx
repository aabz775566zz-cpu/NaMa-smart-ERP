'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { BrandedLoader } from '@/components/branded-loader';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';
import { useAuthStore } from '@/lib/store';

/**
 * Route protection is client-side by design: the access token only ever
 * lives in memory (never a server-readable cookie), so Next.js Middleware
 * has nothing to check. This layout is the sole gate — it redirects on
 * 'unauthenticated' and otherwise renders the shell once the session
 * bootstrap (SessionBootstrap, mounted in the root layout) resolves.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-screen items-center justify-center">
        <BrandedLoader />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
