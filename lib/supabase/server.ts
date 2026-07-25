import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

// Server-side Supabase client（App Router）。
// 依 Supabase 官方 @supabase/ssr「Next.js Server-Side Auth」文件的 getAll/setAll 寫法。
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 內呼叫 setAll 會被擋——
            // 有 proxy 在刷新 session 的情況下可安全忽略。
          }
        },
      },
    }
  );
}
