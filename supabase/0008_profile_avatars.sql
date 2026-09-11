-- =====================================================================
-- Avatar de perfil: storage bucket "avatars" + columna avatar_url.
-- Ejecutar en el SQL Editor después de 0007_drafts_as_order_status.sql.
--
--  1) Columna avatar_url en public.profiles (URL pública del archivo).
--  2) Política RLS: cada usuario autenticado puede ACTUALIZAR su propio
--     perfil (antes solo el admin podía escribir).
--  3) Bucket público "avatars" + políticas: cada usuario sube/elimina
--     archivos dentro de su carpeta {userid}/.
-- =====================================================================

-- 1) Columna del avatar
alter table public.profiles
  add column if not exists avatar_url text;

-- 2) El usuario autenticado puede actualizar su propio perfil.
--    (La política de admin de 0004 sigue vigente; las políticas se suman.)
drop policy if exists "usuario edita su perfil" on public.profiles;
create policy "usuario edita su perfil" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant update on public.profiles to authenticated;

-- 3) Bucket de avatares (público: las imágenes se sirven por URL pública)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true, file_size_limit = 2097152;

-- Políticas del bucket: cada usuario solo toca su propia carpeta {userid}/
drop policy if exists "leer avatares" on storage.objects;
create policy "leer avatares" on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'avatars');

drop policy if exists "subir avatar propio" on storage.objects;
create policy "subir avatar propio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "actualizar avatar propio" on storage.objects;
create policy "actualizar avatar propio" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "eliminar avatar propio" on storage.objects;
create policy "eliminar avatar propio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);