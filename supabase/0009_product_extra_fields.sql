-- =====================================================================
-- Producto: campos mínimos (ALMACEN, REFERENCIA, COD. BARRA, CATEGORIA).
-- Ejecutar en el SQL Editor después de 0008_profile_avatars.sql.
-- =====================================================================

-- 1) SKU pasa a llamarse REFERENCIA (misma semántica de detección de duplicados)
alter table public.products rename column sku to referencia;

-- 2) Código de barras (EAN/UPC) del producto
alter table public.products add column if not exists codigo_barras text;

-- 3) Almacén o bodega donde se ubica el producto
alter table public.products add column if not exists almacen text;

-- 4) Categoría propia del producto (independiente de la línea)
alter table public.products add column if not exists categoria text;