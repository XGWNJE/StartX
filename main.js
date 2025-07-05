document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    const searchWrapper = document.querySelector('.search-wrapper');
    const defaultSearchEngine = 'https://www.google.com/search?q=';
    const faviconUrl = (url) => `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`;

    searchInput.addEventListener('input', handleInputChange);
    searchInput.addEventListener('keydown', handleEnterKey);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideSuggestions();
        }
    });

    async function handleInputChange(e) {
        const query = e.target.value.trim();
        if (query.length > 0) {
            const bookmarks = await searchBookmarks(query);
            showSuggestions(bookmarks);
        } else {
            hideSuggestions();
        }
    }

    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                if (isUrl(query)) {
                    const url = query.startsWith('http') ? query : `http://${query}`;
                    window.location.href = url;
                } else {
                    window.location.href = `${defaultSearchEngine}${encodeURIComponent(query)}`;
                }
            }
        }
    }

    function searchBookmarks(query) {
        return new Promise((resolve) => {
            if (chrome.bookmarks) {
                chrome.bookmarks.search(query, (results) => {
                    resolve(results.filter(b => b.url).slice(0, 10)); // Limit results
                });
            } else {
                resolve([]);
            }
        });
    }

    function showSuggestions(bookmarks) {
        suggestionsContainer.innerHTML = '';
        if (bookmarks.length > 0) {
            searchWrapper.classList.add('suggestions-active');
            bookmarks.forEach(bookmark => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.addEventListener('click', () => {
                    window.location.href = bookmark.url;
                });

                const img = document.createElement('img');
                img.src = faviconUrl(bookmark.url);
                img.onerror = function() { this.src = 'icons/default-favicon.png'; };


                const title = document.createElement('span');
                title.className = 'title';
                title.textContent = bookmark.title;

                const url = document.createElement('span');
                url.className = 'url';
                url.textContent = getDomain(bookmark.url);

                item.appendChild(img);
                item.appendChild(title);
                item.appendChild(url);
                suggestionsContainer.appendChild(item);
            });
        } else {
            hideSuggestions();
        }
    }
    
    function hideSuggestions() {
        searchWrapper.classList.remove('suggestions-active');
    }

    function isUrl(text) {
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!urlPattern.test(text);
    }
    
    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return '';
        }
    }
}); 