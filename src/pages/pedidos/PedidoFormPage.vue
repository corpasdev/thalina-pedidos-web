<template>
  <div class="flex flex-col gap-5">
    <PageHeader :title="editando ? `Editar ${editando.numero}` : 'Nuevo pedido'" back @back="$router.push('/pedidos')">
      <n-button secondary type="primary" @click="guardar('borrador')">Guardar como borrador</n-button>
      <n-button type="primary" @click="guardar('pedido')">Guardar pedido</n-button>
    </PageHeader>

    <n-card title="Encabezado del pedido">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <span class="text-xs text-gray-400 block mb-1">Empresa / marca</span>
          <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Seleccione empresa" @update:value="cambiarEmpresa" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Vendedor (obligatorio para guardar el pedido)</span>
          <n-select v-model:value="vendedorId" :options="vendedorOptions" :placeholder="empresaId ? 'Seleccione vendedor' : 'Primero elija empresa'" :disabled="!empresaId" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Fecha del pedido</span>
          <n-date-picker v-model:value="fechaPedido" type="date" placeholder="Fecha pedido" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Fecha de entrega</span>
          <n-date-picker v-model:value="fechaEntrega" type="date" placeholder="Fecha entrega (opcional)" clearable />
        </div>
        <div v-if="editando">
          <span class="text-xs text-gray-400 block mb-1">Estado</span>
          <n-select v-model:value="estado" :options="estadoOptions" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Notas</span>
          <n-input v-model:value="notas" placeholder="Precios negociados, promociones…" />
        </div>
      </div>
    </n-card>

    <motion.div
      v-if="advertencias.length > 0"
      :initial="{ opacity: 0, y: -6 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.22 }"
    >
    <n-alert type="warning" title="Posibles repeticiones">
      <div class="flex flex-col gap-1">
        <div v-for="w in advertencias" :key="w.nombre" class="text-sm">
          <b>{{ w.nombre }}</b>
          <span v-if="w.yaExiste.length > 0"> — ya se pidió en {{ w.yaExiste.join(', ') }}</span>
          <span v-if="w.vecesEnBorrador > 1"> — {{ w.vecesEnBorrador }} veces en este pedido</span>
        </div>
      </div>
    </n-alert>
  </motion.div>

    <n-card title="Líneas del pedido">
      <div class="flex flex-col gap-3">
        <div v-if="lineasDraft.length === 0" class="text-sm text-gray-400">
          Sin productos. Agregue la primera línea.
        </div>
        <motion.div
          v-for="l in lineasDraft"
          :key="l.id"
          class="flex flex-wrap items-center gap-3"
          :initial="{ opacity: 0, y: -8 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.2 }"
        >
          <n-select
            class="flex-[2] min-w-[180px]"
            placeholder="Producto"
            v-model:value="l.productoId"
            :options="productoOptions"
            filterable
            @update:value="(v) => prefijarPrecio(l, v as string)"
          />
          <div class="flex items-center gap-2 flex-none">
            <n-input-number v-model:value="l.cantidad" :min="1" :precision="0" style="width: 90px" placeholder="Cant." />
            <span class="text-gray-500 text-xs w-14">{{ unidadDe(l) }}</span>
          </div>
          <n-input-number v-model:value="l.precioUnitario" :min="0" style="width: 140px" placeholder="Precio unit." />
          <n-tag size="medium" class="!min-w-[110px] justify-center">
            {{ l.productoId ? formatMoney(l.cantidad * l.precioUnitario) : '—' }}
          </n-tag>
          <n-button quaternary circle size="small" @click="quitarLinea(l.id)">
            <template #icon><n-icon><CloseIcon /></n-icon></template>
          </n-button>
        </motion.div>
      </div>
      <n-divider />
      <div class="flex items-center justify-between">
        <n-button size="small" secondary type="primary" @click="agregarLinea">
          <template #icon><n-icon><AddIcon /></n-icon></template>
          Agregar producto
        </n-button>
        <n-statistic label="Total del pedido" :value="formatMoney(total)" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, h } from 'vue'
import { motion } from 'motion-v'
import { useRouter } from 'vue-router'
import { Add as AddIcon, Close as CloseIcon } from '@vicons/ionicons5'
import { useMessage, useDialog } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid, formatMoney, normalizeSku, fechaISO } from '@/domain/utils'
import { ESTADOS_PEDIDO } from '@/domain/constants'
import { calcularTotalPedido, siguienteNumeroPedido, nombreDeLinea } from '@/services/pedidos'
import type { Pedido, LineaPedido, EstadoPedido } from '@/domain/models'

const props = defineProps<{ id?: string }>()

const message = useMessage()
const dialog = useDialog()
const router = useRouter()
const { pedidos, egresos, productos, empresas, vendedores, lineas } = useCatalog()

const editando = computed<Pedido | null>(() => (props.id ? pedidos.items.find((p) => p.id === props.id) ?? null : null))

const empresaId = ref<string | null>(null)
const vendedorId = ref<string | null>(null)
const fechaPedido = ref<number | null>(Date.now())
const fechaEntrega = ref<number | null>(null)
const estado = ref<EstadoPedido>('Pendiente')
const notas = ref('')
const lineasDraft = ref<LineaPedido[]>([])

watch(editando, (pedido) => {
  if (pedido) {
    empresaId.value = pedido.empresaId
    vendedorId.value = pedido.vendedorId ?? null
    fechaPedido.value = new Date(pedido.fechaPedido).getTime()
    fechaEntrega.value = pedido.fechaEntrega ? new Date(pedido.fechaEntrega).getTime() : null
    estado.value = pedido.estado
    notas.value = pedido.notas ?? ''
    lineasDraft.value = pedido.lineas.map((l) => ({ ...l }))
  }
}, { immediate: true })

const estadoOptions = ESTADOS_PEDIDO.map((e) => ({ label: e, value: e }))
const empresaOptions = computed(() =>
  empresas.items.map((e) => ({ label: `${e.nombre}${e.tipo === 'Franquicia' ? ' (franquicia)' : ''}`, value: e.id }))
)
const vendedorOptions = computed(() =>
  vendedores.items.filter((v) => v.empresaId === empresaId.value).map((v) => ({
    label: v.lineaId ? `${v.nombre} · ${nombreDeLinea(lineas.items, v.lineaId)}` : v.nombre,
    value: v.id
  }))
)
const productoOptions = computed(() =>
  (empresaId.value ? productos.items.filter((p) => p.empresaId === empresaId.value) : productos.items).map((p) => ({
    label: p.nombre,
    value: p.id
  }))
)

function cambiarEmpresa(next: string | null) {
  if (next && vendedorId.value && !vendedores.items.some((v) => v.id === vendedorId.value && v.empresaId === next)) {
    vendedorId.value = null
  }
}

function agregarLinea() {
  lineasDraft.value.push({ id: uid('lin'), productoId: '', cantidad: 1, precioUnitario: 0 })
}

function quitarLinea(lid: string) {
  lineasDraft.value = lineasDraft.value.filter((l) => l.id !== lid)
}

function prefijarPrecio(l: LineaPedido, productoId: string) {
  l.productoId = productoId
  const prod = productos.items.find((p) => p.id === productoId)
  if (prod?.precioCompra) l.precioUnitario = prod.precioCompra
}

const unidadDe = (l: LineaPedido) => productos.items.find((p) => p.id === l.productoId)?.unidad ?? ''

const total = computed(() => calcularTotalPedido(lineasDraft.value))

const advertencias = computed(() => {
  const activos = pedidos.items.filter(
    (p) => p.estado !== 'Recibido' && p.estado !== 'Cancelado' && p.id !== editando.value?.id
  )
  const skuMap = new Map<string, { producto: string; pedidos: string[] }>()
  activos.forEach((p) => {
    p.lineas.forEach((l) => {
      const prod = productos.items.find((pp) => pp.id === l.productoId)
      if (!prod) return
      const sku = normalizeSku(prod.sku)
      if (!skuMap.has(sku)) skuMap.set(sku, { producto: prod.nombre, pedidos: [] })
      skuMap.get(sku)!.pedidos.push(p.numero)
    })
  })
  const repetidosEnBorrador = new Map<string, number>()
  lineasDraft.value.forEach((l) => {
    const prod = productos.items.find((pp) => pp.id === l.productoId)
    if (!prod) return
    const sku = normalizeSku(prod.sku)
    repetidosEnBorrador.set(sku, (repetidosEnBorrador.get(sku) ?? 0) + 1)
  })
  const warnings: { nombre: string; yaExiste: string[]; vecesEnBorrador: number }[] = []
  const vistos = new Set<string>()
  lineasDraft.value.forEach((l) => {
    const prod = productos.items.find((pp) => pp.id === l.productoId)
    if (!prod) return
    const sku = normalizeSku(prod.sku)
    if (vistos.has(sku)) return
    vistos.add(sku)
    const coincide = skuMap.get(sku)
    const veces = repetidosEnBorrador.get(sku) ?? 1
    if (!coincide && veces <= 1) return
    warnings.push({ nombre: prod.nombre, yaExiste: coincide?.pedidos ?? [], vecesEnBorrador: veces })
  })
  return warnings
})

function registrarEgreso(p: Pedido) {
  if (egresos.items.some((e) => e.pedidoId === p.id)) return
  egresos.add({
    id: uid('egr'),
    pedidoId: p.id,
    fecha: fechaISO(),
    monto: total.value,
    formaPago: 'Contado',
    descripcion: `Egreso automático pedido ${p.numero}`
  })
}

function guardar(modo: 'pedido' | 'borrador') {
  if (!empresaId.value) return message.error('Seleccione una empresa')
  if (!fechaPedido.value) return message.error('Indique la fecha del pedido')
  if (modo === 'pedido') {
    if (!vendedorId.value) return message.error('Seleccione el vendedor que toma el pedido')
    if (lineasDraft.value.filter((l) => l.productoId).length === 0) return message.error('Agregue al menos un producto')
  }
  if (lineasDraft.value.some((l) => l.productoId && (!l.cantidad || l.cantidad <= 0))) return message.error('Cantidades deben ser mayores a 0')

  const estadoPedido: EstadoPedido = modo === 'borrador'
    ? 'Borrador'
    : editando.value && estado.value !== 'Borrador'
      ? estado.value
      : 'Pendiente'

  const commit = () => {
    const data: Pedido = editando.value
      ? {
          ...editando.value,
          empresaId: empresaId.value!,
          vendedorId: vendedorId.value ?? undefined,
          fechaPedido: new Date(fechaPedido.value!).toISOString(),
          fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
          estado: estadoPedido,
          notas: notas.value.trim() || undefined,
          lineas: lineasDraft.value
        }
      : {
          id: uid('ped'),
          numero: siguienteNumeroPedido(pedidos.items),
          empresaId: empresaId.value!,
          vendedorId: vendedorId.value ?? undefined,
          fechaPedido: new Date(fechaPedido.value!).toISOString(),
          fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
          estado: estadoPedido,
          notas: notas.value.trim() || undefined,
          lineas: lineasDraft.value,
          creadoEn: new Date().toISOString()
        }

    if (editando.value) {
      pedidos.update(editando.value.id, data)
      message.success(`Pedido ${data.numero} actualizado`)
    } else {
      pedidos.add(data)
      message.success(estadoPedido === 'Borrador' ? `Borrador ${data.numero} guardado` : `Pedido ${data.numero} guardado · egreso contabilizado`)
    }

    if (estadoPedido !== 'Borrador') registrarEgreso(data)
    router.push('/pedidos')
  }

  if (advertencias.value.length > 0) {
    dialog.warning({
      title: 'Productos que ya están en otros pedidos activos',
      content: () =>
        h(
          'ul',
          { class: 'list-disc pl-4' },
          advertencias.value.map((w) =>
            h('li', [h('b', w.nombre), ...(w.yaExiste.length ? [h('span', ` · ya en ${w.yaExiste.join(', ')}`)] : []), ...(w.vecesEnBorrador > 1 ? [h('span', ` · ${w.vecesEnBorrador} veces en este pedido`)] : [])])
          )
        ),
      positiveText: 'Guardar de todos modos',
      negativeText: 'Cancelar',
      onPositiveClick: commit
    })
  } else {
    commit()
  }
}
</script>