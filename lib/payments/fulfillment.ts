import type { FulfillOrder } from './process-callback';

// The repository atomically marks the order paid before this hook runs.
// Add per-product fulfillment grants (download, enrollment, etc.) here.
export const fulfillOrder: FulfillOrder = async (order) => {
  if (order.status !== 'paid') throw new Error('Cannot fulfill an unpaid order');
};
