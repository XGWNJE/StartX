/**
 * 管理所有与设置面板相关的逻辑.
 */
class SettingsHandler {
    /**
     * @param {object} options - 配置对象.
     * @param {HTMLElement} options.settingsIcon - 打开设置的图标元素.
     * @param {HTMLElement} options.settingsPanel - 设置面板元素.
     * @param {HTMLElement} options.glassEffectToggle - 玻璃效果的开关元素.
     * @param {HTMLElement} options.logoVisibilityToggle - 图标显示的开关元素.
     * @param {HTMLElement} options.languageSelector - 语言选择下拉框.
     * @param {HTMLElement} options.searchEngineGroup - 搜索引擎的单选按钮组.
     * @param {HTMLElement} options.wallpaperGrid - 显示壁纸缩略图的网格.
     * @param {HTMLElement} options.addWallpaperInput - 添加壁纸的文件输入框.
     * @param {HTMLElement} options.backgroundContainer - 应用壁纸的背景容器.
     * @param {ImageCompressor} options.imageCompressor - 用于压缩图片的 ImageCompressor 实例.
     * @param {object} options.searchEngines - 包含搜索引擎 URL 的对象.
     * @param {function(string): void} options.onSearchEngineChange - 当搜索引擎改变时调用的回调函数.
     * @param {I18n} options.i18n - 国际化模块实例.
     */
    constructor(options) {
        this.settingsIcon = options.settingsIcon;
        this.settingsPanel = options.settingsPanel;
        this.glassEffectToggle = options.glassEffectToggle;
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
        chrome.storage.local.get(['searchEngine', 'glassEffect', 'wallpaper', 'customWallpapers', 'alwaysHideLogo', 'locale'], (data) => {
            // 搜索引擎
            const savedEngine = data.searchEngine || 'google';
            this.onSearchEngineChange(this.searchEngines[savedEngine]);
            const radio = this.searchEngineGroup.querySelector(`input[name="searchEngine"][value="${savedEngine}"]`);
            if (radio) {
                radio.checked = true;
                this._updatePillBackground(radio);
                this._updateLabelColors();
            }

            // 玻璃效果
            const glassEffect = data.glassEffect !== false;
            document.body.classList.toggle('glass-effect-enabled', glassEffect);
            this.glassEffectToggle.checked = glassEffect;
            
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
            const selectedEngine = e.target.value;
            this.onSearchEngineChange(this.searchEngines[selectedEngine]);
            chrome.storage.local.set({ searchEngine: selectedEngine });
            this._updatePillBackground(e.target);
            this._updateLabelColors();
        });
        
        this.glassEffectToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            document.body.classList.toggle('glass-effect-enabled', enabled);
            chrome.storage.local.set({ glassEffect: enabled });
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
     * 为一个壁纸创建 DOM 缩略图.
     * @param {object} wallpaper - 壁纸对象.
     * @param {boolean} isCustom - 是否为自定义壁纸.
     */
    createWallpaperThumb(wallpaper, isCustom) {
        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumb';
        const thumbPath = wallpaper.thumbnail || wallpaper.path;
        thumb.style.backgroundImage = `url('${thumbPath}')`;
        thumb.dataset.path = wallpaper.path;
        thumb.dataset.id = wallpaper.id;
        thumb.title = wallpaper.name;

        if (isCustom) {
            thumb.classList.add('custom-wallpaper');
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-wallpaper';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCustomWallpaper(wallpaper.id);
            });
            thumb.appendChild(deleteBtn);
        }

        thumb.addEventListener('click', () => {
            const newPath = thumb.dataset.path;
            chrome.storage.local.set({ wallpaper: newPath }, () => {
                this.applyWallpaper(newPath);
                this.updateWallpaperSelection(newPath);
            });
        });
        
        this.wallpaperGrid.appendChild(thumb);
    }

    /**
     * 从 JSON 文件加载并显示默认壁纸.
     */
    async populateWallpapers() {
        try {
            const response = await fetch('wallpapers/wallpapers.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const wallpapers = await response.json();
            
            wallpapers.forEach(wallpaper => this.createWallpaperThumb(wallpaper, false));
        } catch (error) {
            console.warn('Could not load wallpapers.json. Default wallpapers will be used.', error);
        }
    }
    
    /**
     * 更新搜索引擎单选按钮的 'pill' 背景位置.
     * @param {HTMLInputElement} radio - 被选中的单选按钮.
     * @private
     */
    _updatePillBackground(radio) {
        const selectedLabel = radio.parentNode;
        const background = this.searchEngineGroup.querySelector('.radio-pill-background');
        if (background && selectedLabel && selectedLabel.parentElement.classList.contains('pill-style')) {
            const labelIndex = Array.from(selectedLabel.parentElement.children).indexOf(selectedLabel) - 1;
            if (labelIndex > -1) {
                 background.style.transform = `translateX(${labelIndex * 100}%)`;
            }
        }
    }

    /**
     * 更新搜索引擎标签的文本颜色.
     * @private
     */
    _updateLabelColors() {
        const labels = this.searchEngineGroup.querySelectorAll('.radio-label');
        labels.forEach(label => {
            if (label.querySelector('input').checked) {
                label.classList.add('selected-label');
            } else {
                label.classList.remove('selected-label');
            }
        });
    }
} 