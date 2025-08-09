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
        // 優先從全域設定取得，其次讀取 URL 參數，最後使用預設值
        const fromConfig = (typeof window !== 'undefined' && window.SurveyConfig && window.SurveyConfig.liff && window.SurveyConfig.liff.id)
            ? window.SurveyConfig.liff.id
            : null;
        const urlParams = new URLSearchParams(window.location.search);
        this.liffId = fromConfig || urlParams.get('liffId') || 'your-liff-id-here';
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
        const toggleDetailsBtn = document.getElementById('toggleDetailsBtn');
        const copyErrorBtn = document.getElementById('copyErrorBtn');

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

        if (toggleDetailsBtn) {
            toggleDetailsBtn.addEventListener('click', () => {
                const el = document.getElementById('errorDetails');
                if (!el) return;
                const isHidden = el.style.display === 'none';
                el.style.display = isHidden ? 'block' : 'none';
                toggleDetailsBtn.textContent = isHidden ? '隱藏詳細' : '顯示詳細';
            });
        }

        if (copyErrorBtn) {
            copyErrorBtn.addEventListener('click', async () => {
                const details = document.getElementById('errorDetails')?.textContent || '';
                try {
                    await navigator.clipboard.writeText(details);
                    alert('錯誤資訊已複製');
                } catch (_) {
                    alert('複製失敗，請長按選取後手動複製');
                }
            });
        }

        // verbose=1 自動展開詳情
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('verbose') === '1') {
            setTimeout(() => {
                const el = document.getElementById('errorDetails');
                if (el) {
                    el.style.display = 'block';
                    if (toggleDetailsBtn) toggleDetailsBtn.textContent = '隱藏詳細';
                }
            }, 0);
        }

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
            this.showError('提交失敗', error.message || String(error));
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
        // 從設定檔讀取 Google Apps Script Web App URL
        // 若設定有代理，優先走代理，可避免 CORS
        const proxyBase = (typeof window !== 'undefined' && window.SurveyConfig && window.SurveyConfig.api && window.SurveyConfig.api.baseUrl)
            ? window.SurveyConfig.api.baseUrl
            : '';
        const useProxy = Boolean(proxyBase);

        const configUrl = (typeof window !== 'undefined' && window.SurveyConfig && window.SurveyConfig.googleAppsScript && window.SurveyConfig.googleAppsScript.url)
            ? window.SurveyConfig.googleAppsScript.url
            : '';
        const GAS_URL = useProxy ? `${proxyBase.replace(/\/$/, '')}/liff/survey` : (configUrl || 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL');

        // 開發/無設定模式：模擬成功回應
        const isDebug = !!(typeof window !== 'undefined' && window.SurveyConfig && window.SurveyConfig.app && window.SurveyConfig.app.debug);
        if (!configUrl || isDebug) {
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

        // 連線逾時控制
        const timeoutMs = 15000;
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), timeoutMs);

        // 混合內容檢查（https 頁面呼叫 http API 會被瀏覽器封鎖）
        const isMixedContent = window.location.protocol === 'https:' && GAS_URL.startsWith('http://');
        if (isMixedContent) {
            throw new Error('安全限制：頁面為 HTTPS，但 API 為 HTTP（混合內容被封鎖）。請改用 HTTPS 的 Web App URL');
        }

        // 離線檢查
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            throw new Error('裝置目前離線，請檢查網路後再試');
        }

        try {
            // 使用 form-data 避免 CORS 預檢，GAS 會從 e.postData.contents 取得 JSON
            const formData = new FormData();
            formData.append('data', JSON.stringify({ action: 'submitSurvey', data }));
            
            const response = await fetch(GAS_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timerId);

            // HTTP 非 2xx：回傳更精確錯誤
            if (!response.ok) {
                let bodyText = '';
                try { bodyText = await response.text(); } catch (_) {}

                // 嘗試解析 JSON 以取得後端錯誤訊息
                let bodyJson = null;
                try { bodyJson = JSON.parse(bodyText); } catch (_) {}

                const status = response.status;
                const statusText = response.statusText || '';

                if (status === 401 || status === 403) {
                    const hint = '權限不足：請在 GAS Deploy > Manage deployments 中將 Web app 權限設為「Anyone」，並確認使用的是最新部署的 URL（/exec）';
                    throw new Error(`HTTP ${status} ${statusText}：${hint}`);
                }
                if (status === 404) {
                    const hint = '找不到 Web App：請確認 URL 是否正確，且路徑包含 /exec 而非 /dev 或 /usercallback';
                    throw new Error(`HTTP 404：${hint}`);
                }
                if (status === 429) {
                    throw new Error('HTTP 429：請求過多或配額限制，請稍後再試');
                }
                if (status >= 500 && status <= 599) {
                    const hint = '伺服器錯誤：請在 Apps Script 編輯器查看 Execution log 以排查程式錯誤';
                    const detail = bodyJson?.error || bodyText || '';
                    throw new Error(`HTTP ${status} 伺服器錯誤：${hint}${detail ? `（${detail}）` : ''}`);
                }

                const detail = bodyJson?.error || bodyText || '未知錯誤';
                throw new Error(`HTTP ${status} ${statusText}：${detail}`);
            }

            // 解析成功回應
            const resultText = await response.text();
            let result;
            try {
                result = JSON.parse(resultText);
            } catch (e) {
                throw new Error(`回應格式錯誤（非 JSON）：${resultText?.slice(0, 200) || ''}`);
            }

            if (result && result.success === true) {
                return result;
            }

            const backendError = result?.error || '伺服器回傳失敗，請稍後再試';
            throw new Error(backendError);

        } catch (error) {
            clearTimeout(timerId);
            // 逾時
            if (error.name === 'AbortError') {
                throw new Error(`連線逾時（>${timeoutMs / 1000}s）：請確認網路、GAS 狀態或稍後再試`);
            }
            // 可能的 CORS / DNS / 連線被擋
            if (error instanceof TypeError || /Failed to fetch|NetworkError/i.test(error.message)) {
                const hint = '請檢查：1) GAS Web App 已部署且權限為「Anyone」；2) URL 正確且可直接在瀏覽器開啟；3) 若在公司網路/代理，請排除封鎖；4) 檢查瀏覽器 Console 的 CORS 訊息';
                throw new Error(`連線失敗：${hint}`);
            }
            // 其餘錯誤直接往上拋，保留詳細訊息
            throw error;
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
    showError(message, detail = '') {
        const errorContainer = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const errorDetails = document.getElementById('errorDetails');

        errorText.textContent = message;

        // 收集診斷資訊
        const diagnostics = this.buildDiagnostics(detail);
        if (errorDetails) {
            errorDetails.textContent = diagnostics;
        }

        errorContainer.style.display = 'flex';
    }

    buildDiagnostics(detail) {
        const cfg = (typeof window !== 'undefined' && window.SurveyConfig) ? window.SurveyConfig : {};
        const lines = [];
        lines.push(`[時間] ${new Date().toLocaleString('zh-TW')}`);
        lines.push(`[LIFF] inClient=${typeof liff !== 'undefined' ? String(liff.isInClient?.()) : 'no-sdk'} loggedIn=${typeof liff !== 'undefined' ? String(liff.isLoggedIn?.()) : 'no-sdk'}`);
        lines.push(`[網路] online=${typeof navigator !== 'undefined' ? String(navigator.onLine) : 'n/a'}`);
        lines.push(`[頁面] ${window.location.href}`);
        lines.push(`[GAS_URL] ${cfg.googleAppsScript?.url || '(未設定)'} `);
        lines.push(`[LIFF_ID] ${cfg.liff?.id || '(未設定)'} `);
        if (detail) lines.push(`[錯誤詳情] ${detail}`);
        return lines.join('\n');
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