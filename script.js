// LIFF 應用程式主要邏輯
class LIFFSurveyApp {
    constructor() {
        this.liffId = null;
        this.userProfile = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化 LIFF 應用程式
     */
    async init() {
        try {
            console.log('正在初始化 LIFF...');
            
            // 檢查 LIFF SDK 是否可用
            if (typeof liff === 'undefined') {
                console.log('LIFF SDK 未載入，顯示開發模式');
                this.showSurveyForm();
                this.setupEventListeners();
                return;
            }
            
            // 初始化 LIFF
            await liff.init({ liffId: this.getLiffId() });
            console.log('LIFF 初始化成功');

            // 檢查是否在 LINE 環境中
            if (!liff.isInClient() && !liff.isLoggedIn()) {
                console.log('不在 LINE 環境中，顯示開發模式');
                this.showSurveyForm();
                this.setupEventListeners();
                return;
            }

            // 獲取用戶資料
            if (liff.isLoggedIn()) {
                this.userProfile = await liff.getProfile();
                console.log('用戶資料獲取成功:', this.userProfile.displayName);
            }

            this.isInitialized = true;
            this.showSurveyForm();
            this.setupEventListeners();

        } catch (error) {
            console.error('LIFF 初始化失敗:', error);
            console.log('顯示開發模式');
            this.showSurveyForm();
            this.setupEventListeners();
        }
    }

    /**
     * 獲取 LIFF ID
     */
    getLiffId() {
        // 從環境變數或 URL 參數獲取 LIFF ID
        const urlParams = new URLSearchParams(window.location.search);
        this.liffId = urlParams.get('liffId') || 'your-liff-id-here';
        return this.liffId;
    }

    /**
     * 顯示問卷表單
     */
    showSurveyForm() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('surveyForm').style.display = 'block';
        
        // 為每個區段添加動畫延遲
        const sections = document.querySelectorAll('.survey-section');
        sections.forEach((section, index) => {
            section.style.setProperty('--section-index', index);
        });
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        const form = document.getElementById('questionnaireForm');
        const submitBtn = document.getElementById('submitBtn');
        const closeBtn = document.getElementById('closeBtn');
        const retryBtn = document.getElementById('retryBtn');

        // 表單提交事件
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 關閉成功訊息
        closeBtn.addEventListener('click', () => {
            this.closeSuccessMessage();
        });

        // 重試按鈕
        retryBtn.addEventListener('click', () => {
            this.hideErrorMessage();
            this.handleFormSubmit();
        });

        // 表單驗證
        this.setupFormValidation();
    }

    /**
     * 設定表單驗證
     */
    setupFormValidation() {
        const form = document.getElementById('questionnaireForm');
        const requiredFields = form.querySelectorAll('[required]');
        const submitBtn = document.getElementById('submitBtn');

        // 手機號碼驗證
        const phoneInput = form.querySelector('input[name="phone_number"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.validatePhoneNumber(e.target);
                this.validateForm();
            });
            
            phoneInput.addEventListener('blur', (e) => {
                this.validatePhoneNumber(e.target);
            });
        }

        // 即時驗證
        requiredFields.forEach(field => {
            field.addEventListener('change', () => {
                this.validateForm();
            });
        });

        // 初始驗證
        this.validateForm();
    }

    /**
     * 驗證手機號碼
     */
    validatePhoneNumber(input) {
        const phoneNumber = input.value.replace(/\D/g, ''); // 只保留數字
        const isValid = /^09\d{8}$/.test(phoneNumber);
        
        if (phoneNumber && !isValid) {
            input.setCustomValidity('請輸入正確的手機號碼格式 (09開頭的10位數字)');
            input.classList.add('invalid');
        } else {
            input.setCustomValidity('');
            input.classList.remove('invalid');
        }
        
        // 自動格式化顯示
        if (phoneNumber.length > 0) {
            input.value = phoneNumber;
        }
    }

    /**
     * 驗證表單
     */
    validateForm() {
        const form = document.getElementById('questionnaireForm');
        const submitBtn = document.getElementById('submitBtn');
        const requiredFields = form.querySelectorAll('[required]');
        
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                const name = field.name;
                const radioGroup = form.querySelectorAll(`input[name="${name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                
                if (!isChecked) {
                    isValid = false;
                }
            } else if (field.type === 'checkbox') {
                // 複選框不需要驗證，因為不是必填
            } else {
                if (!field.value.trim()) {
                    isValid = false;
                }
            }
        });

        submitBtn.disabled = !isValid;
        return isValid;
    }

    /**
     * 處理表單提交
     */
    async handleFormSubmit() {
        if (!this.validateForm()) {
            this.showError('請填寫所有必填項目');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            // 收集表單資料
            const formData = this.collectFormData();
            
            // 添加用戶資訊
            if (this.userProfile) {
                formData.userId = this.userProfile.userId;
                formData.userName = this.userProfile.displayName;
            }

            // 添加時間戳記
            formData.timestamp = new Date().toISOString();
            formData.submissionDate = new Date().toLocaleString('zh-TW');

            console.log('準備提交的資料:', formData);

            // 提交到 Google Apps Script
            const response = await this.submitToGoogleAppsScript(formData);
            
            if (response.success) {
                this.showSuccessMessage();
                console.log('問卷提交成功');
            } else {
                throw new Error(response.error || '提交失敗');
            }

        } catch (error) {
            console.error('提交失敗:', error);
            this.showError(error.message || '提交失敗，請稍後再試');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }

    /**
     * 收集表單資料
     */
    collectFormData() {
        const form = document.getElementById('questionnaireForm');
        const formData = new FormData(form);
        const data = {};

        // 處理單選和文字輸入
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // 如果已存在，轉換為陣列
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // 處理複選框
        const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const name = checkbox.name;
            if (data[name]) {
                if (Array.isArray(data[name])) {
                    data[name].push(checkbox.value);
                } else {
                    data[name] = [data[name], checkbox.value];
                }
            } else {
                data[name] = checkbox.value;
            }
        });

        return data;
    }

    /**
     * 提交到 Google Apps Script
     */
    async submitToGoogleAppsScript(data) {
        // Google Apps Script Web App URL
        const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
        
        // 開發模式：模擬成功回應
        if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.log('開發模式：模擬提交成功', data);
            return {
                success: true,
                data: {
                    message: '開發模式：問卷提交成功',
                    submissionId: Date.now(),
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submitSurvey',
                    data: data
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Google Apps Script 請求失敗:', error);
            throw new Error('網路連線失敗，請檢查網路連線後重試');
        }
    }

    /**
     * 顯示成功訊息
     */
    showSuccessMessage() {
        document.getElementById('successMessage').style.display = 'flex';
        
        // 如果是在 LINE 環境中，可以關閉 LIFF 視窗
        if (liff.isInClient()) {
            setTimeout(() => {
                liff.closeWindow();
            }, 3000);
        }
    }

    /**
     * 關閉成功訊息
     */
    closeSuccessMessage() {
        document.getElementById('successMessage').style.display = 'none';
        
        // 如果是在 LINE 環境中，關閉 LIFF 視窗
        if (liff.isInClient()) {
            liff.closeWindow();
        }
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        const errorContainer = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorContainer.style.display = 'flex';
    }

    /**
     * 隱藏錯誤訊息
     */
    hideErrorMessage() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    /**
     * 記錄用戶行為
     */
    logUserAction(action, data = {}) {
        console.log(`用戶行為: ${action}`, {
            userId: this.userProfile?.userId,
            userName: this.userProfile?.displayName,
            timestamp: new Date().toISOString(),
            ...data
        });
    }
}

// 工具函數
class SurveyUtils {
    /**
     * 格式化複選框資料
     */
    static formatCheckboxData(data) {
        if (Array.isArray(data)) {
            return data.join(', ');
        }
        return data || '';
    }

    /**
     * 驗證必填欄位
     */
    static validateRequiredFields(formData, requiredFields) {
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!formData[field] || 
                (Array.isArray(formData[field]) && formData[field].length === 0) ||
                (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                errors.push(`${field} 為必填項目`);
            }
        });

        return errors;
    }

    /**
     * 清理資料
     */
    static sanitizeData(data) {
        const cleaned = {};
        
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string') {
                cleaned[key] = data[key].trim();
            } else {
                cleaned[key] = data[key];
            }
        });

        return cleaned;
    }
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    // 檢查 LIFF SDK 是否載入
    if (typeof liff === 'undefined') {
        console.error('LIFF SDK 未載入');
        document.getElementById('loading').innerHTML = `
            <div class="error-icon">❌</div>
            <h2>載入失敗</h2>
            <p>LIFF SDK 載入失敗，請重新載入頁面</p>
        `;
        return;
    }

    // 初始化問卷應用程式
    window.surveyApp = new LIFFSurveyApp();
});

// 全域錯誤處理
window.addEventListener('error', (event) => {
    console.error('全域錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 拒絕:', event.reason);
}); 