-- =====================================================================
-- 0007 · Borrados como estado de pedido
--
-- Convierte el módulo de borradores en un estado temporal de los pedidos:
--   1) orders.seller_id pasa a ser opcional (un borrador puede guardarse
--      sin vendedor asignado).
--   2) Los borradores existentes se migran a orders con status 'Borrador'.
--   3) Se elimina la tabla drafts (y sus políticas RLS asociadas).
-- =====================================================================

alter table public.orders
  alter column seller_id drop not null;

do $$
begin
  if to_regclass('public.drafts') is null then
    return;
  end if;

  with base as (
    select coalesce(
      max((regexp_match(order_number, '^P-(\d+)$'))[1]::int),
      0
    ) as max_num
    from public.orders
    where order_number ~ '^P-(\d+)$'
  )
  insert into public.orders (
    id, order_number, company_id, seller_id, order_date, delivery_date,
    status, notes, lines, created_at
  )
  select
    d.id,
    'P-' || lpad(
      (base.max_num + row_number() over (order by d.updated_at))::text,
      4,
      '0'
    ),
    d.company_id,
    d.seller_id,
    coalesce(d.updated_at, now()),
    d.delivery_date,
    'Borrador',
    d.notes,
    d.lines,
    coalesce(d.updated_at, now())
  from public.drafts d
  cross join base
  on conflict (id) do nothing;

  drop table if exists public.drafts;
end $$;