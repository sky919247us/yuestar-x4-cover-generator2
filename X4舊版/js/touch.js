function initTouch(canvas) {
  const el = canvas.upperCanvasEl;
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const delta = Math.sign(e.deltaY);
    const current = obj.scaleX || 1;
    const next = Math.min(5, Math.max(0.1, current * (delta > 0 ? 0.95 : 1.05)));
    obj.scale(next);
    obj.setCoords();
    canvas.requestRenderAll();
    document.getElementById('scaleSlider').value = String(Math.round(next * 100));
  }, { passive: false });

  // 簡易雙指縮放（觸控）
  let pinch = null;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinch = {
        startDist: distance(e.touches[0], e.touches[1]),
        startScale: getActiveScale(canvas),
      };
    }
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (pinch && e.touches.length === 2) {
      const obj = canvas.getActiveObject();
      if (!obj) return;
      const dist = distance(e.touches[0], e.touches[1]);
      const factor = dist / pinch.startDist;
      const next = Math.min(5, Math.max(0.1, pinch.startScale * factor));
      obj.scale(next);
      obj.setCoords();
      canvas.requestRenderAll();
      document.getElementById('scaleSlider').value = String(Math.round(next * 100));
    }
  }, { passive: true });

  el.addEventListener('touchend', () => { pinch = null; }, { passive: true });
}

function distance(a, b) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx*dx + dy*dy);
}

function getActiveScale(canvas) {
  const obj = canvas.getActiveObject();
  return obj ? (obj.scaleX || 1) : 1;
}