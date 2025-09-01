// ========== socket-client-tiles-extension.js ==========

// 為現有的 SocketClient 類添加字母磚相關方法
function extendSocketClientWithTiles() {
  if (typeof SocketClient === 'undefined') {
    console.error('❌ SocketClient 未找到，請先載入 socket-client.js');
    return false;
  }

  console.log('🔧 開始擴展 SocketClient 的字母磚功能');

  // ========== 字母磚遊戲方法 ==========

  // 請求我的手牌數據
  SocketClient.prototype.requestMyHand = function() {
    // 修正：檢查連接狀態的正確方法
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法請求手牌：未連接或不在房間中');
      return false;
    }

    console.log('🎯 請求我的手牌數據');
    this.socket.emit('requestMyHand');
    return true;
  };

  // 抽取字母磚
  SocketClient.prototype.drawTile = function(count = 1) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法抽磚：未連接或不在房間中');
      return false;
    }

    console.log(`🎲 請求抽取 ${count} 張字母磚`);
    this.socket.emit('drawTile', { count });
    return true;
  };

  // 設置萬用字母
  SocketClient.prototype.setBlankTileLetter = function(tileId, letter) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法設置萬用字母：未連接或不在房間中');
      return false;
    }

    if (!tileId || !letter || !/^[A-Z]$/.test(letter)) {
      console.log('❌ 無效的字母磚ID或字母');
      return false;
    }

    console.log(`🌟 設置萬用字母磚 ${tileId} 為字母 ${letter}`);
    this.socket.emit('setBlankTileLetter', { tileId, letter });
    return true;
  };

  // 重置萬用字母
  SocketClient.prototype.resetBlankTile = function(tileId) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法重置萬用字母：未連接或不在房間中');
      return false;
    }

    console.log(`🔄 重置萬用字母磚 ${tileId}`);
    this.socket.emit('resetBlankTile', { tileId });
    return true;
  };

  // 移動字母磚
  SocketClient.prototype.moveTile = function(tileId, fromPosition, toPosition, boardX = null, boardY = null) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法移動字母磚：未連接或不在房間中');
      return false;
    }

    const moveData = {
      tileId,
      fromPosition,
      toPosition
    };

    if (toPosition === 'board' && boardX !== null && boardY !== null) {
      moveData.boardX = boardX;
      moveData.boardY = boardY;
    }

    console.log(`🔄 移動字母磚 ${tileId} 從 ${fromPosition} 到 ${toPosition}`, moveData);
    this.socket.emit('moveTile', moveData);
    return true;
  };

  // 檢查單詞有效性
  SocketClient.prototype.checkWords = function(tileIds) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法檢查單詞：未連接或不在房間中');
      return false;
    }

    console.log('🔍 檢查單詞有效性:', tileIds);
    this.socket.emit('checkWords', { tileIds });
    return true;
  };

  // 提交回合
  SocketClient.prototype.submitTurn = function(playedTiles) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法提交回合：未連接或不在房間中');
      return false;
    }

    console.log('📤 提交回合:', playedTiles);
    this.socket.emit('submitTurn', { playedTiles });
    return true;
  };

  // 結束回合
  SocketClient.prototype.endTurn = function(selectedTiles = []) {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法結束回合：未連接或不在房間中');
      return false;
    }

    console.log('⏭️ 結束回合，選中的磚塊:', selectedTiles);
    this.socket.emit('endTurn', { selectedTiles });
    return true;
  };

  // 洗牌手牌
  SocketClient.prototype.shuffleHand = function() {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法洗牌手牌：未連接或不在房間中');
      return false;
    }

    console.log('🔀 洗牌手牌');
    this.socket.emit('shuffleHand');
    return true;
  };

  // 請求遊戲狀態
  SocketClient.prototype.requestGameState = function() {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      console.log('❌ 無法請求遊戲狀態：未連接或不在房間中');
      return false;
    }

    console.log('🎮 請求遊戲狀態');
    this.socket.emit('requestGameState');
    return true;
  };

  console.log('✅ SocketClient 擴展完成');
  return true;
}

// 設置字母磚相關的 WebSocket 事件監聽器
function setupTileSocketEvents() {
  if (!socketClient) {
    console.error('❌ socketClient 未初始化，無法設置字母磚事件');
    return false;
  }

  console.log('🔧 設置字母磚 WebSocket 事件監聽器');

  // 手牌更新事件 - 使用測試數據作為後備
  socketClient.on('myHandUpdate', (data) => {
    console.log('🎯 收到手牌更新:', data);
    if (typeof tileUIManager !== 'undefined' && tileUIManager.updateMyHand) {
      tileUIManager.updateMyHand(data);
    }
  });

  // 遊戲狀態更新
  socketClient.on('gameStateUpdate', (data) => {
    console.log('🎮 遊戲狀態更新:', data);
    if (typeof tileUIManager !== 'undefined' && tileUIManager.updateGameState) {
      tileUIManager.updateGameState(data);
    }
  });

  // 其他事件處理器...
  socketClient.on('tileDrawn', (data) => {
    console.log('🎲 抽磚結果:', data);
    if (typeof showMessage === 'function') {
      showMessage(`抽到 ${data.tiles ? data.tiles.length : data.count || 1} 張新磚塊`, 'success');
    }
  });

  socketClient.on('blankTileSet', (data) => {
    console.log('🌟 萬用字母設置結果:', data);
    if (data.success && typeof showMessage === 'function') {
      showMessage(`萬用字母設置為 ${data.letter}`, 'success');
    }
  });

  console.log('✅ 字母磚事件監聽器設置完成');
  return true;
}

// 初始化字母磚系統的 WebSocket 擴展
function initializeTileSystemExtension() {
  console.log('🔧 初始化字母磚系統 WebSocket 擴展');
  
  // 先確保 tileUIManager 存在
  if (typeof initializeTileUIManager === 'function') {
    initializeTileUIManager();
  }
  
  // 擴展 SocketClient
  const extensionResult = extendSocketClientWithTiles();
  
  if (!extensionResult) {
    console.error('❌ 擴展 SocketClient 失敗');
    return false;
  }
  
  // 等待 socketClient 初始化完成後設置事件
  const setupEvents = () => {
    if (typeof socketClient !== 'undefined' && socketClient && socketClient.socket) {
      const eventsResult = setupTileSocketEvents();
      if (eventsResult) {
        console.log('✅ 字母磚系統初始化完成');
        return true;
      }
    } else {
      // 如果 socketClient 還未準備好，稍後重試
      console.log('⏳ 等待 socketClient 初始化...');
      setTimeout(setupEvents, 200);
    }
  };
  
  setupEvents();
  return true;
}

// ========== 測試用函數 ==========

// 生成測試手牌數據
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

// 載入模擬數據
function loadMockData() {
  console.log('📦 載入模擬字母磚數據');
  
  // 確保 tileUIManager 存在
  if (typeof tileUIManager === 'undefined' || !tileUIManager) {
    console.log('⚠️ tileUIManager 不存在，嘗試創建...');
    tileUIManager = new TileUIManager();
  }
  
  const mockHandData = generateMockHandData();
  
  if (tileUIManager && tileUIManager.updateMyHand) {
    tileUIManager.updateMyHand(mockHandData);
    if (typeof showMessage === 'function') {
      showMessage('已載入測試手牌數據', 'success');
    }
    console.log('✅ 測試手牌載入成功');
  } else {
    console.error('❌ tileUIManager.updateMyHand 不可用');
    // 手動創建手牌
    forceCreateHandTiles(mockHandData.tiles);
  }
}

// 手動創建手牌磚塊
function forceCreateHandTiles(tiles) {
  console.log('🔧 手動創建手牌磚塊');
  
  const handEl = document.getElementById('my-hand');
  if (!handEl) {
    console.error('❌ 找不到 my-hand 元素');
    return;
  }

  handEl.innerHTML = '';

  tiles.forEach(tile => {
    const tileEl = document.createElement('div');
    tileEl.className = `tile ${tile.isBlank ? 'blank' : ''}`;
    tileEl.dataset.tileId = tile.id;
    tileEl.style.cssText = `
      width: 50px; height: 50px; 
      background: ${tile.isBlank ? 'linear-gradient(145deg, #ddd, #bbb)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)'}; 
      border: 2px solid ${tile.isBlank ? '#999' : '#e17055'}; 
      border-radius: 8px; display: flex; flex-direction: column; 
      align-items: center; justify-content: center; cursor: pointer; 
      user-select: none; transition: all 0.2s; font-weight: bold; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const letterEl = document.createElement('div');
    letterEl.textContent = tile.isBlank ? (tile.selectedLetter || '★') : tile.letter;
    letterEl.style.cssText = 'font-size: 18px; line-height: 1;';

    const pointsEl = document.createElement('div');
    if (!tile.isBlank) {
      pointsEl.textContent = tile.points;
      pointsEl.style.cssText = 'font-size: 10px; margin-top: 2px; opacity: 0.8;';
    }

    tileEl.appendChild(letterEl);
    tileEl.appendChild(pointsEl);

    // 添加點擊事件
    tileEl.addEventListener('click', function() {
      const isSelected = this.classList.contains('selected');
      
      if (isSelected) {
        this.classList.remove('selected');
        this.style.transform = '';
        this.style.borderColor = tile.isBlank ? '#999' : '#e17055';
        this.style.background = tile.isBlank ? 'linear-gradient(145deg, #ddd, #bbb)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)';
        this.style.color = 'black';
      } else {
        this.classList.add('selected');
        this.style.transform = 'translateY(-5px)';
        this.style.borderColor = '#007bff';
        this.style.background = 'linear-gradient(145deg, #74b9ff, #0984e3)';
        this.style.color = 'white';
      }
      
      if (typeof showMessage === 'function') {
        const action = isSelected ? '取消選中' : '選中';
        showMessage(`${action}字母磚: ${tile.letter}`, 'info');
      }
      console.log(`${isSelected ? '取消選中' : '選中'}字母磚: ${tile.letter}`);
    });

    // 萬用字母雙擊事件
    if (tile.isBlank) {
      tileEl.addEventListener('dblclick', function(e) {
        e.preventDefault();
        console.log('🌟 雙擊萬用字母磚');
        
        // 簡單的提示方式選擇字母
        const letter = prompt('選擇這個萬用字母磚要代表的字母 (A-Z):');
        if (letter && /^[A-Za-z]$/.test(letter)) {
          const upperLetter = letter.toUpperCase();
          letterEl.textContent = upperLetter;
          tile.selectedLetter = upperLetter;
          
          if (typeof showMessage === 'function') {
            showMessage(`萬用字母設置為 ${upperLetter}`, 'success');
          }
          console.log(`萬用字母磚設置為: ${upperLetter}`);
        }
      });
    }

    handEl.appendChild(tileEl);
  });

  // 更新統計
  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  
  if (handCountEl) handCountEl.textContent = `${tiles.length} 張`;
  if (handScoreEl) {
    const totalScore = tiles.reduce((sum, tile) => sum + tile.points, 0);
    handScoreEl.textContent = `${totalScore} 分`;
  }

  console.log('✅ 手動手牌創建完成');
}

// 模擬抽磚
function simulateDrawTile() {
  console.log('🎲 模擬抽磚');
  
  const randomLetters = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const randomPoints = [4, 1, 8, 5, 1, 3, 1, 1, 3];
  const randomIndex = Math.floor(Math.random() * randomLetters.length);

  const newTile = {
    id: `new_${Date.now()}`,
    letter: randomLetters[randomIndex],
    points: randomPoints[randomIndex],
    isBlank: false
  };

  const handEl = document.getElementById('my-hand');
  if (!handEl) {
    console.error('❌ 找不到手牌元素');
    return;
  }

  // 如果手牌是空的，先載入基本數據
  if (handEl.querySelector('.loading-hand')) {
    console.log('📦 手牌為空，先載入基本數據');
    loadMockData();
    setTimeout(() => simulateDrawTile(), 500);
    return;
  }

  // 創建新磚塊並添加到手牌
  forceCreateHandTiles([newTile]);
  
  // 將新磚塊添加到現有手牌
  const existingTiles = Array.from(handEl.querySelectorAll('.tile'));
  if (existingTiles.length > 0) {
    // 重新計算統計
    const handCountEl = document.getElementById('hand-count');
    const handScoreEl = document.getElementById('hand-score');
    const poolCountEl = document.getElementById('pool-count');

    if (handCountEl) {
      const currentCount = parseInt(handCountEl.textContent) || 0;
      handCountEl.textContent = `${currentCount + 1} 張`;
    }
    if (handScoreEl) {
      const currentScore = parseInt(handScoreEl.textContent) || 0;
      handScoreEl.textContent = `${currentScore + newTile.points} 分`;
    }
    if (poolCountEl) {
      const currentPool = parseInt(poolCountEl.textContent) || 98;
      poolCountEl.textContent = Math.max(0, currentPool - 1);
    }
  }

  if (typeof showMessage === 'function') {
    showMessage(`抽到新磚塊: ${newTile.letter}(${newTile.points}分)`, 'success');
  }
}

// 清除測試數據
function clearTestData() {
  console.log('🗑️ 清除測試數據');
  
  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '<div class="loading-hand" style="display: flex; align-items: center; justify-content: center; width: 100%; color: #666; font-style: italic;">手牌已清空</div>';
  }
  
  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  const poolCountEl = document.getElementById('pool-count');
  
  if (handCountEl) handCountEl.textContent = '0 張';
  if (handScoreEl) handScoreEl.textContent = '0 分';
  if (poolCountEl) poolCountEl.textContent = '98';
  
  if (typeof showMessage === 'function') {
    showMessage('測試數據已清除', 'info');
  }
}

// ========== 遊戲控制函數 ==========

// 檢查單詞
function checkWords() {
  const selectedTiles = document.querySelectorAll('.tile.selected');
  if (selectedTiles.length === 0) {
    if (typeof showMessage === 'function') {
      showMessage('請先選擇字母磚', 'warning');
    }
    return;
  }
  
  const selectedLetters = Array.from(selectedTiles).map(el => {
    const letter = el.querySelector('.tile-letter').textContent;
    return letter;
  }).join('');
  
  if (typeof showMessage === 'function') {
    showMessage(`檢查單詞: ${selectedLetters} (測試模式)`, 'info');
  }
  console.log('🔍 檢查單詞:', selectedLetters);
}

// 清除選擇
function clearSelection() {
  const selectedTiles = document.querySelectorAll('.tile.selected');
  selectedTiles.forEach(tileEl => {
    tileEl.classList.remove('selected');
    tileEl.style.transform = '';
    
    const isBlank = tileEl.classList.contains('blank');
    tileEl.style.borderColor = isBlank ? '#999' : '#e17055';
    tileEl.style.background = isBlank ? 'linear-gradient(145deg, #ddd, #bbb)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)';
    tileEl.style.color = 'black';
  });
  
  if (typeof showMessage === 'function') {
    showMessage('已清除選擇', 'info');
  }
  console.log('🗑️ 已清除所有選擇');
}

// 結束回合
function endTurn() {
  const selectedTiles = document.querySelectorAll('.tile.selected');
  
  if (typeof showMessage === 'function') {
    showMessage(`結束回合 (選中 ${selectedTiles.length} 張磚塊)`, 'info');
  }
  
  // 清除選擇
  clearSelection();
  console.log('⏭️ 結束回合');
}

// 關閉萬用字母模態框
function closeBlankTileModal() {
  const modal = document.getElementById('blank-tile-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 離開遊戲
function leaveGame() {
  if (confirm('確定要離開遊戲嗎？')) {
    if (typeof leaveRoom === 'function') {
      leaveRoom();
    }
  }
}

// ========== 導出和全局函數 ==========

// 導出到全域
if (typeof window !== 'undefined') {
  // // 確保 tileUIManager 全局可用
  // if (!window.tileUIManager) {
  //   window.tileUIManager = new TileUIManager();
  // }
  
  // window.TileUIManager = TileUIManager;
  window.initializeTileSystemExtension = initializeTileSystemExtension;
  window.loadMockData = loadMockData;
  window.simulateDrawTile = simulateDrawTile;
  window.clearTestData = clearTestData;
  window.checkWords = checkWords;
  window.clearSelection = clearSelection;
  window.endTurn = endTurn;
  window.closeBlankTileModal = closeBlankTileModal;
  window.leaveGame = leaveGame;
  
  console.log('✅ 修正版字母磚界面已載入到全局作用域');
}

console.log('✅ 修正版字母磚界面載入完成');