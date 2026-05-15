# 🏋️ Iron Forge — تشغيل النظام كملف EXE واحد

دليل سريع لبناء وتشغيل النظام كملف تنفيذي واحد على أي جهاز Windows بدون تثبيت أي شيء.

---

## نظرة عامة (TL;DR)

- **المخرج النهائي:** ملف `IronForge.GymManagement.exe` (~80–110 ميجا) + مجلد صغير
- **المتطلبات على جهاز التشغيل:** ❌ لا شيء — Windows فقط
- **المتطلبات على جهاز البناء (مرة واحدة):** .NET SDK 8 + Node.js 18+

---

## كيف يعمل النظام؟

عند تشغيل `IronForge.GymManagement.exe`:

1. يفتح خادم ويب محلي على `http://localhost:5080`
2. ينشئ ملف قاعدة بيانات SQLite (`ironforge.db`) في نفس المجلد إذا لم يكن موجوداً
3. يضيف بيانات تجريبية تلقائياً (4 موظفين، 4 خطط، 24 عضو تجريبي)
4. يفتح المتصفح تلقائياً على شاشة الدخول
5. يخدم واجهة Angular والـ API من نفس الخادم — **كل شيء داخل ملف واحد**

```
┌───────────────────────────────────────┐
│  IronForge.GymManagement.exe          │
│  ┌─────────────────────────────────┐  │
│  │  ASP.NET Core Web API           │  │
│  │  + Angular UI (مدمج)            │  │
│  │  + EF Core                      │  │
│  │  + .NET Runtime                 │  │
│  └─────────────────────────────────┘  │
│            ↓                          │
│  ironforge.db  (SQLite — ينشأ تلقائياً)│
└───────────────────────────────────────┘
```

---

## الخطوة 1: بناء الـ EXE (مرة واحدة فقط)

### على Windows

افتح موجّه الأوامر (CMD) في مجلد المشروع، ثم:

```cmd
build-exe.bat
```

### على macOS / Linux (للبناء عبر المنصات لإنشاء EXE لويندوز)

```bash
chmod +x build-exe.sh
./build-exe.sh
```

> يستغرق البناء حوالي 1–3 دقائق في المرة الأولى.

سترى رسالة نجاح، والمجلد `dist/` سيحتوي على:

```
dist/
├── IronForge.GymManagement.exe         ← الملف التنفيذي
├── appsettings.json                    ← إعدادات (يمكن تعديلها)
├── appsettings.Development.json
└── wwwroot/                            ← واجهة Angular المضمنة
```

---

## الخطوة 2: نقل النظام إلى أي جهاز Windows

1. **انسخ مجلد `dist/` بالكامل** إلى أي جهاز Windows
2. ضعه في أي مكان: مثلاً `C:\IronForge\` أو على سطح المكتب
3. لا حاجة لتثبيت .NET، ولا Node.js، ولا قاعدة بيانات

---

## الخطوة 3: التشغيل

اضغط مرتين على `IronForge.GymManagement.exe`، أو من CMD:

```cmd
IronForge.GymManagement.exe
```

سترى نافذة سوداء تعرض:

```
════════════════════════════════════════════════════════════
   IRON FORGE — PREMIUM GYM MANAGEMENT
════════════════════════════════════════════════════════════
   App:     http://localhost:5080
   Swagger: http://localhost:5080/swagger

   Demo accounts:
     owner     / Owner@123
     admin     / Admin@123
     reception / Reception@123
     coach     / Coach@123

   Press Ctrl+C to stop the server.
```

سيفتح المتصفح تلقائياً على شاشة الدخول. سجّل دخول بأحد الحسابات أعلاه.

---

## بيانات الدخول الافتراضية

| الدور        | اسم المستخدم | كلمة السر         |
| ------------ | ------------ | ----------------- |
| المالك       | `owner`      | `Owner@123`       |
| إداري        | `admin`      | `Admin@123`       |
| استقبال      | `reception`  | `Reception@123`   |
| مدرب         | `coach`      | `Coach@123`       |

> ⚠️ **مهم:** غيّر كلمات السر فوراً من **الإعدادات → My Account** قبل الاستخدام الفعلي.

---

## أين تُحفظ البيانات؟

كل البيانات (الأعضاء، المدفوعات، الحضور) تُحفظ في ملف واحد:

```
ironforge.db
```

يقع بجانب الـ EXE. للنسخ الاحتياطي: انسخ هذا الملف فقط 📦.

---

## تشغيل دائم (كخدمة Windows اختيارياً)

لتشغيل النظام تلقائياً عند إقلاع الجهاز:

### الطريقة 1: بدء التشغيل (Startup folder)

1. اضغط `Win + R` ثم اكتب: `shell:startup` ثم Enter
2. أنشئ اختصاراً للملف `IronForge.GymManagement.exe` بداخل المجلد المفتوح
3. سيعمل تلقائياً عند تسجيل الدخول إلى Windows

### الطريقة 2: مهمة مجدولة (Task Scheduler)

```cmd
schtasks /Create /SC ONSTART /TN "IronForgeGym" /TR "C:\IronForge\IronForge.GymManagement.exe" /RL HIGHEST /F
```

### الطريقة 3: كخدمة Windows باستخدام NSSM

```cmd
nssm install IronForgeGym "C:\IronForge\IronForge.GymManagement.exe"
nssm start IronForgeGym
```

---

## استخدام النظام من أجهزة أخرى على نفس الشبكة

### الخطوة 1: عدّل `appsettings.json`

```json
{
  "App": {
    "OpenBrowserOnStart": true,
    "Url": "http://0.0.0.0:5080"
  },
  "Cors": {
    "AllowedOrigins": [ "*" ]
  }
}
```

> `0.0.0.0` يعني: استمع على جميع واجهات الشبكة.

### الخطوة 2: اعرف عنوان IP للجهاز المستضيف

```cmd
ipconfig
```

ابحث عن `IPv4 Address` — مثلاً `192.168.1.50`.

### الخطوة 3: من أي جهاز آخر على نفس الشبكة (هاتف/حاسوب)

افتح المتصفح على:

```
http://192.168.1.50:5080
```

> 🛡️ تأكد من السماح للبرنامج عبر جدار حماية Windows عند طلب ذلك.

---

## ضبط قاعدة بيانات أقوى (PostgreSQL — اختياري)

إذا أردت استخدام PostgreSQL بدل SQLite، عدّل `appsettings.json`:

```json
{
  "Database": {
    "Provider": "Postgres"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=gym_management;Username=postgres;Password=postgres"
  }
}
```

ثم شغّل الـ EXE — سينشئ الجداول تلقائياً عند أول تشغيل.

---

## استكشاف الأخطاء

### المتصفح لا يفتح تلقائياً

لا مشكلة — افتحه يدوياً على `http://localhost:5080`.

### رسالة "Address already in use"

المنفذ `5080` مستخدم. عدّل في `appsettings.json`:

```json
"App": { "Url": "http://localhost:5090" }
```

### النظام بطيء عند أول تشغيل

طبيعي — أول تشغيل يقوم بإعداد قاعدة البيانات وحقن البيانات التجريبية. التشغيلات التالية فورية.

### حذف البيانات والبدء من جديد

أغلق الـ EXE، احذف `ironforge.db`، ثم شغّل الـ EXE مجدداً — ستُعاد البيانات التجريبية.

---

## بنية المخرج النهائي

```
dist/
├── IronForge.GymManagement.exe   (~95 MB — النظام بالكامل)
├── appsettings.json              (إعدادات قابلة للتعديل)
├── appsettings.Development.json
├── wwwroot/                      (واجهة Angular المُضمَّنة)
│   ├── index.html
│   ├── *.js, *.css, ...
│   └── assets/
└── ironforge.db                  (يتم إنشاؤه عند أول تشغيل)
```

---

## الخلاصة

```
بناء واحد  →  EXE واحد  →  تشغيل بدون تثبيت
   1×            ~95 MB         double-click
```

تم تصميم النظام ليعمل كتطبيق سطح مكتب شبه-أصلي: واجهة الويب الفاخرة + الـ API + قاعدة البيانات، كل ذلك في ملف تنفيذي واحد لا يحتاج لأي شيء على جهاز العميل.
