document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    const searchWrapper = document.querySelector('.search-wrapper');
    const backgroundContainer = document.querySelector('.background-container');
    
    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        baidu: 'https://www.baidu.com/s?wd='
    };
    let currentSearchEngine = searchEngines.google;

    const faviconUrl = (url) => `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`;
    let selectedIndex = -1;

    // Settings Panel
    const settingsPanel = document.getElementById('settings-panel');
    const openSettingsBtn = document.getElementById('open-settings');
    const closeSettingsBtn = document.getElementById('close-settings');
    const searchEngineGroup = document.getElementById('search-engine-group');
    const themeSwitch = document.getElementById('theme-switch');
    const themeName = document.getElementById('theme-name');
    const wallpaperGrid = document.getElementById('wallpaper-grid');
    const addWallpaperInput = document.getElementById('add-wallpaper-input');
    let customWallpapers = [];

    openSettingsBtn.addEventListener('click', () => settingsPanel.classList.add('open'));
    closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.remove('open'));

    // Load settings and initialize
    function loadSettings() {
        chrome.storage.local.get(['searchEngine', 'glassEffect', 'wallpaper', 'customWallpapers'], (data) => {
            // Search engine
            const savedEngine = data.searchEngine || 'google';
            currentSearchEngine = searchEngines[savedEngine];
            const radio = document.querySelector(`input[name="searchEngine"][value="${savedEngine}"]`);
            if (radio) {
                radio.checked = true;
                updatePillBackground(radio);
                updateLabelColors();
            }

            // Glass Effect
            const glassEffect = data.glassEffect !== false; // Default to true
            if (glassEffect) {
                document.body.classList.add('glass-effect-enabled');
                themeSwitch.checked = true;
            }
            updateThemeName();
            
            // Wallpaper
            customWallpapers = data.customWallpapers || [];
            const savedWallpaperPath = data.wallpaper || 'wallpapers/default1.jpg';
            applyWallpaper(savedWallpaperPath);
            updateWallpaperSelection(savedWallpaperPath);

            // Populate custom wallpapers
            customWallpapers.forEach(wallpaper => {
                createWallpaperThumb(wallpaper, true);
            });
        });
    }

    searchEngineGroup.addEventListener('change', (e) => {
        const selectedEngine = e.target.value;
        currentSearchEngine = searchEngines[selectedEngine];
        chrome.storage.local.set({ searchEngine: selectedEngine });
        updatePillBackground(e.target);
        updateLabelColors();
    });
    
    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('glass-effect-enabled');
            chrome.storage.local.set({ glassEffect: true });
        } else {
            document.body.classList.remove('glass-effect-enabled');
            chrome.storage.local.set({ glassEffect: false });
        }
        updateThemeName();
    });

    addWallpaperInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newWallpaper = {
                    id: `custom_${Date.now()}`,
                    name: file.name,
                    path: event.target.result // Base64 Data URL
                };
                saveCustomWallpaper(newWallpaper);
            };
            reader.readAsDataURL(file);
        }
    });

    function saveCustomWallpaper(wallpaper) {
        customWallpapers.push(wallpaper);
        chrome.storage.local.set({ customWallpapers: customWallpapers }, () => {
             if (chrome.runtime.lastError) {
                console.error(`Error saving wallpaper: ${chrome.runtime.lastError.message}`);
                // Optional: handle error, e.g., remove from UI
            } else {
                createWallpaperThumb(wallpaper, true);
            }
        });
    }

    async function populateWallpapers() {
        try {
            const response = await fetch('wallpapers/wallpapers.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const wallpapers = await response.json();
            
            wallpapers.forEach(wallpaper => createWallpaperThumb(wallpaper, false));
        } catch (error) {
            console.warn('Could not load wallpapers.json. Default wallpapers will be used.', error);
        }
    }
    
    function createWallpaperThumb(wallpaper, isCustom) {
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
                deleteCustomWallpaper(wallpaper.id);
            });
            thumb.appendChild(deleteBtn);
        }

        thumb.addEventListener('click', () => {
            const newPath = thumb.dataset.path;
            chrome.storage.local.set({ wallpaper: newPath }, () => {
                applyWallpaper(newPath);
                updateWallpaperSelection(newPath);
            });
        });
        
        wallpaperGrid.appendChild(thumb);
    }

    function deleteCustomWallpaper(wallpaperId) {
        const wallpaperIndex = customWallpapers.findIndex(w => w.id === wallpaperId);
        if (wallpaperIndex === -1) return;

        const deletedWallpaperPath = customWallpapers[wallpaperIndex].path;
        customWallpapers.splice(wallpaperIndex, 1);

        chrome.storage.local.set({ customWallpapers: customWallpapers }, () => {
             if (chrome.runtime.lastError) {
                console.error(`Error deleting wallpaper: ${chrome.runtime.lastError.message}`);
                return;
            }
            
            const thumbToRemove = document.querySelector(`.wallpaper-thumb[data-id='${wallpaperId}']`);
            if (thumbToRemove) {
                thumbToRemove.remove();
            }

            chrome.storage.local.get('wallpaper', (data) => {
                if (data.wallpaper === deletedWallpaperPath) {
                    const defaultPath = 'wallpapers/default1.jpg';
                    chrome.storage.local.set({ wallpaper: defaultPath }, () => {
                        applyWallpaper(defaultPath);
                        updateWallpaperSelection(defaultPath);
                    });
                }
            });
        });
    }

    function applyWallpaper(path) {
        if (!path) return;
        backgroundContainer.style.backgroundImage = `url('${path}')`;
    }

    function updateWallpaperSelection(path) {
        const thumbs = document.querySelectorAll('.wallpaper-thumb');
        thumbs.forEach(thumb => {
            thumb.classList.toggle('selected', thumb.dataset.path === path);
        });
    }

    function updateThemeName() {
        themeName.textContent = `玻璃效果: ${document.body.classList.contains('glass-effect-enabled') ? '开启' : '关闭'}`;
    }
    
    function updatePillBackground(radio) {
        const selectedLabel = radio.parentNode;
        const background = document.querySelector('.radio-pill-background');
        if (background && selectedLabel && selectedLabel.parentElement.classList.contains('pill-style')) {
            const labelIndex = Array.from(selectedLabel.parentElement.children).indexOf(selectedLabel) - 1;
            if (labelIndex > -1) {
                 background.style.transform = `translateX(${labelIndex * 100}%)`;
            }
        }
    }

    function updateLabelColors() {
        const labels = searchEngineGroup.querySelectorAll('.radio-label');
        labels.forEach(label => {
            if (label.querySelector('input').checked) {
                label.classList.add('selected-label');
            } else {
                label.classList.remove('selected-label');
            }
        });
    }

    // --- Initialization Sequence ---
    await populateWallpapers();
    loadSettings();

    suggestionsContainer.addEventListener('mouseleave', () => {
        selectedIndex = -1;
        updateSelectionHighlight(suggestionsContainer.querySelectorAll('.suggestion-item'));
    });

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

        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1 && suggestions.length > 0) {
                suggestions[selectedIndex].click();
            } else {
                performSearch();
            }
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
        }
    }
    
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