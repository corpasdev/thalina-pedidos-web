export type ID = string

export type Categoria = 'Alimentos' | 'Aseo' | 'Hogar' | 'Bebidas' | 'Frescos' | 'Lácteos' | 'Congelados' | 'Despensa' | 'Perfumería' | 'Otro'

export type TipoEmpresa = 'Franquicia' | 'Propia'

/** Dias de entrega que maneja la tienda */
export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'

export interface Empresa {
  id: ID
  nombre: string
  tipo: TipoEmpresa
  /** Franquicia: trae productos de varias marcas. Propia: vende sus propios productos. */
  marcas: string[]
  /** Días en que llega el pedido / distribuye la marca */
  diasLlegada: DiaSemana[]
}

/** Línea de productos dentro de una empresa (alimentos, aseo, etc). Cada vendedor cubre una línea. */
export interface Linea {
  id: ID
  nombre: string
  empresaId: ID
  categoria: Categoria
  descripcion?: string
}

export interface Vendedor {
  id: ID
  nombre: string
  empresaId: ID
  lineaId?: ID
  telefono?: string
}

/** Marca = código/marca comercial que la empresa ofrece (e.g. una franquicia trae Nestlé, Alpina, ...) */
export interface Marca {
  id: ID
  nombre: string
  empresaId: ID
}

/** Producto unit que se pide. Normalizado por codigoBarras o SKU para detectar duplicados entre marcas. */
export interface Producto {
  id: ID
  nombre: string
  /** SKU único usado para detectar productos iguales entre vendedores/marcas */
  sku: string
  empresaId: ID
  marcaId?: ID
  lineaId?: ID
  unidad?: string
  precioCompra?: number
  precioVenta?: number
  stock?: number
  stockMinimo?: number
}

export interface LineaPedido {
  id: ID
  productoId: ID
  cantidad: number
  precioUnitario: number
}

export type EstadoPedido = 'Pendiente' | 'Confirmado' | 'En tránsito' | 'Recibido' | 'Cancelado'

export interface Pedido {
  id: ID
  numero: string
  empresaId: ID
  vendedorId: ID
  fechaPedido: string
  fechaEntrega?: string
  estado: EstadoPedido
  lineas: LineaPedido[]
  notas?: string
  creadoEn: string
}

export type FormaPago = 'Contado' | 'Crédito' | 'Transferencia' | 'Cheque' | 'Contra catálogo'

/**
 * Borrador de pedido: se prepara antes de que llegue el vendedor para agilizar
 * el pedido cuando este visita la tienda. Puede guardarse sin vendedor asignado.
 */
export interface BorradorPedido {
  id: ID
  empresaId: ID
  vendedorId?: ID
  fechaEntrega?: string
  lineas: LineaPedido[]
  notas?: string
  actualizadoEn: string
}

export interface Egreso {
  id: ID
  pedidoId: ID
  fecha: string
  /** Monto efectivamente contabilizado del pedido (posible descuentos/ajustes) */
  monto: number
  formaPago: FormaPago
  descripcion?: string
}

export interface Duplicado {
  id: ID
  pedidoId: ID
  numero: string
  fecha: string
  /** Productos repetidos: sku/nombre y dónde ya se pidió */
  coincidencias: { sku: string; productoNombre: string; pedidoAnterior: string; pedidoAnteriorNumero: string }[]
  /** True si se confirma a pesar del aviso */
  confirmado: boolean
}