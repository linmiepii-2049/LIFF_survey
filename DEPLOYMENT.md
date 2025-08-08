# LIFF 問卷調查系統部署指南

## 📋 部署前準備

### 1. LINE Developers 設定

1. **建立 LINE Login Channel**
   - 前往 [LINE Developers Console](https://developers.line.biz/)
   - 建立新的 Provider (如果還沒有的話)
   - 建立新的 Channel，選擇 "LINE Login"
   - 記錄 Channel ID 和 Channel Secret

2. **設定 LIFF 應用程式**
   - 在 Channel 中建立 LIFF 應用程式
   - 設定 Endpoint URL (部署後的網址)
   - 記錄 LIFF ID

### 2. Google Sheets 準備

1. **建立 Google Sheets**
   - 前往 [Google Sheets](https://sheets.google.com/)
   - 建立新的試算表
   - 記錄試算表 ID (從 URL 中取得)

2. **設定權限**
   - 確保試算表可以公開編輯 (或設定適當的權限)
   - 記錄試算表 ID 供 Google Apps Script 使用

## 🚀 部署步驟

### 步驟 1: 部署前端檔案

#### 選項 A: 使用 GitHub Pages (推薦)

1. **上傳到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **啟用 GitHub Pages**
   - 前往 Repository Settings
   - 找到 Pages 設定
   - 選擇 Source 為 "Deploy from a branch"
   - 選擇 main 分支和 root 資料夾
   - 記錄部署後的 URL

#### 選項 B: 使用 Netlify

1. **部署到 Netlify**
   - 前往 [Netlify](https://netlify.com/)
   - 拖拽專案資料夾到部署區域
   - 或連接 GitHub repository
   - 記錄部署後的 URL

#### 選項 C: 使用 Vercel

1. **部署到 Vercel**
   - 前往 [Vercel](https://vercel.com/)
   - 連接 GitHub repository
   - 設定部署選項
   - 記錄部署後的 URL

### 步驟 2: 設定 Google Apps Script

1. **建立 Google Apps Script 專案**
   - 前往 [Google Apps Script](https://script.google.com/)
   - 建立新專案
   - 將 `google-apps-script.gs` 的內容複製到編輯器中

2. **修改設定**
   ```javascript
   // 修改這行，填入您的 Google Sheets ID
   const SPREADSHEET_ID = 'your-spreadsheet-id-here';
   ```

3. **部署為 Web App**
   - 點擊 "Deploy" > "New deployment"
   - 選擇 "Web app"
   - 設定執行身分為 "Me"
   - 設定存取權限為 "Anyone"
   - 記錄 Web App URL

### 步驟 3: 更新前端設定

1. **修改 JavaScript 檔案**
   - 開啟 `script.js`
   - 找到 `getLiffId()` 方法
   - 將 `'your-liff-id-here'` 替換為您的 LIFF ID

2. **更新 Google Apps Script URL**
   - 在 `script.js` 中找到 `submitToGoogleAppsScript()` 方法
   - 將 `'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'` 替換為您的 Web App URL

### 步驟 4: 測試部署

1. **測試 LIFF 應用程式**
   - 在 LINE 中開啟您的 LIFF 應用程式
   - 確認問卷表單正常載入
   - 測試表單提交功能

2. **檢查 Google Sheets**
   - 開啟您的 Google Sheets
   - 確認資料正確儲存
   - 檢查 "提交日誌" 工作表

## 🔧 進階設定

### 1. 自訂樣式

修改 `styles.css` 來調整外觀：
```css
/* 修改主要顏色 */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### 2. 新增問卷問題

在 `index.html` 中新增問題：
```html
<div class="question-group">
  <label class="question-label">新問題：</label>
  <div class="radio-group">
    <label class="radio-option">
      <input type="radio" name="new_question" value="選項1" required>
      <span class="radio-custom"></span>
      選項1
    </label>
  </div>
</div>
```

### 3. 修改 Google Apps Script

在 `google-apps-script.gs` 中新增欄位處理：
```javascript
// 在 cleanSurveyData() 方法中新增
cleaned.new_question = data.new_question || '';

// 在 createSurveySheet() 方法中新增標題
const headers = [
  // ... 現有標題
  '新問題'
];
```

## 🔒 安全設定

### 1. CORS 設定

Google Apps Script 已包含適當的 CORS 標頭：
```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### 2. 資料驗證

前端和後端都包含資料驗證：
- 必填欄位檢查
- 資料格式驗證
- 錯誤處理機制

## 📊 監控與維護

### 1. 查看統計資料

在 Google Apps Script 編輯器中執行：
```javascript
function testGetStats() {
  const stats = getSurveyStatistics();
  console.log(JSON.stringify(stats, null, 2));
}
```

### 2. 設定自動清理

在 Google Apps Script 編輯器中執行：
```javascript
function setupTriggers() {
  // 設定每日清理觸發器
  ScriptApp.newTrigger('cleanupOldData')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}
```

### 3. 備份資料

定期匯出 Google Sheets 資料：
- 檔案 > 下載 > Microsoft Excel (.xlsx)
- 或使用 Google Apps Script 自動備份

## 🐛 故障排除

### 常見問題

1. **LIFF 初始化失敗**
   - 檢查 LIFF ID 是否正確
   - 確認 Endpoint URL 設定
   - 檢查 Channel 設定

2. **Google Sheets 存取錯誤**
   - 確認試算表 ID 正確
   - 檢查試算表權限設定
   - 確認 Google Apps Script 權限

3. **CORS 錯誤**
   - 確認 Google Apps Script 已正確部署
   - 檢查 Web App URL 是否正確
   - 確認 CORS 標頭設定

4. **表單提交失敗**
   - 檢查網路連線
   - 查看瀏覽器開發者工具中的錯誤訊息
   - 確認所有必填欄位已填寫

### 除錯技巧

1. **查看瀏覽器 Console**
   - 按 F12 開啟開發者工具
   - 查看 Console 標籤中的錯誤訊息

2. **查看 Google Apps Script 日誌**
   - 在 Google Apps Script 編輯器中查看執行日誌
   - 使用 `console.log()` 輸出除錯資訊

3. **測試 Google Apps Script**
   ```javascript
   function testConnection() {
     console.log('Google Apps Script 連線測試');
     return '成功';
   }
   ```

## 📞 支援

如有問題，請檢查：
1. [LINE Developers 文件](https://developers.line.biz/docs/liff/)
2. [Google Apps Script 文件](https://developers.google.com/apps-script)
3. [Google Sheets API 文件](https://developers.google.com/sheets/api)

---

**注意**: 部署完成後，請務必測試所有功能，確保系統正常運作。 