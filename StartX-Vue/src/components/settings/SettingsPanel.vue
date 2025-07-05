<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const showSettings = ref(false)

// Settings actions
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const toggleTheme = () => {
  settingsStore.toggleTheme()
}

const setSearchBarSize = (size: 'small' | 'medium' | 'large') => {
  settingsStore.setSearchBarSize(size)
}

const resetSettings = () => {
  settingsStore.resetSettings()
}

const selectWallpaperFolder = () => {
  // In a real extension, this would open a folder picker
  // For now, let's just mock it
  settingsStore.setWallpaperFolder('/custom/wallpapers')
}
</script>

<template>
  <div>
    <!-- Settings toggle button -->
    <button class="settings-toggle" @click="toggleSettings">
      ⚙️
    </button>
    
    <!-- Settings panel -->
    <div class="settings-panel" :class="{ 'show': showSettings }">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-button" @click="toggleSettings">×</button>
      </div>
      
      <div class="settings-content">
        <!-- Theme settings -->
        <div class="settings-section">
          <h3>Theme</h3>
          <div class="setting-item">
            <span>Dark mode</span>
            <div 
              class="toggle-switch"
              :class="{ 'active': settingsStore.theme === 'dark' }"
              @click="toggleTheme"
            >
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
        
        <!-- Wallpaper settings -->
        <div class="settings-section">
          <h3>Wallpaper</h3>
          <div class="setting-item">
            <span>Wallpaper folder</span>
            <button @click="selectWallpaperFolder">Select folder</button>
          </div>
          <div class="setting-info" v-if="settingsStore.wallpaperFolder">
            Selected: {{ settingsStore.wallpaperFolder }}
          </div>
        </div>
        
        <!-- Search bar settings -->
        <div class="settings-section">
          <h3>Search bar</h3>
          <div class="setting-item">
            <span>Size</span>
            <div class="size-options">
              <button 
                :class="{ active: settingsStore.searchBarSize === 'small' }"
                @click="setSearchBarSize('small')"
              >
                Small
              </button>
              <button 
                :class="{ active: settingsStore.searchBarSize === 'medium' }"
                @click="setSearchBarSize('medium')"
              >
                Medium
              </button>
              <button 
                :class="{ active: settingsStore.searchBarSize === 'large' }"
                @click="setSearchBarSize('large')"
              >
                Large
              </button>
            </div>
          </div>
        </div>
        
        <!-- Reset button -->
        <div class="settings-section">
          <button class="reset-button" @click="resetSettings">
            Reset all settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
}

.settings-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 350px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: right 0.3s ease;
  overflow-y: auto;
  
  &.show {
    right: 0;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
  
  .close-button {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    
    &:hover {
      color: #ff5252;
    }
  }
}

.settings-content {
  padding: 20px;
}

.settings-section {
  margin-bottom: 30px;
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 500;
    color: #555;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.setting-info {
  font-size: 12px;
  color: #777;
  margin-top: -10px;
  margin-bottom: 15px;
}

.toggle-switch {
  width: 50px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.active {
    background: #41b883;
    
    .toggle-knob {
      transform: translateX(26px);
    }
  }
  
  .toggle-knob {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
  }
}

button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: #f2f2f2;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
  }
  
  &.active {
    background: #41b883;
    color: white;
  }
}

.size-options {
  display: flex;
  gap: 5px;
}

.reset-button {
  width: 100%;
  background: #ff5252;
  color: white;
  padding: 10px;
  border-radius: 4px;
  
  &:hover {
    background: #ff3838;
  }
}
</style> 