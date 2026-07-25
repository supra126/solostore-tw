// 應用程式導向路徑的集中處，消除散落各處的魔法字串。
export const ROUTES = {
  dashboard: '/dashboard',
  signIn: '/sign-in',
  signUp: '/sign-up',
} as const;

// 金流 callback/return 以 provider 簽章驗證，session proxy 對此 API 前綴一律放行。
export const PAYMENTS_API_PREFIX = '/api/payments/';
