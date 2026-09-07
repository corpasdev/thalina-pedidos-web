<template>
  <div>
    <PageHeader title="Líneas de producto">
      <n-button type="primary" @click="abrirNueva">+ Nueva línea</n-button>
    </PageHeader>

    <div class="mb-4 text-sm text-gray-400">
      Las líneas subcategorizan los pedidos por vendedor (alimentos, aseo, bebidas…) dentro de la misma empresa.
    </div>

    <n-data-table :columns="columnas" :data="lineas.items" :pagination="{ pageSize: 10 }" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar línea' : 'Nueva línea'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-4 pt-2">
        <n-input v-model:value="nombre" placeholder="Nombre de la línea (Ej. Alimentos)" />
        <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Empresa / marca" />
        <n-select v-model:value="categoria" :options="categoryOptions" placeholder="Categoría" />
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
import { uid } from '@/domain/utils'
import { CATEGORIAS } from '@/domain/constants'
import { nombreDeEmpresa } from '@/services/pedidos'
import type { Linea } from '@/domain/models'

const message = useMessage()
const { lineas, empresas } = useCatalog()

const categoryOptions = CATEGORIAS.map((c) => ({ label: c, value: c }))
const empresaOptions = computed(() => empresas.items.map((e) => ({ label: e.nombre, value: e.id })))

const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const empresaId = ref<string | null>(null)
const categoria = ref<string | null>(null)
const descripcion = ref('')

function abrirNueva() {
  editId.value = null
  nombre.value = ''
  empresaId.value = null
  categoria.value = null
  descripcion.value = ''
  modal.value = true
}

function abrirEditar(l: Linea) {
  editId.value = l.id
  nombre.value = l.nombre
  empresaId.value = l.empresaId
  categoria.value = l.categoria
  descripcion.value = l.descripcion ?? ''
  modal.value = true
}

function guardar() {
  if (!nombre.value.trim() || !empresaId.value || !categoria.value) {
    return message.error('Nombre, empresa y categoría son obligatorios')
  }
  const data: Linea = {
    id: editId.value ?? uid('lin'),
    nombre: nombre.value.trim(),
    empresaId: empresaId.value,
    categoria: categoria.value as Linea['categoria'],
    descripcion: descripcion.value.trim() || undefined
  }
  if (editId.value) lineas.update(editId.value, data)
  else lineas.add(data)
  message.success(editId.value ? 'Línea actualizada' : 'Línea creada')
  modal.value = false
}

function eliminar(l: Linea) {
  lineas.remove(l.id)
  message.success('Línea eliminada')
}

const columnas = computed(() => [
  { title: 'Nombre', key: 'nombre', minWidth: 160, render: (row: Linea) => h(NText, { strong: true }, { default: () => row.nombre }) },
  { title: 'Empresa', key: 'empresa', minWidth: 160, render: (row: Linea) => h(NText, { depth: 2 }, { default: () => nombreDeEmpresa(empresas.items, row.empresaId) }) },
  { title: 'Categoría', key: 'categoria', width: 140, render: (row: Linea) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.categoria }) },
  { title: 'Descripción', key: 'descripcion', minWidth: 200, render: (row: Linea) => h(NText, { depth: 3 }, { default: () => row.descripcion ?? '—' }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Linea) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditar(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar esta línea?'
          })
        ]
      })
  }
])
</script>