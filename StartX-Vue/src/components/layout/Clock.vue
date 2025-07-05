<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const time = ref(new Date().toLocaleTimeString())
const date = ref(new Date().toLocaleDateString())
let clockInterval: number | null = null

const updateClock = () => {
  const now = new Date()
  time.value = now.toLocaleTimeString()
  date.value = now.toLocaleDateString()
}

onMounted(() => {
  updateClock()
  clockInterval = window.setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockInterval !== null) {
    clearInterval(clockInterval)
  }
})
</script>

<template>
  <div class="clock-wrapper">
    <div class="time">{{ time }}</div>
    <div class="date">{{ date }}</div>
  </div>
</template>

<style scoped lang="scss">
.clock-wrapper {
  text-align: center;
  margin-bottom: 20px;
  
  .time {
    font-size: 6rem;
    font-weight: 300;
    letter-spacing: -2px;
    margin: 0;
    font-family: 'Arial', sans-serif;
  }
  
  .date {
    font-size: 1.5rem;
    opacity: 0.8;
    font-family: 'Arial', sans-serif;
  }
}
</style> 