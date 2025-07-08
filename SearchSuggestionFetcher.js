/**
 * 搜索引擎建议获取器 - 从搜索引擎获取搜索建议
 */
class SearchSuggestionFetcher {
  /**
   * 初始化搜索建议获取器
   */
  constructor() {
    this.suggestionCache = new Map();
    this.lastQuery = '';
    this.abortControllers = new Map();
    // 默认启用的搜索引擎
    this.enabledEngines = {
      google: true,
      bing: true,
      baidu: true
    };
  }

  /**
   * 设置启用的搜索引擎
   * @param {Object} enabledEngines - 包含搜索引擎名称和启用状态的对象
   */
  setEnabledEngines(enabledEngines) {
    this.enabledEngines = {...enabledEngines};
  }

  /**
   * 获取搜索建议，从所有启用的搜索引擎
   * @param {string} query - 搜索查询
   * @returns {Promise<Object>} - 各搜索引擎的搜索建议
   */
  async fetchAllSuggestions(query) {
    // 如果查询为空，返回空结果
    if (!query.trim()) {
      return {};
    }

    // 存储所有引擎的结果
    const allResults = {};
    
    // 并行请求所有启用的搜索引擎
    const promises = [];
    
    for (const [engine, enabled] of Object.entries(this.enabledEngines)) {
      if (enabled) {
        promises.push(
          this.fetchSuggestions(query, engine).then(suggestions => {
            allResults[engine] = suggestions;
          })
        );
      }
    }
    
    // 等待所有请求完成
    await Promise.all(promises);
    
    return allResults;
  }

  /**
   * 获取搜索建议
   * @param {string} query - 搜索查询
   * @param {string} engine - 搜索引擎类型 (google, bing, baidu)
   * @returns {Promise<string[]>} - 搜索建议列表
   */
  async fetchSuggestions(query, engine) {
    // 如果查询为空，返回空数组
    if (!query.trim()) {
      return [];
    }

    // 如果有缓存结果，直接返回
    const cacheKey = `${engine}:${query}`;
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey);
    }

    // 如果有进行中的请求，取消它
    if (this.abortControllers.has(engine)) {
      this.abortControllers.get(engine).abort();
    }

    // 创建新的请求控制器
    const abortController = new AbortController();
    this.abortControllers.set(engine, abortController);
    const signal = abortController.signal;

    try {
      // 根据不同的搜索引擎，使用不同的API
      let suggestions = [];
      switch (engine) {
        case 'google':
          suggestions = await this.fetchGoogleSuggestions(query, signal);
          break;
        case 'bing':
          suggestions = await this.fetchBingSuggestions(query, signal);
          break;
        case 'baidu':
          suggestions = await this.fetchBaiduSuggestions(query, signal);
          break;
        default:
          suggestions = await this.fetchGoogleSuggestions(query, signal);
      }

      // 缓存结果
      this.suggestionCache.set(cacheKey, suggestions);
      
      return suggestions;
    } catch (error) {
      if (error.name === 'AbortError') {
        // 请求被取消，忽略错误
        return [];
      }
      console.error('获取搜索建议失败:', error);
      return [];
    } finally {
      // 清除当前的 abortController
      this.abortControllers.delete(engine);
    }
  }

  /**
   * 获取Google搜索建议
   * @param {string} query - 搜索查询
   * @param {AbortSignal} signal - 请求取消信号
   * @returns {Promise<string[]>} - 搜索建议列表
   * @private
   */
  async fetchGoogleSuggestions(query, signal) {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
    
    try {
      // 由于CORS限制，实际应用中这里需要使用Chrome扩展的API或代理服务
      // 这里我们模拟一个响应
      return this.getMockSuggestions(query, 'google');
    } catch (error) {
      console.error('获取Google搜索建议失败:', error);
      return [];
    }
  }

  /**
   * 获取Bing搜索建议
   * @param {string} query - 搜索查询
   * @param {AbortSignal} signal - 请求取消信号
   * @returns {Promise<string[]>} - 搜索建议列表
   * @private
   */
  async fetchBingSuggestions(query, signal) {
    // 实际应用中需要使用Bing API
    return this.getMockSuggestions(query, 'bing');
  }

  /**
   * 获取百度搜索建议
   * @param {string} query - 搜索查询
   * @param {AbortSignal} signal - 请求取消信号
   * @returns {Promise<string[]>} - 搜索建议列表
   * @private
   */
  async fetchBaiduSuggestions(query, signal) {
    // 实际应用中需要使用百度API
    return this.getMockSuggestions(query, 'baidu');
  }

  /**
   * 获取模拟的搜索建议（仅用于演示）
   * @param {string} query - 搜索查询
   * @param {string} engine - 搜索引擎
   * @returns {string[]} - 模拟的搜索建议列表
   * @private
   */
  getMockSuggestions(query, engine) {
    const engineSpecific = {
      google: [
        `${query} google搜索`,
        `google ${query} 教程`,
        `如何用google搜索 ${query}`,
        `${query} 下载 google`
      ],
      bing: [
        `${query} bing搜索`,
        `bing ${query} 问答`,
        `${query} bing图片`,
        `${query} microsoft bing`
      ],
      baidu: [
        `${query} 百度百科`,
        `百度 ${query} 知道`,
        `${query} 百度地图`,
        `${query} 怎么样 百度`
      ]
    };

    // 基础建议
    const baseSuggestions = [
      query,
      `${query} 教程`,
      `${query} 下载`,
      `${query} 官网`
    ];
    
    // 合并基础建议和引擎特定建议
    const combined = [...baseSuggestions, ...engineSpecific[engine] || []];
    
    // 随机选择其中的一部分，并保持查询词在第一位
    const randomized = [query];
    const items = combined.slice(1);
    
    // 打乱顺序并选择前几个
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    
    // 添加随机选择的项目到结果中
    randomized.push(...items.slice(0, 5));
    
    // 延迟100-500ms模拟网络请求
    const delay = 100 + Math.floor(Math.random() * 400);
    return new Promise(resolve => {
      setTimeout(() => resolve(randomized), delay);
    });
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.suggestionCache.clear();
  }
} 