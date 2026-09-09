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
        <nav class="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
          <motion.div
            v-for="(item, idx) in menuItems"
            :key="item.key"
            :initial="{ opacity: 0, x: -10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.28, delay: 0.04 * idx, ease: 'easeOut' }"
          >
            <n-tooltip :disabled="!collapsed" placement="right">
              <template #trigger>
                <motion.div
                  :whileHover="{ x: 3 }"
                  :whileTap="{ scale: 0.97 }"
                  :transition="{ type: 'spring', stiffness: 400, damping: 22 }"
                >
                  <router-link
                    :to="item.key"
                    :class="[
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      item.key === activeKey
                        ? esOscuro
                          ? 'bg-[#00A86B]/15 text-[#FFD700] font-semibold'
                          : 'bg-[#00A86B]/15 text-[#008A59] font-semibold'
                        : esOscuro
                          ? 'text-slate-300 hover:bg-white/5 hover:text-[#F5F5DC]'
                          : 'text-slate-600 hover:bg-black/5 hover:text-slate-900',
                      collapsed ? 'justify-center px-0' : ''
                    ]"
                  >
                    <n-icon :component="item.icon" :size="18" />
                    <span v-if="!collapsed">{{ item.label }}</span>
                  </router-link>
                </motion.div>
              </template>
              {{ item.label }}
            </n-tooltip>
          </motion.div>
        </nav>
        <motion.div
          class="mt-auto px-4 py-3 flex items-center gap-2.5 border-t transition-colors"
          :class="esOscuro ? 'border-white/10' : 'border-slate-200'"
        >
          <n-dropdown
            trigger="click"
            placement="right-start"
            :options="menuUsuario"
            @select="accionUsuario"
          >
            <motion.div
              class="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
              :whileHover="{ x: 2 }"
              :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
            >
              <n-avatar round size="small" color="#FFD700" class="text-slate-900 !text-xs font-bold shrink-0">
                {{ inicial }}
              </n-avatar>
              <div v-if="!collapsed" class="min-w-0 flex-1 leading-tight">
                <div class="text-xs font-bold truncate transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">
                  {{ auth.usuario?.nombre || auth.usuario?.email || 'Usuario' }}
                </div>
                <div class="text-[10px] text-gray-500">{{ etiquetaRol(auth.rol ?? 'collaborator') }}</div>
              </div>
              <n-button quaternary circle size="small" class="hidden sm:inline-flex">
                <template #icon><n-icon :component="ChevronDownOutline" /></template>
              </n-button>
            </motion.div>
          </n-dropdown>
        </motion.div>
      </div>
    </n-layout-sider>

    <n-layout style="overflow: hidden;">
      <n-layout-header
        bordered
        class="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-3 transition-colors"
        :class="esOscuro ? '!bg-slate-950/70' : '!bg-white/70'"
      >
        <span class="text-sm font-bold truncate min-w-0 transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">
          Panel de administración de pedidos
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <n-tooltip>
            <template #trigger>
              <motion.div
                :whileHover="{ rotate: 12 }"
                :whileTap="{ scale: 0.8 }"
                :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
              >
                <n-button
                  quaternary
                  circle
                  size="small"
                  :aria-label="`Cambiar a tema ${esOscuro ? 'claro' : 'oscuro'}`"
                  class="transition-colors"
                  :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-700'"
                  @click="alternarTema"
                >
                  <template #icon>
                    <motion.div
                      :key="esOscuro ? 'dark' : 'light'"
                      :initial="{ rotate: -120, opacity: 0 }"
                      :animate="{ rotate: 0, opacity: 1 }"
                      :transition="{ type: 'spring', stiffness: 300, damping: 18 }"
                    >
                      <n-icon :component="esOscuro ? Sunny : Moon" :size="16" />
                    </motion.div>
                  </template>
                </n-button>
              </motion.div>
            </template>
            {{ esOscuro ? 'Cambiar a claro' : 'Cambiar a oscuro' }}
          </n-tooltip>
        </div>
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
import { motion } from 'motion-v'
import {
  Grid, Storefront, People, Cube, Receipt, Wallet,
  ChevronDownOutline, CartOutline, Sunny, Moon,
  PersonAddOutline, LogOutOutline, ShieldCheckmarkOutline
} from '@vicons/ionicons5'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/data/authStore'
import { etiquetaRol } from '@/domain/constants'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const { esOscuro, cambiarModo } = useTheme()
const auth = useAuthStore()

interface MenuItem {
  label: string
  key: string
  icon: Component
}

const menuItems = computed<MenuItem[]>(() => [
  { label: 'Dashboard', key: '/dashboard', icon: Grid },
  { label: 'Pedidos', key: '/pedidos', icon: Receipt },
  { label: 'Egresos', key: '/egresos', icon: Wallet },
  { label: 'Proveedores', key: '/proveedores', icon: Storefront },
  { label: 'Vendedores', key: '/vendedores', icon: People },
  { label: 'Productos', key: '/productos', icon: Cube },
  ...(auth.esAdmin ? [{ label: 'Usuarios', key: '/usuarios', icon: PersonAddOutline }] : [])
])

const inicial = computed(() => {
  const nombre = auth.usuario?.nombre?.trim()
  if (nombre && nombre.length > 0) return nombre.charAt(0).toUpperCase()
  return (auth.usuario?.email || '?').charAt(0).toUpperCase()
})

const menuUsuario = computed(() => [
  ...(auth.esAdmin
    ? [
        {
          label: 'Usuarios',
          key: 'usuarios',
          icon: () => h(ShieldCheckmarkOutline)
        }
      ]
    : []),
  {
    label: 'Cerrar sesión',
    key: 'logout',
    icon: () => h(LogOutOutline)
  }
])

async function accionUsuario(key: string) {
  if (key === 'logout') {
    await auth.logout()
    router.replace({ name: 'login' })
  } else if (key === 'usuarios') {
    router.push('/usuarios')
  }
}

const activeKey = computed(() => {
  const path = route.path
  const found = menuItems.value.find((m) => path === m.key || path.startsWith(`${m.key}/`))
  return typeof found?.key === 'string' ? found.key : '/dashboard'
})

function alternarTema() {
  cambiarModo(esOscuro.value ? 'light' : 'dark')
}
</script>