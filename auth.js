import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.registrar = async function () {

  const nombre = document.getElementById("nombre").value;

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  try {

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: nombre,
      correo: email,
      rol: "usuario"
    });

    alert("Registro exitoso HUGUS FC");

  } catch (error) {

    alert(error.message);

  }

};

window.login = async function () {

  const email =
    document.getElementById("emailLogin").value;

  const password =
    document.getElementById("passwordLogin").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Bienvenido a HUGUS FC");

  } catch (error) {

    alert(error.message);

  }

};

window.cerrarSesion = async function () {

  await signOut(auth);

};

onAuthStateChanged(auth, (user) => {

  if (user) {

    console.log("Usuario conectado:", user.email);

  } else {

    console.log("No hay usuario");

  }

});