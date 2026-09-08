-- Migración complementaria: renombra la columna jsonb que quedó pendiente.
-- Ejecutar en SQL Editor (una sola línea).
alter table public.companies rename column marcas to brands;