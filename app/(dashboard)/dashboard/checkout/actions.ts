'use server';

import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/dal';
import { db } from '@/lib/db/drizzle';
import { orders, products } from '@/lib/db/schema';
import { getProvider } from '@/lib/payments';
import { createOrderNumber } from '@/lib/payments/order-number';

export async function createCheckout(productId: string) {
  const user = await requireUser();
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);
  if (!product) throw new Error('Product not found');

  const provider = getProvider();
  const orderNo = createOrderNumber();
  const [order] = await db.insert(orders).values({
    userId: user.id,
    productId: product.id,
    orderNo,
    amount: product.price,
    provider: provider.name,
    status: 'pending',
  }).returning();

  return provider.buildCheckout({
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    productId: order.productId,
    productName: product.name,
    amount: order.amount,
    provider: order.provider,
    status: order.status,
  });
}
