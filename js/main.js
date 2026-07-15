/* ==========================================================================
   HUGUS FC — main.js
   Plantilla de jugadores + goleador destacado del hero.
   Se carga al final: puede usar db, showToast, escapeHTML, etc.
   ========================================================================== */

function iniciarListenerPlantilla() {
  const grid = document.getElementById("plantillaGrid");
  if (!grid || typeof db === "undefined") return;

  db.collection("plantilla")
    .orderBy("numero", "asc")
    .onSnapshot(
      (snap) => {
        const jugadores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderPlantilla(jugadores);
      },
      (err) => {
        console.error("Error escuchando plantilla:", err);
        grid.innerHTML = `<div class="admin-no-data">No se pudo cargar la plantilla.</div>`;
      }
    );
}

function renderPlantilla(jugadores) {
  const grid = document.getElementById("plantillaGrid");
  if (!grid) return;

  if (!jugadores.length) {
    grid.innerHTML = `<div class="admin-no-data">La plantilla se publicará muy pronto.</div>`;
    return;
  }

  grid.innerHTML = jugadores
    .map(
      (j) => `
    <div class="player-card">
      <img class="player-photo" src="${j.foto || "imag/escudo_hugusfc.png"}" alt="${escapeHTML(j.nombre || "Jugador")}" loading="lazy">
      <div class="player-num">#${j.numero ?? "—"}</div>
      <div class="player-name">${escapeHTML(j.nombre || "Por confirmar")}</div>
      <div class="player-pos">${escapeHTML(j.posicion || "")}</div>
    </div>`
    )
    .join("");
}

/* ---------- Goleador destacado (hero) ---------- */
function iniciarGoleadorHero() {
  const el = document.getElementById("heroTopScorer");
  if (!el || typeof db === "undefined") return;

  db.collection("partidos")
    .where("estado", "==", "jugado")
    .onSnapshot(
      (snap) => {
        const conteo = {};
        snap.docs.forEach((doc) => {
          const goles = doc.data().goles || [];
          goles.forEach((g) => {
            if (g.equipo === "HUGUS" && g.jugador) {
              conteo[g.jugador] = (conteo[g.jugador] || 0) + 1;
            }
          });
        });

        const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        if (!entries.length) {
          el.textContent = "— 0 —";
          return;
        }
        const [nombre, goles] = entries[0];
        el.textContent = `${nombre} (${goles})`;
      },
      (err) => console.error("Error calculando goleador:", err)
    );
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  iniciarListenerPlantilla();
  iniciarGoleadorHero();
});