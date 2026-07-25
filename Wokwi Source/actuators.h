#ifndef ACTUATORS_H
#define ACTUATORS_H

#include "global_state.h"
#include "ai_core.h"

// تنظیمات اولیه قطعات
inline void setupActuators() {
  pinMode(PIN_RELAY_COOL, OUTPUT);
  pinMode(PIN_RELAY_HEAT, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  myServo.attach(PIN_SERVO);
  myServo.write(0);
  strip.begin();
  strip.setBrightness(120);
}

// تابع اصلی که در حلقه همیشه اجرا میشه
inline void updateActuators() {
  static unsigned long doorTimer = 0;
  
  // باز شدن درب و روشن شدن چراغ‌ها در حالت اضطراری
  if (emergencyMode) {
    myServo.write(90);
    digitalWrite(PIN_LED_GREEN, HIGH); 
    digitalWrite(PIN_LED_RED, HIGH);
  }
  
  // باز کردن درب به مدت زمان تنظیم شده
  else if (doorOpenReq) {
    myServo.write(90); 
    digitalWrite(PIN_LED_GREEN, HIGH);
    
    if (doorTimer == 0) doorTimer = millis();
    
    if (millis() - doorTimer > DOOR_OPEN_TIME) {
      doorOpenReq = false; 
      doorTimer = 0;
      myServo.write(0); 
      digitalWrite(PIN_LED_GREEN, LOW); 
      authResult = 0;
    }
  }

  // بستن درب و خاموش کردن چراغ‌ها در حالت عادی
  else {
    myServo.write(0);

    if (!sensorError && isNetworkOnline) {
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      noTone(PIN_BUZZER);
    }
  }

  // کنترل رله‌ها بر اساس دمای کلاس و حضور افراد
  if (!emergencyMode && !sensorError) {
    String newStatus = "OFF";

    // در صورت حضور دانش‌آموزان در کلاس
    if (currentMotion == HIGH) {

      float smartTemp = getPredictedTemperature();

      // اگر هوا گرم بود کولر روشن میشه
      if (smartTemp >= TEMP_COOLING_MAX || (sysStatus == "COOLING" && smartTemp > TEMP_COOLING_MIN)) {
        digitalWrite(PIN_RELAY_COOL, HIGH); 
        digitalWrite(PIN_RELAY_HEAT, LOW); 
        newStatus = "COOLING";
      }

      // اگر هوا سرد بود بخاری روشن میشه
      else if (smartTemp <= TEMP_HEATING_MIN || (sysStatus == "HEATING" && smartTemp < TEMP_HEATING_MAX)) {
        digitalWrite(PIN_RELAY_COOL, LOW); 
        digitalWrite(PIN_RELAY_HEAT, HIGH); 
        newStatus = "HEATING";
      }

      // خاموش کردن کولر و بخاری در حالت دمای معتدل
      else {
        digitalWrite(PIN_RELAY_COOL, LOW); 
        digitalWrite(PIN_RELAY_HEAT, LOW); 
        newStatus = "IDEAL";
      }

    }
    
    // خاموش کردن همه چیز در حالتی که کسی در کلاس حضور نداره
    else {
      digitalWrite(PIN_RELAY_COOL, LOW); 
      digitalWrite(PIN_RELAY_HEAT, LOW); 
      newStatus = "ECO_MODE";
    }

    sysStatus = newStatus;
  }


  // ارسال لاگ به سرور در صورتی که وضعیت سیستم عوض شد
  if (!sensorError) {
    if (sysStatus != lastSysStatus && !pendingLog) {
      logActionType = sysStatus;
      logTemp = currentTemp;
      pendingLog = true;
      lastSysStatus = sysStatus;
    }

    // اگر تغییرات دما به اندازه کافی بود، لاگ ثبت میشه
    if (abs(currentTemp - lastSentTemp) >= TEMP_CHANGE_THRESHOLD) {
      if (!pendingTempLog) pendingTempLog = true;
    }
  }


  // کنترل صدای بازر
  static unsigned long soundTimer = 0;
  static int beepCount = 0;
  static bool buzzerState = false;


  // آژیر برای حالت اضطراری
  if (emergencyMode) {
    if ((millis() / 250) % 2) {
      tone(PIN_BUZZER, 1000); 
    } else {
      tone(PIN_BUZZER, 800);
    }
  }
  
  // اعلان تایید ورود
  else if (authResult == 1) {
    if (doorOpenReq && (millis() - lastUltrasonicRead < 150)) {
      tone(PIN_BUZZER, 2500, 100);
    }
  }
  
  // اخطار ورود غیر مجاز
  else if (authResult == 2 || authResult == 3) {
    if (beepCount < 3) {
      if (millis() - soundTimer > 150) {
        soundTimer = millis(); 
        buzzerState = !buzzerState;

        if (buzzerState) tone(PIN_BUZZER, 600);
        else {
          noTone(PIN_BUZZER);
          beepCount++;
        }
      }
    } else {
      noTone(PIN_BUZZER);
    }
  }
  
  else {
    beepCount = 0;
  }

  // بروزرسانی ال‌ای‌دی برای وضعیت سطل زباله
  static unsigned long flashTimer = 0;
  static bool flashState = false;
  int numLedsToLight = constrain(map(binLevel, 0, 100, 0, NUM_PIXELS), 0, NUM_PIXELS);
  
  strip.clear();
  
  // حالت چشمک‌زن برای حالتی که سطل پر شد
  if (binLevel > BIN_FULL_THRESHOLD) {
    if (millis() - flashTimer > 300) {
      flashTimer = millis();
      flashState = !flashState;
    }

    uint32_t flashColor = flashState ? strip.Color(255, 0, 0) : strip.Color(0, 0, 0);

    for (int i = 0; i < NUM_PIXELS; i++) {
      strip.setPixelColor(i, flashColor);
    }

  }
  
  // تنظیم رنگ ال‌ای‌دی بر اساس میزان پر بودن
  else {
    for (int i = 0; i < NUM_PIXELS; i++) {
      if (i < numLedsToLight) {
        strip.setPixelColor(i, i < 5 ? strip.Color(0, 255, 0) : strip.Color(255, 150, 0));
      }
    }
  }
  
  strip.show();
}

#endif