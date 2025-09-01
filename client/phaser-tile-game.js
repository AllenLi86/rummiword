// ========== phaser-tile-game.js ==========
// Phaser.js 字母磚遊戲系統

class PhaserTileGame {
  constructor() {
    this.game = null;
    this.scene = null;
    this.handTiles = [];
    this.selectedTiles = [];
    this.gameData = null;
    this.socketClient = null;
  }

  // 初始化 Phaser 遊戲
  init(gameData, socketClient) {
    console.log('🎮 初始化 Phaser 字母磚遊戲', gameData);
    this.gameData = gameData;
    this.socketClient = socketClient;

    const config = {
      type: Phaser.AUTO,
      width: 1200,
      height: 800,
      parent: 'phaser-game-container',
      backgroundColor: '#f8f9fa',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
      }
    };

    this.game = new Phaser.Game(config);
  }

  // 預載入資源
  preload() {
    console.log('📦 載入 Phaser 資源...');
    
    // 創建字母磚材質
    this.load.image('tile-bg', 'data:image/png;base64,' + this.createTileTexture());
    this.load.image('blank-tile-bg', 'data:image/png;base64,' + this.createBlankTileTexture());
    
    // 創建選中效果材質
    this.load.image('tile-selected', 'data:image/png;base64,' + this.createSelectedTexture());
  }

  // 創建遊戲場景
  create() {
    console.log('🎨 創建 Phaser 遊戲場景');
    this.scene = this;

    // 創建遊戲區域
    this.createGameAreas();
    
    // 設置拖拽功能
    this.input.setDragState(0);
    
    // 請求初始手牌
    this.requestHandUpdate();

    // 設置 Socket 事件監聽
    this.setupSocketEvents();
  }

  // 更新循環
  update() {
    // 遊戲邏輯更新
  }

  // 創建遊戲區域
  createGameAreas() {
    const { width, height } = this.sys.game.config;

    // 遊戲標題
    const title = this.add.text(width / 2, 50, '🎮 Rummiword', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 棋盤區域
    const boardArea = this.add.rectangle(width / 2, 300, width - 100, 200, 0xffffff)
      .setStrokeStyle(2, 0xcccccc);
    
    this.add.text(width / 2, 300, '🔧 棋盤區域 (拖拽字母磚到這裡組成單詞)', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#666'
    }).setOrigin(0.5);

    // 手牌區域
    const handArea = this.add.rectangle(width / 2, 650, width - 100, 120, 0xf8f9fa)
      .setStrokeStyle(2, 0xdee2e6);

    this.add.text(100, 580, '🎯 我的手牌', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    });

    // 統計資訊
    this.handCountText = this.add.text(width - 300, 580, '磚塊數: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666'
    });

    this.handScoreText = this.add.text(width - 150, 580, '總分: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666'
    });

    // 控制按鈕
    this.createControlButtons();

    // 設置拖放區域
    this.setupDropZones();
  }

  // 創建控制按鈕
  createControlButtons() {
    const { width } = this.sys.game.config;
    const buttonY = 750;

    // 載入測試數據按鈕
    this.createButton(200, buttonY, '🎲 載入測試手牌', () => {
      this.loadMockHandData();
    });

    // 抽磚按鈕
    this.createButton(400, buttonY, '➕ 抽磚', () => {
      this.drawTile();
    });

    // 檢查單詞按鈕
    this.createButton(600, buttonY, '🔍 檢查單詞', () => {
      this.checkWords();
    });

    // 結束回合按鈕
    this.createButton(800, buttonY, '⏭️ 結束回合', () => {
      this.endTurn();
    });

    // 離開遊戲按鈕
    this.createButton(width - 200, buttonY, '🚪 離開遊戲', () => {
      this.leaveGame();
    });
  }

  // 創建按鈕輔助函數
  createButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 150, 40, 0x007bff)
      .setStrokeStyle(2, 0x0056b3)
      .setInteractive({ cursor: 'pointer' })
      .on('pointerdown', callback)
      .on('pointerover', () => {
        button.setFillStyle(0x0056b3);
      })
      .on('pointerout', () => {
        button.setFillStyle(0x007bff);
      });

    this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    return button;
  }

  // 設置拖放區域
  setupDropZones() {
    const { width } = this.sys.game.config;

    // 棋盤拖放區域
    const boardDropZone = this.add.zone(width / 2, 300, width - 100, 200)
      .setRectangleDropZone(width - 100, 200);

    boardDropZone.on('drop', (pointer, gameObject) => {
      this.handleTileDrop(gameObject, 'board');
    });

    // 手牌拖放區域
    const handDropZone = this.add.zone(width / 2, 650, width - 100, 120)
      .setRectangleDropZone(width - 100, 120);

    handDropZone.on('drop', (pointer, gameObject) => {
      this.handleTileDrop(gameObject, 'hand');
    });
  }

  // 更新手牌
  updateHand(handData) {
    console.log('🎯 Phaser 更新手牌', handData);

    // 清除現有手牌
    this.clearHand();

    if (!handData || !handData.tiles) {
      console.log('⚠️ 沒有手牌數據');
      return;
    }

    // 創建新的手牌磚塊
    const startX = 150;
    const startY = 650;
    const tileSpacing = 80;

    handData.tiles.forEach((tileData, index) => {
      const x = startX + (index * tileSpacing);
      const tile = this.createTile(tileData, x, startY);
      this.handTiles.push(tile);
    });

    // 更新統計
    this.updateHandStats(handData);
  }

  // 創建字母磚
  createTile(tileData, x, y) {
    const isBlank = tileData.isBlank;
    const bgKey = isBlank ? 'blank-tile-bg' : 'tile-bg';

    // 創建磚塊容器
    const tileContainer = this.add.container(x, y);

    // 背景
    const bg = this.add.image(0, 0, bgKey);
    bg.setScale(0.8);

    // 字母文字
    const letter = this.add.text(0, -5, tileData.letter, {
      fontSize: isBlank ? '24px' : '28px',
      fontFamily: 'Arial',
      color: isBlank ? '#666' : '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 分數文字
    let pointsText = null;
    if (!isBlank && tileData.points !== undefined) {
      pointsText = this.add.text(15, 15, tileData.points.toString(), {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#666'
      }).setOrigin(0.5);
    }

    // 添加到容器
    tileContainer.add([bg]);
    tileContainer.add([letter]);
    if (pointsText) {
      tileContainer.add([pointsText]);
    }

    // 設置互動
    tileContainer.setSize(60, 60);
    tileContainer.setInteractive({ cursor: 'pointer' });
    
    // 拖拽設置
    this.input.setDraggable(tileContainer);

    // 事件監聽
    tileContainer.on('pointerdown', () => {
      this.selectTile(tileContainer, tileData);
    });

    tileContainer.on('dragstart', (pointer) => {
      tileContainer.setScale(1.1);
    });

    tileContainer.on('drag', (pointer, dragX, dragY) => {
      tileContainer.x = dragX;
      tileContainer.y = dragY;
    });

    tileContainer.on('dragend', (pointer) => {
      tileContainer.setScale(1);
    });

    // 萬用字母雙擊事件
    if (isBlank) {
      let lastClickTime = 0;
      tileContainer.on('pointerdown', () => {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 300) {
          this.handleBlankTileDoubleClick(tileData, letter);
        }
        lastClickTime = currentTime;
      });
    }

    // 保存數據到磚塊對象
    tileContainer.tileData = tileData;
    tileContainer.letterText = letter;
    tileContainer.pointsText = pointsText;
    tileContainer.isSelected = false;

    return tileContainer;
  }

  // 選擇磚塊
  selectTile(tileContainer, tileData) {
    if (tileContainer.isSelected) {
      // 取消選擇
      this.deselectTile(tileContainer);
    } else {
      // 選擇
      this.doSelectTile(tileContainer);
    }
  }

  // 執行選擇
  doSelectTile(tileContainer) {
    tileContainer.isSelected = true;
    
    // 添加選中效果
    if (!tileContainer.selectedEffect) {
      const effect = this.add.image(0, 0, 'tile-selected');
      effect.setScale(0.9);
      tileContainer.add(effect);
      tileContainer.selectedEffect = effect;
      tileContainer.sendToBack(effect);
    }

    // 添加到選中列表
    if (!this.selectedTiles.includes(tileContainer)) {
      this.selectedTiles.push(tileContainer);
    }

    console.log('✅ 選中磚塊:', tileContainer.tileData.letter);
  }

  // 取消選擇
  deselectTile(tileContainer) {
    tileContainer.isSelected = false;

    // 移除選中效果
    if (tileContainer.selectedEffect) {
      tileContainer.selectedEffect.destroy();
      tileContainer.selectedEffect = null;
    }

    // 從選中列表移除
    const index = this.selectedTiles.indexOf(tileContainer);
    if (index > -1) {
      this.selectedTiles.splice(index, 1);
    }

    console.log('❌ 取消選中磚塊:', tileContainer.tileData.letter);
  }

  // 處理磚塊拖放
  handleTileDrop(gameObject, area) {
    console.log('📦 磚塊拖放到:', area);
    
    if (area === 'board') {
      // 拖到棋盤
      this.moveTileToBoard(gameObject);
    } else if (area === 'hand') {
      // 拖回手牌
      this.moveTileToHand(gameObject);
    }
  }

  // 移動磚塊到棋盤
  moveTileToBoard(tileContainer) {
    // 實現棋盤邏輯
    console.log('🎯 移動到棋盤:', tileContainer.tileData.letter);
    // 這裡之後會實現更複雜的棋盤邏輯
  }

  // 移動磚塊回手牌
  moveTileToHand(tileContainer) {
    // 重新排列手牌
    this.repositionHandTiles();
    console.log('🏠 移動回手牌:', tileContainer.tileData.letter);
  }

  // 重新排列手牌磚塊
  repositionHandTiles() {
    const startX = 150;
    const startY = 650;
    const tileSpacing = 80;

    this.handTiles.forEach((tile, index) => {
      if (tile && tile.active) {
        this.tweens.add({
          targets: tile,
          x: startX + (index * tileSpacing),
          y: startY,
          duration: 300,
          ease: 'Power2'
        });
      }
    });
  }

  // 處理萬用字母雙擊
  handleBlankTileDoubleClick(tileData, letterText) {
    console.log('🌟 萬用字母雙擊');

    // 顯示字母選擇UI
    this.showLetterSelection(tileData, letterText);
  }

  // 顯示字母選擇界面
  showLetterSelection(tileData, letterText) {
    // 創建模態框背景
    const overlay = this.add.rectangle(600, 400, 1200, 800, 0x000000, 0.5)
      .setInteractive()
      .setDepth(1000);

    // 創建選擇面板
    const panel = this.add.rectangle(600, 400, 400, 300, 0xffffff)
      .setStrokeStyle(2, 0x007bff)
      .setDepth(1001);

    const title = this.add.text(600, 320, '選擇字母', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1002);

    // 創建字母按鈕
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lettersPerRow = 6;
    const buttonSize = 40;
    const startX = 480;
    const startY = 360;

    const letterButtons = [];

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const row = Math.floor(i / lettersPerRow);
      const col = i % lettersPerRow;
      const x = startX + (col * 45);
      const y = startY + (row * 45);

      const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0x007bff)
        .setStrokeStyle(1, 0x0056b3)
        .setInteractive({ cursor: 'pointer' })
        .setDepth(1002)
        .on('pointerdown', () => {
          this.selectBlankLetter(tileData, letterText, letter);
          this.closeLetterSelection(overlay, panel, title, letterButtons);
        })
        .on('pointerover', function() {
          this.setFillStyle(0x0056b3);
        })
        .on('pointerout', function() {
          this.setFillStyle(0x007bff);
        });

      const buttonText = this.add.text(x, y, letter, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1003);

      letterButtons.push(button, buttonText);
    }

    // 取消按鈕
    const cancelButton = this.add.rectangle(600, 480, 100, 30, 0x6c757d)
      .setStrokeStyle(1, 0x5a6268)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(1002)
      .on('pointerdown', () => {
        this.closeLetterSelection(overlay, panel, title, letterButtons, cancelButton, cancelText);
      });

    const cancelText = this.add.text(600, 480, '取消', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1003);

    letterButtons.push(cancelButton, cancelText);
  }

  // 選擇萬用字母
  selectBlankLetter(tileData, letterText, letter) {
    console.log('🎯 選擇萬用字母:', letter);
    
    // 更新本地數據
    tileData.selectedLetter = letter;
    letterText.setText(letter);

    // 通知服務器
    if (this.socketClient && this.socketClient.setBlankTileLetter) {
      this.socketClient.setBlankTileLetter(tileData.id, letter);
    }

    this.showMessage(`萬用字母設置為 ${letter}`, 'success');
  }

  // 關閉字母選擇界面
  closeLetterSelection(overlay, panel, title, letterButtons, cancelButton, cancelText) {
    overlay.destroy();
    panel.destroy();
    title.destroy();
    letterButtons.forEach(element => element.destroy());
    if (cancelButton) cancelButton.destroy();
    if (cancelText) cancelText.destroy();
  }

  // 清除手牌
  clearHand() {
    this.handTiles.forEach(tile => {
      if (tile) {
        tile.destroy();
      }
    });
    this.handTiles = [];
    this.selectedTiles = [];
  }

  // 更新手牌統計
  updateHandStats(handData) {
    if (handData.statistics) {
      this.handCountText.setText(`磚塊數: ${handData.statistics.totalTiles}`);
      this.handScoreText.setText(`總分: ${handData.statistics.totalPoints}`);
    }
  }

  // Socket 事件設置
  setupSocketEvents() {
    if (!this.socketClient) return;

    // 手牌更新
    this.socketClient.on('myHandUpdate', (data) => {
      this.updateHand(data);
    });

    // 遊戲狀態更新
    this.socketClient.on('gameStateUpdate', (data) => {
      console.log('🎮 遊戲狀態更新:', data);
    });
  }

  // 請求手牌更新
  requestHandUpdate() {
    if (this.socketClient && this.socketClient.requestMyHand) {
      this.socketClient.requestMyHand();
    } else {
      // 測試模式：載入模擬數據
      console.log('📦 載入模擬手牌數據');
      setTimeout(() => {
        this.loadMockHandData();
      }, 1000);
    }
  }

  // 載入模擬手牌數據
  loadMockHandData() {
    const mockData = {
      tiles: [
        { id: 'tile_1', letter: 'A', points: 1, isBlank: false },
        { id: 'tile_2', letter: 'B', points: 3, isBlank: false },
        { id: 'tile_3', letter: 'C', points: 3, isBlank: false },
        { id: 'tile_4', letter: 'D', points: 2, isBlank: false },
        { id: 'tile_5', letter: 'E', points: 1, isBlank: false },
        { id: 'tile_6', letter: '★', points: 0, isBlank: true },
        { id: 'tile_7', letter: 'F', points: 4, isBlank: false }
      ],
      statistics: {
        totalTiles: 7,
        totalPoints: 14
      }
    };

    this.updateHand(mockData);
    this.showMessage('測試手牌載入完成', 'success');
  }

  // 遊戲控制函數
  drawTile() {
    console.log('🎲 抽磚');
    if (this.socketClient && this.socketClient.drawTile) {
      this.socketClient.drawTile();
    } else {
      // 模擬抽磚
      const newTile = {
        id: `new_tile_${Date.now()}`,
        letter: 'H',
        points: 4,
        isBlank: false
      };
      
      // 添加到手牌末尾
      const x = 150 + (this.handTiles.length * 80);
      const tile = this.createTile(newTile, x, 650);
      this.handTiles.push(tile);
      
      this.showMessage(`抽到新磚塊: ${newTile.letter}(${newTile.points}分)`, 'success');
    }
  }

  checkWords() {
    if (this.selectedTiles.length === 0) {
      this.showMessage('請先選擇字母磚', 'warning');
      return;
    }

    const selectedLetters = this.selectedTiles.map(tile => 
      tile.tileData.selectedLetter || tile.tileData.letter
    ).join('');

    console.log('🔍 檢查單詞:', selectedLetters);
    this.showMessage(`檢查單詞: ${selectedLetters} (測試模式)`, 'info');
  }

  endTurn() {
    console.log('⏭️ 結束回合');
    
    // 清除選擇
    this.selectedTiles.forEach(tile => {
      this.deselectTile(tile);
    });

    this.showMessage('回合已結束', 'info');
  }

  leaveGame() {
    if (window.confirm && confirm('確定要離開遊戲嗎？')) {
      if (typeof leaveRoom === 'function') {
        leaveRoom();
      }
    }
  }

  // 顯示消息
  showMessage(message, type = 'info') {
    if (typeof showMessage === 'function') {
      showMessage(message, type);
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // 創建材質輔助函數
  createTileTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 60;
    canvas.height = 60;

    // 漸層背景
    const gradient = ctx.createLinearGradient(0, 0, 60, 60);
    gradient.addColorStop(0, '#ffeaa7');
    gradient.addColorStop(1, '#fdcb6e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 60, 60);

    // 邊框
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 58, 58);

    // 圓角效果
    ctx.beginPath();
    ctx.roundRect(2, 2, 56, 56, 8);
    ctx.stroke();

    return canvas.toDataURL().split(',')[1];
  }

  createBlankTileTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 60;
    canvas.height = 60;

    // 漸層背景
    const gradient = ctx.createLinearGradient(0, 0, 60, 60);
    gradient.addColorStop(0, '#ddd');
    gradient.addColorStop(1, '#bbb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 60, 60);

    // 邊框
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 58, 58);

    return canvas.toDataURL().split(',')[1];
  }

  createSelectedTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 60;
    canvas.height = 60;

    // 選中效果背景
    ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    ctx.fillRect(0, 0, 60, 60);

    // 選中邊框
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 58, 58);

    return canvas.toDataURL().split(',')[1];
  }

  // 銷毀遊戲
  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

// 全局實例
let phaserTileGame = null;

// 初始化函數
function initializePhaserTileGame(gameData, socketClient) {
  console.log('🚀 初始化 Phaser 字母磚遊戲');
  
  // 如果已存在，先銷毀
  if (phaserTileGame) {
    phaserTileGame.destroy();
  }

  phaserTileGame = new PhaserTileGame();
  phaserTileGame.init(gameData, socketClient);

  return phaserTileGame;
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.PhaserTileGame = PhaserTileGame;
  window.phaserTileGame = phaserTileGame;
  window.initializePhaserTileGame = initializePhaserTileGame;
}

console.log('✅ Phaser 字母磚遊戲系統載入完成');