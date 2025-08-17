// ماژول گزارش‌گیری سلسله‌مراتبی
// هر نقش می‌تواند از نقش‌های پایین‌تر خودش گزارش بگیرد
// گزارش‌ها به صورت خودکار به نقش بالاتر منتقل می‌شود

const fs = require('fs');
const path = require('path');

class HierarchicalReportingManager {
  constructor() {
    this.reportsFile = path.join(__dirname, 'data', 'hierarchical_reports.json');
    this.userStates = new Map(); // وضعیت کاربران در حال ثبت گزارش
    this.reports = this.loadReports();
    
    // تعریف سلسله مراتب نقش‌ها
    this.roleHierarchy = {
      'SCHOOL_ADMIN': ['COACH', 'ASSISTANT', 'STUDENT'],
      'COACH': ['ASSISTANT', 'STUDENT'],
      'ASSISTANT': ['STUDENT'],
      'STUDENT': []
    };
    
    // تعریف نام‌های نمایشی نقش‌ها
    this.roleDisplayNames = {
      'SCHOOL_ADMIN': 'مدیر',
      'COACH': 'راهبر',
      'ASSISTANT': 'دبیر',
      'STUDENT': 'فعال'
    };
  }

  // بارگذاری گزارش‌های موجود
  loadReports() {
    try {
      if (fs.existsSync(this.reportsFile)) {
        const data = fs.readFileSync(this.reportsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری گزارش‌های سلسله‌مراتبی:', error);
    }
    return {};
  }

  // ذخیره گزارش‌ها
  saveReports() {
    try {
      const dir = path.dirname(this.reportsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.reportsFile, JSON.stringify(this.reports, null, 2));
      return true;
    } catch (error) {
      console.error('❌ خطا در ذخیره گزارش‌های سلسله‌مراتبی:', error);
      return false;
    }
  }

  // شروع گزارش‌گیری برای نقش خاص
  startReporting(chatId, userId, userRole, userName) {
    const availableRoles = this.roleHierarchy[userRole] || [];
    
    if (availableRoles.length === 0) {
      return {
        text: '❌ شما نمی‌توانید از هیچ نقشی گزارش بگیرید.',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
      };
    }

    // ذخیره وضعیت کاربر
    this.userStates.set(chatId, {
      userId,
      userRole,
      userName,
      step: 'select_role',
      selectedRole: null,
      selectedUserId: null,
      answers: {}
    });

    // ساخت کیبورد برای انتخاب نقش
    const keyboard = [];
    for (const role of availableRoles) {
      keyboard.push([{ 
        text: `👥 ${this.roleDisplayNames[role]}ها`, 
        callback_data: `select_role_${role}` 
      }]);
    }
    keyboard.push([{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]);

    return {
      text: `📝 *گزارش‌گیری سلسله‌مراتبی*\n\n👤 شما به عنوان ${this.roleDisplayNames[userRole]} می‌توانید از نقش‌های زیر گزارش بگیرید:\n\nلطفاً نقش مورد نظر را انتخاب کنید:`,
      keyboard
    };
  }

  // انتخاب نقش برای گزارش‌گیری
  handleRoleSelection(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد. لطفاً دوباره شروع کنید.' };
    }

    if (callbackData === 'back_to_main') {
      this.userStates.delete(chatId);
      return { text: '🔙 بازگشت به منوی اصلی' };
    }

    if (callbackData.startsWith('select_role_')) {
      const selectedRole = callbackData.replace('select_role_', '');
      state.selectedRole = selectedRole;
      state.step = 'select_user';
      
      // نمایش لیست کاربران با نقش انتخاب شده
      return this.showUsersList(chatId, selectedRole);
    }

    return { text: '❌ خطا: انتخاب نامعتبر.' };
  }

  // نمایش لیست کاربران با نقش خاص
  showUsersList(chatId, role) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    try {
      // بارگذاری کاربران از فایل کانفیگ
      const { USERS } = require('./3config');
      const usersWithRole = Object.entries(USERS)
        .filter(([id, user]) => user.role === role)
        .map(([id, user]) => ({ id, name: user.name }));

      if (usersWithRole.length === 0) {
        return {
          text: `❌ هیچ ${this.roleDisplayNames[role]}ی یافت نشد.`,
          keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_role_selection' }]]
        };
      }

      // ساخت کیبورد برای انتخاب کاربر
      const keyboard = [];
      for (const user of usersWithRole) {
        keyboard.push([{ 
          text: `👤 ${user.name}`, 
          callback_data: `select_user_${user.id}` 
        }]);
      }
      keyboard.push([{ text: '🔙 بازگشت', callback_data: 'back_to_role_selection' }]);

      return {
        text: `👥 *انتخاب ${this.roleDisplayNames[role]}*\n\nلطفاً ${this.roleDisplayNames[role]} مورد نظر را انتخاب کنید:`,
        keyboard
      };
    } catch (error) {
      console.error('❌ خطا در بارگذاری کاربران:', error);
      return {
        text: '❌ خطا در بارگذاری لیست کاربران.',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
      };
    }
  }

  // انتخاب کاربر برای گزارش‌گیری
  handleUserSelection(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    if (callbackData === 'back_to_role_selection') {
      state.step = 'select_role';
      state.selectedRole = null;
      return this.startReporting(chatId, state.userId, state.userRole, state.userName);
    }

    if (callbackData.startsWith('select_user_')) {
      const selectedUserId = callbackData.replace('select_user_', '');
      state.selectedUserId = selectedUserId;
      state.step = 'report_questions';
      
      // شروع سوالات گزارش‌گیری
      return this.startReportQuestions(chatId);
    }

    return { text: '❌ خطا: انتخاب نامعتبر.' };
  }

  // شروع سوالات گزارش‌گیری
  startReportQuestions(chatId) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    try {
      const { USERS } = require('./3config');
      const selectedUserName = USERS[state.selectedUserId]?.name || 'کاربر نامشخص';

      return {
        text: `📝 *گزارش‌گیری از ${this.roleDisplayNames[state.selectedRole]}*\n\n👤 ${selectedUserName}\n\nسوال اول:\n\n📞 آیا با این ${this.roleDisplayNames[state.selectedRole]} ارتباط داشته‌اید؟`,
        keyboard: [
          [{ text: '✅ بله، تماس تلفنی', callback_data: 'communication_phone' }],
          [{ text: '🤝 بله، ملاقات حضوری', callback_data: 'communication_meeting' }],
          [{ text: '❌ خیر، ارتباطی نداشته‌ام', callback_data: 'communication_none' }],
          [{ text: '🔙 بازگشت', callback_data: 'back_to_user_selection' }]
        ]
      };
    } catch (error) {
      console.error('❌ خطا در بارگذاری اطلاعات کاربر:', error);
      return { text: '❌ خطا در بارگذاری اطلاعات کاربر.' };
    }
  }

  // پردازش پاسخ سوال اول
  handleCommunicationAnswer(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    if (callbackData === 'back_to_user_selection') {
      state.step = 'select_user';
      state.selectedUserId = null;
      return this.showUsersList(chatId, state.selectedRole);
    }

    // ذخیره پاسخ
    state.answers.communication = callbackData;
    state.step = 'satisfaction_question';

    const communicationText = {
      'communication_phone': 'تماس تلفنی',
      'communication_meeting': 'ملاقات حضوری',
      'communication_none': 'بدون ارتباط'
    }[callbackData];

    return {
      text: `📝 *گزارش‌گیری از ${this.roleDisplayNames[state.selectedRole]}*\n\n📞 ارتباط: ${communicationText}\n\nسوال دوم:\n\n😊 میزان رضایت از پیگیری این ${this.roleDisplayNames[state.selectedRole]} چقدر است؟`,
      keyboard: [
        [{ text: '1️⃣ خیلی کم', callback_data: 'satisfaction_1' }],
        [{ text: '2️⃣ کم', callback_data: 'satisfaction_2' }],
        [{ text: '3️⃣ متوسط', callback_data: 'satisfaction_3' }],
        [{ text: '4️⃣ زیاد', callback_data: 'satisfaction_4' }],
        [{ text: '5️⃣ خیلی زیاد', callback_data: 'satisfaction_5' }],
        [{ text: '🔙 بازگشت', callback_data: 'back_to_communication' }]
      ]
    };
  }

  // پردازش پاسخ سوال دوم
  handleSatisfactionAnswer(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    if (callbackData === 'back_to_communication') {
      state.step = 'report_questions';
      delete state.answers.communication;
      return this.startReportQuestions(chatId);
    }

    if (callbackData.startsWith('satisfaction_')) {
      const satisfaction = callbackData.replace('satisfaction_', '');
      state.answers.satisfaction = satisfaction;
      state.step = 'description_question';

      const satisfactionText = {
        '1': 'خیلی کم',
        '2': 'کم',
        '3': 'متوسط',
        '4': 'زیاد',
        '5': 'خیلی زیاد'
      }[satisfaction];

      return {
        text: `📝 *گزارش‌گیری از ${this.roleDisplayNames[state.selectedRole]}*\n\n😊 رضایت: ${satisfactionText}\n\nسوال سوم:\n\n💭 توضیحات اضافی (اختیاری):\n\nلطفاً توضیحات خود را وارد کنید یا "رد کردن" را انتخاب کنید:`,
        keyboard: [
          [{ text: '⏭️ رد کردن', callback_data: 'skip_description' }],
          [{ text: '🔙 بازگشت', callback_data: 'back_to_satisfaction' }]
        ]
      };
    }

    return { text: '❌ خطا: پاسخ نامعتبر.' };
  }

  // پردازش توضیحات
  handleDescription(chatId, text) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    if (text === '⏭️ رد کردن') {
      state.answers.description = '';
    } else {
      state.answers.description = text.trim();
    }

    state.step = 'confirm_report';
    return this.showReportSummary(chatId);
  }

  // نمایش خلاصه گزارش
  showReportSummary(chatId) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    try {
      const { USERS } = require('./3config');
      const selectedUserName = USERS[state.selectedUserId]?.name || 'کاربر نامشخص';

      const communicationText = {
        'communication_phone': 'تماس تلفنی',
        'communication_meeting': 'ملاقات حضوری',
        'communication_none': 'بدون ارتباط'
      }[state.answers.communication];

      const satisfactionText = {
        '1': 'خیلی کم',
        '2': 'کم',
        '3': 'متوسط',
        '4': 'زیاد',
        '5': 'خیلی زیاد'
      }[state.answers.satisfaction];

      const descriptionText = state.answers.description || 'وارد نشده';

      const summary = `📋 *خلاصه گزارش شما:*
      
👤 ${this.roleDisplayNames[state.selectedRole]}: ${selectedUserName}
📞 ارتباط: ${communicationText}
😊 رضایت: ${satisfactionText}
💭 توضیحات: ${descriptionText}

✅ آیا می‌خواهید این گزارش را ثبت کنید؟`;

      return {
        text: summary,
        keyboard: [
          [{ text: '✅ ثبت گزارش', callback_data: 'confirm_report' }],
          [{ text: '❌ انصراف', callback_data: 'cancel_report' }]
        ]
      };
    } catch (error) {
      console.error('❌ خطا در نمایش خلاصه گزارش:', error);
      return { text: '❌ خطا در نمایش خلاصه گزارش.' };
    }
  }

  // تایید و ثبت نهایی گزارش
  handleConfirmReport(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد.' };
    }

    if (callbackData === 'cancel_report') {
      this.userStates.delete(chatId);
      return { text: '❌ ثبت گزارش لغو شد.' };
    }

    if (callbackData === 'confirm_report') {
      // ثبت گزارش
      const success = this.saveReport(state);
      if (success) {
        this.userStates.delete(chatId);
        return { text: '✅ گزارش شما با موفقیت ثبت شد و برای نقش بالاتر ارسال گردید.' };
      } else {
        return { text: '❌ خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.' };
      }
    }

    return { text: '❌ لطفاً یکی از گزینه‌های ✅ یا ❌ را انتخاب کنید.' };
  }

  // ذخیره گزارش
  saveReport(state) {
    try {
      const { userId, userRole, userName, selectedRole, selectedUserId, answers } = state;
      const today = new Date().toISOString().split('T')[0];
      
      if (!this.reports[today]) {
        this.reports[today] = {};
      }
      
      if (!this.reports[today][userId]) {
        this.reports[today][userId] = {};
      }

      // ذخیره گزارش
      this.reports[today][userId][`${selectedRole}_${selectedUserId}`] = {
        reporterRole: userRole,
        reporterName: userName,
        targetRole: selectedRole,
        targetUserId: selectedUserId,
        timestamp: new Date().toISOString(),
        answers
      };

      return this.saveReports();
    } catch (error) {
      console.error('❌ خطا در ذخیره گزارش:', error);
      return false;
    }
  }

  // پردازش callback queries
  handleCallback(chatId, callbackData) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return { text: '❌ خطا: وضعیت یافت نشد. لطفاً دوباره شروع کنید.' };
    }

    switch (state.step) {
      case 'select_role':
        return this.handleRoleSelection(chatId, callbackData);
      
      case 'select_user':
        return this.handleUserSelection(chatId, callbackData);
      
      case 'report_questions':
        if (callbackData.startsWith('communication_')) {
          return this.handleCommunicationAnswer(chatId, callbackData);
        }
        break;
      
      case 'satisfaction_question':
        if (callbackData.startsWith('satisfaction_')) {
          return this.handleSatisfactionAnswer(chatId, callbackData);
        }
        break;
      
      case 'confirm_report':
        if (callbackData === 'confirm_report' || callbackData === 'cancel_report') {
          return this.handleConfirmReport(chatId, callbackData);
        }
        break;
    }

    return { text: '❌ خطا: callback نامعتبر.' };
  }

  // پردازش پیام‌های متنی
  handleMessage(chatId, text) {
    const state = this.userStates.get(chatId);
    if (!state) {
      return null; // کاربر در حال گزارش‌گیری نیست
    }

    if (state.step === 'description_question') {
      return this.handleDescription(chatId, text);
    }

    return null;
  }

  // دریافت گزارش‌های یک روز خاص
  getDailyReports(date) {
    return this.reports[date] || {};
  }

  // دریافت گزارش‌های یک کاربر
  getUserReports(userId) {
    const userReports = {};
    Object.keys(this.reports).forEach(date => {
      if (this.reports[date][userId]) {
        userReports[date] = this.reports[date][userId];
      }
    });
    return userReports;
  }

  // دریافت گزارش‌های مربوط به یک نقش خاص
  getRoleReports(role) {
    const roleReports = {};
    Object.keys(this.reports).forEach(date => {
      Object.keys(this.reports[date]).forEach(userId => {
        Object.keys(this.reports[date][userId]).forEach(reportKey => {
          const report = this.reports[date][userId][reportKey];
          if (report.targetRole === role) {
            if (!roleReports[date]) roleReports[date] = {};
            if (!roleReports[date][userId]) roleReports[date][userId] = {};
            roleReports[date][userId][reportKey] = report;
          }
        });
      });
    });
    return roleReports;
  }

  // پاک کردن وضعیت کاربر
  clearUserState(chatId) {
    this.userStates.delete(chatId);
  }

  // بررسی وضعیت کاربر
  getUserState(chatId) {
    return this.userStates.get(chatId);
  }
}

module.exports = HierarchicalReportingManager;
