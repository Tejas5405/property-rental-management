'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    api<User>('/api/auth/me')
      .then((u) => {
        const dest =
          u.role === 'admin'
            ? '/admin/dashboard'
            : u.role === 'manager'
              ? '/manager/dashboard'
              : '/tenant/dashboard';
        router.replace(dest);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}
