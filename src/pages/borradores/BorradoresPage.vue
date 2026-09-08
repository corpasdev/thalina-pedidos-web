<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Borradores de pedidos">
      <n-button type="primary" @click="$router.push('/borradores/nuevo')">+ Nuevo borrador</n-button>
    </PageHeader>

    <n-alert type="info">
      Prepare las líneas por empresa antes de que llegue el vendedor. Al momento de la visita,
      asigne el vendedor y convierta el borrador en pedido.
    </n-alert>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <n-statistic label="Borradores" :value="rows.length" />
      <n-statistic label="Líneas preparadas" :value="totalLineas" />
      <n-statistic label="Valor estimado" :value="formatMoney(totalEstimado)" />
    </div>

    <n-data-table :columns="columnas" :data="rows" :pagination="{ pageSize: 12 }" />

    <n-modal v-model:show="showConvertir" preset="card" style="width: 460px" :title="convertirBlanco ? `Convertir ${nombreDeEmpresa(empresas.items, convertirBlanco.empresaId)} en pedido` : 'Convertir en pedido'">
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-xs text-gray-400 block mb-1">Vendedor que toma el pedido</span>
          <n-select v-model:value="convertirVendedor" filterable :options="convertirVendedorOptions" placeholder="Seleccione vendedor" :disabled="!convertirBlanco" />
        </div>
        <n-button type="warning" block :disabled="!convertirVendedor" @click="confirmarConversion">
          Crear pedido y eliminar borrador
        </n-button>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NText, NTag, NButton, NSpace, NPopconfirm, useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { formatMoney, formatDateTime, fechaISO, uid } from '@/domain/utils'
import { calcularTotalPedido, siguienteNumeroPedido, nombreDeEmpresa, nombreDeVendedor, nombreDeLinea } from '@/services/pedidos'
import type { BorradorPedido } from '@/domain/models'

const message = useMessage()
const router = useRouter()
const { borradores, pedidos, egresos, empresas, vendedores, lineas } = useCatalog()

const showConvertir = ref(false)
const convertirBlanco = ref<BorradorPedido | null>(null)
const convertirVendedor = ref<string | null>(null)

const convertirVendedorOptions = computed(() =>
  convertirBlanco.value
    ? vendedores.items.filter((v) => v.empresaId === convertirBlanco.value?.empresaId).map((v) => ({
        label: v.lineaId ? `${v.nombre} · ${nombreDeLinea(lineas.items, v.lineaId)}` : v.nombre,
        value: v.id
      }))
    : []
)

const rows = computed(() =>
  borradores.items
    .map((b) => ({
      ...b,
      total: calcularTotalPedido(b.lineas),
      lineasCount: b.lineas.filter((l) => l.productoId).length,
      empresa: nombreDeEmpresa(empresas.items, b.empresaId),
      vendedorNombre: nombreDeVendedor(vendedores.items, b.vendedorId)
    }))
    .sort((a, b) => (a.actualizadoEn < b.actualizadoEn ? 1 : -1))
)

const totalLineas = computed(() => rows.value.reduce((a, r) => a + r.lineasCount, 0))
const totalEstimado = computed(() => rows.value.reduce((a, r) => a + r.total, 0))

function eliminar(b: BorradorPedido) {
  borradores.remove(b.id)
  message.success('Borrador eliminado')
}

function abrirConvertir(b: BorradorPedido) {
  convertirBlanco.value = b
  convertirVendedor.value = null
  showConvertir.value = true
}

function confirmarConversion() {
  const b = convertirBlanco.value
  if (!b || !convertirVendedor.value) return
  const numero = siguienteNumeroPedido(pedidos.items)
  pedidos.add({
    id: uid('ped'),
    numero,
    empresaId: b.empresaId,
    vendedorId: convertirVendedor.value,
    fechaPedido: fechaISO(),
    fechaEntrega: b.fechaEntrega,
    estado: 'Pendiente',
    notas: b.notas,
    lineas: b.lineas,
    creadoEn: fechaISO()
  })
  egresos.add({
    id: uid('egr'),
    pedidoId: b.id,
    fecha: fechaISO(),
    monto: calcularTotalPedido(b.lineas),
    formaPago: 'Contado',
    descripcion: `Pedido ${numero} convertido de borrador`
  })
  borradores.remove(b.id)
  showConvertir.value = false
  message.success(`Pedido ${numero} creado desde borrador`)
}

const columnas = computed(() => [
  {
    title: 'Empresa / Vendedor',
    key: 'empresa',
    minWidth: 200,
    render: (row: any) =>
      h('div', { class: 'flex flex-col' }, [
        h(NText, { strong: true }, { default: () => row.empresa }),
        h(NText, { depth: 3, class: 'text-xs' }, { default: () => (row.vendedorId ? row.vendedorNombre : 'Vendedor sin asignar') })
      ])
  },
  {
    title: 'Líneas',
    key: 'lineasCount',
    width: 90,
    render: (row: any) => h(NTag, { size: 'small', type: row.lineasCount ? 'info' : 'default' }, { default: () => row.lineasCount })
  },
  { title: 'Total estimado', key: 'total', width: 130, align: 'right' as const, render: (row: any) => h(NText, { strong: true }, { default: () => formatMoney(row.total) }) },
  { title: 'Actualizado', key: 'actualizadoEn', width: 180, render: (row: any) => h(NText, { depth: 2 }, { default: () => formatDateTime(row.actualizadoEn) }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 280,
    render: (row: any) =>
      h(NSpace, { size: 4 }, {
        default: () => [
          h(NButton, { size: 'tiny', type: 'warning', secondary: true, onClick: () => abrirConvertir(row) }, { default: () => 'Convertir en pedido' }),
          h(NButton, { size: 'tiny', onClick: () => router.push(`/borradores/${row.id}/editar`) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar este borrador?'
          })
        ]
      })
  }
])
</script>