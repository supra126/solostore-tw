import { describe, expect, it } from 'vitest';
import { canTransitionOrder, transitionOrder } from './order-state';

describe('order state machine', () => {
  it.each([
    ['pending', 'paid'],
    ['pending', 'failed'],
    ['paid', 'refunded'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(canTransitionOrder(from, to)).toBe(true);
    expect(transitionOrder(from, to)).toBe(to);
  });

  it.each([
    ['paid', 'pending'],
    ['failed', 'paid'],
    ['refunded', 'paid'],
  ] as const)('rejects %s -> %s', (from, to) => {
    expect(canTransitionOrder(from, to)).toBe(false);
    expect(() => transitionOrder(from, to)).toThrow('Invalid order status transition');
  });

  it('treats a transition to the current state as idempotent', () => {
    expect(transitionOrder('paid', 'paid')).toBe('paid');
  });
});
