(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, qs, f2, state } = window.GC;

  ui.table.membermenus = function(list = []) {
    const tbody = qs('#mm-body');
    if (!tbody) { ui.mmmsg('Error: Member Menus table not found'); return; }

    tbody.innerHTML = '';
    const locales = window.gcLocales;

    try {
      if (!Array.isArray(list)) { ui.mmmsg('Error: invalid data when loading menus'); return; }

      if (list.length === 0) { ui.mmmsg('No menus registered'); return; }

      ui.mmmsg('');

      for (const m of list) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.name}</td>
          <td>${m.label || ''}</td>
          <td>${f2(m.x)}, ${f2(m.y)}, ${f2(m.z)}</td>
          <td>${m.radius || 1.75}</td>
          <td>${m.icon || 'fa-solid fa-users'}</td>
          <td>${m.min_grade || 0}</td>
          <td>
            <button data-name="${m.name}" class="btn btn-small" data-i18n="edit">
              ${locales?.t?.('edit') ?? 'Edit'}
            </button>
          </td>
        `;

        tr.querySelector('button')?.addEventListener('click', () => {
          state.selMemberMenu = m;
          setVal('mm-gang', m.gang || state.selected?.name || '');
          setVal('mm-name', m.name || '');
          setVal('mm-label', m.label || '');
          setVal('mm-coords', `${m.x}, ${m.y}, ${m.z}`); setVal('mm-h', String(Math.round(m.h||0)));
          setVal('mm-radius', m.radius || 1.75);
          setVal('mm-icon', m.icon || 'fa-solid fa-users');
          setVal('mm-min', m.min_grade || 0);
          setVal('mm-prop', m.prop || '');
          ui.sections.expand('mm-section');
          ui.mmmsg(`Menú "${m.name}" loaded for editing`);
        });

        tbody.appendChild(tr);
      }
    } catch (err) {
      console.error('Error en membermenus:', err);
      ui.mmmsg('Error inesperado al cargar los menús');
    }
  };

  Object.assign(handlers.membermenus, {
    async load(gang) {
      try {
        const res = await api.post('getMemberMenus', { gang });
        if (!res?.ok) {
          ui.mmmsg('❌ Error loading member menus');
          state.membermenus = [];
          ui.table.membermenus([]);
          return;
        }
        state.membermenus = res.data || [];
        ui.mmmsg(state.membermenus.length === 0 ? 'ℹ️ No menus registered for this gang' : '');
        ui.table.membermenus(state.membermenus);
      } catch (err) {
        console.error('Error al cargar membermenus:', err);
        ui.mmmsg('⚠️ Unexpected error loading menus');
      }
    },

    async save() {
      try {
        const gang     = getVal('mm-gang');
        const nameUI   = getVal('mm-name');
        const label    = getVal('mm-label');
        const [x,y,z] = parseCoords(getVal('mm-coords'));
        const h = parseFloat(getVal('mm-h')||'0');
        const radius   = parseFloat(getVal('mm-radius') || '1.75');
        const icon     = getVal('mm-icon') || 'fa-solid fa-users';
        const min_grade= parseInt(getVal('mm-min') || '0', 10);
        const prop     = getVal('mm-prop') || '';

        if (!gang || !nameUI || isNaN(x) || isNaN(y) || isNaN(z)) {
          ui.mmmsg('⚠️ Missing required data or invalid coordinates');
          return;
        }

        const original = state.selMemberMenu?.name || '';
        const editing  = !!original;

        const payload = { gang, name: editing ? original : nameUI, label, x, y, z, h, radius, icon, min_grade, prop };
        if (editing && nameUI !== original) ui.mmmsg('ℹ️ Name not changed during edit');

        ui.mmmsg('⏳ Saving menu...');
        const res = await api.post(editing?'updateMemberMenu':'createMemberMenu', payload);

        if (res?.ok) {
          ui.mmmsg('✅ Menu saved successfully');
          await this.load(gang);
          ui.forms.membermenu();
          state.selMemberMenu = null;
        } else {
          ui.mmmsg(res?.error === 'exists' ? '⚠️ That name already exists' : '❌ Error saving el menú');
        }
      } catch (err) {
        console.error('Error saving membermenu:', err);
        ui.mmmsg('⚠️ Error inesperado al guardar el menú');
      }
    },

    async remove() {
      try {
        const gang   = getVal('mm-gang');
        const nameUI = getVal('mm-name');
        const name   = state.selMemberMenu?.name || nameUI;

        if (!name) { ui.mmmsg('⚠️ Debes indicar un nombre'); return; }

        ui.mmmsg('⏳ Deleting menu...');
        const res = await api.post('deleteMemberMenu', { name });

        if (res?.ok) {
          ui.mmmsg('🗑️ Menu deleted successfully');
          await this.load(gang);
          ui.forms.membermenu();
          state.selMemberMenu = null;
        } else {
          ui.mmmsg('❌ Error deleting el menú');
        }
      } catch (err) {
        console.error('Error deleting membermenu:', err);
        ui.mmmsg('⚠️ Unexpected error deleting menu');
      }
    },

    cancel() {
      state.selMemberMenu = null;
      ['mm-name','mm-label','mm-coords','mm-h','mm-radius','mm-icon','mm-min','mm-prop'].forEach(id=>setVal(id,''));
      ui.mmmsg('ℹ️ Form cleared. Ready to create a new menu');
    },

    async pos() {
      try {
        const r = await api.post('playerPos', {});
        const d = r?.data || r;
        if (!d) { ui.mmmsg('⚠️ Could not get player position'); return; }
        setVal('mm-coords', `${f2(d.x)}, ${f2(d.y)}, ${f2(d.z)}`);
        if(d.h!=null) setVal('mm-h', String(Math.round(d.h||0)));
        ui.mmmsg('📍 Current position loaded');
      } catch (err) {
        console.error('Error obteniendo posición:', err);
        ui.mmmsg('❌ Unexpected error getting position');
      }
    },

    async pick() {
      try {
        ui.mmmsg('⏳ Selecting location...');
        state.returnTab = 'mm';
        state.returnInputId = 'mm-coords';
        await api.post('pickClothingLocation', {});
        ui.mmmsg('📍 Location selected');
      } catch (err) {
        console.error('Error seleccionando ubicación:', err);
        ui.mmmsg('⚠️ Unexpected error selecting location');
      }
    }
  });
})();
