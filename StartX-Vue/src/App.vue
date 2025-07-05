<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Dark theme variables */
:root {
  --color-background: #ffffff;
  --color-text: #2c3e50;
  --color-accent: #41b883;
}

/* Dark theme */
[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #f5f5f5;
  --color-accent: #41b883;
}
</style>
