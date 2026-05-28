import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const partidosRef = collection(db, "partidos");

const q = query(partidosRef, orderBy("fecha", "asc"));

onSnapshot(q, (snapshot) => {
  const partidos = [];

  snapshot.forEach(doc => {
    partidos.push({
      id: doc.id,
      ...doc.data()
    });
  });

  console.log("Partidos actualizados:", partidos);

  if (typeof renderPartidosFirebase === "function") {
    renderPartidosFirebase(partidos);
  }
});