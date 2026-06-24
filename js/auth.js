// ============================================================
// HUGUS FC · auth.js — Autenticación Firebase
// ============================================================

/* ── ESCUCHAR ESTADO ── */
auth.onAuthStateChanged(async user => {
  if (user) {
    const doc = await db.collection(COL.USUARIOS).doc(user.uid).get();
    const d = doc.exists ? doc.data() : { nombre: user.displayName || 'Hincha', apellido: '', esAdmin: false };
    const u = {
      uid: user.uid,
      email: user.email,
      nombre: d.nombre || 'Hincha',
      apellido: d.apellido || '',
      esAdmin: d.esAdmin || ADMIN_EMAILS.includes(user.email),
      fechaRegistro: d.fechaRegistro || new Date().toISOString().split('T')[0]
    };
    saveSession(u);
    updateUILoggedIn(u);
    if (esAdmin(user)) {
      cargarTablaPartidosAdmin && cargarTablaPartidosAdmin();
      cargarTablaNoticiasAdmin && cargarTablaNoticiasAdmin();
      cargarAdminTabla && cargarAdminTabla();
    }
  } else {
    clearSession();
    updateUILoggedOut();
  }
});

/* ── UI STATE ── */
function updateUILoggedIn(user) {
  const btnAcceder  = document.getElementById('btnAcceder');
  const uMenu       = document.getElementById('userMenuContainer');
  const avatarBtn   = document.getElementById('userAvatarBtn');
  const adminLink   = document.getElementById('adminLinkBtn');
  const mobBtn      = document.getElementById('mobAccederBtn');
  if (btnAcceder) btnAcceder.style.display = 'none';
  if (uMenu)      uMenu.style.display = 'block';
  if (avatarBtn)  avatarBtn.textContent = (user.nombre || 'H').charAt(0).toUpperCase();
  if (adminLink)  adminLink.style.display = esAdmin(user) ? 'flex' : 'none';
  if (mobBtn) {
    mobBtn.textContent = '⚽ ' + user.nombre + ' — Tienda';
    mobBtn.onclick = () => { closeMenu(); abrirTienda(); };
  }
}
function updateUILoggedOut() {
  const btnAcceder = document.getElementById('btnAcceder');
  const uMenu      = document.getElementById('userMenuContainer');
  const mobBtn     = document.getElementById('mobAccederBtn');
  if (btnAcceder) btnAcceder.style.display = 'inline-flex';
  if (uMenu)      uMenu.style.display = 'none';
  if (mobBtn) {
    mobBtn.textContent = '⚽ Acceder / Registrarse';
    mobBtn.onclick = () => { closeMenu(); abrirAuth(); };
  }
}

/* ── REGISTER ── */
async function registerUser() {
  const nombre   = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const referido = document.getElementById('regReferido').value.trim();
  if (!nombre || !apellido || !email || !password) return showAuthError('Todos los campos son obligatorios.');
  if (password.length < 8) return showAuthError('La contraseña debe tener al menos 8 caracteres.');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection(COL.USUARIOS).doc(cred.user.uid).set({
      nombre, apellido, email, referido,
      esAdmin: false,
      fechaRegistro: new Date().toISOString().split('T')[0]
    });
    cerrarAuth();
    showToast('🎉 ¡Bienvenido a HUGUS FC!');
    abrirPerfil();
  } catch (err) { showAuthError(tradError(err.code)); }
}

/* ── LOGIN ── */
async function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showAuthError('Ingresa tu correo y contraseña.');
  try {
    await auth.signInWithEmailAndPassword(email, password);
    cerrarAuth();
    showToast('👋 Sesión iniciada');
    abrirPerfil();
  } catch (err) { showAuthError(tradError(err.code)); }
}

/* ── GOOGLE ── */
async function loginWithGoogleDemo() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await auth.signInWithPopup(provider);
    const user  = cred.user;
    const doc   = await db.collection(COL.USUARIOS).doc(user.uid).get();
    if (!doc.exists) {
      const parts = (user.displayName || 'Hincha').split(' ');
      await db.collection(COL.USUARIOS).doc(user.uid).set({
        nombre: parts[0], apellido: parts.slice(1).join(' '),
        email: user.email, referido: 'Google',
        esAdmin: false,
        fechaRegistro: new Date().toISOString().split('T')[0]
      });
    }
    cerrarAuth();
    showToast('✅ Ingresado con Google');
    abrirPerfil();
  } catch (err) { showAuthError(tradError(err.code)); }
}

/* ── LOGOUT ── */
async function logout() {
  await auth.signOut();
  clearSession();
  updateUILoggedOut();
  const d = document.getElementById('userDropdown');
  if (d) d.classList.remove('active');
  cerrarTienda(); cerrarPerfil(); cerrarAdminPanel();
  showToast('👋 Sesión cerrada', 'error');
}

/* ── AUTH ERROR ── */
function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4500);
}
function tradError(code) {
  const map = {
    'auth/user-not-found':       'No existe una cuenta con ese correo.',
    'auth/wrong-password':       'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/weak-password':        'La contraseña es muy débil.',
    'auth/invalid-email':        'Correo inválido.',
    'auth/popup-closed-by-user': 'Cerraste el popup. Intenta nuevamente.',
    'auth/network-request-failed':'Sin conexión a internet.'
  };
  return map[code] || 'Error de autenticación. Intenta nuevamente.';
}

/* ── MODALES ── */
function abrirAuth() {
  document.getElementById('authOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function cerrarAuth() {
  document.getElementById('authOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
function switchTab(t) {
  document.getElementById('authError').classList.remove('show');
  const isL = t === 'login';
  document.getElementById('form-login').style.display    = isL ? 'block' : 'none';
  document.getElementById('form-registro').style.display = isL ? 'none'  : 'block';
  document.getElementById('tab-login').classList.toggle('active', isL);
  document.getElementById('tab-registro').classList.toggle('active', !isL);
}

function abrirPerfil() {
  const user = getSession();
  if (!user) { abrirAuth(); return; }
  document.getElementById('perfilAvatar').textContent  = (user.nombre || 'H').charAt(0).toUpperCase();
  document.getElementById('perfilNombre').textContent  = user.nombre + ' ' + (user.apellido || '');
  document.getElementById('perfilRol').textContent     = esAdmin(auth.currentUser) ? '⭐ Administrador' : 'Hincha Oficial';
  document.getElementById('perfilFullName').textContent= user.nombre + ' ' + (user.apellido || '');
  document.getElementById('perfilEmail').textContent   = user.email;
  document.getElementById('perfilTipo').textContent    = esAdmin(auth.currentUser) ? 'Administrador' : 'Hincha';
  document.getElementById('perfilFecha').textContent   = user.fechaRegistro || 'Abril 2026';
  document.getElementById('perfilOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function cerrarPerfil() {
  document.getElementById('perfilOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function abrirTienda() {
  document.getElementById('shopOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function cerrarTienda() {
  document.getElementById('shopOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function abrirAdminPanel() {
  const user = getSession();
  if (!esAdmin(auth.currentUser) && !(user && user.esAdmin)) {
    showToast('Sin permisos de administrador', 'error'); return;
  }
  document.getElementById('adminOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  cargarTablaPartidosAdmin();
  cargarTablaNoticiasAdmin();
  cargarAdminTabla();
  cancelarEdicion();
  cancelarTablaEdicion();
  cancelarNoticia();
}
function cerrarAdminPanel() {
  document.getElementById('adminOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function entrarComunidad() {
  const user = getSession();
  if (user) abrirTienda(); else abrirAuth();
}

// Cerrar modales al hacer clic en el fondo
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      if (el.id === 'authOverlay')   cerrarAuth();
      if (el.id === 'shopOverlay')   cerrarTienda();
      if (el.id === 'perfilOverlay') cerrarPerfil();
      if (el.id === 'adminOverlay')  cerrarAdminPanel();
    }
  });
});