// 前端可用的 Supabase 連線參數。Next 會在 build 時把 NEXT_PUBLIC_* 內聯，
// 因此瀏覽器與伺服器端 client 都能共用這兩個常數。
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
