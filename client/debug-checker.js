// ========== debug-checker.js ==========
// 調試檢查工具 - 幫助診斷問題

console.log('🔍 調試檢查工具載入');

// 檢查所有必要的函數和對象
function performSystemCheck() {
  const checkResults = {
    timestamp: new Date().toLocaleString(),
    checks: []
  };

  // 檢查列表
  const checks = [
    { name: 'SocketClient', check: () => typeof SocketClient !== 'undefined' },
    { name: 'TileSystem', check: () => typeof window.TileSystem !== 'undefined' },
    { name: 'tileUIManager', check: () => typeof tileUIManager !== 'undefined' },
    { name: 'socketClient instance', check: () => typeof socketClient !== 'undefined' },
    { name: 'startGameInterface', check: () => typeof window.startGameInterface === 'function' },
    { name: 'loadMockData', check: () => typeof window.loadMockData === 'function' },
    { name: 'TestTileInterface', check: () => typeof window.TestTileInterface !== 'undefined' },
    { name: 'showSection', check: () => typeof window.showSection === 'function' },
    { name: 'showMessage', check: () => typeof window.showMessage === 'function' }
  ];

  checks.forEach(({ name, check }) => {
    const result = check();
    checkResults.checks.push({ name, passed: result });
    console.log(`${result ? '✅' : '❌'} ${name}: ${result ? '可用' : '不可用'}`);
  });

  // 檢查 DOM 元素
  const domChecks = [
    'game-section',
    'game-area', 
    'my-hand',
    'hand-count',
    'hand-score',
    'pool-count'
  ];

  console.log('\n📋 DOM 元素檢查:');
  domChecks.forEach(id => {
    const element = document.getElementById(id);
    const exists = element !== null;
    console.log(`${exists ? '✅' : '❌'} #${id}: ${exists ? '存在' : '不存在'}`);
    checkResults.checks.push({ name: `DOM: ${id}`, passed: exists });
  });

  return checkResults;
}

// 強制創建測試界面
function forceCreateTestInterface() {
  console.log('🔧 強制創建測試界面');

  const gameAreaEl = document.getElementById('game-area');
  if (!gameAreaEl) {
    console.error('❌ 找不到 game-area 元素');
    return;
  }

  gameAreaEl.innerHTML = `
    <div class="debug-test-container" style="padding: 20px; background: #f8f9fa; border-radius: 10px;">
      <h2>🧪 Rummiword 調試測試模式</h2>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>🔧 測試控制</h3>
        <button class="control-btn" onclick="forceLoadMockData()" style="margin: 5px;">
          🎲 載入測試手牌
        </button>
        <button class="control-btn" onclick="forceSimulateDrawTile()" style="margin: 5px;">
          ➕ 模擬抽磚
        </button>
        <button class="control-btn" onclick="forceClearTestData()" style="margin: 5px;">
          🗑️ 清除測試數據
        </button>
        <button class="control-btn" onclick="performSystemCheck()" style="margin: 5px;">
          🔍 系統檢查
        </button>
      </div>

      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>🎯 我的手牌</h3>
        <div style="margin-bottom: 10px;">
          <span id="hand-count">0 張</span> | 
          <span id="hand-score">0 分</span> | 
          剩餘磚塊: <span id="pool-count">98</span>
        </div>
        <div id="my-hand" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; min-height: 80px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px solid #dee2e6;">
          <div class="loading-hand" style="display: flex; align-items: center; justify-content: center; width: 100%; color: #666; font-style: italic;">
            點擊上方按鈕載入測試手牌
          </div>
        </div>
      </div>

      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>🎮 棋盤區域</h3>
        <div id="game-board" style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; min-height: 100px; display: flex; align-items: center; justify-content: center; color: #666;">
          拖拽字母磚到這裡組成單詞 (開發中)
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <button class="leave-btn" onclick="leaveRoom()" style="background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          離開遊戲
        </button>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin-top: 20px; font-size: 14px;">
        <strong>📝 說明:</strong> 這是調試模式界面。如果您看到這個界面，表示基本功能正常，但可能存在初始化順序問題。
      </div>
    </div>
  `;

  console.log('✅ 調試測試界面創建完成');
}

// 強制載入測試數據
function forceLoadMockData() {
  console.log('🎲 強制載入測試數據');

  const tiles = [
    { id: 'test1', letter: 'A', points: 1, isBlank: false },
    { id: 'test2', letter: 'B', points: 3, isBlank: false },
    { id: 'test3', letter: 'C', points: 3, isBlank: false },
    { id: 'test4', letter: 'D', points: 2, isBlank: false },
    { id: 'test5', letter: 'E', points: 1, isBlank: false },
    { id: 'test6', letter: 'F', points: 4, isBlank: false },
    { id: 'test7', letter: '★', points: 0, isBlank: true }
  ];

  const handEl = document.getElementById('my-hand');
  if (!handEl) {
    console.error('❌ 找不到 my-hand 元素');
    return;
  }

  handEl.innerHTML = '';

  tiles.forEach(tile => {
    const tileEl = document.createElement('div');
    tileEl.className = `tile ${tile.isBlank ? 'blank' : ''}`;
    tileEl.dataset.tileId = tile.id;
    tileEl.style.cssText = `
      width: 50px; height: 50px; 
      background: ${tile.isBlank ? 'linear-gradient(145deg, #ddd, #bbb)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)'}; 
      border: 2px solid ${tile.isBlank ? '#999' : '#e17055'}; 
      border-radius: 8px; display: flex; flex-direction: column; 
      align-items: center; justify-content: center; cursor: pointer; 
      user-select: none; transition: all 0.2s; font-weight: bold; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const letterEl = document.createElement('div');
    letterEl.textContent = tile.letter;
    letterEl.style.cssText = 'font-size: 18px; line-height: 1;';

    const pointsEl = document.createElement('div');
    if (!tile.isBlank) {
      pointsEl.textContent = tile.points;
      pointsEl.style.cssText = 'font-size: 10px; margin-top: 2px; opacity: 0.8;';
    }

    tileEl.appendChild(letterEl);
    tileEl.appendChild(pointsEl);

    // 添加點擊事件
    tileEl.addEventListener('click', function() {
      this.style.transform = this.style.transform ? '' : 'translateY(-5px)';
      this.style.borderColor = this.style.borderColor === 'rgb(0, 123, 255)' ? (tile.isBlank ? '#999' : '#e17055') : '#007bff';
      this.style.background = this.style.borderColor === 'rgb(0, 123, 255)' ? 'linear-gradient(145deg, #74b9ff, #0984e3)' : (tile.isBlank ? 'linear-gradient(145deg, #ddd, #bbb)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)');
      this.style.color = this.style.borderColor === 'rgb(0, 123, 255)' ? 'white' : 'black';
      console.log(`點擊字母磚: ${tile.letter}`);
    });

    // 萬用字母雙擊事件
    if (tile.isBlank) {
      tileEl.addEventListener('dblclick', function() {
        const letter = prompt('選擇這個萬用字母磚要代表的字母 (A-Z):');
        if (letter && /^[A-Za-z]$/.test(letter)) {
          letterEl.textContent = letter.toUpperCase();
          console.log(`萬用字母磚設置為: ${letter.toUpperCase()}`);
          showMessage(`萬用字母設置為 ${letter.toUpperCase()}`, 'success');
        }
      });
    }

    handEl.appendChild(tileEl);
  });

  // 更新統計
  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  
  if (handCountEl) handCountEl.textContent = `${tiles.length} 張`;
  if (handScoreEl) {
    const totalScore = tiles.reduce((sum, tile) => sum + tile.points, 0);
    handScoreEl.textContent = `${totalScore} 分`;
  }

  showMessage('測試手牌載入完成！可以點擊字母磚進行測試', 'success');
  console.log('✅ 測試手牌載入完成');
}

// 強制模擬抽磚
function forceSimulateDrawTile() {
  console.log('🎲 強制模擬抽磚');

  const randomLetters = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const randomPoints = [4, 1, 8, 5, 1, 3, 1, 1, 3];
  const randomIndex = Math.floor(Math.random() * randomLetters.length);

  const newTile = {
    id: `new_${Date.now()}`,
    letter: randomLetters[randomIndex],
    points: randomPoints[randomIndex],
    isBlank: false
  };

  const handEl = document.getElementById('my-hand');
  if (!handEl) return;

  // 如果手牌是空的，先載入基本數據
  if (handEl.children.length === 0 || handEl.querySelector('.loading-hand')) {
    forceLoadMockData();
    setTimeout(() => forceSimulateDrawTile(), 500);
    return;
  }

  const tileEl = document.createElement('div');
  tileEl.className = 'tile';
  tileEl.dataset.tileId = newTile.id;
  tileEl.style.cssText = `
    width: 50px; height: 50px; 
    background: linear-gradient(145deg, #ffeaa7, #fdcb6e); 
    border: 2px solid #e17055; 
    border-radius: 8px; display: flex; flex-direction: column; 
    align-items: center; justify-content: center; cursor: pointer; 
    user-select: none; transition: all 0.2s; font-weight: bold; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  const letterEl = document.createElement('div');
  letterEl.textContent = newTile.letter;
  letterEl.style.cssText = 'font-size: 18px; line-height: 1;';

  const pointsEl = document.createElement('div');
  pointsEl.textContent = newTile.points;
  pointsEl.style.cssText = 'font-size: 10px; margin-top: 2px; opacity: 0.8;';

  tileEl.appendChild(letterEl);
  tileEl.appendChild(pointsEl);

  // 添加點擊事件
  tileEl.addEventListener('click', function() {
    this.style.transform = this.style.transform ? '' : 'translateY(-5px)';
    this.style.borderColor = this.style.borderColor === 'rgb(0, 123, 255)' ? '#e17055' : '#007bff';
    this.style.background = this.style.borderColor === 'rgb(0, 123, 255)' ? 'linear-gradient(145deg, #74b9ff, #0984e3)' : 'linear-gradient(145deg, #ffeaa7, #fdcb6e)';
    this.style.color = this.style.borderColor === 'rgb(0, 123, 255)' ? 'white' : 'black';
  });

  handEl.appendChild(tileEl);

  // 更新統計
  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  const poolCountEl = document.getElementById('pool-count');

  if (handCountEl) {
    const currentCount = parseInt(handCountEl.textContent) || 0;
    handCountEl.textContent = `${currentCount + 1} 張`;
  }
  if (handScoreEl) {
    const currentScore = parseInt(handScoreEl.textContent) || 0;
    handScoreEl.textContent = `${currentScore + newTile.points} 分`;
  }
  if (poolCountEl) {
    const currentPool = parseInt(poolCountEl.textContent) || 98;
    poolCountEl.textContent = Math.max(0, currentPool - 1);
  }

  showMessage(`抽到新磚塊: ${newTile.letter}(${newTile.points}分)`, 'success');
}

// 強制清除測試數據
function forceClearTestData() {
  console.log('🗑️ 強制清除測試數據');

  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '<div class="loading-hand" style="display: flex; align-items: center; justify-content: center; width: 100%; color: #666; font-style: italic;">手牌已清空</div>';
  }

  const handCountEl = document.getElementById('hand-count');
  const handScoreEl = document.getElementById('hand-score');
  const poolCountEl = document.getElementById('pool-count');

  if (handCountEl) handCountEl.textContent = '0 張';
  if (handScoreEl) handScoreEl.textContent = '0 分';
  if (poolCountEl) poolCountEl.textContent = '98';

  showMessage('測試數據已清除', 'info');
}

// 覆蓋 startGameInterface 函數
function debugStartGameInterface(gameData) {
  console.log('🎮 調試版 startGameInterface 被調用', gameData);
  
  // 切換到遊戲區段
  if (typeof showSection === 'function') {
    showSection('game-section');
  } else {
    const gameSection = document.getElementById('game-section');
    if (gameSection) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      gameSection.classList.add('active');
    }
  }

  // 強制創建測試界面
  setTimeout(forceCreateTestInterface, 100);
}

// 導出到全域
if (typeof window !== 'undefined') {
  window.performSystemCheck = performSystemCheck;
  window.forceCreateTestInterface = forceCreateTestInterface;
  window.forceLoadMockData = forceLoadMockData;
  window.forceSimulateDrawTile = forceSimulateDrawTile;
  window.forceClearTestData = forceClearTestData;
  
  // 覆蓋 startGameInterface
  window.startGameInterface = debugStartGameInterface;
  
  console.log('✅ 調試工具已載入並覆蓋 startGameInterface');
}

// 頁面載入後自動執行系統檢查
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('🔍 執行自動系統檢查');
    performSystemCheck();
  }, 2000);
});