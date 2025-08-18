// اسکریپت انتقال دبیران موجود از workshops.json به assistants.json

const fs = require('fs');
const path = require('path');

console.log('🚀 شروع انتقال دبیران...');

// مسیر فایل‌ها
const workshopsFile = path.join(__dirname, 'data', 'workshops.json');
const assistantsFile = path.join(__dirname, 'data', 'assistants.json');

try {
    // خواندن فایل workshops.json
    if (!fs.existsSync(workshopsFile)) {
        console.log('❌ فایل workshops.json یافت نشد');
        process.exit(1);
    }
    
    const workshopsData = JSON.parse(fs.readFileSync(workshopsFile, 'utf8'));
    const oldAssistants = workshopsData.assistant || {};
    
    console.log(`📊 تعداد دبیران موجود: ${Object.keys(oldAssistants).length}`);
    
    if (Object.keys(oldAssistants).length === 0) {
        console.log('ℹ️ هیچ دبیری برای انتقال وجود ندارد');
        process.exit(0);
    }
    
    // خواندن فایل assistants.json
    let newAssistantsData = {};
    if (fs.existsSync(assistantsFile)) {
        newAssistantsData = JSON.parse(fs.readFileSync(assistantsFile, 'utf8'));
    }
    
    // انتقال دبیران
    let migratedCount = 0;
    for (const [oldId, oldAssistant] of Object.entries(oldAssistants)) {
        const newId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        
        newAssistantsData.assistants[newId] = {
            name: oldAssistant.name || 'نامشخص',
            phone: oldAssistant.phone || 'نامشخص',
            region: oldAssistant.region || 'منطقه نامشخص',
            created_at: oldAssistant.created_at || new Date().toISOString()
        };
        
        migratedCount++;
        console.log(`✅ دبیر "${oldAssistant.name}" منتقل شد`);
    }
    
    // به‌روزرسانی تاریخ
    newAssistantsData.lastUpdated = new Date().toISOString();
    
    // ذخیره فایل جدید
    fs.writeFileSync(assistantsFile, JSON.stringify(newAssistantsData, null, 2), 'utf8');
    
    console.log(`\n🎉 انتقال با موفقیت انجام شد!`);
    console.log(`📊 تعداد دبیران منتقل شده: ${migratedCount}`);
    console.log(`📁 فایل جدید: ${assistantsFile}`);
    
    // نمایش دبیران منتقل شده
    console.log('\n📋 دبیران منتقل شده:');
    for (const [id, assistant] of Object.entries(newAssistantsData.assistants)) {
        console.log(`  👨‍🏫 ${assistant.name} - ${assistant.phone} (${assistant.region})`);
    }
    
} catch (error) {
    console.error('❌ خطا در انتقال دبیران:', error.message);
    process.exit(1);
}

