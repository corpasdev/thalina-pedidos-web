-- =====================================================================
-- Thaliana · Administración de Pedidos — Esquema Supabase
-- Ejecutar en SQL Editor del proyecto (con la Data API expuesta: public).
-- =====================================================================

create table if not exists public.roles (
  name text primary key,
  label text not null,
  level integer not null default 1
);

insert into public.roles (name, label, level) values
  ('admin', 'Administrador', 2),
  ('collaborator', 'Colaborador', 1)
on conflict (name) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  full_name text not null default '',
  role_name text not null default 'collaborator' references public.roles(name),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create or replace function public.auth_rol()
returns text
language sql
stable
as $$
  select role_name from public.profiles where id = auth.uid()
$$;

-- Resuelve el email a partir del username para el login (SECURITY DEFINER,
-- así funciona desde anon sin abrir la tabla con RLS)
create or replace function public.email_por_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(username) = lower(p_username)
    and active = true
  limit 1
$$;

create table if not exists public.companies (
  id text primary key,
  name text not null,
  type text not null default 'Propia',
  brands jsonb not null default '[]'::jsonb,
  order_days jsonb not null default '[]'::jsonb,
  delivery_days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.product_lines (
  id text primary key,
  name text not null,
  company_id text not null references public.companies(id),
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id text primary key,
  name text not null,
  company_id text not null references public.companies(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sellers (
  id text primary key,
  name text not null,
  company_id text not null references public.companies(id),
  product_line_id text references public.product_lines(id),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  referencia text not null,
  codigo_barras text,
  almacen text,
  company_id text not null references public.companies(id),
  brand_id text references public.brands(id),
  product_line_id text references public.product_lines(id),
  categoria text,
  unit text,
  purchase_price numeric,
  sale_price numeric,
  stock numeric,
  min_stock numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  company_id text not null references public.companies(id),
  seller_id text references public.sellers(id),
  order_date timestamptz not null,
  delivery_date timestamptz,
  status text not null default 'Pendiente',
  notes text,
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  date timestamptz not null,
  amount numeric not null,
  payment_method text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.duplicates (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  order_number text not null,
  date timestamptz not null,
  matches jsonb not null default '[]'::jsonb,
  confirmed boolean not null default false
);

-- =====================================================================
-- Row Level Security: solo usuarios autenticados (login con email).
-- Roles: admin gestiona usuarios; los datos quedan abiertos a todo
-- autenticado (el control de acceso es por rol/vistas, no por fila).
-- Requiere Supabase Auth: "Confirm email" OFF (contraseñas temporales),
-- "Allow new users to sign up" ON (lo usa el admin al crear usuarios).
-- =====================================================================

alter table public.roles            enable row level security;
alter table public.profiles         enable row level security;
alter table public.companies        enable row level security;
alter table public.product_lines    enable row level security;
alter table public.brands           enable row level security;
alter table public.sellers          enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.expenses         enable row level security;
alter table public.duplicates       enable row level security;

create policy "leer roles" on public.roles for select to authenticated using (true);
create policy "admin gestiona roles" on public.roles for all to authenticated
  using (public.auth_rol() = 'admin') with check (public.auth_rol() = 'admin');

create policy "ver perfiles" on public.profiles for select to authenticated using (true);
create policy "admin gestiona perfiles" on public.profiles for all to authenticated
  using (public.auth_rol() = 'admin') with check (public.auth_rol() = 'admin');

do $$
declare
  t text;
begin
  foreach t in array array['companies','product_lines','brands','sellers','products','orders','expenses','duplicates']
  loop
    execute format(
      'create policy "solo autenticados" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- Acceso de rol a las tablas (la Data API necesita granos por tabla)
grant select, insert, update, delete on public.roles, public.profiles to authenticated;
grant execute on function public.email_por_username(text) to anon, authenticated;
grant select, insert, update, delete on public.companies, public.product_lines, public.brands,
  public.sellers, public.products, public.orders, public.expenses,
  public.duplicates to authenticated;