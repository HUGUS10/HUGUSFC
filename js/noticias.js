/* ==========================================================================
   HUGUS FC — noticias.js
   Noticias del club: renderizado público en tiempo real + CRUD desde admin.
   Depende de firebase.js (db, storage) y ui.js (showToast).
   ========================================================================== */

const MESES_LARGOS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return fechaISO;
  return `${d} de ${MESES_LARGOS_ES[m - 1]} de ${y}`;
}

/* ==========================================================================
   PÚBLICO
   ========================================================================== */

function iniciarListenerNoticias() {
  const grid = document.getElementById("noticiasGrid");
  if (!grid || typeof db === "undefined") return;

  db.collection("noticias")
    .orderBy("fecha", "desc")
    .onSnapshot(
      (snap) => {
        const noticias = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderNoticias(noticias);
      },
      (err) => {
        console.error("Error escuchando noticias:", err);
        grid.innerHTML = `<div class="noticias-empty">No se pudieron cargar las noticias.</div>`;
      }
    );
}

function renderNoticias(noticias) {
  const grid = document.getElementById("noticiasGrid");
  if (!grid) return;

  if (!noticias.length) {
    grid.innerHTML = `<div class="noticias-empty">📰 Aún no hay noticias publicadas. ¡Vuelve pronto!</div>`;
    return;
  }

  grid.innerHTML = noticias
    .map(
      (n) => `
    <article class="noticia-card">
      <img class="noticia-img" src="${n.foto || "imag/escudo_hugusfc.png"}" alt="${escapeHTML(n.titulo || "Noticia HUGUS FC")}" loading="lazy">
      <div class="noticia-body">
        <span class="noticia-cat">${escapeHTML(n.categoria || "Club")}</span>
        <h3 class="noticia-title">${escapeHTML(n.titulo || "Sin título")}</h3>
        <p class="noticia-resumen">${escapeHTML(n.resumen || "")}</p>
        <span class="noticia-fecha">${formatearFechaLarga(n.fecha)}</span>
      </div>
    </article>`
    )
    .join("");
}

/* ==========================================================================
   ADMIN — CRUD de noticias
   ========================================================================== */

let noticiaFotoBase64 = null;

function previewNoticiaFoto(input) {
  const file = input.files?.[0];
  const preview = document.getElementById("noticiaFotoPreview");
  if (!file || !preview) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast("La imagen supera los 2 MB permitidos.", "error");
    input.value = "";
    return;
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showToast("Formato no soportado. Usa PNG, JPG o WEBP.", "error");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    noticiaFotoBase64 = e.target.result;
    preview.src = noticiaFotoBase64;
    preview.classList.add("show");
  };
  reader.readAsDataURL(file);
}

async function subirFotoNoticia(id) {
  const input = document.getElementById("noticiaFotoInput");
  const file = input?.files?.[0];
  if (!file) return null;

  const ref = storage.ref(`noticias/${id}_${Date.now()}_${file.name}`);
  const snapshot = await ref.put(file);
  return await snapshot.ref.getDownloadURL();
}

async function guardarNoticia() {
  const id = document.getElementById("noticiaEditId")?.value;

  const data = {
    titulo: document.getElementById("noticiaTitulo")?.value.trim() || "",
    categoria: document.getElementById("noticiaCategoria")?.value || "Club",
    fecha: document.getElementById("noticiaFecha")?.value || new Date().toISOString().slice(0, 10),
    resumen: document.getElementById("noticiaResumen")?.value.trim() || "",
    contenido: document.getElementById("noticiaContenido")?.value.trim() || ""
  };

  if (!data.titulo || !data.resumen) {
    showToast("Completa al menos título y resumen.", "error");
    return;
  }

  try {
    let docId = id;
    if (docId) {
      await db.collection("noticias").doc(docId).update(data);
    } else {
      data.creado = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection("noticias").add(data);
      docId = ref.id;
    }

    const input = document.getElementById("noticiaFotoInput");
    if (input?.files?.[0]) {
      const url = await subirFotoNoticia(docId);
      if (url) await db.collection("noticias").doc(docId).update({ foto: url });
    }

    showToast(id ? "Noticia actualizada" : "Noticia publicada", "success");
    cancelarNoticia();
    cargarNoticiasAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al guardar la noticia", "error");
  }
}

function cancelarNoticia() {
  document.getElementById("noticiaEditId").value = "";
  document.getElementById("noticiaTitulo").value = "";
  document.getElementById("noticiaCategoria").value = "Partido";
  document.getElementById("noticiaFecha").value = "";
  document.getElementById("noticiaResumen").value = "";
  document.getElementById("noticiaContenido").value = "";
  document.getElementById("noticiaFotoInput").value = "";
  const preview = document.getElementById("noticiaFotoPreview");
  if (preview) { preview.src = ""; preview.classList.remove("show"); }
  noticiaFotoBase64 = null;
  document.getElementById("btnCancelarNoticia").style.display = "none";
}

async function editarNoticiaAdmin(id) {
  try {
    const doc = await db.collection("noticias").doc(id).get();
    if (!doc.exists) return;
    const n = doc.data();

    document.getElementById("noticiaEditId").value = id;
    document.getElementById("noticiaTitulo").value = n.titulo || "";
    document.getElementById("noticiaCategoria").value = n.categoria || "Club";
    document.getElementById("noticiaFecha").value = n.fecha || "";
    document.getElementById("noticiaResumen").value = n.resumen || "";
    document.getElementById("noticiaContenido").value = n.contenido || "";

    const preview = document.getElementById("noticiaFotoPreview");
    if (preview && n.foto) {
      preview.src = n.foto;
      preview.classList.add("show");
    }

    document.getElementById("btnCancelarNoticia").style.display = "inline-flex";
    document.getElementById("adminNoticiaForm").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showToast("No se pudo cargar la noticia", "error");
  }
}

async function eliminarNoticiaAdmin(id) {
  if (!confirm("¿Eliminar esta noticia?")) return;
  try {
    await db.collection("noticias").doc(id).delete();
    showToast("Noticia eliminada", "success");
    cargarNoticiasAdmin();
  } catch (err) {
    console.error(err);
    showToast("Error al eliminar la noticia", "error");
  }
}

async function cargarNoticiasAdmin() {
  const tbody = document.getElementById("adminNoticiasTableBody");
  if (!tbody) return;
  try {
    const snap = await db.collection("noticias").orderBy("fecha", "desc").get();
    const noticias = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!noticias.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-no-data">No hay noticias publicadas aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = noticias
      .map(
        (n) => `
      <tr>
        <td><img src="${n.foto || "imag/escudo_hugusfc.png"}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px"></td>
        <td>${escapeHTML(n.titulo || "—")}</td>
        <td>${escapeHTML(n.categoria || "—")}</td>
        <td>${formatearFechaLarga(n.fecha)}</td>
        <td>
          <button class="action-btn" onclick="editarNoticiaAdmin('${n.id}')" title="Editar">✏️</button>
          <button class="action-btn" onclick="eliminarNoticiaAdmin('${n.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="admin-no-data">Error al cargar las noticias.</td></tr>`;
  }
}

if (typeof escapeHTML !== "function") {
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarListenerNoticias();
});