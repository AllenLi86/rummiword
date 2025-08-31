// ========== tile-system.js ==========
// Rummikub Word 字母磚系統

// 字母磚配置 - 基於標準英文字母頻率和 Rummikub Word 規則
const TILE_CONFIG = {
  // 字母: [數量, 分數]
  'A': [9, 1], 'B': [2, 3], 'C': [2, 3], 'D': [4, 2],
  'E': [12, 1], 'F': [2, 4], 'G': [3, 2], 'H': [2, 4],
  'I': [9, 1], 'J': [1, 8], 'K': [1, 5], 'L': [4, 1],
  'M': [2, 3], 'N': [6, 1], 'O': [8, 1], 'P': [2, 3],
  'Q': [1, 10], 'R': [6, 1], 'S': [4, 1], 'T': [6, 1],
  'U': [4, 1], 'V': [2, 4], 'W': [2, 4], 'X': [1, 8],
  'Y': [2, 4], 'Z': [1, 10],
  '★': [2, 0]  // 萬用字母磚 (blank tiles)
};

// 字母磚類別
class Tile {
  constructor(letter, points, isBlank = false, id = null) {
    this.id = id || this.generateId();
    this.letter = letter;
    this.points = points;
    this.isBlank = isBlank;
    this.position = null; // 'hand', 'board', 'pool'
    this.playerId = null;
    this.boardX = null;
    this.boardY = null;
    this.lockedOnBoard = false; // 是否已在棋盤上鎖定
    this.selectedLetter = null; // 萬用字母選擇的字母
  }

  generateId() {
    return 'tile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 克隆字母磚
  clone() {
    const clone = new Tile(this.letter, this.points, this.isBlank, this.id);
    clone.position = this.position;
    clone.playerId = this.playerId;
    clone.boardX = this.boardX;
    clone.boardY = this.boardY;
    clone.lockedOnBoard = this.lockedOnBoard;
    clone.selectedLetter = this.selectedLetter;
    return clone;
  }

  // 獲取顯示字母
  getDisplayLetter() {
    if (this.isBlank && this.selectedLetter) {
      return this.selectedLetter;
    }
    return this.letter;
  }

  // 獲取有效分數
  getEffectivePoints() {
    return this.isBlank ? 0 : this.points;
  }
}

// 字母磚池管理器
class TilePool {
  constructor() {
    this.tiles = [];
    this.initialize();
  }

  // 初始化字母磚池
  initialize() {
    this.tiles = [];
    
    Object.entries(TILE_CONFIG).forEach(([letter, [count, points]]) => {
      for (let i = 0; i < count; i++) {
        const isBlank = letter === '★';
        const tile = new Tile(letter, points, isBlank);
        tile.position = 'pool';
        this.tiles.push(tile);
      }
    });
    
    this.shuffle();
    console.log(`🎲 初始化字母磚池: ${this.tiles.length} 個磚塊`);
  }

  // 洗牌
  shuffle() {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  // 抽取字母磚
  drawTiles(count) {
    const drawnTiles = [];
    for (let i = 0; i < count && this.tiles.length > 0; i++) {
      const tile = this.tiles.pop();
      drawnTiles.push(tile);
    }
    return drawnTiles;
  }

  // 返還字母磚到池中
  returnTiles(tiles) {
    tiles.forEach(tile => {
      tile.position = 'pool';
      tile.playerId = null;
      tile.boardX = null;
      tile.boardY = null;
      tile.lockedOnBoard = false;
      tile.selectedLetter = null;
      this.tiles.push(tile);
    });
    this.shuffle();
  }

  // 獲取剩餘數量
  getRemainingCount() {
    return this.tiles.length;
  }

  // 獲取統計資訊
  getStatistics() {
    const stats = {};
    this.tiles.forEach(tile => {
      stats[tile.letter] = (stats[tile.letter] || 0) + 1;
    });
    return stats;
  }
}

// 玩家手牌管理器
class PlayerHand {
  constructor(playerId) {
    this.playerId = playerId;
    this.tiles = [];
    this.maxTiles = 14; // 標準最大手牌數
  }

  // 添加字母磚到手牌
  addTiles(tiles) {
    tiles.forEach(tile => {
      tile.position = 'hand';
      tile.playerId = this.playerId;
      this.tiles.push(tile);
    });
    this.sortTiles();
  }

  // 移除字母磚
  removeTile(tileId) {
    const index = this.tiles.findIndex(tile => tile.id === tileId);
    if (index !== -1) {
      return this.tiles.splice(index, 1)[0];
    }
    return null;
  }

  // 移除多個字母磚
  removeTiles(tileIds) {
    return tileIds.map(id => this.removeTile(id)).filter(tile => tile !== null);
  }

  // 按字母排序
  sortTiles() {
    this.tiles.sort((a, b) => {
      // 萬用字母排在最後
      if (a.isBlank && !b.isBlank) return 1;
      if (!a.isBlank && b.isBlank) return -1;
      if (a.isBlank && b.isBlank) return 0;
      
      // 按字母順序排列
      return a.letter.localeCompare(b.letter);
    });
  }

  // 獲取手牌統計
  getStatistics() {
    const stats = {
      totalTiles: this.tiles.length,
      totalPoints: this.tiles.reduce((sum, tile) => sum + tile.getEffectivePoints(), 0),
      letters: {}
    };
    
    this.tiles.forEach(tile => {
      const letter = tile.getDisplayLetter();
      stats.letters[letter] = (stats.letters[letter] || 0) + 1;
    });
    
    return stats;
  }

  // 檢查是否可以拼出單詞
  canFormWord(word) {
    const available = { ...this.getStatistics().letters };
    const blanks = this.tiles.filter(t => t.isBlank && !t.selectedLetter).length;
    let blanksUsed = 0;
    
    for (let char of word.toUpperCase()) {
      if (available[char] > 0) {
        available[char]--;
      } else if (blanksUsed < blanks) {
        blanksUsed++;
      } else {
        return false;
      }
    }
    
    return true;
  }

  // 獲取可用字母（包括萬用字母）
  getAvailableLetters() {
    const letters = new Set();
    this.tiles.forEach(tile => {
      if (tile.isBlank) {
        // 萬用字母可以是任何字母
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => letters.add(l));
      } else {
        letters.add(tile.letter);
      }
    });
    return Array.from(letters).sort();
  }
}

// 遊戲字母磚系統管理器
class GameTileSystem {
  constructor() {
    this.tilePool = new TilePool();
    this.playerHands = new Map();
    this.boardTiles = [];
    this.gameStarted = false;
  }

  // 初始化遊戲
  initializeGame(playerIds) {
    this.tilePool.initialize();
    this.playerHands.clear();
    this.boardTiles = [];
    this.gameStarted = true;
    
    // 為每個玩家創建手牌
    playerIds.forEach(playerId => {
      this.playerHands.set(playerId, new PlayerHand(playerId));
    });
    
    // 分發初始手牌 (每人7張)
    this.dealInitialHands();
    
    console.log('🎮 字母磚系統初始化完成');
  }

  // 分發初始手牌
  dealInitialHands() {
    const INITIAL_HAND_SIZE = 7;
    
    this.playerHands.forEach((hand, playerId) => {
      const tiles = this.tilePool.drawTiles(INITIAL_HAND_SIZE);
      hand.addTiles(tiles);
      console.log(`👤 為玩家 ${playerId} 分發 ${tiles.length} 張字母磚`);
    });
  }

  // 玩家抽取字母磚
  drawTileForPlayer(playerId, count = 1) {
    const hand = this.playerHands.get(playerId);
    if (!hand) return [];
    
    const tiles = this.tilePool.drawTiles(count);
    hand.addTiles(tiles);
    
    console.log(`🎯 玩家 ${playerId} 抽取了 ${tiles.length} 張字母磚`);
    return tiles;
  }

  // 獲取玩家手牌
  getPlayerHand(playerId) {
    return this.playerHands.get(playerId);
  }

  // 獲取玩家手牌資料（用於客戶端）
  getPlayerHandData(playerId) {
    const hand = this.playerHands.get(playerId);
    if (!hand) return null;
    
    return {
      tiles: hand.tiles.map(tile => ({
        id: tile.id,
        letter: tile.getDisplayLetter(),
        points: tile.getEffectivePoints(),
        isBlank: tile.isBlank,
        selectedLetter: tile.selectedLetter
      })),
      statistics: hand.getStatistics(),
      availableLetters: hand.getAvailableLetters()
    };
  }

  // 獲取遊戲狀態
  getGameState() {
    return {
      poolRemaining: this.tilePool.getRemainingCount(),
      boardTiles: this.boardTiles.length,
      playerHands: Array.from(this.playerHands.keys()).map(playerId => ({
        playerId,
        tileCount: this.playerHands.get(playerId).tiles.length,
        statistics: this.playerHands.get(playerId).getStatistics()
      }))
    };
  }

  // 驗證字母磚移動
  validateTileMove(playerId, tileId, fromPosition, toPosition) {
    const hand = this.playerHands.get(playerId);
    if (!hand) return false;
    
    const tile = hand.tiles.find(t => t.id === tileId);
    if (!tile) return false;
    
    // 檢查移動是否合法
    if (fromPosition === 'hand' && toPosition === 'board') {
      // 從手牌到棋盤
      return true;
    } else if (fromPosition === 'board' && toPosition === 'hand') {
      // 從棋盤回到手牌 (僅在當前回合未鎖定時)
      return !tile.lockedOnBoard;
    }
    
    return false;
  }

  // 設置萬用字母
  setBlankTileLetter(playerId, tileId, letter) {
    const hand = this.playerHands.get(playerId);
    if (!hand) return false;
    
    const tile = hand.tiles.find(t => t.id === tileId);
    if (!tile || !tile.isBlank) return false;
    
    // 驗證字母有效性
    if (!/^[A-Z]$/.test(letter)) return false;
    
    tile.selectedLetter = letter;
    console.log(`🌟 萬用字母磚 ${tileId} 設置為字母 ${letter}`);
    return true;
  }

  // 重置萬用字母
  resetBlankTile(playerId, tileId) {
    const hand = this.playerHands.get(playerId);
    if (!hand) return false;
    
    const tile = hand.tiles.find(t => t.id === tileId);
    if (!tile || !tile.isBlank) return false;
    
    tile.selectedLetter = null;
    console.log(`🔄 重置萬用字母磚 ${tileId}`);
    return true;
  }

  // 獲取字母磚配置資訊
  static getTileConfig() {
    return TILE_CONFIG;
  }

  // 計算單詞分數
  calculateWordScore(tiles) {
    return tiles.reduce((total, tile) => total + tile.getEffectivePoints(), 0);
  }
}

// 導出類別和函數
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 環境
  module.exports = {
    Tile,
    TilePool,
    PlayerHand,
    GameTileSystem,
    TILE_CONFIG
  };
} else {
  // 瀏覽器環境
  window.TileSystem = {
    Tile,
    TilePool,
    PlayerHand,
    GameTileSystem,
    TILE_CONFIG
  };
}