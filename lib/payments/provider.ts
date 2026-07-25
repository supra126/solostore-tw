export type PaymentProviderName = 'ecpay' | 'newebpay' | (string & {});
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ProviderOrder = {
  id: string;
  orderNo: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  provider: PaymentProviderName;
  status: OrderStatus;
};

export type Checkout = {
  actionUrl: string;
  fields: Record<string, string>;
};

export type VerifiedCallback = {
  orderNo: string;
  success: boolean;
  tradeNo: string | null;
  amount: number;
  paidAt: Date | null;
  raw: Record<string, string>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  buildCheckout(order: ProviderOrder): Promise<Checkout> | Checkout;
  verifyCallback(rawBody: string): VerifiedCallback | null;
  callbackSuccessResponse(): string;
}
