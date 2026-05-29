// Constantes para localStorage
const NOTICIAS_KEY = 'hugusfc_noticias';

// Funciones para manejar noticias
function getNoticias() {
    const noticias = localStorage.getItem(NOTICIAS_KEY);
    return noticias ? JSON.parse(noticias) : [];
}

function saveNoticias(noticias) {
    localStorage.setItem(NOTICIAS_KEY, JSON.stringify(noticias));
}

// Función para inicializar noticias de ejemplo
function inicializarNoticias() {
    const noticias = getNoticias();
    if (noticias.length > 0) return;

    const noticiasIniciales = [
        {
            id: 1,
            titulo: 'Fundación de HUGUS FC',
            resumen: 'Nace un nuevo club de fútbol en El Colorado.',
            contenido: 'El 15 de abril de 2026 se fundó oficialmente HUGUS FC, un club con grandes aspiraciones y valores sólidos.',
            fecha: '2026-04-15',
            categoria: 'Club'
        },
        {
            id: 2,
            titulo: 'Primer Partido Amistoso',
            resumen: 'HUGUS FC juega su primer partido oficial.',
            contenido: 'El equipo disputará su primer encuentro amistoso el próximo 1 de junio en la Cancha El Colorado.',
            fecha: '2026-05-20',
            categoria: 'Partido'
        }
    ];

    saveNoticias(noticiasIniciales);
}

// Función para renderizar noticias
function renderizarNoticias() {
    const noticiasContainer = document.getElementById('noticiasContainer');
    if (!noticiasContainer) return;

    const noticias = getNoticias();
    if (noticias.length === 0) {
        noticiasContainer.innerHTML = '<p>No hay noticias disponibles.</p>';
        return;
    }

    let html = '';
    noticias.forEach(noticia => {
        const fecha = new Date(noticia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        html += `
            <div class="noticia-card">
                <div class="noticia-categoria">${noticia.categoria}</div>
                <h3>${noticia.titulo}</h3>
                <p class="noticia-resumen">${noticia.resumen}</p>
                <div class="noticia-fecha">${fechaFormateada}</div>
            </div>
        `;
    });

    noticiasContainer.innerHTML = html;
}

// Inicializar noticias y renderizar
document.addEventListener('DOMContentLoaded', () => {
    inicializarNoticias();
    renderizarNoticias();
});