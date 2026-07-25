-- 初始 schema（壓縮自原本 5 個 migration，schema 等價）。
-- 涵蓋：使用者 profiles、商品/訂單/付款金流領域、付款 callback 函式。

-- 列舉型別
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- profiles：單人站的使用者資料表。
-- id = auth.users.id（uuid）；註冊時由下方 trigger 自動建立對應列。
-- 真正的認證資料（email、密碼）由 Supabase Auth 於 auth schema 管理。
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name varchar(100),
  role varchar(20) not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using ((select auth.uid()) = id);

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 註冊（auth.users 新增列）時，自動建立對應的 public.profiles 列。
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- products：商品。description/detail/image_url 皆可為 null（詳述頁欄位）。
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  price integer not null check (price > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  description text,
  detail text,
  image_url text
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  order_no varchar(20) not null unique check (order_no ~ '^[A-Za-z0-9]{1,20}$'),
  amount integer not null check (amount > 0),
  provider varchar(30) not null check (provider ~ '^[a-z][a-z0-9_]{0,29}$'),
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_no varchar(20) not null unique references public.orders(order_no) on delete restrict,
  provider varchar(30) not null check (provider ~ '^[a-z][a-z0-9_]{0,29}$'),
  amount integer not null check (amount > 0),
  status public.payment_status not null default 'pending',
  trade_no varchar(100),
  paid_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders(user_id);
create index payments_order_no_idx on public.payments(order_no);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

create policy "authenticated users can view active products"
  on public.products for select to authenticated
  using (active = true);

create policy "users can view their own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can view payments for their own orders"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.orders
    where orders.order_no = payments.order_no
      and orders.user_id = (select auth.uid())
  ));

-- The callback uses the service-role key. This function serializes callbacks for
-- the same order and returns whether this request performed the first paid transition.
-- 對已為 paid 的 payments 列，狀態不會被後續 callback 覆寫（preserve paid）。
create function public.record_payment_callback(
  p_order_no varchar,
  p_provider varchar,
  p_amount integer,
  p_success boolean,
  p_trade_no varchar,
  p_paid_at timestamptz,
  p_raw_payload jsonb
) returns table (became_paid boolean, current_status public.order_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_order public.orders%rowtype;
  next_status public.order_status;
begin
  select * into locked_order from public.orders
  where order_no = p_order_no for update;

  if not found or locked_order.provider <> p_provider or locked_order.amount <> p_amount then
    raise exception 'Payment callback does not match an order';
  end if;

  next_status := case when p_success then 'paid'::public.order_status else 'failed'::public.order_status end;
  became_paid := p_success and locked_order.status = 'pending';

  if locked_order.status = 'pending' then
    update public.orders set status = next_status, updated_at = now()
    where id = locked_order.id;
  end if;

  insert into public.payments (order_no, provider, amount, status, trade_no, paid_at, raw_payload)
  values (
    p_order_no,
    p_provider,
    p_amount,
    case when p_success then 'paid'::public.payment_status else 'failed'::public.payment_status end,
    p_trade_no,
    p_paid_at,
    p_raw_payload
  )
  on conflict (order_no) do update set
    status = case when payments.status = 'paid' then payments.status else excluded.status end,
    trade_no = coalesce(excluded.trade_no, payments.trade_no),
    paid_at = coalesce(excluded.paid_at, payments.paid_at),
    raw_payload = excluded.raw_payload,
    updated_at = now();

  current_status := case when became_paid then 'paid'::public.order_status else locked_order.status end;
  return next;
end;
$$;

revoke all on function public.record_payment_callback(varchar, varchar, integer, boolean, varchar, timestamptz, jsonb) from public;
grant execute on function public.record_payment_callback(varchar, varchar, integer, boolean, varchar, timestamptz, jsonb) to service_role;
