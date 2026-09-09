import type {
  Empresa,
  Linea,
  Vendedor,
  Marca,
  Producto,
  Pedido,
  Egreso,
  Duplicado,
  Usuario,
  DiaSemana,
  Categoria,
  TipoEmpresa,
  EstadoPedido,
  FormaPago,
  LineaPedido,
  Rol
} from '@/domain/models'

/** Configuración de una colección (entidad de dominio ↔ tabla de Supabase). */
export interface DbCollection<T> {
  table: string
  toRow: (item: T) => Record<string, unknown>
  fromRow: (row: Record<string, unknown>) => T
}

const num = (v: unknown): number | undefined =>
  v === null || v === undefined ? undefined : Number(v)
const str = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

export const PROFILES_COL: DbCollection<Usuario> = {
  table: 'profiles',
  toRow: (u) => ({
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    full_name: u.nombre,
    role_name: u.rol,
    active: u.activo,
    created_at: u.creadoEn
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    email: str(r.email) ?? '',
    username: str(r.username),
    nombre: str(r.full_name) ?? '',
    rol: (str(r.role_name) as Rol) ?? 'collaborator',
    activo: r.active !== undefined ? Boolean(r.active) : true,
    creadoEn: str(r.created_at) ?? ''
  })
}

export const EMPRESAS_COL: DbCollection<Empresa> = {
  table: 'companies',
toRow: (e) => ({ id: e.id, name: e.nombre, type: e.tipo, brands: e.marcas, order_days: e.orderDays, delivery_days: e.deliveryDays }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.name) ?? '',
    tipo: (str(r.type) as TipoEmpresa) ?? 'Propia',
    marcas: arr(r.brands) as string[],
    orderDays: arr(r.order_days) as DiaSemana[],
    deliveryDays: arr(r.delivery_days) as DiaSemana[]
  })
}

export const LINEAS_COL: DbCollection<Linea> = {
  table: 'product_lines',
  toRow: (l) => ({ id: l.id, name: l.nombre, company_id: l.empresaId, category: l.categoria, description: l.descripcion }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.name) ?? '',
    empresaId: str(r.company_id) ?? '',
    categoria: (str(r.category) as Categoria) ?? 'Otro',
    descripcion: str(r.description)
  })
}

export const VENDEDORES_COL: DbCollection<Vendedor> = {
  table: 'sellers',
  toRow: (v) => ({ id: v.id, name: v.nombre, company_id: v.empresaId, product_line_id: v.lineaId ?? null, phone: v.telefono ?? null }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.name) ?? '',
    empresaId: str(r.company_id) ?? '',
    lineaId: str(r.product_line_id),
    telefono: str(r.phone)
  })
}

export const MARCAS_COL: DbCollection<Marca> = {
  table: 'brands',
  toRow: (m) => ({ id: m.id, name: m.nombre, company_id: m.empresaId }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.name) ?? '',
    empresaId: str(r.company_id) ?? ''
  })
}

export const PRODUCTOS_COL: DbCollection<Producto> = {
  table: 'products',
  toRow: (p) => ({
    id: p.id,
    name: p.nombre,
    sku: p.sku,
    company_id: p.empresaId,
    brand_id: p.marcaId ?? null,
    product_line_id: p.lineaId ?? null,
    unit: p.unidad ?? null,
    purchase_price: p.precioCompra ?? null,
    sale_price: p.precioVenta ?? null,
    stock: p.stock ?? null,
    min_stock: p.stockMinimo ?? null
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.name) ?? '',
    sku: str(r.sku) ?? '',
    empresaId: str(r.company_id) ?? '',
    marcaId: str(r.brand_id),
    lineaId: str(r.product_line_id),
    unidad: str(r.unit),
    precioCompra: num(r.purchase_price),
    precioVenta: num(r.sale_price),
    stock: num(r.stock),
    stockMinimo: num(r.min_stock)
  })
}

export const PEDIDOS_COL: DbCollection<Pedido> = {
  table: 'orders',
  toRow: (p) => ({
    id: p.id,
    order_number: p.numero,
    company_id: p.empresaId,
    seller_id: p.vendedorId ?? null,
    order_date: p.fechaPedido,
    delivery_date: p.fechaEntrega ?? null,
    status: p.estado,
    notes: p.notas ?? null,
    lines: p.lineas,
    created_at: p.creadoEn
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    numero: str(r.order_number) ?? '',
    empresaId: str(r.company_id) ?? '',
    vendedorId: str(r.seller_id),
    fechaPedido: str(r.order_date) ?? '',
    fechaEntrega: str(r.delivery_date),
    estado: (str(r.status) as EstadoPedido) ?? 'Pendiente',
    notas: str(r.notes),
    lineas: arr(r.lines) as LineaPedido[],
    creadoEn: str(r.created_at) ?? ''
  })
}

export const EGRESOS_COL: DbCollection<Egreso> = {
  table: 'expenses',
  toRow: (e) => ({
    id: e.id,
    order_id: e.pedidoId,
    date: e.fecha,
    amount: e.monto,
    payment_method: e.formaPago,
    description: e.descripcion ?? null
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    pedidoId: str(r.order_id) ?? '',
    fecha: str(r.date) ?? '',
    monto: num(r.amount) ?? 0,
    formaPago: (str(r.payment_method) as FormaPago) ?? 'Contado',
    descripcion: str(r.description)
  })
}

export const DUPLICADOS_COL: DbCollection<Duplicado> = {
  table: 'duplicates',
  toRow: (d) => ({
    id: d.id,
    order_id: d.pedidoId,
    order_number: d.numero,
    date: d.fecha,
    matches: d.coincidencias,
    confirmed: d.confirmado
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    pedidoId: str(r.order_id) ?? '',
    numero: str(r.order_number) ?? '',
    fecha: str(r.date) ?? '',
    coincidencias: arr(r.matches) as Duplicado['coincidencias'],
    confirmado: Boolean(r.confirmed)
  })
}