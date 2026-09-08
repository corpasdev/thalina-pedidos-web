<template>
  <div class="flex flex-col gap-5">
    <PageHeader :title="editando ? 'Editar borrador' : 'Nuevo borrador'" back @back="$router.push('/borradores')">
      <n-button secondary type="primary" @click="guardarBorrador">Guardar borrador</n-button>
      <n-button type="warning" @click="convertir">Convertir en pedido</n-button>
    </PageHeader>

    <n-alert type="info" title="Preparación previa">
      Organice aquí las líneas antes de que llegue el vendedor. Cuando visite la tienda solo
      asigne el vendedor y confirme el pedido en un clic.
    </n-alert>

    <n-card title="Encabezado del borrador">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <span class="text-xs text-gray-400 block mb-1">Empresa / marca (obligatorio)</span>
          <n-select v-model:value="empresaId" :options="empresaOptions" placeholder="Seleccione empresa" @update:value="cambiarEmpresa" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Vendedor (opcional hasta que llegue)</span>
          <n-select v-model:value="vendedorId" clearable :options="vendedorOptions" :placeholder="empresaId ? 'Seleccione vendedor' : 'Primero elija empresa'" :disabled="!empresaId" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Fecha de entrega estimada</span>
          <n-date-picker v-model:value="fechaEntrega" type="date" placeholder="Fecha entrega (opcional)" clearable />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Notas</span>
          <n-input v-model:value="notas" placeholder="Precios negociados, promociones…" />
        </div>
      </div>
    </n-card>

    <n-card title="Líneas del borrador">
      <div class="flex flex-col gap-3">
        <n-empty v-if="lineasDraft.length === 0" description="Sin productos aún. Vaya agregando lo que piensa pedir." size="small" />
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
        <n-statistic label="Total estimado" :value="formatMoney(total)" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { motion } from 'motion-v'
import { useRouter } from 'vue-router'
import { Add as AddIcon, Close as CloseIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCatalog } from '@/composables/useCatalog'
import { uid, formatMoney, fechaISO } from '@/domain/utils'
import { calcularTotalPedido, siguienteNumeroPedido, nombreDeLinea, nombreDeVendedor } from '@/services/pedidos'
import type { BorradorPedido, LineaPedido } from '@/domain/models'

const props = defineProps<{ id?: string }>()

const message = useMessage()
const router = useRouter()
const { borradores, pedidos, egresos, productos, empresas, vendedores, lineas } = useCatalog()

const editando = computed<BorradorPedido | null>(() => (props.id ? borradores.items.find((b) => b.id === props.id) ?? null : null))

const empresaId = ref<string | null>(null)
const vendedorId = ref<string | null>(null)
const fechaEntrega = ref<number | null>(null)
const notas = ref('')
const lineasDraft = ref<LineaPedido[]>([])

watch(editando, (borrador) => {
  if (borrador) {
    empresaId.value = borrador.empresaId
    vendedorId.value = borrador.vendedorId ?? null
    fechaEntrega.value = borrador.fechaEntrega ? new Date(borrador.fechaEntrega).getTime() : null
    notas.value = borrador.notas ?? ''
    lineasDraft.value = borrador.lineas.map((l) => ({ ...l }))
  }
}, { immediate: true })

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

const lineasValidas = computed(() => lineasDraft.value.filter((l) => l.productoId))

function datosBorrador(): Omit<BorradorPedido, 'id'> {
  return {
    empresaId: empresaId.value!,
    vendedorId: vendedorId.value ?? undefined,
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    notas: notas.value.trim() || undefined,
    lineas: lineasDraft.value,
    actualizadoEn: fechaISO()
  }
}

function guardarBorrador() {
  if (!empresaId.value) return message.error('Seleccione la empresa')
  if (editando.value) {
    borradores.update(editando.value.id, datosBorrador())
    message.success('Borrador actualizado')
  } else {
    borradores.add({ id: uid('bor'), ...datosBorrador() })
    message.success('Borrador guardado')
  }
  router.push('/borradores')
}

function convertir() {
  if (!empresaId.value) return message.error('Seleccione la empresa')
  if (!vendedorId.value) return message.error('Asigne el vendedor que vendrá a tomar el pedido')
  if (lineasValidas.value.length === 0) return message.error('Agregue al menos un producto')

  const numerosFinal = siguienteNumeroPedido(pedidos.items)
  const data = {
    id: uid('ped'),
    numero: numerosFinal,
    empresaId: empresaId.value!,
    vendedorId: vendedorId.value!,
    fechaPedido: fechaISO(),
    fechaEntrega: fechaEntrega.value ? new Date(fechaEntrega.value).toISOString() : undefined,
    estado: 'Pendiente' as const,
    notas: notas.value.trim() || undefined,
    lineas: lineasDraft.value,
    creadoEn: fechaISO()
  }
  pedidos.add(data)
  egresos.add({
    id: uid('egr'),
    pedidoId: data.id,
    fecha: fechaISO(),
    monto: total.value,
    formaPago: 'Contado',
    descripcion: `Pedido ${numerosFinal} convertido de borrador`
  })
  if (editando.value) borradores.remove(editando.value.id)
  message.success(`Pedido ${numerosFinal} creado desde borrador`)
  router.push('/pedidos')
}
</script>