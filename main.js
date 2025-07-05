document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    const searchWrapper = document.querySelector('.search-wrapper');
    const defaultSearchEngine = 'https://www.google.com/search?q=';
    const faviconUrl = (url) => `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`;
    let selectedIndex = -1;

    searchInput.addEventListener('input', handleInputChange);
    searchInput.addEventListener('keydown', handleKeydown);
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
        selectedIndex = -1;
    }

    function handleKeydown(e) {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');

        if (e.key === 'Escape') {
            e.preventDefault();
            selectedIndex = -1;
            updateSelectionHighlight(suggestions);
            return;
        }

        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % suggestions.length;
            updateSelectionHighlight(suggestions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
            updateSelectionHighlight(suggestions);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1) {
                suggestions[selectedIndex].click();
            } else {
                performSearch();
            }
        }
    }
    
    function performSearch() {
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
    
    function updateSelectionHighlight(suggestions) {
        suggestions.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
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
            bookmarks.forEach((bookmark, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.addEventListener('click', () => {
                    window.location.href = bookmark.url;
                });

                item.addEventListener('mouseenter', () => {
                    selectedIndex = index;
                    updateSelectionHighlight(suggestionsContainer.querySelectorAll('.suggestion-item'));
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
        selectedIndex = -1;
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