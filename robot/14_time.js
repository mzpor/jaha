/**
 * ⏰ ماژول مدیریت زمان و تاریخ
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

class TimeManager {
    constructor() {
        this.timezone = 'Asia/Tehran';
        this.locale = 'fa-IR';
    }

    // دریافت زمان فعلی
    getCurrentTime() {
        return new Date();
    }

    // دریافت زمان فعلی به صورت ISO
    getCurrentTimeISO() {
        return new Date().toISOString();
    }

    // دریافت زمان فعلی به صورت محلی
    getCurrentTimeLocal() {
        return new Date().toLocaleString(this.locale, {
            timeZone: this.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // دریافت تاریخ فعلی
    getCurrentDate() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            weekday: now.getDay(),
            isWeekend: now.getDay() === 0 || now.getDay() === 6
        };
    }

    // فرمت تاریخ
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    }

    // فرمت تاریخ فارسی
    formatDatePersian(date) {
        const d = new Date(date);
        return d.toLocaleDateString(this.locale, {
            timeZone: this.timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    // فرمت زمان فارسی
    formatTimePersian(date) {
        const d = new Date(date);
        return d.toLocaleTimeString(this.locale, {
            timeZone: this.timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // دریافت نام روز هفته
    getWeekdayName(date, language = 'fa') {
        const d = new Date(date);
        const weekdays = {
            fa: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'],
            en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        };
        return weekdays[language][d.getDay()];
    }

    // دریافت نام ماه
    getMonthName(date, language = 'fa') {
        const d = new Date(date);
        const months = {
            fa: [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ],
            en: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
        };
        return months[language][d.getMonth()];
    }

    // بررسی آخر هفته
    isWeekend(date) {
        const d = new Date(date);
        return d.getDay() === 0 || d.getDay() === 6;
    }

    // بررسی روز کاری
    isWorkday(date) {
        return !this.isWeekend(date);
    }

    // دریافت شروع هفته
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    // دریافت پایان هفته
    getWeekEnd(date) {
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return weekEnd;
    }

    // دریافت شروع ماه
    getMonthStart(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    // دریافت پایان ماه
    getMonthEnd(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    // محاسبه تفاوت بین دو تاریخ
    getDateDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            days: diffDays,
            hours: Math.ceil(diffTime / (1000 * 60 * 60)),
            minutes: Math.ceil(diffTime / (1000 * 60)),
            seconds: Math.ceil(diffTime / 1000)
        };
    }

    // اضافه کردن روز به تاریخ
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    // اضافه کردن ماه به تاریخ
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }

    // اضافه کردن سال به تاریخ
    addYears(date, years) {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() + years);
        return d;
    }

    // بررسی تاریخ معتبر
    isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    // دریافت سن
    getAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // دریافت فاصله زمانی خوانا
    getReadableTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        if (years > 0) {
            return `${years} سال پیش`;
        } else if (months > 0) {
            return `${months} ماه پیش`;
        } else if (days > 0) {
            return `${days} روز پیش`;
        } else if (hours > 0) {
            return `${hours} ساعت پیش`;
        } else if (minutes > 0) {
            return `${minutes} دقیقه پیش`;
        } else {
            return `${seconds} ثانیه پیش`;
        }
    }

    // دریافت زمان شروع روز
    getDayStart(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // دریافت زمان پایان روز
    getDayEnd(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    // بررسی هم‌زمانی
    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // بررسی هم‌زمانی هفته
    isSameWeek(date1, date2) {
        const week1Start = this.getWeekStart(date1);
        const week2Start = this.getWeekStart(date2);
        return this.isSameDay(week1Start, week2Start);
    }

    // بررسی هم‌زمانی ماه
    isSameMonth(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth();
    }

    // دریافت تعداد روزهای ماه
    getDaysInMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    }

    // دریافت تعداد روزهای هفته
    getDaysInWeek() {
        return 7;
    }

    // دریافت تعداد روزهای سال
    getDaysInYear(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    }

    // تبدیل تاریخ میلادی به شمسی (ساده)
    gregorianToPersian(date) {
        // این یک تبدیل ساده است - برای دقت بیشتر از کتابخانه‌های تخصصی استفاده کنید
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        
        // تقریب ساده برای تبدیل
        const persianYear = year - 621;
        const persianMonth = month > 3 ? month - 3 : month + 9;
        const persianDay = day;
        
        return {
            year: persianYear,
            month: persianMonth,
            day: persianDay
        };
    }

    // دریافت timestamp
    getTimestamp() {
        return Date.now();
    }

    // تبدیل timestamp به تاریخ
    timestampToDate(timestamp) {
        return new Date(timestamp);
    }

    // دریافت زمان UTC
    getUTCTime() {
        return new Date().toUTCString();
    }

    // تنظیم timezone
    setTimezone(timezone) {
        this.timezone = timezone;
    }

    // تنظیم locale
    setLocale(locale) {
        this.locale = locale;
    }
}

module.exports = TimeManager;
