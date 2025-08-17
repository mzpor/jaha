/**
 * 🔄 اسکریپت تبدیل فایل‌های JSON به 4 فایل اصلی
 * نسخه: 1.0.0
 * تاریخ: 1404/05/17
 */

const fs = require('fs');
const path = require('path');

class JsonMigrator {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.backupDir = path.join(__dirname, 'data', 'backup');
        this.ensureDirectories();
    }

    // اطمینان از وجود دایرکتوری‌ها
    ensureDirectories() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    // پشتیبان‌گیری از فایل‌های موجود
    backupExistingFiles() {
        console.log('📦 ایجاد پشتیبان از فایل‌های موجود...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup_${timestamp}`);
        
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.json'));
        
        for (const file of files) {
            const sourcePath = path.join(this.dataDir, file);
            const destPath = path.join(backupPath, file);
            
            try {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`✅ پشتیبان از ${file} ایجاد شد`);
            } catch (error) {
                console.error(`❌ خطا در پشتیبان‌گیری از ${file}:`, error.message);
            }
        }

        console.log(`📁 پشتیبان در ${backupPath} ذخیره شد`);
        return backupPath;
    }

    // تبدیل فایل‌ها به 4 فایل اصلی
    async migrateToFourFiles() {
        console.log('🔄 شروع تبدیل فایل‌های JSON...');

        try {
            // 1. فایل تنظیمات اصلی
            await this.createCoreConfig();
            
            // 2. فایل مدیریت کاربران
            await this.createUserManagement();
            
            // 3. فایل سیستم ارزیابی
            await this.createEvaluationSystem();
            
            // 4. فایل حضور و گزارش‌ها
            await this.createAttendanceReports();

            console.log('✅ تبدیل فایل‌ها با موفقیت انجام شد');
            
        } catch (error) {
            console.error('❌ خطا در تبدیل فایل‌ها:', error.message);
            throw error;
        }
    }

    // ایجاد فایل تنظیمات اصلی
    async createCoreConfig() {
        console.log('⚙️ ایجاد فایل تنظیمات اصلی...');
        
        const coreConfig = {
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
            },
            lastUpdated: new Date().toISOString()
        };

        // ادغام با فایل‌های موجود
        try {
            const settingsPath = path.join(this.dataDir, 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                coreConfig.settings = settings;
            }
        } catch (error) {
            console.log('⚠️ فایل settings.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const reportsConfigPath = path.join(this.dataDir, 'reports_config.json');
            if (fs.existsSync(reportsConfigPath)) {
                const reportsConfig = JSON.parse(fs.readFileSync(reportsConfigPath, 'utf8'));
                coreConfig.reports = reportsConfig;
            }
        } catch (error) {
            console.log('⚠️ فایل reports_config.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const siteStatusPath = path.join(this.dataDir, 'site-status.json');
            if (fs.existsSync(siteStatusPath)) {
                const siteStatus = JSON.parse(fs.readFileSync(siteStatusPath, 'utf8'));
                coreConfig.siteStatus = siteStatus;
            }
        } catch (error) {
            console.log('⚠️ فایل site-status.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const groupsConfigPath = path.join(this.dataDir, 'groups_config.json');
            if (fs.existsSync(groupsConfigPath)) {
                const groupsConfig = JSON.parse(fs.readFileSync(groupsConfigPath, 'utf8'));
                coreConfig.groupsConfig = groupsConfig;
            }
        } catch (error) {
            console.log('⚠️ فایل groups_config.json یافت نشد یا قابل خواندن نیست');
        }

        const outputPath = path.join(this.dataDir, 'core_config.json');
        fs.writeFileSync(outputPath, JSON.stringify(coreConfig, null, 2));
        console.log('✅ فایل core_config.json ایجاد شد');
    }

    // ایجاد فایل مدیریت کاربران
    async createUserManagement() {
        console.log('👥 ایجاد فایل مدیریت کاربران...');
        
        const userManagement = {
            users: {},
            roles: {},
            registrations: {},
            coaches: {},
            permanentMembers: {},
            memberRoles: {},
            verificationCodes: {},
            lastUpdated: new Date().toISOString()
        };

        // ادغام با فایل‌های موجود
        try {
            const smartRegPath = path.join(this.dataDir, 'smart_registration.json');
            if (fs.existsSync(smartRegPath)) {
                const smartReg = JSON.parse(fs.readFileSync(smartRegPath, 'utf8'));
                userManagement.registrations = smartReg;
            }
        } catch (error) {
            console.log('⚠️ فایل smart_registration.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const coachesPath = path.join(this.dataDir, 'coaches.json');
            if (fs.existsSync(coachesPath)) {
                const coaches = JSON.parse(fs.readFileSync(coachesPath, 'utf8'));
                userManagement.coaches = coaches;
            }
        } catch (error) {
            console.log('⚠️ فایل coaches.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const permanentMembersPath = path.join(this.dataDir, 'permanent_members.json');
            if (fs.existsSync(permanentMembersPath)) {
                const permanentMembers = JSON.parse(fs.readFileSync(permanentMembersPath, 'utf8'));
                userManagement.permanentMembers = permanentMembers;
            }
        } catch (error) {
            console.log('⚠️ فایل permanent_members.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const memberRolesPath = path.join(this.dataDir, 'member_roles.json');
            if (fs.existsSync(memberRolesPath)) {
                const memberRoles = JSON.parse(fs.readFileSync(memberRolesPath, 'utf8'));
                userManagement.memberRoles = memberRoles;
            }
        } catch (error) {
            console.log('⚠️ فایل member_roles.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const verificationCodesPath = path.join(this.dataDir, 'verification_codes.json');
            if (fs.existsSync(verificationCodesPath)) {
                const verificationCodes = JSON.parse(fs.readFileSync(verificationCodesPath, 'utf8'));
                userManagement.verificationCodes = verificationCodes;
            }
        } catch (error) {
            console.log('⚠️ فایل verification_codes.json یافت نشد یا قابل خواندن نیست');
        }

        const outputPath = path.join(this.dataDir, 'user_management.json');
        fs.writeFileSync(outputPath, JSON.stringify(userManagement, null, 2));
        console.log('✅ فایل user_management.json ایجاد شد');
    }

    // ایجاد فایل سیستم ارزیابی
    async createEvaluationSystem() {
        console.log('📊 ایجاد فایل سیستم ارزیابی...');
        
        const evaluationSystem = {
            evaluations: {},
            questions: {},
            results: {},
            practiceData: {},
            satisfactionData: {},
            lastUpdated: new Date().toISOString()
        };

        // ادغام با فایل‌های موجود
        try {
            const evaluationDataPath = path.join(this.dataDir, 'evaluation_data.json');
            if (fs.existsSync(evaluationDataPath)) {
                const evaluationData = JSON.parse(fs.readFileSync(evaluationDataPath, 'utf8'));
                evaluationSystem.evaluations = evaluationData;
            }
        } catch (error) {
            console.log('⚠️ فایل evaluation_data.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const evaluationQuestionsPath = path.join(this.dataDir, 'evaluation_questions.json');
            if (fs.existsSync(evaluationQuestionsPath)) {
                const evaluationQuestions = JSON.parse(fs.readFileSync(evaluationQuestionsPath, 'utf8'));
                evaluationSystem.questions = evaluationQuestions;
            }
        } catch (error) {
            console.log('⚠️ فایل evaluation_questions.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const evaluationResultsPath = path.join(this.dataDir, 'evaluation_results.json');
            if (fs.existsSync(evaluationResultsPath)) {
                const evaluationResults = JSON.parse(fs.readFileSync(evaluationResultsPath, 'utf8'));
                evaluationSystem.results = evaluationResults;
            }
        } catch (error) {
            console.log('⚠️ فایل evaluation_results.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const practiceDataPath = path.join(this.dataDir, 'practice_data.json');
            if (fs.existsSync(practiceDataPath)) {
                const practiceData = JSON.parse(fs.readFileSync(practiceDataPath, 'utf8'));
                evaluationSystem.practiceData = practiceData;
            }
        } catch (error) {
            console.log('⚠️ فایل practice_data.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const satisfactionDataPath = path.join(this.dataDir, 'satisfaction_data.json');
            if (fs.existsSync(satisfactionDataPath)) {
                const satisfactionData = JSON.parse(fs.readFileSync(satisfactionDataPath, 'utf8'));
                evaluationSystem.satisfactionData = satisfactionData;
            }
        } catch (error) {
            console.log('⚠️ فایل satisfaction_data.json یافت نشد یا قابل خواندن نیست');
        }

        const outputPath = path.join(this.dataDir, 'evaluation_system.json');
        fs.writeFileSync(outputPath, JSON.stringify(evaluationSystem, null, 2));
        console.log('✅ فایل evaluation_system.json ایجاد شد');
    }

    // ایجاد فایل حضور و گزارش‌ها
    async createAttendanceReports() {
        console.log('📅 ایجاد فایل حضور و گزارش‌ها...');
        
        const attendanceReports = {
            attendance: {},
            weeklyReports: {},
            monthlyReports: {},
            reports: {},
            lastUpdated: new Date().toISOString()
        };

        // ادغام با فایل‌های موجود
        try {
            const attendanceDataPath = path.join(this.dataDir, 'attendance_data.json');
            if (fs.existsSync(attendanceDataPath)) {
                const attendanceData = JSON.parse(fs.readFileSync(attendanceDataPath, 'utf8'));
                attendanceReports.attendance = attendanceData;
            }
        } catch (error) {
            console.log('⚠️ فایل attendance_data.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const weeklyReportsPath = path.join(this.dataDir, 'weekly_reports.json');
            if (fs.existsSync(weeklyReportsPath)) {
                const weeklyReports = JSON.parse(fs.readFileSync(weeklyReportsPath, 'utf8'));
                attendanceReports.weeklyReports = weeklyReports;
            }
        } catch (error) {
            console.log('⚠️ فایل weekly_reports.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const monthlyReportsPath = path.join(this.dataDir, 'monthly_reports.json');
            if (fs.existsSync(monthlyReportsPath)) {
                const monthlyReports = JSON.parse(fs.readFileSync(monthlyReportsPath, 'utf8'));
                attendanceReports.monthlyReports = monthlyReports;
            }
        } catch (error) {
            console.log('⚠️ فایل monthly_reports.json یافت نشد یا قابل خواندن نیست');
        }

        try {
            const reportsPath = path.join(this.dataDir, 'reports.json');
            if (fs.existsSync(reportsPath)) {
                const reports = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
                attendanceReports.reports = reports;
            }
        } catch (error) {
            console.log('⚠️ فایل reports.json یافت نشد یا قابل خواندن نیست');
        }

        const outputPath = path.join(this.dataDir, 'attendance_reports.json');
        fs.writeFileSync(outputPath, JSON.stringify(attendanceReports, null, 2));
        console.log('✅ فایل attendance_reports.json ایجاد شد');
    }

    // حذف فایل‌های قدیمی (اختیاری)
    removeOldFiles(keepWorkshops = true) {
        console.log('🗑️ حذف فایل‌های قدیمی...');
        
        const filesToRemove = [
            'settings.json',
            'reports_config.json',
            'site-status.json',
            'groups_config.json',
            'smart_registration.json',
            'coaches.json',
            'permanent_members.json',
            'member_roles.json',
            'verification_codes.json',
            'evaluation_data.json',
            'evaluation_questions.json',
            'evaluation_results.json',
            'practice_data.json',
            'satisfaction_data.json',
            'attendance_data.json',
            'weekly_reports.json',
            'monthly_reports.json',
            'reports.json'
        ];

        let removedCount = 0;
        for (const file of filesToRemove) {
            const filePath = path.join(this.dataDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ فایل ${file} حذف شد`);
                    removedCount++;
                } catch (error) {
                    console.error(`❌ خطا در حذف ${file}:`, error.message);
                }
            }
        }

        console.log(`✅ ${removedCount} فایل قدیمی حذف شد`);
        
        // نگه داشتن فایل workshops.json
        if (keepWorkshops) {
            console.log('🏫 فایل workshops.json حفظ شد');
        }
    }

    // اجرای کامل migration
    async runMigration() {
        console.log('🚀 شروع فرآیند تبدیل فایل‌های JSON...');
        
        try {
            // 1. پشتیبان‌گیری
            const backupPath = this.backupExistingFiles();
            
            // 2. تبدیل فایل‌ها
            await this.migrateToFourFiles();
            
            // 3. حذف فایل‌های قدیمی (اختیاری)
            const removeOld = process.argv.includes('--remove-old');
            if (removeOld) {
                this.removeOldFiles();
            }
            
            console.log('🎉 فرآیند تبدیل با موفقیت تکمیل شد!');
            console.log('📁 فایل‌های جدید ایجاد شده:');
            console.log('  - core_config.json');
            console.log('  - user_management.json');
            console.log('  - evaluation_system.json');
            console.log('  - attendance_reports.json');
            console.log('  - workshops.json (حفظ شده)');
            console.log(`📦 پشتیبان در ${backupPath} ذخیره شد`);
            
        } catch (error) {
            console.error('❌ خطا در فرآیند تبدیل:', error.message);
            process.exit(1);
        }
    }
}

// اجرای migration
if (require.main === module) {
    const migrator = new JsonMigrator();
    migrator.runMigration();
}

module.exports = JsonMigrator;
