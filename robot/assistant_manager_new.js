// ماژول جدید مدیریت دبیران
// مشابه سیستم راهبران اما برای دبیران

const fs = require('fs');
const path = require('path');

class AssistantManagerNew {
    constructor() {
        this.assistantsFile = path.join(__dirname, 'data', 'assistants.json');
        this.userStates = {};
        this.tempData = {};
        this.loadAssistants();
        console.log('✅ AssistantManagerNew initialized successfully');
    }
    
    // بارگذاری دبیران از فایل
    loadAssistants() {
        try {
            if (fs.existsSync(this.assistantsFile)) {
                const data = fs.readFileSync(this.assistantsFile, 'utf8');
                const parsedData = JSON.parse(data);
                this.assistants = parsedData.assistants || {};
                console.log('✅ Assistants loaded successfully from assistants.json');
                console.log('📊 Assistants count:', Object.keys(this.assistants).length);
            } else {
                this.assistants = {};
                console.log('No assistants.json file found, starting with empty assistants');
            }
        } catch (error) {
            console.error('Error loading assistants:', error.message);
            this.assistants = {};
        }
    }
    
    // ذخیره دبیران در فایل
    saveAssistants() {
        try {
            // اطمینان از وجود پوشه data
            const dataDir = path.dirname(this.assistantsFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // خواندن فایل موجود
            let fileData = {};
            if (fs.existsSync(this.assistantsFile)) {
                const existingData = fs.readFileSync(this.assistantsFile, 'utf8');
                fileData = JSON.parse(existingData);
            }
            
            // به‌روزرسانی بخش assistants
            fileData.assistants = this.assistants;
            fileData.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.assistantsFile, JSON.stringify(fileData, null, 2), 'utf8');
            console.log('✅ Assistants saved successfully to assistants.json');
        } catch (error) {
            console.error('Error saving assistants:', error.message);
        }
    }
    
    // نمایش پنل مدیریت دبیران
    async showAssistantManagement(chatId, userId) {
        let text = '';
        if (!this.assistants || Object.keys(this.assistants).length === 0) {
            text = '👨‍🏫 *مدیریت دبیران*\n\n❌ هیچ دبیر ثبت نشده است.\nبرای شروع، دبیر جدید اضافه کنید:';
        } else {
            text = '👨‍🏫 *مدیریت دبیران*\n\n📋 لیست دبیران ثبت شده:\n';
            for (const [assistantId, assistant] of Object.entries(this.assistants)) {
                const name = assistant.name || 'نامشخص';
                const phone = assistant.phone || 'نامشخص';
                const region = assistant.region || 'نامشخص';
                text += `👨‍🏫 *${name}* - ${phone}\n📍 منطقه: ${region}\n\n`;
            }
            text += 'برای مشاهده جزئیات و ویرایش، روی دبیر مورد نظر کلیک کنید:';
        }
        
        const keyboard = this.getAssistantListKeyboard();
        return { text, keyboard: keyboard.inline_keyboard };
    }
    
    // دریافت کیبرد لیست دبیران
    getAssistantListKeyboard() {
        const keyboard = [];
        
        if (!this.assistants || Object.keys(this.assistants).length === 0) {
            keyboard.push([{ text: '📝 دبیر جدید', callback_data: 'assistant_add' }]);
            keyboard.push([{ text: '🔙 بازگشت', callback_data: 'assistant_back' }]);
        } else {
            for (const [assistantId, assistant] of Object.entries(this.assistants)) {
                const name = assistant.name || 'نامشخص';
                const phone = assistant.phone || 'نامشخص';
                keyboard.push([{
                    text: `👨‍🏫 ${name} - ${phone}`,
                    callback_data: `assistant_view_${assistantId}`
                }]);
            }
            
            keyboard.push([{ text: '📝 دبیر جدید', callback_data: 'assistant_add' }]);
            keyboard.push([{ text: '🔙 بازگشت', callback_data: 'assistant_back' }]);
        }
        
        return { inline_keyboard: keyboard };
    }
    
    // دریافت کیبرد ویرایش دبیر
    getAssistantEditKeyboard(assistantId) {
        const keyboard = [
            [{ text: '✏️ ویرایش نام', callback_data: `assistant_edit_name_${assistantId}` }],
            [{ text: '📱 ویرایش تلفن', callback_data: `assistant_edit_phone_${assistantId}` }],
            [{ text: '📍 ویرایش منطقه', callback_data: `assistant_edit_region_${assistantId}` }],
            [{ text: '🗑️ حذف دبیر', callback_data: `assistant_delete_${assistantId}` }],
            [{ text: '🔙 بازگشت', callback_data: 'assistant_list' }]
        ];
        return { inline_keyboard: keyboard };
    }
    
    // پردازش callback ها
    async handleCallback(callback) {
        const chatId = callback.message.chat.id;
        const userId = callback.from.id;
        const messageId = callback.message.message_id;
        const data = callback.data;
        const callbackQueryId = callback.id;
        
        return this.routeCallback(chatId, messageId, userId, data, callbackQueryId);
    }
    
    // مسیریابی callback ها
    async routeCallback(chatId, messageId, userId, data, callbackQueryId) {
        try {
            console.log(`Routing assistant callback: ${data}`);
            
            if (data === 'assistant_add') {
                return this.handleAddAssistant(chatId, messageId, userId, callbackQueryId);
            } else if (data === 'assistant_back') {
                return this.handleBackToMain(chatId, messageId, userId, callbackQueryId);
            } else if (data === 'assistant_list') {
                return this.handleListAssistants(chatId, messageId, userId, callbackQueryId);
            } else if (data.startsWith('assistant_view_')) {
                const assistantId = data.replace('assistant_view_', '');
                return this.handleViewAssistant(chatId, messageId, userId, assistantId, callbackQueryId);
            } else if (data.startsWith('assistant_edit_name_')) {
                const assistantId = data.replace('assistant_edit_name_', '');
                return this.handleEditAssistantName(chatId, messageId, userId, assistantId, callbackQueryId);
            } else if (data.startsWith('assistant_edit_phone_')) {
                const assistantId = data.replace('assistant_edit_phone_', '');
                return this.handleEditAssistantPhone(chatId, messageId, userId, assistantId, callbackQueryId);
            } else if (data.startsWith('assistant_edit_region_')) {
                const assistantId = data.replace('assistant_edit_region_', '');
                return this.handleEditAssistantRegion(chatId, messageId, userId, assistantId, callbackQueryId);
            } else if (data.startsWith('assistant_delete_')) {
                const assistantId = data.replace('assistant_delete_', '');
                return this.handleDeleteAssistant(chatId, messageId, userId, assistantId, callbackQueryId);
            }
            
            return false;
        } catch (error) {
            console.error('Error in routeCallback:', error);
            return false;
        }
    }
    
    // اضافه کردن دبیر جدید
    async handleAddAssistant(chatId, messageId, userId, callbackQueryId) {
        // تنظیم وضعیت کاربر
        this.userStates[userId] = 'assistant_add_name';
        
        const text = '📝 *اضافه کردن دبیر جدید*\n\n👤 لطفاً نام و فامیل دبیر را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'assistant_back' }]];
        
        return { text, keyboard };
    }
    
    // نمایش لیست دبیران
    async handleListAssistants(chatId, messageId, userId, callbackQueryId) {
        return await this.showAssistantManagement(chatId, userId);
    }
    
    // مشاهده جزئیات دبیر
    async handleViewAssistant(chatId, messageId, userId, assistantId, callbackQueryId) {
        const assistant = this.assistants[assistantId];
        if (!assistant) {
            return { text: '❌ دبیر یافت نشد', keyboard: [[{ text: '🔙 بازگشت', callback_data: 'assistant_list' }]] };
        }
        
        const text = `👨‍🏫 *جزئیات دبیر*\n\n👤 **نام:** ${assistant.name || 'نامشخص'}\n📱 **تلفن:** ${assistant.phone || 'نامشخص'}\n📍 **منطقه:** ${assistant.region || 'نامشخص'}\n📅 **تاریخ ثبت:** ${assistant.created_at || 'نامشخص'}`;
        const keyboard = this.getAssistantEditKeyboard(assistantId).inline_keyboard;
        
        return { text, keyboard };
    }
    
    // ویرایش نام دبیر
    async handleEditAssistantName(chatId, messageId, userId, assistantId, callbackQueryId) {
        this.userStates[userId] = `assistant_edit_name_${assistantId}`;
        
        const text = '✏️ *ویرایش نام دبیر*\n\n👤 لطفاً نام جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `assistant_view_${assistantId}` }]];
        
        return { text, keyboard };
    }
    
    // ویرایش تلفن دبیر
    async handleEditAssistantPhone(chatId, messageId, userId, assistantId, callbackQueryId) {
        this.userStates[userId] = `assistant_edit_phone_${assistantId}`;
        
        const text = '📱 *ویرایش تلفن دبیر*\n\n📞 لطفاً شماره تلفن جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `assistant_view_${assistantId}` }]];
        
        return { text, keyboard };
    }
    
    // ویرایش منطقه دبیر
    async handleEditAssistantRegion(chatId, messageId, userId, assistantId, callbackQueryId) {
        this.userStates[userId] = `assistant_edit_region_${assistantId}`;
        
        const text = '📍 *ویرایش منطقه دبیر*\n\n🌍 لطفاً منطقه جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `assistant_view_${assistantId}` }]];
        
        return { text, keyboard };
    }
    
    // حذف دبیر
    async handleDeleteAssistant(chatId, messageId, userId, assistantId, callbackQueryId) {
        const assistant = this.assistants[assistantId];
        if (!assistant) {
            return { text: '❌ دبیر یافت نشد', keyboard: [[{ text: '🔙 بازگشت', callback_data: 'assistant_list' }]] };
        }
        
        // حذف دبیر
        delete this.assistants[assistantId];
        this.saveAssistants();
        
        const text = `🗑️ *دبیر حذف شد*\n\n👤 **نام:** ${assistant.name}\n📱 **تلفن:** ${assistant.phone}\n📍 **منطقه:** ${assistant.region}\n\n✅ دبیر با موفقیت حذف شد.`;
        const keyboard = [[{ text: '🔙 بازگشت به لیست', callback_data: 'assistant_list' }]];
        
        return { text, keyboard };
    }
    
    // بازگشت به منوی اصلی
    async handleBackToMain(chatId, messageId, userId, callbackQueryId) {
        // پاک کردن وضعیت کاربر
        delete this.userStates[userId];
        
        const text = '🔙 بازگشت به منوی اصلی';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'back' }]];
        
        return { text, keyboard };
    }
    
    // پردازش پیام‌های متنی
    async handleMessage(message) {
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text || '';
        
        // بررسی وضعیت کاربر
        const userState = this.userStates[userId] || '';
        
        if (userState.startsWith('assistant_add_')) {
            return this.handleAddAssistantStep(chatId, userId, text, userState);
        } else if (userState.startsWith('assistant_edit_')) {
            return this.handleEditAssistantStep(chatId, userId, text, userState);
        }
        
        return false;
    }
    
    // پردازش مراحل اضافه کردن دبیر
    async handleAddAssistantStep(chatId, userId, text, userState) {
        if (userState === 'assistant_add_name') {
            // ذخیره نام
            this.tempData[userId] = { name: text };
            this.userStates[userId] = 'assistant_add_phone';
            
            const responseText = '📱 *شماره تلفن*\n\n📞 لطفاً شماره تلفن دبیر را وارد کنید:';
            const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'assistant_back' }]];
            
            return { text: responseText, keyboard };
        } else if (userState === 'assistant_add_phone') {
            // ذخیره تلفن
            const tempData = this.tempData[userId] || {};
            const name = tempData.name || 'نامشخص';
            
            this.tempData[userId] = { ...tempData, phone: text };
            this.userStates[userId] = 'assistant_add_region';
            
            const responseText = '📍 *منطقه*\n\n🌍 لطفاً منطقه دبیر را وارد کنید:';
            const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'assistant_back' }]];
            
            return { text: responseText, keyboard };
        } else if (userState === 'assistant_add_region') {
            // ذخیره منطقه و تکمیل
            const tempData = this.tempData[userId] || {};
            const name = tempData.name || 'نامشخص';
            const phone = tempData.phone || 'نامشخص';
            const region = text;
            
            // ایجاد ID منحصر به فرد
            const assistantId = Date.now().toString();
            
            // ذخیره دبیر
            this.assistants[assistantId] = {
                name: name,
                phone: phone,
                region: region,
                created_at: new Date().toISOString()
            };
            
            this.saveAssistants();
            
            // پاک کردن داده‌های موقت
            delete this.tempData[userId];
            delete this.userStates[userId];
            
            const responseText = `✅ *دبیر اضافه شد*\n\n👤 **نام:** ${name}\n📱 **تلفن:** ${phone}\n📍 **منطقه:** ${region}\n\n🎉 دبیر جدید با موفقیت ثبت شد.`;
            const keyboard = [
                [{ text: '📝 دبیر دیگر', callback_data: 'assistant_add' }],
                [{ text: '🔙 بازگشت به لیست', callback_data: 'assistant_list' }]
            ];
            
            return { text: responseText, keyboard };
        }
        
        return false;
    }
    
    // پردازش مراحل ویرایش دبیر
    async handleEditAssistantStep(chatId, userId, text, userState) {
        if (userState.startsWith('assistant_edit_name_')) {
            const assistantId = userState.replace('assistant_edit_name_', '');
            const assistant = this.assistants[assistantId];
            
            if (assistant) {
                assistant.name = text;
                this.saveAssistants();
                
                const responseText = `✅ *نام دبیر ویرایش شد*\n\n👤 **نام جدید:** ${text}\n📱 **تلفن:** ${assistant.phone}\n📍 **منطقه:** ${assistant.region}`;
                const keyboard = this.getAssistantEditKeyboard(assistantId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        } else if (userState.startsWith('assistant_edit_phone_')) {
            const assistantId = userState.replace('assistant_edit_phone_', '');
            const assistant = this.assistants[assistantId];
            
            if (assistant) {
                assistant.phone = text;
                this.saveAssistants();
                
                const responseText = `✅ *تلفن دبیر ویرایش شد*\n\n👤 **نام:** ${assistant.name}\n📱 **تلفن جدید:** ${text}\n📍 **منطقه:** ${assistant.region}`;
                const keyboard = this.getAssistantEditKeyboard(assistantId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        } else if (userState.startsWith('assistant_edit_region_')) {
            const assistantId = userState.replace('assistant_edit_region_', '');
            const assistant = this.assistants[assistantId];
            
            if (assistant) {
                assistant.region = text;
                this.saveAssistants();
                
                const responseText = `✅ *منطقه دبیر ویرایش شد*\n\n👤 **نام:** ${assistant.name}\n📱 **تلفن:** ${assistant.phone}\n📍 **منطقه جدید:** ${text}`;
                const keyboard = this.getAssistantEditKeyboard(assistantId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        }
        
        return false;
    }
}

module.exports = AssistantManagerNew;
