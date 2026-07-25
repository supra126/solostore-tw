import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Supabase 的連線池是 session 模式、上限 15 clients。用預設 pool（max 10、idle 不釋放）
// 在 build（多 worker）與 dev 併行時容易耗盡連線（EMAXCONNSESSION）。
// 收斂連線數並讓閒置連線自動釋放，保留 headroom。
export const client = postgres(process.env.POSTGRES_URL, {
  max: 5,
  idle_timeout: 20,
  // prepared statements 在 transaction 模式 pooler（port 6543）不支援；
  // 關掉可讓 POSTGRES_URL 直接指向 transaction pooler（serverless 部署建議），
  // 對 session/direct 連線也安全。
  prepare: false,
});
export const db = drizzle(client, { schema });
