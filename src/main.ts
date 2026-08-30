import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const app = createApp(App) //cria
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')