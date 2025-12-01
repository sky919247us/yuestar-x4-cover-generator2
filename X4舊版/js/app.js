// App 入口
window.App = {
  canvas: null,
  state: {
    grayscale: false,
    dither: false,
    selected: null,
    initialMap: new WeakMap(), // 保存物件初始狀態
    origFillMap: new WeakMap(), // 保存文字原始顏色
    origTextMap: new WeakMap(), // 保存文字原始內容（切換直排時使用）
  },
};

window.addEventListener('DOMContentLoaded', () => {
  // 初始化各模組
  App.canvas = initCanvas();
  initUpload(App.canvas);
  initTemplates(App.canvas);
  initTextEditing(App.canvas);
  initLayers(App.canvas);
  initTouch(App.canvas);
  initFilters(App.canvas);
  initExport(App.canvas);

  // 共同 UI 事件
  const scaleSlider = document.getElementById('scaleSlider');
  scaleSlider.addEventListener('input', () => {
    const obj = App.canvas.getActiveObject();
    if (!obj) return;
    const scale = Number(scaleSlider.value) / 100;
    obj.scale(scale);
    obj.setCoords();
    App.canvas.requestRenderAll();
  });

  document.getElementById('rotateLeftBtn').addEventListener('click', () => rotateActive(-90));
  document.getElementById('rotateRightBtn').addEventListener('click', () => rotateActive(90));
  document.getElementById('rotate180Btn').addEventListener('click', () => rotateActive(180));
  document.getElementById('resetCurrentBtn').addEventListener('click', () => resetCurrent());

  // 解析度套用
  const resW = document.getElementById('resWidthInput');
  const resH = document.getElementById('resHeightInput');
  const applyResBtn = document.getElementById('applyResolutionBtn');
  applyResBtn.addEventListener('click', () => {
    const w = Math.max(1, Number(resW.value));
    const h = Math.max(1, Number(resH.value));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      alert('請輸入有效的寬度與高度');
      return;
    }
    App.canvas.setDimensions({ width: w, height: h });
    App.canvas.setBackgroundColor('#ffffff', App.canvas.renderAll.bind(App.canvas));
    // 新增：解析度變更後，依容器寬度重算顯示縮放
    if (typeof fitCanvasDisplay === 'function') fitCanvasDisplay();
    App.canvas.requestRenderAll();
  });

  // 全部重製（二次確認）
  document.getElementById('resetAllBtn').addEventListener('click', () => {
    if (!confirm('確定要清空畫布並恢復初始介面？')) return;
    const objs = App.canvas.getObjects();
    objs.forEach(o => App.canvas.remove(o));
    // 重置狀態與切換
    document.getElementById('grayscaleToggle').checked = false;
    document.getElementById('ditherToggle').checked = false;
    document.getElementById('ditherToggle').disabled = true;
    App.state.grayscale = false; App.state.dither = false;
    document.getElementById('templateSelect').value = 'none';
    App.canvas.discardActiveObject();
    App.canvas.requestRenderAll();
    refreshLayers();
  });

  function rotateActive(deg) {
    const obj = App.canvas.getActiveObject();
    if (!obj) return;
    const angle = ((obj.angle || 0) + deg) % 360;
    obj.rotate(angle);
    obj.setCoords();
    App.canvas.requestRenderAll();
  }

  function resetCurrent() {
    const obj = App.canvas.getActiveObject();
    if (!obj) return;
    const init = App.state.initialMap.get(obj);
    if (!init) return;
    obj.set({ left: init.left, top: init.top, scaleX: init.scaleX, scaleY: init.scaleY, angle: init.angle, flipX: init.flipX, flipY: init.flipY });
    obj.setCoords();
    App.canvas.requestRenderAll();
  }

  // 畫布物件選取監聽
  App.canvas.on('selection:created', e => onSelection(e));
  App.canvas.on('selection:updated', e => onSelection(e));
  App.canvas.on('selection:cleared', () => { App.state.selected = null; });
  function onSelection(e) {
    App.state.selected = e.selected[0] || null;
    // 更新縮放條顯示
    const obj = App.state.selected;
    if (obj) {
      const scale = Math.round((obj.scaleX || 1) * 100);
      document.getElementById('scaleSlider').value = String(scale);
    }
    // 同步方向按鈕 active 狀態（僅文字物件）
    const hBtn = document.getElementById('textDirHorizontalBtn');
    const vBtn = document.getElementById('textDirVerticalBtn');
    if (hBtn && vBtn) {
      const dir = (obj && obj.type === 'textbox' && obj.metaDirection === 'vertical') ? 'vertical' : 'horizontal';
      hBtn.classList.toggle('dir-active', dir === 'horizontal');
      vBtn.classList.toggle('dir-active', dir === 'vertical');
    }
    refreshLayers();
  }
});