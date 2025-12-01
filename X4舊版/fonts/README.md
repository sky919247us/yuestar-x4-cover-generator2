# 自訂字型使用說明

將你的字型檔放入本目錄（建議使用 `.woff2`，也支援 `.woff`、`.ttf`）。

## 步驟
1. 將字型檔放進 `d:\X4\X4\fonts` 目錄，例如：
   - `CustomFontA-Regular.woff2`
   - `CustomFontA-Bold.woff2`
   - `CustomFontB-Regular.ttf`
2. 編輯 `styles/fonts.css`，把 `@font-face` 的 `src` 路徑與 `font-family` 名稱改為你的字型檔名與想要的名稱。
3. 在頁面「文字設定」的字體下拉選單，選擇你設定好的 `font-family` 名稱（例如 `CustomFontA`）。

> 小提醒：字型名稱（`font-family`）需與下拉選單的 `option value` 一致，大小寫也需要一致。