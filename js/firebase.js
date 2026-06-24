const firebaseConfig = {
  apiKey: "AIzaSyASwd9Gl54ao5Hv77N6d_sO_66s-8vgUYU",
  authDomain: "hugus-fc.firebaseapp.com",
  projectId: "hugus-fc",
  storageBucket: "hugus-fc.firebasestorage.app",
  messagingSenderId: "890781937251",
  appId: "1:890781937251:web:a3af993352b986be7b5256"
};

firebase.initializeApp(firebaseConfig);

const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();

const COL = { PARTIDOS:'partidos', NOTICIAS:'noticias', TABLA:'tabla', USUARIOS:'usuarios' };
const ADMIN_EMAILS = ['admin@hugusfc.com'];
const ADMIN_PASSWORD = 'admin2026';
const MATCH_DURATION_MIN = 50;

function esAdmin(user) {
  if (!user) return false;
  const s = getSession();
  if (s && s.esAdmin) return true;
  return ADMIN_EMAILS.includes(user.email);
}
function getSession()     { const s = sessionStorage.getItem('hugus_session'); return s ? JSON.parse(s) : null; }
function saveSession(d)   { sessionStorage.setItem('hugus_session', JSON.stringify(d)); }
function clearSession()   { sessionStorage.removeItem('hugus_session'); }