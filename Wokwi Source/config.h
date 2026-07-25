#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================
//   تنظیمات اینترنت و دیتابیس
// ============================
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const String SUPABASE_URL = "https://tmiwptgmqewgxzfgqwdr.supabase.co";
const String SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaXdwdGdtcWV3Z3h6Zmdxd2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4NTA2NiwiZXhwIjoyMDg1NzYxMDY2fQ.Q-8ZrvEB4Xz9QNkRUVWyAsqQ747ieWnraX6PiXfi-38";
const String DEVICE_CLASS_ID = "803";

// ============================
//       پین‌های سخت‌افزار
// ============================
#define PIN_DHT         15
#define PIN_PIR         13
#define PIN_RELAY_COOL  5
#define PIN_RELAY_HEAT  18
#define PIN_BUTTON      14
#define PIN_SERVO       19
#define PIN_LED_GREEN   26
#define PIN_LED_RED     27
#define PIN_TRIG        12
#define PIN_ECHO        23
#define PIN_BUZZER      0
#define PIN_STRIP       2

// ============================
//       تنظیمات سیستم
// ============================
#define NUM_PIXELS             10
#define MAX_DISTANCE_CM        50
#define BIN_SEND_INTERVAL      10000
#define TEMP_LOG_INTERVAL      10000
#define COMMAND_CHECK_INTERVAL 3000
#define ULTRASONIC_INTERVAL    3000
#define DOOR_OPEN_TIME         2000
#define IDLE_TIMEOUT_MS        30 * 60000
#define DHT_READ_INTERVAL      2000
#define DEBOUNCE_DELAY         300

// ============================
//       آستانه‌ها و مرزها
// ============================
#define TEMP_CHANGE_THRESHOLD  0.5
#define TEMP_COOLING_MAX       25.0
#define TEMP_COOLING_MIN       23.5
#define TEMP_HEATING_MIN       18.0
#define TEMP_HEATING_MAX       19.5
#define BIN_FULL_THRESHOLD     80
#define BIN_CHANGE_THRESHOLD   5

// ============================
//   تنظیمات مدل هوش مصنوعی
// ============================
#define AI_SLOPE_THRESHOLD     0.3
#define AI_TEMP_ADJUST         1.5

// ============================
//       تنظیمات نمایشگر
// ============================
#define UI_BLINK_INTERVAL  200
#define UI_ERROR_MSG_DUR   2000

// ============================
//      حافظه و ذخیره سازی
// ============================
#define TEMP_HISTORY_SIZE 5
#define CACHE_SIZE 30

struct StudentCache {
  String student_id;
  String name;
  String class_id;
  String role;
};

#endif