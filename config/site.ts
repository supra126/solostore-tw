// 品牌設定的唯一真相來源。
// 散落在頁面的品牌字一律從這裡取；每個欄位都支援用環境變數覆蓋。
// 日後要加 tagline、社群連結等，往這個物件加即可，不要另開檔案。
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Acme',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    '專為個人打造的一頁式數位商品店面。',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL ??
    'http://localhost:3000',
} as const;

export type SiteConfig = typeof siteConfig;
