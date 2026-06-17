'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useUser } from '@/lib/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/lib/types';

/**
 * Wraps a role-area layout: loads the current user, enforces the required
 * role, and renders the Sidebar + Navbar shell around the page content.
 */
export function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading, error } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (error || !user)) {
      router.push('/login');
    } else if (!loading && user && user.role !== role) {
      router.push('/redirect');
    }
  }, [loading, user, error, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-24 w-64" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        <Sidebar role={role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
