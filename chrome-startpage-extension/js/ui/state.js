// UI状态管理模块
import { loadSettings, saveSettings } from '../settings.js';
import { bgConfigs } from '../config.js';
import { applyBackgroundSettings } from './background.js';
import { applySearchSettings } from './search.js';
import { applyThemeSettings } from './theme.js';
import { updateColorSwatches } from './accent.js';
import { updateThemePreview } from './theme.js';

/**
 * 更新UI状态以反映当前设置
 * @param {Object} settings - 用户设置
 * @param {Object} domElements - DOM元素对象
 */
export function updateUIState(settings, domElements) {
  console.log("更新UI状态，当前背景类型:", settings.bgType, "预设名称:", settings.presetName);
  
  // 确保domElements存在
  if (!domElements) {
    console.error("updateUIState: domElements对象为空");
    return;
  }
  
  const {
    bgPresets, bgOpacity, bgBlur, opacityValue, blurValue,
    searchWidth, searchHeight, searchRadius, widthValue, heightValue, radiusValue,
    glassOpacity, glassBlur, glassOpacityValue, glassBlurValue,
    textSize, textSizeValue,
    placeholderText, removeCustomBg,
    searchEngineBtns,
    accentModeBtns, customAccentColor, customSecondaryColor, useCustomGradient, gradientDirectionSelect,
    primarySwatch, secondarySwatch, tertiarySwatch, gradientSwatch,
    themeModeBtns, themePresetBtns, customThemeControls
  } = domElements;

  // 更新背景预设的激活状态
  if (bgPresets) {
    bgPresets.forEach(preset => {
      const presetName = preset.getAttribute('data-bg');
      preset.classList.remove('active');
      
      if (settings.bgType === 'preset' && presetName === settings.presetName) {
        // 预设背景匹配
        preset.classList.add('active');
      } else if (settings.bgType === 'default' && presetName === 'default') {
        // 默认背景
        preset.classList.add('active');
      }
    });
  } else {
    console.warn("updateUIState: bgPresets不存在");
  }
  
  // 更新搜索引擎选择按钮的激活状态
  if (searchEngineBtns) {
    searchEngineBtns.forEach(btn => {
      const engineName = btn.getAttribute('data-engine');
      btn.classList.remove('active');
      
      if (settings.searchEngine === engineName) {
        btn.classList.add('active');
      }
    });
  } else {
    console.warn("updateUIState: searchEngineBtns不存在");
  }
  
  // 更新强调色模式按钮的激活状态
  if (accentModeBtns) {
    accentModeBtns.forEach(btn => {
      const modeName = btn.getAttribute('data-mode');
      btn.classList.remove('active');
      
      if (settings.accentColorMode === modeName) {
        btn.classList.add('active');
      }
    });
    
    // 更新自定义颜色输入框
    if (customAccentColor) {
      customAccentColor.value = settings.customAccentColor || '#7d6aff';
      customAccentColor.disabled = settings.accentColorMode !== 'custom';
    } else {
      console.warn("updateUIState: customAccentColor不存在");
    }
    
    // 更新辅助颜色输入框
    if (customSecondaryColor) {
      customSecondaryColor.value = settings.customSecondaryColor || '#ff7eb3';
      customSecondaryColor.disabled = !settings.useCustomGradient || settings.accentColorMode !== 'custom';
    } else {
      console.warn("updateUIState: customSecondaryColor不存在");
    }
    
    // 更新自定义渐变复选框
    if (useCustomGradient) {
      useCustomGradient.checked = settings.useCustomGradient || false;
      useCustomGradient.disabled = settings.accentColorMode !== 'custom';
    } else {
      console.warn("updateUIState: useCustomGradient不存在");
    }
    
    // 更新渐变方向选择器
    if (gradientDirectionSelect) {
      gradientDirectionSelect.value = settings.gradientDirection || 'to right';
      gradientDirectionSelect.disabled = settings.accentColorMode !== 'custom';
    } else {
      console.warn("updateUIState: gradientDirectionSelect不存在");
    }
    
    // 更新颜色预览
    if (primarySwatch && secondarySwatch && tertiarySwatch && gradientSwatch) {
      updateColorSwatches(primarySwatch, secondarySwatch, tertiarySwatch, gradientSwatch);
    } else {
      console.warn("updateUIState: 颜色样本元素不存在");
    }
  } else {
    console.warn("updateUIState: accentModeBtns不存在");
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
  } else {
    console.warn("updateUIState: themeModeBtns不存在");
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
  } else {
    console.warn("updateUIState: themePresetBtns不存在");
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
  } else {
    console.warn("updateUIState: customThemeControls不存在");
  }
  
  // 更新其他UI控件状态
  if (bgOpacity && bgBlur && opacityValue && blurValue) {
    bgOpacity.value = settings.opacity;
    bgBlur.value = settings.blur;
    opacityValue.textContent = `${settings.opacity}%`;
    blurValue.textContent = `${settings.blur}px`;
  } else {
    console.warn("updateUIState: 背景不透明度或模糊度控件不存在");
  }
  
  if (searchWidth && searchHeight && searchRadius && widthValue && heightValue && radiusValue) {
    searchWidth.value = settings.searchWidth;
    searchHeight.value = settings.searchHeight;
    searchRadius.value = settings.searchRadius;
    widthValue.textContent = `${settings.searchWidth}px`;
    heightValue.textContent = `${settings.searchHeight}px`;
    radiusValue.textContent = `${settings.searchRadius}px`;
  } else {
    console.warn("updateUIState: 搜索栏尺寸控件不存在");
  }
  
  if (glassOpacity && glassBlur && glassOpacityValue && glassBlurValue) {
    glassOpacity.value = settings.glassOpacity;
    glassBlur.value = settings.glassBlur;
    glassOpacityValue.textContent = (settings.glassOpacity / 100).toFixed(2);
    glassBlurValue.textContent = `${settings.glassBlur}px`;
  } else {
    console.warn("updateUIState: 玻璃效果控件不存在");
  }
  
  if (textSize && textSizeValue) {
    textSize.value = settings.textSize;
    textSizeValue.textContent = `${settings.textSize}px`;
  } else {
    console.warn("updateUIState: 文本大小控件不存在");
  }
  
  if (placeholderText) {
    placeholderText.value = settings.placeholder || '｜';
  } else {
    console.warn("updateUIState: 占位符文本控件不存在");
  }
  
  // 更新自定义背景移除按钮状态
  if (removeCustomBg) {
    removeCustomBg.disabled = !(settings.bgType === 'custom' && settings.customBgData);
  } else {
    console.warn("updateUIState: 移除自定义背景按钮不存在");
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
  // 应用背景设置
  applyBackgroundSettings(settings);
  
  // 应用搜索栏设置
  applySearchSettings(settings);
  
  // 应用主题颜色设置
  applyThemeSettings(settings);
} 