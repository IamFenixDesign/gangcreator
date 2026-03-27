(() => {
  const { ui, handlers, api, qs, setText, getVal, state, nowL } = window.GC;

  ui.table.members = function(list){
    const tbody = qs('#members-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const m of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.citizenid}</td>
        <td>${m.grade}</td>
        <td>${nowL(m.added_at)}</td>
        <td><button class="small" data-info="${m.citizenid}" title="Ver info">ℹ️</button></td>
        <td>
          <button data-cid="${m.citizenid}" class="danger small" data-i18n="remove">
            ${locales?.t?.('remove') ?? 'Remove'}
          </button>
        </td>
      `;
      tr.querySelector('button.small[data-info]')
        .addEventListener('click', async (e)=>{
          const cid = e.currentTarget.getAttribute('data-info');
          const info = await api.post('getMemberInfo', { citizenid: cid });
          handlers.members.fillInfo(info?.ok ? info.data : { citizenid: cid });
          handlers.members.openInfo();
        });
      tr.querySelector('button.danger.small')
        .addEventListener('click', async (e)=>{
          const cid = e.currentTarget.getAttribute('data-cid');
          const r = await api.post('removeMember', { gang: state.selected?.name, citizenid: cid });
          if(r?.ok) handlers.members.load(state.selected?.name);
        });
      tbody.appendChild(tr);
    }
  };

  // Compatibility shim for legacy calls to updateMembersUI
  window.updateMembersUI = function(res){
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    state.members = list;
    ui.table.members(list);
  };

  Object.assign(handlers.members, {
    async load(gang){
      const res = await api.post('getMembers', { gang });
      state.members = res?.ok ? (res.data || []) : [];
      ui.table.members(state.members);
    },

    async add(){
      const gang = (state.selected && state.selected.name) || getVal('g-name') || '';
      const citizenid = getVal('m-cid');
      const grade = parseInt(qs('#m-grade')?.value || '0', 10);
      ui.mmsg('');
      if(!gang || !citizenid) return;
      const res = await api.post('addMember', { gang, citizenid, grade });
      if(res?.ok){
        ui.mmsg('Member updated ✅');
        this.load(gang);
      } else {
        if(res?.error === 'invalid_rank'){
          ui.mmsg('⚠️ That rank does not exist in this gang. Create the rank in the "Ranks" section and try again.');
        } else ui.mmsg('Error adding/updating member');
      }
    },

    openInfo(){ qs('#member-info-modal')?.classList.remove('hidden'); },
    closeInfo(){ qs('#member-info-modal')?.classList.add('hidden'); },
    fillInfo(d){
      setText('mi-name', d.firstname || '-');
      setText('mi-lastname', d.lastname || '-');
      setText('mi-cid', d.citizenid || '-');
      setText('mi-fivem', d.fivem || '-');
    }
  });
})();
