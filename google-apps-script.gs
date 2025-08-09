/**
 * Google Apps Script 問卷資料處理
 * 用於接收 LIFF 問卷資料並儲存到 Google Sheets
 */

// 全域變數
const SPREADSHEET_ID = '1oyIZOeG2qcS5AjK9DQC_ahNs_tpLPjVi-46ilmGus2s'; // 請替換為您的 Google Sheets ID
const SHEET_NAME = '問卷回應資料';

/**
 * 處理 Web App 請求
 */
function doPost(e) {
  try {
    // 若直接從瀏覽器呼叫將可能觸發預檢，建議改走代理
    // 這裡不再嘗試手動設定 CORS 標頭，避免 Apps Script setHeaders 相關錯誤

    // 解析請求資料
    const requestData = JSON.parse(e.postData.contents);
    console.log('收到請求資料:', requestData);

    // 驗證請求
    if (!requestData.action || !requestData.data) {
      throw new Error('無效的請求格式');
    }

    let response;

    // 根據動作類型處理
    switch (requestData.action) {
      case 'submitSurvey':
        response = handleSurveySubmission(requestData.data);
        break;
      case 'getSurveyStats':
        response = getSurveyStatistics();
        break;
      default:
        throw new Error('不支援的動作類型');
    }

    // 回傳成功回應
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: response
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('處理請求時發生錯誤:', error);
    
    // 回傳錯誤回應
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || '處理請求時發生錯誤'
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 GET 請求
 */
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'LIFF 問卷調查 API 服務正常運行',
    timestamp: new Date().toISOString()
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(headers);
}

/**
 * 處理問卷提交
 */
function handleSurveySubmission(data) {
  try {
    // 驗證必要欄位
    const requiredFields = ['phone_number', 'age', 'gender', 'location', 'purchase_frequency', 'purchase_time', 'meal_type'];
    const missingFields = validateRequiredFields(data, requiredFields);
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必要欄位: ${missingFields.join(', ')}`);
    }

    // 清理和格式化資料
    const cleanedData = cleanSurveyData(data);
    
    // 儲存到 Google Sheets
    const result = saveToGoogleSheets(cleanedData);
    
    // 記錄成功提交
    logSubmission(cleanedData, true);
    
    return {
      message: '問卷提交成功',
      submissionId: result.submissionId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('處理問卷提交時發生錯誤:', error);
    logSubmission(data, false, error.message);
    throw error;
  }
}

/**
 * 驗證必要欄位
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || 
        (Array.isArray(data[field]) && data[field].length === 0) ||
        (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return missingFields;
}

/**
 * 清理問卷資料
 */
function cleanSurveyData(data) {
  const cleaned = {};
  
      // 基本資料
    cleaned.phone_number = data.phone_number || '';
    cleaned.age = data.age || '';
    cleaned.gender = data.gender || '';
    cleaned.location = data.location || '';
  
  // 購買習慣
  cleaned.purchase_frequency = data.purchase_frequency || '';
  cleaned.purchase_location = formatArrayData(data.purchase_location);
  cleaned.purchase_time = data.purchase_time || '';
  cleaned.meal_type = data.meal_type || '';
  
  // 選擇考量
  cleaned.priority_factors = formatArrayData(data.priority_factors);
  cleaned.health_premium = data.health_premium || '';
  cleaned.natural_preference = data.natural_preference || '';
  cleaned.taste_preference = formatArrayData(data.taste_preference);
  
  // 意見與建議
  cleaned.bread_types = formatArrayData(data.bread_types);
  cleaned.favorite_bread = data.favorite_bread || '';
  cleaned.hard_to_find_bread = data.hard_to_find_bread || '';
  
  // 用戶資訊
  cleaned.userId = data.userId || '';
  cleaned.userName = data.userName || '';
  cleaned.submissionDate = data.submissionDate || new Date().toLocaleString('zh-TW');
  cleaned.timestamp = data.timestamp || new Date().toISOString();
  
  return cleaned;
}

/**
 * 格式化陣列資料
 */
function formatArrayData(data) {
  if (Array.isArray(data)) {
    return data.join(', ');
  }
  return data || '';
}

/**
 * 儲存到 Google Sheets
 */
function saveToGoogleSheets(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // 如果工作表不存在，建立新的
    if (!sheet) {
      sheet = createSurveySheet(spreadsheet);
    }
    
    // 準備資料列
    const rowData = [
      data.submissionDate,           // 提交時間
      data.userId,                   // 用戶 ID
      data.userName,                 // 用戶名稱
      data.phone_number,             // 手機號碼 (會員ID)
      data.age,                      // 年齡
      data.gender,                   // 性別
      data.location,                 // 居住地
      data.purchase_frequency,       // 購買頻率
      data.purchase_location,        // 購買地點
      data.purchase_time,            // 購買時間
      data.meal_type,                // 餐點類型
      data.priority_factors,         // 重視因素
      data.health_premium,           // 健康加價意願
      data.natural_preference,       // 天然食材偏好
      data.taste_preference,         // 口味偏好
      data.bread_types,              // 常吃麵包種類
      data.favorite_bread,           // 最喜歡的麵包
      data.hard_to_find_bread,       // 難找的麵包
      data.timestamp                 // 時間戳記
    ];
    
    // 新增資料列
    sheet.appendRow(rowData);
    
    // 取得新增的列號
    const lastRow = sheet.getLastRow();
    
    return {
      submissionId: lastRow,
      message: '資料已成功儲存到 Google Sheets'
    };
    
  } catch (error) {
    console.error('儲存到 Google Sheets 時發生錯誤:', error);
    throw new Error('無法儲存資料到 Google Sheets');
  }
}

/**
 * 建立問卷工作表
 */
function createSurveySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAME);
  
  // 設定標題列
  const headers = [
    '提交時間',
    '用戶ID',
    '用戶名稱',
    '手機號碼(會員ID)',
    '年齡',
    '性別',
    '居住地',
    '購買頻率',
    '購買地點',
    '購買時間',
    '餐點類型',
    '重視因素',
    '健康加價意願',
    '天然食材偏好',
    '口味偏好',
    '常吃麵包種類',
    '最喜歡的麵包',
    '難找的麵包',
    '時間戳記'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定標題列樣式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  // 自動調整欄寬
  sheet.autoResizeColumns(1, headers.length);
  
  return sheet;
}

/**
 * 取得問卷統計資料
 */
function getSurveyStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return {
        totalSubmissions: 0,
        statistics: {}
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const submissions = data.slice(1);
    
    // 計算基本統計
    const stats = {
      totalSubmissions: submissions.length,
      ageDistribution: {},
      genderDistribution: {},
      locationDistribution: {},
      purchaseFrequencyDistribution: {},
      mealTypeDistribution: {}
    };
    
    // 分析各欄位分佈
    submissions.forEach(row => {
      // 年齡分佈
      const age = row[3];
      stats.ageDistribution[age] = (stats.ageDistribution[age] || 0) + 1;
      
      // 性別分佈
      const gender = row[4];
      stats.genderDistribution[gender] = (stats.genderDistribution[gender] || 0) + 1;
      
      // 居住地分佈
      const location = row[5];
      stats.locationDistribution[location] = (stats.locationDistribution[location] || 0) + 1;
      
      // 購買頻率分佈
      const frequency = row[6];
      stats.purchaseFrequencyDistribution[frequency] = (stats.purchaseFrequencyDistribution[frequency] || 0) + 1;
      
      // 餐點類型分佈
      const mealType = row[9];
      stats.mealTypeDistribution[mealType] = (stats.mealTypeDistribution[mealType] || 0) + 1;
    });
    
    return stats;
    
  } catch (error) {
    console.error('取得統計資料時發生錯誤:', error);
    throw new Error('無法取得統計資料');
  }
}

/**
 * 記錄提交日誌
 */
function logSubmission(data, success, errorMessage = '') {
  const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('提交日誌');
  
  if (!logSheet) {
    // 建立日誌工作表
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newLogSheet = spreadsheet.insertSheet('提交日誌');
    
    // 設定日誌標題
    const logHeaders = ['時間', '用戶ID', '用戶名稱', '狀態', '錯誤訊息'];
    newLogSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
    
    // 設定樣式
    const headerRange = newLogSheet.getRange(1, 1, 1, logHeaders.length);
    headerRange.setBackground('#e74c3c');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    newLogSheet.setFrozenRows(1);
    newLogSheet.autoResizeColumns(1, logHeaders.length);
  }
  
  // 新增日誌記錄
  const logData = [
    new Date().toLocaleString('zh-TW'),
    data.userId || '',
    data.userName || '',
    success ? '成功' : '失敗',
    errorMessage
  ];
  
  logSheet.appendRow(logData);
}

/**
 * 定期清理舊資料 (可選)
 */
function cleanupOldData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const submissions = data.slice(1);
  
  // 保留最近 1000 筆資料
  const maxRows = 1000;
  
  if (submissions.length > maxRows) {
    const rowsToDelete = submissions.length - maxRows;
    sheet.deleteRows(2, rowsToDelete); // 從第2列開始刪除 (保留標題列)
  }
}

/**
 * 設定觸發器 (在 Google Apps Script 編輯器中執行)
 */
function setupTriggers() {
  // 刪除現有觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'cleanupOldData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 建立每日清理觸發器
  ScriptApp.newTrigger('cleanupOldData')
    .timeBased()
    .everyDays(1)
    .atHour(2) // 凌晨2點執行
    .create();
} 