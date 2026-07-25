#ifndef AUTH_H
#define AUTH_H

#include "global_state.h"

// بررسی کارت‌های ورودی از دیتابیس کش شده به صورت آفلاین
inline void checkAuth() {

  // دریافت شماره کارت از سریال 
  // (RFID شبیه سازی)
  if (Serial.available() > 0 && idToCheck == "") {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() > 0) {
      idToCheck = input;
      authResult = 0;
      bool cardFound = false;

      // جستجوی خطی روی داده‌های کش شده
      for (int i = 0; i < totalCachedStudents; i++) {
        if (localCache[i].student_id == idToCheck) {
          cardFound = true;

          // اگر کارت مربوط به دانش‌آموز همین کلاس یا مدیر بود
          if (localCache[i].class_id == DEVICE_CLASS_ID || localCache[i].role == "Admin") {
            userNameResult = localCache[i].name;
            authResult = 1; // ثبت نتیجه ورود مجاز
            doorOpenReq = true; // باز کردن درب
            queueStudentId = idToCheck; // قرار دادن آیدی در صف
            pendingAttendance = true; // ارسال درخواست ثبت حضور
          }
          
          else {
            authResult = 2; // کارت معتبر ولی غیر مجاز
          }

          break; // توقف جستجو
        }
      }

      // اگر کارت پیدا نشد
      if (!cardFound) {
        authResult = 3; // کارت نامعتبر
      }

      // خالی ک ردن حافظه موقت
      idToCheck = "";
    }
  }
}

#endif