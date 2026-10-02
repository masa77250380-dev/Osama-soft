/*
 * أسامة سوفت - Organization Repository
 * Stage 12: مستودع مستقل للشركات والفروع والمستخدمين والصلاحيات.
 * لا يعتمد على state القديم ولا يغيّر واجهة النظام.
 */
(function (global) {
  'use strict';

  function requiredId(value, label) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new Error(label + ' غير صالح');
    return id;
  }

  async function companies() {
    return global.OsamaSoftDB.query('SELECT * FROM companies ORDER BY id');
  }

  async function getCompany(id) {
    return (await global.OsamaSoftDB.query('SELECT * FROM companies WHERE id=? LIMIT 1', [requiredId(id, 'معرف الشركة')]))[0] || null;
  }

  async function createCompany(data) {
    const name = String(data && data.name_ar || '').trim();
    if (!name) throw new Error('اسم الشركة مطلوب');
    return global.OsamaSoftDB.execute(
      'INSERT INTO companies(name_ar,name_en,phone,email,registration_no,is_active) VALUES(?,?,?,?,?,1)',
      [name, data.name_en || null, data.phone || null, data.email || null, data.registration_no || null]
    );
  }

  async function branches(companyId) {
    return global.OsamaSoftDB.query('SELECT * FROM branches WHERE company_id=? ORDER BY id', [requiredId(companyId, 'معرف الشركة')]);
  }

  async function createBranch(data) {
    const companyId = requiredId(data && data.company_id, 'معرف الشركة');
    const code = String(data && data.code || '').trim();
    const name = String(data && data.name_ar || '').trim();
    if (!code || !name) throw new Error('كود واسم الفرع مطلوبان');
    return global.OsamaSoftDB.execute(
      'INSERT INTO branches(company_id,code,name_ar,name_en,address_ar,address_en,phone,email,is_main,is_active) VALUES(?,?,?,?,?,?,?,?,?,1)',
      [companyId, code, name, data.name_en || null, data.address_ar || null, data.address_en || null, data.phone || null, data.email || null, data.is_main ? 1 : 0]
    );
  }

  async function users() {
    return global.OsamaSoftDB.query('SELECT id,username,display_name,is_system_manager,is_active,created_at,updated_at FROM users ORDER BY id');
  }

  async function userAccess(userId) {
    const id = requiredId(userId, 'معرف المستخدم');
    return {
      companies: await global.OsamaSoftDB.query('SELECT uc.*, c.name_ar FROM user_companies uc JOIN companies c ON c.id=uc.company_id WHERE uc.user_id=? ORDER BY c.id', [id]),
      branches: await global.OsamaSoftDB.query('SELECT ub.*, b.name_ar, b.code FROM user_branches ub JOIN branches b ON b.id=ub.branch_id WHERE ub.user_id=? ORDER BY b.id', [id]),
      permissions: await global.OsamaSoftDB.query(`SELECT up.*, p.code, p.name_ar, p.scope, pg.code AS group_code, pg.name_ar AS group_name_ar
        FROM user_permissions up
        JOIN permissions p ON p.id=up.permission_id
        JOIN permission_groups pg ON pg.id=p.group_id
        WHERE up.user_id=? ORDER BY pg.sort_order,p.sort_order`, [id])
    };
  }

  global.OsamaSoftOrganizationRepository = {
    companies,
    getCompany,
    createCompany,
    branches,
    createBranch,
    users,
    userAccess
  };
})(window);
