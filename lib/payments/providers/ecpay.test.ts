import { describe, expect, it } from 'vitest';
import {
  createEcpayProvider,
  generateCheckMacValue,
  verifyCheckMacValue,
} from './ecpay';

const credentials = {
  merchantId: '3002607',
  hashKey: 'pwFHCqoQZGmho4w6',
  hashIv: 'EkRm7iFT261dpevs',
  environment: 'stage' as const,
  appUrl: 'https://shop.example.com',
};

describe('ECPay CheckMacValue', () => {
  it('matches the official AIO SHA256 test vector', () => {
    expect(
      generateCheckMacValue(
        {
          MerchantID: '3002607',
          MerchantTradeNo: 'Test1234567890',
          MerchantTradeDate: '2025/01/01 12:00:00',
          PaymentType: 'aio',
          TotalAmount: '100',
          TradeDesc: '測試',
          ItemName: '測試商品',
          ReturnURL: 'https://example.com/notify',
          ChoosePayment: 'ALL',
          EncryptType: '1',
        },
        credentials.hashKey,
        credentials.hashIv,
      ),
    ).toBe('291CBA324D31FB5A4BBBFDF2CFE5D32598524753AFD4959C3BF590C5B2F57FB2');
  });

  it.each([
    [{ MerchantID: '3002607', ItemName: 'Test~Product', TotalAmount: '200' }, 'CEEAE01D2F9A8E74D4AC0DCE7735B046D73F35A5EC99558A31A2EE03159DA1C9'],
    [{ MerchantID: '3002607', ItemName: 'My Test Product', TotalAmount: '300' }, '7712A5E6EDC3B57086063C88568084C66CE882A21D40E74DE5ACA3B478C6F316'],
  ])('matches the official special-character vector %#', (params, expected) => {
    expect(generateCheckMacValue(params, credentials.hashKey, credentials.hashIv)).toBe(expected);
  });

  it('verifies valid callbacks and rejects altered callbacks', () => {
    const callback = {
      MerchantID: '3002607',
      MerchantTradeNo: 'Test1234567890',
      RtnCode: '1',
      RtnMsg: 'Succeeded',
      TradeNo: '2301011234567890',
      TradeAmt: '100',
      PaymentDate: '2025/01/01 12:05:00',
      PaymentType: 'Credit_CreditCard',
      TradeDate: '2025/01/01 12:00:00',
      SimulatePaid: '0',
      CheckMacValue: '2AB536D86AFF8E1086744D59175040A32538C96B1C28C4135B551BD728E913B8',
    };

    expect(verifyCheckMacValue(callback, credentials.hashKey, credentials.hashIv)).toBe(true);
    expect(verifyCheckMacValue({ ...callback, TradeAmt: '101' }, credentials.hashKey, credentials.hashIv)).toBe(false);
  });
});

describe('ECPay provider', () => {
  it('builds an AIO checkout with separate callback and return URLs', async () => {
    const provider = createEcpayProvider(credentials, () => new Date('2026-07-14T04:34:56.000Z'));
    const checkout = await provider.buildCheckout({
      id: 'order-id',
      orderNo: 'O20260714ABC123',
      userId: 'user-id',
      productId: 'product-id',
      productName: 'TypeScript 課程',
      amount: 1200,
      provider: 'ecpay',
      status: 'pending',
    });

    expect(checkout.actionUrl).toBe('https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5');
    expect(checkout.fields.MerchantTradeDate).toBe('2026/07/14 12:34:56');
    expect(checkout.fields.ReturnURL).toBe('https://shop.example.com/api/payments/callback/ecpay');
    expect(checkout.fields.OrderResultURL).toBe('https://shop.example.com/api/payments/return/ecpay');
    expect(checkout.fields.CheckMacValue).toMatch(/^[A-F0-9]{64}$/);
  });

  it('rejects product text that ECPay WAF treats as a system command', async () => {
    const provider = createEcpayProvider(credentials);
    await expect(() => provider.buildCheckout({
      id: 'order-id', orderNo: 'SAFEORDER1', userId: 'user-id', productId: 'product-id',
      productName: 'curl 入門課程', amount: 100, provider: 'ecpay', status: 'pending',
    })).toThrow('unsafe system keyword');
  });

  it('parses callback PaymentDate as UTC+8', () => {
    const provider = createEcpayProvider(credentials);
    const callback = {
      MerchantID: '3002607', MerchantTradeNo: 'Test1234567890', RtnCode: '1', RtnMsg: 'Succeeded',
      TradeNo: '2301011234567890', TradeAmt: '100', PaymentDate: '2025/01/01 12:05:00',
      PaymentType: 'Credit_CreditCard', TradeDate: '2025/01/01 12:00:00', SimulatePaid: '0',
    };
    const CheckMacValue = generateCheckMacValue(callback, credentials.hashKey, credentials.hashIv);
    expect(provider.verifyCallback(new URLSearchParams({ ...callback, CheckMacValue }).toString())?.paidAt?.toISOString())
      .toBe('2025-01-01T04:05:00.000Z');
  });
});
