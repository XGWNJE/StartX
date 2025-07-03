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