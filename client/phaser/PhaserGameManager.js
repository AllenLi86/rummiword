// ========== client/phaser/PhaserGameManager.js ==========
// Phaser 遊戲管理器 - 負責初始化和管理整個遊戲

class PhaserGameManager {
  constructor() {
    this.game = null;
    this.gameScene = null;
    this.uiScene = null;
    this.socketClient = null;
    this.gameData = null;
  }

  // 初始化遊戲
  initialize(gameData, socketClient) {
    console.log('🚀 PhaserGameManager 初始化', gameData);
    
    this.gameData = gameData;
    this.socketClient = socketClient;

    // 銷毀現有遊戲
    if (this.game) {
      this.game.destroy(true);
    }

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
      scene: [
        // 直接使用場景類而不是配置對象
        new GameSceneClass(this),
        new UISceneClass(this)
      ]
    };

    this.game = new Phaser.Game(config);
    return this.game;
  }

  // 獲取場景
  getGameScene() {
    return this.game.scene.getScene('GameScene');
  }

  getUIScene() {
    return this.game.scene.getScene('UIScene');
  }

  // 更新遊戲數據
  updateGameData(gameData) {
    this.gameData = gameData;
    
    const gameScene = this.getGameScene();
    const uiScene = this.getUIScene();
    
    if (gameScene && gameScene.updateGameData) {
      gameScene.updateGameData(gameData);
    }
    
    if (uiScene && uiScene.updateGameData) {
      uiScene.updateGameData(gameData);
    }
  }

  // 顯示訊息
  showMessage(message, type = 'info') {
    const uiScene = this.getUIScene();
    if (uiScene && uiScene.showMessage) {
      uiScene.showMessage(message, type);
    }
    
    // 也顯示在 HTML 消息區域
    if (typeof showMessage === 'function') {
      showMessage(message, type);
    }
    
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // 銷毀遊戲
  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    
    this.gameScene = null;
    this.uiScene = null;
    this.socketClient = null;
    this.gameData = null;
  }

  // 重新啟動遊戲
  restart(gameData, socketClient) {
    this.destroy();
    return this.initialize(gameData, socketClient);
  }
}

// 定義場景類
class GameSceneClass extends Phaser.Scene {
  constructor(gameManager) {
    super({ key: 'GameScene' });
    this.gameManager = gameManager;
    this.tileHand = null;
    this.board = null;
    this.selectedTiles = [];
  }

  preload() {
    console.log('📦 GameScene 預載入資源');
    this.createTileTextures();
  }

  create() {
    console.log('🎨 GameScene 創建內容');
    
    const { width, height } = this.sys.game.config;

    // 創建背景
    this.add.rectangle(width / 2, height / 2, width, height, 0xf8f9fa);

    // 創建遊戲區域
    this.createGameBoard();
    this.createHandArea();
    
    // 創建手牌管理器
    this.tileHand = new TileHand(this, this.gameManager.socketClient);

    // 設置拖放系統
    this.setupDragAndDrop();
    
    // 設置 Socket 事件
    this.setupSocketEvents();
    
    // 請求初始手牌
    this.requestInitialHand();
  }

  createGameBoard() {
    const { width } = this.sys.game.config;
    
    // 棋盤背景
    this.board = this.add.rectangle(width / 2, 300, width - 100, 200, 0xffffff)
      .setStrokeStyle(2, 0xcccccc);

    // 棋盤標題
    this.add.text(width / 2, 220, '🎯 遊戲棋盤', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 提示文字
    this.add.text(width / 2, 300, '拖拽字母磚到這裡組成單詞', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#666'
    }).setOrigin(0.5);

    // 設置棋盤為拖放目標
    this.board.setInteractive();
    this.board.setData('dropZone', 'board');
  }

  createHandArea() {
    const { width } = this.sys.game.config;
    const handY = 650;

    // 手牌背景
    this.handArea = this.add.rectangle(width / 2, handY, width - 100, 120, 0xe3f2fd)
      .setStrokeStyle(2, 0x007bff);

    // 手牌標題
    this.add.text(100, handY - 70, '🎯 我的手牌', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    });

    // 設置手牌區域為拖放目標
    this.handArea.setInteractive();
    this.handArea.setData('dropZone', 'hand');
  }

  setupDragAndDrop() {
    // 監聽拖放事件
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      if (gameObject.tileData && dropZone.getData) {
        const zone = dropZone.getData('dropZone');
        this.handleTileDrop(gameObject, zone);
      }
    });

    // 拖拽中的視覺反饋
    this.input.on('dragenter', (pointer, gameObject, dropZone) => {
      if (dropZone === this.board) {
        this.board.setStrokeStyle(3, 0x28a745);
      } else if (dropZone === this.handArea) {
        this.handArea.setStrokeStyle(3, 0x28a745);
      }
    });

    this.input.on('dragleave', (pointer, gameObject, dropZone) => {
      if (dropZone === this.board) {
        this.board.setStrokeStyle(2, 0xcccccc);
      } else if (dropZone === this.handArea) {
        this.handArea.setStrokeStyle(2, 0x007bff);
      }
    });
  }

  handleTileDrop(tileObject, zone) {
    console.log('📦 磚塊拖放到:', zone, tileObject.tileData);

    if (zone === 'board') {
      this.moveTileToBoard(tileObject);
    } else if (zone === 'hand') {
      this.moveTileToHand(tileObject);
    }

    // 重置拖放區域樣式
    this.board.setStrokeStyle(2, 0xcccccc);
    this.handArea.setStrokeStyle(2, 0x007bff);
  }

  moveTileToBoard(tileObject) {
    console.log('🎯 移動磚塊到棋盤:', tileObject.tileData.letter);
    
    const boardCenterX = this.sys.game.config.width / 2;
    const boardCenterY = 300;
    
    this.tweens.add({
      targets: tileObject,
      x: boardCenterX,
      y: boardCenterY,
      duration: 300,
      ease: 'Power2'
    });

    tileObject.location = 'board';
    
    if (this.gameManager) {
      this.gameManager.showMessage(`將 ${tileObject.tileData.letter} 放置到棋盤`, 'info');
    }
  }

  moveTileToHand(tileObject) {
    console.log('🏠 移動磚塊回手牌:', tileObject.tileData.letter);
    
    if (this.tileHand) {
      this.tileHand.addTileBack(tileObject);
    }
    
    tileObject.location = 'hand';
    
    if (this.gameManager) {
      this.gameManager.showMessage(`將 ${tileObject.tileData.letter} 移回手牌`, 'info');
    }
  }

  setupSocketEvents() {
    const socketClient = this.gameManager.socketClient;
    if (!socketClient) return;

    console.log('🔧 GameScene 設置 Socket 事件');

    socketClient.on('myHandUpdate', (data) => {
      console.log('🎯 收到手牌更新:', data);
      if (this.tileHand) {
        this.tileHand.updateHand(data);
      }
    });

    socketClient.on('gameStateUpdate', (data) => {
      console.log('🎮 遊戲狀態更新:', data);
    });
  }

  requestInitialHand() {
    console.log('📦 請求初始手牌');
    
    const socketClient = this.gameManager.socketClient;
    setTimeout(() => {
      if (socketClient && socketClient.requestMyHand) {
        socketClient.requestMyHand();
      } else {
        this.loadTestData();
      }
    }, 1000);
  }

  loadTestData() {
    console.log('🧪 載入測試手牌數據');
    
    const testData = {
      tiles: [
        { id: 'test_1', letter: 'A', points: 1, isBlank: false },
        { id: 'test_2', letter: 'B', points: 3, isBlank: false },
        { id: 'test_3', letter: 'C', points: 3, isBlank: false },
        { id: 'test_4', letter: 'D', points: 2, isBlank: false },
        { id: 'test_5', letter: 'E', points: 1, isBlank: false },
        { id: 'test_6', letter: '★', points: 0, isBlank: true },
        { id: 'test_7', letter: 'F', points: 4, isBlank: false }
      ],
      statistics: {
        totalTiles: 7,
        totalPoints: 14
      }
    };

    if (this.tileHand) {
      this.tileHand.updateHand(testData);
    }

    if (this.gameManager) {
      this.gameManager.showMessage('測試手牌已載入', 'success');
    }
  }

  createTileTextures() {
    console.log('🎨 創建磚塊材質');
    
    const graphics = this.add.graphics();

    // 普通磚塊材質
    graphics.fillGradientStyle(0xffeaa7, 0xffeaa7, 0xfdcb6e, 0xfdcb6e);
    graphics.fillRoundedRect(0, 0, 60, 60, 8);
    graphics.lineStyle(2, 0xe17055);
    graphics.strokeRoundedRect(1, 1, 58, 58, 8);
    graphics.generateTexture('tile-normal', 60, 60);

    // 萬用磚塊材質
    graphics.clear();
    graphics.fillGradientStyle(0xdddddd, 0xdddddd, 0xbbbbbb, 0xbbbbbb);
    graphics.fillRoundedRect(0, 0, 60, 60, 8);
    graphics.lineStyle(2, 0x999999);
    graphics.strokeRoundedRect(1, 1, 58, 58, 8);
    graphics.generateTexture('tile-blank', 60, 60);

    // 選中效果材質
    graphics.clear();
    graphics.fillStyle(0x007bff, 0.3);
    graphics.fillRoundedRect(0, 0, 64, 64, 8);
    graphics.lineStyle(3, 0x007bff);
    graphics.strokeRoundedRect(2, 2, 60, 60, 8);
    graphics.generateTexture('tile-selected', 64, 64);

    graphics.destroy();
  }

  updateGameData(gameData) {
    console.log('📊 GameScene 遊戲數據更新:', gameData);
  }
}

class UISceneClass extends Phaser.Scene {
  constructor(gameManager) {
    super({ key: 'UIScene' });
    this.gameManager = gameManager;
    this.handStats = null;
    this.currentMessage = null;
  }

  create() {
    console.log('🎨 UIScene 創建 UI 元素');

    const { width, height } = this.sys.game.config;

    // 創建遊戲標題
    this.add.text(width / 2, 40, '🎮 Rummiword', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100);

    // 遊戲資訊
    this.gameInfoText = this.add.text(width / 2, 80, '正在載入遊戲資訊...', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666'
    }).setOrigin(0.5).setDepth(100);

    // 創建統計資訊
    this.createStats();
    
    // 創建控制按鈕
    this.createControlButtons();
  }

  createStats() {
    const { width } = this.sys.game.config;

    // 手牌統計
    this.handStats = {
      container: this.add.container(width - 200, 580),
      countText: null,
      scoreText: null,
      poolText: null
    };

    this.handStats.countText = this.add.text(0, 0, '磚塊數: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setDepth(100);

    this.handStats.scoreText = this.add.text(0, 25, '總分: 0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setDepth(100);

    this.handStats.poolText = this.add.text(0, 50, '剩餘: 98', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666'
    }).setDepth(100);

    this.handStats.container.add([
      this.handStats.countText,
      this.handStats.scoreText,
      this.handStats.poolText
    ]);

    this.handStats.container.setDepth(100);
  }

  createControlButtons() {
    const { width, height } = this.sys.game.config;
    const buttonY = height - 60;

    const buttons = [
      { x: 150, text: '🎲 載入測試', action: 'loadTest' },
      { x: 300, text: '➕ 抽磚', action: 'drawTile' },
      { x: 450, text: '🔍 檢查單詞', action: 'checkWords' },
      { x: 600, text: '🗑️ 清除選擇', action: 'clearSelection' },
      { x: 750, text: '⏭️ 結束回合', action: 'endTurn' },
      { x: width - 150, text: '🚪 離開', action: 'leaveGame', color: 0xdc3545 }
    ];

    buttons.forEach(btnConfig => {
      this.createButton(btnConfig.x, buttonY, btnConfig.text, btnConfig.action, btnConfig.color);
    });
  }

  createButton(x, y, text, action, color = 0x007bff) {
    const hoverColor = color === 0xdc3545 ? 0xc82333 : 0x0056b3;

    const bg = this.add.rectangle(x, y, 120, 35, color)
      .setStrokeStyle(2, color)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(100);

    const btnText = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    bg.on('pointerdown', () => {
      this.handleButtonClick(action);
    });

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor);
      bg.setStrokeStyle(2, hoverColor);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
      bg.setStrokeStyle(2, color);
    });
  }

  handleButtonClick(action) {
    console.log('🖱️ 按鈕點擊:', action);

    const gameScene = this.gameManager.getGameScene();

    switch (action) {
      case 'loadTest':
        if (gameScene && gameScene.loadTestData) {
          gameScene.loadTestData();
        }
        break;
        
      case 'drawTile':
        if (this.gameManager.socketClient && this.gameManager.socketClient.drawTile) {
          this.gameManager.socketClient.drawTile();
          this.showMessage('抽磚中...', 'info');
        }
        break;
        
      case 'checkWords':
        if (gameScene && gameScene.selectedTiles && gameScene.selectedTiles.length > 0) {
          const selectedLetters = gameScene.selectedTiles.map(tile => 
            tile.tileData.selectedLetter || tile.tileData.letter
          ).join('');
          this.showMessage(`檢查單詞: ${selectedLetters}`, 'info');
        } else {
          this.showMessage('請先選擇字母磚', 'warning');
        }
        break;
        
      case 'clearSelection':
        if (gameScene && gameScene.tileHand) {
          gameScene.tileHand.clearSelection();
          this.showMessage('已清除選擇', 'info');
        }
        break;
        
      case 'endTurn':
        if (this.gameManager.socketClient && this.gameManager.socketClient.endTurn) {
          this.gameManager.socketClient.endTurn([]);
          this.showMessage('結束回合', 'info');
        }
        break;
        
      case 'leaveGame':
        if (confirm('確定要離開遊戲嗎？')) {
          if (typeof leaveRoom === 'function') {
            leaveRoom();
          }
        }
        break;
    }
  }

  showMessage(message, type = 'info') {
    console.log(`💬 UI消息: ${message} (${type})`);

    if (this.currentMessage) {
      this.currentMessage.destroy();
    }

    const colors = {
      info: { bg: 0x17a2b8, text: '#ffffff' },
      success: { bg: 0x28a745, text: '#ffffff' },
      warning: { bg: 0xffc107, text: '#212529' },
      error: { bg: 0xdc3545, text: '#ffffff' }
    };

    const color = colors[type] || colors.info;

    const msgBg = this.add.rectangle(0, 0, 400, 50, color.bg, 0.9)
      .setStrokeStyle(2, color.bg)
      .setDepth(201);

    const msgText = this.add.text(0, 0, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: color.text,
      fontStyle: 'bold',
      wordWrap: { width: 380 }
    }).setOrigin(0.5).setDepth(202);

    this.currentMessage = this.add.container(this.sys.game.config.width / 2, 120, [msgBg, msgText]);
    this.currentMessage.setDepth(200);

    this.currentMessage.setAlpha(0);
    this.tweens.add({
      targets: this.currentMessage,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    this.time.delayedCall(3000, () => {
      if (this.currentMessage) {
        this.tweens.add({
          targets: this.currentMessage,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (this.currentMessage) {
              this.currentMessage.destroy();
              this.currentMessage = null;
            }
          }
        });
      }
    });
  }

  updateHandStats(handData) {
    if (!handData || !this.handStats) return;

    const stats = handData.statistics || {};
    
    this.handStats.countText.setText(`磚塊數: ${stats.totalTiles || 0}`);
    this.handStats.scoreText.setText(`總分: ${stats.totalPoints || 0}`);
  }

  updateGameData(gameData) {
    console.log('📊 UIScene 遊戲數據更新:', gameData);
  }
}

// 全局實例
window.phaserGameManager = new PhaserGameManager();

console.log('✅ PhaserGameManager 載入完成');