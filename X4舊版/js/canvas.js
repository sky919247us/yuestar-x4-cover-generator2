function initCanvas() {
  const canvas = new fabric.Canvas('x4-canvas', {
    width: 480,
    height: 800,
    preserveObjectStacking: true,
    selection: true,
  });

  // 美化控制點
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerColor = '#2563eb';
  fabric.Object.prototype.cornerStrokeColor = '#1f2937';
  fabric.Object.prototype.borderColor = '#2563eb';
  fabric.Object.prototype.cornerSize = 10;

  // 新增：啟用自適應畫面寬度（初始化後即套用）
  // 先等 DOM 佈局完成一個 requestAnimationFrame 再執行，以得到正確容器寬度
  requestAnimationFrame(() => { fitCanvasDisplay(); });
  window.addEventListener('resize', fitCanvasDisplay);

  // 新增物件時紀錄初始狀態
  canvas.on('object:added', e => {
    const obj = e.target;
    if (!obj) return;
    App.state.initialMap.set(obj, {
      left: obj.left, top: obj.top,
      scaleX: obj.scaleX, scaleY: obj.scaleY,
      angle: obj.angle, flipX: obj.flipX, flipY: obj.flipY,
    });
    refreshLayers();
  });

  canvas.on('object:modified', () => refreshLayers());
  canvas.on('object:removed', () => refreshLayers());

  // 讓物件可以超出畫布但輸出時自動裁切（Fabric 會在導出時按畫布裁切）
  canvas.clipPath = null;

  // 背景為白色（符合輸出灰階最佳對比）
  canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

  return canvas;
}

// 新增：自適應畫面寬度顯示（保留內部解析度，不影響輸出）
function fitCanvasDisplay() {
  if (!window.App || !App.canvas) return;
  const canvas = App.canvas;
  const container = document.querySelector('.canvas-card');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  const paddingX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
  const availWidth = Math.max(1, rect.width - paddingX);

  const scale = availWidth / canvas.width;
  // 安全限制，避免過度縮放導致操控困難
  const clamped = Math.max(0.2, Math.min(5, scale));

  // 使用 Fabric zoom 縮放視覺呈現
  canvas.setZoom(clamped);

  // 將 DOM 風格大小同步為縮放後尺寸，確保事件座標正確
  const displayW = canvas.width * clamped;
  const displayH = canvas.height * clamped;
  canvas.lowerCanvasEl.style.width = `${displayW}px`;
  canvas.lowerCanvasEl.style.height = `${displayH}px`;
  canvas.upperCanvasEl.style.width = `${displayW}px`;
  canvas.upperCanvasEl.style.height = `${displayH}px`;

  canvas.requestRenderAll();
}