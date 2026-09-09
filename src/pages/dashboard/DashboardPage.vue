<template>
  <div class="flex justify-center p-4 md:p-8">
    <div class="w-full max-w-[1020px] flex flex-col gap-4 md:min-h-[calc(100dvh-168px)]">
      <!-- Header card -->
      <motion.div
        class="rounded-2xl overflow-hidden border shadow-lg transition-colors"
        :class="esOscuro ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-200 bg-white'"
        :initial="{ opacity: 0, y: -10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
      >
        <header
          class="flex items-center justify-end px-6 md:px-9 py-4 transition-colors"
          :class="esOscuro ? 'bg-slate-900/40' : 'bg-slate-50'"
        >
          <div class="hidden sm:flex items-center gap-2 shrink-0">
            <motion.div :whileHover="{ scale: 1.03 }">
              <router-link to="/pedidos/nuevo">
                <n-button type="warning" round size="large" class="font-semibold !px-5">
                  Registrar pedido
                </n-button>
              </router-link>
            </motion.div>
            <motion.div :whileHover="{ scale: 1.03 }">
              <router-link to="/egresos">
                <n-button type="error" round size="large" class="font-semibold !px-5">
                  Registrar egreso
                </n-button>
              </router-link>
            </motion.div>
          </div>
        </header>
      </motion.div>

      <!-- Body: calendar + detail cards -->
      <div class="grid grid-cols-1 md:grid-cols-[55%_45%] gap-4 md:flex-1 md:min-h-0">
        <!-- Card: Calendario -->
        <motion.section
          class="rounded-2xl overflow-hidden border shadow-lg flex flex-col p-6 md:p-8 min-h-0 transition-colors"
          :class="esOscuro ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-200 bg-white'"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, ease: 'easeOut' }"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors"
              :class="esOscuro ? 'bg-[#00A86B]/15 text-[#2ED5A0]' : 'bg-[#00A86B]/10 text-[#008A59]'"
            >
              <n-icon :component="StorefrontOutline" />
            </div>
            <div>
              <h2 class="text-lg font-bold leading-tight transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">Control de pedidos</h2>
              <p class="text-xs text-gray-400 mt-1">Calendario de entregas · {{ monthLabel }}</p>
            </div>
          </div>

          <div class="mt-6 flex-1 min-h-0 flex flex-col">
            <div class="flex items-center justify-between mb-3 shrink-0">
              <motion.div
                :key="monthKey"
                class="flex items-center gap-2 text-sm font-semibold transition-colors"
                :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'"
                :initial="{ opacity: 0, y: -6 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.2, ease: 'easeOut' }"
              >
                <n-icon :component="CalendarOutline" />
                <span>{{ monthLabel }}</span>
              </motion.div>
              <div class="flex items-center gap-0.5">
                <motion.div :whileTap="{ scale: 0.85 }" :transition="{ type: 'spring', stiffness: 500, damping: 20 }">
                  <n-button quaternary circle size="tiny" @click="prevMonth">
                    <template #icon><n-icon :component="ChevronBackOutline" /></template>
                  </n-button>
                </motion.div>
                <motion.div :whileTap="{ scale: 0.85 }" :transition="{ type: 'spring', stiffness: 500, damping: 20 }">
                  <n-button quaternary circle size="tiny" @click="nextMonth">
                    <template #icon><n-icon :component="ChevronForwardOutline" /></template>
                  </n-button>
                </motion.div>
              </div>
            </div>

            <div class="text-center text-[11px] font-medium text-gray-500 grid grid-cols-7 mb-2 shrink-0">
              <span v-for="d in weekdays" :key="d">{{ d }}</span>
            </div>

            <div class="relative flex-1 min-h-0">
              <motion.div
                class="absolute inset-y-0 rounded-md bg-[#00A86B]/10"
                :animate="{ left: `${(highlightColumn * 100) / 7}%`, width: `${100 / 7}%` }"
                :transition="{ type: 'spring', stiffness: 260, damping: 26 }"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  :key="monthKey"
                  class="grid grid-cols-7 auto-rows-fr gap-y-0.5 gap-x-0.5 h-full relative"
                  :initial="{ opacity: 0, x: direction * 28 }"
                  :animate="{ opacity: 1, x: 0 }"
                  :exit="{ opacity: 0, x: direction * -28 }"
                  :transition="{ duration: 0.18, ease: 'easeOut' }"
                >
                  <motion.div
                    v-for="(d, i) in grid"
                    :key="i"
                    class="h-full w-full flex items-center justify-center"
                    :whileHover="d !== null ? { scale: 1.1 } : undefined"
                    :whileTap="d !== null ? { scale: 0.88 } : undefined"
                    :transition="{ type: 'spring', stiffness: 420, damping: 20 }"
                  >
                    <n-button
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
                          <motion.span
                            v-if="d && hasDelivery(d)"
                            class="mt-0.5 h-1 w-1 rounded-full bg-[#FFD700]"
                            :initial="{ scale: 0, opacity: 0 }"
                            :animate="{ scale: 1, opacity: 1 }"
                            :transition="{ type: 'spring', stiffness: 500, damping: 15 }"
                          />
                        </span>
                      </template>
                    </n-button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div class="mt-3 flex items-center gap-3 text-[11px] text-gray-500 shrink-0">
              <span class="inline-flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-[#FFD700]" /> entrega</span>
              <span class="inline-flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-[#00A86B]" /> día activo</span>
            </div>
          </div>
        </motion.section>

        <!-- Right column: stacked cards -->
        <div class="flex flex-col gap-4">
          <!-- Card: Egresos hoy -->
          <motion.div
            class="relative rounded-2xl overflow-hidden border shadow-lg p-5 transition-colors"
            :class="esOscuro ? 'border-[#FFD700]/20 bg-[#1f2937]' : 'border-[#FFD700]/25 bg-[#FFD700]/[0.04]'"
            :initial="{ opacity: 0, x: 12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.3, delay: 0.08, ease: 'easeOut' }"
          >
            <div class="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full border-[12px] border-[#FFD700]/10" />
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-widest transition-colors" :class="esOscuro ? 'text-[#FFD700]' : 'text-[#B45309]'">Egresos hoy</span>
            </div>
            <div
              class="mt-2.5 text-4xl md:text-[42px] font-black leading-none tabular-nums truncate transition-colors"
              :class="esOscuro ? 'text-[#FFD700]' : 'text-[#B45309]'"
              :title="formatMoney(egresosHoyTotal)"
            >
              {{ formatMoney(egresosHoyTotal) }}
            </div>
            <div class="mt-2 text-base font-bold capitalize transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">{{ fechaHoy }}</div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-[10px] uppercase tracking-wider transition-colors" :class="esOscuro ? 'text-white/50' : 'text-slate-500'">Saldo por cobrar · día en calendario</span>
              <span class="text-xs font-bold tabular-nums transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">{{ formatMoney(saldoDiaSel) }}</span>
            </div>
            <div class="mt-1.5 h-1.5 rounded-full transition-colors" :class="esOscuro ? 'bg-white/10' : 'bg-slate-200'">
              <div class="h-full rounded-full bg-[#FFD700] transition-all duration-500" :style="{ width: `${saldoPct}%` }" />
            </div>
            <router-link
              to="/egresos"
              class="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              :class="esOscuro ? 'text-[#2ED5A0] hover:text-[#FFD700]' : 'text-[#008A59] hover:text-[#B45309]'"
            >
              Ver egresos <n-icon :component="ChevronForwardOutline" :size="12" />
            </router-link>
          </motion.div>

          <!-- Card: Pedidos pagados hoy -->
          <motion.div
            class="rounded-2xl overflow-hidden border shadow-lg p-5 transition-colors"
            :class="esOscuro ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-200 bg-white'"
            :initial="{ opacity: 0, x: 12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.3, delay: 0.16, ease: 'easeOut' }"
          >
            <div class="flex items-center justify-between">
              <div class="text-[11px] font-semibold uppercase tracking-wider transition-colors" :class="esOscuro ? 'text-white/60' : 'text-slate-500'">Pedidos pagados hoy</div>
              <router-link
                to="/pedidos"
                class="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
                :class="esOscuro ? 'text-[#2ED5A0] hover:text-[#FFD700]' : 'text-[#008A59] hover:text-[#B45309]'"
              >
                Ver pedidos <n-icon :component="ChevronForwardOutline" :size="12" />
              </router-link>
            </div>
            <div v-if="pagosHoy.length === 0" class="mt-3 text-xs transition-colors" :class="esOscuro ? 'text-white/50' : 'text-slate-500'">Sin pagos registrados hoy</div>
            <div v-else class="mt-3 flex flex-col gap-2">
              <div
                v-for="p in pagosHoy"
                :key="p.id"
                class="rounded-xl p-3 flex flex-col gap-2 transition-colors"
                :class="esOscuro ? 'bg-white/[0.06] border border-white/10' : 'bg-slate-50 border border-slate-200'"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-[#FFD700]/15 text-[#FFD700] grid place-items-center shrink-0">
                      <n-icon :component="WalletOutline" />
                    </div>
                    <div class="min-w-0 leading-tight">
                      <div class="text-sm font-bold truncate transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">{{ p.empresa }}</div>
                      <div class="text-[11px] truncate transition-colors" :class="esOscuro ? 'text-white/50' : 'text-slate-500'">Vendedor: {{ p.vendedor }}</div>
                    </div>
                  </div>
                  <n-tag :bordered="false" size="small" :type="p.saldo > 0 ? 'warning' : 'success'">
                    {{ p.formaPago }}
                  </n-tag>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[11px] transition-colors" :class="esOscuro ? 'text-white/50' : 'text-slate-500'">Total del pedido</span>
                  <span class="text-sm font-bold tabular-nums transition-colors" :class="esOscuro ? 'text-[#FFD700]' : 'text-[#B45309]'">{{ formatMoney(p.total) }}</span>
                </div>
                <div
                  v-if="p.saldo > 0"
                  class="rounded-md bg-[#FFD700]/10 px-2.5 py-1.5 flex items-center justify-between text-[11px] transition-colors"
                  :class="esOscuro ? 'text-[#FFD700]' : 'text-[#B45309]'"
                >
                  <span class="font-semibold">Abono parcial</span>
                  <span class="font-bold tabular-nums">Saldo {{ formatMoney(p.saldo) }}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import {
  CalendarOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  StorefrontOutline,
  WalletOutline
} from '@vicons/ionicons5'
import { useTheme } from '@/composables/useTheme'
import { useCatalog } from '@/composables/useCatalog'
import { formatMoney, numeroDestacado } from '@/domain/utils'
import { nombreDeEmpresa } from '@/services/pedidos'

const { esOscuro } = useTheme()

const { empresas, pedidos, vendedores, egresos } = useCatalog()

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const now = new Date()
const view = ref({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() })
const selectedDay = ref(now.getDate())
const direction = ref(0)

const monthLabel = computed(() => `${monthNames[view.value.m]} ${view.value.y}`)
const monthKey = computed(() => `${view.value.y}-${view.value.m}`)

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
  direction.value = delta
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

const entregaEnDia = (day: number) =>
  pedidos.items.filter((p) => p.fechaEntrega && new Date(p.fechaEntrega).getFullYear() === view.value.y && new Date(p.fechaEntrega).getMonth() === view.value.m && new Date(p.fechaEntrega).getDate() === day)

const entregasDia = computed(() => entregaEnDia(selectedDay.value).filter((p) => p.estado !== 'Cancelado' && p.estado !== 'Borrador'))

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