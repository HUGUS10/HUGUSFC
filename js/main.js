// ============================================================
// HUGUS FC · main.js — Inicialización y Tabla Posiciones
// ============================================================

let _tablaEditandoId = null;

/* ── TABLA DE POSICIONES — RENDER ── */
function renderTablaPosiciones() {
  db.collection(COL.TABLA).get().then(snap => {
    const tabla = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    const tbody = document.getElementById('tablaPosicionesBody');
    if (!tbody) return;
    if (!tabla.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--grey);font-family:\'Barlow Condensed\';letter-spacing:.12em">Tabla en construcción…</td></tr>';
      return;
    }
    const sorted = tabla.sort((a,b) => {
      const ptA = a.g*3+a.e, ptB = b.g*3+b.e;
      if (ptB !== ptA) return ptB - ptA;
      return (b.gf-b.gc) - (a.gf-a.gc);
    });
    tbody.innerHTML = sorted.map((eq, i) => {
      const pts = eq.g*3+eq.e, dg = eq.gf-eq.gc;
      const esc = eq.esHugus
        ? `<img src="imag/escudo_hugusfc.png" style="width:22px;height:22px;object-fit:contain" alt="">`
        : eq.equipo.substring(0,2).toUpperCase();
      return `<tr ${eq.esHugus?'class="row-hugus"':''}>
        <td><div class="tabla-equipo">
          <span class="tabla-pos${i===0?' primero':i===1?' segundo':i===2?' tercero':''}">${i+1}</span>
          <div class="tabla-escudito">${esc}</div>
          <span class="tabla-nombre${eq.esHugus?' gold':''}">${eq.equipo}</span>
        </div></td>
        <td>${eq.pj}</td>
        <td><span class="tbadge-w">${eq.g}</span></td>
        <td><span class="tbadge-d">${eq.e}</span></td>
        <td><span class="tbadge-l">${eq.p}</span></td>
        <td>${eq.gf}</td><td>${eq.gc}</td>
        <td>${dg>=0?'+'+dg:dg}</td>
        <td class="tabla-pts">${pts}</td>
      </tr>`;
    }).join('');
  }).catch(console.error);
}

/* ── ADMIN TABLA — CRUD ── */
function cargarAdminTabla() {
  db.collection(COL.TABLA).orderBy('equipo').get().then(snap => {
    const tabla = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderAdminTabla(tabla);
  }).catch(console.error);
}

function renderAdminTabla(tabla) {
  const tbody = document.getElementById('adminTablaBody');
  if (!tbody) return;
  if (!tabla.length) { tbody.innerHTML='<tr><td colspan="9" class="admin-no-data">No hay equipos registrados.</td></tr>'; return; }
  const sorted = tabla.sort((a,b)=>((b.g*3+b.e)-(a.g*3+a.e))||((b.gf-b.gc)-(a.gf-a.gc)));
  tbody.innerHTML = sorted.map(eq => {
    const pts = eq.g*3+eq.e;
    return `<tr><td>${eq.equipo}${eq.esHugus?' ⭐':''}</td>
      <td>${eq.pj}</td><td>${eq.g}</td><td>${eq.e}</td><td>${eq.p}</td>
      <td>${eq.gf}</td><td>${eq.gc}</td>
      <td><strong style="color:var(--gold)">${pts}</strong></td>
      <td><button class="btn-admin-edit" onclick="editarEquipoTabla('${eq.id}')">✏️</button>
          <button class="btn-admin-delete" onclick="eliminarEquipoTabla('${eq.id}')">🗑</button></td></tr>`;
  }).join('');
}

function editarEquipoTabla(id) {
  db.collection(COL.TABLA).doc(id).get().then(doc => {
    if (!doc.exists) return;
    const eq = doc.data();
    _tablaEditandoId = id;
    document.getElementById('tablaEquipo').value  = eq.equipo;
    document.getElementById('tablaPJ').value       = eq.pj;
    document.getElementById('tablaG').value        = eq.g;
    document.getElementById('tablaE').value        = eq.e;
    document.getElementById('tablaP').value        = eq.p;
    document.getElementById('tablaGF').value       = eq.gf;
    document.getElementById('tablaGC').value       = eq.gc;
    document.getElementById('tablaEsHugus').value  = eq.esHugus ? 'true' : 'false';
    const btn = document.getElementById('btnCancelarTabla'); if(btn) btn.style.display='inline-flex';
    document.getElementById('adminTablaForm').scrollIntoView({ behavior:'smooth' });
  }).catch(console.error);
}

function cancelarTablaEdicion() {
  _tablaEditandoId = null;
  document.getElementById('tablaEditId').value = '';
  document.getElementById('tablaEquipo').value = '';
  ['tablaPJ','tablaG','tablaE','tablaP','tablaGF','tablaGC'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='0';});
  document.getElementById('tablaEsHugus').value = 'false';
  const btn = document.getElementById('btnCancelarTabla'); if(btn) btn.style.display='none';
}

function eliminarEquipoTabla(id) {
  if (!confirm('¿Eliminar este equipo de la tabla?')) return;
  db.collection(COL.TABLA).doc(id).delete()
    .then(()=>{ showToast('🗑 Equipo eliminado','error'); cargarAdminTabla(); renderTablaPosiciones(); })
    .catch(console.error);
}

function guardarEquipoTabla() {
  const equipo = document.getElementById('tablaEquipo').value.trim();
  if (!equipo) { showToast('Ingresa el nombre del equipo','error'); return; }
  const data = {
    equipo,
    pj: parseInt(document.getElementById('tablaPJ').value)||0,
    g:  parseInt(document.getElementById('tablaG').value)||0,
    e:  parseInt(document.getElementById('tablaE').value)||0,
    p:  parseInt(document.getElementById('tablaP').value)||0,
    gf: parseInt(document.getElementById('tablaGF').value)||0,
    gc: parseInt(document.getElementById('tablaGC').value)||0,
    esHugus: document.getElementById('tablaEsHugus').value === 'true'
  };
  const op = _tablaEditandoId
    ? db.collection(COL.TABLA).doc(_tablaEditandoId).update(data)
    : db.collection(COL.TABLA).add(data);
  op.then(()=>{
    showToast(_tablaEditandoId?'✏️ Equipo actualizado':'💾 Equipo guardado');
    cancelarTablaEdicion(); cargarAdminTabla(); renderTablaPosiciones();
  }).catch(e=>{ console.error(e); showToast('Error al guardar','error'); });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Listeners en tiempo real */
  listenPartidos();

  db.collection(COL.TABLA).onSnapshot(()=>{
    renderTablaPosiciones();
    cargarAdminTabla();
  }, err => console.error('Tabla listener:', err));

  db.collection(COL.NOTICIAS).onSnapshot(()=>{
    renderNoticias();
    cargarTablaNoticiasAdmin();
  }, err => console.error('Noticias listener:', err));

  /* Carga inicial */
  renderTablaPosiciones();
  renderNoticias();

  console.log('🚀 HUGUS FC inicializado correctamente.');
});