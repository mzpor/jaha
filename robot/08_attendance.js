/**
 * 📅 ماژول مدیریت حضور و گزارش‌ها
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');
const eventManager = require('./03_events');

class AttendanceManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'attendance_reports.json');
        this.attendance = {};
        this.weeklyReports = {};
        this.monthlyReports = {};
        this.reports = {};
        this.loadData();
        this.initializeEventListeners();
    }

    // بارگذاری داده‌ها
    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.attendance = data.attendance || {};
                this.weeklyReports = data.weeklyReports || {};
                this.monthlyReports = data.monthlyReports || {};
                this.reports = data.reports || {};
                console.log(`✅ [ATTENDANCE] داده‌های حضور بارگذاری شد`);
            }
        } catch (error) {
            console.error('❌ [ATTENDANCE] خطا در بارگذاری داده‌ها:', error.message);
            this.attendance = {};
            this.weeklyReports = {};
            this.monthlyReports = {};
            this.reports = {};
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
                attendance: this.attendance,
                weeklyReports: this.weeklyReports,
                monthlyReports: this.monthlyReports,
                reports: this.reports,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            console.log('✅ [ATTENDANCE] داده‌های حضور ذخیره شدند');
        } catch (error) {
            console.error('❌ [ATTENDANCE] خطا در ذخیره داده‌ها:', error.message);
        }
    }

    // مقداردهی اولیه event listeners
    initializeEventListeners() {
        eventManager.onEvent('attendance:marked', (data) => {
            console.log(`📅 [ATTENDANCE] حضور ثبت شد: ${data.data.userId}`);
        });

        eventManager.onEvent('attendance:updated', (data) => {
            console.log(`🔄 [ATTENDANCE] حضور به‌روزرسانی شد: ${data.data.userId}`);
        });

        eventManager.onEvent('attendance:reported', (data) => {
            console.log(`📊 [ATTENDANCE] گزارش حضور ارسال شد: ${data.data.reportId}`);
        });
    }

    // ثبت حضور
    markAttendance(userId, groupId, date = new Date(), status = 'present') {
        const dateKey = this.formatDate(date);
        const attendanceKey = `${groupId}_${dateKey}`;

        if (!this.attendance[attendanceKey]) {
            this.attendance[attendanceKey] = {
                groupId: groupId,
                date: dateKey,
                members: {},
                totalPresent: 0,
                totalAbsent: 0,
                totalLate: 0
            };
        }

        const attendance = this.attendance[attendanceKey];
        const oldStatus = attendance.members[userId]?.status;

        attendance.members[userId] = {
            userId: userId,
            status: status,
            timestamp: new Date().toISOString()
        };

        // به‌روزرسانی آمار
        if (oldStatus) {
            this.updateAttendanceStats(attendance, oldStatus, -1);
        }
        this.updateAttendanceStats(attendance, status, 1);

        this.saveData();

        eventManager.emitEvent('attendance:marked', { userId, groupId, date: dateKey, status });
        return attendance.members[userId];
    }

    // به‌روزرسانی آمار حضور
    updateAttendanceStats(attendance, status, change) {
        switch (status) {
            case 'present':
                attendance.totalPresent += change;
                break;
            case 'absent':
                attendance.totalAbsent += change;
                break;
            case 'late':
                attendance.totalLate += change;
                break;
        }
    }

    // دریافت حضور کاربر
    getUserAttendance(userId, groupId, startDate, endDate) {
        const attendances = [];
        
        for (const [key, attendance] of Object.entries(this.attendance)) {
            if (attendance.groupId === groupId) {
                const date = new Date(attendance.date);
                if (date >= startDate && date <= endDate) {
                    const userAttendance = attendance.members[userId];
                    if (userAttendance) {
                        attendances.push({
                            date: attendance.date,
                            status: userAttendance.status,
                            timestamp: userAttendance.timestamp
                        });
                    }
                }
            }
        }

        return attendances.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // دریافت حضور گروه
    getGroupAttendance(groupId, date) {
        const dateKey = this.formatDate(date);
        const attendanceKey = `${groupId}_${dateKey}`;
        return this.attendance[attendanceKey] || null;
    }

    // ایجاد گزارش هفتگی
    generateWeeklyReport(groupId, weekStartDate) {
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const reportId = `weekly_${groupId}_${this.formatDate(weekStartDate)}`;
        
        const report = {
            id: reportId,
            groupId: groupId,
            weekStart: this.formatDate(weekStartDate),
            weekEnd: this.formatDate(weekEndDate),
            totalDays: 7,
            attendance: {},
            summary: {
                totalPresent: 0,
                totalAbsent: 0,
                totalLate: 0,
                averageAttendance: 0
            }
        };

        // جمع‌آوری داده‌های حضور هفته
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStartDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateKey = this.formatDate(currentDate);
            const attendanceKey = `${groupId}_${dateKey}`;
            
            if (this.attendance[attendanceKey]) {
                const dayAttendance = this.attendance[attendanceKey];
                report.attendance[dateKey] = {
                    present: dayAttendance.totalPresent,
                    absent: dayAttendance.totalAbsent,
                    late: dayAttendance.totalLate
                };
                
                report.summary.totalPresent += dayAttendance.totalPresent;
                report.summary.totalAbsent += dayAttendance.totalAbsent;
                report.summary.totalLate += dayAttendance.totalLate;
            }
        }

        // محاسبه میانگین حضور
        const totalDays = Object.keys(report.attendance).length;
        if (totalDays > 0) {
            report.summary.averageAttendance = Math.round(
                (report.summary.totalPresent / (totalDays * 30)) * 100
            );
        }

        this.weeklyReports[reportId] = report;
        this.saveData();

        eventManager.emitEvent('report:weekly_generated', { reportId, groupId });
        return report;
    }

    // ایجاد گزارش ماهانه
    generateMonthlyReport(groupId, month, year) {
        const reportId = `monthly_${groupId}_${year}_${month}`;
        
        const report = {
            id: reportId,
            groupId: groupId,
            month: month,
            year: year,
            totalDays: 0,
            attendance: {},
            summary: {
                totalPresent: 0,
                totalAbsent: 0,
                totalLate: 0,
                averageAttendance: 0,
                bestDay: null,
                worstDay: null
            }
        };

        // جمع‌آوری داده‌های حضور ماه
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        
        for (let day = 1; day <= monthEnd.getDate(); day++) {
            const currentDate = new Date(year, month - 1, day);
            const dateKey = this.formatDate(currentDate);
            const attendanceKey = `${groupId}_${dateKey}`;
            
            if (this.attendance[attendanceKey]) {
                const dayAttendance = this.attendance[attendanceKey];
                report.attendance[dateKey] = {
                    present: dayAttendance.totalPresent,
                    absent: dayAttendance.totalAbsent,
                    late: dayAttendance.totalLate
                };
                
                report.summary.totalPresent += dayAttendance.totalPresent;
                report.summary.totalAbsent += dayAttendance.totalAbsent;
                report.summary.totalLate += dayAttendance.totalLate;
                report.totalDays++;
            }
        }

        // محاسبه میانگین حضور
        if (report.totalDays > 0) {
            report.summary.averageAttendance = Math.round(
                (report.summary.totalPresent / (report.totalDays * 30)) * 100
            );
        }

        // پیدا کردن بهترین و بدترین روز
        let bestDay = null;
        let worstDay = null;
        let bestScore = -1;
        let worstScore = 1000;

        for (const [date, dayData] of Object.entries(report.attendance)) {
            const score = dayData.present / (dayData.present + dayData.absent + dayData.late);
            
            if (score > bestScore) {
                bestScore = score;
                bestDay = date;
            }
            
            if (score < worstScore) {
                worstScore = score;
                worstDay = date;
            }
        }

        report.summary.bestDay = bestDay;
        report.summary.worstDay = worstDay;

        this.monthlyReports[reportId] = report;
        this.saveData();

        eventManager.emitEvent('report:monthly_generated', { reportId, groupId, month, year });
        return report;
    }

    // دریافت گزارش هفتگی
    getWeeklyReport(reportId) {
        return this.weeklyReports[reportId] || null;
    }

    // دریافت گزارش ماهانه
    getMonthlyReport(reportId) {
        return this.monthlyReports[reportId] || null;
    }

    // دریافت همه گزارش‌های هفتگی گروه
    getGroupWeeklyReports(groupId) {
        return Object.values(this.weeklyReports).filter(report => report.groupId === groupId);
    }

    // دریافت همه گزارش‌های ماهانه گروه
    getGroupMonthlyReports(groupId) {
        return Object.values(this.monthlyReports).filter(report => report.groupId === groupId);
    }

    // دریافت آمار حضور
    getAttendanceStats(groupId, startDate, endDate) {
        const stats = {
            totalDays: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0,
            averageAttendance: 0,
            attendanceByDay: {}
        };

        for (const [key, attendance] of Object.entries(this.attendance)) {
            if (attendance.groupId === groupId) {
                const date = new Date(attendance.date);
                if (date >= startDate && date <= endDate) {
                    stats.totalDays++;
                    stats.totalPresent += attendance.totalPresent;
                    stats.totalAbsent += attendance.totalAbsent;
                    stats.totalLate += attendance.totalLate;
                    
                    stats.attendanceByDay[attendance.date] = {
                        present: attendance.totalPresent,
                        absent: attendance.totalAbsent,
                        late: attendance.totalLate
                    };
                }
            }
        }

        if (stats.totalDays > 0) {
            stats.averageAttendance = Math.round(
                (stats.totalPresent / (stats.totalDays * 30)) * 100
            );
        }

        return stats;
    }

    // فرمت تاریخ
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // پشتیبان‌گیری از داده‌ها
    backupData() {
        const backupFile = path.join(__dirname, 'data', `attendance_reports_backup_${Date.now()}.json`);
        try {
            fs.writeFileSync(backupFile, JSON.stringify({
                attendance: this.attendance,
                weeklyReports: this.weeklyReports,
                monthlyReports: this.monthlyReports,
                reports: this.reports,
                backupTime: new Date().toISOString()
            }, null, 2));
            console.log(`✅ [ATTENDANCE] پشتیبان‌گیری انجام شد: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ [ATTENDANCE] خطا در پشتیبان‌گیری:', error.message);
            return null;
        }
    }
}

module.exports = AttendanceManager;

