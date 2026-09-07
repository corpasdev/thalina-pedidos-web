<template>
  <div class="min-h-full flex items-center justify-center p-4 md:p-8">
    <div class="w-full max-w-[1020px] rounded-2xl overflow-hidden border border-slate-800 bg-[#1f2937] shadow-2xl">
      <!-- Header -->
      <header class="flex items-center justify-between gap-3 px-6 md:px-9 py-4 bg-slate-900/40">
        <div class="flex items-center gap-3 w-full md:w-auto">
          <n-input
            v-model:value="busqueda"
            size="large"
            round
            clearable
            placeholder="Buscar pedidos, empresas…"
            class="w-full md:w-72"
          >
            <template #prefix><n-icon :component="SearchOutline" /></template>
          </n-input>
          <router-link class="hidden sm:block shrink-0" to="/pedidos/nuevo">
            <n-button type="warning" round size="large" class="font-semibold !px-5">
              Registrar pedido
            </n-button>
          </router-link>
        </div>
      </header>

      <!-- Body: 3 zonas principales -->
      <div class="grid grid-cols-1 md:grid-cols-[55%_45%] divide-y md:divide-y-0 md:divide-x divide-slate-800/70">
        <!-- Columna izquierda: control + calendario -->
        <section class="flex flex-col p-6 md:p-8">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-[#00A86B]/15 text-[#2ED5A0] grid place-items-center shrink-0">
              <n-icon :component="StorefrontOutline" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-[#F5F5DC] leading-tight">Control de pedidos</h2>
              <p class="text-xs text-gray-400 mt-1">Calendario de entregas · {{ monthLabel }}</p>
            </div>
          </div>

          <div class="mt-6 h-[80%] min-h-0 flex flex-col">
            <div class="flex items-center justify-between mb-3 shrink-0">
              <div class="flex items-center gap-2 text-sm font-semibold text-[#F5F5DC]">
                <n-icon :component="CalendarOutline" />
                <span>{{ monthLabel }}</span>
              </div>
              <div class="flex items-center gap-0.5">
                <n-button quaternary circle size="tiny" @click="prevMonth">
                  <template #icon><n-icon :component="ChevronBackOutline" /></template>
                </n-button>
                <n-button quaternary circle size="tiny" @click="nextMonth">
                  <template #icon><n-icon :component="ChevronForwardOutline" /></template>
                </n-button>
              </div>
            </div>

            <div class="text-center text-[11px] font-medium text-gray-500 grid grid-cols-7 mb-2 shrink-0">
              <span v-for="d in weekdays" :key="d">{{ d }}</span>
            </div>

            <div class="relative flex-1 min-h-0">
              <div
                class="absolute inset-y-0 rounded-md bg-[#00A86B]/10"
                :style="highlightColumnStyle"
              />
              <div class="grid grid-cols-7 auto-rows-fr gap-y-0.5 gap-x-0.5 h-full relative">
                <n-button
                  v-for="(d, i) in grid"
                  :key="i"
                  :quaternary="d !== selectedDay"
                  :type="d === selectedDay ? 'primary' : 'default'"
                  circle
                  :disabled="d === null"
                  size="small"
                  class="h-full w-full !p-0"
                  @click="d !== null && (selectedDay = d)"
                >
                  <template #default>
                    <span class="flex flex-col items-center justify-center leading-none">
                      <span>{{ d ?? '' }}</span>
                      <span v-if="d && hasDelivery(d)" class="mt-0.5 h-1 w-1 rounded-full bg-[#FFD700]" />
                    </span>
                  </template>
                </n-button>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-3 text-[11px] text-gray-500 shrink-0">
              <span class="inline-flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-[#FFD700]" /> entrega</span>
              <span class="inline-flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-[#00A86B]" /> día activo</span>
            </div>
          </div>
        </section>

        <!-- Columna derecha: panel de detalle -->
        <section
          class="relative overflow-hidden flex flex-col gap-5 p-6 md:p-8 text-[#F5F5DC]"
          style="background: linear-gradient(165deg, #0e4632 0%, #072b1e 100%);"
        >
          <!-- EGRESOS HOY: contenido de alto impacto -->
          <div class="relative rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/[0.07] p-4 overflow-hidden">
            <div class="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full border-[12px] border-[#FFD700]/10" />
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">Egresos hoy</span>
            </div>
            <div class="mt-2.5 text-4xl md:text-[42px] font-black leading-none text-[#FFD700] tabular-nums truncate" :title="formatMoney(egresosHoyTotal)">
              {{ formatMoney(egresosHoyTotal) }}
            </div>
            <div class="mt-2 text-base font-bold capitalize text-[#F5F5DC]">{{ fechaHoy }}</div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-[10px] uppercase tracking-wider text-white/50">Saldo por cobrar · día en calendario</span>
              <span class="text-xs font-bold tabular-nums text-[#F5F5DC]">{{ formatMoney(saldoDiaSel) }}</span>
            </div>
            <div class="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full bg-[#FFD700] transition-all duration-500" :style="{ width: `${saldoPct}%` }" />
            </div>
            <router-link to="/egresos" class="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2ED5A0] hover:text-[#FFD700]">
              Ver egresos <n-icon :component="ChevronForwardOutline" :size="12" />
            </router-link>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="text-[11px] font-semibold uppercase tracking-wider text-white/60">Pedidos pagados hoy</div>
              <router-link to="/pedidos" class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2ED5A0] hover:text-[#FFD700]">
                Ver pedidos <n-icon :component="ChevronForwardOutline" :size="12" />
              </router-link>
            </div>
            <div v-if="pagosHoy.length === 0" class="text-xs text-white/50">Sin pagos registrados hoy</div>
            <div v-for="p in pagosHoy" :key="p.id" class="rounded-xl bg-white/[0.06] border border-white/10 p-3 flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-[#FFD700]/15 text-[#FFD700] grid place-items-center shrink-0">
                    <n-icon :component="WalletOutline" />
                  </div>
                  <div class="min-w-0 leading-tight">
                    <div class="text-sm font-bold text-[#F5F5DC] truncate">{{ p.empresa }}</div>
                    <div class="text-[11px] text-white/50 truncate">Vendedor: {{ p.vendedor }}</div>
                  </div>
                </div>
                <n-tag :bordered="false" size="small" :type="p.saldo > 0 ? 'warning' : 'success'">
                  {{ p.formaPago }}
                </n-tag>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-white/50">Total del pedido</span>
                <span class="text-sm font-bold text-[#FFD700] tabular-nums">{{ formatMoney(p.total) }}</span>
              </div>
              <div v-if="p.saldo > 0" class="rounded-md bg-[#FFD700]/10 px-2.5 py-1.5 flex items-center justify-between text-[11px] text-[#FFD700]">
                <span class="font-semibold">Abono parcial</span>
                <span class="font-bold tabular-nums">Saldo {{ formatMoney(p.saldo) }}</span>
              </div>
            </div>
          </div>

          <div class="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full border-[14px] border-[#FFD700]/10" />
          <div class="pointer-events-none absolute -bottom-8 right-24 w-24 h-24 rounded-full border-8 border-[#00A86B]/20" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CalendarOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  StorefrontOutline,
  SearchOutline,
  WalletOutline
} from '@vicons/ionicons5'
import { useCatalog } from '@/composables/useCatalog'
import { formatMoney, numeroDestacado } from '@/domain/utils'
import { nombreDeEmpresa } from '@/services/pedidos'

const { empresas, pedidos, vendedores, egresos } = useCatalog()

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const busqueda = ref('')

const now = new Date()
const view = ref({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() })
const selectedDay = ref(now.getDate())

const monthLabel = computed(() => `${monthNames[view.value.m]} ${view.value.y}`)

const grid = computed<(number | null)[]>(() => {
  const { y, m } = view.value
  const first = new Date(y, m, 1).getDay()
  const dim = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = Array(42).fill(null)
  for (let i = 1; i <= dim; i++) cells[first + i - 1] = i
  return cells
})

function prevMonth() { moveMonth(-1) }
function nextMonth() { moveMonth(1) }
function moveMonth(delta: number) {
  view.value = { ...view.value, ...incrementMonth(view.value.y, view.value.m, delta) }
  selectedDay.value = 1
}
function incrementMonth(y: number, m: number, delta: number) {
  const d = new Date(y, m + delta, 1)
  return { y: d.getFullYear(), m: d.getMonth() }
}

const entregaEnMes = (f: string | undefined) => {
  if (!f) return false
  const d = new Date(f)
  return d.getFullYear() === view.value.y && d.getMonth() === view.value.m
}
const hasDelivery = (day: number) => pedidos.items.some((p) => {
  if (!p.fechaEntrega) return false
  const d = new Date(p.fechaEntrega)
  return d.getFullYear() === view.value.y && d.getMonth() === view.value.m && d.getDate() === day
})

const highlightColumn = computed(() => {
  const idx = grid.value.findIndex((v) => v === selectedDay.value)
  return idx >= 0 ? idx % 7 : 0
})
const highlightColumnStyle = computed(() => ({
  left: `calc(${highlightColumn.value} * (100% / 7))`,
  width: 'calc(100% / 7)'
}))

const entregaEnDia = (day: number) =>
  pedidos.items.filter((p) => p.fechaEntrega && new Date(p.fechaEntrega).getFullYear() === view.value.y && new Date(p.fechaEntrega).getMonth() === view.value.m && new Date(p.fechaEntrega).getDate() === day)

const entregasDia = computed(() => entregaEnDia(selectedDay.value).filter((p) => p.estado !== 'Cancelado'))

const totalDia = computed(() =>
  entregasDia.value.reduce((a, p) => a + p.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0), 0)
)

const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
const hoyKey = new Date().toDateString()

const egresosHoy = computed(() =>
  egresos.items.filter((e) => {
    const d = new Date(e.fecha)
    return !Number.isNaN(d.getTime()) && d.toDateString() === hoyKey
  })
)
const egresosHoyTotal = computed(() => egresosHoy.value.reduce((a, e) => a + e.monto, 0))

const pagosHoy = computed(() =>
  [...egresosHoy.value]
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .map((eg) => {
      const p = pedidos.items.find((x) => x.id === eg.pedidoId)
      const v = p ? vendedores.items.find((x) => x.id === p.vendedorId) : undefined
      const total = p ? p.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) : 0
      return {
        id: eg.id,
        numero: p ? numeroDestacado(p.numero) : '—',
        empresa: p ? nombreDeEmpresa(empresas.items, p.empresaId) : '—',
        vendedor: v ? v.nombre : '—',
        monto: eg.monto,
        total,
        saldo: Math.max(0, total - eg.monto),
        formaPago: eg.formaPago
      }
    })
)

const egresosDiaSel = computed(() =>
  egresos.items
    .filter((e) => entregasDia.value.some((p) => p.id === e.pedidoId))
    .reduce((a, e) => a + e.monto, 0)
)
const saldoDiaSel = computed(() => Math.max(0, totalDia.value - egresosDiaSel.value))
const saldoPct = computed(() =>
  totalDia.value > 0 ? Math.min(100, Math.max(0, Math.round((saldoDiaSel.value / totalDia.value) * 100))) : 0
)
</script>