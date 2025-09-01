// ========== client/phaser/scenes/GameScene.js ==========
// 主遊戲場景 - 負責遊戲核心邏輯和磚塊管理

class GameScene {
  constructor() {
    this.gameData = null;
    this.socketClient = null;
    this.gameManager = null;
    this.tileHand = null;
    this.board = null;
    this.selectedTiles = [];
  }

  // 初始化場景
  init(gameData, socketClient, gameManager) {
    console.log('🎮 GameScene 初始化');
    
    this.gameData = gameData;
    this.socketClient = socketClient;
    this.gameManager = gameManager;

    // 預載入資源
    this.preloadAssets();
    
    // 創建場景內容
    this.create();
    
    // 設置 Socket 事件
    this.setupSocketEvents();
    
    // 請求初始手牌
    this.requestInitialHand();
  }

  // 預載入資源
  preloadAssets() {
    console.log('📦 GameScene 預載入資源');
    
    // 如果資源還沒載入，創建它們
    if (!this.textures.exists('tile-normal')) {
      this.createTileTextures();
    }
  }

  // 創建場景
  create() {
    const { width, height } = this.sys.game.config;

    console.log('🎨 GameScene 創建內容');

    // 創建背景
    this.add.rectangle(width / 2, height / 2, width, height, 0xf8f9fa);

    // 創建遊戲區域
    this.createGameBoard();
    this.createHandArea();
    
    // 創建手牌管理器
    if (typeof TileHand !== 'undefined') {
      this.tileHand = new TileHand(this, this.socketClient);
    } else {
      console.error('❌ TileHand 類未載入');
    }

    // 設置拖放系統
    this.setupDragAndDrop();
  }

  // 創建遊戲棋盤
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
    this.boardHint = this.add.text(width / 2, 300, '拖拽字母磚到這裡組成單詞', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#666'
    }).setOrigin(0.5);

    // 設置棋盤為拖放目標
    this.board.setInteractive();
    this.board.setData('dropZone', 'board');
  }

  // 創建手牌區域
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

  // 設置拖放系統
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

  // 處理磚塊拖放
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

  // 移動磚塊到棋盤
  moveTileToBoard(tileObject) {
    console.log('🎯 移動磚塊到棋盤:', tileObject.tileData.letter);
    
    // 簡單放置在棋盤中央（之後會實現網格系統）
    const boardCenterX = this.sys.game.config.width / 2;
    const boardCenterY = 300;
    
    this.tweens.add({
      targets: tileObject,
      x: boardCenterX,
      y: boardCenterY,
      duration: 300,
      ease: 'Power2'
    });

    // 標記磚塊在棋盤上
    tileObject.location = 'board';
    
    if (this.gameManager) {
      this.gameManager.showMessage(`將 ${tileObject.tileData.letter} 放置到棋盤`, 'info');
    }
  }

  // 移動磚塊回手牌
  moveTileToHand(tileObject) {
    console.log('🏠 移動磚塊回手牌:', tileObject.tileData.letter);
    
    if (this.tileHand) {
      this.tileHand.addTileBack(tileObject);
    }
    
    // 標記磚塊在手牌中
    tileObject.location = 'hand';
    
    if (this.gameManager) {
      this.gameManager.showMessage(`將 ${tileObject.tileData.letter} 移回手牌`, 'info');
    }
  }

  // 設置 Socket 事件監聽
  setupSocketEvents() {
    if (!this.socketClient) return;

    console.log('🔧 GameScene 設置 Socket 事件');

    // 手牌更新
    this.socketClient.on('myHandUpdate', (data) => {
      console.log('🎯 收到手牌更新:', data);
      if (this.tileHand) {
        this.tileHand.updateHand(data);
      }
    });

    // 遊戲狀態更新
    this.socketClient.on('gameStateUpdate', (data) => {
      console.log('🎮 遊戲狀態更新:', data);
      this.updateGameState(data);
    });
  }

  // 請求初始手牌
  requestInitialHand() {
    console.log('📦 請求初始手牌');
    
    setTimeout(() => {
      if (this.socketClient && this.socketClient.requestMyHand) {
        this.socketClient.requestMyHand();
      } else {
        // 載入測試數據
        this.loadTestData();
      }
    }, 1000);
  }

  // 載入測試數據
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

  // 更新遊戲狀態
  updateGameState(gameState) {
    console.log('🔄 更新遊戲狀態:', gameState);
    // 更新遊戲狀態顯示
  }

  // 更新遊戲數據
  updateGameData(gameData) {
    this.gameData = gameData;
    console.log('📊 遊戲數據更新:', gameData);
  }

  // 創建磚塊材質
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

  // 場景更新（每幀調用）
  update() {
    // 遊戲邏輯更新
  }
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.GameScene = GameScene;
}

console.log('✅ GameScene 載入完成');