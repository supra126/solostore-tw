import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase secret-key environment variables are not set');

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
