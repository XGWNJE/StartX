/**
 * 命令路由器 - 处理不同前缀的命令请求
 */
class CommandRouter {
  /**
   * 初始化命令路由器
   */
  constructor() {
    this.commands = new Map();
    this.searchSuggestionFetcher = new SearchSuggestionFetcher();
    this.registerDefaultCommands();
    
    // 存储当前启用的搜索引擎
    this.enabledSearchEngines = {
      google: true,
      bing: true,
      baidu: true
    };
    
    // 设置默认主要搜索引擎（用于执行搜索）
    this.primarySearchEngine = 'google';
  }

  /**
   * 注册默认命令
   */
  registerDefaultCommands() {
    // 计算器命令
    this.register("=", new CalculatorCommand());
    // 天气命令
    this.register("tq", new WeatherCommand());
    // 翻译命令
    this.register("tr", new TranslateCommand());
    // 书签命令
    this.register("/", new BookmarkCommand());
  }

  /**
   * 动态注册新命令
   * @param {string} prefix - 命令前缀
   * @param {CommandHandler} commandHandler - 命令处理器实例
   */
  register(prefix, commandHandler) {
    this.commands.set(prefix, commandHandler);
  }

  /**
   * 路由请求到对应处理器
   * @param {string} input - 用户输入
   * @returns {Promise<Object>} - 命令执行结果
   */
  async route(input) {
    // 快速检查是否以已知前缀开头
    if (input && input.length > 0) {
      const firstChar = input.charAt(0);
      
      // 直接查找映射表中的前缀处理器
      const handler = this.commands.get(firstChar);
      if (handler) {
        return await handler.execute(input.substring(1).trim());
      }
      
      // 检查多字符前缀
      if (input.length >= 2) {
        const prefix2 = input.substring(0, 2);
        const handler2 = this.commands.get(prefix2);
        if (handler2) {
          return await handler2.execute(input.substring(2).trim());
        }
      }
    }

    // 默认为搜索引擎查询
    return await this.handleDefaultSearch(input);
  }

  /**
   * 处理默认搜索
   * @param {string} input - 搜索输入
   * @returns {Promise<Object>} - 搜索结果
   * @private
   */
  async handleDefaultSearch(input) {
    // 获取所有启用的搜索引擎的建议
    const allSuggestions = await this.searchSuggestionFetcher.fetchAllSuggestions(input);
    
    return {
      type: "default",
      query: input,
      allSuggestions: allSuggestions,
      success: true
    };
  }
  
  /**
   * 更新当前使用的搜索引擎
   * @param {Object} searchEnginesUrls - 所有搜索引擎的URL映射
   * @param {Object} enabledEngines - 启用状态的搜索引擎对象
   */
  setSearchEngine(searchEnginesUrls, enabledEngines) {
    // 更新启用的搜索引擎
    this.enabledSearchEngines = {...enabledEngines};
    
    // 将启用状态告知搜索建议获取器
    this.searchSuggestionFetcher.setEnabledEngines(this.enabledSearchEngines);
    
    // 设置主要搜索引擎（优先级：google > bing > baidu）
    if (this.enabledSearchEngines.google) {
      this.primarySearchEngine = 'google';
    } else if (this.enabledSearchEngines.bing) {
      this.primarySearchEngine = 'bing';
    } else if (this.enabledSearchEngines.baidu) {
      this.primarySearchEngine = 'baidu';
    }
    
    // 如果没有启用的搜索引擎（应该不会发生），默认使用google
    if (!this.primarySearchEngine) {
      this.primarySearchEngine = 'google';
      this.enabledSearchEngines.google = true;
    }
  }
} 