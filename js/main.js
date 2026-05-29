// Función para cerrar el preloader
function cerrarPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// Inicializar todo al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cerrarPreloader();
});