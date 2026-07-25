import { getProvider } from '@/lib/payments';
import { fulfillOrder } from '@/lib/payments/fulfillment';
import { processPaymentCallback } from '@/lib/payments/process-callback';
import { createSupabasePaymentRepository } from '@/lib/payments/supabase-repository';

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const { provider: providerName } = await context.params;
    const provider = getProvider(providerName);
    const response = await processPaymentCallback(
      await request.text(),
      provider,
      createSupabasePaymentRepository(),
      fulfillOrder,
    );
    return new Response(response, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('Payment callback rejected', error);
    return new Response('Invalid callback', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
