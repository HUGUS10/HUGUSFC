
/* ==========================================================================
   HUGUS FC — firebase.js
   Inicialización de Firebase (App, Firestore, Storage, Auth).
   ⚠️ Reemplaza firebaseConfig con las credenciales reales de tu proyecto
   (Firebase Console → Configuración del proyecto → Tus apps → SDK config).
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyASwd9Gl54ao5Hv77N6d_sO_66s-8vgUYU",
  authDomain: "hugus-fc.firebaseapp.com",
  projectId: "hugus-fc",
  storageBucket: "hugus-fc.firebasestorage.app",
  messagingSenderId: "890781937251",
  appId: "1:890781937251:web:a3af993352b986be7b5256"
};

// Evita reinicializar si el script se carga más de una vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Persistencia local: mantiene la sesión entre visitas
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Error configurando persistencia de Auth:", err);
});

// Habilita caché offline de Firestore cuando el navegador lo soporta.
// Así la web sigue mostrando datos aunque el usuario pierda conexión.
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === "failed-precondition") {
    // Múltiples pestañas abiertas, la persistencia solo puede activarse en una
    console.warn("Persistencia offline no disponible: múltiples pestañas abiertas.");
  } else if (err.code === "unimplemented") {
    console.warn("Este navegador no soporta persistencia offline.");
  }
});