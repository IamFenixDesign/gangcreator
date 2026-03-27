(() => {
  const { handlers, api, isOk, setText, setVal, getVal, qs } = window.GC;

  Object.assign(handlers.gangs, {
    async createFromModal() {
      const name  = getVal('a-name');
      const label = getVal('a-label');
      const color = qs('#a-color')?.value || '#7e22ce';
      const aMsg = (t) => setText('a-msg', t);

      if (!name || !label) return aMsg('Fill in name and label');

      const res = await api.post('createGang', { name, label, color });

      if (isOk(res)) {
        aMsg('Created ✅');
        setVal('a-name', '');
        setVal('a-label', '');
        const c = qs('#a-color'); if (c) c.value = '#7e22ce';
        handlers.gangs.load();
      } else {
        if (res?.error === 'exists') aMsg('That name already exists');
        else if (res?.error === 'name') aMsg('Invalid name (only a-z0-9_-)');
        else aMsg('Error creating');
      }
    }
  });
})();
