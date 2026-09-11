<template>
  <div>
    <PageHeader>
      <n-button type="primary" @click="abrirNueva">+ Nuevo producto</n-button>
    </PageHeader>

    <n-statistic label="Productos" :value="productos.items.length" />

    <n-data-table :columns="columnas" :data="productos.items" :pagination="{ pageSize: 10 }" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar producto' : 'Nuevo producto'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-5 pt-2">
        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Identificación</span>
          <n-input v-model:value="nombre" placeholder="Nombre del producto" />
          <n-input v-model:value="referencia" placeholder="Referencia (normalizada, ej. ACEITE-1LT)" clearable />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Clasificación</span>
          <n-space>
            <n-select v-model:value="categoria" :options="categoriaOptions" placeholder="Categoría" clearable class="flex-1" />
            <n-input v-model:value="almacen" placeholder="Almacén" clearable class="flex-1" />
          </n-space>
          <n-input v-model:value="codigoBarra" placeholder="Código de barras" clearable />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Proveedor</span>
          <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Empresa" />
          <n-space>
            <n-select v-model:value="marcaId" :options="marcasOptions" placeholder="Marca (opcional)" clearable class="flex-1" />
            <n-select v-model:value="lineaId" :options="lineaOptions" placeholder="Línea (opcional)" clearable class="flex-1" />
          </n-space>
          <n-select v-model:value="unidad" :options="unidadOptions" placeholder="Unidad de medida" />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-gray-400">Precios y stock</span>
          <n-space>
            <n-input-number v-model:value="precioCompra" placeholder="Precio compra" class="flex-1" />
            <n-input-number v-model:value="precioVenta" placeholder="Precio venta" class="flex-1" />
          </n-space>
          <n-space>
            <n-input-number v-model:value="stock" placeholder="Stock actual" class="flex-1" />
            <n-input-number v-model:value="stockMinimo" placeholder="Stock mínimo" class="flex-1" />
          </n-space>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NText, NTag, NButton, NSpace, NPopconfirm, useMessage, useDialog } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid, formatMoney, normalizeReferencia } from '@/domain/utils'
import { CATEGORIAS } from '@/domain/constants'
import { nombreDeEmpresa, nombreDeLinea, nombreDeMarca } from '@/services/pedidos'
import type { Producto } from '@/domain/models'

const message = useMessage()
const dialog = useDialog()
const { productos, empresas, marcas, lineas } = useCatalog()

const UNIDADES = ['unidad', 'caja', 'paquete', 'kilo', 'litro', 'bulto', 'docena', 'galon']
const unidadOptions = UNIDADES.map((u) => ({ label: u, value: u }))
const categoriaOptions = CATEGORIAS.map((c) => ({ label: c, value: c }))

const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const referencia = ref('')
const codigoBarra = ref('')
const almacen = ref('')
const categoria = ref<import('@/domain/models').Categoria | null>(null)
const empresaId = ref<string | null>(null)
const marcaId = ref<string | null>(null)
const lineaId = ref<string | null>(null)
const unidad = ref<string | null>('unidad')
const precioCompra = ref<number | null>(null)
const precioVenta = ref<number | null>(null)
const stock = ref<number | null>(null)
const stockMinimo = ref<number | null>(null)

const empresaOptions = computed(() => empresas.items.map((e) => ({ label: e.nombre, value: e.id })))
const marcasOptions = computed(() => marcas.items.filter((m) => m.empresaId === empresaId.value).map((m) => ({ label: m.nombre, value: m.id })))
const lineaOptions = computed(() => lineas.items.filter((l) => l.empresaId === empresaId.value).map((l) => ({ label: l.nombre, value: l.id })))

function abrirNueva() {
  editId.value = null
  nombre.value = ''
  referencia.value = ''
  codigoBarra.value = ''
  almacen.value = ''
  categoria.value = null
  empresaId.value = null
  marcaId.value = null
  lineaId.value = null
  unidad.value = 'unidad'
  precioCompra.value = null
  precioVenta.value = null
  stock.value = null
  stockMinimo.value = null
  modal.value = true
}

function abrirEditar(p: Producto) {
  editId.value = p.id
  nombre.value = p.nombre
  referencia.value = p.referencia
  codigoBarra.value = p.codigoBarra ?? ''
  almacen.value = p.almacen ?? ''
  categoria.value = p.categoria ?? null
  empresaId.value = p.empresaId
  marcaId.value = p.marcaId ?? null
  lineaId.value = p.lineaId ?? null
  unidad.value = p.unidad ?? 'unidad'
  precioCompra.value = p.precioCompra ?? null
  precioVenta.value = p.precioVenta ?? null
  stock.value = p.stock ?? null
  stockMinimo.value = p.stockMinimo ?? null
  modal.value = true
}

function guardar() {
  if (!nombre.value.trim() || !referencia.value.trim() || !empresaId.value) {
    return message.error('Nombre, referencia y empresa son obligatorios')
  }
  const norm = normalizeReferencia(referencia.value)
  if (!norm) return message.error('Referencia inválida')

  const duplicado = productos.items.find((p) => p.id !== editId.value && normalizeReferencia(p.referencia) === norm)
  const data: Producto = {
    id: editId.value ?? uid('prd'),
    nombre: nombre.value.trim(),
    referencia: norm,
    codigoBarra: codigoBarra.value.trim() || undefined,
    almacen: almacen.value.trim() || undefined,
    empresaId: empresaId.value,
    marcaId: marcaId.value ?? undefined,
    lineaId: lineaId.value ?? undefined,
    categoria: categoria.value ?? undefined,
    unidad: unidad.value ?? 'unidad',
    precioCompra: precioCompra.value ?? undefined,
    precioVenta: precioVenta.value ?? undefined,
    stock: stock.value ?? undefined,
    stockMinimo: stockMinimo.value ?? undefined
  }

  const commit = () => {
    if (editId.value) productos.update(editId.value, data)
    else productos.add(data)
    message.success(editId.value ? 'Producto actualizado' : 'Producto creado')
    modal.value = false
  }

  if (duplicado) {
    dialog.warning({
      title: 'Referencia ya registrada',
      content: `"${duplicado.nombre}" (${nombreDeEmpresa(empresas.items, duplicado.empresaId)}) ya usa la referencia "${norm}". ¿Guardar de todos modos?`,
      positiveText: 'Guardar igual',
      negativeText: 'Cancelar',
      onPositiveClick: commit
    })
  } else {
    commit()
  }
}

function eliminar(p: Producto) {
  productos.remove(p.id)
  message.success('Producto eliminado')
}

const columnas = computed(() => [
  { title: 'Producto', key: 'nombre', minWidth: 160, render: (row: Producto) => h(NText, { strong: true }, { default: () => row.nombre }) },
  { title: 'Referencia', key: 'referencia', width: 140, render: (row: Producto) => h(NText, { depth: 3, code: true }, { default: () => row.referencia }) },
  { title: 'Cód. barra', key: 'codigoBarra', width: 110, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => row.codigoBarra ?? '—' }) },
  { title: 'Almacén', key: 'almacen', width: 100, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => row.almacen ?? '—' }) },
  { title: 'Categoría', key: 'categoria', minWidth: 110, render: (row: Producto) => row.categoria ? h(NTag, { size: 'small' }, { default: () => row.categoria }) : h(NText, { depth: 3 }, { default: () => '—' }) },
  { title: 'Empresa', key: 'empresa', minWidth: 150, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => nombreDeEmpresa(empresas.items, row.empresaId) }) },
  { title: 'Marca', key: 'marca', minWidth: 120, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => (row.marcaId ? nombreDeMarca(marcas.items, row.marcaId) : '—') }) },
  { title: 'Línea', key: 'linea', minWidth: 120, render: (row: Producto) => row.lineaId ? h(NTag, { size: 'small' }, { default: () => nombreDeLinea(lineas.items, row.lineaId) }) : h(NText, { depth: 3 }, { default: () => '—' }) },
  { title: 'Unidad', key: 'unidad', width: 90, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => row.unidad ?? '—' }) },
  {
    title: 'Stock',
    key: 'stock',
    width: 90,
    render: (row: Producto) => {
      if (row.stock === undefined) return h(NText, { depth: 3 }, { default: () => '—' })
      const critico = row.stockMinimo !== undefined && row.stock <= row.stockMinimo
      return h(NTag, { size: 'small', type: critico ? 'error' : 'success' }, { default: () => String(row.stock) })
    }
  },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Producto) =>
      h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'tiny', onClick: () => abrirEditar(row) }, { default: () => 'Editar' }),
          h(NPopconfirm, { onPositiveClick: () => eliminar(row) }, {
            trigger: () => h(NButton, { size: 'tiny', type: 'error', secondary: true }, { default: () => 'Eliminar' }),
            default: () => '¿Eliminar este producto?'
          })
        ]
      })
  }
])
</script>