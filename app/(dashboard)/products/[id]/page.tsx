import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { Fraunces } from 'next/font/google';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { ROUTES } from '@/config/routes';
import { getCurrentUser } from '@/lib/auth/dal';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { productGradient } from '@/lib/products/gradient';
import { CheckoutButton } from '../../dashboard/checkout/checkout-button';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '900'] });

async function loadProduct(id: string) {
  try {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.active, true)))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, product] = await Promise.all([getCurrentUser(), loadProduct(id)]);
  if (!product) notFound();

  const seed = product.id;
  const priceLabel = product.price.toLocaleString('zh-TW');

  return (
    <main className="bg-[#fbfaf8] text-stone-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 麵包屑 */}
        <Link
          href="/#products"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          回商品店面
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* 視覺：有圖用圖，沒圖用依商品生成的漸層 */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl ring-1 ring-stone-900/5">
              {product.imageUrl ? (
                // 外部圖片 URL（店主自行提供，無需上傳基礎設施）
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundImage: productGradient(seed, 'rich') }}
                >
                  <span className={`${fraunces.className} text-7xl font-semibold text-white/85`}>
                    {product.name.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 內容 */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-4 text-lg leading-relaxed text-stone-600">
                {product.description}
              </p>
            )}

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-sm text-stone-500">NT$</span>
              <span className={`${fraunces.className} text-4xl font-semibold`}>
                {priceLabel}
              </span>
              <span className="ml-1 text-sm text-stone-500">/ 一次付清</span>
            </div>

            <div className="mt-6">
              {user ? (
                <CheckoutButton productId={product.id} size="lg" className="rounded-full" />
              ) : (
                <Button asChild size="lg" className="rounded-full">
                  <Link href={ROUTES.signIn}>
                    立即購買
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
              {['一次購買，無隱藏費用', '綠界安全結帳', '付款後立即開通'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-orange-600" />
                  {item}
                </li>
              ))}
            </ul>

            {product.detail && (
              <div className="mt-10 border-t border-stone-200 pt-8">
                <h2 className="text-lg font-semibold">商品說明</h2>
                <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-stone-700">
                  {product.detail}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 頁尾 CTA */}
        <div className="mt-16 rounded-3xl bg-stone-950 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight">立即擁有 {product.name}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-400">
            由 {siteConfig.name} 提供，綠界安全結帳、付款後立即開通。
          </p>
          <div className="mt-6 flex justify-center">
            {user ? (
              <CheckoutButton productId={product.id} size="lg" className="rounded-full" />
            ) : (
              <Button asChild size="lg" className="rounded-full">
                <Link href={ROUTES.signIn}>
                  立即購買
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
