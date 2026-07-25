import type { PaymentProvider } from '../provider';

// TODO: Implement NewebPay with AES-256-CBC and SHA256 without changing domain code.
export const newebpayProvider: PaymentProvider = {
  name: 'newebpay',
  buildCheckout() {
    throw new Error('NewebPay provider is not implemented');
  },
  verifyCallback() {
    return null;
  },
  callbackSuccessResponse() {
    return '1|OK';
  },
};
