import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app/App.vue'
import router from './app/router'
import './styles/tailwind.css'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(router)

// El catálogo se carga tras el login (guard de rutas), para no bloquear
// la vista de login si Supabase tarda en responder.
app.mount('#app')