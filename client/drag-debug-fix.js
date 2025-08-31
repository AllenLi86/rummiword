// ========== drag-debug-fix.js ==========
// 拖拽問題診斷與修復腳本

class DragDebugFixer {
  constructor() {
    this.diagnostics = [];
    this.fixes = [];
  }

  // 執行完整診斷
  runFullDiagnosis() {
    console.log('🔍 開始拖拽系統診斷...');
    
    this.diagnostics = [];
    this.fixes = [];
    
    // 基本系統檢查
    this.checkBasicSystems();
    
    // 拖拽管理器檢查
    this.checkDragDropManager();
    
    // 棋盤系統檢查
    this.checkGameBoard();
    
    // DOM 元素檢查
    this.checkDOMElements();
    
    // 事件監聽器檢查
    this.checkEventListeners();
    
    // 驗證邏輯檢查
    this.checkValidationLogic();
    
    // 輸出診斷報告
    this.outputDiagnosisReport();
    
    // 應用修復
    this.applyFixes();
    
    return {
      diagnostics: this.diagnostics,
      fixes: this.fixes
    };
  }

  // 檢查基本系統
  checkBasicSystems() {
    const systems = [
      { name: 'DragDropManager', check: () => typeof DragDropManager !== 'undefined' },
      { name: 'GameBoard', check: () => typeof GameBoard !== 'undefined' },
      { name: 'EnhancedTileUIManager', check: () => typeof EnhancedTileUIManager !== 'undefined' },
      { name: 'enhancedTileUI實例', check: () => typeof enhancedTileUI !== 'undefined' && enhancedTileUI !== null }
    ];

    systems.forEach(system => {
      const isAvailable = system.check();
      this.diagnostics.push({
        type: isAvailable ? 'success' : 'error',
        category: '系統檢查',
        message: `${system.name}: ${isAvailable ? '✅ 可用' : '❌ 不可用'}`
      });

      if (!isAvailable && system.name === 'enhancedTileUI實例') {
        this.fixes.push({
          type: 'initialization',
          message: '重新初始化增強版UI管理器',
          action: () => this.reinitializeEnhancedUI()
        });
      }
    });
  }

  // 檢查拖拽管理器
  checkDragDropManager() {
    if (typeof enhancedTileUI !== 'undefined' && enhancedTileUI && enhancedTileUI.dragDropManager) {
      const dragManager = enhancedTileUI.dragDropManager;
      
      this.diagnostics.push({
        type: 'success',
        category: '拖拽管理器',
        message: `✅ 拖拽管理器已初始化，啟用狀態: ${dragManager.isEnabled}`
      });

      if (!dragManager.isEnabled) {
        this.fixes.push({
          type: 'enable',
          message: '啟用拖拽功能',
          action: () => dragManager.setEnabled(true)
        });
      }
    } else {
      this.diagnostics.push({
        type: 'error',
        category: '拖拽管理器',
        message: '❌ 拖拽管理器未初始化'
      });
    }
  }

  // 檢查棋盤系統
  checkGameBoard() {
    if (typeof enhancedTileUI !== 'undefined' && enhancedTileUI && enhancedTileUI.gameBoard) {
      const board = enhancedTileUI.gameBoard;
      
      this.diagnostics.push({
        type: 'success',
        category: '棋盤系統',
        message: `✅ 棋盤已初始化，磚塊數: ${board.tiles ? board.tiles.size : 0}`
      });

      // 檢查是否為第一個磚塊狀態
      if (board.isFirstTile !== undefined) {
        this.diagnostics.push({
          type: 'info',
          category: '棋盤狀態',
          message: `📋 第一個磚塊狀態: ${board.isFirstTile ? '是' : '否'}`
        });
      }
    } else {
      this.diagnostics.push({
        type: 'error',
        category: '棋盤系統',
        message: '❌ 棋盤未初始化'
      });
    }
  }

  // 檢查DOM元素
  checkDOMElements() {
    const elements = [
      { name: '遊戲區域', selector: '#game-area' },
      { name: '手牌容器', selector: '#my-hand' },
      { name: '棋盤容器', selector: '#board-container' },
      { name: '棋盤格子', selector: '.board-cell' }
    ];

    elements.forEach(element => {
      const el = document.querySelector(element.selector);
      const exists = !!el;
      
      this.diagnostics.push({
        type: exists ? 'success' : 'error',
        category: 'DOM元素',
        message: `${element.name}: ${exists ? '✅ 存在' : '❌ 不存在'}`
      });

      if (element.selector === '.board-cell' && exists) {
        const cellCount = document.querySelectorAll('.board-cell').length;
        this.diagnostics.push({
          type: 'info',
          category: 'DOM元素',
          message: `📊 棋盤格子數量: ${cellCount}`
        });
      }
    });
  }

  // 檢查事件監聽器
  checkEventListeners() {
    // 檢查拖拽事件
    const testTile = document.querySelector('.tile');
    if (testTile) {
      const hasDraggable = testTile.draggable;
      const hasDataset = !!testTile.dataset.tileId;
      
      this.diagnostics.push({
        type: hasDraggable ? 'success' : 'error',
        category: '事件監聽器',
        message: `磚塊可拖拽屬性: ${hasDraggable ? '✅ 已設置' : '❌ 未設置'}`
      });

      this.diagnostics.push({
        type: hasDataset ? 'success' : 'error',
        category: '事件監聽器',
        message: `磚塊數據屬性: ${hasDataset ? '✅ 已設置' : '❌ 未設置'}`
      });

      if (!hasDraggable) {
        this.fixes.push({
          type: 'draggable',
          message: '修復磚塊拖拽屬性',
          action: () => this.fixTileDraggable()
        });
      }
    } else {
      this.diagnostics.push({
        type: 'warning',
        category: '事件監聽器',
        message: '⚠️ 找不到磚塊元素，無法檢查拖拽屬性'
      });
    }

    // 檢查棋盤放置目標
    const boardCells = document.querySelectorAll('.board-cell');
    let dropTargetCount = 0;
    
    boardCells.forEach(cell => {
      if (cell.classList.contains('drop-target')) {
        dropTargetCount++;
      }
    });

    this.diagnostics.push({
      type: dropTargetCount > 0 ? 'success' : 'error',
      category: '事件監聽器',
      message: `棋盤放置目標: ${dropTargetCount}/${boardCells.length} 格子已設置`
    });

    if (dropTargetCount === 0) {
      this.fixes.push({
        type: 'drop-targets',
        message: '重新設置棋盤放置目標',
        action: () => this.fixBoardDropTargets()
      });
    }
  }

  // 檢查驗證邏輯
  checkValidationLogic() {
    if (typeof enhancedTileUI !== 'undefined' && enhancedTileUI && enhancedTileUI.gameBoard) {
      const board = enhancedTileUI.gameBoard;
      
      // 測試驗證邏輯
      const testPosition = '7,7'; // 中心位置
      const testTile = { id: 'test', letter: 'A', points: 1, isBlank: false };
      
      try {
        const mockTarget = {
          dataset: { position: testPosition },
          querySelector: () => null
        };
        
        const isValid = board.validateCellDrop(mockTarget, testTile);
        
        this.diagnostics.push({
          type: 'success',
          category: '驗證邏輯',
          message: `✅ 驗證邏輯可執行，中心位置測試: ${isValid ? '通過' : '失敗'}`
        });

        if (!isValid && board.isFirstTile) {
          this.diagnostics.push({
            type: 'error',
            category: '驗證邏輯',
            message: '❌ 第一個磚塊應該可以放置在中心位置'
          });

          this.fixes.push({
            type: 'validation',
            message: '修復第一個磚塊驗證邏輯',
            action: () => this.fixFirstTileValidation()
          });
        }
      } catch (error) {
        this.diagnostics.push({
          type: 'error',
          category: '驗證邏輯',
          message: `❌ 驗證邏輯執行錯誤: ${error.message}`
        });

        this.fixes.push({
          type: 'validation',
          message: '修復驗證邏輯錯誤',
          action: () => this.fixValidationError(error)
        });
      }
    }
  }

  // 輸出診斷報告
  outputDiagnosisReport() {
    console.log('\n📊 === 拖拽系統診斷報告 ===');
    
    const categories = [...new Set(this.diagnostics.map(d => d.category))];
    
    categories.forEach(category => {
      console.log(`\n📂 ${category}:`);
      const categoryDiagnostics = this.diagnostics.filter(d => d.category === category);
      categoryDiagnostics.forEach(diagnostic => {
        console.log(`  ${diagnostic.message}`);
      });
    });

    const errorCount = this.diagnostics.filter(d => d.type === 'error').length;
    const warningCount = this.diagnostics.filter(d => d.type === 'warning').length;
    const successCount = this.diagnostics.filter(d => d.type === 'success').length;

    console.log(`\n📈 統計: ${successCount} 成功, ${warningCount} 警告, ${errorCount} 錯誤`);
    console.log(`💡 找到 ${this.fixes.length} 個可能的修復方案\n`);
  }

  // 應用修復
  applyFixes() {
    if (this.fixes.length === 0) {
      console.log('✅ 沒有需要修復的問題！');
      return;
    }

    console.log(`🔧 應用 ${this.fixes.length} 個修復方案...`);

    this.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.message}`);
      try {
        fix.action();
        console.log(`   ✅ 修復成功`);
      } catch (error) {
        console.log(`   ❌ 修復失敗: ${error.message}`);
      }
    });
  }

  // 修復方法：重新初始化增強版UI
  reinitializeEnhancedUI() {
    if (typeof EnhancedTileUIManager !== 'undefined') {
      window.enhancedTileUI = new EnhancedTileUIManager();
      enhancedTileUI.initialize();
      console.log('🔄 已重新初始化增強版UI管理器');
    }
  }

  // 修復方法：修復磚塊拖拽屬性
  fixTileDraggable() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
      if (!tile.draggable) {
        tile.draggable = true;
        tile.classList.add('draggable');
        
        if (!tile.dataset.tileId) {
          tile.dataset.tileId = `fixed_tile_${index}`;
        }
      }
    });
    console.log('🔧 已修復磚塊拖拽屬性');
  }

  // 修復方法：重新設置棋盤放置目標
  fixBoardDropTargets() {
    if (enhancedTileUI && enhancedTileUI.dragDropManager && enhancedTileUI.gameBoard) {
      enhancedTileUI.gameBoard.setupDropTargets();
      console.log('🔧 已重新設置棋盤放置目標');
    }
  }

  // 修復方法：修復第一個磚塊驗證
  fixFirstTileValidation() {
    if (enhancedTileUI && enhancedTileUI.gameBoard) {
      enhancedTileUI.gameBoard.isFirstTile = true;
      console.log('🔧 已重置第一個磚塊狀態');
    }
  }

  // 修復方法：修復驗證錯誤
  fixValidationError(error) {
    console.log('🔧 嘗試修復驗證邏輯錯誤...');
    
    // 替換為修復版的驗證邏輯
    if (enhancedTileUI && enhancedTileUI.gameBoard) {
      const originalValidate = enhancedTileUI.gameBoard.validateCellDrop;
      
      enhancedTileUI.gameBoard.validateCellDrop = function(target, tileData) {
        console.log('🔍 使用修復版驗證邏輯');
        
        if (!target || !tileData) {
          console.log('❌ 缺少目標或磚塊數據');
          return false;
        }

        const position = target.dataset.position;
        if (!position) {
          console.log('❌ 找不到位置數據');
          return false;
        }

        // 檢查格子是否已被佔用
        if (this.tiles && this.tiles.has(position)) {
          console.log('❌ 格子已被佔用');
          return false;
        }

        // 檢查格子是否包含磚塊元素
        if (target.querySelector('.tile')) {
          console.log('❌ 格子已包含磚塊');
          return false;
        }

        const [row, col] = position.split(',').map(Number);

        // 第一個磚塊必須放在中心
        if (this.isFirstTile || (this.tiles && this.tiles.size === 0)) {
          const isCenterPosition = row === 7 && col === 7; // 假設中心是 (7,7)
          console.log(`🎯 第一個磚塊檢查: 位置(${row},${col}), 是否中心: ${isCenterPosition}`);
          return isCenterPosition;
        }

        // 後續磚塊檢查相鄰性
        const adjacent = [
          `${row-1},${col}`, `${row+1},${col}`,
          `${row},${col-1}`, `${row},${col+1}`
        ];

        const hasAdjacent = adjacent.some(pos => this.tiles && this.tiles.has(pos));
        console.log(`🔗 相鄰性檢查: ${hasAdjacent}`);
        return hasAdjacent;
      };
      
      console.log('🔧 已應用修復版驗證邏輯');
    }
  }

  // 快速修復 - 一鍵修復所有常見問題
  quickFix() {
    console.log('🚀 執行快速修復...');

    // 確保系統已載入
    if (typeof enhancedTileUI === 'undefined' || !enhancedTileUI) {
      this.reinitializeEnhancedUI();
    }

    // 修復拖拽屬性
    this.fixTileDraggable();

    // 重新設置放置目標
    setTimeout(() => {
      this.fixBoardDropTargets();
    }, 100);

    // 重置第一個磚塊狀態
    this.fixFirstTileValidation();

    // 啟用拖拽
    setTimeout(() => {
      if (enhancedTileUI && enhancedTileUI.dragDropManager) {
        enhancedTileUI.dragDropManager.setEnabled(true);
      }
    }, 200);

    console.log('✅ 快速修復完成！請嘗試拖拽磚塊到棋盤中心位置。');
  }

  // 測試拖拽功能
  testDragDrop() {
    console.log('🧪 測試拖拽功能...');

    // 檢查是否有手牌磚塊
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length === 0) {
      console.log('⚠️ 沒有找到磚塊，請先載入測試手牌');
      if (typeof loadMockData === 'function') {
        loadMockData();
        setTimeout(() => this.testDragDrop(), 1000);
        return;
      }
    }

    // 檢查棋盤
    const boardCells = document.querySelectorAll('.board-cell');
    if (boardCells.length === 0) {
      console.log('❌ 沒有找到棋盤格子');
      return;
    }

    // 找到中心格子
    const centerCell = document.querySelector('[data-position="7,7"]');
    if (!centerCell) {
      console.log('❌ 找不到中心格子');
      return;
    }

    console.log('✅ 測試準備完成：');
    console.log(`  - 找到 ${tiles.length} 個磚塊`);
    console.log(`  - 找到 ${boardCells.length} 個棋盤格子`);
    console.log('  - 找到中心格子');
    console.log('💡 現在可以嘗試將磚塊拖拽到中心位置（帶★標記的格子）');
  }
}

// 創建全局調試器實例
window.dragDebugFixer = new DragDebugFixer();

// 提供快捷方法
window.diagnoseDragDrop = () => window.dragDebugFixer.runFullDiagnosis();
window.quickFixDragDrop = () => window.dragDebugFixer.quickFix();
window.testDragDrop = () => window.dragDebugFixer.testDragDrop();

console.log('🛠️ 拖拽調試修復工具已載入！');
console.log('💡 可用命令：');
console.log('  diagnoseDragDrop() - 完整診斷');
console.log('  quickFixDragDrop() - 快速修復');
console.log('  testDragDrop() - 測試功能');

// 自動執行快速診斷
setTimeout(() => {
  console.log('\n🔍 自動執行快速診斷...');
  window.dragDebugFixer.runFullDiagnosis();
}, 1000);