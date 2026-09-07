<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Egresos de pedidos">
      <n-button type="primary" @click="abrirNuevo">+ Contabilizar egreso</n-button>
    </PageHeader>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <n-statistic label="Egresos del mes" :value="formatMoney(kpi.mes)" />
      <n-statistic label="Total histórico" :value="formatMoney(kpi.historico)" />
      <n-statistic label="Registros" :value="kpi.cantidad" />
    </div>

    <n-data-table :columns="columnas" :data="rows" :pagination="{ pageSize: 12 }" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar egreso' : 'Contabilizar egreso'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-5 pt-2">
        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Pedido</span>
          <n-select v-model:value="pedidoId" :options="pedidoOptions" placeholder="Seleccione pedido" filterable />
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Monto y pago</span>
          <n-input-number v-model:value="monto" placeholder="Monto contabilizado" :min="0" style="width: 100%" />
          <n-select v-model:value="formaPago" :options="pagoOptions" />
          <n-date-picker v-model:value="fecha" type="date" placeholder="Fecha del egreso" style="width: 100%" />
        </div>
        <n-input v-model:value="descripcion" placeholder="Descripción (opcional)" type="textarea" :rows="2" />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NText, NTag, NButton, NSpace, NPopconfirm, useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid, formatMoney, formatDate, numeroDestacado } from '@/domain/utils'
import { FORMAS_PAGO } from '@/domain/constants'
import { nombreDeEmpresa } from '@/services/pedidos'
import { resumenEgresos, pagosEnMes } from '@/services/egresos'
import type { Egreso } from '@/domain/models'

const message = useMessage()
const { egresos, pedidos, empresas } = useCatalog()

const pagoOptions = FORMAS_PAGO.map((f) => ({ label: f, value: f }))

const modal = ref(false)
const editId = ref<string | null>(null)
const pedidoId = ref<string | null>(null)
const monto = ref<number | null>(null)
const formaPago = ref('Contado')
const fecha = ref<number | null>(Date.now())
const descripcion = ref('')

const pedidoOptions = computed(() =>
  pedidos.items
    .filter((p) => p.estado !== 'Cancelado')
    .map((p) => ({
      label: `${p.numero} · ${nombreDeEmpresa(empresas.items, p.empresaId)} · ${formatMoney(p.lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0))}`,
      value: p.id
    }))
)

function abrirNuevo() {
  editId.value = null
  pedidoId.value = null
  monto.value = null
  formaPago.value = 'Contado'
  fecha.value = Date.now()
  descripcion.value = ''
  modal.value = true
}

function abrirEditar(e: Egreso) {
  editId.value = e.id
  pedidoId.value = e.pedidoId
  monto.value = e.monto
  formaPago.value = e.formaPago
  fecha.value = new Date(e.fecha).getTime()
  descripcion.value = e.descripcion ?? ''
  modal.value = true
}

function guardar() {
  if (!pedidoId.value || !monto.value || monto.value <= 0 || !fecha.value) {
    return message.error('Pedido, monto y fecha son obligatorios')
  }
  const data: Egreso = {
    id: editId.value ?? uid('egr'),
    pedidoId: pedidoId.value,
    fecha: new Date(fecha.value).toISOString(),
    monto: monto.value,
    formaPago: formaPago.value as Egreso['formaPago'],
    descripcion: descripcion.value.trim() || undefined
  }
  if (editId.value) egresos.update(editId.value, data)
  else egresos.add(data)
  message.success(editId.value ? 'Egreso actualizado' : 'Egreso contabilizado')
  modal.value = false
}

function eliminar(e: Egreso) {
  egresos.remove(e.id)
  message.success('Egreso eliminado')
}

const rows = computed(() => [...egresos.items].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)))

const kpi = computed(() => ({
  mes: pagosEnMes(egresos.items, new Date()),
  historico: resumenEgresos(egresos.items).total,
  cantidad: egresos.items.length
}))

const columnas = computed(() => [
  { title: 'Fecha', key: 'fecha', width: 120, render: (row: Egreso) => h(NText, { depth: 2 }, { default: () => formatDate(row.fecha) }) },
  {
    title: 'Pedido',
    key: 'pedido',
    minWidth: 180,
    render: (row: Egreso) => {
      const p = pedidos.items.find((pp) => pp.id === row.pedidoId)
      if (!p) return h(NText, { depth: 3 }, { default: () => '—' })
      return h('div', { class: 'flex flex-col' }, [
        h(NText, { strong: true }, { default: () => numeroDestacado(p.numero) }),
        h(NText, { depth: 3, class: 'text-xs' }, { default: () => nombreDeEmpresa(empresas.items, p.empresaId) })
      ])
    }
  },
  { title: 'Concepto', key: 'descripcion', minWidth: 200, render: (row: Egreso) => h(NText, { depth: 2 }, { default: () => row.descripcion ?? '—' }) },
  { title: 'Monto', key: 'monto', align: 'right' as const, width: 130, render: (row: Egreso) => h(NText, { strong: true }, { default: () => formatMoney(row.monto) }) },
  { title: 'Forma de pago', key: 'formaPago', width: 130, render: (row: Egreso) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.formaPago }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Egreso) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditar(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar este egreso?'
          })
        ]
      })
  }
])
</script>