(() => {
  const { ui, handlers, api, getVal, setVal, qs, f2, parseCoords, state } = window.GC;
  const locales = () => window.gcLocales;

  ui.table.shops = function(rows=[]){
    const tbody = qs('#shops-body'); if(!tbody) return;
    tbody.innerHTML = '';
    rows.forEach((s)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.label||''}</td>
        <td>${f2(s.x)}, ${f2(s.y)}, ${f2(s.z)} (h:${Math.round(s.h||0)})</td>
        <td>${s.model||''}</td>
        <td>${s.radius||1.75}</td>
        <td>
          <button data-name="${s.name}" class="btn btn-small" data-i18n="edit">
            ${locales()?.t?.('edit') ?? 'Edit'}
          </button>
        </td>`;
      tr.querySelector('button')?.addEventListener('click', ()=>{
        state.selShop = s;
        setVal('sh-gang', s.gang); setVal('sh-name', s.name); setVal('sh-label', s.label||'');
        setVal('sh-model', s.model||''); setVal('sh-coords', `${f2(s.x)}, ${f2(s.y)}, ${f2(s.z)}`); setVal('sh-h', String(Math.round(s.h||0)));
        setVal('sh-radius', String(s.radius||1.75)); setVal('sh-icon', s.icon||'fa-solid fa-store'); setVal('sh-scenario', s.scenario||'');
        setVal('sh-restock', String(s.restock_interval_days||7));
        handlers.shops.loadItems(s.name);
        ui.sections.expand('shops-section');
      });
      tbody.appendChild(tr);
    });
  };

  ui.table.shopItems = function(rows = []) {
    const tbody = qs('#shop-items-body'); 
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.forEach((it) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.item}</td>
        <td>${it.label || ''}</td>
        <td>$${it.price || 0}</td>
        <td>${it.stock || 0}/${it.max_stock || 0}</td>
        <td>
          <button class="btn btn-small" data-item="${it.item}" data-i18n="edit">
            ${locales()?.t?.('edit') ?? 'Edit'}
          </button>
          <button class="btn btn-small btn-danger" data-del="${it.item}" data-i18n="delete">
            ${locales()?.t?.('delete') ?? 'Delete'}
          </button>
        </td>`;

      tr.querySelector('[data-item]')?.addEventListener('click', () => {
        setVal('si-item', it.item);
        setVal('si-label', it.label || '');
        setVal('si-price', String(it.price || 0));
        setVal('si-max', String(it.max_stock || 0));
        setVal('si-stock', String(it.stock || 0));
      });

      tr.querySelector('[data-del]')?.addEventListener('click', async () => {
        const shop = getVal('sh-name');
        const item = it.item;
        const res = await api.post('deleteShopItem', { shop, item });
        if (res?.ok) {
          handlers.shops.loadItems(shop);
          ui.simsg('Deleted item');
        }
      });

      tbody.appendChild(tr);
    });
  };

  Object.assign(handlers.shops, {
    async load(gang){
      const res = await api.post('getShops', { gang });
      if(!res?.ok) return ui.shmsg('Error loading shops');
      state.shops = res.data || [];
      ui.table.shops(state.shops);
    },

    async save(){
      const gang  = getVal('sh-gang');
      const name  = getVal('sh-name');
      const label = getVal('sh-label');
      const model = getVal('sh-model');
      const [x,y,z] = parseCoords(getVal('sh-coords'));
      const h = parseFloat(getVal('sh-h')||'0');
      const radius = parseFloat(getVal('sh-radius')||'1.75');
      const icon = getVal('sh-icon') || 'fa-solid fa-store';
      const scenario = getVal('sh-scenario') || '';
      const restock_interval_days = parseInt(getVal('sh-restock')||'7',10);
      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)) return ui.shmsg('Missing data or invalid coords');
      const editing = state.selShop && state.selShop.name === name;
      const res = await api.post(editing?'updateShop':'createShop', { gang, name, label, model, x, y, z, h, radius, icon, scenario, restock_interval_days });
      if(res?.ok){ ui.shmsg('Shop Saved ✅'); this.load(gang); ui.forms.shop(); }
      else ui.shmsg(res?.error==='exists'?'That name already exists':'Error saving');
    },

    async remove(){
      const name = getVal('sh-name');
      const gang = getVal('sh-gang');
      if(!name) return ui.shmsg('Specify the name');
      const res = await api.post('deleteShop', { name });
      if(res?.ok){
        ui.shmsg('Deleted 🗑️');
        this.load(gang);
        ui.forms.shop();
      } else ui.shmsg('Error deleting');
    },

    cancel(){ ui.forms.shop(); },

    async pickPos(){
      const p = await api.post('playerPos', {}); if(!p) return;
      setVal('sh-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
      if(p.h!=null) setVal('sh-h', String(Math.round(p.h||0)));
    },

    // Same marker-pick flow used in garages (uses pickedCoords NUI message).
    async pickOnMap(){
      state.returnInputId = 'sh-coords';
      state.returnTab = 'shops';
      await api.post('pickClothingLocation', {});
    },

    async loadItems(shop){
      const res = await api.post('getShopItems', { shop });
      if(!res?.ok) return ui.simsg('Error loading items');
      state.shopItems = res.data || [];
      ui.table.shopItems(state.shopItems);
    },

    async saveItem(){
      const shop = getVal('sh-name');
      const item = getVal('si-item'); const label = getVal('si-label');
      const price = parseInt(getVal('si-price')||'0',10);
      const max_stock = parseInt(getVal('si-max')||'0',10);
      const stock = parseInt(getVal('si-stock')||'0',10);
      if(!shop || !item) return ui.simsg('Fill in shop and item');
      const res = await api.post('upsertShopItem', { shop, item, label, price, max_stock, stock });
      if(res?.ok){ ui.simsg('Item Saved ✅'); this.loadItems(shop); }
      else ui.simsg('Error saving');
    },

    async restock(){
      const name = getVal('sh-name'); const res = await api.post('restockShop', { name });
      if(res?.ok){ ui.simsg('Restock done'); if(name) this.loadItems(name); }
    }
  });
})();
