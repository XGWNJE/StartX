import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getBookmarks } from '@/utils/browser-api'

interface Bookmark {
  title: string
  url: string
}

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<Bookmark[]>([])
  const isLoading = ref(false)
  const searchQuery = ref('')
  
  // Filtered bookmarks based on search query
  const filteredBookmarks = computed(() => {
    if (!searchQuery.value) return []
    
    const query = searchQuery.value.toLowerCase()
    return bookmarks.value.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query)
    )
  })
  
  // Load bookmarks from browser API
  const loadBookmarks = async () => {
    isLoading.value = true
    
    try {
      bookmarks.value = await getBookmarks()
      console.log(`Loaded ${bookmarks.value.length} bookmarks`)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Set search query
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }
  
  // Clear search query
  const clearSearchQuery = () => {
    searchQuery.value = ''
  }
  
  // Initialize - load bookmarks
  loadBookmarks()
  
  return {
    bookmarks,
    isLoading,
    searchQuery,
    filteredBookmarks,
    loadBookmarks,
    setSearchQuery,
    clearSearchQuery
  }
}) 