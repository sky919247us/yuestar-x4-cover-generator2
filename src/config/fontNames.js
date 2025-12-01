/**
 * 字型檔案名稱與友好顯示名稱的對應表
 * 格式: { '檔案名稱(不含副檔名)': '顯示名稱' }
 */
export const FONT_DISPLAY_NAMES = {
    'ChenYuluoyan-2.0-Thin': '辰宇落雁',
    'Iansui-Regular': '芫荽',
    'jf-openhuninn-2.1': '粉圓',
    'KurewaGothicCjkTc-SemiBold': '苦累蛙圓',
    'YuPearl-SemiBold': '俊宇圓'
};

/**
 * 取得字型的友好顯示名稱
 * @param {string} fontFileName - 字型檔案名稱（不含副檔名）
 * @returns {string} 友好名稱或原始檔名
 */
export function getFontDisplayName(fontFileName) {
    return FONT_DISPLAY_NAMES[fontFileName] || fontFileName;
}

/**
 * 從顯示名稱取得實際字型名稱
 * @param {string} displayName - 友好顯示名稱
 * @returns {string} 實際字型檔案名稱
 */
export function getFontFileName(displayName) {
    for (const [fileName, friendlyName] of Object.entries(FONT_DISPLAY_NAMES)) {
        if (friendlyName === displayName) {
            return fileName;
        }
    }
    return displayName; // 如果找不到映射，返回原始名稱
}
