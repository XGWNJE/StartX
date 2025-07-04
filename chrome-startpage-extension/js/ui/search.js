// 搜索栏相关模块
import { searchBookmarks, getBookmarkIconUrl, formatBookmarkPath } from '../bookmarks.js';

/**
 * 应用搜索栏设置
 * @param {Object} settings - 用户设置
 */
export function applySearchSettings(settings) {
  console.log("应用搜索栏设置:", 
    settings.searchWidth, settings.searchHeight, settings.searchRadius,
    settings.glassOpacity, settings.glassBlur,
    settings.textSize, settings.placeholder);
    
  // 设置CSS变量
  document.documentElement.style.setProperty('--search-bar-width', `${settings.searchWidth}px`);
  document.documentElement.style.setProperty('--search-bar-height', `${settings.searchHeight}px`);
  document.documentElement.style.setProperty('--search-bar-border-radius', `${settings.searchRadius}px`);
  document.documentElement.style.setProperty('--glass-opacity', settings.glassOpacity / 100);
  document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
  document.documentElement.style.setProperty('--text-size', `${settings.textSize}px`);
  
  // 设置搜索框占位符
  document.getElementById('search-input').placeholder = settings.placeholder || '｜';
  
  // 强制应用边框半径到所有相关元素，确保一致性
  const elements = document.querySelectorAll('.search-background, .liquid-glass-effect, .search-edge-highlight, .search-bar');
  elements.forEach(el => {
    if (el) el.style.borderRadius = `${settings.searchRadius}px`;
  });
  
  // 强制触发重绘
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
    // 临时添加一个类，然后移除，强制浏览器重新计算布局
    searchContainer.classList.add('force-repaint');
    void searchContainer.offsetHeight; // 触发回流
    searchContainer.classList.remove('force-repaint');
  }
}

// 书签搜索相关变量
let currentBookmarks = [];
let selectedBookmarkIndex = -1;
let searchTimeout = null;
const SEARCH_DELAY = 300; // 搜索延迟时间，避免频繁请求
let searchActive = false; // 跟踪搜索栏是否处于活动状态

/**
 * 处理书签搜索
 * @param {HTMLInputElement} searchInput - 搜索输入框
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 * @param {HTMLElement} bookmarksList - 书签列表容器
 */
export function handleBookmarkSearch(searchInput, bookmarksResults, bookmarksList) {
  const query = searchInput.value.trim();
  
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // 如果查询为空，隐藏结果
  if (!query) {
    hideBookmarksResults(bookmarksResults);
    return;
  }
  
  // 设置延迟，避免频繁搜索
  searchTimeout = setTimeout(async () => {
    try {
      // 搜索书签
      const bookmarks = await searchBookmarks(query);
      currentBookmarks = bookmarks;
      
      // 更新结果列表
      updateBookmarksList(bookmarks, bookmarksList, bookmarksResults);
      
      // 重置选中项
      selectedBookmarkIndex = -1;
      
    } catch (error) {
      console.error("书签搜索出错:", error);
    }
  }, SEARCH_DELAY);
}

/**
 * 更新书签列表
 * @param {Array} bookmarks - 书签数组
 * @param {HTMLElement} bookmarksList - 书签列表容器
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 */
function updateBookmarksList(bookmarks, bookmarksList, bookmarksResults) {
  // 清空列表
  bookmarksList.innerHTML = '';
  
  // 更新结果计数
  const countElement = bookmarksResults.querySelector('.bookmarks-count');
  if (countElement) {
    countElement.textContent = bookmarks.length > 0 
      ? `找到 ${bookmarks.length} 个结果` 
      : '按 Tab 键选择，Enter 键打开';
  }
  
  // 如果没有结果
  if (bookmarks.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-bookmarks';
    noResults.textContent = '没有找到匹配的书签';
    bookmarksList.appendChild(noResults);
    bookmarksResults.classList.add('show');
    return;
  }
  
  // 创建结果项
  bookmarks.forEach((bookmark, index) => {
    const item = document.createElement('li');
    item.className = 'bookmark-item';
    item.setAttribute('data-index', index);
    item.setAttribute('data-url', bookmark.url);
    
    // 创建图标
    const icon = document.createElement('div');
    icon.className = 'bookmark-icon';
    icon.style.backgroundImage = `url(${getBookmarkIconUrl(bookmark.url)})`;
    
    // 创建信息容器
    const info = document.createElement('div');
    info.className = 'bookmark-info';
    
    // 创建标题
    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title || '无标题';
    
    // 创建URL
    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = bookmark.url;
    
    // 如果有路径，创建路径元素
    if (bookmark.path) {
      const path = document.createElement('div');
      path.className = 'bookmark-path';
      path.textContent = formatBookmarkPath(bookmark.path);
      info.appendChild(path);
    }
    
    // 组装DOM
    info.appendChild(title);
    info.appendChild(url);
    item.appendChild(icon);
    item.appendChild(info);
    
    // 添加点击事件
    item.addEventListener('click', () => {
      window.location.href = bookmark.url;
    });
    
    // 添加鼠标悬停事件
    item.addEventListener('mouseenter', () => {
      selectBookmark(index, bookmarksList);
    });
    
    bookmarksList.appendChild(item);
  });
  
  // 显示结果
  bookmarksResults.classList.add('show');
}

/**
 * 隐藏书签结果
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 */
export function hideBookmarksResults(bookmarksResults) {
  bookmarksResults.classList.remove('show');
  currentBookmarks = [];
  selectedBookmarkIndex = -1;
}

/**
 * 选择书签
 * @param {number} index - 书签索引
 * @param {HTMLElement} bookmarksList - 书签列表容器
 */
function selectBookmark(index, bookmarksList) {
  // 移除之前的选中状态
  const items = bookmarksList.querySelectorAll('.bookmark-item');
  items.forEach(item => item.classList.remove('selected'));
  
  // 设置新的选中状态
  selectedBookmarkIndex = index;
  
  // 如果有选中项
  if (selectedBookmarkIndex >= 0 && selectedBookmarkIndex < items.length) {
    const selectedItem = items[selectedBookmarkIndex];
    selectedItem.classList.add('selected');
    
    // 确保选中项可见
    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * 处理键盘导航
 * @param {KeyboardEvent} event - 键盘事件
 * @param {HTMLInputElement} searchInput - 搜索输入框
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 * @param {HTMLElement} bookmarksList - 书签列表容器
 */
export function handleKeyNavigation(event, searchInput, bookmarksResults, bookmarksList) {
  // 如果结果不可见，不处理
  if (!bookmarksResults.classList.contains('show')) {
    return;
  }
  
  const items = bookmarksList.querySelectorAll('.bookmark-item');
  
  switch (event.key) {
    case 'ArrowDown':
      // 向下选择
      event.preventDefault();
      if (selectedBookmarkIndex < items.length - 1) {
        selectBookmark(selectedBookmarkIndex + 1, bookmarksList);
      }
      break;
      
    case 'ArrowUp':
      // 向上选择
      event.preventDefault();
      if (selectedBookmarkIndex > 0) {
        selectBookmark(selectedBookmarkIndex - 1, bookmarksList);
      }
      break;
      
    case 'Tab':
      // Tab键循环选择
      event.preventDefault();
      if (items.length > 0) {
        const newIndex = (selectedBookmarkIndex + 1) % items.length;
        selectBookmark(newIndex, bookmarksList);
      }
      break;
      
    case 'Enter':
      // 打开选中的书签
      if (selectedBookmarkIndex >= 0 && selectedBookmarkIndex < items.length) {
        event.preventDefault();
        const url = items[selectedBookmarkIndex].getAttribute('data-url');
        if (url) {
          window.location.href = url;
        }
      }
      break;
      
    case 'Escape':
      // 关闭结果
      event.preventDefault();
      hideBookmarksResults(bookmarksResults);
      break;
  }
}

/**
 * 激活搜索栏
 * @param {HTMLElement} searchContainer - 搜索容器
 * @param {HTMLInputElement} searchInput - 搜索输入框
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 * @param {HTMLElement} bookmarksList - 书签列表容器
 */
export function activateSearch(searchContainer, searchInput, bookmarksResults, bookmarksList) {
  if (searchActive) return;
  
  searchActive = true;
  searchContainer.classList.add('active');
  
  // 添加平滑过渡动画
  document.body.classList.add('search-active');
  
  // 如果有输入内容，显示书签结果
  if (searchInput.value.trim()) {
    handleBookmarkSearch(searchInput, bookmarksResults, bookmarksList);
  }
  
  // 聚焦输入框
  setTimeout(() => {
    searchInput.focus();
  }, 50);
}

/**
 * 停用搜索栏
 * @param {HTMLElement} searchContainer - 搜索容器
 * @param {HTMLElement} bookmarksResults - 书签结果容器
 */
export function deactivateSearch(searchContainer, bookmarksResults) {
  if (!searchActive) return;
  
  searchActive = false;
  searchContainer.classList.remove('active');
  document.body.classList.remove('search-active');
  
  // 延迟隐藏结果，以便可以点击结果
  setTimeout(() => {
    hideBookmarksResults(bookmarksResults);
  }, 200);
}

/**
 * 禁用浏览器自动填充和历史记录
 * @param {HTMLInputElement} searchInput - 搜索输入框
 */
export function disableAutofillHistory(searchInput) {
  searchInput.setAttribute('autocomplete', 'off');
  searchInput.setAttribute('spellcheck', 'false');
  searchInput.setAttribute('data-form-type', 'other');
  searchInput.value = '';
  searchInput.addEventListener('focus', () => {
    setTimeout(() => {
      if (searchInput.value !== '') {
        searchInput.value = '';
      }
    }, 10);
  });
} 