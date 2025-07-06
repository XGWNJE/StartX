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

    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }

    function faviconUrl(u) {
        const url = new URL(chrome.runtime.getURL("/_favicon/"));
        url.searchParams.set("pageUrl", u);
        url.searchParams.set("size", "32");
        return url.toString();
    }

    let selectedIndex = -1;

    // Settings Panel
    const settingsIcon = document.getElementById('open-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const glassEffectToggle = document.getElementById('theme-switch');
    const searchEngineGroup = document.getElementById('search-engine-group');
    const themeName = document.getElementById('theme-name');
    const wallpaperGrid = document.getElementById('wallpaper-grid');
    const addWallpaperInput = document.getElementById('add-wallpaper-input');
    const addWallpaperBtn = document.getElementById('add-wallpaper-btn');
    const wallpaperInput = document.getElementById('wallpaper-input');
    let customWallpapers = [];

    settingsIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('open')) {
            if (!settingsPanel.contains(e.target) && !settingsIcon.contains(e.target)) {
                settingsPanel.classList.remove('open');
            }
        }
    });

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
                glassEffectToggle.checked = true;
            }
            
            // Wallpaper
            customWallpapers = data.customWallpapers || [];
            const savedWallpaperPath = data.wallpaper || 'wallpapers/blurry-background.svg';
            applyWallpaper(savedWallpaperPath);
            updateWallpaperSelection(savedWallpaperPath);

            // Populate custom wallpapers
            customWallpapers.forEach(wallpaper => {
                createWallpaperThumb(wallpaper, true);
            });
        });
        updateThemeName();
    }

    searchEngineGroup.addEventListener('change', (e) => {
        const selectedEngine = e.target.value;
        currentSearchEngine = searchEngines[selectedEngine];
        chrome.storage.local.set({ searchEngine: selectedEngine });
        updatePillBackground(e.target);
        updateLabelColors();
    });
    
    glassEffectToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('glass-effect-enabled');
            chrome.storage.local.set({ glassEffect: true });
        } else {
            document.body.classList.remove('glass-effect-enabled');
            chrome.storage.local.set({ glassEffect: false });
        }
    });

    addWallpaperInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('图片文件过大，请选择小于2MB的文件。');
                return;
            }

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
                    const defaultPath = 'wallpapers/blurry-background.svg';
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
        // This function is removed as per the instructions
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

    const search = new Search();

    // --- Initialization Sequence ---
    loadSettings();
    await search.init();

    const searchBox = document.querySelector('.search-box');
    searchBox.addEventListener('mousemove', e => {
        const rect = searchBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        searchBox.style.setProperty('--mouse-x', `${x}px`);
        searchBox.style.setProperty('--mouse-y', `${y}px`);
    });

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
            const results = search.performSearch(query);
            showSuggestions(results);
        } else {
            hideSuggestions();
        }
        selectedIndex = -1;
    }

    function handleKeydown(e) {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');

        // Handle selection navigation first
        switch (e.key) {
            case 'ArrowDown':
            case 'Tab':
                if (!items.length) return;
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelectionHighlight(items);
                return; // Stop further execution
            case 'ArrowUp':
                if (!items.length) return;
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelectionHighlight(items);
                return; // Stop further execution
            case 'Escape':
                e.preventDefault();
                selectedIndex = -1;
                updateSelectionHighlight(items);
                return; // Stop further execution
        }

        // Handle 'Enter' key separately
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1 && items.length > 0) {
                const selectedUrl = items[selectedIndex].dataset.url;
                window.location.href = selectedUrl;
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
                item.dataset.url = bookmark.url;
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
                title.title = bookmark.title;

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
}); 