import type {
  Empresa,
  Linea,
  Vendedor,
  Marca,
  Producto,
  Pedido,
  Egreso,
  Duplicado,
  BorradorPedido,
  DiaSemana,
  Categoria,
  TipoEmpresa,
  EstadoPedido,
  FormaPago,
  LineaPedido
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

export const EMPRESAS_COL: DbCollection<Empresa> = {
  table: 'empresas',
  toRow: (e) => ({ id: e.id, nombre: e.nombre, tipo: e.tipo, marcas: e.marcas, dias_llegada: e.diasLlegada }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.nombre) ?? '',
    tipo: (str(r.tipo) as TipoEmpresa) ?? 'Propia',
    marcas: arr(r.marcas) as string[],
    diasLlegada: arr(r.dias_llegada) as DiaSemana[]
  })
}

export const LINEAS_COL: DbCollection<Linea> = {
  table: 'lineas',
  toRow: (l) => ({ id: l.id, nombre: l.nombre, empresa_id: l.empresaId, categoria: l.categoria, descripcion: l.descripcion }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.nombre) ?? '',
    empresaId: str(r.empresa_id) ?? '',
    categoria: (str(r.categoria) as Categoria) ?? 'Otro',
    descripcion: str(r.descripcion)
  })
}

export const VENDEDORES_COL: DbCollection<Vendedor> = {
  table: 'vendedores',
  toRow: (v) => ({ id: v.id, nombre: v.nombre, empresa_id: v.empresaId, linea_id: v.lineaId ?? null, telefono: v.telefono ?? null }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.nombre) ?? '',
    empresaId: str(r.empresa_id) ?? '',
    lineaId: str(r.linea_id),
    telefono: str(r.telefono)
  })
}

export const MARCAS_COL: DbCollection<Marca> = {
  table: 'marcas',
  toRow: (m) => ({ id: m.id, nombre: m.nombre, empresa_id: m.empresaId }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.nombre) ?? '',
    empresaId: str(r.empresa_id) ?? ''
  })
}

export const PRODUCTOS_COL: DbCollection<Producto> = {
  table: 'productos',
  toRow: (p) => ({
    id: p.id,
    nombre: p.nombre,
    sku: p.sku,
    empresa_id: p.empresaId,
    marca_id: p.marcaId ?? null,
    linea_id: p.lineaId ?? null,
    unidad: p.unidad ?? null,
    precio_compra: p.precioCompra ?? null,
    precio_venta: p.precioVenta ?? null,
    stock: p.stock ?? null,
    stock_minimo: p.stockMinimo ?? null
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    nombre: str(r.nombre) ?? '',
    sku: str(r.sku) ?? '',
    empresaId: str(r.empresa_id) ?? '',
    marcaId: str(r.marca_id),
    lineaId: str(r.linea_id),
    unidad: str(r.unidad),
    precioCompra: num(r.precio_compra),
    precioVenta: num(r.precio_venta),
    stock: num(r.stock),
    stockMinimo: num(r.stock_minimo)
  })
}

export const PEDIDOS_COL: DbCollection<Pedido> = {
  table: 'pedidos',
  toRow: (p) => ({
    id: p.id,
    numero: p.numero,
    empresa_id: p.empresaId,
    vendedor_id: p.vendedorId,
    fecha_pedido: p.fechaPedido,
    fecha_entrega: p.fechaEntrega ?? null,
    estado: p.estado,
    notas: p.notas ?? null,
    lineas: p.lineas,
    creado_en: p.creadoEn
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    numero: str(r.numero) ?? '',
    empresaId: str(r.empresa_id) ?? '',
    vendedorId: str(r.vendedor_id) ?? '',
    fechaPedido: str(r.fecha_pedido) ?? '',
    fechaEntrega: str(r.fecha_entrega),
    estado: (str(r.estado) as EstadoPedido) ?? 'Pendiente',
    notas: str(r.notas),
    lineas: arr(r.lineas) as LineaPedido[],
    creadoEn: str(r.creado_en) ?? ''
  })
}

export const EGRESOS_COL: DbCollection<Egreso> = {
  table: 'egresos',
  toRow: (e) => ({
    id: e.id,
    pedido_id: e.pedidoId,
    fecha: e.fecha,
    monto: e.monto,
    forma_pago: e.formaPago,
    descripcion: e.descripcion ?? null
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    pedidoId: str(r.pedido_id) ?? '',
    fecha: str(r.fecha) ?? '',
    monto: num(r.monto) ?? 0,
    formaPago: (str(r.forma_pago) as FormaPago) ?? 'Contado',
    descripcion: str(r.descripcion)
  })
}

export const DUPLICADOS_COL: DbCollection<Duplicado> = {
  table: 'duplicados',
  toRow: (d) => ({
    id: d.id,
    pedido_id: d.pedidoId,
    numero: d.numero,
    fecha: d.fecha,
    coincidencias: d.coincidencias,
    confirmado: d.confirmado
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    pedidoId: str(r.pedido_id) ?? '',
    numero: str(r.numero) ?? '',
    fecha: str(r.fecha) ?? '',
    coincidencias: arr(r.coincidencias) as Duplicado['coincidencias'],
    confirmado: Boolean(r.confirmado)
  })
}

export const BORRADORES_COL: DbCollection<BorradorPedido> = {
  table: 'borradores',
  toRow: (b) => ({
    id: b.id,
    empresa_id: b.empresaId,
    vendedor_id: b.vendedorId ?? null,
    fecha_entrega: b.fechaEntrega ?? null,
    notas: b.notas ?? null,
    lineas: b.lineas,
    actualizado_en: b.actualizadoEn
  }),
  fromRow: (r) => ({
    id: str(r.id) ?? '',
    empresaId: str(r.empresa_id) ?? '',
    vendedorId: str(r.vendedor_id),
    fechaEntrega: str(r.fecha_entrega),
    notas: str(r.notas),
    lineas: arr(r.lineas) as LineaPedido[],
    actualizadoEn: str(r.actualizado_en) ?? ''
  })
}