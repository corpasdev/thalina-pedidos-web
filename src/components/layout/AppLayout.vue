<template>
  <n-layout has-sider class="h-screen w-full" style="overflow: hidden;">
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
          <div class="w-9 h-9 rounded-xl bg-[#00A86B] text-white grid place-items-center shrink-0">
            <n-icon :component="CartOutline" :size="20" />
          </div>
          <div v-if="!collapsed" class="leading-tight">
            <div class="font-bold text-[#FFD700]">Thaliana</div>
            <div class="text-xs text-gray-500">SuperMercado · Pedidos</div>
          </div>
        </div>
        <n-menu
          inverted
          :value="activeKey"
          :options="menuOptions"
          :collapsed="collapsed"
          @update:value="onSelect"
        />
        <div class="mt-auto px-4 py-3 flex items-center gap-2.5 border-t border-white/10">
          <n-avatar round size="small" color="#FFD700" class="text-slate-900 !text-xs font-bold shrink-0">B</n-avatar>
          <div v-if="!collapsed" class="min-w-0 flex-1 leading-tight">
            <div class="text-xs font-bold text-[#F5F5DC] truncate">Usuario</div>
            <div class="text-[10px] text-gray-500">Administrador</div>
          </div>
          <n-button quaternary circle size="small" class="hidden sm:inline-flex">
            <template #icon><n-icon :component="ChevronDownOutline" /></template>
          </n-button>
        </div>
      </div>
    </n-layout-sider>

    <n-layout style="overflow: hidden;">
      <n-layout-header bordered class="hidden md:flex items-center justify-between px-6 h-14 shrink-0 gap-3 !bg-slate-950/70">
        <span class="text-sm font-bold text-[#F5F5DC]">Panel de administración de pedidos</span>
      </n-layout-header>
      <n-layout-content content-style="padding: 24px;" style="overflow: auto;">
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
  Grid, Storefront, People, Cube, Receipt, Wallet, ChevronDownOutline, CartOutline
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions: MenuOption[] = [
  { label: 'Dashboard', key: '/dashboard', icon: renderIcon(Grid) },
  { label: 'Pedidos', key: '/pedidos', icon: renderIcon(Receipt) },
  { label: 'Egresos', key: '/egresos', icon: renderIcon(Wallet) },
  { label: 'Proveedores', key: '/proveedores', icon: renderIcon(Storefront) },
  { label: 'Vendedores', key: '/vendedores', icon: renderIcon(People) },
  { label: 'Productos', key: '/productos', icon: renderIcon(Cube) }
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