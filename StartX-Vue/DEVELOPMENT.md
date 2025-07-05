# StartX Development Notes

## Current Progress
- Basic UI structure implemented
- Core components created (Wallpaper, Search, Settings)
- State management with Pinia
- Theme switching (light/dark)
- Wallpaper management with upload functionality
- Local storage for settings persistence
- Keyboard navigation for search results
- URL detection in search input
- Chrome extension manifest
- Browser API abstractions for Chrome/Firefox

## TODO
1. **Wallpaper Management**
   - ✅ Implement actual wallpaper upload functionality
   - Add file system access for wallpaper folder selection
   - ✅ Implement wallpaper thumbnails generation

2. **Search Functionality**
   - ✅ Implement Chrome/Firefox bookmark API integration
   - ✅ Add keyboard navigation for search results
   - ✅ Implement URL detection and direct navigation

3. **Settings Management**
   - ✅ Implement actual storage of settings (chrome.storage or localStorage)
   - Add import/export settings functionality

4. **Browser Extension**
   - ✅ Create manifest.json for Chrome/Firefox
   - ✅ Implement background scripts for extension functionality
   - ✅ Handle permissions appropriately

## Extension Implementation Notes

### Chrome Extension Requirements
- Create a manifest.json file in the root directory
- Configure proper permissions for bookmarks and storage
- Set up background scripts for extension functionality

### Firefox Extension Requirements
- Similar to Chrome but with Firefox-specific APIs
- Handle manifest differences between Chrome and Firefox

## Resources
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Firefox WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) 