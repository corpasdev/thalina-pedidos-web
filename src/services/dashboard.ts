import type { Pedido, Egreso, Producto, Empresa, Marca } from '@/domain/models'
import { resumenEgresos, pagosEnMes, saldoPendiente, totalPorPedido } from './egresos'
import { detectarDuplicados } from './pedidos'

export interface DashboardData {
  egresosMes: number
  egresosHistorico: number
  pedidosActivos: Pedido[]
  pedidosRecibidosMes: number
  valorPedidosPendientes: number
  saldoPorPagar: number
  productosDuplicados: number
  duplicadosDetalle: ReturnType<typeof detectarDuplicados>
  entregasProximas: Pedido[]
  totalProductos: number
  totalEmpresas: number
  totalMarcas: number
  stocksCriticos: Producto[]
}

export function buildDashboard(
  pedidos: Pedido[],
  egresos: Egreso[],
  productos: Producto[],
  empresas: Empresa[],
  marcas: Marca[]
): DashboardData {
  const mes = new Date()
  const hoy = new Date()

  const pedidosActivos = pedidos.filter((p) => p.estado === 'Pendiente' || p.estado === 'Confirmado' || p.estado === 'En tránsito')

  const next = new Date()
  next.setDate(next.getDate() + 7)

  const entregasProximas = pedidosActivos
    .filter((p) => p.fechaEntrega && new Date(p.fechaEntrega).getTime() >= hoy.getTime() && new Date(p.fechaEntrega).getTime() <= next.getTime())
    .sort((a, b) => (a.fechaEntrega! > b.fechaEntrega! ? 1 : -1))

  const valorPedidosPendientes = pedidosActivos.reduce((acc, p) => acc + totalPorPedido(p), 0)

  const saldoPorPagar = pedidosActivos.reduce((acc, p) => acc + saldoPendiente(p, egresos), 0)

  const stocksCriticos = productos.filter((p) => p.stockMinimo !== undefined && p.stock !== undefined && p.stock <= p.stockMinimo)

  return {
    egresosMes: pagosEnMes(egresos, mes),
    egresosHistorico: resumenEgresos(egresos).total,
    pedidosActivos,
    pedidosRecibidosMes: pedidos.filter(
      (p) => p.estado === 'Recibido' && new Date(p.fechaEntrega ?? p.creadoEn).getMonth() === mes.getMonth()
    ).length,
    valorPedidosPendientes,
    saldoPorPagar,
    productosDuplicados: detectarDuplicados(productos, pedidos, marcas, empresas).length,
    duplicadosDetalle: detectarDuplicados(productos, pedidos, marcas, empresas),
    entregasProximas,
    totalProductos: productos.length,
    totalEmpresas: empresas.length,
    totalMarcas: marcas.length,
    stocksCriticos
  }
}