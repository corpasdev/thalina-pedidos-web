<template>
  <div class="flex flex-col gap-8">
    <!-- Proveedores: empresas compositoras de marcas -->
    <div>
      <PageHeader>
        <n-button type="primary" @click="abrirNueva">+ Nuevo proveedor</n-button>
      </PageHeader>

      <n-data-table :columns="colEmpresas" :data="empresas.items" :pagination="{ pageSize: 10 }" />

      <n-modal
        v-model:show="modalEmp"
        preset="dialog"
        :title="editEmpId ? 'Editar proveedor' : 'Nuevo proveedor'"
        positive-text="Guardar"
        negative-text="Cancelar"
        @positive-click="guardarEmp"
      >
        <div class="flex flex-col gap-4 pt-2">
          <div>
            <span class="text-xs text-gray-400 block mb-1">Nombre del proveedor / empresa</span>
            <n-input v-model:value="nombreEmp" placeholder="Ej. Colanta, Distribuidora del Valle…" />
          </div>

          <div>
            <span class="text-xs text-gray-400 block mb-1">Tipo</span>
            <n-radio-group v-model:value="tipoEmp">
              <n-space>
                <n-radio value="Franquicia">Distribuidor / franquicia: trae varias marcas</n-radio>
                <n-radio value="Propia">Propia: fabrica su marca</n-radio>
              </n-space>
            </n-radio-group>
          </div>

          <div v-if="tipoEmp === 'Franquicia'">
            <span class="text-xs text-gray-400 block mb-1">Marcas que distribuye (separadas por coma)</span>
            <n-input v-model:value="marcasTexto" placeholder="Ej. Nestlé, Alpina, Bimbo" type="textarea" :rows="2" />
          </div>

          <div>
            <span class="text-xs text-gray-400 block mb-1">Días en que el vendedor pasa a tomar el pedido</span>
            <n-select v-model:value="orderDays" multiple :options="orderDayOptions" />
          </div>

          <div>
            <span class="text-xs text-gray-400 block mb-1">Días en que llega / se distribuye el producto a la tienda</span>
            <n-select v-model:value="deliveryDays" multiple :options="deliveryDayOptions" />
          </div>
        </div>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NText, NTag, NSpace, NButton, NPopconfirm, useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid } from '@/domain/utils'
import { DIAS_SEMANA, DIAS_ENTREGA } from '@/domain/constants'
import type { Empresa } from '@/domain/models'

const message = useMessage()
const { empresas, marcas } = useCatalog()

const orderDayOptions = DIAS_SEMANA.map((d) => ({ label: d, value: d }))
const deliveryDayOptions = DIAS_ENTREGA.map((d) => ({ label: d, value: d }))

// ---- Proveedores / empresas ----
const modalEmp = ref(false)
const editEmpId = ref<string | null>(null)
const nombreEmp = ref('')
const tipoEmp = ref<Empresa['tipo']>('Franquicia')
const marcasTexto = ref('')
const orderDays = ref<Empresa['orderDays']>([])
const deliveryDays = ref<Empresa['deliveryDays']>([])

function abrirNueva() {
  editEmpId.value = null
  nombreEmp.value = ''
  tipoEmp.value = 'Franquicia'
  marcasTexto.value = ''
  orderDays.value = []
  deliveryDays.value = []
  modalEmp.value = true
}

function abrirEditarEmp(e: Empresa) {
  editEmpId.value = e.id
  nombreEmp.value = e.nombre
  tipoEmp.value = e.tipo
  marcasTexto.value = marcas.items.filter((m) => m.empresaId === e.id).map((m) => m.nombre).join(', ')
  orderDays.value = [...e.orderDays]
  deliveryDays.value = [...e.deliveryDays]
  modalEmp.value = true
}

function guardarEmp() {
  if (!nombreEmp.value.trim()) return message.error('El nombre del proveedor es obligatorio')
  if (orderDays.value.length === 0) return message.error('Seleccione al menos un día de pedido')
  if (deliveryDays.value.length === 0) return message.error('Seleccione al menos un día de entrega')

  const marcasNombres = marcasTexto.value.split(',').map((s) => s.trim()).filter(Boolean)

  if (tipoEmp.value === 'Franquicia' && marcasNombres.length === 0) {
    return message.warning('Añada al menos una marca que el distribuidor provee')
  }

  const data: Empresa = editEmpId.value
    ? {
        ...empresas.items.find((e) => e.id === editEmpId.value)!,
        nombre: nombreEmp.value.trim(),
        tipo: tipoEmp.value,
        marcas: marcasNombres,
        orderDays: orderDays.value,
        deliveryDays: deliveryDays.value
      }
    : {
        id: uid('emp'),
        nombre: nombreEmp.value.trim(),
        tipo: tipoEmp.value,
        marcas: marcasNombres,
        orderDays: orderDays.value,
        deliveryDays: deliveryDays.value
      }

  if (editEmpId.value) empresas.update(editEmpId.value, data)
  else empresas.add(data)

  if (tipoEmp.value === 'Franquicia') {
    const actuales = marcas.items.filter((m) => m.empresaId === data.id)
    actuales.forEach((m) => {
      if (!marcasNombres.includes(m.nombre)) marcas.remove(m.id)
    })
    marcasNombres.forEach((nombreM) => {
      const existente = actuales.find((m) => m.nombre === nombreM)
      const dataMarca = { id: existente?.id ?? uid('mca'), nombre: nombreM, empresaId: data.id }
      if (existente) marcas.update(existente.id, dataMarca)
      else marcas.add(dataMarca)
    })
  } else {
    marcas.items.filter((m) => m.empresaId === data.id).forEach((m) => marcas.remove(m.id))
    marcas.add({ id: uid('mca'), nombre: data.nombre, empresaId: data.id })
  }

  message.success(editEmpId.value ? 'Proveedor actualizado' : 'Proveedor creado')
  modalEmp.value = false
}

function eliminarEmp(e: Empresa) {
  empresas.remove(e.id)
  marcas.items.filter((m) => m.empresaId === e.id).forEach((m) => marcas.remove(m.id))
  message.success('Proveedor eliminado')
}

const colEmpresas = computed(() => [
  { title: 'Proveedor', key: 'nombre', minWidth: 180, render: (row: Empresa) => h(NText, { strong: true }, { default: () => row.nombre }) },
  {
    title: 'Tipo',
    key: 'tipo',
    width: 130,
    render: (row: Empresa) =>
      h(NTag, { type: row.tipo === 'Franquicia' ? 'info' : 'success', size: 'small' }, { default: () => (row.tipo === 'Franquicia' ? 'Distribuidor' : 'Propia') })
  },
  {
    title: 'Marcas que provee',
    key: 'marcas',
    minWidth: 220,
    render: (row: Empresa) => {
      if (row.tipo === 'Propia') return h(NTag, { size: 'small', type: 'success' }, { default: () => 'Marca propia' })
      if (!row.marcas.length) return h(NText, { depth: 3 }, { default: () => 'Sin marcas' })
      return row.marcas.map((m) => h(NTag, { key: m, size: 'small', bordered: true, style: { marginRight: '4px' } }, { default: () => m }))
    }
  },
  {
    title: 'Días de pedido',
    key: 'orderDays',
    minWidth: 190,
    render: (row: Empresa) =>
      row.orderDays.map((d) => h(NTag, { key: d, size: 'small', type: 'info', bordered: true, style: { marginRight: '4px' } }, { default: () => d }))
  },
  {
    title: 'Días de entrega',
    key: 'deliveryDays',
    minWidth: 190,
    render: (row: Empresa) =>
      row.deliveryDays.map((d) => h(NTag, { key: d, size: 'small', type: 'success', bordered: true, style: { marginRight: '4px' } }, { default: () => d }))
  },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Empresa) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditarEmp(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminarEmp(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => `¿Eliminar ${row.nombre} y sus marcas?`
          })
        ]
      })
  }
])
</script>