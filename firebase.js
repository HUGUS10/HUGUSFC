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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);