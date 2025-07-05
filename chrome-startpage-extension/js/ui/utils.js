// 工具函数模块

/**
 * 加深颜色
 * @param {string} hexColor - 十六进制颜色值
 * @param {number} amount - 加深量（0-1）
 * @returns {string} 加深后的十六进制颜色值
 */
export function deepenColor(hexColor, amount) {
  // 转换为HSL
  const hsl = hexToHSL(hexColor);
  if (!hsl) return hexColor;
  
  // 降低亮度以加深颜色，但确保不会太暗
  hsl.l = Math.max(10, hsl.l - amount * 100);
  
  // 增加饱和度以使颜色更鲜艳
  hsl.s = Math.min(100, hsl.s + amount * 50);
  
  // 转换回HEX
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * 颜色转换工具函数 - HEX转RGB
 * @param {string} hex - 十六进制颜色值
 * @returns {Object|null} RGB颜色对象 {r, g, b}
 */
export function hexToRgb(hex) {
  if (!hex) return null;
  
  // 移除#前缀如果存在
  hex = hex.replace(/^#/, '');
  
  // 处理简写形式 (#RGB)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // 确保是有效的六位十六进制
  if (hex.length !== 6) {
    console.warn('无效的十六进制颜色值:', hex);
    return null;
  }
  
  try {
    // 解析十六进制颜色
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    
    return { r, g, b };
  } catch (e) {
    console.error('解析十六进制颜色时出错:', e);
    return null;
  }
}

/**
 * 颜色转换工具函数 - HEX转HSL
 * @param {string} hex - 十六进制颜色值
 * @returns {Object|null} HSL颜色对象 {h, s, l}
 */
export function hexToHSL(hex) {
  if (!hex) return null;
  
  // 获取RGB值
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  // 将RGB转换为0-1范围
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  
  // 找出最大和最小的RGB值
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  
  // 计算亮度
  let l = (max + min) / 2;
  
  let h, s;
  
  if (max === min) {
    // 无色调（灰色）
    h = s = 0;
  } else {
    // 计算色相和饱和度
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h = Math.round(h * 60); // 转换为度
  }
  
  s = Math.round(s * 100); // 转换为百分比
  l = Math.round(l * 100); // 转换为百分比
  
  return { h, s, l };
}

/**
 * 颜色转换工具函数 - HSL转HEX
 * @param {number} h - 色相（0-360）
 * @param {number} s - 饱和度（0-100）
 * @param {number} l - 亮度（0-100）
 * @returns {string} 十六进制颜色值
 */
export function hslToHex(h, s, l) {
  // 将s和l转换回0-1范围
  s /= 100;
  l /= 100;
  
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  // 转换为十六进制
  let rHex = r.toString(16).padStart(2, '0');
  let gHex = g.toString(16).padStart(2, '0');
  let bHex = b.toString(16).padStart(2, '0');
  
  return `#${rHex}${gHex}${bHex}`;
}

/**
 * UI工具函数模块
 */

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 节流后的函数
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

/**
 * 防抖函数 - 延迟函数执行，直到一段时间内没有再次调用
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * 计算颜色的亮度
 * @param {string} color - RGB颜色字符串，格式为 "rgb(r, g, b)" 或 "rgba(r, g, b, a)"
 * @returns {number} - 颜色的亮度值 (0-255)
 */
export function getColorBrightness(color) {
  // 提取RGB值
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
  if (!rgbMatch) return 127; // 默认中等亮度
  
  const r = parseInt(rgbMatch[1], 10);
  const g = parseInt(rgbMatch[2], 10);
  const b = parseInt(rgbMatch[3], 10);
  
  // 使用感知亮度公式: (0.299*R + 0.587*G + 0.114*B)
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 设置按钮自适应对比度
 * 根据背景颜色动态调整设置按钮的样式，确保在不同背景下都有良好的可见性
 */
export function adaptSettingsButtonContrast() {
  // 获取设置按钮元素
  const settingsButton = document.querySelector('.settings-button');
  if (!settingsButton) return;

  // 创建一个观察器实例，用于检测背景变化
  const observer = new MutationObserver(throttle(() => {
    updateSettingsButtonStyle();
  }, 200));

  // 开始观察文档根元素的样式变化
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // 初始化按钮样式
  updateSettingsButtonStyle();

  // 每当窗口滚动或调整大小时重新计算
  window.addEventListener('scroll', throttle(updateSettingsButtonStyle, 200));
  window.addEventListener('resize', throttle(updateSettingsButtonStyle, 200));

  /**
   * 更新设置按钮样式
   * 通过采样按钮位置的背景颜色来决定按钮应该使用亮色还是暗色样式
   */
  function updateSettingsButtonStyle() {
    try {
      // 获取按钮位置
      const rect = settingsButton.getBoundingClientRect();
      
      // 获取文档背景颜色
      const bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
      const htmlBackgroundColor = getComputedStyle(document.documentElement).backgroundColor;
      
      // 获取--theme-background变量值
      const themeBackground = getComputedStyle(document.documentElement).getPropertyValue('--theme-background').trim();
      
      // 获取--accent-primary变量值
      const accentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
      
      // 使用可用的颜色计算亮度
      let avgBrightness = 0;
      let colorCount = 0;
      
      // 检查并计算每个可用颜色的亮度
      if (bodyBackgroundColor && bodyBackgroundColor !== 'rgba(0, 0, 0, 0)') {
        avgBrightness += getColorBrightness(bodyBackgroundColor);
        colorCount++;
      }
      
      if (htmlBackgroundColor && htmlBackgroundColor !== 'rgba(0, 0, 0, 0)') {
        avgBrightness += getColorBrightness(htmlBackgroundColor);
        colorCount++;
      }
      
      if (themeBackground && themeBackground !== 'transparent') {
        // 如果是十六进制颜色，转换为rgb
        if (themeBackground.startsWith('#')) {
          const rgb = hexToRgb(themeBackground);
          if (rgb) {
            const rgbColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            avgBrightness += getColorBrightness(rgbColor);
            colorCount++;
          }
        } else {
          avgBrightness += getColorBrightness(themeBackground);
          colorCount++;
        }
      }
      
      // 如果没有有效的背景颜色，使用强调色作为参考
      if (colorCount === 0 && accentPrimary && accentPrimary !== 'transparent') {
        if (accentPrimary.startsWith('#')) {
          const rgb = hexToRgb(accentPrimary);
          if (rgb) {
            const rgbColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            avgBrightness += getColorBrightness(rgbColor);
            colorCount++;
          }
        } else {
          avgBrightness += getColorBrightness(accentPrimary);
          colorCount++;
        }
      }
      
      // 如果仍然没有有效的颜色，使用默认亮度
      if (colorCount === 0) {
        avgBrightness = 127; // 默认中等亮度
        colorCount = 1;
      }
      
      // 计算平均亮度
      avgBrightness = avgBrightness / colorCount;
      
      // 根据亮度决定按钮样式
      const brightnessThreshold = 128; // 0-255之间的阈值
      
      // 移除所有可能的类
      settingsButton.classList.remove('light-mode', 'dark-mode');
      
      // 添加适当的类
      if (avgBrightness > brightnessThreshold) {
        // 背景较亮，使用暗色按钮
        settingsButton.classList.add('dark-mode');
      } else {
        // 背景较暗，使用亮色按钮
        settingsButton.classList.add('light-mode');
      }
    } catch (error) {
      console.error('更新设置按钮样式时出错:', error);
      // 出错时使用默认样式
      settingsButton.classList.remove('light-mode', 'dark-mode');
    }
  }
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的日期字符串
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 生成唯一ID
 * @returns {string} - 唯一ID
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
} 