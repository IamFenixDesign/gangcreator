// ====== About / Changelog ======
const CHANGELOG = [
  { version:'1.1.1', date:'03-31-26', notes:[
    'Added esx_progressbar compatibility',
    'Added auto detect progressbar on config.lua',
    'Organized config.lua',
    'Fixed players not gettings items on craftstations',
  ], links:[] },
  { version:'1.1.0', date:'03-25-26', notes:[
    'Redesign all UI',
    'Added siderbar menu option',
    'Added esx_textui compatibility',
    'Added esx_menu compatibility',
    'Added esx_addoninventory compatibility',
    'Added esx_addonaccount compatibility',
    'Added auto-copy on QB/ESX Notify',
    'Update some locales',
  ], links:[] },
  { version:'1.0.9', date:'03-19-26', notes:[
    'Added new tab organization with menu',
    'Added searchbar for each gang',
    'Added ped reactions on non gang members',
    'Added logs config for peds',
    'Added locales to garagemenu and membersmenu',
    'Removed username and avatar config from logs',
    'Fixed NPC not being deleted when gangs was deleted',
    'Fixed ox_lib notify icons on ESX',    
  ], links:[] },
  { version:'1.0.8', date:'03-08-26', notes:[
    'Add creator garage tab',
    'Add NPC tab',    
    'Add command to see gang and rank',  
    'Form organization improved in all tabs',
    'Added new translations',
    'Add missing translations',
    'Locales are now .lua instead of json',
  ], links:[] },
  { version:'1.0.7', date:'02-23-26', notes:[
    'Add zone creator',
    'Add arrow on theme selector',
  ], links:[] },
  { version:'1.0.6', date:'02-1-26', notes:[
    'Add option to move ui all over the screen',
    'Add fenix-minigames for crafting',
    'Add rcore clothing compatiiblity',
    'Add tgiann clothing compatiiblity',
    'Fix craft creations',
  ], links:[] },
  { version:'1.0.5', date:'01-17-26', notes:[
    'Add confirmation box to remove options',
    'Add gangname in topbar when is selected',
    'Add themes and posibility to import custome ones',
    'Add website on about section',
    'Reorganized.js',
  ], links:[] },
  { version:'1.0.4', date:'01-06-26', notes:[
    'Add  qb-inventory compatibility ',
    'Add qb-menu compatibility',
    'Add menu script config',
    'Add qb-core progressbar',
    'Add qb-clothing support (check export file fix)',
    'Add more notify to configs',
    'Remove comments on all files (This dont change nothing on script, replace all client/server files)',
  ], links:[] },
  { version:'1.0.3', date:'12-03-25', notes:[
    'Fix props not loading in correct position on ESX',
    'Membersmenu: now shoes Player name instead of char1 on ESX',
  ], links:[] },
  { version:'1.0.2-1', date:'12-02-25', notes:[
    'Added Changelog prints ',
    'Fixed ESX Support',
    'Fix edit gang name not working on ESX',
  ], links:[] },
  { version:'1.0.2', date:'12-01-25', notes:[
    'Added ESX Support',
    'Added missing translation on player information',
    'Added missin translation on delete button on created items shop',
    'Added more notification text config ',
    'Addes version checker',
    'Moved  QB exports to bridge/qb/*.lua',
    'Changed CitizenID text to IDs in UI and in notify',
    'Redesign UI ',
    'Change server files to manage each options in different lua',
  ], links:[] },
  { version:'1.0.1', date:'10-31-25', notes:[
    'Added QB-Target compatibility',
    'Replace Drawhelp to ox lib showtextui',
    'Client files optimization',
    'Added target prints',
    'Removed beta changelogs',
  ], links:[] },
  { version:'1.0', date:'10-24-25', notes:['Initial Release'], links:[] }
];

let changelogShowAll = false;

function openInfo() {
  const modal = document.getElementById('info-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  initChangelog();
}

function closeInfo() {
  document.getElementById('info-modal')?.classList.add('hidden');
}

function initChangelog() {
  const select = document.getElementById('changelog-select');
  const list = document.getElementById('changelog');
  if (!select || !list) return;

  if (!select.options.length) {
    CHANGELOG.forEach((entry) => {
      const opt = document.createElement('option');
      opt.value = entry.version;
      opt.textContent = `${entry.version} (${entry.date})`;
      if (entry.version === window.APP_VERSION) opt.selected = true;
      select.appendChild(opt);
    });
  }

  renderChangelog(select.value || window.APP_VERSION);

  select.onchange = () => renderChangelog(select.value);
  const btnCopy = document.getElementById('changelog-copy');
  const btnToggle = document.getElementById('changelog-toggle');
  if (btnCopy) btnCopy.onclick = copyChangelog;
  if (btnToggle) btnToggle.onclick = toggleChangelogMode;
}

function renderChangelog(versionOrAll) {
  const list = document.getElementById('changelog');
  if (!list) return;
  list.innerHTML = '';

  const entries = changelogShowAll ? CHANGELOG : CHANGELOG.filter(e => e.version === versionOrAll);
  entries.forEach(entry => {
    entry.notes.forEach(n => {
      const li = document.createElement('li');
      li.textContent = '• ' + n;
      list.appendChild(li);
    });
    if (entry.links && entry.links.length) {
      entry.links.forEach(l => {
        const li = document.createElement('li');
        li.innerHTML = `↗ <a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`;
        list.appendChild(li);
      });
    }
  });
}

function copyChangelog() {
  const select = document.getElementById('changelog-select');
  const entries = changelogShowAll ? CHANGELOG : CHANGELOG.filter(e => e.version === (select?.value || window.APP_VERSION));
  const text = entries.map(e => {
    let t = `${e.version} — ${e.date}\n`;
    e.notes.forEach(n => { t += `- ${n}\n`; });
    if (e.links?.length) {
      e.links.forEach(l => { t += `  ${l.label}: ${l.href}\n`; });
    }
    return t;
  }).join('\n');
  navigator.clipboard?.writeText(text).then(() => {
    const btn = document.getElementById('changelog-copy');
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = prev), 1200);
    }
  });
}

function toggleChangelogMode() {
  changelogShowAll = !changelogShowAll;
  const btn = document.getElementById('changelog-toggle');
  if (btn) btn.textContent = changelogShowAll ? 'View current version' : 'View all';
  const select = document.getElementById('changelog-select');
  renderChangelog(select?.value || window.APP_VERSION);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('info-btn')?.addEventListener('click', () => openInfo());
    document.getElementById('info-close')?.addEventListener('click', closeInfo);
  document.getElementById('info-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'info-modal') closeInfo();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeInfo(); });
});

(function enableExternalLinks(){
  function openExternal(href){
    if(!href) return;
    try {
      if (typeof window.invokeNative === 'function') {
        window.invokeNative('openUrl', href);
        return;
      }
    } catch(e){}
    try { window.open(href, '_blank', 'noopener,noreferrer'); } catch(e){}
  }

  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if (!a) return;
    const isExternal = a.classList.contains('icon-link') || a.hasAttribute('data-external');
    if (!isExternal) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    e.preventDefault();
    openExternal(href);
  });
})();
