// Main entry point for the StartX extension.

import { defaultSettings } from './config.js';
import { loadSettings } from './settings.js';
import { initAnimations } from './animations.js';
import { 
  initUI, 
  applyAllSettings,
  updateUIState,
  disableAutofillHistory
} from './ui.js';
import { initBookmarks } from './bookmarks.js';

// 添加全局调试功能
window.debugStartX = async () => {
  try {
    const settings = await loadSettings();
    console.log("当前设置状态:", settings);
    return settings;
  } catch (error) {
    console.error("获取设置失败:", error);
    return null;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 获取所有DOM元素
  const domElements = {
    // 搜索栏元素
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    searchContainer: document.querySelector('.search-container'),
    liquidEffect: document.querySelector('.liquid-glass-effect'),
    searchEdgeHighlight: document.querySelector('.search-edge-highlight'),
    
    // 设置面板元素
    settingsButton: document.getElementById('settings-button'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    resetSettings: document.getElementById('reset-settings'),
    
    // 设置选项卡
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.settings-tab-content'),
    
    // 背景设置元素
    bgPresets: document.querySelectorAll('.bg-preset'),
    bgUpload: document.getElementById('bg-upload'),
    removeCustomBg: document.getElementById('remove-custom-bg'),
    bgOpacity: document.getElementById('bg-opacity'),
    bgBlur: document.getElementById('bg-blur'),
    opacityValue: document.getElementById('opacity-value'),
    blurValue: document.getElementById('blur-value'),
    
    // 搜索栏设置元素
    searchWidth: document.getElementById('search-width'),
    searchHeight: document.getElementById('search-height'),
    searchRadius: document.getElementById('search-radius'),
    widthValue: document.getElementById('width-value'),
    heightValue: document.getElementById('height-value'),
    radiusValue: document.getElementById('radius-value'),
    
    // 玻璃效果设置元素
    glassOpacity: document.getElementById('glass-opacity'),
    glassBlur: document.getElementById('glass-blur'),
    glassOpacityValue: document.getElementById('glass-opacity-value'),
    glassBlurValue: document.getElementById('glass-blur-value'),
    
    // 文本设置元素
    textSize: document.getElementById('text-size'),
    textSizeValue: document.getElementById('text-size-value'),
    placeholderText: document.getElementById('placeholder-text'),
    
    // 书签搜索结果元素
    bookmarksResults: document.createElement('div'), // 将在初始化时添加到DOM
    bookmarksList: document.createElement('ul'), // 将在初始化时添加到DOM
    
    // 搜索引擎设置元素
    searchEngineBtns: document.querySelectorAll('.search-engine-btn'),
    
    // 强调色设置元素
    accentModeBtns: document.querySelectorAll('.accent-mode-btn'),
    customAccentColor: document.getElementById('custom-accent-color'),
    customSecondaryColor: document.getElementById('custom-secondary-color'),
    useCustomGradient: document.getElementById('use-custom-gradient'),
    gradientDirectionSelect: document.getElementById('gradient-direction'),
    primarySwatch: document.querySelector('.primary-swatch'),
    secondarySwatch: document.querySelector('.secondary-swatch'),
    tertiarySwatch: document.querySelector('.tertiary-swatch'),
    gradientSwatch: document.querySelector('.gradient-swatch'),
    
    // 主题设置元素
    themeModeBtns: document.querySelectorAll('.theme-mode-btn'),
    themePresetBtns: document.querySelectorAll('.theme-preset'),
    customThemeControls: document.querySelector('.custom-theme-controls')
  };

  // --- Initialization ---
  function init() {
    console.log("StartX 初始化...");

    // Show search bar immediately to reduce perceived load time
    domElements.searchContainer.classList.add('loaded');

    // 确保动画元素存在
    if (!domElements.liquidEffect) {
      console.warn("找不到液态玻璃效果元素，创建一个默认元素");
      domElements.liquidEffect = document.querySelector('.liquid-glass-effect');
    }
    
    if (!domElements.searchEdgeHighlight) {
      console.warn("找不到搜索栏高光边缘元素，创建一个默认元素");
      domElements.searchEdgeHighlight = document.querySelector('.search-edge-highlight');
    }
    
    // 创建书签搜索结果容器
    setupBookmarksResultsContainer(domElements);

    // Initialize UI event listeners and settings controls
    initUI(domElements);
    
    // Initialize animations and mouse-tracking effects
    initAnimations(
      domElements.searchInput, 
      domElements.searchButton, 
      domElements.searchContainer,
      domElements.liquidEffect,
      domElements.searchEdgeHighlight
    );
    
    // 初始化书签模块
    initBookmarks();

    // Defer non-critical setup until after the first paint
    requestAnimationFrame(() => {
      // Load settings and apply them
      loadSettings().then(settings => {
        console.log("设置加载完成:", settings);
        
        // 应用所有设置（背景、搜索栏和主题颜色）
        applyAllSettings(settings);
        
        // 更新UI状态
        updateUIState(settings, domElements);
        
        // 确保页面退出动画不影响背景
        document.addEventListener('page-exit', () => {
          // 保护背景元素，确保它们在退出动画中保持可见
          const bgGlow = document.querySelector('.bg-glow');
          const customBg = document.getElementById('custom-background');
          if (bgGlow) bgGlow.style.zIndex = '-1';
          if (customBg) customBg.style.zIndex = '-2';
        });
        
      }).catch(error => {
        console.error("加载设置时发生错误:", error);
        // Fallback to default settings on error
        const freshDefaultSettings = {...defaultSettings};
        applyAllSettings(freshDefaultSettings);
        updateUIState(freshDefaultSettings, domElements);
      });
      
      // Auto-focus the search input
      domElements.searchInput.focus();
    });
  }
  
  // 创建书签搜索结果容器
  function setupBookmarksResultsContainer(domElements) {
    // 创建书签结果容器
    domElements.bookmarksResults.className = 'bookmarks-results';
    
    // 创建书签列表
    domElements.bookmarksList.className = 'bookmarks-list';
    
    // 创建底部信息栏
    const footer = document.createElement('div');
    footer.className = 'bookmarks-footer';
    
    // 创建结果计数
    const count = document.createElement('div');
    count.className = 'bookmarks-count';
    count.textContent = '按 Tab 键选择，Enter 键打开';
    
    // 创建帮助文本
    const help = document.createElement('div');
    help.className = 'bookmarks-help';
    help.textContent = '书签搜索';
    
    // 组装DOM
    footer.appendChild(count);
    footer.appendChild(help);
    
    domElements.bookmarksResults.appendChild(domElements.bookmarksList);
    domElements.bookmarksResults.appendChild(footer);
    
    // 添加到搜索容器
    domElements.searchContainer.appendChild(domElements.bookmarksResults);
  }

  // Run initialization
  init();
}); 