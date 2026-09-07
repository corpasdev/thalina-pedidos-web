<template>
  <div class="flex flex-col gap-6">
    <PageHeader title="Dashboard">
      <router-link to="/pedidos/nuevo">
        <n-button type="primary" size="medium">+ Nuevo pedido</n-button>
      </router-link>
    </PageHeader>

    <n-grid cols="1 s:2 m:4" responsive="screen" x-gap="14" y-gap="14">
      <n-grid-item>
        <StatCard label="Egresos del mes" :value="formatMoney(data.egresosMes)" :hint="`Histórico ${formatMoney(data.egresosHistorico)}`" accent="green">
          <template #icon>💸</template>
        </StatCard>
      </n-grid-item>
      <n-grid-item>
        <StatCard label="Pedidos activos" :value="String(data.pedidosActivos.length)" :hint="`${data.pedidosRecibidosMes} recibidos este mes`" accent="sky">
          <template #icon>📦</template>
        </StatCard>
      </n-grid-item>
      <n-grid-item>
        <StatCard label="Por pagar" :value="formatMoney(data.saldoPorPagar)" :hint="`Valor ${formatMoney(data.valorPedidosPendientes)}`" accent="amber">
          <template #icon>💰</template>
        </StatCard>
      </n-grid-item>
      <n-grid-item>
        <StatCard label="Productos duplicados" :value="String(data.productosDuplicados)" hint="Mismo SKU en 2+ pedidos activos" accent="rose">
          <template #icon>⚠️</template>
        </StatCard>
      </n-grid-item>
    </n-grid>

    <n-alert v-if="duplicados.length > 0" type="warning" title="Repetidos detectados — evite pedir lo mismo dos veces">
      <div class="flex flex-col gap-1">
        <div v-for="d in duplicados" :key="d.producto.id" class="text-sm">
          <b>{{ d.producto.nombre }}</b> (SKU {{ d.producto.sku }}) · {{ d.cantidadGlobal }}:
          {{ d.pedidosAnteriores.map((p) => p.numero).join(', ') }}
        </div>
      </div>
    </n-alert>

    <n-grid cols="1 l:2" responsive="screen" x-gap="14" y-gap="14">
      <n-grid-item>
        <n-card title="Entregas próximas (7 días)">
          <n-empty v-if="entregasTabla.length === 0" description="Sin entregas agendadas" />
          <n-data-table v-else size="small" :columns="columnasEntregas" :data="entregasTabla" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="Entregas de hoy" class="h-full">
          <n-empty v-if="entregasHoy.length === 0" description="Nada para hoy" />
          <n-space v-else vertical>
            <div
              v-for="r in entregasHoy"
              :key="r.id"
              class="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3"
            >
              <div>
                <div class="font-semibold text-white">{{ r.numero }} · {{ r.empresa }}</div>
                <div class="text-xs text-gray-500">Entrega {{ formatearEntrega(r.fechaEntrega) }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-green-400">{{ formatMoney(r.total) }}</div>
                <n-tag size="small" type="success">Hoy</n-tag>
              </div>
            </div>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-alert v-if="data.stocksCriticos.length > 0" type="error" title="Stock crítico">
      <div class="flex flex-wrap gap-2">
        <n-tag v-for="p in data.stocksCriticos" :key="p.id" type="error" size="small">
          {{ p.nombre }} · {{ p.stock ?? 0 }} (mín. {{ p.stockMinimo }})
        </n-tag>
      </div>
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useCatalog } from '@/composables/useCatalog'
import { buildDashboard } from '@/services/dashboard'
import { detectarDuplicados } from '@/services/pedidos'
import { formatMoney, formatDate } from '@/domain/utils'
import { NText, NTag } from 'naive-ui'

const { empresas, egresos, marcas, pedidos, productos } = useCatalog()

const data = computed(() => buildDashboard(pedidos.items, egresos.items, productos.items, empresas.items, marcas.items))

const duplicados = computed(() => detectarDuplicados(productos.items, pedidos.items, marcas.items, empresas.items))

const entregasTabla = computed(() =>
  data.value.entregasProximas.map((p) => ({
    ...p,
    empresa: empresas.items.find((e) => e.id === p.empresaId)?.nombre ?? '—',
    total: p.lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0)
  }))
)

const dentroDeHoy = (f: string | undefined) => !!f && new Date(f).toDateString() === new Date().toDateString()

const formatearEntrega = (f: string | undefined) => (f ? formatDate(f) : '—')

const entregasHoy = computed(() => entregasTabla.value.filter((r) => dentroDeHoy(r.fechaEntrega)))

const columnasEntregas = computed(() => [
  { title: 'Pedido', key: 'numero', width: 110 },
  { title: 'Empresa', key: 'empresa' },
  {
    title: 'Entrega',
    key: 'fechaEntrega',
    render: (row: any) => h(NText, { depth: 2 }, { default: () => (row.fechaEntrega ? formatDate(row.fechaEntrega) : '—') })
  },
  {
    title: 'Estado',
    key: 'estado', width: 120,
    render: (row: any) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.estado })
  },
  {
    title: 'Total',
    key: 'total', align: 'right' as const,
    render: (row: any) => formatMoney(row.total)
  }
])
</script>