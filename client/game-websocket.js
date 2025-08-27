// ========== game-websocket.js ==========
// 集成到遊戲系統的 WebSocket 邏輯

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

  // 遊戲事件
  socketClient.on('gameStarted', (data) => {
    console.log('🎮 遊戲開始!', data);
    startGameInterface(data.gameData);
    showMessage('遊戲開始！', 'success');
  });

  // 錯誤處理
  socketClient.on('serverError', (error) => {
    console.error('❌ 服務器錯誤:', error);
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
  // 切換到房間區段
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

// 界面切換輔助函數
function showSection(sectionId) {
  // 隱藏所有區段
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // 顯示指定區段
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

// 開始遊戲界面
function startGameInterface(gameData) {
  showSection('game-section');
  
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
          <p>🔧 這裡之後會是 Rummikub Word 遊戲界面</p>
          <p>📝 包含字母磚、遊戲版面、拖拽功能等...</p>
        </div>
        <div class="game-actions">
          <button class="leave-btn" onclick="leaveRoom()">離開遊戲</button>
        </div>
      </div>
    `;
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
    const success = socketClient.setPlayerName(name.trim());
    if (!success) {
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

// ========== 頁面載入時初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 初始化 WebSocket 連接...');
  
  // 延遲初始化，確保 SocketClient 類別已載入
  setTimeout(() => {
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
      }, 1500);
    }
  }, 100);
});

// 頁面卸載時清理連接
window.addEventListener('beforeunload', () => {
  if (socketClient) {
    socketClient.destroy();
  }
});