// ========== client/phaser/utils/PhaserHelpers.js ==========
// Phaser 輔助函數 - 通用工具和輔助功能

class PhaserHelpers {
  // 創建漸層材質
  static createGradientTexture(scene, key, width, height, colorStops) {
    const canvas = scene.textures.createCanvas(key, width, height);
    const ctx = canvas.getContext();

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    canvas.refresh();
    return canvas;
  }

  // 創建圓角矩形材質
  static createRoundedRectTexture(scene, key, width, height, radius, fillColor, strokeColor, strokeWidth = 0) {
    const canvas = scene.textures.createCanvas(key, width, height);
    const ctx = canvas.getContext();

    // 繪製圓角矩形
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    // 填充
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // 描邊
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }

    canvas.refresh();
    return canvas;
  }

  // 創建磚塊材質
  static createTileTextures(scene) {
    console.log('🎨 PhaserHelpers 創建磚塊材質');

    // 普通磚塊材質
    this.createGradientTexture(scene, 'tile-normal', 60, 60, [
      { position: 0, color: '#ffeaa7' },
      { position: 1, color: '#fdcb6e' }
    ]);

    // 為普通磚塊添加邊框
    const normalCanvas = scene.textures.get('tile-normal').getSourceImage();
    const normalCtx = normalCanvas.getContext('2d');
    normalCtx.strokeStyle = '#e17055';
    normalCtx.lineWidth = 2;
    normalCtx.strokeRect(1, 1, 58, 58);

    // 萬用磚塊材質
    this.createGradientTexture(scene, 'tile-blank', 60, 60, [
      { position: 0, color: '#dddddd' },
      { position: 1, color: '#bbbbbb' }
    ]);

    // 為萬用磚塊添加邊框
    const blankCanvas = scene.textures.get('tile-blank').getSourceImage();
    const blankCtx = blankCanvas.getContext('2d');
    blankCtx.strokeStyle = '#999999';
    blankCtx.lineWidth = 2;
    blankCtx.strokeRect(1, 1, 58, 58);

    // 選中效果材質
    const selectedCanvas = scene.textures.createCanvas('tile-selected', 64, 64);
    const selectedCtx = selectedCanvas.getContext();
    selectedCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    selectedCtx.fillRect(0, 0, 64, 64);
    selectedCtx.strokeStyle = '#007bff';
    selectedCtx.lineWidth = 3;
    selectedCtx.strokeRect(2, 2, 60, 60);
    selectedCanvas.refresh();
  }

  // 計算兩點間距離
  static distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // 將角度轉換為弧度
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // 將弧度轉換為角度
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  // 限制數值在指定範圍內
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // 線性插值
  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // 檢查點是否在矩形內
  static pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && 
           y >= rectY && y <= rectY + rectHeight;
  }

  // 檢查兩個矩形是否重疊
  static rectsOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  // 創建彈跳動畫
  static createBounceAnimation(scene, target, scale = 1.2, duration = 200) {
    return scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: duration / 2,
      ease: 'Power2',
      yoyo: true,
      repeat: 0
    });
  }

  // 創建脈衝動畫
  static createPulseAnimation(scene, target, alpha = 0.5, duration = 1000) {
    return scene.tweens.add({
      targets: target,
      alpha: alpha,
      duration: duration,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });
  }

  // 創建震動效果
  static createShakeAnimation(scene, target, intensity = 5, duration = 300) {
    const originalX = target.x;
    const originalY = target.y;

    return scene.tweens.add({
      targets: target,
      duration: duration,
      repeat: 5,
      yoyo: true,
      ease: 'Power2',
      x: originalX + (Math.random() - 0.5) * intensity * 2,
      y: originalY + (Math.random() - 0.5) * intensity * 2,
      onComplete: () => {
        target.x = originalX;
        target.y = originalY;
      }
    });
  }

  // 創建淡入動畫
  static createFadeInAnimation(scene, target, duration = 500) {
    target.setAlpha(0);
    return scene.tweens.add({
      targets: target,
      alpha: 1,
      duration: duration,
      ease: 'Power2'
    });
  }

  // 創建淡出動畫
  static createFadeOutAnimation(scene, target, duration = 500, onComplete = null) {
    return scene.tweens.add({
      targets: target,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: onComplete
    });
  }

  // 創建滑入動畫
  static createSlideInAnimation(scene, target, fromDirection = 'left', distance = 200, duration = 500) {
    let startX = target.x;
    let startY = target.y;

    switch (fromDirection) {
      case 'left':
        target.x -= distance;
        break;
      case 'right':
        target.x += distance;
        break;
      case 'top':
        target.y -= distance;
        break;
      case 'bottom':
        target.y += distance;
        break;
    }

    return scene.tweens.add({
      targets: target,
      x: startX,
      y: startY,
      duration: duration,
      ease: 'Back.easeOut'
    });
  }

  // 創建彈性動畫
  static createElasticAnimation(scene, target, property, endValue, duration = 800) {
    return scene.tweens.add({
      targets: target,
      [property]: endValue,
      duration: duration,
      ease: 'Elastic.easeOut'
    });
  }

  // 格式化分數顯示
  static formatScore(score) {
    if (score >= 1000000) {
      return (score / 1000000).toFixed(1) + 'M';
    } else if (score >= 1000) {
      return (score / 1000).toFixed(1) + 'K';
    }
    return score.toString();
  }

  // 格式化時間顯示 (秒轉換為 MM:SS)
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // 隨機選擇數組中的元素
  static randomChoice(array) {
    if (array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  // 洗牌數組
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 生成隨機ID
  static generateId() {
    return 'phaser_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 創建輻射狀粒子效果
  static createParticleExplosion(scene, x, y, color = 0xffffff, particleCount = 20) {
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      
      const particle = scene.add.rectangle(x, y, 4, 4, color);
      particles.push(particle);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * velocity,
        y: y + Math.sin(angle) * velocity,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }

    return particles;
  }

  // 創建文字打字效果
  static createTypewriterEffect(scene, textObject, fullText, speed = 50) {
    let currentText = '';
    let currentIndex = 0;

    const timer = scene.time.addEvent({
      delay: speed,
      callback: () => {
        if (currentIndex < fullText.length) {
          currentText += fullText[currentIndex];
          textObject.setText(currentText);
          currentIndex++;
        } else {
          timer.destroy();
        }
      },
      loop: true
    });

    return timer;
  }

  // 檢查設備是否為移動設備
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 獲取適合的字體大小（響應式）
  static getResponsiveFontSize(baseSize, screenWidth) {
    if (screenWidth < 768) {
      return baseSize * 0.8;
    } else if (screenWidth < 1024) {
      return baseSize * 0.9;
    }
    return baseSize;
  }

  // 調試輔助：在場景中顯示碰撞盒
  static drawDebugBounds(scene, gameObject, color = 0xff0000) {
    const bounds = gameObject.getBounds();
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, color);
    graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    return graphics;
  }

  // 性能監控：FPS 計數器
  static createFPSCounter(scene, x = 10, y = 10) {
    const fpsText = scene.add.text(x, y, 'FPS: --', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 3 }
    }).setDepth(10000);

    scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const fps = Math.round(scene.game.loop.actualFps);
        fpsText.setText(`FPS: ${fps}`);
      },
      loop: true
    });

    return fpsText;
  }
}

// 導出到全局
if (typeof window !== 'undefined') {
  window.PhaserHelpers = PhaserHelpers;
}

console.log('✅ PhaserHelpers 載入完成');