-- =====================================================================
-- Migración a nombres en inglés de tablas y columnas.
-- Ejecutar en el SQL Editor después de haber corriendo supabase/schema.sql.
-- Las FKs y grants se conservan (Postgres actualiza las referencias al renombrar).
-- =====================================================================

-- 1) Tablas
alter table public.empresas    rename to companies;
alter table public.lineas      rename to product_lines;
alter table public.marcas      rename to brands;
alter table public.vendedores  rename to sellers;
alter table public.productos   rename to products;
alter table public.pedidos     rename to orders;
alter table public.egresos     rename to expenses;
alter table public.duplicados  rename to duplicates;
alter table public.borradores  rename to drafts;

-- 2) companies
alter table public.companies rename column nombre       to name;
alter table public.companies rename column tipo         to type;
alter table public.companies rename column dias_llegada to arrival_days;
alter table public.companies rename column creado_en    to created_at;
alter table public.companies rename column marcas       to brands;

-- 3) product_lines
alter table public.product_lines rename column nombre       to name;
alter table public.product_lines rename column empresa_id   to company_id;
alter table public.product_lines rename column descripcion  to description;
alter table public.product_lines rename column creado_en    to created_at;

-- 4) brands
alter table public.brands rename column nombre      to name;
alter table public.brands rename column empresa_id  to company_id;
alter table public.brands rename column creado_en   to created_at;

-- 5) sellers
alter table public.sellers rename column nombre      to name;
alter table public.sellers rename column empresa_id  to company_id;
alter table public.sellers rename column linea_id    to product_line_id;
alter table public.sellers rename column telefono    to phone;
alter table public.sellers rename column creado_en   to created_at;

-- 6) products
alter table public.products rename column nombre          to name;
alter table public.products rename column empresa_id      to company_id;
alter table public.products rename column marca_id        to brand_id;
alter table public.products rename column linea_id        to product_line_id;
alter table public.products rename column unidad          to unit;
alter table public.products rename column precio_compra   to purchase_price;
alter table public.products rename column precio_venta    to sale_price;
alter table public.products rename column stock_minimo    to min_stock;
alter table public.products rename column creado_en      to created_at;

-- 7) orders
alter table public.orders rename column numero          to order_number;
alter table public.orders rename column empresa_id      to company_id;
alter table public.orders rename column vendedor_id     to seller_id;
alter table public.orders rename column fecha_pedido    to order_date;
alter table public.orders rename column fecha_entrega   to delivery_date;
alter table public.orders rename column estado          to status;
alter table public.orders rename column notas           to notes;
alter table public.orders rename column lineas          to lines;
alter table public.orders rename column creado_en       to created_at;

-- 8) expenses
alter table public.expenses rename column pedido_id     to order_id;
alter table public.expenses rename column monto         to amount;
alter table public.expenses rename column forma_pago    to payment_method;
alter table public.expenses rename column descripcion   to description;
alter table public.expenses rename column creado_en     to created_at;
-- date se mantiene como: date

-- 9) duplicates
alter table public.duplicates rename column pedido_id    to order_id;
alter table public.duplicates rename column numero       to order_number;
alter table public.duplicates rename column coincidencias to matches;
alter table public.duplicates rename column confirmado   to confirmed;
-- date se mantiene como: date

-- 10) drafts
alter table public.drafts rename column empresa_id      to company_id;
alter table public.drafts rename column vendedor_id     to seller_id;
alter table public.drafts rename column fecha_entrega   to delivery_date;
alter table public.drafts rename column notas           to notes;
alter table public.drafts rename column lineas          to lines;
alter table public.drafts rename column actualizado_en  to updated_at;