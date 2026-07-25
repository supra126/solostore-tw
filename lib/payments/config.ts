// 金流相關常數的集中處：端點、欄位長度上限、預設金流商。
// 要切換 ECPay 環境或調整限制時，改這裡即可，不要散在 provider 內。

// ECPay AIO 端點（依環境）。
export const ECPAY_BASE_URL = {
  stage: 'https://payment-stage.ecpay.com.tw',
  production: 'https://payment.ecpay.com.tw',
} as const;

// AIO 結帳送出路徑。
export const ECPAY_CHECKOUT_PATH = '/Cashier/AioCheckOut/V5';

// AIO 欄位長度上限（超過會被 ECPay 拒絕）。
export const ECPAY_TRADE_DESC_MAX_LENGTH = 200;
export const ECPAY_ITEM_NAME_MAX_LENGTH = 400;

// 未指定 PAYMENT_PROVIDER 時的預設金流商。
export const DEFAULT_PAYMENT_PROVIDER = 'ecpay';
