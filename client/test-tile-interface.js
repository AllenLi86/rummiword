// ========== test-tile-interface.js ==========
// 測試用的字母磚界面 - 包含模擬數據

// 生成模擬字母磚數據
function generateMockHandData() {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const points = [1, 3, 3, 2, 1, 4, 2];
  
  const tiles = letters.map((letter, index) => ({
    id: `mock_tile_${index + 1}`,
    letter: letter,
    points: points[index],
    isBlank: false,
    selectedLetter: null
  }));

  // 添加一個萬用字母磚
  tiles.push({
    id: 'mock_tile_blank',
    letter: '★',
    points: 0,
    isBlank: true,
    selectedLetter: null
  });

  return {
    tiles: tiles,
    statistics: {
      totalTiles: tiles.length,
      totalPoints: tiles.reduce((sum, tile) => sum + tile.points, 0),
      letters: {}
    }
  };
}

// 測試用的遊戲狀態數據
function generateMockGameState() {
  return {
    poolRemaining: 92,
    players: [
      { id: 'player1', name: '測試玩家1', tileCount: 7 },
      { id: 'player2', name: '測試玩家2', tileCount: 7 },
      { id: 'player3', name: '測試玩家3', tileCount: 7 }
    ],
    currentPlayerId: 'player1'
  };
}

// 增強版的 startGameInterface 函數
function enhancedStartGameInterface(gameData) {
  console.log('🎮 啟動增強版字母磚遊戲界面', gameData);
  
  // 切換到遊戲區段
  showSection('game-section');
  
  // 創建遊戲界面
  if (typeof tileUIManager !== 'undefined' && tileUIManager.createGameInterface) {
    tileUIManager.createGameInterface(gameData);
    
    // 添加測試按鈕到遊戲界面
    setTimeout(() => {
      addTestButtons();
    }, 500);
    
    // 延遲載入模擬數據
    setTimeout(() => {
      loadMockData();
    }, 1000);
    
  } else {
    createFallbackInterface(gameData);
  }
}

// 添加測試按鈕
function addTestButtons() {
  const gameHeader = document.querySelector('.game-actions');
  if (gameHeader) {
    const testButtonsHtml = `
      <button class="control-btn test-btn" onclick="loadMockData()">
        🎲 載入測試手牌
      </button>
      <button class="control-btn test-btn" onclick="simulateDrawTile()">
        ➕ 模擬抽磚
      </button>
      <button class="control-btn test-btn" onclick="clearTestData()">
        🗑️ 清除測試數據
      </button>
    `;
    gameHeader.insertAdjacentHTML('afterbegin', testButtonsHtml);
  }
}

// 載入模擬數據
function loadMockData() {
  console.log('📦 載入模擬字母磚數據');
  
  // 更新手牌
  const mockHandData = generateMockHandData();
  if (typeof tileUIManager !== 'undefined' && tileUIManager.updateMyHand) {
    tileUIManager.updateMyHand(mockHandData);
    showMessage('已載入測試手牌數據', 'success');
  }
  
  // 更新遊戲狀態
  const mockGameState = generateMockGameState();
  if (typeof tileUIManager !== 'undefined' && tileUIManager.updateGameState) {
    tileUIManager.updateGameState(mockGameState);
  }
}

// 模擬抽磚功能
function simulateDrawTile() {
  console.log('🎲 模擬抽取新字母磚');
  
  // 生成隨機字母磚
  const randomLetters = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const randomPoints = [4, 1, 8, 5, 1, 3, 1, 1, 3];
  const randomIndex = Math.floor(Math.random() * randomLetters.length);
  
  const newTile = {
    id: `new_tile_${Date.now()}`,
    letter: randomLetters[randomIndex],
    points: randomPoints[randomIndex],
    isBlank: false,
    selectedLetter: null
  };
  
  // 將新磚塊添加到現有手牌
  if (typeof tileUIManager !== 'undefined' && tileUIManager.updateMyHand) {
    // 獲取當前手牌並添加新磚塊
    const currentHandEl = document.getElementById('my-hand');
    if (currentHandEl && typeof tileUIManager.createTileElement === 'function') {
      const newTileEl = tileUIManager.createTileElement(newTile);
      currentHandEl.appendChild(newTileEl);
      
      // 更新統計
      const handCountEl = document.getElementById('hand-count');
      const handScoreEl = document.getElementById('hand-score');
      if (handCountEl) {
        const currentCount = parseInt(handCountEl.textContent) || 0;
        handCountEl.textContent = `${currentCount + 1} 張`;
      }
      if (handScoreEl) {
        const currentScore = parseInt(handScoreEl.textContent) || 0;
        handScoreEl.textContent = `${currentScore + newTile.points} 分`;
      }
      
      // 更新剩餘磚塊數
      const poolCountEl = document.getElementById('pool-count');
      if (poolCountEl) {
        const currentPool = parseInt(poolCountEl.textContent) || 0;
        poolCountEl.textContent = Math.max(0, currentPool - 1);
      }
      
      showMessage(`抽到新磚塊: ${newTile.letter}(${newTile.points}分)`, 'success');
    }
  }
}

// 清除測試數據
function clearTestData() {
  console.log('🗑️ 清除測試數據');
  
  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '<div class="loading-hand">手牌已清空</div>';
  }
  
  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  if (handCountEl) handCountEl.textContent = '0 張';
  if (handScoreEl) handScoreEl.textContent = '0 分';
  
  showMessage('測試數據已清除', 'info');
}

// 創建後備界面
function createFallbackInterface(gameData) {
  const gameAreaEl = document.getElementById('game-area');
  if (gameAreaEl) {
    gameAreaEl.innerHTML = `
      <div class="game-placeholder">
        <h2>🎮 Rummiword 測試模式</h2>
        <div class="game-info">
          <p><strong>參與玩家:</strong> ${gameData.players.map(p => p.name).join(', ')}</p>
          <p><strong>狀態:</strong> 客戶端測試模式 (服務器功能尚未實現)</p>
        </div>
        
        <div class="test-controls" style="margin: 20px 0; text-align: center;">
          <h3>🧪 測試功能</h3>
          <div style="margin: 15px 0;">
            <button class="control-btn" onclick="loadMockData()">🎲 載入測試手牌</button>
            <button class="control-btn" onclick="simulateDrawTile()">➕ 模擬抽磚</button>
            <button class="control-btn" onclick="clearTestData()">🗑️ 清除測試數據</button>
          </div>
        </div>

        <div class="hand-container" style="margin: 20px 0;">
          <h3>🎯 我的手牌</h3>
          <div id="my-hand" class="hand-tiles" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; min-height: 80px; background: white; padding: 15px; border-radius: 8px; border: 2px solid #dee2e6;">
            <div class="loading-hand" style="display: flex; align-items: center; justify-content: center; width: 100%; color: #666; font-style: italic;">
              點擊上方按鈕載入測試手牌
            </div>
          </div>
          <div style="margin-top: 10px;">
            <span id="hand-count">0 張</span> | <span id="hand-score">0 分</span> | 剩餘磚塊: <span id="pool-count">98</span>
          </div>
        </div>
        
        <div class="game-actions" style="text-align: center;">
          <button class="leave-btn" onclick="leaveRoom()">離開遊戲</button>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666;">
          <h4>📝 說明</h4>
          <p>• 目前只有客戶端界面，服務器端字母磚功能尚未實現</p>
          <p>• 可以使用上方測試按鈕體驗字母磚界面</p>
          <p>• 字母磚可以點擊選擇，萬用字母磚(★)可以雙擊設置字母</p>
        </div>
      </div>
    `;
  }
}

// 測試字母磚互動功能
function testTileInteractions() {
  console.log('🧪 測試字母磚互動功能');
  
  // 模擬點擊事件
  setTimeout(() => {
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length > 0) {
      console.log(`發現 ${tiles.length} 個字母磚，測試點擊功能`);
      
      // 點擊第一個磚塊
      tiles[0].click();
      showMessage('測試點擊第一個字母磚', 'info');
      
      // 如果有萬用字母磚，測試雙擊
      const blankTile = document.querySelector('.tile.blank');
      if (blankTile) {
        setTimeout(() => {
          blankTile.dispatchEvent(new Event('dblclick'));
          showMessage('測試雙擊萬用字母磚', 'info');
        }, 1000);
      }
    }
  }, 500);
}

// 導出函數
if (typeof window !== 'undefined') {
  window.TestTileInterface = {
    enhancedStartGameInterface,
    loadMockData,
    simulateDrawTile,
    clearTestData,
    generateMockHandData,
    generateMockGameState,
    testTileInteractions
  };
  
  // 覆蓋現有的 startGameInterface 函數
  const originalStartGameInterface = window.startGameInterface;
  window.startGameInterface = enhancedStartGameInterface;
  
  // 添加全域測試函數
  window.loadMockData = loadMockData;
  window.simulateDrawTile = simulateDrawTile;
  window.clearTestData = clearTestData;
  window.testTileInteractions = testTileInteractions;
}

console.log('✅ 測試用字母磚界面載入完成');