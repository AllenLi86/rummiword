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
        {
          key: 'GameScene',
          active: true,
          create: this.createGameScene.bind(this)
        },
        {
          key: 'UIScene',
          active: true,
          create: this.createUIScene.bind(this)
        }
      ]
    };

    this.game = new Phaser.Game(config);
    return this.game;
  }

  // 創建主遊戲場景
  createGameScene() {
    this.gameScene = this.game.scene.getScene('GameScene');
    
    if (typeof GameScene !== 'undefined') {
      // 使用 GameScene 類初始化
      Object.setPrototypeOf(this.gameScene, GameScene.prototype);
      this.gameScene.init(this.gameData, this.socketClient, this);
    } else {
      console.error('❌ GameScene 類未載入');
    }
  }

  // 創建 UI 場景
  createUIScene() {
    this.uiScene = this.game.scene.getScene('UIScene');
    
    if (typeof UIScene !== 'undefined') {
      // 使用 UIScene 類初始化
      Object.setPrototypeOf(this.uiScene, UIScene.prototype);
      this.uiScene.init(this.gameData, this.socketClient, this);
    } else {
      console.error('❌ UIScene 類未載入');
    }
  }

  // 獲取場景
  getGameScene() {
    return this.gameScene;
  }

  getUIScene() {
    return this.uiScene;
  }

  // 更新遊戲數據
  updateGameData(gameData) {
    this.gameData = gameData;
    
    if (this.gameScene && this.gameScene.updateGameData) {
      this.gameScene.updateGameData(gameData);
    }
    
    if (this.uiScene && this.uiScene.updateGameData) {
      this.uiScene.updateGameData(gameData);
    }
  }

  // 顯示訊息
  showMessage(message, type = 'info') {
    if (this.uiScene && this.uiScene.showMessage) {
      this.uiScene.showMessage(message, type);
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

// 全局實例
window.phaserGameManager = new PhaserGameManager();

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhaserGameManager;
}

console.log('✅ PhaserGameManager 載入完成');