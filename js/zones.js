(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, setText, qs, f2, state } = window.GC;

  ui.zmsg = (t) => setText('zones-msg', t);

  ui.table.zones = function(list){
    const tbody = qs('#zones-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const z of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${z.name}</td>
        <td>${z.label}</td>
        <td>${f2(z.x)}, ${f2(z.y)}, ${f2(z.z)}</td>
        <td>${z.radius}</td>
        <td>
          <button data-name="${z.name}" data-i18n="edit">${locales?.t?.('edit') ?? 'Edit'}</button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selZone = z;
        setVal('z-gang', z.gang);
        setVal('z-name', z.name);
        setVal('z-label', z.label);
        setVal('z-coords', `${z.x}, ${z.y}, ${z.z}`);
        setVal('z-radius', z.radius);
        setVal('z-msg-member', z.msg_member || '');
        setVal('z-msg-nonmember', z.msg_nonmember || '');
        ui.sections.expand('zones-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.zones, {
    async load(gang){
      const res = await api.post('getZones', { gang });
      if(!res?.ok) return ui.zmsg('Error loading zones');
      state.zones = res.data || [];
      ui.table.zones(state.zones);
    },

    async save(){
      const gang = getVal('z-gang');
      const name = getVal('z-name');
      const label = getVal('z-label');
      const [x,y,z] = parseCoords(getVal('z-coords'));
      const radius = parseFloat(qs('#z-radius')?.value || '25.0');
      const msg_member = getVal('z-msg-member') || null;
      const msg_nonmember = getVal('z-msg-nonmember') || null;
      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) return ui.zmsg('Missing data or invalid coords (use "x, y, z")');
      const editing = state.selZone && state.selZone.name === name;
      const res = await api.post(editing ? 'updateZone' : 'createZone', { gang, name, label, x, y, z, radius, msg_member, msg_nonmember });
      if(res?.ok){ ui.zmsg('Zone Saved ✅'); this.load(gang); this.cancel(); }
      else ui.zmsg(res?.error==='exists'?'That name already exists':'Error saving');
    },

    async remove(){
      const gang = getVal('z-gang');
      const name = getVal('z-name');
      if(!name) return ui.zmsg('Specify the name');
      const res = await api.post('deleteZone', { name });
      if(res?.ok){ ui.zmsg('Deleted 🗑️'); this.load(gang); this.cancel(); }
      else ui.zmsg('Error deleting');
    },

    cancel(){
      state.selZone = null;
      ['z-name','z-label','z-coords','z-radius','z-msg-member','z-msg-nonmember'].forEach(id=>setVal(id,''));
      ui.zmsg('');
    },

    async pickPos(){
      const p = await api.post('playerPos', {});
      if(!p) return;
      setVal('z-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
    },

    async pickOnMap(){
      await api.post('pickZoneLocation', {});
    }
  });
})();
