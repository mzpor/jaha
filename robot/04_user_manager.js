/**
 * 👥 ماژول مدیریت کاربران
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');
const eventManager = require('./03_events');

class UserManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'user_management.json');
        this.users = {};
        this.roles = {};
        this.loadData();
        this.initializeEventListeners();
    }

    // بارگذاری داده‌ها
    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.users = data.users || {};
                this.roles = data.roles || {};
                console.log(`✅ [USER] ${Object.keys(this.users).length} کاربر بارگذاری شد`);
            }
        } catch (error) {
            console.error('❌ [USER] خطا در بارگذاری داده‌ها:', error.message);
            this.users = {};
            this.roles = {};
        }
    }

    // ذخیره داده‌ها
    saveData() {
        try {
            const dir = path.dirname(this.dataFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                users: this.users,
                roles: this.roles,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            console.log('✅ [USER] داده‌ها ذخیره شدند');
        } catch (error) {
            console.error('❌ [USER] خطا در ذخیره داده‌ها:', error.message);
        }
    }

    // مقداردهی اولیه event listeners
    initializeEventListeners() {
        eventManager.onEvent('user:registered', (data) => {
            console.log(`👤 [USER] کاربر جدید ثبت‌نام شد: ${data.data.userId}`);
        });

        eventManager.onEvent('user:updated', (data) => {
            console.log(`🔄 [USER] اطلاعات کاربر به‌روزرسانی شد: ${data.data.userId}`);
        });

        eventManager.onEvent('user:role_changed', (data) => {
            console.log(`🎭 [USER] نقش کاربر تغییر کرد: ${data.data.userId} -> ${data.data.newRole}`);
        });
    }

    // ایجاد کاربر جدید
    createUser(userId, userData) {
        const user = {
            id: userId,
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        this.users[userId] = user;
        this.saveData();

        eventManager.emitEvent('user:registered', { userId, userData });
        return user;
    }

    // به‌روزرسانی کاربر
    updateUser(userId, updates) {
        if (!this.users[userId]) {
            throw new Error(`کاربر با ID ${userId} یافت نشد`);
        }

        this.users[userId] = {
            ...this.users[userId],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveData();
        eventManager.emitEvent('user:updated', { userId, updates });
        return this.users[userId];
    }

    // دریافت کاربر
    getUser(userId) {
        return this.users[userId] || null;
    }

    // دریافت همه کاربران
    getAllUsers() {
        return Object.values(this.users);
    }

    // دریافت کاربران بر اساس نقش
    getUsersByRole(role) {
        return Object.values(this.users).filter(user => user.role === role);
    }

    // حذف کاربر
    deleteUser(userId) {
        if (this.users[userId]) {
            const user = this.users[userId];
            delete this.users[userId];
            this.saveData();

            eventManager.emitEvent('user:deleted', { userId, user });
            return true;
        }
        return false;
    }

    // بررسی وجود کاربر
    userExists(userId) {
        return !!this.users[userId];
    }

    // تنظیم نقش کاربر
    setUserRole(userId, role) {
        if (!this.users[userId]) {
            throw new Error(`کاربر با ID ${userId} یافت نشد`);
        }

        const oldRole = this.users[userId].role;
        this.users[userId].role = role;
        this.users[userId].updatedAt = new Date().toISOString();

        this.saveData();
        eventManager.emitEvent('user:role_changed', { userId, oldRole, newRole: role });
        return this.users[userId];
    }

    // دریافت نقش کاربر
    getUserRole(userId) {
        return this.users[userId]?.role || null;
    }

    // بررسی دسترسی کاربر
    hasPermission(userId, permission) {
        const user = this.users[userId];
        if (!user) return false;

        // بررسی نقش کاربر
        switch (user.role) {
            case 'SCHOOL_ADMIN':
                return true; // مدیر همه دسترسی‌ها را دارد
            case 'COACH':
                return ['read', 'write', 'evaluate'].includes(permission);
            case 'ASSISTANT':
                return ['read', 'write'].includes(permission);
            case 'STUDENT':
                return ['read'].includes(permission);
            default:
                return false;
        }
    }

    // جستجوی کاربر
    searchUsers(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const user of Object.values(this.users)) {
            if (
                user.firstName?.toLowerCase().includes(searchTerm) ||
                user.lastName?.toLowerCase().includes(searchTerm) ||
                user.phone?.includes(searchTerm) ||
                user.nationalCode?.includes(searchTerm)
            ) {
                results.push(user);
            }
        }

        return results;
    }

    // دریافت آمار کاربران
    getUserStats() {
        const stats = {
            total: Object.keys(this.users).length,
            byRole: {},
            byStatus: {},
            active: 0,
            inactive: 0
        };

        for (const user of Object.values(this.users)) {
            // آمار بر اساس نقش
            if (!stats.byRole[user.role]) {
                stats.byRole[user.role] = 0;
            }
            stats.byRole[user.role]++;

            // آمار بر اساس وضعیت
            if (!stats.byStatus[user.status]) {
                stats.byStatus[user.status] = 0;
            }
            stats.byStatus[user.status]++;

            // آمار فعال/غیرفعال
            if (user.status === 'active') {
                stats.active++;
            } else {
                stats.inactive++;
            }
        }

        return stats;
    }

    // پشتیبان‌گیری از داده‌ها
    backupData() {
        const backupFile = path.join(__dirname, 'data', `user_management_backup_${Date.now()}.json`);
        try {
            fs.writeFileSync(backupFile, JSON.stringify({
                users: this.users,
                roles: this.roles,
                backupTime: new Date().toISOString()
            }, null, 2));
            console.log(`✅ [USER] پشتیبان‌گیری انجام شد: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ [USER] خطا در پشتیبان‌گیری:', error.message);
            return null;
        }
    }

    // بازیابی از پشتیبان
    restoreFromBackup(backupFile) {
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            this.users = backupData.users || {};
            this.roles = backupData.roles || {};
            this.saveData();
            console.log(`✅ [USER] بازیابی از پشتیبان انجام شد: ${backupFile}`);
            return true;
        } catch (error) {
            console.error('❌ [USER] خطا در بازیابی از پشتیبان:', error.message);
            return false;
        }
    }
}

module.exports = UserManager;

