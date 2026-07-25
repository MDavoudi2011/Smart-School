#ifndef SLEEP_MANAGER_H
#define SLEEP_MANAGER_H

#include "global_state.h"


// ==========================================
//         ماژول مدیریت مصرف انرژی
//  هدف: بهینه سازی منابع وقتی کلاس خالی است
// ==========================================

inline void checkIdleTime() {
  // :برای ورود به حالت خواب عمیق ۳ شرط بررسی می‌شود
  // زمان آخرین حرکت دیده شده از حد مجاز بیشتر باشه
  // سیستم در حالت اضطراری نباشه
  // در این لحظه هیچ حرکتی انجام نشه
  if (millis() - lastMotionTime > IDLE_TIMEOUT_MS && !emergencyMode && currentMotion == LOW) {
    Serial.println("[POWER] No activity detected. Entering DEEP SLEEP mode to save energy...");
    
    // صبر می‌کنیم تا پیام‌های سریال چاپ بشن
    Serial.flush();
    
    // همه رله‌ها رو خاموش می‌کنیم
    digitalWrite(PIN_RELAY_COOL, LOW);
    digitalWrite(PIN_RELAY_HEAT, LOW);

    // برای حالت بیدار باش از سنسور حرکت استفاده می‌کنیم
    esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_PIR, 1);

    // در نهایت خواب عمیق رو فعال می‌کنیم
    esp_deep_sleep_start(); 
  }
}
#endif