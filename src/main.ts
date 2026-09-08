import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app/App.vue'
import router from './app/router'
import { initializeCatalogFromCloud } from './data/supabaseInit'
import { seedDemoData } from './data/seed'
import './styles/tailwind.css'

async function bootstrap() {
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(router)

  await initializeCatalogFromCloud()
  await seedDemoData()

  app.mount('#app')
}

bootstrap()