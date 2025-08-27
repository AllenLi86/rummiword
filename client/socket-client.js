// ========== socket-client.js ==========
// 前端 WebSocket 客戶端管理

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentPlayer = null;
    this.currentRoom = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.eventHandlers = new Map();
    this.init();
  }

  init() {
    // 連接到後端服務器
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'  // 開發環境
      : window.location.origin;  // 生產環境
    
    console.log('🔗 嘗試連接到:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 5000,
      forceNew: true
    });

    this.setupConnectionHandlers();
    this.setupGameHandlers();
  }

  // 連接相關事件
  setupConnectionHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket 連接成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // 觸發連接成功事件
      this.emit('connected');
      
      // 如果之前有設置名稱，重新設置
      const savedName = localStorage.getItem('playerName');
      if (savedName) {
        setTimeout(() => {
          this.setPlayerName(savedName);
        }, 100);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('❌ WebSocket 斷線:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // 嘗試重連
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ 連接錯誤:', error);
      this.emit('connectionError', error);
      this.attemptReconnect();
    });
  }

  // 遊戲相關事件
  setupGameHandlers() {
    // 玩家相關
    this.socket.on('player:nameSet', (data) => {
      this.currentPlayer = data;
      localStorage.setItem('playerName', data.name);
      this.emit('playerNameSet', data);
    });

    // 房間相關
    this.socket.on('rooms:list', (rooms) => {
      this.emit('roomsList', rooms);
    });

    this.socket.on('rooms:updated', (rooms) => {
      this.emit('roomsUpdated', rooms);
    });

    this.socket.on('room:created', (room) => {
      this.currentRoom = room;
      this.emit('roomCreated', room);
    });

    this.socket.on('room:joined', (room) => {
      this.currentRoom = room;
      this.emit('roomJoined', room);
    });

    this.socket.on('room:left', (data) => {
      this.currentRoom = null;
      this.emit('roomLeft', data);
    });

    this.socket.on('room:playerJoined', (data) => {
      if (this.currentRoom) {
        this.currentRoom = data.room;
      }
      this.emit('roomPlayerJoined', data);
    });

    this.socket.on('room:playerLeft', (data) => {
      if (this.currentRoom) {
        this.currentRoom = data.room;
      }
      this.emit('roomPlayerLeft', data);
    });

    this.socket.on('room:playerReady', (data) => {
      if (this.currentRoom) {
        this.currentRoom = data.room;
      }
      this.emit('roomPlayerReady', data);
    });

    this.socket.on('room:canStart', (data) => {
      this.emit('roomCanStart', data);
    });

    // 遊戲相關
    this.socket.on('game:started', (data) => {
      this.emit('gameStarted', data);
    });

    // 錯誤處理
    this.socket.on('error', (error) => {
      console.error('服務器錯誤:', error);
      this.emit('serverError', error);
    });
  }

  // ========== 公開方法 ==========

  // 設置玩家名稱
  setPlayerName(name) {
    if (!this.isConnected) {
      console.warn('WebSocket 未連接');
      return false;
    }
    
    this.socket.emit('player:setName', { name });
    return true;
  }

  // 創建房間
  createRoom(roomName, maxPlayers = 4) {
    if (!this.isConnected || !this.currentPlayer) {
      console.warn('請先設置玩家名稱');
      return false;
    }
    
    this.socket.emit('room:create', { roomName, maxPlayers });
    return true;
  }

  // 加入房間
  joinRoom(roomId) {
    if (!this.isConnected || !this.currentPlayer) {
      console.warn('請先設置玩家名稱');
      return false;
    }
    
    this.socket.emit('room:join', { roomId });
    return true;
  }

  // 離開房間
  leaveRoom() {
    if (!this.isConnected) return false;
    
    this.socket.emit('room:leave');
    return true;
  }

  // 玩家準備
  toggleReady() {
    if (!this.isConnected || !this.currentRoom) {
      console.warn('你不在任何房間中');
      return false;
    }
    
    this.socket.emit('player:ready');
    return true;
  }

  // 開始遊戲
  startGame() {
    if (!this.isConnected || !this.currentRoom) {
      console.warn('你不在任何房間中');
      return false;
    }
    
    this.socket.emit('game:start');
    return true;
  }

  // ========== 事件系統 ==========

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('事件處理器錯誤:', error);
        }
      });
    }
  }

  // 重連邏輯
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('達到最大重連次數，停止重連');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`嘗試重連... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts });
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // 獲取連接狀態
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentPlayer: this.currentPlayer,
      currentRoom: this.currentRoom
    };
  }

  // 清理
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }
}