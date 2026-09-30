create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  currency_code char(3) not null default 'GBP' check (currency_code ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/London'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category_id uuid not null references public.categories(id),
  client_request_id uuid not null,
  amount_minor bigint not null check (amount_minor > 0 and amount_minor <= 100000000),
  currency_code char(3) not null default 'GBP' check (currency_code ~ '^[A-Z]{3}$'),
  expense_date date not null,
  expense_time time,
  merchant text check (char_length(merchant) <= 100),
  description text check (char_length(description) <= 500),
  payment_method text check (payment_method in
    ('Debit Card','Credit Card','Cash','Bank Transfer','Apple Pay','Other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- idempotency: a retried submission can never create a second row
  unique (user_id, client_request_id)
);

create index expenses_user_date_idx on public.expenses (user_id, expense_date);
create index expenses_user_created_idx on public.expenses (user_id, created_at);
create index expenses_user_category_idx on public.expenses (user_id, category_id);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "categories_read_active" on public.categories for select to authenticated using (is_active);

create policy "expenses_select_own" on public.expenses for select to authenticated using (user_id = auth.uid());
create policy "expenses_insert_own" on public.expenses for insert to authenticated with check (user_id = auth.uid());
create policy "expenses_update_own" on public.expenses for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expenses_delete_own" on public.expenses for delete to authenticated using (user_id = auth.uid());

-- Seed (idempotent via unique name)
insert into public.categories (name, icon, sort_order) values
 ('Food & Groceries','shopping-basket',1),('Eating Out','utensils',2),('Transport','bus',3),
 ('Accommodation','home',4),('University','graduation-cap',5),('Bills & Utilities','receipt',6),
 ('Shopping','shopping-bag',7),('Health','heart-pulse',8),('Entertainment','film',9),
 ('Subscriptions','repeat',10),('Personal Care','sparkles',11),('Household','sofa',12),
 ('Travel','plane',13),('Technology','laptop',14),('Other','circle-ellipsis',15)
on conflict (name) do nothing;
