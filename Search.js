/**
 * 管理和搜索浏览器书签.
 */
class Search {
    /**
     * 初始化 Search 类, 并获取所有书签.
     */
    constructor() {
        /** @type {{title: string, url: string}[]} */
        this.bookmarks = [];
        this.init();
    }

    /**
     * 异步加载所有书签.
     * @private
     */
    async init() {
        this.bookmarks = await this.getAllBookmarks();
    }

    /**
     * 使用 chrome.bookmarks API 从浏览器中检索所有书签.
     * @returns {Promise<{title: string, url: string}[]>} 一个 Promise, 解析后会返回一个扁平的书签列表.
     */
    async getAllBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((tree) => {
                const bookmarks = [];
                this.flattenBookmarks(tree[0], bookmarks);
                resolve(bookmarks);
            });
        });
    }

    /**
     * 递归地将书签树扁平化为一个简单的数组.
     * @param {chrome.bookmarks.BookmarkTreeNode} node - 树中的当前书签节点.
     * @param {{title: string, url: string}[]} bookmarks - 用于存储扁平化书签的数组.
     * @private
     */
    flattenBookmarks(node, bookmarks) {
        if (node.url) {
            bookmarks.push({
                title: node.title,
                url: node.url
            });
        }
        if (node.children) {
            node.children.forEach(child => this.flattenBookmarks(child, bookmarks));
        }
    }

    /**
     * 在已存储的书签上执行搜索.
     * @param {string} query - 搜索词.
     * @returns {{title: string, url: string}[]} 匹配的书签列表, 最多返回 20 个结果.
     */
    performSearch(query) {
        if (!query) {
            return [];
        }
        const lowerCaseQuery = query.toLowerCase();
        return this.bookmarks.filter(bookmark => {
            return bookmark.title.toLowerCase().includes(lowerCaseQuery) ||
                   bookmark.url.toLowerCase().includes(lowerCaseQuery);
        }).slice(0, 20); // Limit results for performance
    }
} 