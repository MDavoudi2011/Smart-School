#ifndef AI_CORE_H
#define AI_CORE_H

#include "global_state.h"

// تابع پیش‌بینی دما بر اساس شیب تغییرات
inline float getPredictedTemperature() {

  // برگرداندن داده فعلی در صورتی که تعداد داده کافی نداریم
  if (tempHistoryCount < 2) {
    return currentTemp;
  }

  // پیدا کردن قدیمی‌ترین دمای کش شده و مقایسه با دمای فعلی
  int oldestIndex = (tempHistoryIndex == 0) ? TEMP_HISTORY_SIZE - 1 : tempHistoryIndex - 1;
  float oldestTemp = tempHistory[oldestIndex];

  // محاسبه شیب
  float slope = currentTemp - oldestTemp;
  float predictedTemp = currentTemp;

  // فعال‌سازی زودهنگام سرمایش در شیب مثبت
  if (slope > AI_SLOPE_THRESHOLD) {
    predictedTemp = currentTemp + AI_TEMP_ADJUST;
    Serial.println("[AI] Rapid Heating Detected! Early Cooling Activated.");
  }

  // فعال‌سازی زودهنگام گرمایش در شیب منفی
  else if (slope < -AI_SLOPE_THRESHOLD) {
    predictedTemp = currentTemp - AI_TEMP_ADJUST;
    Serial.println("[AI] Rapid Cooling Detected! Early Heating Activated.");
  }

  return predictedTemp;
}

#endif