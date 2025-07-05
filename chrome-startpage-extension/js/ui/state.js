// UI状态管理模块
import { loadSettings, saveSettings } from '../settings.js';
import { bgConfigs } from '../config.js';
import { applyBackgroundSettings } from './background.js';
import { applySearchSettings } from './search.js';
import { applyThemeSettings } from './theme.js';
import { updateColorSwatches } from './accent.js';
import { updateThemePreview } from './theme.js';

/**
 * 初始化状态管理模块
 * @param {Object} domElements - DOM元素对象
 */
export async function initState(domElements) {
  console.log("初始化状态管理模块...");
  
  try {
    // 加载当前设置
    const settings = await loadSettings();
    console.log("加载当前设置:", settings);
    
    // 应用所有设置
    applyAllSettings(settings);
    
    // 更新UI状态
    updateUIState(settings, domElements);
    
    console.log("状态管理模块初始化完成");
    return true;
  } catch (error) {
    console.error("状态管理模块初始化失败:", error);
    throw error;
  }
}

/**
 * 更新UI状态以反映当前设置
 * @param {Object} settings - 用户设置
 * @param {Object} domElements - DOM元素对象
 */
export function updateUIState(settings, domElements) {
  console.log("更新UI状态，当前背景类型:", settings.bgType, "预设名称:", settings.presetName);
  
  const {
    searchEngineBtns,
    accentModeBtns, primarySwatch, secondarySwatch, tertiarySwatch,
    themeModeBtns, themePresetBtns, customThemeControls,
    bgOpacity, bgBlur, opacityValue, blurValue,
    searchWidth, searchHeight, searchRadius, widthValue, heightValue, radiusValue,
    glassOpacity, glassBlur, glassOpacityValue, glassBlurValue,
    textSize, textSizeValue,
    placeholderText,
    removeCustomBg
  } = domElements || {};
  
  // 更新搜索引擎按钮的激活状态
  if (searchEngineBtns) {
    searchEngineBtns.forEach(btn => {
      const engineName = btn.getAttribute('data-engine');
      btn.classList.remove('active');
      
      if (settings.searchEngine === engineName) {
        btn.classList.add('active');
      }
    });
  }
  
  // 更新强调色模式
  if (accentModeBtns) {
    // 确保"自动匹配"按钮处于激活状态
    accentModeBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-mode') === 'auto') {
        btn.classList.add('active');
      }
    });
    
    // 更新颜色预览
    if (primarySwatch && secondarySwatch && tertiarySwatch) {
      updateColorSwatches(primarySwatch, secondarySwatch, tertiarySwatch);
    }
  }
  
  // 更新主题模式按钮的激活状态
  if (themeModeBtns) {
    themeModeBtns.forEach(btn => {
      const modeName = btn.getAttribute('data-mode');
      btn.classList.remove('active');
      
      if (settings.themeMode === modeName) {
        btn.classList.add('active');
      }
    });
  }
  
  // 更新主题预设按钮的激活状态
  if (themePresetBtns) {
    themePresetBtns.forEach(btn => {
      const presetName = btn.getAttribute('data-theme');
      btn.classList.remove('active');
      
      if (settings.themePreset === presetName) {
        btn.classList.add('active');
      }
    });
  }
  
  // 更新自定义主题控件状态
  if (customThemeControls) {
    const isCustomMode = settings.themeMode === 'custom';
    
    // 遍历所有自定义主题颜色输入框
    customThemeControls.querySelectorAll('input[type="color"]').forEach(input => {
      const colorType = input.getAttribute('data-color-type');
      
      // 启用/禁用输入框
      input.disabled = !isCustomMode;
      
      // 设置当前值
      if (settings.customThemeColors && settings.customThemeColors[colorType]) {
        input.value = settings.customThemeColors[colorType];
      }
    });
    
    // 更新主题预览
    updateThemePreview(settings);
  }
  
  // 更新其他UI控件状态
  if (bgOpacity && bgBlur && opacityValue && blurValue) {
    bgOpacity.value = settings.opacity;
    bgBlur.value = settings.blur;
    opacityValue.textContent = `${settings.opacity}%`;
    blurValue.textContent = `${settings.blur}px`;
  }
  
  if (searchWidth && searchHeight && searchRadius && widthValue && heightValue && radiusValue) {
    searchWidth.value = settings.searchWidth;
    searchHeight.value = settings.searchHeight;
    searchRadius.value = settings.searchRadius;
    widthValue.textContent = `${settings.searchWidth}px`;
    heightValue.textContent = `${settings.searchHeight}px`;
    radiusValue.textContent = `${settings.searchRadius}px`;
  }
  
  if (glassOpacity && glassBlur && glassOpacityValue && glassBlurValue) {
    glassOpacity.value = settings.glassOpacity;
    glassBlur.value = settings.glassBlur;
    glassOpacityValue.textContent = (settings.glassOpacity / 100).toFixed(2);
    glassBlurValue.textContent = `${settings.glassBlur}px`;
  }
  
  if (textSize && textSizeValue) {
    textSize.value = settings.textSize;
    textSizeValue.textContent = `${settings.textSize}px`;
  }
  
  if (placeholderText) {
    placeholderText.value = settings.placeholder || '搜索网页、书签';
  }
  
  // 更新自定义背景移除按钮状态
  if (removeCustomBg) {
    removeCustomBg.disabled = !(settings.bgType === 'custom' && settings.customBgData);
  }
}

/**
 * 统一设置处理函数
 * @param {Object} newSettings - 新设置
 * @param {Object} domElements - DOM元素对象
 */
let isSaving = false; // 操作锁，防止竞态条件
export async function handleSettingsChange(newSettings, domElements) {
  if (isSaving) {
    console.warn("一个设置操作正在进行中，已忽略本次操作。");
    return;
  }
  isSaving = true;

  try {
    // 加载当前设置
    const currentSettings = await loadSettings();
    console.log("当前设置:", currentSettings);
    console.log("新设置:", newSettings);
    
    // 合并设置
    const mergedSettings = { ...currentSettings, ...newSettings };
    
    // 验证设置的完整性
    if (mergedSettings.bgType === 'preset' && (!mergedSettings.presetName || !bgConfigs || !bgConfigs[mergedSettings.presetName])) {
      console.warn(`无效的预设名称: ${mergedSettings.presetName}，重置为default`);
      mergedSettings.presetName = 'default';
      mergedSettings.bgType = 'default'; // 如果bgConfigs不存在，使用默认背景
    }
    
    console.log("最终合并设置:", mergedSettings);
    
    // 应用所有设置到DOM
    // 注意：对于背景设置的更改，我们优先使用专门的背景设置函数
    if (newSettings.bgType || newSettings.presetName || newSettings.customBgData) {
      applyBackgroundSettings(mergedSettings);
    }
    
    // 应用搜索栏设置
    applySearchSettings(mergedSettings);
    
    // 应用主题颜色设置
    applyThemeSettings(mergedSettings);
    
    // 保存到存储
    await saveSettings(mergedSettings);
    
    // 更新UI滑块等状态
    updateUIState(mergedSettings, domElements);
    
    console.log("设置已成功更新和应用:", mergedSettings);
  } catch (error) {
    console.error("处理设置变更时出错:", error);
    alert("应用设置失败，请刷新页面重试。");
  } finally {
    isSaving = false; // 释放锁
  }
}

/**
 * 应用所有设置
 * @param {Object} settings - 用户设置
 */
export function applyAllSettings(settings) {
  // 强制设置accentColorMode为auto
  settings.accentColorMode = 'auto';
  
  // 应用背景设置
  applyBackgroundSettings(settings);
  
  // 应用搜索栏设置
  applySearchSettings(settings);
  
  // 应用主题颜色设置
  applyThemeSettings(settings);
} 