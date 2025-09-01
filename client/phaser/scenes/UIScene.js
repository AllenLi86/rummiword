// ========== client/phaser/scenes/UIScene.js ==========
// UI 覆蓋層場景 - 負責遊戲 UI 元素和控制

class UIScene {
  constructor() {
    this.gameData = null;
    this.socketClient = null;
    this.gameManager = null;
    this.handStats = null;
    this.gameStats = null;
    this.messageQueue = [];
    this.currentMessage = null;
  }

  // 初始化場景
  init(gameData, socketClient, gameManager) {
    console.log('🎨 UIScene 初始化');

    this.gameData = gameData;
    this.socketClient = socketClient;
    this.gameManager = gameManager;

    this.create();
  }

  // 創建 UI 元素
  create() {
    const { width, height } = this.sys.game.config;

    console.log('🎨 UIScene 創建 UI 元素');

    // 創建遊戲標題
    this.createGameTitle();

    // 創建統計資訊
    this.createStats();

    // 創建控制按鈕
    this.createControlButtons();

    // 創建消息系統
    this.setupMessageSystem();
  }

  // 創建遊戲標題
  createGameTitle() {
    const { width } = this.sys.game.config;

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
  }

  // 創建統計資訊
  createStats() {
    const { width } = this.sys.game.config;
    const isMobile = width < 768;

    // 手牌統計 - 響應式位置
    const statsX = isMobile ? width / 2 : width - 200;
    const statsY = isMobile ? 140 : 580;

    this.handStats = {
      container: this.add.container(statsX, statsY),
      countText: null,
      scoreText: null,
      poolText: null
    };

    const fontSize = isMobile ? '14px' : '16px';

    this.handStats.countText = this.add.text(0, 0, '磚塊數: 0', {
      fontSize: fontSize,
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(isMobile ? 0.5 : 0).setDepth(100);

    this.handStats.scoreText = this.add.text(0, 25, '總分: 0', {
      fontSize: fontSize,
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(isMobile ? 0.5 : 0).setDepth(100);

    this.handStats.poolText = this.add.text(0, 50, '剩餘: 98', {
      fontSize: fontSize,
      fontFamily: 'Arial',
      color: '#666'
    }).setOrigin(isMobile ? 0.5 : 0).setDepth(100);

    this.handStats.container.add([
      this.handStats.countText,
      this.handStats.scoreText,
      this.handStats.poolText
    ]);

    this.handStats.container.setDepth(100);
  }

  createControlButtons() {
    const { width, height } = this.sys.game.config;
    const isMobile = width < 768;

    if (isMobile) {
      // 移動設備：垂直排列按鈕
      const buttons = [
        { y: height - 180, text: '🎲 測試', action: 'loadTest' },
        { y: height - 150, text: '➕ 抽磚', action: 'drawTile' },
        { y: height - 120, text: '🔍 檢查', action: 'checkWords' },
        { y: height - 90, text: '🗑️ 清除', action: 'clearSelection' },
        { y: height - 60, text: '⏭️ 結束', action: 'endTurn' },
        { y: height - 30, text: '🚪 離開', action: 'leaveGame', color: 0xdc3545 }
      ];

      buttons.forEach(btnConfig => {
        this.createButton(width / 2, btnConfig.y, btnConfig.text, btnConfig.action, btnConfig.color, true);
      });
    } else {
      // 桌面設備：水平排列按鈕
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
        this.createButton(btnConfig.x, buttonY, btnConfig.text, btnConfig.action, btnConfig.color, false);
      });
    }
  }

  createButton(x, y, text, action, color = 0x007bff, isMobile = false) {
    const hoverColor = color === 0xdc3545 ? 0xc82333 : 0x0056b3;
    const buttonWidth = isMobile ? 200 : 120;
    const buttonHeight = isMobile ? 25 : 35;
    const fontSize = isMobile ? '12px' : '14px';

    const bg = this.add.rectangle(x, y, buttonWidth, buttonHeight, color)
      .setStrokeStyle(2, color)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(100);

    const btnText = this.add.text(x, y, text, {
      fontSize: fontSize,
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
  
  // 處理按鈕點擊
  handleButtonClick(action) {
    console.log('🖱️ 按鈕點擊:', action);

    const gameScene = this.gameManager?.getGameScene();

    switch (action) {
      case 'loadTest':
        if (gameScene) {
          gameScene.loadTestData();
        }
        break;

      case 'drawTile':
        this.drawTile();
        break;

      case 'checkWords':
        this.checkWords();
        break;

      case 'clearSelection':
        this.clearSelection();
        break;

      case 'endTurn':
        this.endTurn();
        break;

      case 'leaveGame':
        this.leaveGame();
        break;

      default:
        console.log('未知的按鈕動作:', action);
    }
  }

  // 抽磚
  drawTile() {
    if (this.socketClient && this.socketClient.drawTile) {
      this.socketClient.drawTile();
      this.showMessage('抽磚中...', 'info');
    } else {
      this.showMessage('抽磚功能不可用', 'warning');
    }
  }

  // 檢查單詞
  checkWords() {
    const gameScene = this.gameManager?.getGameScene();

    if (gameScene && gameScene.selectedTiles && gameScene.selectedTiles.length > 0) {
      const selectedLetters = gameScene.selectedTiles.map(tile =>
        tile.tileData.selectedLetter || tile.tileData.letter
      ).join('');

      this.showMessage(`檢查單詞: ${selectedLetters}`, 'info');

      if (this.socketClient && this.socketClient.checkWords) {
        const tileIds = gameScene.selectedTiles.map(tile => tile.tileData.id);
        this.socketClient.checkWords(tileIds);
      }
    } else {
      this.showMessage('請先選擇字母磚', 'warning');
    }
  }

  // 清除選擇
  clearSelection() {
    const gameScene = this.gameManager?.getGameScene();

    if (gameScene && gameScene.tileHand) {
      gameScene.tileHand.clearSelection();
      this.showMessage('已清除選擇', 'info');
    }
  }

  // 結束回合
  endTurn() {
    if (this.socketClient && this.socketClient.endTurn) {
      this.socketClient.endTurn([]);
      this.showMessage('結束回合', 'info');
    } else {
      this.showMessage('結束回合功能不可用', 'warning');
    }
  }

  // 離開遊戲
  leaveGame() {
    if (confirm('確定要離開遊戲嗎？')) {
      if (typeof leaveRoom === 'function') {
        leaveRoom();
      }
    }
  }

  // 設置消息系統
  setupMessageSystem() {
    const { width, height } = this.sys.game.config;

    // 消息顯示區域（初始時隱藏）
    this.messageContainer = this.add.container(width / 2, height - 150);
    this.messageContainer.setDepth(200);
    this.messageContainer.setAlpha(0);
  }

  // 顯示消息
  showMessage(message, type = 'info') {
    console.log(`💬 UI消息: ${message} (${type})`);

    // 清除當前消息
    if (this.currentMessage) {
      this.currentMessage.destroy();
    }

    // 消息顏色配置
    const colors = {
      info: { bg: 0x17a2b8, text: '#ffffff' },
      success: { bg: 0x28a745, text: '#ffffff' },
      warning: { bg: 0xffc107, text: '#212529' },
      error: { bg: 0xdc3545, text: '#ffffff' }
    };

    const color = colors[type] || colors.info;

    // 創建消息背景
    const msgBg = this.add.rectangle(0, 0, 400, 50, color.bg, 0.9)
      .setStrokeStyle(2, color.bg)
      .setDepth(201);

    // 創建消息文字
    const msgText = this.add.text(0, 0, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: color.text,
      fontStyle: 'bold',
      wordWrap: { width: 380 }
    }).setOrigin(0.5).setDepth(202);

    // 創建消息容器
    this.currentMessage = this.add.container(this.sys.game.config.width / 2, 120, [msgBg, msgText]);
    this.currentMessage.setDepth(200);

    // 動畫效果
    this.currentMessage.setAlpha(0);
    this.tweens.add({
      targets: this.currentMessage,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // 自動隱藏
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

  // 更新手牌統計
  updateHandStats(handData) {
    if (!handData || !this.handStats) return;

    const stats = handData.statistics || {};

    this.handStats.countText.setText(`磚塊數: ${stats.totalTiles || 0}`);
    this.handStats.scoreText.setText(`總分: ${stats.totalPoints || 0}`);
  }

  // 更新遊戲資訊
  updateGameInfo(gameData) {
    if (!gameData) return;

    let infoText = '';
    if (gameData.players && gameData.players.length > 0) {
      infoText = `玩家: ${gameData.players.length} 人`;
    }
    if (gameData.round) {
      infoText += ` | 回合: ${gameData.round}`;
    }

    if (this.gameInfoText && infoText) {
      this.gameInfoText.setText(infoText);
    }
  }

  // 更新遊戲數據
  updateGameData(gameData) {
    this.gameData = gameData;
    this.updateGameInfo(gameData);
  }

  // 場景更新
  update() {
    // UI 更新邏輯
  }
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.UIScene = UIScene;
}

console.log('✅ UIScene 載入完成');