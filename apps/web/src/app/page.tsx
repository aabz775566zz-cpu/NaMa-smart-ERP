'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { BrandedLoader } from '@/components/branded-loader';
import { useAuthStore } from '@/lib/store';

/**
 * The real product lives at /dashboard (authenticated) and /login
 * (unauthenticated) — this route is just the entry point that sends
 * visitors to the right place once the session bootstrap resolves.
 */
export default function HomePage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <BrandedLoader />
    </main>
  );
}
