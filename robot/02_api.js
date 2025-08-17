/**
 * 🚀 لایه انتزاع API بله
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const axios = require('axios');
const CoreManager = require('./01_core');

class BaleAPI {
    constructor() {
        this.core = new CoreManager();
        this.baseUrl = this.core.getBaseUrl();
        this.token = this.core.getBotToken();
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    // ایجاد URL کامل
    getFullUrl(method) {
        return `${this.baseUrl}${this.token}/${method}`;
    }

    // ارسال درخواست با retry
    async makeRequest(method, data = {}, retryCount = 0) {
        try {
            const url = this.getFullUrl(method);
            const response = await axios.post(url, data, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.ok) {
                return response.data.result;
            } else {
                throw new Error(`API Error: ${response.data?.description || 'Unknown error'}`);
            }
        } catch (error) {
            if (retryCount < this.maxRetries && this.isRetryableError(error)) {
                console.log(`⚠️ [API] Retry ${retryCount + 1}/${this.maxRetries} for ${method}`);
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.makeRequest(method, data, retryCount + 1);
            }
            throw error;
        }
    }

    // بررسی خطاهای قابل retry
    isRetryableError(error) {
        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ECONNABORTED',
            'ENOTFOUND'
        ];
        return retryableErrors.some(errType => 
            error.code === errType || error.message.includes(errType)
        );
    }

    // تاخیر
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // دریافت آپدیت‌ها
    async getUpdates(offset = 0, limit = 100, timeout = 0) {
        const data = { offset, limit };
        if (timeout > 0) data.timeout = timeout;
        return this.makeRequest('getUpdates', data);
    }

    // ارسال پیام
    async sendMessage(chatId, text, options = {}) {
        const data = {
            chat_id: chatId,
            text: text,
            ...options
        };
        return this.makeRequest('sendMessage', data);
    }

    // ارسال پیام با کیبورد
    async sendMessageWithInlineKeyboard(chatId, text, keyboard, options = {}) {
        const data = {
            chat_id: chatId,
            text: text,
            reply_markup: { inline_keyboard: keyboard },
            ...options
        };
        return this.makeRequest('sendMessage', data);
    }

    // ویرایش پیام
    async editMessageText(chatId, messageId, text, options = {}) {
        const data = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            ...options
        };
        return this.makeRequest('editMessageText', data);
    }

    // حذف پیام
    async deleteMessage(chatId, messageId) {
        const data = {
            chat_id: chatId,
            message_id: messageId
        };
        return this.makeRequest('deleteMessage', data);
    }

    // پاسخ به callback query
    async answerCallbackQuery(callbackQueryId, options = {}) {
        const data = {
            callback_query_id: callbackQueryId,
            ...options
        };
        return this.makeRequest('answerCallbackQuery', data);
    }

    // دریافت اطلاعات چت
    async getChat(chatId) {
        const data = { chat_id: chatId };
        return this.makeRequest('getChat', data);
    }

    // دریافت اعضای چت
    async getChatMember(chatId, userId) {
        const data = {
            chat_id: chatId,
            user_id: userId
        };
        return this.makeRequest('getChatMember', data);
    }

    // دریافت ادمین‌های چت
    async getChatAdministrators(chatId) {
        const data = { chat_id: chatId };
        return this.makeRequest('getChatAdministrators', data);
    }

    // ارسال فایل
    async sendDocument(chatId, document, options = {}) {
        const data = {
            chat_id: chatId,
            document: document,
            ...options
        };
        return this.makeRequest('sendDocument', data);
    }

    // ارسال عکس
    async sendPhoto(chatId, photo, options = {}) {
        const data = {
            chat_id: chatId,
            photo: photo,
            ...options
        };
        return this.makeRequest('sendPhoto', data);
    }

    // دریافت اطلاعات بات
    async getMe() {
        return this.makeRequest('getMe');
    }

    // تنظیم webhook
    async setWebhook(url, options = {}) {
        const data = { url, ...options };
        return this.makeRequest('setWebhook', data);
    }

    // حذف webhook
    async deleteWebhook() {
        return this.makeRequest('deleteWebhook');
    }
}

module.exports = BaleAPI;

