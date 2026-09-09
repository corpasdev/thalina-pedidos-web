-- =====================================================================
-- Username: identificador alternativo al email para iniciar sesión.
-- Ejecutar en el SQL Editor después de 0005_seed_superadmin.sql.
--
-- El login acepta "correo" o "username". El username se guarda en
-- public.profiles.username (único, comparado sin distinguir mayúsculas).
-- La búsqueda se hace con una función SECURITY DEFINER para que funcione
-- desde el login (anon) sin abrir la tabla con RLS.
-- =====================================================================

-- 1) Columna de username (nullable; no confundir nunca con '' — usar NULL)
alter table public.profiles
  add column if not exists username text;

-- 2) Unicidad insensible a mayúsculas/minúsculas (los NULL no chocan entre sí)
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- 3) Resuelve el email a partir del username (solo cuentas activas)
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

grant execute on function public.email_por_username(text) to anon, authenticated;

-- 4) Asigna username al super admin sembrado previamente (idempotente)
update public.profiles
set username = 'admin'
where email = 'admin@thaliana.com'
  and username is null;