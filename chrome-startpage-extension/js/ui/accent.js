// 强调色设置相关模块
import { hexToRgb, hexToHSL, hslToHex } from './utils.js';

/**
 * 初始化强调色模块
 * @param {Object} domElements - DOM元素对象
 */
export async function initAccent(domElements) {
  console.log("初始化强调色模块...");
  
  try {
    // 获取强调色样本元素
    const primarySwatch = domElements?.primarySwatch;
    const secondarySwatch = domElements?.secondarySwatch;
    const tertiarySwatch = domElements?.tertiarySwatch;
    
    // 更新颜色样本显示
    if (primarySwatch && secondarySwatch && tertiarySwatch) {
      updateColorSwatches(primarySwatch, secondarySwatch, tertiarySwatch);
    } else {
      console.warn("强调色样本元素不存在，无法更新颜色样本");
    }
    
    console.log("强调色模块初始化完成");
    return true;
  } catch (error) {
    console.error("初始化强调色模块时出错:", error);
    // 即使出错也返回成功，不影响其他模块初始化
    return true;
  }
}

/**
 * 应用强调色
 * @param {Object} accentColors - 强调色配置对象
 */
export function applyAccentColors(accentColors) {
  console.log("应用强调色:", accentColors);
  
  document.documentElement.style.setProperty('--accent-primary', accentColors.primary);
  document.documentElement.style.setProperty('--accent-secondary', accentColors.secondary);
  document.documentElement.style.setProperty('--accent-tertiary', accentColors.tertiary);
  
  // 更新RGB格式的变量
  const primaryRGB = hexToRgb(accentColors.primary);
  const secondaryRGB = hexToRgb(accentColors.secondary);
  const tertiaryRGB = hexToRgb(accentColors.tertiary);
  
  if (primaryRGB) {
    document.documentElement.style.setProperty('--accent-primary-rgb', `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`);
  }
  if (secondaryRGB) {
    document.documentElement.style.setProperty('--accent-secondary-rgb', `${secondaryRGB.r}, ${secondaryRGB.g}, ${secondaryRGB.b}`);
  }
  if (tertiaryRGB) {
    document.documentElement.style.setProperty('--accent-tertiary-rgb', `${tertiaryRGB.r}, ${tertiaryRGB.g}, ${tertiaryRGB.b}`);
  }
}

// 移除自定义强调色功能

/**
 * 更新颜色样本
 * @param {HTMLElement} primarySwatch - 主强调色样本元素
 * @param {HTMLElement} secondarySwatch - 辅助强调色样本元素
 * @param {HTMLElement} tertiarySwatch - 第三强调色样本元素
 */
export function updateColorSwatches(primarySwatch, secondarySwatch, tertiarySwatch) {
  if (!primarySwatch || !secondarySwatch || !tertiarySwatch) return;
  
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
  const secondary = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
  const tertiary = getComputedStyle(document.documentElement).getPropertyValue('--accent-tertiary').trim();
  
  primarySwatch.style.backgroundColor = primary;
  secondarySwatch.style.backgroundColor = secondary;
  tertiarySwatch.style.backgroundColor = tertiary;
} 