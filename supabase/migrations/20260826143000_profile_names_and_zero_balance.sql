alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.profiles
set first_name = coalesce(nullif(first_name, ''), split_part(full_name, ' ', 1), ''),
    last_name = coalesce(nullif(last_name, ''), nullif(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''), '');

alter table public.profiles
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.profiles
  add constraint profiles_first_name_length check (char_length(first_name) between 2 and 80),
  add constraint profiles_last_name_length check (char_length(last_name) between 2 and 80);

insert into public.platform_settings (key, value)
values ('paper_trading', '{"initial_balance": 0.00, "currency": "BRL"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

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
  initial_cash := coalesce((settings ->> 'initial_balance')::numeric, 0.00);
  account_currency := coalesce(settings ->> 'currency', 'BRL');

  insert into public.profiles (id, first_name, last_name, full_name, email, phone)
  values (new.id, left(new.raw_user_meta_data ->> 'first_name', 80), left(new.raw_user_meta_data ->> 'last_name', 80), left(new.raw_user_meta_data ->> 'full_name', 160), new.email, nullif(left(new.raw_user_meta_data ->> 'phone', 30), ''));
  insert into public.user_preferences (user_id) values (new.id);
  insert into public.watchlists (user_id) values (new.id);
  insert into public.paper_accounts (user_id, currency, initial_balance, cash_balance) values (new.id, account_currency, initial_cash, initial_cash);
  return new;
end;
$$;
