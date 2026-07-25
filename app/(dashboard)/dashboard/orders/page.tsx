import { desc, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/dal';
import { db } from '@/lib/db/drizzle';
import { orders, products } from '@/lib/db/schema';
import { Card, CardContent } from '@/components/ui/card';

// 訂單狀態 → 繁中標籤與樣式。
const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: '待付款', className: 'bg-amber-100 text-amber-700' },
  paid: { label: '已付款', className: 'bg-green-100 text-green-700' },
  failed: { label: '失敗', className: 'bg-red-100 text-red-700' },
  refunded: { label: '已退款', className: 'bg-stone-200 text-stone-600' },
};

// 受保護頁面：只讀目前使用者自己的訂單（不改金流寫入邏輯）。
export default async function OrdersPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      orderNo: orders.orderNo,
      amount: orders.amount,
      status: orders.status,
      createdAt: orders.createdAt,
      productName: products.name,
    })
    .from(orders)
    .innerJoin(products, eq(products.id, orders.productId))
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="mb-1 text-lg font-medium lg:text-2xl">訂單記錄</h1>
      <p className="mb-6 text-sm text-muted-foreground">你在此帳號下的所有購買記錄。</p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            目前還沒有訂單。前往{' '}
            <a href="/" className="font-medium text-orange-600 hover:underline">
              商品店面
            </a>{' '}
            開始購買。
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">商品</th>
                    <th className="px-4 py-3 font-medium">訂單編號</th>
                    <th className="px-4 py-3 font-medium">日期</th>
                    <th className="px-4 py-3 text-right font-medium">金額</th>
                    <th className="px-4 py-3 text-right font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const meta = STATUS_META[row.status] ?? {
                      label: row.status,
                      className: 'bg-stone-200 text-stone-600',
                    };
                    return (
                      <tr key={row.orderNo} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{row.productName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {row.orderNo}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.createdAt.toLocaleDateString('zh-TW')}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          NT$ {row.amount.toLocaleString('zh-TW')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
