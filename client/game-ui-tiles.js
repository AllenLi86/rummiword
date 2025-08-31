// ========== game-ui-tiles.js ==========

// 全局遊戲狀態
let gameState = {
  currentPlayer: null,
  myHand: null,
  gameData: null,
  selectedTiles: [],
  draggedTile: null
};

// 字母磚 UI 管理器
class TileUIManager {
  // constructor() {
  //   this.selectedTiles = new Set();
  //   this.draggedTile = null;
  //   this.blankTileModal = null;
  //   this.currentBlankTile = null;
  //   this.playedTiles = []; // 新增：記錄已出牌的磚塊
  //   this.dragPreview = null; // 新增：拖拽預覽元素
  //   console.log('✅ TileUIManager 初始化完成');
  // }
  constructor() {
    this.selectedTiles = new Set();
    this.draggedTile = null;
    this.blankTileModal = null;
    this.currentBlankTile = null;
    this.playedTiles = []; // 新增這行
    console.log('✅ TileUIManager 初始化完成');
  }

  // 替換 setupDragEvents 相關方法：
  setupDragEvents() {
    // 將在 createTileElement 中為每個磚塊設置拖拽
  }

  // 創建遊戲界面
  createGameInterface(gameData) {
    console.log('🎨 創建字母磚遊戲界面', gameData);

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
      console.error('❌ 找不到 game-area 元素');
      return;
    }

    gameArea.innerHTML = `
      <div class="rummi-game-container">
        <!-- 遊戲頂部資訊 -->
        <div class="game-header">
          <div class="game-info">
            <h2>🎮 Rummiword 遊戲</h2>
            <div class="game-stats">
              <span class="current-player">當前玩家: <strong>${gameData.currentPlayerName || '載入中...'}</strong></span>
              <span class="round-info">回合: ${gameData.round || 1}</span>
              <span class="pool-count">剩餘磚塊: <span id="pool-count">98</span></span>
            </div>
          </div>
          <div class="game-actions">
            <button class="control-btn test-btn" onclick="loadMockData()">
              🎲 載入測試手牌
            </button>
            <button class="control-btn test-btn" onclick="simulateDrawTile()">
              ➕ 模擬抽磚
            </button>
            <button class="control-btn test-btn" onclick="clearTestData()">
              🗑️ 清除測試數據
            </button>
            <button class="action-btn danger" onclick="leaveGame()">
              離開遊戲
            </button>
          </div>
        </div>

        <!-- 其他玩家資訊 -->
        <div class="other-players">
          <h3>🧑‍🤝‍🧑 其他玩家</h3>
          <div id="other-players-list" class="players-list">
            ${gameData.players ? gameData.players.map((player, index) => `
              <div class="player-info ${index === gameData.currentPlayer ? 'current' : ''}">
                <div class="player-name">${player.name || `玩家${index + 1}`}</div>
                <div class="player-stats">磚塊: 7 張</div>
              </div>
            `).join('') : '<div class="player-info">載入玩家資訊中...</div>'}
          </div>
        </div>

        <!-- 遊戲棋盤 -->
        <div class="game-board-container">
          <h3>📋 出牌區域</h3>
          <div id="play-area" class="play-area">
            <div class="drop-zone" id="word-area">
              <div class="drop-zone-placeholder">拖拽字母磚到這裡組成單詞</div>
              <div id="played-tiles" class="played-tiles"></div>
            </div>
          </div>
          <div class="play-area-actions">
            <button id="confirm-word-btn" class="control-btn" onclick="confirmPlayedWord()" disabled>
              ✅ 確認出牌
            </button>
            <button id="recall-tiles-btn" class="control-btn" onclick="recallTiles()">
              ↶ 收回磚塊
            </button>
          </div>
        </div>

        <!-- 我的手牌 -->
        <div class="my-hand-container">
          <div class="hand-header">
            <h3>🎯 我的手牌</h3>
            <div class="hand-stats">
              <span id="hand-count">0 張</span>
              <span id="hand-score">0 分</span>
            </div>
          </div>
          <div id="my-hand" class="hand-tiles">
            <div class="loading-hand">點擊 "🎲 載入測試手牌" 開始測試</div>
          </div>
        </div>

        <!-- 遊戲控制 -->
        <div class="game-controls">
          <button id="check-words-btn" class="control-btn" onclick="checkWords()">
            🔍 檢查單詞
          </button>
          <button id="clear-selection-btn" class="control-btn" onclick="clearSelection()">
            🗑️ 清除選擇
          </button>
          <button id="end-turn-btn" class="control-btn" onclick="endTurn()">
            ⏭️ 結束回合
          </button>
        </div>
        
        <!-- 說明文字 -->
        <div class="game-instructions">
          <p>🎯 點擊字母磚進行選擇，雙擊萬用字母磚(★)設置字母</p>
          <p>🔧 目前為測試模式，服務器端功能開發中</p>
        </div>
      </div>

      <!-- 萬用字母選擇模態框 -->
      <div id="blank-tile-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>選擇字母</h3>
            <span class="close" onclick="closeBlankTileModal()">&times;</span>
          </div>
          <div class="modal-body">
            <p>請選擇萬用字母磚要代表的字母：</p>
            <div id="letter-selection" class="letter-grid">
              <!-- 字母選擇按鈕將動態生成 -->
            </div>
          </div>
        </div>
      </div>
    `;

    // 初始化樣式
    this.addGameStyles();

    // 設置出牌區域的拖放事件
    setTimeout(() => {
      this.setupPlayAreaEvents();
    }, 100);

    console.log('✅ 字母磚遊戲界面創建完成');
  }

  // 新增方法：設置出牌區域事件 - 修正 event deprecation
  setupPlayAreaEvents() {
    const playArea = document.getElementById('play-area');
    if (!playArea) return;

    playArea.addEventListener('dragover', (dragOverEvent) => {
      dragOverEvent.preventDefault();
      dragOverEvent.dataTransfer.dropEffect = 'move';
    });

    playArea.addEventListener('drop', (dropEvent) => {
      dropEvent.preventDefault();
      this.handleTileDrop(dropEvent);
    });

    playArea.addEventListener('dragenter', (dragEnterEvent) => {
      dragEnterEvent.preventDefault();
      playArea.classList.add('drag-over');
    });

    playArea.addEventListener('dragleave', (dragLeaveEvent) => {
      // 只有當離開整個play-area時才移除高亮
      if (!playArea.contains(dragLeaveEvent.relatedTarget)) {
        playArea.classList.remove('drag-over');
      }
    });
  }

  // 新增方法：處理磚塊放置
  handleTileDrop(dropEvent) {
    const playedTilesEl = document.getElementById('played-tiles');
    if (!playedTilesEl || !this.draggedTile) return;

    console.log('📍 磚塊放置到出牌區:', this.draggedTile.letter);

    // 移除原始磚塊的選中狀態
    this.selectedTiles.delete(this.draggedTile.id);
    
    // 創建已出牌磚塊的副本
    const playedTileEl = this.createPlayedTileElement(this.draggedTile);
    playedTilesEl.appendChild(playedTileEl);
    
    // 隱藏手牌中的原始磚塊
    const originalTile = document.querySelector(`[data-tile-id="${this.draggedTile.id}"]`);
    if (originalTile && originalTile !== playedTileEl) {
      originalTile.style.display = 'none';
    }
    
    // 記錄已出牌磚塊
    if (!this.playedTiles) {
      this.playedTiles = [];
    }
    this.playedTiles.push(this.draggedTile);
    
    // 更新按鈕狀態
    this.updatePlayAreaButtons();
    
    // 移除放置區域高亮
    const playArea = document.getElementById('play-area');
    if (playArea) {
      playArea.classList.remove('drag-over');
    }
    
    if (typeof showMessage === 'function') {
      showMessage(`出牌: ${this.draggedTile.letter}`, 'success');
    }
  }

  // 新增方法：創建已出牌磚塊元素
  createPlayedTileElement(tile) {
    const tileEl = this.createTileElement(tile);
    tileEl.classList.add('played');
    tileEl.classList.remove('can-drag');
    tileEl.draggable = false;
    
    // 添加移除按鈕
    const removeBtn = document.createElement('div');
    removeBtn.className = 'tile-remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = '收回磚塊';
    removeBtn.onclick = (clickEvent) => {
      clickEvent.stopPropagation();
      this.recallSingleTile(tile.id);
    };
    
    tileEl.appendChild(removeBtn);
    return tileEl;
  }

  // 新增方法：更新出牌區域按鈕狀態
  updatePlayAreaButtons() {
    const confirmBtn = document.getElementById('confirm-word-btn');
    const recallBtn = document.getElementById('recall-tiles-btn');
    
    if (confirmBtn) {
      confirmBtn.disabled = !this.playedTiles || this.playedTiles.length === 0;
    }
    
    if (recallBtn) {
      recallBtn.style.display = this.playedTiles && this.playedTiles.length > 0 ? 'inline-block' : 'none';
    }
  }

  // 新增方法：收回單個磚塊
  recallSingleTile(tileId) {
    const playedTileEl = document.querySelector(`#played-tiles [data-tile-id="${tileId}"]`);
    const originalTileEl = document.querySelector(`#my-hand [data-tile-id="${tileId}"]`);
    
    if (playedTileEl) {
      playedTileEl.remove();
    }
    
    if (originalTileEl) {
      originalTileEl.style.display = '';
    }
    
    // 從已出牌列表中移除
    if (this.playedTiles) {
      this.playedTiles = this.playedTiles.filter(tile => tile.id !== tileId);
    }
    
    this.updatePlayAreaButtons();
    
    if (typeof showMessage === 'function') {
      showMessage('磚塊已收回手牌', 'info');
    }
  }

  // 添加遊戲樣式
  addGameStyles() {
    // 檢查是否已經添加過樣式
    if (document.getElementById('game-tiles-styles')) {
      console.log('⚠️ 樣式已存在，跳過添加');
      return;
    }

    console.log('🎨 添加字母磚遊戲樣式');
    const styles = document.createElement('style');
    styles.id = 'game-tiles-styles';
    styles.textContent = `
      /* 移除按鈕樣式 */
      .tile-remove-btn {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 18px;
        height: 18px;
        background: #dc3545;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .tile:hover .tile-remove-btn {
        opacity: 1;
      }

      .tile-remove-btn:hover {
        background: #c82333;
        transform: scale(1.1);
      }
      /* end of 移除按鈕樣式 */

      .rummi-game-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Arial', sans-serif;
      }

      .game-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .game-info h2 {
        margin: 0 0 10px 0;
        color: #333;
      }

      .game-stats {
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #666;
      }

      .game-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .action-btn, .control-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        font-size: 14px;
      }

      .action-btn.primary, .control-btn {
        background: #007bff;
        color: white;
      }

      .action-btn.primary:hover, .control-btn:hover {
        background: #0056b3;
      }

      .action-btn.secondary {
        background: #6c757d;
        color: white;
      }

      .action-btn.danger {
        background: #dc3545;
        color: white;
      }

      .action-btn.danger:hover {
        background: #c82333;
      }

      .test-btn {
        background: #28a745;
        color: white;
      }

      .test-btn:hover {
        background: #218838;
      }

      .other-players {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      .other-players h3 {
        margin: 0 0 10px 0;
      }

      .players-list {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .player-info {
        background: white;
        padding: 10px 15px;
        border-radius: 8px;
        border: 2px solid #dee2e6;
        min-width: 150px;
      }

      .player-info.current {
        border-color: #007bff;
        background: #e3f2fd;
      }

      .player-name {
        font-weight: bold;
        color: #333;
      }

      .player-stats {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }

      .game-board-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        min-height: 200px;
      }

      .game-board-container h3 {
        margin: 0 0 15px 0;
      }

      .game-board {
        background: white;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .board-placeholder {
        text-align: center;
        color: #666;
        font-size: 16px;
      }

      .my-hand-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      .hand-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .hand-header h3 {
        margin: 0;
      }

      .hand-stats {
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #666;
      }

      .hand-tiles {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        min-height: 80px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #dee2e6;
        justify-content: center;
      }

      .loading-hand {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        color: #666;
        font-style: italic;
      }

      .tile {
        width: 50px;
        height: 50px;
        background: linear-gradient(145deg, #ffeaa7, #fdcb6e);
        border: 2px solid #e17055;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s;
        position: relative;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .tile:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      .tile.selected {
        transform: translateY(-5px);
        border-color: #007bff;
        background: linear-gradient(145deg, #74b9ff, #0984e3);
        color: white;
      }

      .tile.blank {
        background: linear-gradient(145deg, #ddd, #bbb);
        border-color: #999;
      }

      .tile.blank.selected {
        background: linear-gradient(145deg, #74b9ff, #0984e3);
      }

      .tile-letter {
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
      }

      .tile-points {
        font-size: 10px;
        margin-top: 2px;
        opacity: 0.8;
      }

      .tile.blank .tile-points {
        display: none;
      }

      .game-controls {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .game-instructions {
        background: #e3f2fd;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
        font-size: 14px;
        color: #333;
      }

      .game-instructions p {
        margin: 5px 0;
      }

      /* 出牌區域樣式 */
      .play-area {
        background: white;
        border: 3px dashed #dee2e6;
        border-radius: 12px;
        min-height: 120px;
        margin-bottom: 15px;
        position: relative;
        transition: all 0.3s ease;
      }

      .play-area.drag-over {
        border-color: #007bff;
        background: #f0f8ff;
        box-shadow: 0 0 15px rgba(0, 123, 255, 0.3);
      }

      .drop-zone {
        padding: 20px;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        position: relative;
      }

      .drop-zone-placeholder {
        color: #999;
        font-style: italic;
        font-size: 16px;
        text-align: center;
        position: absolute;
        width: 100%;
        pointer-events: none;
      }

      .played-tiles {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        min-width: 100%;
      }

      .played-tiles:not(:empty) + .drop-zone-placeholder {
        display: none;
      }

      .play-area-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 15px;
      }

      /* 拖拽狀態樣式 */
      .tile.dragging {
        opacity: 0.5;
        transform: rotate(5deg);
        z-index: 1000;
        pointer-events: none;
      }

      .tile.played {
        border-color: #28a745;
        background: linear-gradient(145deg, #d4edda, #c3e6cb);
        box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
      }

      .tile.can-drag {
        cursor: grab;
      }

      .tile.can-drag:active {
        cursor: grabbing;
      }

      /* 拖拽預覽效果 */
      .drag-preview {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        transform: rotate(3deg) scale(1.1);
        opacity: 0.8;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      }

      /* 模態框樣式 */
      .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-content {
        background: white;
        padding: 0;
        border-radius: 10px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #dee2e6;
      }

      .modal-header h3 {
        margin: 0;
      }

      .close {
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        color: #999;
      }

      .close:hover {
        color: #333;
      }

      .modal-body {
        padding: 20px;
      }

      .letter-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        margin-top: 15px;
      }

      .letter-btn {
        padding: 15px;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        text-align: center;
        transition: all 0.2s;
      }

      .letter-btn:hover {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }

      /* 響應式設計 */
      @media (max-width: 768px) {
        .rummi-game-container {
          padding: 10px;
        }

        .game-header {
          flex-direction: column;
          gap: 15px;
          text-align: center;
        }

        .game-stats, .hand-stats {
          flex-direction: column;
          gap: 10px;
        }

        .players-list {
          justify-content: center;
        }

        .hand-tiles {
          justify-content: center;
        }

        .tile {
          width: 45px;
          height: 45px;
        }

        .letter-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .game-actions, .game-controls {
          flex-direction: column;
          align-items: center;
        }

        .action-btn, .control-btn {
          width: 90%;
          max-width: 300px;
        }
      }
    `;

    document.head.appendChild(styles);
    console.log('✅ 字母磚遊戲樣式添加完成');
  }

  // 更新我的手牌
  updateMyHand(handData) {
    if (!handData) {
      console.log('⚠️ 沒有手牌數據');
      return;
    }

    console.log('🎯 更新手牌數據', handData);

    const handEl = document.getElementById('my-hand');
    const handCountEl = document.getElementById('hand-count');
    const handScoreEl = document.getElementById('hand-score');

    if (!handEl) {
      console.error('❌ 找不到 my-hand 元素');
      return;
    }

    // 更新統計
    if (handCountEl) {
      handCountEl.textContent = `${handData.tiles.length} 張`;
    }
    if (handScoreEl && handData.statistics) {
      handScoreEl.textContent = `${handData.statistics.totalPoints} 分`;
    }

    // 渲染手牌磚塊
    handEl.innerHTML = '';

    if (handData.tiles.length === 0) {
      handEl.innerHTML = '<div class="loading-hand">手牌為空</div>';
      return;
    }

    handData.tiles.forEach(tile => {
      const tileEl = this.createTileElement(tile);
      handEl.appendChild(tileEl);
    });

    console.log('✅ 手牌更新完成');
  }

  // 創建字母磚元素 - 修正 event deprecation 問題
  createTileElement(tile) {
    const tileEl = document.createElement('div');
    tileEl.className = `tile ${tile.isBlank ? 'blank' : ''} can-drag`;
    tileEl.dataset.tileId = tile.id;
    tileEl.draggable = true;

    // 字母顯示
    const letterEl = document.createElement('div');
    letterEl.className = 'tile-letter';
    letterEl.textContent = tile.isBlank ? (tile.selectedLetter || '★') : tile.letter;

    // 分數顯示
    const pointsEl = document.createElement('div');
    pointsEl.className = 'tile-points';
    pointsEl.textContent = tile.isBlank ? '' : tile.points;

    tileEl.appendChild(letterEl);
    tileEl.appendChild(pointsEl);

    // 修正：使用箭頭函數避免 event 參數 deprecation 警告
    tileEl.addEventListener('click', (e) => this.handleTileClick(e, tile));
    
    // 拖拽事件處理 - 修正版本
    tileEl.addEventListener('dragstart', (dragEvent) => {
      console.log('🎯 開始拖拽磚塊:', tile.letter);
      
      this.draggedTile = { ...tile, element: tileEl };
      
      // 設置拖拽數據
      dragEvent.dataTransfer.effectAllowed = 'move';
      dragEvent.dataTransfer.setData('text/plain', tile.id);
      dragEvent.dataTransfer.setData('application/json', JSON.stringify(tile));
      
      // 添加拖拽樣式
      tileEl.classList.add('dragging');
      
      // 高亮所有可放置區域
      this.highlightDropZones(true);
    });

    tileEl.addEventListener('dragend', (dragEvent) => {
      console.log('🏁 拖拽結束:', tile.letter);
      
      // 移除拖拽樣式
      tileEl.classList.remove('dragging');
      
      // 移除放置區域高亮
      this.highlightDropZones(false);
      
      this.draggedTile = null;
    });

    // 萬用字母雙擊事件
    if (tile.isBlank) {
      tileEl.addEventListener('dblclick', (clickEvent) => this.handleBlankTileDoubleClick(clickEvent, tile));
    }

    return tileEl;
  }

  // 新增：增強的拖拽開始處理
  handleDragStart(event, tile, tileElement) {
    console.log('🎯 開始拖拽磚塊:', tile.letter);
    
    this.draggedTile = { ...tile, element: tileElement };
    
    // 設置拖拽數據
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tile.id);
    event.dataTransfer.setData('application/json', JSON.stringify(tile));
    
    // 添加拖拽樣式
    tileElement.classList.add('dragging');
    
    // 創建自定義拖拽預覽
    this.createDragPreview(tileElement, event);
    
    // 高亮所有可放置區域
    this.highlightDropZones(true);
  }

  // 新增：創建拖拽預覽
  createDragPreview(tileElement, event) {
    const preview = tileElement.cloneNode(true);
    preview.classList.add('drag-preview');
    preview.classList.remove('dragging', 'selected');
    document.body.appendChild(preview);
    
    this.dragPreview = preview;
    
    // 設置預覽位置跟隨鼠標
    const updatePreviewPosition = (e) => {
      if (this.dragPreview) {
        this.dragPreview.style.left = (e.clientX + 10) + 'px';
        this.dragPreview.style.top = (e.clientY + 10) + 'px';
      }
    };
    
    document.addEventListener('dragover', updatePreviewPosition);
    
    // 清理事件監聽器
    setTimeout(() => {
      document.removeEventListener('dragover', updatePreviewPosition);
    }, 100);
  }

  // 新增：拖拽結束處理
  handleDragEnd(event, tile, tileElement) {
    console.log('🏁 拖拽結束:', tile.letter);
    
    // 移除拖拽樣式
    tileElement.classList.remove('dragging');
    
    // 清理拖拽預覽
    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview);
      this.dragPreview = null;
    }
    
    // 移除放置區域高亮
    this.highlightDropZones(false);
    
    this.draggedTile = null;
  }

  // 新增：高亮放置區域
  highlightDropZones(highlight) {
    const playArea = document.getElementById('play-area');
    if (playArea) {
      if (highlight) {
        playArea.classList.add('drag-over');
      } else {
        playArea.classList.remove('drag-over');
      }
    }
  }

  // 處理字母磚點擊
  handleTileClick(event, tile) {
    event.preventDefault();
    const tileEl = event.currentTarget;

    if (this.selectedTiles.has(tile.id)) {
      // 取消選擇
      this.selectedTiles.delete(tile.id);
      tileEl.classList.remove('selected');
    } else {
      // 選擇
      this.selectedTiles.add(tile.id);
      tileEl.classList.add('selected');
    }

    console.log('🎯 選中的磚塊:', Array.from(this.selectedTiles));

    // 顯示消息
    if (typeof showMessage === 'function') {
      const action = tileEl.classList.contains('selected') ? '選中' : '取消選中';
      showMessage(`${action}字母磚: ${tile.letter}`, 'info');
    }
  }

  // 處理拖拽開始
  handleDragStart(event, tile) {
    this.draggedTile = tile;
    event.dataTransfer.setData('text/plain', tile.id);
    event.dataTransfer.effectAllowed = 'move';

    // 添加拖拽樣式
    setTimeout(() => {
      event.target.style.opacity = '0.5';
    }, 0);
  }

  // 處理拖拽結束
  handleDragEnd(event, tile) {
    this.draggedTile = null;
    event.target.style.opacity = '1';
  }

  // 處理萬用字母雙擊
  handleBlankTileDoubleClick(event, tile) {
    event.preventDefault();
    console.log('🌟 雙擊萬用字母磚', tile);
    this.showBlankTileModal(tile);
  }

  // 顯示萬用字母選擇模態框
  showBlankTileModal(tile) {
    const modal = document.getElementById('blank-tile-modal');
    const letterSelection = document.getElementById('letter-selection');

    if (!modal || !letterSelection) {
      console.error('❌ 找不到模態框元素');
      return;
    }

    // 生成字母選擇按鈕
    letterSelection.innerHTML = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let letter of letters) {
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.onclick = () => this.selectBlankTileLetter(tile, letter);
      letterSelection.appendChild(btn);
    }

    // 如果已有選擇，高亮顯示
    if (tile.selectedLetter) {
      const selectedBtn = letterSelection.querySelector(`button:nth-child(${letters.indexOf(tile.selectedLetter) + 1})`);
      if (selectedBtn) {
        selectedBtn.style.background = '#007bff';
        selectedBtn.style.color = 'white';
      }
    }

    modal.style.display = 'flex';
    this.currentBlankTile = tile;
  }

  // 選擇萬用字母
  selectBlankTileLetter(tile, letter) {
    console.log(`🌟 設置萬用字母: ${tile.id} -> ${letter}`);

    // 本地更新
    tile.selectedLetter = letter;

    // 更新UI
    const tileEl = document.querySelector(`[data-tile-id="${tile.id}"] .tile-letter`);
    if (tileEl) {
      tileEl.textContent = letter;
    }

    this.closeBlankTileModal();

    if (typeof showMessage === 'function') {
      showMessage(`萬用字母設置為 ${letter}`, 'success');
    }
  }

  // 關閉萬用字母模態框
  closeBlankTileModal() {
    const modal = document.getElementById('blank-tile-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentBlankTile = null;
  }

  // 更新其他玩家資訊
  updateOtherPlayers(players, currentPlayerId) {
    const playersListEl = document.getElementById('other-players-list');
    if (!playersListEl) return;

    playersListEl.innerHTML = '';

    players.forEach(player => {
      if (player.id === gameState.currentPlayer?.playerId) return; // 跳過自己

      const playerEl = document.createElement('div');
      playerEl.className = `player-info ${player.id === currentPlayerId ? 'current' : ''}`;

      playerEl.innerHTML = `
        <div class="player-name">${player.name}</div>
        <div class="player-stats">
          磚塊: ${player.tileCount || 7} 張
          ${player.id === currentPlayerId ? ' (當前回合)' : ''}
        </div>
      `;

      playersListEl.appendChild(playerEl);
    });
  }

  // 更新遊戲狀態
  updateGameState(gameStateData) {
    console.log('🎮 更新遊戲狀態', gameStateData);

    // 更新剩餘磚塊數
    const poolCountEl = document.getElementById('pool-count');
    if (poolCountEl && gameStateData.poolRemaining !== undefined) {
      poolCountEl.textContent = gameStateData.poolRemaining;
    }

    // 更新其他玩家資訊
    if (gameStateData.players) {
      this.updateOtherPlayers(gameStateData.players, gameStateData.currentPlayerId);
    }
  }

  // 清除選擇
  clearSelection() {
    this.selectedTiles.clear();

    // 移除所有選中樣式
    document.querySelectorAll('.tile.selected').forEach(tileEl => {
      tileEl.classList.remove('selected');
    });

    console.log('🗑️ 已清除所有選擇');
  }

  // 獲取選中的磚塊
  getSelectedTiles() {
    return Array.from(this.selectedTiles);
  }

  // 新增：高亮放置區域
  highlightDropZones(highlight) {
    const playArea = document.getElementById('play-area');
    if (playArea) {
      if (highlight) {
        playArea.classList.add('drag-over');
      } else {
        playArea.classList.remove('drag-over');
      }
    }
  }
}

// 創建全局 UI 管理器實例
let tileUIManager;

// 確保在 DOM 載入後創建實例
function initializeTileUIManager() {
  if (!tileUIManager) {
    tileUIManager = new TileUIManager();
    console.log('✅ 全局 tileUIManager 創建完成');
  }
  return tileUIManager;
}

// 立即嘗試創建實例
tileUIManager = new TileUIManager();

// 導出到全局
if (typeof window !== 'undefined') {
  window.tileUIManager = tileUIManager;
  window.TileUIManager = TileUIManager;
  window.initializeTileUIManager = initializeTileUIManager;

  console.log('✅ TileUIManager 已導出到全局作用域');
}

console.log('✅ 修正版字母磚界面載入完成');