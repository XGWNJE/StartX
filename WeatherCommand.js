/**
 * 天气命令处理器 - 处理以"tq"开头的天气查询
 */
class WeatherCommand extends CommandHandler {
  /**
   * 初始化天气命令处理器
   */
  constructor() {
    super();
    // 使用wttr.in公共天气API，不需要API密钥
    this.apiUrl = "https://wttr.in";
    
    // 缓存查询结果，避免频繁请求
    this.cache = {};
    this.cacheExpiration = 30 * 60 * 1000; // 30分钟缓存过期
    
    // 常用城市中文名称映射
    this.cityNameMap = {
      "beijing": "北京",
      "shanghai": "上海",
      "guangzhou": "广州",
      "shenzhen": "深圳",
      "hong kong": "香港",
      "taipei": "台北",
      "tokyo": "东京",
      "seoul": "首尔",
      "new york": "纽约",
      "los angeles": "洛杉矶",
      "london": "伦敦",
      "paris": "巴黎",
      "berlin": "柏林",
      "moscow": "莫斯科",
      "sydney": "悉尼"
    };
    
    // 天气状况中英文映射
    this.weatherConditionMap = {
      "clear": "晴朗",
      "sunny": "晴朗",
      "partly cloudy": "局部多云",
      "cloudy": "多云",
      "overcast": "阴天",
      "mist": "薄雾",
      "fog": "雾",
      "light rain": "小雨",
      "rain": "雨",
      "heavy rain": "大雨",
      "thunderstorm": "雷雨",
      "light snow": "小雪",
      "snow": "雪",
      "heavy snow": "大雪",
      "sleet": "雨夹雪",
      "drizzle": "毛毛雨"
    };
    
    // 默认城市，当无法获取位置时使用
    this.defaultCity = "beijing";
  }

  /**
   * 执行天气查询命令
   * @param {string} city - 城市名称
   * @returns {Promise<Object>} - 天气查询结果
   */
  async execute(city) {
    try {
      if (!city || city.trim() === "") {
        // 如果没有提供城市，尝试获取用户位置
        city = await this.getUserLocation();
      }
      
      // 检查缓存
      const cacheKey = city.toLowerCase();
      if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp) < this.cacheExpiration) {
        return {
          type: "weather",
          city: this.cache[cacheKey].data.city,
          data: this.cache[cacheKey].data.weather,
          success: true,
          cached: true
        };
      }
      
      // 调用天气API获取数据
      const weatherData = await this.fetchWeatherData(city);
      
      // 缓存结果
      this.cache[cacheKey] = {
        timestamp: Date.now(),
        data: {
          city: weatherData.city,
          weather: weatherData.data
        }
      };
      
      return {
        type: "weather",
        city: weatherData.city,
        data: weatherData.data,
        success: true
      };
    } catch (error) {
      console.error("天气查询错误:", error);
      return {
        type: "weather",
        city: city,
        error: "获取天气信息失败: " + (error.message || "未知错误"),
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
   * 尝试获取用户当前位置
   * @returns {Promise<string>} - 城市名称
   * @private
   */
  async getUserLocation() {
    try {
      // 首先尝试使用浏览器的地理位置API
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000
          });
        });
        
        const { latitude, longitude } = position.coords;
        
        // 使用wttr.in的反向地理编码功能获取位置名称
        const response = await fetch(`${this.apiUrl}/${latitude},${longitude}?format=j1`);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.nearest_area && data.nearest_area.length > 0) {
            const areaName = data.nearest_area[0].areaName[0].value;
            return areaName;
          }
        }
        
        // 如果无法获取具体城市名，返回坐标
        return `${latitude},${longitude}`;
      }
    } catch (error) {
      console.warn("无法获取用户位置:", error);
    }
    
    // 如果上述方法都失败，尝试使用时区推断大致位置
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // 从时区推断可能的城市
      if (timezone.includes("Shanghai") || timezone.includes("Beijing") || timezone.includes("China")) {
        return "beijing";
      } else if (timezone.includes("Tokyo") || timezone.includes("Japan")) {
        return "tokyo";
      } else if (timezone.includes("Seoul") || timezone.includes("Korea")) {
        return "seoul";
      } else if (timezone.includes("London") || timezone.includes("Europe/London")) {
        return "london";
      } else if (timezone.includes("New_York") || timezone.includes("America/New_York")) {
        return "new york";
      } else if (timezone.includes("Los_Angeles") || timezone.includes("America/Los_Angeles")) {
        return "los angeles";
      } else if (timezone.includes("Paris") || timezone.includes("Europe/Paris")) {
        return "paris";
      }
    } catch (error) {
      console.warn("无法从时区推断位置:", error);
    }
    
    // 最终后备方案：返回默认城市
    return this.defaultCity;
  }
  
  /**
   * 获取天气数据
   * @param {string} city - 城市名称
   * @returns {Promise<Object>} - 天气数据
   * @private
   */
  async fetchWeatherData(city) {
    try {
      // 确保城市名称正确编码，特别是处理空格
      const encodedCity = encodeURIComponent(city.trim());
      
      // 使用wttr.in API获取天气数据，格式为JSON
      const response = await fetch(`${this.apiUrl}/${encodedCity}?format=j1`);
      
      if (!response.ok) {
        throw new Error(`API请求失败，状态码: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.current_condition) {
        throw new Error(`无效的天气数据: ${city}`);
      }
      
      // 处理并格式化数据
      return this.processWeatherData(city, data);
    } catch (error) {
      console.error("获取天气数据失败:", error);
      throw error;
    }
  }
  
  /**
   * 处理并格式化天气数据
   * @param {string} cityName - 城市名称
   * @param {Object} data - 天气API返回的数据
   * @returns {Object} - 格式化后的天气数据
   * @private
   */
  processWeatherData(cityName, data) {
    // 获取当前天气数据
    const current = data.current_condition[0];
    
    // 转换天气描述为中文
    const weatherDesc = current.weatherDesc[0].value.toLowerCase();
    const chineseWeatherDesc = this.translateWeatherCondition(weatherDesc);
    
    // 获取中文城市名称（如果有映射）
    const lowerCityName = cityName.toLowerCase();
    const displayCityName = this.cityNameMap[lowerCityName] || cityName;
    
    // 处理当前天气
    const currentWeather = {
      temperature: {
        current: parseInt(current.temp_C),
        min: parseInt(data.weather[0].mintempC),
        max: parseInt(data.weather[0].maxtempC)
      },
      condition: chineseWeatherDesc,
      humidity: parseInt(current.humidity),
      wind: {
        speed: parseFloat(current.windspeedKmph) / 3.6, // 转换为m/s
        direction: this.getWindDirection(parseInt(current.winddirDegree))
      },
      icon: this.getWeatherIcon(weatherDesc)
    };
    
    // 处理天气预报 - 获取未来3天的天气
    const forecast = data.weather.slice(0, 3).map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      
      // 获取天气描述并转换为中文
      const dayWeatherDesc = day.hourly[4].weatherDesc[0].value.toLowerCase(); // 使用中午的天气
      const dayChineseWeatherDesc = this.translateWeatherCondition(dayWeatherDesc);
      
      return {
        date: index === 0 ? "今天" : index === 1 ? "明天" : this.getDayOfWeek(date),
        condition: dayChineseWeatherDesc,
        icon: this.getWeatherIcon(dayWeatherDesc),
        temp: {
          min: parseInt(day.mintempC),
          max: parseInt(day.maxtempC)
        }
      };
    });
    
    return {
      city: displayCityName,
      data: {
        ...currentWeather,
        forecast: forecast
      }
    };
  }
  
  /**
   * 获取星期几
   * @param {Date} date - 日期对象
   * @returns {string} - 星期几的中文表示
   * @private
   */
  getDayOfWeek(date) {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return weekdays[date.getDay()];
  }
  
  /**
   * 根据天气描述获取图标代码
   * @param {string} weatherDesc - 天气描述
   * @returns {string} - 图标代码
   * @private
   */
  getWeatherIcon(weatherDesc) {
    const desc = weatherDesc.toLowerCase();
    
    // 简单的映射，可以根据需要扩展
    if (desc.includes('clear') || desc.includes('sunny')) {
      return '01d'; // 晴天
    } else if (desc.includes('partly cloudy')) {
      return '02d'; // 局部多云
    } else if (desc.includes('cloudy') || desc.includes('overcast')) {
      return '03d'; // 多云
    } else if (desc.includes('mist') || desc.includes('fog')) {
      return '50d'; // 雾
    } else if (desc.includes('light rain') || desc.includes('drizzle')) {
      return '10d'; // 小雨
    } else if (desc.includes('rain')) {
      return '09d'; // 雨
    } else if (desc.includes('thunderstorm')) {
      return '11d'; // 雷雨
    } else if (desc.includes('snow')) {
      return '13d'; // 雪
    } else if (desc.includes('sleet')) {
      return '13d'; // 雨夹雪
    }
    
    return '01d'; // 默认图标
  }
  
  /**
   * 将英文天气描述转换为中文
   * @param {string} condition - 英文天气描述
   * @returns {string} - 中文天气描述
   * @private
   */
  translateWeatherCondition(condition) {
    const lowerCondition = condition.toLowerCase();
    
    // 尝试精确匹配
    for (const [eng, chn] of Object.entries(this.weatherConditionMap)) {
      if (lowerCondition === eng) {
        return chn;
      }
    }
    
    // 尝试部分匹配
    for (const [eng, chn] of Object.entries(this.weatherConditionMap)) {
      if (lowerCondition.includes(eng)) {
        return chn;
      }
    }
    
    // 如果没有匹配，返回原始描述
    return condition;
  }
  
  /**
   * 获取风向描述
   * @param {number} degrees - 风向角度
   * @returns {string} - 风向描述
   * @private
   */
  getWindDirection(degrees) {
    const directions = [
      "北", "东北偏北", "东北", "东北偏东", 
      "东", "东南偏东", "东南", "东南偏南",
      "南", "西南偏南", "西南", "西南偏西",
      "西", "西北偏西", "西北", "西北偏北", "北"
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
} 