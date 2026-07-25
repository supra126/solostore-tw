import { createHash, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider, ProviderOrder } from '../provider';
import {
  ECPAY_BASE_URL,
  ECPAY_CHECKOUT_PATH,
  ECPAY_ITEM_NAME_MAX_LENGTH,
  ECPAY_TRADE_DESC_MAX_LENGTH,
} from '../config';

export type EcpayConfig = {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  environment: 'stage' | 'production';
  appUrl: string;
};

type EcpayParams = Record<string, string>;

// Source: ECPay Developers AIO API, fetched from references/Payment/全方位金流API技術文件.md on 2026-07-14.
export function ecpayUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
    .toLowerCase()
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
}

export function generateCheckMacValue(params: EcpayParams, hashKey: string, hashIv: string): string {
  const entries = Object.entries(params)
    .filter(([key]) => key.toLowerCase() !== 'checkmacvalue')
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const query = entries.map(([key, value]) => `${key}=${value}`).join('&');
  const encoded = ecpayUrlEncode(`HashKey=${hashKey}&${query}&HashIV=${hashIv}`);
  return createHash('sha256').update(encoded, 'utf8').digest('hex').toUpperCase();
}

export function verifyCheckMacValue(params: EcpayParams, hashKey: string, hashIv: string): boolean {
  const received = Buffer.from(params.CheckMacValue ?? '', 'utf8');
  const expected = Buffer.from(generateCheckMacValue(params, hashKey, hashIv), 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function taipeiDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function cleanDescription(value: string, maxLength: number): string {
  return value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function assertWafSafe(value: string): void {
  if (/\b(?:echo|python|cmd|wget|curl|ping|net|telnet)\b/i.test(value)) {
    throw new Error('Product text contains an unsafe system keyword');
  }
}

function parseTaipeiDateTime(value: string): Date | null {
  const match = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createEcpayProvider(config: EcpayConfig, now: () => Date = () => new Date()): PaymentProvider {
  const baseUrl = ECPAY_BASE_URL[config.environment];
  const appUrl = config.appUrl.replace(/\/$/, '');

  return {
    name: 'ecpay',
    buildCheckout(order: ProviderOrder) {
      if (!/^[A-Za-z0-9]{1,20}$/.test(order.orderNo)) throw new Error('Invalid MerchantTradeNo');
      if (!Number.isSafeInteger(order.amount) || order.amount <= 0) throw new Error('Invalid TotalAmount');
      assertWafSafe(order.productName);

      const fields: EcpayParams = {
        MerchantID: config.merchantId,
        MerchantTradeNo: order.orderNo,
        MerchantTradeDate: taipeiDateTime(now()),
        PaymentType: 'aio',
        TotalAmount: String(order.amount),
        TradeDesc: cleanDescription(order.productName, ECPAY_TRADE_DESC_MAX_LENGTH),
        ItemName: cleanDescription(order.productName, ECPAY_ITEM_NAME_MAX_LENGTH),
        ReturnURL: `${appUrl}/api/payments/callback/ecpay`,
        OrderResultURL: `${appUrl}/api/payments/return/ecpay`,
        ChoosePayment: 'Credit',
        EncryptType: '1',
      };
      fields.CheckMacValue = generateCheckMacValue(fields, config.hashKey, config.hashIv);
      return { actionUrl: `${baseUrl}${ECPAY_CHECKOUT_PATH}`, fields };
    },
    verifyCallback(rawBody: string) {
      const fields = Object.fromEntries(new URLSearchParams(rawBody));
      if (fields.MerchantID !== config.merchantId || !verifyCheckMacValue(fields, config.hashKey, config.hashIv)) {
        return null;
      }
      const amount = Number(fields.TradeAmt);
      if (!Number.isSafeInteger(amount) || amount <= 0 || !fields.MerchantTradeNo) return null;
      return {
        orderNo: fields.MerchantTradeNo,
        success: fields.RtnCode === '1',
        tradeNo: fields.TradeNo || null,
        amount,
        paidAt: fields.RtnCode === '1' && fields.PaymentDate ? parseTaipeiDateTime(fields.PaymentDate) : null,
        raw: fields,
      };
    },
    callbackSuccessResponse: () => '1|OK',
  };
}
