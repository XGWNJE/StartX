/**
 * 管理搜索建议的显示和交互.
 */
class SuggestionsHandler {
    /**
     * @param {HTMLElement} suggestionsContainer - 用于显示建议的 DOM 元素.
     * @param {HTMLElement} searchWrapper - 搜索框的包装元素, 用于切换 `suggestions-active` 类.
     */
    constructor(suggestionsContainer, searchWrapper) {
        this.container = suggestionsContainer;
        this.wrapper = searchWrapper;
        this.selectedIndex = -1;
        this.items = [];

        this._addEventListeners();
    }

    /**
     * 显示建议列表.
     * @param {{title: string, url: string}[]} bookmarks - 要显示的书签/建议列表.
     */
    show(bookmarks) {
        this.container.innerHTML = '';
        this.items = [];

        if (bookmarks.length > 0) {
            this.wrapper.classList.add('suggestions-active');
            bookmarks.forEach((bookmark, index) => {
                const item = this._createSuggestionItem(bookmark, index);
                this.container.appendChild(item);
                this.items.push(item);
            });
        } else {
            this.hide();
        }
        this.selectedIndex = -1;
    }

    /**
     * 隐藏建议列表.
     */
    hide() {
        this.wrapper.classList.remove('suggestions-active');
        this.selectedIndex = -1;
    }

    /**
     * 处理键盘导航 (上, 下, Tab, Escape).
     * @param {string} key - 按下的键名, e.g., 'ArrowDown'.
     * @returns {boolean} - 如果按键被处理了, 返回 true.
     */
    navigate(key) {
        if (!this.items.length) return false;

        const keyMap = {
            'ArrowDown': () => (this.selectedIndex + 1) % this.items.length,
            'Tab': () => (this.selectedIndex + 1) % this.items.length,
            'ArrowUp': () => (this.selectedIndex - 1 + this.items.length) % this.items.length,
            'Escape': () => -1
        };

        if (key in keyMap) {
            this.selectedIndex = keyMap[key]();
            this._updateSelectionHighlight();
            return true;
        }

        return false;
    }

    /**
     * 获取当前选中项的 URL.
     * @returns {string|null} - 选中项的 URL, 或如果没有选中项则返回 null.
     */
    getSelectedUrl() {
        if (this.selectedIndex > -1 && this.items[this.selectedIndex]) {
            return this.items[this.selectedIndex].dataset.url;
        }
        return null;
    }

    /**
     * 设置内部事件监听器.
     * @private
     */
    _addEventListeners() {
        this.container.addEventListener('mouseleave', () => {
            this.selectedIndex = -1;
            this._updateSelectionHighlight();
        });
    }

    /**
     * 创建单个建议项的 DOM 元素.
     * @param {{title: string, url: string}} bookmark - 书签数据.
     * @param {number} index - 书签在列表中的索引.
     * @returns {HTMLElement} - 创建的 DOM 元素.
     * @private
     */
    _createSuggestionItem(bookmark, index) {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.dataset.url = bookmark.url;

        item.addEventListener('click', () => {
            window.location.href = bookmark.url;
        });

        item.addEventListener('mouseenter', () => {
            this.selectedIndex = index;
            this._updateSelectionHighlight();
        });

        const img = document.createElement('img');
        img.src = this._getFaviconUrl(bookmark.url);
        img.onerror = function() { this.src = 'icons/default-favicon.png'; };

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = bookmark.title;
        title.title = bookmark.title;

        const urlSpan = document.createElement('span');
        urlSpan.className = 'url';
        urlSpan.textContent = this._getDomain(bookmark.url);

        item.appendChild(img);
        item.appendChild(title);
        item.appendChild(urlSpan);

        return item;
    }

    /**
     * 更新建议项的高亮显示.
     * @private
     */
    _updateSelectionHighlight() {
        this.items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * 从 URL 中提取域名.
     * @param {string} url - 完整的 URL.
     * @returns {string} - 域名.
     * @private
     */
    _getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }

    /**
     * 获取 Chrome 扩展的 favicon URL.
     * @param {string} u - 页面的 URL.
     * @returns {string} - favicon 的 URL.
     * @private
     */
    _getFaviconUrl(u) {
        const url = new URL(chrome.runtime.getURL("/_favicon/"));
        url.searchParams.set("pageUrl", u);
        url.searchParams.set("size", "32");
        return url.toString();
    }
} 