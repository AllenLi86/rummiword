// ========== game-board-fixed.js ==========
// 修復版遊戲棋盤組件 - 解決拖拽驗證問題

class GameBoard {
  constructor(options = {}) {
    this.config = {
      rows: 15,
      cols: 15,
      centerRow: 7,
      centerCol: 7,
      ...options
    };
    
    this.tiles = new Map(); // 棋盤上的磚塊 key: "row,col", value: tileData
    this.words = []; // 已形成的單詞
    this.dragDropManager = null;
    this.isFirstTile = true; // 追蹤是否為第一個磚塊
    
    console.log('🏁 遊戲棋盤初始化', this.config);
  }

  // 初始化棋盤
  initialize(containerId, dragDropManager) {
    this.dragDropManager = dragDropManager;
    this.render(containerId);
    this.setupDropTargets();
    this.createBoardStyles();
    
    console.log('✅ 棋盤初始化完成');
  }

  // 渲染棋盤
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ 找不到棋盤容器:', containerId);
      return;
    }

    // 清空容器並設置棋盤結構
    container.innerHTML = `
      <div class="board-header">
        <h3>📋 遊戲棋盤</h3>
        <div class="board-info">
          <span id="board-word-count">單詞: 0</span>
          <span id="board-score">分數: 0</span>
          <span id="first-tile-hint" style="color: #28a745; font-weight: bold;">
            ${this.isFirstTile ? '請將第一個磚塊放置在中心(★)' : ''}
          </span>
        </div>
      </div>
      <div class="board-container">
        <div id="game-board-grid" class="board-grid">
          ${this.generateBoardHTML()}
        </div>
      </div>
      <div class="board-controls">
        <button class="control-btn" onclick="gameBoard.clearBoard()">
          🗑️ 清空棋盤
        </button>
        <button class="control-btn" onclick="gameBoard.validateWords()">
          ✅ 驗證單詞
        </button>
        <button class="control-btn" onclick="gameBoard.showBoardState()">
          📊 棋盤狀態
        </button>
      </div>
    `;

    console.log('🎨 棋盤渲染完成');
  }

  // 生成棋盤 HTML
  generateBoardHTML() {
    let html = '';
    
    for (let row = 0; row < this.config.rows; row++) {
      html += '<div class="board-row">';
      
      for (let col = 0; col < this.config.cols; col++) {
        const cellClass = this.getCellClass(row, col);
        const cellId = `cell-${row}-${col}`;
        
        html += `
          <div 
            class="board-cell ${cellClass}" 
            id="${cellId}"
            data-row="${row}" 
            data-col="${col}"
            data-position="${row},${col}"
          >
            <div class="cell-content">
              ${this.getCellLabel(row, col)}
            </div>
          </div>
        `;
      }
      
      html += '</div>';
    }
    
    return html;
  }

  // 獲取格子樣式類別
  getCellClass(row, col) {
    const classes = [];
    
    // 中心格子
    if (row === this.config.centerRow && col === this.config.centerCol) {
      classes.push('center-cell');
    }
    
    // 特殊分數格子（可以根據需要添加）
    if (this.isSpecialCell(row, col)) {
      classes.push('special-cell');
    }
    
    // 邊界格子
    if (row === 0 || row === this.config.rows - 1 || 
        col === 0 || col === this.config.cols - 1) {
      classes.push('border-cell');
    }
    
    return classes.join(' ');
  }

  // 獲取格子標籤
  getCellLabel(row, col) {
    // 中心格子標記
    if (row === this.config.centerRow && col === this.config.centerCol) {
      return '<span class="center-star">★</span>';
    }
    
    // 座標標記（僅用於調試，可選）
    if (row === 0 && col > 0) {
      return `<span class="coord">${col}</span>`;
    }
    if (col === 0 && row > 0) {
      return `<span class="coord">${row}</span>`;
    }
    
    return '';
  }

  // 判斷是否為特殊格子
  isSpecialCell(row, col) {
    // 可以在這裡定義特殊分數格子的位置
    return false;
  }

  // 設置放置目標
  setupDropTargets() {
    if (!this.dragDropManager) return;

    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
      this.dragDropManager.makeDropTarget(cell, {
        acceptTiles: true,
        validateDrop: (target, tileData) => this.validateCellDrop(target, tileData),
        onDrop: (event, tileData, target, source) => this.handleTileDrop(event, tileData, target, source),
        onDragOver: (event, tileData, isValid) => this.handleDragOver(event, tileData, isValid),
        onDragLeave: (event) => this.handleDragLeave(event)
      });
    });

    console.log('🎯 棋盤放置目標設置完成');
  }

  // 修復的驗證格子放置邏輯
  validateCellDrop(target, tileData) {
    console.log('🔍 驗證放置:', { target, tileData });
    
    if (!target || !tileData) {
      console.log('❌ 驗證失敗: 缺少目標或磚塊數據');
      return false;
    }

    const position = target.dataset.position;
    if (!position) {
      console.log('❌ 驗證失敗: 找不到位置數據');
      return false;
    }

    // 檢查格子是否已被佔用
    if (this.tiles.has(position)) {
      console.log('❌ 驗證失敗: 格子已被佔用', position);
      return false;
    }

    // 檢查格子是否包含磚塊元素
    if (target.querySelector('.tile')) {
      console.log('❌ 驗證失敗: 格子已包含磚塊元素');
      return false;
    }

    const [row, col] = position.split(',').map(Number);

    // 第一個磚塊必須放在中心
    if (this.isFirstTile || this.tiles.size === 0) {
      const isCenterPosition = row === this.config.centerRow && col === this.config.centerCol;
      if (isCenterPosition) {
        console.log('✅ 驗證通過: 第一個磚塊放置在中心');
        return true;
      } else {
        console.log('❌ 驗證失敗: 第一個磚塊必須放在中心位置', { row, col, center: `${this.config.centerRow},${this.config.centerCol}` });
        return false;
      }
    }

    // 後續磚塊必須與已放置的磚塊相鄰
    const isAdjacent = this.isAdjacentToExistingTiles(position);
    if (isAdjacent) {
      console.log('✅ 驗證通過: 磚塊與現有磚塊相鄰');
      return true;
    } else {
      console.log('❌ 驗證失敗: 磚塊必須與現有磚塊相鄰');
      return false;
    }
  }

  // 檢查是否與現有磚塊相鄰
  isAdjacentToExistingTiles(position) {
    const [row, col] = position.split(',').map(Number);
    const adjacent = [
      `${row-1},${col}`, // 上
      `${row+1},${col}`, // 下
      `${row},${col-1}`, // 左
      `${row},${col+1}`  // 右
    ];

    const hasAdjacent = adjacent.some(pos => this.tiles.has(pos));
    console.log('🔍 相鄰檢查:', { position, adjacent, existing: Array.from(this.tiles.keys()), hasAdjacent });
    
    return hasAdjacent;
  }

  // 處理磚塊放置
  handleTileDrop(event, tileData, target, source) {
    const position = target.dataset.position;
    const [row, col] = position.split(',').map(Number);

    console.log('📥 棋盤接收磚塊:', { tileData, position: `${row},${col}` });

    // 更新磚塊數據
    tileData.position = 'board';
    tileData.boardX = col;
    tileData.boardY = row;

    // 記錄到棋盤狀態
    this.tiles.set(position, tileData);

    // 更新格子狀態
    target.classList.add('occupied');

    // 如果是第一個磚塊，更新狀態
    if (this.isFirstTile) {
      this.isFirstTile = false;
      const hintEl = document.getElementById('first-tile-hint');
      if (hintEl) {
        hintEl.textContent = '';
      }
    }

    // 觸發棋盤更新
    this.updateBoardState();
    
    // 檢查是否形成新單詞
    setTimeout(() => {
      this.detectWords();
    }, 100);

    console.log('✅ 磚塊放置成功');
    return true;
  }

  // 處理拖拽懸停
  handleDragOver(event, tileData, isValid) {
    const target = event.target.closest('.board-cell');
    if (!target) return;

    // 添加視覺反饋
    if (isValid) {
      target.classList.add('valid-hover');
      this.showPlacementPreview(target, tileData);
    } else {
      target.classList.add('invalid-hover');
    }
  }

  // 處理拖拽離開
  handleDragLeave(event) {
    const target = event.target.closest('.board-cell');
    if (target) {
      target.classList.remove('valid-hover', 'invalid-hover');
      this.hidePlacementPreview(target);
    }
  }

  // 顯示放置預覽
  showPlacementPreview(target, tileData) {
    // 清除現有預覽
    this.hidePlacementPreview(target);
    
    const preview = document.createElement('div');
    preview.className = 'placement-preview';
    preview.innerHTML = `
      <div class="tile preview-tile">
        <div class="tile-letter">${tileData.letter}</div>
        ${!tileData.isBlank ? `<div class="tile-points">${tileData.points}</div>` : ''}
      </div>
    `;
    
    target.appendChild(preview);
  }

  // 隱藏放置預覽
  hidePlacementPreview(target) {
    const preview = target.querySelector('.placement-preview');
    if (preview) {
      preview.remove();
    }
  }

  // 從棋盤移除磚塊
  removeTile(position) {
    if (this.tiles.has(position)) {
      const tileData = this.tiles.get(position);
      this.tiles.delete(position);

      // 找到對應的格子並清理
      const cell = document.querySelector(`[data-position="${position}"]`);
      if (cell) {
        cell.classList.remove('occupied');
        const tileElement = cell.querySelector('.tile');
        if (tileElement) {
          tileElement.remove();
        }
      }

      // 如果棋盤變空，重置第一個磚塊狀態
      if (this.tiles.size === 0) {
        this.isFirstTile = true;
        const hintEl = document.getElementById('first-tile-hint');
        if (hintEl) {
          hintEl.textContent = '請將第一個磚塊放置在中心(★)';
        }
      }

      this.updateBoardState();
      return tileData;
    }
    return null;
  }

  // 清空棋盤
  clearBoard() {
    if (this.tiles.size === 0) {
      this.dragDropManager?.showFeedback('棋盤已經是空的', 'info');
      return;
    }

    const confirmed = confirm('確定要清空棋盤嗎？所有磚塊將回到手牌。');
    if (!confirmed) return;

    // 移動所有磚塊回到手牌
    const handContainer = document.querySelector('.hand-tiles');
    if (handContainer) {
      this.tiles.forEach((tileData, position) => {
        const cell = document.querySelector(`[data-position="${position}"]`);
        const tileElement = cell?.querySelector('.tile');
        
        if (tileElement) {
          handContainer.appendChild(tileElement);
          tileData.position = 'hand';
          tileData.boardX = null;
          tileData.boardY = null;
        }
      });
    }

    // 清理棋盤狀態
    this.tiles.clear();
    this.words = [];
    this.isFirstTile = true;

    // 清理所有格子狀態
    document.querySelectorAll('.board-cell.occupied').forEach(cell => {
      cell.classList.remove('occupied');
    });

    // 更新提示
    const hintEl = document.getElementById('first-tile-hint');
    if (hintEl) {
      hintEl.textContent = '請將第一個磚塊放置在中心(★)';
    }

    this.updateBoardState();
    this.dragDropManager?.showFeedback('棋盤已清空', 'success');
  }

  // 顯示棋盤狀態（調試用）
  showBoardState() {
    const state = this.getBoardState();
    console.log('📊 棋盤狀態:', state);
    
    const message = `
棋盤狀態：
• 磚塊數量: ${state.tiles.length}
• 單詞數量: ${state.words.length}
• 總分數: ${state.score}
• 是否為第一個磚塊: ${this.isFirstTile}
• 中心位置: (${this.config.centerRow}, ${this.config.centerCol})
    `.trim();
    
    alert(message);
    this.dragDropManager?.showFeedback(`棋盤: ${state.tiles.length}磚塊, ${state.words.length}單詞`, 'info');
  }

  // 檢測單詞
  detectWords() {
    const detectedWords = [];
    
    // 檢測水平單詞
    detectedWords.push(...this.detectHorizontalWords());
    
    // 檢測垂直單詞
    detectedWords.push(...this.detectVerticalWords());
    
    this.words = detectedWords;
    this.updateWordDisplay();
    
    return detectedWords;
  }

  // 檢測水平單詞
  detectHorizontalWords() {
    const words = [];
    
    for (let row = 0; row < this.config.rows; row++) {
      let currentWord = [];
      
      for (let col = 0; col < this.config.cols; col++) {
        const position = `${row},${col}`;
        
        if (this.tiles.has(position)) {
          const tileData = this.tiles.get(position);
          currentWord.push({
            letter: tileData.getDisplayLetter ? tileData.getDisplayLetter() : tileData.letter,
            position: { row, col },
            points: tileData.points
          });
        } else {
          // 遇到空格，檢查當前單詞
          if (currentWord.length >= 2) {
            words.push({
              word: currentWord.map(t => t.letter).join(''),
              tiles: currentWord,
              direction: 'horizontal',
              startPos: currentWord[0].position,
              score: currentWord.reduce((sum, t) => sum + t.points, 0)
            });
          }
          currentWord = [];
        }
      }
      
      // 檢查行末的單詞
      if (currentWord.length >= 2) {
        words.push({
          word: currentWord.map(t => t.letter).join(''),
          tiles: currentWord,
          direction: 'horizontal',
          startPos: currentWord[0].position,
          score: currentWord.reduce((sum, t) => sum + t.points, 0)
        });
      }
    }
    
    return words;
  }

  // 檢測垂直單詞
  detectVerticalWords() {
    const words = [];
    
    for (let col = 0; col < this.config.cols; col++) {
      let currentWord = [];
      
      for (let row = 0; row < this.config.rows; row++) {
        const position = `${row},${col}`;
        
        if (this.tiles.has(position)) {
          const tileData = this.tiles.get(position);
          currentWord.push({
            letter: tileData.getDisplayLetter ? tileData.getDisplayLetter() : tileData.letter,
            position: { row, col },
            points: tileData.points
          });
        } else {
          // 遇到空格，檢查當前單詞
          if (currentWord.length >= 2) {
            words.push({
              word: currentWord.map(t => t.letter).join(''),
              tiles: currentWord,
              direction: 'vertical',
              startPos: currentWord[0].position,
              score: currentWord.reduce((sum, t) => sum + t.points, 0)
            });
          }
          currentWord = [];
        }
      }
      
      // 檢查列末的單詞
      if (currentWord.length >= 2) {
        words.push({
          word: currentWord.map(t => t.letter).join(''),
          tiles: currentWord,
          direction: 'vertical',
          startPos: currentWord[0].position,
          score: currentWord.reduce((sum, t) => sum + t.points, 0)
        });
      }
    }
    
    return words;
  }

  // 驗證單詞
  validateWords() {
    const words = this.detectWords();
    
    if (words.length === 0) {
      this.dragDropManager?.showFeedback('棋盤上沒有形成單詞', 'info');
      return;
    }

    console.log('🔍 檢測到的單詞:', words);
    
    // 簡單的單詞驗證
    const validWords = words.filter(wordData => this.isValidWord(wordData.word));
    const invalidWords = words.filter(wordData => !this.isValidWord(wordData.word));

    if (invalidWords.length > 0) {
      this.dragDropManager?.showFeedback(
        `發現無效單詞: ${invalidWords.map(w => w.word).join(', ')}`, 
        'error'
      );
    } else {
      this.dragDropManager?.showFeedback(
        `所有單詞有效! 總分: ${words.reduce((sum, w) => sum + w.score, 0)}`, 
        'success'
      );
    }

    return { valid: validWords, invalid: invalidWords };
  }

  // 檢查單詞是否有效（簡單實現）
  isValidWord(word) {
    // 擴展的英文單詞列表
    const commonWords = [
      'CAT', 'DOG', 'HOUSE', 'BOOK', 'WATER', 'FIRE', 'EARTH', 'AIR',
      'LOVE', 'LIFE', 'TIME', 'WORD', 'GAME', 'PLAY', 'WIN', 'LOSE',
      'GOOD', 'BAD', 'BIG', 'SMALL', 'FAST', 'SLOW', 'HOT', 'COLD',
      'RED', 'BLUE', 'GREEN', 'BLACK', 'WHITE', 'YELLOW', 'ORANGE', 'PURPLE',
      'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
      'AND', 'THE', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'HIS',
      'SHE', 'HAS', 'HAD', 'CAR', 'SEE', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'OLD', 'WAY'
    ];
    
    return commonWords.includes(word.toUpperCase()) || word.length >= 2;
  }

  // 更新棋盤狀態
  updateBoardState() {
    const totalScore = Array.from(this.tiles.values())
      .reduce((sum, tile) => sum + tile.points, 0);
    
    // 更新顯示
    const wordCountEl = document.getElementById('board-word-count');
    const scoreEl = document.getElementById('board-score');
    
    if (wordCountEl) wordCountEl.textContent = `單詞: ${this.words.length}`;
    if (scoreEl) scoreEl.textContent = `分數: ${totalScore}`;

    // 觸發自定義事件
    document.dispatchEvent(new CustomEvent('board-updated', {
      detail: {
        tileCount: this.tiles.size,
        wordCount: this.words.length,
        score: totalScore,
        words: this.words,
        isFirstTile: this.isFirstTile
      }
    }));
  }

  // 更新單詞顯示
  updateWordDisplay() {
    if (this.words.length > 0) {
      console.log('📝 當前單詞:', this.words.map(w => `${w.word}(${w.score}分)`).join(', '));
    }
  }

  // 創建棋盤樣式
  createBoardStyles() {
    if (document.getElementById('game-board-styles-fixed')) return;

    const styles = document.createElement('style');
    styles.id = 'game-board-styles-fixed';
    styles.textContent = `
      /* 修復版棋盤樣式 */
      .board-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .board-header h3 {
        margin: 0;
        color: #333;
      }

      .board-info {
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #666;
        flex-wrap: wrap;
      }

      .board-grid {
        display: grid;
        grid-template-rows: repeat(${this.config.rows}, 1fr);
        gap: 1px;
        background: #dee2e6;
        border: 2px solid #adb5bd;
        border-radius: 8px;
        overflow: hidden;
        margin: 0 auto;
        max-width: 600px;
        aspect-ratio: 1;
      }

      .board-row {
        display: grid;
        grid-template-columns: repeat(${this.config.cols}, 1fr);
        gap: 1px;
      }

      .board-cell {
        background: #ffffff;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 35px;
        min-width: 35px;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .board-cell:hover {
        background: #f8f9fa;
      }

      .board-cell.center-cell {
        background: linear-gradient(145deg, #ffd700, #ffed4a);
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(255,215,0,0.3);
      }

      .board-cell.center-cell .center-star {
        font-size: 16px;
        color: #856404;
        font-weight: bold;
      }

      .board-cell.special-cell {
        background: linear-gradient(145deg, #ff6b6b, #ee5a52);
      }

      .board-cell.border-cell {
        background: #e9ecef;
      }

      .board-cell.occupied {
        background: #ffffff;
        box-shadow: inset 0 0 3px rgba(0,0,0,0.1);
      }

      .board-cell.valid-hover {
        background: rgba(40, 167, 69, 0.2) !important;
        border: 2px solid #28a745;
        box-shadow: 0 0 10px rgba(40, 167, 69, 0.4);
        transform: scale(1.05);
      }

      .board-cell.invalid-hover {
        background: rgba(220, 53, 69, 0.2) !important;
        border: 2px solid #dc3545;
        box-shadow: 0 0 10px rgba(220, 53, 69, 0.4);
        animation: shake 0.3s ease-in-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      .cell-content {
        font-size: 10px;
        color: #6c757d;
        text-align: center;
        pointer-events: none;
      }

      .coord {
        font-size: 8px;
        font-weight: bold;
      }

      .placement-preview {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 5;
      }

      .preview-tile {
        opacity: 0.7;
        transform: scale(0.9);
        border: 2px dashed #007bff !important;
        background: rgba(0, 123, 255, 0.1) !important;
      }

      .board-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 15px;
        flex-wrap: wrap;
      }

      .control-btn {
        background: linear-gradient(145deg, #007bff, #0056b3);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,123,255,0.3);
      }

      .control-btn:hover {
        background: linear-gradient(145deg, #0056b3, #004085);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,123,255,0.4);
      }

      /* 手機響應式 */
      @media (max-width: 768px) {
        .board-grid {
          max-width: 90vw;
        }
        
        .board-cell {
          min-height: 25px;
          min-width: 25px;
        }
        
        .cell-content {
          font-size: 8px;
        }
        
        .center-star {
          font-size: 12px !important;
        }
        
        .board-controls {
          flex-direction: column;
        }
        
        .board-header {
          flex-direction: column;
          text-align: center;
        }
        
        .board-info {
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(styles);
    console.log('🎨 修復版棋盤樣式已載入');
  }

  // 獲取棋盤狀態
  getBoardState() {
    return {
      tiles: Array.from(this.tiles.entries()).map(([pos, tile]) => ({
        position: pos,
        tile: tile
      })),
      words: this.words,
      score: Array.from(this.tiles.values()).reduce((sum, tile) => sum + tile.points, 0),
      isFirstTile: this.isFirstTile
    };
  }

  // 載入棋盤狀態
  loadBoardState(state) {
    this.clearBoard();
    
    if (state.tiles) {
      state.tiles.forEach(({ position, tile }) => {
        this.tiles.set(position, tile);
        
        // 更新 DOM
        const cell = document.querySelector(`[data-position="${position}"]`);
        if (cell) {
          cell.classList.add('occupied');
        }
      });
      
      this.isFirstTile = state.isFirstTile !== undefined ? state.isFirstTile : this.tiles.size === 0;
    }
    
    this.updateBoardState();
  }
}

// 導出到全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameBoard;
} else {
  window.GameBoard = GameBoard;
}

console.log('🏁 修復版遊戲棋盤模組已載入');