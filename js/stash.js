(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, setText, qs, f2, state } = window.GC;

  ui.table.stashes = function(list){
    const tbody = qs('#stashes-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const s of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td><td>${s.label}</td>
        <td>${f2(s.x)}, ${f2(s.y)}, ${f2(s.z)}</td>
        <td>${s.radius}</td><td>${s.slots}</td><td>${s.weight}</td>
        <td>
          <button data-name="${s.name}" data-i18n="edit">
            ${locales?.t?.('edit') ?? 'Edit'}
          </button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selStash = s;
        setVal('s-gang', s.gang); setVal('s-name', s.name);
        setVal('s-label', s.label); setVal('s-coords', `${s.x}, ${s.y}, ${s.z}`); setVal('s-h', String(Math.round(s.h||0)));
        setVal('s-radius', s.radius); setVal('s-slots', s.slots); setVal('s-weight', s.weight);
        setVal('s-prop', s.prop || '');
        ui.sections.expand('stashes-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.stashes, {
    async load(gang){
      const res = await api.post('getStashes', { gang });
      if(!res?.ok) return ui.smsg('Error loading stashes');
      state.stashes = res.data || [];
      ui.table.stashes(state.stashes);
    },

    async save(){
      const gang = getVal('s-gang');
      const name = getVal('s-name');
      const label = getVal('s-label');
      const originalName = state.selStash?.name || name;
      const [x,y,z] = parseCoords(getVal('s-coords'));
      const h = parseFloat(getVal('s-h')||'0');
      const radius = parseFloat(qs('#s-radius')?.value || '1.75');
      const slots  = parseInt(qs('#s-slots')?.value || '100', 10);
      const weight = parseInt(qs('#s-weight')?.value || '100000', 10);
      const prop   = getVal('s-prop') || '';
      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) return ui.smsg('Missing data or invalid coords (use "x, y, z")');
      const editing = !!state.selStash;
      const res = await api.post(editing?'updateStash':'createStash', { gang, name, originalName, label, x, y, z, h, radius, slots, weight, prop });
      if(res?.ok){
        ui.smsg('Stash Saved ✅');
        this.load(gang);
        ui.forms.stash();
      } else ui.smsg(res?.error==='exists'?'That name already exists':'Error saving');
    },

    async remove(){
      const name = getVal('s-name');
      const gang = getVal('s-gang');
      if(!name) return ui.smsg('Specify the name');
      const res = await api.post('deleteStash', { name });
      if(res?.ok){
        ui.smsg('Deleted 🗑️');
        this.load(gang);
        ui.forms.stash();
      } else ui.smsg('Error deleting');
    },

    cancel(){
      state.selStash = null;
      ['s-name','s-label','s-coords','s-h','s-radius','s-slots','s-weight','s-prop'].forEach(id=>setVal(id,''));
      setText('stash-msg','');
    },

    async pickPos(){
      const p = await api.post('playerPos', {});
      if(!p) return;
      setVal('s-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
      if(p.h!=null) setVal('s-h', String(Math.round(p.h||0)));
    },

    async pickOnMap(){
      await api.post("pickClothingLocation", {});
    }
  });
})();
