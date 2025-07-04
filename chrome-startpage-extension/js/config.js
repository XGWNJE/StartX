// Default settings for the extension
export const defaultSettings = {
  // 背景设置
  bgType: 'default',
  presetName: 'default',
  customBgData: null,
  opacity: 100,
  blur: 0,
  
  // 壁纸设置
  wallpaperHistory: [],
  currentWallpaperIndex: -1,
  wallpaperAutoChange: false,
  wallpaperChangeInterval: 30, // 分钟
  wallpaperFolderPath: 'startx-wallpapers', // 默认壁纸文件夹名称
  wallpaperFolderCreated: false, // 是否已创建壁纸文件夹
  
  // 搜索栏设置
  searchWidth: 600,
  searchHeight: 70,   
  searchRadius: 30,
  glassOpacity: 10,
  glassBlur: 10,
  textSize: 18,
  placeholder: '搜索网页、书签',
  
  // 搜索引擎设置
  searchEngine: 'google',
  
  // 强调色设置
  accentColorMode: 'auto', // 仅支持'auto'模式
  
  // UI主题颜色设置
  themeMode: 'default', // 'default', 'preset' 或 'custom'
  themePreset: 'dark', // 预设主题名称
  customThemeColors: null // 用户自定义主题颜色
};

// Background presets configuration
export const bgConfigs = {
  default: {
    colors: ['#0f0c29', '#302b63', '#24243e'],
    accentColors: {
      primary: '#7d6aff', // 紫色
      secondary: '#ff7eb3', // 粉色
      tertiary: '#5ce1e6' // 青色
    }
  },
  blue: {
    colors: ['#1a2980', '#26d0ce'],
    accentColors: {
      primary: '#26d0ce', // 青色
      secondary: '#1a2980', // 深蓝色
      tertiary: '#7df9ff' // 浅青色
    }
  },
  purple: {
    colors: ['#8e2de2', '#4a00e0'],
    accentColors: {
      primary: '#a346ff', // 亮紫色
      secondary: '#ff9efc', // 粉紫色
      tertiary: '#4a00e0' // 深紫色
    }
  },
  sunset: {
    colors: ['#f12711', '#f5af19'],
    accentColors: {
      primary: '#f5af19', // 金色
      secondary: '#f12711', // 红色
      tertiary: '#ffdb58' // 黄色
    }
  },
  night: {
    colors: ['#0f2027', '#203a43', '#2c5364'],
    accentColors: {
      primary: '#4b8bb3', // 蓝色
      secondary: '#5fb0d9', // 浅蓝色
      tertiary: '#203a43' // 深青色
    }
  },
  forest: {
    colors: ['#134e5e', '#71b280'],
    accentColors: {
      primary: '#71b280', // 绿色
      secondary: '#a8e6cf', // 浅绿色
      tertiary: '#134e5e' // 深绿色
    }
  }
};

// 渐变方向选项
export const gradientDirections = {
  'to right': '从左到右',
  'to left': '从右到左',
  'to bottom': '从上到下',
  'to top': '从下到上',
  'to bottom right': '左上到右下',
  'to bottom left': '右上到左下',
  'to top right': '左下到右上',
  'to top left': '右下到左上'
};

// UI主题预设
export const themePresets = {
  dark: {
    name: '深色主题',
    colors: {
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#333333',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  },
  light: {
    name: '浅色主题',
    colors: {
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#121212',
      textSecondary: '#5f5f5f',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  midnight: {
    name: '午夜蓝',
    colors: {
      background: '#0a1929',
      surface: '#132f4c',
      text: '#ffffff',
      textSecondary: '#b2bac2',
      border: '#1e4976',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  },
  forest: {
    name: '森林绿',
    colors: {
      background: '#0f2417',
      surface: '#1a3829',
      text: '#ffffff',
      textSecondary: '#b0c4b9',
      border: '#2a5741',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  },
  sunset: {
    name: '日落橙',
    colors: {
      background: '#271513',
      surface: '#3d2117',
      text: '#ffffff',
      textSecondary: '#e0c0b0',
      border: '#5a3122',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  },
  galaxy: {
    name: '星空紫',
    colors: {
      background: '#0f0a1f',
      surface: '#1a1433',
      text: '#ffffff',
      textSecondary: '#c0b8e0',
      border: '#2c2152',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  }
};

// 搜索引擎配置
export const searchEngines = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>`
  },
  baidu: {
    name: '百度',
    url: 'https://www.baidu.com/s?wd=',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01M15 10h.01M12 14l-2 4h4l-2-4z"></path></svg>`
  },
  bing: {
    name: '必应',
    url: 'https://www.bing.com/search?q=',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
  },
  sogou: {
    name: '搜狗',
    url: 'https://www.sogou.com/web?query=',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>`
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
  }
};

// Storage keys
export const SETTINGS_INFO_KEY = 'startx_settings_info';
export const CUSTOM_BG_KEY = 'startx_custom_bg';
export const WALLPAPER_HISTORY_KEY = 'startx_wallpaper_history';
export const WALLPAPER_FOLDER_KEY = 'startx_wallpaper_folder'; 