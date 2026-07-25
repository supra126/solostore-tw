import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Fraunces } from 'next/font/google';
import { ArrowRight, Check, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { ROUTES } from '@/config/routes';
import { getCurrentUser } from '@/lib/auth/dal';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { productGradient } from '@/lib/products/gradient';
import { CheckoutButton } from './dashboard/checkout/checkout-button';

// Latin 標準字與價格數字用襯線字，替中文為主的版面添加一點編輯風個性。
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '900'] });

type StorefrontProduct = {
  id: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

// 讀所有上架中的一次性商品（可陸續新增）；讀不到（DB 未連線/未種子）就退回靜態占位卡，
// 避免整頁因無資料而壞掉。
const FALLBACK_PRODUCTS: StorefrontProduct[] = [
  {
    id: null,
    name: 'Acme Pro 授權',
    description: '一次購買、永久使用的 Acme Pro 授權。包含完整功能與後續更新。',
    price: 990,
    imageUrl: null,
  },
];

async function loadProducts(): Promise<StorefrontProduct[]> {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt));
    if (rows.length === 0) return FALLBACK_PRODUCTS;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      imageUrl: row.imageUrl,
    }));
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: '即買即用',
    body: '完成付款後立即開通，不必等待人工處理，買家馬上就能開始使用。',
  },
  {
    icon: ShieldCheck,
    title: '安全金流',
    body: '串接綠界金流，支援信用卡與多種支付方式，收款安全可靠。',
  },
  {
    icon: RefreshCw,
    title: '隨時上架',
    body: '課程、服務或任何數位商品，想賣什麼就新增一筆，店面自動長出來。',
  },
];

export default async function HomePage() {
  const [user, catalog] = await Promise.all([getCurrentUser(), loadProducts()]);
  const isAuthed = !!user;
  const minPrice = Math.min(...catalog.map((p) => p.price));
  const minPriceLabel = minPrice.toLocaleString('zh-TW');

  return (
    <main className="bg-[#fbfaf8] text-stone-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* 暖色光暈背景，營造氛圍與層次 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 55% at 78% 12%, rgba(249,115,22,0.16), transparent 60%), radial-gradient(45% 45% at 8% 8%, rgba(249,115,22,0.08), transparent 55%)',
          }}
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium tracking-wide text-orange-700 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-backwards">
              數位商品 · 課程與服務
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:80ms] fill-mode-backwards">
              你的知識與服務，
              <br />
              一頁完成販售。
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:160ms] fill-mode-backwards">
              <span className={`${fraunces.className} font-semibold text-stone-900`}>
                {siteConfig.name}
              </span>{' '}
              是專為個人打造的數位商品店面。上架課程、服務或任何數位商品，乾淨的購買體驗、可靠的金流與登入，讓你專注在作品本身。
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:240ms] fill-mode-backwards">
              <Button asChild size="lg" className="rounded-full">
                <Link href="#products">
                  查看商品
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <span className="ml-1 text-sm text-stone-500">
                {catalog.length} 項數位商品 · NT${' '}
                <span className={fraunces.className}>{minPriceLabel}</span> 起
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 賣點特色 */}
      <section className="border-y border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 商品列表 */}
      <section id="products" className="scroll-mt-20 bg-[#fbfaf8]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              商品
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              上架中的數位商品
            </h2>
            <p className="mt-3 text-stone-600">
              選擇想購買的商品，登入後即可用綠界安全結帳。
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((product, index) => {
              const href = product.id ? `/products/${product.id}` : undefined;
              const media = (
                <div className="relative aspect-video w-full overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ backgroundImage: productGradient(product.id ?? product.name) }}
                    >
                      <span className={`${fraunces.className} text-5xl font-semibold text-stone-900/20`}>
                        {product.name.slice(0, 1)}
                      </span>
                    </div>
                  )}
                </div>
              );
              return (
                <div
                  key={product.id ?? product.name}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-backwards"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {href ? (
                    <Link href={href} className="block">
                      {media}
                    </Link>
                  ) : (
                    media
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {href ? (
                      <Link href={href} className="group/title">
                        <h3 className="text-lg font-semibold group-hover/title:text-orange-600">
                          {product.name}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                    )}
                    {product.description && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-6 flex items-end justify-between gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-stone-500">NT$</span>
                        <span className={`${fraunces.className} text-3xl font-semibold`}>
                          {product.price.toLocaleString('zh-TW')}
                        </span>
                      </div>
                      {isAuthed && product.id ? (
                        <CheckoutButton productId={product.id} className="rounded-full" />
                      ) : (
                        <Button asChild className="rounded-full">
                          <Link href={ROUTES.signIn}>
                            立即購買
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {catalog.length === 0 && (
              <p className="text-stone-500">目前沒有上架中的商品。</p>
            )}
          </div>

          {/* 信任列 */}
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-500">
            {['一次購買，無隱藏費用', '綠界金流安全結帳', '付款後立即開通'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-600">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 頁尾 CTA */}
      <section className="border-t border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            準備好開始了嗎？
          </h2>
          <p className="mx-auto mt-3 max-w-md text-stone-600">
            瀏覽 {siteConfig.name} 的數位商品，幾秒鐘完成購買、立即開通。
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link href="#products">
                查看商品
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#fbfaf8]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-stone-500">
          © {new Date().getFullYear()}{' '}
          <span className={`${fraunces.className} font-semibold text-stone-700`}>
            {siteConfig.name}
          </span>
        </div>
      </footer>
    </main>
  );
}
