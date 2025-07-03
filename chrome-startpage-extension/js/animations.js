// 检查是否是有效的URL
const isValidURL = (string) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?'+ // 协议
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // 域名
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // 或IP
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // 端口和路径
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // 查询字符串
    '(\\#[-a-z\\d_]*)?$','i' // 片段标识符
  );
  return pattern.test(string);
};

// 强制设置页面背景为黑色
function forceBlackBackground() {
  // 设置HTML和BODY背景为黑色
  document.documentElement.style.backgroundColor = '#000';
  document.body.style.backgroundColor = '#000';
  
  // 移除所有可能的背景类
  document.body.classList.remove(
    'bg-default', 'bg-blue', 'bg-purple', 
    'bg-sunset', 'bg-night', 'bg-forest'
  );
  
  // 隐藏背景层
  const bgGlow = document.querySelector('.bg-glow');
  const customBg = document.getElementById('custom-background');
  const extraGlow = document.querySelector('.extra-glow');
  
  if (bgGlow) {
    bgGlow.style.opacity = '0';
    bgGlow.style.zIndex = '-100';
  }
  
  if (customBg) {
    customBg.style.opacity = '0';
    customBg.style.zIndex = '-100';
  }
  
  if (extraGlow) {
    extraGlow.style.opacity = '0';
    extraGlow.style.zIndex = '-100';
  }
}

// 生成并播放CRT关闭音效 - 增强版
function playCrtOffSound() {
  try {
    // 创建音频上下文
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 创建主震荡器
    const oscillator1 = audioCtx.createOscillator();
    const gainNode1 = audioCtx.createGain();
    
    // 创建第二个震荡器，增加音效层次感
    const oscillator2 = audioCtx.createOscillator();
    const gainNode2 = audioCtx.createGain();
    
    // 连接节点
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioCtx.destination);
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioCtx.destination);
    
    // 设置主震荡器参数
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    
    // 设置第二个震荡器参数
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(220, audioCtx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.2);
    
    // 设置音量
    gainNode1.gain.setValueAtTime(0.04, audioCtx.currentTime); // 略微提高音量
    gainNode1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    gainNode2.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    // 启动并停止震荡器
    oscillator1.start();
    oscillator1.stop(audioCtx.currentTime + 0.15);
    
    oscillator2.start(audioCtx.currentTime + 0.02); // 稍微延迟启动
    oscillator2.stop(audioCtx.currentTime + 0.2);
    
    // 添加噪声效果
    setTimeout(() => {
      const noiseOscillator = audioCtx.createOscillator();
      const noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();
      
      noiseOscillator.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      
      noiseOscillator.type = 'sawtooth';
      noiseOscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
      
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;
      noiseFilter.Q.value = 0.5;
      
      noiseGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      
      noiseOscillator.start();
      noiseOscillator.stop(audioCtx.currentTime + 0.1);
    }, 50);
    
  } catch (e) {
    console.error('无法播放音效:', e);
  }
}

// 处理搜索功能
const handleSearch = (searchInput, searchContainer) => {
  const query = searchInput.value.trim();
  
  if (!query) return;
  
  // 添加搜索动画
  searchContainer.classList.add('searching');
  
  // 创建优雅的过渡效果
  const performTransition = () => {
    // 播放CRT关闭声音
    playCrtOffSound();
    
    // 添加增强版震动模式，模拟CRT关闭时的震动感
    if (navigator.vibrate) {
      // 更复杂的震动模式：短-短-长-短-短
      navigator.vibrate([15, 10, 20, 10, 40, 5, 15]);
    }
    
    // 强制设置页面背景为黑色
    forceBlackBackground();
    
    // 1. 首先缩小搜索栏，模拟CRT效果
    searchContainer.classList.add('search-transition');
    
    // 添加页面退出动画
    document.body.classList.add('page-exit');
    
    // 2. 延迟执行实际的导航，让动画有时间完成
    setTimeout(() => {
      // 创建黑色覆盖层，确保最终显示为黑色
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = '#000';
      overlay.style.zIndex = '10000';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease-in';
      document.body.appendChild(overlay);
      
      // 确保body背景为黑色
      document.body.style.backgroundColor = '#000';
      
      // 保持背景层在Z轴上的位置
      const bgGlow = document.querySelector('.bg-glow');
      const customBg = document.getElementById('custom-background');
      if (bgGlow) bgGlow.style.zIndex = '-1';
      if (customBg) customBg.style.zIndex = '-2';

      // 使黑色覆盖层显示
      setTimeout(() => {
        overlay.style.opacity = '1';
        
        // 在动画完成后跳转
        setTimeout(() => {
          // 清除输入值，防止记录在历史记录中
          searchInput.value = '';
          
          // 检查是否是URL
          if (isValidURL(query)) {
            // 如果没有协议，添加https://
            let url = query;
            if (!query.startsWith('http://') && !query.startsWith('https://')) {
              url = 'https://' + query;
            }
            // 使用replace方法在当前页面加载URL
            window.location.replace(url);
          } else {
            // 根据用户设置选择搜索引擎
            import('./config.js').then(({ searchEngines }) => {
              import('./settings.js').then(({ loadSettings }) => {
                loadSettings().then(settings => {
                  // 获取当前设置的搜索引擎
                  const engineKey = settings.searchEngine || 'google';
                  const engine = searchEngines[engineKey] || searchEngines.google;
                  
                  // 使用选定的搜索引擎进行搜索
                  const searchUrl = `${engine.url}${encodeURIComponent(query)}`;
                  window.location.replace(searchUrl);
                }).catch(error => {
                  console.error('加载设置时出错:', error);
                  // 出错时使用默认搜索引擎
                  window.location.replace(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
                });
              });
            });
          }
        }, 200);
      }, 50);
    }, 200);
  };
  
  // 执行优雅的过渡
  performTransition();
};

// 更新全局光晕位置的函数 - 已不再使用
function updateGlowPosition(x, y) {
  // 移除了对 --mouse-x 和 --mouse-y 变量的设置，因为这些变量已不再使用
}

// 检查鼠标是否在元素上方
function isMouseOverElement(x, y, rect) {
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

// 搜索栏聚焦时的动画效果
function animateSearchFocus(liquidEffect) {
  liquidEffect.animate([
    { transform: 'scale(0.99)' },
    { transform: 'scale(1.005)' },
    { transform: 'scale(1)' }
  ], {
    duration: 800,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  });
}

// 预加载动画效果
function preloadAnimations(liquidEffect, searchEdgeHighlight) {
    // 预加载搜索栏的动画效果
    setTimeout(() => {
      // 短暂触发一次光晕效果，使其被浏览器渲染引擎缓存
      liquidEffect.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.001)' },
        { transform: 'scale(1)' }
      ], {
        duration: 1,
        easing: 'ease'
      });
      
      // 预加载边缘高光效果
      if (searchEdgeHighlight) {
        // 强制浏览器重新计算高光效果样式
        searchEdgeHighlight.style.display = 'none';
        // 触发回流
        searchEdgeHighlight.offsetHeight;
        // 恢复显示
        searchEdgeHighlight.style.display = '';
      }
    }, 50);
}

export function initAnimations(
  searchInput, searchButton, searchContainer, 
  liquidEffect, searchEdgeHighlight
) {
  // 鼠标跟随效果 - 简化版本
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    
    // 搜索栏特定交互
    const rect = searchContainer.getBoundingClientRect();
    
    if (isMouseOverElement(clientX, clientY, rect) && searchEdgeHighlight) {
      // 计算鼠标在搜索栏中的相对位置
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // 根据鼠标位置调整边框颜色，创造动态效果
      const distanceToEdge = Math.min(
        x, y, rect.width - x, rect.height - y
      );
      const brightness = Math.max(0.5, 1 - (distanceToEdge / 50));
      
      // 更新边框颜色
      searchEdgeHighlight.style.borderColor = `rgba(255, 255, 255, ${brightness})`;
    }
  });

  // 点击搜索按钮时搜索
  searchButton.addEventListener('click', () => {
    // 添加点击涟漪效果
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    searchButton.appendChild(ripple);
    
    // 动画结束后移除涟漪元素
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    handleSearch(searchInput, searchContainer);
  });

  // 按下回车键时搜索
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput, searchContainer);
    }
  });

  // 搜索栏获得焦点时的效果
  searchInput.addEventListener('focus', () => {
    searchContainer.classList.add('focused');
    if (liquidEffect) {
      animateSearchFocus(liquidEffect);
    }
  });

  // 搜索栏失去焦点时的效果
  searchInput.addEventListener('blur', () => {
    searchContainer.classList.remove('focused');
  });

  // 监听输入变化，更新搜索栏状态
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim()) {
      searchContainer.classList.add('has-content');
    } else {
      searchContainer.classList.remove('has-content');
    }
  });

  // 预加载动画效果
  preloadAnimations(liquidEffect, searchEdgeHighlight);
} 