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
    let currentSearchEngine = 'google'; // 默认使用Google
    let currentSearchEngineUrl = searchEngines.google; // 默认值, 会由 SettingsHandler 初始化
    let enabledSearchEngines = {
        google: true,
        bing: true,
        baidu: true
    }; // 启用的搜索引擎，默认全部启用

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
        onSearchEngineChange: (searchEnginesUrls, newEnabledEngines) => {
            enabledSearchEngines = {...newEnabledEngines};
            
            // 根据优先级设置当前主搜索引擎
            if (enabledSearchEngines.google) {
                currentSearchEngine = 'google';
            } else if (enabledSearchEngines.bing) {
                currentSearchEngine = 'bing';
            } else if (enabledSearchEngines.baidu) {
                currentSearchEngine = 'baidu';
            }
            
            currentSearchEngineUrl = searchEngines[currentSearchEngine];
            
            // 更新命令路由器的搜索引擎设置
            commandRouter.setSearchEngine(searchEngines, enabledSearchEngines);
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
    function performSearch(query = null) {
        const searchQuery = query || searchInput.value.trim();
        if (searchQuery) {
            if (isUrl(searchQuery)) {
                const url = searchQuery.startsWith('http') ? searchQuery : `http://${searchQuery}`;
                window.location.href = url;
            } else {
                window.location.href = `${currentSearchEngineUrl}${encodeURIComponent(searchQuery)}`;
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
            case 'default':
                // 多引擎搜索建议
                renderMultiEngineSearchSuggestions(result);
                break;
            default:
                // 默认不显示任何特殊UI
                return;
        }
        
        // 显示结果容器
        searchWrapper.classList.add('suggestions-active');
    }

    // 渲染多引擎搜索建议
    function renderMultiEngineSearchSuggestions(result) {
        if (!result.allSuggestions || Object.keys(result.allSuggestions).length === 0) {
            searchWrapper.classList.remove('suggestions-active');
            return;
        }

        const searchSuggestionsContainer = document.createElement('div');
        searchSuggestionsContainer.className = 'command-result search-suggestion';

        // 引擎显示名称映射
        const engineNames = {
            'google': 'Google',
            'bing': 'Bing',
            'baidu': '百度'
        };

        // 存储所有搜索建议项，用于键盘导航
        const allSuggestionItems = [];

        // 为每个启用的搜索引擎创建一个部分
        for (const [engine, suggestions] of Object.entries(result.allSuggestions)) {
            if (suggestions.length === 0) continue;
            
            const engineSection = document.createElement('div');
            engineSection.className = `search-engine-section search-engine-${engine}`;
            
            const engineHeader = document.createElement('div');
            engineHeader.className = 'search-engine-header';
            engineHeader.textContent = engineNames[engine] || engine;
            
            const suggestionsList = document.createElement('ul');
            suggestionsList.className = 'search-suggestion-list';
            
            // 创建搜索建议项
            suggestions.forEach((suggestion, index) => {
                const item = document.createElement('li');
                item.className = 'search-suggestion-item';
                item.dataset.engine = engine;
                item.dataset.query = suggestion;

                const searchIcon = document.createElement('span');
                searchIcon.className = 'search-icon';
                searchIcon.textContent = '🔍';

                const engineBadge = document.createElement('span');
                engineBadge.className = 'search-suggestion-engine';
                engineBadge.textContent = engineNames[engine] || engine;

                const textSpan = document.createElement('span');
                textSpan.className = 'search-text';
                textSpan.textContent = suggestion;

                item.appendChild(searchIcon);
                item.appendChild(textSpan);
                item.appendChild(engineBadge);

                // 点击事件 - 执行搜索
                item.addEventListener('click', () => {
                    const searchUrl = searchEngines[engine];
                    window.location.href = `${searchUrl}${encodeURIComponent(suggestion)}`;
                });

                // 鼠标悬停事件 - 高亮显示
                item.addEventListener('mouseenter', () => {
                    // 移除其他项的选中状态
                    allSuggestionItems.forEach(el => {
                        el.classList.remove('selected');
                    });
                    // 添加当前项的选中状态
                    item.classList.add('selected');
                    currentSelectedSuggestion = allSuggestionItems.indexOf(item);
                });

                suggestionsList.appendChild(item);
                allSuggestionItems.push(item);
            });

            engineSection.appendChild(engineHeader);
            engineSection.appendChild(suggestionsList);
            searchSuggestionsContainer.appendChild(engineSection);
        }

        suggestionsContainer.appendChild(searchSuggestionsContainer);
        
        // 设置全局变量，用于键盘导航
        window.allSuggestionItems = allSuggestionItems;
        window.currentSelectedSuggestion = -1;

        // 显示搜索结果容器
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
    
    function renderTranslateResult(result) {
        const translateItem = document.createElement('div');
        translateItem.className = 'command-result translate';
        
        // 原文部分
        const originalSection = document.createElement('div');
        originalSection.className = 'translate-section original';
        
        const originalHeader = document.createElement('div');
        originalHeader.className = 'translate-header';
        originalHeader.textContent = `${result.fromLanguage}`;
        
        const originalText = document.createElement('div');
        originalText.className = 'translate-text';
        originalText.textContent = result.text;
        
        const originalButtons = document.createElement('div');
        originalButtons.className = 'translate-buttons';
        
        const originalCopyBtn = document.createElement('button');
        originalCopyBtn.className = 'copy-btn';
        originalCopyBtn.innerHTML = '📋';
        originalCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.text);
            originalCopyBtn.innerHTML = '✓';
            setTimeout(() => { originalCopyBtn.innerHTML = '📋'; }, 1000);
        });
        
        const originalSpeakBtn = document.createElement('button');
        originalSpeakBtn.className = 'speak-btn';
        originalSpeakBtn.innerHTML = '🔊';
        originalSpeakBtn.addEventListener('click', () => {
            const utterance = new SpeechSynthesisUtterance(result.text);
            utterance.lang = result.fromLanguageCode || 'en-US';
            window.speechSynthesis.speak(utterance);
        });
        
        originalButtons.appendChild(originalCopyBtn);
        originalButtons.appendChild(originalSpeakBtn);
        
        originalSection.appendChild(originalHeader);
        originalSection.appendChild(originalText);
        originalSection.appendChild(originalButtons);
        
        // 翻译结果部分
        const translatedSection = document.createElement('div');
        translatedSection.className = 'translate-section translated';
        
        const translatedHeader = document.createElement('div');
        translatedHeader.className = 'translate-header';
        translatedHeader.textContent = `${result.toLanguage}`;
        
        const translatedText = document.createElement('div');
        translatedText.className = 'translate-text';
        translatedText.textContent = result.translation;
        
        const translatedButtons = document.createElement('div');
        translatedButtons.className = 'translate-buttons';
        
        const translatedCopyBtn = document.createElement('button');
        translatedCopyBtn.className = 'copy-btn';
        translatedCopyBtn.innerHTML = '📋';
        translatedCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result.translation);
            translatedCopyBtn.innerHTML = '✓';
            setTimeout(() => { translatedCopyBtn.innerHTML = '📋'; }, 1000);
        });
        
        const translatedSpeakBtn = document.createElement('button');
        translatedSpeakBtn.className = 'speak-btn';
        translatedSpeakBtn.innerHTML = '🔊';
        translatedSpeakBtn.addEventListener('click', () => {
            const utterance = new SpeechSynthesisUtterance(result.translation);
            utterance.lang = result.toLanguageCode || 'en-US';
            window.speechSynthesis.speak(utterance);
        });
        
        translatedButtons.appendChild(translatedCopyBtn);
        translatedButtons.appendChild(translatedSpeakBtn);
        
        translatedSection.appendChild(translatedHeader);
        translatedSection.appendChild(translatedText);
        translatedSection.appendChild(translatedButtons);
        
        // 添加到容器
        translateItem.appendChild(originalSection);
        translateItem.appendChild(translatedSection);
        
        suggestionsContainer.appendChild(translateItem);
    }

    // 键盘导航搜索建议
    function navigateSearchSuggestions(key) {
        if (!window.allSuggestionItems || window.allSuggestionItems.length === 0) {
            return false;
        }

        const items = window.allSuggestionItems;
        let currentIndex = window.currentSelectedSuggestion;

        if (key === 'ArrowDown' || key === 'Tab') {
            currentIndex = (currentIndex + 1) % items.length;
        } else if (key === 'ArrowUp') {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (key === 'Escape') {
            currentIndex = -1;
        } else {
            return false;
        }

        // 移除所有选中状态
        items.forEach(item => item.classList.remove('selected'));
        
        // 设置新的选中状态
        if (currentIndex >= 0) {
            items[currentIndex].classList.add('selected');
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        }
        
        window.currentSelectedSuggestion = currentIndex;
        return true;
    }

    // 获取当前选中的搜索建议
    function getSelectedSearchSuggestion() {
        if (window.currentSelectedSuggestion >= 0 && window.allSuggestionItems) {
            const selectedItem = window.allSuggestionItems[window.currentSelectedSuggestion];
            return {
                query: selectedItem.dataset.query,
                engine: selectedItem.dataset.engine
            };
        }
        return null;
    }

    // 输入框内容变化事件处理
    async function handleInputChange(e) {
        const query = searchInput.value.trim();
        
        // 路由到命令处理器
        if (query) {
            const result = await commandRouter.route(query);
            if (result) {
                renderCommandResult(result);
            }
        } else {
            // 输入为空，隐藏建议
            searchWrapper.classList.remove('suggestions-active');
        }
    }

    // 键盘按下事件处理
    function handleKeydown(e) {
        // 如果建议处于活动状态，处理导航键
        if (searchWrapper.classList.contains('suggestions-active')) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab' || e.key === 'Escape') {
                if (navigateSearchSuggestions(e.key)) {
                    e.preventDefault();
                    return;
                }
            }
            
            // 回车键处理：选中建议或执行搜索
            if (e.key === 'Enter') {
                const selected = getSelectedSearchSuggestion();
                if (selected) {
                    const searchUrl = searchEngines[selected.engine];
                    window.location.href = `${searchUrl}${encodeURIComponent(selected.query)}`;
                    e.preventDefault();
                    return;
                } else {
                    performSearch();
                    e.preventDefault();
                    return;
                }
            }
        } else if (e.key === 'Enter') {
            // 如果建议不活动，直接执行搜索
            performSearch();
            e.preventDefault();
            return;
        }
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 监听输入框内容变化
        let inputDebounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(inputDebounceTimer);
            inputDebounceTimer = setTimeout(() => handleInputChange(e), 300);
        });
        
        // 监听键盘事件
        searchInput.addEventListener('keydown', handleKeydown);
        
        // 点击外部区域隐藏建议
        document.addEventListener('click', (e) => {
            if (!searchWrapper.contains(e.target)) {
                searchWrapper.classList.remove('suggestions-active');
            }
        });
        
        // 输入框获得焦点时再次显示建议
        searchInput.addEventListener('focus', async (e) => {
            const query = searchInput.value.trim();
            if (query) {
                const result = await commandRouter.route(query);
                if (result) {
                    renderCommandResult(result);
                }
            }
        });
    }

    // 初始化
    async function init() {
        // 焦点到搜索输入框
        searchInput.focus();
        
        setupEventListeners();
        
        // 设置输入框占位符文本
        const setPlaceholder = () => {
            const placeholders = {
                'google': i18n.translate('search.google_placeholder'),
                'bing': i18n.translate('search.bing_placeholder'),
                'baidu': i18n.translate('search.baidu_placeholder')
            };
            searchInput.placeholder = placeholders[currentSearchEngine] || i18n.translate('search.placeholder');
        };
        
        // 监听国际化变更以更新占位符
        if (i18n.setLocale) {
            const originalSetLocale = i18n.setLocale;
            i18n.setLocale = async function(locale) {
                await originalSetLocale(locale);
                setPlaceholder();
            };
        }
        
        setPlaceholder();
    }
    
    // 启动应用
    init();
}); 