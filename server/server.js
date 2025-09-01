const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// 設置 CORS
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
  credentials: true
}));

// Socket.IO 設置
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ========== 簡單的記憶體存儲 ==========
const rooms = new Map(); // roomId -> Room 物件
const players = new Map(); // socketId -> Player 物件

// Room 類別
class Room {
  constructor(id, name, maxPlayers = 4) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.gameState = 'waiting'; // waiting, playing, finished
    this.gameData = null;
    this.createdAt = new Date();
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('房間已滿');
    }
    this.players.push(player);
    player.roomId = this.id;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);

    // 如果房間空了，標記為可刪除
    if (this.players.length === 0) {
      this.isEmpty = true;
    }
  }

  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      maxPlayers: this.maxPlayers,
      currentPlayers: this.players.length,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isReady: p.isReady
      })),
      gameState: this.gameState,
      canJoin: this.players.length < this.maxPlayers && this.gameState === 'waiting'
    };
  }
}

// Player 類別
class Player {
  constructor(socketId, name) {
    this.id = uuidv4();
    this.socketId = socketId;
    this.name = name;
    this.roomId = null;
    this.isReady = false;
    this.tiles = [];
    this.score = 0;
  }
}

// ========== Socket.IO 事件處理 ==========
io.on('connection', (socket) => {
  console.log(`🔗 玩家連接: ${socket.id}`);

  // 玩家設置名稱
  socket.on('player:setName', (data) => {
    const { name } = data;
    if (!name || name.trim() === '') {
      socket.emit('error', { message: '請輸入有效的名稱' });
      return;
    }

    const player = new Player(socket.id, name.trim());
    players.set(socket.id, player);

    socket.emit('player:nameSet', {
      playerId: player.id,
      name: player.name
    });

    // 發送現有房間列表
    socket.emit('rooms:list', getRoomsList());

    console.log(`✅ 玩家 ${name} (${socket.id}) 已設置名稱`);
  });

  // 創建房間
  socket.on('room:create', (data) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: '請先設置名稱' });
      return;
    }

    if (player.roomId) {
      socket.emit('error', { message: '你已經在房間中了' });
      return;
    }

    const { roomName, maxPlayers = 4 } = data;
    const roomId = uuidv4();
    const room = new Room(roomId, roomName || `${player.name}的房間`, maxPlayers);

    try {
      room.addPlayer(player);
      rooms.set(roomId, room);

      // 玩家加入 Socket 房間
      socket.join(roomId);

      // 回應創建成功
      socket.emit('room:created', room.getPublicData());

      // 廣播新房間給所有人
      socket.broadcast.emit('rooms:updated', getRoomsList());

      console.log(`🏠 房間 ${roomName} (${roomId}) 已創建`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // 加入房間
  socket.on('room:join', (data) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: '請先設置名稱' });
      return;
    }

    if (player.roomId) {
      socket.emit('error', { message: '你已經在房間中了' });
      return;
    }

    const { roomId } = data;
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: '房間不存在' });
      return;
    }

    try {
      room.addPlayer(player);
      socket.join(roomId);

      // 通知玩家成功加入
      socket.emit('room:joined', room.getPublicData());

      // 通知房間內其他玩家
      socket.to(roomId).emit('room:playerJoined', {
        player: {
          id: player.id,
          name: player.name,
          isReady: player.isReady
        },
        room: room.getPublicData()
      });

      // 更新房間列表
      io.emit('rooms:updated', getRoomsList());

      console.log(`👤 ${player.name} 加入房間 ${room.name}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // 離開房間
  socket.on('room:leave', () => {
    handlePlayerLeaveRoom(socket);
  });

  // 玩家準備
  socket.on('player:ready', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room) return;

    player.isReady = !player.isReady;

    // 通知房間內所有玩家
    io.to(player.roomId).emit('room:playerReady', {
      playerId: player.id,
      isReady: player.isReady,
      room: room.getPublicData()
    });

    // 檢查是否所有玩家都準備好了
    const allReady = room.players.every(p => p.isReady);
    if (allReady && room.players.length >= 2) {
      // 可以開始遊戲了
      io.to(player.roomId).emit('room:canStart', {
        message: '所有玩家都準備好了！'
      });
    }

    console.log(`🎮 ${player.name} ${player.isReady ? '已準備' : '取消準備'}`);
  });

  // 開始遊戲
  socket.on('game:start', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room) return;

    // 檢查是否所有玩家都準備好
    const allReady = room.players.every(p => p.isReady);
    if (!allReady || room.players.length < 2) {
      socket.emit('error', { message: '還有玩家沒有準備好' });
      return;
    }

    // 初始化遊戲狀態
    room.gameState = 'playing';
    room.gameData = initializeGame(room.players);

    // 通知房間內所有玩家遊戲開始
    io.to(player.roomId).emit('game:started', {
      gameData: room.gameData,
      message: '遊戲開始！'
    });

    // 更新房間列表（房間狀態改變）
    io.emit('rooms:updated', getRoomsList());

    console.log(`🚀 房間 ${room.name} 遊戲開始`);
  });

  // ========== 字母磚遊戲事件 ==========
  // 請求玩家手牌
  socket.on('requestMyHand', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', { message: '遊戲尚未開始' });
      return;
    }

    // 模擬手牌數據（之後會整合真實的 TileSystem）
    const mockHandData = {
      tiles: [
        { id: `${player.id}_tile_1`, letter: 'A', points: 1, isBlank: false },
        { id: `${player.id}_tile_2`, letter: 'B', points: 3, isBlank: false },
        { id: `${player.id}_tile_3`, letter: 'C', points: 3, isBlank: false },
        { id: `${player.id}_tile_4`, letter: 'D', points: 2, isBlank: false },
        { id: `${player.id}_tile_5`, letter: 'E', points: 1, isBlank: false },
        { id: `${player.id}_tile_6`, letter: '★', points: 0, isBlank: true },
        { id: `${player.id}_tile_7`, letter: 'F', points: 4, isBlank: false }
      ],
      statistics: {
        totalTiles: 7,
        totalPoints: 14
      }
    };

    socket.emit('myHandUpdate', mockHandData);
    console.log(`🎯 發送手牌給玩家 ${player.name}`);
  });

  // 抽取字母磚
  socket.on('drawTile', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', { message: '遊戲尚未開始' });
      return;
    }

    const count = data.count || 1;

    // 模擬抽磚
    const randomLetters = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const randomPoints = [2, 4, 1, 8, 5, 1, 3, 1, 1, 3];

    const drawnTiles = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * randomLetters.length);
      drawnTiles.push({
        id: `${player.id}_new_${Date.now()}_${i}`,
        letter: randomLetters[randomIndex],
        points: randomPoints[randomIndex],
        isBlank: false
      });
    }

    socket.emit('tileDrawn', { tiles: drawnTiles, count: drawnTiles.length });

    // 延遲發送更新的手牌
    setTimeout(() => {
      socket.emit('requestMyHand');
    }, 100);

    console.log(`🎲 玩家 ${player.name} 抽取了 ${count} 張磚塊`);
  });

  // 設置萬用字母
  socket.on('setBlankTileLetter', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const { tileId, letter } = data;

    if (!tileId || !letter || !/^[A-Z]$/.test(letter)) {
      socket.emit('blankTileSet', { success: false, message: '無效的磚塊ID或字母' });
      return;
    }

    // 模擬設置萬用字母
    socket.emit('blankTileSet', { success: true, tileId, letter });
    console.log(`🌟 玩家 ${player.name} 設置萬用字母 ${tileId} 為 ${letter}`);
  });

  // 檢查單詞
  socket.on('checkWords', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const { tileIds } = data;

    if (!tileIds || tileIds.length === 0) {
      socket.emit('wordsValidation', { valid: false, message: '沒有選擇磚塊' });
      return;
    }

    // 模擬單詞驗證（之後會實現真正的字典檢查）
    const isValid = Math.random() > 0.3; // 70% 機率為有效單詞
    const score = isValid ? tileIds.length * 2 : 0;

    socket.emit('wordsValidation', {
      valid: isValid,
      score: score,
      message: isValid ? '單詞有效！' : '單詞不在字典中'
    });

    console.log(`🔍 玩家 ${player.name} 檢查單詞: ${isValid ? '有效' : '無效'}`);
  });

  // 結束回合
  socket.on('endTurn', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room || room.gameState !== 'playing') {
      socket.emit('error', { message: '遊戲尚未開始' });
      return;
    }

    // 模擬回合結束處理
    socket.emit('turnSubmitted', { success: true, score: 0 });

    // 通知房間內其他玩家回合變更
    const nextPlayerIndex = (room.players.findIndex(p => p.id === player.id) + 1) % room.players.length;
    const nextPlayer = room.players[nextPlayerIndex];

    if (nextPlayer) {
      io.to(player.roomId).emit('turnChanged', {
        currentPlayerId: nextPlayer.id,
        currentPlayerName: nextPlayer.name
      });
    }

    console.log(`⏭️ 玩家 ${player.name} 結束回合`);
  });

  // 請求遊戲狀態
  socket.on('requestGameState', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: '你不在任何房間中' });
      return;
    }

    const room = rooms.get(player.roomId);
    if (!room) return;

    const gameState = {
      poolRemaining: 92, // 模擬剩餘磚塊數
      currentPlayerId: room.players[0]?.id,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        tileCount: 7 // 模擬磚塊數量
      }))
    };

    socket.emit('gameStateUpdate', gameState);
    console.log(`🎮 發送遊戲狀態給玩家 ${player.name}`);
  });

  // 斷線處理
  socket.on('disconnect', (reason) => {
    console.log(`❌ 玩家斷線: ${socket.id}, 原因: ${reason}`);
    handlePlayerDisconnect(socket);
  });
});

// ========== 輔助函數 ==========

// 獲取房間列表
function getRoomsList() {
  return Array.from(rooms.values())
    .filter(room => !room.isEmpty)
    .map(room => room.getPublicData());
}

// 處理玩家離開房間
function handlePlayerLeaveRoom(socket) {
  const player = players.get(socket.id);
  if (!player || !player.roomId) return;

  const room = rooms.get(player.roomId);
  if (!room) return;

  room.removePlayer(socket.id);
  socket.leave(player.roomId);

  // 通知房間內其他玩家
  socket.to(player.roomId).emit('room:playerLeft', {
    playerId: player.id,
    playerName: player.name,
    room: room.getPublicData()
  });

  // 清除玩家的房間資訊
  player.roomId = null;
  player.isReady = false;

  // 如果房間空了，延遲刪除
  if (room.isEmpty) {
    setTimeout(() => {
      if (rooms.has(room.id) && rooms.get(room.id).isEmpty) {
        rooms.delete(room.id);
        console.log(`🗑️ 刪除空房間: ${room.name}`);
      }
    }, 30000); // 30秒後刪除
  }

  // 更新房間列表
  io.emit('rooms:updated', getRoomsList());

  socket.emit('room:left', { message: '已離開房間' });
  console.log(`📤 ${player.name} 離開房間 ${room.name}`);
}

// 處理玩家斷線
function handlePlayerDisconnect(socket) {
  const player = players.get(socket.id);
  if (player) {
    handlePlayerLeaveRoom(socket);
    players.delete(socket.id);
  }
}

// 初始化遊戲（暫時簡單版本）
function initializeGame(players) {
  return {
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      score: 0,
      tiles: [] // 之後會實現字母磚分發
    })),
    currentPlayer: 0,
    board: {},
    round: 1,
    status: 'playing'
  };
}

// 靜態文件服務（可選）
app.use(express.static('public'));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: 'Rummikub Word Server is running!',
    rooms: rooms.size,
    activePlayers: players.size
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 服務器運行在 http://localhost:${PORT}`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，正在關閉服務器...');
  server.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
});