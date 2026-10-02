/*
 * أسامة سوفت - واجهة قاعدة البيانات المنظمة
 * Stage 12: ربط طبقة قاعدة البيانات بواجهة النظام فقط.
 * لا يغيّر بيانات النظام القديمة ولا يستبدل منطق المحاسبة الحالي.
 */
(function (global) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function injectUI() {
    const settings = document.getElementById('settings');
    if (!settings || document.getElementById('settingsDatabase')) return;

    const tabs = settings.querySelector('.tabs');
    if (tabs) {
      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.subtab = 'settingsDatabase';
      tab.textContent = '🗄️ قاعدة البيانات';
      tabs.appendChild(tab);
    }

    const panel = document.createElement('div');
    panel.id = 'settingsDatabase';
    panel.className = 'subtab-content hidden';
    panel.innerHTML = `
      <div class="card" style="background:var(--light)">
        <div class="section-header">
          <h3>🗄️ قاعدة البيانات المنظمة</h3>
        </div>
        <p class="muted">هذه الشاشة لعرض قاعدة SQLite الفعلية. لا تحتوي على أوامر حذف أو تعديل مباشر للجداول.</p>
        <div class="grid cols-3">
          <div><label>المحرك</label><input id="dbUiEngine" readonly></div>
          <div><label>اسم قاعدة البيانات</label><input id="dbUiName" readonly></div>
          <div><label>الحالة</label><input id="dbUiStatus" readonly></div>
        </div>
        <div class="row no-print" style="margin-top:1rem;gap:.5rem;flex-wrap:wrap">
          <button id="dbUiRefresh" class="btn-success">🔄 تحديث الجداول</button>
          <button id="dbUiExport" class="btn-primary">📦 تصدير قاعدة البيانات JSON</button>
        </div>
        <div id="dbUiTables" style="margin-top:1rem;overflow:auto"></div>
        <div id="dbUiDetail" class="card" style="margin-top:1rem;display:none"></div>
      </div>`;
    settings.appendChild(panel);
  }

  function setStatus(text) {
    const el = document.getElementById('dbUiStatus');
    if (el) el.value = text;
  }

  async function loadTables() {
    const tablesBox = document.getElementById('dbUiTables');
    if (!tablesBox || !global.OsamaSoftDB) return;

    setStatus('جاري الاتصال...');
    document.getElementById('dbUiEngine').value = global.OsamaSoftDB.isAvailable() ? 'native-sqlite' : 'غير متاح';
    document.getElementById('dbUiName').value = global.OsamaSoftDB.name;

    try {
      await global.OsamaSoftDB.initialize();
      setStatus('متصلة وجاهزة');
      const objects = await global.OsamaSoftDB.tables();
      const tables = objects.filter(x => x.type === 'table');
      let html = '<table><thead><tr><th>الجدول</th><th>عدد الصفوف</th><th>عرض</th></tr></thead><tbody>';
      for (const table of tables) {
        const count = await global.OsamaSoftDB.countRows(table.name);
        html += `<tr><td><strong>${esc(table.name)}</strong></td><td>${count}</td><td><button class="btn-small btn-ghost db-view-table" data-table="${esc(table.name)}">عرض الصفوف</button></td></tr>`;
      }
      html += '</tbody></table>';
      tablesBox.innerHTML = html;
      tablesBox.querySelectorAll('.db-view-table').forEach(btn => {
        btn.addEventListener('click', () => showTable(btn.dataset.table));
      });
    } catch (error) {
      setStatus('غير متاحة: ' + error.message);
      tablesBox.innerHTML = '<div class="card">⚠️ قاعدة SQLite المنظمة غير متاحة في هذه البيئة الحالية.</div>';
    }
  }

  async function showTable(name) {
    const box = document.getElementById('dbUiDetail');
    if (!box || !global.OsamaSoftDB) return;
    try {
      const columns = await global.OsamaSoftDB.tableInfo(name);
      const rows = await global.OsamaSoftDB.sampleRows(name, 100);
      box.style.display = '';
      box.innerHTML = `
        <h4>الجدول: ${esc(name)}</h4>
        <h5>الأعمدة</h5>
        <pre style="white-space:pre-wrap;direction:ltr;text-align:left;overflow:auto">${esc(JSON.stringify(columns, null, 2))}</pre>
        <h5>الصفوف — حتى 100 صف</h5>
        <pre style="white-space:pre-wrap;direction:ltr;text-align:left;overflow:auto;max-height:420px">${esc(JSON.stringify(rows, null, 2))}</pre>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      box.style.display = '';
      box.innerHTML = '<div>⚠️ تعذر قراءة الجدول: ' + esc(error.message) + '</div>';
    }
  }

  async function exportDb() {
    if (!global.OsamaSoftDB) return;
    try {
      await global.OsamaSoftDB.initialize();
      const data = await global.OsamaSoftDB.exportDatabaseJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'osama-soft-database-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      alert('تعذر تصدير قاعدة البيانات: ' + error.message);
    }
  }

  function wire() {
    injectUI();
    const refresh = document.getElementById('dbUiRefresh');
    const exportBtn = document.getElementById('dbUiExport');
    if (refresh && !refresh.dataset.wired) {
      refresh.dataset.wired = '1';
      refresh.addEventListener('click', loadTables);
    }
    if (exportBtn && !exportBtn.dataset.wired) {
      exportBtn.dataset.wired = '1';
      exportBtn.addEventListener('click', exportDb);
    }
    loadTables();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
  global.OsamaSoftDatabaseUI = { refresh: loadTables, showTable };
})(window);
