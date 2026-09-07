<template>
  <div>
    <PageHeader title="Marcas comerciales">
      <n-button type="primary" @click="abrirNueva">+ Nueva marca</n-button>
    </PageHeader>

    <div class="mb-4 flex items-center gap-2 text-sm text-gray-400">
      Las marcas se vinculan a una empresa. Las franquicias pueden traer varias marcas; las empresas propias usan su propia marca.
      <n-tooltip>
        <template #trigger>
          <span class="inline-grid place-items-center w-5 h-5 rounded-full bg-slate-800 text-gray-300 text-xs cursor-help">?</span>
        </template>
        Ej: la franquicia "Distribuidora Andina" distribuye las marcas Nestlé, Alpina y Bimbo.
      </n-tooltip>
    </div>

    <n-data-table :columns="columnas" :data="marcas.items" :pagination="{ pageSize: 10 }" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar marca' : 'Nueva marca'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-4 pt-2">
        <n-input v-model:value="nombre" placeholder="Nombre comercial (Ej. Nestlé)" />
        <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Empresa que la distribuye" />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NText, NButton, NSpace, NPopconfirm, useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid } from '@/domain/utils'
import { nombreDeEmpresa } from '@/services/pedidos'
import type { Marca } from '@/domain/models'

const message = useMessage()
const { marcas, empresas } = useCatalog()

const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const empresaId = ref<string | null>(null)

const empresaOptions = computed(() => empresas.items.map((e) => ({ label: e.nombre, value: e.id })))

function abrirNueva() {
  editId.value = null
  nombre.value = ''
  empresaId.value = null
  modal.value = true
}

function abrirEditar(m: Marca) {
  editId.value = m.id
  nombre.value = m.nombre
  empresaId.value = m.empresaId
  modal.value = true
}

function guardar() {
  if (!nombre.value.trim() || !empresaId.value) {
    return message.error('Nombre de marca y empresa son obligatorios')
  }
  const data: Marca = { id: editId.value ?? uid('mca'), nombre: nombre.value.trim(), empresaId: empresaId.value }
  if (editId.value) marcas.update(editId.value, data)
  else marcas.add(data)
  message.success(editId.value ? 'Marca actualizada' : 'Marca creada')
  modal.value = false
}

function eliminar(m: Marca) {
  marcas.remove(m.id)
  message.success('Marca eliminada')
}

const columnas = computed(() => [
  { title: 'Marca comercial', key: 'nombre', minWidth: 160, render: (row: Marca) => h(NText, { strong: true }, { default: () => row.nombre }) },
  { title: 'Empresa / distribuidor', key: 'empresa', minWidth: 180, render: (row: Marca) => h(NText, { depth: 2 }, { default: () => nombreDeEmpresa(empresas.items, row.empresaId) }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 120,
    render: (row: Marca) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditar(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar esta marca?'
          })
        ]
      })
  }
])
</script>