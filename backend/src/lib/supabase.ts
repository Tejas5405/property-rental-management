import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Warn instead of throwing so the server (and /health) can boot without
  // credentials (e.g. in CI build steps). Any actual DB call will surface a
  // clear auth error at runtime.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — DB calls will fail until set.'
  );
}

/**
 * Service-role Supabase client. Bypasses Row-Level Security, so every query
 * MUST be scoped in application code (repositories) according to the caller's
 * role. Never expose this client or its key to the frontend.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  serviceRoleKey ?? 'missing-service-role-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verifies a Supabase-issued JWT and returns the associated auth user id.
 * Returns null when the token is missing or invalid.
 */
export async function verifyToken(jwt: string): Promise<{ id: string; email: string } | null> {
  if (!jwt) return null;
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}
