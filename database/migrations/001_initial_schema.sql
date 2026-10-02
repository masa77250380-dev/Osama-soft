PRAGMA foreign_keys = ON;

-- أسامة سوفت - قاعدة البيانات المحاسبية المنظمة
-- الهدف: فصل البيانات عن واجهة النظام، ودعم الشركات والفروع والصلاحيات والعملات والقيود.
-- لا يتم إنشاء حساب مستقل لكل عملة؛ العملة ترتبط بالسطر المحاسبي فقط.

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  email TEXT,
  registration_no TEXT,
  logo_data TEXT,
  watermark_data TEXT,
  base_currency_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  address_ar TEXT,
  address_en TEXT,
  phone TEXT,
  email TEXT,
  is_main INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code),
  UNIQUE(company_id, name_ar)
);

-- المستخدم ينشأ من الشركة الأم، ثم يُمنح الوصول للشركات والفروع بشكل مستقل.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_legacy TEXT,
  display_name TEXT,
  is_system_manager INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_companies (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_default INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS user_branches (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_default INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, branch_id),
  UNIQUE(user_id, company_id, branch_id)
);

CREATE TABLE IF NOT EXISTS permission_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'system', -- system/company/branch
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  can_view INTEGER NOT NULL DEFAULT 0,
  can_add INTEGER NOT NULL DEFAULT 0,
  can_edit INTEGER NOT NULL DEFAULT 0,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_print INTEGER NOT NULL DEFAULT 0,
  can_export INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_permissions_scope
ON user_permissions(user_id, permission_id, IFNULL(company_id, 0), IFNULL(branch_id, 0));

CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  symbol TEXT,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_base INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  rate_date TEXT NOT NULL,
  rate REAL NOT NULL CHECK(rate > 0),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(currency_id, rate_date)
);

-- الدليل الرئيسي على مستوى الشركة. لا ننشئ حساباً لكل عملة.
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  main_type TEXT NOT NULL, -- asset/liability/equity/income/expense
  sub_type TEXT,
  affects TEXT NOT NULL DEFAULT 'no',
  cash_type TEXT,
  analytical_link_type TEXT NOT NULL DEFAULT 'general',
  is_intermediate INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS account_currencies (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  PRIMARY KEY(account_id, currency_id)
);

CREATE TABLE IF NOT EXISTS analytical_accounts (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  parent_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, branch_id, code)
);

CREATE TABLE IF NOT EXISTS analytical_account_currencies (
  analytical_account_id INTEGER NOT NULL REFERENCES analytical_accounts(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  PRIMARY KEY(analytical_account_id, currency_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  analytical_account_id INTEGER UNIQUE REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  address_ar TEXT,
  address_en TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  analytical_account_id INTEGER UNIQUE REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  address_ar TEXT,
  address_en TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cashboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  analytical_account_id INTEGER UNIQUE REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  analytical_account_id INTEGER UNIQUE REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  bank_name TEXT,
  iban TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchange_companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  analytical_account_id INTEGER UNIQUE REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- الحسابات الوسيطة بين الفروع.
CREATE TABLE IF NOT EXISTS intermediate_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  counter_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(company_id, branch_id, counter_branch_id),
  UNIQUE(company_id, branch_id, code)
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  is_open INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL DEFAULT 'journal',
  entry_date TEXT NOT NULL,
  document_no TEXT,
  reference_no TEXT,
  note TEXT,
  source_module TEXT,
  source_id INTEGER,
  is_posted INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE RESTRICT,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
  exchange_rate REAL NOT NULL DEFAULT 1 CHECK(exchange_rate > 0),
  debit REAL NOT NULL DEFAULT 0 CHECK(debit >= 0),
  credit REAL NOT NULL DEFAULT 0 CHECK(credit >= 0),
  line_note TEXT,
  CHECK((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0) OR (debit = 0 AND credit = 0)),
  UNIQUE(journal_entry_id, line_no)
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL UNIQUE REFERENCES journal_entries(id) ON DELETE CASCADE,
  cash_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  cash_analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  exchange_rate REAL NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS receipt_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  exchange_rate REAL NOT NULL DEFAULT 1,
  note TEXT,
  UNIQUE(receipt_id, line_no)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL UNIQUE REFERENCES journal_entries(id) ON DELETE CASCADE,
  cash_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  cash_analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  exchange_rate REAL NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS payment_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  exchange_rate REAL NOT NULL DEFAULT 1,
  note TEXT,
  UNIQUE(payment_id, line_no)
);

CREATE TABLE IF NOT EXISTS revenues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE SET NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS opening_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE RESTRICT,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
  exchange_rate REAL NOT NULL DEFAULT 1,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  note TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE RESTRICT,
  budget_type TEXT NOT NULL CHECK(budget_type IN ('income','expense')),
  amount REAL NOT NULL DEFAULT 0,
  UNIQUE(budget_id, account_id, analytical_account_id, budget_type)
);

CREATE TABLE IF NOT EXISTS closed_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  closing_journal_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
  closed_at TEXT,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_closed INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS period_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  locked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  locked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fx_revaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  revaluation_date TEXT NOT NULL,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fx_revaluation_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  revaluation_id INTEGER NOT NULL REFERENCES fx_revaluations(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE RESTRICT,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
  foreign_balance REAL NOT NULL DEFAULT 0,
  book_base REAL NOT NULL DEFAULT 0,
  closing_rate REAL NOT NULL DEFAULT 1,
  revalued_base REAL NOT NULL DEFAULT 0,
  difference REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS account_exclusions (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  analytical_account_id INTEGER REFERENCES analytical_accounts(id) ON DELETE CASCADE,
  exclusion_type TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_account_exclusions_scope
ON account_exclusions(company_id, branch_id, IFNULL(account_id, 0), IFNULL(analytical_account_id, 0), exclusion_type);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  setting_group TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  UNIQUE(company_id, branch_id, setting_group, setting_key)
);

CREATE TABLE IF NOT EXISTS sequences (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(company_id, branch_id, sequence_type)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- فهارس الأداء
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_company_branch ON user_branches(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON user_permissions(user_id, company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_currencies_company ON currencies(company_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_date ON exchange_rates(currency_id, rate_date);
CREATE INDEX IF NOT EXISTS idx_accounts_company_parent ON accounts(company_id, parent_account_id);
CREATE INDEX IF NOT EXISTS idx_analytical_parent ON analytical_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_customers_scope ON customers(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_scope ON suppliers(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_cashboxes_branch ON cashboxes(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_banks_branch ON banks(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_exchange_companies_branch ON exchange_companies(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_intermediate_accounts_branch ON intermediate_accounts(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_company_branch_date ON journal_entries(company_id, branch_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id, analytical_account_id);
CREATE INDEX IF NOT EXISTS idx_opening_balances_scope ON opening_balances(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_scope_date ON audit_log(company_id, branch_id, created_at);

-- قيد أساسي: لا نسمح بأكثر من عملة أساس واحدة للشركة.
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_base_currency_per_company
ON currencies(company_id) WHERE is_base = 1;
