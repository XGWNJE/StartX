/**
 * 命令处理器基类 - 所有具体命令处理器的抽象基类
 */
class CommandHandler {
  /**
   * 执行命令
   * @param {string} params - 命令参数
   * @returns {Promise<Object>} - 命令执行结果
   */
  async execute(params) {
    // 子类实现具体处理逻辑
    throw new Error("Command handler must implement execute method");
  }
  
  /**
   * 获取渲染模板名称
   * @returns {string} - 模板名称
   */
  getResultTemplate() {
    // 子类可覆盖，返回渲染模板
    return "default";
  }
} 