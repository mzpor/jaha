# 🤖 راهنمای تربیت هوش مصنوعی برای پروژه جهادی

## 🎯 **هدف این راهنما**

این فایل برای تربیت هوش مصنوعی (مثل کرسر، ChatGPT، یا سایر مدل‌ها) طراحی شده تا بتواند کدهای ماژولار و حرفه‌ای تولید کند.

---

## 🧩 **اصول معماری ماژولار**

### ✅ **چه کارهایی باید انجام شود:**

1. **استفاده از Registry Pattern**
   - هر ماژول باید خودش callback هایش رو ثبت کنه
   - از تغییر مستقیم polling.js خودداری کن
   - از `callbackRegistry.registerModule()` استفاده کن

2. **Interface استاندارد**
   - هر ماژول باید متد `handleCallback(callback)` داشته باشه
   - متدهای ارسال پیام رو با `setSendMessage()` متصل کن
   - از ساختار یکسان برای همه ماژول‌ها استفاده کن

3. **جداسازی مسئولیت‌ها**
   - هر ماژول فقط مسئول کار خودش باشه
   - از وابستگی بین ماژول‌ها خودداری کن
   - از dependency injection استفاده کن

### ❌ **چه کارهایی نباید انجام شود:**

1. **تغییر مستقیم polling.js**
   - هرگز callback handler جدید در polling.js اضافه نکن
   - از if-else های طولانی برای callback ها خودداری کن
   - از hard-coding callback data ها خودداری کن

2. **وابستگی مستقیم**
   - ماژول‌ها نباید مستقیماً به هم وابسته باشن
   - از require مستقیم در callback handler ها خودداری کن
   - از global variables استفاده نکن

---

## 🔄 **الگوی استاندارد برای ماژول جدید**

### 📝 **ساختار کلاس:**

```javascript
class NewModule {
  constructor() {
    this.userStates = {};
    this.tempData = {};
    console.log('✅ NewModule initialized successfully');
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

  // متد استاندارد برای پردازش callback ها
  async handleCallback(callback) {
    try {
      const chatId = callback.message.chat.id;
      const userId = callback.from.id;
      const messageId = callback.message.message_id;
      const data = callback.data;
      const callbackQueryId = callback.id;

      console.log(`🔄 [NEW_MODULE] Processing callback: ${data}`);

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
      console.error('❌ Error in new module callback:', error.message);
      return {
        text: '❌ خطا در پردازش درخواست',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]]
      };
    }
  }

  // مسیریابی callback ها
  async routeCallback(chatId, messageId, userId, data, callbackQueryId) {
    try {
      switch (data) {
        case 'new_module_main':
          return this.getMainMenu(userId);

        case 'new_module_action':
          return this.handleAction(chatId, messageId, userId, callbackQueryId);

        default:
          // بررسی prefix ها
          if (data.startsWith('new_module_')) {
            return this.handlePrefixedCallback(data, chatId, messageId, userId, callbackQueryId);
          } else {
            return {
              text: '❌ گزینه نامعتبر',
              keyboard: [[{ text: '🔙 بازگشت', callback_data: 'new_module_main' }]]
            };
          }
      }
    } catch (error) {
      console.error('❌ Error in routeCallback:', error.message);
      return {
        text: '❌ خطا در مسیریابی',
        keyboard: [[{ text: '🔙 بازگشت', callback_data: 'new_module_main' }]]
      };
    }
  }

  // بررسی دسترسی کاربر
  isUserAuthorized(userId) {
    // پیاده‌سازی منطق دسترسی
    return true; // یا false
  }

  // سایر متدها...
}

module.exports = NewModule;
```

### 🔧 **ثبت در Registry:**

```javascript
// در polling.js
const NewModule = require('./new_module');
const newModule = new NewModule();

// ثبت ماژول در Callback Registry
callbackRegistry.registerModule('new_module', newModule, [
  'new_module_',
  'action_',
  'other_prefix_'
]);
```

---

## 🎨 **الگوی استاندارد برای UI**

### 📱 **کیبرد اینلاین:**

```javascript
const keyboard = [
  [{ text: '📝 عملیات جدید', callback_data: 'new_module_action' }],
  [{ text: '📋 لیست', callback_data: 'new_module_list' }],
  [{ text: '✏️ ویرایش', callback_data: 'new_module_edit' }],
  [{ text: '🔙 بازگشت', callback_data: 'back_to_main' }]
];

return { text, keyboard };
```

### 📝 **متن پیام:**

```javascript
const text = `🏫 **عنوان ماژول**

📋 گزینه‌های موجود:
• 📝 عملیات جدید
• 📋 مشاهده لیست
• ✏️ ویرایش

👆 لطفاً گزینه مورد نظر را انتخاب کنید:

⏰ ${new Date().toLocaleString('fa-IR')}`;
```

---

## 🧪 **اصول تست و کیفیت**

### ✅ **تست‌پذیری:**

1. **هر callback باید قابل تست باشه**
2. **از dependency injection استفاده کن**
3. **متدها باید pure باشن (بدون side effect)**
4. **از error handling مناسب استفاده کن**

### 🔍 **Logging:**

```javascript
console.log(`🔄 [MODULE_NAME] Processing callback: ${data}`);
console.log(`✅ [MODULE_NAME] Callback handled successfully`);
console.error(`❌ [MODULE_NAME] Error:`, error.message);
```

---

## 🚀 **نمونه‌های عملی**

### 📚 **ماژول مدیریت راهبران:**

```javascript
// ✅ درست
callbackRegistry.registerModule('management', managementModule, [
  'management_',
  'coach_',
  'teacher_',
  'assistant_'
]);

// ❌ اشتباه
if (callback_query.data.startsWith('management_')) {
  // پردازش مستقیم در polling.js
}
```

### 🎯 **ماژول ارزیابی:**

```javascript
// ✅ درست
callbackRegistry.registerModule('arzyabi', arzyabiModule, [
  'practice_',
  'evaluation_',
  'satisfaction_'
]);

// ❌ اشتباه
if (callback_query.data.startsWith('practice_') || 
    callback_query.data.startsWith('evaluation_')) {
  // پردازش مستقیم در polling.js
}
```

---

## 📋 **چک‌لیست قبل از ارسال کد**

### 🔍 **بررسی کنید:**

- [ ] آیا ماژول از Registry Pattern استفاده می‌کنه؟
- [ ] آیا متد `handleCallback` استاندارد داره؟
- [ ] آیا callback ها در polling.js hard-code شدن؟
- [ ] آیا dependency injection درست پیاده‌سازی شده؟
- [ ] آیا error handling مناسب داره؟
- [ ] آیا logging استاندارد داره؟
- [ ] آیا UI یکسان و زیباست؟

---

## 🎓 **نکات آموزشی**

### 💡 **برای هوش مصنوعی:**

> **وقتی ماژول جدید می‌سازی، لطفاً:**
> 1. از Registry Pattern استفاده کن
> 2. callback ها رو در ماژول ثبت کن نه در polling.js
> 3. از ساختار استاندارد handleCallback استفاده کن
> 4. از dependency injection استفاده کن
> 5. UI زیبا و یکسان بساز

### 🚫 **ممنوعات:**

> **هرگز:**
> 1. polling.js رو مستقیماً تغییر نده
> 2. callback ها رو hard-code نکن
> 3. ماژول‌ها رو مستقیماً به هم وابسته نکن
> 4. از global variables استفاده نکن

---

## 🔄 **به‌روزرسانی‌های آینده**

- [ ] اضافه کردن الگوهای بیشتر
- [ ] نمونه‌های پیچیده‌تر
- [ ] راهنمای تست‌نویسی
- [ ] الگوهای UI پیشرفته

---

**🎯 هدف: ساخت سیستم ماژولار، قابل نگهداری و قابل توسعه**

**📚 مطالعه بیشتر: فایل‌های README موجود در پروژه**
