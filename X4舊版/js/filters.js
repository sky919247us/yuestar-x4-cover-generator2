function initFilters(canvas) {
  const grayToggle = document.getElementById('grayscaleToggle');
  const ditherToggle = document.getElementById('ditherToggle');

  grayToggle.addEventListener('change', async () => {
    App.state.grayscale = grayToggle.checked;
    ditherToggle.disabled = !grayToggle.checked;
    if (App.state.grayscale) await applyGrayscale();
    else await removeGrayscale();
  });

  ditherToggle.addEventListener('change', () => {
    App.state.dither = ditherToggle.checked;
    // 抖動效果在預覽/輸出時套用，以維持編輯效能
  });
}

async function applyGrayscale() {
  const objs = App.canvas.getObjects();
  for (const o of objs) {
    if (o.type === 'image') {
      o.filters = o.filters || [];
      // 若已存在灰階濾鏡則略過
      if (!o.filters.some(f => f && f.type === 'Grayscale')) {
        o.filters.push(new fabric.Image.filters.Grayscale());
      }
      await new Promise((res) => { o.applyFilters(); res(); });
    } else if (o.type === 'textbox') {
      // 修正：使用 App.state.origFillMap 並加入安全檢查
      const origFillMap = App && App.state && App.state.origFillMap;
      const orig = (origFillMap && origFillMap.get(o)) || o.fill || '#000000';
      if (origFillMap) {
        origFillMap.set(o, orig);
      }
      o.set('fill', toGrayHex(orig));
    }
  }
  App.canvas.requestRenderAll();
}

async function removeGrayscale() {
  const objs = App.canvas.getObjects();
  for (const o of objs) {
    if (o.type === 'image') {
      o.filters = (o.filters || []).filter(f => !(f && f.type === 'Grayscale'));
      await new Promise((res) => { o.applyFilters(); res(); });
    } else if (o.type === 'textbox') {
      // 修正：使用 App.state.origFillMap 並加入安全檢查
      const origFillMap = App && App.state && App.state.origFillMap;
      const orig = (origFillMap && origFillMap.get(o)) || '#000000';
      o.set('fill', orig);
    }
  }
  App.canvas.requestRenderAll();
}

function toGrayHex(hex) {
  const { r, g, b } = hexToRgb(hex);
  const y = Math.round(0.2126*r + 0.7152*g + 0.0722*b);
  const v = clamp(y, 0, 255);
  const h = v.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

function hexToRgb(hex) {
  let h = hex.replace('#','');
  if (h.length === 3) h = h.split('').map(c => c+c).join('');
  const n = parseInt(h, 16);
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }