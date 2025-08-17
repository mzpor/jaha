/**
 * 🎯 ماژول اصلی مدیریت تنظیمات و کانفیگ
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');

class CoreManager {
    constructor() {
        this.configFile = path.join(__dirname, 'data', 'core_config.json');
        this.config = this.loadConfig();
        this.initializeConfig();
    }

    // بارگذاری تنظیمات
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ [CORE] خطا در بارگذاری تنظیمات:', error.message);
        }
        return this.getDefaultConfig();
    }

    // تنظیمات پیش‌فرض
    getDefaultConfig() {
        return {
            bot: {
                token: "262597677:qzQNXdMMGfmORJsSAJmzEWRsZ68zqOjoVcFibLWC",
                baseUrl: "https://tapi.bale.ai/bot",
                enabled: true
            },
            groups: {
                mainGroup: 5537396165,
                reportGroup: 5537396165,
                enabled: true
            },
            roles: {
                SCHOOL_ADMIN: 'مدیر',
                COACH: 'راهبر',
                ASSISTANT: 'دبیر',
                STUDENT: 'فعال'
            },
            workshop: {
                displayName: 'راهبران',
                capacity: 100,
                duration: 'گزارش روزانه',
                level: 'حرفه ای'
            },
            buttons: {
                robot: true,
                registration: false,
                evaluation: true,
                reports: true
            },
            system: {
                autoBackup: true,
                logLevel: 'info',
                heartbeatInterval: 30000
            }
        };
    }

    // ذخیره تنظیمات
    saveConfig() {
        try {
            const dir = path.dirname(this.configFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
            console.log('✅ [CORE] تنظیمات ذخیره شد');
        } catch (error) {
            console.error('❌ [CORE] خطا در ذخیره تنظیمات:', error.message);
        }
    }

    // مقداردهی اولیه
    initializeConfig() {
        if (!this.config.lastUpdated) {
            this.config.lastUpdated = new Date().toISOString();
            this.saveConfig();
        }
    }

    // دریافت تنظیمات
    getConfig(section = null) {
        if (section) {
            return this.config[section] || null;
        }
        return this.config;
    }

    // به‌روزرسانی تنظیمات
    updateConfig(section, key, value) {
        if (!this.config[section]) {
            this.config[section] = {};
        }
        this.config[section][key] = value;
        this.config.lastUpdated = new Date().toISOString();
        this.saveConfig();
    }

    // دریافت توکن بات
    getBotToken() {
        return this.config.bot.token;
    }

    // دریافت URL پایه
    getBaseUrl() {
        return this.config.bot.baseUrl;
    }

    // بررسی فعال بودن سیستم
    isSystemEnabled() {
        return this.config.bot.enabled;
    }

    // دریافت نقش‌ها
    getRoles() {
        return this.config.roles;
    }

    // دریافت تنظیمات کارگاه
    getWorkshopConfig() {
        return this.config.workshop;
    }

    // دریافت تنظیمات دکمه‌ها
    getButtonConfig() {
        return this.config.buttons;
    }

    // دریافت تنظیمات سیستم
    getSystemConfig() {
        return this.config.system;
    }
}

module.exports = CoreManager;

