import './style.css'
import { CanvasManager } from './components/CanvasManager.js';
import { FontLoader } from './components/FontLoader.js';

document.addEventListener('DOMContentLoaded', async () => {
  const canvasManager = new CanvasManager('c');
  const fontLoader = new FontLoader();

  // Load custom fonts
  try {
    const customFonts = await fontLoader.loadFontsFromDirectory();
    const fontSelect = document.getElementById('font-family');

    // Add custom fonts to dropdown with display names
    customFonts.forEach(fontInfo => {
      const option = document.createElement('option');
      option.value = fontInfo.fontName;  // 實際字型名稱作為 value
      option.textContent = fontInfo.displayName;  // 友好名稱作為顯示文字
      fontSelect.appendChild(option);
    });

    console.log('已載入自訂字體:', customFonts.map(f => `${f.fontName} (${f.displayName})`).join(', '));
  } catch (error) {
    console.log('未找到自訂字體或載入失敗:', error);
  }

  const triggerUpload = (callback, accept = 'image/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) callback(file);
    };
    input.click();
  };

  const btnUploadBg = document.getElementById('btn-upload-bg');
  if (btnUploadBg) {
    btnUploadBg.addEventListener('click', () => {
      triggerUpload((file) => canvasManager.addImage(file));
    });
  }

  const btnUploadOverlay = document.getElementById('btn-upload-overlay');
  if (btnUploadOverlay) {
    btnUploadOverlay.addEventListener('click', () => {
      triggerUpload((file) => canvasManager.addOverlay(file), 'image/png,image/*');
    });
  }

  document.getElementById('btn-add-text')?.addEventListener('click', () => {
    canvasManager.addText();
  });

  const textPanel = document.getElementById('text-properties');
  const fontSelect = document.getElementById('font-family');
  const sizeInput = document.getElementById('font-size');
  const colorInput = document.getElementById('text-color');

  document.addEventListener('canvas:selection', (e) => {
    const props = e.detail;
    if (props && props.type === 'i-text') {
      textPanel.style.display = 'flex';
      if (fontSelect) fontSelect.value = props.fontFamily;
      if (sizeInput) sizeInput.value = props.fontSize;
      if (colorInput) colorInput.value = props.fill;
    } else {
      textPanel.style.display = 'none';
    }
  });

  fontSelect?.addEventListener('change', (e) => canvasManager.updateActiveObject('fontFamily', e.target.value));
  sizeInput?.addEventListener('input', (e) => canvasManager.updateActiveObject('fontSize', parseInt(e.target.value, 10)));
  colorInput?.addEventListener('input', (e) => canvasManager.updateActiveObject('fill', e.target.value));

  document.getElementById('btn-bold')?.addEventListener('click', () => canvasManager.updateActiveObject('format', 'bold'));
  document.getElementById('btn-italic')?.addEventListener('click', () => canvasManager.updateActiveObject('format', 'italic'));

  // Undo/Redo Controls
  document.getElementById('btn-undo')?.addEventListener('click', () => {
    canvasManager.undo();
  });

  document.getElementById('btn-redo')?.addEventListener('click', () => {
    canvasManager.redo();
  });

  // Rotation Controls
  document.getElementById('btn-rotate-left')?.addEventListener('click', () => {
    canvasManager.rotateActiveObject(-90);
  });

  document.getElementById('btn-rotate-right')?.addEventListener('click', () => {
    canvasManager.rotateActiveObject(90);
  });

  document.getElementById('btn-vertical-text')?.addEventListener('click', () => {
    canvasManager.toggleVerticalText();
  });

  const chkGrayscale = document.getElementById('chk-grayscale');
  const chkDither = document.getElementById('chk-dither');

  chkGrayscale?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    canvasManager.toggleGrayscale(isChecked);
    if (chkDither) {
      chkDither.disabled = !isChecked;
      if (!isChecked) {
        chkDither.checked = false;
        canvasManager.toggleDither(false);
      }
    }
  });

  chkDither?.addEventListener('change', (e) => {
    canvasManager.toggleDither(e.target.checked);
  });

  document.getElementById('btn-download')?.addEventListener('click', () => {
    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0');
    const filename = `readstar-x4_${timestamp}.jpg`;
    canvasManager.download(filename);
  });

  const layerList = document.getElementById('layer-list');

  document.addEventListener('canvas:update', (e) => {
    const layers = e.detail.layers;
    layerList.innerHTML = '';
    layers.forEach((layer, index) => {
      const li = document.createElement('li');
      li.className = 'layer-item';
      li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;';

      const info = document.createElement('span');
      info.textContent = `${layer.type === 'i-text' ? 'T' : '🖼️'} ${layer.text.substring(0, 10)}`;
      li.appendChild(info);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '5px';

      const createBtn = (text, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '2px 6px';
        btn.style.fontSize = '12px';
        btn.onclick = (evt) => {
          evt.stopPropagation();
          onClick();
        };
        return btn;
      };

      controls.appendChild(createBtn(layer.visible ? '👁️' : '🚫', () => canvasManager.toggleLayerVisibility(index)));
      controls.appendChild(createBtn('🗑️', () => canvasManager.deleteLayer(index)));

      if (index > 0) {
        controls.appendChild(createBtn('⬆️', () => canvasManager.moveLayer(index, index - 1)));
      }
      if (index < layers.length - 1) {
        controls.appendChild(createBtn('⬇️', () => canvasManager.moveLayer(index, index + 1)));
      }

      li.appendChild(controls);
      li.onclick = () => canvasManager.selectLayer(index);
      layerList.appendChild(li);
    });
  });

  document.getElementById('tpl-top-bottom')?.addEventListener('click', () => canvasManager.applyTemplate('top-bottom'));
  document.getElementById('tpl-center-text')?.addEventListener('click', () => canvasManager.applyTemplate('center-text'));
  document.getElementById('tpl-empty')?.addEventListener('click', () => canvasManager.clearCanvas());

  document.getElementById('btn-reset-layer')?.addEventListener('click', () => canvasManager.resetActiveObject());
  document.getElementById('btn-reset-all')?.addEventListener('click', () => {
    if (confirm('確定要清空畫布嗎？')) {
      canvasManager.clearCanvas();
    }
  });

  // Preview Modal Logic
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.querySelector('.close');
  const previewImg = document.getElementById('preview-img');
  const modalDownloadBtn = document.getElementById('btn-download-modal');

  document.getElementById('btn-preview')?.addEventListener('click', () => {
    const dataURL = canvasManager.getCanvas().toDataURL({
      format: 'jpeg',
      quality: 0.9,
      width: 480,
      height: 800,
      multiplier: 1
    });
    previewImg.src = dataURL;
    modal.style.display = 'block';
  });

  if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = 'none';
  };

  if (modalDownloadBtn) modalDownloadBtn.onclick = () => {
    const filename = prompt('請輸入檔案名稱', 'readstar-x4.jpg');
    if (filename) {
      canvasManager.download(filename.endsWith('.jpg') ? filename : filename + '.jpg');
      modal.style.display = 'none';
    }
  };
});
