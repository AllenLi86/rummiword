// ========== client/phaser/objects/TileHand.js ==========
// 手牌管理 - 管理玩家手中的字母磚

class TileHand {
  constructor(scene, socketClient) {
    this.scene = scene;
    this.socketClient = socketClient;
    this.tiles = [];
    this.selectedTiles = [];

    // 響應式手牌區域配置
    const { width, height } = scene.sys.game.config;
    const isMobile = width < 768;

    this.handArea = {
      startX: isMobile ? 80 : 150,
      startY: height - 100,
      spacing: isMobile ? 60 : 80,
      maxTiles: isMobile ? 10 : 14
    };
  }

  // 更新手牌
  updateHand(handData) {
    console.log('🎯 TileHand 更新手牌', handData);

    // 清除現有磚塊
    this.clearHand();

    if (!handData || !handData.tiles) {
      console.log('⚠️ 沒有手牌數據');
      return;
    }

    // 創建新的磚塊
    handData.tiles.forEach((tileData, index) => {
      this.addTile(tileData, index);
    });

    // 更新統計
    this.updateStats(handData);

    // 通知場景更新選中磚塊列表
    if (this.scene && this.scene.selectedTiles) {
      this.scene.selectedTiles = this.selectedTiles;
    }
  }

  // 添加磚塊
  addTile(tileData, index) {
    const x = this.handArea.startX + (index * this.handArea.spacing);
    const y = this.handArea.startY;

    // 創建磚塊對象
    const tile = new PhaserTile(this.scene, x, y, tileData);

    // 設置事件監聽
    tile.on('selected', this.onTileSelected, this);
    tile.on('deselected', this.onTileDeselected, this);

    this.tiles.push(tile);

    console.log('➕ 添加磚塊:', tileData.letter, 'at', x, y);
  }

  // 磚塊被選中
  onTileSelected(tile) {
    if (!this.selectedTiles.includes(tile)) {
      this.selectedTiles.push(tile);
    }

    console.log('🎯 磚塊選中，當前選中數量:', this.selectedTiles.length);

    // 更新場景的選中磚塊列表
    if (this.scene) {
      this.scene.selectedTiles = this.selectedTiles;
    }
  }

  // 磚塊取消選中
  onTileDeselected(tile) {
    const index = this.selectedTiles.indexOf(tile);
    if (index > -1) {
      this.selectedTiles.splice(index, 1);
    }

    console.log('❌ 磚塊取消選中，當前選中數量:', this.selectedTiles.length);

    // 更新場景的選中磚塊列表
    if (this.scene) {
      this.scene.selectedTiles = this.selectedTiles;
    }
  }

  // 添加磚塊回手牌
  addTileBack(tile) {
    if (!this.tiles.includes(tile)) {
      this.tiles.push(tile);
    }

    // 重新排列手牌
    this.rearrangeTiles();
  }

  // 移除磚塊
  removeTile(tile) {
    const index = this.tiles.indexOf(tile);
    if (index > -1) {
      this.tiles.splice(index, 1);

      // 從選中列表中移除
      const selectedIndex = this.selectedTiles.indexOf(tile);
      if (selectedIndex > -1) {
        this.selectedTiles.splice(selectedIndex, 1);
      }

      // 重新排列剩餘磚塊
      this.rearrangeTiles();
    }
  }

  // 重新排列磚塊
  rearrangeTiles() {
    console.log('🔄 重新排列手牌磚塊');

    this.tiles.forEach((tile, index) => {
      if (tile && tile.active) {
        const newX = this.handArea.startX + (index * this.handArea.spacing);
        const newY = this.handArea.startY;

        tile.updatePosition(newX, newY, true);
      }
    });
  }

  // 清除選擇
  clearSelection() {
    console.log('🗑️ 清除所有選中磚塊');

    // 取消所有磚塊的選中狀態
    this.selectedTiles.forEach(tile => {
      if (tile && tile.deselect) {
        tile.deselect();
      }
    });

    this.selectedTiles = [];

    // 更新場景的選中磚塊列表
    if (this.scene) {
      this.scene.selectedTiles = [];
    }
  }

  // 清除手牌
  clearHand() {
    console.log('🗑️ 清除所有手牌磚塊');

    this.tiles.forEach(tile => {
      if (tile && tile.destroy) {
        tile.destroy();
      }
    });

    this.tiles = [];
    this.selectedTiles = [];

    // 更新場景的選中磚塊列表
    if (this.scene) {
      this.scene.selectedTiles = [];
    }
  }

  // 更新統計
  updateStats(handData) {
    if (!handData.statistics) return;

    // 通知 UI 場景更新統計
    const gameManager = this.scene.gameManager;
    if (gameManager) {
      const uiScene = gameManager.getUIScene();
      if (uiScene && uiScene.updateHandStats) {
        uiScene.updateHandStats(handData);
      }
    }
  }

  // 獲取磚塊按字母
  getTileByLetter(letter) {
    return this.tiles.find(tile =>
      tile.tileData.letter === letter ||
      tile.tileData.selectedLetter === letter
    );
  }

  // 獲取所有可用字母
  getAvailableLetters() {
    const letters = [];
    this.tiles.forEach(tile => {
      if (tile.tileData.isBlank) {
        // 萬用字母可以是任何字母
        if (tile.tileData.selectedLetter) {
          letters.push(tile.tileData.selectedLetter);
        } else {
          // 未設置的萬用字母
          letters.push('*');
        }
      } else {
        letters.push(tile.tileData.letter);
      }
    });
    return letters;
  }

  // 檢查是否可以拼出單詞
  canFormWord(word) {
    const available = [...this.getAvailableLetters()];
    const wordLetters = word.toUpperCase().split('');

    for (const letter of wordLetters) {
      const index = available.indexOf(letter);
      if (index > -1) {
        available.splice(index, 1);
      } else {
        // 檢查是否有萬用字母
        const blankIndex = available.indexOf('*');
        if (blankIndex > -1) {
          available.splice(blankIndex, 1);
        } else {
          return false;
        }
      }
    }

    return true;
  }

  // 獲取手牌統計
  getHandStats() {
    const stats = {
      totalTiles: this.tiles.length,
      totalPoints: 0,
      selectedTiles: this.selectedTiles.length,
      letters: {}
    };

    this.tiles.forEach(tile => {
      const letter = tile.getDisplayLetter();
      stats.letters[letter] = (stats.letters[letter] || 0) + 1;
      stats.totalPoints += tile.tileData.points || 0;
    });

    return stats;
  }

  // 模擬添加新磚塊
  simulateDrawTile() {
    const randomLetters = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const randomPoints = [2, 4, 1, 8, 5, 1, 3, 1, 1, 3];
    const randomIndex = Math.floor(Math.random() * randomLetters.length);

    const newTileData = {
      id: `sim_${Date.now()}`,
      letter: randomLetters[randomIndex],
      points: randomPoints[randomIndex],
      isBlank: false
    };

    // 添加到手牌末尾
    this.addTile(newTileData, this.tiles.length);

    console.log('🎲 模擬抽磚:', newTileData.letter);

    // 顯示消息
    if (this.scene.gameManager) {
      this.scene.gameManager.showMessage(
        `抽到新磚塊: ${newTileData.letter}(${newTileData.points}分)`,
        'success'
      );
    }
  }

  // 洗牌手牌
  shuffleHand() {
    console.log('🔀 洗牌手牌');

    // Fisher-Yates 洗牌算法
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }

    // 重新排列位置
    this.rearrangeTiles();

    if (this.scene.gameManager) {
      this.scene.gameManager.showMessage('手牌已洗牌', 'info');
    }
  }

  // 按字母排序
  sortByLetter() {
    console.log('🔤 按字母排序手牌');

    this.tiles.sort((a, b) => {
      // 萬用字母排在最後
      if (a.tileData.isBlank && !b.tileData.isBlank) return 1;
      if (!a.tileData.isBlank && b.tileData.isBlank) return -1;
      if (a.tileData.isBlank && b.tileData.isBlank) return 0;

      // 按字母順序
      const letterA = a.getDisplayLetter();
      const letterB = b.getDisplayLetter();
      return letterA.localeCompare(letterB);
    });

    this.rearrangeTiles();

    if (this.scene.gameManager) {
      this.scene.gameManager.showMessage('手牌已按字母排序', 'info');
    }
  }

  // 按分數排序
  sortByPoints() {
    console.log('💯 按分數排序手牌');

    this.tiles.sort((a, b) => {
      return (a.tileData.points || 0) - (b.tileData.points || 0);
    });

    this.rearrangeTiles();

    if (this.scene.gameManager) {
      this.scene.gameManager.showMessage('手牌已按分數排序', 'info');
    }
  }

  // 銷毀手牌管理器
  destroy() {
    this.clearHand();
    this.scene = null;
    this.socketClient = null;
  }
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.TileHand = TileHand;
}

console.log('✅ TileHand 載入完成');