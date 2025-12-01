function initLayers(canvas) {
  renderLayers();
}

function refreshLayers() { renderLayers(); }

function renderLayers() {
  const list = document.getElementById('layersList');
  list.innerHTML = '';
  const objs = App.canvas.getObjects();
  // 最高層在陣列尾端，顯示時從上往列出
  for (let i = objs.length - 1; i >= 0; i--) {
    const obj = objs[i];
    const li = document.createElement('li');
    li.className = 'layer-item';
    li.draggable = true;
    li.dataset.idx = String(i);

    const eye = document.createElement('span');
    eye.className = 'eye';
    eye.textContent = obj.visible ? '👁️' : '🚫';
    eye.title = '顯示/隱藏';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = obj.name || obj.type;

    const pick = document.createElement('button');
    pick.className = 'btn secondary';
    pick.textContent = '選取';

    // 新增：各別刪除按鈕
    const del = document.createElement('button');
    del.className = 'btn warning';
    del.textContent = '刪除';
    del.title = '刪除此圖層';

    eye.addEventListener('click', () => { obj.visible = !obj.visible; App.canvas.requestRenderAll(); renderLayers(); });
    pick.addEventListener('click', () => { App.canvas.setActiveObject(obj); App.canvas.requestRenderAll(); });
    del.addEventListener('click', () => {
      const ok = window.confirm('確定要刪除此圖層？');
      if (!ok) return;
      const wasActive = App.canvas.getActiveObject() === obj;
      App.canvas.remove(obj);
      if (wasActive) App.canvas.discardActiveObject();
      App.canvas.requestRenderAll();
      renderLayers();
    });

    // 拖曳排序
    li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', li.dataset.idx); });
    li.addEventListener('dragover', (e) => { e.preventDefault(); });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = Number(li.dataset.idx);
      if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
      // 轉換為 canvas 堆疊索引（0底層 -> N頂層）
      const canvasIndexFrom = from;
      const canvasIndexTo = to;
      const obj = App.canvas.getObjects()[canvasIndexFrom];
      if (!obj) return;
      App.canvas.moveTo(obj, canvasIndexTo);
      App.canvas.requestRenderAll();
      renderLayers();
    });

    li.appendChild(eye);
    li.appendChild(name);
    li.appendChild(pick);
    li.appendChild(del);
    list.appendChild(li);
  }
}