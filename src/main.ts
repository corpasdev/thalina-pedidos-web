import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app/App.vue'
import router from './app/router'
import { initializeCatalogFromCloud } from './data/supabaseInit'
import './styles/tailwind.css'

async function bootstrap() {
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(router)

  await initializeCatalogFromCloud()

  app.mount('#app')
}

bootstrap()