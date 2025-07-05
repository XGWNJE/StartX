#!/usr/bin/env node

/**
 * This script builds the extension and prepares it for distribution.
 * It runs after the Vite build and copies necessary files to the dist folder.
 */

const fs = require('fs')
const path = require('path')

// Paths
const PUBLIC_DIR = path.resolve(__dirname, '../public')
const DIST_DIR = path.resolve(__dirname, '../dist')

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true })
}

// Files to copy from public to dist
const filesToCopy = [
  'manifest.json',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
]

console.log('🚀 Preparing extension for distribution...')

// Copy each file
filesToCopy.forEach(file => {
  const sourcePath = path.join(PUBLIC_DIR, file)
  const destPath = path.join(DIST_DIR, file)
  
  // Create directory if it doesn't exist
  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // Check if source file exists
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
    console.log(`✅ Copied ${file}`)
  } else {
    console.warn(`⚠️ Warning: ${file} not found in public directory`)
  }
})

console.log('\n🎉 Extension build complete!')
console.log('To load the extension in Chrome:')
console.log('1. Go to chrome://extensions/')
console.log('2. Enable "Developer mode"')
console.log('3. Click "Load unpacked" and select the dist folder')
console.log('\n') 