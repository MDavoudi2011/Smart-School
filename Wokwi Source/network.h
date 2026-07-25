#ifndef NETWORK_H
#define NETWORK_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "global_state.h"

// ============================================
// تابع کمکی برای آماده کردن هدر برای ارسال درخواست‌ها
// هدف: جلوگیری از نوشتن کد‌های تکراری
// ==========================================

inline void setupSupabaseRequest(HTTPClient &http, String url) {
  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-user-role", "admin");
}


// ==========================================
// دانلود و کش کردن لیست دانش‌آموزان در رم
// هدف: امکان احراز هویت سریع، حتی آفلاین
// ==========================================

inline void preloadAllStudents() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("[SERVER-GET] Downloading Students Data...");
  HTTPClient http;
  http.setTimeout(3000); // جلوگیری از فریز شدن

  setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/students?select=student_id,name,class_id,role");

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(8192); // تخصیص حافظه برای جی‌سون دریافتی
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc.is<JsonArray>()) {
      JsonArray arr = doc.as<JsonArray>();
      totalCachedStudents = 0;

      // انتقال داده‌ها از جی‌سون به استراکت
      for (JsonObject obj : arr) {
        if (totalCachedStudents < CACHE_SIZE) {
          localCache[totalCachedStudents].student_id = obj["student_id"].as<String>();
          localCache[totalCachedStudents].name = obj["name"].as<String>();
          localCache[totalCachedStudents].class_id = obj["class_id"].as<String>();
          localCache[totalCachedStudents].role = obj["role"].as<String>();
          totalCachedStudents++;
        }
      }

      Serial.printf("[SERVER-SUCCESS] Download complete. %d students cached.\n", totalCachedStudents);
    } else {
      Serial.println("[JSON ERROR] Failed parsing students data.");
    }

  } else {
    Serial.printf("[SERVER-ERROR] Download failed. HTTP Code: %d\n", httpCode);
  }

  http.end();
}


// ==========================================
// ثبت حضور و غیاب دانش‌آموزان در دیتابیس
// ==========================================

inline void processAttendance(HTTPClient &http) {
  // فقط در صورتی اجرا می‌شود که درخواستی در صف باشد
  if (!pendingAttendance) {
    return;
  }

  Serial.printf("[SERVER-POST] Registering attendance for Student ID: %s...\n", queueStudentId.c_str());
  setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/attendance");

  String json = "{\"student_id\": \"" + queueStudentId + "\", \"class_id\": \"" + DEVICE_CLASS_ID + "\"}";
  int code = http.POST(json);

  if (code == 201 || code == 200) {
    pendingAttendance = false; // ریست کردن فلگ پس از ارسال موفق
    Serial.println("[SERVER-SUCCESS] Attendance registered.");
  }
  
  else if (code > 0) {
    pendingAttendance = false; // مدیریت خطای دیتابیس
    Serial.printf("[SERVER-ERROR] Attendance rejected by database. Code: %d\n", code);
  }
  
  else {
    Serial.printf("[SERVER-WARN] Network timeout. Retrying... Code: %d\n", code);
  }

  http.end();
}


// ==========================================
// ارسال لاگ‌های تغییرات دما، وضعیت و سطل زباله
// ==========================================

inline void processLogsAndBin(HTTPClient &http) {

  // بخش ۱: ارسال لاگ‌های سیستم و دما
  if (pendingLog || pendingTempLog) {
    String currentAction = pendingLog ? logActionType : sysStatus;
    float currentLoggingTemp = pendingLog ? logTemp : currentTemp;

    Serial.printf("[SERVER-POST] Sending Log -> Status: %s, Temp: %.1f C\n", currentAction.c_str(), currentLoggingTemp);
    setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/school_logs");

    String json = "{\"action_type\": \"" + currentAction + "\", \"temperature\": " + String(currentLoggingTemp, 1) + ", \"class_id\": \"" + DEVICE_CLASS_ID + "\"}";
    int code = http.POST(json);

    if (code == 201 || code == 200) {
      lastSentTemp = currentLoggingTemp;
      pendingLog = false;
      pendingTempLog = false;
      lastTempLogTime = millis();
      pendingBinLog = true; // پس از ارسال موفق، وضعیت سطل بروز می‌شود
      Serial.println("[SERVER-SUCCESS] Log sent to server successfully.");
    }
    
    else if (code > 0) {
      pendingLog = false;
      pendingTempLog = false;
      Serial.printf("[SERVER-ERROR] Failed to post log. DB rejected Code: %d\n", code);
    }
    
    else {
      Serial.printf("[SERVER-WARN] Failed to post log. Network timeout Code: %d\n", code);
    }

    http.end();
  }


  // بخش ۲: بروزرسانی وضعیت  سطل زباله
  if (pendingBinLog) {

    // مرحله اول: دریافت سطل زباله این کلاس
    setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/bins?class_id=eq." + DEVICE_CLASS_ID + "&select=id");
    int codeGet = http.GET();
    String payloadGet = http.getString();
    http.end();

    if (codeGet == 200 && payloadGet != "[]" && payloadGet != "null") {
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, payloadGet);

      if (!error && doc.is<JsonArray>()) {
        String binId = doc[0]["id"].as<String>();

        // مرحله دوم: ارسال درخواست به دیتابیس
        setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/bins?id=eq." + binId);
        String patchData = "{\"fill_level\": " + String(binLevel) + ", \"last_updated\": \"now()\"}";
        int codePatch = http.PATCH(patchData);

        if (codePatch == 204 || codePatch == 200) {
          lastBinLevelSent = binLevel;
          lastBinSendTime = millis();
          pendingBinLog = false;
          Serial.println("[SERVER-SUCCESS] Bin status updated.");
        }
        
        else if (codePatch > 0) {
          pendingBinLog = false;
          Serial.printf("[SERVER-ERROR] Failed to update bin. DB rejected Code: %d\n", codePatch);
        }
        
        else {
          Serial.printf("[SERVER-WARN] Failed to update bin. Network timeout Code: %d\n", codePatch);
        }

        http.end();
      }
      
      else {
        pendingBinLog = false; // مدیریت خطای جی‌سون
      }
    }
    
    else if (codeGet > 0) {
      pendingBinLog = false;
    }
  }
}


// ==========================================
// چک کردن دستورات صادر شده از داشبورد
// ==========================================

inline void checkCommands(HTTPClient &http) {
  Serial.println("[SERVER-GET] Checking command queue (3s Interval)...");
  
  // دریافت دستوراتی که وضعیت تکمیل نشده دارند
  setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/commands?class_id=eq." + DEVICE_CLASS_ID + "&status=eq.pending&order=created_at.asc");
  int code = http.GET();
  String payload = http.getString();
  http.end();

  if (code == 200) {
    if (payload == "[]" || payload == "null") {
      Serial.println("[SERVER-INFO] Command queue is empty.");
    }
    
    else {
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);

      if (!error && doc.is<JsonArray>()) {
        JsonArray arr = doc.as<JsonArray>();

        // اجرای همه دستوراتی که در صف هستند
        for (JsonObject cmd : arr) {
          String type = cmd["command_type"].as<String>();

          // تغییر فلگ وضعیت اضطراری
          if (type == "EMERGENCY_OPEN") {
            emergencyMode = true;
          }

          // امکان اضافه کردن دستورات بیشتر در آینده وجود دارد

          // تغییر وضعیت دستور اجرا شده
          setupSupabaseRequest(http, SUPABASE_URL + "/rest/v1/commands?id=eq." + cmd["id"].as<String>());
          http.PATCH("{\"status\": \"done\"}");
          http.end();

          Serial.println("[SERVER-SUCCESS] Command Executed and cleared from queue.");
        }
      }
    }
  }
  
  else {
    Serial.printf("[SERVER-ERROR] Failed checking Commands. HTTP Code: %d\n", code);
  }
}


// ==========================================
// حلقه بی‌نهایت پردازش‌های شبکه در هسته ۰
// اجرای این تسک در هسته ۰ باعث می‌شود ارتباط با اینترنت باعث توقف یا لگ در سنسورها و نمایشگر (که در هسته ۱ هستند) نشود
// ==========================================

inline void networkTask(void *pvParameters) {
  preloadAllStudents(); // دریافت اطلاعات دانش‌آموزان
  unsigned long lastCmdChk = millis();

  for (;;) {
    // مدیریت پایداری اتصال به شبکه
    if (WiFi.status() != WL_CONNECTED) {
      if (isNetworkOnline) {
        Serial.println("\n[WIFI] Connection Lost! Forcing Reconnect...");
        isNetworkOnline = false;
        WiFi.disconnect();
        vTaskDelay(pdMS_TO_TICKS(500)); // استفاده از دیلی خود سیستم عامل
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
      vTaskDelay(pdMS_TO_TICKS(3000));
      continue; // تا وقتی اتصال برقرار نشده بقیه کدها اجرا نمی‌شوند
    }
    
    else {
      if (!isNetworkOnline) {
        Serial.println("\n[WIFI] Connected Successfully!");
        isNetworkOnline = true;
      }
    }

    HTTPClient http;
    http.setTimeout(3000);

    // اجرای بقیه توابع
    processAttendance(http);
    processLogsAndBin(http);

    // چک کردن وجود کامند‌های جدید
    if (millis() - lastCmdChk >= COMMAND_CHECK_INTERVAL) {
      lastCmdChk = millis();
      checkCommands(http);
    }

    // آزاد کردن منابع پردازشی برای بهینه سازی
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}


// ==========================================
// راه‌اندازی ماژول وای‌فای و تقسیم بندی تسک‌ها
// ==========================================

inline void setupNetwork() {
  Serial.println("[WIFI] Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startWifiTime = millis();

  // تلاش برای اتصال به وای‌فای
  while (WiFi.status() != WL_CONNECTED && millis() - startWifiTime < 10000) {
    delay(200);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    isNetworkOnline = true;
    Serial.println("\n[WIFI] Connected Successfully!");
  } else {
    isNetworkOnline = false;
    Serial.println("\n[WIFI] Connection Timeout!");
  }

  // ایجاد تسک‌های موازی برای اجرای پردازش‌های شبکه در هسته ۰
  xTaskCreatePinnedToCore(networkTask, "NetTask", 10000, NULL, 1, NULL, 0);
  Serial.println("[CORE] NetTask Deployed on Core 0.");
}

#endif