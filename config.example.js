// LIFF 問卷調查系統設定範例
// 請複製此檔案為 config.js 並填入實際值

const config = {
  // LINE LIFF 設定
  liff: {
    id: 'your-liff-id-here',
    url: 'https://your-domain.com'
  },

  // Google Apps Script 設定
  googleAppsScript: {
    url: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    spreadsheetId: 'your-spreadsheet-id-here'
  },

  // 後端 API 設定 (如果使用)
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000
  },

  // 應用程式設定
  app: {
    name: '麵包購買習慣調查',
    version: '1.0.0',
    debug: true,
    logLevel: 'info'
  },

  // 問卷設定
  survey: {
    title: '🍞 麵包購買習慣調查',
    description: '感謝您參與本次調查，您的意見對我們非常重要！',
    sections: [
      {
        id: 'basic',
        title: '📋 Part 1：基本背景',
        required: true
      },
      {
        id: 'purchase',
        title: '🛒 Part 2：購買習慣調查',
        required: true
      },
      {
        id: 'preference',
        title: '🎯 Part 3：選擇考量',
        required: true
      },
      {
        id: 'feedback',
        title: '💭 Part 4：意見與建議',
        required: false
      }
    ]
  },

  // 驗證設定
  validation: {
    requiredFields: [
      'phone_number',
      'age',
      'gender', 
      'location',
      'purchase_frequency',
      'purchase_time',
      'meal_type'
    ],
    maxTextLength: 1000,
    phonePattern: /^09\d{8}$/
  },

  // 樣式設定
  styles: {
    primaryColor: '#daa520',
    secondaryColor: '#cd853f',
    successColor: '#27ae60',
    errorColor: '#e74c3c',
    borderRadius: '10px',
    animationDuration: '0.3s'
  }
};

// 開發環境設定
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  config.app.debug = true;
  config.app.logLevel = 'debug';
}

// 匯出設定
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else if (typeof window !== 'undefined') {
  window.SurveyConfig = config;
} 