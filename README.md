# 閱星曈X4 待機畫面網頁版生成器 v2.0

這是一個專為「閱星曈X4」電子書閱讀器設計的線上待機畫面生成工具。
完全在瀏覽器端執行，無須上傳圖片至伺服器，安全且快速。

## 功能特色

*   **專屬規格**: 自動輸出 480x800 像素 JPG 圖片。
*   **E-ink 優化**: 內建一鍵灰階轉換與 Floyd-Steinberg 抖動處理，提升電子紙顯示效果。
*   **圖層管理**: 支援多圖層疊加、排序、隱藏與刪除。
*   **文字編輯**: 支援多種字體、大小、顏色與粗斜體設定。
*   **快速範本**: 提供常用版型，快速製作。

## 如何使用 (GitHub Pages)

本專案已設定 GitHub Actions，將程式碼推送到 GitHub 後，啟用 GitHub Pages 即可直接使用。

1.  將本專案推送到您的 GitHub Repository。
2.  進入 Repository 的 **Settings** > **Pages**。
3.  在 **Build and deployment** > **Source** 選擇 **GitHub Actions**。
4.  等待 Action 執行完畢，即可透過提供的網址訪問。

## 本地開發與執行

由於瀏覽器安全性限制 (CORS)，本專案使用了 ES Modules，**無法直接雙擊 index.html 開啟**。

### 方法一：使用 Node.js (推薦)

1.  安裝依賴：
    ```bash
    npm install
    ```
2.  啟動開發伺服器：
    ```bash
    npm run dev
    ```
3.  開啟瀏覽器訪問 `http://localhost:5173`。

### 方法二：使用 VS Code Live Server

如果您使用 VS Code，可以安裝 "Live Server" 擴充套件，右鍵點擊 `index.html` 選擇 "Open with Live Server" 即可。

## 技術棧

*   Vite
*   Fabric.js v6
*   Vanilla JavaScript / CSS

## 授權

MIT License
