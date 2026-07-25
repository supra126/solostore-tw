import { getProvider } from '@/lib/payments';
import { ROUTES } from '@/config/routes';

function resultPage(message: string): string {
  return `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>付款結果</title></head><body><main><h1>${message}</h1><p>付款結果以商店收到的背景通知為準。</p><a href="${ROUTES.dashboard}">返回控制台</a></main></body></html>`;
}

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider: providerName } = await context.params;
  try {
    const result = getProvider(providerName).verifyCallback(await request.text());
    const message = result?.success ? '付款已送出' : '付款未完成';
    return new Response(resultPage(message), { status: result ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch {
    return new Response(resultPage('無法驗證付款結果'), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
