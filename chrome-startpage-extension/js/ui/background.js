// 背景设置相关模块
import { bgConfigs, WALLPAPER_HISTORY_KEY, WALLPAPER_FOLDER_KEY } from '../config.js';
import { hexToHSL, hslToHex, hexToRgb, deepenColor } from './utils.js';
import { applyAccentColors } from './accent.js';
import { loadSettings, saveSettings } from '../settings.js';

// 壁纸系统文件夹配置
const WALLPAPER_FOLDER_NAME = 'startx-wallpapers';

/**
 * 获取壁纸文件夹名称
 * @returns {Promise<string>} 壁纸文件夹名称
 */
export async function getWallpaperFolderName() {
  try {
    const settings = await loadSettings();
    return settings.wallpaperFolderPath || 'startx-wallpapers';
  } catch (error) {
    console.error('获取壁纸文件夹名称时出错:', error);
    return 'startx-wallpapers';
  }
}

/**
 * 设置壁纸文件夹名称
 * @param {string} folderName - 新的文件夹名称
 * @returns {Promise<boolean>} 是否设置成功
 */
export async function setWallpaperFolderName(folderName) {
  try {
    if (!folderName || typeof folderName !== 'string' || folderName.trim() === '') {
      return false;
    }
    
    // 清理文件夹名称，移除特殊字符
    const cleanFolderName = folderName.trim().replace(/[^\w-]/g, '_');
    
    // 更新设置
    const settings = await loadSettings();
    settings.wallpaperFolderPath = cleanFolderName;
    await saveSettings(settings);
    
    console.log(`壁纸文件夹路径已更新为: ${cleanFolderName}`);
    
    return true;
  } catch (error) {
    console.error('设置壁纸文件夹名称时出错:', error);
    return false;
  }
}

/**
 * 创建壁纸文件夹
 * @param {string} folderName - 文件夹名称
 * @returns {Promise<boolean>} 是否创建成功
 */
export async function createWallpaperFolder(folderName) {
  try {
    if (!folderName || typeof folderName !== 'string' || folderName.trim() === '') {
      folderName = 'startx-wallpapers'; // 使用默认名称
    }
    
    // 由于浏览器安全限制，我们不能直接创建文件夹
    // 但可以通过创建一个README文件来引导用户创建文件夹
    
    // 创建一个文本文件，包含说明信息
    const content = `StartX壁纸文件夹

这是StartX扩展的壁纸存储文件夹。
您可以将壁纸图片文件放在这个文件夹中，然后通过扩展的"导入壁纸"功能将它们添加到StartX中。

文件夹路径: ${folderName}

使用方法:
1. 将您喜欢的壁纸图片保存到这个文件夹
2. 在StartX的设置中点击"导入壁纸"按钮
3. 选择您想要导入的壁纸图片

注意: 为了获得最佳效果，建议使用高质量的图片作为壁纸。
`;

    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain' });
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${folderName}/README.txt`;
    
    // 添加到DOM并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理DOM
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 100);
    
    console.log(`已创建壁纸文件夹: ${folderName}`);
    return true;
  } catch (error) {
    console.error('创建壁纸文件夹时出错:', error);
    return false;
  }
}

/**
 * 初始化背景模块
 * @param {Object} domElements - DOM元素对象
 */
export async function initBackground(domElements) {
  console.log("初始化背景模块...");
  
  // 确保自定义背景元素存在
  let customBackground = document.getElementById('custom-background');
  if (!customBackground) {
    console.log("创建自定义背景元素");
    customBackground = document.createElement('div');
    customBackground.id = 'custom-background';
    document.body.appendChild(customBackground);
  }
  
  // 创建壁纸文件夹
  try {
    const folderName = await getWallpaperFolderName();
    
    // 如果有文件夹路径输入框，设置初始值
    if (domElements.wallpaperFolderPath) {
      domElements.wallpaperFolderPath.value = folderName;
    }
    
    // 检查是否是首次运行
    const settings = await loadSettings();
    if (!settings.wallpaperFolderCreated) {
      // 首次运行时创建文件夹
      await createWallpaperFolder(folderName);
      
      // 标记文件夹已创建
      settings.wallpaperFolderCreated = true;
      await saveSettings(settings);
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
          checkAndImportWallpapers().catch(error => {
            console.error("导入壁纸时出错:", error);
          });
        }, 2000);
      }
      
      const history = await loadWallpaperHistory();
      if (history && history.items) {
        console.log(`加载了 ${history.items.length} 个壁纸历史记录`);
        
        // 渲染壁纸历史记录
        renderWallpaperHistory(history, history.currentIndex, domElements.wallpaperHistoryGrid);
        
        // 初始化自动更换壁纸
        const settings = await loadSettings();
        if (settings.autoChangeWallpaper && settings.autoChangeInterval > 0) {
          startWallpaperAutoChange(settings.autoChangeInterval);
        }
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
  
  // 强调色现在只支持自动模式
  
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
 * 切换到下一个壁纸
 */
export async function nextWallpaper() {
  try {
    // 加载当前设置
    const settings = await loadSettings();
    
    // 加载壁纸历史
    const history = await loadWallpaperHistory();
    
    // 确保history.items存在
    if (!history.items || !Array.isArray(history.items)) {
      console.error('壁纸历史记录格式无效');
      return false;
    }
    
    if (history.items.length <= 1) {
      console.log('壁纸历史记录为空或只有一张壁纸，无法切换');
      return false;
    }
    
    // 计算下一个索引
    let nextIndex = (history.currentIndex >= 0 ? history.currentIndex : 0) + 1;
    if (nextIndex >= history.items.length) {
      nextIndex = 0;
    }
    
    // 应用下一个壁纸
    await applyWallpaperFromHistory(history.items[nextIndex].id);
    
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
    
    // 确保history.items存在
    if (!history.items || !Array.isArray(history.items)) {
      console.error('壁纸历史记录格式无效');
      return false;
    }
    
    if (history.items.length <= 1) {
      console.log('壁纸历史记录为空或只有一张壁纸，无法切换');
      return false;
    }
    
    // 计算上一个索引
    let prevIndex = (history.currentIndex >= 0 ? history.currentIndex : 0) - 1;
    if (prevIndex < 0) {
      prevIndex = history.items.length - 1;
    }
    
    // 应用上一个壁纸
    await applyWallpaperFromHistory(history.items[prevIndex].id);
    
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

/**
 * 渲染壁纸历史记录
 * @param {Array<WallpaperHistoryItem>} items - 壁纸历史项目数组
 * @param {number} currentIndex - 当前选中的索引
 * @param {HTMLElement} container - 容器元素
 */
function renderWallpaperHistory(items, currentIndex, container) {
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
 * 获取壁纸文件夹路径
 * @returns {Promise<string>} 壁纸文件夹路径
 */
export async function getWallpaperFolderPath() {
  try {
    const folderName = await getWallpaperFolderName();
    return folderName;
  } catch (error) {
    console.error('获取壁纸文件夹路径时出错:', error);
    return 'startx-wallpapers';
  }
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
    
    console.log(`壁纸已保存到下载文件夹，建议移动到 ${WALLPAPER_FOLDER_NAME} 文件夹`);
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
    const folderName = await getWallpaperFolderName();
    
    // 创建壁纸文件夹
    await createWallpaperFolder(folderName);
    
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
    const folderName = await getWallpaperFolderName();
    
    // 创建文件夹
    const success = await createWallpaperFolder(folderName);
    
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
async function createThumbnail(imageData) {
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