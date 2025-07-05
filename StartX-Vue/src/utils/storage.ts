/**
 * Storage utility for saving and loading settings
 */

// Storage keys
const STORAGE_KEYS = {
  THEME: 'startx-theme',
  WALLPAPERS: 'startx-wallpapers',
  CURRENT_WALLPAPER: 'startx-current-wallpaper',
  WALLPAPER_FOLDER: 'startx-wallpaper-folder',
  SEARCH_ENGINE: 'startx-search-engine',
  SEARCH_BAR_SIZE: 'startx-search-bar-size',
  BOOKMARKS: 'startx-bookmarks',
}

// Save a value to localStorage
export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error)
  }
}

// Load a value from localStorage
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (error) {
    console.error(`Error loading from localStorage: ${key}`, error)
    return defaultValue
  }
}

// Clear all settings from localStorage
export const clearStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Error clearing localStorage', error)
  }
}

// Export storage keys
export { STORAGE_KEYS } 