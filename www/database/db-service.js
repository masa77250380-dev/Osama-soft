/*
 * أسامة سوفت - Normalized SQLite Service
 * Stage 11: database foundation only.
 * This module is intentionally independent from the existing accounting UI.
 * It does not migrate or delete the current legacy data by itself.
 */
(function (global) {
  'use strict';

  const DB_NAME = 'osama_soft_accounting';
  const DB_VERSION = 2;
  const SCHEMA_MIGRATION_NAME = '002_organization_fields';
  let native = null;
  let initPromise = null;

  function plugin() {
    return global.CapacitorSQLite ||
      (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.CapacitorSQLite) || null;
  }

  function available() { return !!plugin(); }

  async function openNative() {
    if (native) return native;
    const p = plugin();
    if (!p) throw new Error('Capacitor SQLite plugin is not available');

    try {
      await p.createConnection({
        database: DB_NAME,
        encrypted: false,
        mode: 'no-encryption',
        version: DB_VERSION,
        readonly: false
      });
    } catch (_) {
      try { await p.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false); } catch (_) {}
    }

    try { await p.open({ database: DB_NAME }); }
    catch (_) { try { await p.open(DB_NAME); } catch (_) {} }

    native = p;
    return native;
  }

  async function execute(sql, values) {
    const p = await openNative();
    try { return await p.run({ database: DB_NAME, statement: sql, values: values || [] }); }
    catch (_) { return await p.run({ database: DB_NAME, statement: sql, values: values || [] }); }
  }

  async function query(sql, values) {
    const p = await openNative();
    let result;
    try { result = await p.query({ database: DB_NAME, statement: sql, values: values || [] }); }
    catch (_) { result = await p.query({ database: DB_NAME, statement: sql, values: values || [] }); }

    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.values)) {
      const columns = result.columns || [];
      return result.values.map(row => {
        if (row && typeof row === 'object' && !Array.isArray(row)) return row;
        const obj = {};
        columns.forEach((c, i) => { obj[c] = row[i]; });
        return obj;
      });
    }
    return [];
  }

  // Splits the local schema script without trying to parse arbitrary SQL.
  // The project schema intentionally keeps one SQL statement per semicolon.
  function splitSqlScript(script) {
    const cleaned = script
      .replace(/\/\*[^]*?\*\//g, '')
      .replace(/^\s*--.*$/gm, '');
    return cleaned.split(';').map(s => s.trim()).filter(Boolean);
  }

  async function loadSchemaText() {
    const response = await fetch('database/schema.sql', { cache: 'no-store' });
    if (!response.ok) throw new Error('تعذر تحميل مخطط قاعدة البيانات: HTTP ' + response.status);
    return response.text();
  }

  async function initialize() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (!available()) throw new Error('قاعدة SQLite الأصلية غير متاحة في هذه البيئة');
      const schema = await loadSchemaText();
      for (const statement of splitSqlScript(schema)) await execute(statement);
      const migration = await query('SELECT version, name, applied_at FROM schema_migrations WHERE version=? LIMIT 1', [DB_VERSION]);
      if (!migration.length) {
        const companyColumns = await query('PRAGMA table_info(companies)');
        const hasAddressAr = companyColumns.some(c => c.name === 'address_ar');
        const hasAddressEn = companyColumns.some(c => c.name === 'address_en');

        if (!hasAddressAr) {
          await execute('ALTER TABLE companies ADD COLUMN address_ar TEXT');
        }

        if (!hasAddressEn) {
          await execute('ALTER TABLE companies ADD COLUMN address_en TEXT');
        }

        const seedResponse = await fetch('database/seed.sql', { cache: 'no-store' });
        if (!seedResponse.ok) throw new Error('تعذر تحميل البيانات المرجعية: HTTP ' + seedResponse.status);
        const seed = await seedResponse.text();
        for (const statement of splitSqlScript(seed)) await execute(statement);

        await execute('INSERT INTO schema_migrations(version,name) VALUES(?,?)', [DB_VERSION, SCHEMA_MIGRATION_NAME]);
      }
      return { database: DB_NAME, version: DB_VERSION, engine: 'native-sqlite' };
    })().catch(error => {
      initPromise = null;
      throw error;
    });
    return initPromise;
  }

  async function tables() {
    await initialize();
    return query(`
      SELECT name, type, sql
      FROM sqlite_master
      WHERE type IN ('table','index')
        AND name NOT LIKE 'sqlite_%'
      ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name
    `);
  }

  async function tableInfo(tableName) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) throw new Error('اسم جدول غير صالح');
    await initialize();
    return query(`PRAGMA table_info(${tableName})`);
  }

  async function countRows(tableName) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) throw new Error('اسم جدول غير صالح');
    await initialize();
    const rows = await query(`SELECT COUNT(*) AS count FROM ${tableName}`);
    return Number(rows[0] && rows[0].count || 0);
  }

  async function sampleRows(tableName, limit) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) throw new Error('اسم جدول غير صالح');
    await initialize();
    const n = Math.max(1, Math.min(200, Number(limit) || 50));
    return query(`SELECT * FROM ${tableName} LIMIT ${n}`);
  }

  async function exportDatabaseJson() {
    const schemaRows = await tables();
    const tableRows = schemaRows.filter(x => x.type === 'table');
    const result = { database: DB_NAME, version: DB_VERSION, exportedAt: new Date().toISOString(), tables: {} };
    for (const t of tableRows) result.tables[t.name] = await query(`SELECT * FROM ${t.name}`);
    return result;
  }

  global.OsamaSoftDB = {
    name: DB_NAME,
    version: DB_VERSION,
    isAvailable: available,
    initialize,
    execute,
    query,
    tables,
    tableInfo,
    countRows,
    sampleRows,
    exportDatabaseJson
  };
})(window);
