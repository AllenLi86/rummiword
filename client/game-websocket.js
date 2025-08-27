// 集成到現有遊戲系統

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
  
  // 連接狀態
  socketClient.on('connected', () => {
    updateConnectionStatus('已連接', 'success');
  });

  socketClient.on('disconnected', (reason) => {
    updateConnectionStatus(`連接斷開: ${reason}`, 'error');
  });

  socketClient.on('reconnecting', (data) => {
    updateConnectionStatus(`重連中... (${data.attempt}/${data.maxAttempts})`, 'warning');
  });

  // 玩家設置
  socketClient.on('playerNameSet', (data) => {
    console.log('玩家名稱已設置:', data.name);
    showPlayerInfo(data);
    requestRoomsList();
  });

  // 房間列表
  socketClient.on('roomsList', (rooms) => {
    updateRoomsList(rooms);
  });

  socketClient.on('roomsUpdated', (rooms) => {
    updateRoomsList(rooms);
  });

  // 房間事件
  socketClient.on('roomCreated', (room) => {
    console.log('房間已創建:', room.name);
    showRoomInterface(room);
  });

  socketClient.on('roomJoined', (room) => {
    console.log('加入房間:', room.name);
    showRoomInterface(room);
  });

  socketClient.on('roomLeft', () => {
    console.log('已離開房間');
    showLobby();
  });

  socketClient.on('roomPlayerJoined', (data) => {
    console.log('玩家加入:', data.player.name);
    updateRoomInterface(data.room);
    showMessage(`${data.player.name} 加入了房間`);
  });

  socketClient.on('roomPlayerLeft', (data) => {
    console.log('玩家離開:', data.playerName);
    updateRoomInterface(data.room);
    showMessage(`${data.playerName} 離開了房間`);
  });

  socketClient.on('roomPlayerReady', (data) => {
    updateRoomInterface(data.room);
    const player = data.room.players.find(p => p.id === data.playerId);
    if (player) {
      showMessage(`${player.name} ${data.isReady ? '已準備' : '取消準備'}`);
    }
  });

  socketClient.on('roomCanStart', (data) => {
    enableStartButton(true);
    showMessage(data.message, 'success');
  });

  // 遊戲事件
  socketClient.on('gameStarted', (data) => {
    console.log('遊戲開始!', data);
    startGameInterface(data.gameData);
  });

  // 錯誤處理
  socketClient.on('serverError', (error) => {
    showMessage(error.message, 'error');
  });
}

// ========== UI 集成函數 ==========

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
        <span class="player-id">(ID: ${player.playerId})</span>
      </div>
    `;
  }
}

// 更新房間列表
function updateRoomsList(rooms) {
  const roomsListEl = document.getElementById('rooms-list');
  if (!roomsListEl) return;
  
  if (rooms.length === 0) {
    roomsListEl.innerHTML = '<div class="no-rooms">沒有可用的房間</div>';
    return;
  }
  
  roomsListEl.innerHTML = rooms.map(room => `
    <div class="room-card" onclick="joinRoom('${room.id}')">
      <div class="room-name">${room.name}</div>
      <div class="room-info">
        <span class="players-count">${room.currentPlayers}/${room.maxPlayers}</span>
        <span class="room-status ${room.gameState}">${getRoomStatusText(room.gameState)}</span>
      </div>
      <div class="room-actions">
        ${room.canJoin ? '<button class="join-btn">加入</button>' : '<button class="join-btn" disabled>無法加入</button>'}
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
  // 隱藏大廳，顯示房間界面
  hideElement('lobby-section');
  showElement('room-section');
  
  updateRoomInterface(room);
}

// 更新房間界面
function updateRoomInterface(room) {
  const roomInfoEl = document.getElementById('room-info');
  const playersListEl = document.getElementById('room-players-list');
  
  if (roomInfoEl) {
    roomInfoEl.innerHTML = `
      <h3>${room.name}</h3>
      <p>玩家: ${room.currentPlayers}/${room.maxPlayers}</p>
    `;
  }
  
  if (playersListEl) {
    playersListEl.innerHTML = room.players.map(player => `
      <div class="player-item ${player.isReady ? 'ready' : ''}">
        <span class="player-name">${player.name}</span>
        <span class="player-status">${player.isReady ? '✅ 已準備' : '⏳ 未準備'}</span>
      </div>
    `).join('');
  }
  
  // 檢查是否可以開始遊戲
  const allReady = room.players.every(p => p.isReady);
  enableStartButton(allReady && room.players.length >= 2);
}

// 顯示大廳
function showLobby() {
  hideElement('room-section');
  hideElement('game-section');
  showElement('lobby-section');
  requestRoomsList();
}

// 啟用/禁用開始遊戲按鈕
function enableStartButton(enabled) {
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.disabled = !enabled;
    startBtn.textContent = enabled ? '🚀 開始遊戲' : '等待玩家準備...';
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
    while (messageEl.children.length > 10) {
      messageEl.removeChild(messageEl.firstChild);
    }
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// 工具函數
function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// 請求房間列表
function requestRoomsList() {
  // WebSocket 會在玩家設置名稱後自動發送房間列表
  if (socketClient && socketClient.currentPlayer) {
    console.log('房間列表會自動更新');
  }
}

// ========== 全局函數供 HTML 調用 ==========

// 設置玩家名稱
window.setPlayerName = function(name) {
  if (!name || name.trim() === '') {
    showMessage('請輸入有效的名稱', 'error');
    return;
  }
  
  if (socketClient) {
    socketClient.setPlayerName(name.trim());
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
    socketClient.createRoom(roomName.trim(), parseInt(maxPlayers));
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 加入房間
window.joinRoom = function(roomId) {
  if (socketClient) {
    socketClient.joinRoom(roomId);
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
    socketClient.toggleReady();
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 開始遊戲
window.startGame = function() {
  if (socketClient) {
    socketClient.startGame();
  } else {
    showMessage('WebSocket 未初始化', 'error');
  }
};

// 開始遊戲界面（之後會擴展）
function startGameInterface(gameData) {
  hideElement('room-section');
  showElement('game-section');
  
  showMessage('遊戲開始！', 'success');
  
  // 這裡之後會實現實際的遊戲界面
  const gameAreaEl = document.getElementById('game-area');
  if (gameAreaEl) {
    gameAreaEl.innerHTML = `
      <div class="game-placeholder">
        <h2>🎮 遊戲開始了！</h2>
        <p>玩家: ${gameData.players.map(p => p.name).join(', ')}</p>
        <p>這裡之後會是 Rummikub Word 遊戲界面</p>
        <button onclick="leaveRoom()">離開房間</button>
      </div>
    `;
  }
}

// ========== 頁面載入時初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 初始化 WebSocket 連接...');
  initializeWebSocket();
  
  // 檢查是否有保存的玩家名稱
  const savedName = localStorage.getItem('playerName');
  if (savedName) {
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.value = savedName;
    }
    
    // 等待連接後自動設置名稱
    setTimeout(() => {
      if (socketClient && socketClient.isConnected) {
        socketClient.setPlayerName(savedName);
      }
    }, 1000);
  }
});

// 頁面卸載時清理連接
window.addEventListener('beforeunload', () => {
  if (socketClient) {
    socketClient.destroy();
  }
});