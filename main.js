document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM 元素 ---
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    const searchWrapper = document.querySelector('.search-wrapper');
    const searchBox = document.querySelector('.search-box');

    // --- 状态与配置 ---
    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        baidu: 'https://www.baidu.com/s?wd='
    };
    let currentSearchEngine = searchEngines.google; // 默认值, 会由 SettingsHandler 初始化

    // --- 类实例 ---
    const search = new Search();
    const imageCompressor = new ImageCompressor();
    const suggestionsHandler = new SuggestionsHandler(suggestionsContainer, searchWrapper);
    const settingsHandler = new SettingsHandler({
        settingsIcon: document.getElementById('open-settings'),
        settingsPanel: document.getElementById('settings-panel'),
        glassEffectToggle: document.getElementById('theme-switch'),
        searchEngineGroup: document.getElementById('search-engine-group'),
        wallpaperGrid: document.getElementById('wallpaper-grid'),
        addWallpaperInput: document.getElementById('add-wallpaper-input'),
        backgroundContainer: document.querySelector('.background-container'),
        imageCompressor: imageCompressor,
        searchEngines: searchEngines,
        onSearchEngineChange: (newEngineUrl) => {
            currentSearchEngine = newEngineUrl;
        }
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

    // --- 事件处理器 ---
    async function handleInputChange(e) {
        const query = e.target.value.trim();
        if (query.length > 0) {
            const results = search.performSearch(query);
            suggestionsHandler.show(results);
        } else {
            suggestionsHandler.hide();
        }
    }

    function handleKeydown(e) {
        // 允许建议处理器处理导航键
        const navigationHandled = suggestionsHandler.navigate(e.key);
        if (navigationHandled) {
            e.preventDefault();
            return;
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
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                suggestionsHandler.hide();
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