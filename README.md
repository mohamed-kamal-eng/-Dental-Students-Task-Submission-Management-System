# نظام إدارة تسليم مهام طلاب طب الأسنان

> **Dental Students Task Submission Management System**

---

## 🇸🇦 بالعربية — نظرة عامة

هذا المشروع هو نظام ويب مُصمَّم لإدارة مهام طلاب كلية طب الأسنان: إنشاء المهام، رفع الطلاب لملفاتهم، تقييم المدرسين، وتتبع حالة كل تسليم. يسهّل النظام عملية جمع الأعمال، مراجعتها، وإعطاء ملاحظات ودرجات.

### المزايا الرئيسية

* إنشاء وإدارة المهام (عنوان، وصف، تاريخ تسليم، مرفقات، ملاحظات).
* رفع ملفات من الطلاب (PDF، صور، مستندات) مع حفظ تاريخ ووقت التسليم.
* لوحة تقييم للمدرسين مع درجات وملاحظات لكل تسليم.
* لوحة تحكم تعرض إحصاءات: المهام المفتوحة، المُسلمة، والمتأخرة.
* نظام صلاحيات بسيط: طالب — مدرس/معيد — مدير مادة.
* إشعارات تذكير بمواعيد التسليم (إيميل أو إشعار داخل التطبيق — يعتمد على التكامل).

### التقنيات المقترحة

* واجهة أمامية: React أو Vue.js
* واجهة خلفية (API): Node.js (Express) أو Django
* قاعدة بيانات: PostgreSQL أو MongoDB
* تخزين الملفات: محلي أثناء التطوير، Amazon S3/خدمة مشابهة في الإنتاج
* توثيق: JWT أو Sessions

### تشغيل محلي (مثال — Node.js + PostgreSQL)

1. استنساخ المستودع:

```bash
git clone https://github.com/mohamed-kamal-eng/-Dental-Students-Task-Submission-Management-System.git
cd -Dental-Students-Task-Submission-Management-System
```

2. إعداد المتغيرات في `.env` (مثال):

```env
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/dental_tasks_db
JWT_SECRET=your_jwt_secret_here
```

3. تثبيت الحزم وتشغيل الخادم:

```bash
# داخل مجلد server
npm install
npm run migrate   # إن وجدت
npm run dev       # أو npm start
```

4. تشغيل الواجهة (إن وُجدت):

```bash
# داخل مجلد client
npm install
npm start
```

5. الوصول إلى التطبيق: افتح `http://localhost:4000` أو المنفذ المحدد.

### بنية مجلد مقترحة

```
/Dental-Students-Task-Submission-Management-System
├─ /server            # backend (API)
│  ├─ /controllers
│  ├─ /models
│  ├─ /routes
│  ├─ /middlewares
│  └─ server.js
├─ /client            # frontend (React/Vue)
├─ /migrations
├─ .env.example
└─ README.md
```

### أمثلة على REST API (مقترحة)

* `POST /api/auth/register` — تسجيل مستخدم
* `POST /api/auth/login` — تسجيل دخول
* `POST /api/tasks` — إنشاء مهمة (صلاحية مدرس)
* `GET /api/tasks` — قائمة المهام
* `GET /api/tasks/:id` — تفاصيل مهمة
* `POST /api/tasks/:id/submit` — رفع حل الطالب
* `POST /api/tasks/:id/grade` — تسجيل تقييم ودرجة

### اعتبارات أمنيّة

* التحقق من نوع وحجم الملفات المرفوعة.
* حماية مسارات الـ API بالتحقق من صلاحيات المستخدم.
* تخزين كلمات المرور بشكل مشفّر (bcrypt).
* منع الوصول إلى ملفات الطلبة من مستخدمين غير مخوّلين.

### ميزات مستقبلية مقترحة

* مزامنة مع Google Calendar أو تقويم الجامعة.
* تكامل مع LMS (Moodle).
* تقارير PDF/CSV لدرجات الطلاب.
* تطبيق موبايل أو واجهة مُحسّنة للهواتف.

---

## 🇬🇧 English — Overview

This project is a web-based system designed to manage dental students' task submissions: creating tasks, students uploading files, teachers grading them, and tracking each submission status. The goal is to simplify collection, review, and feedback of practical and theoretical assignments.

### Key Features

* Create and manage tasks (title, description, due date, attachments, notes).
* Students upload files (PDFs, images, documents) with timestamps.
* Teacher grading interface with grades and feedback per submission.
* Dashboard with summary stats: open tasks, submitted, overdue.
* Simple roles: Student — TA/Teacher — Course Admin.
* Reminders/notifications for due dates (email or in-app depending on integrations).

### Suggested Tech Stack

* Frontend: React or Vue.js
* Backend/API: Node.js (Express) or Django
* Database: PostgreSQL or MongoDB
* File storage: Local during development, S3 or similar for production
* Authentication: JWT or sessions

### Run Locally (example — Node.js + PostgreSQL)

1. Clone the repo:

```bash
git clone https://github.com/mohamed-kamal-eng/-Dental-Students-Task-Submission-Management-System.git
cd -Dental-Students-Task-Submission-Management-System
```

2. Create `.env` with variables (example):

```env
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/dental_tasks_db
JWT_SECRET=your_jwt_secret_here
```

3. Install and run server:

```bash
# inside server folder
npm install
npm run migrate   # if migrations present
npm run dev       # or npm start
```

4. Run frontend (if present):

```bash
# inside client folder
npm install
npm start
```

5. Open the app at `http://localhost:4000` (or your configured port).

### Suggested Folder Structure

Same structure shown above in Arabic section.

### Example REST API Endpoints

* `POST /api/auth/register` — register user
* `POST /api/auth/login` — login
* `POST /api/tasks` — create task (teacher role)
* `GET /api/tasks` — list tasks
* `GET /api/tasks/:id` — task details
* `POST /api/tasks/:id/submit` — student submission
* `POST /api/tasks/:id/grade` — record grade

### Security Considerations

* Validate uploaded file types and sizes.
* Protect API routes with role checks and authentication.
* Hash passwords (bcrypt) and keep secrets in `.env`.
* Ensure students cannot access others' submissions.

### Future Enhancements

* Calendar sync (Google Calendar).
* LMS integrations (Moodle).
* PDF/CSV export for grade reports.
* Mobile-friendly UI or hybrid app.

---

## كيف أستطيع مساعدتك الآن؟ / How can I help next?

* أستطيع توليد boilerplate كامل للـ backend أو frontend لأي تقنية تختارها.
* أكتب نماذج قاعدة بيانات (ERD) وجداول SQL.
* أزودك بمكوّنات React جاهزة أو أمثلة API مُختبرة.

أخبرني أي جزء تريد أبدأ به: **Back-end** أو **Front-end** أو **DB schema** أو **Docs**.
