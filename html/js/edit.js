(() => {
  const { handlers, state, api, isOk, qs, setVal, getVal, setText } = window.GC;

  Object.assign(handlers.gangs, {
    // === Modal Edit Gang ===
    ensureEditGangModal(){
      if (qs('#edit-gang-modal')) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = `
      <div id="edit-gang-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="eg-title">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="eg-title">Editar gang</h3>
            <button id="eg-close" class="close-btn" type="button" aria-label="Cerrar">×</button>
          </div>
          <div class="form">
            <label for="eg-name">Nombre (id único)</label>
            <input id="eg-name" />
            <label for="eg-label">Etiqueta</label>
            <input id="eg-label" />
            <label for="eg-color">Color</label>
            <input id="eg-color" type="color" value="#7e22ce" />
            <div class="row">
              <button id="eg-save" type="button">Guardar</button>
              <button id="eg-cancel" class="edit-cancel" type="button">Cancelar</button>
              <button id="eg-delete" class="danger" type="button">Eliminar</button>
            </div>
            <small id="eg-msg" class="muted" aria-live="polite"></small>
          </div>
        </div>
      </div>`;
      document.body.appendChild(wrap.firstElementChild);
    },

    openEditModal(g){
      this.ensureEditGangModal();
      state.selected = g;
      setVal('eg-name', g.name||'');
      setVal('eg-label', g.label||'');
      const el = qs('#eg-color'); if (el) el.value = g.color || '#7e22ce';
      setText('eg-msg','');
      qs('#edit-gang-modal')?.classList.remove('hidden');
    },

    closeEditModal(){ qs('#edit-gang-modal')?.classList.add('hidden'); },

    async saveFromModal(){
      const oldName = state.selected?.name || '';
      const newName = getVal('eg-name');
      const label   = getVal('eg-label');
      const color   = qs('#eg-color')?.value || '#7e22ce';
      const msg     = (t)=>setText('eg-msg', t);

      if (!newName || !label) return msg('Fill in name and label');

      const payload = {
        name: oldName || newName,
        label,
        color
      };

      if (oldName && oldName !== newName) payload.newName = newName;

      const res = await api.post('updateGang', payload);

      if (res?.ok) {
        msg('Saved ✅');
        await handlers.gangs.load();
        this.closeEditModal();
      } else {
        if (res?.error === 'exists')      msg('That name already exists');
        else if (res?.error === 'name')   msg('Invalid name (only a-z0-9_-)');
        else                              msg('Error saving');
      }
    },

    bindEditModalOnce(){
      this.ensureEditGangModal();
      qs('#eg-save')  ?.addEventListener('click', ()=> this.saveFromModal());
      qs('#eg-delete')?.addEventListener('click', ()=> this.deleteFromModal?.());
      const close = ()=> this.closeEditModal();
      qs('#eg-close') ?.addEventListener('click', close);
      qs('#eg-cancel')?.addEventListener('click', close);
      qs('#edit-gang-modal')?.addEventListener('click', (e)=>{
        if(e.target?.id === 'edit-gang-modal') close();
      });
    },

    async save(){
      const formName = getVal('g-name');
      const label    = getVal('g-label');
      const color    = qs('#g-color')?.value || '#7e22ce';

      if (!formName || !label) return window.GC.ui.toast('Fill in name and label');

      const selected = state.selected;
      let endpoint, payload;

      if (!selected) {
        endpoint = 'createGang';
        payload  = { name: formName, label, color };
      } else {
        const oldName = selected.name;

        endpoint = 'updateGang';
        payload  = { name: oldName, label, color };

        if (oldName !== formName) payload.newName = formName;
      }

      const res = await api.post(endpoint, payload);

      if (isOk(res)) {
        window.GC.ui.toast('Saved ✅');
        handlers.gangs.load();
      } else {
        if (res?.error === 'exists')      window.GC.ui.toast('That name already exists');
        else if (res?.error === 'name')   window.GC.ui.toast('Invalid name (only a-z0-9_-)');
        else                              window.GC.ui.toast('Error saving');
      }
    },

    cancelEdit(){
      state.selected = null;
      document.body.classList.remove('has-gang');
      setVal('g-name',''); setVal('g-label',''); setVal('g-color','#7e22ce');
      setText('form-msg','');
      const gm = qs('#gang-manage'); if (gm) gm.style.display='none';
      this.toTab();
    }
  });
})();
