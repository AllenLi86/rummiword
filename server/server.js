const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// 設置 CORS
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Vite 開發服務器
  credentials: true
}));

// Socket.IO 設置
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
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