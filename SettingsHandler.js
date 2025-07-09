/**
 * 管理所有与设置面板相关的逻辑.
 */
class SettingsHandler {
    /**
     * @param {object} options - 配置对象.
     * @param {HTMLElement} options.settingsIcon - 打开设置的图标元素.
     * @param {HTMLElement} options.settingsPanel - 设置面板元素.
     * @param {HTMLElement} options.logoVisibilityToggle - 图标显示的开关元素.
     * @param {HTMLElement} options.languageSelector - 语言选择下拉框.
     * @param {HTMLElement} options.searchEngineGroup - 搜索引擎的切换开关组.
     * @param {HTMLElement} options.wallpaperGrid - 显示壁纸缩略图的网格.
     * @param {HTMLElement} options.addWallpaperInput - 添加壁纸的文件输入框.
     * @param {HTMLElement} options.backgroundContainer - 应用壁纸的背景容器.
     * @param {ImageCompressor} options.imageCompressor - 用于压缩图片的 ImageCompressor 实例.
     * @param {object} options.searchEngines - 包含搜索引擎 URL 的对象.
     * @param {function(object, object): void} options.onSearchEngineChange - 当搜索引擎改变时调用的回调函数，传递URL和引擎启用状态.
     * @param {I18n} options.i18n - 国际化模块实例.
     */
    constructor(options) {
        this.settingsIcon = options.settingsIcon;
        this.settingsPanel = options.settingsPanel;
        this.logoVisibilityToggle = options.logoVisibilityToggle;
        this.languageSelector = options.languageSelector;
        this.searchEngineGroup = options.searchEngineGroup;
        this.wallpaperGrid = options.wallpaperGrid;
        this.addWallpaperInput = options.addWallpaperInput;
        this.backgroundContainer = options.backgroundContainer;
        
        this.imageCompressor = options.imageCompressor;
        this.searchEngines = options.searchEngines;
        this.onSearchEngineChange = options.onSearchEngineChange;
        this.i18n = options.i18n;

        // 存储已启用的搜索引擎状态
        this.enabledSearchEngines = {
            google: true,
            bing: true,
            baidu: true
        };

        /** @type {{id: string, path: string, name: string}[]} */
        this.customWallpapers = [];

        this._setupEventListeners();
        this.loadSettings();
        this.populateWallpapers();
    }

    /**
     * 从 chrome.storage 加载所有设置.
     */
    loadSettings() {
        chrome.storage.local.get(['enabledSearchEngines', 'primarySearchEngine', 'wallpaper', 'customWallpapers', 'alwaysHideLogo', 'locale'], (data) => {
            // 搜索引擎
            const enabledEngines = data.enabledSearchEngines || { google: true, bing: true, baidu: true };
            const primaryEngine = data.primarySearchEngine || 'google';
            
            this.enabledSearchEngines = enabledEngines;
            
            // 更新搜索引擎的启用状态
            Object.entries(this.enabledSearchEngines).forEach(([engine, enabled]) => {
                const toggle = this.searchEngineGroup.querySelector(`input[name="searchEngine"][value="${engine}"]`);
                if (toggle) {
                    toggle.checked = enabled;
                }
            });
            
            // 通知主应用搜索引擎更改
            this.onSearchEngineChange(
                this.searchEngines[primaryEngine], 
                this.enabledSearchEngines
            );
            
            // 图标显示（设置为是否始终隐藏）
            const alwaysHideLogo = data.alwaysHideLogo === true;
            document.documentElement.style.setProperty('--logo-visibility', alwaysHideLogo ? 'hidden' : 'visible');
            this.logoVisibilityToggle.checked = !alwaysHideLogo;
            
            // 语言设置
            if (data.locale && this.languageSelector) {
                this.languageSelector.value = data.locale;
            }
            
            // 壁纸
            this.customWallpapers = data.customWallpapers || [];
            const savedWallpaperPath = data.wallpaper || 'wallpapers/blurry-background.svg';
            this.applyWallpaper(savedWallpaperPath);
            this.updateWallpaperSelection(savedWallpaperPath);

            // 加载自定义壁纸
            this.customWallpapers.forEach(wallpaper => {
                this.createWallpaperThumb(wallpaper, true);
            });
        });
    }

    /**
     * 设置所有与设置相关的事件监听器.
     * @private
     */
    _setupEventListeners() {
        // 设置面板切换
        this.settingsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.settingsPanel.classList.toggle('open');
        });

        // 关闭按钮
        const closeButton = this.settingsPanel.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.settingsPanel.classList.remove('open');
            });
            
            // 确保关闭按钮的title属性能正确翻译
            if (this.i18n) {
                this.i18n.setLocale = this.i18n.setLocale.bind(this.i18n);
                const originalSetLocale = this.i18n.setLocale;
                const i18nInstance = this.i18n; // 保存i18n实例的引用
                this.i18n.setLocale = async function(locale) {
                    await originalSetLocale(locale);
                    // 更新关闭按钮的title属性
                    closeButton.title = i18nInstance.translate('settings.close');
                };
                
                // 初始设置title
                if (this.i18n.currentLocale) {
                    closeButton.title = this.i18n.translate('settings.close');
                }
            }
        }

        document.addEventListener('click', (e) => {
            if (this.settingsPanel.classList.contains('open')) {
                if (!this.settingsPanel.contains(e.target) && !this.settingsIcon.contains(e.target)) {
                    this.settingsPanel.classList.remove('open');
                }
            }
        });

        // 语言选择
        if (this.languageSelector && this.i18n) {
            this.languageSelector.addEventListener('change', async (e) => {
                const selectedLocale = e.target.value;
                await this.i18n.setLocale(selectedLocale);
            });
        }

        // 设置项控件
        this.searchEngineGroup.addEventListener('change', (e) => {
            if (e.target.name === 'searchEngine') {
                const selectedEngine = e.target.value;
                const isEnabled = e.target.checked;
                
                // 更新启用状态
                this.enabledSearchEngines[selectedEngine] = isEnabled;
                
                // 确保至少有一个搜索引擎是启用的
                const hasEnabledEngine = Object.values(this.enabledSearchEngines).some(enabled => enabled);
                
                if (!hasEnabledEngine) {
                    // 如果没有搜索引擎启用，强制启用当前的
                    this.enabledSearchEngines[selectedEngine] = true;
                    e.target.checked = true;
                }
                
                // 保存设置
                chrome.storage.local.set({ 
                    enabledSearchEngines: this.enabledSearchEngines,
                });
                
                // 通知更改
                this.onSearchEngineChange(
                    this.searchEngines, 
                    this.enabledSearchEngines
                );
            }
        });
        
        this.logoVisibilityToggle.addEventListener('change', (e) => {
            const alwaysHideLogo = !e.target.checked;
            document.documentElement.style.setProperty('--logo-visibility', alwaysHideLogo ? 'hidden' : 'visible');
            chrome.storage.local.set({ alwaysHideLogo: alwaysHideLogo });
        });

        // 添加壁纸
        this.addWallpaperInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const { compressed, dataUrl } = await this.imageCompressor.compress(file);

                    if (compressed) {
                        alert('为了节省存储空间，壁纸图片已被自动压缩。');
                    }
                    
                    const newWallpaper = {
                        id: `custom-${Date.now()}`,
                        path: dataUrl,
                        name: file.name
                    };

                    const updatedWallpapers = [...this.customWallpapers, newWallpaper];
                    
                    chrome.storage.local.set({ customWallpapers: updatedWallpapers }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving wallpaper:', chrome.runtime.lastError.message);
                            alert('保存壁纸失败，存储空间已满。请在设置中删除一些不用的壁纸，以释放空间。');
                        } else {
                            this.customWallpapers.push(newWallpaper);
                            this.createWallpaperThumb(newWallpaper, true);
                        }
                    });

                } catch (error) {
                    console.error('Could not process image:', error);
                    alert('无法处理该图片，请尝试其他文件。');
                }
            }
        });
    }

    /**
     * 应用壁纸到背景.
     * @param {string} path - 壁纸的路径.
     */
    applyWallpaper(path) {
        if (!path) return;
        this.backgroundContainer.style.backgroundImage = `url('${path}')`;
    }

    /**
     * 更新壁纸缩略图的选中状态.
     * @param {string} path - 选中壁纸的路径.
     */
    updateWallpaperSelection(path) {
        const thumbs = this.wallpaperGrid.querySelectorAll('.wallpaper-thumb');
        thumbs.forEach(thumb => {
            thumb.classList.toggle('selected', thumb.dataset.path === path);
        });
    }

    /**
     * 删除一个自定义壁纸.
     * @param {string} wallpaperId - 要删除壁纸的 ID.
     */
    deleteCustomWallpaper(wallpaperId) {
        const wallpaperIndex = this.customWallpapers.findIndex(w => w.id === wallpaperId);
        if (wallpaperIndex === -1) return;

        const deletedWallpaperPath = this.customWallpapers[wallpaperIndex].path;
        this.customWallpapers.splice(wallpaperIndex, 1);

        chrome.storage.local.set({ customWallpapers: this.customWallpapers }, () => {
             if (chrome.runtime.lastError) {
                console.error(`Error deleting wallpaper: ${chrome.runtime.lastError.message}`);
                return;
            }
            
            const thumbToRemove = this.wallpaperGrid.querySelector(`.wallpaper-thumb[data-id='${wallpaperId}']`);
            if (thumbToRemove) {
                thumbToRemove.remove();
            }

            chrome.storage.local.get('wallpaper', (data) => {
                if (data.wallpaper === deletedWallpaperPath) {
                    const defaultPath = 'wallpapers/blurry-background.svg';
                    chrome.storage.local.set({ wallpaper: defaultPath }, () => {
                        this.applyWallpaper(defaultPath);
                        this.updateWallpaperSelection(defaultPath);
                    });
                }
            });
        });
    }

    /**
     * 创建壁纸缩略图.
     * @param {{id: string, path: string, name: string}} wallpaper - 壁纸信息.
     * @param {boolean} isCustom - 是否为自定义壁纸.
     */
    createWallpaperThumb(wallpaper, isCustom) {
        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumb';
        thumb.dataset.path = wallpaper.path;
        thumb.dataset.id = wallpaper.id;
        thumb.style.backgroundImage = `url('${wallpaper.path}')`;
        thumb.title = wallpaper.name || '';
        
        // 添加点击事件以应用壁纸
        thumb.addEventListener('click', () => {
            chrome.storage.local.set({ wallpaper: wallpaper.path }, () => {
                this.applyWallpaper(wallpaper.path);
                this.updateWallpaperSelection(wallpaper.path);
            });
        });
        
        // 对于自定义壁纸，添加删除按钮
        if (isCustom) {
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-icon';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = '删除壁纸';
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发壁纸点击事件
                if (confirm('确定要删除这张壁纸吗？')) {
                    this.deleteCustomWallpaper(wallpaper.id);
                }
            });
            
            thumb.appendChild(deleteBtn);
        }
        
        // 添加到壁纸网格，插入到"添加"按钮之前
        const addBtn = this.wallpaperGrid.querySelector('.add-wallpaper');
        this.wallpaperGrid.insertBefore(thumb, addBtn.nextSibling);
        
        // 更新选中状态
        chrome.storage.local.get('wallpaper', (data) => {
            if (data.wallpaper === wallpaper.path) {
                thumb.classList.add('selected');
            }
        });
    }

    /**
     * 异步加载壁纸列表并填充网格.
     */
    async populateWallpapers() {
        try {
            const response = await fetch('wallpapers/wallpapers.json');
            const wallpapers = await response.json();
            
            wallpapers.forEach(wallpaper => {
                this.createWallpaperThumb(wallpaper, false);
            });
        } catch (error) {
            console.error('无法加载壁纸列表', error);
        }
    }
} 