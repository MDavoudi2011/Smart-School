#include <Wire.h>
#include "global_state.h"
#include "sensors.h"
#include "actuators.h"
#include "auth.h"
#include "display.h"
#include "network.h"
#include "sleep_manager.h"


// ==========================================
//   تخصیص حافظه و مقدار دهی متغیرهای سراسری
// ==========================================

volatile bool emergencyMode = false;
bool sensorError = false;
volatile bool isNetworkOnline = false;
volatile float currentTemp = 24.0;
volatile int currentMotion = 0;
volatile int binLevel = 0;
String sysStatus = "OFF";
String lastSysStatus = "OFF";

volatile int lastBinLevelSent = -1;
volatile unsigned long lastBinSendTime = 0;
volatile bool pendingBinLog = false;

String idToCheck = "";
int authResult = 0;
String userNameResult = "";
volatile bool doorOpenReq = false;

String logActionType = "";
float logTemp = 0;
bool pendingLog = false;
float lastSentTemp = 24.0;
unsigned long lastTempLogTime = 0;
bool pendingTempLog = false;
unsigned long lastUltrasonicRead = 0;
volatile unsigned long lastMotionTime = 0;

float tempHistory[TEMP_HISTORY_SIZE];
int tempHistoryIndex = 0;
int tempHistoryCount = 0;
float tempMovingAvg = 24.0;

StudentCache localCache[CACHE_SIZE];
int totalCachedStudents = 0;
String queueStudentId = "";
volatile bool pendingAttendance = false;


// ==========================================
//            ایجاد اشیا سخت‌افزاری
// ==========================================

Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(PIN_DHT, DHT22);
Servo myServo;
Adafruit_NeoPixel strip(NUM_PIXELS, PIN_STRIP, NEO_GRB + NEO_KHZ800);


// ==========================================
//                 تابع ستاپ
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(500);

  // مقدار دهی اولیه پین‌های ورودی و خروجی
  setupActuators();
  setupSensors();

  // I2C راه‌اندازی اولد با استفاده از
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    for (;;);
  }
  
  display.clearDisplay(); display.setTextColor(WHITE);
  display.setCursor(0, 20);
  display.println("Booting...");
  display.display();

  // راه اندازی شبکه و انتقال تسک‌ها روی هسته ۰
  setupNetwork();
}


// ==========================================
//                 حلقه اصلی
// ==========================================

void loop() {
  readSensors();      // خواندن وضعیت فعلی دما، حرکت و فاصله
  updateActuators();  // اجرای منطق تصمیم‌گیری‌ها و پیش‌بینی‌ها
  checkAuth();        // بررسی درخواست‌های احراز هویت
  drawUI();           // بروزرسانی اطلاعات روی نمایشگر
  checkIdleTime();    // بررسی وضعیت سیستم برای ورود به خواب عمیق

  // آزاد سازی ۱۰ میلی ثانیه زمان برای پردازش
  delay(10);
}