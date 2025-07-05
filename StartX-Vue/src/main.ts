import './assets/main.css'
import './assets/theme.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Create Pinia instance (store)
const pinia = createPinia()

// Create Vue app
const app = createApp(App)

// Register Pinia and Router
app.use(pinia)
app.use(router)

// Initialize the app
app.mount('#app')
