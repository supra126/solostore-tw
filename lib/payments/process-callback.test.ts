import { describe, expect, it, vi } from 'vitest';
import type { PaymentProvider, ProviderOrder } from './provider';
import { processPaymentCallback, type PaymentRepository } from './process-callback';

const order: ProviderOrder = {
  id: 'order-id',
  orderNo: 'ORDER123',
  userId: 'user-id',
  productId: 'product-id',
  productName: 'E-book',
  amount: 500,
  provider: 'fakepay',
  status: 'pending',
};

function fakeProvider(): PaymentProvider {
  return {
    name: 'fakepay',
    buildCheckout: vi.fn(async () => ({ actionUrl: 'https://pay.test', fields: {} })),
    verifyCallback: vi.fn(() => ({
      orderNo: order.orderNo,
      success: true,
      tradeNo: 'TRADE-1',
      amount: 500,
      paidAt: new Date('2026-07-14T12:00:00Z'),
      raw: { signed: 'true' },
    })),
    callbackSuccessResponse: () => 'OK',
  };
}

describe('provider-independent payment flow', () => {
  it('runs order -> callback -> fulfill using a fake provider', async () => {
    const provider = fakeProvider();
    const repository: PaymentRepository = {
      findOrder: vi.fn(async () => order),
      recordCallback: vi.fn(async () => ({ becamePaid: true, order: { ...order, status: 'paid' as const } })),
    };
    const fulfill = vi.fn(async () => undefined);

    const response = await processPaymentCallback('signed=payload', provider, repository, fulfill);

    expect(response).toBe('OK');
    expect(repository.recordCallback).toHaveBeenCalledOnce();
    expect(fulfill).toHaveBeenCalledOnce();
  });

  it('upserts duplicate callbacks but fulfills only once', async () => {
    const provider = fakeProvider();
    let first = true;
    const repository: PaymentRepository = {
      findOrder: vi.fn(async () => order),
      recordCallback: vi.fn(async () => {
        const becamePaid = first;
        first = false;
        return { becamePaid, order: { ...order, status: 'paid' as const } };
      }),
    };
    const fulfill = vi.fn(async () => undefined);

    await processPaymentCallback('signed=payload', provider, repository, fulfill);
    await processPaymentCallback('signed=payload', provider, repository, fulfill);

    expect(repository.recordCallback).toHaveBeenCalledTimes(2);
    expect(fulfill).toHaveBeenCalledOnce();
  });

  it('rejects invalid signatures without touching storage', async () => {
    const provider = { ...fakeProvider(), verifyCallback: () => null };
    const repository: PaymentRepository = {
      findOrder: vi.fn(),
      recordCallback: vi.fn(),
    };

    await expect(processPaymentCallback('bad', provider, repository, vi.fn())).rejects.toThrow('Invalid payment callback');
    expect(repository.recordCallback).not.toHaveBeenCalled();
  });
});
