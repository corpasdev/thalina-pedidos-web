import type { Pedido, Producto, LineaPedido, Empresa, Marca, Vendedor, Linea } from '@/domain/models'
import { uid } from '@/domain/utils'

export function calcularTotalPedido(lineas: LineaPedido[]): number {
  return lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
}

export function siguienteNumeroPedido(pedidos: Pedido[]): string {
  const nums = pedidos
    .map((p) => {
      const m = p.numero.match(/(\d+)/)
      return m ? Number(m[1]) : 0
    })
    .filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `P-${String(max + 1).padStart(4, '0')}`
}

export type DuplicadoInfo = {
  producto: Producto
  cantidadGlobal: string
  pedidosAnteriores: { numero: string; fecha: string; empresa: string }[]
}[]

/**
 * Detecta repeticiones de un producto (por referencia normalizada) en pedidos activos.
 * Una misma referencia no debe pedirse dos veces en el mismo ciclo.
 */
export function detectarDuplicados(
  productos: Producto[],
  pedidos: Pedido[],
  marcas: Marca[],
  empresas: Empresa[]
): DuplicadoInfo {
  const activos = pedidos.filter((p) => p.estado !== 'Cancelado' && p.estado !== 'Recibido')
  const refsEnPedidos = new Map<string, Set<string>>()
  const porRef = new Map<string, { numero: string; fecha: string; empresa: string }[]>()

  activos.forEach((pedido) => {
    const empresa = empresas.find((e) => e.id === pedido.empresaId)?.nombre ?? '—'
    pedido.lineas.forEach((l) => {
      const producto = productos.find((p) => p.id === l.productoId)
      if (!producto) return
      const refNorm = producto.referencia.toLowerCase().trim()
      if (!refsEnPedidos.has(refNorm)) refsEnPedidos.set(refNorm, new Set())
      if (!porRef.has(refNorm)) porRef.set(refNorm, [])
      porRef.get(refNorm)!.push({ numero: pedido.numero, fecha: pedido.fechaPedido, empresa })
    })
  })

  const info: DuplicadoInfo = []
  porRef.forEach((pedidosAnteriores, ref) => {
    if (pedidosAnteriores.length < 2) return
    const producto = productos.find((p) => p.referencia.toLowerCase().trim() === ref)
    if (!producto) return
    const cant = pedidosAnteriores.length
    info.push({
      producto,
      cantidadGlobal: `${cant} pedidos`,
      pedidosAnteriores
    })
  })
  return info
}

/** Registra automáticamente el egreso generado por un pedido confirmado. */
export function egresoDePedido(
  pedido: Pedido,
  monto?: number
): { id: string; pedidoId: string; fecha: string; monto: number; formaPago: 'Crédito' } {
  return {
    id: uid('egr'),
    pedidoId: pedido.id,
    fecha: pedido.fechaPedido,
    monto: monto ?? calcularTotalPedido(pedido.lineas),
    formaPago: 'Crédito'
  }
}

export function nombreDeVendedor(vendedores: Vendedor[], id: string | undefined): string {
  if (!id) return '—'
  return vendedores.find((v) => v.id === id)?.nombre ?? '—'
}

export function nombreDeEmpresa(empresas: Empresa[], id: string | undefined): string {
  if (!id) return '—'
  return empresas.find((e) => e.id === id)?.nombre ?? '—'
}

export function nombreDeLinea(lineas: Linea[], id: string | undefined): string {
  if (!id) return '—'
  return lineas.find((l) => l.id === id)?.nombre ?? '—'
}

export function nombreDeMarca(marcas: Marca[], id: string | undefined): string {
  if (!id) return '—'
  return marcas.find((m) => m.id === id)?.nombre ?? '—'
}

/** Filtra líneas de una empresa: franquicias traen varias marcas, propias solo la suya. */
export function marcasVisibles(empresa: Empresa, marcas: Marca[]): Marca[] {
  if (empresa.tipo === 'Franquicia') return marcas.filter((m) => m.empresaId === empresa.id)
  return marcas.filter((m) => m.empresaId === empresa.id)
}