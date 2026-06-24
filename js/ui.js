// ============================================================
// HUGUS FC · ui.js — Preloader, Nav, Reveal, Toast, PWA
// ============================================================

/* ── TOAST ── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3200);
}

/* ── PRELOADER ── */
let _pct = 0, _pageReady = false;
(function initPreloader() {
  const fill    = document.getElementById('preFill');
  const pctEl   = document.getElementById('prePercent');
  const statusEl= document.getElementById('preStatus');
  const statuses = [
    'Cargando escudo del club…',
    'Conectando con Firebase…',
    'Preparando calendario…',
    'Casi listo…',
    '¡Bienvenido a HUGUS FC!'
  ];
  let sIdx = 0;
  function paint(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    if (fill)  fill.style.width = v + '%';
    if (pctEl) pctEl.textContent = v + '%';
    const newS = statuses[Math.min(Math.floor(v / 22), statuses.length - 1)];
    if (statusEl && statusEl.textContent !== newS) statusEl.textContent = newS;
  }
  const tick = setInterval(() => {
    if (_pageReady) return;
    const step = _pct < 65 ? 5 : _pct < 88 ? 2 : 0.6;
    _pct = Math.min(94, _pct + step);
    paint(_pct);
  }, 120);

  window.addEventListener('load', () => {
    _pageReady = true;
    clearInterval(tick);
    const done = setInterval(() => {
      _pct = Math.min(100, _pct + 4);
      paint(_pct);
      if (_pct >= 100) {
        clearInterval(done);
        setTimeout(() => {
          const pre = document.getElementById('preloader');
          if (pre) pre.classList.add('hide');
          document.body.classList.remove('loading');
        }, 480);
      }
    }, 30);
  });
})();

/* ── NAV SCROLL ── */
const _nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  if (_nav) _nav.classList.toggle('scrolled', window.scrollY > 60);
  const btt = document.getElementById('btt');
  if (btt) btt.classList.toggle('show', window.scrollY > 420);
}, { passive: true });

/* ── NAV ACTIVE LINK ── */
const _sections  = document.querySelectorAll('section[id]');
const _navLinks  = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let cur = '';
  _sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.getAttribute('id'); });
  _navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
}, { passive: true });

/* ── HAMBURGER ── */
const _ham   = document.getElementById('ham');
const _mobM  = document.getElementById('mobMenu');
if (_ham) {
  _ham.addEventListener('click', () => {
    _ham.classList.toggle('active');
    _mobM.classList.toggle('open');
  });
}
document.addEventListener('click', e => {
  if (_mobM && _mobM.classList.contains('open') && !_mobM.contains(e.target) && !_ham.contains(e.target))
    closeMenu();
});
function closeMenu() {
  if (_ham)  _ham.classList.remove('active');
  if (_mobM) _mobM.classList.remove('open');
}

/* ── USER DROPDOWN ── */
const _avatarBtn  = document.getElementById('userAvatarBtn');
const _userDrop   = document.getElementById('userDropdown');
if (_avatarBtn) {
  _avatarBtn.addEventListener('click', e => {
    e.stopPropagation();
    _userDrop.classList.toggle('active');
  });
}
document.addEventListener('click', () => { if (_userDrop) _userDrop.classList.remove('active'); });

/* ── REVEAL ANIMATIONS ── */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.07, rootMargin: '0px 0px -35px 0px' });
document.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-up').forEach(el => revObs.observe(el));

/* ── STATS COUNTER ── */
function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const t = +el.getAttribute('data-target');
    let c = 0;
    const step = Math.max(1, Math.floor(t / 55));
    const timer = setInterval(() => {
      c = Math.min(c + step, t);
      el.textContent = c + (t === 100 ? '%' : '');
      if (c >= t) clearInterval(timer);
    }, 22);
  });
}
const _sObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); _sObs.disconnect(); } });
}, { threshold: 0.3 });
const _sb = document.querySelector('.statsbar');
if (_sb) _sObs.observe(_sb);

/* ── PWA ── */
let _deferredPrompt = null;
const _installBanner = document.getElementById('installBanner');
const _updateBanner  = document.getElementById('updateBanner');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  if (!localStorage.getItem('hugusInstallClosed') && _installBanner) _installBanner.classList.add('show');
});

async function instalarApp() {
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    if (_installBanner) _installBanner.classList.remove('show');
    showToast('📲 Instalación iniciada');
  } else {
    showToast('📲 En Chrome: menú ⋮ → Agregar a pantalla principal');
  }
}
function cerrarInstallBanner() {
  localStorage.setItem('hugusInstallClosed', '1');
  if (_installBanner) _installBanner.classList.remove('show');
}
function cerrarUpdateBanner() { if (_updateBanner) _updateBanner.classList.remove('show'); }
function actualizarAhora() {
  if ('caches' in window) caches.keys().then(k => k.forEach(n => caches.delete(n))).finally(() => location.reload());
  else location.reload();
}
function forzarActualizacion() { showToast('🔄 Buscando actualización…'); setTimeout(actualizarAhora, 700); }

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller && _updateBanner)
            _updateBanner.classList.add('show');
        });
      });
    } catch (e) { console.warn('SW no registrado:', e); }
  });
}

/* ── ESCAPE PARA CERRAR MODALES ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    cerrarAuth && cerrarAuth();
    cerrarTienda && cerrarTienda();
    cerrarPerfil && cerrarPerfil();
    cerrarAdminPanel && cerrarAdminPanel();
  }
});