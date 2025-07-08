/**
 * 天气命令处理器 - 处理以"tq"开头的天气查询
 */
class WeatherCommand extends CommandHandler {
  /**
   * 执行天气查询命令
   * @param {string} city - 城市名称
   * @returns {Promise<Object>} - 天气查询结果
   */
  async execute(city) {
    try {
      // 调用天气API获取数据
      const weatherData = await this.fetchWeatherData(city);
      return {
        type: "weather",
        city: city,
        data: weatherData,
        success: true
      };
    } catch (error) {
      return {
        type: "weather",
        city: city,
        error: "获取天气信息失败",
        success: false
      };
    }
  }
  
  /**
   * 获取渲染模板名称
   * @returns {string} - 模板名称
   */
  getResultTemplate() {
    return "weather";
  }
  
  /**
   * 获取天气数据
   * @param {string} city - 城市名称
   * @returns {Promise<Object>} - 天气数据
   * @private
   */
  async fetchWeatherData(city) {
    // 实际实现需调用适当的天气API
    // 目前先返回模拟数据
    
    // 这里是模拟数据，实际应用中应该使用天气API
    return {
      temperature: {
        current: 22,
        min: 18,
        max: 25
      },
      condition: "晴",
      humidity: 40,
      wind: {
        speed: 3.5,
        direction: "东北"
      },
      forecast: [
        { date: "今天", condition: "晴", temp: { min: 18, max: 25 } },
        { date: "明天", condition: "多云", temp: { min: 19, max: 26 } },
        { date: "后天", condition: "小雨", temp: { min: 17, max: 22 } }
      ]
    };
  }
} 