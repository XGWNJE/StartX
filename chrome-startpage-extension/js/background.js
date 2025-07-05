// background.js - 后台脚本

// 后台脚本，处理与浏览器API的交互
console.log('Background script loaded');

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    console.log('收到消息:', request);
    
    // 根据消息类型执行不同操作
    switch (request.action) {
      case 'createFolder':
        // 在扩展目录中创建文件夹（这是模拟的，实际上扩展无法直接创建文件夹）
        console.log(`尝试创建文件夹: ${request.folderPath}`);
        // 这里只是模拟成功，实际上无法在扩展目录中创建文件夹
        sendResponse({ success: true });
        break;
        
      case 'importWallpapers':
        // 导入壁纸（模拟）
        console.log(`尝试从文件夹导入壁纸: ${request.folderPath}`);
        // 这里只是模拟成功，实际上需要用户手动导入
        sendResponse({ 
          success: true,
          wallpapers: [] // 实际应用中，这里会返回导入的壁纸列表
        });
        break;
        
      default:
        console.warn(`未知的消息类型: ${request.action}`);
        sendResponse({ success: false, error: '未知的消息类型' });
    }
    
    // 返回true表示我们会异步发送响应
    return true;
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装或更新:', details.reason);
  
  // 在这里可以执行一些初始化操作
  if (details.reason === 'install') {
    console.log('首次安装扩展');
    // 可以在这里设置一些默认配置
  } else if (details.reason === 'update') {
    console.log('扩展已更新');
    // 可以在这里处理版本更新相关的逻辑
  }
});

// 初始化
console.log('StartX background script initialized'); 