function initExport(canvas) {
  const previewBtn = document.getElementById('previewBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const previewImg = document.getElementById('previewImage');
  const previewDialog = document.getElementById('previewDialog');
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  const previewResLabel = document.getElementById('previewResLabel');

  function getDataURL() {
    const placeholders = [];
    canvas.getObjects().forEach(obj => {
      if (obj.meta === 'placeholder') {
        placeholders.push(obj);
        obj.set('visible', false);
      }
    });
    canvas.requestRenderAll();
    try {
      // 改為 JPEG 輸出，預設品質 0.92
      const url = canvas.toDataURL({ format: 'jpeg', quality: 0.92 });
      return url;
    } finally {
      // 恢復占位符可見性
      placeholders.forEach(obj => obj.set('visible', true));
      canvas.requestRenderAll();
    }
  }

  previewBtn.addEventListener('click', () => {
    const url = getDataURL();
    previewImg.src = url;
    previewResLabel.textContent = `${canvas.width} × ${canvas.height}`;
    previewDialog.showModal();
  });

  closePreviewBtn.addEventListener('click', () => {
    previewDialog.close();
  });

  downloadBtn.addEventListener('click', () => {
    const url = getDataURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.jpg';
    a.click();
  });
}

async function composeOutputURL() {
  // 在導出前暫時隱藏暫位符
  const placeholders = App.canvas.getObjects().filter(o => o.meta === 'placeholder');
  const prevVis = placeholders.map(o => o.visible);
  placeholders.forEach(o => { o.visible = false; });
  App.canvas.requestRenderAll();

  try {
    // 先導出演算前的畫面（已排除暫位符）
    const pngData = App.canvas.toDataURL({ format: 'png', multiplier: 1 });
    const img = await loadImage(pngData);
    const out = document.createElement('canvas');
    out.width = 480; out.height = 800;
    const ctx = out.getContext('2d');
    ctx.drawImage(img, 0, 0, 480, 800);

    // 灰階／抖動處理
    if (App.state.grayscale || App.state.dither) {
      const id = ctx.getImageData(0, 0, out.width, out.height);
      if (App.state.grayscale) toGrayscale(id);
      if (App.state.dither) floydSteinberg(id, 16); // 16級灰階抖動
      ctx.putImageData(id, 0, 0);
    }

    // 轉為 JPG
    const jpg = out.toDataURL('image/jpeg', 0.92);
    return jpg;
  } finally {
    // 還原暫位符可見性
    placeholders.forEach((o, i) => { o.visible = prevVis[i]; });
    App.canvas.requestRenderAll();
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function toGrayscale(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const y = Math.round(0.2126*r + 0.7152*g + 0.0722*b);
    d[i] = d[i+1] = d[i+2] = y;
  }
}

function floydSteinberg(imageData, levels = 16) {
  const w = imageData.width, h = imageData.height;
  const d = imageData.data;
  const step = Math.round(255 / (levels - 1));

  // 轉灰階矩陣
  const Y = new Array(w*h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const y = d[i]; // 已灰階
    Y[p] = y;
  }

  function idx(x, y) { return y * w + x; }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      const old = Y[i];
      const newVal = Math.round(old / step) * step;
      const err = old - newVal;
      Y[i] = newVal;

      // 誤差擴散
      if (x+1 < w) Y[idx(x+1, y)] += err * (7/16);
      if (x-1 >= 0 && y+1 < h) Y[idx(x-1, y+1)] += err * (3/16);
      if (y+1 < h) Y[idx(x, y+1)] += err * (5/16);
      if (x+1 < w && y+1 < h) Y[idx(x+1, y+1)] += err * (1/16);
    }
  }

  // 寫回
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const val = Math.max(0, Math.min(255, Math.round(Y[p])));
    d[i] = d[i+1] = d[i+2] = val; // R,G,B
  }
}
