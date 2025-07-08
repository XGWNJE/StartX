/**
 * 翻译命令处理器 - 处理以"tr"开头的翻译请求
 */
class TranslateCommand extends CommandHandler {
  /**
   * 执行翻译命令
   * @param {string} params - 翻译参数
   * @returns {Promise<Object>} - 翻译结果
   */
  async execute(params) {
    // 解析翻译参数
    const { sourceLanguage, targetLanguage, text } = this.parseTranslateParams(params);
    
    try {
      // 调用翻译API
      const translatedText = await this.translate(text, sourceLanguage, targetLanguage);
      return {
        type: "translate",
        original: text,
        translated: translatedText,
        sourceLanguage,
        targetLanguage,
        success: true
      };
    } catch (error) {
      return {
        type: "translate",
        error: "翻译失败",
        success: false
      };
    }
  }
  
  /**
   * 获取渲染模板名称
   * @returns {string} - 模板名称
   */
  getResultTemplate() {
    return "translate";
  }
  
  /**
   * 解析翻译参数
   * @param {string} params - 翻译参数
   * @returns {Object} - 解析后的参数对象
   * @private
   */
  parseTranslateParams(params) {
    // 解析如 "en>zh Hello world" 或简单的 "Hello world"
    if (params.includes(">")) {
      const parts = params.split(" ");
      const langParts = parts[0].split(">");
      return {
        sourceLanguage: langParts[0],
        targetLanguage: langParts[1],
        text: parts.slice(1).join(" ")
      };
    } else {
      // 默认从自动检测到浏览器语言
      const browserLang = navigator.language.split('-')[0] || 'en';
      return {
        sourceLanguage: "auto",
        targetLanguage: browserLang,
        text: params
      };
    }
  }
  
  /**
   * 翻译文本
   * @param {string} text - 需要翻译的文本
   * @param {string} sourceLanguage - 源语言代码
   * @param {string} targetLanguage - 目标语言代码
   * @returns {Promise<string>} - 翻译后的文本
   * @private
   */
  async translate(text, sourceLanguage, targetLanguage) {
    // 实际实现需调用适当的翻译API
    // 目前先返回模拟数据
    
    // 这里是模拟翻译，实际应用中应该使用翻译API
    if (text === "hello world" && sourceLanguage === "en" && targetLanguage === "zh") {
      return "你好世界";
    } else if (text === "你好世界" && sourceLanguage === "zh" && targetLanguage === "en") {
      return "hello world";
    } else if (sourceLanguage === "auto") {
      return `[翻译: ${text}]`;
    } else {
      return `[从 ${sourceLanguage} 翻译到 ${targetLanguage}: ${text}]`;
    }
  }
} 