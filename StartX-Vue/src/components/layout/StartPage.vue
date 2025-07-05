<script setup lang="ts">
import WallpaperManager from '@/components/wallpaper/WallpaperManager.vue'
import SearchBox from '@/components/search/SearchBox.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import Clock from '@/components/layout/Clock.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="start-page" :class="{ 'dark-theme': settingsStore.theme === 'dark' }">
    <!-- Wallpaper manager -->
    <WallpaperManager />
    
    <!-- Main content -->
    <div class="main-content">
      <!-- Clock and date -->
      <Clock />
      
      <!-- Search box -->
      <SearchBox :class="[`size-${settingsStore.searchBarSize}`]" />
    </div>
    
    <!-- Settings panel -->
    <SettingsPanel />
  </div>
</template>

<style scoped lang="scss">
.start-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  position: relative;
  
  &.dark-theme {
    /* Dark theme specific styles */
  }
}

.main-content {
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  width: 100%;
  padding: 20px;
}

/* Clock styles moved to Clock.vue */

.size-small {
  transform: scale(0.8);
}

.size-medium {
  transform: scale(1);
}

.size-large {
  transform: scale(1.2);
}
</style> 