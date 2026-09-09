<template>
  <div
    class="min-h-dvh w-full grid place-items-center p-4 relative overflow-hidden transition-colors"
    :class="esOscuro ? 'bg-[#0b1420]' : 'bg-[#f4f6ea]'"
  >
    <!-- Fondo decorativo -->
    <div class="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full border-[24px] border-[#00A86B]/10" />
    <div class="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full border-[20px] border-[#FFD700]/10" />

    <!-- Botón tema -->
    <div class="absolute top-4 right-4">
      <motion.div :whileTap="{ scale: 0.9 }">
        <n-button quaternary circle size="small" :aria-label="`Cambiar a tema ${esOscuro ? 'claro' : 'oscuro'}`" @click="cambiarModo(esOscuro ? 'light' : 'dark')">
          <n-icon :component="esOscuro ? Sunny : Moon" :size="16" />
        </n-button>
      </motion.div>
    </div>

    <motion.div
      class="w-full max-w-md"
      :initial="{ opacity: 0, y: 16, scale: 0.98 }"
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :transition="{ duration: 0.35, ease: 'easeOut' }"
    >
      <div
        class="rounded-3xl border shadow-2xl overflow-hidden transition-colors"
        :class="esOscuro ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-200 bg-white'"
      >
        <div class="p-8 md:p-10 flex flex-col gap-7">
          <!-- Marca -->
          <div class="flex flex-col items-center gap-3 text-center">
            <motion.div
              class="w-14 h-14 rounded-2xl bg-[#00A86B] grid place-items-center shadow-lg"
              :initial="{ opacity: 0, scale: 0.6 }"
              :animate="{ opacity: 1, scale: 1 }"
              :transition="{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }"
            >
              <n-icon :component="Cart" :size="28" color="white" />
            </motion.div>
            <div>
              <h1 class="text-2xl font-black tracking-tight transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">Thaliana</h1>
              <p class="text-xs text-gray-400 mt-1">Administración de pedidos</p>
            </div>
          </div>

          <n-divider />
          <n-form :show-feedback="false" size="large" @keyup.enter="enviar">
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-xs text-gray-400 block mb-1">Correo o usuario</span>
                <n-input
                  v-model:value="email"
                  placeholder="usuario"
                  :status="error ? 'error' : undefined"
                  @keyup.enter="enviar"
                />
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">Contraseña</span>
                <n-input
                  v-model:value="password"
                  type="password"
                  show-password-on="click"
                  placeholder="••••••••"
                  :status="error ? 'error' : undefined"
                  @keyup.enter="enviar"
                />
              </div>

              <p v-if="error" class="text-xs text-[#e88080] transition-colors"> {{ error }}</p>

              <motion.button
                class="w-full mt-1 relative overflow-hidden rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                :class="[cargando ? 'bg-[#008A59]' : 'bg-[#00A86B] hover:bg-[#008A59]']"
                :disabled="cargando || !email.trim() || !password"
                :whileTap="{ scale: 0.98 }"
                :whileHover="{ scale: cargando ? 1 : 1.02 }"
                @click="enviar"
              >
                <span v-if="cargando" class="inline-flex items-center gap-2">
                  <n-spin size="small" :stroke-width="12" color="white" />
                  Ingresando…
                </span>
                <span v-else class="tracking-wide">Ingresar</span>
              </motion.button>
            </div>
          </n-form>
        </div>
      </div>

      <p class="text-center text-[11px] text-gray-500 mt-5">Acceso restringido a usuarios autorizados.</p>
    </motion.div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { motion } from 'motion-v'
import { Cart, Moon, Sunny } from '@vicons/ionicons5'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/data/authStore'

const { esOscuro, cambiarModo } = useTheme()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const email = ref('')
const password = ref('')
const cargando = ref(false)
const error = ref('')

async function enviar() {
  if (cargando.value || !email.value.trim() || !password.value) return
  cargando.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    message.success(`Bienvenido${auth.usuario?.nombre ? ', ' + auth.usuario.nombre : ''}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Credenciales incorrectas'
  } finally {
    cargando.value = false
  }
}
</script>