<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import WallpaperUploader from './WallpaperUploader.vue'

const settingsStore = useSettingsStore()
const showWallpaperList = ref(false)
const showDeleteConfirm = ref(false)
const wallpaperToDelete = ref('')

// Wallpaper management functions
const toggleWallpaperList = () => {
  showWallpaperList.value = !showWallpaperList.value
}

const selectWallpaper = (wallpaper: string) => {
  settingsStore.setCurrentWallpaper(wallpaper)
}

const confirmDeleteWallpaper = (wallpaper: string) => {
  wallpaperToDelete.value = wallpaper
  showDeleteConfirm.value = true
}

const deleteWallpaper = () => {
  if (wallpaperToDelete.value) {
    settingsStore.removeWallpaper(wallpaperToDelete.value)
    wallpaperToDelete.value = ''
    showDeleteConfirm.value = false
  }
}

const cancelDelete = () => {
  wallpaperToDelete.value = ''
  showDeleteConfirm.value = false
}

// Mock wallpapers for development
onMounted(() => {
  if (settingsStore.wallpapers.length === 0) {
    settingsStore.addWallpaper('/wallpapers/default1.jpg')
    settingsStore.addWallpaper('/wallpapers/default2.jpg')
    settingsStore.setCurrentWallpaper('/wallpapers/default1.jpg')
  }
})
</script>

<template>
  <div class="wallpaper-container">
    <!-- Background wallpaper display -->
    <div 
      class="wallpaper" 
      :style="{ backgroundImage: `url(${settingsStore.currentWallpaper})` }"
    ></div>
    
    <!-- Wallpaper controls -->
    <div class="wallpaper-panel" v-if="showWallpaperList">
      <div class="panel-header">
        <h3>Wallpapers</h3>
        <button class="close-button" @click="toggleWallpaperList">×</button>
      </div>
      
      <div class="wallpaper-list">
        <div 
          v-for="(wallpaper, index) in settingsStore.wallpapers" 
          :key="index"
          class="wallpaper-item"
        >
          <div 
            class="wallpaper-thumbnail"
            :class="{ active: wallpaper === settingsStore.currentWallpaper }"
            @click="selectWallpaper(wallpaper)"
          >
            <img :src="wallpaper" alt="Wallpaper thumbnail" />
          </div>
          <button class="delete-button" @click="confirmDeleteWallpaper(wallpaper)">
            🗑️
          </button>
        </div>
      </div>
      
      <div class="wallpaper-actions">
        <WallpaperUploader />
      </div>
    </div>
    
    <!-- Delete confirmation modal -->
    <div class="delete-confirm" v-if="showDeleteConfirm">
      <div class="confirm-dialog">
        <h4>Delete Wallpaper</h4>
        <p>Are you sure you want to delete this wallpaper?</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
          <button class="delete-btn" @click="deleteWallpaper">Delete</button>
        </div>
      </div>
    </div>
    
    <button class="wallpaper-toggle" @click="toggleWallpaperList">
      🖼️
    </button>
  </div>
</template>

<style scoped lang="scss">
.wallpaper-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: opacity 0.5s ease;
}

.wallpaper-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 10;
  width: 90%;
  max-width: 800px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
  
  .close-button {
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    
    &:hover {
      color: #ff5252;
    }
  }
}

.wallpaper-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 20px;
  overflow-y: auto;
  max-height: 40vh;
}

.wallpaper-item {
  position: relative;
  
  &:hover .delete-button {
    opacity: 1;
  }
}

.wallpaper-thumbnail {
  width: 160px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &.active {
    border-color: #41b883;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.delete-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff5252;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  font-size: 12px;
  
  &:hover {
    transform: scale(1.1);
  }
}

.wallpaper-actions {
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

.delete-confirm {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  
  h4 {
    margin: 0 0 10px;
    color: #333;
  }
  
  p {
    color: #666;
    margin-bottom: 20px;
  }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .cancel-btn {
    background: #f5f5f5;
    color: #333;
    
    &:hover {
      background: #eee;
    }
  }
  
  .delete-btn {
    background: #ff5252;
    color: white;
    
    &:hover {
      background: #ff3838;
    }
  }
}

.wallpaper-toggle {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
}
</style> 