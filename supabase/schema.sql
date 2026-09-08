-- =====================================================================
-- Thaliana · Administración de Pedidos — Esquema Supabase
-- Ejecutar en SQL Editor del proyecto (con la Data API expuesta: public).
-- =====================================================================

create table if not exists public.empresas (
  id text primary key,
  nombre text not null,
  tipo text not null default 'Propia',
  marcas jsonb not null default '[]'::jsonb,
  dias_llegada jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists public.lineas (
  id text primary key,
  nombre text not null,
  empresa_id text not null references public.empresas(id),
  categoria text not null,
  descripcion text,
  creado_en timestamptz not null default now()
);

create table if not exists public.marcas (
  id text primary key,
  nombre text not null,
  empresa_id text not null references public.empresas(id),
  creado_en timestamptz not null default now()
);

create table if not exists public.vendedores (
  id text primary key,
  nombre text not null,
  empresa_id text not null references public.empresas(id),
  linea_id text references public.lineas(id),
  telefono text,
  creado_en timestamptz not null default now()
);

create table if not exists public.productos (
  id text primary key,
  nombre text not null,
  sku text not null,
  empresa_id text not null references public.empresas(id),
  marca_id text references public.marcas(id),
  linea_id text references public.lineas(id),
  unidad text,
  precio_compra numeric,
  precio_venta numeric,
  stock numeric,
  stock_minimo numeric,
  creado_en timestamptz not null default now()
);

create table if not exists public.pedidos (
  id text primary key,
  numero text not null,
  empresa_id text not null references public.empresas(id),
  vendedor_id text not null references public.vendedores(id),
  fecha_pedido timestamptz not null,
  fecha_entrega timestamptz,
  estado text not null default 'Pendiente',
  notas text,
  lineas jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists public.egresos (
  id text primary key,
  pedido_id text not null references public.pedidos(id) on delete cascade,
  fecha timestamptz not null,
  monto numeric not null,
  forma_pago text not null,
  descripcion text,
  creado_en timestamptz not null default now()
);

create table if not exists public.duplicados (
  id text primary key,
  pedido_id text not null references public.pedidos(id) on delete cascade,
  numero text not null,
  fecha timestamptz not null,
  coincidencias jsonb not null default '[]'::jsonb,
  confirmado boolean not null default false
);

create table if not exists public.borradores (
  id text primary key,
  empresa_id text not null references public.empresas(id),
  vendedor_id text references public.vendedores(id),
  fecha_entrega timestamptz,
  notas text,
  lineas jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security: acceso completo anónimo (herramienta interna sin login).
-- Si luego agregas Supabase Auth, restringe a authenticated con
-- policies por dueño. Nunca expongas la service_role key en el frontend.
-- =====================================================================

alter table public.empresas    enable row level security;
alter table public.lineas      enable row level security;
alter table public.marcas      enable row level security;
alter table public.vendedores  enable row level security;
alter table public.productos   enable row level security;
alter table public.pedidos     enable row level security;
alter table public.egresos     enable row level security;
alter table public.duplicados  enable row level security;
alter table public.borradores  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['empresas','lineas','marcas','vendedores','productos','pedidos','egresos','duplicados','borradores']
  loop
    execute format(
      'create policy "todas las operaciones demo" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- Acceso de rol a las tablas (la Data API necesita granos por tabla)
grant select, insert, update, delete on public.empresas, public.lineas, public.marcas,
  public.vendedores, public.productos, public.pedidos, public.egresos,
  public.duplicados, public.borradores to anon, authenticated;