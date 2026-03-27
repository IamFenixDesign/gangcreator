(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, setText, qs, f2, state } = window.GC;

  ui.gmsg = (t) => setText('garage-msg', t);

  ui.table.garages = function(list){
    const tbody = qs('#garages-body');
    if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;

    for(const g of (list||[])){
      const tr = document.createElement('tr');
      const spawnTxt = (g.spawn_x != null && g.spawn_y != null && g.spawn_z != null)
        ? `${f2(g.spawn_x)}, ${f2(g.spawn_y)}, ${f2(g.spawn_z)}`
        : '-';

      tr.innerHTML = `
        <td>${g.name}</td>
        <td>${g.label}</td>
        <td>${f2(g.x)}, ${f2(g.y)}, ${f2(g.z)}</td>
        <td>${spawnTxt}</td>
        <td>${g.radius}</td>
        <td>
          <button data-name="${g.name}" data-i18n="edit">${locales?.t?.('edit') ?? 'Edit'}</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', ()=>{
        state.selGarage = g;
        setVal('ga-gang', g.gang);
        setVal('ga-name', g.name);
        setVal('ga-label', g.label);
        setVal('ga-coords', `${g.x}, ${g.y}, ${g.z}`);
        setVal('ga-h', String(Math.round(g.h||0)));
        setVal('ga-radius', g.radius);
        setVal('ga-ped', g.ped || g.ped_model || g.npc || g.prop || '');

        // Optional separate NPC location
        if (g.ped_x != null && g.ped_y != null && g.ped_z != null) {
          setVal('ga-ped-coords', `${g.ped_x}, ${g.ped_y}, ${g.ped_z}`);
          setVal('ga-ped-h', String(Math.round(g.ped_h||0)));
        } else {
          setVal('ga-ped-coords', '');
          setVal('ga-ped-h', '');
        }

        if (g.spawn_x != null && g.spawn_y != null && g.spawn_z != null) {
          setVal('ga-spawn', `${g.spawn_x}, ${g.spawn_y}, ${g.spawn_z}`);
          setVal('ga-spawn-h', String(Math.round(g.spawn_h||0)));
        } else {
          setVal('ga-spawn', '');
          setVal('ga-spawn-h', '');
        }

        ui.sections.expand('garages-section');
      });

      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.garages, {
    async load(gang){
      const res = await api.post('getGarages', { gang });
      if(!res?.ok) return ui.gmsg('Error loading garages');
      state.garages = res.data || [];
      ui.table.garages(state.garages);
    },

    async save(){
      const gang = getVal('ga-gang');
      const name = getVal('ga-name');
      const label= getVal('ga-label');

      const [x,y,z] = parseCoords(getVal('ga-coords'));
      const h = parseFloat(getVal('ga-h')||'0');
      const radius = parseFloat(qs('#ga-radius')?.value || '3.0');

      const [sx,sy,sz] = parseCoords(getVal('ga-spawn'));
      const sh = parseFloat(getVal('ga-spawn-h')||'0');

      const ped = getVal('ga-ped') || '';

      const [px,py,pz] = parseCoords(getVal('ga-ped-coords'));
      const ph = parseFloat(getVal('ga-ped-h')||'0');

      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) {
        return ui.gmsg('Missing data or invalid coords (use "x, y, z")');
      }

      const payload = { gang, name, label, x, y, z, h, radius, ped };
      if(!isNaN(sx) && !isNaN(sy) && !isNaN(sz)) {
        payload.spawn_x = sx; payload.spawn_y = sy; payload.spawn_z = sz; payload.spawn_h = sh;
      }

      if(!isNaN(px) && !isNaN(py) && !isNaN(pz)) {
        payload.ped_x = px; payload.ped_y = py; payload.ped_z = pz; payload.ped_h = ph;
      }

      const editing = state.selGarage && state.selGarage.name === name;
      const res = await api.post(editing ? 'updateGarage' : 'createGarage', payload);

      if(res?.ok){
        ui.gmsg('Garage Saved ✅');
        this.load(gang);
        ui.forms.garage();
      } else {
        ui.gmsg(res?.error === 'exists' ? 'That name already exists' : 'Error saving');
      }
    },

    async remove(){
      const name = getVal('ga-name');
      const gang = getVal('ga-gang');
      if(!name) return ui.gmsg('Specify the name');
      const res = await api.post('deleteGarage', { name });
      if(res?.ok){
        ui.gmsg('Deleted 🗑️');
        this.load(gang);
        ui.forms.garage();
      } else ui.gmsg('Error deleting');
    },

    cancel(){
      state.selGarage = null;
      ['ga-name','ga-label','ga-coords','ga-h','ga-radius','ga-spawn','ga-spawn-h','ga-ped','ga-ped-coords','ga-ped-h'].forEach(id=>setVal(id,''));
      ui.gmsg('');
    },

    async pickPos(target){
      const p = await api.post('playerPos', {});
      if(!p) return;
      const val = `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`;
      setVal(target, val);
      if(target === 'ga-coords' && p.h != null) setVal('ga-h', String(Math.round(p.h||0)));
      if(target === 'ga-spawn'  && p.h != null) setVal('ga-spawn-h', String(Math.round(p.h||0)));
      if(target === 'ga-ped-coords' && p.h != null) setVal('ga-ped-h', String(Math.round(p.h||0)));
    },

    async pickOnMap(target){
      state.returnInputId = target;
      state.returnTab = 'garages';
      await api.post('pickClothingLocation', {});
    }
  });

  // Bind buttons
  document.addEventListener('DOMContentLoaded', () => {
    qs('#ga-save')?.addEventListener('click', ()=>handlers.garages.save());
    qs('#ga-delete')?.addEventListener('click', ()=>handlers.garages.remove());
    qs('#ga-cancel')?.addEventListener('click', ()=>handlers.garages.cancel());

    qs('#ga-pick-pos')?.addEventListener('click', ()=>handlers.garages.pickPos('ga-coords'));
    qs('#ga-pick-map')?.addEventListener('click', ()=>handlers.garages.pickOnMap('ga-coords'));

    qs('#ga-spawn-pos')?.addEventListener('click', ()=>handlers.garages.pickPos('ga-spawn'));
    qs('#ga-spawn-map')?.addEventListener('click', ()=>handlers.garages.pickOnMap('ga-spawn'));

    qs('#ga-ped-pos')?.addEventListener('click', ()=>handlers.garages.pickPos('ga-ped-coords'));
    qs('#ga-ped-map')?.addEventListener('click', ()=>handlers.garages.pickOnMap('ga-ped-coords'));
  });
})();
