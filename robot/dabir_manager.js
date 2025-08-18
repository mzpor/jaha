// ماژول مدیریت دبیران
// استفاده از ساختار جداگانه: morabi, dabir, faal

const fs = require('fs');
const path = require('path');

class DabirManager {
    constructor() {
        this.dabirFile = path.join(__dirname, 'data', 'dabir.json');
        this.userStates = {};
        this.tempData = {};
        this.loadDabir();
        console.log('✅ DabirManager initialized successfully');
    }
    
    // بارگذاری دبیران از فایل
    loadDabir() {
        try {
            if (fs.existsSync(this.dabirFile)) {
                const data = fs.readFileSync(this.dabirFile, 'utf8');
                const parsedData = JSON.parse(data);
                this.dabir = parsedData.dabir || {};
                console.log('✅ Dabir loaded successfully from dabir.json');
                console.log('📊 Dabir count:', Object.keys(this.dabir).length);
            } else {
                this.dabir = {};
                console.log('No dabir.json file found, starting with empty dabir');
            }
        } catch (error) {
            console.error('Error loading dabir:', error.message);
            this.dabir = {};
        }
    }
    
    // ذخیره دبیران در فایل
    saveDabir() {
        try {
            // اطمینان از وجود پوشه data
            const dataDir = path.dirname(this.dabirFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // خواندن فایل موجود
            let fileData = {};
            if (fs.existsSync(this.dabirFile)) {
                const existingData = fs.readFileSync(this.dabirFile, 'utf8');
                fileData = JSON.parse(existingData);
            }
            
            // به‌روزرسانی بخش dabir
            fileData.dabir = this.dabir;
            fileData.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.dabirFile, JSON.stringify(fileData, null, 2), 'utf8');
            console.log('✅ Dabir saved successfully to dabir.json');
        } catch (error) {
            console.error('Error saving dabir:', error.message);
        }
    }
    
    // نمایش پنل مدیریت دبیران
    async showDabirManagement(chatId, userId) {
        let text = '';
        if (!this.dabir || Object.keys(this.dabir).length === 0) {
            text = '👨‍🏫 *مدیریت دبیران*\n\n❌ هیچ دبیر ثبت نشده است.\nبرای شروع، دبیر جدید اضافه کنید:';
        } else {
            text = '👨‍🏫 *مدیریت دبیران*\n\n📋 لیست دبیران ثبت شده:\n';
            for (const [dabirId, dabir] of Object.entries(this.dabir)) {
                const name = dabir.name || 'نامشخص';
                const phone = dabir.phone || 'نامشخص';
                const region = dabir.region || 'نامشخص';
                text += `👨‍🏫 *${name}* - ${phone}\n📍 منطقه: ${region}\n\n`;
            }
            text += 'برای مشاهده جزئیات و ویرایش، روی دبیر مورد نظر کلیک کنید:';
        }
        
        const keyboard = this.getDabirListKeyboard();
        return { text, keyboard: keyboard.inline_keyboard };
    }
    
    // دریافت کیبرد لیست دبیران
    getDabirListKeyboard() {
        const keyboard = [];
        
        if (!this.dabir || Object.keys(this.dabir).length === 0) {
            keyboard.push([{ text: '📝 دبیر جدید', callback_data: 'dabir_add' }]);
            keyboard.push([{ text: '🔙 بازگشت', callback_data: 'dabir_back' }]);
        } else {
            for (const [dabirId, dabir] of Object.entries(this.dabir)) {
                const name = dabir.name || 'نامشخص';
                const phone = dabir.phone || 'نامشخص';
                keyboard.push([{
                    text: `👨‍🏫 ${name} - ${phone}`,
                    callback_data: `dabir_view_${dabirId}`
                }]);
            }
            
            keyboard.push([{ text: '📝 دبیر جدید', callback_data: 'dabir_add' }]);
            keyboard.push([{ text: '🔙 بازگشت', callback_data: 'dabir_back' }]);
        }
        
        return { inline_keyboard: keyboard };
    }
    
    // دریافت کیبرد ویرایش دبیر
    getDabirEditKeyboard(dabirId) {
        const keyboard = [
            [{ text: '✏️ ویرایش نام', callback_data: `dabir_edit_name_${dabirId}` }],
            [{ text: '📱 ویرایش تلفن', callback_data: `dabir_edit_phone_${dabirId}` }],
            [{ text: '📍 ویرایش منطقه', callback_data: `dabir_edit_region_${dabirId}` }],
            [{ text: '🗑️ حذف دبیر', callback_data: `dabir_delete_${dabirId}` }],
            [{ text: '🔙 بازگشت', callback_data: 'dabir_list' }]
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
            console.log(`Routing dabir callback: ${data}`);
            
            if (data === 'dabir_add') {
                return this.handleAddDabir(chatId, messageId, userId, callbackQueryId);
            } else if (data === 'dabir_back') {
                return this.handleBackToMain(chatId, messageId, userId, callbackQueryId);
            } else if (data === 'dabir_list') {
                return this.handleListDabir(chatId, messageId, userId, callbackQueryId);
            } else if (data.startsWith('dabir_view_')) {
                const dabirId = data.replace('dabir_view_', '');
                return this.handleViewDabir(chatId, messageId, userId, dabirId, callbackQueryId);
            } else if (data.startsWith('dabir_edit_name_')) {
                const dabirId = data.replace('dabir_edit_name_', '');
                return this.handleEditDabirName(chatId, messageId, userId, dabirId, callbackQueryId);
            } else if (data.startsWith('dabir_edit_phone_')) {
                const dabirId = data.replace('dabir_edit_phone_', '');
                return this.handleEditDabirPhone(chatId, messageId, userId, dabirId, callbackQueryId);
            } else if (data.startsWith('dabir_edit_region_')) {
                const dabirId = data.replace('dabir_edit_region_', '');
                return this.handleEditDabirRegion(chatId, messageId, userId, dabirId, callbackQueryId);
            } else if (data.startsWith('dabir_delete_')) {
                const dabirId = data.replace('dabir_delete_', '');
                return this.handleDeleteDabir(chatId, messageId, userId, dabirId, callbackQueryId);
            }
            
            return false;
        } catch (error) {
            console.error('Error in routeCallback:', error);
            return false;
        }
    }
    
    // اضافه کردن دبیر جدید
    async handleAddDabir(chatId, messageId, userId, callbackQueryId) {
        // تنظیم وضعیت کاربر
        this.userStates[userId] = 'dabir_add_name';
        
        const text = '📝 *اضافه کردن دبیر جدید*\n\n👤 لطفاً نام و فامیل دبیر را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'dabir_back' }]];
        
        return { text, keyboard };
    }
    
    // نمایش لیست دبیران
    async handleListDabir(chatId, messageId, userId, callbackQueryId) {
        return await this.showDabirManagement(chatId, userId);
    }
    
    // مشاهده جزئیات دبیر
    async handleViewDabir(chatId, messageId, userId, dabirId, callbackQueryId) {
        const dabir = this.dabir[dabirId];
        if (!dabir) {
            return { text: '❌ دبیر یافت نشد', keyboard: [[{ text: '🔙 بازگشت', callback_data: 'dabir_list' }]] };
        }
        
        const text = `👨‍🏫 *جزئیات دبیر*\n\n👤 **نام:** ${dabir.name || 'نامشخص'}\n📱 **تلفن:** ${dabir.phone || 'نامشخص'}\n📍 **منطقه:** ${dabir.region || 'نامشخص'}\n📅 **تاریخ ثبت:** ${dabir.created_at || 'نامشخص'}`;
        const keyboard = this.getDabirEditKeyboard(dabirId).inline_keyboard;
        
        return { text, keyboard };
    }
    
    // ویرایش نام دبیر
    async handleEditDabirName(chatId, messageId, userId, dabirId, callbackQueryId) {
        this.userStates[userId] = `dabir_edit_name_${dabirId}`;
        
        const text = '✏️ *ویرایش نام دبیر*\n\n👤 لطفاً نام جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `dabir_view_${dabirId}` }]];
        
        return { text, keyboard };
    }
    
    // ویرایش تلفن دبیر
    async handleEditDabirPhone(chatId, messageId, userId, dabirId, callbackQueryId) {
        this.userStates[userId] = `dabir_edit_phone_${dabirId}`;
        
        const text = '📱 *ویرایش تلفن دبیر*\n\n📞 لطفاً شماره تلفن جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `dabir_view_${dabirId}` }]];
        
        return { text, keyboard };
    }
    
    // ویرایش منطقه دبیر
    async handleEditDabirRegion(chatId, messageId, userId, dabirId, callbackQueryId) {
        this.userStates[userId] = `dabir_edit_region_${dabirId}`;
        
        const text = '📍 *ویرایش منطقه دبیر*\n\n🌍 لطفاً منطقه جدید را وارد کنید:';
        const keyboard = [[{ text: '🔙 بازگشت', callback_data: `dabir_view_${dabirId}` }]];
        
        return { text, keyboard };
    }
    
    // حذف دبیر
    async handleDeleteDabir(chatId, messageId, userId, dabirId, callbackQueryId) {
        const dabir = this.dabir[dabirId];
        if (!dabir) {
            return { text: '❌ دبیر یافت نشد', keyboard: [[{ text: '🔙 بازگشت', callback_data: 'dabir_list' }]] };
        }
        
        // حذف دبیر
        delete this.dabir[dabirId];
        this.saveDabir();
        
        const text = `🗑️ *دبیر حذف شد*\n\n👤 **نام:** ${dabir.name}\n📱 **تلفن:** ${dabir.phone}\n📍 **منطقه:** ${dabir.region}\n\n✅ دبیر با موفقیت حذف شد.`;
        const keyboard = [[{ text: '🔙 بازگشت به لیست', callback_data: 'dabir_list' }]];
        
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
        
        if (userState.startsWith('dabir_add_')) {
            return this.handleAddDabirStep(chatId, userId, text, userState);
        } else if (userState.startsWith('dabir_edit_')) {
            return this.handleEditDabirStep(chatId, userId, text, userState);
        }
        
        return false;
    }
    
    // پردازش مراحل اضافه کردن دبیر
    async handleAddDabirStep(chatId, userId, text, userState) {
        if (userState === 'dabir_add_name') {
            // ذخیره نام
            this.tempData[userId] = { name: text };
            this.userStates[userId] = 'dabir_add_phone';
            
            const responseText = '📱 *شماره تلفن*\n\n📞 لطفاً شماره تلفن دبیر را وارد کنید:';
            const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'dabir_back' }]];
            
            return { text: responseText, keyboard };
        } else if (userState === 'dabir_add_phone') {
            // ذخیره تلفن
            const tempData = this.tempData[userId] || {};
            const name = tempData.name || 'نامشخص';
            
            this.tempData[userId] = { ...tempData, phone: text };
            this.userStates[userId] = 'dabir_add_region';
            
            const responseText = '📍 *منطقه*\n\n🌍 لطفاً منطقه دبیر را وارد کنید:';
            const keyboard = [[{ text: '🔙 بازگشت', callback_data: 'dabir_back' }]];
            
            return { text: responseText, keyboard };
        } else if (userState === 'dabir_add_region') {
            // ذخیره منطقه و تکمیل
            const tempData = this.tempData[userId] || {};
            const name = tempData.name || 'نامشخص';
            const phone = tempData.phone || 'نامشخص';
            const region = text;
            
            // ایجاد ID منحصر به فرد
            const dabirId = Date.now().toString();
            
            // ذخیره دبیر
            this.dabir[dabirId] = {
                name: name,
                phone: phone,
                region: region,
                created_at: new Date().toISOString()
            };
            
            this.saveDabir();
            
            // پاک کردن داده‌های موقت
            delete this.tempData[userId];
            delete this.userStates[userId];
            
            const responseText = `✅ *دبیر اضافه شد*\n\n👤 **نام:** ${name}\n📱 **تلفن:** ${phone}\n📍 **منطقه:** ${region}\n\n🎉 دبیر جدید با موفقیت ثبت شد.`;
            const keyboard = [
                [{ text: '📝 دبیر دیگر', callback_data: 'dabir_add' }],
                [{ text: '🔙 بازگشت به لیست', callback_data: 'dabir_list' }]
            ];
            
            return { text: responseText, keyboard };
        }
        
        return false;
    }
    
    // پردازش مراحل ویرایش دبیر
    async handleEditDabirStep(chatId, userId, text, userState) {
        if (userState.startsWith('dabir_edit_name_')) {
            const dabirId = userState.replace('dabir_edit_name_', '');
            const dabir = this.dabir[dabirId];
            
            if (dabir) {
                dabir.name = text;
                this.saveDabir();
                
                const responseText = `✅ *نام دبیر ویرایش شد*\n\n👤 **نام جدید:** ${text}\n📱 **تلفن:** ${dabir.phone}\n📍 **منطقه:** ${dabir.region}`;
                const keyboard = this.getDabirEditKeyboard(dabirId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        } else if (userState.startsWith('dabir_edit_phone_')) {
            const dabirId = userState.replace('dabir_edit_phone_', '');
            const dabir = this.dabir[dabirId];
            
            if (dabir) {
                dabir.phone = text;
                this.saveDabir();
                
                const responseText = `✅ *تلفن دبیر ویرایش شد*\n\n👤 **نام:** ${dabir.name}\n📱 **تلفن جدید:** ${text}\n📍 **منطقه:** ${dabir.region}`;
                const keyboard = this.getDabirEditKeyboard(dabirId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        } else if (userState.startsWith('dabir_edit_region_')) {
            const dabirId = userState.replace('dabir_edit_region_', '');
            const dabir = this.dabir[dabirId];
            
            if (dabir) {
                dabir.region = text;
                this.saveDabir();
                
                const responseText = `✅ *منطقه دبیر ویرایش شد*\n\n👤 **نام:** ${dabir.name}\n📱 **تلفن:** ${dabir.phone}\n📍 **منطقه جدید:** ${text}`;
                const keyboard = this.getDabirEditKeyboard(dabirId).inline_keyboard;
                
                // پاک کردن وضعیت کاربر
                delete this.userStates[userId];
                
                return { text: responseText, keyboard };
            }
        }
        
        return false;
    }
}

module.exports = DabirManager;

