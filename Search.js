class Search {
    constructor() {
        this.bookmarks = [];
        this.init();
    }

    async init() {
        this.bookmarks = await this.getAllBookmarks();
    }

    async getAllBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((tree) => {
                const bookmarks = [];
                this.flattenBookmarks(tree[0], bookmarks);
                resolve(bookmarks);
            });
        });
    }

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