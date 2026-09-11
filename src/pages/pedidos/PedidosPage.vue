<template>
  <div class="flex flex-col gap-5">
    <PageHeader>
      <n-button type="primary" @click="$router.push('/pedidos/nuevo')">+ Nuevo pedido</n-button>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <n-statistic label="Activos" :value="resumen.activos" />
      <n-statistic label="Pendientes de confirmar" :value="resumen.pendientes" />
      <n-statistic label="Valor sin cancelar" :value="formatMoney(resumen.valor)" />
      <n-statistic label="Con saldo por pagar" :value="resumen.conSaldo" />
    </div>

    <div class="flex flex-wrap gap-3">
      <n-input v-model:value="busqueda" placeholder="Buscar por número…" class="!w-48" clearable />
      <n-select v-model:value="filtroEstado" :options="estadoFilterOptions" class="!w-44" />
      <n-select v-model:value="filtroEmpresa" :options="empresaFilterOptions" class="!w-56" />
    </div>

    <n-alert v-if="duplicados.length > 0" type="warning" title="Repetidos entre pedidos activos">
      Productos con el mismo SKU pedidos varias veces. Revise antes de confirmar entregas.
    </n-alert>

    <n-data-table :columns="columnas" :data="rows" :pagination="{ pageSize: 12 }" />

    <n-modal v-model:show="showDetalle" :title="detalle?.numero ?? ''" preset="card" style="width: 640px" closable>
      <DetallePedido :pedido="detalle" v-if="detalle" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NText, NTag, NButton, NSpace, NPopconfirm, NDivider, useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import DetallePedido from './DetallePedido.vue'
import { useCatalog } from '@/composables/useCatalog'
import { formatMoney, formatDate, numeroDestacado, uid, fechaISO } from '@/domain/utils'
import { ESTADOS_PEDIDO } from '@/domain/constants'
import { calcularTotalPedido, siguienteNumeroPedido, detectarDuplicados, nombreDeEmpresa, nombreDeVendedor, nombreDeLinea } from '@/services/pedidos'
import { saldoPendiente } from '@/services/egresos'
import type { Pedido, EstadoPedido } from '@/domain/models'

const message = useMessage()
const router = useRouter()
const { pedidos, egresos, empresas, vendedores, lineas, productos, marcas } = useCatalog()

const filtroEstado = ref<string | null>(null)
const filtroEmpresa = ref<string | null>(null)
const busqueda = ref('')

const showDetalle = ref(false)
const detalle = ref<Pedido | null>(null)

const estadoFilterOptions = [
  { label: 'Todos los estados', value: '__all' },
  ...ESTADOS_PEDIDO.map((e) => ({ label: e, value: e }))
]
const empresaFilterOptions = computed(() => [
  { label: 'Todas las empresas', value: '__all' },
  ...empresas.items.map((e) => ({ label: e.nombre, value: e.id }))
])

const duplicados = computed(() => detectarDuplicados(productos.items, pedidos.items, marcas.items, empresas.items))
const refsEnDuplicados = computed(() => new Set(duplicados.value.map((d) => d.producto.referencia.toLowerCase())))

const rows = computed(() =>
  pedidos.items
    .filter((p) => (filtroEstado.value && filtroEstado.value !== '__all' ? p.estado === filtroEstado.value : true))
    .filter((p) => (filtroEmpresa.value && filtroEmpresa.value !== '__all' ? p.empresaId === filtroEmpresa.value : true))
    .filter((p) => (busqueda.value ? p.numero.toLowerCase().includes(busqueda.value.toLowerCase()) : true))
    .map((p) => {
      const vendedor = vendedores.items.find((v) => v.id === p.vendedorId)
      return {
        ...p,
        total: calcularTotalPedido(p.lineas),
        saldo: saldoPendiente(p, egresos.items),
        empresa: nombreDeEmpresa(empresas.items, p.empresaId),
        vendedorNombre: nombreDeVendedor(vendedores.items, p.vendedorId),
        linea: nombreDeLinea(lineas.items, vendedor?.lineaId)
      }
    })
    .sort((a, b) => (a.fechaPedido < b.fechaPedido ? 1 : -1))
)

const tieneDuplicado = (row: (typeof rows.value)[number]) =>
  row.lineas.some((l) => {
    const pr = productos.items.find((pp) => pp.id === l.productoId)
    return pr ? refsEnDuplicados.value.has(pr.referencia.toLowerCase()) : false
  })

const resumen = computed(() => ({
  activos: pedidos.items.filter((p) => p.estado !== 'Recibido' && p.estado !== 'Cancelado' && p.estado !== 'Borrador').length,
  pendientes: pedidos.items.filter((p) => p.estado === 'Pendiente').length,
  valor: rows.value.reduce((a, r) => a + (r.estado === 'Cancelado' || r.estado === 'Borrador' ? 0 : r.total), 0),
  conSaldo: rows.value.filter((r) => r.saldo > 0 && r.estado !== 'Cancelado' && r.estado !== 'Recibido' && r.estado !== 'Borrador').length
}))

function eliminar(p: Pedido) {
  pedidos.remove(p.id)
  egresos.items.filter((e) => e.pedidoId === p.id).forEach((e) => egresos.remove(e.id))
  message.success('Pedido eliminado')
}

function cambiarEstado(p: Pedido, estado: EstadoPedido) {
  pedidos.update(p.id, { estado })
  message.success(`Pedido ${p.numero} → ${estado}`)
}

function activarBorrador(p: Pedido) {
  pedidos.update(p.id, { estado: 'Pendiente' })
  if (!egresos.items.some((e) => e.pedidoId === p.id)) {
    egresos.add({
      id: uid('egr'),
      pedidoId: p.id,
      fecha: fechaISO(),
      monto: calcularTotalPedido(p.lineas),
      formaPago: 'Contado',
      descripcion: `Egreso automático pedido ${p.numero}`
    })
  }
  message.success(`Pedido ${p.numero} → Pendiente · egreso contabilizado`)
}

const estadoTagType: Record<string, 'default' | 'info' | 'success' | 'warning' | 'primary'> = {
  Borrador: 'default',
  Recibido: 'success',
  Cancelado: 'default',
  'En tránsito': 'warning',
  Confirmado: 'info',
  Pendiente: 'primary'
}

const columnas = computed(() => [
  { title: 'N°', key: 'numero', width: 100, render: (row: any) => h(NText, { strong: true }, { default: () => numeroDestacado(row.numero) }) },
  {
    title: 'Empresa / Vendedor',
    key: 'empresa',
    minWidth: 200,
    render: (row: any) =>
      h('div', { class: 'flex flex-col' }, [
        h(NText, { strong: true }, { default: () => row.empresa }),
        h(NText, { depth: 3, class: 'text-xs' }, { default: () => `${row.vendedorNombre}${row.linea !== '—' ? ` · ${row.linea}` : ''}` })
      ])
  },
  { title: 'Pedido', key: 'fechaPedido', width: 110, render: (row: any) => h(NText, { depth: 2 }, { default: () => formatDate(row.fechaPedido) }) },
  { title: 'Entrega', key: 'fechaEntrega', width: 110, render: (row: any) => h(NText, { depth: 2 }, { default: () => (row.fechaEntrega ? formatDate(row.fechaEntrega) : '—') }) },
  { title: 'Estado', key: 'estado', width: 110, render: (row: any) => h(NTag, { size: 'small', type: estadoTagType[row.estado] ?? 'default' }, { default: () => row.estado }) },
  {
    title: 'Duplicado',
    key: 'dup',
    width: 100,
    render: (row: any) => tieneDuplicado(row) ? h(NTag, { size: 'small', type: 'warning' }, { default: () => '⚠ repetido' }) : h(NText, { depth: 3 }, { default: () => '—' })
  },
  { title: 'Total', key: 'total', width: 120, align: 'right' as const, render: (row: any) => h(NText, { strong: true }, { default: () => formatMoney(row.total) }) },
  { title: 'Saldo', key: 'saldo', width: 120, align: 'right' as const, render: (row: any) => h(NText, { depth: 2 }, { default: () => (row.saldo > 0 ? formatMoney(row.saldo) : '—') }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 330,
    render: (row: any) =>
      h(NSpace, { size: 4 }, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => { detalle.value = row; showDetalle.value = true } }, { default: () => 'Ver' }),
          h(NButton, { size: 'tiny', onClick: () => router.push(`/pedidos/${row.id}/editar`) }, { default: () => 'Editar' }),
          row.estado === 'Borrador' && h(NButton, { size: 'tiny', type: 'primary', secondary: true, onClick: () => activarBorrador(row) }, { default: () => 'Convertir en pedido' }),
          row.estado === 'Pendiente' && h(NButton, { size: 'tiny', type: 'info', secondary: true, onClick: () => cambiarEstado(row, 'Confirmado') }, { default: () => 'Confirmar' }),
          row.estado === 'Confirmado' && h(NButton, { size: 'tiny', type: 'warning', secondary: true, onClick: () => cambiarEstado(row, 'En tránsito') }, { default: () => 'En tránsito' }),
          (row.estado === 'Confirmado' || row.estado === 'En tránsito') && h(NButton, { size: 'tiny', type: 'success', secondary: true, onClick: () => cambiarEstado(row, 'Recibido') }, { default: () => 'Recibir' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => `¿Eliminar ${row.numero} y sus egresos?`
          })
        ].filter(Boolean)
      })
  }
])
</script>