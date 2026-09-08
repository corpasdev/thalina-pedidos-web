import { useEmpresaStore, useLineaStore, useVendedorStore, useMarcaStore, useProductoStore, usePedidoStore, useEgresoStore, useBorradorStore } from './stores'
import type { Empresa, Linea, Marca, Vendedor, Producto, Pedido, Egreso, BorradorPedido } from '@/domain/models'

export async function seedDemoData() {
  const hoy = new Date()
  const hoyKey = hoy.toDateString()
  const iso = (h: number, m = 0) => {
    const d = new Date(hoy)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  // Catálogo base: se siembra si falta alguna tabla base (idempotente por upsert).
  // El orden importa (FK): empresas → líneas/marcas → vendedores → productos.
  const empresaStore = useEmpresaStore()
  const productoStore = useProductoStore()
  if (empresaStore.items.length === 0 || productoStore.items.length === 0) {
    const empresas: Empresa[] = [
      { id: 'emp_centro', nombre: 'Thaliana Centro', tipo: 'Propia', marcas: [], diasLlegada: ['Lunes', 'Miércoles', 'Viernes'] },
      { id: 'emp_norte', nombre: 'Super Al Día Norte', tipo: 'Franquicia', marcas: ['Nestlé', 'Alpina'], diasLlegada: ['Martes', 'Jueves', 'Sábado'] },
      { id: 'emp_sur', nombre: 'Minimercado El Sur', tipo: 'Franquicia', marcas: ['Colombina'], diasLlegada: ['Lunes', 'Sábado'] }
    ]

    const lineas: Linea[] = [
      { id: 'lin_1', nombre: 'Refrigerados', empresaId: 'emp_norte', categoria: 'Lácteos' },
      { id: 'lin_2', nombre: 'Despensa', empresaId: 'emp_sur', categoria: 'Despensa' },
      { id: 'lin_3', nombre: 'Cuidado personal', empresaId: 'emp_norte', categoria: 'Perfumería' }
    ]

    const marcas: Marca[] = [
      { id: 'mar_1', nombre: 'Nestlé', empresaId: 'emp_norte' },
      { id: 'mar_2', nombre: 'Alpina', empresaId: 'emp_norte' },
      { id: 'mar_3', nombre: 'Colombina', empresaId: 'emp_sur' }
    ]

    const vendedores: Vendedor[] = [
      { id: 'ven_1', nombre: 'Camila Ríos', empresaId: 'emp_norte', lineaId: 'lin_1' },
      { id: 'ven_2', nombre: 'Andrés Mora', empresaId: 'emp_sur', lineaId: 'lin_2' },
      { id: 'ven_3', nombre: 'Lorena Díaz', empresaId: 'emp_centro' }
    ]

    const productos: Producto[] = [
      { id: 'prod_1', nombre: 'Yogur Thaliana 1000g', sku: 'yogur-1000', empresaId: 'emp_centro', lineaId: 'lin_1', unidad: 'und', precioCompra: 6200, precioVenta: 8500, stock: 40, stockMinimo: 8 },
      { id: 'prod_2', nombre: 'Avena Quaker 500g', sku: 'avena-500', empresaId: 'emp_norte', marcaId: 'mar_1', lineaId: 'lin_2', unidad: 'und', precioCompra: 5400, precioVenta: 7200, stock: 25, stockMinimo: 6 },
      { id: 'prod_3', nombre: 'Queso Campesino 250g', sku: 'queso-250', empresaId: 'emp_norte', marcaId: 'mar_2', lineaId: 'lin_1', unidad: 'und', precioCompra: 9800, precioVenta: 12800, stock: 18, stockMinimo: 5 },
      { id: 'prod_4', nombre: 'Panelas Colombia 5 und', sku: 'panela-5', empresaId: 'emp_sur', marcaId: 'mar_3', lineaId: 'lin_2', unidad: 'pack', precioCompra: 4100, precioVenta: 5600, stock: 30, stockMinimo: 7 },
      { id: 'prod_5', nombre: 'Jabón cremoso Aroma 3und', sku: 'jabon-3', empresaId: 'emp_norte', marcaId: 'mar_1', lineaId: 'lin_3', unidad: 'pack', precioCompra: 8800, precioVenta: 11500, stock: 22, stockMinimo: 6 }
    ]

    await empresaStore.replace(empresas)
    await useLineaStore().replace(lineas)
    await useMarcaStore().replace(marcas)
    await useVendedorStore().replace(vendedores)
    await useProductoStore().replace(productos)
  }

  // Pedidos y egresos demo de HOY: solo si no hay egresos con fecha de hoy en la nube.
  const egresosStore = useEgresoStore()
  if (egresosStore.items.some((e) => new Date(e.fecha).toDateString() === hoyKey)) return

  const montos: Record<string, number> = {
    ped_1: 102000,
    ped_2: 272000,
    ped_3: 340500
  }

  const pedidos: Pedido[] = [
    {
      id: 'ped_1',
      numero: 'P-0001',
      empresaId: 'emp_centro',
      vendedorId: 'ven_3',
      fechaPedido: iso(8, 10),
      fechaEntrega: iso(11, 30),
      estado: 'Recibido',
      lineas: [{ id: 'lp_1', productoId: 'prod_1', cantidad: 12, precioUnitario: 8500 }],
      creadoEn: iso(8, 5)
    },
    {
      id: 'ped_2',
      numero: 'P-0002',
      empresaId: 'emp_norte',
      vendedorId: 'ven_1',
      fechaPedido: iso(9, 0),
      fechaEntrega: iso(12, 0),
      estado: 'Recibido',
      lineas: [
        { id: 'lp_2', productoId: 'prod_2', cantidad: 20, precioUnitario: 7200 },
        { id: 'lp_3', productoId: 'prod_3', cantidad: 10, precioUnitario: 12800 }
      ],
      creadoEn: iso(8, 55)
    },
    {
      id: 'ped_3',
      numero: 'P-0003',
      empresaId: 'emp_sur',
      vendedorId: 'ven_2',
      fechaPedido: iso(10, 30),
      fechaEntrega: iso(15, 0),
      estado: 'Recibido',
      lineas: [
        { id: 'lp_4', productoId: 'prod_4', cantidad: 30, precioUnitario: 5600 },
        { id: 'lp_5', productoId: 'prod_5', cantidad: 15, precioUnitario: 11500 }
      ],
      creadoEn: iso(10, 25)
    }
  ]

  const egresos: Egreso[] = [
    { id: 'egr_1', pedidoId: 'ped_1', fecha: iso(9, 15), monto: montos.ped_1, formaPago: 'Contado', descripcion: 'Pago total recibido' },
    { id: 'egr_2', pedidoId: 'ped_2', fecha: iso(9, 45), monto: montos.ped_2, formaPago: 'Transferencia', descripcion: 'Abono en banco' },
    { id: 'egr_3', pedidoId: 'ped_3', fecha: iso(14, 20), monto: montos.ped_3 - 20000, formaPago: 'Contado', descripcion: 'Saldo pendiente de $20.000' }
  ]

  // Los egresos esperan a que sus pedidos ya existan (FK pedidos → egresos).
  const pedidoStore = usePedidoStore()
  for (const p of pedidos) {
    if (!pedidoStore.items.some((x) => x.id === p.id)) await pedidoStore.add(p)
  }
  for (const e of egresos) {
    if (!egresosStore.items.some((x) => x.id === e.id)) await egresosStore.add(e)
  }

  // Borradores demo: pedidos preparados antes de que llegue el vendedor. Idempotente por id.
  const borradorStore = useBorradorStore()
  const borradores: BorradorPedido[] = [
    {
      id: 'bor_1',
      empresaId: 'emp_centro',
      fechaEntrega: iso(11, 30),
      notas: 'Esperar a la vendedora Lorena para cerrar precios',
      lineas: [{ id: 'lb_1', productoId: 'prod_1', cantidad: 18, precioUnitario: 8500 }],
      actualizadoEn: iso(7, 50)
    },
    {
      id: 'bor_2',
      empresaId: 'emp_norte',
      vendedorId: 'ven_1',
      fechaEntrega: iso(12, 0),
      lineas: [
        { id: 'lb_3', productoId: 'prod_2', cantidad: 24, precioUnitario: 7200 },
        { id: 'lb_4', productoId: 'prod_5', cantidad: 12, precioUnitario: 11500 }
      ],
      actualizadoEn: iso(7, 55)
    },
    {
      id: 'bor_3',
      empresaId: 'emp_sur',
      fechaEntrega: iso(15, 0),
      notas: 'Confirmar promoción de panelas',
      lineas: [{ id: 'lb_5', productoId: 'prod_4', cantidad: 36, precioUnitario: 5600 }],
      actualizadoEn: iso(8, 5)
    }
  ]
  for (const b of borradores) {
    if (!borradorStore.items.some((x) => x.id === b.id)) await borradorStore.add(b)
  }
}