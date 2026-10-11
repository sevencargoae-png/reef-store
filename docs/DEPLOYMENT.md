# نشر REEF

## المتطلبات
- Node.js 22+، PostgreSQL 15+.
- متغيرات البيئة (انظر `.env.example`): `DATABASE_URL`, `APP_URL`, `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, `CRON_SECRET`, `STORAGE_LOCAL_DIR`.
- لا تضع أسرارًا في الكود أو المستودع؛ استخدم مدير الأسرار الخاص بالمنصة (Render/Railway/Fly/VPS).

## الخطوات
```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start   # المنفذ 3100 (غيّره في package.json أو عبر PORT في منصة النشر)
```
- أنشئ المدير الأول: `SEED_ADMIN_PHONE=+9715xxxxxxx SEED_ADMIN_PASSWORD='…' npx prisma db seed` ثم **احذف منتجات النموذج** (tags: sample) أو عدّلها من لوحة التحكم.
- مهمة مجدولة يومية (مثلًا 06:00 بتوقيت الإمارات): `curl -X POST $APP_URL/api/internal/subscriptions/run -H "Authorization: Bearer $CRON_SECRET"`.
- ضع `STORAGE_LOCAL_DIR` على قرص دائم (volume) أو استبدله لاحقًا بتخزين S3.
- خلف Proxy/CDN تأكد من تمرير `x-forwarded-for` (يُستخدم في تحديد المعدل وسجل العمليات).

## ما يجب مراجعته قبل الإطلاق
- [ ] استبدال الكتالوج النموذجي بالمنتجات والأسعار الحقيقية وصور حقيقية.
- [ ] ضبط مناطق التوصيل ورسومها والحد الأدنى للطلب من لوحة التحكم.
- [ ] ضبط مواعيد التوصيل وسعتها.
- [ ] تفعيل الضريبة فقط عند التسجيل الضريبي.
- [ ] كتابة وعد التوصيل في الإعدادات إن أردت إظهاره.
- [ ] تغيير كلمة مرور المدير وإنشاء حسابات الموظفين بأدوارهم.
- [ ] دخول العملاء برقم الموبايل فقط بدون تحقق: قرار المالك لتبسيط التجربة؛ يمكن إضافة OTP لاحقًا إذا ظهرت حالات انتحال.
