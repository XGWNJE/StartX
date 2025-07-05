/**
 * Browser API utilities for extension functionality
 * This provides an abstraction layer for Chrome/Firefox extensions
 */

// Check if we're running in a browser extension context
const isExtension = (): boolean => {
  return typeof chrome !== 'undefined' && typeof chrome.bookmarks !== 'undefined'
}

// Get all bookmarks
export const getBookmarks = async (): Promise<{ title: string; url: string }[]> => {
  if (!isExtension()) {
    console.warn('Not running in extension context, returning mock bookmarks')
    // Return mock bookmarks for non-extension development
    return [
      { title: 'GitHub', url: 'https://github.com' },
      { title: 'Vue.js', url: 'https://vuejs.org' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }
    ]
  }
  
  try {
    // Chrome bookmarks API
    const bookmarkTree = await chrome.bookmarks.getTree()
    return flattenBookmarkTree(bookmarkTree)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return []
  }
}

// Recursively flatten bookmark tree into an array of bookmarks
const flattenBookmarkTree = (bookmarkItems: chrome.bookmarks.BookmarkTreeNode[]): { title: string; url: string }[] => {
  let bookmarks: { title: string; url: string }[] = []
  
  for (const item of bookmarkItems) {
    if (item.url) {
      bookmarks.push({
        title: item.title,
        url: item.url
      })
    }
    
    if (item.children) {
      bookmarks = bookmarks.concat(flattenBookmarkTree(item.children))
    }
  }
  
  return bookmarks
}

// Storage API
export const getBrowserStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  if (!isExtension()) {
    // If not in extension context, use localStorage
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  }
  
  try {
    // Chrome storage API
    const result = await chrome.storage.sync.get(key)
    return result[key] !== undefined ? result[key] : defaultValue
  } catch (error) {
    console.error('Error reading from storage:', error)
    return defaultValue
  }
}

export const setBrowserStorage = async <T>(key: string, value: T): Promise<void> => {
  if (!isExtension()) {
    // If not in extension context, use localStorage
    localStorage.setItem(key, JSON.stringify(value))
    return
  }
  
  try {
    // Chrome storage API
    await chrome.storage.sync.set({ [key]: value })
  } catch (error) {
    console.error('Error writing to storage:', error)
  }
}

// Returns true if browser extension APIs are available
export const hasBrowserAPIs = isExtension 