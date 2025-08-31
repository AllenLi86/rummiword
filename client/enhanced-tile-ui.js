// ========== enhanced-tile-ui.js ==========
// 增強版字母磚 UI 管理器，整合拖拽功能

class EnhancedTileUIManager {
  constructor() {
    this.selectedTiles = new Set();
    this.currentBlankTile = null;
    this.dragDropManager = null;
    this.gameBoard = null;
    this.gameState = {
      currentPlayer: null,
      myHand: null,
      gameData: null
    };
    
    console.log('✨ 增強版字母磚 UI 管理器初始化完成');
  }

  // 初始化系統
  initialize() {
    // 初始化拖拽管理器
    this.dragDropManager = new DragDropManager();
    this.dragDropManager.initialize();
    
    // 初始化遊戲棋盤
    this.gameBoard = new GameBoard();
    
    // 綁定事件監聽器
    this.bindEventListeners();
    
    console.log('🚀 增強版字母磚系統初始化完成');
  }

  // 綁定事件監聽器
  bindEventListeners() {
    // 監聽拖拽事件
    document.addEventListener('drag-start', (e) => {
      console.log('🎯 拖拽開始事件:', e.detail);
    });

    document.addEventListener('tile-dropped', (e) => {
      console.log('📥 磚塊放置事件:', e.detail);
      this.handleTileDropped(e.detail);
    });

    document.addEventListener('board-updated', (e) => {
      console.log('📋 棋盤更新事件:', e.detail);
    });

    // 監聽磚塊點擊事件
    document.addEventListener('click', (e) => {
      if (e.target.closest('.tile')) {
        this.handleTileClick(e);
      }
    });

    // 監聽磚塊雙擊事件（萬用字母）
    document.addEventListener('dblclick', (e) => {
      if (e.target.closest('.tile')) {
        this.handleTileDoubleClick(e);
      }
    });
  }

  // 創建遊戲界面
  createGameInterface(gameData) {
    console.log('🎨 創建增強版字母磚遊戲界面', gameData);
    
    this.gameState.gameData = gameData;
    
    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
      console.error('❌ 找不到 game-area 元素');
      return;
    }

    // 添加樣式
    this.addGameStyles();

    gameArea.innerHTML = `
      <div class="rummi-game-container enhanced">
        <!-- 遊戲頂部資訊 -->
        <div class="game-header">
          <div class="game-info">
            <h2>🎮 Rummiword 遊戲 <span class="version-badge">v3.0 - 拖拽版</span></h2>
            <div class="game-stats">
              <span class="current-player">當前玩家: <strong>${gameData.currentPlayerName || '載入中...'}</strong></span>
              <span class="round-info">回合: ${gameData.round || 1}</span>
              <span class="pool-count">剩餘磚塊: <span id="pool-count">98</span></span>
            </div>
          </div>
          <div class="game-actions">
            <button class="control-btn test-btn" onclick="enhancedTileUI.loadMockData()">
              🎲 載入測試手牌
            </button>
            <button class="control-btn test-btn" onclick="enhancedTileUI.simulateDrawTile()">
              ➕ 模擬抽磚
            </button>
            <button class="control-btn test-btn" onclick="enhancedTileUI.clearTestData()">
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
        <div id="board-container" class="game-board-container">
          <!-- 棋盤將由 GameBoard 組件渲染 -->
        </div>

        <!-- 我的手牌 -->
        <div class="my-hand-container enhanced">
          <div class="hand-header">
            <h3>🎯 我的手牌</h3>
            <div class="hand-stats">
              <span id="hand-count">0 張</span>
              <span id="hand-score">0 分</span>
              <span id="selected-count">已選: 0</span>
            </div>
          </div>
          <div id="my-hand" class="hand-tiles enhanced">
            <div class="loading-hand">點擊 "🎲 載入測試手牌" 開始測試拖拽功能</div>
          </div>
        </div>

        <!-- 遊戲控制 -->
        <div class="game-controls enhanced">
          <div class="control-group">
            <button id="check-words-btn" class="control-btn primary" onclick="enhancedTileUI.checkWords()">
              🔍 檢查單詞
            </button>
            <button id="validate-board-btn" class="control-btn primary" onclick="enhancedTileUI.validateBoard()">
              ✅ 驗證棋盤
            </button>
          </div>
          <div class="control-group">
            <button id="clear-selection-btn" class="control-btn secondary" onclick="enhancedTileUI.clearSelection()">
              🗑️ 清除選擇
            </button>
            <button id="recall-tiles-btn" class="control-btn secondary" onclick="enhancedTileUI.recallTiles()">
              ↶ 召回磚塊
            </button>
          </div>
          <div class="control-group">
            <button id="end-turn-btn" class="control-btn success" onclick="enhancedTileUI.endTurn()">
              ⏭️ 結束回合
            </button>
          </div>
        </div>
        
        <!-- 操作說明 -->
        <div class="game-instructions enhanced">
          <h4>🎯 操作說明</h4>
          <div class="instruction-grid">
            <div class="instruction-item">
              <span class="instruction-icon">🖱️</span>
              <span>拖拽字母磚到棋盤組成單詞</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">👆</span>
              <span>點擊磚塊進行選擇</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">⭐</span>
              <span>雙擊萬用字母磚(★)設置字母</span>
            </div>
            <div class="instruction-item">
              <span class="instruction-icon">📱</span>
              <span>支援手機觸控拖拽</span>
            </div>
          </div>
          <p class="dev-note">🔧 目前為測試模式，服務器端功能開發中</p>
        </div>
      </div>

      <!-- 萬用字母選擇模態框 -->
      <div id="blank-tile-modal" class="modal enhanced" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🌟 選擇字母</h3>
            <span class="close" onclick="enhancedTileUI.closeBlankTileModal()">&times;</span>
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

    // 初始化棋盤
    setTimeout(() => {
      this.gameBoard.initialize('board-container', this.dragDropManager);
      this.setupHandDropTarget();
    }, 100);

    console.log('✅ 增強版字母磚遊戲界面創建完成');
  }

  // 設置手牌區域為放置目標
  setupHandDropTarget() {
    const handContainer = document.getElementById('my-hand');
    if (handContainer && this.dragDropManager) {
      this.dragDropManager.makeDropTarget(handContainer, {
        acceptTiles: true,
        validateDrop: (target, tileData) => true, // 手牌總是接受磚塊
        onDrop: (event, tileData, target, source) => this.handleHandDrop(event, tileData, target, source)
      });
    }
  }

  // 處理磚塊放置到手牌
  handleHandDrop(event, tileData, target, source) {
    console.log('🏠 磚塊回到手牌:', tileData);
    
    // 更新磚塊狀態
    tileData.position = 'hand';
    tileData.boardX = null;
    tileData.boardY = null;

    // 如果來源是棋盤，需要從棋盤移除
    if (source && source.classList.contains('board-cell')) {
      const position = source.dataset.position;
      if (position) {
        this.gameBoard.removeTile(position);
      }
    }

    return true;
  }

  // 處理磚塊放置事件
  handleTileDropped(detail) {
    const { tileData, target, source } = detail;
    
    // 更新手牌統計
    this.updateHandStats();
    
    // 清除選擇狀態
    this.clearSelection();
  }

  // 載入模擬數據
  loadMockData() {
    console.log('🎲 載入增強版測試手牌');
    
    const mockData = this.generateMockHandData();
    this.displayHand(mockData);
    this.dragDropManager?.showFeedback('測試手牌已載入，可以開始拖拽測試！', 'success');
  }

  // 生成模擬手牌數據
  generateMockHandData() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const points = [1, 3, 3, 2, 1, 4, 2, 4];
    
    const tiles = letters.map((letter, index) => ({
      id: `enhanced_tile_${index + 1}`,
      letter: letter,
      points: points[index],
      isBlank: false,
      selectedLetter: null,
      position: 'hand',
      getDisplayLetter: function() {
        return this.isBlank && this.selectedLetter ? this.selectedLetter : this.letter;
      }
    }));

    // 添加兩個萬用字母磚
    tiles.push({
      id: 'enhanced_tile_blank_1',
      letter: '★',
      points: 0,
      isBlank: true,
      selectedLetter: null,
      position: 'hand',
      getDisplayLetter: function() {
        return this.isBlank && this.selectedLetter ? this.selectedLetter : this.letter;
      }
    });

    tiles.push({
      id: 'enhanced_tile_blank_2',
      letter: '★',
      points: 0,
      isBlank: true,
      selectedLetter: null,
      position: 'hand',
      getDisplayLetter: function() {
        return this.isBlank && this.selectedLetter ? this.selectedLetter : this.letter;
      }
    });

    return {
      tiles: tiles,
      statistics: {
        totalTiles: tiles.length,
        totalPoints: tiles.reduce((sum, tile) => sum + tile.points, 0),
        letters: {}
      }
    };
  }

  // 顯示手牌
  displayHand(handData) {
    const handContainer = document.getElementById('my-hand');
    if (!handContainer) {
      console.error('❌ 找不到手牌容器');
      return;
    }

    if (!handData || !handData.tiles || handData.tiles.length === 0) {
      handContainer.innerHTML = '<div class="loading-hand">沒有手牌數據</div>';
      return;
    }

    console.log('🎯 顯示手牌:', handData);
    this.gameState.myHand = handData;

    // 生成磚塊 HTML
    const tilesHTML = handData.tiles.map(tile => this.createTileHTML(tile)).join('');
    handContainer.innerHTML = tilesHTML;

    // 為每個磚塊設置拖拽功能
    handData.tiles.forEach(tile => {
      const tileElement = document.getElementById(tile.id);
      if (tileElement) {
        this.dragDropManager.makeDraggable(tileElement, tile);
      }
    });

    // 更新手牌統計
    this.updateHandStats();

    console.log('✅ 手牌顯示完成，拖拽功能已啟用');
  }

  // 創建磚塊 HTML
  createTileHTML(tile) {
    const isSelected = this.selectedTiles.has(tile.id);
    const displayLetter = tile.getDisplayLetter ? tile.getDisplayLetter() : tile.letter;
    
    return `
      <div 
        class="tile ${tile.isBlank ? 'blank' : ''} ${isSelected ? 'selected' : ''}" 
        id="${tile.id}"
        data-tile-id="${tile.id}"
        data-letter="${tile.letter}"
        data-points="${tile.points}"
        data-is-blank="${tile.isBlank}"
      >
        <div class="tile-letter">${displayLetter}</div>
        ${!tile.isBlank ? `<div class="tile-points">${tile.points}</div>` : ''}
        ${tile.isBlank && tile.selectedLetter ? '<div class="blank-indicator">✓</div>' : ''}
      </div>
    `;
  }

  // 處理磚塊點擊
  handleTileClick(event) {
    const tileElement = event.target.closest('.tile');
    if (!tileElement) return;

    const tileId = tileElement.dataset.tileId;
    
    // 切換選擇狀態
    if (this.selectedTiles.has(tileId)) {
      this.selectedTiles.delete(tileId);
      tileElement.classList.remove('selected');
    } else {
      this.selectedTiles.add(tileId);
      tileElement.classList.add('selected');
    }

    this.updateSelectedCount();
    console.log('👆 磚塊選擇狀態更新:', Array.from(this.selectedTiles));
  }

  // 處理磚塊雙擊（萬用字母）
  handleTileDoubleClick(event) {
    const tileElement = event.target.closest('.tile');
    if (!tileElement) return;

    const isBlank = tileElement.dataset.isBlank === 'true';
    if (!isBlank) return;

    const tileId = tileElement.dataset.tileId;
    this.currentBlankTile = tileId;
    this.showBlankTileModal();
  }

  // 顯示萬用字母選擇模態框
  showBlankTileModal() {
    const modal = document.getElementById('blank-tile-modal');
    if (!modal) return;

    // 生成字母選擇按鈕
    const letterGrid = document.getElementById('letter-selection');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    letterGrid.innerHTML = letters.map(letter => `
      <button class="letter-btn" onclick="enhancedTileUI.selectBlankLetter('${letter}')">
        ${letter}
      </button>
    `).join('');

    modal.style.display = 'flex';
  }

  // 選擇萬用字母
  selectBlankLetter(letter) {
    if (!this.currentBlankTile) return;

    // 找到對應的磚塊數據
    const tileData = this.gameState.myHand?.tiles.find(t => t.id === this.currentBlankTile);
    if (tileData) {
      tileData.selectedLetter = letter;
      
      // 更新 DOM 顯示
      const tileElement = document.getElementById(this.currentBlankTile);
      if (tileElement) {
        const letterElement = tileElement.querySelector('.tile-letter');
        if (letterElement) {
          letterElement.textContent = letter;
        }
        
        // 添加已設置指示器
        if (!tileElement.querySelector('.blank-indicator')) {
          const indicator = document.createElement('div');
          indicator.className = 'blank-indicator';
          indicator.textContent = '✓';
          tileElement.appendChild(indicator);
        }
      }
      
      console.log(`🌟 萬用字母磚 ${this.currentBlankTile} 設置為 ${letter}`);
      this.dragDropManager?.showFeedback(`萬用字母已設置為 ${letter}`, 'success');
    }

    this.closeBlankTileModal();
  }

  // 關閉萬用字母模態框
  closeBlankTileModal() {
    const modal = document.getElementById('blank-tile-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentBlankTile = null;
  }

  // 模擬抽磚
  simulateDrawTile() {
    if (!this.gameState.myHand) {
      this.dragDropManager?.showFeedback('請先載入測試手牌', 'error');
      return;
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const points = Math.floor(Math.random() * 10) + 1;

    const newTile = {
      id: `simulated_tile_${Date.now()}`,
      letter: randomLetter,
      points: points,
      isBlank: Math.random() < 0.1, // 10% 機率是萬用字母
      selectedLetter: null,
      position: 'hand',
      getDisplayLetter: function() {
        return this.isBlank && this.selectedLetter ? this.selectedLetter : this.letter;
      }
    };

    // 如果是萬用字母
    if (newTile.isBlank) {
      newTile.letter = '★';
      newTile.points = 0;
    }

    this.gameState.myHand.tiles.push(newTile);
    this.displayHand(this.gameState.myHand);
    
    this.dragDropManager?.showFeedback(`抽到新磚塊: ${newTile.letter} (${newTile.points}分)`, 'success');
  }

  // 清除測試數據
  clearTestData() {
    const handContainer = document.getElementById('my-hand');
    if (handContainer) {
      handContainer.innerHTML = '<div class="loading-hand">測試數據已清除</div>';
    }

    this.gameState.myHand = null;
    this.selectedTiles.clear();
    this.gameBoard?.clearBoard();
    
    this.updateHandStats();
    this.dragDropManager?.showFeedback('測試數據已清除', 'info');
  }

  // 清除選擇
  clearSelection() {
    this.selectedTiles.clear();
    document.querySelectorAll('.tile.selected').forEach(tile => {
      tile.classList.remove('selected');
    });
    this.updateSelectedCount();
    
    this.dragDropManager?.showFeedback('選擇已清除', 'info');
  }

  // 召回磚塊（從棋盤回到手牌）
  recallTiles() {
    if (this.selectedTiles.size === 0) {
      this.dragDropManager?.showFeedback('請先選擇要召回的磚塊', 'info');
      return;
    }

    let recalledCount = 0;
    const handContainer = document.getElementById('my-hand');
    
    this.selectedTiles.forEach(tileId => {
      const tileElement = document.getElementById(tileId);
      if (tileElement && !tileElement.closest('.hand-tiles')) {
        // 磚塊在棋盤上，移回手牌
        handContainer.appendChild(tileElement);
        recalledCount++;

        // 更新磚塊數據
        const tileData = this.gameState.myHand?.tiles.find(t => t.id === tileId);
        if (tileData) {
          tileData.position = 'hand';
          tileData.boardX = null;
          tileData.boardY = null;
        }

        // 從棋盤狀態中移除
        const sourceCell = document.querySelector(`[data-position] .tile[data-tile-id="${tileId}"]`)?.closest('.board-cell');
        if (sourceCell) {
          const position = sourceCell.dataset.position;
          this.gameBoard?.removeTile(position);
        }
      }
    });

    if (recalledCount > 0) {
      this.clearSelection();
      this.dragDropManager?.showFeedback(`已召回 ${recalledCount} 個磚塊`, 'success');
    } else {
      this.dragDropManager?.showFeedback('沒有磚塊需要召回', 'info');
    }
  }

  // 檢查單詞
  checkWords() {
    const result = this.gameBoard?.validateWords();
    
    if (result) {
      const { valid, invalid } = result;
      let message = '';
      
      if (valid.length > 0) {
        message += `有效單詞: ${valid.map(w => w.word).join(', ')} `;
      }
      if (invalid.length > 0) {
        message += `無效單詞: ${invalid.map(w => w.word).join(', ')}`;
      }
      
      console.log('🔍 單詞檢查結果:', result);
    } else {
      this.dragDropManager?.showFeedback('棋盤上沒有單詞', 'info');
    }
  }

  // 驗證棋盤
  validateBoard() {
    const boardState = this.gameBoard?.getBoardState();
    console.log('📋 當前棋盤狀態:', boardState);
    
    if (!boardState || boardState.tiles.length === 0) {
      this.dragDropManager?.showFeedback('棋盤是空的', 'info');
      return;
    }

    this.dragDropManager?.showFeedback(
      `棋盤驗證：${boardState.tiles.length} 個磚塊，${boardState.words?.length || 0} 個單詞，${boardState.score} 分`, 
      'success'
    );
  }

  // 結束回合
  endTurn() {
    const boardState = this.gameBoard?.getBoardState();
    
    if (!boardState || boardState.tiles.length === 0) {
      this.dragDropManager?.showFeedback('請先在棋盤上放置磚塊', 'error');
      return;
    }

    // 這裡可以添加回合結束邏輯
    this.dragDropManager?.showFeedback('回合結束功能開發中', 'info');
  }

  // 更新手牌統計
  updateHandStats() {
    if (!this.gameState.myHand) return;

    const handCountEl = document.getElementById('hand-count');
    const handScoreEl = document.getElementById('hand-score');
    
    const tilesInHand = this.gameState.myHand.tiles.filter(tile => tile.position === 'hand');
    const totalScore = tilesInHand.reduce((sum, tile) => sum + tile.points, 0);

    if (handCountEl) handCountEl.textContent = `${tilesInHand.length} 張`;
    if (handScoreEl) handScoreEl.textContent = `${totalScore} 分`;
  }

  // 更新選擇計數
  updateSelectedCount() {
    const selectedCountEl = document.getElementById('selected-count');
    if (selectedCountEl) {
      selectedCountEl.textContent = `已選: ${this.selectedTiles.size}`;
    }
  }

  // 添加增強版遊戲樣式
  addGameStyles() {
    if (document.getElementById('enhanced-game-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'enhanced-game-styles';
    styles.textContent = `
      /* 增強版遊戲樣式 */
      .rummi-game-container.enhanced {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Segoe UI', 'Arial', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        color: #333;
      }

      .version-badge {
        background: #28a745;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: normal;
        margin-left: 10px;
      }

      .game-header {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      .my-hand-container.enhanced {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border: 2px solid rgba(255,255,255,0.3);
      }

      .hand-tiles.enhanced {
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border: 2px solid rgba(102, 126, 234, 0.3);
        border-radius: 12px;
        min-height: 100px;
        padding: 20px;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
      }

      .tile {
        width: 55px;
        height: 55px;
        background: linear-gradient(145deg, #ffeaa7, #fdcb6e);
        border: 3px solid #e17055;
        border-radius: 12px;
        box-shadow: 
          0 4px 8px rgba(0,0,0,0.2),
          inset 0 2px 4px rgba(255,255,255,0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .tile::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent);
        border-radius: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .tile:hover::before {
        opacity: 1;
      }

      .tile:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 
          0 8px 16px rgba(0,0,0,0.3),
          inset 0 2px 4px rgba(255,255,255,0.4);
      }

      .tile.selected {
        transform: translateY(-5px) scale(1.08);
        border-color: #007bff;
        background: linear-gradient(145deg, #74b9ff, #0984e3);
        color: white;
        box-shadow: 
          0 10px 20px rgba(0,123,255,0.4),
          inset 0 2px 4px rgba(255,255,255,0.2);
      }

      .tile.blank {
        background: linear-gradient(145deg, #e9ecef, #adb5bd);
        border-color: #6c757d;
      }

      .tile.blank.selected {
        background: linear-gradient(145deg, #74b9ff, #0984e3);
        border-color: #007bff;
      }

      .blank-indicator {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: #28a745;
        border-radius: 50%;
        color: white;
        font-size: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .game-controls.enhanced {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 30px 0;
        flex-wrap: wrap;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 20px;
      }

      .control-group {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .control-btn.primary {
        background: linear-gradient(145deg, #007bff, #0056b3);
        box-shadow: 0 4px 15px rgba(0,123,255,0.4);
      }

      .control-btn.secondary {
        background: linear-gradient(145deg, #6c757d, #545b62);
        box-shadow: 0 4px 15px rgba(108,117,125,0.4);
      }

      .control-btn.success {
        background: linear-gradient(145deg, #28a745, #1e7e34);
        box-shadow: 0 4px 15px rgba(40,167,69,0.4);
      }

      .control-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }

      .game-instructions.enhanced {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        border: none;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        border-left: 4px solid #667eea;
      }

      .instruction-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 15px 0;
      }

      .instruction-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: rgba(102, 126, 234, 0.1);
        border-radius: 8px;
        transition: transform 0.2s ease;
      }

      .instruction-item:hover {
        transform: translateY(-2px);
      }

      .instruction-icon {
        font-size: 20px;
        width: 30px;
        text-align: center;
      }

      .dev-note {
        color: #666;
        font-style: italic;
        text-align: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(0,0,0,0.1);
      }

      .modal.enhanced .modal-content {
        background: rgba(255,255,255,0.98);
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.3);
      }

      .letter-btn {
        background: linear-gradient(145deg, #f8f9fa, #e9ecef);
        border: 2px solid #dee2e6;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .letter-btn:hover {
        background: linear-gradient(145deg, #007bff, #0056b3);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,123,255,0.4);
      }

      /* 響應式設計 */
      @media (max-width: 768px) {
        .rummi-game-container.enhanced {
          padding: 15px;
          border-radius: 15px;
        }
        
        .tile {
          width: 45px;
          height: 45px;
        }
        
        .tile-letter {
          font-size: 16px;
        }
        
        .control-group {
          flex-direction: column;
          width: 100%;
        }
        
        .control-btn {
          width: 100%;
          margin: 0;
        }
        
        .instruction-grid {
          grid-template-columns: 1fr;
        }
        
        .game-controls.enhanced {
          flex-direction: column;
          gap: 15px;
        }
      }
    `;

    document.head.appendChild(styles);
    console.log('🎨 增強版遊戲樣式已載入');
  }

  // 獲取當前狀態
  getGameState() {
    return {
      hand: this.gameState.myHand,
      board: this.gameBoard?.getBoardState(),
      selected: Array.from(this.selectedTiles)
    };
  }
}

// 導出到全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedTileUIManager;
} else {
  window.EnhancedTileUIManager = EnhancedTileUIManager;
}

console.log('✨ 增強版字母磚 UI 管理器模組已載入');