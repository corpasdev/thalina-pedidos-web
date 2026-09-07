import type { Egreso, Pedido } from '@/domain/models'

export function totalEgresosPedido(pedido: Pedido, egresos: Egreso[]): number {
  return egresos
    .filter((e) => e.pedidoId === pedido.id)
    .reduce((acc, e) => acc + e.monto, 0)
}

export function saldoPendiente(pedido: Pedido, egresos: Egreso[]): number {
  const monto = totalPorPedido(pedido)
  return Math.max(0, monto - totalEgresosPedido(pedido, egresos))
}

export function totalPorPedido(pedido: Pedido): number {
  return pedido.lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
}

/** KPI: total egresado en un rango de fechas */
export function resumenEgresos(egresos: Egreso[], desde?: Date, hasta?: Date) {
  const list = egresos.filter((e) => {
    const d = new Date(e.fecha)
    if (!d.getTime()) return false
    if (desde && d < desde) return false
    if (hasta && d > hasta) return false
    return true
  })
  return {
    total: list.reduce((acc, e) => acc + e.monto, 0),
    cantidad: list.length
  }
}

export function egresosEnFecha(egresos: Egreso[], fecha: string): number {
  const d = new Date(fecha)
  return egresos
    .filter((e) => {
      const ed = new Date(e.fecha)
      if (!ed.getTime()) return false
      return ed.toDateString() === d.toDateString()
    })
    .reduce((acc, e) => acc + e.monto, 0)
}

export function pagosEnMes(egresos: Egreso[], mes: Date): number {
  return egresos
    .filter((e) => {
      const d = new Date(e.fecha)
      return d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth()
    })
    .reduce((acc, e) => acc + e.monto, 0)
}