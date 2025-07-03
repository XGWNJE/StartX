import { defaultSettings, SETTINGS_INFO_KEY, CUSTOM_BG_KEY } from './config.js';

// 加载用户设置
export function loadSettings() {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否在Chrome插件环境中
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        // 使用Chrome存储API获取设置，先尝试读取小块数据确认存在设置
        chrome.storage.local.get([SETTINGS_INFO_KEY], (infoResult) => {
          if (chrome.runtime.lastError) {
            console.error('从Chrome存储加载设置时出错:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          
          if (infoResult && infoResult[SETTINGS_INFO_KEY]) {
            console.log('找到设置信息:', infoResult[SETTINGS_INFO_KEY]);
            
            // 创建合并的设置对象
            let settings = {};
            
            // 确保我们有一个完整的设置对象
            settings = {...defaultSettings, ...infoResult[SETTINGS_INFO_KEY].settings};
            
            // 如果有自定义背景，单独加载背景数据
            if (infoResult[SETTINGS_INFO_KEY].hasCustomBg) {
              // 然后加载背景数据
              chrome.storage.local.get([CUSTOM_BG_KEY], (bgResult) => {
                if (chrome.runtime.lastError) {
                  console.error('从Chrome存储加载背景数据时出错:', chrome.runtime.lastError);
                  // 继续使用无背景的设置
                  settings.bgType = 'default';
                  settings.customBgData = null;
                  return resolve(settings);
                }
                
                if (bgResult && bgResult[CUSTOM_BG_KEY]) {
                  console.log('加载自定义背景数据成功');
                  settings.customBgData = bgResult[CUSTOM_BG_KEY];
                } else {
                  console.warn('找不到自定义背景数据，重置为默认背景');
                  settings.bgType = 'default';
                  settings.customBgData = null;
                }
                resolve(settings);
              });
            } else {
              // 没有自定义背景，直接返回设置
              resolve(settings);
            }
          } else {
            console.log('未找到已保存的设置，使用默认设置');
            resolve({...defaultSettings});
          }
        });
      } else {
        // 本地开发环境下，从localStorage读取
        try {
          // 首先检查设置信息是否存在
          const settingsInfo = localStorage.getItem(SETTINGS_INFO_KEY);
          
          if (settingsInfo) {
            const parsedInfo = JSON.parse(settingsInfo);
            console.log('从localStorage加载设置信息:', parsedInfo);
            
            // 创建合并的设置对象
            let settings = {};
            
            // 确保我们有一个完整的设置对象
            settings = {...defaultSettings, ...parsedInfo.settings};
            
            // 如果有自定义背景，单独加载背景数据
            if (parsedInfo.hasCustomBg) {
              const customBg = localStorage.getItem(CUSTOM_BG_KEY);
              
              if (customBg) {
                console.log('加载自定义背景数据成功');
                settings.customBgData = customBg;
              } else {
                console.warn('找不到自定义背景数据，重置为默认背景');
                settings.bgType = 'default';
                settings.customBgData = null;
              }
              resolve(settings);
            } else {
              // 没有自定义背景，直接返回设置
              resolve(settings);
            }
          } else {
            console.log('未找到已保存的设置，使用默认设置');
            resolve({...defaultSettings});
          }
        } catch (e) {
          console.error('解析本地设置时出错:', e);
          reject(e);
        }
      }
    } catch (e) {
      console.error('加载设置时出错:', e);
      reject(e);
    }
  });
}

// 保存用户设置
export function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    try {
      console.log("开始保存设置:", settings);
      
      // 确保所有设置项都有值（避免丢失设置）
      const completeSettings = {...defaultSettings, ...settings};
      
      // 检查是否在Chrome插件环境中
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        // 判断是否有自定义背景
        const hasCustomBg = completeSettings.bgType === 'custom' && completeSettings.customBgData;
        
        // 创建不含背景图片数据的设置副本
        const settingsWithoutBg = {...completeSettings};
        const customBgData = hasCustomBg ? completeSettings.customBgData : null;
        
        if (hasCustomBg) {
          // 从要保存的设置中移除背景数据，单独保存
          delete settingsWithoutBg.customBgData;
        }
        
        // 先保存设置信息（不含大型背景数据）
        const settingsInfo = {
          hasCustomBg: hasCustomBg,
          settings: settingsWithoutBg,
          lastUpdated: new Date().toISOString()
        };
        
        console.log("保存设置信息:", settingsInfo);
        
        chrome.storage.local.set({ [SETTINGS_INFO_KEY]: settingsInfo }, () => {
          if (chrome.runtime.lastError) {
            console.error('保存设置信息时出错:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          console.log('设置信息已保存到Chrome存储');
          
          // 如果有自定义背景，单独保存背景数据
          if (hasCustomBg) {
            chrome.storage.local.set({ [CUSTOM_BG_KEY]: customBgData }, () => {
              if (chrome.runtime.lastError) {
                console.error('保存背景数据时出错:', chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
              }
              console.log('自定义背景数据已保存到Chrome存储');
              resolve();
            });
          } else {
            // 没有自定义背景时，确保移除旧的背景数据
            chrome.storage.local.remove(CUSTOM_BG_KEY, () => {
              if (chrome.runtime.lastError) {
                console.error('移除旧背景数据时出错:', chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
              }
              console.log('旧的自定义背景数据已从Chrome存储中移除');
              resolve();
            });
          }
        });
      } else {
        // 本地开发环境下，保存到localStorage
        try {
          // 判断是否有自定义背景
          const hasCustomBg = completeSettings.bgType === 'custom' && completeSettings.customBgData;
          
          // 创建不含背景图片数据的设置副本
          const settingsWithoutBg = {...completeSettings};
          const customBgData = hasCustomBg ? completeSettings.customBgData : null;
          
          if (hasCustomBg) {
            // 从要保存的设置中移除背景数据，单独保存
            delete settingsWithoutBg.customBgData;
          }
          
          // 先保存设置信息（不含大型背景数据）
          const settingsInfo = {
            hasCustomBg: hasCustomBg,
            settings: settingsWithoutBg,
            lastUpdated: new Date().toISOString()
          };
          
          console.log("保存设置信息到localStorage:", settingsInfo);
          
          localStorage.setItem(SETTINGS_INFO_KEY, JSON.stringify(settingsInfo));
          console.log('设置信息已保存到localStorage');
          
          // 如果有自定义背景，单独保存背景数据
          if (hasCustomBg) {
            localStorage.setItem(CUSTOM_BG_KEY, customBgData);
            console.log('自定义背景数据已保存到localStorage');
          } else {
            // 没有自定义背景时，移除旧的背景数据
            localStorage.removeItem(CUSTOM_BG_KEY);
          }
          resolve();
        } catch (e) {
          console.error('保存到localStorage时出错:', e);
          reject(e);
        }
      }
    } catch (e) {
      console.error('保存设置时出错:', e);
      reject(e);
    }
  });
} 