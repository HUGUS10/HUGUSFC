// Constantes para localStorage
const PARTIDOS_KEY = 'hugusfc_partidos';

// Funciones para manejar partidos
function getPartidos() {
    const partidos = localStorage.getItem(PARTIDOS_KEY);
    return partidos ? JSON.parse(partidos) : [];
}

function savePartidos(partidos) {
    localStorage.setItem(PARTIDOS_KEY, JSON.stringify(partidos));
}

// Función para inicializar partidos de ejemplo
function inicializarPartidos() {
    const partidos = getPartidos();
    if (partidos.length > 0) return;

    const partidosIniciales = [
        {
            id: 1,
            fecha: '2026-06-01',
            hora: '15:00',
            rival: 'Equipo Local',
            lugar: 'Cancha El Colorado',
            competencia: 'Partido Amistoso',
            esLocal: true,
            estado: 'proximo'
        },
        {
            id: 2,
            fecha: '2026-05-25',
            hora: '14:00',
            rival: 'Equipo Visitante',
            lugar: 'Estadio Municipal',
            competencia: 'Liga Local',
            esLocal: false,
            estado: 'jugado',
            golesHUGUS: 3,
            golesRival: 1
        }
    ];

    savePartidos(partidosIniciales);
}

// Función para renderizar el calendario
function renderizarCalendario() {
    const calendarioContainer = document.getElementById('calendarioContainer');
    if (!calendarioContainer) return;

    const partidos = getPartidos();
    if (partidos.length === 0) {
        calendarioContainer.innerHTML = '<p>No hay partidos programados.</p>';
        return;
    }

    let html = '';
    partidos.forEach(partido => {
        const fecha = new Date(partido.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        html += `
            <div class="partido-card">
                <div class="partido-fecha">${fechaFormateada} - ${partido.hora}</div>
                <div class="partido-equipos">
                    <span>${partido.esLocal ? 'HUGUS FC' : partido.rival}</span>
                    vs
                    <span>${partido.esLocal ? partido.rival : 'HUGUS FC'}</span>
                </div>
                <div class="partido-lugar">${partido.lugar}</div>
                ${partido.estado === 'jugado' ?
                    `<div class="partido-resultado">HUGUS ${partido.golesHUGUS} - ${partido.golesRival} ${partido.rival}</div>` :
                    `<div class="partido-estado">${partido.estado === 'proximo' ? 'Próximo' : 'En Vivo'}</div>`}
            </div>
        `;
    });

    calendarioContainer.innerHTML = html;
}

// Inicializar partidos y renderizar calendario
document.addEventListener('DOMContentLoaded', () => {
    inicializarPartidos();
    renderizarCalendario();
});