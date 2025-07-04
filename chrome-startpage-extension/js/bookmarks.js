// 书签处理模块

// 存储所有书签的缓存
let bookmarksCache = [];
let lastUpdateTime = 0;
const CACHE_VALIDITY_PERIOD = 5 * 60 * 1000; // 5分钟缓存有效期

/**
 * 初始化书签模块
 */
export function initBookmarks() {
  console.log("初始化书签模块");
  // 预加载书签
  loadAllBookmarks();
}

/**
 * 加载所有书签
 * @returns {Promise<Array>} 书签数组
 */
export async function loadAllBookmarks() {
  try {
    // 如果缓存有效，直接返回缓存
    const now = Date.now();
    if (bookmarksCache.length > 0 && (now - lastUpdateTime) < CACHE_VALIDITY_PERIOD) {
      console.log("使用书签缓存，共", bookmarksCache.length, "个书签");
      return bookmarksCache;
    }
    
    // 使用Chrome书签API获取所有书签
    const bookmarkTree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    
    // 递归遍历书签树
    function traverseBookmarks(nodes, path = "") {
      for (const node of nodes) {
        // 如果是文件夹
        if (node.children) {
          const newPath = path ? `${path} > ${node.title}` : node.title;
          traverseBookmarks(node.children, newPath);
        } 
        // 如果是书签
        else if (node.url) {
          bookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            path: path,
            dateAdded: node.dateAdded,
            // 提取域名作为额外匹配字段
            domain: extractDomain(node.url),
            // 合并所有可搜索文本，用于模糊匹配
            searchText: `${node.title.toLowerCase()} ${extractDomain(node.url).toLowerCase()} ${path.toLowerCase()}`
          });
        }
      }
    }
    
    traverseBookmarks(bookmarkTree);
    
    // 更新缓存
    bookmarksCache = bookmarks;
    lastUpdateTime = now;
    
    console.log("加载书签完成，共", bookmarks.length, "个书签");
    return bookmarks;
  } catch (error) {
    console.error("加载书签失败:", error);
    return [];
  }
}

/**
 * 从URL中提取域名
 * @param {string} url 
 * @returns {string} 域名
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

/**
 * 模糊搜索书签
 * @param {string} query 搜索关键词
 * @param {number} limit 结果数量限制
 * @returns {Promise<Array>} 匹配的书签数组
 */
export async function searchBookmarks(query, limit = 5) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  query = query.toLowerCase().trim();
  
  try {
    // 确保书签已加载
    const bookmarks = await loadAllBookmarks();
    
    // 对查询词进行分词
    const queryTerms = query.split(/\s+/);
    
    // 计算每个书签的匹配得分
    const scoredResults = bookmarks.map(bookmark => {
      let score = 0;
      
      // 对每个查询词计算匹配度
      for (const term of queryTerms) {
        // 标题完全匹配
        if (bookmark.title.toLowerCase() === term) {
          score += 100;
        }
        // 标题开头匹配
        else if (bookmark.title.toLowerCase().startsWith(term)) {
          score += 80;
        }
        // 域名完全匹配
        else if (bookmark.domain.toLowerCase() === term) {
          score += 70;
        }
        // 域名开头匹配
        else if (bookmark.domain.toLowerCase().startsWith(term)) {
          score += 60;
        }
        // 标题包含匹配
        else if (bookmark.title.toLowerCase().includes(term)) {
          score += 50;
        }
        // 域名包含匹配
        else if (bookmark.domain.toLowerCase().includes(term)) {
          score += 40;
        }
        // 路径包含匹配
        else if (bookmark.path.toLowerCase().includes(term)) {
          score += 30;
        }
        // URL包含匹配
        else if (bookmark.url.toLowerCase().includes(term)) {
          score += 20;
        }
        // 搜索文本包含匹配
        else if (bookmark.searchText.includes(term)) {
          score += 10;
        }
      }
      
      return {
        bookmark,
        score
      };
    });
    
    // 过滤掉得分为0的结果，并按得分排序
    const filteredResults = scoredResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.bookmark);
    
    console.log(`书签搜索 "${query}" 找到 ${filteredResults.length} 个结果`);
    return filteredResults;
  } catch (error) {
    console.error("搜索书签失败:", error);
    return [];
  }
}

/**
 * 格式化书签路径，移除多余的分隔符
 * @param {string} path 
 * @returns {string} 格式化后的路径
 */
export function formatBookmarkPath(path) {
  if (!path) return '';
  return path.replace(/^\s*>\s*|\s*>\s*$/g, '');
}

/**
 * 获取书签的图标URL
 * @param {string} url 书签URL
 * @returns {string} 图标URL
 */
export function getBookmarkIconUrl(url) {
  try {
    const urlObj = new URL(url);
    // 使用Google的favicon服务，请求更大尺寸的图标(sz=64)以获得更高质量
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch (e) {
    // 返回一个默认图标
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
  }
} 