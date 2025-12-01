/**
 * Load custom fonts from the fonts directory
 */
import { getFontDisplayName } from '../config/fontNames.js';

export class FontLoader {
    constructor() {
        this.loadedFonts = new Map(); // Map: fontFileName -> { fontName, displayName }
        this.fontsDir = '/fonts/';
    }

    /**
     * Scan fonts directory and load all font files
     */
    async loadFontsFromDirectory() {
        const fontFiles = import.meta.glob('/public/fonts/*.{ttf,otf,woff,woff2}', { eager: false });
        const fontPromises = [];

        for (const path in fontFiles) {
            const fontName = this.extractFontName(path);
            const fontFormat = this.getFontFormat(path);

            fontPromises.push(
                this.loadFont(fontName, path, fontFormat)
            );
        }

        await Promise.all(fontPromises);
        return Array.from(this.loadedFonts.values());
    }

    /**
     * Extract font name from file path
     */
    extractFontName(path) {
        const fileName = path.split('/').pop();
        const nameWithoutExt = fileName.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, '');
        return nameWithoutExt;
    }

    /**
     * Get font format from file extension
     */
    getFontFormat(path) {
        const ext = path.split('.').pop().toLowerCase();
        const formatMap = {
            'ttf': 'truetype',
            'otf': 'opentype',
            'woff': 'woff',
            'woff2': 'woff2'
        };
        return formatMap[ext] || 'truetype';
    }

    /**
     * Load a single font file
     */
    async loadFont(fontName, fontPath, format) {
        try {
            const fontFace = new FontFace(fontName, `url(${fontPath})`, {
                style: 'normal',
                weight: 'normal'
            });

            await fontFace.load();
            document.fonts.add(fontFace);

            const displayName = getFontDisplayName(fontName);
            this.loadedFonts.set(fontName, {
                fontName: fontName,
                displayName: displayName
            });

            console.log(`已載入字體: ${fontName} (${displayName})`);
        } catch (error) {
            console.error(`載入字體失敗: ${fontName}`, error);
        }
    }

    /**
     * Get list of loaded fonts with display names
     * @returns {Array} Array of { fontName, displayName }
     */
    getLoadedFonts() {
        return Array.from(this.loadedFonts.values());
    }
}
