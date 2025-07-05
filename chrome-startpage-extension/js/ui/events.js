// 事件处理模块
import { loadSettings, saveSettings } from '../settings.js';
import { searchEngines, DEFAULT_SETTINGS, themePresets } from '../config.js';
import { handleSettingsChange } from './state.js';
import { 
  processBackgroundImage, 
  loadWallpaperHistory, 
  applyWallpaperFromHistory, 
  deleteWallpaperFromHistory,
  previousWallpaper,
  startWallpaperAutoChange,
  stopWallpaperAutoChange,
  saveWallpaperToSystem,
  getWallpaperFolderPath,
  setWallpaperFolderPath,
  ensureWallpaperFolderExists,
  createThumbnail,
  addToWallpaperHistory,
  renderWallpaperHistory
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
    prevWallpaper, autoChangeWallpaper, autoChangeInterval,
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
        const defaultSettingsCopy = { ...DEFAULT_SETTINGS };
        
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
          bgType: bgName === 'default' ? 'default' : 'wallpaper',
          presetName: bgName,
          customBgData: null, // 清除自定义背景
          accentColorMode: 'auto' // 预设背景时自动应用强调色
        };
        
        // 根据预设名称选择对应的内置壁纸
        if (bgName !== 'default') {
          let wallpaperIndex = 0;
          switch(bgName) {
            case 'blue': wallpaperIndex = 0; break;
            case 'purple': wallpaperIndex = 1; break;
            case 'sunset': wallpaperIndex = 2; break;
            case 'night': wallpaperIndex = 3; break;
            case 'forest': wallpaperIndex = 0; break;
            default: wallpaperIndex = 0;
          }
          
          const bizhiFiles = [
            'wallhaven-6lkq5l.png',
            'wallhaven-gwjovl.png',
            'wallhaven-k89v5d.jpg',
            'wallhaven-po8k5m.jpg'
          ];
          
          const bizhiFile = bizhiFiles[wallpaperIndex];
          newSettings.currentWallpaperFile = `wallpaper-${wallpaperIndex+1}.${bizhiFile.split('.').pop()}`;
        }
        
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
      wallpaperFolderPath.value = settings.wallpaperFolderPath || 'bizhi';
    }
    
    // 添加保存壁纸文件夹路径按钮事件
    if (saveWallpaperFolder) {
      saveWallpaperFolder.addEventListener('click', async () => {
        try {
          if (!wallpaperFolderPath || !wallpaperFolderPath.value) {
            alert('请输入有效的文件夹名称');
            return;
          }
          
          // 如果用户输入了"bizhi"，提示这是内置文件夹
          if (wallpaperFolderPath.value.toLowerCase() === 'bizhi') {
            alert('bizhi 是扩展的内置壁纸文件夹，已自动加载内置壁纸。如需使用自定义文件夹，请使用其他名称。');
            return;
          }
          
          const folderPath = wallpaperFolderPath.value;
          
          // 更新设置中的文件夹路径
          const success = await setWallpaperFolderPath(folderPath);
          
          if (success) {
            // 尝试创建或访问文件夹
            chrome.runtime.sendMessage({
              action: 'createFolder',
              folderPath: folderPath,
              placeholderContent: `此文件夹用于存储StartX扩展的壁纸图片。\n请勿删除此文件夹。`
            }, response => {
              // 检查是否有错误
              if (chrome.runtime.lastError) {
                console.warn('发送消息时出错:', chrome.runtime.lastError.message);
                alert(`壁纸文件夹路径已更新为: ${folderPath}\n但无法确认文件夹是否已创建。`);
                return;
              }
              
              if (response && response.success) {
                alert(`壁纸文件夹路径已更新为: ${folderPath}\n文件夹已成功创建。`);
              } else {
                alert(`壁纸文件夹路径已更新，但创建文件夹失败: ${response ? response.error : '未知错误'}`);
              }
            });
          } else {
            alert('更新壁纸文件夹路径失败');
          }
        } catch (error) {
          console.error('保存壁纸文件夹路径时出错:', error);
          alert('保存壁纸文件夹路径失败: ' + error.message);
        }
      });
    }
    
    // 添加打开壁纸文件夹按钮事件
    if (openWallpaperFolderBtn) {
      openWallpaperFolderBtn.addEventListener('click', async () => {
        try {
          const folderPath = await getWallpaperFolderPath();
          
          // 尝试打开文件夹
          chrome.runtime.sendMessage({
            action: 'createFolder',
            folderPath: folderPath,
            placeholderContent: `此文件夹用于存储StartX扩展的壁纸图片。\n请勿删除此文件夹。`
          }, response => {
            // 检查是否有错误
            if (chrome.runtime.lastError) {
              console.warn('发送消息时出错:', chrome.runtime.lastError.message);
              alert(`无法打开壁纸文件夹: ${folderPath}\n错误: ${chrome.runtime.lastError.message}`);
              return;
            }
            
            if (response && response.success) {
              alert(`壁纸文件夹已打开: ${folderPath}`);
            } else {
              alert(`打开壁纸文件夹失败: ${response ? response.error : '未知错误'}`);
            }
          });
        } catch (error) {
          console.error('打开壁纸文件夹时出错:', error);
          alert('打开壁纸文件夹失败: ' + error.message);
        }
      });
    }
    
    // 添加导入壁纸按钮事件
    if (importWallpapersBtn) {
      importWallpapersBtn.addEventListener('click', async () => {
        try {
          const folderPath = await getWallpaperFolderPath();
          
          // 从壁纸文件夹导入图片
          chrome.runtime.sendMessage({
            action: 'importWallpapers',
            folderPath: folderPath
          }, async response => {
            // 检查是否有错误
            if (chrome.runtime.lastError) {
              console.warn('发送消息时出错:', chrome.runtime.lastError.message);
              alert(`导入壁纸失败: ${chrome.runtime.lastError.message}`);
              return;
            }
            
            if (response && response.success) {
              const wallpapers = response.wallpapers;
              if (wallpapers && wallpapers.length > 0) {
                // 处理导入的壁纸
                for (const wallpaper of wallpapers) {
                  // 创建缩略图
                  const thumbnail = await createThumbnail(wallpaper.data);
                  
                  // 添加到历史记录
                  await addToWallpaperHistory(wallpaper.data, thumbnail, wallpaper.name);
                }
                
                // 刷新壁纸历史
                const updatedHistory = await loadWallpaperHistory();
                if (wallpaperHistoryGrid) {
                  renderWallpaperHistory(updatedHistory, 0, wallpaperHistoryGrid);
                }
                
                alert(`成功导入 ${wallpapers.length} 个壁纸`);
              } else {
                alert('没有找到可导入的壁纸');
              }
            } else {
              alert(`导入壁纸失败: ${response ? response.error : '未知错误'}`);
            }
          });
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
          if (wallpaperHistoryGrid) {
            renderWallpaperHistory(updatedHistory, 0, wallpaperHistoryGrid);
          }
          
          alert('壁纸列表已刷新');
        } catch (error) {
          console.error('刷新壁纸时出错:', error);
          alert('刷新壁纸失败: ' + error.message);
        }
      });
    }
    
    // 渲染壁纸历史
    if (wallpaperHistoryGrid) {
      renderWallpaperHistory(history, settings.currentWallpaperIndex, wallpaperHistoryGrid);
    }
    
    // 设置自动切换状态
    if (autoChangeWallpaper) {
      autoChangeWallpaper.checked = settings.wallpaperAutoChange || false;
      if (autoChangeInterval) {
        autoChangeInterval.disabled = !settings.wallpaperAutoChange;
        autoChangeInterval.value = settings.wallpaperChangeInterval || '30';
      }
      
      // 如果启用了自动切换，启动定时器
      if (settings.wallpaperAutoChange) {
        startWallpaperAutoChange(settings.wallpaperChangeInterval);
      }
      
      // 自动切换复选框事件
      autoChangeWallpaper.addEventListener('change', async () => {
        const isChecked = autoChangeWallpaper.checked;
        if (autoChangeInterval) {
          autoChangeInterval.disabled = !isChecked;
        }
        
        // 更新设置
        const newSettings = {
          wallpaperAutoChange: isChecked,
          wallpaperChangeInterval: parseInt(autoChangeInterval ? autoChangeInterval.value : '30')
        };
        
        await handleSettingsChange(newSettings, domElements);
        
        // 启动或停止自动切换
        if (isChecked) {
          startWallpaperAutoChange(parseInt(autoChangeInterval ? autoChangeInterval.value : '30'));
        } else {
          stopWallpaperAutoChange();
        }
      });
    }
    
    // 自动切换间隔选择事件
    if (autoChangeInterval) {
      autoChangeInterval.addEventListener('change', async () => {
        const interval = parseInt(autoChangeInterval.value);
        
        // 更新设置
        const newSettings = {
          wallpaperChangeInterval: interval
        };
        
        await handleSettingsChange(newSettings, domElements);
        
        // 如果已启用自动切换，重新启动定时器
        if (autoChangeWallpaper && autoChangeWallpaper.checked) {
          startWallpaperAutoChange(interval);
        }
      });
    }
  } catch (error) {
    console.error('初始化壁纸历史时出错:', error);
  }
} 