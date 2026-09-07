<template>
  <n-layout has-sider class="h-full">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      v-model:collapsed="collapsed"
      show-trigger="arrow-circle"
    >
      <div class="flex flex-col h-full">
        <div class="px-4 py-5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-green-600 text-white grid place-items-center text-lg font-bold shrink-0">
            T
          </div>
          <div v-if="!collapsed" class="leading-tight">
            <div class="font-bold text-green-400">SuperMercado</div>
            <div class="text-xs text-gray-500">Thaliana · Pedidos</div>
          </div>
        </div>
        <n-menu
          inverted
          :value="activeKey"
          :options="menuOptions"
          :collapsed="collapsed"
          @update:value="onSelect"
        />
      </div>
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="hidden md:flex items-center justify-end px-6 h-14 gap-3 !bg-slate-950/70">
        <span class="text-xs flex items-center gap-2 text-gray-400">
          <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Recepción de pedidos: lunes a sábado
        </span>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px;">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  Grid, Storefront, People, Cube, GitNetwork, Receipt, Wallet, Layers
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions: MenuOption[] = [
  { label: 'Dashboard', key: '/dashboard', icon: renderIcon(Grid) },
  { label: 'Empresas', key: '/empresas', icon: renderIcon(Storefront) },
  { label: 'Vendedores', key: '/vendedores', icon: renderIcon(People) },
  { label: 'Marcas', key: '/marcas', icon: renderIcon(GitNetwork) },
  { label: 'Líneas de producto', key: '/lineas', icon: renderIcon(Layers) },
  { label: 'Productos', key: '/productos', icon: renderIcon(Cube) },
  { label: 'Pedidos', key: '/pedidos', icon: renderIcon(Receipt) },
  { label: 'Egresos', key: '/egresos', icon: renderIcon(Wallet) }
]

const activeKey = computed(() => {
  const path = route.path
  const found = menuOptions.find((m) => path === m.key || path.startsWith(`${m.key}/`))
  return typeof found?.key === 'string' ? found.key : '/dashboard'
})

function onSelect(key: string | number) {
  router.push(String(key))
}
</script>