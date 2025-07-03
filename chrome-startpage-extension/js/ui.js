// UI模块导出文件 - 重构后的版本
// 从各个子模块导入需要的功能

import { initUI } from './ui/index.js';
import { applyBackgroundSettings, processBackgroundImage } from './ui/background.js';
import { applySearchSettings, handleBookmarkSearch, hideBookmarksResults, handleKeyNavigation, disableAutofillHistory } from './ui/search.js';
import { applyThemeSettings } from './ui/theme.js';
import { applyAccentColors, applyCustomAccentColor, updateColorSwatches } from './ui/accent.js';
import { updateUIState, handleSettingsChange, applyAllSettings } from './ui/state.js';

// 导出所有需要的函数，保持向后兼容性
export {
  initUI,
  applyBackgroundSettings,
  processBackgroundImage,
  applySearchSettings,
  applyThemeSettings,
  applyAccentColors,
  applyCustomAccentColor,
  updateColorSwatches,
  updateUIState,
  handleSettingsChange,
  applyAllSettings,
  handleBookmarkSearch,
  hideBookmarksResults,
  handleKeyNavigation,
  disableAutofillHistory
};