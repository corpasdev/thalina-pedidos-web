-- =====================================================================
-- Separar arrival_days en dos atributos: order_days y delivery_days.
-- Ejecutar en el SQL Editor después de 0002_english_names.sql.
-- Los proveedores que traen producto el mismo día del pedido quedan con
-- los mismos días en ambas columnas; si ya fue corregido a mano, ajustar.
-- =====================================================================

alter table public.companies add column order_days jsonb not null default '[]'::jsonb;
alter table public.companies add column delivery_days jsonb not null default '[]'::jsonb;

update public.companies
set order_days = coalesce(arrival_days, '[]'::jsonb),
    delivery_days = coalesce(arrival_days, '[]'::jsonb)
where arrival_days is not null;

alter table public.companies drop column arrival_days;