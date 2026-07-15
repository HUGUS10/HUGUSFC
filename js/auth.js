/* ==========================================================================
   HUGUS FC — auth.js
   Login, registro, logout, sesión y control de acceso al panel admin.
   Depende de firebase.js (variables globales: auth, db).
   ========================================================================== */

const SESSION_KEY = "hugusfc_session";

// Correos con acceso de administrador (además de lo que diga Firestore)
const ADMIN_EMAILS = ["lg_hugusfc@hotmail.com"];

/* ---------- Sesión local (rápida, sin esperar red) ---------- */
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(data) {
  if (data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function esAdmin(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase();
  if (ADMIN_EMAILS.includes(email)) return true;
  return user.rol === "admin";
}

/* ---------- Registro/actualización de usuario en Firestore ---------- */
async function upsertUsuario(fbUser, extra = {}) {
  const ref = db.collection("usuarios").doc(fbUser.uid);
  const snap = await ref.get();
  const base = {
    uid: fbUser.uid,
    email: fbUser.email || "",
    nombre: fbUser.displayName || extra.nombre || "",
    foto: fbUser.photoURL || "",
    actualizado: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!snap.exists) {
    base.rol = ADMIN_EMAILS.includes((fbUser.email || "").toLowerCase()) ? "admin" : "socio";
    base.creado = firebase.firestore.FieldValue.serverTimestamp();
  }
  await ref.set({ ...base, ...extra }, { merge: true });
  const finalSnap = await ref.get();
  return finalSnap.data();
}

/* ---------- Login con correo/contraseña ---------- */
async function loginUser() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  const errorBox = document.getElementById("authError");

  if (!email || !password) {
    showAuthError(errorBox, "Completa tu correo y contraseña.");
    return;
  }

  try {
    setBtnLoading("Ingresar", true);
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const perfil = await upsertUsuario(cred.user);
    setSession({ uid: cred.user.uid, email: cred.user.email, ...perfil });
    if (typeof showToast === "function") showToast("¡Bienvenido de nuevo!", "success");
    window.location.href = "perfil.html";
  } catch (err) {
    showAuthError(errorBox, traducirErrorAuth(err.code));
  } finally {
    setBtnLoading("Ingresar", false);
  }
}

/* ---------- Registro con correo/contraseña ---------- */
async function registerUser() {
  const nombre = document.getElementById("registerNombre")?.value.trim();
  const email = document.getElementById("registerEmail")?.value.trim();
  const password = document.getElementById("registerPassword")?.value;
  const password2 = document.getElementById("registerPassword2")?.value;
  const errorBox = document.getElementById("authError");

  if (!nombre || !email || !password) {
    showAuthError(errorBox, "Completa todos los campos.");
    return;
  }
  if (password.length < 6) {
    showAuthError(errorBox, "La contraseña debe tener al menos 6 caracteres.");
    return;
  }
  if (password2 !== undefined && password !== password2) {
    showAuthError(errorBox, "Las contraseñas no coinciden.");
    return;
  }

  try {
    setBtnLoading("Crear cuenta", true);
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: nombre });
    const perfil = await upsertUsuario(cred.user, { nombre });
    setSession({ uid: cred.user.uid, email: cred.user.email, ...perfil });
    if (typeof showToast === "function") showToast("Cuenta creada. ¡Bienvenido a HUGUS FC!", "success");
    window.location.href = "perfil.html";
  } catch (err) {
    showAuthError(errorBox, traducirErrorAuth(err.code));
  } finally {
    setBtnLoading("Crear cuenta", false);
  }
}

/* ---------- Login con Google ---------- */
async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const errorBox = document.getElementById("authError");
  try {
    const cred = await auth.signInWithPopup(provider);
    const perfil = await upsertUsuario(cred.user);
    setSession({ uid: cred.user.uid, email: cred.user.email, ...perfil });
    if (typeof showToast === "function") showToast("¡Bienvenido!", "success");
    window.location.href = "perfil.html";
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      showAuthError(errorBox, traducirErrorAuth(err.code));
    }
  }
}

/* ---------- Logout ---------- */
async function logout() {
  try {
    await auth.signOut();
  } finally {
    setSession(null);
    if (typeof showToast === "function") showToast("Sesión cerrada", "success");
    setTimeout(() => (window.location.href = "index.html"), 600);
  }
}

/* ---------- Helpers UI ---------- */
function showAuthError(box, msg) {
  if (!box) return;
  box.textContent = msg;
  box.classList.add("show");
}

function setBtnLoading(label, loading) {
  const btn = document.querySelector(".btn-auth-submit");
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? "0.7" : "1";
  btn.textContent = loading ? "Cargando..." : `⚽ ${label}`;
}

function traducirErrorAuth(code) {
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/user-disabled": "Esta cuenta fue deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña es demasiado débil.",
    "auth/network-request-failed": "Error de conexión. Revisa tu internet.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde."
  };
  return map[code] || "Ocurrió un error. Intenta nuevamente.";
}

/* ---------- Actualiza la barra de navegación según sesión ---------- */
function actualizarNavPorSesion(perfil) {
  const btnAcceder = document.getElementById("btnAcceder");
  const userMenuContainer = document.getElementById("userMenuContainer");
  const userAvatarBtn = document.getElementById("userAvatarBtn");
  const adminLinkBtn = document.getElementById("adminLinkBtn");
  const mobAccederBtn = document.getElementById("mobAccederBtn");

  if (perfil) {
    if (btnAcceder) btnAcceder.style.display = "none";
    if (userMenuContainer) userMenuContainer.style.display = "block";
    if (userAvatarBtn) {
      const inicial = (perfil.nombre || perfil.email || "H").trim().charAt(0).toUpperCase();
      userAvatarBtn.textContent = inicial;
    }
    if (adminLinkBtn) adminLinkBtn.style.display = esAdmin(perfil) ? "flex" : "none";
    if (mobAccederBtn) {
      mobAccederBtn.textContent = "👤 Mi Perfil";
      mobAccederBtn.onclick = () => { closeMenu(); window.location.href = "perfil.html"; };
    }
  } else {
    if (btnAcceder) btnAcceder.style.display = "inline-flex";
    if (userMenuContainer) userMenuContainer.style.display = "none";
    if (mobAccederBtn) {
      mobAccederBtn.textContent = "⚽ Acceder / Registrarse";
      mobAccederBtn.onclick = () => { closeMenu(); window.location.href = "login.html"; };
    }
  }
}

/* ---------- Listener global de estado de autenticación ---------- */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const ref = db.collection("usuarios").doc(user.uid);
      const snap = await ref.get();
      const perfil = snap.exists ? snap.data() : await upsertUsuario(user);
      setSession({ uid: user.uid, email: user.email, ...perfil });
      actualizarNavPorSesion(getSession());
    } catch (e) {
      console.error("Error cargando perfil:", e);
      actualizarNavPorSesion(getSession());
    }
  } else {
    setSession(null);
    actualizarNavPorSesion(null);
  }
});