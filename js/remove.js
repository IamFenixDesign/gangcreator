(() => {
  const { handlers, state, api, qs, getVal, setText } = window.GC;

  Object.assign(handlers.gangs, {
    async deleteFromModal(){
      const nameInput = getVal('eg-name');
      const name      = state.selected?.name || nameInput;
      const msg       = (t)=>setText('eg-msg', t);

      if (!name) return msg('Specify a name');

      const res = await api.post('deleteGang',{ name });
      if(res?.ok){
        msg('Deleted 🗑️');
        state.selected = null;
        document.body.classList.remove('has-gang');
        const gm = qs('#gang-manage'); if(gm) gm.style.display='none';
        const mb = qs('#members-body'); if(mb) mb.innerHTML='';
        await handlers.gangs.load();
        handlers.gangs.closeEditModal?.();
      } else msg('Error deleting');
    },

    async remove(){
      const name = getVal('g-name');
      if(!name) return window.GC.ui.toast('Specify a name');
      const res = await api.post('deleteGang', { name });
      if (res?.ok) {
        window.GC.ui.toast('Deleted 🗑️');
        state.selected = null;
        document.body.classList.remove('has-gang');
        const gm = qs('#gang-manage'); if (gm) gm.style.display = 'none';
        const mb = qs('#members-body'); if (mb) mb.innerHTML = '';
        handlers.gangs.load();
        handlers.gangs.toTab();
      } else window.GC.ui.toast('Error deleting');
    }
  });
})();
