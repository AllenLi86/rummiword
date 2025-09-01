// ========== client/phaser/objects/Tile.js ==========
// 磚塊物件 - 單個字母磚的邏輯和視覺表現

class PhaserTile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, tileData) {
    super(scene, x, y);
    
    this.scene = scene;
    this.tileData = tileData;
    this.isSelected = false;
    this.location = 'hand'; // 'hand', 'board'
    this.originalX = x;
    this.originalY = y;
    
    // 創建磚塊視覺元素
    this.createVisuals();
    
    // 設置互動
    this.setupInteraction();
    
    // 添加到場景
    scene.add.existing(this);
  }

  // 創建視覺元素
  createVisuals() {
    const isBlank = this.tileData.isBlank;
    const textureKey = isBlank ? 'tile-blank' : 'tile-normal';

    // 背景
    this.background = this.scene.add.image(0, 0, textureKey);
    this.add(this.background);

    // 字母文字
    this.letterText = this.scene.add.text(0, -5, this.getDisplayLetter(), {
      fontSize: isBlank ? '24px' : '28px',
      fontFamily: 'Arial',
      color: isBlank ? '#666' : '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.letterText);

    // 分數文字
    if (!isBlank && this.tileData.points !== undefined) {
      this.pointsText = this.scene.add.text(18, 18, this.tileData.points.toString(), {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#666'
      }).setOrigin(0.5);
      this.add(this.pointsText);
    }

    // 設置容器大小
    this.setSize(60, 60);
  }

  // 設置互動
  setupInteraction() {
    this.setInteractive({ cursor: 'pointer' });
    
    // 拖拽設置
    this.scene.input.setDraggable(this);

    // 點擊事件
    this.on('pointerdown', this.handleClick, this);
    
    // 拖拽事件
    this.on('dragstart', this.handleDragStart, this);
    this.on('drag', this.handleDrag, this);
    this.on('dragend', this.handleDragEnd, this);

    // 萬用字母雙擊
    if (this.tileData.isBlank) {
      this.setupDoubleClick();
    }
  }

  // 設置雙擊事件
  setupDoubleClick() {
    let lastClickTime = 0;
    
    this.on('pointerdown', () => {
      const currentTime = Date.now();
      if (currentTime - lastClickTime < 300) {
        this.handleDoubleClick();
      }
      lastClickTime = currentTime;
    });
  }

  // 處理點擊
  handleClick() {
    this.toggleSelection();
  }

  // 處理雙擊
  handleDoubleClick() {
    if (this.tileData.isBlank) {
      console.log('🌟 萬用字母雙擊');
      this.showLetterSelection();
    }
  }

  // 處理拖拽開始
  handleDragStart(pointer) {
    console.log('🖱️ 開始拖拽:', this.tileData.letter);
    
    // 放大效果
    this.setScale(1.1);
    this.setDepth(1000);
    
    // 半透明效果
    this.setAlpha(0.8);
  }

  // 處理拖拽中
  handleDrag(pointer, dragX, dragY) {
    this.x = dragX;
    this.y = dragY;
  }

  // 處理拖拽結束
  handleDragEnd(pointer) {
    console.log('🖱️ 結束拖拽:', this.tileData.letter);
    
    // 恢復原始大小和透明度
    this.setScale(1);
    this.setDepth(10);
    this.setAlpha(1);
    
    // 檢查是否拖拽到有效區域，否則回到原位
    this.checkDropPosition();
  }

  // 檢查拖拽位置
  checkDropPosition() {
    // 如果沒有被有效拖放區域處理，回到原位
    this.scene.tweens.add({
      targets: this,
      x: this.originalX,
      y: this.originalY,
      duration: 300,
      ease: 'Power2'
    });
  }

  // 切換選擇狀態
  toggleSelection() {
    if (this.isSelected) {
      this.deselect();
    } else {
      this.select();
    }
  }

  // 選擇磚塊
  select() {
    if (this.isSelected) return;
    
    this.isSelected = true;
    
    // 添加選中效果
    if (!this.selectedEffect) {
      this.selectedEffect = this.scene.add.image(0, 0, 'tile-selected');
      this.addAt(this.selectedEffect, 0); // 放在背景後面
    }

    // 向上移動
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 200,
      ease: 'Power2'
    });

    console.log('✅ 選中磚塊:', this.tileData.letter);
    
    // 通知手牌管理器
    this.emit('selected', this);
  }

  // 取消選擇
  deselect() {
    if (!this.isSelected) return;
    
    this.isSelected = false;
    
    // 移除選中效果
    if (this.selectedEffect) {
      this.selectedEffect.destroy();
      this.selectedEffect = null;
    }

    // 恢復位置
    this.scene.tweens.add({
      targets: this,
      y: this.originalY,
      duration: 200,
      ease: 'Power2'
    });

    console.log('❌ 取消選中:', this.tileData.letter);
    
    // 通知手牌管理器
    this.emit('deselected', this);
  }

  // 顯示字母選擇
  showLetterSelection() {
    // 創建字母選擇界面
    this.createLetterSelectionModal();
  }

  // 創建字母選擇模態框
  createLetterSelectionModal() {
    const { width, height } = this.scene.sys.game.config;

    // 模態框背景
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
      .setInteractive()
      .setDepth(2000);

    // 選擇面板
    const panel = this.scene.add.rectangle(width / 2, height / 2, 400, 300, 0xffffff)
      .setStrokeStyle(2, 0x007bff)
      .setDepth(2001);

    const title = this.scene.add.text(width / 2, height / 2 - 120, '選擇字母', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2002);

    // 字母按鈕
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lettersPerRow = 6;
    const buttonSize = 35;
    const startX = width / 2 - 110;
    const startY = height / 2 - 60;

    const modalElements = [overlay, panel, title];

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const row = Math.floor(i / lettersPerRow);
      const col = i % lettersPerRow;
      const x = startX + (col * 40);
      const y = startY + (row * 40);

      const button = this.scene.add.rectangle(x, y, buttonSize, buttonSize, 0x007bff)
        .setStrokeStyle(1, 0x0056b3)
        .setInteractive({ cursor: 'pointer' })
        .setDepth(2002);

      const buttonText = this.scene.add.text(x, y, letter, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2003);

      // 點擊事件
      button.on('pointerdown', () => {
        this.selectLetter(letter);
        this.closeModal(modalElements, [button, buttonText]);
      });

      // 懸停效果
      button.on('pointerover', () => button.setFillStyle(0x0056b3));
      button.on('pointerout', () => button.setFillStyle(0x007bff));

      modalElements.push(button, buttonText);
    }

    // 取消按鈕
    const cancelButton = this.scene.add.rectangle(width / 2, height / 2 + 100, 100, 30, 0x6c757d)
      .setStrokeStyle(1, 0x5a6268)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(2002)
      .on('pointerdown', () => {
        this.closeModal(modalElements, [cancelButton, cancelText]);
      });

    const cancelText = this.scene.add.text(width / 2, height / 2 + 100, '取消', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(2003);

    modalElements.push(cancelButton, cancelText);

    // 點擊遮罩關閉
    overlay.on('pointerdown', () => {
      this.closeModal(modalElements);
    });
  }

  // 選擇字母
  selectLetter(letter) {
    console.log('🎯 選擇萬用字母:', letter);
    
    // 更新本地數據
    this.tileData.selectedLetter = letter;
    
    // 更新顯示
    this.letterText.setText(letter);
    
    // 通知服務器
    if (this.scene.socketClient && this.scene.socketClient.setBlankTileLetter) {
      this.scene.socketClient.setBlankTileLetter(this.tileData.id, letter);
    }
    
    // 顯示消息
    if (this.scene.gameManager) {
      this.scene.gameManager.showMessage(`萬用字母設置為 ${letter}`, 'success');
    }
  }

  // 關閉模態框
  closeModal(elements, additionalElements = []) {
    [...elements, ...additionalElements].forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }

  // 獲取顯示字母
  getDisplayLetter() {
    if (this.tileData.isBlank && this.tileData.selectedLetter) {
      return this.tileData.selectedLetter;
    }
    return this.tileData.letter;
  }

  // 更新位置
  updatePosition(x, y, animated = false) {
    this.originalX = x;
    this.originalY = y;
    
    if (animated) {
      this.scene.tweens.add({
        targets: this,
        x: x,
        y: y,
        duration: 300,
        ease: 'Power2'
      });
    } else {
      this.x = x;
      this.y = y;
    }
  }

  // 設置位置類型
  setLocation(location) {
    this.location = location;
  }

  // 銷毀磚塊
  destroy() {
    if (this.selectedEffect) {
      this.selectedEffect.destroy();
    }
    super.destroy();
  }
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.PhaserTile = PhaserTile;
}

console.log('✅ PhaserTile 載入完成');