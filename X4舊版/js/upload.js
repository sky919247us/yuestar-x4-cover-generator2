function initUpload(canvas) {
  const primaryInput = document.getElementById('primaryImageInput');
  const overlayInput = document.getElementById('overlayImageInput');

  primaryInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await fileToFabricImage(file);
    // 主要圖片：預設填滿寬或高（等比）
    const maxW = 480, maxH = 800;
    const scaleX = maxW / img.width;
    const scaleY = maxH / img.height;
    const scale = Math.min(scaleX, scaleY);
    img.set({ left: maxW/2, top: maxH/2, originX: 'center', originY: 'center' });
    img.scale(scale);
    img.set('name', '主要圖片');
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  });

  overlayInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await fileToFabricImage(file);
    const targetW = 480 * 0.5; // 初始寬度 50%
    const scale = targetW / img.width;
    img.set({ left: 240, top: 400, originX: 'center', originY: 'center' });
    img.scale(scale);
    img.set('name', '疊圖');
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  });
}

function fileToFabricImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      fabric.Image.fromURL(reader.result, (img) => resolve(img), { crossOrigin: 'anonymous' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}