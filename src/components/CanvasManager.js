import { Canvas, FabricImage, IText, filters } from 'fabric';
import { DitherFilter } from './DitherFilter.js';

export class CanvasManager {
    constructor(canvasId) {
        this.canvas = new Canvas(canvasId, {
            width: 480,
            height: 800,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });
        this.setupEvents();

        // Undo/Redo history
        this.history = [];
        this.historyStep = -1;
        this.maxHistory = 50;
    }

    setupEvents() {
        this.canvas.on('selection:created', (e) => this.onSelectionChange(e));
        this.canvas.on('selection:updated', (e) => this.onSelectionChange(e));
        this.canvas.on('selection:cleared', (e) => this.onSelectionChange(e));
        this.canvas.on('object:modified', () => this.notifyUpdate());
        this.canvas.on('object:added', () => this.notifyUpdate());
        this.canvas.on('object:removed', () => this.notifyUpdate());
    }

    notifyUpdate() {
        this.saveState();
        const event = new CustomEvent('canvas:update', {
            detail: { layers: this.getLayers() }
        });
        document.dispatchEvent(event);
    }

    onSelectionChange(e) {
        const event = new CustomEvent('canvas:selection', {
            detail: this.getActiveObjectProperties()
        });
        document.dispatchEvent(event);
    }

    saveState() {
        const json = JSON.stringify(this.canvas.toJSON(['customVertical', 'originalText']));
        if (this.historyStep < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyStep + 1);
        }
        this.history.push(json);
        this.historyStep++;
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.loadState(this.history[this.historyStep]);
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.loadState(this.history[this.historyStep]);
        }
    }

    loadState(jsonState) {
        const self = this;
        this.canvas.loadFromJSON(jsonState, function () {
            self.canvas.renderAll();
            self.notifyUpdate();
        });
    }

    canUndo() {
        return this.historyStep > 0;
    }

    canRedo() {
        return this.historyStep < this.history.length - 1;
    }

    async addImage(file) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        try {
            const img = await FabricImage.fromURL(url);
            img.set({ left: 240, top: 400, originX: 'center', originY: 'center' });
            if (img.width > 480 || img.height > 800) {
                const scale = Math.min(480 / img.width, 800 / img.height);
                img.scale(scale);
            }
            this.canvas.add(img);
            this.canvas.setActiveObject(img);
        } catch (err) {
            console.error('Error loading image:', err);
            alert('圖片載入失敗');
        }
    }

    async addOverlay(file) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        try {
            const img = await FabricImage.fromURL(url);
            img.set({ left: 240, top: 400, originX: 'center', originY: 'center' });
            const scale = 240 / img.width;
            img.scale(scale);
            this.canvas.add(img);
            this.canvas.setActiveObject(img);
        } catch (err) {
            console.error('Error loading overlay:', err);
            alert('疊圖載入失敗');
        }
    }

    addText() {
        const text = new IText('請輸入文字', {
            left: 240, top: 400, originX: 'center', originY: 'center',
            fontFamily: 'Noto Sans TC', fontSize: 40, fill: '#333333'
        });
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
    }

    updateActiveObject(prop, value) {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        if (prop === 'format') {
            if (value === 'bold') activeObj.set('fontWeight', activeObj.fontWeight === 'bold' ? 'normal' : 'bold');
            else if (value === 'italic') activeObj.set('fontStyle', activeObj.fontStyle === 'italic' ? 'normal' : 'italic');
        } else {
            activeObj.set(prop, value);
        }
        this.canvas.requestRenderAll();
        this.saveState();
    }

    rotateActiveObject(angle) {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        const currentAngle = activeObj.angle || 0;
        activeObj.set('angle', currentAngle + angle);
        this.canvas.requestRenderAll();
        this.saveState();
    }

    /**
     * Toggle vertical text - proper character stacking (not rotation)
     */
    toggleVerticalText() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj || !activeObj.isType('i-text')) return;

        const text = activeObj.text;
        const isVertical = activeObj.get('customVertical');

        if (isVertical) {
            // Convert back to horizontal
            const originalText = activeObj.get('originalText') || text.replace(/\n/g, '');
            activeObj.set({
                text: originalText,
                customVertical: false,
                originalText: null
            });
        } else {
            // Convert to vertical - split each character with newline
            const verticalText = text.split('').join('\n');
            activeObj.set({
                text: verticalText,
                customVertical: true,
                originalText: text,
                textAlign: 'center'
            });
        }

        this.canvas.requestRenderAll();
        this.saveState();
    }

    toggleGrayscale(enable) {
        this.isGrayscale = enable;
        const objs = this.canvas.getObjects();
        objs.forEach(obj => {
            if (obj.isType('image')) {
                if (enable) {
                    const hasGray = obj.filters.some(f => f.type === 'Grayscale');
                    if (!hasGray) {
                        obj.filters.push(new filters.Grayscale());
                        obj.applyFilters();
                    }
                } else {
                    obj.filters = obj.filters.filter(f => f.type !== 'Grayscale');
                    obj.applyFilters();
                }
            }
        });
        if (this.isDither) {
            this.toggleDither(true);
        }
        this.canvas.requestRenderAll();
    }

    toggleDither(enable) {
        this.isDither = enable;
        const objs = this.canvas.getObjects();
        objs.forEach(obj => {
            if (obj.isType('image')) {
                obj.filters = obj.filters.filter(f => f.type !== 'Dither');
                if (enable) {
                    obj.filters.push(new DitherFilter());
                }
                obj.applyFilters();
            }
        });
        this.canvas.requestRenderAll();
    }

    getLayers() {
        return this.canvas.getObjects().map((obj, index) => ({
            id: index,
            type: obj.type,
            text: obj.text || (obj.type === 'image' ? '圖片' : '物件'),
            visible: obj.visible,
            obj: obj
        })).reverse();
    }

    selectLayer(index) {
        const objs = this.canvas.getObjects();
        const realIndex = objs.length - 1 - index;
        const obj = objs[realIndex];
        if (obj) {
            this.canvas.setActiveObject(obj);
            this.canvas.renderAll();
        }
    }

    toggleLayerVisibility(index) {
        const objs = this.canvas.getObjects();
        const realIndex = objs.length - 1 - index;
        const obj = objs[realIndex];
        if (obj) {
            obj.visible = !obj.visible;
            if (!obj.visible) this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
            this.notifyUpdate();
        }
    }

    deleteLayer(index) {
        const objs = this.canvas.getObjects();
        const realIndex = objs.length - 1 - index;
        const obj = objs[realIndex];
        if (obj) {
            this.canvas.remove(obj);
            this.notifyUpdate();
        }
    }

    moveLayer(fromIndex, toIndex) {
        const objs = this.canvas.getObjects();
        const realFrom = objs.length - 1 - fromIndex;
        const realTo = objs.length - 1 - toIndex;
        const obj = objs[realFrom];
        obj.moveTo(realTo);
        this.notifyUpdate();
    }

    clearCanvas() {
        this.canvas.clear();
        this.canvas.backgroundColor = '#ffffff';
        this.notifyUpdate();
    }

    resetActiveObject() {
        const active = this.canvas.getActiveObject();
        if (active) {
            active.set({
                scaleX: 1, scaleY: 1, angle: 0,
                left: 240, top: 400, originX: 'center', originY: 'center'
            });
            active.setCoords();
            this.canvas.requestRenderAll();
            this.notifyUpdate();
        }
    }

    applyTemplate(type) {
        this.clearCanvas();
        if (type === 'top-bottom') {
            const text = new IText('請輸入文字', {
                left: 240, top: 600, originX: 'center', originY: 'center',
                fontFamily: 'Noto Sans TC', fontSize: 30, fill: '#333333'
            });
            this.canvas.add(text);
            const rect = new IText('圖片區域 (請上傳)', {
                left: 240, top: 200, originX: 'center', originY: 'center',
                fontSize: 20, fill: '#999999'
            });
            this.canvas.add(rect);
        } else if (type === 'center-text') {
            const text = new IText('在此輸入文字', {
                left: 240, top: 400, originX: 'center', originY: 'center',
                fontFamily: 'Noto Sans TC', fontSize: 50, fill: '#333333'
            });
            this.canvas.add(text);
        }
        this.notifyUpdate();
    }

    download(filename = 'readstar-x4.jpg') {
        try {
            // Deselect all objects before export
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();

            // Small delay to ensure render completes
            setTimeout(() => {
                try {
                    const dataURL = this.canvas.toDataURL({
                        format: 'jpeg',
                        quality: 0.9,
                        width: 480,
                        height: 800,
                        multiplier: 1
                    });

                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = dataURL;
                    link.style.display = 'none';

                    document.body.appendChild(link);
                    link.click();

                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(dataURL);
                    }, 100);

                    console.log('圖片下載成功:', filename);
                    alert('圖片已下載: ' + filename);
                } catch (innerError) {
                    console.error('下載處理失敗:', innerError);
                    alert('下載失敗，請再試一次');
                }
            }, 100);

            return true;
        } catch (error) {
            console.error('下載失敗:', error);
            alert('下載失敗: ' + error.message);
            return false;
        }
    }

    getActiveObjectProperties() {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return null;
        return {
            type: activeObj.type,
            fontFamily: activeObj.fontFamily,
            fontSize: activeObj.fontSize,
            fill: activeObj.fill,
            fontWeight: activeObj.fontWeight,
            fontStyle: activeObj.fontStyle,
            opacity: activeObj.opacity
        };
    }

    getCanvas() { return this.canvas; }
}
