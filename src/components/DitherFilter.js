import { filters } from 'fabric';

/**
 * Custom Floyd-Steinberg Dithering Filter for Fabric.js
 */
export class DitherFilter extends filters.BaseFilter {
    static type = 'Dither';

    applyTo2d(options) {
        const ctx = options.ctx;
        const imageData = ctx.getImageData(0, 0, options.sourceWidth, options.sourceHeight);
        const data = imageData.data;
        const w = options.sourceWidth;
        const h = options.sourceHeight;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;

                // Assuming already grayscale, but let's ensure
                const oldR = data[i];
                const newR = oldR < 128 ? 0 : 255;
                const err = oldR - newR;

                data[i] = newR;
                data[i + 1] = newR;
                data[i + 2] = newR;
                // Alpha remains same usually, or 255

                // Distribute error
                if (x + 1 < w) {
                    data[i + 4] += (err * 7) / 16;
                }
                if (x - 1 >= 0 && y + 1 < h) {
                    data[i + w * 4 - 4] += (err * 3) / 16;
                }
                if (y + 1 < h) {
                    data[i + w * 4] += (err * 5) / 16;
                }
                if (x + 1 < w && y + 1 < h) {
                    data[i + w * 4 + 4] += (err * 1) / 16;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

// Register if needed, but in v6 we might just use it directly
// filters.Dither = DitherFilter;
