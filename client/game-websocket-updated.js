// ========== game-websocket-updated.js ==========
// 整合字母磚系統的 WebSocket 遊戲邏輯 - 更新版本

// 全局 socket 客戶端實例
let socketClient = null;

// 初始化 WebSocket 連接
function initializeWebSocket() {
  socketClient = new SocketClient();
  
  // 設置事件監聽器
  setupSocketEventHandlers();
  
  return socketClient;
}

function setupSocketEventHandlers() {
  if (!socketClient) return;
  
  // ========== 原有的連接和房間事件 ==========
  
  // 連接狀態
  socketClient.on('connected', () => {
    updateConnectionStatus('已連接到服務器', 'success');
  });

  socketClient.on('disconnected', (reason) => {
    updateConnectionStatus(`連接斷開: ${reason}`, 'error');
  });

  socketClient.on('reconnecting', (data) => {
    updateConnectionStatus(`重連中... (${data.attempt}/${data.maxAttempts})`, 'warning');
  });

  socketClient.on('connectionError', (error) => {
    updateConnectionStatus(`連接錯誤: ${error.message || error}`, 'error');
  });

  socketClient.on('reconnectFailed', () => {
    updateConnectionStatus('重連失敗，請重新載入頁面', 'error');
  });

  // 玩家設置
  socketClient.on('playerNameSet', (data) => {
    console.log('✅ 玩家名稱已設置:', data.name);
    showPlayerInfo(data);
    showLobby();
  });

  // 房間列表
  socketClient.on('roomsList', (rooms) => {
    console.log('📋 收到房間列表:', rooms);
    updateRoomsList(rooms);
  });

  socketClient.on('roomsUpdated', (rooms) => {
    console.log('🔄 房間列表更新:', rooms);
    updateRoomsList(rooms);
  });

  // 房間事件
  socketClient.on('roomCreated', (room) => {
    console.log('🏠 房間已創建:', room.name);
    showRoomInterface(room);
    showMessage(`成功創建房間 "${room.name}"`);
  });

  socketClient.on('roomJoined', (room) => {
    console.log('🚪 加入房間:', room.name);
    showRoomInterface(room);
    showMessage(`成功加入房間 "${room.name}"`);
  });

  socketClient.on('roomLeft', () => {
    console.log('📤 已離開房間');
    showLobby();
    showMessage('已離開房間');
  });

  socketClient.on('roomPlayerJoined', (data) => {
    console.log('👤 玩家加入:', data.player.name);
    updateRoomInterface(data.room);
    showMessage(`${data.player.name} 加入了房間`, 'info');
  });

  socketClient.on('roomPlayerLeft', (data) => {
    console.log('👋 玩家離開:', data.playerName);
    updateRoomInterface(data.room);
    showMessage(`${data.playerName} 離開了房間`, 'warning');
  });

  socketClient.on('roomPlayerReady', (data) => {
    console.log('🎮 玩家準備狀態變更');
    updateRoomInterface(data.room);
    const player = data.room.players.find(p => p.id === data.playerId);
    if (player) {
      showMessage(`${player.name} ${data.isReady ? '已準備' : '取消準備'}`, 'info');
    }
  });

  socketClient.on('roomCanStart', (data) => {
    console.log('🚀 可以開始遊戲了');
    enableStartButton(true);
    showMessage(data.message, 'success');
  });

  // ========== 遊戲事件 - 整合字母磚系統 ==========
  
  socketClient.on('gameStarted', (data) => {
    console.log('🎮 遊戲開始!', data);
    
    // 使用字母磚遊戲界面（如果可用）
    if (typeof startGameInterface === 'function') {
      startGameInterface(data.gameData);
    } else {
      // 後備方案：使用原始界面
      startBasicGameInterface(data.gameData);
    }
    
    showMessage('遊戲開始！字母磚系統已啟動', 'success');
    
    // 初始化字母磚系統擴展
    if (typeof initializeTileSystemExtension === 'function') {
      setTimeout(initializeTileSystemExtension, 1000);
    }
  });

  // ========== 字母磚系統事件 ==========
  
  // 手牌更新事件
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

  // 字母磚抽取結果
  socketClient.on('tileDrawn', (data) => {
    console.log('🎲 抽磚結果:', data);
    showMessage(`抽到 ${data.tiles ? data.tiles.length : data.count || 1} 張新磚塊`, 'success');
    
    // 自動請求更新手牌
    setTimeout(() => {
      if (socketClient && socketClient.requestMyHand) {
        socketClient.requestMyHand();
      }
    }, 100);
  });

  // 萬用字母設置結果
  socketClient.on('blankTileSet', (data) => {
    console.log('🌟 萬用字母設置結果:', data);
    if (data.success) {
      showMessage(`萬用字母設置為 ${data.letter}`, 'success');
      if (socketClient && socketClient.requestMyHand) {
        socketClient.requestMyHand();
      }
    } else {
      showMessage(`設置萬用字母失敗: ${data.message || '未知錯誤'}`, 'error');
    }
  });

  // 單詞驗證結果
  socketClient.on('wordsValidation', (data) => {
    console.log('📝 單詞驗證結果:', data);
    if (data.valid) {
      showMessage(`單詞有效！得分: ${data.score || 0} 分`, 'success');
    } else {
      showMessage(`無效單詞: ${data.message || '單詞不在字典中'}`, 'error');
    }
  });

  // 回合變更通知
  socketClient.on('turnChanged', (data) => {
    console.log('🔄 回合變更:', data);
    const isMyTurn = data.currentPlayerId === socketClient.currentPlayer?.playerId;
    
    showMessage(`現在是 ${data.currentPlayerName} 的回合`, isMyTurn ? 'success' : 'info');
    
    // 更新 UI 中的當前玩家顯示
    const currentPlayerEl = document.querySelector('.current-player strong');
    if (currentPlayerEl) {
      currentPlayerEl.textContent = data.currentPlayerName;
      currentPlayerEl.parentElement.style.color = isMyTurn ? '#007bff' : '#666';
    }
  });

  // 回合提交結果
  socketClient.on('turnSubmitted', (data) => {
    console.log('📤 回合提交結果:', data);
    if (data.success) {
      showMessage(`回合提交成功！得分: ${data.score || 0} 分`, 'success');
      
      // 更新遊戲狀態
      if (socketClient && socketClient.requestMyHand) {
        socketClient.requestMyHand();
      }
      if (socketClient && socketClient.requestGameState) {
        socketClient.requestGameState();
      }
    } else {
      showMessage(`回合提交失敗: ${data.message || '未知錯誤'}`, 'error');
    }
  });

  // 遊戲結束事件
  socketClient.on('gameEnded', (data) => {
    console.log('🏁 遊戲結束:', data);
    
    let message = `遊戲結束！🏆 獲勝者: ${data.winner || '未知'}`;
    if (data.scores && Array.isArray(data.scores)) {
      message += `\n最終得分: ${data.scores.join(', ')}`;
    }
    
    showMessage(message, 'success');
    
    // 顯示結果並提供返回大廳選項
    setTimeout(() => {
      if (confirm('遊戲已結束！\n\n' + message + '\n\n是否返回大廳？')) {
        showLobby();
      }
    }, 3000);
  });

  // 錯誤處理
  socketClient.on('serverError', (error) => {
    console.error('❌ 服務器錯誤:', error);
    showMessage(error.message || '服務器錯誤', 'error');
  });

  socketClient.on('tileGameError', (data) => {
    console.error('❌ 字母磚遊戲錯誤:', data);
    showMessage(`遊戲錯誤: ${data.message || '未知錯誤'}`, 'error');
  });
}

// ========== UI 集成函數 - 保持原有功能 ==========

// 更新連接狀態
function updateConnectionStatus(message, type = 'info') {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `connection-status ${type}`;
  }
  console.log(`連接狀態: ${message}`);
}

// 顯示玩家資訊
function showPlayerInfo(player) {
  const playerInfoEl = document.getElementById('player-info');
  if (playerInfoEl) {
    playerInfoEl.innerHTML = `
      <div class="player-card">
        <span class="player-name">${player.name}</span>
        <span class="player-id">(${player.playerId.substring(0, 8)}...)</span>
      </div>
    `;
    playerInfoEl.style.display = 'block';
  }
}

// 更新房間列表
function updateRoomsList(rooms) {
  const roomsListEl = document.getElementById('rooms-list');
  if (!roomsListEl) return;
  
  if (rooms.length === 0) {
    roomsListEl.innerHTML = '<div class="no-rooms">沒有可用的房間，創建一個新房間開始遊戲！</div>';
    return;
  }
  
  roomsListEl.innerHTML = rooms.map(room => `
    <div class="room-card ${room.canJoin ? '' : 'disabled'}" ${room.canJoin ? `onclick="joinRoom('${room.id}')"` : ''}>
      <div class="room-name">${room.name}</div>
      <div class="room-info">
        <span class="players-count">${room.currentPlayers}/${room.maxPlayers}</span>
        <span class="room-status ${room.gameState}">${getRoomStatusText(room.gameState)}</span>
      </div>
      <div class="room-actions">
        ${room.canJoin ? 
          '<button class="join-btn" onclick="event.stopPropagation(); joinRoom(\'' + room.id + '\')">加入</button>' : 
          '<button class="join-btn" disabled>無法加入</button>'
        }
      </div>
    </div>
  `).join('');
}

function getRoomStatusText(status) {
  const statusMap = {
    waiting: '等待中',
    playing: '遊戲中',
    finished: '已結束'
  };
  return statusMap[status] || status;
}

// 顯示房間界面
function showRoomInterface(room) {
  showSection('room-section');
  updateRoomInterface(room);
}

// 更新房間界面
function updateRoomInterface(room) {
  const roomInfoEl = document.getElementById('room-info');
  const playersListEl = document.getElementById('room-players-list');
  
  if (roomInfoEl) {
    roomInfoEl.innerHTML = `
      <h2>🏠 ${room.name}</h2>
      <p>玩家: ${room.currentPlayers}/${room.maxPlayers} | 狀態: ${getRoomStatusText(room.gameState)}</p>
    `;
  }
  
  if (playersListEl) {
    playersListEl.innerHTML = room.players.map(player => `
      <div class="player-item ${player.isReady ? 'ready' : ''}">
        <div class="player-name">${player.name}</div>
        <div class="player-status">${player.isReady ? '✅ 已準備' : '⏳ 未準備'}</div>
      </div>
    `).join('');
  }
  
  // 更新準備按鈕狀態
  updateReadyButton(room);
  
  // 檢查是否可以開始遊戲
  const allReady = room.players.every(p => p.isReady);
  enableStartButton(allReady && room.players.length >= 2);
}

// 更新準備按鈕
function updateReadyButton(room) {
  const readyBtn = document.getElementById('ready-btn');
  if (readyBtn && socketClient && socketClient.currentPlayer) {
    const currentPlayer = room.players.find(p => p.id === socketClient.currentPlayer.playerId);
    if (currentPlayer) {
      if (currentPlayer.isReady) {
        readyBtn.textContent = '✅ 取消準備';
        readyBtn.classList.add('ready');
      } else {
        readyBtn.textContent = '⏳ 準備';
        readyBtn.classList.remove('ready');
      }
    }
  }
}

// 顯示大廳
function showLobby() {
  showSection('lobby-section');
  const playerInfoEl = document.getElementById('player-info');
  if (playerInfoEl) {
    playerInfoEl.style.display = 'block';
  }
}

// 啟用/禁用開始遊戲按鈕
function enableStartButton(enabled) {
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.disabled = !enabled;
    if (enabled) {
      startBtn.textContent = '🚀 開始遊戲';
      startBtn.classList.remove('disabled');
    } else {
      startBtn.textContent = '等待玩家準備...';
      startBtn.classList.add('disabled');
    }
  }
}

// 界面切換輔助函數
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

// ========== 遊戲界面函數 ==========

// 開始遊戲界面 - 整合字母磚系統
function startGameInterface(gameData) {
  console.log('🎮 啟動字母磚遊戲界面', gameData);
  
  showSection('game-section');
  
  // 如果有字母磚 UI 管理器，使用它
  if (typeof tileUIManager !== 'undefined' && tileUIManager.createGameInterface) {
    tileUIManager.createGameInterface(gameData);
    
    // 請求我的手牌數據
    setTimeout(() => {
      if (socketClient && socketClient.requestMyHand) {
        socketClient.requestMyHand();
      }
    }, 1000);
    
  } else {
    // 後備方案：基本遊戲界面
    startBasicGameInterface(gameData);
  }
}

// 基本遊戲界面（後備方案）
function startBasicGameInterface(gameData) {
  const gameAreaEl = document.getElementById('game-area');
  if (gameAreaEl) {
    gameAreaEl.innerHTML = `
      <div class="game-placeholder">
        <h2>🎮 遊戲開始了！</h2>
        <div class="game-info">
          <p><strong>參與玩家:</strong> ${gameData.players.map(p => p.name).join(', ')}</p>
          <p><strong>當前回合:</strong> ${gameData.round}</p>
          <p><strong>遊戲狀態:</strong> ${gameData.status}</p>
        </div>
        <div class="game-placeholder-content">
          <p>🔧 字母磚界面載入中...</p>
          <p>📝 請稍候，系統正在初始化字母磚功能</p>
          <button onclick="requestMyHand()" class="control-btn">🎯 請求手牌</button>
          <button onclick="testTileSystem()" class="control-btn">🧪 測試系統</button>
        </div>
        <div class="game-actions">
          <button class="leave-btn" onclick="leaveRoom()">離開遊戲</button>
        </div>
      </div>
    `;
  }
}

// 顯示訊息
function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('game-messages');
  if (messageEl) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    messageEl.appendChild(messageDiv);
    messageEl.scrollTop = messageEl.scrollHeight;
    
    // 限制訊息數量
    while (messageEl.children.length > 50) {
      messageEl.removeChild(messageEl.firstChild);
    }
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ========== 全局函數供 HTML 調用 ==========

// 設置玩家名稱
window.setPlayerName = function(name) {
  if (!name || name.trim() === '') {
    showMessage('請輸入有效的名稱', 'error');
    return;
  }
  
  if (socketClient) {
    const success = socketClient.setPlayerName(name.trim());
    if (success) {
      // 更新會話
      if (typeof sessionManager !== 'undefined') {
        sessionManager.updateSession();
      }
    } else {
      showMessage('設置名稱失敗，請檢查網絡連接', 'error');
    }
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 創建房間
window.createRoom = function(roomName, maxPlayers = 4) {
  if (!roomName || roomName.trim() === '') {
    showMessage('請輸入房間名稱', 'error');
    return;
  }
  
  if (socketClient) {
    const success = socketClient.createRoom(roomName.trim(), parseInt(maxPlayers));
    if (!success) {
      showMessage('創建房間失敗，請檢查是否已設置名稱', 'error');
    }
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 加入房間
window.joinRoom = function(roomId) {
  if (socketClient) {
    const success = socketClient.joinRoom(roomId);
    if (!success) {
      showMessage('加入房間失敗，請檢查是否已設置名稱', 'error');
    }
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 離開房間
window.leaveRoom = function() {
  if (socketClient) {
    socketClient.leaveRoom();
  }
};

// 切換準備狀態
window.toggleReady = function() {
  if (socketClient) {
    const success = socketClient.toggleReady();
    if (!success) {
      showMessage('操作失敗，請確認你在房間中', 'error');
    }
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 開始遊戲
window.startGame = function() {
  if (socketClient) {
    const success = socketClient.startGame();
    if (!success) {
      showMessage('開始遊戲失敗，請確認所有玩家都已準備', 'error');
    }
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// HTML 輔助函數
window.setPlayerNameFromInput = function() {
  const input = document.getElementById('player-name-input');
  const name = input.value.trim();
  if (name) {
    setPlayerName(name);
  }
};

window.createRoomFromInput = function() {
  const nameInput = document.getElementById('room-name-input');
  const maxPlayersSelect = document.getElementById('max-players-select');
  
  const roomName = nameInput.value.trim();
  const maxPlayers = parseInt(maxPlayersSelect.value);
  
  if (roomName) {
    createRoom(roomName, maxPlayers);
    nameInput.value = ''; // 清空輸入框
  } else {
    showMessage('請輸入房間名稱', 'error');
  }
};

// 添加清除保存名稱的功能
window.clearSavedName = function() {
  localStorage.removeItem('playerName');
  localStorage.removeItem('lastSessionTime');
  
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.value = '';
    nameInput.placeholder = '輸入你的名稱';
  }
  
  showMessage('已清除保存的名稱', 'info');
};

// ========== 字母磚遊戲控制函數 ==========

// 請求我的手牌
window.requestMyHand = function() {
  if (socketClient && socketClient.requestMyHand) {
    const success = socketClient.requestMyHand();
    if (success) {
      showMessage('正在載入手牌...', 'info');
    } else {
      showMessage('無法請求手牌，請確認在遊戲中', 'warning');
    }
    return success;
  }
  showMessage('字母磚系統未初始化', 'error');
  return false;
};

// 抽取字母磚
window.drawTile = function() {
  if (socketClient && socketClient.drawTile) {
    socketClient.drawTile();
  } else {
    showMessage('抽磚功能不可用', 'error');
  }
};

// 結束回合
window.endTurn = function() {
  if (socketClient && socketClient.endTurn) {
    const selectedTiles = typeof tileUIManager !== 'undefined' 
      ? tileUIManager.getSelectedTiles() 
      : [];
    
    socketClient.endTurn(selectedTiles);
    
    if (typeof tileUIManager !== 'undefined' && tileUIManager.clearSelection) {
      tileUIManager.clearSelection();
    }
    
    showMessage('回合已結束', 'info');
  } else {
    showMessage('結束回合功能不可用', 'error');
  }
};

// 洗牌手牌
window.shuffleHand = function() {
  if (socketClient && socketClient.shuffleHand) {
    socketClient.shuffleHand();
  } else {
    showMessage('洗牌功能不可用', 'error');
  }
};

// 檢查單詞
window.checkWords = function() {
  if (!socketClient || !socketClient.checkWords) {
    showMessage('檢查單詞功能不可用', 'error');
    return;
  }

  const selectedTiles = typeof tileUIManager !== 'undefined' 
    ? tileUIManager.getSelectedTiles() 
    : [];

  if (selectedTiles.length === 0) {
    showMessage('請先選擇字母磚', 'warning');
    return;
  }
  
  socketClient.checkWords(selectedTiles);
};

// 清除選擇
window.clearSelection = function() {
  if (typeof tileUIManager !== 'undefined' && tileUIManager.clearSelection) {
    tileUIManager.clearSelection();
    showMessage('已清除選擇', 'info');
  } else {
    showMessage('清除選擇功能不可用', 'warning');
  }
};

// 離開遊戲
window.leaveGame = function() {
  if (confirm('確定要離開遊戲嗎？進行中的遊戲將會失去進度。')) {
    leaveRoom();
  }
};

// 關閉萬用字母模態框
window.closeBlankTileModal = function() {
  if (typeof tileUIManager !== 'undefined' && tileUIManager.closeBlankTileModal) {
    tileUIManager.closeBlankTileModal();
  }
};

// 測試字母磚系統
window.testTileSystem = function() {
  if (typeof testTileSystemConnection === 'function') {
    const result = testTileSystemConnection();
    if (result) {
      showMessage('字母磚系統測試通過', 'success');
    } else {
      showMessage('字母磚系統測試失敗', 'error');
    }
    return result;
  }
  showMessage('測試功能不可用', 'warning');
  return false;
};

// ========== 會話管理 ==========

// 會話管理器類
class SessionManager {
  constructor() {
    this.sessionKey = 'lastSessionTime';
    this.playerNameKey = 'playerName';
  }

  // 檢查是否為新會話
  isNewSession() {
    const lastSession = localStorage.getItem(this.sessionKey);
    if (!lastSession) return true;
    
    const timeDiff = Date.now() - parseInt(lastSession);
    return timeDiff > 30 * 60 * 1000; // 30分鐘
  }

  // 更新會話時間
  updateSession() {
    localStorage.setItem(this.sessionKey, Date.now().toString());
  }

  // 清除會話
  clearSession() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.playerNameKey);
  }
}

// 初始化會話管理器
const sessionManager = new SessionManager();

// ========== 初始化邏輯 ==========

// DOM 載入完成後的初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 初始化 WebSocket 連接和字母磚系統...');
  
  setTimeout(() => {
    // 初始化 WebSocket
    initializeWebSocket();
    
    // 初始化字母磚系統擴展（如果可用）
    if (typeof initializeTileSystemExtension === 'function') {
      setTimeout(initializeTileSystemExtension, 1000);
    }
    
    // 處理保存的玩家名稱
    const savedName = localStorage.getItem('playerName');
    const isNewSession = sessionManager.isNewSession();
    
    if (savedName && !isNewSession) {
      // 舊會話，自動填入名稱但不自動設置
      const nameInput = document.getElementById('player-name-input');
      if (nameInput) {
        nameInput.value = savedName;
        nameInput.placeholder = `上次使用: ${savedName}`;
      }
      updateConnectionStatus(`歡迎回來，${savedName}！點擊確認繼續`, 'info');
      
    } else if (savedName && isNewSession) {
      // 新會話，提供選擇
      const nameInput = document.getElementById('player-name-input');
      if (nameInput) {
        nameInput.value = savedName;
        nameInput.placeholder = `之前使用過: ${savedName}`;
      }
      updateConnectionStatus('可以使用之前的名稱，或輸入新名稱', 'info');
      
    } else {
      // 全新用戶
      updateConnectionStatus('歡迎！請設置你的名稱', 'info');
    }
  }, 100);
});

// ========== 調試和開發工具 ==========

// 開發模式標記
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isDevelopment) {
  console.log('🔧 開發模式已啟用');
  
  // 添加調試函數到全局作用域
  window.debugTileSystem = function() {
    console.log('=== 字母磚系統調試資訊 ===');
    console.log('SocketClient:', typeof socketClient !== 'undefined' ? socketClient : '未初始化');
    console.log('TileUIManager:', typeof tileUIManager !== 'undefined' ? tileUIManager : '未初始化');
    console.log('當前遊戲狀態:', typeof gameState !== 'undefined' ? gameState : '未定義');
    
    if (typeof socketClient !== 'undefined' && socketClient) {
      console.log('連接狀態:', socketClient.isConnected ? socketClient.isConnected() : '未知');
      console.log('當前房間:', socketClient.currentRoom || '無');
      console.log('當前玩家:', socketClient.currentPlayer || '無');
    }
  };

  // 添加快速測試函數
  window.quickTest = function() {
    console.log('🧪 執行快速測試...');
    
    // 測試 WebSocket 連接
    if (typeof socketClient !== 'undefined' && socketClient) {
      console.log('✅ SocketClient 已初始化');
      
      // 測試字母磚方法
      if (socketClient.requestMyHand) {
        console.log('✅ 字母磚方法可用');
      } else {
        console.log('❌ 字母磚方法不可用');
      }
    } else {
      console.log('❌ SocketClient 未初始化');
    }
    
    // 測試 UI 管理器
    if (typeof tileUIManager !== 'undefined') {
      console.log('✅ TileUIManager 已初始化');
    } else {
      console.log('❌ TileUIManager 未初始化');
    }
    
    showMessage('快速測試完成，請檢查控制台', 'info');
  };
}

console.log('✅ 字母磚整合的 WebSocket 系統載入完成');