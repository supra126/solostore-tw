import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next.js 16：middleware 已更名為 proxy（函數名也是 proxy）。
// 這裡只做「刷新 session ＋ 樂觀導向」；受保護頁面的權威驗證在 lib/auth/dal.ts。
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 比對除下列以外的所有路徑：
     * - _next/static（靜態檔）
     * - _next/image（圖片最佳化）
     * - favicon.ico
     * - 常見圖片副檔名
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
