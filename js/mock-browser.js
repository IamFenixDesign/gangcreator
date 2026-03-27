
(() => {
  const isBrowserPreview = !window.invokeNative && !(typeof GetParentResourceName === 'function');
  if (!isBrowserPreview) return;

  const RES = 'fenix-gangcreator';
  const DB_KEY = 'gc_mock_db_v2';
  const PED_EDITOR_KEY = 'gc_mock_ped_editor_v1';

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const nowIso = () => new Date().toISOString();
  const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2, 8)}`;
  const sortByCreated = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''));

  function seedDb() {
    const gangs = [
      { name: 'lostmc', label: 'Lost MC', color: '#ef4444', created_at: '2026-03-24T11:10:00.000Z' },
      { name: 'families', label: 'Families', color: '#22c55e', created_at: '2026-03-23T10:30:00.000Z' },
      { name: 'vagos', label: 'Vagos', color: '#eab308', created_at: '2026-03-20T15:45:00.000Z' },
    ];
    const mkCoord = (x, y, z) => ({ x, y, z, h: 180, radius: 2.0, icon: 'fa-solid fa-location-dot' });
    return {
      gangs,
      members: {
        lostmc: [
          { citizenid: 'CID1001', grade: 0, added_at: '2026-03-24T12:00:00.000Z', firstname: 'Daryl', lastname: 'Stone', fivem: 'steam:1101' },
          { citizenid: 'CID1002', grade: 2, added_at: '2026-03-24T12:05:00.000Z', firstname: 'Maya', lastname: 'Black', fivem: 'steam:1102' },
        ],
        families: [
          { citizenid: 'CID2001', grade: 1, added_at: '2026-03-23T11:00:00.000Z', firstname: 'Frank', lastname: 'Green', fivem: 'steam:2101' },
        ],
        vagos: [
          { citizenid: 'CID3001', grade: 3, added_at: '2026-03-20T16:10:00.000Z', firstname: 'Luis', lastname: 'Garcia', fivem: 'steam:3101' },
        ],
      },
      ranks: {
        lostmc: [
          { gang:'lostmc', grade:0, label:'Prospect', created_at:'2026-03-24T11:20:00.000Z' },
          { gang:'lostmc', grade:1, label:'Member', created_at:'2026-03-24T11:21:00.000Z' },
          { gang:'lostmc', grade:2, label:'Officer', created_at:'2026-03-24T11:22:00.000Z' },
        ],
        families: [
          { gang:'families', grade:0, label:'Youngin', created_at:'2026-03-23T10:50:00.000Z' },
          { gang:'families', grade:1, label:'OG', created_at:'2026-03-23T10:51:00.000Z' },
        ],
        vagos: [
          { gang:'vagos', grade:0, label:'Soldado', created_at:'2026-03-20T15:55:00.000Z' },
          { gang:'vagos', grade:3, label:'Jefe', created_at:'2026-03-20T16:00:00.000Z' },
        ],
      },
      stashes: {
        lostmc: [{ gang:'lostmc', name:'stash_main', label:'Main Stash', slots:60, weight:120000, prop:'', created_at:nowIso(), ...mkCoord(112.0, -1940.0, 20.0) }],
        families: [{ gang:'families', name:'stash_green', label:'Green Stash', slots:40, weight:80000, prop:'', created_at:nowIso(), ...mkCoord(-154.0, -1602.0, 35.0) }],
        vagos: [{ gang:'vagos', name:'stash_yellow', label:'Yellow Stash', slots:45, weight:90000, prop:'', created_at:nowIso(), ...mkCoord(345.0, -2030.0, 22.0) }],
      },
      garages: {
        lostmc: [{ gang:'lostmc', name:'garage_lost', label:'Club Garage', spawn_x:116.0, spawn_y:-1938.0, spawn_z:20.0, created_at:nowIso(), ...mkCoord(114.0, -1936.0, 20.0) }],
        families: [{ gang:'families', name:'garage_fam', label:'Families Garage', spawn_x:-151.0, spawn_y:-1607.0, spawn_z:35.0, created_at:nowIso(), ...mkCoord(-149.0, -1605.0, 35.0) }],
        vagos: [{ gang:'vagos', name:'garage_vagos', label:'Vagos Garage', spawn_x:349.0, spawn_y:-2035.0, spawn_z:22.0, created_at:nowIso(), ...mkCoord(347.0, -2033.0, 22.0) }],
      },
      clothing: {
        lostmc: [{ gang:'lostmc', name:'clothing_lost', label:'Club Outfits', prop:'', created_at:nowIso(), ...mkCoord(110.0, -1943.0, 20.0), icon:'fa-solid fa-shirt' }],
        families: [], vagos: []
      },
      crafts: {
        lostmc: [{ gang:'lostmc', name:'craft_weapons', label:'Weapon Bench', job_locked:0, created_at:nowIso(), ...mkCoord(109.0, -1946.0, 20.0), icon:'fa-solid fa-hammer' }],
        families: [], vagos: []
      },
      recipes: {
        lostmc: [{ gang:'lostmc', station:'craft_weapons', name:'lockpick_recipe', label:'Lockpick', item:'lockpick', amount:1, time:5000, ingredients:[{item:'metalscrap', amount:10},{item:'plastic', amount:5}], created_at:nowIso() }],
        families: [], vagos: []
      },
      shops: {
        lostmc: [{ gang:'lostmc', name:'shop_lost', label:'Club Store', blip:0, blipcolor:0, blipscale:0.8, created_at:nowIso(), ...mkCoord(115.0, -1942.0, 20.0), icon:'fa-solid fa-store' }],
        families: [], vagos: []
      },
      shopItems: {
        shop_lost: [{ shop:'shop_lost', item:'bandage', label:'Bandage', price:250, stock:50, max_stock:100, restock_amount:20, created_at:nowIso() }]
      },
      membermenus: {
        lostmc: [{ gang:'lostmc', name:'menu_lost', label:'Management Menu', created_at:nowIso(), ...mkCoord(108.0, -1941.0, 20.0), icon:'fa-solid fa-users' }],
        families: [], vagos: []
      },
      zones: {
        lostmc: [{ gang:'lostmc', name:'zone_lost', label:'Club Zone', msg_member:'Welcome back', msg_nonmember:'Restricted area', created_at:nowIso(), ...mkCoord(118.0, -1948.0, 20.0), icon:'fa-solid fa-location-crosshairs' }],
        families: [], vagos: []
      },
      peds: {
        lostmc: [{ gang:'lostmc', name:'ped_bouncer', label:'Bouncer', model:'mp_m_freemode_01', scenario:'WORLD_HUMAN_GUARD_STAND', reaction_radius:6.0, reaction_scenario:'WORLD_HUMAN_STAND_IMPATIENT', created_at:nowIso(), ...mkCoord(111.0, -1939.0, 20.0), icon:'fa-solid fa-user' }],
        families: [], vagos: []
      },
      pedEditor: {
        model: 'mp_m_freemode_01',
        appearance: { components: {}, props: {}, freemode: { eyeColor: 2, faceFeatures: {}, headBlend:{shapeFirst:0,shapeSecond:0,skinFirst:0,skinSecond:0,shapeMix:0.5,skinMix:0.5}, hair:{color:1,highlight:0}, overlays:{}} },
        ranges: { components: {}, props: {}, freemode: { eyeColorMax: 31 } }
      },
      updateStatus: {
        hasUpdate: true,
        currentVersion: '1.1.1',
        latestVersion: '1.2.0',
        helpText: 'Browser preview mode with mock data enabled.',
        portalUrl: 'https://portal.cfx.re/'
      }
    };
  }

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const db = seedDb();
    saveDb(db);
    return db;
  }
  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  function ensure(db, key, subkey) {
    db[key] = db[key] || {};
    if (subkey != null) db[key][subkey] = db[key][subkey] || [];
    return subkey != null ? db[key][subkey] : db[key];
  }
  function getGang(db, gang) {
    return db.gangs.find((g) => g.name === gang);
  }
  function paginate(items, page=1, pageSize=15) {
    const p = Math.max(1, parseInt(page || 1, 10));
    const size = Math.max(1, parseInt(pageSize || 15, 10));
    const start = (p - 1) * size;
    return { page: p, pageSize: size, total: items.length, data: items.slice(start, start + size) };
  }
  function ok(data = {}) { return { ok: true, success: true, ...data }; }
  function fail(error, extra = {}) { return { ok: false, success: false, error, ...extra }; }

  function pickCoords() {
    return {
      x: +(100 + Math.random() * 50).toFixed(2),
      y: +(-2000 + Math.random() * 100).toFixed(2),
      z: +(20 + Math.random() * 10).toFixed(2),
      h: Math.floor(Math.random() * 360)
    };
  }

  function getBody(data) {
    try { return typeof data === 'string' ? JSON.parse(data || '{}') : (data || {}); } catch { return {}; }
  }

  function upsertByName(list, record) {
    const idx = list.findIndex((x) => x.name === record.name);
    if (idx >= 0) list[idx] = { ...list[idx], ...record };
    else list.push(record);
  }

  function route(name, body) {
    const db = loadDb();
    const gang = body.gang;
    switch (name) {
      case 'canOpen': return ok({ browserPreview: true });
      case 'close': return ok({ closed: true });
      case 'getGangs': {
        const q = String(body.q || '').trim().toLowerCase();
        let items = clone(db.gangs).sort(sortByCreated);
        if (q) items = items.filter((g) => `${g.name} ${g.label}`.toLowerCase().includes(q));
        return ok(paginate(items, body.page || 1, 15));
      }
      case 'createGang': {
        const name = String(body.name || '').trim();
        const label = String(body.label || '').trim();
        if (!/^[a-z0-9_-]+$/i.test(name)) return fail('name');
        if (db.gangs.some((g) => g.name === name)) return fail('exists');
        const rec = { name, label, color: body.color || '#7e22ce', created_at: nowIso() };
        db.gangs.unshift(rec);
        saveDb(db);
        return ok({ data: rec });
      }
      case 'updateGang': {
        const currentName = String(body.oldName || body.name || '').trim();
        const requestedName = String(body.newName || body.name || currentName).trim();
        const idx = db.gangs.findIndex((g) => g.name === currentName);
        if (idx < 0) return fail('not_found');
        const nextName = requestedName || currentName;
        if (nextName !== currentName && db.gangs.some((g) => g.name === nextName)) return fail('exists');
        const prev = db.gangs[idx];
        db.gangs[idx] = { ...prev, name: nextName, label: body.label || prev.label, color: body.color || prev.color };
        if (nextName !== currentName) {
          ['members','ranks','stashes','garages','clothing','crafts','recipes','shops','membermenus','zones','peds'].forEach((k) => {
            if (db[k][currentName]) {
              db[k][nextName] = (db[k][currentName] || []).map((x) => ({ ...x, gang: nextName }));
              delete db[k][currentName];
            }
          });
        }
        saveDb(db);
        return ok({ data: db.gangs[idx] });
      }
      case 'deleteGang': {
        db.gangs = db.gangs.filter((g) => g.name !== body.name);
        ['members','ranks','stashes','garages','clothing','crafts','recipes','shops','membermenus','zones','peds'].forEach((k) => { delete db[k][body.name]; });
        saveDb(db);
        return ok();
      }
      case 'getMembers': return ok({ data: clone(ensure(db, 'members', gang)) });
      case 'getMemberInfo': {
        const all = Object.values(db.members).flat();
        return ok({ data: clone(all.find((m) => m.citizenid === body.citizenid) || { citizenid: body.citizenid }) });
      }
      case 'addMember': {
        const list = ensure(db, 'members', gang);
        const cid = String(body.citizenid || '').trim();
        const grade = parseInt(body.grade || 0, 10);
        const ranks = ensure(db, 'ranks', gang);
        if (!ranks.some((r) => Number(r.grade) === grade)) return fail('invalid_rank');
        const idx = list.findIndex((m) => m.citizenid === cid);
        const rec = { citizenid: cid, grade, added_at: nowIso(), firstname:'Test', lastname:'Player', fivem: uid('steam') };
        if (idx >= 0) list[idx] = { ...list[idx], ...rec };
        else list.push(rec);
        saveDb(db);
        return ok({ data: rec });
      }
      case 'removeMember': {
        db.members[gang] = ensure(db, 'members', gang).filter((m) => m.citizenid !== body.citizenid);
        saveDb(db);
        return ok();
      }
      case 'getRanks': return ok({ data: clone(ensure(db, 'ranks', gang)).sort((a,b)=>a.grade-b.grade) });
      case 'createRank':
      case 'updateRank': {
        const list = ensure(db, 'ranks', gang);
        const grade = parseInt(body.grade, 10);
        const existing = list.find((r) => Number(r.grade) === grade);
        if (name === 'createRank' && existing) return fail('exists');
        if (existing) Object.assign(existing, { label: body.label, gang });
        else list.push({ gang, grade, label: body.label, created_at: nowIso() });
        saveDb(db);
        return ok();
      }
      case 'deleteRank': {
        db.ranks[gang] = ensure(db, 'ranks', gang).filter((r) => Number(r.grade) !== Number(body.grade));
        saveDb(db);
        return ok();
      }
      case 'playerPos': return pickCoords();
      case 'pickClothingLocation':
      case 'pickCraftLocation':
      case 'pickZoneLocation':
      case 'pickPedLocation': {
        const coords = pickCoords();
        setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'pickedCoords', value: coords } })), 150);
        return ok({ value: coords });
      }
      case 'getStashes': return ok({ data: clone(ensure(db,'stashes',gang)) });
      case 'createStash':
      case 'updateStash': {
        const list = ensure(db,'stashes',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, slots:+body.slots||50, weight:+body.weight||100000, prop:body.prop||'', created_at: nowIso() };
        if (name === 'createStash' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteStash': { db.stashes[gang] = ensure(db,'stashes',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getGarages': return ok({ data: clone(ensure(db,'garages',gang)) });
      case 'createGarage':
      case 'updateGarage': {
        const list = ensure(db,'garages',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, spawn_x:+body.spawn_x||0, spawn_y:+body.spawn_y||0, spawn_z:+body.spawn_z||0, created_at: nowIso() };
        if (name === 'createGarage' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteGarage': { db.garages[gang] = ensure(db,'garages',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getClothing': return ok({ data: clone(ensure(db,'clothing',gang)) });
      case 'createClothing':
      case 'updateClothing': {
        const list = ensure(db,'clothing',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, icon:body.icon||'fa-solid fa-shirt', prop:body.prop||'', created_at: nowIso() };
        if (name === 'createClothing' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteClothing': { db.clothing[gang] = ensure(db,'clothing',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getCrafts': return ok({ data: clone(ensure(db,'crafts',gang)) });
      case 'createCraft':
      case 'updateCraft': {
        const list = ensure(db,'crafts',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, icon:body.icon||'fa-solid fa-hammer', created_at: nowIso() };
        if (name === 'createCraft' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteCraft': { db.crafts[gang] = ensure(db,'crafts',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'setEditingCraft': return ok();
      case 'getRecipes': {
        let list = clone(ensure(db,'recipes',gang));
        const station = String(body.station || '').trim();
        if (station) list = list.filter((r) => String(r.station || '') === station);
        return ok({ data: list });
      }
      case 'createRecipe':
      case 'updateRecipe': {
        const list = ensure(db,'recipes',gang);
        const rec = { gang, station: body.station || '', name: body.name, label: body.label, item: body.item, amount:+body.amount||1, time:+body.time||5000, ingredients: clone(body.ingredients || []), created_at: nowIso() };
        const idx = list.findIndex((x)=>x.name===rec.name);
        if (name === 'createRecipe' && idx >= 0) return fail('exists');
        if (idx >= 0) list[idx] = { ...list[idx], ...rec };
        else list.push(rec);
        saveDb(db); return ok();
      }
      case 'deleteRecipe': {
        db.recipes[gang] = ensure(db,'recipes',gang).filter((x)=>x.name!==body.name);
        saveDb(db); return ok();
      }
      case 'getShops': return ok({ data: clone(ensure(db,'shops',gang)) });
      case 'createShop':
      case 'updateShop': {
        const list = ensure(db,'shops',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, icon:body.icon||'fa-solid fa-store', blip:+body.blip||0, blipcolor:+body.blipcolor||0, blipscale:+body.blipscale||0.8, created_at: nowIso() };
        if (name === 'createShop' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteShop': { db.shops[gang] = ensure(db,'shops',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getShopItems': return ok({ data: clone(db.shopItems[body.shop] || []) });
      case 'upsertShopItem': {
        const shop = body.shop;
        db.shopItems[shop] = db.shopItems[shop] || [];
        const rec = { shop, item: body.item, label: body.label || body.item, price:+body.price||0, stock:+body.stock||0, max_stock:+body.max_stock||0, restock_amount:+body.restock_amount||0, created_at: nowIso() };
        const idx = db.shopItems[shop].findIndex((x)=>x.item===rec.item);
        if (idx >= 0) db.shopItems[shop][idx] = { ...db.shopItems[shop][idx], ...rec };
        else db.shopItems[shop].push(rec);
        saveDb(db); return ok();
      }
      case 'deleteShopItem': {
        const shop = body.shop; db.shopItems[shop] = (db.shopItems[shop] || []).filter((x)=>x.item!==body.item); saveDb(db); return ok();
      }
      case 'restockShop': {
        const shop = body.shop;
        (db.shopItems[shop] || []).forEach((x) => { x.stock = Math.min((+x.max_stock||0), (+x.stock||0) + (+x.restock_amount||0)); });
        saveDb(db); return ok();
      }
      case 'getMemberMenus': return ok({ data: clone(ensure(db,'membermenus',gang)) });
      case 'createMemberMenu':
      case 'updateMemberMenu': {
        const list = ensure(db,'membermenus',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, icon:body.icon||'fa-solid fa-users', created_at: nowIso() };
        if (name === 'createMemberMenu' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteMemberMenu': { db.membermenus[gang] = ensure(db,'membermenus',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getZones': return ok({ data: clone(ensure(db,'zones',gang)) });
      case 'createZone':
      case 'updateZone': {
        const list = ensure(db,'zones',gang);
        const rec = { gang, name: body.name, label: body.label, x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, msg_member: body.msg_member||'', msg_nonmember: body.msg_nonmember||'', created_at: nowIso() };
        if (name === 'createZone' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deleteZone': { db.zones[gang] = ensure(db,'zones',gang).filter((x)=>x.name!==body.name); saveDb(db); return ok(); }
      case 'getPeds': return ok({ data: clone(ensure(db,'peds',gang)) });
      case 'createPed':
      case 'updatePed': {
        const list = ensure(db,'peds',gang);
        const rec = { gang, name: body.name, label: body.label, model: body.model||'mp_m_freemode_01', x:+body.x, y:+body.y, z:+body.z, h:+body.h||0, radius:+body.radius||2, icon:body.icon||'fa-solid fa-user', scenario:body.scenario||'', reaction_radius:+body.reaction_radius||0, reaction_scenario:body.reaction_scenario||'', created_at: nowIso() };
        if (name === 'createPed' && list.some((x)=>x.name===rec.name)) return fail('exists');
        upsertByName(list, rec); saveDb(db); return ok();
      }
      case 'deletePed': {
        for (const k of Object.keys(db.peds)) db.peds[k] = db.peds[k].filter((x)=>x.name!==body.name);
        saveDb(db); return ok();
      }
      case 'pedEditor:setCamera': return ok();
      case 'pedEditor:randomize': {
        db.pedEditor.appearance.freemode.eyeColor = Math.floor(Math.random() * 10);
        saveDb(db); return ok({ value: clone(db.pedEditor) });
      }
      case 'pedEditor:getTextureMax': return ok({ max: 15 });
      case 'pedEditor:setPart':
      case 'pedEditor:setEyeColor':
      case 'pedEditor:setFaceFeature':
      case 'pedEditor:setHeadBlend':
      case 'pedEditor:setHairColor':
      case 'pedEditor:setHeadOverlay':
      case 'pedEditor:setHeadOverlayColor': return ok();
      case 'pedEditor:save': return ok({ saved: true });
      case 'pedEditor:close': return ok();
      default:
        return ok({ note: `Mock endpoint: ${name}` });
    }
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol === 'https:' && parsed.hostname === RES) {
        const name = parsed.pathname.replace(/^\//, '');
        const body = getBody(init.body);
        const payload = route(name, body);
        return {
          ok: true,
          status: 200,
          json: async () => clone(payload),
          text: async () => JSON.stringify(payload)
        };
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };

  const style = document.createElement('style');
  style.textContent = `
    body.browser-preview { background: radial-gradient(circle at top, #1e293b 0%, #0f172a 55%, #020617 100%); }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('browser-preview');
  document.body?.classList?.add('browser-preview');

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('browser-preview');
    const db = loadDb();
    setTimeout(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { action: 'updateStatus', value: db.updateStatus } }));
      window.dispatchEvent(new MessageEvent('message', { data: { action: 'visible', value: true } }));
    }, 50);
  });
})();
