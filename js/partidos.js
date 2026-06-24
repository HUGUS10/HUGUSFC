// ============================================================
// HUGUS FC · partidos.js — Calendario, Resultados, Admin
// ============================================================

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

let _countdownTarget = null;
let _golesTemporales = [];
let _adminEditandoId = null;

/* ── COUNTDOWN ── */
function updateCountdown() {
  if (!_countdownTarget) {
    ['dias','horas','min','seg'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent='00'; });
    return;
  }
  const diff = Math.max(_countdownTarget - Date.now(), 0);
  const pad = n => String(Math.floor(n)).padStart(2,'0');
  const el = id => document.getElementById(id);
  if(el('dias'))  el('dias').textContent  = pad(diff / 86400000);
  if(el('horas')) el('horas').textContent = pad((diff % 86400000) / 3600000);
  if(el('min'))   el('min').textContent   = pad((diff % 3600000) / 60000);
  if(el('seg'))   el('seg').textContent   = pad((diff % 60000) / 1000);
}
setInterval(updateCountdown, 1000);

/* ── LISTENER EN TIEMPO REAL ── */
function listenPartidos() {
  db.collection(COL.PARTIDOS).orderBy('fecha','asc').onSnapshot(snap => {
    const partidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    actualizarCalendarioUI(partidos);
    actualizarResultados(partidos);
    cargarTablaPartidosAdmin(partidos);
  }, err => console.error('Error partidos:', err));
}

/* ── CALENDARIO UI ── */
function actualizarCalendarioUI(partidos) {
  const proximos = partidos.filter(p => p.estado === 'proximo')
    .sort((a,b) => new Date(a.fecha+'T'+a.hora) - new Date(b.fecha+'T'+b.hora));
  const enVivo   = partidos.find(p => p.estado === 'en_vivo');
  const principal = enVivo || (proximos.length > 0 ? proximos[0] : null);

  const label = document.getElementById('nextMatchLabel');
  if (label) label.textContent = !principal ? 'Sin partidos próximos' : enVivo ? '🔴 EN VIVO AHORA' : 'Próximo partido en';

  /* Tarjeta principal */
  let matchHTML = '';
  if (principal) {
    const fo = new Date(principal.fecha + 'T12:00:00');
    const fL = DIAS[fo.getUTCDay()] + ' ' + fo.getUTCDate() + ' · ' + principal.hora;
    const fG = fo.getUTCDate() + ' de ' + MESES[fo.getUTCMonth()] + ' 2026';
    const live = principal.estado === 'en_vivo'
      ? '<div class="live-pulse"><span class="live-dot"></span>EN VIVO</div>' : '';
    matchHTML = `
    <div class="match-card reveal">
      <div class="match-top">
        ${live}
        <div class="match-comp-badge">${principal.competencia || 'Partido Oficial 2026'}</div>
        <div class="match-teams">
          <div class="team-block">
            <div class="team-emblem"><img src="imag/escudo_hugusfc.png" alt="HUGUS FC"></div>
            <div class="team-name">HUGUS FC</div>
            <div class="team-city">C. El Colorado</div>
          </div>
          <div class="match-vs-wrap">
            <div class="vs-badge">VS</div>
          </div>
          <div class="team-block">
            <div class="team-emblem rival-emblem">
              <span class="team-emblem-txt">${principal.rival.substring(0,2).toUpperCase()}</span>
            </div>
            <div class="team-name">${principal.rival}</div>
            <div class="team-city">${principal.esLocal ? 'Visitante' : 'Local'}</div>
          </div>
        </div>
      </div>
      <div class="match-bottom">
        <div class="match-date-big">${fL}</div>
        <div class="match-meta">
          <span>📅 <strong>${fG}</strong></span>
          <span>📍 <strong>${principal.lugar || 'Por confirmar'}</strong></span>
          <span>🏆 <strong>${principal.competencia || 'Partido Oficial'}</strong></span>
        </div>
        <a href="#ficha-partido" class="btn-p" style="margin-top:20px;display:block;text-align:center">Ver Ficha Completa</a>
      </div>
    </div>`;
  } else {
    matchHTML = `<div class="match-card"><div class="match-top" style="text-align:center;padding:50px 24px">
      <div class="match-comp-badge">Sin partidos programados</div>
      <p style="color:var(--grey);margin-top:18px;font-size:.9rem">El calendario se actualizará pronto.</p>
    </div></div>`;
  }

  /* Partidos secundarios */
  const side = (enVivo ? [enVivo] : []).concat(proximos.filter(p => p !== principal)).slice(0, 4);
  const sideHTML = side.map(p => {
    const fo = new Date(p.fecha + 'T12:00:00');
    const fL = fo.toLocaleDateString('es-PE', { day:'2-digit', month:'short' });
    const eq1 = p.esLocal ? 'HUGUS FC' : p.rival;
    const eq2 = p.esLocal ? p.rival : 'HUGUS FC';
    return `<div class="mini-match">
      <div class="mini-date">${fL} · ${p.hora}</div>
      <div class="mini-teams">
        <span class="t home">${eq1}</span>
        <span class="mini-vs">vs</span>
        <span class="t away">${eq2}</span>
      </div>
      <div class="mini-comp">${p.competencia || 'Partido'}</div>
    </div>`;
  }).join('') || '<p class="cal-empty">Más partidos próximamente</p>';

  const grid = document.getElementById('calendarMainGrid');
  if (grid) grid.innerHTML = matchHTML + `
    <div class="calendar-side">
      <div class="cal-side-title">Próximos <span class="g">Partidos</span></div>
      <div class="next-matches">${sideHTML}</div>
    </div>`;

  actualizarFichaPartido(principal);

  /* Countdown target */
  if (!principal) { _countdownTarget = null; }
  else if (principal.estado === 'en_vivo') {
    _countdownTarget = new Date(principal.fecha+'T'+principal.hora+':00').getTime() + MATCH_DURATION_MIN*60000;
  } else {
    _countdownTarget = new Date(principal.fecha+'T'+principal.hora+':00').getTime();
  }
  updateCountdown();
}

/* ── FICHA PARTIDO ── */
function actualizarFichaPartido(p) {
  const card  = document.getElementById('fichaCard');
  const titulo = document.getElementById('fichaTitulo');
  const desc  = document.getElementById('fichaDesc');
  if (!p) {
    if (titulo) titulo.innerHTML = 'HUGUS FC <span class="g">PRÓXIMAMENTE</span>';
    if (desc)   desc.textContent = 'No hay partidos programados.';
    if (card)   card.innerHTML = '<div class="ficha-header" style="text-align:center;padding:48px"><p style="color:var(--grey)">Calendario por definirse.</p></div>';
    return;
  }
  const fo  = new Date(p.fecha + 'T12:00:00');
  const fLg = DIAS[fo.getUTCDay()] + ', ' + fo.getUTCDate() + ' de ' + MESES[fo.getUTCMonth()] + ' 2026';
  const ri  = p.rival.substring(0,2).toUpperCase();
  if (titulo) titulo.innerHTML = 'HUGUS FC <span class="g">VS</span> ' + p.rival;
  if (desc)   desc.textContent = 'Información completa del encuentro oficial.';

  const esJ = p.estado === 'jugado', esE = p.estado === 'en_vivo';
  const resHTML = (esJ && p.golesHUGUS !== undefined)
    ? `<div class="ficha-result-box"><div class="ficha-info-label">🏆 RESULTADO FINAL</div>
       <div class="ficha-result-score">HUGUS ${p.golesHUGUS} — ${p.golesRival} ${p.rival}</div></div>` : '';
  const golesHTML = (esJ && p.goles && p.goles.length)
    ? `<div class="ficha-goles-box"><div class="ficha-info-label" style="margin-bottom:12px">⚽ DETALLE DE GOLES</div>
       <ul class="goles-lista">${p.goles.map(g => `<li><span class="gol-min">${g.minuto}'</span><span class="gol-jug">${g.jugador}</span><span class="gol-eq">${g.equipo}</span></li>`).join('')}</ul></div>` : '';

  if (card) card.innerHTML = `
    <div class="ficha-header">
      <div class="ficha-teams">
        <div class="ficha-team">
          <div class="ficha-emblem"><img src="imag/escudo_hugusfc.png" alt="HUGUS FC"></div>
          <div class="ficha-teamname">HUGUS FC</div>
        </div>
        <div class="ficha-vs">VS</div>
        <div class="ficha-team">
          <div class="ficha-emblem rival-emblem"><span class="ficha-emblem-txt">${ri}</span></div>
          <div class="ficha-teamname">${p.rival}</div>
        </div>
      </div>
    </div>
    <div class="ficha-body">
      <div class="ficha-info-grid">
        <div class="ficha-info-item"><div class="ficha-info-label">📅 Fecha</div><div class="ficha-info-val">${fLg}</div></div>
        <div class="ficha-info-item"><div class="ficha-info-label">⏰ Hora</div><div class="ficha-info-val">${p.hora}</div></div>
        <div class="ficha-info-item"><div class="ficha-info-label">📍 Lugar</div><div class="ficha-info-val">${p.lugar || 'Por confirmar'}</div></div>
        <div class="ficha-info-item"><div class="ficha-info-label">🏆 Competencia</div><div class="ficha-info-val">${p.competencia || 'Partido Oficial'}</div></div>
      </div>
      ${resHTML}${golesHTML}
      <div class="previa-box">
        <div class="previa-title">${esJ?'Resumen':esE?'En Juego':'Previa'}</div>
        <p class="previa-txt">${esJ
          ? 'HUGUS FC disputó este importante encuentro frente a '+p.rival+'. Consulta el marcador y los goles arriba.'
          : esE
            ? 'El partido está en juego ahora mismo. Sigue el marcador en tiempo real.'
            : 'HUGUS FC disputará un encuentro frente a '+p.rival+' el '+fLg+' a las '+p.hora+'.'
        }</p>
      </div>
    </div>`;
}

/* ── RESULTADOS ── */
function actualizarResultados(partidos) {
  const grid = document.getElementById('resultadosGrid');
  if (!grid) return;
  const jugados = partidos.filter(p => p.estado === 'jugado')
    .sort((a,b) => new Date(b.fecha+'T'+b.hora) - new Date(a.fecha+'T'+a.hora));
  if (!jugados.length) {
    grid.innerHTML = '<p class="res-empty">Aún no hay partidos finalizados.</p>'; return;
  }
  grid.innerHTML = jugados.map(p => {
    const f = new Date(p.fecha+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'});
    const win = p.golesHUGUS > p.golesRival, draw = p.golesHUGUS === p.golesRival;
    const resColor = win ? '#2ecc71' : draw ? 'var(--gold)' : '#e74c3c';
    const resBadge = win ? 'Victoria' : draw ? 'Empate' : 'Derrota';
    const goles = (p.goles && p.goles.length)
      ? `<ul class="goles-lista">${p.goles.map(g=>`<li><span class="gol-min">${g.minuto}'</span><span class="gol-jug">${g.jugador}</span><span class="gol-eq">${g.equipo}</span></li>`).join('')}</ul>`
      : '<p class="no-goles">Sin detalle de goles</p>';
    return `<div class="resultado-card">
      <div class="resultado-header">
        <div class="resultado-equipo">
          <div class="resultado-escudo-peq"><img src="imag/escudo_hugusfc.png" alt=""></div>
          <span class="resultado-nombre">HUGUS</span>
        </div>
        <div>
          <div class="resultado-marcador" style="color:${resColor}">${p.golesHUGUS} — ${p.golesRival}</div>
          <div class="resultado-badge" style="color:${resColor}">${resBadge}</div>
        </div>
        <div class="resultado-equipo right">
          <span class="resultado-nombre">${p.rival}</span>
          <div class="resultado-escudo-peq rival"><span>${p.rival.substring(0,2).toUpperCase()}</span></div>
        </div>
      </div>
      <div class="resultado-body">
        <div class="resultado-fecha">📅 ${f} &nbsp;⏰ ${p.hora} &nbsp;📍 ${p.lugar||'Por confirmar'}</div>
        ${goles}
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   ADMIN — PARTIDOS
═══════════════════════════════════════════ */
function toggleResultadoFields() {
  const j = document.getElementById('adminEstado').value === 'jugado';
  document.getElementById('golesHUGUSGroup').style.display = j ? 'flex' : 'none';
  document.getElementById('golesRivalGroup').style.display = j ? 'flex' : 'none';
  document.getElementById('adminGolesEditor').style.display = j ? 'block' : 'none';
}

function agregarGolAdmin() {
  _golesTemporales.push({ jugador:'', minuto:'', equipo:'HUGUS' });
  renderAdminGoles();
}
function eliminarGolAdmin(i) {
  _golesTemporales.splice(i,1);
  renderAdminGoles();
}
function renderAdminGoles() {
  const c = document.getElementById('adminGolesList');
  if (!c) return;
  c.innerHTML = _golesTemporales.map((g,i) => `
    <div class="admin-gol-row">
      <input type="text" placeholder="Jugador" value="${g.jugador||''}" oninput="_golesTemporales[${i}].jugador=this.value" style="flex:2">
      <input type="number" placeholder="Min" value="${g.minuto||''}" oninput="_golesTemporales[${i}].minuto=this.value" style="width:72px">
      <select onchange="_golesTemporales[${i}].equipo=this.value">
        <option value="HUGUS"${g.equipo==='HUGUS'?' selected':''}>HUGUS</option>
        <option value="RIVAL"${g.equipo==='RIVAL'?' selected':''}>RIVAL</option>
      </select>
      <button class="btn-admin-small delete" onclick="eliminarGolAdmin(${i})">🗑</button>
    </div>`).join('');
}

function cancelarEdicion() {
  _adminEditandoId = null;
  document.getElementById('adminEditId').value = '';
  ['adminFecha','adminRival','adminLugar','adminCompetencia'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const h = document.getElementById('adminHora'); if(h) h.value='15:00';
  const el = document.getElementById('adminEsLocal'); if(el) el.value='true';
  const es = document.getElementById('adminEstado'); if(es) es.value='proximo';
  const btnG = document.getElementById('btnGuardarPartido');
  if(btnG) btnG.textContent='💾 Guardar Partido';
  const btnC = document.getElementById('btnCancelarEdicion');
  if(btnC) btnC.style.display='none';
  _golesTemporales = [];
  renderAdminGoles();
  toggleResultadoFields();
}

function editarPartido(id) {
  db.collection(COL.PARTIDOS).doc(id).get().then(doc => {
    if (!doc.exists) return;
    const p = doc.data();
    _adminEditandoId = id;
    document.getElementById('adminEditId').value      = id;
    document.getElementById('adminFecha').value       = p.fecha;
    document.getElementById('adminHora').value        = p.hora;
    document.getElementById('adminRival').value       = p.rival;
    document.getElementById('adminLugar').value       = p.lugar || '';
    document.getElementById('adminCompetencia').value = p.competencia || '';
    document.getElementById('adminEsLocal').value     = p.esLocal ? 'true' : 'false';
    document.getElementById('adminEstado').value      = p.estado || 'proximo';
    _golesTemporales = p.goles ? JSON.parse(JSON.stringify(p.goles)) : [];
    renderAdminGoles();
    toggleResultadoFields();
    const btnG = document.getElementById('btnGuardarPartido');
    if(btnG) btnG.textContent='✏️ Actualizar Partido';
    const btnC = document.getElementById('btnCancelarEdicion');
    if(btnC) btnC.style.display='inline-flex';
    document.getElementById('adminFormContainer').scrollIntoView({ behavior:'smooth' });
  }).catch(console.error);
}

function eliminarPartido(id) {
  if (!confirm('¿Eliminar este partido?')) return;
  db.collection(COL.PARTIDOS).doc(id).delete()
    .then(() => showToast('🗑 Partido eliminado','error'))
    .catch(console.error);
}

function guardarPartido() {
  const fecha       = document.getElementById('adminFecha').value;
  const hora        = document.getElementById('adminHora').value;
  const rival       = document.getElementById('adminRival').value.trim();
  const lugar       = document.getElementById('adminLugar').value.trim();
  const competencia = document.getElementById('adminCompetencia').value.trim();
  const esLocal     = document.getElementById('adminEsLocal').value === 'true';
  const estado      = document.getElementById('adminEstado').value;
  if (!fecha||!rival||!lugar||!competencia) { showToast('Completa todos los campos','error'); return; }
  const golesValid = _golesTemporales.filter(g => String(g.jugador).trim() && g.minuto);
  const data = {
    fecha, hora, rival, lugar, competencia, esLocal, estado,
    goles:      estado==='jugado' ? golesValid : [],
    golesHUGUS: estado==='jugado' ? golesValid.filter(g=>g.equipo==='HUGUS').length : null,
    golesRival: estado==='jugado' ? golesValid.filter(g=>g.equipo==='RIVAL').length : null
  };
  const op = _adminEditandoId
    ? db.collection(COL.PARTIDOS).doc(_adminEditandoId).update(data)
    : db.collection(COL.PARTIDOS).add(data);
  op.then(() => { showToast(_adminEditandoId?'✏️ Partido actualizado':'💾 Partido guardado'); cancelarEdicion(); })
    .catch(e => { console.error(e); showToast('Error al guardar','error'); });
}

function cargarTablaPartidosAdmin(partidos) {
  const render = data => {
    const tbody = document.getElementById('adminPartidosTableBody');
    if (!tbody) return;
    if (!data.length) { tbody.innerHTML='<tr><td colspan="8" class="admin-no-data">No hay partidos.</td></tr>'; return; }
    tbody.innerHTML = data.map(p => {
      const f = new Date(p.fecha+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'});
      const badge = p.estado==='jugado'
        ? '<span class="admin-badge jugado">Jugado</span>'
        : p.estado==='en_vivo'
          ? '<span class="admin-badge en_vivo">🔴 En Vivo</span>'
          : '<span class="admin-badge proximo">Próximo</span>';
      const res = p.golesHUGUS!==undefined && p.golesHUGUS!==null
        ? `<strong style="color:var(--gold)">${p.golesHUGUS}–${p.golesRival}</strong>` : '—';
      return `<tr><td>${f}</td><td>${p.hora}</td><td>${p.rival}</td><td>${p.lugar||'—'}</td><td>${p.esLocal?'🏠':'✈️'}</td><td>${badge}</td><td>${res}</td>
        <td><button class="btn-admin-edit" onclick="editarPartido('${p.id}')">✏️</button>
            <button class="btn-admin-delete" onclick="eliminarPartido('${p.id}')">🗑</button></td></tr>`;
    }).join('');
  };
  if (partidos) { render(partidos); return; }
  db.collection(COL.PARTIDOS).orderBy('fecha','asc').get()
    .then(s => render(s.docs.map(d=>({id:d.id,...d.data()}))))
    .catch(console.error);
}