(function () {
  'use strict';

  const SETUP_KEY = 'initial_setup_completed';

  function el(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureStyles() {
    if (el('mandatorySetupStyles')) return;
    const style = document.createElement('style');
    style.id = 'mandatorySetupStyles';
    style.textContent = `
      #mandatorySetupOverlay {
        position:fixed; inset:0; z-index:999999;
        display:flex; align-items:center; justify-content:center;
        padding:14px; overflow-y:auto; background:#eef1f5;
      }
      #mandatorySetupCard {
        width:min(900px,100%); max-height:96vh; overflow-y:auto;
        background:#fff; color:#2b333b; border-radius:14px;
        padding:22px; box-shadow:0 8px 32px #22303f30;
      }
      #mandatorySetupCard h2 { margin-top:0; color:#254a63; }
      #mandatorySetupCard .setup-grid {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
      }
      #mandatorySetupCard label { display:block; font-weight:600; margin-bottom:5px; }
      #mandatorySetupCard input {
        width:100%; min-width:0; box-sizing:border-box;
        padding:11px; border:1px solid #cbd5df; border-radius:8px;
        background:#fff; color:#22303f; font-size:16px;
      }
      #mandatorySetupCard .setup-section {
        border-top:1px solid #dde3e8; padding-top:15px; margin-top:17px;
      }
      #mandatorySetupCard button {
        border:0; border-radius:8px; padding:13px 20px;
        background:#3d6b91; color:white; font-size:16px;
        font-weight:700; width:100%; margin-top:18px;
      }
      #mandatorySetupCard button:disabled { opacity:.6; }
      #mandatorySetupError { color:#b42318; white-space:pre-wrap; margin-top:12px; }
      @media(max-width:600px) {
        #mandatorySetupCard { padding:15px; }
        #mandatorySetupCard .setup-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMarkup() {
    ensureStyles();
    if (el('mandatorySetupOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mandatorySetupOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div id="mandatorySetupCard">
        <h2>تركيب نظام أسامة سوفت للمحاسبة</h2>
        <p>أكمل بيانات الشركة والفرع والفترة المالية لحفظها في قاعدة البيانات قبل الدخول إلى النظام.</p>
        <form id="mandatorySetupForm">
          <div class="setup-section">
            <h3>أولًا: بيانات الشركة</h3>
            <div class="setup-grid">
              <div><label for="setupCompanyName">اسم الشركة بالعربي *</label><input id="setupCompanyName" required maxlength="200"></div>
              <div><label for="setupCompanyNo">رقم الشركة الداخلي *</label><input id="setupCompanyNo" required maxlength="60"></div>
              <div><label for="setupCompanyNameEn">اسم الشركة بالإنجليزي</label><input id="setupCompanyNameEn" maxlength="200"></div>
              <div><label for="setupRegNo">رقم السجل التجاري</label><input id="setupRegNo" maxlength="100"></div>
              <div><label for="setupCompanyAddress">عنوان الشركة بالعربي</label><input id="setupCompanyAddress" maxlength="300"></div>
              <div><label for="setupCompanyAddressEn">عنوان الشركة بالإنجليزي</label><input id="setupCompanyAddressEn" maxlength="300"></div>
              <div><label for="setupCompanyPhone">هاتف الشركة</label><input id="setupCompanyPhone" type="tel" maxlength="60"></div>
              <div><label for="setupCompanyEmail">بريد الشركة</label><input id="setupCompanyEmail" type="email" maxlength="200"></div>
            </div>
          </div>
          <div class="setup-section">
            <h3>ثانيًا: بيانات الفرع</h3>
            <div class="setup-grid">
              <div><label for="setupBranchName">اسم الفرع بالعربي *</label><input id="setupBranchName" required maxlength="200"></div>
              <div><label for="setupBranchCode">رقم / رمز الفرع *</label><input id="setupBranchCode" required maxlength="60"></div>
              <div><label for="setupBranchNameEn">اسم الفرع بالإنجليزي</label><input id="setupBranchNameEn" maxlength="200"></div>
              <div><label for="setupBranchAddress">عنوان الفرع بالعربي</label><input id="setupBranchAddress" maxlength="300"></div>
              <div><label for="setupBranchAddressEn">عنوان الفرع بالإنجليزي</label><input id="setupBranchAddressEn" maxlength="300"></div>
              <div><label for="setupBranchPhone">هاتف الفرع</label><input id="setupBranchPhone" type="tel" maxlength="60"></div>
              <div><label for="setupBranchEmail">بريد الفرع</label><input id="setupBranchEmail" type="email" maxlength="200"></div>
            </div>
          </div>
          <div class="setup-section">
            <h3>ثالثًا: الفترة المالية الأولى</h3>
            <div class="setup-grid">
              <div><label for="setupPeriodName">اسم الفترة المالية *</label><input id="setupPeriodName" required maxlength="200"></div>
              <div><label for="setupPeriodFrom">تاريخ البداية *</label><input id="setupPeriodFrom" type="date" required></div>
              <div><label for="setupPeriodTo">تاريخ النهاية *</label><input id="setupPeriodTo" type="date" required></div>
            </div>
          </div>
          <div id="mandatorySetupError" role="alert"></div>
          <button id="mandatorySetupSubmit" type="submit">حفظ البيانات وإكمال التركيب</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    // منع إغلاق المعالج بالنقر خارج البطاقة أو بمفتاح Escape
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (el('mandatorySetupOverlay') && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  function setValue(id, value) {
    const node = el(id);
    if (node && !node.value) node.value = value == null ? '' : String(value);
  }

  async function getSetting() {
    const registry = window.loadWorkspaceRegistry();
    const activeKey = window.__activeAccountingWorkspaceKey;
    const workspace = registry.find(function (item) {
      return item.storageKey === activeKey;
    }) || registry[0];

    if (!workspace || !workspace.dbCompanyId || !workspace.dbBranchId) return null;

    const rows = await window.OsamaSoftDB.query(
      `SELECT setting_value FROM app_settings
       WHERE company_id=? AND branch_id=? AND setting_group=? AND setting_key=?
       LIMIT 1`,
      [Number(workspace.dbCompanyId), Number(workspace.dbBranchId), 'system', SETUP_KEY]
    );
    return rows[0] ? rows[0].setting_value : null;
  }

  async function show() {
    ensureMarkup();

    // لا نسمح بإظهار شاشة الدخول أو التطبيق خلف المعالج
    el('loginScreen').style.display = 'none';
    el('mainApp').classList.add('hidden');

    const registry = window.loadWorkspaceRegistry();
    const activeKey = window.__activeAccountingWorkspaceKey;
    const workspace = registry.find(function (item) {
      return item.storageKey === activeKey;
    }) || registry[0];

    let company = null;
    let branch = null;
    const repo = window.OsamaSoftOrganizationRepository;

    if (workspace && workspace.dbCompanyId) {
      company = await repo.getCompany(workspace.dbCompanyId);
    }
    if (workspace && workspace.dbBranchId) {
      branch = await repo.getBranch(workspace.dbBranchId);
    }

    const today = new Date();
    const year = today.getFullYear();
    const currentDate = today.toISOString().slice(0, 10);

    setValue('setupCompanyName', company && company.name_ar || workspace && workspace.companyName || '');
    setValue('setupCompanyNo', company && company.company_no || '');
    setValue('setupCompanyNameEn', company && company.name_en || '');
    setValue('setupRegNo', company && company.registration_no || '');
    setValue('setupCompanyAddress', company && company.address_ar || '');
    setValue('setupCompanyAddressEn', company && company.address_en || '');
    setValue('setupCompanyPhone', company && company.phone || '');
    setValue('setupCompanyEmail', company && company.email || '');
    setValue('setupBranchName', branch && branch.name_ar || workspace && workspace.branchName || '');
    setValue('setupBranchCode', branch && branch.code || 'BR-001');
    setValue('setupBranchNameEn', branch && branch.name_en || '');
    setValue('setupBranchAddress', branch && branch.address_ar || '');
    setValue('setupBranchAddressEn', branch && branch.address_en || '');
    setValue('setupBranchPhone', branch && branch.phone || '');
    setValue('setupBranchEmail', branch && branch.email || '');
    setValue('setupPeriodName', 'الفترة المالية ' + year);
    setValue('setupPeriodFrom', year + '-01-01');
    setValue('setupPeriodTo', year + '-12-31');

    el('mandatorySetupForm').onsubmit = submit;
    el('mandatorySetupOverlay').style.display = 'flex';
  }

  async function submit(event) {
    event.preventDefault();
    const button = el('mandatorySetupSubmit');
    const errorBox = el('mandatorySetupError');
    errorBox.textContent = '';

    const value = function (id) { return el(id).value.trim(); };
    const companyName = value('setupCompanyName');
    const companyNo = value('setupCompanyNo');
    const branchName = value('setupBranchName');
    const branchCode = value('setupBranchCode');
    const periodName = value('setupPeriodName');
    const fromDate = value('setupPeriodFrom');
    const toDate = value('setupPeriodTo');

    if (!companyName || !companyNo || !branchName || !branchCode ||
        !periodName || !fromDate || !toDate) {
      errorBox.textContent = 'يرجى تعبئة جميع الحقول المطلوبة المميزة بعلامة النجمة.';
      return;
    }
    if (fromDate > toDate) {
      errorBox.textContent = 'تاريخ نهاية الفترة يجب ألا يسبق تاريخ بدايتها.';
      return;
    }

    button.disabled = true;
    button.textContent = 'جارٍ حفظ البيانات في SQLite...';

    try {
      const db = window.OsamaSoftDB;
      const repo = window.OsamaSoftOrganizationRepository;
      await db.initialize();

      const registry = window.loadWorkspaceRegistry();
      const activeKey = window.__activeAccountingWorkspaceKey;
      const workspace = registry.find(function (item) {
        return item.storageKey === activeKey;
      }) || registry[0];

      if (!workspace) throw new Error('تعذر تحديد مساحة العمل الحالية.');

      let companyId = Number(workspace.dbCompanyId) || 0;
      let branchId = Number(workspace.dbBranchId) || 0;
      let company = companyId ? await repo.getCompany(companyId) : null;
      let branch = branchId ? await repo.getBranch(branchId) : null;

      const companyData = {
        name_ar: companyName,
        company_no: companyNo,
        name_en: value('setupCompanyNameEn'),
        registration_no: value('setupRegNo'),
        address_ar: value('setupCompanyAddress'),
        address_en: value('setupCompanyAddressEn'),
        phone: value('setupCompanyPhone'),
        email: value('setupCompanyEmail')
      };

      // إعادة استخدام السجل المرتبط حاليًا، وعدم إنشاء شركة مكررة
      if (!company) {
        const allCompanies = await repo.companies();
        company = allCompanies.find(function (item) {
          return String(item.company_no || '') === companyNo;
        }) || allCompanies.find(function (item) {
          return item.name_ar === companyName;
        }) || null;
        if (company) companyId = Number(company.id);
      }

      if (companyId && company) {
        companyData.logo_data = company.logo_data || null;
        companyData.watermark_data = company.watermark_data || null;
        await repo.updateCompany(companyId, companyData);
      } else {
        await repo.createCompany(companyData);
        const allCompanies = await repo.companies();
        company = allCompanies.find(function (item) {
          return String(item.company_no || '') === companyNo;
        }) || allCompanies.find(function (item) {
          return item.name_ar === companyName;
        });
        if (!company) throw new Error('تم إرسال بيانات الشركة، لكن تعذر التحقق من سجلها في SQLite.');
        companyId = Number(company.id);
      }

      const branchData = {
        company_id: companyId,
        code: branchCode,
        name_ar: branchName,
        name_en: value('setupBranchNameEn'),
        address_ar: value('setupBranchAddress'),
        address_en: value('setupBranchAddressEn'),
        phone: value('setupBranchPhone'),
        email: value('setupBranchEmail'),
        is_main: true
      };

      // لا نعيد استخدام فرع تابع لشركة أخرى
      if (branch && Number(branch.company_id) !== companyId) branch = null;
      if (!branch) {
        const branches = await repo.branches(companyId);
        branch = branches.find(function (item) {
          return item.code === branchCode || item.name_ar === branchName;
        }) || null;
        if (branch) branchId = Number(branch.id);
      }

      if (branchId && branch) {
        await repo.updateBranch(branchId, branchData);
      } else {
        await repo.createBranch(branchData);
        const branches = await repo.branches(companyId);
        branch = branches.find(function (item) {
          return item.code === branchCode;
        }) || branches.find(function (item) {
          return item.name_ar === branchName;
        });
        if (!branch) throw new Error('تم إرسال بيانات الفرع، لكن تعذر التحقق من سجله في SQLite.');
        branchId = Number(branch.id);
      }

      // حفظ الفترة في الجدول الحقيقي fiscal_periods
      const existingPeriods = await db.query(
        `SELECT id FROM fiscal_periods
         WHERE company_id=? AND branch_id=? AND from_date=? AND to_date=?
         LIMIT 1`,
        [companyId, branchId, fromDate, toDate]
      );

      if (!existingPeriods.length) {
        await db.execute(
          `UPDATE fiscal_periods SET is_current=0
           WHERE company_id=? AND branch_id=?`,
          [companyId, branchId]
        );
        await db.execute(
          `INSERT INTO fiscal_periods
           (company_id,branch_id,name_ar,from_date,to_date,is_open,is_current)
           VALUES (?,?,?,?,?,1,1)`,
          [companyId, branchId, periodName, fromDate, toDate]
        );
      } else {
        await db.execute(
          `UPDATE fiscal_periods SET name_ar=?,is_open=1,is_current=1
           WHERE id=?`,
          [periodName, Number(existingPeriods[0].id)]
        );
      }

      // التحقق من وجود الفترة قبل إعلان نجاح التركيب
      const verifyPeriod = await db.query(
        `SELECT id FROM fiscal_periods
         WHERE company_id=? AND branch_id=? AND from_date=? AND to_date=?
         LIMIT 1`,
        [companyId, branchId, fromDate, toDate]
      );
      if (!verifyPeriod.length) throw new Error('تعذر التحقق من حفظ الفترة المالية.');

      workspace.companyName = companyName;
      workspace.branchName = branchName;
      workspace.dbCompanyId = companyId;
      workspace.dbBranchId = branchId;
      window.saveWorkspaceRegistry(registry);

      // تحديث حالة الشركة المحلية حتى تتطابق واجهة النظام مع بيانات SQLite
      try {
        const raw = localStorage.getItem(workspace.storageKey);
        if (raw) {
          const saved = JSON.parse(raw);
          saved.company = saved.company || {};
          Object.assign(saved.company, {
            name: companyName,
            nameEn: value('setupCompanyNameEn'),
            companyNo: companyNo,
            regNo: value('setupRegNo'),
            address: value('setupCompanyAddress'),
            addressEn: value('setupCompanyAddressEn'),
            phone: value('setupCompanyPhone'),
            email: value('setupCompanyEmail')
          });
          saved.currentPeriod = {
            id: Number(verifyPeriod[0].id),
            name: periodName,
            fromDate: fromDate,
            toDate: toDate,
            isOpen: true
          };
          localStorage.setItem(workspace.storageKey, JSON.stringify(saved));
        }
      } catch (_) {}

      // علامة الاكتمال آخر خطوة، ولا تُكتب قبل حفظ كل السجلات
      await db.execute(
        `INSERT INTO app_settings
         (company_id,branch_id,setting_group,setting_key,setting_value)
         VALUES (?,?,?,?,'1')
         ON CONFLICT(company_id,branch_id,setting_group,setting_key)
         DO UPDATE SET setting_value=excluded.setting_value`,
        [companyId, branchId, 'system', SETUP_KEY]
      );

      const verifySetting = await getSetting();
      if (verifySetting !== '1') {
        throw new Error('لم يتم التحقق من علامة اكتمال التركيب في SQLite.');
      }

      // إعادة تحميل التطبيق لقراءة بيانات الشركة والفترة بعد التركيب
      window.location.reload();
    } catch (error) {
      console.error('Mandatory setup failed:', error);
      errorBox.textContent =
        'لم يكتمل التركيب؛ لم يتم تجاوز شاشة الإعداد.\n' +
        (error && error.message ? error.message : 'حدث خطأ غير معروف.');
      button.disabled = false;
      button.textContent = 'إعادة محاولة الحفظ';
    }
  }

  window.OsamaSoftSetupWizard = { show: show, getSetting: getSetting };
})();
