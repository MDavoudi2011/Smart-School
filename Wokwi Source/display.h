#ifndef DISPLAY_H
#define DISPLAY_H

#include "global_state.h"

// تابع کمکی برای چشمک زدن چراغ قرمز
inline void blinkRedLED() {
  if ((millis() / UI_BLINK_INTERVAL) % 2) digitalWrite(PIN_LED_RED, HIGH);
  else digitalWrite(PIN_LED_RED, LOW);
}

// تابع اصلی برای رندر کردن روی نمایشگر که بر اساس اولویت‌ها کار می‌کند
inline void drawUI() {
  display.clearDisplay();
  display.setTextColor(WHITE);

  // حالت اضطراری
  if (emergencyMode) {
    display.setTextSize(2);
    display.setCursor(10, 10);
    display.println("EMERGENCY");
    display.setTextSize(1);
    display.setCursor(30, 40);
    display.println("DOOR OPEN!");
  }
  
  // خطای سنسور
  else if (sensorError) {
    display.setTextSize(2);
    display.setCursor(0, 10); 
    display.println("SENSOR ERR");
    display.setTextSize(1);
    display.setCursor(0, 45); 
    display.println("Safe Fallback Mode");
    blinkRedLED();
  }

  // ورود موفقیت آمیز
  else if (authResult == 1) {
    display.setTextSize(2);
    display.setCursor(0, 10); 
    display.println("WELCOME");
    display.setTextSize(1);
    display.setCursor(0, 40); 
    display.println(userNameResult); // نمایش نام شخص
  }

  // کارت معتبر ولی غیر مجاز
  else if (authResult == 2) {
    display.setTextSize(2);
    display.setCursor(0, 10); 
    display.println("WRONG CLASS");
    blinkRedLED();
  }

  // کارت نامعتبر
  else if (authResult == 3) {
    display.setTextSize(2);
    display.setCursor(0, 10); 
    display.println("DENIED");
    display.setTextSize(1);
    display.setCursor(0, 40); 
    display.println("Access Rejected");
    blinkRedLED();

    // پاک کردن پیام خطا از روی صفحه
    static unsigned long errT = 0; if (errT == 0) errT = millis();
    
    if (millis() - errT > UI_ERROR_MSG_DUR) {
      authResult = 0;
      idToCheck = "";
      errT = 0;
      digitalWrite(PIN_LED_RED, LOW);
    }
  }

  // حالت پیش‌فرض برای نمایش وضعیت کلاس
  else {

    // نمایش شماره کلاس
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("CLASS ");
    display.print(DEVICE_CLASS_ID);
    
    // نمایش وضعیت شبکه
    if (isNetworkOnline) {
      display.println(" [ONLINE]");
    } else {
      display.println(" [OFFLINE]");
      digitalWrite(PIN_LED_RED, LOW);
    }

    // نمایش دمای لحظه‌ای
    display.setTextSize(2);
    display.setCursor(0, 15);
    display.print(currentTemp, 1);
    display.print(" C");

    // نمایش درصد پر بودن سطل زباله
    display.setTextSize(1);
    display.setCursor(0, 38);
    display.print("Bin Capacity: ");
    display.print(100 - binLevel);
    display.print("%");
    
    // نمایش وضعیت سیستم
    display.setCursor(0, 52);
    display.print("System: ");
    display.print(sysStatus);
  }

  // رندر نهایی
  display.display();
}

#endif