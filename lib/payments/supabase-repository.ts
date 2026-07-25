import 'server-only';

import type { PaymentRepository } from './process-callback';
import type { ProviderOrder, VerifiedCallback } from './provider';
import { createServiceRoleClient } from '@/lib/supabase/service';

type OrderRow = {
  id: string;
  order_no: string;
  user_id: string;
  product_id: string;
  amount: number;
  provider: string;
  status: ProviderOrder['status'];
  products: { name: string } | { name: string }[] | null;
};

function productName(products: OrderRow['products']): string {
  return Array.isArray(products) ? products[0]?.name ?? '' : products?.name ?? '';
}

export function createSupabasePaymentRepository(): PaymentRepository {
  const supabase = createServiceRoleClient();

  return {
    async findOrder(orderNo) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_no, user_id, product_id, amount, provider, status, products(name)')
        .eq('order_no', orderNo)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as OrderRow;
      return {
        id: row.id,
        orderNo: row.order_no,
        userId: row.user_id,
        productId: row.product_id,
        productName: productName(row.products),
        amount: row.amount,
        provider: row.provider,
        status: row.status,
      };
    },

    async recordCallback(order: ProviderOrder, callback: VerifiedCallback) {
      const { data, error } = await supabase.rpc('record_payment_callback', {
        p_order_no: order.orderNo,
        p_provider: order.provider,
        p_amount: callback.amount,
        p_success: callback.success,
        p_trade_no: callback.tradeNo,
        p_paid_at: callback.paidAt?.toISOString() ?? null,
        p_raw_payload: callback.raw,
      });
      if (error) throw error;
      const result = (data as { became_paid: boolean; current_status: ProviderOrder['status'] }[] | null)?.[0];
      if (!result) throw new Error('Payment callback transaction returned no result');
      return {
        becamePaid: result.became_paid,
        order: { ...order, status: result.current_status },
      };
    },
  };
}
