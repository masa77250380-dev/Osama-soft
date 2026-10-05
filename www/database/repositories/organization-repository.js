/*
 * أسامة سوفت - Organization Repository
 * Stage 12: الشركات والفروع والمستخدمون والصلاحيات.
 *
 * قاعدة البيانات SQLite هي مصدر الحقيقة للبيانات التنظيمية.
 * لا يعتمد هذا المستودع على localStorage.
 */
(function (global) {
  'use strict';

  function requiredId(value, label) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(label + ' غير صالح');
    }
    return id;
  }

  async function ensureDatabase() {
    if (!global.OsamaSoftDB) {
      throw new Error('خدمة قاعدة SQLite غير متاحة');
    }
    await global.OsamaSoftDB.initialize();
  }

  async function companies(includeInactive) {
    await ensureDatabase();

    const sql = includeInactive
      ? 'SELECT * FROM companies ORDER BY id'
      : 'SELECT * FROM companies WHERE is_active=1 ORDER BY id';

    return global.OsamaSoftDB.query(sql);
  }

  async function getCompany(id) {
    await ensureDatabase();

    const companyId = requiredId(id, 'معرف الشركة');

    const rows = await global.OsamaSoftDB.query(
      'SELECT * FROM companies WHERE id=? LIMIT 1',
      [companyId]
    );

    return rows[0] || null;
  }

  async function createCompany(data) {
    await ensureDatabase();

    const name = String(data && data.name_ar || '').trim();

    if (!name) {
      throw new Error('اسم الشركة مطلوب');
    }

    return global.OsamaSoftDB.execute(
      `INSERT INTO companies
       (name_ar,name_en,address_ar,address_en,phone,email,registration_no,
        logo_data,watermark_data,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [
        name,
        data.name_en || null,
        data.address_ar || null,
        data.address_en || null,
        data.phone || null,
        data.email || null,
        data.registration_no || null,
        data.logo_data || null,
        data.watermark_data || null
      ]
    );
  }

  async function updateCompany(id, data) {
    await ensureDatabase();

    const companyId = requiredId(id, 'معرف الشركة');
    const name = String(data && data.name_ar || '').trim();

    if (!name) {
      throw new Error('اسم الشركة مطلوب');
    }

    return global.OsamaSoftDB.execute(
      `UPDATE companies
       SET name_ar=?,
           name_en=?,
           address_ar=?,
           address_en=?,
           phone=?,
           email=?,
           registration_no=?,
           logo_data=?,
           watermark_data=?,
           is_active=COALESCE(?,is_active),
           updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        name,
        data.name_en || null,
        data.address_ar || null,
        data.address_en || null,
        data.phone || null,
        data.email || null,
        data.registration_no || null,
        data.logo_data || null,
        data.watermark_data || null,
        data.is_active === undefined ? null : (data.is_active ? 1 : 0),
        companyId
      ]
    );
  }

  async function deactivateCompany(id) {
    await ensureDatabase();

    const companyId = requiredId(id, 'معرف الشركة');

    return global.OsamaSoftDB.execute(
      'UPDATE companies SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [companyId]
    );
  }

  async function branches(companyId, includeInactive) {
    await ensureDatabase();

    const id = requiredId(companyId, 'معرف الشركة');

    const sql = includeInactive
      ? 'SELECT * FROM branches WHERE company_id=? ORDER BY id'
      : 'SELECT * FROM branches WHERE company_id=? AND is_active=1 ORDER BY id';

    return global.OsamaSoftDB.query(sql, [id]);
  }

  async function getBranch(id) {
    await ensureDatabase();

    const branchId = requiredId(id, 'معرف الفرع');

    const rows = await global.OsamaSoftDB.query(
      'SELECT * FROM branches WHERE id=? LIMIT 1',
      [branchId]
    );

    return rows[0] || null;
  }

  async function createBranch(data) {
    await ensureDatabase();

    const companyId = requiredId(
      data && data.company_id,
      'معرف الشركة'
    );

    const code = String(data && data.code || '').trim();
    const name = String(data && data.name_ar || '').trim();

    if (!code || !name) {
      throw new Error('كود واسم الفرع مطلوبان');
    }

    return global.OsamaSoftDB.execute(
      `INSERT INTO branches
       (company_id,code,name_ar,name_en,address_ar,address_en,phone,email,is_main,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [
        companyId,
        code,
        name,
        data.name_en || null,
        data.address_ar || null,
        data.address_en || null,
        data.phone || null,
        data.email || null,
        data.is_main ? 1 : 0
      ]
    );
  }

  async function updateBranch(id, data) {
    await ensureDatabase();

    const branchId = requiredId(id, 'معرف الفرع');
    const name = String(data && data.name_ar || '').trim();
    const code = String(data && data.code || '').trim();

    if (!code || !name) {
      throw new Error('كود واسم الفرع مطلوبان');
    }

    return global.OsamaSoftDB.execute(
      `UPDATE branches
       SET code=?,
           name_ar=?,
           name_en=?,
           address_ar=?,
           address_en=?,
           phone=?,
           email=?,
           is_main=COALESCE(?,is_main),
           is_active=COALESCE(?,is_active),
           updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        code,
        name,
        data.name_en || null,
        data.address_ar || null,
        data.address_en || null,
        data.phone || null,
        data.email || null,
        data.is_main === undefined ? null : (data.is_main ? 1 : 0),
        data.is_active === undefined ? null : (data.is_active ? 1 : 0),
        branchId
      ]
    );
  }

  async function deactivateBranch(id) {
    await ensureDatabase();

    const branchId = requiredId(id, 'معرف الفرع');

    return global.OsamaSoftDB.execute(
      'UPDATE branches SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [branchId]
    );
  }

  async function getCompanyWithBranches(companyId) {
    const company = await getCompany(companyId);

    if (!company) {
      return null;
    }

    return {
      company,
      branches: await branches(companyId, false)
    };
  }


  /*
   * تهيئة المنظمة الافتراضية:
   * - إذا لم توجد شركات: إنشاء الشركة الرئيسية.
   * - إذا كانت الشركة الرئيسية موجودة: عدم إنشاء شركة مكررة.
   * - إذا لم يوجد الفرع الرئيسي: إنشاؤه دون حذف أو إعادة تسمية أي فرع موجود.
   * - إذا كانت هناك فروع موجودة: عدم إعادة تسميتها أو حذفها.
   */
  async function ensureDefaultOrganization() {
    await ensureDatabase();

    const existingCompanies = await companies(false);

    let company = existingCompanies.find(
      c => c.name_ar === "الشركة الرئيسية"
    ) || null;

    if (!company) {
      const result = await createCompany({
        name_ar: "الشركة الرئيسية"
      });

      let companyId = result && result.lastId;

      if (!companyId) {
        const created = await companies(false);
        const found = created.find(
          c => c.name_ar === "الشركة الرئيسية"
        );
        companyId = found && found.id;
      }

      if (!companyId) {
        throw new Error(
          "تعذر إنشاء الشركة الرئيسية في SQLite"
        );
      }

      company = await getCompany(companyId);
    }

    if (!company) {
      throw new Error(
        "تعذر تحديد الشركة الافتراضية في SQLite"
      );
    }

    let companyBranches = await branches(company.id, false);

    let defaultBranch = companyBranches.find(
      b => b.name_ar === "الفرع الرئيسي"
    ) || null;

    /*
     * إذا لم يوجد الفرع الرئيسي:
     * - لا نحذف أي فرع موجود.
     * - لا نعيد تسمية أي فرع موجود.
     * - نختار أول رمز BR-XXX متاح.
     * - إذا كان هناك فرع رئيسي آخر، لا نجعله is_main=false.
     */
    if (!defaultBranch) {
      const usedCodes = new Set(
        companyBranches.map(
          b => String(b.code || "").trim()
        )
      );

      let branchNumber = 1;
      let branchCode;

      do {
        branchCode =
          "BR-" +
          String(branchNumber).padStart(3, "0");
        branchNumber++;
      } while (usedCodes.has(branchCode));

      const hasMainBranch = companyBranches.some(
        b => Number(b.is_main) === 1
      );

      const result = await createBranch({
        company_id: company.id,
        code: branchCode,
        name_ar: "الفرع الرئيسي",
        is_main: hasMainBranch ? false : true
      });

      let branchId = result && result.lastId;

      if (branchId) {
        defaultBranch = await getBranch(branchId);
      } else {
        companyBranches = await branches(
          company.id,
          false
        );

        defaultBranch = companyBranches.find(
          b => b.name_ar === "الفرع الرئيسي"
        ) || null;
      }
    }

    if (!defaultBranch) {
      throw new Error(
        "تعذر إنشاء أو تحديد الفرع الرئيسي في SQLite"
      );
    }

    return {
      company,
      branch: defaultBranch
    };
  }

  async function listActiveOrganizationWorkspaces() {
    await ensureDatabase();

    return global.OsamaSoftDB.query(
      `SELECT
         c.id AS company_id,
         c.name_ar AS company_name_ar,
         c.name_en AS company_name_en,
         c.address_ar AS company_address_ar,
         c.address_en AS company_address_en,
         c.phone AS company_phone,
         c.email AS company_email,
         c.registration_no AS company_registration_no,
         c.logo_data AS company_logo_data,
         c.watermark_data AS company_watermark_data,
         b.id AS branch_id,
         b.code AS branch_code,
         b.name_ar AS branch_name_ar,
         b.name_en AS branch_name_en,
         b.address_ar AS branch_address_ar,
         b.address_en AS branch_address_en,
         b.phone AS branch_phone,
         b.email AS branch_email,
         b.is_main AS branch_is_main
       FROM companies c
       JOIN branches b ON b.company_id = c.id
       WHERE c.is_active = 1
         AND b.is_active = 1
       ORDER BY c.id, b.id`
    );
  }

  async function users() {
    await ensureDatabase();

    return global.OsamaSoftDB.query(
      `SELECT id,username,display_name,is_system_manager,is_active,
              created_at,updated_at
       FROM users
       ORDER BY id`
    );
  }

  async function userAccess(userId) {
    await ensureDatabase();

    const id = requiredId(userId, 'معرف المستخدم');

    return {
      companies: await global.OsamaSoftDB.query(
        `SELECT uc.*, c.name_ar
         FROM user_companies uc
         JOIN companies c ON c.id=uc.company_id
         WHERE uc.user_id=?
         ORDER BY c.id`,
        [id]
      ),

      branches: await global.OsamaSoftDB.query(
        `SELECT ub.*, b.name_ar, b.code
         FROM user_branches ub
         JOIN branches b ON b.id=ub.branch_id
         WHERE ub.user_id=?
         ORDER BY b.id`,
        [id]
      ),

      permissions: await global.OsamaSoftDB.query(
        `SELECT up.*, p.code, p.name_ar, p.scope,
                pg.code AS group_code,
                pg.name_ar AS group_name_ar
         FROM user_permissions up
         JOIN permissions p ON p.id=up.permission_id
         JOIN permission_groups pg ON pg.id=p.group_id
         WHERE up.user_id=?
         ORDER BY pg.sort_order,p.sort_order`,
        [id]
      )
    };
  }

  global.OsamaSoftOrganizationRepository = {
    companies,
    getCompany,
    createCompany,
    updateCompany,
    deactivateCompany,

    branches,
    getBranch,
    createBranch,
    updateBranch,
    deactivateBranch,
    getCompanyWithBranches,

    ensureDefaultOrganization,
    listActiveOrganizationWorkspaces,
    users,
    userAccess
  };

})(window);
