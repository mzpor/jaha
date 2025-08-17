/**
 * 📝 ماژول سیستم لاگ و گزارش‌گیری
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');
const eventManager = require('./03_events');

class LogManager {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        this.currentLogFile = this.getCurrentLogFileName();
        this.ensureLogDirectory();
        this.initializeEventListeners();
    }

    // اطمینان از وجود دایرکتوری لاگ
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    // دریافت نام فایل لاگ فعلی
    getCurrentLogFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `bot_${year}-${month}-${day}.log`;
    }

    // مقداردهی اولیه event listeners
    initializeEventListeners() {
        eventManager.onEvent('system:startup', (data) => {
            this.log('SYSTEM', 'info', 'سیستم راه‌اندازی شد', data);
        });

        eventManager.onEvent('system:shutdown', (data) => {
            this.log('SYSTEM', 'info', 'سیستم خاموش شد', data);
        });

        eventManager.onEvent('system:error', (data) => {
            this.log('SYSTEM', 'error', 'خطای سیستم رخ داد', data);
        });
    }

    // ثبت لاگ
    log(module, level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            module,
            level: level.toUpperCase(),
            message,
            data
        };

        const logLine = this.formatLogLine(logEntry);
        
        try {
            // بررسی اندازه فایل لاگ
            this.checkLogFileSize();
            
            // نوشتن لاگ
            fs.appendFileSync(path.join(this.logDir, this.currentLogFile), logLine + '\n');
            
            // نمایش در کنسول
            this.displayLog(logEntry);
            
        } catch (error) {
            console.error('❌ [LOGS] خطا در نوشتن لاگ:', error.message);
        }
    }

    // فرمت خط لاگ
    formatLogLine(logEntry) {
        const { timestamp, module, level, message, data } = logEntry;
        let logLine = `[${timestamp}] [${module}] [${level}] ${message}`;
        
        if (data) {
            logLine += ` | ${JSON.stringify(data)}`;
        }
        
        return logLine;
    }

    // نمایش لاگ در کنسول
    displayLog(logEntry) {
        const { timestamp, module, level, message, data } = logEntry;
        const time = new Date(timestamp).toLocaleTimeString('fa-IR');
        
        let emoji = '📝';
        let color = '\x1b[37m'; // سفید
        
        switch (level) {
            case 'ERROR':
                emoji = '❌';
                color = '\x1b[31m'; // قرمز
                break;
            case 'WARN':
                emoji = '⚠️';
                color = '\x1b[33m'; // زرد
                break;
            case 'INFO':
                emoji = 'ℹ️';
                color = '\x1b[36m'; // آبی
                break;
            case 'DEBUG':
                emoji = '🔍';
                color = '\x1b[35m'; // بنفش
                break;
        }
        
        const reset = '\x1b[0m';
        console.log(`${color}${emoji} [${time}] [${module}] ${message}${reset}`);
        
        if (data && process.env.NODE_ENV === 'development') {
            console.log(`${color}📊 Data:${reset}`, data);
        }
    }

    // بررسی اندازه فایل لاگ
    checkLogFileSize() {
        const logFilePath = path.join(this.logDir, this.currentLogFile);
        
        if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            if (stats.size > this.maxLogSize) {
                this.rotateLogFiles();
            }
        }
    }

    // چرخش فایل‌های لاگ
    rotateLogFiles() {
        // حذف فایل‌های قدیمی
        const logFiles = fs.readdirSync(this.logDir)
            .filter(file => file.endsWith('.log'))
            .sort()
            .reverse();

        while (logFiles.length >= this.maxLogFiles) {
            const oldFile = logFiles.pop();
            fs.unlinkSync(path.join(this.logDir, oldFile));
            console.log(`🗑️ [LOGS] فایل لاگ قدیمی حذف شد: ${oldFile}`);
        }

        // ایجاد فایل لاگ جدید
        this.currentLogFile = this.getCurrentLogFileName();
        console.log(`🔄 [LOGS] فایل لاگ جدید ایجاد شد: ${this.currentLogFile}`);
    }

    // لاگ اطلاعات
    info(module, message, data = null) {
        this.log(module, 'info', message, data);
    }

    // لاگ خطا
    error(module, message, data = null) {
        this.log(module, 'error', message, data);
    }

    // لاگ هشدار
    warn(module, message, data = null) {
        this.log(module, 'warn', message, data);
    }

    // لاگ دیباگ
    debug(module, message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this.log(module, 'debug', message, data);
        }
    }

    // لاگ شروع سیستم
    logStartup() {
        this.info('SYSTEM', '🚀 بات بله راه‌اندازی شد');
        eventManager.emitEvent('system:startup', { timestamp: new Date().toISOString() });
    }

    // لاگ خاموشی سیستم
    logShutdown() {
        this.info('SYSTEM', '🛑 بات بله در حال خاموش شدن');
        eventManager.emitEvent('system:shutdown', { timestamp: new Date().toISOString() });
    }

    // لاگ خطا
    logError(module, error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.error(module, `خطا: ${error.message}`, errorData);
        eventManager.emitEvent('system:error', errorData);
    }

    // لاگ اتصال
    logConnectionStatus(status, details = {}) {
        this.info('CONNECTION', `وضعیت اتصال: ${status}`, details);
    }

    // لاگ فعالیت کاربر
    logUserActivity(userId, action, details = {}) {
        this.info('USER_ACTIVITY', `کاربر ${userId}: ${action}`, details);
    }

    // لاگ فعالیت گروه
    logGroupActivity(groupId, action, details = {}) {
        this.info('GROUP_ACTIVITY', `گروه ${groupId}: ${action}`, details);
    }

    // لاگ عملکرد
    logPerformance(operation, duration, details = {}) {
        this.info('PERFORMANCE', `${operation}: ${duration}ms`, details);
    }

    // دریافت لاگ‌های اخیر
    getRecentLogs(limit = 100) {
        try {
            const logFilePath = path.join(this.logDir, this.currentLogFile);
            
            if (!fs.existsSync(logFilePath)) {
                return [];
            }

            const content = fs.readFileSync(logFilePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            return lines.slice(-limit).map(line => {
                try {
                    // تجزیه خط لاگ
                    const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+)/);
                    if (match) {
                        return {
                            timestamp: match[1],
                            module: match[2],
                            level: match[3],
                            message: match[4]
                        };
                    }
                    return { raw: line };
                } catch (error) {
                    return { raw: line };
                }
            });
        } catch (error) {
            this.error('LOGS', 'خطا در خواندن لاگ‌ها', { error: error.message });
            return [];
        }
    }

    // جستجو در لاگ‌ها
    searchLogs(query, level = null, module = null, limit = 100) {
        try {
            const logFilePath = path.join(this.logDir, this.currentLogFile);
            
            if (!fs.existsSync(logFilePath)) {
                return [];
            }

            const content = fs.readFileSync(logFilePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const results = [];
            for (const line of lines) {
                try {
                    const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+)/);
                    if (match) {
                        const [, timestamp, lineModule, lineLevel, message] = match;
                        
                        // فیلتر بر اساس معیارها
                        if (level && lineLevel !== level) continue;
                        if (module && lineModule !== module) continue;
                        if (!message.toLowerCase().includes(query.toLowerCase())) continue;
                        
                        results.push({
                            timestamp,
                            module: lineModule,
                            level: lineLevel,
                            message
                        });
                        
                        if (results.length >= limit) break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return results;
        } catch (error) {
            this.error('LOGS', 'خطا در جستجوی لاگ‌ها', { error: error.message });
            return [];
        }
    }

    // پاک کردن لاگ‌های قدیمی
    cleanOldLogs(daysToKeep = 30) {
        try {
            const logFiles = fs.readdirSync(this.logDir)
                .filter(file => file.endsWith('.log'));
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            let deletedCount = 0;
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
            
            if (deletedCount > 0) {
                this.info('LOGS', `${deletedCount} فایل لاگ قدیمی پاک شد`);
            }
            
            return deletedCount;
        } catch (error) {
            this.error('LOGS', 'خطا در پاک کردن لاگ‌های قدیمی', { error: error.message });
            return 0;
        }
    }

    // دریافت آمار لاگ‌ها
    getLogStats() {
        try {
            const logFiles = fs.readdirSync(this.logDir)
                .filter(file => file.endsWith('.log'));
            
            const stats = {
                totalFiles: logFiles.length,
                totalSize: 0,
                oldestFile: null,
                newestFile: null,
                currentFile: this.currentLogFile
            };
            
            for (const file of logFiles) {
                const filePath = path.join(this.logDir, file);
                const fileStats = fs.statSync(filePath);
                
                stats.totalSize += fileStats.size;
                
                if (!stats.oldestFile || fileStats.mtime < stats.oldestFile) {
                    stats.oldestFile = fileStats.mtime;
                }
                
                if (!stats.newestFile || fileStats.mtime > stats.newestFile) {
                    stats.newestFile = fileStats.mtime;
                }
            }
            
            return stats;
        } catch (error) {
            this.error('LOGS', 'خطا در دریافت آمار لاگ‌ها', { error: error.message });
            return {};
        }
    }
}

module.exports = LogManager;

