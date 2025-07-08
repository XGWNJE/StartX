document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM 元素 ---
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    const searchWrapper = document.querySelector('.search-wrapper');
    const searchBox = document.querySelector('.search-box');
    const languageSelector = document.getElementById('language-select');

    // --- 状态与配置 ---
    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        baidu: 'https://www.baidu.com/s?wd='
    };
    let currentSearchEngine = searchEngines.google; // 默认值, 会由 SettingsHandler 初始化

    // --- 类实例 ---
    // 初始化国际化模块
    await i18n.init();

    const search = new Search();
    const imageCompressor = new ImageCompressor();
    const suggestionsHandler = new SuggestionsHandler(suggestionsContainer, searchWrapper);
    // 初始化命令路由器
    const commandRouter = new CommandRouter();
    
    const settingsHandler = new SettingsHandler({
        settingsIcon: document.getElementById('open-settings'),
        settingsPanel: document.getElementById('settings-panel'),
        glassEffectToggle: document.getElementById('theme-switch'),
        logoVisibilityToggle: document.getElementById('logo-switch'),
        languageSelector: languageSelector,
        searchEngineGroup: document.getElementById('search-engine-group'),
        wallpaperGrid: document.getElementById('wallpaper-grid'),
        addWallpaperInput: document.getElementById('add-wallpaper-input'),
        backgroundContainer: document.querySelector('.background-container'),
        imageCompressor: imageCompressor,
        searchEngines: searchEngines,
        onSearchEngineChange: (newEngineUrl) => {
            currentSearchEngine = newEngineUrl;
        },
        i18n: i18n
    });

    // --- 检查字符串是否为有效 URL 的函数 ---
    function isUrl(text) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol (协议)
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name (域名)
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address (或 IP 地址)
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path (端口和路径)
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string (查询字符串)
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator (片段定位符)
        return !!urlPattern.test(text);
    }

    // --- 搜索逻辑 ---
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            if (isUrl(query)) {
                const url = query.startsWith('http') ? query : `http://${query}`;
                window.location.href = url;
            } else {
                window.location.href = `${currentSearchEngine}${encodeURIComponent(query)}`;
            }
        }
    }

    // --- 渲染命令结果 ---
    function renderCommandResult(result) {
        // 根据结果类型渲染不同的UI
        suggestionsContainer.innerHTML = '';
        
        if (!result.success) {
            // 渲染错误信息
            const errorItem = document.createElement('div');
            errorItem.className = 'command-result error';
            errorItem.textContent = result.error || '命令执行失败';
            suggestionsContainer.appendChild(errorItem);
            searchWrapper.classList.add('suggestions-active');
            return;
        }
        
        switch (result.type) {
            case 'calculator':
                renderCalculatorResult(result);
                break;
            case 'weather':
                renderWeatherResult(result);
                break;
            case 'translate':
                renderTranslateResult(result);
                break;
            case 'bookmark':
                // 使用现有的建议显示系统
                suggestionsHandler.show(result.results);
                return;
            default:
                // 默认搜索不显示任何特殊UI
                return;
        }
        
        // 显示结果容器
        searchWrapper.classList.add('suggestions-active');
    }

    // 渲染计算器结果
    function renderCalculatorResult(result) {
        const calcItem = document.createElement('div');
        calcItem.className = 'command-result calculator';
        
        const expression = document.createElement('div');
        expression.className = 'expression';
        expression.textContent = result.expression;
        
        const resultValue = document.createElement('div');
        resultValue.className = 'result-value';
        resultValue.textContent = result.result;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制结果';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.result.toString());
            copyBtn.textContent = '✓';
            setTimeout(() => { copyBtn.innerHTML = '📋'; }, 1000);
        });
        
        calcItem.appendChild(expression);
        calcItem.appendChild(resultValue);
        calcItem.appendChild(copyBtn);
        
        suggestionsContainer.appendChild(calcItem);
    }
    
    // 渲染天气结果
    function renderWeatherResult(result) {
        const weatherItem = document.createElement('div');
        weatherItem.className = 'command-result weather';
        
        const cityHeader = document.createElement('div');
        cityHeader.className = 'city-header';
        cityHeader.textContent = result.city;
        
        const currentWeather = document.createElement('div');
        currentWeather.className = 'current-weather';
        
        const temperature = document.createElement('div');
        temperature.className = 'temperature';
        temperature.textContent = `${result.data.temperature.current}°C`;
        
        const condition = document.createElement('div');
        condition.className = 'condition';
        condition.textContent = result.data.condition;
        
        const details = document.createElement('div');
        details.className = 'weather-details';
        details.innerHTML = `
            <div>湿度: ${result.data.humidity}%</div>
            <div>风速: ${result.data.wind.speed} m/s</div>
            <div>风向: ${result.data.wind.direction}</div>
        `;
        
        const forecast = document.createElement('div');
        forecast.className = 'forecast';
        
        result.data.forecast.forEach(day => {
            const dayForecast = document.createElement('div');
            dayForecast.className = 'day-forecast';
            dayForecast.innerHTML = `
                <div class="date">${day.date}</div>
                <div class="day-condition">${day.condition}</div>
                <div class="day-temp">${day.temp.min}°C - ${day.temp.max}°C</div>
            `;
            forecast.appendChild(dayForecast);
        });
        
        currentWeather.appendChild(temperature);
        currentWeather.appendChild(condition);
        
        weatherItem.appendChild(cityHeader);
        weatherItem.appendChild(currentWeather);
        weatherItem.appendChild(details);
        weatherItem.appendChild(forecast);
        
        suggestionsContainer.appendChild(weatherItem);
    }
    
    // 渲染翻译结果
    function renderTranslateResult(result) {
        const translateItem = document.createElement('div');
        translateItem.className = 'command-result translate';
        
        const originalSection = document.createElement('div');
        originalSection.className = 'translate-section original';
        
        const originalHeader = document.createElement('div');
        originalHeader.className = 'translate-header';
        originalHeader.textContent = result.sourceLanguage === 'auto' ? '原文' : `原文 (${result.sourceLanguage})`;
        
        const originalText = document.createElement('div');
        originalText.className = 'translate-text';
        originalText.textContent = result.original;
        
        const originalCopyBtn = document.createElement('button');
        originalCopyBtn.className = 'copy-btn';
        originalCopyBtn.innerHTML = '📋';
        originalCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.original);
            originalCopyBtn.textContent = '✓';
            setTimeout(() => { originalCopyBtn.innerHTML = '📋'; }, 1000);
        });
        
        originalSection.appendChild(originalHeader);
        originalSection.appendChild(originalText);
        originalSection.appendChild(originalCopyBtn);
        
        const translatedSection = document.createElement('div');
        translatedSection.className = 'translate-section translated';
        
        const translatedHeader = document.createElement('div');
        translatedHeader.className = 'translate-header';
        translatedHeader.textContent = `译文 (${result.targetLanguage})`;
        
        const translatedText = document.createElement('div');
        translatedText.className = 'translate-text';
        translatedText.textContent = result.translated;
        
        const translatedCopyBtn = document.createElement('button');
        translatedCopyBtn.className = 'copy-btn';
        translatedCopyBtn.innerHTML = '📋';
        translatedCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.translated);
            translatedCopyBtn.textContent = '✓';
            setTimeout(() => { translatedCopyBtn.innerHTML = '📋'; }, 1000);
        });
        
        const speakBtn = document.createElement('button');
        speakBtn.className = 'speak-btn';
        speakBtn.innerHTML = '🔊';
        speakBtn.addEventListener('click', () => {
            const utterance = new SpeechSynthesisUtterance(result.translated);
            utterance.lang = result.targetLanguage;
            speechSynthesis.speak(utterance);
        });
        
        translatedSection.appendChild(translatedHeader);
        translatedSection.appendChild(translatedText);
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'translate-buttons';
        buttonsDiv.appendChild(translatedCopyBtn);
        buttonsDiv.appendChild(speakBtn);
        translatedSection.appendChild(buttonsDiv);
        
        translateItem.appendChild(originalSection);
        translateItem.appendChild(translatedSection);
        
        suggestionsContainer.appendChild(translateItem);
    }

    // --- 事件处理器 ---
    async function handleInputChange(e) {
        const query = e.target.value.trim();
        
        if (query.length > 0) {
            // 路由到命令处理器
            const result = await commandRouter.route(query);
            
            // 如果是默认搜索且不是空格前缀，使用默认搜索引擎建议
            if (result.type === 'default') {
                const results = search.performSearch(query);
                suggestionsHandler.show(results);
            } else {
                // 渲染命令结果
                renderCommandResult(result);
            }
        } else {
            suggestionsHandler.hide();
        }
    }

    function handleKeydown(e) {
        // 检查建议是否可见
        const isSuggestionsVisible = searchWrapper.classList.contains('suggestions-active');
        
        // 允许建议处理器处理导航键
        if (isSuggestionsVisible) {
            const navigationHandled = suggestionsHandler.navigate(e.key);
            if (navigationHandled) {
                e.preventDefault();
                return;
            }
        }

        // 处理 'Enter' 键以执行搜索或导航到选定的 URL
        if (e.key === 'Enter') {
            e.preventDefault();
            const selectedUrl = suggestionsHandler.getSelectedUrl();
            if (selectedUrl) {
                window.location.href = selectedUrl;
            } else {
                performSearch();
            }
        }
    }

    function setupEventListeners() {
        // 搜索输入框监听器
        searchInput.addEventListener('input', handleInputChange);
        searchInput.addEventListener('keydown', handleKeydown);
        
        // 处理搜索框焦点状态，控制logo显示/隐藏
        searchInput.addEventListener('focus', () => {
            document.body.classList.add('search-focus');
        });
        
        searchInput.addEventListener('blur', () => {
            // 如果没有显示建议列表，则移除search-focus类
            if (!searchWrapper.classList.contains('suggestions-active')) {
                document.body.classList.remove('search-focus');
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                suggestionsHandler.hide();
                document.body.classList.remove('search-focus');
            }
        });

        // 搜索框鼠标跟踪效果
        searchBox.addEventListener('mousemove', e => {
            const rect = searchBox.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            searchBox.style.setProperty('--mouse-x', `${x}px`);
            searchBox.style.setProperty('--mouse-y', `${y}px`);
        });
    }

    // --- 初始化序列 ---
    async function init() {
        setupEventListeners();
        await search.init();
    }

    init();
}); 