import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// 單人站只需要一張使用者資料表：profiles。
// id 為 uuid，且等於 Supabase auth.users.id（由 DB trigger 於註冊時自動建立）。
// 真正的認證資料（email、密碼）由 Supabase Auth 於 auth schema 管理。
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// App 層的「目前使用者」：合併 Supabase auth 的 email 與 profiles 的欄位。
export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export const orderStatus = pgEnum('order_status', ['pending', 'paid', 'failed', 'refunded']);
export const paymentStatus = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  detail: text('detail'),
  imageUrl: text('image_url'),
  price: integer('price').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  orderNo: varchar('order_no', { length: 20 }).notNull(),
  amount: integer('amount').notNull(),
  provider: varchar('provider', { length: 30 }).notNull(),
  status: orderStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('orders_order_no_key').on(table.orderNo),
  index('orders_user_id_idx').on(table.userId),
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 20 }).notNull().references(() => orders.orderNo, { onDelete: 'restrict' }),
  provider: varchar('provider', { length: 30 }).notNull(),
  amount: integer('amount').notNull(),
  status: paymentStatus('status').notNull().default('pending'),
  tradeNo: varchar('trade_no', { length: 100 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  rawPayload: jsonb('raw_payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('payments_order_no_key').on(table.orderNo),
]);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
