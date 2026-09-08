-- =====================================================================
-- Thaliana · Administración de Pedidos — Esquema Supabase
-- Ejecutar en SQL Editor del proyecto (con la Data API expuesta: public).
-- =====================================================================

create table if not exists public.companies (
  id text primary key,
  name text not null,
  type text not null default 'Propia',
  brands jsonb not null default '[]'::jsonb,
  arrival_days jsonb not null default '[]'::jsonb,
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
  sku text not null,
  company_id text not null references public.companies(id),
  brand_id text references public.brands(id),
  product_line_id text references public.product_lines(id),
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
  seller_id text not null references public.sellers(id),
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

create table if not exists public.drafts (
  id text primary key,
  company_id text not null references public.companies(id),
  seller_id text references public.sellers(id),
  delivery_date timestamptz,
  notes text,
  lines jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security: acceso completo anónimo (herramienta interna sin login).
-- Si luego agregas Supabase Auth, restringe a authenticated con
-- policies por dueño. Nunca expongas la service_role key en el frontend.
-- =====================================================================

alter table public.companies      enable row level security;
alter table public.product_lines  enable row level security;
alter table public.brands         enable row level security;
alter table public.sellers        enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.expenses       enable row level security;
alter table public.duplicates     enable row level security;
alter table public.drafts         enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['companies','product_lines','brands','sellers','products','orders','expenses','duplicates','drafts']
  loop
    execute format(
      'create policy "todas las operaciones demo" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- Acceso de rol a las tablas (la Data API necesita granos por tabla)
grant select, insert, update, delete on public.companies, public.product_lines, public.brands,
  public.sellers, public.products, public.orders, public.expenses,
  public.duplicates, public.drafts to anon, authenticated;