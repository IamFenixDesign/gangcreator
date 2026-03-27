(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, setText, qs, f2, state } = window.GC;

  ui.table.clothing = function(list){
    const tbody = qs('#clothing-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const c of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.name}</td><td>${c.label}</td>
        <td>${f2(c.x)}, ${f2(c.y)}, ${f2(c.z)}</td>
        <td>${c.radius}</td><td>${c.icon||'fa-solid fa-shirt'}</td>
        <td>
          <button data-name="${c.name}" data-i18n="edit">
            ${locales?.t?.('edit') ?? 'Edit'}
          </button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selClothing = c;
        setVal('c-gang', c.gang); setVal('c-name', c.name); setVal('c-label', c.label);
        setVal('c-coords', `${c.x}, ${c.y}, ${c.z}`); setVal('c-h', String(Math.round(c.h||0))); setVal('c-radius', c.radius);
        setVal('c-icon', c.icon||'');
        setVal('c-prop', c.prop || '');
        ui.sections.expand('clothing-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.clothing, {
    async load(gang){
      const res = await api.post('getClothing', { gang });
      if(!res?.ok) return ui.cmsg('Error loading clothing zones');
      state.clothing = res.data || [];
      ui.table.clothing(state.clothing);
    },

    async save(){
      const gang = getVal('c-gang');
      const name = getVal('c-name');
      const label = getVal('c-label');
      const [x,y,z] = parseCoords(getVal('c-coords'));
      const h = parseFloat(getVal('c-h')||'0');
      const radius = parseFloat(qs('#c-radius')?.value || '1.75');
      const icon = getVal('c-icon') || 'fa-solid fa-shirt';
      const prop = getVal('c-prop') || '';
      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) {
        return ui.cmsg('Missing data or invalid coords (use "x, y, z")');
      }
      const editing = state.selClothing && state.selClothing.name === name;
      const res = await api.post(editing?'updateClothing':'createClothing', { gang, name, label, x, y, z, h, radius, icon, prop });
      if(res?.ok){ ui.cmsg('Clothing Saved ✅'); this.load(gang); ui.forms.clothing(); }
      else ui.cmsg(res?.error==='exists'?'That name already exists':'Error saving');
    },

    async remove(){
      const name = getVal('c-name');
      const gang = getVal('c-gang');
      if(!name) return ui.cmsg('Specify the name');
      const res = await api.post('deleteClothing', { name });
      if(res?.ok){
        ui.cmsg('Deleted 🗑️');
        this.load(gang);
        ui.forms.clothing();
      } else ui.cmsg('Error deleting');
    },

    cancel(){
      state.selClothing = null;
      ['c-name','c-label','c-coords','c-h','c-radius','c-icon','c-prop'].forEach(id=>setVal(id,''));
      ui.cmsg('');
    },

    async pickPos(){
      const p = await api.post('playerPos', {});
      if(!p) return;
      setVal('c-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
      if(p.h!=null) setVal('c-h', String(Math.round(p.h||0)));
    },

    async pickOnMap(){
      // Defensive: allow calling directly (main.js also sets these)
      state.returnTab = state.returnTab || 'clothing';
      state.returnInputId = state.returnInputId || 'c-coords';
      await api.post('pickClothingLocation', {});
    }
  });
})();
