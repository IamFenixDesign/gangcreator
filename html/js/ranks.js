(() => {
  const { ui, handlers, api, getVal, setVal, setText, qs, state, nowL } = window.GC;

  ui.table.ranks = function(list){
    const tbody = qs('#ranks-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const r of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.grade}</td><td>${r.label}</td><td>${nowL(r.created_at)}</td>
        <td>
          <button data-name="${r.name}" data-i18n="edit">
            ${locales?.t?.('edit') ?? 'Edit'}
          </button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', ()=>{
        state.selRank = r;
        setVal('r-gang', r.gang); setVal('r-grade', r.grade); setVal('r-label', r.label);
        ui.sections.expand('ranks-section');
      });
      tbody.appendChild(tr);
    }
  };

  Object.assign(handlers.ranks, {
    async load(gang){
      const res = await api.post('getRanks', { gang });
      if(!res?.ok) return ui.rmsg('Error loading ranks');
      state.ranks = res.data || [];
      ui.table.ranks(state.ranks);
    },

    async save(){
      const gang  = getVal('r-gang');
      const grade = parseInt(qs('#r-grade')?.value || '', 10);
      const label = getVal('r-label');
      if(!gang || isNaN(grade) || !label) return ui.rmsg('Completa gang, grade y label');
      const editing = !!(state.selRank && state.selRank.grade === grade);
      const res = await api.post(editing?'updateRank':'createRank', { gang, grade, label });
      if(res?.ok){
        ui.rmsg('Rank Saved ✅');
        this.load(gang);
        state.selRank = null; setVal('r-grade',''); setVal('r-label','');
      } else ui.rmsg(res?.error==='exists'?'That grade already exists':'Error saving');
    },

    async remove(){
      const gang  = getVal('r-gang');
      const grade = parseInt(qs('#r-grade')?.value || '', 10);
      if(!gang || isNaN(grade)) return ui.rmsg('Specify gang and grade');
      const res = await api.post('deleteRank', { gang, grade });
      if(res?.ok){
        ui.rmsg('Deleted 🗑️'); this.load(gang);
        state.selRank = null; setVal('r-grade',''); setVal('r-label','');
      } else ui.rmsg('Error deleting');
    },

    cancel(){
      state.selRank = null;
      setVal('r-gang', state.selected?.name || '');
      setVal('r-grade',''); setVal('r-label','');
      setText('ranks-msg','');
      if(state.selected?.name) this.load(state.selected.name);
    }
  });
})();
