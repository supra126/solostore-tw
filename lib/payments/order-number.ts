import { randomBytes } from 'node:crypto';

export function createOrderNumber(now: Date = new Date()): string {
  const time = now.getTime().toString(36).toUpperCase();
  const random = randomBytes(5).toString('hex').toUpperCase();
  return `E${time}${random}`.slice(0, 20);
}
