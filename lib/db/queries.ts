import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { profiles } from './schema';
import { getCurrentUser } from '@/lib/auth/dal';

// 給 /api/user 與客戶端 SWR 使用；權威驗證統一走 DAL。
export async function getUser() {
  return getCurrentUser();
}

// 更新目前使用者的 profile 名稱。
export async function updateProfileName(userId: string, name: string) {
  await db
    .update(profiles)
    .set({ name, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}
