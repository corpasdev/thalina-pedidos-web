<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-2 text-sm">
      <DetalleLabel label="Empresa" :value="nombreDeEmpresa(empresas.items, props.pedido.empresaId)" />
      <DetalleLabel label="Vendedor" :value="nombreDeVendedor(vendedores.items, props.pedido.vendedorId)" />
      <DetalleLabel label="Fecha de pedido" :value="formatDate(props.pedido.fechaPedido)" />
      <DetalleLabel label="Fecha de entrega" :value="props.pedido.fechaEntrega ? formatDate(props.pedido.fechaEntrega) : '—'" />
      <DetalleLabel label="Estado" :value="props.pedido.estado" />
      <DetalleLabel label="Total" :value="formatMoney(total)" />
      <DetalleLabel label="Saldo pendiente" :value="formatMoney(saldo)" />
    </div>
    <DetalleLabel v-if="props.pedido.notas" label="Notas" :value="props.pedido.notas" />
    <n-divider title-placement="left">Líneas ({{ props.pedido.lineas.length }})</n-divider>
    <div class="flex flex-col gap-1">
      <div v-for="l in props.pedido.lineas" :key="l.id" class="flex items-center justify-between py-1 border-b border-slate-800 text-sm">
        <div>
          <div class="text-slate-100">{{ nombreProducto(l.productoId) }}</div>
          <div class="text-xs text-gray-500">{{ l.cantidad }} × {{ formatMoney(l.precioUnitario) }}</div>
        </div>
        <div class="font-medium">{{ formatMoney(l.cantidad * l.precioUnitario) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DetalleLabel from './DetalleLabel.vue'
import { useCatalog } from '@/composables/useCatalog'
import { formatMoney, formatDate } from '@/domain/utils'
import { nombreDeEmpresa, nombreDeVendedor } from '@/services/pedidos'
import { saldoPendiente, totalPorPedido } from '@/services/egresos'
import type { Pedido } from '@/domain/models'

const props = defineProps<{ pedido: Pedido }>()

const { empresas, vendedores, productos, egresos } = useCatalog()

const total = computed(() => totalPorPedido(props.pedido))
const saldo = computed(() => saldoPendiente(props.pedido, egresos.items))
const nombreProducto = (id: string) => productos.items.find((p) => p.id === id)?.nombre ?? 'Producto'
</script>