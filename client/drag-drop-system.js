// ========== drag-drop-system.js ==========
// Rummiword 拖拽系統 - HTML5 Drag & Drop API 實現

class DragDropManager {
  constructor() {
    this.draggedElement = null;
    this.draggedTileData = null;
    this.sourceContainer = null;
    this.dropTargets = new Set();
    this.isEnabled = true;
    
    console.log('🎯 拖拽系統初始化完成');
  }

  // 初始化拖拽系統
  initialize() {
    this.setupGlobalEventListeners();
    this.createDragStyles();
  }

  // 設置全局事件監聽器
  setupGlobalEventListeners() {
    // 防止頁面默認拖拽行為
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
    });

    // 拖拽結束時清理
    document.addEventListener('dragend', (e) => {
      this.cleanup();
    });
  }

  // 創建拖拽相關樣式
  createDragStyles() {
    if (document.getElementById('drag-drop-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'drag-drop-styles';
    styles.textContent = `
      /* 拖拽相關樣式 */
      .draggable {
        cursor: grab;
        transition: transform 0.2s, opacity 0.2s;
      }

      .draggable:active {
        cursor: grabbing;
      }

      .dragging {
        opacity: 0.5;
        transform: rotate(5deg) scale(1.05);
        z-index: 1000;
        pointer-events: none;
      }

      .drag-preview {
        position: fixed;
        pointer-events: none;
        z-index: 1001;
        transform: translate(-50%, -50%);
      }

      /* 放置目標樣式 */
      .drop-target {
        position: relative;
        transition: all 0.3s ease;
      }

      .drop-target.drag-over {
        background-color: rgba(0, 123, 255, 0.1);
        border-color: #007bff;
        transform: scale(1.02);
      }

      .drop-target.valid-drop {
        background-color: rgba(40, 167, 69, 0.1);
        border-color: #28a745;
        box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
      }

      .drop-target.invalid-drop {
        background-color: rgba(220, 53, 69, 0.1);
        border-color: #dc3545;
        box-shadow: 0 0 10px rgba(220, 53, 69, 0.3);
        cursor: not-allowed;
      }

      /* 放置指示器 */
      .drop-indicator {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        border: 2px dashed transparent;
        border-radius: 8px;
        pointer-events: none;
        z-index: 10;
      }

      .drop-indicator.show {
        border-color: #007bff;
        background: rgba(0, 123, 255, 0.1);
      }

      .drop-indicator.valid {
        border-color: #28a745;
        background: rgba(40, 167, 69, 0.1);
      }

      .drop-indicator.invalid {
        border-color: #dc3545;
        background: rgba(220, 53, 69, 0.1);
      }

      /* 棋盤格子樣式 */
      .board-cell {
        width: 60px;
        height: 60px;
        border: 1px solid #dee2e6;
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.2s ease;
      }

      .board-cell:hover {
        background: #e9ecef;
      }

      .board-cell.occupied {
        background: #ffffff;
        border-color: #6c757d;
      }

      /* 手機觸控優化 */
      @media (max-width: 768px) {
        .draggable {
          touch-action: none;
        }
        
        .board-cell {
          width: 50px;
          height: 50px;
        }
        
        .tile {
          width: 45px;
          height: 45px;
          font-size: 14px;
        }
      }

      /* 拖拽輔助線 */
      .drag-guide {
        position: fixed;
        pointer-events: none;
        z-index: 999;
        border: 2px dashed #007bff;
        border-radius: 4px;
        background: rgba(0, 123, 255, 0.1);
        opacity: 0;
        transition: opacity 0.2s;
      }

      .drag-guide.show {
        opacity: 1;
      }
    `;

    document.head.appendChild(styles);
    console.log('🎨 拖拽樣式已載入');
  }

  // 使元素可拖拽
  makeDraggable(element, tileData) {
    if (!element || !tileData) return;

    element.draggable = true;
    element.classList.add('draggable');
    
    // 設置拖拽數據
    element.dataset.tileId = tileData.id;
    element.dataset.tileLetter = tileData.letter;
    element.dataset.tilePoints = tileData.points;
    element.dataset.isBlank = tileData.isBlank;

    // 綁定事件
    this.bindDragEvents(element, tileData);
  }

  // 綁定拖拽事件
  bindDragEvents(element, tileData) {
    element.addEventListener('dragstart', (e) => {
      this.handleDragStart(e, element, tileData);
    });

    element.addEventListener('dragend', (e) => {
      this.handleDragEnd(e, element);
    });

    // 手機觸控支持
    this.bindTouchEvents(element, tileData);
  }

  // 處理拖拽開始
  handleDragStart(event, element, tileData) {
    if (!this.isEnabled) {
      event.preventDefault();
      return;
    }

    console.log('🎯 開始拖拽:', tileData);

    this.draggedElement = element;
    this.draggedTileData = tileData;
    this.sourceContainer = element.closest('.hand-tiles, .board-cell');

    // 設置拖拽數據
    event.dataTransfer.setData('text/plain', JSON.stringify(tileData));
    event.dataTransfer.effectAllowed = 'move';

    // 創建自定義拖拽預覽
    this.createDragPreview(element, event);

    // 添加拖拽狀態
    setTimeout(() => {
      element.classList.add('dragging');
    }, 0);

    // 高亮可放置區域
    this.highlightDropTargets(tileData);

    // 觸發自定義事件
    this.dispatchEvent('drag-start', { element, tileData });
  }

  // 處理拖拽結束
  handleDragEnd(event, element) {
    console.log('🏁 拖拽結束');
    
    element.classList.remove('dragging');
    this.cleanup();
    
    // 觸發自定義事件
    this.dispatchEvent('drag-end', { element });
  }

  // 創建拖拽預覽
  createDragPreview(element, event) {
    const preview = element.cloneNode(true);
    preview.classList.add('drag-preview');
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '1001';
    
    document.body.appendChild(preview);
    
    // 設置自定義拖拽圖像
    event.dataTransfer.setDragImage(preview, 25, 25);
    
    // 清理預覽元素
    setTimeout(() => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, 0);
  }

  // 使區域成為放置目標
  makeDropTarget(element, options = {}) {
    if (!element) return;

    element.classList.add('drop-target');
    
    const config = {
      acceptTiles: true,
      validateDrop: null,
      onDrop: null,
      onDragOver: null,
      onDragLeave: null,
      ...options
    };

    this.dropTargets.add({ element, config });
    this.bindDropEvents(element, config);
  }

  // 綁定放置事件
  bindDropEvents(element, config) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      const isValid = this.validateDrop(element, this.draggedTileData, config);
      
      element.classList.toggle('valid-drop', isValid);
      element.classList.toggle('invalid-drop', !isValid);
      element.classList.add('drag-over');

      if (config.onDragOver) {
        config.onDragOver(e, this.draggedTileData, isValid);
      }
    });

    element.addEventListener('dragleave', (e) => {
      // 確保真的離開了元素（不是進入子元素）
      if (!element.contains(e.relatedTarget)) {
        element.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
        
        if (config.onDragLeave) {
          config.onDragLeave(e);
        }
      }
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      const isValid = this.validateDrop(element, this.draggedTileData, config);
      
      if (isValid) {
        this.handleDrop(e, element, config);
      } else {
        console.log('❌ 無效的放置操作');
        this.showFeedback('無效的放置位置', 'error');
      }

      element.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
    });
  }

  // 驗證放置操作
  validateDrop(target, tileData, config) {
    if (!tileData) return false;
    
    if (config.validateDrop) {
      return config.validateDrop(target, tileData);
    }

    // 默認驗證邏輯
    if (target.classList.contains('board-cell')) {
      return !target.querySelector('.tile');
    }

    if (target.classList.contains('hand-tiles')) {
      return true;
    }

    return config.acceptTiles;
  }

  // 處理放置操作
  handleDrop(event, target, config) {
    const tileData = this.draggedTileData;
    console.log('📥 處理放置:', tileData, target);

    if (config.onDrop) {
      const result = config.onDrop(event, tileData, target, this.sourceContainer);
      if (result === false) return; // 取消放置
    }

    // 默認放置邏輯
    this.performDrop(target, tileData);
    
    // 觸發自定義事件
    this.dispatchEvent('tile-dropped', { 
      tileData, 
      target, 
      source: this.sourceContainer 
    });

    this.showFeedback('字母磚已放置', 'success');
  }

  // 執行放置操作
  performDrop(target, tileData) {
    if (!this.draggedElement) return;

    // 移動 DOM 元素
    if (target.classList.contains('board-cell')) {
      // 放置到棋盤格子
      target.appendChild(this.draggedElement);
      this.draggedElement.style.position = 'static';
    } else if (target.classList.contains('hand-tiles')) {
      // 放置到手牌區域
      target.appendChild(this.draggedElement);
    }

    // 更新磚塊狀態
    this.updateTilePosition(tileData, target);
  }

  // 更新磚塊位置狀態
  updateTilePosition(tileData, target) {
    if (target.classList.contains('board-cell')) {
      const boardPos = this.getBoardPosition(target);
      tileData.position = 'board';
      tileData.boardX = boardPos.x;
      tileData.boardY = boardPos.y;
    } else if (target.classList.contains('hand-tiles')) {
      tileData.position = 'hand';
      tileData.boardX = null;
      tileData.boardY = null;
    }

    console.log('📍 更新磚塊位置:', tileData);
  }

  // 獲取棋盤位置
  getBoardPosition(cellElement) {
    const row = parseInt(cellElement.dataset.row) || 0;
    const col = parseInt(cellElement.dataset.col) || 0;
    return { x: col, y: row };
  }

  // 高亮可放置區域
  highlightDropTargets(tileData) {
    this.dropTargets.forEach(({ element, config }) => {
      const isValid = this.validateDrop(element, tileData, config);
      element.classList.toggle('valid-drop-zone', isValid);
    });
  }

  // 觸控事件支持（手機端）
  bindTouchEvents(element, tileData) {
    let touchStartPos = null;
    let isDragging = false;
    let dragPreview = null;

    element.addEventListener('touchstart', (e) => {
      touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    });

    element.addEventListener('touchmove', (e) => {
      if (!touchStartPos) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      if (!isDragging && (deltaX > 10 || deltaY > 10)) {
        isDragging = true;
        this.startTouchDrag(element, tileData, touch);
        e.preventDefault();
      }

      if (isDragging) {
        this.updateTouchDrag(touch);
        e.preventDefault();
      }
    });

    element.addEventListener('touchend', (e) => {
      if (isDragging) {
        this.endTouchDrag(e.changedTouches[0]);
      }
      touchStartPos = null;
      isDragging = false;
    });
  }

  // 開始觸控拖拽
  startTouchDrag(element, tileData, touch) {
    this.draggedElement = element;
    this.draggedTileData = tileData;
    this.sourceContainer = element.closest('.hand-tiles, .board-cell');

    element.classList.add('dragging');
    this.highlightDropTargets(tileData);

    // 創建觸控拖拽預覽
    this.createTouchPreview(element, touch);
  }

  // 創建觸控拖拽預覽
  createTouchPreview(element, touch) {
    const preview = element.cloneNode(true);
    preview.classList.add('drag-preview');
    preview.style.left = touch.clientX + 'px';
    preview.style.top = touch.clientY + 'px';
    
    document.body.appendChild(preview);
    this.touchPreview = preview;
  }

  // 更新觸控拖拽
  updateTouchDrag(touch) {
    if (this.touchPreview) {
      this.touchPreview.style.left = touch.clientX + 'px';
      this.touchPreview.style.top = touch.clientY + 'px';
    }
  }

  // 結束觸控拖拽
  endTouchDrag(touch) {
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = targetElement?.closest('.drop-target');

    if (dropTarget) {
      const targetConfig = Array.from(this.dropTargets).find(t => t.element === dropTarget)?.config;
      if (targetConfig && this.validateDrop(dropTarget, this.draggedTileData, targetConfig)) {
        this.handleDrop({ preventDefault: () => {} }, dropTarget, targetConfig);
      }
    }

    this.cleanup();
  }

  // 清理拖拽狀態
  cleanup() {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
    }

    if (this.touchPreview) {
      this.touchPreview.remove();
      this.touchPreview = null;
    }

    // 清理高亮狀態
    document.querySelectorAll('.drop-target').forEach(el => {
      el.classList.remove('drag-over', 'valid-drop', 'invalid-drop', 'valid-drop-zone');
    });

    this.draggedElement = null;
    this.draggedTileData = null;
    this.sourceContainer = null;
  }

  // 顯示用戶反饋
  showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `drag-feedback drag-feedback-${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      color: white;
      font-weight: bold;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    `;

    document.body.appendChild(feedback);

    // 動畫顯示
    setTimeout(() => {
      feedback.style.transform = 'translateX(0)';
    }, 10);

    // 自動移除
    setTimeout(() => {
      feedback.style.transform = 'translateX(100%)';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  // 自定義事件派發
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  // 啟用/禁用拖拽
  setEnabled(enabled) {
    this.isEnabled = enabled;
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(el => {
      el.style.pointerEvents = enabled ? '' : 'none';
    });
  }

  // 銷毀拖拽系統
  destroy() {
    this.cleanup();
    this.dropTargets.clear();
    
    const styles = document.getElementById('drag-drop-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// 導出到全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragDropManager;
} else {
  window.DragDropManager = DragDropManager;
}

console.log('🎯 拖拽系統模組已載入');