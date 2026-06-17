import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use `||` (not `??`) so empty strings — which is what GitHub Actions injects
// for unset secrets — fall back to the placeholders below instead of being
// passed to createClient (which throws "supabaseUrl is required").
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
export const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
