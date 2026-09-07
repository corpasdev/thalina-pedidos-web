import type { DiaSemana, EstadoPedido, Categoria, TipoEmpresa, FormaPago } from './models'

export const DIAS_SEMANA: DiaSemana[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
]

/** Días en que llegan pedidos a la tienda */
export const DIAS_ENTREGA: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'Pendiente',
  'Confirmado',
  'En tránsito',
  'Recibido',
  'Cancelado'
]

export const CATEGORIAS: Categoria[] = [
  'Alimentos',
  'Aseo',
  'Hogar',
  'Bebidas',
  'Frescos',
  'Lácteos',
  'Congelados',
  'Despensa',
  'Perfumería',
  'Otro'
]

export const TIPOS_EMPRESA: TipoEmpresa[] = ['Franquicia', 'Propia']

export const FORMAS_PAGO: FormaPago[] = [
  'Contado',
  'Crédito',
  'Transferencia',
  'Cheque',
  'Contra catálogo'
]

export const MONEDA = 'COP'