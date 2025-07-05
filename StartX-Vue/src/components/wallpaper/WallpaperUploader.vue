<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const showUploader = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const selectedFile = ref<File | null>(null)
const imagePreview = ref('')

const toggleUploader = () => {
  showUploader.value = !showUploader.value
}

const handleFileChange = (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  if (fileInput.files && fileInput.files.length > 0) {
    selectedFile.value = fileInput.files[0]
    
    // Create image preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(selectedFile.value)
  }
}

const uploadWallpaper = async () => {
  if (!selectedFile.value) return
  
  try {
    isUploading.value = true
    uploadProgress.value = 0
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      uploadProgress.value += 10
      if (uploadProgress.value >= 100) {
        clearInterval(progressInterval)
      }
    }, 200)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real extension, this would save to local storage or the file system
    // For now, we'll just use the data URL
    if (imagePreview.value) {
      settingsStore.addWallpaper(imagePreview.value)
      settingsStore.setCurrentWallpaper(imagePreview.value)
    }
    
    // Reset form
    selectedFile.value = null
    imagePreview.value = ''
    isUploading.value = false
    showUploader.value = false
    uploadProgress.value = 0
    
  } catch (error) {
    console.error('Error uploading wallpaper:', error)
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const cancelUpload = () => {
  selectedFile.value = null
  imagePreview.value = ''
  showUploader.value = false
  uploadProgress.value = 0
}
</script>

<template>
  <div>
    <button class="upload-toggle" @click="toggleUploader">
      + Add Wallpaper
    </button>
    
    <div class="wallpaper-uploader" v-if="showUploader">
      <div class="uploader-header">
        <h3>Upload Wallpaper</h3>
        <button class="close-button" @click="toggleUploader">×</button>
      </div>
      
      <div class="uploader-content">
        <div 
          class="drop-area" 
          :class="{ 'has-preview': imagePreview }"
          @dragover.prevent
          @drop.prevent="handleFileChange"
        >
          <template v-if="imagePreview">
            <img :src="imagePreview" alt="Wallpaper preview" class="image-preview" />
          </template>
          <template v-else>
            <p>Drag & drop image here<br>or</p>
            <input 
              type="file" 
              id="wallpaper-file" 
              accept="image/*" 
              @change="handleFileChange"
              class="file-input"
            />
            <label for="wallpaper-file" class="file-label">Select File</label>
          </template>
        </div>
        
        <div class="progress-bar" v-if="isUploading">
          <div class="progress" :style="{ width: `${uploadProgress}%` }"></div>
          <span>{{ uploadProgress }}%</span>
        </div>
        
        <div class="button-group">
          <button 
            class="upload-button" 
            @click="uploadWallpaper"
            :disabled="!selectedFile || isUploading"
          >
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
          <button class="cancel-button" @click="cancelUpload">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.upload-toggle {
  background: rgba(65, 184, 131, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: rgba(65, 184, 131, 1);
    transform: scale(1.05);
  }
}

.wallpaper-uploader {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
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

.uploader-content {
  padding: 20px;
}

.drop-area {
  height: 200px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  
  &.has-preview {
    border-style: solid;
    border-color: #41b883;
  }
  
  p {
    color: #666;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .file-input {
    display: none;
  }
  
  .file-label {
    background: #f5f5f5;
    color: #333;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #eee;
    }
  }
  
  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.progress-bar {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  margin-bottom: 20px;
  position: relative;
  
  .progress {
    height: 100%;
    background: #41b883;
    border-radius: 3px;
    transition: width 0.2s ease;
  }
  
  span {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: 12px;
    color: #666;
  }
}

.button-group {
  display: flex;
  gap: 10px;
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .upload-button {
    background: #41b883;
    color: white;
    flex: 1;
    
    &:hover:not(:disabled) {
      background: #34a574;
    }
  }
  
  .cancel-button {
    background: #f5f5f5;
    color: #333;
    
    &:hover {
      background: #eee;
    }
  }
}
</style> 