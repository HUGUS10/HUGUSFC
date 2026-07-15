// ─────────────────────────────────────────────
// plantilla.js - Carga jugadores desde Firestore
// ─────────────────────────────────────────────

const COL_JUGADORES = 'jugadores';

function cargarPlantilla() {
  db.collection(COL_JUGADORES)
    .orderBy('numero')
    .onSnapshot((snap) => {
      const jugadores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPlantilla(jugadores);
    });
}

function renderPlantilla(jugadores) {
  const grid = document.getElementById('plantillaGrid');
  if (!jugadores.length) {
    grid.innerHTML = '<div class="admin-no-data">No hay jugadores registrados.</div>';
    return;
  }

  grid.innerHTML = jugadores.map(j => `
    <div class="player-card">
      <div class="player-num-area">
        <div class="player-num">${j.numero}</div>
        <div class="player-pos-badge">${j.posicion}</div>
      </div>
      <div class="player-body">
        <div class="player-name">${j.nombre}</div>
        <div class="player-detail">${j.edad} años · ${j.nacionalidad}</div>
      </div>
    </div>
  `).join('');
}

// Iniciar
cargarPlantilla();