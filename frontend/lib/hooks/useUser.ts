'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/** Fetches the authenticated user's profile from the backend (/api/auth/me). */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<User>('/api/auth/me')
      .then((u) => active && setUser(u))
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { user, loading, error };
}
