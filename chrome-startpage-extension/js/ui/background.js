// 背景设置相关模块
import { bgConfigs, WALLPAPER_HISTORY_KEY, WALLPAPER_FOLDER_KEY } from '../config.js';
import { hexToHSL, hslToHex, hexToRgb, deepenColor } from './utils.js';
import { applyAccentColors } from './accent.js';
import { loadSettings, saveSettings } from '../settings.js';

const DB_NAME = 'StartXWallpaperDB';
const STORE_NAME = 'wallpaperStore';
const HANDLE_KEY = 'directoryHandle';

let directoryHandle = null;

// --- IndexedDB 辅助函数 ---

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDBValue(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setDBValue(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function selectAndSaveWallpaperFolder() {
  try {
    // 防止重复点击
    const button = document.getElementById('select-wallpaper-folder');
    if (button) {
      if (button.disabled) return;
      button.disabled = true;
      setTimeout(() => { button.disabled = false; }, 2000); // 2秒后恢复
    }
    
    const handle = await window.showDirectoryPicker({
      id: 'startx-wallpapers',
      mode: 'readwrite'
    });
    await setDBValue(HANDLE_KEY, handle);
    directoryHandle = handle;
    alert('壁纸文件夹已选定！');
    // 重新加载壁纸
    await loadAndRenderWallpapers();
  } catch (error) {
    console.error('选择文件夹失败:', error);
    if (error.name !== 'AbortError') {
      alert('无法访问文件夹，请检查权限。');
    }
  }
}

// 壁纸系统文件夹配置 - 相对于扩展根目录
const DEFAULT_WALLPAPER_FOLDER = 'bizhi';

/**
 * 获取壁纸文件夹路径
 * @returns {Promise<string>} 壁纸文件夹路径
 */
export async function getWallpaperFolderPath() {
  try {
    const settings = await loadSettings();
    return settings.wallpaperFolderPath || DEFAULT_WALLPAPER_FOLDER;
  } catch (error) {
    console.error('获取壁纸文件夹路径时出错:', error);
    return DEFAULT_WALLPAPER_FOLDER;
  }
}

/**
 * 设置壁纸文件夹路径
 * @param {string} folderPath - 新的文件夹路径
 * @returns {Promise<boolean>} 是否设置成功
 */
export async function setWallpaperFolderPath(folderPath) {
  try {
    if (!folderPath || typeof folderPath !== 'string' || folderPath.trim() === '') {
      return false;
    }
    
    // 清理文件夹路径，移除特殊字符
    const cleanFolderPath = folderPath.trim().replace(/[^\w\-\/\\]/g, '_');
    
    // 更新设置
    const settings = await loadSettings();
    settings.wallpaperFolderPath = cleanFolderPath;
    await saveSettings(settings);
    
    console.log(`壁纸文件夹路径已更新为: ${cleanFolderPath}`);
    
    return true;
  } catch (error) {
    console.error('设置壁纸文件夹路径时出错:', error);
    return false;
  }
}

/**
 * 确保壁纸文件夹存在
 * @returns {Promise<boolean>} 是否成功确认/创建文件夹
 */
export async function ensureWallpaperFolderExists() {
  try {
    const folderPath = await getWallpaperFolderPath();
    
    // 在Chrome扩展环境中，我们不能直接检查文件夹是否存在
    // 因此我们假设文件夹已存在或将被创建
    console.log(`使用壁纸文件夹路径: ${folderPath}`);
    
    // 如果在Chrome扩展环境中，我们可以发送消息给background脚本
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // 检查是否有directoryHandle
      const handle = await getDBValue(HANDLE_KEY);
      if (handle) {
        return true;
      }
      
      console.log(`未找到文件夹句柄，使用内置壁纸文件夹: ${DEFAULT_WALLPAPER_FOLDER}`);
    }
    
    return true;
  } catch (error) {
    console.error('确保壁纸文件夹存在时出错:', error);
    return false;
  }
}

/**
 * 初始化背景模块
 * @param {Object} domElements - DOM元素对象
 */
export async function initWallpaperManager(domElements) {
  console.log("初始化壁纸管理器...");

  document.getElementById('select-wallpaper-folder')?.addEventListener('click', selectAndSaveWallpaperFolder);
  document.getElementById('add-wallpaper')?.addEventListener('click', addWallpaper);
  document.getElementById('load-wallpapers')?.addEventListener('click', loadAndRenderWallpapers);
  
  // 确保自定义背景元素存在
  let customBackground = document.getElementById('custom-background');
  if (!customBackground) {
    console.log("创建自定义背景元素");
    customBackground = document.createElement('div');
    customBackground.id = 'custom-background';
    document.body.appendChild(customBackground);
  }
  
  // 确保壁纸文件夹存在
  try {
    await ensureWallpaperFolderExists();
    
    // 如果有文件夹路径输入框，设置初始值
    if (domElements.wallpaperFolderPath) {
      const folderPath = await getWallpaperFolderPath();
      // 如果是bizhi文件夹，显示提示
      if (folderPath === 'bizhi') {
        domElements.wallpaperFolderPath.value = folderPath;
        domElements.wallpaperFolderPath.setAttribute('placeholder', '内置壁纸文件夹');
        domElements.wallpaperFolderPath.setAttribute('title', '这是扩展的内置壁纸文件夹');
      } else {
        domElements.wallpaperFolderPath.value = folderPath;
      }
    }
  } catch (error) {
    console.error("初始化壁纸文件夹时出错:", error);
  }
  
  // 初始化壁纸历史控件
  if (domElements && domElements.wallpaperHistoryGrid) {
    try {
      // 检查并导入系统文件夹中的壁纸
      const shouldCheckImport = await loadSettings().then(settings => !settings.wallpapersImported);
      if (shouldCheckImport) {
        // 延迟执行导入，避免影响初始化流程
        setTimeout(() => {
          importWallpapersFromFolder().catch(error => {
            console.error("导入壁纸时出错:", error);
          });
        }, 2000);
      }
      
      const history = await loadWallpaperHistory();
      if (history && history.items) {
        console.log(`加载了 ${history.items.length} 个壁纸历史记录`);
        
        // 渲染壁纸历史记录
        renderWallpaperHistory(history, history.currentIndex, domElements.wallpaperHistoryGrid);
      } else {
        console.warn("壁纸历史记录格式不正确");
        // 初始化空的壁纸历史
        renderWallpaperHistory({ items: [], currentIndex: -1 }, -1, domElements.wallpaperHistoryGrid);
      }
    } catch (error) {
      console.error("初始化壁纸历史时出错:", error);
    }
  } else {
    console.warn("壁纸历史网格元素不存在");
  }
  
  try {
    directoryHandle = await getDBValue(HANDLE_KEY);
    if (directoryHandle) {
      console.log('已从IndexedDB加载壁纸文件夹句柄');
      // 不立即验证权限，而是使用queryPermission检查
      const hasPermission = await directoryHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
      if (hasPermission) {
        await loadAndRenderWallpapers();
      } else {
        console.log('没有文件夹访问权限，加载内置壁纸');
        await loadAndRenderWallpapers(); // 将加载内置壁纸
      }
    } else {
      const wallpaperGrid = document.getElementById('wallpaper-history-grid');
      if(wallpaperGrid) {
        console.log('未找到文件夹句柄，加载内置壁纸');
        await loadAndRenderWallpapers(); // 这将加载内置壁纸
      }
    }
  } catch (error) {
    console.error('从IndexedDB加载句柄失败', error);
    // 尝试加载内置壁纸
    await loadAndRenderWallpapers();
  }
  
  // 设置页面加载完成标记
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 500);
  
  console.log("背景模块初始化完成");
  return true;
}

/**
 * 壁纸历史记录对象
 * @typedef {Object} WallpaperHistoryItem
 * @property {string} id - 唯一标识符
 * @property {string} name - 壁纸名称
 * @property {string} data - 壁纸数据URL
 * @property {string} date - 添加日期
 * @property {string} thumbnail - 缩略图数据URL
 */

/**
 * 应用背景设置
 * @param {Object} settings - 用户设置
 */
export function applyBackgroundSettings(settings) {
  const customBackground = document.getElementById('custom-background');
  const body = document.body;

  document.documentElement.style.setProperty('--bg-opacity', settings.opacity / 100);
  document.documentElement.style.setProperty('--bg-blur', `${settings.blur}px`);
  customBackground.style.backgroundImage = '';
  body.classList.remove('bg-default', 'bg-preset');

  if (settings.bgType === 'wallpaper' && settings.currentWallpaperFile) {
    // 使用IIFE异步执行
    (async () => {
      try {
        // 首先尝试从用户选择的文件夹中加载壁纸
        if (!directoryHandle) {
          directoryHandle = await getDBValue(HANDLE_KEY);
        }
        
        // 检查权限但不主动请求
        const hasPermission = directoryHandle && 
          await directoryHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
        
        if (directoryHandle && hasPermission) {
          try {
            const fileHandle = await directoryHandle.getFileHandle(settings.currentWallpaperFile);
            const file = await fileHandle.getFile();
            const objectURL = URL.createObjectURL(file);
            customBackground.style.backgroundImage = `url('${objectURL}')`;
            return;
          } catch (error) {
            console.warn(`无法从用户文件夹加载壁纸: ${error.message}`);
            // 继续尝试从内置文件夹加载
          }
        }
        
        // 如果无法从用户文件夹加载，尝试从内置bizhi文件夹加载
        if (settings.currentWallpaperFile.startsWith('wallpaper-')) {
          // 这是内置壁纸，直接从bizhi文件夹加载
          const bizhiFiles = [
            'wallhaven-6lkq5l.png',
            'wallhaven-gwjovl.png',
            'wallhaven-k89v5d.jpg',
            'wallhaven-po8k5m.jpg'
          ];
          
          // 根据文件名确定索引
          const index = parseInt(settings.currentWallpaperFile.replace('wallpaper-', '').split('.')[0]) - 1;
          if (index >= 0 && index < bizhiFiles.length) {
            const bizhiFile = bizhiFiles[index];
            try {
              const response = await fetch(`bizhi/${bizhiFile}`);
              if (response.ok) {
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                customBackground.style.backgroundImage = `url('${objectURL}')`;
                return;
              }
            } catch (error) {
              console.error(`加载内置壁纸失败: ${error.message}`);
            }
          }
        }
        
        // 如果上述方法都失败，使用默认背景
        console.warn('无法加载壁纸，使用默认背景');
        body.classList.add('bg-default');
      } catch (error) {
        console.error('恢复壁纸失败:', error);
        body.classList.add('bg-default');
      }
    })();
  } else if (settings.bgType === 'preset') {
    // 预设背景改为使用默认壁纸
    const presetName = settings.presetName || 'default';
    
    // 尝试加载对应预设名称的壁纸
    (async () => {
      try {
        // 根据预设名称选择对应的内置壁纸
        let wallpaperIndex = 0;
        switch(presetName) {
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
        try {
          const response = await fetch(`bizhi/${bizhiFile}`);
          if (response.ok) {
            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            customBackground.style.backgroundImage = `url('${objectURL}')`;
            
            // 更新设置以保持一致性
            const updatedSettings = {...settings};
            updatedSettings.bgType = 'wallpaper';
            updatedSettings.currentWallpaperFile = `wallpaper-${wallpaperIndex+1}.${bizhiFile.split('.').pop()}`;
            
            // 异步保存设置，不等待完成
            saveSettings(updatedSettings).catch(err => console.error('保存设置失败:', err));
            return;
          }
        } catch (error) {
          console.error(`加载预设对应的壁纸失败: ${error.message}`);
        }
        
        // 如果加载失败，使用CSS预设背景
        body.classList.add(`bg-${presetName}`);
      } catch (error) {
        console.error('应用预设背景失败:', error);
        body.classList.add('bg-default');
      }
    })();
  } else if (settings.bgType === 'custom' && settings.customBgData) {
    customBackground.style.backgroundImage = `url('${settings.customBgData}')`;
  } else {
    body.classList.add('bg-default');
  }
}

/**
 * 从预设背景中提取主要颜色
 * @param {Object} preset - 背景预设配置
 */
function extractAccentColorsFromPreset(preset) {
  console.log("从预设背景提取主要颜色");
  
  if (preset.accentColors) {
    // 使用预设中定义的强调色
    applyAccentColors(preset.accentColors);
  } else if (preset.colors && preset.colors.length > 0) {
    // 如果没有预设强调色，从背景颜色中提取
    // 使用第一个颜色作为基础，并加深它
    const baseColor = preset.colors[0];
    const accentColor = deepenColor(baseColor, 0.2); // 加深20%
    
    // 生成互补色和第三色
    const hsl = hexToHSL(accentColor);
    if (hsl) {
      const complementaryHue = (hsl.h + 180) % 360;
      const secondaryColor = hslToHex(complementaryHue, hsl.s, hsl.l);
      
      const tertiaryHue = (hsl.h + 90) % 360;
      const tertiaryColor = hslToHex(tertiaryHue, hsl.s, hsl.l);
      
      const accentColors = {
        primary: accentColor,
        secondary: secondaryColor,
        tertiary: tertiaryColor
      };
      
      applyAccentColors(accentColors);
    }
  }
}

/**
 * 从自定义背景图像中提取主要颜色
 * @param {string} imageData - 图像数据URL
 */
function extractAccentColorsFromImage(imageData) {
  console.log("从自定义背景图像提取主要颜色");
  
  // 显示加载指示器
  document.body.classList.add('extracting-colors');
  
  // 创建一个临时图像对象
  const img = new Image();
  img.crossOrigin = "Anonymous";
  
  img.onload = function() {
    try {
      // 创建一个临时Canvas来处理图像
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 调整Canvas大小，使用较小的尺寸以提高性能
      const maxSize = 100;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 在Canvas上绘制图像
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // 颜色计数对象
      const colorCounts = {};
      
      // 分析像素数据
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // 忽略完全透明的像素
        if (a === 0) continue;
        
        // 计算颜色亮度
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // 忽略太暗或太亮的颜色
        if (brightness < 30 || brightness > 230) continue;
        
        // 计算颜色饱和度
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const saturation = max === 0 ? 0 : delta / max;
        
        // 忽略饱和度太低的颜色（灰色）
        if (saturation < 0.15) continue;
        
        // 将颜色量化为较少的值，以便更好地分组
        const quantizedR = Math.round(r / 10) * 10;
        const quantizedG = Math.round(g / 10) * 10;
        const quantizedB = Math.round(b / 10) * 10;
        
        // 创建颜色键
        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        
        // 增加颜色计数，并考虑饱和度作为权重
        const weight = 1 + saturation * 2; // 饱和度高的颜色权重更大
        if (colorCounts[colorKey]) {
          colorCounts[colorKey] += weight;
        } else {
          colorCounts[colorKey] = weight;
        }
      }
      
      // 如果没有找到合适的颜色，使用默认强调色
      if (Object.keys(colorCounts).length === 0) {
        console.log("未找到合适的颜色，使用默认强调色");
        const defaultPreset = bgConfigs['default'];
        if (defaultPreset && defaultPreset.accentColors) {
          applyAccentColors(defaultPreset.accentColors);
        }
        // 隐藏加载指示器
        document.body.classList.remove('extracting-colors');
        return;
      }
      
      // 找出出现次数最多的前5种颜色
      const topColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([colorKey, count]) => {
          const [r, g, b] = colorKey.split(',').map(Number);
          return { r, g, b, count };
        });
      
      console.log("提取的前5种主要颜色:", topColors);
      
      // 选择最适合作为强调色的颜色（优先选择饱和度高的颜色）
      let bestColor = topColors[0]; // 默认选择最常见的颜色
      
      for (const color of topColors) {
        const max = Math.max(color.r, color.g, color.b);
        const min = Math.min(color.r, color.g, color.b);
        const delta = max - min;
        const saturation = max === 0 ? 0 : delta / max;
        
        const bestMax = Math.max(bestColor.r, bestColor.g, bestColor.b);
        const bestMin = Math.min(bestColor.r, bestColor.g, bestColor.b);
        const bestDelta = bestMax - bestMin;
        const bestSaturation = bestMax === 0 ? 0 : bestDelta / bestMax;
        
        // 如果当前颜色的饱和度明显高于最佳颜色，则选择它
        if (saturation > bestSaturation * 1.2) {
          bestColor = color;
        }
      }
      
      // 将RGB转换为HEX
      let hexColor = rgbToHex(bestColor.r, bestColor.g, bestColor.b);
      
      // 加深颜色以增强对比度
      hexColor = deepenColor(hexColor, 0.2); // 加深20%
      
      console.log("选择的强调色:", hexColor);
      
      // 生成互补色和第三色
      const hsl = hexToHSL(hexColor);
      if (hsl) {
        // 确保饱和度足够高
        hsl.s = Math.max(60, hsl.s);
        
        // 确保亮度适中
        hsl.l = Math.min(Math.max(40, hsl.l), 60);
        
        // 更新主强调色
        hexColor = hslToHex(hsl.h, hsl.s, hsl.l);
        
        // 生成互补色（色相偏移180度）
        const complementaryHue = (hsl.h + 180) % 360;
        const secondaryColor = hslToHex(complementaryHue, hsl.s, hsl.l);
        
        // 生成第三种颜色（色相偏移90度）
        const tertiaryHue = (hsl.h + 90) % 360;
        const tertiaryColor = hslToHex(tertiaryHue, hsl.s, hsl.l);
        
        const accentColors = {
          primary: hexColor,
          secondary: secondaryColor,
          tertiary: tertiaryColor
        };
        
        applyAccentColors(accentColors);
      }
    } catch (error) {
      console.error("处理图像提取颜色时出错:", error);
      // 出错时使用默认强调色
      const defaultPreset = bgConfigs['default'];
      if (defaultPreset && defaultPreset.accentColors) {
        applyAccentColors(defaultPreset.accentColors);
      }
    } finally {
      // 隐藏加载指示器
      document.body.classList.remove('extracting-colors');
    }
  };
  
  img.onerror = function() {
    console.error("加载图像失败");
    // 加载失败时使用默认强调色
    const defaultPreset = bgConfigs['default'];
    if (defaultPreset && defaultPreset.accentColors) {
      applyAccentColors(defaultPreset.accentColors);
    }
    // 隐藏加载指示器
    document.body.classList.remove('extracting-colors');
  };
  
  // 设置图像源
  img.src = imageData;
}

/**
 * RGB转HEX
 * @param {number} r - 红色通道值
 * @param {number} g - 绿色通道值
 * @param {number} b - 蓝色通道值
 * @returns {string} 十六进制颜色值
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * 应用默认背景
 */
function applyDefaultBackground() {
  console.log("应用默认背景");
  
  // 移除所有预设背景类
  document.body.classList.remove('bg-blue', 'bg-purple', 'bg-sunset', 'bg-night', 'bg-forest');
  
  // 添加默认背景类
  document.body.classList.add('bg-default');
  
  const preset = bgConfigs['default'];
  if (preset) {
    document.documentElement.style.setProperty('--bg-color-1', preset.colors[0]);
    document.documentElement.style.setProperty('--bg-color-2', preset.colors[1]);
    document.documentElement.style.setProperty('--bg-color-3', preset.colors[2]);
    
    // 应用默认强调色
    if (preset.accentColors) {
      applyAccentColors(preset.accentColors);
    }
  }
}

/**
 * 处理背景图片
 * @param {File} file - 用户选择的图片文件
 * @returns {Promise<string>} 处理后的图片数据URL
 */
export function processBackgroundImage(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            // 获取图像原始尺寸
            const { width, height } = img;
            
            // 创建Canvas元素
            const canvas = document.createElement('canvas');
            const thumbnailCanvas = document.createElement('canvas');
            
            // 计算最大尺寸（限制尺寸以减小存储大小）
            const MAX_SIZE = 1920; // 最大宽度或高度为1920像素
            let targetWidth = width;
            let targetHeight = height;
            
            // 如果图像尺寸超过最大限制，按比例缩小
            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                targetWidth = MAX_SIZE;
                targetHeight = Math.round(height * (MAX_SIZE / width));
              } else {
                targetHeight = MAX_SIZE;
                targetWidth = Math.round(width * (MAX_SIZE / height));
              }
              console.log(`图像已调整大小: ${width}x${height} -> ${targetWidth}x${targetHeight}`);
            }
            
            // 设置Canvas大小
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 在Canvas上绘制图像
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            // 将Canvas内容转换为数据URL（使用较低的质量以减小文件大小）
            const imageData = canvas.toDataURL('image/jpeg', 0.85);
            
            // 创建缩略图
            const THUMB_SIZE = 200;
            let thumbWidth, thumbHeight;
            
            if (width > height) {
              thumbWidth = THUMB_SIZE;
              thumbHeight = Math.round(height * (THUMB_SIZE / width));
            } else {
              thumbHeight = THUMB_SIZE;
              thumbWidth = Math.round(width * (THUMB_SIZE / height));
            }
            
            thumbnailCanvas.width = thumbWidth;
            thumbnailCanvas.height = thumbHeight;
            const thumbCtx = thumbnailCanvas.getContext('2d');
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            const thumbnailData = thumbnailCanvas.toDataURL('image/jpeg', 0.7);
            
            // 添加到壁纸历史
            addToWallpaperHistory(imageData, thumbnailData, file.name);
            
            resolve({ imageData, thumbnailData });
          } catch (e) {
            console.error('处理图片时出错:', e);
            resolve(event.target.result);
          }
        };
        img.onerror = () => {
          console.error('加载图片出错');
          resolve(event.target.result);
        };
        img.src = event.target.result;
      };
      reader.onerror = (error) => {
        console.error('读取文件出错:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('处理背景图片时出错:', e);
      reject(e);
    }
  });
}

/**
 * 添加壁纸到历史记录
 * @param {string} imageData - 壁纸数据URL
 * @param {string} thumbnailData - 缩略图数据URL
 * @param {string} fileName - 文件名
 */
export async function addToWallpaperHistory(imageData, thumbnailData, fileName) {
  try {
    // 加载当前设置
    const settings = await loadSettings();
    
    // 生成唯一ID
    const id = 'wp_' + Date.now();
    
    // 进一步压缩缩略图以减小存储大小
    let optimizedThumbnail = await optimizeThumbnail(thumbnailData);
    
    // 创建壁纸历史项
    const wallpaperItem = {
      id,
      name: fileName || `壁纸 ${new Date().toLocaleDateString()}`,
      data: imageData,
      thumbnail: optimizedThumbnail,
      date: new Date().toISOString()
    };
    
    // 加载现有历史记录
    const historyObj = await loadWallpaperHistory();
    
    // 确保历史对象格式正确
    if (!historyObj || !historyObj.items) {
      historyObj = { items: [], currentIndex: -1 };
    }
    
    // 限制历史记录数量为20
    if (historyObj.items.length >= 20) {
      historyObj.items.pop(); // 移除最旧的壁纸
    }
    
    // 添加新壁纸到开头
    historyObj.items.unshift(wallpaperItem);
    
    // 更新当前索引
    historyObj.currentIndex = 0; // 设置当前壁纸为最新添加的
    
    // 保存设置
    await saveWallpaperHistory(historyObj);
    
    // 更新主设置
    await saveSettings({
      ...settings,
      wallpaperHistory: historyObj.items.map(item => ({
        id: item.id,
        name: item.name,
        date: item.date
      })), // 只保存元数据，不包括大图
      currentWallpaperIndex: 0
    });
    
    console.log('壁纸已添加到历史记录');
    
    return wallpaperItem;
  } catch (error) {
    console.error('添加壁纸到历史记录时出错:', error);
    throw error;
  }
}

/**
 * 优化缩略图，进一步压缩以减小存储大小
 * @param {string} thumbnailData - 原始缩略图数据URL
 * @returns {Promise<string>} 优化后的缩略图数据URL
 */
async function optimizeThumbnail(thumbnailData) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // 使用更小的尺寸，100x100像素通常足够作为缩略图
          const size = 100;
          let width = size;
          let height = size;
          
          // 保持纵横比
          if (img.width > img.height) {
            height = Math.round(img.height * (size / img.width));
          } else {
            width = Math.round(img.width * (size / img.height));
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 使用较低的质量参数，0.5通常可以提供良好的压缩比而不会显著降低质量
          const optimizedData = canvas.toDataURL('image/jpeg', 0.5);
          resolve(optimizedData);
        } catch (e) {
          console.error('优化缩略图时出错:', e);
          resolve(thumbnailData); // 出错时返回原始缩略图
        }
      };
      img.onerror = () => {
        console.error('加载缩略图出错');
        resolve(thumbnailData); // 出错时返回原始缩略图
      };
      img.src = thumbnailData;
    } catch (e) {
      console.error('优化缩略图时出错:', e);
      resolve(thumbnailData); // 出错时返回原始缩略图
    }
  });
}

/**
 * 保存壁纸历史记录
 * @param {Array} history - 壁纸历史记录
 */
export function saveWallpaperHistory(history) {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否在Chrome插件环境中
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [WALLPAPER_HISTORY_KEY]: history }, () => {
          if (chrome.runtime.lastError) {
            console.error('保存壁纸历史记录时出错:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          console.log('壁纸历史记录已保存到Chrome存储');
          resolve();
        });
      } else {
        // 本地开发环境下，保存到localStorage
        try {
          // 尝试保存数据前，先检查数据大小
          let jsonData = JSON.stringify(history);
          let dataSize = new Blob([jsonData]).size;
          
          // localStorage大小限制约为5MB，设置安全阈值为4MB
          const MAX_SIZE = 4 * 1024 * 1024; // 4MB
          
          // 如果数据太大，逐个移除较旧的壁纸，直到数据大小适合存储
          while (dataSize > MAX_SIZE && history.length > 1) {
            console.warn('壁纸历史数据过大，移除较旧的壁纸');
            history.pop(); // 移除最后一项（最旧的壁纸）
            jsonData = JSON.stringify(history);
            dataSize = new Blob([jsonData]).size;
          }
          
          // 如果只剩一个壁纸但数据仍然太大，可能需要压缩图像质量
          if (dataSize > MAX_SIZE && history.length === 1) {
            console.warn('即使只有一个壁纸，数据仍然过大。考虑在上传时进一步压缩图像。');
          }
          
          localStorage.setItem(WALLPAPER_HISTORY_KEY, jsonData);
          console.log(`壁纸历史记录已保存到localStorage，大小: ${(dataSize / 1024 / 1024).toFixed(2)}MB，壁纸数量: ${history.length}`);
          resolve();
        } catch (e) {
          console.error('保存壁纸历史记录到localStorage时出错:', e);
          
          // 如果是QuotaExceededError，尝试清理部分历史记录并重试
          if (e.name === 'QuotaExceededError' && history.length > 1) {
            console.warn('存储空间不足，尝试减少壁纸数量后重试');
            
            // 移除一半的壁纸（保留最新的）
            const halfLength = Math.max(1, Math.floor(history.length / 2));
            const reducedHistory = history.slice(0, halfLength);
            
            // 递归调用自身，尝试保存减少后的历史记录
            return saveWallpaperHistory(reducedHistory)
              .then(resolve)
              .catch(reject);
          }
          
          reject(e);
        }
      }
    } catch (e) {
      console.error('保存壁纸历史记录时出错:', e);
      reject(e);
    }
  });
}

/**
 * 加载壁纸历史记录
 * @returns {Promise<Object>} 包含壁纸历史记录和当前索引的对象
 */
export function loadWallpaperHistory() {
  return new Promise((resolve, reject) => {
    try {
      // 默认返回值，确保始终有有效的结构
      const defaultHistory = {
        items: [],
        currentIndex: -1
      };

      // 检查是否在Chrome插件环境中
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([WALLPAPER_HISTORY_KEY], (result) => {
          if (chrome.runtime.lastError) {
            console.error('从Chrome存储加载壁纸历史记录时出错:', chrome.runtime.lastError);
            return resolve(defaultHistory); // 出错时返回默认值
          }
          
          if (result && result[WALLPAPER_HISTORY_KEY]) {
            console.log('找到壁纸历史记录');
            const history = result[WALLPAPER_HISTORY_KEY];
            
            // 确保返回的对象具有正确的结构
            if (!history.items) {
              // 如果是旧格式（直接是数组），则转换为新格式
              if (Array.isArray(history)) {
                return resolve({
                  items: history,
                  currentIndex: 0
                });
              } else {
                return resolve(defaultHistory);
              }
            }
            
            resolve(history);
          } else {
            console.log('未找到壁纸历史记录，返回空对象');
            resolve(defaultHistory);
          }
        });
      } else {
        // 本地开发环境下，从localStorage读取
        try {
          const history = localStorage.getItem(WALLPAPER_HISTORY_KEY);
          
          if (history) {
            const parsedHistory = JSON.parse(history);
            console.log('从localStorage加载壁纸历史记录:', parsedHistory);
            
            // 确保返回的对象具有正确的结构
            if (!parsedHistory.items) {
              // 如果是旧格式（直接是数组），则转换为新格式
              if (Array.isArray(parsedHistory)) {
                return resolve({
                  items: parsedHistory,
                  currentIndex: 0
                });
              } else {
                return resolve(defaultHistory);
              }
            }
            
            resolve(parsedHistory);
          } else {
            console.log('未找到壁纸历史记录，返回空对象');
            resolve(defaultHistory);
          }
        } catch (e) {
          console.error('解析本地壁纸历史记录时出错:', e);
          resolve(defaultHistory); // 出错时返回默认值而不是拒绝Promise
        }
      }
    } catch (e) {
      console.error('加载壁纸历史记录时出错:', e);
      resolve(defaultHistory); // 出错时返回默认值而不是拒绝Promise
    }
  });
}

/**
 * 应用历史壁纸
 * @param {string} wallpaperId - 壁纸ID
 */
export async function applyWallpaperFromHistory(wallpaperId) {
  try {
    // 加载壁纸历史
    const history = await loadWallpaperHistory();
    
    // 确保history.items存在
    if (!history.items || !Array.isArray(history.items)) {
      console.error('壁纸历史记录格式无效');
      return false;
    }
    
    // 查找指定壁纸
    const wallpaper = history.items.find(item => item.id === wallpaperId);
    
    if (!wallpaper) {
      console.error(`未找到ID为 ${wallpaperId} 的壁纸`);
      return false;
    }
    
    // 加载当前设置
    const settings = await loadSettings();
    
    // 更新设置
    const updatedSettings = {
      ...settings,
      bgType: 'custom',
      customBgData: wallpaper.data,
      currentWallpaperIndex: history.items.findIndex(item => item.id === wallpaperId)
    };
    
    // 应用设置
    await saveSettings(updatedSettings);
    applyBackgroundSettings(updatedSettings);
    
    console.log(`已应用ID为 ${wallpaperId} 的壁纸`);
    return true;
  } catch (error) {
    console.error('应用历史壁纸时出错:', error);
    return false;
  }
}

/**
 * 删除历史壁纸
 * @param {string} wallpaperId - 壁纸ID
 */
export async function deleteWallpaperFromHistory(wallpaperId) {
  try {
    // 加载壁纸历史
    const history = await loadWallpaperHistory();
    
    // 确保history.items存在
    if (!history.items || !Array.isArray(history.items)) {
      console.error('壁纸历史记录格式无效');
      return false;
    }
    
    // 查找指定壁纸索引
    const index = history.items.findIndex(item => item.id === wallpaperId);
    
    if (index === -1) {
      console.error(`未找到ID为 ${wallpaperId} 的壁纸`);
      return false;
    }
    
    // 加载当前设置
    const settings = await loadSettings();
    
    // 删除壁纸
    history.items.splice(index, 1);
    
    // 更新当前壁纸索引
    let currentIndex = history.currentIndex;
    if (currentIndex >= history.items.length) {
      currentIndex = history.items.length > 0 ? 0 : -1;
    } else if (currentIndex > index) {
      currentIndex--;
    }
    
    // 更新历史对象的当前索引
    history.currentIndex = currentIndex;
    
    // 保存更新后的历史记录
    await saveWallpaperHistory(history);
    
    // 更新设置
    await saveSettings({
      ...settings,
      wallpaperHistory: history.items.map(item => ({
        id: item.id,
        name: item.name,
        date: item.date
      })),
      currentWallpaperIndex: currentIndex
    });
    
    console.log(`已删除ID为 ${wallpaperId} 的壁纸`);
    return true;
  } catch (error) {
    console.error('删除历史壁纸时出错:', error);
    return false;
  }
}

/**
 * 渲染壁纸历史记录
 * @param {Array<WallpaperHistoryItem>} items - 壁纸历史项目数组
 * @param {number} currentIndex - 当前选中的索引
 * @param {HTMLElement} container - 容器元素
 */
export function renderWallpaperHistory(items, currentIndex, container) {
  if (!container) return;
  
  // 清空容器
  container.innerHTML = '';
  
  // 确保items是数组
  if (!items || !Array.isArray(items) || items.length === 0) {
    // 显示空消息
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'wallpaper-empty-msg';
    emptyMsg.textContent = '暂无壁纸历史记录';
    container.appendChild(emptyMsg);
    return;
  }
  
  // 创建每个壁纸项目
  items.forEach((item, index) => {
    const wallpaperItem = document.createElement('div');
    wallpaperItem.className = 'wallpaper-item';
    if (index === currentIndex) {
      wallpaperItem.classList.add('active');
    }
    wallpaperItem.setAttribute('data-id', item.id);
    
    // 缩略图
    const thumbnail = document.createElement('img');
    thumbnail.className = 'wallpaper-thumbnail';
    thumbnail.src = item.thumbnail || item.data;
    thumbnail.alt = item.name || `壁纸 ${index + 1}`;
    
    // 信息区域
    const info = document.createElement('div');
    info.className = 'wallpaper-info';
    
    const name = document.createElement('div');
    name.className = 'wallpaper-name';
    name.textContent = item.name || `壁纸 ${index + 1}`;
    
    const date = document.createElement('div');
    date.className = 'wallpaper-date';
    date.textContent = item.date || '未知日期';
    
    info.appendChild(name);
    info.appendChild(date);
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'wallpaper-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'wallpaper-action-btn delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = '删除壁纸';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteWallpaperFromHistory(item.id);
    });
    
    actions.appendChild(deleteBtn);
    
    // 组装DOM
    wallpaperItem.appendChild(thumbnail);
    wallpaperItem.appendChild(info);
    wallpaperItem.appendChild(actions);
    
    // 点击应用壁纸
    wallpaperItem.addEventListener('click', () => {
      applyWallpaperFromHistory(item.id);
    });
    
    container.appendChild(wallpaperItem);
  });
}

/**
 * 将壁纸保存到系统文件夹
 * @param {string} imageData - 壁纸数据URL
 * @param {string} fileName - 文件名
 */
export function saveWallpaperToSystem(imageData, fileName) {
  try {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = imageData;
    link.download = fileName || `wallpaper_${Date.now()}.jpg`;
    
    // 添加到DOM并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理DOM
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    console.log(`壁纸已保存到下载文件夹，建议移动到 ${DEFAULT_WALLPAPER_FOLDER} 文件夹`);
    return true;
  } catch (error) {
    console.error('保存壁纸到系统文件夹时出错:', error);
    return false;
  }
}

/**
 * 导入文件夹中的壁纸
 * 由于浏览器安全限制，这个功能需要用户手动选择文件
 */
export function importWallpapersFromFolder() {
  return new Promise((resolve) => {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    
    // 监听文件选择事件
    fileInput.onchange = async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        resolve([]);
        return;
      }
      
      const importedWallpapers = [];
      
      // 处理每个文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // 处理图像
          const result = await processBackgroundImage(file);
          if (result) {
            // 添加到历史记录
            const wallpaper = await addToWallpaperHistory(
              result.imageData,
              result.thumbnailData,
              file.name
            );
            importedWallpapers.push(wallpaper);
          }
        } catch (error) {
          console.error(`导入壁纸 ${file.name} 时出错:`, error);
        }
      }
      
      resolve(importedWallpapers);
    };
    
    // 触发文件选择对话框
    fileInput.click();
  });
}

/**
 * 检查并导入壁纸
 * 这个函数会尝试检查壁纸文件夹中的图片并导入
 * @returns {Promise<boolean>} 是否成功导入壁纸
 */
export async function checkAndImportWallpapers() {
  try {
    console.log("检查并导入壁纸...");
    
    // 获取壁纸文件夹名称
    const folderName = await getWallpaperFolderPath();
    
    // 创建壁纸文件夹
    await ensureWallpaperFolderExists();
    
    // 标记为已导入，避免重复导入
    const settings = await loadSettings();
    settings.wallpapersImported = true;
    await saveSettings(settings);
    
    console.log("壁纸文件夹已创建:", folderName);
    return true;
  } catch (error) {
    console.error("检查并导入壁纸时出错:", error);
    return false;
  }
}

/**
 * 打开壁纸文件夹
 * 由于浏览器安全限制，这个函数会尝试创建一个下载链接，提示用户创建文件夹
 */
export async function openWallpaperFolder() {
  try {
    // 获取当前壁纸文件夹名称
    const folderName = await getWallpaperFolderPath();
    
    // 创建文件夹
    const success = await ensureWallpaperFolderExists();
    
    if (success) {
      alert(`请在您的下载文件夹中找到并打开 ${folderName} 文件夹。\n您可以将壁纸图片放在此文件夹中，然后通过"导入壁纸"功能将它们添加到StartX中。`);
      return true;
    } else {
      alert('无法创建壁纸文件夹。请手动创建一个文件夹来存储您的壁纸。');
      return false;
    }
  } catch (error) {
    console.error('打开壁纸文件夹时出错:', error);
    alert('无法打开壁纸文件夹。由于浏览器安全限制，请手动创建一个文件夹来存储您的壁纸。');
    return false;
  }
}

/**
 * 从文件导入壁纸
 * @param {File} file - 要导入的图片文件
 * @returns {Promise<boolean>} - 导入是否成功
 */
export async function importWallpaperFromFile(file) {
  try {
    if (!file || !file.type.startsWith('image/')) {
      console.error('无效的文件类型:', file?.type);
      return false;
    }
    
    // 读取文件
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const imageData = e.target.result;
          
          // 创建缩略图
          const thumbnailData = await createThumbnail(imageData);
          
          // 添加到历史记录
          await addToWallpaperHistory(imageData, thumbnailData, file.name);
          
          // 应用新壁纸
          const history = await loadWallpaperHistory();
          if (history && history.items && history.items.length > 0) {
            const latestWallpaper = history.items[0];
            await applyWallpaperFromHistory(latestWallpaper.id);
          }
          
          resolve(true);
        } catch (error) {
          console.error('处理导入壁纸时出错:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('读取文件时出错:', error);
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('导入壁纸时出错:', error);
    return false;
  }
}

/**
 * 创建图像缩略图
 * @param {string} imageData - 图像数据URL
 * @returns {Promise<string>} 缩略图数据URL
 */
export async function createThumbnail(imageData) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // 创建缩略图画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置缩略图尺寸
        const maxSize = 150;
        let width = img.width;
        let height = img.height;
        
        // 保持宽高比
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }
        
        // 设置画布尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 绘制缩略图
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为数据URL
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailData);
      } catch (error) {
        console.error('创建缩略图时出错:', error);
        // 如果出错，使用原图作为缩略图
        resolve(imageData);
      }
    };
    
    img.onerror = (error) => {
      console.error('加载图像时出错:', error);
      reject(error);
    };
    
    img.src = imageData;
  });
}

async function verifyPermission() {
  if (!directoryHandle) return false;
  const options = { mode: 'readwrite' };
  
  // 首先检查是否已经有权限，避免触发权限请求
  if ((await directoryHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  // 在初始化阶段，不请求权限，等待用户交互
  if (!document.hasFocus() || !document.body.classList.contains('loaded')) {
    console.log('页面未激活或未完成加载，跳过权限请求');
    return false;
  }
  
  try {
    // 只在用户交互后请求权限
    if ((await directoryHandle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (error) {
    console.warn('请求文件系统权限失败:', error.message);
    // 如果是因为用户激活问题，不显示错误
    if (error.name === 'SecurityError' && error.message.includes('User activation')) {
      return false;
    }
  }
  
  console.error('无法获取壁纸文件夹的读写权限。');
  directoryHandle = null;
  await setDBValue(HANDLE_KEY, null);
  return false;
}

async function loadAndRenderWallpapers() {
    const wallpaperGrid = document.getElementById('wallpaper-history-grid');
    if (!wallpaperGrid) return;

    // 如果有用户选择的文件夹，使用它
    if (directoryHandle) {
        // 检查权限但不主动请求
        const hasPermission = await directoryHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
        if (hasPermission) {
            wallpaperGrid.innerHTML = '';
            let hasWallpapers = false;

            try {
                for await (const entry of directoryHandle.values()) {
                    if (entry.kind === 'file' && entry.name.match(/\.(jpe?g|png|gif|webp)$/i)) {
                        hasWallpapers = true;
                        const file = await entry.getFile();
                        const item = createWallpaperItem(file, entry.name);
                        wallpaperGrid.appendChild(item);
                    }
                }
                if (!hasWallpapers) {
                    wallpaperGrid.innerHTML = `<div class="wallpaper-empty-msg">文件夹中没有支持的图片文件 (jpg, png, gif, webp)</div>`;
                }
                return;
            } catch (error) {
                console.error('加载壁纸时出错:', error);
                wallpaperGrid.innerHTML = `<div class="wallpaper-empty-msg">加载壁纸时出错，请检查控制台</div>`;
            }
        } else {
            console.log('没有文件夹访问权限，使用内置壁纸');
        }
    }
    
    // 如果没有用户选择的文件夹或没有权限，尝试使用扩展自带的bizhi文件夹
    try {
        wallpaperGrid.innerHTML = '';
        let hasWallpapers = false;
        
        // 获取bizhi文件夹中的图片
        const folderPath = 'bizhi';
        const bizhiFiles = [
            'wallhaven-6lkq5l.png',
            'wallhaven-gwjovl.png',
            'wallhaven-k89v5d.jpg',
            'wallhaven-po8k5m.jpg'
        ];
        
        // 创建一个加载图片的Promise数组
        const loadPromises = bizhiFiles.map((filename, index) => {
            return fetch(`${folderPath}/${filename}`)
                .then(r => r.blob())
                .then(blob => ({
                    blob,
                    fileName: `wallpaper-${index+1}.${filename.split('.').pop()}`,
                    originalName: filename
                }));
        });
        
        // 等待所有图片加载完成
        const results = await Promise.allSettled(loadPromises);
        
        // 处理成功加载的图片
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                hasWallpapers = true;
                const { blob, fileName, originalName } = result.value;
                const file = new File([blob], fileName, { type: blob.type });
                const item = createWallpaperItem(file, fileName, true, originalName);
                wallpaperGrid.appendChild(item);
            }
        });
        
        if (!hasWallpapers) {
            wallpaperGrid.innerHTML = `<div class="wallpaper-empty-msg">未找到内置壁纸，请选择一个文件夹作为壁纸库</div>`;
        }
    } catch (error) {
        console.error('加载内置壁纸时出错:', error);
        wallpaperGrid.innerHTML = `<div class="wallpaper-empty-msg">请选择一个文件夹作为你的壁纸库</div>`;
    }
}

function createWallpaperItem(file, fileName, isBuiltIn = false, originalName = '') {
    const item = document.createElement('div');
    item.className = 'wallpaper-item';
    item.dataset.filename = fileName;
    if (isBuiltIn) {
        item.dataset.builtin = 'true';
        item.dataset.originalname = originalName;
    }

    const thumbnail = document.createElement('img');
    thumbnail.className = 'wallpaper-thumbnail';
    thumbnail.src = URL.createObjectURL(file);
    thumbnail.alt = fileName;

    const info = document.createElement('div');
    info.className = 'wallpaper-info';
    info.textContent = isBuiltIn ? `内置壁纸 ${fileName.split('-')[1].split('.')[0]}` : fileName;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'wallpaper-delete-btn';
    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    deleteBtn.title = '删除壁纸';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (isBuiltIn) {
            alert('内置壁纸不能被删除');
            return;
        }
        if (confirm(`确定要删除壁纸 "${fileName}" 吗？此操作会从你的文件夹中删除文件，且无法撤销。`)) {
            deleteWallpaper(fileName);
        }
    };

    item.append(thumbnail, info, deleteBtn);
    item.onclick = () => applyWallpaper(file, fileName, isBuiltIn);

    // 重新渲染图标
    if (window.lucide) {
        window.lucide.createIcons();
    }

    return item;
}

async function applyWallpaper(file, fileName, isBuiltIn = false) {
    try {
        const customBackground = document.getElementById('custom-background');
        if (!customBackground) return;

        const objectURL = URL.createObjectURL(file);
        customBackground.style.backgroundImage = `url('${objectURL}')`;

        const settings = await loadSettings();
        settings.bgType = 'wallpaper';
        settings.currentWallpaperFile = fileName;
        await saveSettings(settings);

        document.querySelectorAll('.wallpaper-item.active').forEach(el => el.classList.remove('active'));
        document.querySelector(`.wallpaper-item[data-filename="${fileName}"]`)?.classList.add('active');
        
        // 记录到壁纸历史
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const thumbnail = await createThumbnail(e.target.result);
                await addToWallpaperHistory(e.target.result, thumbnail, fileName);
            } catch (error) {
                console.error('添加壁纸到历史记录时出错:', error);
            }
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('应用壁纸失败:', error);
    }
}

async function deleteWallpaper(fileName) {
    // 如果是从用户文件夹中删除
    const hasPermission = directoryHandle && 
      await directoryHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
      
    if (directoryHandle && hasPermission) {
        try {
            await directoryHandle.removeEntry(fileName);
            
            // 检查当前设置中是否正在使用这个壁纸
            const settings = await loadSettings();
            if (settings.currentWallpaperFile === fileName) {
                // 如果正在使用，切换到默认背景
                settings.bgType = 'default';
                settings.currentWallpaperFile = null;
                await saveSettings(settings);
                
                // 应用默认背景
                const customBackground = document.getElementById('custom-background');
                if (customBackground) {
                    customBackground.style.backgroundImage = '';
                }
                document.body.classList.add('bg-default');
            }
            
            // 从壁纸历史中也删除
            const history = await loadWallpaperHistory();
            if (history && history.items) {
                const index = history.items.findIndex(item => item.name === fileName);
                if (index !== -1) {
                    history.items.splice(index, 1);
                    await saveWallpaperHistory(history);
                }
            }
            
            // 重新加载壁纸列表
            await loadAndRenderWallpapers();
            alert(`壁纸 ${fileName} 已成功删除`);
        } catch (error) {
            console.error(`删除壁纸 ${fileName} 失败:`, error);
            alert(`删除壁纸 ${fileName} 失败: ${error.message}`);
        }
    } else {
        // 如果没有文件夹访问权限
        alert('无法访问壁纸文件夹，请先选择壁纸文件夹并授予权限。');
    }
}

async function addWallpaper() {
    // 防止重复点击
    const button = document.getElementById('add-wallpaper');
    if (button) {
        if (button.disabled) return;
        button.disabled = true;
        setTimeout(() => { button.disabled = false; }, 2000); // 2秒后恢复
    }
    
    try {
        // 检查是否有文件夹访问权限
        const hasPermission = directoryHandle && 
          document.hasFocus() && 
          document.body.classList.contains('loaded') && 
          await directoryHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
          
        if (directoryHandle && hasPermission) {
            // 用户已选择文件夹，使用文件选择器添加壁纸
            const files = await window.showOpenFilePicker({
                types: [{ description: 'Images', accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] } }],
                multiple: true
            });

            for (const fileHandle of files) {
                const file = await fileHandle.getFile();
                const newFileHandle = await directoryHandle.getFileHandle(file.name, { create: true });
                const writable = await newFileHandle.createWritable();
                await writable.write(file);
                await writable.close();
            }
            await loadAndRenderWallpapers(); // 重新加载
        } else {
            // 用户未选择文件夹或没有权限，提示选择
            alert('请先选择壁纸文件夹并授予权限，然后再添加壁纸。');
            await selectAndSaveWallpaperFolder();
        }
    } catch (error) {
        console.error('添加壁纸失败:', error);
        if (error.name !== 'AbortError') {
            alert('添加壁纸时出错，请检查权限或文件是否有效。');
        }
    }
}

/**
 * 切换到下一张壁纸
 * @returns {Promise<boolean>} 是否成功切换
 */
export async function nextWallpaper() {
  try {
    const history = await loadWallpaperHistory();
    if (!history || !history.items || history.items.length === 0) {
      console.warn('壁纸历史记录为空，无法切换到下一张');
      return false;
    }
    
    // 计算下一张壁纸的索引
    const currentIndex = history.currentIndex || 0;
    const nextIndex = (currentIndex + 1) % history.items.length;
    
    // 应用下一张壁纸
    const nextWallpaper = history.items[nextIndex];
    if (nextWallpaper) {
      await applyWallpaperFromHistory(nextWallpaper.id);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('切换到下一张壁纸时出错:', error);
    return false;
  }
}

/**
 * 切换到上一张壁纸
 * @returns {Promise<boolean>} 是否成功切换
 */
export async function previousWallpaper() {
  try {
    const history = await loadWallpaperHistory();
    if (!history || !history.items || history.items.length === 0) {
      console.warn('壁纸历史记录为空，无法切换到上一张');
      return false;
    }
    
    // 计算上一张壁纸的索引
    const currentIndex = history.currentIndex || 0;
    const prevIndex = (currentIndex - 1 + history.items.length) % history.items.length;
    
    // 应用上一张壁纸
    const prevWallpaper = history.items[prevIndex];
    if (prevWallpaper) {
      await applyWallpaperFromHistory(prevWallpaper.id);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('切换到上一张壁纸时出错:', error);
    return false;
  }
}

// 壁纸自动切换定时器
let wallpaperAutoChangeTimer = null;

/**
 * 启动壁纸自动切换
 * @param {number} intervalMinutes - 切换间隔（分钟）
 */
export function startWallpaperAutoChange(intervalMinutes) {
  // 停止已有的定时器
  stopWallpaperAutoChange();
  
  // 验证参数
  const interval = parseInt(intervalMinutes) || 30;
  if (interval <= 0) {
    console.warn('自动切换间隔必须大于0，使用默认值30分钟');
    interval = 30;
  }
  
  // 转换为毫秒
  const intervalMs = interval * 60 * 1000;
  
  // 启动定时器
  wallpaperAutoChangeTimer = setInterval(() => {
    nextWallpaper().catch(error => {
      console.error('自动切换壁纸时出错:', error);
    });
  }, intervalMs);
  
  console.log(`已启动壁纸自动切换，间隔: ${interval}分钟`);
}

/**
 * 停止壁纸自动切换
 */
export function stopWallpaperAutoChange() {
  if (wallpaperAutoChangeTimer) {
    clearInterval(wallpaperAutoChangeTimer);
    wallpaperAutoChangeTimer = null;
    console.log('已停止壁纸自动切换');
  }
} 