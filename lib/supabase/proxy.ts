import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PAYMENTS_API_PREFIX, ROUTES } from '@/config/routes';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

const protectedRoutes = ROUTES.dashboard;

// 刷新 Supabase session（token 過期時換發）並對受保護路由做導向。
// 依 Supabase 官方 @supabase/ssr proxy 範例；cookie 一律用 getAll/setAll。
export async function updateSession(request: NextRequest) {
  // Payment callbacks have no browser session; provider signatures are authoritative.
  if (request.nextUrl.pathname.startsWith(PAYMENTS_API_PREFIX)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ 不要在 createServerClient 與 getUser() 之間插入其他程式碼，
  //    也不要移除 getUser()——它負責刷新 session，拿掉會導致隨機登出。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith(protectedRoutes);

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    return NextResponse.redirect(url);
  }

  // ⚠️ 必須原樣回傳 supabaseResponse，避免瀏覽器與伺服器 cookie 不同步。
  return supabaseResponse;
}
