import type { PaymentProvider } from './provider';
import { createEcpayProvider } from './providers/ecpay';
import { newebpayProvider } from './providers/newebpay';
import { DEFAULT_PAYMENT_PROVIDER } from './config';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function getProvider(name = process.env.PAYMENT_PROVIDER ?? DEFAULT_PAYMENT_PROVIDER): PaymentProvider {
  if (name === 'ecpay') {
    return createEcpayProvider({
      merchantId: requiredEnv('ECPAY_MERCHANT_ID'),
      hashKey: requiredEnv('ECPAY_HASH_KEY'),
      hashIv: requiredEnv('ECPAY_HASH_IV'),
      environment: process.env.ECPAY_ENV === 'production' ? 'production' : 'stage',
      appUrl: requiredEnv('APP_URL'),
    });
  }
  if (name === 'newebpay') return newebpayProvider;
  throw new Error(`Unsupported payment provider: ${name}`);
}
