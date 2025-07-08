/**
 * I18n.js
 * 国际化核心模块
 * 支持多语言切换，支持按键路径获取翻译值
 */

class I18n {
  /**
   * 构造函数
   */
  constructor() {
    this.defaultLocale = 'zh';
    this.supportedLocales = ['zh', 'en', 'ja', 'ko'];
    this.currentLocale = null;
    this.translations = {};
  }

  /**
   * 初始化国际化模块
   * @returns {Promise<void>}
   */
  async init() {
    // 从chrome存储中读取用户设置的语言
    let savedLocale = await this._getSavedLocale();
    
    // 如果没有保存的语言设置，则检测浏览器语言
    if (!savedLocale) {
      savedLocale = this._detectBrowserLocale();
    }
    
    // 加载当前语言
    await this.setLocale(savedLocale);
  }
  
  /**
   * 从chrome存储中读取已保存的语言设置
   * @returns {Promise<string|null>} 保存的语言代码或null
   */
  async _getSavedLocale() {
    return new Promise((resolve) => {
      chrome.storage.local.get('locale', (data) => {
        resolve(data.locale || null);
      });
    });
  }
  
  /**
   * 检测浏览器语言并返回支持的最匹配语言
   * @returns {string} 支持的语言代码
   */
  _detectBrowserLocale() {
    const browserLang = navigator.language.toLowerCase();
    
    // 检查完整匹配
    for (const locale of this.supportedLocales) {
      if (browserLang === locale || browserLang.startsWith(locale + '-')) {
        return locale;
      }
    }
    
    // 没有匹配的语言，返回默认语言
    return this.defaultLocale;
  }
  
  /**
   * 设置当前语言
   * @param {string} locale 语言代码
   * @returns {Promise<void>}
   */
  async setLocale(locale) {
    // 确保语言代码有效，如果无效则使用默认语言
    locale = this.supportedLocales.includes(locale) ? locale : this.defaultLocale;
    
    // 加载语言文件
    await this._loadLocaleFile(locale);
    
    // 更新当前语言
    this.currentLocale = locale;
    
    // 保存语言设置
    chrome.storage.local.set({ locale });
    
    // 更新页面上所有文本
    this.updatePageContent();
  }
  
  /**
   * 加载语言文件
   * @param {string} locale 语言代码
   * @returns {Promise<void>}
   */
  async _loadLocaleFile(locale) {
    try {
      const response = await fetch(`locales/${locale}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      this.translations = await response.json();
    } catch (error) {
      console.error(`Failed to load language file for ${locale}:`, error);
      
      // 如果不是默认语言，则尝试加载默认语言
      if (locale !== this.defaultLocale) {
        console.warn(`Falling back to default locale: ${this.defaultLocale}`);
        await this._loadLocaleFile(this.defaultLocale);
      } else {
        // 如果默认语言也加载失败，则使用空对象避免错误
        this.translations = {};
      }
    }
  }
  
  /**
   * 根据键路径获取翻译
   * @param {string} key 键路径，如 "settings.title"
   * @param {Object} [params={}] 替换参数
   * @returns {string} 翻译后的字符串
   */
  translate(key, params = {}) {
    // 使用键路径获取翻译值
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // 返回原键作为后备
      }
    }
    
    // 如果值不是字符串，返回键
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }
    
    // 替换参数
    return this._replaceParams(value, params);
  }
  
  /**
   * 替换字符串中的参数
   * @param {string} text 带参数的文本，如 "Hello, {name}!"
   * @param {Object} params 参数对象，如 {name: "World"}
   * @returns {string} 替换后的文本
   */
  _replaceParams(text, params) {
    return text.replace(/{(\w+)}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
  
  /**
   * 更新页面上所有带data-i18n属性的元素内容
   */
  updatePageContent() {
    // 查找所有带data-i18n属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      
      // 如果是输入框的placeholder
      if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
        el.placeholder = this.translate(key);
      } 
      // 如果是普通元素，更新其内容
      else {
        el.textContent = this.translate(key);
      }
    });
  }
  
  /**
   * 获取当前语言代码
   * @returns {string} 当前语言代码
   */
  getCurrentLocale() {
    return this.currentLocale;
  }
  
  /**
   * 获取所有支持的语言
   * @returns {Array} 支持的语言代码数组
   */
  getSupportedLocales() {
    return this.supportedLocales;
  }
}

// 导出单例实例
const i18n = new I18n(); 