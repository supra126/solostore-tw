import { describe, expect, it } from 'vitest';
import { createOrderNumber } from './order-number';

describe('createOrderNumber', () => {
  it('returns unique ECPay-compatible identifiers', () => {
    const numbers = new Set(Array.from({ length: 100 }, () => createOrderNumber()));
    expect(numbers.size).toBe(100);
    for (const orderNo of numbers) expect(orderNo).toMatch(/^[A-Za-z0-9]{1,20}$/);
  });
});
