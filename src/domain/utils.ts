import type { ID } from './models'

export function uid(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const t = Date.now().toString(36)
  return `${prefix}_${t}${rand}`
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value)
}

export function formatDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${formatDate(value)} · ${d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

export function diaDeHoy(): string {
  const d = new Date()
  const dia = DIANG[ d.getDay() ]
  return dia
}

const DIANG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function fechaISO(): string {
  return new Date().toISOString()
}

export function normalizeReferencia(referencia: string): string {
  return referencia.trim().toLowerCase().replace(/\s+/g, '-')
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function nextNumeroPedido(contador: number): string {
  return `P-${String(contador).padStart(4, '0')}`
}

export function numeroDestacado(num: string): string {
  return num.toUpperCase()
}

export function haceDias(fecha: string): number {
  const diff = Date.now() - new Date(fecha).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}