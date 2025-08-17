/**
 * 🏫 ماژول مدیریت راهبران و دبیران
 * 🎯 مدیریت متمرکز راهبران، دبیران و فعالان
 * ⏰ 1404/05/15 ساعت 23:45
 */

const fs = require('fs');
const path = require('path');
const { hasPermission } = require('./6mid');
const { getRoleDisplayName } = require('./3config');

class ManagementModule {
  constructor() {
    this.workshopsFile = path.join(__dirname, 'data', 'workshops.json');
    this.coachesFile = path.join(__dirname, 'data', 'coaches.json');
    this.assistantsFile = path.join(__dirname, 'data', 'assistants.json');
    this.userStates = {};
    this.tempData = {};
    
    this.loadData();
    console.log('✅ ManagementModule initialized successfully');
  }

  // متدهای ارسال پیام - برای اتصال از polling.js
  setSendMessage(sendMessage) {
    this.sendMessage = sendMessage;
  }

  setSendMessageWithInlineKeyboard(sendMessageWithInlineKeyboard) {
    this.sendMessageWithInlineKeyboard = sendMessageWithInlineKeyboard;
  }

  setEditMessageWithInlineKeyboard(editMessageWithInlineKeyboard) {
    this.editMessageWithInlineKeyboard = editMessageWithInlineKeyboard;
  }

  // بارگذاری داده‌ها
  loadData() {
    try {
      // بارگذاری کارگاه‌ها
      if (fs.existsSync(this.workshopsFile)) {
        const data = fs.readFileSync(this.workshopsFile, 'utf8');
        this.workshops = JSON.parse(data);
      } else {
        this.workshops = { coach: {}, assistant: {} };
      }

      // بارگذاری دبیران
      if (fs.existsSync(this.coachesFile)) {
        const data = fs.readFileSync(this.coachesFile, 'utf8');
        this.coaches = JSON.parse(data);
      } else {
        this.coaches = [];
      }

      // بارگذاری کمک مربی‌ها
      if (fs.existsSync(this.assistantsFile)) {
        const data = fs.readFileSync(this.assistantsFile, 'utf8');
        this.assistants = JSON.parse(data);
      } else {
        this.assistants = [];
      }

      console.log('✅ Management data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading management data:', error.message);
      this.workshops = { coach: {}, assistant: {} };
      this.coaches = [];
      this.assistants = [];
    }
  }

  // ذخیره داده‌ها
  saveData() {
    try {
      // اطمینان از وجود پوشه data
      const dataDir = path.dirname(this.workshopsFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // ذخیره کارگاه‌ها
      fs.writeFileSync(this.workshopsFile, JSON.stringify(this.workshops, null, 2), 'utf8');
      
      // ذخیره دبیران
      fs.writeFileSync(this.coachesFile, JSON.stringify(this.coaches, null, 2), 'utf8');
      
      // ذخیره کمک مربی‌ها
      fs.writeFileSync(this.assistantsFile, JSON.stringify(this.assistants, null, 2), 'utf8');

      console.log('✅ Management data saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving management data:', error.message);
      return false;
    }
  }

  // بررسی دسترسی کاربر
  isUserAuthorized(userId) {
    return hasPermission(userId, 'SCHOOL_ADMIN');
  }

  // دریافت منوی اصلی مدیریت
  getMainManagementMenu(userId) {
    if (!this.isUserAuthorized(userId)) {
      return {
        text: '❌ شما دسترسی لازم برای مدیریت راهبران و دبیران را ندارید.',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
      };
    }

    const text = `🏫 **پنل مدیریت راهبران و دبیران**

📋 گزینه‌های موجود:
• 👨‍🏫 مدیریت راهبران (کارگاه‌ها)
• 👨‍🎓 مدیریت دبیران
• 👨‍💼 مدیریت کمک مربی‌ها
• 📊 آمار کلی
• 🔄 به‌روزرسانی داده‌ها

👆 لطفاً گزینه مورد نظر را انتخاب کنید:`;

    const keyboard = [
      [{ text: '👨‍🏫 مدیریت راهبران', callback_data: 'management_coaches' }],
      [{ text: '👨‍🎓 مدیریت دبیران', callback_data: 'management_teachers' }],
      [{ text: '👨‍💼 مدیریت کمک مربی‌ها', callback_data: 'management_assistants' }],
      [{ text: '📊 آمار کلی', callback_data: 'management_stats' }],
      [{ text: '🔄 به‌روزرسانی', callback_data: 'management_refresh' }],
      [{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]
    ];

    return { text, keyboard };
  }

  // پردازش callback ها - متد استاندارد
  async handleCallback(callback) {
    try {
      const chatId = callback.message.chat.id;
      const userId = callback.from.id;
      const messageId = callback.message.message_id;
      const data = callback.data;
      const callbackQueryId = callback.id;

      console.log(`🔄 [MANAGEMENT] Processing callback: ${data}`);

      // بررسی دسترسی
      if (!this.isUserAuthorized(userId)) {
        return {
          text: '❌ شما دسترسی لازم برای این عملیات را ندارید.',
          keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
        };
      }

      // مسیریابی callback ها
      return await this.routeCallback(chatId, messageId, userId, data, callbackQueryId);

    } catch (error) {
      console.error('❌ Error in management callback:', error.message);
      return {
        text: '❌ خطا در پردازش درخواست',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_main' }]]
      };
    }
  }

  // مسیریابی callback ها
  async routeCallback(chatId, messageId, userId, data, callbackQueryId) {
    try {
      switch (data) {
        case 'management_main':
          return this.getMainManagementMenu(userId);

        case 'management_coaches':
          return this.getCoachesManagementMenu();

        case 'management_teachers':
          return this.getTeachersManagementMenu();

        case 'management_assistants':
          return this.getAssistantsManagementMenu();

        case 'management_stats':
          return this.getManagementStats();

        case 'management_refresh':
          this.loadData();
          return {
            text: '✅ داده‌ها به‌روزرسانی شد',
            keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_main' }]]
          };

        default:
          // بررسی prefix ها
          if (data.startsWith('coach_')) {
            return this.handleCoachCallback(data, chatId, messageId, userId, callbackQueryId);
          } else if (data.startsWith('teacher_')) {
            return this.handleTeacherCallback(data, chatId, messageId, userId, callbackQueryId);
          } else if (data.startsWith('assistant_')) {
            return this.handleAssistantCallback(data, chatId, messageId, userId, callbackQueryId);
          } else {
            return {
              text: '❌ گزینه نامعتبر',
              keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_main' }]]
            };
          }
      }
    } catch (error) {
      console.error('❌ Error in routeCallback:', error.message);
      return {
        text: '❌ خطا در مسیریابی',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_main' }]]
      };
    }
  }

  // مدیریت راهبران
  getCoachesManagementMenu() {
    const text = `👨‍🏫 **مدیریت راهبران (کارگاه‌ها)**

📋 گزینه‌های موجود:
• 📝 اضافه کردن راهبر جدید
• 📋 مشاهده لیست راهبران
• ✏️ ویرایش راهبران
• 🗑️ حذف راهبران

👆 لطفاً گزینه مورد نظر را انتخاب کنید:`;

    const keyboard = [
      [{ text: '📝 راهبر جدید', callback_data: 'coach_add' }],
      [{ text: '📋 لیست راهبران', callback_data: 'coach_list' }],
      [{ text: '✏️ ویرایش', callback_data: 'coach_edit' }],
      [{ text: '🗑️ حذف', callback_data: 'coach_delete' }],
      [{ text: '🔙 بازگشت', callback_data: 'management_main' }]
    ];

    return { text, keyboard };
  }

  // مدیریت دبیران
  getTeachersManagementMenu() {
    const text = `👨‍🎓 **مدیریت دبیران**

📋 گزینه‌های موجود:
• 📝 اضافه کردن دبیر جدید
• 📋 مشاهده لیست دبیران
• ✏️ ویرایش دبیران
• 🗑️ حذف دبیران

👆 لطفاً گزینه مورد نظر را انتخاب کنید:`;

    const keyboard = [
      [{ text: '📝 دبیر جدید', callback_data: 'teacher_add' }],
      [{ text: '📋 لیست دبیران', callback_data: 'teacher_list' }],
      [{ text: '✏️ ویرایش', callback_data: 'teacher_edit' }],
      [{ text: '🗑️ حذف', callback_data: 'teacher_delete' }],
      [{ text: '🔙 بازگشت', callback_data: 'management_main' }]
    ];

    return { text, keyboard };
  }

  // مدیریت کمک مربی‌ها
  getAssistantsManagementMenu() {
    const text = `👨‍💼 **مدیریت کمک مربی‌ها**

📋 گزینه‌های موجود:
• 📝 اضافه کردن کمک مربی جدید
• 📋 مشاهده لیست کمک مربی‌ها
• ✏️ ویرایش کمک مربی‌ها
• 🗑️ حذف کمک مربی‌ها

👆 لطفاً گزینه مورد نظر را انتخاب کنید:`;

    const keyboard = [
      [{ text: '📝 کمک مربی جدید', callback_data: 'assistant_add' }],
      [{ text: '📋 لیست کمک مربی‌ها', callback_data: 'assistant_list' }],
      [{ text: '✏️ ویرایش', callback_data: 'assistant_edit' }],
      [{ text: '🗑️ حذف', callback_data: 'assistant_delete' }],
      [{ text: '🔙 بازگشت', callback_data: 'management_main' }]
    ];

    return { text, keyboard };
  }

  // آمار مدیریت
  getManagementStats() {
    const coachCount = Object.keys(this.workshops.coach || {}).length;
    const assistantCount = Object.keys(this.workshops.assistant || {}).length;
    const teacherCount = this.coaches.length;

    const text = `📊 **آمار کلی مدیریت**

👨‍🏫 **راهبران (کارگاه‌ها):** ${coachCount} نفر
👨‍💼 **کمک مربی‌ها:** ${assistantCount} نفر
👨‍🎓 **دبیران:** ${teacherCount} نفر

📈 **مجموع:** ${coachCount + assistantCount + teacherCount} نفر

🔄 آخرین به‌روزرسانی: ${new Date().toLocaleString('fa-IR')}`;

    const keyboard = [
      [{ text: '🔄 به‌روزرسانی', callback_data: 'management_refresh' }],
      [{ text: '🔙 بازگشت', callback_data: 'management_main' }]
    ];

    return { text, keyboard };
  }

  // پردازش callback های راهبران
  async handleCoachCallback(data, chatId, messageId, userId, callbackQueryId) {
    // این متد باید پیاده‌سازی شود
    return {
      text: '👨‍🏫 مدیریت راهبران - در حال توسعه',
      keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_coaches' }]]
    };
  }

  // پردازش callback های دبیران
  async handleTeacherCallback(data, chatId, messageId, userId, callbackQueryId) {
    // این متد باید پیاده‌سازی شود
    return {
      text: '👨‍🎓 مدیریت دبیران - در حال توسعه',
      keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_teachers' }]]
    };
  }

  // پردازش callback های کمک مربی‌ها
  async handleAssistantCallback(data, chatId, messageId, userId, callbackQueryId) {
    // این متد باید پیاده‌سازی شود
    return {
      text: '👨‍💼 مدیریت کمک مربی‌ها - در حال توسعه',
      keyboard: [[{ text: '🔙 بازگشت', callback_data: 'management_assistants' }]]
    };
  }
}

module.exports = ManagementModule;
