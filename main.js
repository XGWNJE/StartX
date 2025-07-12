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
                
                // 为不同搜索引擎使用不同的SVG图标
                if (engine === 'google') {
                    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
                } else if (engine === 'bing') {
                    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
                } else if (engine === 'baidu') {
                    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
                } else {
                    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
                }

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

                suggestionsList.appendChild(item);
                allSuggestionItems.push(item);
            });

            engineSection.appendChild(engineHeader);
            engineSection.appendChild(suggestionsList);
            
            searchSuggestionsContainer.appendChild(engineSection);
        }
        
        suggestionsContainer.appendChild(searchSuggestionsContainer);
        searchWrapper.classList.add('suggestions-active');
        
        // 设置导航用的数据属性
        window.searchSuggestions = allSuggestionItems;
    }
    
    // --- 键盘导航功能 ---
    function navigateSearchSuggestions(key) {
        const suggestions = window.searchSuggestions || [];
        if (suggestions.length === 0) return;
        
        const currentSelected = document.querySelector('.search-suggestion-item.selected');
        let currentIndex = -1;
        
        if (currentSelected) {
            currentIndex = suggestions.indexOf(currentSelected);
            currentSelected.classList.remove('selected');
        }
        
        let newIndex;
        if (key === 'ArrowDown' || key === 'Tab') {
            newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        } else if (key === 'ArrowUp') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        }
        
        suggestions[newIndex].classList.add('selected');
        suggestions[newIndex].scrollIntoView({ block: 'nearest' });
    }
    
    function getSelectedSearchSuggestion() {
        const selected = document.querySelector('.search-suggestion-item.selected');
        if (!selected) return null;
        
        return {
            query: selected.dataset.query,
            engine: selected.dataset.engine
        };
    }

    // --- 事件处理函数 ---
    async function handleInputChange(e) {
        const input = e.target.value.trim();
        
        // 检查是否为命令
        if (input) {
            const result = await commandRouter.route(input);
            renderCommandResult(result);
        } else {
            // 清空输入时隐藏建议
            suggestionsContainer.innerHTML = '';
            searchWrapper.classList.remove('suggestions-active');
        }
    }

    // 处理键盘输入
    function handleKeydown(e) {
        const key = e.key;
        
        // 检查是否有活跃的建议列表
        const hasActiveSuggestions = searchWrapper.classList.contains('suggestions-active') && 
                                    window.searchSuggestions && 
                                    window.searchSuggestions.length > 0;
                                    
        if (hasActiveSuggestions) {
            if (key === 'ArrowDown' || key === 'ArrowUp' || (key === 'Tab' && !e.shiftKey)) {
                e.preventDefault(); // 防止Tab移动焦点
                navigateSearchSuggestions(key);
                return;
            } else if (key === 'Enter') {
                const selected = getSelectedSearchSuggestion();
                if (selected) {
                    e.preventDefault();
                    const searchUrl = searchEngines[selected.engine];
                    window.location.href = `${searchUrl}${encodeURIComponent(selected.query)}`;
                    return;
                }
            } else if (key === 'Escape') {
                suggestionsContainer.innerHTML = '';
                searchWrapper.classList.remove('suggestions-active');
                return;
            }
        }
        
        // 如果没有建议列表或按下了其他键，允许正常输入
        if (key === 'Enter') {
            performSearch();
        }
    }

    // --- 设置事件监听器 ---
    function setupEventListeners() {
        // 搜索输入框事件
        searchInput.addEventListener('input', handleInputChange);
        searchInput.addEventListener('keydown', handleKeydown);
        
        // 点击搜索框外部时隐藏建议
        document.addEventListener('click', (e) => {
            if (!searchWrapper.contains(e.target)) {
                searchWrapper.classList.remove('suggestions-active');
            }
        });
        
        // 帮助按钮
        const helpButton = document.querySelector('.help-button');
        const tooltip = document.querySelector('.tooltip');
        
        helpButton.addEventListener('mouseenter', () => {
            tooltip.style.display = 'block';
        });
        
        helpButton.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        
        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // --- 初始化函数 ---
    async function init() {
        // 设置事件监听器
        setupEventListeners();
        
        // 设置搜索框占位符文本
        const setPlaceholder = () => {
            const placeholderKey = 'search.placeholder';
            searchInput.placeholder = i18n.translate(placeholderKey);
        };
        
        // 初始设置占位符并在语言更改时更新
        setPlaceholder();
        i18n.onLanguageChange(setPlaceholder);

        // 设置焦点到搜索框
        searchInput.focus();
    }

    // 开始初始化
    init();
}); 