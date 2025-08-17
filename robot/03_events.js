/**
 * 🔄 سیستم مدیریت رویدادها و ارتباطات بین ماژول‌ها
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const EventEmitter = require('events');

class EventManager extends EventEmitter {
    constructor() {
        super();
        this.events = new Map();
        this.handlers = new Map();
        this.initializeEvents();
    }

    // مقداردهی اولیه رویدادها
    initializeEvents() {
        // رویدادهای کاربر
        this.registerEvent('user:registered', 'کاربر ثبت‌نام شد');
        this.registerEvent('user:updated', 'اطلاعات کاربر به‌روزرسانی شد');
        this.registerEvent('user:deleted', 'کاربر حذف شد');
        this.registerEvent('user:role_changed', 'نقش کاربر تغییر کرد');

        // رویدادهای گروه
        this.registerEvent('group:joined', 'کاربر به گروه پیوست');
        this.registerEvent('group:left', 'کاربر از گروه خارج شد');
        this.registerEvent('group:created', 'گروه جدید ایجاد شد');
        this.registerEvent('group:deleted', 'گروه حذف شد');

        // رویدادهای ارزیابی
        this.registerEvent('evaluation:started', 'ارزیابی شروع شد');
        this.registerEvent('evaluation:completed', 'ارزیابی تکمیل شد');
        this.registerEvent('evaluation:submitted', 'ارزیابی ارسال شد');

        // رویدادهای حضور
        this.registerEvent('attendance:marked', 'حضور ثبت شد');
        this.registerEvent('attendance:updated', 'حضور به‌روزرسانی شد');
        this.registerEvent('attendance:reported', 'گزارش حضور ارسال شد');

        // رویدادهای کارگاه
        this.registerEvent('workshop:created', 'کارگاه جدید ایجاد شد');
        this.registerEvent('workshop:updated', 'کارگاه به‌روزرسانی شد');
        this.registerEvent('workshop:deleted', 'کارگاه حذف شد');

        // رویدادهای سیستم
        this.registerEvent('system:startup', 'سیستم راه‌اندازی شد');
        this.registerEvent('system:shutdown', 'سیستم خاموش شد');
        this.registerEvent('system:error', 'خطای سیستم رخ داد');
        this.registerEvent('system:backup', 'پشتیبان‌گیری انجام شد');

        console.log('✅ [EVENTS] سیستم رویدادها راه‌اندازی شد');
    }

    // ثبت رویداد جدید
    registerEvent(eventName, description) {
        this.events.set(eventName, {
            name: eventName,
            description: description,
            createdAt: new Date().toISOString(),
            handlers: []
        });
    }

    // ثبت handler برای رویداد
    onEvent(eventName, handler, options = {}) {
        if (!this.events.has(eventName)) {
            this.registerEvent(eventName, 'رویداد خودکار');
        }

        const event = this.events.get(eventName);
        const handlerInfo = {
            id: this.generateHandlerId(),
            handler: handler,
            options: options,
            registeredAt: new Date().toISOString()
        };

        event.handlers.push(handlerInfo);
        this.on(eventName, handler);

        console.log(`✅ [EVENTS] Handler برای رویداد ${eventName} ثبت شد`);
        return handlerInfo.id;
    }

    // حذف handler
    removeHandler(eventName, handlerId) {
        const event = this.events.get(eventName);
        if (event) {
            const handlerIndex = event.handlers.findIndex(h => h.id === handlerId);
            if (handlerIndex !== -1) {
                const handler = event.handlers[handlerIndex];
                this.removeListener(eventName, handler.handler);
                event.handlers.splice(handlerIndex, 1);
                console.log(`✅ [EVENTS] Handler ${handlerId} از رویداد ${eventName} حذف شد`);
                return true;
            }
        }
        return false;
    }

    // انتشار رویداد
    emitEvent(eventName, data = {}) {
        if (!this.events.has(eventName)) {
            this.registerEvent(eventName, 'رویداد خودکار');
        }

        const eventData = {
            eventName: eventName,
            timestamp: new Date().toISOString(),
            data: data,
            source: 'EventManager'
        };

        console.log(`📡 [EVENTS] انتشار رویداد: ${eventName}`, data);
        this.emit(eventName, eventData);
        return eventData;
    }

    // دریافت اطلاعات رویداد
    getEventInfo(eventName) {
        return this.events.get(eventName);
    }

    // دریافت لیست همه رویدادها
    getAllEvents() {
        return Array.from(this.events.values());
    }

    // دریافت آمار رویدادها
    getEventStats() {
        const stats = {
            totalEvents: this.events.size,
            totalHandlers: 0,
            events: {}
        };

        for (const [eventName, event] of this.events) {
            stats.events[eventName] = {
                description: event.description,
                handlers: event.handlers.length,
                createdAt: event.createdAt
            };
            stats.totalHandlers += event.handlers.length;
        }

        return stats;
    }

    // تولید ID یکتا برای handler
    generateHandlerId() {
        return `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // پاک کردن همه رویدادها
    clearAllEvents() {
        this.removeAllListeners();
        this.events.clear();
        this.handlers.clear();
        console.log('✅ [EVENTS] همه رویدادها پاک شدند');
    }

    // بررسی وجود رویداد
    hasEvent(eventName) {
        return this.events.has(eventName);
    }

    // بررسی وجود handler
    hasHandler(eventName) {
        const event = this.events.get(eventName);
        return event && event.handlers.length > 0;
    }
}

// ایجاد instance واحد
const eventManager = new EventManager();

module.exports = eventManager;

