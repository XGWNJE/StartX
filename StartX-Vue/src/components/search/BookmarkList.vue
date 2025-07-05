<script setup lang="ts">
import { ref, toRefs, onMounted, onUnmounted } from 'vue'

interface Bookmark {
  title: string
  url: string
}

const props = defineProps<{
  bookmarks: Bookmark[]
  visible: boolean
}>()

const { bookmarks, visible } = toRefs(props)

const emit = defineEmits<{
  (e: 'select', url: string): void
}>()

const selectedIndex = ref(-1)

const selectBookmark = (url: string) => {
  emit('select', url)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!visible.value || bookmarks.value.length === 0) return
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % bookmarks.value.length
      scrollToSelected()
      break
      
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = selectedIndex.value <= 0 
        ? bookmarks.value.length - 1 
        : selectedIndex.value - 1
      scrollToSelected()
      break
      
    case 'Enter':
      if (selectedIndex.value >= 0) {
        selectBookmark(bookmarks.value[selectedIndex.value].url)
      }
      break
      
    case 'Escape':
      // Reset selection
      selectedIndex.value = -1
      break
  }
}

const scrollToSelected = () => {
  if (selectedIndex.value >= 0) {
    const element = document.getElementById(`bookmark-item-${selectedIndex.value}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="bookmark-results" v-if="visible && bookmarks.length > 0">
    <div
      v-for="(bookmark, index) in bookmarks"
      :id="`bookmark-item-${index}`"
      :key="index"
      class="bookmark-item"
      :class="{ selected: index === selectedIndex }"
      @click="selectBookmark(bookmark.url)"
      @mouseover="selectedIndex = index"
    >
      <div class="bookmark-icon">🔖</div>
      <div class="bookmark-title">{{ bookmark.title }}</div>
      <div class="bookmark-url">{{ bookmark.url }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bookmark-results {
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.bookmark-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover, &.selected {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &.selected {
    border-left: 3px solid #41b883;
  }
}

.bookmark-icon {
  color: #666;
  font-size: 16px;
}

.bookmark-title {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-url {
  color: #666;
  font-size: 12px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .bookmark-url {
    display: none;
  }
}
</style> 