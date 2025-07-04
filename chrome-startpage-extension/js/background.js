// background.js - 后台脚本，处理文件系统操作

// 默认壁纸文件夹
const DEFAULT_WALLPAPER_FOLDER = 'wallpapers';

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'createFolder') {
    createFolder(message.folderPath, message.placeholderContent)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('创建文件夹失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // 返回true表示将异步发送响应
    return true;
  }
  
  if (message.action === 'importWallpapers') {
    importWallpapers(message.folderPath)
      .then(result => {
        sendResponse({ success: true, wallpapers: result });
      })
      .catch(error => {
        console.error('导入壁纸失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

/**
 * 创建文件夹
 * @param {string} folderPath - 文件夹路径
 * @param {string} placeholderContent - 占位文件内容
 * @returns {Promise<boolean>} 是否创建成功
 */
async function createFolder(folderPath = DEFAULT_WALLPAPER_FOLDER, placeholderContent = '') {
  try {
    // 获取文件系统访问权限
    const directoryHandle = await window.showDirectoryPicker({
      id: 'wallpapers',
      startIn: 'documents',
      mode: 'readwrite'
    });
    
    // 创建或获取子文件夹
    let folderHandle;
    try {
      folderHandle = await directoryHandle.getDirectoryHandle(folderPath, { create: true });
    } catch (error) {
      console.error(`无法创建文件夹 ${folderPath}:`, error);
      throw new Error(`无法创建文件夹: ${error.message}`);
    }
    
    // 创建占位文件
    if (placeholderContent) {
      try {
        const fileHandle = await folderHandle.getFileHandle('README.txt', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(placeholderContent);
        await writable.close();
      } catch (error) {
        console.error('创建占位文件失败:', error);
        // 继续执行，不要因为占位文件失败而中断
      }
    }
    
    // 保存文件夹句柄以供后续使用
    chrome.storage.local.set({ 
      wallpaperFolderHandle: await directoryHandle.isSameEntry(folderHandle) 
    });
    
    return true;
  } catch (error) {
    console.error('创建文件夹时出错:', error);
    throw error;
  }
}

/**
 * 导入壁纸
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise<Array>} 导入的壁纸列表
 */
async function importWallpapers(folderPath = DEFAULT_WALLPAPER_FOLDER) {
  try {
    // 获取文件系统访问权限
    const directoryHandle = await window.showDirectoryPicker({
      id: 'wallpapers',
      startIn: 'documents',
      mode: 'read'
    });
    
    // 获取子文件夹
    let folderHandle;
    try {
      folderHandle = await directoryHandle.getDirectoryHandle(folderPath);
    } catch (error) {
      console.error(`无法访问文件夹 ${folderPath}:`, error);
      throw new Error(`无法访问壁纸文件夹: ${error.message}`);
    }
    
    // 读取文件夹中的所有图片文件
    const wallpapers = [];
    for await (const entry of folderHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (file.type.startsWith('image/')) {
          // 读取图片文件
          const data = await readFileAsDataURL(file);
          wallpapers.push({
            name: file.name,
            data: data,
            date: new Date().toISOString()
          });
        }
      }
    }
    
    return wallpapers;
  } catch (error) {
    console.error('导入壁纸时出错:', error);
    throw error;
  }
}

/**
 * 将文件读取为Data URL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Data URL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

// 初始化
console.log('StartX background script initialized'); 