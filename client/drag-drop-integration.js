// ========== drag-drop-integration.js ==========
// 拖拽系統整合腳本 - 與現有系統整合

// 全局增強版 UI 管理器實例
let enhancedTileUI = null;

// 初始化增強版系統
function initializeEnhancedTileSystem() {
  console.log('🚀 正在初始化增強版字母磚系統...');
  
  // 檢查依賴
  if (typeof DragDropManager === 'undefined') {
    console.error('❌ DragDropManager 未載入');
    return false;
  }
  
  if (typeof GameBoard === 'undefined') {
    console.error('❌ GameBoard 未載入');
    return false;
  }
  
  if (typeof EnhancedTileUIManager === 'undefined') {
    console.error('❌ EnhancedTileUIManager 未載入');
    return false;
  }

  try {
    // 創建增強版 UI 管理器
    enhancedTileUI = new EnhancedTileUIManager();
    enhancedTileUI.initialize();
    
    // 設置全局引用
    window.enhancedTileUI = enhancedTileUI;
    
    console.log('✅ 增強版字母磚系統初始化成功');
    return true;
  } catch (error) {
    console.error('❌ 增強版系統初始化失敗:', error);
    return false;
  }
}

// 與現有遊戲系統整合
function integrateWithExistingSystem() {
  console.log('🔗 整合現有遊戲系統...');
  
  // 替換現有的 startGameInterface 函數
  if (typeof window.startGameInterface === 'function') {
    window.originalStartGameInterface = window.startGameInterface;
  }
  
  // 新的遊戲界面啟動函數
  window.startGameInterface = function(gameData) {
    console.log('🎮 啟動增強版遊戲界面', gameData);
    
    // 確保系統已初始化
    if (!enhancedTileUI) {
      console.log('⚠️ 增強版系統未初始化，正在初始化...');
      if (!initializeEnhancedTileSystem()) {
        console.error('❌ 無法初始化增強版系統，回退到原始界面');
        if (window.originalStartGameInterface) {
          window.originalStartGameInterface(gameData);
        }
        return;
      }
    }
    
    // 切換到遊戲區段
    showSection('game-section');
    
    // 創建增強版界面
    enhancedTileUI.createGameInterface(gameData);
  };

  // 整合測試函數
  window.loadMockData = function() {
    if (enhancedTileUI) {
      enhancedTileUI.loadMockData();
    } else {
      console.error('❌ 增強版系統未初始化');
    }
  };

  window.clearTestData = function() {
    if (enhancedTileUI) {
      enhancedTileUI.clearTestData();
    } else {
      console.error('❌ 增強版系統未初始化');
    }
  };

  window.simulateDrawTile = function() {
    if (enhancedTileUI) {
      enhancedTileUI.simulateDrawTile();
    } else {
      console.error('❌ 增強版系統未初始化');
    }
  };

  // 整合遊戲控制函數
  window.checkWords = function() {
    if (enhancedTileUI) {
      enhancedTileUI.checkWords();
    } else {
      console.log('ℹ️ 檢查單詞功能需要增強版系統');
    }
  };

  window.clearSelection = function() {
    if (enhancedTileUI) {
      enhancedTileUI.clearSelection();
    } else {
      console.log('ℹ️ 清除選擇功能需要增強版系統');
    }
  };

  window.endTurn = function() {
    if (enhancedTileUI) {
      enhancedTileUI.endTurn();
    } else {
      console.log('ℹ️ 結束回合功能開發中');
    }
  };

  console.log('✅ 系統整合完成');
}

// 兼容性檢查
function checkCompatibility() {
  const checks = [
    { name: 'HTML5 拖拽 API', test: () => 'draggable' in document.createElement('div') },
    { name: '觸控事件', test: () => 'ontouchstart' in window },
    { name: 'CSS Grid', test: () => CSS.supports('display', 'grid') },
    { name: 'CSS Backdrop Filter', test: () => CSS.supports('backdrop-filter', 'blur(10px)') }
  ];

  console.log('🔍 執行兼容性檢查...');
  
  checks.forEach(check => {
    const supported = check.test();
    console.log(`${supported ? '✅' : '⚠️'} ${check.name}: ${supported ? '支援' : '不支援'}`);
  });

  // 檢查是否為手機設備
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log(`📱 設備類型: ${isMobile ? '移動設備' : '桌面設備'}`);

  return checks.every(check => check.test());
}

// 提供調試工具
function createDebugTools() {
  // 添加調試面板
  const debugPanel = document.createElement('div');
  debugPanel.id = 'drag-debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-size: 12px;
    max-width: 200px;
    z-index: 10000;
    font-family: monospace;
    display: none;
  `;

  debugPanel.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px;">🛠️ 拖拽調試</div>
    <div id="debug-info">
      <div>狀態: <span id="drag-status">待機</span></div>
      <div>磚塊: <span id="drag-tiles">0</span></div>
      <div>棋盤: <span id="board-tiles">0</span></div>
      <div>選擇: <span id="selected-tiles">0</span></div>
    </div>
    <div style="margin-top: 10px;">
      <button onclick="toggleDragSystem()" style="font-size: 10px;">切換拖拽</button>
      <button onclick="clearDebugLog()" style="font-size: 10px;">清除日誌</button>
    </div>
  `;

  document.body.appendChild(debugPanel);

  // 切換調試面板的函數
  window.toggleDebugPanel = function() {
    const panel = document.getElementById('drag-debug-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  };

  // 更新調試信息
  window.updateDebugInfo = function() {
    if (enhancedTileUI) {
      const state = enhancedTileUI.getGameState();
      
      document.getElementById('drag-tiles').textContent = state.hand?.tiles?.length || 0;
      document.getElementById('board-tiles').textContent = state.board?.tiles?.length || 0;
      document.getElementById('selected-tiles').textContent = state.selected?.length || 0;
    }
  };

  // 切換拖拽系統
  window.toggleDragSystem = function() {
    if (enhancedTileUI && enhancedTileUI.dragDropManager) {
      const isEnabled = !enhancedTileUI.dragDropManager.isEnabled;
      enhancedTileUI.dragDropManager.setEnabled(isEnabled);
      document.getElementById('drag-status').textContent = isEnabled ? '啟用' : '禁用';
      console.log(`🎯 拖拽系統 ${isEnabled ? '啟用' : '禁用'}`);
    }
  };

  // 清除調試日誌
  window.clearDebugLog = function() {
    console.clear();
    console.log('🛠️ 調試日誌已清除');
  };

  // 定期更新調試信息
  setInterval(() => {
    if (document.getElementById('drag-debug-panel').style.display !== 'none') {
      window.updateDebugInfo();
    }
  }, 1000);

  console.log('🛠️ 調試工具已創建，按 Ctrl+Shift+D 切換調試面板');
}

// 鍵盤快捷鍵
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D: 切換調試面板
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      window.toggleDebugPanel();
    }
    
    // Esc: 清除選擇
    if (e.key === 'Escape' && enhancedTileUI) {
      enhancedTileUI.clearSelection();
    }
    
    // Delete: 召回選中的磚塊
    if (e.key === 'Delete' && enhancedTileUI) {
      enhancedTileUI.recallTiles();
    }
  });
  
  console.log('⌨️ 鍵盤快捷鍵已設置');
}

// 性能監控
function setupPerformanceMonitoring() {
  let dragStartTime = 0;
  
  document.addEventListener('drag-start', () => {
    dragStartTime = performance.now();
  });
  
  document.addEventListener('tile-dropped', () => {
    if (dragStartTime) {
      const duration = performance.now() - dragStartTime;
      console.log(`⏱️ 拖拽操作耗時: ${duration.toFixed(2)}ms`);
    }
  });
}

// 自動保存功能
function setupAutoSave() {
  let saveTimer = null;
  
  // 監聽遊戲狀態變化
  document.addEventListener('board-updated', () => {
    // 清除之前的定時器
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // 延遲保存（避免頻繁保存）
    saveTimer = setTimeout(() => {
      if (enhancedTileUI) {
        const gameState = enhancedTileUI.getGameState();
        localStorage.setItem('rummiword-game-state', JSON.stringify({
          timestamp: Date.now(),
          state: gameState
        }));
        console.log('💾 遊戲狀態已自動保存');
      }
    }, 2000);
  });
}

// 載入保存的遊戲狀態
function loadSavedGameState() {
  try {
    const savedData = localStorage.getItem('rummiword-game-state');
    if (savedData) {
      const { timestamp, state } = JSON.parse(savedData);
      const age = Date.now() - timestamp;
      
      // 只載入24小時內的保存
      if (age < 24 * 60 * 60 * 1000) {
        console.log('📂 發現保存的遊戲狀態，年齡:', Math.round(age / 1000 / 60), '分鐘');
        return state;
      } else {
        console.log('🗑️ 清除過期的保存狀態');
        localStorage.removeItem('rummiword-game-state');
      }
    }
  } catch (error) {
    console.error('❌ 載入保存狀態失敗:', error);
  }
  return null;
}

// 錯誤處理
function setupErrorHandling() {
  window.addEventListener('error', (e) => {
    if (e.filename && e.filename.includes('drag-drop')) {
      console.error('🚨 拖拽系統錯誤:', e.error);
      
      // 嘗試重新初始化
      setTimeout(() => {
        console.log('🔄 嘗試重新初始化拖拽系統...');
        initializeEnhancedTileSystem();
      }, 1000);
    }
  });
  
  // 未捕獲的 Promise 拒絕
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 未處理的 Promise 拒絕:', e.reason);
  });
}

// 主初始化函數
function initializeDragDropSystem() {
  console.log('🚀 開始初始化拖拽系統...');
  
  // 檢查兼容性
  if (!checkCompatibility()) {
    console.warn('⚠️ 某些功能可能不被支援，但系統將繼續運行');
  }
  
  // 設置錯誤處理
  setupErrorHandling();
  
  // 初始化增強版系統
  if (!initializeEnhancedTileSystem()) {
    console.error('❌ 拖拽系統初始化失敗');
    return false;
  }
  
  // 整合現有系統
  integrateWithExistingSystem();
  
  // 設置調試工具
  createDebugTools();
  
  // 設置鍵盤快捷鍵
  setupKeyboardShortcuts();
  
  // 設置性能監控
  setupPerformanceMonitoring();
  
  // 設置自動保存
  setupAutoSave();
  
  console.log('✅ 拖拽系統初始化完成！');
  console.log('💡 提示：');
  console.log('   - 按 Ctrl+Shift+D 開啟調試面板');
  console.log('   - 按 Esc 清除選擇');
  console.log('   - 按 Delete 召回選中磚塊');
  console.log('   - 拖拽磚塊到棋盤組成單詞');
  console.log('   - 雙擊萬用字母磚設置字母');
  
  return true;
}

// 等待 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDragDropSystem);
} else {
  // DOM 已經載入完成
  setTimeout(initializeDragDropSystem, 100);
}

// 導出主要函數供外部調用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDragDropSystem,
    initializeEnhancedTileSystem,
    integrateWithExistingSystem
  };
} else {
  // 瀏覽器環境
  window.DragDropIntegration = {
    initialize: initializeDragDropSystem,
    initializeEnhanced: initializeEnhancedTileSystem,
    integrate: integrateWithExistingSystem,
    loadSaved: loadSavedGameState
  };
}

console.log('🔗 拖拽系統整合腳本已載入');