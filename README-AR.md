# نظام المحاسبي — بناء APK سحابي

هذا المشروع يحتوي على نسخة Offline الحالية، ويتم إنشاء مشروع Android تلقائيًا داخل GitHub Actions ثم بناء APK.

## الملفات
- `www/index.html` : نسخة النظام الحالية.
- `package.json` : Capacitor + SQLite Native.
- `capacitor.config.ts` : إعداد تطبيق Android.
- `.github/workflows/build-apk.yml` : بناء APK تلقائيًا.

## ملاحظة
لا يتم إرسال بيانات المحاسبة إلى Supabase بواسطة مسار البناء هذا. Supabase يبقى منفصلًا عن قاعدة البيانات المحلية للمحاسبة.
