<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useBookmarkStore } from '@/stores/bookmark'
import BookmarkList from './BookmarkList.vue'

const settingsStore = useSettingsStore()
const bookmarkStore = useBookmarkStore()
const searchQuery = ref('')
const showEngineDropdown = ref(false)
const showBookmarkResults = ref(false)

// Update bookmark search query when our search query changes
watch(searchQuery, (newValue) => {
  bookmarkStore.setSearchQuery(newValue)
  showBookmarkResults.value = newValue.length > 0
})

const handleSearch = () => {
  if (!searchQuery.value) return
  
  // Check if input is a URL
  const isUrl = /^(https?:\/\/|www\.)/i.test(searchQuery.value)
  
  if (isUrl) {
    // If it's a URL, navigate directly
    let url = searchQuery.value
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
  } else {
    // Otherwise, use search engine
    const searchUrl = `${settingsStore.activeEngine.url}${encodeURIComponent(searchQuery.value)}`
    window.open(searchUrl, '_blank')
  }
}

const selectEngine = (engine: typeof settingsStore.searchEngines[0]) => {
  settingsStore.setSearchEngine(engine)
  showEngineDropdown.value = false
}

const handleInput = () => {
  showBookmarkResults.value = searchQuery.value.length > 0
}

const selectBookmark = (url: string) => {
  window.open(url, '_blank')
  searchQuery.value = ''
  showBookmarkResults.value = false
}
</script>

<template>
  <div class="search-container">
    <div class="search-box">
      <!-- Search engine selector -->
      <div class="search-engine-selector">
        <div 
          class="selected-engine"
          @click="showEngineDropdown = !showEngineDropdown"
        >
          {{ settingsStore.activeEngine.name }}
        </div>
        
        <div class="engine-dropdown" v-if="showEngineDropdown">
          <div 
            v-for="engine in settingsStore.searchEngines" 
            :key="engine.name"
            class="engine-option"
            @click="selectEngine(engine)"
          >
            {{ engine.name }}
          </div>
        </div>
      </div>
      
      <!-- Search input -->
      <input
        type="text"
        class="search-input"
        v-model="searchQuery"
        @input="handleInput"
        @keyup.enter="handleSearch"
        placeholder="Search or enter URL"
        autocomplete="off"
      />
      
      <!-- Search button -->
      <button class="search-button" @click="handleSearch">
        🔍
      </button>
    </div>
    
    <!-- Bookmark results with keyboard navigation -->
    <BookmarkList
      :bookmarks="bookmarkStore.filteredBookmarks"
      :visible="showBookmarkResults"
      @select="selectBookmark"
    />
  </div>
</template>

<style scoped lang="scss">
.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  z-index: 10;
}

.search-box {
  display: flex;
  height: 50px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.search-engine-selector {
  position: relative;
  width: 100px;
  
  .selected-engine {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: 500;
    background: rgba(0, 0, 0, 0.05);
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
  
  .engine-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border-radius: 0 0 10px 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    
    .engine-option {
      padding: 10px;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 15px;
  font-size: 16px;
}

.search-button {
  width: 50px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}
</style> 