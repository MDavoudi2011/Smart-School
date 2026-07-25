#ifndef SENSORS_H
#define SENSORS_H

#include "global_state.h"

// ==========================================
//      راه اندازی و مقداردهی اولیه سنسور‌ها
// ==========================================

inline void setupSensors() {
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP); // استفاده از مقاومت داخلی
  dht.begin();

  float initialTemp = dht.readTemperature();
  
  // اگر سنسور در دسترس ن بود
  if (isnan(initialTemp)) {
    initialTemp = 24.0; // یک مقدار پیش‌فرض در نظر می‌گیریم
  }

  // پر کردن آرایه تاریخچه با داده اولیه برای مدیریت پیش‌بینی
  for (int i = 0; i < TEMP_HISTORY_SIZE; i++) {
    tempHistory[i] = initialTemp;
  }

  currentTemp = initialTemp;
  tempMovingAvg = initialTemp;
}


// ==========================================
//         تابع اصلی خواندن سنسور‌ها
// ==========================================

inline void readSensors() {
  static unsigned long lastBtnTime = 0;
  static unsigned long lastDhtRead = 0; 
  
  // ------------------
  // دکمه وضعیت اضطراری
  // ------------------
  if (digitalRead(PIN_BUTTON) == LOW) {
    if (millis() - lastBtnTime > DEBOUNCE_DELAY) {
      emergencyMode = !emergencyMode;
      lastBtnTime = millis();
    }
  }

  // ------------------
  //    سنسور حرکت
  // ------------------
  currentMotion = digitalRead(PIN_PIR);
  if (currentMotion == HIGH) lastMotionTime = millis();

  // ------------------
  //  سنسور دما و رطوبت
  // ------------------
  if (millis() - lastDhtRead >= DHT_READ_INTERVAL) {
    lastDhtRead = millis();
    float t = dht.readTemperature();

    // فعال‌سازی حالت ریست امن در صورت خرابی
    if (isnan(t)) {
      sensorError = true; sysStatus = "SAFE_RESET";
    }
    
    else {
      sensorError = false;
      currentTemp = t;

      // بروزرسانی آرایه تاریخچه برای الگوریتم پیش‌بینی
      tempHistory[tempHistoryIndex] = currentTemp;
      tempHistoryIndex = (tempHistoryIndex + 1) % TEMP_HISTORY_SIZE;

      if (tempHistoryCount < TEMP_HISTORY_SIZE) {
        tempHistoryCount++;
      }

      // محاسبه میانگین متحرک برای حذف نویز‌ها
      float sum = 0;
      for (int i = 0; i < tempHistoryCount; i++) {
        sum += tempHistory[i];
      }

      tempMovingAvg = sum / tempHistoryCount;
    }
  }

  // ------------------
  //  سنسور اولتراسونیک
  // ------------------
  if (millis() - lastUltrasonicRead > ULTRASONIC_INTERVAL) {
    lastUltrasonicRead = millis();

    // ارسال پالس به تریگر
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);

    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
  
    digitalWrite(PIN_TRIG, LOW);

    // خواندن زمان برگشت موج
    long duration = pulseIn(PIN_ECHO, HIGH, 3000);

    if (duration > 0) {
      // تبدیل زمان به مسافت
      int dist = duration * 0.034 / 2;

      // تبدیل مسافت به درصد پر بودن سطل
      binLevel = constrain(map(dist, 0, MAX_DISTANCE_CM, 100, 0), 0, 100);
      
      // جهت بهینه سازی داده فقط در صورتی به سرور ارسال می‌شود که تغییرات بیشتر از مرز تعیین شده باشد
      if (abs(binLevel - lastBinLevelSent) >= BIN_CHANGE_THRESHOLD) {
        pendingBinLog = true;
      }
    }
  }
}
#endif