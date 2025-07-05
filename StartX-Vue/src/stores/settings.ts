import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { STORAGE_KEYS, saveToStorage, loadFromStorage } from '@/utils/storage'

interface SearchEngine {
  name: string
  url: string
}

interface Bookmark {
  title: string
  url: string
}

export const useSettingsStore = defineStore('settings', () => {
  // Theme settings
  const theme = ref<'light' | 'dark'>('light')
  
  // Wallpaper settings
  const wallpapers = ref<string[]>([])
  const currentWallpaper = ref('')
  const wallpaperFolder = ref('')
  
  // Search settings
  const searchEngines = ref<SearchEngine[]>([
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=' }
  ])
  const activeEngine = ref(searchEngines.value[0])
  const searchBarSize = ref<'small' | 'medium' | 'large'>('medium')
  
  // Bookmark settings
  const bookmarks = ref<Bookmark[]>([
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Vue.js', url: 'https://vuejs.org' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }
  ])
  
// Load settings from storage
const loadSettings = () => {
  theme.value = loadFromStorage(STORAGE_KEYS.THEME, 'light')
  wallpapers.value = loadFromStorage(STORAGE_KEYS.WALLPAPERS, [])
  currentWallpaper.value = loadFromStorage(STORAGE_KEYS.CURRENT_WALLPAPER, '')
  wallpaperFolder.value = loadFromStorage(STORAGE_KEYS.WALLPAPER_FOLDER, '')
  
  const savedEngine = loadFromStorage(
    STORAGE_KEYS.SEARCH_ENGINE, 
    { name: 'Google', url: 'https://www.google.com/search?q=' }
  )
  
  // Find the matching engine in our searchEngines list
  const matchingEngine = searchEngines.value.find(engine => engine.name === savedEngine.name)
  if (matchingEngine) {
    activeEngine.value = matchingEngine
  }
  
  searchBarSize.value = loadFromStorage(STORAGE_KEYS.SEARCH_BAR_SIZE, 'medium')
  bookmarks.value = loadFromStorage(STORAGE_KEYS.BOOKMARKS, [
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Vue.js', url: 'https://vuejs.org' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }
  ])
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', theme.value)
}

// Save settings to storage
const saveSettings = () => {
  saveToStorage(STORAGE_KEYS.THEME, theme.value)
  saveToStorage(STORAGE_KEYS.WALLPAPERS, wallpapers.value)
  saveToStorage(STORAGE_KEYS.CURRENT_WALLPAPER, currentWallpaper.value)
  saveToStorage(STORAGE_KEYS.WALLPAPER_FOLDER, wallpaperFolder.value)
  saveToStorage(STORAGE_KEYS.SEARCH_ENGINE, activeEngine.value)
  saveToStorage(STORAGE_KEYS.SEARCH_BAR_SIZE, searchBarSize.value)
  saveToStorage(STORAGE_KEYS.BOOKMARKS, bookmarks.value)
}
  
  // Reset all settings to defaults
  const resetSettings = () => {
    theme.value = 'light'
    searchBarSize.value = 'medium'
    wallpaperFolder.value = ''
    activeEngine.value = searchEngines.value[0]
    document.documentElement.setAttribute('data-theme', 'light')
    saveSettings()
  }
  
  // Add a new wallpaper
  const addWallpaper = (wallpaperUrl: string) => {
    if (!wallpapers.value.includes(wallpaperUrl)) {
      wallpapers.value.push(wallpaperUrl)
      saveSettings()
    }
  }
  
  // Remove a wallpaper
  const removeWallpaper = (wallpaperUrl: string) => {
    const index = wallpapers.value.indexOf(wallpaperUrl)
    if (index !== -1) {
      wallpapers.value.splice(index, 1)
      
      // If we removed the current wallpaper, select another one
      if (currentWallpaper.value === wallpaperUrl) {
        currentWallpaper.value = wallpapers.value[0] || ''
      }
      
      saveSettings()
    }
  }
  
  // Set current wallpaper
  const setCurrentWallpaper = (wallpaperUrl: string) => {
    currentWallpaper.value = wallpaperUrl
    saveSettings()
  }
  
  // Set wallpaper folder
  const setWallpaperFolder = (folder: string) => {
    wallpaperFolder.value = folder
    saveSettings()
  }
  
  // Toggle theme
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
    saveSettings()
  }
  
  // Set search engine
  const setSearchEngine = (engine: SearchEngine) => {
    activeEngine.value = engine
    saveSettings()
  }
  
  // Set search bar size
  const setSearchBarSize = (size: 'small' | 'medium' | 'large') => {
    searchBarSize.value = size
    saveSettings()
  }
  
  // Watch for changes and save
  watch([theme, wallpapers, currentWallpaper, wallpaperFolder, activeEngine, searchBarSize], 
    () => {
      saveSettings()
    },
    { deep: true }
  )
  
  // Initialize settings
  loadSettings()
  
  return { 
    theme,
    wallpapers,
    currentWallpaper,
    wallpaperFolder,
    searchEngines,
    activeEngine,
    searchBarSize,
    bookmarks,
    toggleTheme,
    setSearchEngine,
    setSearchBarSize,
    addWallpaper,
    removeWallpaper,
    setCurrentWallpaper,
    setWallpaperFolder,
    resetSettings
  }
}) 