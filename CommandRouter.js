/**
 * 命令路由器 - 处理不同前缀的命令请求
 */
class CommandRouter {
  /**
   * 初始化命令路由器
   */
  constructor() {
    this.commands = new Map();
    this.registerDefaultCommands();
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
    // 书签命令 (特殊处理空格前缀)
    this.register(" ", new BookmarkCommand());
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
    // 空格前缀特殊处理
    if (input.startsWith(" ")) {
      return await this.commands.get(" ").execute(input.substring(1));
    }

    // 其他前缀处理
    for (const [prefix, handler] of this.commands.entries()) {
      if (prefix !== " " && input.startsWith(prefix)) {
        return await handler.execute(input.substring(prefix.length).trim());
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
    return {
      type: "default",
      query: input,
      success: true
    };
  }
} 