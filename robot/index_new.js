/**
 * 🚀 فایل اصلی سیستم بات بله - نسخه 2.0.0
 * ساختار ماژولار و بهینه شده
 * تاریخ: 1404/05/17
 */

const CoreManager = require('./01_core');
const BaleAPI = require('./02_api');
const EventManager = require('./03_events');
const UserManager = require('./04_user_manager');
const LogManager = require('./13_logs');
const TimeManager = require('./14_time');
const Gateway = require('./16_gateway');

class BotSystem {
    constructor() {
        this.core = new CoreManager();
        this.api = new BaleAPI();
        this.eventManager = EventManager;
        this.userManager = new UserManager();
        this.logManager = new LogManager();
        this.timeManager = new TimeManager();
        this.gateway = new Gateway();
        
        this.isRunning = false;
        this.updateOffset = 0;
        this.heartbeatInterval = null;
        
        this.initializeSystem();
    }

    // مقداردهی اولیه سیستم
    async initializeSystem() {
        try {
            console.log('🚀 راه‌اندازی سیستم بات بله...');
            
            // شروع سیستم لاگ
            this.logManager.logStartup();
            
            // انتشار رویداد راه‌اندازی
            this.eventManager.emitEvent('system:startup', {
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            });

            // شروع Gateway
            await this.gateway.start();
            
            // شروع polling
            await this.startPolling();
            
            // شروع heartbeat
            this.startHeartbeat();
            
            this.isRunning = true;
            console.log('✅ سیستم بات بله با موفقیت راه‌اندازی شد');
            
        } catch (error) {
            this.logManager.logError('SYSTEM', error, { context: 'initialization' });
            console.error('❌ خطا در راه‌اندازی سیستم:', error.message);
            process.exit(1);
        }
    }

    // شروع polling
    async startPolling() {
        console.log('📡 شروع polling...');
        
        try {
            // دریافت اطلاعات بات
            const botInfo = await this.api.getMe();
            console.log(`🤖 بات ${botInfo.first_name} (@${botInfo.username}) آماده است`);
            
            // شروع حلقه polling
            this.pollUpdates();
            
        } catch (error) {
            this.logManager.logError('POLLING', error, { context: 'start' });
            console.error('❌ خطا در شروع polling:', error.message);
            
            // تلاش مجدد بعد از 5 ثانیه
            setTimeout(() => this.startPolling(), 5000);
        }
    }

    // حلقه polling
    async pollUpdates() {
        if (!this.isRunning) return;

        try {
            const updates = await this.api.getUpdates(this.updateOffset, 100, 30);
            
            if (updates && updates.length > 0) {
                for (const update of updates) {
                    await this.processUpdate(update);
                    this.updateOffset = update.update_id + 1;
                }
            }
            
        } catch (error) {
            this.logManager.logError('POLLING', error, { context: 'polling' });
            console.error('❌ خطا در polling:', error.message);
        }

        // ادامه polling
        setTimeout(() => this.pollUpdates(), 1000);
    }

    // پردازش آپدیت
    async processUpdate(update) {
        try {
            this.logManager.debug('UPDATE', 'دریافت آپدیت', { updateId: update.update_id });

            if (update.message) {
                await this.processMessage(update.message);
            } else if (update.callback_query) {
                await this.processCallbackQuery(update.callback_query);
            } else if (update.chat_member) {
                await this.processChatMemberUpdate(update.chat_member);
            }

        } catch (error) {
            this.logManager.logError('UPDATE', error, { 
                context: 'processing',
                updateId: update.update_id 
            });
        }
    }

    // پردازش پیام
    async processMessage(message) {
        try {
            const { chat, text, from } = message;
            
            if (!text) return;

            this.logManager.logUserActivity(from.id, 'ارسال پیام', {
                chatId: chat.id,
                text: text.substring(0, 100),
                chatType: chat.type
            });

            // پردازش دستورات
            if (text.startsWith('/')) {
                await this.processCommand(message);
            } else {
                await this.processRegularMessage(message);
            }

        } catch (error) {
            this.logManager.logError('MESSAGE', error, { 
                context: 'processing',
                messageId: message.message_id 
            });
        }
    }

    // پردازش دستورات
    async processCommand(message) {
        const { chat, text, from } = message;
        const command = text.split(' ')[0].toLowerCase();

        try {
            switch (command) {
                case '/start':
                    await this.handleStartCommand(message);
                    break;
                    
                case '/help':
                    await this.handleHelpCommand(message);
                    break;
                    
                case '/status':
                    await this.handleStatusCommand(message);
                    break;
                    
                case '/register':
                    await this.handleRegisterCommand(message);
                    break;
                    
                case '/profile':
                    await this.handleProfileCommand(message);
                    break;
                    
                default:
                    await this.api.sendMessage(chat.id, '❌ دستور نامعتبر است. از /help استفاده کنید.');
            }

        } catch (error) {
            this.logManager.logError('COMMAND', error, { 
                context: 'processing',
                command: command,
                userId: from.id 
            });
            
            await this.api.sendMessage(chat.id, '❌ خطا در پردازش دستور. لطفاً دوباره تلاش کنید.');
        }
    }

    // پردازش پیام‌های عادی
    async processRegularMessage(message) {
        const { chat, text, from } = message;

        try {
            // بررسی وجود کاربر
            if (!this.userManager.userExists(from.id)) {
                await this.api.sendMessage(chat.id, 
                    '👋 سلام! برای استفاده از بات ابتدا ثبت‌نام کنید:\n/register'
                );
                return;
            }

            // پردازش بر اساس نوع پیام
            if (text.includes('سلام') || text.includes('hello')) {
                await this.api.sendMessage(chat.id, '👋 سلام! چطور می‌تونم کمکتون کنم؟');
            } else if (text.includes('خوب') || text.includes('ممنون')) {
                await this.api.sendMessage(chat.id, '😊 خوشحالم که خوبید!');
            } else {
                await this.api.sendMessage(chat.id, 
                    '💭 پیام شما دریافت شد. برای دستورات بیشتر از /help استفاده کنید.'
                );
            }

        } catch (error) {
            this.logManager.logError('MESSAGE', error, { 
                context: 'regular_processing',
                userId: from.id 
            });
        }
    }

    // پردازش callback query
    async processCallbackQuery(callbackQuery) {
        try {
            const { data, message, from } = callbackQuery;
            
            this.logManager.logUserActivity(from.id, 'کلیک دکمه', {
                data: data,
                messageId: message.message_id
            });

            // پاسخ به callback
            await this.api.answerCallbackQuery(callbackQuery.id);

            // پردازش داده
            if (data.startsWith('register_')) {
                await this.handleRegistrationCallback(callbackQuery);
            } else if (data.startsWith('evaluation_')) {
                await this.handleEvaluationCallback(callbackQuery);
            } else if (data.startsWith('workshop_')) {
                await this.handleWorkshopCallback(callbackQuery);
            }

        } catch (error) {
            this.logManager.logError('CALLBACK', error, { 
                context: 'processing',
                data: callbackQuery.data 
            });
        }
    }

    // پردازش تغییرات عضو چت
    async processChatMemberUpdate(chatMemberUpdate) {
        try {
            const { chat, new_chat_member, old_chat_member } = chatMemberUpdate;
            
            if (new_chat_member.status === 'member' && old_chat_member.status === 'left') {
                // کاربر به گروه پیوست
                this.eventManager.emitEvent('group:joined', {
                    userId: new_chat_member.user.id,
                    groupId: chat.id,
                    groupTitle: chat.title
                });
                
                await this.api.sendMessage(chat.id, 
                    `👋 سلام ${new_chat_member.user.first_name}! به گروه خوش آمدید!`
                );
                
            } else if (new_chat_member.status === 'left' && old_chat_member.status === 'member') {
                // کاربر از گروه خارج شد
                this.eventManager.emitEvent('group:left', {
                    userId: new_chat_member.user.id,
                    groupId: chat.id,
                    groupTitle: chat.title
                });
            }

        } catch (error) {
            this.logManager.logError('CHAT_MEMBER', error, { 
                context: 'processing',
                chatId: chatMemberUpdate.chat.id 
            });
        }
    }

    // مدیریت دستور start
    async handleStartCommand(message) {
        const { chat, from } = message;
        
        const welcomeText = `🎉 سلام ${from.first_name} عزیز!

🤖 به بات مدیریت گروه‌های آموزشی خوش آمدید!

📋 امکانات موجود:
• 📝 ثبت‌نام و مدیریت پروفایل
• 📊 ارزیابی و نظرسنجی
• 📅 مدیریت حضور و غیاب
• 🏫 مدیریت کارگاه‌ها
• 📈 گزارش‌گیری

💡 برای شروع از /help استفاده کنید.`;

        const keyboard = [
            [{ text: '📝 ثبت‌نام', callback_data: 'register_start' }],
            [{ text: '📋 راهنما', callback_data: 'help_main' }],
            [{ text: '👤 پروفایل', callback_data: 'profile_view' }]
        ];

        await this.api.sendMessageWithInlineKeyboard(chat.id, welcomeText, keyboard);
    }

    // مدیریت دستور help
    async handleHelpCommand(message) {
        const { chat } = message;
        
        const helpText = `📚 راهنمای استفاده از بات:

🔹 دستورات اصلی:
/start - شروع کار با بات
/help - نمایش این راهنما
/status - وضعیت سیستم
/register - ثبت‌نام
/profile - مشاهده پروفایل

🔹 مدیریت کاربران:
/register - ثبت‌نام کاربر جدید
/profile - مشاهده و ویرایش پروفایل
/role - تغییر نقش کاربر

🔹 ارزیابی:
/evaluate - شروع ارزیابی
/results - مشاهده نتایج
/practice - ثبت تمرین

🔹 گزارش‌گیری:
/attendance - گزارش حضور
/weekly - گزارش هفتگی
/monthly - گزارش ماهانه

💡 برای اطلاعات بیشتر با مدیر سیستم تماس بگیرید.`;

        await this.api.sendMessage(chat.id, helpText);
    }

    // مدیریت دستور status
    async handleStatusCommand(message) {
        const { chat } = message;
        
        try {
            const stats = this.userManager.getUserStats();
            const eventStats = this.eventManager.getEventStats();
            
            const statusText = `📊 وضعیت سیستم:

👥 کاربران:
• کل: ${stats.total}
• فعال: ${stats.active}
• غیرفعال: ${stats.inactive}

📡 رویدادها:
• کل: ${eventStats.totalEvents}
• handlers: ${eventStats.totalHandlers}

⏰ زمان راه‌اندازی: ${this.timeManager.getReadableTimeAgo(new Date(Date.now() - process.uptime() * 1000))}

🔄 وضعیت: ✅ فعال`;

            await this.api.sendMessage(chat.id, statusText);
            
        } catch (error) {
            this.logManager.logError('STATUS', error, { context: 'command' });
            await this.api.sendMessage(chat.id, '❌ خطا در دریافت وضعیت سیستم');
        }
    }

    // مدیریت دستور register
    async handleRegisterCommand(message) {
        const { chat, from } = message;
        
        try {
            if (this.userManager.userExists(from.id)) {
                await this.api.sendMessage(chat.id, 
                    '✅ شما قبلاً ثبت‌نام کرده‌اید! از /profile برای مشاهده پروفایل استفاده کنید.'
                );
                return;
            }

            const keyboard = [
                [{ text: '📝 شروع ثبت‌نام', callback_data: 'register_start' }],
                [{ text: '❌ انصراف', callback_data: 'register_cancel' }]
            ];

            await this.api.sendMessageWithInlineKeyboard(chat.id, 
                `👋 سلام ${from.first_name} عزیز!
                
📝 برای استفاده از امکانات بات، لطفاً ثبت‌نام کنید.

🔹 اطلاعات مورد نیاز:
• نام و نام خانوادگی
• شماره تلفن
• کد ملی
• سطح تحصیلات

آیا می‌خواهید ثبت‌نام را شروع کنید؟`, 
                keyboard
            );
            
        } catch (error) {
            this.logManager.logError('REGISTER', error, { context: 'command', userId: from.id });
            await this.api.sendMessage(chat.id, '❌ خطا در شروع ثبت‌نام');
        }
    }

    // مدیریت دستور profile
    async handleProfileCommand(message) {
        const { chat, from } = message;
        
        try {
            const user = this.userManager.getUser(from.id);
            
            if (!user) {
                await this.api.sendMessage(chat.id, 
                    '❌ شما هنوز ثبت‌نام نکرده‌اید. از /register استفاده کنید.'
                );
                return;
            }

            const profileText = `👤 پروفایل شما:

📝 نام: ${user.firstName || 'تعیین نشده'}
👥 نام خانوادگی: ${user.lastName || 'تعیین نشده'}
📱 شماره تلفن: ${user.phone || 'تعیین نشده'}
🆔 کد ملی: ${user.nationalCode || 'تعیین نشده'}
🎓 سطح تحصیلات: ${user.educationLevel || 'تعیین نشده'}
🎭 نقش: ${user.role || 'تعیین نشده'}
📅 تاریخ ثبت‌نام: ${this.timeManager.formatDatePersian(user.createdAt)}
🔄 آخرین به‌روزرسانی: ${this.timeManager.formatDatePersian(user.updatedAt)}`;

            const keyboard = [
                [{ text: '✏️ ویرایش پروفایل', callback_data: 'profile_edit' }],
                [{ text: '🔙 بازگشت', callback_data: 'profile_back' }]
            ];

            await this.api.sendMessageWithInlineKeyboard(chat.id, profileText, keyboard);
            
        } catch (error) {
            this.logManager.logError('PROFILE', error, { context: 'command', userId: from.id });
            await this.api.sendMessage(chat.id, '❌ خطا در دریافت پروفایل');
        }
    }

    // مدیریت callback ثبت‌نام
    async handleRegistrationCallback(callbackQuery) {
        const { data, message, from } = callbackQuery;
        
        try {
            if (data === 'register_start') {
                // شروع فرآیند ثبت‌نام
                await this.startRegistrationProcess(message.chat.id, from.id);
            } else if (data === 'register_cancel') {
                await this.api.editMessageText(
                    message.chat.id, 
                    message.message_id, 
                    '❌ ثبت‌نام لغو شد. هر زمان که خواستید از /register استفاده کنید.'
                );
            }
            
        } catch (error) {
            this.logManager.logError('REGISTRATION_CALLBACK', error, { 
                context: 'processing',
                data: data,
                userId: from.id 
            });
        }
    }

    // شروع فرآیند ثبت‌نام
    async startRegistrationProcess(chatId, userId) {
        try {
            // اینجا می‌توانید منطق ثبت‌نام را پیاده‌سازی کنید
            await this.api.sendMessage(chatId, 
                '📝 فرآیند ثبت‌نام شروع شد!\n\n' +
                '🔹 لطفاً نام خود را وارد کنید:'
            );
            
            // ذخیره وضعیت ثبت‌نام کاربر
            // this.registrationStates.set(userId, { step: 'firstName' });
            
        } catch (error) {
            this.logManager.logError('REGISTRATION', error, { 
                context: 'start_process',
                userId: userId 
            });
        }
    }

    // مدیریت callback ارزیابی
    async handleEvaluationCallback(callbackQuery) {
        // پیاده‌سازی منطق ارزیابی
        console.log('Evaluation callback:', callbackQuery.data);
    }

    // مدیریت callback کارگاه
    async handleWorkshopCallback(callbackQuery) {
        // پیاده‌سازی منطق کارگاه
        console.log('Workshop callback:', callbackQuery.data);
    }

    // شروع heartbeat
    startHeartbeat() {
        const interval = this.core.getSystemConfig().heartbeatInterval || 30000;
        
        this.heartbeatInterval = setInterval(() => {
            try {
                const stats = {
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    users: this.userManager.getUserStats().total,
                    events: this.eventManager.getEventStats().totalEvents
                };

                this.logManager.debug('HEARTBEAT', 'سیستم فعال', stats);
                
                // انتشار رویداد heartbeat
                this.eventManager.emitEvent('system:heartbeat', stats);
                
            } catch (error) {
                this.logManager.logError('HEARTBEAT', error, { context: 'processing' });
            }
        }, interval);

        console.log(`💓 Heartbeat هر ${interval / 1000} ثانیه فعال شد`);
    }

    // توقف سیستم
    async stop() {
        try {
            console.log('🛑 در حال توقف سیستم...');
            
            this.isRunning = false;
            
            // توقف heartbeat
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            // توقف Gateway
            await this.gateway.stop();
            
            // لاگ خاموشی
            this.logManager.logShutdown();
            
            // انتشار رویداد خاموشی
            this.eventManager.emitEvent('system:shutdown', {
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ سیستم با موفقیت متوقف شد');
            
        } catch (error) {
            console.error('❌ خطا در توقف سیستم:', error.message);
        }
    }

    // دریافت وضعیت سیستم
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            uptime: process.uptime(),
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            users: this.userManager.getUserStats(),
            events: this.eventManager.getEventStats(),
            gateway: this.gateway.getStats()
        };
    }
}

// ایجاد instance اصلی
const botSystem = new BotSystem();

// مدیریت سیگنال‌های خاموشی
process.on('SIGINT', async () => {
    console.log('\n🛑 دریافت SIGINT، در حال خاموشی...');
    await botSystem.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 دریافت SIGTERM، در حال خاموشی...');
    await botSystem.stop();
    process.exit(0);
});

// مدیریت خطاهای غیرمنتظره
process.on('uncaughtException', (error) => {
    console.error('❌ خطای غیرمنتظره:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise رد شده:', reason);
    process.exit(1);
});

module.exports = BotSystem;
