// ماژول مدیریت رابط کاربری زیبا و منظم
// برای کاربران ناشناس و ثبت‌نام شده

class UIManager {
    constructor() {
        this.colors = {
            primary: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️',
            star: '⭐',
            heart: '❤️',
            rocket: '🚀',
            crown: '👑',
            trophy: '🏆',
            gift: '🎁',
            sparkles: '✨'
        };
        
        this.emojis = {
            welcome: '🎉',
            phone: '📱',
            user: '👤',
            settings: '⚙️',
            home: '🏠',
            back: '⬅️',
            next: '➡️',
            check: '✅',
            cross: '❌',
            clock: '⏰',
            calendar: '📅',
            location: '📍',
            money: '💰',
            book: '📚',
            graduation: '🎓',
            teacher: '👨‍🏫',
            student: '👨‍🎓',
            group: '👥',
            report: '📊',
            chart: '📈',
            star: '⭐',
            medal: '🏅',
            flag: '🚩',
            lightbulb: '💡',
            gear: '⚙️',
            tools: '🔧',
            search: '🔍',
            filter: '🔍',
            sort: '📊',
            download: '⬇️',
            upload: '⬆️',
            share: '📤',
            link: '🔗',
            lock: '🔒',
            unlock: '🔓',
            key: '🔑',
            shield: '🛡️',
            badge: '🏷️',
            tag: '🏷️',
            pin: '📌',
            bookmark: '🔖',
            folder: '📁',
            file: '📄',
            image: '🖼️',
            video: '🎥',
            audio: '🎵',
            microphone: '🎤',
            speaker: '🔊',
            volume: '🔊',
            mute: '🔇',
            camera: '📷',
            phone_call: '📞',
            message: '💬',
            mail: '📧',
            inbox: '📥',
            outbox: '📤',
            trash: '🗑️',
            recycle: '♻️',
            refresh: '🔄',
            sync: '🔄',
            wifi: '📶',
            signal: '📶',
            battery: '🔋',
            power: '🔌',
            play: '▶️',
            pause: '⏸️',
            stop: '⏹️',
            fast_forward: '⏩',
            rewind: '⏪',
            skip: '⏭️',
            previous: '⏮️',
            record: '🔴',
            live: '🔴',
            online: '🟢',
            offline: '⚫',
            busy: '🔴',
            away: '🟡',
            available: '🟢',
            example: '📝',
            details: '🔍',
            question: '❓',
            wave: '👋',
            exit: '🚪',
            robot: '🤖'
        };
    }

    // ایجاد متن خوش‌آمدگویی زیبا برای کاربران ناشناس
    createWelcomeMessage() {
        return `${this.emojis.welcome} **به ربات دستیار هوشمند خوش آمدید!** ${this.emojis.sparkles}

${this.emojis.rocket} **برای شروع، لطفاً در دستیار هوشمند ثبت‌نام کنید**

${this.emojis.phone} **مراحل ثبت‌نام:**
1️⃣ ارسال شماره تلفن
2️⃣ وارد کردن نام و نام خانوادگی
3️⃣ تکمیل پروفایل

${this.emojis.info} **نکته مهم:** بعد از ارسال تلفن، بلافاصله نام و نام خانوادگی را وارد کنید
${this.emojis.example} مثال: محمد محمدی

${this.emojis.star} **ویژگی‌های ربات:**
• ${this.emojis.report} گزارش‌گیری هوشمند
• ${this.emojis.chart} ارزیابی پیشرفت
• ${this.emojis.group} مدیریت گروه‌ها
• ${this.emojis.settings} تنظیمات شخصی‌سازی`;
    }

    // ایجاد متن خوش‌آمدگویی زیبا برای کاربران ثبت‌نام شده
    createRegisteredUserWelcome(userRole, firstName) {
        const roleEmoji = this.getRoleEmoji(userRole);
        const roleName = this.getRoleDisplayName(userRole);
        
        return `${this.emojis.crown} **خوش‌آمدی ${roleName} ${firstName}!** ${this.emojis.sparkles}

${this.emojis.check} **پنل ${roleName} با موفقیت فعال شد** ${this.emojis.trophy}

${this.emojis.info} **دسترسی‌های شما:**
${this.getRoleCapabilities(userRole)}

${this.emojis.rocket} **برای شروع کار، یکی از گزینه‌های زیر را انتخاب کنید:**`;
    }

    // ایجاد متن خطا زیبا
    createErrorMessage(errorType, details = '') {
        const errorMessages = {
            'registration': `${this.emojis.error} **خطا در ادامه ثبت‌نام**
${this.emojis.info} لطفاً دوباره تلاش کنید
${this.emojis.refresh} در صورت تکرار خطا، با پشتیبانی تماس بگیرید`,
            
            'unknown_step': `${this.emojis.warning} **مرحله ناشناخته در ثبت‌نام**
${this.emojis.info} سیستم شما را به ابتدای فرآیند هدایت می‌کند
${this.emojis.rocket} لطفاً مجدداً شروع کنید`,
            
            'phone_invalid': `${this.emojis.error} **شماره تلفن نامعتبر**
${this.emojis.info} لطفاً شماره صحیح وارد کنید
${this.emojis.example} مثال: 09123456789`,
            
            'name_invalid': `${this.emojis.error} **نام وارد شده نامعتبر**
${this.emojis.info} لطفاً نام و نام خانوادگی کامل وارد کنید
${this.emojis.example} مثال: محمد محمدی`
        };

        let message = errorMessages[errorType] || errorMessages['registration'];
        
        if (details) {
            message += `\n\n${this.emojis.details} **جزئیات:** ${details}`;
        }

        return message;
    }

    // ایجاد متن موفقیت زیبا
    createSuccessMessage(action, details = '') {
        const successMessages = {
            'registration_complete': `${this.emojis.success} **ثبت‌نام با موفقیت تکمیل شد!** ${this.emojis.trophy}
${this.emojis.rocket} حالا می‌توانید از تمام امکانات ربات استفاده کنید`,
            
            'profile_updated': `${this.emojis.success} **پروفایل با موفقیت به‌روزرسانی شد!** ${this.emojis.check}
${this.emojis.info} تغییرات اعمال شده`,
            
            'data_saved': `${this.emojis.success} **اطلاعات با موفقیت ذخیره شد!** ${this.emojis.check}
${this.emojis.info} می‌توانید ادامه دهید`
        };

        let message = successMessages[action] || successMessages['data_saved'];
        
        if (details) {
            message += `\n\n${this.emojis.details} **جزئیات:** ${details}`;
        }

        return message;
    }

    // ایجاد متن راهنما زیبا
    createHelpMessage(userType = 'anonymous') {
        if (userType === 'anonymous') {
            return `${this.emojis.lightbulb} **راهنمای ثبت‌نام** ${this.emojis.book}

${this.emojis.phone} **مرحله 1: ارسال شماره تلفن**
• روی دکمه "📱 ارسال شماره تلفن" کلیک کنید
• شماره تلفن شما به صورت خودکار ارسال می‌شود

${this.emojis.user} **مرحله 2: وارد کردن نام**
• نام و نام خانوادگی خود را وارد کنید
• مثال: محمد محمدی

${this.emojis.check} **مرحله 3: تکمیل پروفایل**
• اطلاعات تکمیلی را وارد کنید
• ثبت‌نام شما تکمیل می‌شود

${this.emojis.info} **نکات مهم:**
• تمام اطلاعات محرمانه و امن هستند
• در هر مرحله می‌توانید از دکمه "⬅️ بازگشت" استفاده کنید
• در صورت مشکل با پشتیبانی تماس بگیرید`;
        } else {
            return `${this.emojis.lightbulb} **راهنمای استفاده از ربات** ${this.emojis.book}

${this.emojis.home} **منوی اصلی:**
• شروع: دسترسی به امکانات اصلی
• پروفایل: مشاهده و ویرایش اطلاعات شخصی
• تنظیمات: تغییر تنظیمات ربات

${this.emojis.report} **گزارش‌گیری:**
• گزارش روزانه: ثبت فعالیت‌های روزانه
• گزارش هفتگی: خلاصه هفته
• گزارش ماهانه: آمار ماهانه

${this.emojis.group} **مدیریت گروه:**
• مشاهده اعضا
• ارسال پیام گروهی
• مدیریت دسترسی‌ها

${this.emojis.info} **نکات مهم:**
• تمام تغییرات به صورت خودکار ذخیره می‌شوند
• می‌توانید از دکمه "🔄 ریست" برای شروع مجدد استفاده کنید
• در صورت مشکل با پشتیبانی تماس بگیرید`;
        }
    }

    // ایجاد متن اطلاع‌رسانی زیبا
    createInfoMessage(title, content, type = 'info') {
        const typeEmoji = {
            'info': this.emojis.info,
            'warning': this.emojis.warning,
            'success': this.emojis.success,
            'error': this.emojis.error
        };

        return `${typeEmoji[type]} **${title}**

${content}

${this.emojis.clock} **زمان:** ${new Date().toLocaleString('fa-IR')}`;
    }

    // ایجاد متن تأیید زیبا
    createConfirmationMessage(action, details = '') {
        return `${this.emojis.question} **تأیید عملیات** ${this.emojis.check}

${this.emojis.info} **عملیات:** ${action}

${details ? `${this.emojis.details} **جزئیات:** ${details}\n\n` : ''}${this.emojis.warning} **آیا مطمئن هستید؟**

${this.emojis.check} **تأیید** | ${this.emojis.cross} **انصراف**`;
    }

    // دریافت ایموجی مناسب برای نقش
    getRoleEmoji(userRole) {
        const roleEmojis = {
            'coach': this.emojis.teacher,
            'assistant': this.emojis.graduation,
            'student': this.emojis.student,
            'admin': this.emojis.crown
        };
        
        return roleEmojis[userRole] || this.emojis.user;
    }

    // دریافت نام نمایشی نقش
    getRoleDisplayName(userRole) {
        const roleNames = {
            'coach': 'راهبر',
            'assistant': 'دبیر',
            'student': 'فعال',
            'admin': 'مدیر'
        };
        
        return roleNames[userRole] || 'کاربر';
    }

    // دریافت قابلیت‌های نقش
    getRoleCapabilities(userRole) {
        const capabilities = {
            'coach': `• ${this.emojis.report} مدیریت گزارش‌ها
• ${this.emojis.group} مدیریت گروه‌ها
• ${this.emojis.chart} مشاهده آمار
• ${this.emojis.settings} تنظیمات پیشرفته`,
            
            'assistant': `• ${this.emojis.report} ثبت گزارش‌ها
• ${this.emojis.group} مشاهده گروه‌ها
• ${this.emojis.chart} مشاهده آمار
• ${this.emojis.settings} تنظیمات شخصی`,
            
            'student': `• ${this.emojis.report} ثبت فعالیت‌ها
• ${this.emojis.chart} مشاهده پیشرفت
• ${this.emojis.settings} تنظیمات پایه`,
            
            'admin': `• ${this.emojis.crown} مدیریت کامل سیستم
• ${this.emojis.report} مشاهده تمام گزارش‌ها
• ${this.emojis.group} مدیریت تمام گروه‌ها
• ${this.emojis.settings} تنظیمات سیستم`
        };
        
        return capabilities[userRole] || capabilities['student'];
    }

    // ایجاد کیبرد زیبا برای کاربران ناشناس
    createAnonymousKeyboard() {
        return {
            keyboard: [
                [{ text: `${this.emojis.phone} ارسال شماره تلفن`, request_contact: true }],
                [{ text: `${this.emojis.lightbulb} راهنما` }],
                [{ text: `${this.emojis.info} درباره ربات` }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        };
    }

    // ایجاد کیبرد زیبا برای کاربران ثبت‌نام شده
    createRegisteredUserKeyboard(userRole) {
        const baseButtons = [
            [{ text: `${this.emojis.home} شروع` }],
            [{ text: `${this.emojis.user} پروفایل` }],
            [{ text: `${this.emojis.settings} تنظیمات` }]
        ];

        // اضافه کردن دکمه‌های مخصوص نقش
        if (userRole === 'coach') {
            baseButtons.push([{ text: `${this.emojis.teacher} راهبر` }]);
        } else if (userRole === 'assistant') {
            baseButtons.push([{ text: `${this.emojis.graduation} دبیر` }]);
        }

        // اضافه کردن دکمه‌های عمومی
        baseButtons.push([
            { text: `${this.emojis.robot} ربات` },
            { text: `${this.emojis.exit} خروج` }
        ]);

        // اضافه کردن دکمه ریست اگر مجاز باشد
        if (this.allowUserReset) {
            baseButtons.push([{ text: `${this.emojis.refresh} ریست` }]);
        }

        return {
            keyboard: baseButtons,
            resize_keyboard: true,
            one_time_keyboard: false
        };
    }

    // تنظیم مجوز ریست کاربر
    setAllowUserReset(allow) {
        this.allowUserReset = allow;
    }

    // ایجاد متن خروج زیبا
    createExitMessage() {
        return `${this.emojis.wave} **خروج از ربات** ${this.emojis.heart}

${this.emojis.info} **شما با موفقیت از ربات خارج شدید**

${this.emojis.rocket} **برای استفاده مجدد، دستور /start را ارسال کنید**

${this.emojis.star} **امیدواریم تجربه خوبی داشته باشید!**

${this.emojis.clock} **زمان خروج:** ${new Date().toLocaleString('fa-IR')}`;
    }

    // ایجاد متن بازگشت زیبا
    createBackMessage() {
        return `${this.emojis.back} **بازگشت به منوی اصلی** ${this.emojis.home}

${this.emojis.info} **شما به منوی اصلی بازگشتید**

${this.emojis.rocket} **لطفاً یکی از گزینه‌های زیر را انتخاب کنید:**`;
    }
}

module.exports = UIManager;
