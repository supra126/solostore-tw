// 依商品字串（id 或 name）決定一個穩定的色相，讓每個商品自帶一種色調——
// 沒有圖片時也能有不單調的視覺，且同一商品每次算出來都一樣（deterministic）。
function hueFromSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

// variant: 'soft' 給卡片頭（淺色），'rich' 給詳述頁 hero（飽和）。
export function productGradient(seed: string, variant: 'soft' | 'rich' = 'soft'): string {
  const h1 = hueFromSeed(seed);
  const h2 = (h1 + 35) % 360;
  if (variant === 'rich') {
    return `linear-gradient(135deg, hsl(${h1} 65% 52%), hsl(${h2} 70% 42%))`;
  }
  return `linear-gradient(135deg, hsl(${h1} 60% 90%), hsl(${h2} 55% 82%))`;
}
