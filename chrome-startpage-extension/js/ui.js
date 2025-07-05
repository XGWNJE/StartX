// UI模块导出文件 - 重构后的版本
// 从各个子模块导入需要的功能

import { initUI } from './ui/index.js';
import { applyBackgroundSettings, initWallpaperManager } from './ui/background.js';
import { applySearchSettings, handleBookmarkSearch, hideBookmarksResults, handleKeyNavigation, disableAutofillHistory } from './ui/search.js';
import { applyThemeSettings } from './ui/theme.js';
import { applyAccentColors, updateColorSwatches } from './ui/accent.js';
import { updateUIState, handleSettingsChange, applyAllSettings } from './ui/state.js';
import { loadSettings } from './settings.js';
import { initEvents } from './ui/events.js';
import { initState } from './ui/state.js';
import { initSearch } from './ui/search.js';
import { initTheme } from './ui/theme.js';
import { initAccent } from './ui/accent.js';
import { adaptSettingsButtonContrast } from './ui/utils.js';

// 导出所有需要的函数，保持向后兼容性
export {
  initUI,
  applyBackgroundSettings,
  applySearchSettings,
  applyThemeSettings,
  applyAccentColors,
  updateColorSwatches,
  updateUIState,
  handleSettingsChange,
  applyAllSettings,
  handleBookmarkSearch,
  hideBookmarksResults,
  handleKeyNavigation,
  disableAutofillHistory
};

/**
 * 初始化UI应用
 */
export async function initUIApp() {
  try {
    console.log("开始初始化UI应用...");
    
    // 获取DOM元素
    const domElements = collectDOMElements();
    
    // 初始化状态管理
    await initState(domElements);
    
    // 尝试初始化壁纸管理器，但不阻止其他功能初始化
    try {
      await initWallpaperManager(domElements);
    } catch (error) {
      console.error("壁纸管理器初始化失败:", error);
      // 继续初始化其他功能
    }
    
    // 初始化搜索功能
    await initSearch(domElements);
    
    // 初始化主题
    await initTheme(domElements);
    
    // 初始化强调色
    await initAccent(domElements);
    
    // 初始化事件监听
    initEvents(domElements);
    
    // 初始化设置按钮自适应对比度
    adaptSettingsButtonContrast();
    
    // 标记页面已加载完成
    document.body.classList.add('loaded');
    
    console.log("UI应用初始化完成");
  } catch (error) {
    console.error("UI应用初始化失败:", error);
    // 确保页面至少可以显示
    document.body.classList.add('loaded');
    document.body.classList.add('bg-default');
  }
}

/**
 * 收集所有DOM元素
 * @returns {Object} DOM元素对象
 */
function collectDOMElements() {
  // 创建书签相关元素
  const bookmarksResults = document.createElement('div');
  bookmarksResults.className = 'bookmarks-results';
  
  const bookmarksList = document.createElement('ul');
  bookmarksList.className = 'bookmarks-list';
  
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
  
  bookmarksResults.appendChild(bookmarksList);
  bookmarksResults.appendChild(footer);
  
  // 添加到搜索容器
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
    searchContainer.appendChild(bookmarksResults);
    // 显示搜索栏以减少感知加载时间
    searchContainer.classList.add('loaded');
  }
  
  return {
    // 搜索栏元素
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    searchContainer,
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
    bookmarksResults,
    bookmarksList,
    
    // 搜索引擎设置元素
    searchEngineBtns: document.querySelectorAll('.search-engine-btn'),
    
    // 强调色设置元素
    accentModeBtns: document.querySelectorAll('.accent-mode-btn'),
    
    // 主题设置元素
    themeModeBtns: document.querySelectorAll('.theme-mode-btn'),
    themePresetBtns: document.querySelectorAll('.theme-preset'),
    customThemeControls: document.querySelector('.custom-theme-controls'),
    
    // 壁纸管理元素
    selectWallpaperFolder: document.getElementById('select-wallpaper-folder'),
    addWallpaper: document.getElementById('add-wallpaper'),
    loadWallpapers: document.getElementById('load-wallpapers'),
    wallpaperHistoryGrid: document.getElementById('wallpaper-history-grid')
  };
}