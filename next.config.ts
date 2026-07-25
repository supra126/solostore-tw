import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 開發時允許 cloudflare tunnel 等跨來源網域存取 /_next dev 資源（HMR），
  // 否則透過 tunnel 開頁面時 client runtime 無法完成 hydration，互動失效。
  // 僅影響 dev；正式環境（next build / start）沒有這個限制。
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
