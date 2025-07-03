// 背景设置相关模块
import { bgConfigs } from '../config.js';
import { hexToHSL, hslToHex, hexToRgb, deepenColor } from './utils.js';
import { applyAccentColors, applyCustomAccentColor } from './accent.js';

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
 * 处理背景图片限制大小问题
 * @param {File} file - 图片文件
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
            const MAX_SIZE = 1920;
            let { width, height } = img;
            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              } else {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
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