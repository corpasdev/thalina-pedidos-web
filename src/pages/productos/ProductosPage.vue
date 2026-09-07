<template>
  <div>
    <PageHeader title="Productos">
      <n-button type="primary" @click="abrirNueva">+ Nuevo producto</n-button>
    </PageHeader>

    <div class="mb-4 flex items-center gap-6 text-sm text-gray-400">
      <n-tooltip>
        <template #trigger>
          <span class="cursor-help underline decoration-dotted">ℹ️ Control por SKU</span>
        </template>
        El SKU normalizado permite detectar el mismo producto pedido a varias marcas/empresas.
      </n-tooltip>
      <n-statistic label="Productos" :value="productos.items.length" />
    </div>

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
          <n-input v-model:value="sku" placeholder="SKU (código normalizado, ej. ACEITE-1LT)" clearable />
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
import { uid, formatMoney, normalizeSku } from '@/domain/utils'
import { nombreDeEmpresa, nombreDeLinea, nombreDeMarca } from '@/services/pedidos'
import type { Producto } from '@/domain/models'

const message = useMessage()
const dialog = useDialog()
const { productos, empresas, marcas, lineas } = useCatalog()

const UNIDADES = ['unidad', 'caja', 'paquete', 'kilo', 'litro', 'bulto', 'docena', 'galon']
const unidadOptions = UNIDADES.map((u) => ({ label: u, value: u }))

const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const sku = ref('')
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
  sku.value = ''
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
  sku.value = p.sku
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
  if (!nombre.value.trim() || !sku.value.trim() || !empresaId.value) {
    return message.error('Nombre, SKU y empresa son obligatorios')
  }
  const norm = normalizeSku(sku.value)
  if (!norm) return message.error('SKU inválido')

  const duplicado = productos.items.find((p) => p.id !== editId.value && normalizeSku(p.sku) === norm)
  const data: Producto = {
    id: editId.value ?? uid('prd'),
    nombre: nombre.value.trim(),
    sku: norm,
    empresaId: empresaId.value,
    marcaId: marcaId.value ?? undefined,
    lineaId: lineaId.value ?? undefined,
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
      title: 'SKU ya registrado',
      content: `"${duplicado.nombre}" (${nombreDeEmpresa(empresas.items, duplicado.empresaId)}) ya usa el SKU "${norm}". ¿Guardar de todos modos?`,
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
  { title: 'Producto', key: 'nombre', minWidth: 180, render: (row: Producto) => h(NText, { strong: true }, { default: () => row.nombre }) },
  { title: 'SKU', key: 'sku', width: 130, render: (row: Producto) => h(NText, { depth: 3, code: true }, { default: () => row.sku }) },
  { title: 'Empresa', key: 'empresa', minWidth: 150, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => nombreDeEmpresa(empresas.items, row.empresaId) }) },
  { title: 'Marca', key: 'marca', minWidth: 120, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => (row.marcaId ? nombreDeMarca(marcas.items, row.marcaId) : '—') }) },
  { title: 'Línea', key: 'linea', minWidth: 120, render: (row: Producto) => row.lineaId ? h(NTag, { size: 'small' }, { default: () => nombreDeLinea(lineas.items, row.lineaId) }) : h(NText, { depth: 3 }, { default: () => '—' }) },
  { title: 'Unidad', key: 'unidad', width: 90, render: (row: Producto) => h(NText, { depth: 2 }, { default: () => row.unidad ?? '—' }) },
  { title: 'Compra', key: 'precioCompra', align: 'right' as const, render: (row: Producto) => row.precioCompra ? formatMoney(row.precioCompra) : '—' },
  { title: 'Venta', key: 'precioVenta', align: 'right' as const, render: (row: Producto) => row.precioVenta ? formatMoney(row.precioVenta) : '—' },
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