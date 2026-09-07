import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app/App.vue'
import router from './app/router'
import { seedDemoData } from './data/seed'
import './styles/tailwind.css'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(router)

seedDemoData()

app.mount('#app')