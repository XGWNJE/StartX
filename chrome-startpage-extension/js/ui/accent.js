// 强调色设置相关模块
import { hexToRgb, hexToHSL, hslToHex } from './utils.js';

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
  
  // 更新渐变
  document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(to right, ${accentColors.secondary}, ${accentColors.primary})`);
}

/**
 * 应用自定义强调色
 * @param {string} customColor - 自定义主强调色
 * @param {Object} options - 配置选项
 */
export function applyCustomAccentColor(customColor, options = {}) {
  console.log("应用自定义强调色:", customColor, options);
  
  // 设置主强调色
  document.documentElement.style.setProperty('--accent-primary', customColor);
  
  // 获取辅助强调色
  let secondaryColor;
  let tertiaryColor;
  
  // 获取HSL值
  const hsl = hexToHSL(customColor);
  
  if (options.useCustomGradient && options.secondaryColor) {
    // 使用用户提供的辅助强调色
    secondaryColor = options.secondaryColor;
  } else {
    // 生成辅助强调色
    if (hsl) {
      // 生成互补色（色相偏移180度）
      const complementaryHue = (hsl.h + 180) % 360;
      secondaryColor = hslToHex(complementaryHue, hsl.s, hsl.l);
    } else {
      secondaryColor = '#ff7eb3'; // 默认辅助色
    }
  }
  
  // 设置辅助强调色
  document.documentElement.style.setProperty('--accent-secondary', secondaryColor);
  
  // 生成第三种颜色（色相偏移90度）
  if (hsl) {
    const tertiaryHue = (hsl.h + 90) % 360;
    tertiaryColor = hslToHex(tertiaryHue, hsl.s, hsl.l);
    document.documentElement.style.setProperty('--accent-tertiary', tertiaryColor);
  }
  
  // 更新RGB格式的变量
  const primaryRGB = hexToRgb(customColor);
  const secondaryRGB = hexToRgb(secondaryColor);
  const tertiaryRGB = tertiaryColor ? hexToRgb(tertiaryColor) : null;
  
  if (primaryRGB) {
    document.documentElement.style.setProperty('--accent-primary-rgb', `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`);
  }
  if (secondaryRGB) {
    document.documentElement.style.setProperty('--accent-secondary-rgb', `${secondaryRGB.r}, ${secondaryRGB.g}, ${secondaryRGB.b}`);
  }
  if (tertiaryRGB) {
    document.documentElement.style.setProperty('--accent-tertiary-rgb', `${tertiaryRGB.r}, ${tertiaryRGB.g}, ${tertiaryRGB.b}`);
  }
  
  // 设置渐变方向
  const direction = options.gradientDirection || 'to right';
  
  // 更新渐变
  document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(${direction}, ${secondaryColor}, ${customColor})`);
}

/**
 * 更新颜色样本
 * @param {HTMLElement} primarySwatch - 主强调色样本元素
 * @param {HTMLElement} secondarySwatch - 辅助强调色样本元素
 * @param {HTMLElement} tertiarySwatch - 第三强调色样本元素
 * @param {HTMLElement} gradientSwatch - 渐变样本元素
 */
export function updateColorSwatches(primarySwatch, secondarySwatch, tertiarySwatch, gradientSwatch) {
  if (!primarySwatch || !secondarySwatch || !tertiarySwatch || !gradientSwatch) return;
  
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
  const secondary = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
  const tertiary = getComputedStyle(document.documentElement).getPropertyValue('--accent-tertiary').trim();
  const gradient = getComputedStyle(document.documentElement).getPropertyValue('--accent-gradient').trim();
  
  primarySwatch.style.backgroundColor = primary;
  secondarySwatch.style.backgroundColor = secondary;
  tertiarySwatch.style.backgroundColor = tertiary;
  gradientSwatch.style.background = gradient;
} 