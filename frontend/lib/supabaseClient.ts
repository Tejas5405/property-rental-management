import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Reads NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY. Persists the session in cookies so the
 * Next.js middleware can read it for route protection.
 */
// `||` (not `??`) so empty strings — what CI injects for unset secrets — fall
// back to placeholders instead of being passed to createBrowserClient (which
// throws "Your project's URL and API key are required" during prerender).
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
);
