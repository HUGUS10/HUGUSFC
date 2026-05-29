import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASwd9Gl54ao5Hv77N6d_sO_66s-8vgUYU",
  authDomain: "hugus-fc.firebaseapp.com",
  projectId: "hugus-fc",
  storageBucket: "hugus-fc.firebasestorage.app",
  messagingSenderId: "890781937251",
  appId: "1:890781937251:web:a3af993352b986be7b5256",
  measurementId: "G-GY82L3YPT0"
};
// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Función para iniciar sesión con Google
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      saveSession({ email: user.email, nombre: user.displayName, foto: user.photoURL });
      updateUIForLoggedInUser({ email: user.email, nombre: user.displayName, foto: user.photoURL });
      cerrarAuth();
      showToast(`¡Bienvenido, ${user.displayName}!`);
    })
    .catch((error) => {
      showToast("Error al iniciar sesión con Google: " + error.message, "error");
    });
}

// Función para subir imágenes a Firebase Storage
function uploadImageToFirebase(file, path) {
  const storageRef = storage.ref();
  const fileRef = storageRef.child(path);
  return fileRef.put(file)
    .then((snapshot) => {
      return snapshot.ref.getDownloadURL();
    })
    .catch((error) => {
      console.error("Error al subir la imagen:", error);
      throw error;
    });
}