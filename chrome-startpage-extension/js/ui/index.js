// UI模块主入口文件
import { loadSettings } from '../settings.js';
import { applyAllSettings } from './state.js';
import { initEvents } from './events.js';
import { updateUIState } from './state.js';

/**
 * 初始化UI
 * @param {Object} domElements - DOM元素对象
 */
export function initUI(domElements) {
  console.log("初始化UI...");
  
  // 添加调试输出，检查关键DOM元素是否存在
  console.log("检查关键DOM元素:");
  console.log("- 强调色模式按钮:", domElements.accentModeBtns ? domElements.accentModeBtns.length : "未找到");
  console.log("- 自定义强调色输入框:", domElements.customAccentColor ? "已找到" : "未找到");
  console.log("- 主题模式按钮:", domElements.themeModeBtns ? domElements.themeModeBtns.length : "未找到");
  console.log("- 主题预设按钮:", domElements.themePresetBtns ? domElements.themePresetBtns.length : "未找到");
  console.log("- 自定义主题控件:", domElements.customThemeControls ? "已找到" : "未找到");
  
  // 立即加载并显示当前设置
  loadSettings().then(settings => {
    console.log("当前设置状态:", JSON.stringify(settings, null, 2));
    
    // 应用所有设置
    applyAllSettings(settings);
    
    // 更新UI状态
    updateUIState(settings, domElements);
    
    // 初始化事件处理
    initEvents(domElements);
  }).catch(err => {
    console.error("加载设置失败:", err);
  });
} 