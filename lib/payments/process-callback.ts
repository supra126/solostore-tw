import type { PaymentProvider, ProviderOrder, VerifiedCallback } from './provider';

export interface PaymentRepository {
  findOrder(orderNo: string): Promise<ProviderOrder | null>;
  recordCallback(
    order: ProviderOrder,
    callback: VerifiedCallback,
  ): Promise<{ becamePaid: boolean; order: ProviderOrder }>;
}

export type FulfillOrder = (order: ProviderOrder) => Promise<void>;

export async function processPaymentCallback(
  rawBody: string,
  provider: PaymentProvider,
  repository: PaymentRepository,
  fulfillOrder: FulfillOrder,
): Promise<string> {
  const callback = provider.verifyCallback(rawBody);
  if (!callback) throw new Error('Invalid payment callback');

  const order = await repository.findOrder(callback.orderNo);
  if (!order || order.provider !== provider.name || order.amount !== callback.amount) {
    throw new Error('Payment callback does not match an order');
  }

  const result = await repository.recordCallback(order, callback);
  if (result.becamePaid) await fulfillOrder(result.order);

  return provider.callbackSuccessResponse();
}
