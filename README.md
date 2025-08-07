# LIFF 問卷調查系統

## 專案概述

這是一個基於 LINE Frontend Framework (LIFF) 的問卷調查系統，提供跨平台的行動問卷功能，支援多種問卷類型與即時資料收集。

## 技術架構

### 前端技術
- **LIFF SDK**: LINE Frontend Framework 整合
- **現代化前端框架**: 支援響應式設計與行動優先體驗
- **CORS 安全規範**: 遵循跨來源請求安全最佳實踐

### 後端架構
- **Node.js 代理服務**: 處理前端對第三方 API 的請求
- **Google Apps Script**: 部署為 Web API，處理 Google Sheets 資料操作
- **雲端函數**: 作為中介服務器，解決 CORS 限制問題

### 資料儲存
- **Google Sheets**: 作為主要資料儲存與管理平台
- **即時同步**: 支援問卷資料的即時更新與統計

## 專案特色

- ✅ **跨平台支援**: 透過 LIFF 在 LINE 應用程式內運行
- ✅ **即時資料收集**: 問卷回應即時同步至 Google Sheets
- ✅ **安全 CORS 設定**: 遵循安全規範，防止跨來源請求漏洞
- ✅ **響應式設計**: 適配各種裝置螢幕尺寸
- ✅ **多種問卷類型**: 支援單選、多選、文字輸入等問卷格式

## 安裝與設定

### 前置需求
- Node.js (建議版本 18.x 或以上)
- Google Apps Script 專案
- LINE Developers 帳號與 LIFF 應用程式

### 安裝步驟

1. **複製專案**
   ```bash
   git clone [專案網址]
   cd LIFF問卷調查
   ```

2. **安裝依賴套件**
   ```bash
   npm install
   ```

3. **環境變數設定**
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案，填入必要的環境變數
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

### 環境變數

建立 `.env` 檔案並設定以下變數：

```env
# LINE LIFF 設定
LIFF_ID=your_liff_id
LIFF_URL=https://your-domain.com

# Google Apps Script 設定
GOOGLE_APPS_SCRIPT_URL=your_apps_script_web_app_url

# 後端 API 設定
API_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## 開發規範

### 程式碼品質
- 所有註解與文件使用繁體中文
- 遵循單一職責原則，模組功能明確分工
- 命名清楚且具可維護性
- 避免硬編資料，需標註可追溯的資料來源

### CORS 安全規範
- 不可同時使用 `Access-Control-Allow-Origin: *` 與 `Access-Control-Allow-Credentials: true`
- 動態 Origin 設定需有白名單驗證
- 明確列出允許的標頭與方法，避免使用通配符
- 前端使用 `credentials: 'include'` 攜帶憑證

### 錯誤處理
- 集中管理錯誤邏輯，定義明確的錯誤代碼
- 妥善管理非同步狀態，避免競爭條件
- 記錄資料載入結果與狀態，便於除錯追蹤

## 部署說明

### 生產環境部署
1. 設定生產環境變數
2. 部署 Node.js 代理服務
3. 發布 Google Apps Script 為 Web API
4. 設定 LIFF 應用程式的生產網址

### 監控與維護
- 定期檢查問卷回應資料
- 監控 API 效能與錯誤率
- 更新安全憑證與依賴套件

## 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡資訊

如有問題或建議，請透過以下方式聯絡：
- 專案 Issues: [GitHub Issues](專案網址/issues)
- 技術支援: [聯絡信箱]

---

**注意**: 本專案遵循嚴格的開發規範與品質守則，確保程式碼的可維護性與安全性。 