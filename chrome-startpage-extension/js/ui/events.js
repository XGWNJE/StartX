// 事件处理模块
import { loadSettings, saveSettings } from '../settings.js';
import { searchEngines, defaultSettings, themePresets } from '../config.js';
import { handleSettingsChange } from './state.js';
import { 
  processBackgroundImage, 
  loadWallpaperHistory, 
  applyWallpaperFromHistory, 
  deleteWallpaperFromHistory,
  nextWallpaper,
  previousWallpaper,
  startWallpaperAutoChange,
  stopWallpaperAutoChange,
  importWallpapersFromFolder,
  saveWallpaperToSystem,
  getWallpaperFolderPath,
  getWallpaperFolderName,
  setWallpaperFolderName,
  createWallpaperFolder,
  importWallpaperFromFile
} from './background.js';
import { 
  handleBookmarkSearch, 
  hideBookmarksResults, 
  handleKeyNavigation, 
  disableAutofillHistory,
  activateSearch,
  deactivateSearch
} from './search.js';

/**
 * 初始化UI事件
 * @param {Object} domElements - DOM元素对象
 */
export function initEvents(domElements) {
  const {
    searchInput, searchButton, searchContainer,
    settingsButton, settingsPanel, closeSettings, resetSettings,
    tabButtons, tabContents,
    bgPresets, bgUpload, removeCustomBg, bgOpacity, bgBlur, opacityValue, blurValue,
    searchWidth, searchHeight, searchRadius, widthValue, heightValue, radiusValue,
    glassOpacity, glassBlur, glassOpacityValue, glassBlurValue,
    textSize, textSizeValue,
    placeholderText,
    bookmarksResults, bookmarksList,
    accentModeBtns, customAccentColor, customSecondaryColor, useCustomGradient, gradientDirectionSelect,
    primarySwatch, secondarySwatch, tertiarySwatch, gradientSwatch,
    themeModeBtns, themePresetBtns, customThemeControls,
    searchEngineBtns,
    prevWallpaper, nextWallpaper, autoChangeWallpaper, autoChangeInterval,
    wallpaperHistoryGrid,
    wallpaperFolderPath,
    saveWallpaperFolder
  } = domElements;

  // --- 搜索栏事件 ---
  
  // 搜索输入框事件
  searchInput.addEventListener('input', () => {
    handleBookmarkSearch(searchInput, bookmarksResults, bookmarksList);
  });
  
  // 搜索框聚焦事件
  searchInput.addEventListener('focus', () => {
    activateSearch(searchContainer, searchInput, bookmarksResults, bookmarksList);
  });
  
  // 搜索框失焦事件
  searchInput.addEventListener('blur', (e) => {
    // 检查是否点击了结果列表
    if (!bookmarksResults.contains(e.relatedTarget)) {
      deactivateSearch(searchContainer, bookmarksResults);
    }
  });
  
  // 键盘导航
  searchInput.addEventListener('keydown', (e) => {
    handleKeyNavigation(e, searchInput, bookmarksResults, bookmarksList);
  });
  
  // 搜索按钮点击事件
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      // 获取当前设置的搜索引擎
      loadSettings().then(settings => {
        const engineName = settings.searchEngine || 'google';
        const engine = searchEngines[engineName];
        if (engine) {
          const searchUrl = engine.url.replace('{query}', encodeURIComponent(query));
          window.location.href = searchUrl;
        } else {
          // 默认使用Google
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }).catch(err => {
        console.error("获取搜索引擎设置失败:", err);
        // 默认使用Google
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      });
    }
  });
  
  // 点击页面其他地方关闭结果
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target) && bookmarksResults.classList.contains('show')) {
      deactivateSearch(searchContainer, bookmarksResults);
    }
  });

  // 添加快捷键支持 - 按下 / 键激活搜索
  document.addEventListener('keydown', (e) => {
    // 如果按下 / 键且不在输入框中
    if (e.key === '/' && document.activeElement !== searchInput && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); // 阻止默认行为（在某些浏览器中输入 /）
      activateSearch(searchContainer, searchInput, bookmarksResults, bookmarksList);
    }
    
    // 按下 Escape 键关闭搜索
    if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
      deactivateSearch(searchContainer, bookmarksResults);
    }
  });

  // --- 通用设置事件 ---
  settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.add('show');
  });
  
  closeSettings.addEventListener('click', () => settingsPanel.classList.remove('show'));

  resetSettings.addEventListener('click', async () => {
    if (confirm('确定要恢复所有默认设置吗？')) {
      try {
        console.log("重置所有设置为默认值");
        
        // 创建默认设置的副本
        const defaultSettingsCopy = { ...defaultSettings };
        
        // 应用所有默认设置
        await handleSettingsChange(defaultSettingsCopy, domElements);
        
        console.log("所有设置已重置为默认值");
      } catch (error) {
        console.error("重置设置时出错:", error);
        alert("重置设置失败，请重试。");
      }
    }
  });
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  document.addEventListener('click', (e) => {
    if (settingsPanel.classList.contains('show') && !settingsPanel.contains(e.target) && e.target !== settingsButton && !settingsButton.contains(e.target)) {
      settingsPanel.classList.remove('show');
    }
  });

  // --- 强调色设置事件 ---
  if (accentModeBtns) {
    // 强调色现在只有自动匹配模式，无需添加点击事件
    console.log("强调色仅支持自动匹配模式");
  } else {
    console.warn("initEvents: accentModeBtns不存在");
  }
  
  // 移除了所有与自定义强调色相关的事件处理

  // --- 背景设置事件 ---
  bgPresets.forEach(preset => {
    preset.addEventListener('click', async () => {
      try {
        // 获取预设名称
        const bgName = preset.getAttribute('data-bg');
        console.log(`点击预设背景: ${bgName}`);
        
        // 创建新的设置对象
        const newSettings = {
          bgType: bgName === 'default' ? 'default' : 'preset',
          presetName: bgName,
          customBgData: null, // 清除自定义背景
          accentColorMode: 'auto' // 预设背景时自动应用强调色
        };
        
        // 应用设置
        await handleSettingsChange(newSettings, domElements);
        
        // 刷新壁纸历史
        const updatedHistory = await loadWallpaperHistory();
        renderWallpaperHistory(updatedHistory, 0, wallpaperHistoryGrid);
        
        console.log("背景设置已成功应用");
      } catch (error) {
        console.error("应用预设背景时出错:", error);
        alert("应用预设背景失败，请重试。");
      }
    });
  });
  
  bgOpacity.addEventListener('input', async () => {
    try {
      const value = parseInt(bgOpacity.value);
      opacityValue.textContent = `${value}%`;
      
      // 更新不透明度设置
      const newSettings = {
        opacity: value
      };
      
      // 直接应用背景设置
      document.documentElement.style.setProperty('--bg-opacity', value / 100);
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新背景不透明度时出错:", error);
    }
  });
  
  bgBlur.addEventListener('input', async () => {
    try {
      const value = parseInt(bgBlur.value);
      blurValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        blur: value
      };
      
      // 直接应用背景设置
      document.documentElement.style.setProperty('--bg-blur', `${value}px`);
      
      // 强制触发重绘，确保模糊效果立即生效
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        // 强制回流和重绘
        searchContainer.classList.add('force-repaint');
        void searchContainer.offsetHeight;
        searchContainer.classList.remove('force-repaint');
      }
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新背景模糊度时出错:", error);
    }
  });
  
  // --- 搜索栏设置事件 ---
  searchWidth.addEventListener('input', async () => {
    try {
      const value = parseInt(searchWidth.value);
      widthValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        searchWidth: value
      };
      
      // 直接应用设置，强制刷新DOM
      document.documentElement.style.setProperty('--search-bar-width', `${value}px`);
      
      // 触发重绘
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        void searchContainer.offsetHeight;
      }
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新搜索栏宽度时出错:", error);
    }
  });
  
  searchHeight.addEventListener('input', async () => {
    try {
      const value = parseInt(searchHeight.value);
      heightValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        searchHeight: value
      };
      
      // 直接应用设置，强制刷新DOM
      document.documentElement.style.setProperty('--search-bar-height', `${value}px`);
      
      // 触发重绘
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        void searchContainer.offsetHeight;
      }
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新搜索栏高度时出错:", error);
    }
  });
  
  searchRadius.addEventListener('input', async () => {
    try {
      const value = parseInt(searchRadius.value);
      radiusValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        searchRadius: value
      };
      
      // 直接应用设置，强制刷新DOM
      document.documentElement.style.setProperty('--search-bar-border-radius', `${value}px`);
      
      // 同时更新所有依赖于边框半径的元素，确保一致性
      const elements = document.querySelectorAll('.search-background, .liquid-glass-effect, .search-edge-highlight, .search-bar');
      elements.forEach(el => {
        if (el) el.style.borderRadius = `${value}px`;
      });
      
      // 触发重绘
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        void searchContainer.offsetHeight;
      }
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新搜索栏圆角时出错:", error);
    }
  });
  
  glassOpacity.addEventListener('input', async () => {
    try {
      const value = parseInt(glassOpacity.value);
      glassOpacityValue.textContent = (value / 100).toFixed(2);
      
      // 更新设置
      const newSettings = {
        glassOpacity: value
      };
      
      // 直接应用设置
      document.documentElement.style.setProperty('--glass-opacity', value / 100);
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新玻璃效果透明度时出错:", error);
    }
  });
  
  glassBlur.addEventListener('input', async () => {
    try {
      const value = parseInt(glassBlur.value);
      glassBlurValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        glassBlur: value
      };
      
      // 直接应用设置
      document.documentElement.style.setProperty('--glass-blur', `${value}px`);
      
      // 强制触发重绘，确保模糊效果立即生效
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        // 强制回流和重绘
        searchContainer.classList.add('force-repaint');
        void searchContainer.offsetHeight;
        searchContainer.classList.remove('force-repaint');
      }
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新玻璃效果模糊度时出错:", error);
    }
  });
  
  textSize.addEventListener('input', async () => {
    try {
      const value = parseInt(textSize.value);
      textSizeValue.textContent = `${value}px`;
      
      // 更新设置
      const newSettings = {
        textSize: value
      };
      
      // 直接应用设置
      document.documentElement.style.setProperty('--text-size', `${value}px`);
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新文本大小时出错:", error);
    }
  });
  
  placeholderText.addEventListener('change', async () => {
    try {
      const value = placeholderText.value;
      
      // 更新设置
      const newSettings = {
        placeholder: value
      };
      
      // 直接应用设置
      document.getElementById('search-input').placeholder = value || '｜';
      
      // 保存设置
      await handleSettingsChange(newSettings, domElements);
    } catch (error) {
      console.error("更新占位符文本时出错:", error);
    }
  });

  // --- 搜索引擎设置事件 ---
  if (searchEngineBtns) {
    searchEngineBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          // 获取搜索引擎名称
          const engineName = btn.getAttribute('data-engine');
          console.log(`选择搜索引擎: ${engineName}`);
          
          // 确保搜索引擎名称是有效的
          if (!searchEngines || !searchEngines[engineName]) {
            console.error(`搜索引擎 "${engineName}" 在配置中不存在`);
            alert(`搜索引擎 "${engineName}" 不存在，请联系开发者。`);
            return;
          }
          
          // 创建新的设置对象
          const newSettings = {
            searchEngine: engineName
          };
          
          // 应用设置
          await handleSettingsChange(newSettings, domElements);
          
          console.log(`搜索引擎已设置为: ${engineName}`);
        } catch (error) {
          console.error("设置搜索引擎时出错:", error);
          alert("设置搜索引擎失败，请重试。");
        }
      });
    });
  } else {
    console.warn("initEvents: searchEngineBtns不存在，无法绑定搜索引擎事件");
  }

  // --- 主题颜色设置事件 ---
  if (themeModeBtns) {
    themeModeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const modeName = btn.getAttribute('data-mode');
          console.log(`切换主题模式: ${modeName}`);
          
          // 创建新的设置对象
          const newSettings = {
            themeMode: modeName
          };
          
          // 应用设置
          await handleSettingsChange(newSettings, domElements);
          
          console.log("主题模式已更新");
        } catch (error) {
          console.error("更新主题模式时出错:", error);
          alert("更新主题模式失败，请重试。");
        }
      });
    });
  } else {
    console.warn("initEvents: themeModeBtns不存在，无法绑定主题模式事件");
  }
  
  // 主题预设选择事件
  if (themePresetBtns) {
    themePresetBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const presetName = btn.getAttribute('data-theme');
          console.log(`选择主题预设: ${presetName}`);
          
          // 创建新的设置对象
          const newSettings = {
            themeMode: 'preset',
            themePreset: presetName
          };
          
          // 应用设置
          await handleSettingsChange(newSettings, domElements);
          
          console.log("主题预设已更新");
        } catch (error) {
          console.error("更新主题预设时出错:", error);
          alert("更新主题预设失败，请重试。");
        }
      });
    });
  } else {
    console.warn("initEvents: themePresetBtns不存在，无法绑定主题预设事件");
  }
  
  // 自定义主题颜色更改事件
  if (customThemeControls) {
    customThemeControls.querySelectorAll('input[type="color"]').forEach(input => {
      input.addEventListener('input', async () => {
        try {
          const colorType = input.getAttribute('data-color-type');
          const color = input.value;
          console.log(`自定义主题颜色更改 (${colorType}): ${color}`);
          
          // 获取当前设置
          const currentSettings = await loadSettings();
          
          // 确保customThemeColors对象存在
          if (!currentSettings.customThemeColors) {
            if (themePresets && themePresets.dark && themePresets.dark.colors) {
              currentSettings.customThemeColors = { ...themePresets.dark.colors };
            } else {
              console.warn("themePresets.dark.colors不存在，使用默认颜色");
              currentSettings.customThemeColors = {
                background: '#121212',
                surface: '#1e1e1e',
                text: '#ffffff',
                textSecondary: '#b0b0b0',
                border: '#333333'
              };
            }
          }
          
          // 创建新的设置对象
          const newSettings = {
            themeMode: 'custom',
            customThemeColors: {
              ...currentSettings.customThemeColors,
              [colorType]: color
            }
          };
          
          // 应用设置
          await handleSettingsChange(newSettings, domElements);
          
          console.log(`自定义主题颜色 (${colorType}) 已更新`);
        } catch (error) {
          console.error("更新自定义主题颜色时出错:", error);
        }
      });
    });
  } else {
    console.warn("initEvents: customThemeControls不存在，无法绑定自定义主题颜色事件");
  }

  // 禁用自动填充历史记录
  disableAutofillHistory(searchInput);
  
  // 初始化壁纸历史
  initWallpaperHistory(domElements);
}

/**
 * 初始化壁纸历史
 * @param {Object} domElements - DOM元素对象
 */
async function initWallpaperHistory(domElements) {
  try {
    const { 
      importWallpapersBtn, 
      refreshWallpapersBtn, 
      openWallpaperFolderBtn,
      wallpaperFolderPath,
      saveWallpaperFolder,
      autoChangeWallpaper, 
      autoChangeInterval, 
      wallpaperHistoryGrid 
    } = domElements;
    
    // 加载设置和壁纸历史
    const settings = await loadSettings();
    const history = await loadWallpaperHistory();
    
    // 设置壁纸文件夹路径输入框的初始值
    if (wallpaperFolderPath) {
      wallpaperFolderPath.value = settings.wallpaperFolderPath || 'startx-wallpapers';
    }
    
    // 添加保存壁纸文件夹路径按钮事件
    if (saveWallpaperFolder) {
      saveWallpaperFolder.addEventListener('click', async () => {
        try {
          if (!wallpaperFolderPath || !wallpaperFolderPath.value) {
            alert('请输入有效的文件夹名称');
            return;
          }
          
          const folderName = wallpaperFolderPath.value;
          
          // 先设置文件夹路径
          const success = await setWallpaperFolderName(folderName);
          
          if (success) {
            // 然后创建文件夹
            await createWallpaperFolder(folderName);
            alert(`壁纸文件夹路径已更新为: ${folderName}\n已创建相应的文件夹，请在下载文件夹中查看。`);
          } else {
            alert('更新壁纸文件夹路径失败');
          }
        } catch (error) {
          console.error('保存壁纸文件夹路径时出错:', error);
          alert('保存壁纸文件夹路径失败: ' + error.message);
        }
      });
    }
    
    // 添加导入壁纸按钮事件
    if (importWallpapersBtn) {
      importWallpapersBtn.addEventListener('click', async () => {
        try {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.multiple = true;
          
          fileInput.onchange = async (e) => {
            if (e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              
              // 处理选择的文件
              for (const file of files) {
                await importWallpaperFromFile(file);
              }
              
              // 刷新壁纸历史
              const updatedHistory = await loadWallpaperHistory();
              renderWallpaperHistory(updatedHistory, 0, wallpaperHistoryGrid);
              
              alert(`成功导入 ${files.length} 个壁纸`);
            }
          };
          
          fileInput.click();
        } catch (error) {
          console.error('导入壁纸时出错:', error);
          alert('导入壁纸失败: ' + error.message);
        }
      });
    }
    
    // 添加刷新壁纸按钮事件
    if (refreshWallpapersBtn) {
      refreshWallpapersBtn.addEventListener('click', async () => {
        try {
          // 刷新壁纸历史
          const updatedHistory = await loadWallpaperHistory();
          renderWallpaperHistory(updatedHistory, 0, wallpaperHistoryGrid);
          
          alert('壁纸列表已刷新');
        } catch (error) {
          console.error('刷新壁纸时出错:', error);
          alert('刷新壁纸失败: ' + error.message);
        }
      });
    }
    
    // 添加打开壁纸文件夹按钮事件
    if (openWallpaperFolderBtn) {
      openWallpaperFolderBtn.addEventListener('click', async () => {
        try {
          const folderName = await getWallpaperFolderName();
          await createWallpaperFolder(folderName);
          alert(`已创建壁纸文件夹: ${folderName}\n请在下载文件夹中找到并打开它。`);
        } catch (error) {
          console.error('打开壁纸文件夹时出错:', error);
          alert('打开壁纸文件夹失败: ' + error.message);
        }
      });
    }
    
    // 渲染壁纸历史
    renderWallpaperHistory(history, settings.currentWallpaperIndex, wallpaperHistoryGrid);
    
    // 设置自动切换状态
    autoChangeWallpaper.checked = settings.wallpaperAutoChange || false;
    autoChangeInterval.disabled = !settings.wallpaperAutoChange;
    autoChangeInterval.value = settings.wallpaperChangeInterval || '30';
    
    // 如果启用了自动切换，启动定时器
    if (settings.wallpaperAutoChange) {
      startWallpaperAutoChange(settings.wallpaperChangeInterval);
    }
    
    // 自动切换复选框事件
    autoChangeWallpaper.addEventListener('change', async () => {
      const isChecked = autoChangeWallpaper.checked;
      autoChangeInterval.disabled = !isChecked;
      
      // 更新设置
      const newSettings = {
        wallpaperAutoChange: isChecked,
        wallpaperChangeInterval: parseInt(autoChangeInterval.value)
      };
      
      await handleSettingsChange(newSettings, domElements);
      
      // 启动或停止自动切换
      if (isChecked) {
        startWallpaperAutoChange(parseInt(autoChangeInterval.value));
      } else {
        stopWallpaperAutoChange();
      }
    });
    
    // 自动切换间隔选择事件
    autoChangeInterval.addEventListener('change', async () => {
      const interval = parseInt(autoChangeInterval.value);
      
      // 更新设置
      const newSettings = {
        wallpaperChangeInterval: interval
      };
      
      await handleSettingsChange(newSettings, domElements);
      
      // 如果已启用自动切换，重新启动定时器
      if (autoChangeWallpaper.checked) {
        startWallpaperAutoChange(interval);
      }
    });
  } catch (error) {
    console.error('初始化壁纸历史时出错:', error);
  }
}

/**
 * 渲染壁纸历史
 * @param {Object} historyObj - 壁纸历史记录对象
 * @param {number} currentIndex - 当前壁纸索引
 * @param {HTMLElement} container - 容器元素
 */
function renderWallpaperHistory(historyObj, currentIndex, container) {
  // 清空容器
  if (!container) return;
  container.innerHTML = '';
  
  // 确保历史对象格式正确
  if (!historyObj || !historyObj.items) {
    console.warn('壁纸历史记录格式不正确，使用空数组');
    historyObj = { items: [], currentIndex: -1 };
  }
  
  const history = historyObj.items;
  
  // 如果历史记录为空，显示提示信息
  if (!history || !Array.isArray(history) || history.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'wallpaper-empty-msg';
    emptyMsg.textContent = '尚无壁纸';
    container.appendChild(emptyMsg);
    return;
  }
  
  // 分页设置
  const itemsPerPage = 8; // 每页显示8个壁纸
  const totalPages = Math.ceil(history.length / itemsPerPage);
  
  // 获取或初始化当前页码
  let currentPage = container.dataset.currentPage ? parseInt(container.dataset.currentPage) : 1;
  
  // 确保当前页码在有效范围内
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  // 计算当前页的壁纸范围
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, history.length);
  const currentPageItems = history.slice(startIndex, endIndex);
  
  // 创建壁纸项
  currentPageItems.forEach((wallpaper, index) => {
    const actualIndex = startIndex + index;
    const wallpaperItem = document.createElement('div');
    wallpaperItem.className = 'wallpaper-item';
    if (actualIndex === currentIndex) {
      wallpaperItem.classList.add('active');
    }
    wallpaperItem.dataset.id = wallpaper.id;
    
    // 缩略图
    const thumbnail = document.createElement('img');
    thumbnail.className = 'wallpaper-thumbnail';
    thumbnail.src = wallpaper.thumbnail;
    thumbnail.alt = wallpaper.name;
    thumbnail.onerror = function() {
      // 图片加载失败时显示替代内容
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      this.style.padding = '10px';
      this.style.opacity = '0.5';
    };
    
    // 信息
    const info = document.createElement('div');
    info.className = 'wallpaper-info';
    
    const name = document.createElement('div');
    name.className = 'wallpaper-name';
    name.textContent = wallpaper.name;
    
    const date = document.createElement('div');
    date.className = 'wallpaper-date';
    date.textContent = new Date(wallpaper.date).toLocaleDateString();
    
    info.appendChild(name);
    info.appendChild(date);
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'wallpaper-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'wallpaper-action-btn';
    deleteBtn.title = '删除壁纸';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    
    // 删除按钮事件
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('确定要删除此壁纸吗？')) {
        await deleteWallpaperFromHistory(wallpaper.id);
        
        // 重新加载历史和设置
        const updatedSettings = await loadSettings();
        const updatedHistory = await loadWallpaperHistory();
        
        // 更新UI
        renderWallpaperHistory(updatedHistory, updatedSettings.currentWallpaperIndex, container);
      }
    });
    
    actions.appendChild(deleteBtn);
    
    // 点击壁纸项应用壁纸
    wallpaperItem.addEventListener('click', async () => {
      await applyWallpaperFromHistory(wallpaper.id);
      
      // 更新激活状态
      const items = container.querySelectorAll('.wallpaper-item');
      items.forEach(item => item.classList.remove('active'));
      wallpaperItem.classList.add('active');
    });
    
    // 组装DOM
    wallpaperItem.appendChild(thumbnail);
    wallpaperItem.appendChild(info);
    wallpaperItem.appendChild(actions);
    
    container.appendChild(wallpaperItem);
  });
  
  // 如果有多页，添加分页控制
  if (totalPages > 1) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'wallpaper-pagination';
    
    // 上一页按钮
    const prevPageBtn = document.createElement('button');
    prevPageBtn.className = 'pagination-btn';
    prevPageBtn.disabled = currentPage === 1;
    prevPageBtn.innerHTML = '上一页';
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        container.dataset.currentPage = currentPage - 1;
        renderWallpaperHistory(historyObj, currentIndex, container);
      }
    });
    
    // 页码指示器
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'page-indicator';
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    
    // 下一页按钮
    const nextPageBtn = document.createElement('button');
    nextPageBtn.className = 'pagination-btn';
    nextPageBtn.disabled = currentPage === totalPages;
    nextPageBtn.innerHTML = '下一页';
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        container.dataset.currentPage = parseInt(currentPage) + 1;
        renderWallpaperHistory(historyObj, currentIndex, container);
      }
    });
    
    // 添加分页控件
    paginationContainer.appendChild(prevPageBtn);
    paginationContainer.appendChild(pageIndicator);
    paginationContainer.appendChild(nextPageBtn);
    
    container.appendChild(paginationContainer);
  }
  
  // 保存当前页码
  container.dataset.currentPage = currentPage;
} 