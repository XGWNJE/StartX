/**
 * 书签命令处理器 - 处理以"/"开头的书签搜索
 */
class BookmarkCommand extends CommandHandler {
  /**
   * 初始化书签命令处理器
   */
  constructor() {
    super();
    this.search = new Search();
  }
  
  /**
   * 执行书签搜索命令
   * @param {string} query - 搜索关键词
   * @returns {Promise<Object>} - 搜索结果
   */
  async execute(query) {
    // 确保书签已加载
    if (this.search.bookmarks.length === 0) {
      await this.search.init();
    }
    
    // 执行书签搜索
    const results = this.search.performSearch(query);
    
    return {
      type: "bookmark",
      query: query,
      results: results,
      success: true,
      count: results.length
    };
  }
  
  /**
   * 获取渲染模板名称
   * @returns {string} - 模板名称
   */
  getResultTemplate() {
    return "bookmark";
  }
} 