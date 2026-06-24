// ============================================================
// HUGUS FC · noticias.js — CRUD noticias Firebase
// ============================================================

let _noticiaEditandoId  = null;
let _noticiaFotoBase64  = null;

/* ── RENDER PÚBLICO ── */
function renderNoticias() {
  db.collection(COL.NOTICIAS).orderBy('fecha','desc').get().then(snap => {
    const noticias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const grid = document.getElementById('noticiasGrid');
    if (!grid) return;
    if (!noticias.length) {
      grid.innerHTML = '<div class="noticias-empty">📰 Las noticias se publicarán próximamente</div>'; return;
    }
    grid.innerHTML = noticias.map(n => {
      const f   = new Date(n.fecha+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'});
      const img = n.foto
        ? `<div class="noticia-img-wrap"><img src="${n.foto}" class="noticia-img" alt="${n.titulo}" loading="lazy"></div>`
        : `<div class="noticia-img-placeholder">📰</div>`;
      return `<div class="noticia-card reveal-up">
        ${img}
        <div class="noticia-body">
          <div class="noticia-cat">${n.categoria||'General'}</div>
          <div class="noticia-titulo">${n.titulo}</div>
          <div class="noticia-resumen">${n.resumen}</div>
          <div class="noticia-fecha">📅 ${f}</div>
        </div>
      </div>`;
    }).join('');
    /* Re-observe new cards */
    grid.querySelectorAll('.reveal-up').forEach(el => revObs && revObs.observe(el));
  }).catch(console.error);
}

/* ── ADMIN ── */
function previewNoticiaFoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2*1024*1024) { showToast('Imagen no puede superar 2 MB','error'); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('noticiaFotoPreview');
    if (p) { p.src = e.target.result; p.classList.add('show'); }
    _noticiaFotoBase64 = e.target.result;
  };
  reader.readAsDataURL(file);
}

function cancelarNoticia() {
  _noticiaEditandoId = null;
  _noticiaFotoBase64 = null;
  ['noticiaEditId','noticiaTitulo','noticiaResumen','noticiaContenido','noticiaFecha'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  const cat = document.getElementById('noticiaCategoria'); if(cat) cat.value='Partido';
  const fi  = document.getElementById('noticiaFotoInput'); if(fi) fi.value='';
  const p   = document.getElementById('noticiaFotoPreview'); if(p) { p.src=''; p.classList.remove('show'); }
  const btn = document.getElementById('btnCancelarNoticia'); if(btn) btn.style.display='none';
}

function editarNoticia(id) {
  db.collection(COL.NOTICIAS).doc(id).get().then(doc => {
    if (!doc.exists) return;
    const n = doc.data();
    _noticiaEditandoId = id;
    document.getElementById('noticiaEditId').value     = id;
    document.getElementById('noticiaTitulo').value     = n.titulo;
    document.getElementById('noticiaResumen').value    = n.resumen;
    document.getElementById('noticiaContenido').value  = n.contenido||'';
    document.getElementById('noticiaFecha').value      = n.fecha;
    document.getElementById('noticiaCategoria').value  = n.categoria||'Partido';
    if (n.foto) {
      const p = document.getElementById('noticiaFotoPreview');
      if(p) { p.src=n.foto; p.classList.add('show'); }
      _noticiaFotoBase64 = n.foto;
    }
    const btn = document.getElementById('btnCancelarNoticia'); if(btn) btn.style.display='inline-flex';
    document.getElementById('adminNoticiaForm').scrollIntoView({ behavior:'smooth' });
  }).catch(console.error);
}

function eliminarNoticia(id) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  db.collection(COL.NOTICIAS).doc(id).delete()
    .then(() => { showToast('🗑 Noticia eliminada','error'); cargarTablaNoticiasAdmin(); renderNoticias(); })
    .catch(console.error);
}

function guardarNoticia() {
  const titulo    = document.getElementById('noticiaTitulo').value.trim();
  const categoria = document.getElementById('noticiaCategoria').value;
  const fecha     = document.getElementById('noticiaFecha').value;
  const resumen   = document.getElementById('noticiaResumen').value.trim();
  const contenido = document.getElementById('noticiaContenido').value.trim();
  if (!titulo||!fecha||!resumen) { showToast('Título, fecha y resumen son obligatorios','error'); return; }
  const data = { titulo, categoria, fecha, resumen, contenido, foto: _noticiaFotoBase64||null };
  const op = _noticiaEditandoId
    ? db.collection(COL.NOTICIAS).doc(_noticiaEditandoId).update(data)
    : db.collection(COL.NOTICIAS).add(data);
  op.then(() => {
    showToast(_noticiaEditandoId ? '✏️ Noticia actualizada' : '📰 Noticia publicada');
    cancelarNoticia();
    cargarTablaNoticiasAdmin();
    renderNoticias();
  }).catch(e => { console.error(e); showToast('Error al guardar','error'); });
}

function cargarTablaNoticiasAdmin() {
  db.collection(COL.NOTICIAS).orderBy('fecha','desc').get().then(snap => {
    const noticias = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    const tbody = document.getElementById('adminNoticiasTableBody');
    if (!tbody) return;
    if (!noticias.length) { tbody.innerHTML='<tr><td colspan="5" class="admin-no-data">No hay noticias.</td></tr>'; return; }
    tbody.innerHTML = noticias.map(n => {
      const f   = new Date(n.fecha+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'});
      const img = n.foto
        ? `<img src="${n.foto}" style="width:44px;height:44px;object-fit:cover;border-radius:8px" alt="">`
        : `<div style="width:44px;height:44px;background:var(--dark3);border-radius:8px;display:flex;align-items:center;justify-content:center">📰</div>`;
      return `<tr><td>${img}</td><td style="max-width:200px;white-space:normal">${n.titulo}</td>
        <td><span class="admin-badge proximo">${n.categoria||'General'}</span></td><td>${f}</td>
        <td><button class="btn-admin-edit" onclick="editarNoticia('${n.id}')">✏️</button>
            <button class="btn-admin-delete" onclick="eliminarNoticia('${n.id}')">🗑</button></td></tr>`;
    }).join('');
  }).catch(console.error);
}