function initTemplates(canvas) {
  const select = document.getElementById('templateSelect');
  const btn = document.getElementById('applyTemplateBtn');
  btn.addEventListener('click', () => applyTemplate(select.value));

  // 雙擊替換圖片
  let lastClick = 0;
  canvas.on('mouse:down', (opt) => {
    const now = Date.now();
    if (now - lastClick < 300) {
      const obj = canvas.getActiveObject();
      if (obj && obj.meta === 'placeholder') {
        const input = document.getElementById('placeholderImageInput');
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const img = await fileToFabricImage(file);
          const bbox = obj.getBoundingRect(true);
          const scaleX = bbox.width / img.width;
          const scaleY = bbox.height / img.height;
          const scale = Math.min(scaleX, scaleY);
          img.set({ left: obj.left, top: obj.top, originX: 'center', originY: 'center' });
          img.scale(scale);
          img.set('name', '範本圖片');
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.remove(obj);
          canvas.requestRenderAll();
        };
        input.click();
      }
    }
    lastClick = now;
  });

  function applyTemplate(name) {
    clearTemplateArtifacts();
    const cw = App.canvas.width;
    const ch = App.canvas.height;

    switch (name) {
      case 'top-image-bottom-text': {
        // 依比例計算：寬約 87.5%，高約 67.5%，置中且略偏上（y ≈ 45%）
        const w = Math.round(cw * 0.875);
        const h = Math.round(ch * 0.675);
        const cx = cw * 0.5;
        const cy = ch * 0.45;
        addPlaceholder(cx, cy, w, h);
        // 文字大小約為高度的 3.5%
        const fontSize = Math.round(ch * 0.035);
        addTextBox('在此輸入文字', cw * 0.5, ch * 0.875, fontSize, 'center');
        break;
      }
      case 'left-image-right-text': {
        // 左側窄圖：寬約 58.33%，高約 87.5%，中心 x 約 31.25%，y 50%
        const w = Math.round(cw * 0.5833);
        const h = Math.round(ch * 0.875);
        const cx = cw * 0.3125;
        const cy = ch * 0.5;
        addPlaceholder(cx, cy, w, h);
        // 右側文字：中心 x 約 75%，y 50%，字體約 3.75%
        const fontSize = Math.round(ch * 0.0375);
        addTextBox('右側說明文字', cw * 0.75, ch * 0.5, fontSize, 'left');
        break;
      }
      case 'center-text': {
        const fontSize = Math.round(ch * 0.045);
        addTextBox('純文字置中', cw * 0.5, ch * 0.5, fontSize, 'center');
        break;
      }
      case 'fullscreen-image': {
        // 幾乎全屏：原本 480x800 下為 460x760，等於留 20 與 40 邊距
        // 轉為相對邊距比例：左右各 ~4.166%，上下各 ~5%
        const marginX = cw * 0.04166;
        const marginY = ch * 0.05;
        const w = Math.round(cw - marginX * 2);
        const h = Math.round(ch - marginY * 2);
        addPlaceholder(cw * 0.5, ch * 0.5, w, h);
        break;
      }
      default:
        // 無範本
        break;
    }
    App.canvas.requestRenderAll();
  }

  function addPlaceholder(cx, cy, w, h) {
    const rect = new fabric.Rect({
      left: cx, top: cy, originX: 'center', originY: 'center',
      width: w, height: h,
      fill: 'rgba(37,99,235,0.06)', stroke: '#2563eb', strokeDashArray: [8, 6],
      name: '圖片佔位符', selectable: true,
    });
    rect.meta = 'placeholder';
    App.canvas.add(rect);
    App.canvas.setActiveObject(rect);
  }

  function addTextBox(text, cx, cy, fontSize, align) {
    const t = new fabric.Textbox(text, {
      left: cx, top: cy, originX: 'center', originY: 'center',
      fontFamily: 'Noto Sans', fontSize: fontSize, textAlign: align,
      fill: '#000000', name: '文字', selectable: true,
    });
    App.canvas.add(t);
    App.canvas.setActiveObject(t);
  }

  function clearTemplateArtifacts() {
    // 不清空使用者已加的圖片，只移除舊的 placeholder
    const toRemove = App.canvas.getObjects().filter(o => o.meta === 'placeholder');
    toRemove.forEach(o => App.canvas.remove(o));
  }
}