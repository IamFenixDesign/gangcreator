(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, qs, f2, state, dom } = window.GC;

  // Normaliza iconos FontAwesome (acepta: "hammer" / "fa-hammer" / "fa-solid fa-hammer" / "fas fa-hammer")
  function normFa(icon, fallback=''){
    if(typeof icon !== 'string') icon = '';
    icon = icon.trim();
    if(!icon) icon = (typeof fallback === 'string' ? fallback.trim() : '');
    if(!icon) return '';

    // "hammer" -> "fa-solid fa-hammer"
    if(!icon.includes(' ') && !icon.startsWith('fa-')) return `fa-solid fa-${icon}`;

    // "fa-hammer" -> "fa-solid fa-hammer"
    if(!icon.includes(' ') && icon.startsWith('fa-')) return `fa-solid ${icon}`;

    // FA5 compat: "fas fa-hammer" -> "fa-solid fa-hammer"
    icon = icon
      .replace(/^fas\s+/, 'fa-solid ')
      .replace(/^far\s+/, 'fa-regular ')
      .replace(/^fab\s+/, 'fa-brands ')
      .replace(/^fa\s+/,  'fa-solid ');

    return icon;
  }


  // ======================= Craft Stations =======================
  ui.table.crafts = function(list){
    const tbody = qs('#craft-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;

    for(const c of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.name}</td><td>${c.label}</td>
        <td>${f2(c.x)}, ${f2(c.y)}, ${f2(c.z)}</td>
        <td>${c.radius}</td>
        <td>
          <i class="${normFa(c.icon, 'fa-hammer')}"></i>
          <span class="muted" style="margin-left:8px; font-size:12px;">${c.icon||''}</span>
        </td>
        <td>
          <button data-name="${c.name}" data-i18n="edit">
            ${locales?.t?.('edit') ?? 'Edit'}
          </button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selCraft = c;
        setVal('cr-gang', c.gang);
        setVal('cr-name', c.name);
        setVal('cr-label', c.label);
        setVal('cr-coords', `${c.x}, ${c.y}, ${c.z}`);
        setVal('cr-h', String(Math.round(c.h||0)));
        setVal('cr-radius', c.radius);
        setVal('cr-icon', c.icon||'');
        setVal('cr-prop', c.prop || '');
        // Bloquea la interacción del mundo mientras se edita desde la NUI
        api.post('setEditingCraft', { editing: true });
        ui.sections.expand('craft-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.crafts, {
    async load(gang){
      // FIX: endpoint real en Lua: getCrafts
      const res = await api.post('getCrafts', { gang });
      if(!res?.ok) return ui.cftmsg('Error loading craft stations');
      state.crafts = res.data || [];
      ui.table.crafts(state.crafts);
    },

    async save(){
      const gang = getVal('cr-gang');
      const name = getVal('cr-name');
      const label = getVal('cr-label');
      const [x,y,z] = parseCoords(getVal('cr-coords'));
      const h = parseFloat(getVal('cr-h')||'0');
      const radius = parseFloat(qs('#cr-radius')?.value || '1.75');
      const iconRaw = getVal('cr-icon');
      const propRaw = getVal('cr-prop');
      const icon = iconRaw === '' ? null : iconRaw;
      const prop = propRaw === '' ? null : propRaw;

      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) {
        return ui.cftmsg('Missing data or invalid coords');
      }

      const editing = !!state.selCraft && state.selCraft.name === name;

      // FIX: endpoints reales: createCraft / updateCraft
      const res = await api.post(editing ? 'updateCraft' : 'createCraft', {
        gang, name, label, x, y, z, h, radius, icon, prop
      });

      if(res?.ok){
        ui.cftmsg('Craft Station Saved ✅');
        await this.load(gang);
        ui.forms.craft();
      } else {
        ui.cftmsg(res?.error === 'exists' ? 'That name already exists' : 'Error saving');
      }
    },

    async remove(){
      const name = getVal('cr-name');
      const gang = getVal('cr-gang');
      if(!name) return ui.cftmsg('Specify the name');

      // FIX: endpoint real: deleteCraft (recibe {name})
      const res = await api.post('deleteCraft', { name });

      if(res?.ok){
        ui.cftmsg('Deleted 🗑️');
        await this.load(gang);
        ui.forms.craft();
      } else ui.cftmsg('Error deleting');
    },

    cancel(){ ui.forms.craft(); },

    async pickPos(){
      const p = await api.post('playerPos', {});
      if(!p) return;
      setVal('cr-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
      if(p.h!=null) setVal('cr-h', String(Math.round(p.h||0)));
    },

    // FIX: picker correcto para crafts
    async pickOnMap(){ await api.post('pickCraftLocation', {}); }
  });

  // ============================ Recipes ==========================
  ui.table.recipes = function(list){
    const tbody = qs('#recipes-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;

    for(const r of (list||[])){
      const tr = document.createElement('tr');
      // Keep the same table organization style used in garages:
      // consistent column order with the HTML header and edit button at the end.
      // index.html header order for recipes: Name | Label | Result | Qty | Station | (Edit)
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.label}</td>
        <td>${r.result_item ?? '-'}</td>
        <td>${r.result_amount ?? 1}</td>
        <td>${r.station ?? '-'}</td>
        <td>
          <button data-key="${(r.station ?? '')}::${r.name}" data-i18n="edit">
            ${locales?.t?.('edit') ?? 'Edit'}
          </button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selRecipe = r;

        setVal('rc-gang', r.gang);
        setVal('rc-station', r.station ?? '');
        setVal('rc-name', r.name);
        setVal('rc-label', r.label);

        // FIX: campos reales del server
        setVal('rc-amount', String(r.result_amount ?? 1));
        setVal('rc-time', String(r.craft_time ?? 0));
        setVal('rc-result', r.result_item ?? '');

        const listEl = qs('#rc-ingredients-list'); if (listEl) listEl.innerHTML = '';
        let ings = r.ingredients;

        // si viene como string JSON desde SQL
        if(typeof ings === 'string'){
          try { ings = JSON.parse(ings); } catch(e){ ings = []; }
        }
        (ings || []).forEach(i => dom.ingredients.addRow(i));
        dom.ingredients.ensureOne();

        ui.sections.expand('recipes-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.recipes, {
    ensureIngredientList(){ dom.ingredients.ensureOne(); },
    addIngredientRow(){ dom.ingredients.addRow(); },

    cancel(){ ui.forms.recipe(); },

    async load(gang, station){
      const res = await api.post('getRecipes', { gang, station: station || '' });
      if(!res?.ok) return ui.rcpmsg('Error loading recipes');
      state.recipes = res.data || [];
      ui.table.recipes(state.recipes);
    },

    async refresh(){
      const gang = getVal('rc-gang');
      const station = getVal('rc-station');
      if(!gang) return ui.rcpmsg('Pick a gang first');
      await this.load(gang, station);
      ui.rcpmsg('Refreshed ✅');
    },

    async save(){
      const gang = getVal('rc-gang');
      const station = getVal('rc-station'); // puede ser '' si permitís global
      const name = getVal('rc-name');
      const label = getVal('rc-label');

      // FIX: nombres reales
      const result_amount = parseInt(getVal('rc-amount')||'1', 10);
      const craft_time = parseInt(getVal('rc-time')||'0', 10);
      const result_item = getVal('rc-result');

      const ingredients = dom.ingredients.readAll();

      if(!gang || !name || !result_item || !ingredients.length) {
        return ui.rcpmsg('Missing data (gang/name/result/ingredients)');
      }

      const editing = !!state.selRecipe && state.selRecipe.name === name;

      // FIX: payload real del server
      const res = await api.post(editing ? 'updateRecipe' : 'createRecipe', {
        gang,
        station: station || null,
        name,
        label,
        result_item,
        result_amount,
        craft_time,
        ingredients
      });

      if(res?.ok){
        ui.rcpmsg('Recipe Saved ✅');
        await this.load(gang, station);
        ui.forms.recipe();
      } else ui.rcpmsg(res?.error==='exists' ? 'That recipe already exists' : 'Error saving');
    },

    async remove(){
      const gang = getVal('rc-gang');
      const station = getVal('rc-station');
      const name = getVal('rc-name');
      if(!gang || !name) return ui.rcpmsg('Specify gang and name');

      // FIX: deleteRecipe en Lua recibe SOLO {name}
      const res = await api.post('deleteRecipe', { name });

      if(res?.ok){
        ui.rcpmsg('Deleted 🗑️');
        await this.load(gang, station);
        ui.forms.recipe();
      } else ui.rcpmsg('Error deleting');
    }
  });
})();
