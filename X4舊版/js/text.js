function initTextEditing(canvas) {
  // 確保原始屬性映射存在（寬度/對齊/行距）
  if (App && App.state && !App.state.origPropsMap) {
    App.state.origPropsMap = new Map();
  }
  document.getElementById('addTextBtn').addEventListener('click', () => {
    const t = new fabric.Textbox('雙擊編輯文字', {
      left: 240, top: 400, originX: 'center', originY: 'center',
      fontFamily: 'Noto Sans', fontSize: 28, textAlign: 'center',
      fill: '#000000', name: '文字', selectable: true,
    });
    // 預設為橫排
    t.metaDirection = 'horizontal';
    t._logicalText = normalizeBreaks(t.text || '');
    // 修正：使用 App.state.origFillMap 並加入安全檢查
    if (App && App.state && App.state.origFillMap) {
      App.state.origFillMap.set(t, t.fill);
    }
    // 綁定直排維護邏輯
    bindVerticalMaintenance(t, canvas);

    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
  });

  const fontSelect = document.getElementById('fontSelect');
  const sizeInput = document.getElementById('fontSizeInput');
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const colorInput = document.getElementById('fontColorInput');
  const dirHBtn = document.getElementById('textDirHorizontalBtn');
  const dirVBtn = document.getElementById('textDirVerticalBtn');
  const dirBtnsWrap = document.getElementById('textDirectionButtons');

  fontSelect.addEventListener('change', () => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      obj.set('fontFamily', fontSelect.value);
      canvas.requestRenderAll();
    }
  });

  sizeInput.addEventListener('input', () => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      obj.set('fontSize', Number(sizeInput.value));
      canvas.requestRenderAll();
    }
  });

  boldBtn.addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      const now = obj.fontWeight === 'bold' ? 'normal' : 'bold';
      obj.set('fontWeight', now);
      canvas.requestRenderAll();
    }
  });

  italicBtn.addEventListener('click', () => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      const now = obj.fontStyle === 'italic' ? 'normal' : 'italic';
      obj.set('fontStyle', now);
      canvas.requestRenderAll();
    }
  });

  colorInput.addEventListener('input', () => {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      obj.set('fill', colorInput.value);
      // 修正：使用 App.state.origFillMap 並加入安全檢查
      if (App && App.state && App.state.origFillMap) {
        App.state.origFillMap.set(obj, colorInput.value);
      }
      canvas.requestRenderAll();
    }
  });

  // 規範換行符為 \n，避免 Windows 的 \r\n 造成段落判定錯誤
  function normalizeBreaks(text) {
    return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
  const NBSP = '\u00A0';
  const ZWSP = '\u200B';

  // 直排逐字：逐字垂直堆疊，並保留邏輯文本中的單一換行為「空白行」
  function toVerticalStack(text) {
    const t = normalizeBreaks(text);
    return Array.from(t)
      .map(ch => ch === '\n' ? '' : ch)
      .join('\n');
  }
  // 從直排顯示文本還原邏輯文本：空白行代表邏輯文本中的單一換行
  function fromVerticalStack(text) {
    const t = normalizeBreaks(text);
    return t.split('\n')
      .map(line => line.length === 0 ? '\n' : line[0])
      .join('');
  }

  // 綁定/維護直排輸入：在文字改變時重新堆疊，保留原始段落換行
  function bindVerticalMaintenance(obj, canvas) {
    if (!obj || obj._verticalBound) return;
    obj._verticalBound = true;
    obj.on('changed', () => {
      if (obj.type !== 'textbox') return;
      // 在直排模式下，TextBox 的顯示文本可能被編輯器直接改動，需回推邏輯文本
      if (obj.metaDirection === 'vertical') {
        obj._logicalText = fromVerticalStack(obj.text);
        const stacked = toVerticalStack(obj._logicalText);
        if (obj.text !== stacked) {
          obj.set('text', stacked);
          canvas.requestRenderAll();
        }
      }
    });
    obj.on('editing:entered', () => {
      // 進入編輯時用邏輯文本重建顯示，避免 NBSP/逐字間斷被破壞
      if (obj.metaDirection === 'vertical') {
        obj._logicalText = normalizeBreaks(obj._logicalText || obj.text || '');
        obj.set('text', toVerticalStack(obj._logicalText));
        canvas.requestRenderAll();
      }
    });
    obj.on('editing:exited', () => {
      if (obj.metaDirection === 'vertical') {
        obj._logicalText = fromVerticalStack(obj.text);
        obj.set('text', toVerticalStack(obj._logicalText));
        canvas.requestRenderAll();
      }
    });
  }

  // 新增：排版方向（橫排/直排）切換，僅作用於目前選取的文字圖層
  function setDirButtonsActive(dir) {
    if (!dirHBtn || !dirVBtn) return;
    dirHBtn.classList.toggle('dir-active', dir === 'horizontal');
    dirVBtn.classList.toggle('dir-active', dir === 'vertical');
  }

  function applyDirection(obj, dir) {
    if (!obj || obj.type !== 'textbox') return;
    if (dir === 'vertical') {
      if (App && App.state) {
        if (!App.state.origTextMap) App.state.origTextMap = new Map();
        App.state.origTextMap.set(obj, obj.text);
        if (!App.state.origPropsMap) App.state.origPropsMap = new Map();
        App.state.origPropsMap.set(obj, { width: obj.width, textAlign: obj.textAlign, lineHeight: obj.lineHeight });
      }
      obj._logicalText = normalizeBreaks(obj.text);
      const stacked = toVerticalStack(obj._logicalText);
      obj.set({ text: stacked, angle: 0, textAlign: obj.textAlign, lineHeight: obj.lineHeight });
      const width = Math.max(20, Math.round(obj.fontSize * 1.6));
      obj.set({ width });
      obj.metaDirection = 'vertical';
      bindVerticalMaintenance(obj, canvas);
    } else {
      const origText = (App && App.state && App.state.origTextMap) ? App.state.origTextMap.get(obj) : null;
      const origProps = (App && App.state && App.state.origPropsMap) ? App.state.origPropsMap.get(obj) : null;
      const restoredText = origText != null ? origText : (obj._logicalText ? obj._logicalText : fromVerticalStack(obj.text));
      const targetProps = origProps || {};
      obj.set({
        text: restoredText,
        angle: 0,
        textAlign: targetProps.textAlign !== undefined ? targetProps.textAlign : obj.textAlign,
        lineHeight: targetProps.lineHeight !== undefined ? targetProps.lineHeight : obj.lineHeight,
        width: targetProps.width !== undefined ? targetProps.width : obj.width,
      });
      obj._logicalText = normalizeBreaks(obj.text);
      obj.metaDirection = 'horizontal';
    }
    obj.setCoords();
    canvas.requestRenderAll();
    setDirButtonsActive(dir);
  }

  if (dirHBtn) {
    dirHBtn.addEventListener('click', () => {
      const obj = canvas.getActiveObject();
      if (obj) applyDirection(obj, 'horizontal');
    });
  }
  if (dirVBtn) {
    dirVBtn.addEventListener('click', () => {
      const obj = canvas.getActiveObject();
      if (obj) applyDirection(obj, 'vertical');
    });
  }

  // 修正：在編輯狀態下確保 Enter 插入換行（避免被瀏覽器/IME 攔截）
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox' || !obj.isEditing) return;
    e.preventDefault();
    const start = typeof obj.selectionStart === 'number' ? obj.selectionStart : obj.text.length;
    const end = typeof obj.selectionEnd === 'number' ? obj.selectionEnd : start;

    if (obj.metaDirection === 'vertical') {
      // 直排：將顯示文字選取區轉回邏輯位置，插入單一換行
      const beforeDisplay = obj.text.slice(0, start);
      const afterDisplay = obj.text.slice(end);
      const beforeLogical = fromVerticalStack(beforeDisplay);
      const afterLogical = fromVerticalStack(afterDisplay);
      obj._logicalText = (obj._logicalText || fromVerticalStack(obj.text));
      obj._logicalText = beforeLogical + '\n' + afterLogical;
      obj.set('text', toVerticalStack(obj._logicalText));
      // 更新游標位置至換行後（顯示字串為直排堆疊，需換算）
      const newCaretDisplayPos = (beforeLogical.length + 1) * 1; // 每個邏輯字對應 1 行
      obj.selectionStart = obj.selectionEnd = newCaretDisplayPos;
    } else {
      // 橫排：直接在顯示文字插入換行，避免誤用直排還原邏輯導致吞字
      const before = obj.text.slice(0, start);
      const after = obj.text.slice(end);
      const updated = normalizeBreaks(before) + '\n' + normalizeBreaks(after);
      obj.set('text', updated);
      obj._logicalText = normalizeBreaks(updated);
      obj.selectionStart = obj.selectionEnd = (normalizeBreaks(before).length + 1);
    }
    obj.setCoords();
    canvas.requestRenderAll();
  });
}