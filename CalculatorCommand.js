/**
 * 计算器命令处理器 - 处理以"="开头的表达式计算
 */
class CalculatorCommand extends CommandHandler {
  /**
   * 执行计算器命令
   * @param {string} expression - 数学表达式
   * @returns {Promise<Object>} - 计算结果
   */
  async execute(expression) {
    try {
      // 安全计算表达式
      const result = this.safeEval(expression);
      return {
        type: "calculator",
        expression: expression,
        result: result,
        success: true
      };
    } catch (error) {
      return {
        type: "calculator",
        expression: expression,
        error: "计算错误",
        success: false
      };
    }
  }
  
  /**
   * 获取渲染模板名称
   * @returns {string} - 模板名称
   */
  getResultTemplate() {
    return "calculator";
  }
  
  /**
   * 安全计算表达式
   * @param {string} expr - 数学表达式
   * @returns {number} - 计算结果
   * @private
   */
  safeEval(expr) {
    // 使用安全的数学表达式求值方法
    // 为了简单起见，这里使用Function构造函数创建一个沙箱环境
    // 实际生产环境应使用更安全的库，如math.js
    
    // 去除危险字符，只保留数学表达式
    const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
    
    try {
      // 在沙箱环境中执行计算
      return Function('"use strict";return (' + sanitized + ')')();
    } catch (e) {
      throw new Error("Invalid expression");
    }
  }
} 