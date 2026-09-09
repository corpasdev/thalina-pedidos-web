-- =====================================================================
-- Roles y perfiles de usuario (auth) + endurecimiento RLS.
-- Ejecutar en el SQL Editor después de 0003_split_arrival_days.sql.
-- Requiere Supabase Auth habilitado. Flujo de usuarios:
--   admin gestiona usuarios · "Confirm email" debe estar EN OFF en Auth
--   (se usan contraseñas temporales). "Allow new users to sign up" ON.
-- =====================================================================

-- 1) Roles del sistema
create table if not exists public.roles (
  name text primary key,
  label text not null,
  level integer not null default 1
);

insert into public.roles (name, label, level) values
  ('admin', 'Administrador', 2),
  ('collaborator', 'Colaborador', 1)
on conflict (name) do nothing;

-- 2) Perfiles de usuario (uno por cuenta de auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role_name text not null default 'collaborator' references public.roles(name),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) Helper: rol del usuario autenticado (null si no hay perfil)
create or replace function public.auth_rol()
returns text
language sql
stable
as $$
  select role_name from public.profiles where id = auth.uid()
$$;

alter table public.roles    enable row level security;
alter table public.profiles enable row level security;

-- roles: lectura para autenticados, gestión solo admin
drop policy if exists "todas las operaciones demo" on public.roles;
drop policy if exists "leer roles" on public.roles;
drop policy if exists "admin gestiona roles" on public.roles;
create policy "leer roles" on public.roles for select to authenticated using (true);
create policy "admin gestiona roles" on public.roles for all to authenticated
  using (public.auth_rol() = 'admin') with check (public.auth_rol() = 'admin');

-- profiles: lectura de todos los autenticados, escritura solo admin
drop policy if exists "todas las operaciones demo" on public.profiles;
drop policy if exists "ver perfiles" on public.profiles;
drop policy if exists "admin gestiona perfiles" on public.profiles;
create policy "ver perfiles" on public.profiles for select to authenticated using (true);
create policy "admin gestiona perfiles" on public.profiles for all to authenticated
  using (public.auth_rol() = 'admin') with check (public.auth_rol() = 'admin');

-- 4) Endurecer las tablas de datos: ya no anónimo, solo autenticados
--    (sin filtrado por fila; el control de acceso es por rol/vistas).
do $$
declare
  t text;
begin
  foreach t in array array['companies','product_lines','brands','sellers','products','orders','expenses','duplicates','drafts']
  loop
    execute format('drop policy if exists "todas las operaciones demo" on public.%I;', t);
    execute format(
      'create policy "solo autenticados" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- 5) Grants para autenticados
grant select, insert, update, delete on public.roles, public.profiles to authenticated;
grant select, insert, update, delete on public.companies, public.product_lines, public.brands,
  public.sellers, public.products, public.orders, public.expenses,
  public.duplicates, public.drafts to authenticated;