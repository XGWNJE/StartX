// 主题设置相关模块
import { themePresets } from '../config.js';

/**
 * 应用主题颜色设置
 * @param {Object} settings - 用户设置
 */
export function applyThemeSettings(settings) {
  console.log("应用主题颜色设置:", settings.themeMode, settings.themePreset);
  
  let themeColors;
  
  if (settings.themeMode === 'preset' && settings.themePreset) {
    // 使用预设主题
    const preset = themePresets[settings.themePreset];
    if (preset) {
      themeColors = preset.colors;
    } else {
      console.warn(`预设主题 "${settings.themePreset}" 未找到，使用默认主题`);
      themeColors = themePresets.dark.colors;
    }
  } else if (settings.themeMode === 'custom' && settings.customThemeColors) {
    // 使用自定义主题颜色
    themeColors = settings.customThemeColors;
  } else {
    // 使用默认主题
    themeColors = themePresets.dark.colors;
  }
  
  // 应用主题颜色
  document.documentElement.style.setProperty('--theme-background', themeColors.background);
  document.documentElement.style.setProperty('--theme-surface', themeColors.surface);
  document.documentElement.style.setProperty('--theme-text', themeColors.text);
  document.documentElement.style.setProperty('--theme-text-secondary', themeColors.textSecondary);
  document.documentElement.style.setProperty('--theme-border', themeColors.border);
  document.documentElement.style.setProperty('--theme-shadow', themeColors.shadow);
  
  // 强制重绘
  document.body.classList.add('force-repaint');
  void document.body.offsetHeight;
  document.body.classList.remove('force-repaint');
}

/**
 * 更新主题预览
 * @param {Object} settings - 用户设置
 */
export function updateThemePreview(settings) {
  const previewElements = {
    header: document.querySelector('.theme-preview-header'),
    body: document.querySelector('.theme-preview-body'),
    text: document.querySelector('.theme-preview-text'),
    textSecondary: document.querySelector('.theme-preview-text-secondary'),
    button: document.querySelector('.theme-preview-button')
  };
  
  // 如果预览元素不存在，直接返回
  if (!previewElements.header) return;
  
  // 获取当前主题颜色
  const background = getComputedStyle(document.documentElement).getPropertyValue('--theme-background').trim();
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--theme-surface').trim();
  const text = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-secondary').trim();
  const border = getComputedStyle(document.documentElement).getPropertyValue('--theme-border').trim();
  
  // 应用到预览元素
  previewElements.header.style.backgroundColor = background;
  previewElements.header.style.borderColor = border;
  previewElements.body.style.backgroundColor = surface;
  previewElements.text.style.color = text;
  previewElements.textSecondary.style.color = textSecondary;
} 