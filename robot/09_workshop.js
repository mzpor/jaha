/**
 * 🏫 ماژول مدیریت کارگاه‌ها
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');
const eventManager = require('./03_events');

class WorkshopManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'workshops.json');
        this.workshops = {};
        this.loadData();
        this.initializeEventListeners();
    }

    // بارگذاری داده‌ها
    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.workshops = data.workshops || {};
                console.log(`✅ [WORKSHOP] ${Object.keys(this.workshops).length} کارگاه بارگذاری شد`);
            }
        } catch (error) {
            console.error('❌ [WORKSHOP] خطا در بارگذاری داده‌ها:', error.message);
            this.workshops = {};
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
                workshops: this.workshops,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            console.log('✅ [WORKSHOP] داده‌های کارگاه‌ها ذخیره شدند');
        } catch (error) {
            console.error('❌ [WORKSHOP] خطا در ذخیره داده‌ها:', error.message);
        }
    }

    // مقداردهی اولیه event listeners
    initializeEventListeners() {
        eventManager.onEvent('workshop:created', (data) => {
            console.log(`🏫 [WORKSHOP] کارگاه جدید ایجاد شد: ${data.data.workshopId}`);
        });

        eventManager.onEvent('workshop:updated', (data) => {
            console.log(`🔄 [WORKSHOP] کارگاه به‌روزرسانی شد: ${data.data.workshopId}`);
        });

        eventManager.onEvent('workshop:deleted', (data) => {
            console.log(`🗑️ [WORKSHOP] کارگاه حذف شد: ${data.data.workshopId}`);
        });
    }

    // ایجاد کارگاه جدید
    createWorkshop(workshopData) {
        const workshopId = `workshop_${Date.now()}`;
        
        const workshop = {
            id: workshopId,
            ...workshopData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            members: [],
            instructors: [],
            assistants: []
        };

        this.workshops[workshopId] = workshop;
        this.saveData();

        eventManager.emitEvent('workshop:created', { workshopId, workshopData });
        return workshop;
    }

    // به‌روزرسانی کارگاه
    updateWorkshop(workshopId, updates) {
        if (!this.workshops[workshopId]) {
            throw new Error(`کارگاه با ID ${workshopId} یافت نشد`);
        }

        this.workshops[workshopId] = {
            ...this.workshops[workshopId],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveData();
        eventManager.emitEvent('workshop:updated', { workshopId, updates });
        return this.workshops[workshopId];
    }

    // دریافت کارگاه
    getWorkshop(workshopId) {
        return this.workshops[workshopId] || null;
    }

    // دریافت همه کارگاه‌ها
    getAllWorkshops() {
        return Object.values(this.workshops);
    }

    // دریافت کارگاه‌های فعال
    getActiveWorkshops() {
        return Object.values(this.workshops).filter(workshop => workshop.status === 'active');
    }

    // حذف کارگاه
    deleteWorkshop(workshopId) {
        if (this.workshops[workshopId]) {
            const workshop = this.workshops[workshopId];
            delete this.workshops[workshopId];
            this.saveData();

            eventManager.emitEvent('workshop:deleted', { workshopId, workshop });
            return true;
        }
        return false;
    }

    // اضافه کردن عضو به کارگاه
    addMemberToWorkshop(workshopId, userId, role = 'student') {
        if (!this.workshops[workshopId]) {
            throw new Error(`کارگاه با ID ${workshopId} یافت نشد`);
        }

        const workshop = this.workshops[workshopId];
        const member = {
            userId: userId,
            role: role,
            joinedAt: new Date().toISOString()
        };

        // بررسی وجود عضو
        const existingMemberIndex = workshop.members.findIndex(m => m.userId === userId);
        if (existingMemberIndex !== -1) {
            workshop.members[existingMemberIndex] = member;
        } else {
            workshop.members.push(member);
        }

        // اضافه کردن به نقش‌های مربوطه
        if (role === 'instructor') {
            const instructorIndex = workshop.instructors.findIndex(i => i.userId === userId);
            if (instructorIndex === -1) {
                workshop.instructors.push(member);
            }
        } else if (role === 'assistant') {
            const assistantIndex = workshop.assistants.findIndex(a => a.userId === userId);
            if (assistantIndex === -1) {
                workshop.assistants.push(member);
            }
        }

        this.saveData();
        return member;
    }

    // حذف عضو از کارگاه
    removeMemberFromWorkshop(workshopId, userId) {
        if (!this.workshops[workshopId]) {
            throw new Error(`کارگاه با ID ${workshopId} یافت نشد`);
        }

        const workshop = this.workshops[workshopId];
        
        // حذف از اعضا
        workshop.members = workshop.members.filter(m => m.userId !== userId);
        
        // حذف از مربیان
        workshop.instructors = workshop.instructors.filter(i => i.userId !== userId);
        
        // حذف از کمک مربیان
        workshop.assistants = workshop.assistants.filter(a => a.userId !== userId);

        this.saveData();
        return true;
    }

    // دریافت اعضای کارگاه
    getWorkshopMembers(workshopId) {
        if (!this.workshops[workshopId]) {
            return [];
        }
        return this.workshops[workshopId].members || [];
    }

    // دریافت مربیان کارگاه
    getWorkshopInstructors(workshopId) {
        if (!this.workshops[workshopId]) {
            return [];
        }
        return this.workshops[workshopId].instructors || [];
    }

    // دریافت کمک مربیان کارگاه
    getWorkshopAssistants(workshopId) {
        if (!this.workshops[workshopId]) {
            return [];
        }
        return this.workshops[workshopId].assistants || [];
    }

    // بررسی عضویت کاربر در کارگاه
    isUserInWorkshop(workshopId, userId) {
        if (!this.workshops[workshopId]) {
            return false;
        }
        return this.workshops[workshopId].members.some(m => m.userId === userId);
    }

    // دریافت نقش کاربر در کارگاه
    getUserRoleInWorkshop(workshopId, userId) {
        if (!this.workshops[workshopId]) {
            return null;
        }
        const member = this.workshops[workshopId].members.find(m => m.userId === userId);
        return member ? member.role : null;
    }

    // جستجوی کارگاه
    searchWorkshops(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const workshop of Object.values(this.workshops)) {
            if (
                workshop.name?.toLowerCase().includes(searchTerm) ||
                workshop.description?.toLowerCase().includes(searchTerm) ||
                workshop.level?.toLowerCase().includes(searchTerm)
            ) {
                results.push(workshop);
            }
        }

        return results;
    }

    // دریافت آمار کارگاه‌ها
    getWorkshopStats() {
        const stats = {
            total: Object.keys(this.workshops).length,
            active: 0,
            inactive: 0,
            byLevel: {},
            totalMembers: 0,
            totalInstructors: 0,
            totalAssistants: 0
        };

        for (const workshop of Object.values(this.workshops)) {
            if (workshop.status === 'active') {
                stats.active++;
            } else {
                stats.inactive++;
            }

            if (!stats.byLevel[workshop.level]) {
                stats.byLevel[workshop.level] = 0;
            }
            stats.byLevel[workshop.level]++;

            stats.totalMembers += workshop.members.length;
            stats.totalInstructors += workshop.instructors.length;
            stats.totalAssistants += workshop.assistants.length;
        }

        return stats;
    }

    // تغییر وضعیت کارگاه
    changeWorkshopStatus(workshopId, status) {
        if (!this.workshops[workshopId]) {
            throw new Error(`کارگاه با ID ${workshopId} یافت نشد`);
        }

        this.workshops[workshopId].status = status;
        this.workshops[workshopId].updatedAt = new Date().toISOString();
        this.saveData();

        return this.workshops[workshopId];
    }

    // دریافت کارگاه‌های کاربر
    getUserWorkshops(userId) {
        const userWorkshops = [];
        
        for (const workshop of Object.values(this.workshops)) {
            const member = workshop.members.find(m => m.userId === userId);
            if (member) {
                userWorkshops.push({
                    ...workshop,
                    userRole: member.role
                });
            }
        }

        return userWorkshops;
    }

    // پشتیبان‌گیری از داده‌ها
    backupData() {
        const backupFile = path.join(__dirname, 'data', `workshops_backup_${Date.now()}.json`);
        try {
            fs.writeFileSync(backupFile, JSON.stringify({
                workshops: this.workshops,
                backupTime: new Date().toISOString()
            }, null, 2));
            console.log(`✅ [WORKSHOP] پشتیبان‌گیری انجام شد: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ [WORKSHOP] خطا در پشتیبان‌گیری:', error.message);
            return null;
        }
    }

    // بازیابی از پشتیبان
    restoreFromBackup(backupFile) {
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            this.workshops = backupData.workshops || {};
            this.saveData();
            console.log(`✅ [WORKSHOP] بازیابی از پشتیبان انجام شد: ${backupFile}`);
            return true;
        } catch (error) {
            console.error('❌ [WORKSHOP] خطا در بازیابی از پشتیبان:', error.message);
            return false;
        }
    }
}

module.exports = WorkshopManager;
