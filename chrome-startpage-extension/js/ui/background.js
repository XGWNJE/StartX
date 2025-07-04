// 背景设置相关模块
import { bgConfigs, WALLPAPER_HISTORY_KEY } from '../config.js';
import { hexToHSL, hslToHex, hexToRgb, deepenColor } from './utils.js';
import { applyAccentColors, applyCustomAccentColor } from './accent.js';
import { loadSettings, saveSettings } from '../settings.js';

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
  console.log("应用背景设置:", settings.bgType, settings.presetName);
  
  const customBackground = document.getElementById('custom-background');
  const body = document.body;
  
  // 设置CSS变量
  document.documentElement.style.setProperty('--bg-opacity', settings.opacity / 100);
  document.documentElement.style.setProperty('--bg-blur', `${settings.blur}px`);
  
  // 清除自定义背景
  customBackground.style.backgroundImage = '';
  
  // 添加临时类，触发重绘
  body.classList.add('bg-transition');
  
  // 应用背景类型
  if (settings.bgType === 'preset' && settings.presetName) {
    const presetName = settings.presetName;
    console.log(`应用预设背景: ${presetName}`);
    
    const preset = bgConfigs[presetName];
    if (preset) {
      console.log(`应用预设颜色: ${presetName}`, preset.colors);
      
      // 移除所有预设背景类
      body.classList.remove('bg-default', 'bg-blue', 'bg-purple', 'bg-sunset', 'bg-night', 'bg-forest');
      
      // 添加当前预设背景类
      body.classList.add(`bg-${presetName}`);
      
      if (preset.colors.length === 2) {
        document.documentElement.style.setProperty('--bg-color-1', preset.colors[0]);
        document.documentElement.style.setProperty('--bg-color-2', preset.colors[1]);
        document.documentElement.style.setProperty('--bg-color-3', preset.colors[1]);
      } else if (preset.colors.length >= 3) {
        document.documentElement.style.setProperty('--bg-color-1', preset.colors[0]);
        document.documentElement.style.setProperty('--bg-color-2', preset.colors[1]);
        document.documentElement.style.setProperty('--bg-color-3', preset.colors[2]);
      }
      
      // 自动应用强调色
      if (settings.accentColorMode === 'auto') {
        // 从预设背景中提取主要颜色
        extractAccentColorsFromPreset(preset);
      }
    } else {
      console.warn(`预设 "${presetName}" 未找到，使用默认预设`);
      applyDefaultBackground();
    }
  } else if (settings.bgType === 'custom' && settings.customBgData) {
    // 应用自定义背景
    customBackground.style.backgroundImage = `url(${settings.customBgData})`;
    
    // 移除所有预设背景类
    body.classList.remove('bg-default', 'bg-blue', 'bg-purple', 'bg-sunset', 'bg-night', 'bg-forest');
    
    // 对于自定义背景，从图像提取主要颜色
    if (settings.accentColorMode === 'auto') {
      extractAccentColorsFromImage(settings.customBgData);
    }
  } else {
    // 应用默认背景
    applyDefaultBackground();
  }
  
  // 如果是自定义强调色模式
  if (settings.accentColorMode === 'custom' && settings.customAccentColor) {
    applyCustomAccentColor(settings.customAccentColor, {
      useCustomGradient: settings.useCustomGradient,
      secondaryColor: settings.customSecondaryColor,
      gradientDirection: settings.gradientDirection
    });
  }
  
  // 强制重绘
  setTimeout(() => {
    body.classList.remove('bg-transition');
    // 触发回流和重绘
    void body.offsetHeight;
  }, 50);
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
            
            resolve(imageData);
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
    const history = await loadWallpaperHistory() || [];
    
    // 限制历史记录数量为20
    if (history.length >= 20) {
      history.pop(); // 移除最旧的壁纸
    }
    
    // 添加新壁纸到开头
    history.unshift(wallpaperItem);
    
    // 更新设置
    const updatedSettings = {
      ...settings,
      wallpaperHistory: history,
      currentWallpaperIndex: 0 // 设置当前壁纸为最新添加的
    };
    
    // 保存设置
    await saveWallpaperHistory(history);
    
    // 更新主设置
    await saveSettings({
      ...settings,
      wallpaperHistory: history.map(item => ({
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
 * @returns {Promise<Array>} 壁纸历史记录
 */
export function loadWallpaperHistory() {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否在Chrome插件环境中
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([WALLPAPER_HISTORY_KEY], (result) => {
          if (chrome.runtime.lastError) {
            console.error('从Chrome存储加载壁纸历史记录时出错:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          
          if (result && result[WALLPAPER_HISTORY_KEY]) {
            console.log('找到壁纸历史记录');
            resolve(result[WALLPAPER_HISTORY_KEY]);
          } else {
            console.log('未找到壁纸历史记录，返回空数组');
            resolve([]);
          }
        });
      } else {
        // 本地开发环境下，从localStorage读取
        try {
          const history = localStorage.getItem(WALLPAPER_HISTORY_KEY);
          
          if (history) {
            const parsedHistory = JSON.parse(history);
            console.log('从localStorage加载壁纸历史记录:', parsedHistory);
            resolve(parsedHistory);
          } else {
            console.log('未找到壁纸历史记录，返回空数组');
            resolve([]);
          }
        } catch (e) {
          console.error('解析本地壁纸历史记录时出错:', e);
          reject(e);
        }
      }
    } catch (e) {
      console.error('加载壁纸历史记录时出错:', e);
      reject(e);
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
    
    // 查找指定壁纸
    const wallpaper = history.find(item => item.id === wallpaperId);
    
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
      currentWallpaperIndex: history.findIndex(item => item.id === wallpaperId)
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
    
    // 查找指定壁纸索引
    const index = history.findIndex(item => item.id === wallpaperId);
    
    if (index === -1) {
      console.error(`未找到ID为 ${wallpaperId} 的壁纸`);
      return false;
    }
    
    // 加载当前设置
    const settings = await loadSettings();
    
    // 删除壁纸
    history.splice(index, 1);
    
    // 更新当前壁纸索引
    let currentIndex = settings.currentWallpaperIndex;
    if (currentIndex >= history.length) {
      currentIndex = history.length > 0 ? 0 : -1;
    } else if (currentIndex > index) {
      currentIndex--;
    }
    
    // 保存更新后的历史记录
    await saveWallpaperHistory(history);
    
    // 更新设置
    await saveSettings({
      ...settings,
      wallpaperHistory: history.map(item => ({
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
 * 切换到下一个壁纸
 */
export async function nextWallpaper() {
  try {
    // 加载当前设置
    const settings = await loadSettings();
    
    // 加载壁纸历史
    const history = await loadWallpaperHistory();
    
    if (history.length <= 1) {
      console.log('壁纸历史记录为空或只有一张壁纸，无法切换');
      return false;
    }
    
    // 计算下一个索引
    let nextIndex = settings.currentWallpaperIndex + 1;
    if (nextIndex >= history.length) {
      nextIndex = 0;
    }
    
    // 应用下一个壁纸
    await applyWallpaperFromHistory(history[nextIndex].id);
    
    return true;
  } catch (error) {
    console.error('切换到下一个壁纸时出错:', error);
    return false;
  }
}

/**
 * 切换到上一个壁纸
 */
export async function previousWallpaper() {
  try {
    // 加载当前设置
    const settings = await loadSettings();
    
    // 加载壁纸历史
    const history = await loadWallpaperHistory();
    
    if (history.length <= 1) {
      console.log('壁纸历史记录为空或只有一张壁纸，无法切换');
      return false;
    }
    
    // 计算上一个索引
    let prevIndex = settings.currentWallpaperIndex - 1;
    if (prevIndex < 0) {
      prevIndex = history.length - 1;
    }
    
    // 应用上一个壁纸
    await applyWallpaperFromHistory(history[prevIndex].id);
    
    return true;
  } catch (error) {
    console.error('切换到上一个壁纸时出错:', error);
    return false;
  }
}

/**
 * 启动壁纸自动切换
 * @param {number} intervalMinutes - 切换间隔（分钟）
 */
export function startWallpaperAutoChange(intervalMinutes = 30) {
  // 清除可能存在的旧定时器
  stopWallpaperAutoChange();
  
  // 设置新定时器
  const intervalMs = intervalMinutes * 60 * 1000;
  window.wallpaperAutoChangeTimer = setInterval(() => {
    nextWallpaper();
  }, intervalMs);
  
  console.log(`已启动壁纸自动切换，间隔: ${intervalMinutes} 分钟`);
}

/**
 * 停止壁纸自动切换
 */
export function stopWallpaperAutoChange() {
  if (window.wallpaperAutoChangeTimer) {
    clearInterval(window.wallpaperAutoChangeTimer);
    window.wallpaperAutoChangeTimer = null;
    console.log('已停止壁纸自动切换');
  }
} 