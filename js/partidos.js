/* ==========================================================================
   HUGUS FC — partidos.js
   Partidos (calendario, resultados, ficha, countdown) y Tabla de posiciones.
   Público: listeners en tiempo real sobre las colecciones "partidos" y "tabla".
   Admin: CRUD completo desde admin.html.
   Depende de firebase.js (db) y ui.js (showToast).
   ========================================================================== */

const MESES_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Fecha por confirmar";
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return fechaISO;
  return `${d} ${MESES_ES[m - 1]} ${y}`;
}

function ordenarPorFechaHora(a, b) {
  return new Date(`${a.fecha}T${a.hora || "00:00"}`) - new Date(`${b.fecha}T${b.hora || "00:00"}`);
}

/* ==========================================================================
   PÚBLICO: Calendario + Countdown + Ficha del próximo partido
   ========================================================================== */

let countdownInterval = null;

function iniciarListenersPublicos() {
  if (typeof db === "undefined") return;

  db.collection("partidos").onSnapshot(
    (snap) => {
      const partidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderCalendario(partidos);
      renderResultados(partidos);
      renderFichaProximoPartido(partidos);
      iniciarCountdown(partidos);
    },
    (err) => console.error("Error escuchando partidos:", err)
  );

  db.collection("tabla").onSnapshot(
    (snap) => {
      const equipos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderTablaPosiciones(equipos);
    },
    (err) => console.error("Error escuchando tabla:", err)
  );
}

function renderCalendario(partidos) {
  const grid = document.getElementById("calendarMainGrid");
  if (!grid) return;

  const proximos = partidos.filter((p) => p.estado === "proximo").sort(ordenarPorFechaHora);

  if (!proximos.length) {
    grid.innerHTML = `<div class="admin-no-data">No hay partidos programados por el momento.</div>`;
    return;
  }

  grid.innerHTML = proximos
    .map(
      (p) => `
    <div class="match-card">
      <div class="match-comp">${escapeHTML(p.competencia || "Partido Oficial")}</div>
      <div class="match-teams">${p.esLocal !== false ? "HUGUS FC" : escapeHTML(p.rival || "Rival")} <span style="color:var(--grey)">vs</span> ${p.esLocal !== false ? escapeHTML(p.rival || "Rival") : "HUGUS FC"}</div>
      <div class="match-meta">
        <span>📅 ${formatearFecha(p.fecha)} · ⏰ ${p.hora || "Por confirmar"}</span>
        <span>📍 ${escapeHTML(p.lugar || "Por confirmar")}</span>
      </div>
    </div>`
    )
    .join("");
}

function renderResultados(partidos) {
  const grid = document.getElementById("resultadosGrid");
  if (!grid) return;

  const jugados = partidos.filter((p) => p.estado === "jugado").sort((a, b) => ordenarPorFechaHora(b, a));

  if (!jugados.length) {
    grid.innerHTML = `<p style="color:var(--grey);font-family:'Barlow Condensed',sans-serif;letter-spacing:.14em;grid-column:1/-1;text-align:center;padding:32px">Aún no hay resultados registrados.</p>`;
    return;
  }

  grid.innerHTML = jugados
    .map((p) => {
      const gh = p.golesHUGUS ?? 0;
      const gr = p.golesRival ?? 0;
      const golHugus = gh >= gr;
      return `
    <div class="resultado-card">
      <div class="resultado-info">
        <div class="resultado-comp">${escapeHTML(p.competencia || "Partido Oficial")}</div>
        <div class="resultado-teams">${p.esLocal !== false ? "HUGUS FC" : escapeHTML(p.rival || "Rival")} vs ${p.esLocal !== false ? escapeHTML(p.rival || "Rival") : "HUGUS FC"}</div>
        <div class="resultado-fecha">📅 ${formatearFecha(p.fecha)} · 📍 ${escapeHTML(p.lugar || "—")}</div>
      </div>
      <div class="resultado-marcador">
        <span class="${golHugus ? "g" : ""}">${p.esLocal !== false ? gh : gr}</span> - <span>${p.esLocal !== false ? gr : gh}</span>
      </div>
    </div>`;
    })
    .join("");
}

function renderFichaProximoPartido(partidos) {
  const card = document.getElementById("fichaCard");
  if (!card) return;

  const proximos = partidos.filter((p) => p.estado === "proximo").sort(ordenarPorFechaHora);
  const next = proximos[0];
  const titulo = document.getElementById("fichaTitulo");
  const desc = document.getElementById("fichaDesc");

  if (!next) {
    card.innerHTML = `<div class="ficha-header"><p style="color:var(--grey);font-family:'Barlow Condensed',sans-serif;">Aún no hay un próximo partido confirmado.</p></div>`;
    if (titulo) titulo.innerHTML = `HUGUS FC <span class="g">VS</span> RIVAL`;
    if (desc) desc.textContent = "Muy pronto anunciaremos el próximo encuentro oficial.";
    return;
  }

  const local = next.esLocal !== false;
  if (titulo) titulo.innerHTML = `${local ? "HUGUS FC" : escapeHTML(next.rival || "Rival")} <span class="g">VS</span> ${local ? escapeHTML(next.rival || "Rival") : "HUGUS FC"}`;
  if (desc) desc.textContent = `${next.competencia || "Partido Oficial"} · ${formatearFecha(next.fecha)}`;

  card.innerHTML = `
    <div class="ficha-header">
      <div class="ficha-team"><div class="ficha-team-name">${local ? "HUGUS FC" : escapeHTML(next.rival || "Rival")}</div></div>
      <div class="ficha-vs">VS</div>
      <div class="ficha-team"><div class="ficha-team-name">${local ? escapeHTML(next.rival || "Rival") : "HUGUS FC"}</div></div>
    </div>
    <div class="ficha-body">
      <div class="fact"><span class="fl">Fecha</span><span class="fv">${formatearFecha(next.fecha)}</span></div>
      <div class="fact"><span class="fl">Hora</span><span class="fv">${next.hora || "Por confirmar"}</span></div>
      <div class="fact"><span class="fl">Lugar</span><span class="fv">${escapeHTML(next.lugar || "Por confirmar")}</span></div>
      <div class="fact"><span class="fl">Competencia</span><span class="fv g">${escapeHTML(next.competencia || "Partido Oficial")}</span></div>
      <div class="fact"><span class="fl">Condición</span><span class="fv">${local ? "Local" : "Visitante"}</span></div>
    </div>`;
}

function iniciarCountdown(partidos) {
  const proximos = partidos.filter((p) => p.estado === "proximo").sort(ordenarPorFechaHora);
  const next = proximos[0];
  const label = document.getElementById("nextMatchLabel");
  const dias = document.getElementById("dias");
  const horas = document.getElementById("horas");
  const min = document.getElementById("min");
  const seg = document.getElementById("seg");

  if (countdownInterval) clearInterval(countdownInterval);
  if (!dias || !horas || !min || !seg) return;

  if (!next) {
    if (label) label.textContent = "Sin partidos programados";
    [dias, horas, min, seg].forEach((el) => (el.textContent = "00"));
    return;
  }

  if (label) label.textContent = `Próximo partido vs ${next.rival || "rival"} en`;

  const targetDate = new Date(`${next.fecha}T${next.hora || "00:00"}`);

  const tick = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      [dias, horas, min, seg].forEach((el) => (el.textContent = "00"));
      if (label) label.textContent = "¡El partido está en curso!";
      clearInterval(countdownInterval);
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    dias.textContent = String(d).padStart(2, "0");
    horas.textContent = String(h).padStart(2, "0");
    min.textContent = String(m).padStart(2, "0");
    seg.textContent = String(s).padStart(2, "0");
  };

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function renderTablaPosiciones(equipos) {
  const tbody = document.getElementById("tablaPosicionesBody");
  if (!tbody) return;

  if (!equipos.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--grey)">Aún no hay equipos registrados.</td></tr>`;
    return;
  }

  const ordenados = [...equipos].sort((a, b) => {
    const ptsA = (a.g || 0) * 3 + (a.e || 0);
    const ptsB = (b.g || 0) * 3 + (b.e || 0);
    if (ptsB !== ptsA) return ptsB - ptsA;
    const dgA = (a.gf || 0) - (a.gc || 0);
    const dgB = (b.gf || 0) - (b.gc || 0);
    return dgB - dgA;
  });

  tbody.innerHTML = ordenados
    .map((eq) => {
      const pj = eq.pj ?? (eq.g || 0) + (eq.e || 0) + (eq.p || 0);
      const pts = (eq.g || 0) * 3 + (eq.e || 0);
      const dg = (eq.gf || 0) - (eq.gc || 0);
      return `
    <tr class="${eq.esHugus ? "is-hugus" : ""}">
      <td>${escapeHTML(eq.equipo || "—")}</td>
      <td>${pj}</td><td>${eq.g || 0}</td><td>${eq.e || 0}</td><td>${eq.p || 0}</td>
      <td>${eq.gf || 0}</td><td>${eq.gc || 0}</td>
      <td>${dg > 0 ? "+" : ""}${dg}</td>
      <td class="pts">${pts}</td>
    </tr>`;
    })
    .join("");
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ==========================================================================
   ADMIN — Partidos (CRUD)
   ========================================================================== */

let golesAdminTemp = [];

function toggleResultadoFields() {
  const estado = document.getElementById("adminEstado")?.value;
  const golesEditor = document.getElementById("adminGolesEditor");
  const golesHUGUSGroup = document.getElementById("golesHUGUSGroup");
  const golesRivalGroup = document.getElementById("golesRivalGroup");
  const jugado = estado === "jugado";

  if (golesEditor) golesEditor.style.display = jugado ? "block" : "none";
  if (golesHUGUSGroup) golesHUGUSGroup.style.display = jugado ? "block" : "none";
  if (golesRivalGroup) golesRivalGroup.style.display = jugado ? "block" : "none";
  if (jugado) renderGolesAdmin();
}

function agregarGolAdmin() {
  golesAdminTemp.push({ jugador: "", minuto: "", equipo: "HUGUS" });
  renderGolesAdmin();
}

function quitarGolAdmin(idx) {
  golesAdminTemp.splice(idx, 1);
  renderGolesAdmin();
  recalcularGolesAuto();
}

function actualizarGolAdmin(idx, campo, valor) {
  if (!golesAdminTemp[idx]) return;
  golesAdminTemp[idx][campo] = valor;
  recalcularGolesAuto();
}

function renderGolesAdmin() {
  const list = document.getElementById("adminGolesList");
  if (!list) return;
  const rival = document.getElementById("adminRival")?.value || "Rival";

  list.innerHTML = golesAdminTemp
    .map(
      (g, i) => `
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
      <select onchange="actualizarGolAdmin(${i},'equipo',this.value)" style="flex:1;min-width:110px;padding:9px;border-radius:8px;border:1.5px solid rgba(22,51,39,.15)">
        <option value="HUGUS" ${g.equipo === "HUGUS" ? "selected" : ""}>HUGUS FC</option>
        <option value="RIVAL" ${g.equipo === "RIVAL" ? "selected" : ""}>${escapeHTML(rival)}</option>
      </select>
      <input type="text" placeholder="Jugador" value="${escapeHTML(g.jugador || "")}" oninput="actualizarGolAdmin(${i},'jugador',this.value)" style="flex:2;min-width:140px;padding:9px;border-radius:8px;border:1.5px solid rgba(22,51,39,.15)">
      <input type="number" placeholder="Min" min="0" max="130" value="${g.minuto || ""}" oninput="actualizarGolAdmin(${i},'minuto',this.value)" style="width:70px;padding:9px;border-radius:8px;border:1.5px solid rgba(22,51,39,.15)">
      <button class="action-btn" onclick="quitarGolAdmin(${i})" title="Quitar gol">🗑️</button>
    </div>`
    )
    .join("");
  recalcularGolesAuto();
}

function recalcularGolesAuto() {
  const gh = golesAdminTemp.filter((g) => g.equipo === "HUGUS").length;
  const gr = golesAdminTemp.filter((g) => g.equipo === "RIVAL").length;
  const golesHUGUS = document.getElementById("adminGolesHUGUS");
  const golesRival = document.getElementById("adminGolesRival");
  if (golesHUGUS) golesHUGUS.value = gh;
  if (golesRival) golesRival.value = gr;
}

async function guardarPartido() {
  const id = document.getElementById("adminEditId")?.value;
  const estado = document.getElementById("adminEstado")?.value;

  const data = {
    fecha: document.getElementById("adminFecha")?.value || "",
    hora: document.getElementById("adminHora")?.value || "",
    rival: document.getElementById("adminRival")?.value.trim() || "",
    lugar: document.getElementById("adminLugar")?.value.trim() || "",
    competencia: document.getElementById("adminCompetencia")?.value.trim() || "Partido Oficial 2026",
    esLocal: document.getElementById("adminEsLocal")?.value === "true",
    estado: estado || "proximo"
  };

  if (!data.fecha || !data.rival) {
    showToast("Completa al menos fecha y rival.", "error");
    return;
  }

  if (estado === "jugado") {
    data.goles = golesAdminTemp;
    data.golesHUGUS = golesAdminTemp.filter((g) => g.equipo === "HUGUS").length;
    data.golesRival = golesAdminTemp.filter((g) => g.equipo === "RIVAL").length;
  }

  try {
    if (id) {
      await db.collection("partidos").doc(id).update(data);
      showToast("Partido actualizado", "success");
    } else {
      data.creado = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("partidos").add(data);
      showToast("Partido guardado", "success");
    }
    cancelarEdicion();
    cargarPartidosAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al guardar el partido", "error");
  }
}

function cancelarEdicion() {
  document.getElementById("adminEditId").value = "";
  document.getElementById("adminFecha").value = "";
  document.getElementById("adminHora").value = "15:00";
  document.getElementById("adminRival").value = "";
  document.getElementById("adminLugar").value = "";
  document.getElementById("adminCompetencia").value = "";
  document.getElementById("adminEsLocal").value = "true";
  document.getElementById("adminEstado").value = "proximo";
  golesAdminTemp = [];
  toggleResultadoFields();
  document.getElementById("btnCancelarEdicion").style.display = "none";
  document.getElementById("btnGuardarPartido").textContent = "💾 Guardar Partido";
}

async function editarPartidoAdmin(id) {
  try {
    const doc = await db.collection("partidos").doc(id).get();
    if (!doc.exists) return;
    const p = doc.data();

    document.getElementById("adminEditId").value = id;
    document.getElementById("adminFecha").value = p.fecha || "";
    document.getElementById("adminHora").value = p.hora || "15:00";
    document.getElementById("adminRival").value = p.rival || "";
    document.getElementById("adminLugar").value = p.lugar || "";
    document.getElementById("adminCompetencia").value = p.competencia || "";
    document.getElementById("adminEsLocal").value = String(p.esLocal !== false);
    document.getElementById("adminEstado").value = p.estado || "proximo";

    golesAdminTemp = Array.isArray(p.goles) ? [...p.goles] : [];
    toggleResultadoFields();

    document.getElementById("btnCancelarEdicion").style.display = "inline-flex";
    document.getElementById("btnGuardarPartido").textContent = "💾 Actualizar Partido";
    document.getElementById("adminFormContainer").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showToast("No se pudo cargar el partido", "error");
  }
}

async function eliminarPartidoAdmin(id) {
  if (!confirm("¿Eliminar este partido? Esta acción no se puede deshacer.")) return;
  try {
    await db.collection("partidos").doc(id).delete();
    showToast("Partido eliminado", "success");
    cargarPartidosAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al eliminar el partido", "error");
  }
}

async function cargarPartidosAdmin() {
  const tbody = document.getElementById("adminPartidosTableBody");
  if (!tbody) return;
  try {
    const snap = await db.collection("partidos").orderBy("fecha", "desc").get();
    const partidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!partidos.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-no-data">No hay partidos registrados aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = partidos
      .map((p) => {
        const resultado = p.estado === "jugado" ? `${p.golesHUGUS ?? 0} - ${p.golesRival ?? 0}` : "—";
        return `
      <tr>
        <td>${formatearFecha(p.fecha)}</td>
        <td>${p.hora || "—"}</td>
        <td>${escapeHTML(p.rival || "—")}</td>
        <td>${escapeHTML(p.lugar || "—")}</td>
        <td>${p.esLocal !== false ? "Sí" : "No"}</td>
        <td><span class="badge-estado badge-${p.estado === "jugado" ? "jugado" : "proximo"}">${p.estado === "jugado" ? "Jugado" : "Próximo"}</span></td>
        <td>${resultado}</td>
        <td>
          <button class="action-btn" onclick="editarPartidoAdmin('${p.id}')" title="Editar">✏️</button>
          <button class="action-btn" onclick="eliminarPartidoAdmin('${p.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8" class="admin-no-data">Error al cargar los partidos.</td></tr>`;
  }
}

/* ==========================================================================
   ADMIN — Tabla de posiciones (CRUD)
   ========================================================================== */

async function guardarEquipoTabla() {
  const id = document.getElementById("tablaEditId")?.value;
  const data = {
    equipo: document.getElementById("tablaEquipo")?.value.trim() || "",
    pj: Number(document.getElementById("tablaPJ")?.value) || 0,
    g: Number(document.getElementById("tablaG")?.value) || 0,
    e: Number(document.getElementById("tablaE")?.value) || 0,
    p: Number(document.getElementById("tablaP")?.value) || 0,
    gf: Number(document.getElementById("tablaGF")?.value) || 0,
    gc: Number(document.getElementById("tablaGC")?.value) || 0,
    esHugus: document.getElementById("tablaEsHugus")?.value === "true"
  };

  if (!data.equipo) {
    showToast("Ingresa el nombre del equipo.", "error");
    return;
  }

  try {
    if (id) {
      await db.collection("tabla").doc(id).update(data);
      showToast("Equipo actualizado", "success");
    } else {
      await db.collection("tabla").add(data);
      showToast("Equipo agregado", "success");
    }
    cancelarTablaEdicion();
    cargarEquiposAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al guardar el equipo", "error");
  }
}

function cancelarTablaEdicion() {
  document.getElementById("tablaEditId").value = "";
  ["tablaEquipo"].forEach((id) => (document.getElementById(id).value = ""));
  ["tablaPJ", "tablaG", "tablaE", "tablaP", "tablaGF", "tablaGC"].forEach((id) => (document.getElementById(id).value = "0"));
  document.getElementById("tablaEsHugus").value = "false";
  document.getElementById("btnCancelarTabla").style.display = "none";
}

async function editarEquipoAdmin(id) {
  try {
    const doc = await db.collection("tabla").doc(id).get();
    if (!doc.exists) return;
    const eq = doc.data();

    document.getElementById("tablaEditId").value = id;
    document.getElementById("tablaEquipo").value = eq.equipo || "";
    document.getElementById("tablaPJ").value = eq.pj || 0;
    document.getElementById("tablaG").value = eq.g || 0;
    document.getElementById("tablaE").value = eq.e || 0;
    document.getElementById("tablaP").value = eq.p || 0;
    document.getElementById("tablaGF").value = eq.gf || 0;
    document.getElementById("tablaGC").value = eq.gc || 0;
    document.getElementById("tablaEsHugus").value = String(!!eq.esHugus);

    document.getElementById("btnCancelarTabla").style.display = "inline-flex";
    document.getElementById("adminTablaForm").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showToast("No se pudo cargar el equipo", "error");
  }
}

async function eliminarEquipoAdmin(id) {
  if (!confirm("¿Eliminar este equipo de la tabla?")) return;
  try {
    await db.collection("tabla").doc(id).delete();
    showToast("Equipo eliminado", "success");
    cargarEquiposAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al eliminar el equipo", "error");
  }
}

async function cargarEquiposAdmin() {
  const tbody = document.getElementById("adminTablaBody");
  if (!tbody) return;
  try {
    const snap = await db.collection("tabla").get();
    const equipos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!equipos.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="admin-no-data">No hay equipos registrados aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = equipos
      .map((eq) => {
        const pts = (eq.g || 0) * 3 + (eq.e || 0);
        return `
      <tr>
        <td>${escapeHTML(eq.equipo || "—")}${eq.esHugus ? " ⭐" : ""}</td>
        <td>${eq.pj || 0}</td><td>${eq.g || 0}</td><td>${eq.e || 0}</td><td>${eq.p || 0}</td>
        <td>${eq.gf || 0}</td><td>${eq.gc || 0}</td><td>${pts}</td>
        <td>
          <button class="action-btn" onclick="editarEquipoAdmin('${eq.id}')" title="Editar">✏️</button>
          <button class="action-btn" onclick="eliminarEquipoAdmin('${eq.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="9" class="admin-no-data">Error al cargar la tabla.</td></tr>`;
  }
}

/* ---------- Auto-init en páginas públicas ---------- */
document.addEventListener("DOMContentLoaded", () => {
  iniciarListenersPublicos();
});