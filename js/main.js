window.APP_VERSION = window.APP_VERSION || '1.0.1';

window.addEventListener('message', function(event) {
  const data = event && event.data;
  if (!data || data.action !== 'copy') return;

  const textToCopy = String(data.text || '');
  if (!textToCopy) return;

  const fallbackCopy = function(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
    } catch (e) {}

    document.body.removeChild(textarea);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).catch(function() {
      fallbackCopy(textToCopy);
    });
    return;
  }

  fallbackCopy(textToCopy);
});


(() => {
  // =========================== utils ===========================
  const RES = 'fenix-gangcreator';
  const SIDEBAR_PREF_KEY = 'gc-sidebar-mode';

  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const f2   = (v) => Number(v).toFixed(2);
  const nowL = (d) => new Date(d).toLocaleString();

  const setText = (id, t='') => { const el = qs('#'+id); if (el) el.innerText = t; };
  const setVal  = (id, v='') => { const el = qs('#'+id); if (el) el.value = v; };
  const getVal  = (id) => (qs('#'+id)?.value ?? '').trim();

  function syncSidebarState() {
    const sidebarEnabled = document.body.classList.contains('sidebar-mode');
    const canExpand = sidebarEnabled && !!state.selected;
    document.body.classList.toggle('sidebar-expanded', canExpand);
  }

  function applySidebarMode(enabled, persist = true) {
    const isEnabled = !!enabled;
    document.body.classList.toggle('sidebar-mode', isEnabled);
    syncSidebarState();
    const input = qs('#sidebar-mode-switch');
    if (input) input.checked = isEnabled;
    if (persist) {
      try { localStorage.setItem(SIDEBAR_PREF_KEY, isEnabled ? '1' : '0'); } catch (_) {}
    }
    closeGangDropdown();
    ui.syncHeight?.();
  }

  function initSidebarModeToggle() {
    let stored = '0';
    try { stored = localStorage.getItem(SIDEBAR_PREF_KEY) || '0'; } catch (_) {}
    applySidebarMode(stored === '1', false);

    qs('#sidebar-mode-switch')?.addEventListener('change', (e) => {
      applySidebarMode(!!e.target?.checked, true);
    });
  }

  function setSelectedGangTopbar(name) {
    const el = document.getElementById('selected-gang');
    if (!el) return;
    if (name) {
      el.textContent = name;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }


  const parseCoords = (s) => {
    if (!s) return [NaN,NaN,NaN];
    const [x,y,z] = s.split(',').map(v => parseFloat(String(v).trim()));
    return [x,y,z];
  };

  // ============================= api ============================
  const api = {
    post(name, data = {}) {
      return fetch(`https://${RES}/${name}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      }).then(r => r.json()).catch(() => null);
    }
  };

  // Normaliza respuestas de server (QB / ESX / etc)
  const isOk = (res) =>
    res === true || !!(res && (res.ok || res.success));

  // ============================ state ===========================
  const state = {
    page: 1, q: '',
    total: 0, pageSize: 15,
    selected: null,
    members: [],
    stashes: [],  selStash: null,
    garages: [],  selGarage: null,
    clothing: [], selClothing: null,
    ranks: [],    selRank: null,
    crafts: [],   selCraft: null,
    recipes: [],  selRecipe: null,
    shops: [],    selShop: null,
    membermenus: [], selMemberMenu: null,
    zones: [], selZone: null,
    peds: [], selPed: null,
    returnTab: null,
    returnInputId: null,
    resumeGang: null,
    shopItems: [],
    updateStatus: null
  };

  function renderUpdateIndicator(status) {
    state.updateStatus = status || null;

    const indicator = qs('#update-indicator');
    const popup = qs('#update-popup-card');
    const popupBody = qs('#update-popup-body');
    if (!indicator || !popup || !popupBody) return;

    const hasUpdate = !!(status && status.hasUpdate);
    indicator.classList.toggle('hidden', !hasUpdate);
    popup.classList.add('hidden');

    const current = (status && status.currentVersion) || window.APP_VERSION || 'unknown';
    const latest = (status && status.latestVersion) || 'unknown';
    const helpText = (status && status.helpText) || '';
    const portalUrl = (status && status.portalUrl) || 'https://portal.cfx.re/';

    bindUpdateIndicator();

    popupBody.innerHTML = '' +
      '<p class="update-popup-text">There is a new update available for Gang Creator.</p>' +
      '<div class="status-meta">' +
        '<div><strong>Current version:</strong> ' + current + '</div>' +
        '<div><strong>Latest version:</strong> ' + latest + '</div>' +
      '</div>' +
      '<div class="status-help muted">' + helpText + '</div>' +
      '<a class="status-link update-popup-link" href="' + portalUrl + '" target="_blank" rel="noopener noreferrer" data-external>Go to CFX Portal</a>';
  }

  function toggleUpdatePopup(force) {
    const indicator = qs('#update-indicator');
    const popup = qs('#update-popup-card');
    if (!indicator || !popup || indicator.classList.contains('hidden')) return;

    const shouldShow = typeof force === 'boolean' ? force : popup.classList.contains('hidden');
    popup.classList.toggle('hidden', !shouldShow);
  }

  function bindUpdateIndicator() {
    const indicator = qs('#update-indicator');
    const popup = qs('#update-popup-card');
    const closeBtn = qs('#update-popup-close');
    if (!indicator || !popup || indicator.dataset.boundUpdatePopup === '1') return;

    indicator.dataset.boundUpdatePopup = '1';

    indicator.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    indicator.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      indicator.blur?.();
      toggleUpdatePopup();
    });

    indicator.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleUpdatePopup();
      }
    });

    closeBtn?.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeBtn.blur?.();
      toggleUpdatePopup(false);
    });

    document.addEventListener('click', (e) => {
      if (popup.classList.contains('hidden')) return;
      if (popup.contains(e.target) || indicator.contains(e.target)) return;
      toggleUpdatePopup(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleUpdatePopup(false);
    });
  }

  function autofillGangInputs(gangName) {
    [
      's-gang', 'ga-gang', 'c-gang', 'cr-gang', 'rc-gang',
      'r-gang', 'sh-gang', 'mm-gang', 'z-gang', 'p-gang'
    ].forEach(id => setVal(id, gangName));
  }

  function resetGangSelectionUI() {
    state.selected = null;
    document.body.classList.remove('has-gang');
    syncSidebarState();
    requestAnimationFrame(() => ui.syncHeight?.());
    setSelectedGangTopbar(null);
    closeGangDropdown();
    syncGangQuickNav('gangs');
    setVal('gang-global-search', '');
    qs('#gang-global-search-clear')?.classList.add('hidden');
    renderGangGlobalResults([], '');
    qs('#gang-manage').style.display = 'none';
  }

  function resetToListView() {
    resetGangSelectionUI();
    qsa('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === 'gangs'));
    qsa('.tab-content').forEach(view => view.classList.toggle('hidden', view.id !== 'tab-gangs'));
    qsa('.section-body').forEach(body => body.classList.add('hidden'));
    qsa('.toggle-section').forEach(btn => {
      btn.textContent = '+';
      btn.setAttribute('aria-expanded', 'false');
    });
    ui.syncHeight();
  }


  const TAB_META = {
    gangs:   { key: 'selected',    labelKey: 'tab_gangs', fields: ['name', 'label', 'color'] },
    ranks:   { key: 'ranks',       labelKey: 'tab_ranks', fields: ['grade', 'label', 'name', 'isboss'] },
    members: { key: 'members',     labelKey: 'tab_members', fields: ['citizenid', 'grade', 'firstname', 'lastname', 'fivem', 'added_at'] },
    mm:      { key: 'membermenus', labelKey: 'tab_member_menus', fields: ['name', 'label', 'coords', 'radius', 'icon', 'mingrade'] },
    stashes: { key: 'stashes',     labelKey: 'tab_stashes', fields: ['name', 'label', 'coords', 'radius', 'slots', 'weight'] },
    garages: { key: 'garages',     labelKey: 'tab_garages', fields: ['name', 'label', 'coords', 'spawncoords', 'pedmodel'] },
    clothing:{ key: 'clothing',    labelKey: 'tab_clothing', fields: ['name', 'label', 'coords', 'icon'] },
    craft:   { key: 'crafts',      labelKey: 'tab_craft_stations', fields: ['name', 'label', 'coords', 'icon'] },
    recipes: { key: 'recipes',     labelKey: 'tab_recipes', fields: ['station', 'name', 'label', 'result_item', 'ingredients', 'amount', 'time_ms'] },
    shops:   { key: 'shops',       labelKey: 'tab_gang_shops', fields: ['name', 'label', 'model', 'coords', 'scenario'] },
    zones:   { key: 'zones',       labelKey: 'tab_zones', fields: ['name', 'label', 'coords', 'radius', 'icon'] },
    peds:    { key: 'peds',        labelKey: 'tab_peds', fields: ['name', 'label', 'model', 'coords', 'scenario'] },
    shopitems:{ key: 'shopItems',  labelKey: 'tab_gang_shops', fields: ['item', 'name', 'label', 'price', 'max_stock', 'stock'] }
  };


  const TAB_ICONS = {
    gangs: 'fa-list',
    ranks: 'fa-ranking-star',
    members: 'fa-users',
    mm: 'fa-user-gear',
    stashes: 'fa-box-open',
    garages: 'fa-warehouse',
    clothing: 'fa-shirt',
    craft: 'fa-hammer',
    recipes: 'fa-book',
    shops: 'fa-store',
    zones: 'fa-map',
    peds: 'fa-user'
  };

  function safeJoin(value) {
    if (Array.isArray(value)) return value.map(safeJoin).join(' ');
    if (value && typeof value === 'object') return Object.values(value).map(safeJoin).join(' ');
    return String(value ?? '');
  }

  function tabTitle(tabKey) {
    const labelKey = TAB_META[tabKey]?.labelKey;
    return window.gcLocales?.t?.(labelKey) || labelKey || tabKey;
  }

  function getTabDataset(tabKey) {
    const meta = TAB_META[tabKey];
    if (!meta) return [];
    const source = state[meta.key];
    if (tabKey === 'gangs') return state.selected ? [state.selected] : [];
    return Array.isArray(source) ? source : [];
  }

  function buildSearchText(item, fields = []) {
    if (!item) return '';
    const values = fields.map(field => safeJoin(item[field]));
    return values.join(' ').toLowerCase();
  }

  function summarizeItem(item) {
    if (!item || typeof item !== 'object') return '';
    const summaryFields = ['label', 'name', 'citizenid', 'item', 'model', 'coords', 'grade', 'station'];
    const parts = summaryFields.map((field) => item[field]).filter((value) => value !== undefined && value !== null && value !== '');
    return parts.slice(0, 4).map(safeJoin).join(' · ');
  }

  function runGangGlobalSearch(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q || !state.selected) return [];

    const results = [];
    Object.entries(TAB_META).forEach(([tabKey, meta]) => {
      if (tabKey === 'shopitems') return;
      const items = getTabDataset(tabKey);
      items.forEach((item, index) => {
        const haystack = buildSearchText(item, meta.fields);
        if (!haystack.includes(q)) return;
        results.push({
          tab: tabKey,
          index,
          title: summarizeItem(item) || `${tabTitle(tabKey)} #${index + 1}`,
          subtitle: `${tabTitle(tabKey)} · ${state.selected?.label || state.selected?.name || ''}`
        });
      });
    });

    getTabDataset('shopitems').forEach((item, index) => {
      const haystack = buildSearchText(item, TAB_META.shopitems.fields);
      if (!haystack.includes(q)) return;
      results.push({
        tab: 'shops',
        index,
        title: summarizeItem(item) || `Item #${index + 1}`,
        subtitle: `${tabTitle('shops')} · Items`
      });
    });

    return results.slice(0, 50);
  }

  function renderGangGlobalResults(results = [], rawQuery = '') {
    const wrap = qs('#gang-global-results');
    if (!wrap) return;

    const query = String(rawQuery || '').trim();
    if (!query || !state.selected) {
      wrap.innerHTML = '';
      wrap.classList.add('hidden');
      return;
    }

    if (!results.length) {
      const msg = window.gcLocales?.t?.('gang_global_search_empty') || 'No se encontraron resultados en esta gang.';
      wrap.innerHTML = `<div class="gang-global-empty">${msg}<small>${state.selected?.label || state.selected?.name || ''}</small></div>`;
      wrap.classList.remove('hidden');
      return;
    }

    wrap.innerHTML = results.map((result) => `
      <button class="gang-global-result" type="button" data-tab="${result.tab}">
        <strong>${result.title}</strong>
        <small>${result.subtitle}</small>
      </button>
    `).join('');
    wrap.classList.remove('hidden');

    qsa('.gang-global-result', wrap).forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab || 'gangs';
        handlers.tabs.show(tab);
        wrap.classList.add('hidden');
      });
    });
  }

  function syncGangQuickNav(tabKey = 'gangs') {
    const tools = qs('#gang-nav-tools');
    const label = qs('#gang-tab-dropdown-label');
    const icon = qs('#gang-tab-dropdown-icon');
    const toggle = qs('#gang-tab-dropdown-toggle');
    const menu = qs('#gang-tab-dropdown-menu');

    if (tools) tools.classList.toggle('hidden', !state.selected);
    closeGangDropdown();

    const activeKey = tabKey && tabKey !== 'gangs' ? tabKey : 'gangs';
    const labelText = activeKey === 'gangs'
      ? (window.gcLocales?.t?.('gang_sections') || 'Sections')
      : tabTitle(activeKey);

    if (label) label.textContent = labelText;
    if (icon) icon.className = `fa-solid ${TAB_ICONS[activeKey] || 'fa-grid-2'}`;

    qsa('.quick-nav-option').forEach((option) => {
      option.classList.toggle('active', option.dataset.tab === tabKey);
    });
  }


  function closeGangDropdown() {
    const menu = qs('#gang-tab-dropdown-menu');
    const toggle = qs('#gang-tab-dropdown-toggle');
    if (menu) {
      menu.classList.add('hidden');
      menu.classList.remove('drop-up', 'drop-down');
      menu.style.left = '';
      menu.style.right = '';
      menu.style.top = '';
      menu.style.bottom = '';
      menu.style.minWidth = '';
      menu.style.maxHeight = '';
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('dropdown-open');
  }

  function positionGangDropdown() {
    const menu = qs('#gang-tab-dropdown-menu');
    const toggle = qs('#gang-tab-dropdown-toggle');
    if (!menu || !toggle || menu.classList.contains('hidden')) return;

    const gap = 8;
    const viewportPadding = 10;

    menu.classList.remove('drop-up', 'drop-down');
    menu.style.left = '0px';
    menu.style.right = 'auto';
    menu.style.top = 'calc(100% + 8px)';
    menu.style.bottom = 'auto';
    menu.style.minWidth = `${Math.max(toggle.offsetWidth, 250)}px`;
    menu.style.maxHeight = '';

    const toggleRect = toggle.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const preferredHeight = Math.min(menu.scrollHeight || menuRect.height, 420);
    const spaceBelow = Math.max(0, window.innerHeight - toggleRect.bottom - viewportPadding - gap);
    const spaceAbove = Math.max(0, toggleRect.top - viewportPadding - gap);
    const dropUp = spaceBelow < Math.min(preferredHeight, 260) && spaceAbove > spaceBelow;

    const availableHeight = Math.max(140, dropUp ? spaceAbove : spaceBelow);
    menu.style.maxHeight = `${Math.min(420, availableHeight)}px`;
    menu.classList.add(dropUp ? 'drop-up' : 'drop-down');

    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth - viewportPadding) {
        menu.style.left = 'auto';
        menu.style.right = '0px';
      }
      if (rect.left < viewportPadding) {
        menu.style.left = `${viewportPadding - toggleRect.left}px`;
        menu.style.right = 'auto';
      }
    });
  }

  function openGangDropdown() {
    const menu = qs('#gang-tab-dropdown-menu');
    const toggle = qs('#gang-tab-dropdown-toggle');
    if (!menu || !toggle) return;
    menu.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('dropdown-open');
    positionGangDropdown();
  }

  function toggleGangDropdown() {
    const menu = qs('#gang-tab-dropdown-menu');
    if (!menu) return;
    if (menu.classList.contains('hidden')) openGangDropdown();
    else closeGangDropdown();
  }

  // ============================== ui ============================
  const ui = {
    toast(t){ setText('form-msg', t) },
    mmsg(t){ setText('members-msg', t) },
    smsg(t){ setText('stash-msg', t) },
    cmsg(t){ setText('clothing-msg', t) },
    rmsg(t){ setText('ranks-msg', t) },
    cftmsg(t){ setText('craft-msg', t) },
    rcpmsg(t){ setText('recipes-msg', t) },
    mmmsg(t){ setText('mm-msg', t); },
    shmsg(t){ setText('shops-msg', t); },
    simsg(t){ setText('shopitems-msg', t); },
    zmsg(t){ setText('zones-msg', t); },
    pmsg(t){ setText('peds-msg', t); },

    // secciones plegables
    sections: {
      expand(targetId){
        if(!targetId) return;
        const section = qs('#'+targetId);
        if(section) section.classList.remove('hidden');
        const btn = qs(`.toggle-section[data-target="${targetId}"]`);
        if(btn){ btn.textContent = '−'; btn.setAttribute('aria-expanded','true'); }

        // gang-edit <-> members-section deben ir sincronizados
        if (targetId === 'gang-edit' || targetId === 'members-section') {
          const otherId = targetId === 'gang-edit' ? 'members-section' : 'gang-edit';
          const otherSection = qs('#'+otherId);
          const otherBtn = qs(`.toggle-section[data-target="${otherId}"]`);
          if (otherSection) otherSection.classList.remove('hidden');
          if (otherBtn){ otherBtn.textContent = '−'; otherBtn.setAttribute('aria-expanded','true'); }
        }

        ui.syncHeight();
      }
    },

    syncHeight(){
      const win = qs('.window');
      if(!win) return;

      // Mantener altura compacta cuando se expande el formulario de Shops.
      // Evita que la NUI "crezca" demasiado al crear/editar una tienda.
      const shopsTabVisible = !qs('#tab-shops')?.classList.contains('hidden');
      const shopsExpanded = !qs('#shops-section')?.classList.contains('hidden');
      document.body.classList.toggle('compact-shops', Boolean(shopsTabVisible && shopsExpanded));

      // Limpiar overrides inline (se controla por CSS + clases)
      win.style.height = '';
      win.style.maxHeight = '';
    },

    forms: {
      stash(){
        const g = state.selected?.name || '';
        ['s-name','s-label','s-coords','s-radius','s-slots','s-weight','s-prop','s-h'].forEach(id=>setVal(id,''));
        setVal('s-gang', g); ui.smsg('');
        state.selStash = null;
      },
      garage(){
        const g = state.selected?.name || '';
        ['ga-name','ga-label','ga-coords','ga-h','ga-radius','ga-spawn','ga-spawn-h','ga-ped','ga-ped-coords','ga-ped-h'].forEach(id=>setVal(id,''));
        setVal('ga-gang', g);
        setText('garage-msg','');
        state.selGarage = null;
      },
      clothing(){
        const g = state.selected?.name || '';
        ['c-name','c-label','c-coords','c-radius','c-icon','c-prop','c-h'].forEach(id=>setVal(id,''));
        setVal('c-gang', g); ui.cmsg('');
        state.selClothing = null;
      },
      craft(){
        const g = state.selected?.name || '';
        ['cr-name','cr-label','cr-coords','cr-radius','cr-icon','cr-prop','cr-h'].forEach(id=>setVal(id,''));
        setVal('cr-gang', g); ui.cftmsg('');
        // Evita que se abra el menú del mundo mientras se edita en NUI
        api.post('setEditingCraft', { editing: false });
        state.selCraft = null;
      },
      recipe(){
        const g = state.selected?.name || '';
        ['rc-station','rc-name','rc-label','rc-amount','rc-time','rc-result'].forEach(id=>setVal(id,''));
        setVal('rc-gang', g);
        const listEl = document.getElementById('rc-ingredients-list'); if (listEl) listEl.innerHTML = '';
        ui.rcpmsg('');
        state.selRecipe = null;
      },
      shop(){
        const g = state.selected?.name || '';
        ['sh-name','sh-label','sh-model','sh-coords','sh-h','sh-radius','sh-icon','sh-scenario','sh-restock'].forEach(id=>setVal(id,''));
        setVal('sh-gang', g); ui.shmsg(''); ui.simsg('');
        ['si-item','si-label','si-price','si-max','si-stock'].forEach(id=>setVal(id,''));
        state.selShop = null;
      },
      membermenu(){
        const g = state.selected?.name || '';
        ['mm-name','mm-label','mm-coords','mm-radius','mm-icon','mm-min','mm-prop','mm-h'].forEach(id=>setVal(id,''));
        setVal('mm-gang', g); ui.mmmsg('');
        state.selMemberMenu = null;
      },
      ped(){
        const g = state.selected?.name || '';
        ['p-name','p-label','p-model','p-coords','p-h','p-radius','p-icon','p-scenario','p-reaction-radius','p-reaction-scenario'].forEach(id=>setVal(id,''));
        setVal('p-gang', g); ui.pmsg('');
        state.selPed = null;
      }
    },

    showApp(v) {
      const app = qs('#app');
      if (!app) return;
      app.classList.toggle('hidden', !v);

      // Si se oculta por "pick with marker", no resetea estado
      if (!v) {
        const suspending = !!(state.returnTab || state.returnInputId);
        if (suspending) return;

        // Cierre real: reset total
        state.selected = null;
        state.members = [];
        state.selStash = state.selGarage = state.selClothing = state.selRank = state.selCraft = state.selRecipe = state.selShop = state.selMemberMenu = null;

        document.body.classList.remove('has-gang');
        syncSidebarState();
        setSelectedGangTopbar(null);
        syncGangQuickNav('gangs');
        qs('#gang-global-search-clear')?.classList.add('hidden');
        renderGangGlobalResults([], '');

        const tabs = qsa('.tabs .tab');
        const views = qsa('.tab-content');
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'gangs'));
        views.forEach(vw => vw.classList.toggle('hidden', vw.id !== 'tab-gangs'));

        const gm = qs('#gang-manage');
        if (gm) gm.style.display = 'none';

        ['g-name','g-label','s-gang','c-gang','cr-gang','rc-gang','r-gang','sh-gang','mm-gang','z-gang','p-gang'].forEach(id => setVal(id,''));
        ['form-msg','members-msg','stash-msg','clothing-msg','ranks-msg','craft-msg','recipes-msg','mm-msg','shops-msg','shopitems-msg'].forEach(id => setText(id,''));

        qsa('.section-body').forEach(b => b.classList.add('hidden'));
        qsa('.toggle-section').forEach(btn => { btn.innerText = '+'; btn.setAttribute('aria-expanded','false'); });
      }
    },


    table: {
      gangs(res){
        const tbody = qs('#gangs-body'); if(!tbody) return;
        tbody.innerHTML = '';
        const locales = window.gcLocales;
        for(const g of (res?.data||[])){
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <span class="color-dot" style="background:${g.color||'#7e22ce'}"></span>
              <button class="btn-edit-gang" title="Editar gang" aria-label="Editar gang"><i class="fa-solid fa-pen-to-square"></i></button>
            </td>
            <td>${g.name}</td>
            <td>${g.label}</td>
            <td>${nowL(g.created_at)}</td>
          `;
          tr.addEventListener('click', ()=> handlers.gangs.select(g));
          tr.querySelector('.btn-edit-gang').addEventListener('click', (e)=>{
            e.stopPropagation();
            handlers.gangs.openEditModal?.(g);
          });
          tbody.appendChild(tr);
        }
        setText('page', `${res.page} / ${Math.max(1, Math.ceil(res.total / res.pageSize))}`);

        const btnPrev = qs('#prev');
        if (btnPrev) btnPrev.disabled = (res.page || 1) <= 1;

        const btnNext = qs('#next');
        if (btnNext) btnNext.disabled = (res.page * res.pageSize) >= res.total;
      }
    } // se completa en los demás archivos

  };

  // =========================== dom bits =========================
  const dom = {
    ingredients: {
      addRow(initial={item:'', amount:1}){
        const list = qs('#rc-ingredients-list'); if(!list) return;
        const row = document.createElement('div');
        row.className = 'row'; row.style.alignItems='center';
        row.innerHTML = `
          <input class="rc-ing-item" type="text" placeholder="item (ej. metalscrap)" value="${initial.item||''}" style="flex:1;" />
          <input class="rc-ing-amount" type="number" min="1" value="${initial.amount||1}" style="width:120px; margin-left:8px;" />
          <button class="rc-ing-del danger" title="Eliminar" aria-label="Eliminar" style="margin-left:8px;"><i class="fa-solid fa-trash"></i></button>
        `;
        row.querySelector('.rc-ing-del').addEventListener('click', ()=> row.remove());
        list.appendChild(row);
      },
      ensureOne(){
        const list = qs('#rc-ingredients-list');
        if (list && !list.querySelector('.rc-ing-item')) this.addRow();
      },
      readAll(){
        return qsa('#rc-ingredients-list .row').map(row=>{
          const item = row.querySelector('.rc-ing-item')?.value.trim() || '';
          const amount = parseInt(row.querySelector('.rc-ing-amount')?.value || '1', 10);
          return item ? { item, amount } : null;
        }).filter(Boolean);
      }
    }
  };

  // =========================== handlers (skeleton) =========================
  const handlers = {
    tabs: {
      show(name='gangs', options = {}){
        const preserveSelection = !!options.preserveSelection;
        if (name === 'crafts') name = 'craft';
        const t = qs(`.tab[data-tab="${name}"]`) || qs('.tab[data-tab="gangs"]');
        if(!t) return;
        if (!t.dataset.tab) return;

        if(name !== 'gangs' && !state.selected){
          ui.toast('Select a gang first');
          return;
        }

        if (name === 'gangs' && !preserveSelection) {
          resetGangSelectionUI();
        }

        qs('.tab.active')?.classList.remove('active');
        t.classList.add('active');
        qsa('.tab-content').forEach(c=>c.classList.add('hidden'));
        qs('#tab-'+name)?.classList.remove('hidden');
        syncGangQuickNav(name);

        ui.syncHeight();

        if(name === 'gangs' && state.selected){
          setVal('s-gang', state.selected.name); handlers.stashes.load?.(state.selected.name);
          setVal('ga-gang', state.selected.name); handlers.garages.load?.(state.selected.name);
          setVal('c-gang', state.selected.name); handlers.clothing.load?.(state.selected.name);
          setVal('cr-gang', state.selected.name); handlers.crafts.load?.(state.selected.name);
          setVal('rc-gang', state.selected.name); handlers.recipes.load?.(state.selected.name, '');
          setVal('sh-gang', state.selected.name); handlers.shops.load?.(state.selected.name);
          setVal('mm-gang', state.selected.name); handlers.membermenus.load?.(state.selected.name);
          setVal('z-gang', state.selected.name); handlers.zones.load?.(state.selected.name);
          setVal('p-gang', state.selected.name); handlers.peds.load?.(state.selected.name);
          qs('#gang-manage').style.display='grid';
        }
      },
      init(){
        qsa('.tab[data-tab]').forEach(t=>{
          t.addEventListener('click', ()=> this.show(t.dataset.tab));
        });

        qs('#gang-tab-dropdown-toggle')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          if (!state.selected) return;
          toggleGangDropdown();
        });

        qsa('.quick-nav-option').forEach((option) => {
          option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tab = option.dataset.tab || 'gangs';
            closeGangDropdown();
            this.show(tab);
          });
        });

        qs('#gang-tab-dropdown-menu')?.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        qsa('.section-body').forEach(body => body.classList.add('hidden'));
        qsa('.toggle-section').forEach(btn => {
          btn.innerText = '+';
          btn.setAttribute('aria-expanded', 'false');
        });
      }
    },

    gangs: {
      async load(){
        const res = await api.post('getGangs', { page: state.page, q: state.q });
        if (!res?.ok) { ui.toast('Error.'); return; }
        state.page     = res.page ?? state.page;
        state.total    = res.total ?? 0;
        state.pageSize = res.pageSize ?? state.pageSize;
        ui.table.gangs?.(res);
      },

      select(g){
        state.selected = g;
        document.body.classList.add('has-gang');
        syncSidebarState();
        requestAnimationFrame(() => ui.syncHeight?.());
        setSelectedGangTopbar(g.label || g.name);
        autofillGangInputs(g.name);
        qs('#gang-manage').style.display='grid';
        setVal('g-name', g.name); setVal('g-label', g.label); setVal('g-color', g.color || '#7e22ce');
        syncGangQuickNav('gangs');
        setVal('gang-global-search', '');
        qs('#gang-global-search-clear')?.classList.add('hidden');
        renderGangGlobalResults([], '');

        this.toTab();
        handlers.members.load?.(g.name);
        setVal('s-gang', g.name); handlers.stashes.load?.(g.name);
        setVal('ga-gang', g.name); handlers.garages.load?.(g.name);
        setVal('c-gang', g.name); handlers.clothing.load?.(g.name);
        setVal('cr-gang', g.name); handlers.crafts.load?.(g.name);
        setVal('rc-gang', g.name); handlers.recipes.load?.(g.name, '');
        setVal('r-gang', g.name);  handlers.ranks.load?.(g.name);
        setVal('sh-gang', g.name); handlers.shops.load?.(g.name);
        setVal('mm-gang', g.name); handlers.membermenus.load?.(g.name);
        setVal('z-gang', g.name);  handlers.zones.load?.(g.name);
        setVal('p-gang', g.name);  handlers.peds.load?.(g.name);
      },

      toTab(){ handlers.tabs.show('gangs', { preserveSelection: true }); },

      // se completan en create.js / edit.js / remove.js
    },

    members: {},
    stashes: {},
    garages: {},
    clothing: {},
    ranks: {},
    crafts: {},
    recipes: {},
    shops: {},
    membermenus: {},
    zones: {},
    peds: {}
  };

  // ======================== global listeners ====================
  const listeners = {
    nui(){
      window.addEventListener('message', (e)=>{
        const { action, value } = e.data || {};

        if (action === 'visible') {
          if (value === false) {
            const activeTab = qs('.tab.active');
            state.returnTab = activeTab ? activeTab.dataset.tab : state.returnTab;
            state.resumeGang = state.selected || state.resumeGang;

            ui.showApp(false);
            return;
          }

          ui.showApp(true);
          handlers.gangs.load();
          resetToListView();

          if (state.resumeGang) {
            handlers.gangs.select(state.resumeGang);
            state.resumeGang = null;
          }

          if (state.returnTab) {
            if (state.selected) {
              handlers.tabs.show(state.returnTab, { preserveSelection: true });

              const sectionEl = qs(`#${state.returnTab}-section`);
              if (sectionEl) sectionEl.classList.remove('hidden');

              const toggleBtn = qs(`.toggle-section[data-target="${state.returnTab}-section"]`);
              if (toggleBtn) {
                toggleBtn.innerText = '−';
                toggleBtn.setAttribute('aria-expanded', 'true');
              }
            }

            state.returnTab = null;
          }

          return;
        }

        if (action === 'gangs:refresh') {
          handlers.gangs.load();
          return;
        }

        if (action === 'updateStatus') {
          renderUpdateIndicator(value || null);
          return;
        }

        if(action === 'updateStashes'){
          state.stashes = value || [];
          ui.table.stashes?.(state.stashes);
        }

        if(action === 'updateGarages'){
          state.garages = value || [];
          ui.table.garages?.(state.garages);
        }

        if(action === 'updateClothing'){
          state.clothing = value || [];
          ui.table.clothing?.(state.clothing);
        }

        if(action === 'updateCrafts'){
          state.crafts = value || [];
          ui.table.crafts?.(state.crafts);
        }

        if (action === 'pickedCoords' && value) {
          const { x, y, z } = value;
          const val = `${f2(x)}, ${f2(y)}, ${f2(z)}`;
          const target = state.returnInputId || 'mm-coords';
          setVal(target, val);
          state.returnInputId = null;
        }

        if(action === 'updateShops'){
          state.shops = value || [];
          ui.table.shops?.(state.shops);
        }

        if(action === 'updateMemberMenus'){
          state.membermenus = value || [];
          ui.table.membermenus?.(state.membermenus);
        }

        if(action === 'updateZones'){
          state.zones = value || [];
          ui.table.zones?.(state.zones);
        }

        if(action === 'updatePeds'){
          state.peds = value || [];
          ui.table.peds?.(state.peds);
        }

        if(action === 'updateRanks'){
          const list = Array.isArray(value) ? value : [];
          state.ranks = list;
          ui.table.ranks?.(list);
        }

        if(action === 'updateRecipes'){
          const list = Array.isArray(value) ? value : [];
          state.recipes = list;
          ui.table.recipes?.(list);
        }
      });

      window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.action === 'members:refresh') {
          fetch(`https://${RES}/getMembers`, {
            method: 'POST',
            body: JSON.stringify({ gang: data.gang })
          })
          .then(res => res.json())
          .then(members => {
            window.updateMembersUI?.(members);
          });
        }
      });
    },

    base(){
      qs('#close')?.addEventListener('click', ()=>{
        ui.showApp(false);
        api.post('close');
      });

      handlers.tabs.init();
      handlers.gangs.bindEditModalOnce?.();

      qs('#search')?.addEventListener('input', (e)=>{
        state.q = e.target.value;
        state.page = 1;
        handlers.gangs.load();
      });

      qs('#gang-global-search')?.addEventListener('input', (e) => {
        const query = e.target.value || '';
        qs('#gang-global-search-clear')?.classList.toggle('hidden', !String(query).trim());
        renderGangGlobalResults(runGangGlobalSearch(query), query);
      });

      const clearGangGlobalSearch = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        const searchInput = qs('#gang-global-search');
        if (!searchInput) return;

        searchInput.value = '';
        setVal('gang-global-search', '');
        qs('#gang-global-search-clear')?.classList.add('hidden');
        renderGangGlobalResults([], '');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
      };

      qs('#gang-global-search-clear')?.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });

      qs('#gang-global-search-clear')?.addEventListener('click', clearGangGlobalSearch);

      document.addEventListener('click', (e) => {
        const results = qs('#gang-global-results');
        const searchWrap = qs('.quick-nav-search-wrap');
        const menu = qs('#gang-tab-dropdown-menu');
        const dropdown = qs('.quick-nav-dropdown');
        if (results && searchWrap && !searchWrap.contains(e.target)) results.classList.add('hidden');
        if (menu && dropdown && !dropdown.contains(e.target) && !menu.contains(e.target)) {
          closeGangDropdown();
        }
      });

      window.addEventListener('resize', () => {
        if (!qs('#gang-tab-dropdown-menu')?.classList.contains('hidden')) positionGangDropdown();
      });

      window.addEventListener('scroll', () => {
        if (!qs('#gang-tab-dropdown-menu')?.classList.contains('hidden')) positionGangDropdown();
      }, true);

      qs('#prev')?.addEventListener('click', ()=>{
        if (state.page > 1) {
          state.page--;
          handlers.gangs.load();
        }
      });

      qs('#next')?.addEventListener('click', ()=>{
        if ((state.page * state.pageSize) >= state.total) {
          ui.toast('Last page');
          return;
        }
        state.page++;
        handlers.gangs.load();
      });

      // Crear gang
      qs('#a-create')?.addEventListener('click', ()=> handlers.gangs.createFromModal?.());

      // Guardar / eliminar gang (form principal)
      qs('#save')?.addEventListener('click', ()=> handlers.gangs.save?.());
      qs('#remove')?.addEventListener('click', ()=> handlers.gangs.remove?.());
      qs('#btn-back')?.addEventListener('click', ()=>{
        resetToListView();
      });
      qs('#cancel-gang')?.addEventListener('click', ()=> handlers.gangs.cancelEdit?.());

      // Members
      qs('#m-add')?.addEventListener('click', ()=> handlers.members.add?.());
      qs('#mi-close')?.addEventListener('click', ()=> handlers.members.closeInfo?.());
      qs('#member-info-modal')?.addEventListener('click', (e)=>{
        if(e.target.id === 'member-info-modal') handlers.members.closeInfo?.();
      });

      // Stashes
      qs('#s-pos')?.addEventListener('click', ()=> handlers.stashes.pickPos?.());
      qs('#s-pick')?.addEventListener('click', ()=>{
        state.returnTab = 'stashes';
        state.returnInputId = 's-coords';
        handlers.stashes.pickOnMap?.();
      });
      qs('#s-save')?.addEventListener('click', ()=> handlers.stashes.save?.());
      qs('#s-del')?.addEventListener('click', ()=> handlers.stashes.remove?.());
      qs('#s-cancel')?.addEventListener('click', ()=> handlers.stashes.cancel?.());

      // Clothing
      qs('#c-pos')?.addEventListener('click', ()=> handlers.clothing.pickPos?.());
      qs('#c-pick')?.addEventListener('click', ()=>{
        state.returnTab = 'clothing';
        state.returnInputId = 'c-coords';
        handlers.clothing.pickOnMap?.();
      });
      qs('#c-save')?.addEventListener('click', ()=> handlers.clothing.save?.());
      qs('#c-del')?.addEventListener('click', ()=> handlers.clothing.remove?.());
      qs('#c-cancel')?.addEventListener('click', ()=> handlers.clothing.cancel?.());

      // Colapsables (sync)
      qsa('.toggle-section').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const targetId = btn.dataset.target;
          const section = qs('#'+targetId);
          if(!section) return;
          const willHide = !section.classList.contains('hidden');
          section.classList.toggle('hidden', willHide);
          btn.textContent = willHide ? '+' : '−';
          btn.setAttribute('aria-expanded', willHide ? 'false' : 'true');
          ui.syncHeight();

          if (targetId === 'gang-edit' || targetId === 'members-section') {
            const otherId = targetId === 'gang-edit' ? 'members-section' : 'gang-edit';
            const otherSection = qs('#'+otherId);
            const otherBtn = qs(`.toggle-section[data-target="${otherId}"]`);
            if (otherSection && otherBtn) {
              otherSection.classList.toggle('hidden', willHide);
              otherBtn.textContent = willHide ? '+' : '−';
              otherBtn.setAttribute('aria-expanded', willHide ? 'false' : 'true');
            }
          }
        });
      });

      // Ranks
      qs('#r-save')?.addEventListener('click', ()=> handlers.ranks.save?.());
      qs('#r-del')?.addEventListener('click', ()=> handlers.ranks.remove?.());
      qs('#r-cancel')?.addEventListener('click', ()=> handlers.ranks.cancel?.());

      // Crafts
      qs('#cr-pos')?.addEventListener('click', ()=> handlers.crafts.pickPos?.());
      qs('#cr-pick')?.addEventListener('click', ()=>{
        state.returnTab = 'craft';
        state.returnInputId = 'cr-coords';
        handlers.crafts.pickOnMap?.();
      });
      qs('#cr-save')?.addEventListener('click', ()=> handlers.crafts.save?.());
      qs('#cr-del')?.addEventListener('click', ()=> handlers.crafts.remove?.());
      qs('#cr-cancel')?.addEventListener('click', ()=> handlers.crafts.cancel?.());

      // Recipes
      qs('#rc-save')?.addEventListener('click', ()=> handlers.recipes.save?.());
      qs('#rc-del')?.addEventListener('click', ()=> handlers.recipes.remove?.());
      qs('#rc-cancel')?.addEventListener('click', ()=> handlers.recipes.cancel?.());
      qs('#rc-refresh')?.addEventListener('click', ()=> handlers.recipes.refresh?.());
      qs('#rc-add-ing')?.addEventListener('click', ()=> handlers.recipes.addIngredientRow?.());
      document.addEventListener('DOMContentLoaded', ()=> handlers.recipes.ensureIngredientList?.());

      // Shops
      qs('#sh-pick-pos')?.addEventListener('click', ()=> handlers.shops.pickPos?.());
      qs('#sh-pick-map')?.addEventListener('click', ()=> handlers.shops.pickOnMap?.());
      qs('#sh-save')?.addEventListener('click', ()=> handlers.shops.save?.());
      qs('#sh-remove')?.addEventListener('click', ()=> handlers.shops.remove?.());
      qs('#sh-cancel')?.addEventListener('click', ()=> handlers.shops.cancel?.());
      qs('#si-save')?.addEventListener('click', ()=> handlers.shops.saveItem?.());
      qs('#sh-restock-now')?.addEventListener('click', ()=> handlers.shops.restock?.());

      // Zones
      qs('#z-pos')?.addEventListener('click', ()=> handlers.zones.pickPos?.());
      qs('#z-pick')?.addEventListener('click', ()=>{
        state.returnTab = 'zones';
        state.returnInputId = 'z-coords';
        handlers.zones.pickOnMap?.();
      });
      qs('#z-save')?.addEventListener('click', ()=> handlers.zones.save?.());
      qs('#z-del')?.addEventListener('click', ()=> handlers.zones.remove?.());
      qs('#z-cancel')?.addEventListener('click', ()=> handlers.zones.cancel?.());

      // MemberMenus
      qs('#mm-pos')?.addEventListener('click', ()=> handlers.membermenus.pos?.());
      qs('#mm-pick')?.addEventListener('click', ()=>{
        state.returnTab = 'mm';
        state.returnInputId = 'mm-coords';
        handlers.membermenus.pick?.();
      });
      qs('#mm-save')  ?.addEventListener('click', ()=> handlers.membermenus.save?.());
      qs('#mm-del')   ?.addEventListener('click', ()=> handlers.membermenus.remove?.());
      qs('#mm-cancel')?.addEventListener('click', ()=> handlers.membermenus.cancel?.());

      // === i18n boot ===
      window.gcLocales?.init?.();
    }
  };

    // ======================== draggable UI =======================
  // Permite mover toda la interfaz (contenedor #app) por la pantalla.
  // Arrastre: click + drag en la barra de título, excepto sobre controles (botones/selects/inputs).
  const initDraggableUI = () => {
    const app = qs('#app');
    const handle = qs('.titlebar');
    if (!app || !handle) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    const getBounds = () => {
      const rect = app.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Deja un margen para no "perder" la ventana fuera de pantalla
      const margin = 40;

      return {
        rect,
        minLeft: -rect.width + margin,
        maxLeft: vw - margin,
        minTop: 0,
        maxTop: vh - margin
      };
    };

    const normalizeInitialPosition = () => {
      // Si #app está centrado con transform, lo convertimos a left/top fijo para poder arrastrar sin saltos
      const rect = app.getBoundingClientRect();
      app.style.left = rect.left + 'px';
      app.style.top = rect.top + 'px';
      app.style.transform = 'none';
    };

    const isInteractive = (el) =>
      !!el.closest('button, select, input, textarea, a, [role="button"], .titlebar-controls');

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return; // solo click izquierdo (mouse)
      if (isInteractive(e.target)) return;

      normalizeInitialPosition();

      dragging = true;
      app.classList.add('dragging');
      handle.setPointerCapture?.(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;

      const rect = app.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const b = getBounds();
      const nextLeft = clamp(startLeft + dx, b.minLeft, b.maxLeft);
      const nextTop  = clamp(startTop + dy, b.minTop,  b.maxTop);

      app.style.left = nextLeft + 'px';
      app.style.top  = nextTop + 'px';
    });

    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      app.classList.remove('dragging');
      try { handle.releasePointerCapture?.(e.pointerId); } catch (_) {}
    };

    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);

    // En resize, re-clampa por si quedó fuera
    window.addEventListener('resize', () => {
      if (!app.style.left || !app.style.top) return;
      const b = getBounds();
      const left = parseFloat(app.style.left) || 0;
      const top  = parseFloat(app.style.top) || 0;
      app.style.left = clamp(left, b.minLeft, b.maxLeft) + 'px';
      app.style.top  = clamp(top,  b.minTop,  b.maxTop) + 'px';
    });
  };


// ============================ bootstrap =======================
  const bootstrap = () => {
    listeners.nui();
    listeners.base();
    initSidebarModeToggle();
    initDraggableUI();
    window.onload = ()=>{
      api.post('canOpen', {}).then(()=>{
        handlers.gangs.load();
      });
    };
  };

  // Exponer core
  window.GC = {
    __customTabNavigation: true,
    RES, qs, qsa, f2, nowL, setText, setVal, getVal, parseCoords,
    api, isOk, state, ui, dom, handlers
  };

  window._GangApp = { state, handlers }; // debug

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
