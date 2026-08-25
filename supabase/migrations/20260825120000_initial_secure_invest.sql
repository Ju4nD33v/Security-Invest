-- Secure Invest initial schema. Apply with the Supabase CLI; do not edit tables manually.
create extension if not exists pgcrypto;

create type public.user_role as enum ('USER', 'ADMIN');
create type public.account_status as enum ('ACTIVE', 'SUSPENDED');
create type public.order_side as enum ('BUY', 'SELL');
create type public.order_type as enum ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT');
create type public.order_status as enum ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED');
create type public.payment_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');
create type public.subscription_status as enum ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'USER',
  account_status public.account_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index profiles_email_lower_unique on public.profiles (lower(email));

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en-US', 'es')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  weekly_summary_enabled boolean not null default true,
  market_alerts_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('paper_trading', '{"initial_balance": 100000.00, "currency": "BRL"}'::jsonb);

create table public.paper_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  initial_balance numeric(20, 6) not null check (initial_balance >= 0),
  cash_balance numeric(20, 6) not null check (cash_balance >= 0),
  reserved_balance numeric(20, 6) not null default 0 check (reserved_balance >= 0 and reserved_balance <= cash_balance),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.paper_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.paper_accounts(id) on delete restrict,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,20}$'),
  side public.order_side not null,
  order_type public.order_type not null,
  quantity numeric(20, 6) not null check (quantity > 0),
  requested_price numeric(20, 6),
  execution_price numeric(20, 6) check (execution_price > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status public.order_status not null default 'PENDING',
  provider text not null default 'PAPER' check (provider = 'PAPER'),
  idempotency_key uuid not null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  cancelled_at timestamptz,
  unique (user_id, idempotency_key)
);

create index paper_orders_user_created_at_idx on public.paper_orders (user_id, created_at desc);
create index paper_orders_account_created_at_idx on public.paper_orders (account_id, created_at desc);

create table public.paper_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,20}$'),
  quantity numeric(20, 6) not null default 0 check (quantity >= 0),
  average_price numeric(20, 6) not null default 0 check (average_price >= 0),
  realized_pnl numeric(20, 6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, symbol)
);

create index paper_positions_user_quantity_idx on public.paper_positions (user_id, quantity) where quantity > 0;

create table public.paper_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.paper_accounts(id) on delete restrict,
  order_id uuid not null unique references public.paper_orders(id) on delete restrict,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,20}$'),
  side public.order_side not null,
  quantity numeric(20, 6) not null check (quantity > 0),
  unit_price numeric(20, 6) not null check (unit_price > 0),
  gross_amount numeric(20, 6) not null check (gross_amount > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  realized_pnl numeric(20, 6) not null default 0,
  cash_balance_after numeric(20, 6) not null check (cash_balance_after >= 0),
  created_at timestamptz not null default now()
);

create index paper_transactions_user_created_at_idx on public.paper_transactions (user_id, created_at desc);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Minha watchlist' check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.watchlist_assets (
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,20}$'),
  created_at timestamptz not null default now(),
  primary key (watchlist_id, symbol)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_]{2,30}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  price numeric(20, 2) not null check (price >= 0),
  currency char(3) not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  billing_period text not null check (billing_period in ('MONTHLY', 'YEARLY')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  provider text not null check (provider = 'MERCADO_PAGO'),
  provider_order_id text unique,
  provider_payment_id text unique,
  amount numeric(20, 2) not null check (amount >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status public.payment_status not null default 'PENDING',
  idempotency_key uuid not null unique,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payments_user_created_at_idx on public.payments (user_id, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  payment_id uuid unique references public.payments(id) on delete restrict,
  status public.subscription_status not null default 'ACTIVE',
  starts_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > starts_at)
);

create unique index subscriptions_one_active_per_user_idx on public.subscriptions (user_id) where status = 'ACTIVE';

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'MERCADO_PAGO'),
  provider_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'RECEIVED' check (status in ('RECEIVED', 'PROCESSED', 'FAILED')),
  payload jsonb not null default '{}'::jsonb,
  unique (provider, provider_event_id)
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  request_id uuid,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_created_at_idx on public.security_events (created_at desc);

create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text not null,
  successful boolean not null,
  attempted_at timestamptz not null default now()
);

create index login_attempts_lookup_idx on public.login_attempts (email_hash, ip_hash, attempted_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id text,
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create table public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  status_code integer,
  duration_ms integer check (duration_ms >= 0),
  success boolean not null,
  created_at timestamptz not null default now()
);

create table public.integration_health (
  provider text primary key check (provider in ('FMP', 'ALPHA_VANTAGE', 'MERCADO_PAGO')),
  status text not null default 'UNKNOWN' check (status in ('UNKNOWN', 'ONLINE', 'ERROR')),
  latency_ms integer check (latency_ms >= 0),
  last_successful_request_at timestamptz,
  last_error_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.integration_health (provider) values ('FMP'), ('ALPHA_VANTAGE'), ('MERCADO_PAGO');

create table public.rate_limit_buckets (
  bucket_key text primary key,
  count integer not null check (count >= 0),
  window_started_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings jsonb;
  initial_cash numeric(20, 6);
  account_currency char(3);
begin
  select value into settings from public.platform_settings where key = 'paper_trading';
  initial_cash := coalesce((settings ->> 'initial_balance')::numeric, 100000.00);
  account_currency := coalesce(settings ->> 'currency', 'BRL');

  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 160), ''),
    new.email,
    nullif(left(new.raw_user_meta_data ->> 'phone', 30), '')
  );
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.watchlists (user_id) values (new.id);
  insert into public.paper_accounts (user_id, currency, initial_balance, cash_balance)
  values (new.id, account_currency, initial_cash, initial_cash);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN' and account_status = 'ACTIVE'
  );
$$;

create or replace function public.execute_paper_market_order(
  p_user_id uuid,
  p_symbol text,
  p_side public.order_side,
  p_quantity numeric,
  p_execution_price numeric,
  p_currency char(3),
  p_idempotency_key uuid
)
returns public.paper_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.paper_accounts;
  v_position public.paper_positions;
  v_order public.paper_orders;
  v_cost numeric(20, 6);
  v_realized_pnl numeric(20, 6) := 0;
begin
  if p_symbol !~ '^[A-Z0-9.\-]{1,20}$' or p_quantity <= 0 or p_execution_price <= 0 then
    raise exception 'Invalid order data' using errcode = '22023';
  end if;

  select * into v_order from public.paper_orders
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then return v_order; end if;

  select * into v_account from public.paper_accounts where user_id = p_user_id for update;
  if not found then raise exception 'Paper account not found' using errcode = 'P0002'; end if;
  if v_account.currency <> p_currency then
    raise exception 'Account and quote currencies must match' using errcode = '22023';
  end if;

  v_cost := p_quantity * p_execution_price;
  insert into public.paper_orders (user_id, account_id, symbol, side, order_type, quantity, requested_price, execution_price, currency, status, idempotency_key)
  values (p_user_id, v_account.id, upper(p_symbol), p_side, 'MARKET', p_quantity, null, p_execution_price, p_currency, 'PENDING', p_idempotency_key)
  returning * into v_order;

  if p_side = 'BUY' and v_account.cash_balance < v_cost then
    update public.paper_orders set status = 'REJECTED', rejection_reason = 'INSUFFICIENT_VIRTUAL_FUNDS' where id = v_order.id returning * into v_order;
    return v_order;
  end if;

  select * into v_position from public.paper_positions
  where account_id = v_account.id and symbol = upper(p_symbol) for update;

  if p_side = 'SELL' and (not found or v_position.quantity < p_quantity) then
    update public.paper_orders set status = 'REJECTED', rejection_reason = 'INSUFFICIENT_POSITION' where id = v_order.id returning * into v_order;
    return v_order;
  end if;

  if p_side = 'BUY' then
    update public.paper_accounts set cash_balance = cash_balance - v_cost where id = v_account.id;
    insert into public.paper_positions (account_id, user_id, symbol, quantity, average_price)
    values (v_account.id, p_user_id, upper(p_symbol), p_quantity, p_execution_price)
    on conflict (account_id, symbol) do update set
      quantity = paper_positions.quantity + excluded.quantity,
      average_price = ((paper_positions.quantity * paper_positions.average_price) + (excluded.quantity * excluded.average_price)) / (paper_positions.quantity + excluded.quantity),
      updated_at = now();
  else
    v_realized_pnl := (p_execution_price - v_position.average_price) * p_quantity;
    update public.paper_accounts set cash_balance = cash_balance + v_cost where id = v_account.id;
    update public.paper_positions set
      quantity = quantity - p_quantity,
      realized_pnl = realized_pnl + v_realized_pnl,
      updated_at = now()
    where id = v_position.id;
  end if;

  update public.paper_orders set status = 'FILLED', executed_at = now() where id = v_order.id returning * into v_order;
  insert into public.paper_transactions (user_id, account_id, order_id, symbol, side, quantity, unit_price, gross_amount, currency, realized_pnl, cash_balance_after)
  select p_user_id, v_account.id, v_order.id, upper(p_symbol), p_side, p_quantity, p_execution_price, v_cost, p_currency, v_realized_pnl, cash_balance
  from public.paper_accounts where id = v_account.id;
  return v_order;
end;
$$;

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket public.rate_limit_buckets;
  v_window interval;
begin
  if char_length(p_bucket_key) = 0 or p_max_requests <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit configuration' using errcode = '22023';
  end if;
  v_window := make_interval(secs => p_window_seconds);
  insert into public.rate_limit_buckets (bucket_key, count, window_started_at)
  values (p_bucket_key, 1, now())
  on conflict (bucket_key) do update set
    count = case when rate_limit_buckets.window_started_at + v_window <= now() then 1 else rate_limit_buckets.count + 1 end,
    window_started_at = case when rate_limit_buckets.window_started_at + v_window <= now() then now() else rate_limit_buckets.window_started_at end,
    updated_at = now()
  returning * into v_bucket;
  return v_bucket.count <= p_max_requests;
end;
$$;

revoke all on function public.execute_paper_market_order(uuid, text, public.order_side, numeric, numeric, char, uuid) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.execute_paper_market_order(uuid, text, public.order_side, numeric, numeric, char, uuid) to service_role;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.activate_subscription_from_payment(p_payment_id uuid, p_paid_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_plan public.plans;
  v_expires_at timestamptz;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;
  if v_payment.status = 'APPROVED' then return; end if;
  select * into v_plan from public.plans where id = v_payment.plan_id;
  if not found then raise exception 'Plan not found' using errcode = 'P0002'; end if;
  v_expires_at := case when v_plan.billing_period = 'YEARLY' then p_paid_at + interval '1 year' else p_paid_at + interval '1 month' end;
  update public.payments set status = 'APPROVED', paid_at = p_paid_at where id = v_payment.id;
  update public.subscriptions set status = 'CANCELLED' where user_id = v_payment.user_id and status = 'ACTIVE';
  insert into public.subscriptions (user_id, plan_id, payment_id, status, starts_at, expires_at)
  values (v_payment.user_id, v_payment.plan_id, v_payment.id, 'ACTIVE', p_paid_at, v_expires_at);
end;
$$;
revoke all on function public.activate_subscription_from_payment(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.activate_subscription_from_payment(uuid, timestamptz) to service_role;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger preferences_updated_at before update on public.user_preferences for each row execute procedure public.set_updated_at();
create trigger paper_accounts_updated_at before update on public.paper_accounts for each row execute procedure public.set_updated_at();
create trigger paper_positions_updated_at before update on public.paper_positions for each row execute procedure public.set_updated_at();
create trigger watchlists_updated_at before update on public.watchlists for each row execute procedure public.set_updated_at();
create trigger plans_updated_at before update on public.plans for each row execute procedure public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute procedure public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.platform_settings enable row level security;
alter table public.paper_accounts enable row level security;
alter table public.paper_orders enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_transactions enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_assets enable row level security;
alter table public.plans enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.security_events enable row level security;
alter table public.login_attempts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.api_usage_logs enable row level security;
alter table public.integration_health enable row level security;
alter table public.rate_limit_buckets enable row level security;

create policy "profile owner or active admin can read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "preferences owner can read" on public.user_preferences for select to authenticated using (user_id = auth.uid());
create policy "paper account owner or admin can read" on public.paper_accounts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "paper order owner or admin can read" on public.paper_orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "paper position owner or admin can read" on public.paper_positions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "paper transaction owner or admin can read" on public.paper_transactions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "watchlist owner or admin can read" on public.watchlists for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "watchlist asset owner or admin can read" on public.watchlist_assets for select to authenticated using (exists (select 1 from public.watchlists w where w.id = watchlist_id and (w.user_id = auth.uid() or public.is_admin())));
create policy "active plans are readable" on public.plans for select to authenticated using (active or public.is_admin());
create policy "payment owner or admin can read" on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "subscription owner or admin can read" on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admins can read security events" on public.security_events for select to authenticated using (public.is_admin());
create policy "admins can read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "admins can read integration health" on public.integration_health for select to authenticated using (public.is_admin());

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on public.profiles, public.user_preferences, public.paper_accounts, public.paper_orders, public.paper_positions, public.paper_transactions, public.watchlists, public.watchlist_assets, public.plans, public.payments, public.subscriptions, public.security_events, public.audit_logs, public.integration_health to authenticated;
