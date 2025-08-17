/**
 * 🌐 Gateway اصلی سیستم
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CoreManager = require('./01_core');
const EventManager = require('./03_events');
const LogManager = require('./13_logs');

class Gateway {
    constructor() {
        this.app = express();
        this.port = process.env.GATEWAY_PORT || 3003;
        this.core = new CoreManager();
        this.eventManager = EventManager;
        this.logManager = new LogManager();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventHandlers();
    }

    // تنظیم middleware
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            this.logManager.info('GATEWAY', `${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    // تنظیم routes
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // System status
        this.app.get('/api/system/status', (req, res) => {
            try {
                const status = {
                    system: 'online',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    config: this.core.getConfig()
                };
                res.json(status);
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در دریافت وضعیت سیستم', { error: error.message });
                res.status(500).json({ error: 'خطا در دریافت وضعیت سیستم' });
            }
        });

        // Event stats
        this.app.get('/api/events/stats', (req, res) => {
            try {
                const stats = this.eventManager.getEventStats();
                res.json(stats);
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در دریافت آمار رویدادها', { error: error.message });
                res.status(500).json({ error: 'خطا در دریافت آمار رویدادها' });
            }
        });

        // Recent logs
        this.app.get('/api/logs/recent', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 100;
                const logs = this.logManager.getRecentLogs(limit);
                res.json(logs);
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در دریافت لاگ‌ها', { error: error.message });
                res.status(500).json({ error: 'خطا در دریافت لاگ‌ها' });
            }
        });

        // Search logs
        this.app.get('/api/logs/search', (req, res) => {
            try {
                const { query, level, module, limit } = req.query;
                const results = this.logManager.searchLogs(query, level, module, parseInt(limit) || 100);
                res.json(results);
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در جستجوی لاگ‌ها', { error: error.message });
                res.status(500).json({ error: 'خطا در جستجوی لاگ‌ها' });
            }
        });

        // Configuration
        this.app.get('/api/config', (req, res) => {
            try {
                const config = this.core.getConfig();
                res.json(config);
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در دریافت تنظیمات', { error: error.message });
                res.status(500).json({ error: 'خطا در دریافت تنظیمات' });
            }
        });

        // Update configuration
        this.app.put('/api/config', (req, res) => {
            try {
                const { section, key, value } = req.body;
                if (!section || !key) {
                    return res.status(400).json({ error: 'section و key الزامی هستند' });
                }
                
                this.core.updateConfig(section, key, value);
                res.json({ success: true, message: 'تنظیمات به‌روزرسانی شد' });
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در به‌روزرسانی تنظیمات', { error: error.message });
                res.status(500).json({ error: 'خطا در به‌روزرسانی تنظیمات' });
            }
        });

        // System actions
        this.app.post('/api/system/action', (req, res) => {
            try {
                const { action, data } = req.body;
                
                switch (action) {
                    case 'backup':
                        this.performBackup(res);
                        break;
                    case 'restart':
                        this.performRestart(res);
                        break;
                    case 'shutdown':
                        this.performShutdown(res);
                        break;
                    default:
                        res.status(400).json({ error: 'عملیات نامعتبر' });
                }
            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در اجرای عملیات سیستم', { error: error.message });
                res.status(500).json({ error: 'خطا در اجرای عملیات سیستم' });
            }
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            this.logManager.error('GATEWAY', 'خطای Gateway', { 
                error: err.message, 
                stack: err.stack,
                path: req.path,
                method: req.method
            });
            
            res.status(500).json({
                error: 'خطای داخلی سرور',
                message: process.env.NODE_ENV === 'development' ? err.message : 'خطای داخلی'
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'مسیر یافت نشد' });
        });
    }

    // تنظیم event handlers
    setupEventHandlers() {
        // System events
        this.eventManager.onEvent('system:startup', (data) => {
            this.logManager.info('GATEWAY', 'سیستم راه‌اندازی شد', data);
        });

        this.eventManager.onEvent('system:shutdown', (data) => {
            this.logManager.info('GATEWAY', 'سیستم خاموش شد', data);
        });

        this.eventManager.onEvent('system:error', (data) => {
            this.logManager.error('GATEWAY', 'خطای سیستم', data);
        });

        // User events
        this.eventManager.onEvent('user:registered', (data) => {
            this.logManager.info('GATEWAY', 'کاربر جدید ثبت‌نام شد', data);
        });

        // Group events
        this.eventManager.onEvent('group:created', (data) => {
            this.logManager.info('GATEWAY', 'گروه جدید ایجاد شد', data);
        });

        // Workshop events
        this.eventManager.onEvent('workshop:created', (data) => {
            this.logManager.info('GATEWAY', 'کارگاه جدید ایجاد شد', data);
        });
    }

    // انجام پشتیبان‌گیری
    async performBackup(res) {
        try {
            // اینجا می‌توانید منطق پشتیبان‌گیری را اضافه کنید
            this.logManager.info('GATEWAY', 'پشتیبان‌گیری شروع شد');
            
            // شبیه‌سازی پشتیبان‌گیری
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.logManager.info('GATEWAY', 'پشتیبان‌گیری تکمیل شد');
            res.json({ success: true, message: 'پشتیبان‌گیری انجام شد' });
        } catch (error) {
            this.logManager.error('GATEWAY', 'خطا در پشتیبان‌گیری', { error: error.message });
            res.status(500).json({ error: 'خطا در پشتیبان‌گیری' });
        }
    }

    // انجام راه‌اندازی مجدد
    performRestart(res) {
        try {
            this.logManager.info('GATEWAY', 'درخواست راه‌اندازی مجدد');
            
            // ارسال پاسخ
            res.json({ success: true, message: 'راه‌اندازی مجدد در حال انجام است' });
            
            // تاخیر کوتاه و سپس راه‌اندازی مجدد
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        } catch (error) {
            this.logManager.error('GATEWAY', 'خطا در راه‌اندازی مجدد', { error: error.message });
            res.status(500).json({ error: 'خطا در راه‌اندازی مجدد' });
        }
    }

    // انجام خاموشی
    performShutdown(res) {
        try {
            this.logManager.info('GATEWAY', 'درخواست خاموشی');
            
            // ارسال پاسخ
            res.json({ success: true, message: 'خاموشی در حال انجام است' });
            
            // تاخیر کوتاه و سپس خاموشی
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        } catch (error) {
            this.logManager.error('GATEWAY', 'خطا در خاموشی', { error: error.message });
            res.status(500).json({ error: 'خطا در خاموشی' });
        }
    }

    // شروع Gateway
    start() {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.port, () => {
                    this.logManager.info('GATEWAY', `Gateway روی پورت ${this.port} شروع شد`);
                    console.log(`🚀 Gateway روی پورت ${this.port} شروع شد`);
                    resolve(server);
                });

                server.on('error', (error) => {
                    this.logManager.error('GATEWAY', 'خطا در شروع Gateway', { error: error.message });
                    reject(error);
                });

                // Graceful shutdown
                process.on('SIGTERM', () => {
                    this.logManager.info('GATEWAY', 'دریافت SIGTERM، خاموشی graceful');
                    server.close(() => {
                        this.logManager.info('GATEWAY', 'Gateway خاموش شد');
                        process.exit(0);
                    });
                });

                process.on('SIGINT', () => {
                    this.logManager.info('GATEWAY', 'دریافت SIGINT، خاموشی graceful');
                    server.close(() => {
                        this.logManager.info('GATEWAY', 'Gateway خاموش شد');
                        process.exit(0);
                    });
                });

            } catch (error) {
                this.logManager.error('GATEWAY', 'خطا در شروع Gateway', { error: error.message });
                reject(error);
            }
        });
    }

    // توقف Gateway
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.logManager.info('GATEWAY', 'Gateway متوقف شد');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // دریافت آمار Gateway
    getStats() {
        return {
            port: this.port,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = Gateway;
