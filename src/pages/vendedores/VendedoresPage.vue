<template>
  <div>
    <PageHeader>
      <n-button type="primary" @click="abrirNueva">+ Nuevo vendedor</n-button>
    </PageHeader>

    <n-data-table :columns="columnas" :data="vendedores.items" :pagination="{ pageSize: 10 }" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar vendedor' : 'Nuevo vendedor'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-4 pt-2">
        <n-input v-model:value="nombre" placeholder="Nombre del vendedor" />
        <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Empresa / marca" @update:value="onEmpresaChange" />
        <n-select v-model:value="lineaId" :options="lineaOptions" placeholder="Línea de productos (opcional)" clearable />
        <n-input v-model:value="telefono" placeholder="Teléfono (opcional)" />
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
import { nombreDeEmpresa, nombreDeLinea } from '@/services/pedidos'
import type { Vendedor } from '@/domain/models'

const message = useMessage()
const { vendedores, empresas, lineas } = useCatalog()

const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const empresaId = ref<string | null>(null)
const lineaId = ref<string | null>(null)
const telefono = ref('')

const empresaOptions = computed(() => empresas.items.map((e) => ({ label: e.nombre, value: e.id })))
const lineaOptions = computed(() =>
  lineas.items.filter((l) => l.empresaId === empresaId.value).map((l) => ({ label: l.nombre, value: l.id }))
)

function onEmpresaChange() {
  lineaId.value = null
}

function abrirNueva() {
  editId.value = null
  nombre.value = ''
  empresaId.value = null
  lineaId.value = null
  telefono.value = ''
  modal.value = true
}

function abrirEditar(v: Vendedor) {
  editId.value = v.id
  nombre.value = v.nombre
  empresaId.value = v.empresaId
  lineaId.value = v.lineaId ?? null
  telefono.value = v.telefono ?? ''
  modal.value = true
}

function guardar() {
  if (!nombre.value.trim() || !empresaId.value) {
    return message.error('Nombre y empresa son obligatorios')
  }
  const data: Vendedor = {
    id: editId.value ?? uid('ven'),
    nombre: nombre.value.trim(),
    empresaId: empresaId.value,
    lineaId: lineaId.value ?? undefined,
    telefono: telefono.value.trim() || undefined
  }
  if (editId.value) vendedores.update(editId.value, data)
  else vendedores.add(data)
  message.success(editId.value ? 'Vendedor actualizado' : 'Vendedor registrado')
  modal.value = false
}

function eliminar(v: Vendedor) {
  vendedores.remove(v.id)
  message.success('Vendedor eliminado')
}

const columnas = computed(() => [
  { title: 'Vendedor', key: 'nombre', minWidth: 150, render: (row: Vendedor) => h(NText, { strong: true }, { default: () => row.nombre }) },
  { title: 'Empresa', key: 'empresa', minWidth: 160, render: (row: Vendedor) => h(NText, { depth: 2 }, { default: () => nombreDeEmpresa(empresas.items, row.empresaId) }) },
  {
    title: 'Línea que cubre',
    key: 'linea',
    minWidth: 150,
    render: (row: Vendedor) =>
      row.lineaId
        ? h(NTag, { size: 'small', type: 'success' }, { default: () => nombreDeLinea(lineas.items, row.lineaId) })
        : h(NText, { depth: 3 }, { default: () => 'Todas' })
  },
  { title: 'Teléfono', key: 'telefono', width: 140, render: (row: Vendedor) => h(NText, { depth: 2 }, { default: () => row.telefono ?? '—' }) },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Vendedor) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditar(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar este vendedor?'
          })
        ]
      })
  }
])
</script>