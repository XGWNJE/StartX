// Main entry point for the StartX extension.
import { initUIApp } from './ui.js';
import { loadSettings } from './settings.js';

// 添加全局调试功能
window.debugStartX = async () => {
  try {
    const settings = await loadSettings();
    console.log("当前设置状态:", settings);
    return settings;
  } catch (error) {
    console.error("获取设置失败:", error);
    return null;
  }
};

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('StartX 初始化中...');
    await initUIApp();
    console.log('StartX 初始化完成');
  } catch (error) {
    console.error('StartX 初始化失败:', error);
  }
}); 