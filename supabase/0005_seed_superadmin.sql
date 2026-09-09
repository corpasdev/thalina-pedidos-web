-- =====================================================================
-- Siembra del SUPER ADMIN inicial.
-- Ejecutar en el SQL Editor UNA sola vez (después de 0004_auth_roles.sql).
--
-- Credenciales generadas en esta tarea (cámbialas tras el primer uso
-- desde Supabase Dashboard → Authentication → Users → ... → Reset password):
--   usuario: admin@thaliana.com
--   password: SZqfASgXAXraj5ap
-- =====================================================================

-- Crea la cuenta en auth.users (confirmada, metadata de rol) y su perfil admin.
-- Si el email ya existe, no hace nada.

do $$
declare
  v_uid uuid;
begin
  -- 1) Crear cuenta si el email aún no existe
  select u.id into v_uid
  from auth.users u
  where u.email = 'admin@thaliana.com';

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token, is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      'admin@thaliana.com',
      crypt('SZqfASgXAXraj5ap', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "Super Usuario", "rol": "admin"}',
      now(),
      now(),
      '',
      '',
      '',
      '',
      false
    );

    -- 2) Identity de "email": OBLIGATORIO para poder iniciar sesión con
    --    email+contraseña (GoTrue busca este identity). Si el usuario ya existía
    --    de una siembra antigua sin identity, se repara aquí.
    if not exists (
      select 1 from auth.identities i
      where i.user_id = v_uid and i.provider = 'email'
    ) then
      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at, email
      ) values (
        gen_random_uuid(),
        v_uid::text,
        v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', 'admin@thaliana.com'),
        'email',
        now(),
        now(),
        now(),
        'admin@thaliana.com'
      );
    end if;
  end if;

  -- 3) Perfil público con rol administrador (idempotente)
  insert into public.profiles (id, email, full_name, role_name, active)
  values (v_uid, 'admin@thaliana.com', 'Super Usuario', 'admin', true)
  on conflict (id) do update
    set role_name = 'admin', active = true;
end
$$;