-- البيانات المرجعية فقط. لا تحتوي على بيانات محاسبية تجريبية.
INSERT OR IGNORE INTO permission_groups (code, name_ar, sort_order) VALUES
('dashboard','الرئيسية',10),
('accounts','الدليل والحسابات',20),
('cash','الصناديق',30),
('banks','البنوك',40),
('exchange','شركات الصرافة',50),
('customers','العملاء',60),
('suppliers','الموردون',70),
('revenues','الإيرادات',80),
('expenses','المصروفات',90),
('vouchers','السندات والقيود',100),
('currencies','العملات وأسعار الصرف',110),
('reports','التقارير',120),
('users','المستخدمون والصلاحيات',130),
('companies','الشركات والفروع',140),
('settings','الإعدادات',150),
('audit','الرقابة وسجل العمليات',160);

INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'accounts.view','عرض الدليل','company',10 FROM permission_groups WHERE code='accounts';
INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'accounts.manage','إدارة الحسابات','company',20 FROM permission_groups WHERE code='accounts';
INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'journal.manage','إدارة القيود اليومية','branch',10 FROM permission_groups WHERE code='vouchers';
INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'reports.view','عرض التقارير','branch',10 FROM permission_groups WHERE code='reports';
INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'users.manage','إدارة المستخدمين','system',10 FROM permission_groups WHERE code='users';
INSERT OR IGNORE INTO permissions (group_id, code, name_ar, scope, sort_order)
SELECT id,'companies.manage','إدارة الشركات والفروع','system',10 FROM permission_groups WHERE code='companies';
