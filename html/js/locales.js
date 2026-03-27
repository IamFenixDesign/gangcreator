(() => {
  const { qs, qsa, api } = window.GC;

  // ============================= i18n ===========================
  // Locales are provided by Lua (client) instead of JSON files.
  // The NUI requests the dictionary via NUI callbacks.

  const locales = {
    langKey: 'lang',
    current: 'es',
    dicts: {},

    t(key) {
      const dict = this.dicts[this.current] || {};
      return dict[key] ?? '';
    },

    applyAll() {
      // Preserve UI state (scroll + opened <details> + draggable position)
      const app = qs('#app');
      const scrollables = qsa('.window, .tab-content, .modal-body, .section-body, .list-panel, .form-panel, .pe-sliders, .table-wrap');
      const scrollState = scrollables.map((el, idx) => ({
        idx,
        el,
        top: el.scrollTop,
        left: el.scrollLeft
      }));

      const detailsState = qsa('details').map((d, idx) => ({
        idx,
        d,
        open: d.open
      }));

      // If the user already dragged the UI, keep its left/top.
      const appPos = app ? { left: app.style.left || '', top: app.style.top || '', transform: app.style.transform || '' } : null;

      document.documentElement?.setAttribute('lang', this.current);

      qsa('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = this.t(key);
        if (val) el.textContent = val;
      });

      qsa('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = this.t(key);
        if (val) el.setAttribute('placeholder', val);
      });

      qsa('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const val = this.t(key);
        if (val) el.setAttribute('aria-label', val);
      });

      qsa('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const val = this.t(key);
        if (val) el.setAttribute('title', val);
      });

      const titleNode = qs('title[data-i18n="title"]');
      const titleVal = this.t('title');
      if (titleNode && titleVal) titleNode.textContent = titleVal;

      const sel = qs('#lang-switcher');
      if (sel && sel.value !== this.current) sel.value = this.current;

      // Restore state after layout settles (CEF sometimes needs 2 frames)
      const restore = () => {
        try {
          for (const s of scrollState) {
            if (!s.el) continue;
            s.el.scrollTop = s.top;
            s.el.scrollLeft = s.left;
          }
          for (const ds of detailsState) {
            if (!ds.d) continue;
            ds.d.open = ds.open;
          }
          if (app && appPos) {
            if (appPos.left) app.style.left = appPos.left;
            if (appPos.top) app.style.top = appPos.top;
            if (appPos.transform) app.style.transform = appPos.transform;
          }
        } catch {}
      };

      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
      });

      try {
        window.dispatchEvent(new CustomEvent('gc:locale-changed', {
          detail: {
            lang: this.current,
            dict: this.dicts[this.current] || {}
          }
        }));
      } catch {}
    },
    _store(lang) {
      try { localStorage.setItem(this.langKey, lang); } catch {}
    },

    _restore() {
      try { return localStorage.getItem(this.langKey) || 'es'; } catch { return 'es'; }
    },

    async _fetchFromLua(cbName, lang) {
      const res = await api.post(cbName, { lang });
      if (res && typeof res === 'object' && res.lang && res.dict) {
        return res;
      }
      return null;
    },

    async set(lang = 'es') {
      // Ask Lua to set locale and return the dictionary.
      const res = await this._fetchFromLua('setLocale', lang);
      if (!res) {
        // Fallback: ask for current locale from Lua.
        const cur = await this._fetchFromLua('getLocale', lang);
        if (!cur) return;
        this.current = cur.lang;
        this.dicts[this.current] = cur.dict || {};
        this._store(this.current);
        this.applyAll();
        return;
      }

      this.current = res.lang;
      this.dicts[this.current] = res.dict || {};
      this._store(this.current);
      this.applyAll();
    },

    async init() {
      const saved = this._restore();

      // First try: request the saved locale from Lua.
      const first = await this._fetchFromLua('getLocale', saved);
      if (first) {
        this.current = first.lang;
        this.dicts[this.current] = first.dict || {};
        this._store(this.current);
        this.applyAll();
      } else {
        await this.set(saved);
      }

      qs('#lang-switcher')?.addEventListener('change', async (e) => {
        await this.set(e.target.value);
      });
    }
  };

  window.gcLocales = locales;
})();
