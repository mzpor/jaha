/**
 * 🔄 Callback Registry - سیستم ثبت‌نام متمرکز callback ها
 * 🎯 مدیریت خودکار callback ها بدون نیاز به تغییر polling.js
 * ⏰ 1404/05/15 ساعت 23:45
 */

class CallbackRegistry {
  constructor() {
    this.callbacks = new Map(); // ثبت callback ها
    this.modules = new Map(); // ثبت ماژول‌ها
    this.prefixes = new Map(); // ثبت prefix ها
    console.log('✅ CallbackRegistry initialized successfully');
  }

  /**
   * ثبت ماژول جدید
   * @param {string} moduleName - نام ماژول
   * @param {Object} module - instance ماژول
   * @param {Array} prefixes - پیشوندهای callback data
   */
  registerModule(moduleName, module, prefixes = []) {
    try {
      // بررسی وجود متد handleCallback
      if (typeof module.handleCallback !== 'function') {
        console.warn(`⚠️ Module ${moduleName} doesn't have handleCallback method`);
        return false;
      }

      // ثبت ماژول
      this.modules.set(moduleName, module);
      
      // ثبت prefix ها
      prefixes.forEach(prefix => {
        this.prefixes.set(prefix, moduleName);
        console.log(`✅ Registered prefix '${prefix}' for module '${moduleName}'`);
      });

      console.log(`✅ Module '${moduleName}' registered successfully with ${prefixes.length} prefixes`);
      return true;
    } catch (error) {
      console.error(`❌ Error registering module '${moduleName}':`, error.message);
      return false;
    }
  }

  /**
   * ثبت callback خاص
   * @param {string} callbackData - callback data دقیق
   * @param {string} moduleName - نام ماژول
   */
  registerCallback(callbackData, moduleName) {
    try {
      this.callbacks.set(callbackData, moduleName);
      console.log(`✅ Registered callback '${callbackData}' for module '${moduleName}'`);
      return true;
    } catch (error) {
      console.error(`❌ Error registering callback '${callbackData}':`, error.message);
      return false;
    }
  }

  /**
   * یافتن ماژول مناسب برای callback
   * @param {string} callbackData - callback data
   * @returns {Object|null} ماژول مناسب یا null
   */
  findModule(callbackData) {
    try {
      // ابتدا callback های دقیق را بررسی کن
      if (this.callbacks.has(callbackData)) {
        const moduleName = this.callbacks.get(callbackData);
        return this.modules.get(moduleName);
      }

      // سپس prefix ها را بررسی کن
      for (const [prefix, moduleName] of this.prefixes) {
        if (callbackData.startsWith(prefix)) {
          return this.modules.get(moduleName);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding module for callback:', error.message);
      return null;
    }
  }

  /**
   * پردازش callback
   * @param {Object} callbackQuery - callback query از Bale
   * @returns {boolean} موفقیت عملیات
   */
  async handleCallback(callbackQuery) {
    try {
      const { data } = callbackQuery;
      console.log(`🔄 [REGISTRY] Processing callback: ${data}`);

      // یافتن ماژول مناسب
      const module = this.findModule(data);
      
      if (!module) {
        console.warn(`⚠️ [REGISTRY] No module found for callback: ${data}`);
        return false;
      }

      // پردازش callback توسط ماژول
      const result = await module.handleCallback(callbackQuery);
      
      if (result) {
        console.log(`✅ [REGISTRY] Callback '${data}' handled successfully by module`);
      } else {
        console.warn(`⚠️ [REGISTRY] Callback '${data}' handling failed`);
      }

      return result;
    } catch (error) {
      console.error(`❌ [REGISTRY] Error handling callback:`, error.message);
      return false;
    }
  }

  /**
   * دریافت لیست ماژول‌های ثبت شده
   * @returns {Array} لیست ماژول‌ها
   */
  getRegisteredModules() {
    return Array.from(this.modules.keys());
  }

  /**
   * دریافت لیست prefix های ثبت شده
   * @returns {Array} لیست prefix ها
   */
  getRegisteredPrefixes() {
    return Array.from(this.prefixes.keys());
  }

  /**
   * حذف ماژول
   * @param {string} moduleName - نام ماژول
   * @returns {boolean} موفقیت عملیات
   */
  unregisterModule(moduleName) {
    try {
      // حذف prefix های مربوط به این ماژول
      for (const [prefix, name] of this.prefixes) {
        if (name === moduleName) {
          this.prefixes.delete(prefix);
        }
      }

      // حذف callback های مربوط به این ماژول
      for (const [callback, name] of this.callbacks) {
        if (name === moduleName) {
          this.callbacks.delete(callback);
        }
      }

      // حذف ماژول
      this.modules.delete(moduleName);
      
      console.log(`✅ Module '${moduleName}' unregistered successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error unregistering module '${moduleName}':`, error.message);
      return false;
    }
  }

  /**
   * پاک کردن تمام ثبت‌نام‌ها
   */
  clear() {
    this.callbacks.clear();
    this.modules.clear();
    this.prefixes.clear();
    console.log('✅ CallbackRegistry cleared successfully');
  }
}

// ایجاد instance واحد
const callbackRegistry = new CallbackRegistry();

module.exports = callbackRegistry;
