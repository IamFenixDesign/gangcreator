(() => {
  const { ui, handlers, api, parseCoords, getVal, setVal, setText, qs, f2, state } = window.GC;

  const t = (key, fallback='') => window.gcLocales?.t?.(key) || fallback || '';

  // ---------------- table ----------------
  ui.table.peds = function(list){
    const tbody = qs('#peds-body'); if(!tbody) return;
    tbody.innerHTML='';
    const locales = window.gcLocales;
    for(const p of (list||[])){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.label}</td>
        <td>${p.model||''}</td>
        <td>${f2(p.x)}, ${f2(p.y)}, ${f2(p.z)}</td>
        <td>
          <button data-name="${p.name}" data-i18n="edit">${locales?.t?.('edit') ?? 'Edit'}</button>
        </td>
      `;
      tr.querySelector('button')?.addEventListener('click', ()=>{
        state.selPed = p;
        setVal('p-gang', p.gang);
        setVal('p-name', p.name);
        setVal('p-label', p.label);
        setVal('p-model', p.model || 'mp_m_freemode_01');
        setVal('p-coords', `${p.x}, ${p.y}, ${p.z}`);
        setVal('p-h', String(Math.round(p.h||0)));
        setVal('p-radius', String(p.radius||1.75));
        setVal('p-icon', p.icon||'fa-user');
        setVal('p-scenario', p.scenario||'');
        setVal('p-reaction-radius', String(p.reaction_radius||0));
        setVal('p-reaction-scenario', p.reaction_scenario||'');
        ui.sections.expand('peds-section');
      });
      tbody.appendChild(tr);
    }
  };

  // ---------------- CRUD ----------------
  Object.assign(handlers.peds, {
    async load(gang){
      const res = await api.post('getPeds', { gang });
      if(!res?.ok) return ui.pmsg(t(res?.msgKey || 'peds_err_load', 'Error loading peds'));
      state.peds = res.data || [];
      ui.table.peds(state.peds);
    },

    async save(){
      const gang = getVal('p-gang');
      const name = getVal('p-name');
      const label = getVal('p-label');
      const model = getVal('p-model') || 'mp_m_freemode_01';
      const [x,y,z] = parseCoords(getVal('p-coords'));
      const h = parseFloat(getVal('p-h')||'0');
      const radius = parseFloat(qs('#p-radius')?.value || '1.75');
      const icon = getVal('p-icon') || 'fa-user';
      const scenario = getVal('p-scenario') || '';
      const reaction_radius = parseFloat(qs('#p-reaction-radius')?.value || '0');
      const reaction_scenario = getVal('p-reaction-scenario') || '';

      if(!gang || !name || isNaN(x)||isNaN(y)||isNaN(z)){
        return ui.pmsg(t('peds_err_invalid_coords', 'Missing data or invalid coords (use "x, y, z")'));
      }
      const editing = state.selPed && state.selPed.name === name;
      const res = await api.post(editing ? 'updatePed' : 'createPed', { gang, name, label, model, x, y, z, h, radius, icon, scenario, reaction_radius, reaction_scenario });
      if(res?.ok){
        ui.pmsg(t(res?.msgKey || 'peds_saved', 'Ped Saved ✅'));
        this.load(gang);
        ui.forms.ped();
      } else {
        ui.pmsg(t(res?.msgKey || (res?.error==='exists' ? 'peds_err_exists' : 'peds_err_saving'), res?.error==='exists' ? 'That name already exists' : 'Error saving'));
      }
    },

    async remove(){
      const name = getVal('p-name');
      const gang = getVal('p-gang');
      if(!name) return ui.pmsg(t('peds_err_specify_name', 'Specify the name'));
      const res = await api.post('deletePed', { name });
      if(res?.ok){
        ui.pmsg(t(res?.msgKey || 'peds_deleted', 'Deleted 🗑️'));
        this.load(gang);
        ui.forms.ped();
      } else ui.pmsg(t(res?.msgKey || 'peds_err_deleting', 'Error deleting'));
    },

    cancel(){
      ui.forms.ped();
    },

    async pickPos(){
      const p = await api.post('playerPos', {});
      if(!p) return;
      setVal('p-coords', `${f2(p.x||0)}, ${f2(p.y||0)}, ${f2(p.z||0)}`);
      if(p.h!=null) setVal('p-h', String(Math.round(p.h||0)));
    },

    async pickOnMap(){
      state.returnTab = state.returnTab || 'peds';
      state.returnInputId = state.returnInputId || 'p-coords';
      await api.post('pickPedLocation', {});
    }
  });

  // ---------------- Wire buttons ----------------
  qs('#p-save')?.addEventListener('click', ()=>handlers.peds.save());
  qs('#p-del')?.addEventListener('click', ()=>handlers.peds.remove());
  qs('#p-cancel')?.addEventListener('click', ()=>handlers.peds.cancel());
  qs('#p-pos')?.addEventListener('click', ()=>handlers.peds.pickPos());
  qs('#p-pick')?.addEventListener('click', ()=>handlers.peds.pickOnMap());

  // ---------------- Appearance editor modal ----------------
  const panel = qs('#ped-editor-modal');
  const openPanel = () => panel?.classList.remove('hidden');
  const closePanel = () => panel?.classList.add('hidden');

  const peName = qs('#pe-name');
  const peMsg  = qs('#pe-msg');
  const peSliders = qs('#pe-sliders');
  const peCamera = qs('#pe-camera');

  // Preview camera selector (face/body/legs/feet/full)
  const CAM_DEFAULT = 'body';
  const setCam = async (mode) => {
    mode = String(mode || CAM_DEFAULT);
    if(!['face','body','legs','feet','full'].includes(mode)) mode = CAM_DEFAULT;
    if(peCamera) peCamera.value = mode;
    await api.post('pedEditor:setCamera', { mode });
  };

  peCamera?.addEventListener('change', ()=>{
    setCam(peCamera.value);
  });

  const PARTS = {
    components: [
      { i:1,  key:'ped_comp_mask',        label:'Mask (1)',              groupKey:'ped_group_head',   group:'Head' },
      { i:3,  key:'ped_comp_torso',       label:'Torso (3)',             groupKey:'ped_group_torso',  group:'Torso' },
      { i:5,  key:'ped_comp_bags',        label:'Bags / Parachute (5)',  groupKey:'ped_group_torso',  group:'Torso' },
      { i:7,  key:'ped_comp_accessories', label:'Accessories (7)',       groupKey:'ped_group_torso',  group:'Torso' },
      { i:8,  key:'ped_comp_undershirt',  label:'Undershirt (8)',        groupKey:'ped_group_torso',  group:'Torso' },
      { i:9,  key:'ped_comp_armor',       label:'Armor (9)',             groupKey:'ped_group_torso',  group:'Torso' },
      { i:10, key:'ped_comp_decals',      label:'Decals (10)',           groupKey:'ped_group_torso',  group:'Torso' },
      { i:11, key:'ped_comp_top',         label:'Top (11)',              groupKey:'ped_group_torso',  group:'Torso' },

      { i:4,  key:'ped_comp_legs',        label:'Legs (4)',              groupKey:'ped_group_legs',   group:'Legs' },
      { i:6,  key:'ped_comp_shoes',       label:'Shoes (6)',             groupKey:'ped_group_legs',   group:'Legs' },
    ],
    props: [
      { i:0, key:'ped_prop_hat',      label:'Hat / Helmet (0)', groupKey:'ped_group_head',   group:'Head' },
      { i:1, key:'ped_prop_glasses',  label:'Glasses (1)',      groupKey:'ped_group_head',   group:'Head' },
      { i:2, key:'ped_prop_ears',     label:'Ears (2)',         groupKey:'ped_group_head',   group:'Head' },

      { i:6, key:'ped_prop_watch',    label:'Watch (6)',        groupKey:'ped_group_wrists', group:'Wrists' },
      { i:7, key:'ped_prop_bracelet', label:'Bracelet (7)',     groupKey:'ped_group_wrists', group:'Wrists' },

      { i:3, key:'ped_prop_misc3',    label:'Misc (3)',         groupKey:'ped_group_other',  group:'Other' },
      { i:4, key:'ped_prop_misc4',    label:'Misc (4)',         groupKey:'ped_group_other',  group:'Other' },
      { i:5, key:'ped_prop_misc5',    label:'Misc (5)',         groupKey:'ped_group_other',  group:'Other' },
    ]
  };

  let editorCtx = {
    standalone: false,
    wasAppVisible: false,
  };

  function setStandaloneMode(on){
    const app = qs('#app');
    if(!app) return;

    if(on){
      editorCtx.wasAppVisible = !app.classList.contains('hidden');
      app.classList.remove('hidden');
      document.body.classList.add('ped-editor-only');
    } else {
      document.body.classList.remove('ped-editor-only');
      if(!editorCtx.wasAppVisible){
        app.classList.add('hidden');
      }
      editorCtx.wasAppVisible = false;
    }
  }

  function makeRow({ label, min, max, value, step=1, disabled=false }){
    const row = document.createElement('div');
    row.className = 'pe-row';
    const lab = document.createElement('div');
    lab.className = 'muted';
    lab.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.disabled = !!disabled;

    const val = document.createElement('div');
    val.className = 'pe-val';
    val.textContent = String(value);

    input.addEventListener('input', ()=>{ val.textContent = input.value; });

    row.appendChild(lab);
    row.appendChild(input);
    row.appendChild(val);
    return { row, input, val };
  }

  function safeMax(n){
    n = parseInt(n,10);
    if(!Number.isFinite(n) || n < 0) return 0;
    return n;
  }

  async function updateTextureMax(type, index, drawable, texInput){
    const res = await api.post('pedEditor:getTextureMax', { type, index, drawable });
    const maxT = safeMax(res?.max);
    texInput.max = String(Math.max(maxT - 1, 0));
    const cur = parseInt(texInput.value, 10) || 0;
    if(cur > (maxT - 1)) texInput.value = String(Math.max(maxT - 1, 0));
    texInput.dispatchEvent(new Event('input'));
    return maxT;
  }

  async function applyPart(type, index, drawable, texture, palette){
    const res = await api.post('pedEditor:setPart', { type, index, drawable, texture, palette });
    return res;
  }

  // Debounce to allow smooth slider preview without spamming NUI callbacks.
  const _applyTimers = new Map();
  function scheduleApply(key, fn, delay=60){
    if(_applyTimers.has(key)) clearTimeout(_applyTimers.get(key));
    const t = setTimeout(()=>{
      _applyTimers.delete(key);
      fn();
    }, delay);
    _applyTimers.set(key, t);
  }

  function buildEditor(value){
    if(!peSliders) return;
    peSliders.innerHTML = '';

    const ranges = value?.ranges || {};
    const appearance = value?.appearance || {};
    const compApp = appearance.components || {};
    const propApp = appearance.props || {};
    const fmApp   = appearance.freemode || {};
    const fmRanges = ranges.freemode || {};

    const model = String(value?.model || '').toLowerCase();
    const isFreemode = (model === 'mp_m_freemode_01' || model === 'mp_f_freemode_01');

    const mkDetails = (title, open=true) => {
      const d = document.createElement('details');
      d.className = 'pe-details';
      if(open) d.open = true;
      const s = document.createElement('summary');
      s.textContent = title;
      d.appendChild(s);
      peSliders.appendChild(d);
      return d;
    };

    const appendTitle = (root, title) => {
      const h = document.createElement('h3');
      h.className = 'pe-h3';
      h.textContent = title;
      root.appendChild(h);
    };

    const clamp = (v,min,max)=> Math.min(Math.max(v,min),max);

    // ---------------- Freemode ----------------
    if(isFreemode){
      const ident = mkDetails(t('ped_identity','Identidad'), true);
      const hb = fmApp.headBlend || {};
      const parentMax = Number.isFinite(+fmRanges.parentMax) ? +fmRanges.parentMax : 45;

      const mkHB = (lab, key, min, max, step=1) => {
        const row = makeRow({ label: lab, min, max, step, value: clamp(+hb[key] || 0, min, max) });
        row.input.addEventListener('input', ()=> scheduleApply('hb', ()=>{
          const payload = {
            shapeFirst: parseInt(ident.querySelector('[data-hb=\"shapeFirst\"]').value,10)||0,
            shapeSecond: parseInt(ident.querySelector('[data-hb=\"shapeSecond\"]').value,10)||0,
            shapeThird: parseInt(ident.querySelector('[data-hb=\"shapeThird\"]').value,10)||0,
            skinFirst: parseInt(ident.querySelector('[data-hb=\"skinFirst\"]').value,10)||0,
            skinSecond: parseInt(ident.querySelector('[data-hb=\"skinSecond\"]').value,10)||0,
            skinThird: parseInt(ident.querySelector('[data-hb=\"skinThird\"]').value,10)||0,
            shapeMix: parseFloat(ident.querySelector('[data-hb=\"shapeMix\"]').value)||0,
            skinMix: parseFloat(ident.querySelector('[data-hb=\"skinMix\"]').value)||0,
            thirdMix: parseFloat(ident.querySelector('[data-hb=\"thirdMix\"]').value)||0
          };
          api.post('pedEditor:setHeadBlend', payload);
        }, 80));
        row.input.dataset.hb = key;
        ident.appendChild(row.row);
      };

      appendTitle(ident, t('ped_head_blend','Head Blend (Parents)'));
      mkHB(t('ped_hb_shape_father','Shape Father'), 'shapeFirst',  0, parentMax, 1);
      mkHB(t('ped_hb_shape_mother','Shape Mother'), 'shapeSecond',  0, parentMax, 1);
      mkHB(t('ped_hb_skin_father','Skin Father'),  'skinFirst',   0, parentMax, 1);
      mkHB(t('ped_hb_skin_mother','Skin Mother'),  'skinSecond',  0, parentMax, 1);
      mkHB(t('ped_hb_shape_mix','Shape Mix'), 'shapeMix',  0, 1, 0.01);
      mkHB(t('ped_hb_skin_mix','Skin Mix'),  'skinMix',   0, 1, 0.01);

      const adv = document.createElement('details');
      adv.className = 'pe-subdetails';
      const advS = document.createElement('summary');
      advS.textContent = t('ped_hb_adv_summary','Advanced (3rd Parent)');
      adv.appendChild(advS);
      ident.appendChild(adv);

      const mkHBAdv = (lab, key, min, max, step=1) => {
        const row = makeRow({ label: lab, min, max, step, value: clamp(+hb[key] || 0, min, max) });
        row.input.dataset.hb = key;
        row.input.addEventListener('input', ()=> scheduleApply('hb', ()=>{
          const payload = {
            shapeFirst: parseInt(ident.querySelector('[data-hb=\"shapeFirst\"]').value,10)||0,
            shapeSecond: parseInt(ident.querySelector('[data-hb=\"shapeSecond\"]').value,10)||0,
            shapeThird: parseInt(adv.querySelector('[data-hb=\"shapeThird\"]').value,10)||0,
            skinFirst: parseInt(ident.querySelector('[data-hb=\"skinFirst\"]').value,10)||0,
            skinSecond: parseInt(ident.querySelector('[data-hb=\"skinSecond\"]').value,10)||0,
            skinThird: parseInt(adv.querySelector('[data-hb=\"skinThird\"]').value,10)||0,
            shapeMix: parseFloat(ident.querySelector('[data-hb=\"shapeMix\"]').value)||0,
            skinMix: parseFloat(ident.querySelector('[data-hb=\"skinMix\"]').value)||0,
            thirdMix: parseFloat(adv.querySelector('[data-hb=\"thirdMix\"]').value)||0
          };
          api.post('pedEditor:setHeadBlend', payload);
        }, 80));
        adv.appendChild(row.row);
      };
      mkHBAdv(t('ped_hb_shape_third','Shape 3rd'), 'shapeThird',  0, parentMax, 1);
      mkHBAdv(t('ped_hb_skin_third','Skin 3rd'),  'skinThird',   0, parentMax, 1);
      mkHBAdv(t('ped_hb_third_mix','Third Mix'), 'thirdMix',  0, 1, 0.01);

      const face = mkDetails(t('ped_face','Face'), false);
      appendTitle(face, t('ped_face_features','Facial Features'));
      const ff = fmApp.faceFeatures || {};
      const faceLabels = [
        { key:'ped_ff_nose_width',          fb:'Nose Width' },
        { key:'ped_ff_nose_peak_height',    fb:'Nose Peak Height' },
        { key:'ped_ff_nose_peak_length',    fb:'Nose Peak Length' },
        { key:'ped_ff_nose_bone_high',      fb:'Nose Bone High' },
        { key:'ped_ff_nose_peak_lowering',  fb:'Nose Peak Lowering' },
        { key:'ped_ff_nose_bone_twist',     fb:'Nose Bone Twist' },
        { key:'ped_ff_eyebrow_high',        fb:'Eyebrow High' },
        { key:'ped_ff_eyebrow_forward',     fb:'Eyebrow Forward' },
        { key:'ped_ff_cheekbone_high',      fb:'Cheekbone High' },
        { key:'ped_ff_cheekbone_width',     fb:'Cheekbone Width' },
        { key:'ped_ff_cheeks_width',        fb:'Cheeks Width' },
        { key:'ped_ff_eyes_opening',        fb:'Eyes Opening' },
        { key:'ped_ff_lips_thickness',      fb:'Lips Thickness' },
        { key:'ped_ff_jaw_bone_width',      fb:'Jaw Bone Width' },
        { key:'ped_ff_jaw_bone_back',       fb:'Jaw Bone Back Length' },
        { key:'ped_ff_chin_bone_lowering',  fb:'Chin Bone Lowering' },
        { key:'ped_ff_chin_bone_length',    fb:'Chin Bone Length' },
        { key:'ped_ff_chin_bone_width',     fb:'Chin Bone Width' },
        { key:'ped_ff_chin_hole',           fb:'Chin Hole' },
        { key:'ped_ff_neck_thickness',      fb:'Neck Thickness' }
      ];
      for(let i=0;i<20;i++){
        const key = String(i);
        const v = Number.isFinite(+ff[key]) ? +ff[key] : 0;
        const row = makeRow({ label: `${t(faceLabels[i].key, faceLabels[i].fb)} (${i})`, min:-1, max:1, step:0.01, value: clamp(v,-1,1) });
        row.input.addEventListener('input', ()=> scheduleApply(`ff:${i}`, ()=>{
          api.post('pedEditor:setFaceFeature', { index:i, value: parseFloat(row.input.value)||0 });
        }, 60));
        face.appendChild(row.row);
      }

      const hair = mkDetails(t('ped_hair','Hair'), false);
      appendTitle(hair, t('ped_style','Style'));

      // Hair (component slot 2)
      const hairComp = compApp?.["2"] || {};
      const hairRange = ranges.components?.["2"] || {};
      const hairDrawableMax = Math.max(safeMax(hairRange.maxD) - 1, 0);

      const hairStyleRow = makeRow({
        label:t('ped_hair_style','Hair Style'),
        min:0,
        max:hairDrawableMax,
        value: clamp(+hairComp.drawable||0, 0, hairDrawableMax)
      });

      const hairTexMax = Math.max(safeMax(hairRange.maxT) - 1, 0);
      const hairTexRow = makeRow({
        label:t('ped_hair_texture','Hair Texture'),
        min:0,
        max: hairTexMax,
        value: clamp(+hairComp.texture||0, 0, hairTexMax)
      });

      const applyHairStyle = ()=> applyPart('c',
        2,
        parseInt(hairStyleRow.input.value,10)||0,
        parseInt(hairTexRow.input.value,10)||0,
        0
      );

      hairStyleRow.input.addEventListener('input', async ()=>{
        const d = parseInt(hairStyleRow.input.value,10)||0;
        await updateTextureMax('c', 2, d, hairTexRow.input);
        scheduleApply('hairstyle', applyHairStyle, 60);
      });

      hairTexRow.input.addEventListener('input', ()=> scheduleApply('hairtex', applyHairStyle, 60));

      hair.appendChild(hairStyleRow.row);
      hair.appendChild(hairTexRow.row);

      appendTitle(hair, t('ped_colors','Colors'));
      const hairColorMax = Math.max((fmRanges.hairColors||0)-1, 0);
      const hc = fmApp.hair || {};
      const hairRow = makeRow({ label:t('ped_hair_color','Hair Color'), min:0, max:hairColorMax, value: clamp(+hc.color||0, 0, hairColorMax) });
      const highRow = makeRow({ label:t('ped_hair_highlight','Hair Highlight'), min:0, max:hairColorMax, value: clamp(+hc.highlight||0, 0, hairColorMax) });
      const applyHair = ()=> api.post('pedEditor:setHairColor', {
        color: parseInt(hairRow.input.value,10)||0,
        highlight: parseInt(highRow.input.value,10)||0
      });
      hairRow.input.addEventListener('input', ()=> scheduleApply('hairc', applyHair, 60));
      highRow.input.addEventListener('input', ()=> scheduleApply('hairc', applyHair, 60));
      hair.appendChild(hairRow.row);
      hair.appendChild(highRow.row);

      const eyes = mkDetails(t('ped_eyes','Eyes'), false);
      const eyeMax = Math.max((fmRanges.eyeColors||0)-1, 0);
      const eyeRow = makeRow({ label:t('ped_eye_color','Eye Color'), min:0, max:eyeMax, value: clamp(+fmApp.eyeColor||0, 0, eyeMax) });
      eyeRow.input.addEventListener('input', ()=> scheduleApply('eye', ()=>{
        api.post('pedEditor:setEyeColor', { value: parseInt(eyeRow.input.value,10)||0 });
      }, 60));
      eyes.appendChild(eyeRow.row);

      const overlays = mkDetails(t('ped_overlays','Overlays / Makeup'), false);
      const ovApp = fmApp.overlays || {};
      const ovRanges = fmRanges.overlays || {};

      const ovMeta = [
        { id:0,  name:'Blemishes', colorType:null },
        { id:1,  name:'Beard', colorType:1 },
        { id:2,  name:'Eyebrows', colorType:1 },
        { id:3,  name:'Ageing', colorType:null },
        { id:4,  name:'Makeup', colorType:2 },
        { id:5,  name:'Blush', colorType:2 },
        { id:6,  name:'Complexion', colorType:null },
        { id:7,  name:'Sun Damage', colorType:null },
        { id:8,  name:'Lipstick', colorType:2 },
        { id:9,  name:'Moles / Freckles', colorType:null },
        { id:10, name:'Chest Hair', colorType:1 },
        { id:11, name:'Body Blemishes', colorType:null },
        { id:12, name:'Add Body Blemishes', colorType:null },
      ];

      for(const meta of ovMeta){
        const d = document.createElement('details');
        d.className = 'pe-subdetails';
        const s = document.createElement('summary');
        s.textContent = meta.name;
        d.appendChild(s);

        const cur = ovApp[String(meta.id)] || {};
        const max = Math.max((ovRanges[String(meta.id)]?.max || 0)-1, -1);
        const idxRow = makeRow({ label:t('ped_style','Style'), min:-1, max:max, value: clamp((Number.isFinite(+cur.index)?+cur.index:-1), -1, max) });
        const opRow  = makeRow({ label:t('ped_opacity','Opacity'), min:0, max:1, step:0.01, value: clamp((Number.isFinite(+cur.opacity)?+cur.opacity:1),  1) });

        const applyOverlay = ()=> api.post('pedEditor:setHeadOverlay', {
          overlayId: meta.id,
          value: parseInt(idxRow.input.value,10),
          opacity: parseFloat(opRow.input.value)
        });

        idxRow.input.addEventListener('input', ()=> scheduleApply(`ov:${meta.id}`, applyOverlay, 70));
        opRow.input.addEventListener('input', ()=> scheduleApply(`ov:${meta.id}`, applyOverlay, 70));

        d.appendChild(idxRow.row);
        d.appendChild(opRow.row);

        if(meta.colorType !== null){
          const colorMax = (meta.colorType === 1)
            ? Math.max((fmRanges.hairColors||0)-1,0)
            : Math.max((fmRanges.makeupColors||0)-1,0);

          const color = Number.isFinite(+cur.color) ? +cur.color : 0;
          const sec   = Number.isFinite(+cur.secondColor) ? +cur.secondColor : 0;

          const cRow  = makeRow({ label:t('ped_color','Color'), min:0, max:colorMax, value: clamp(color,colorMax) });
          const sRow  = makeRow({ label:t('ped_secondary','Secondary'), min:0, max:colorMax, value: clamp(sec,colorMax) });

          const applyColor = ()=> api.post('pedEditor:setHeadOverlayColor', {
            overlayId: meta.id,
            colorType: meta.colorType,
            color: parseInt(cRow.input.value,10)||0,
            secondColor: parseInt(sRow.input.value,10)||0
          });

          cRow.input.addEventListener('input', ()=> scheduleApply(`ovc:${meta.id}`, applyColor, 70));
          sRow.input.addEventListener('input', ()=> scheduleApply(`ovc:${meta.id}`, applyColor, 70));

          d.appendChild(cRow.row);
          d.appendChild(sRow.row);
        }

        overlays.appendChild(d);
      }
    }

    // ---------------- Components (Ropa) ----------------
    const compDetails = mkDetails(t('ped_clothes_components','Clothes (Components)'), true);
    const compGroups = [
      { id:'Head',  key:'ped_group_head',  fallback:'Head' },
      { id:'Torso', key:'ped_group_torso', fallback:'Torso' },
      { id:'Legs',  key:'ped_group_legs',  fallback:'Legs' },
    ];
    for(const g of compGroups){
      const sub = document.createElement('details');
      sub.className = 'pe-subdetails';
      sub.open = true;
      const s = document.createElement('summary');
      s.textContent = t(g.key, g.fallback);
      sub.appendChild(s);

      for(const part of PARTS.components.filter(x=>x.group===g.id)){
        const k = String(part.i);
        const r = ranges.components?.[k] || {};
        const a = compApp?.[k] || {};
        const maxD = safeMax(r.maxD);
        const curD = Number.isFinite(+a.drawable) ? +a.drawable : 0;
        const curT = Number.isFinite(+a.texture) ? +a.texture : 0;
        const curP = Number.isFinite(+a.palette) ? +a.palette : 0;
        const maxT = safeMax(r.maxT);

        const item = document.createElement('div');
        item.className = 'pe-item';
        item.innerHTML = `<h4>${t(part.key, part.label)}</h4>`;

        const d = makeRow({ label:window.gcLocales?.t?.('drawable') || 'Drawable', min:0, max:Math.max(maxD-1,0), value:Math.min(curD, Math.max(maxD-1,0)) });
        const trow = makeRow({ label:window.gcLocales?.t?.('texture') || 'Texture',  min:0, max:Math.max(maxT-1,0), value:Math.min(curT, Math.max(maxT-1,0)) });
        const p = makeRow({ label:t('ped_palette','Palette'),  min:0, max:3, value:Math.min(curP,3) });

        const key = `c:${part.i}`;
        const doApply = ()=> applyPart('c', part.i,
          parseInt(d.input.value,10)||0,
          parseInt(trow.input.value,10)||0,
          parseInt(p.input.value,10)||0
        );

        d.input.addEventListener('input', ()=> scheduleApply(key, doApply));
        trow.input.addEventListener('input', ()=> scheduleApply(key, doApply));
        p.input.addEventListener('input', ()=> scheduleApply(key, doApply));

        d.input.addEventListener('change', async ()=>{
          await updateTextureMax('c', part.i, parseInt(d.input.value,10)||0, trow.input);
          await doApply();
        });

        item.appendChild(d.row);
        item.appendChild(trow.row);
        item.appendChild(p.row);
        sub.appendChild(item);
      }

      compDetails.appendChild(sub);
    }

    // ---------------- Props ----------------
    const propDetails = mkDetails(t('ped_props','Props'), false);
    const propGroups = [
      { id:'Head',   key:'ped_group_head',   fallback:'Head' },
      { id:'Wrists', key:'ped_group_wrists', fallback:'Wrists' },
      { id:'Other',  key:'ped_group_other',  fallback:'Other' },
    ];
    for(const g of propGroups){
      const sub = document.createElement('details');
      sub.className = 'pe-subdetails';
      sub.open = true;
      const s = document.createElement('summary');
      s.textContent = t(g.key, g.fallback);
      sub.appendChild(s);

      for(const part of PARTS.props.filter(x=>x.group===g.id)){
        const k = String(part.i);
        const r = ranges.props?.[k] || {};
        const a = propApp?.[k] || {};
        const maxD = safeMax(r.maxD);
        const curD = Number.isFinite(+a.drawable) ? +a.drawable : -1;
        const curT = Number.isFinite(+a.texture) ? +a.texture : 0;
        const maxT = safeMax(r.maxT);

        const item = document.createElement('div');
        item.className = 'pe-item';
        item.innerHTML = `<h4>${t(part.key, part.label)}</h4>`;

        const d = makeRow({ label:window.gcLocales?.t?.('drawable') || 'Drawable', min:-1, max:Math.max(maxD-1,-1), value:Math.min(curD, Math.max(maxD-1,-1)) });
        const trow = makeRow({ label:window.gcLocales?.t?.('texture') || 'Texture',  min:0, max:Math.max(maxT-1,0), value:Math.min(curT, Math.max(maxT-1,0)), disabled:(parseInt(d.input.value,10)<0) });

        const setTexDisabled = () => { trow.input.disabled = (parseInt(d.input.value,10) < 0); };

        const key = `p:${part.i}`;
        const doApply = ()=> applyPart('p', part.i,
          parseInt(d.input.value,10)||0,
          parseInt(trow.input.value,10)||0,
          0
        );

        d.input.addEventListener('input', ()=>{
          setTexDisabled();
          scheduleApply(key, doApply);
        });
        trow.input.addEventListener('input', ()=> scheduleApply(key, doApply));

        d.input.addEventListener('change', async ()=>{
          const dv = parseInt(d.input.value,10);
          setTexDisabled();
          if(dv < 0){
            trow.input.value = '0';
            trow.input.dispatchEvent(new Event('input'));
            await applyPart('p', part.i, -1,  0);
            return;
          }
          await updateTextureMax('p', part.i, dv, trow.input);
          await doApply();
        });

        trow.input.addEventListener('change', async ()=>{
          if(parseInt(d.input.value,10) < 0) return;
          await doApply();
        });

        item.appendChild(d.row);
        item.appendChild(trow.row);
        sub.appendChild(item);
      }

      propDetails.appendChild(sub);
    }
  }
qs('#pe-random')?.addEventListener('click', async ()=>{
    const res = await api.post('pedEditor:randomize', {});
    if(res?.components){
      // refresh sliders with the new snapshot (keep ranges)
      const current = window.__gcPedEditorValue || {};
      current.appearance = res;
      window.__gcPedEditorValue = current;
      buildEditor(current);
    }
  });

  qs('#pe-save')?.addEventListener('click', async ()=>{
    const res = await api.post('pedEditor:save', {});
    if(res?.ok){
      if(peMsg) peMsg.textContent = t(res?.msgKey || 'peds_saved', 'Saved ✅');
      // refresh list if a gang is selected
      const gang = state.selected?.name || getVal('p-gang');
      if(gang) handlers.peds.load(gang);
    } else {
      if(peMsg) peMsg.textContent = t(res?.msgKey || 'peds_err_saving', 'Error saving');
    }
  });

  function closeEditor(){
    api.post('pedEditor:close', {});
    closePanel();
    if(peMsg) peMsg.textContent = '';

    // Restore normal UI visibility if this editor was opened from world interaction.
    if(editorCtx.standalone){
      setStandaloneMode(false);
      editorCtx.standalone = false;
    }
  }
  qs('#pe-close')?.addEventListener('click', closeEditor);
  qs('#pe-cancel')?.addEventListener('click', closeEditor);

  // open from client interaction
  window.addEventListener('message', (event) => {
    const { action, value } = event.data || {};
    if(action !== 'peds:openEditor') return;

    // If opened from a world interaction, hide the rest of the GangCreator UI.
    editorCtx.standalone = !!value?.standalone;
    if(editorCtx.standalone){
      setStandaloneMode(true);
    }

    if(peName) peName.textContent = value?.label || value?.name || '-';
    if(peMsg) peMsg.textContent = '';
    window.__gcPedEditorValue = value;
    buildEditor(value);
    // Ensure preview camera matches current selector each time we open.
    setCam(peCamera?.value || CAM_DEFAULT);
    openPanel();
  });
})();
