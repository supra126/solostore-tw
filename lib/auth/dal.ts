import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { profiles, type CurrentUser } from '@/lib/db/schema';
import { ROUTES } from '@/config/routes';

// 權威驗證：一律用 supabase.auth.getUser()（會向 Supabase 驗證 token），
// 不可只信任 proxy 的樂觀檢查。這是官方「Thin Proxy」模式的權威那一層。
// 用 React cache 讓同一次請求內多次呼叫只驗一次。
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 讀取 app 端 profile（name/role）；profile 由註冊 trigger 建立。
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return {
    id: user.id,
    email: user.email ?? '',
    name: profile?.name ?? null,
    role: profile?.role ?? 'member',
  };
});

// 受保護頁面／Server Action 用：沒登入就導回 /sign-in。
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.signIn);
  }
  return user;
});
