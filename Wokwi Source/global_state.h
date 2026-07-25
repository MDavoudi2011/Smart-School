#ifndef GLOBAL_STATE_H
#define GLOBAL_STATE_H

#include "config.h"
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <Adafruit_NeoPixel.h>

// ============================
//       اشیا سخت افزاری
// ============================
extern Adafruit_SSD1306 display;   // نمایشگر اولد
extern DHT dht;                    // سنسور دما و رطوبت
extern Servo myServo;              // سروو موتور برای کنترل درب کلاس
extern Adafruit_NeoPixel strip;    // نوار ال‌ای‌دی برای وضعیت سطل زباله


// ============================
//        وضعیت سیستم
// ============================
extern volatile bool emergencyMode;     // وضعیت اضطراری
extern bool sensorError;                // فلگ خرابی سنسور
extern volatile bool isNetworkOnline;   // وضعیت اتصال به شبکه


// ============================
//        داده‌های لحظه‌ای
// ============================
extern volatile float currentTemp;  // آخرین دمای کلاس
extern volatile int currentMotion;  // وضعیت سنسور حرکت
extern volatile int binLevel;       // درصد پر بودن سطل زباله
extern String sysStatus;            // وضعیت فعلی سیستم تهویه
extern String lastSysStatus;        // وضعیت قبلی سیستم تهویه


// ============================
//         سطل زباله
// ============================
extern volatile int lastBinLevelSent;           // آخرین مقدار ثبت شده
extern volatile unsigned long lastBinSendTime;  // زمان آخرین مقدار ثبت شده
extern volatile bool pendingBinLog;             // فلگ ثبت وضعیت سطل زباله


// ============================
//      سیستم احراز هویت
// ============================
extern String idToCheck;           // شماره کارت خوانده شده
extern int authResult;             // نتیجه احراز هویت (۰: در انتظار، ۱: مجاز، ۲: کلاس غلط، ۳: نامعتبر)
extern String userNameResult;      // نام فرد وارد شده
extern volatile bool doorOpenReq;  // فلگ دستور باز کردن درب


// ============================
//       سیستم ثبت لاگ‌ها
// ============================
extern String logActionType;                   // نوع لاگ آماده ارسال
extern float logTemp;                          // دما در لحظه ثبت لاگ
extern bool pendingLog;                        // فلگ وجود لاگ ثبت نشده
extern float lastSentTemp;                     // آخرین دمای ارسال شده به سرور
extern unsigned long lastTempLogTime;          // زمان آخرین لاگ دمای ارسال شده
extern bool pendingTempLog;                    // فلگ وجود لاگ دمای ارسال نشده
extern unsigned long lastUltrasonicRead;       // زمان آخرین داده خوانده شده از سنسور فاصله
extern volatile unsigned long lastMotionTime;  // زمان آخرین حرکت تشخیص داده شده

// ============================
//       پیش‌بینی هوشمند
// ============================
extern float tempHistory[TEMP_HISTORY_SIZE];  // آرایه برای ذخیره تاریخچه دما
extern int tempHistoryIndex;                  // ایندکس فعلی برای نوشتن در آرایه
extern int tempHistoryCount;                  // تعداد داده‌های معتبر موجود در آرایه
extern float tempMovingAvg;                   // میانگین متحرک دما

// ============================
//       سیستم کش آفلاین
// ============================
extern StudentCache localCache[CACHE_SIZE];  // آرایه کش شده از دیتابیس برای احراز هویت آفلاین
extern int totalCachedStudents;              // تعداد دانش‌آموزان کش شده به صورت آفلاین
extern String queueStudentId;                // شماره کارت دانش‌آموز در صف
extern volatile bool pendingAttendance;      // فلگ وجود حضور و غیاب ثبت نشده در سرور

#endif