import type { OrderStatus } from './provider';

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: [],
  refunded: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || transitions[from].includes(to);
}

export function transitionOrder(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Invalid order status transition: ${from} -> ${to}`);
  }
  return to;
}
