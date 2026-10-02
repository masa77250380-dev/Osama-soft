# تصميم قاعدة بيانات أسامة سوفت

## المبدأ
قاعدة البيانات هي مصدر البيانات المحاسبية، والواجهة مجرد طبقة عرض وتشغيل. لا توجد بيانات محاسبية داخل كود الواجهة.

## الطبقات

```text
واجهة النظام
    ↓
وحدات النظام (Accounts / Currencies / Journal / Reports / Permissions ...)
    ↓
Db Service
    ↓
SQLite: osama_soft_accounting
```

## المجموعات الرئيسية

### الهيكل الإداري
`companies` → `branches`

### المستخدمون والصلاحيات
`users` → `user_companies` / `user_branches` → `permission_groups` → `permissions` → `user_permissions`

### العملات
`currencies` → `exchange_rates`

### الدليل المحاسبي
`accounts` → `account_currencies`

### التحليلي
`analytical_accounts` → `analytical_account_currencies`

### الكيانات المرتبطة بالحسابات التحليلية
`customers`, `suppliers`, `cashboxes`, `banks`, `exchange_companies`

### الفروع
`intermediate_accounts` للحسابات الوسيطة الجارية بين الفروع.

### العمليات
`journal_entries` → `journal_entry_lines`

السطر يحتوي الحساب + الحساب التحليلي عند الحاجة + العملة + سعر الصرف + مدين + دائن + بيان السطر.

### السندات
`receipts` → `receipt_lines`
`payments` → `payment_lines`

### الرقابة والفترات
`fiscal_periods`, `period_locks`, `closed_periods`, `audit_log`

### الموازنات وفروق العملة
`budgets` → `budget_lines`
`fx_revaluations` → `fx_revaluation_lines`

### إعدادات النظام
`app_settings`, `sequences`, `account_exclusions`

## مبدأ العملة
الحساب المحاسبي لا يُكرر لكل عملة. العملة والسعر محفوظان في سطر العملية. لذلك يمكن أن تحتوي عملية واحدة على أكثر من عملة.

## مبدأ الشركة والفروع
الشركة هي الكيان الأم. الدليل الرئيسي والعملات على مستوى الشركة، بينما العمليات والكيانات التشغيلية يمكن ربطها بالفرع. المستخدم له وصول مستقل إلى الشركات والفروع.

## مبدأ التطوير
كل وحدة ستتعامل مع الجداول التي تخصها عبر Db Service. لا حاجة لإعادة كتابة `index.html` كاملًا عند تطوير وحدة واحدة.
