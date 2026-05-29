// Función para mostrar un toast (notificación)
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// Función para abrir el modal de autenticación
function abrirAuth() {
  document.getElementById('authOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de autenticación
function cerrarAuth() {
  document.getElementById('authOverlay').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('authError').classList.remove('show');
}

// Función para abrir el modal de la tienda
function abrirTienda() {
  document.getElementById('shopOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de la tienda
function cerrarTienda() {
  document.getElementById('shopOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Función para abrir el modal de perfil
function abrirPerfil() {
  const session = getSession();
  if (!session?.email) {
    abrirAuth();
    return;
  }

  const user = getUsers().find(u => u.email.toLowerCase() === session.email.toLowerCase());
  if (!user) return;

  document.getElementById('perfilAvatar').textContent = user.nombre.charAt(0).toUpperCase();
  document.getElementById('perfilNombre').textContent = user.nombre + ' ' + (user.apellido || '');
  document.getElementById('perfilRol').textContent = esAdmin(user) ? '⭐ Administrador' : 'Hincha Oficial';
  document.getElementById('perfilFullName').textContent = user.nombre + ' ' + (user.apellido || '');
  document.getElementById('perfilEmail').textContent = user.email;
  document.getElementById('perfilTipo').textContent = esAdmin(user) ? 'Administrador' : 'Hincha';
  document.getElementById('perfilFecha').textContent = user.fechaRegistro || 'Abril 2026';

  document.getElementById('perfilOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de perfil
function cerrarPerfil() {
  document.getElementById('perfilOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Función para abrir el panel de administración
function abrirAdminPanel() {
  const session = getSession();
  if (!session?.email) {
    abrirAuth();
    return;
  }

  const user = getUsers().find(u => u.email.toLowerCase() === session.email.toLowerCase());
  if (!esAdmin(user)) {
    showToast('Sin permisos de administrador', 'error');
    return;
  }

  document.getElementById('adminOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  cargarTablaPartidos();
  cargarTablaNoticiasAdmin();
  cancelarEdicion();
}

// Función para cerrar el panel de administración
function cerrarAdminPanel() {
  document.getElementById('adminOverlay').classList.remove('active');
  document.body.style.overflow = '';
  actualizarCalendarioUI();
  actualizarResultados();
}

// Función para cambiar entre pestañas de autenticación
function switchTab(tab) {
  document.getElementById('authError').classList.remove('show');
  const isLogin = tab === 'login';

  document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-registro').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-registro').classList.toggle('active', !isLogin);
}

// Función para cerrar el menú móvil
function closeMenu() {
  const ham = document.getElementById('ham');
  const mobMenu = document.getElementById('mobMenu');
  ham.classList.remove('active');
  mobMenu.classList.remove('open');
}

// Función para animar los contadores de estadísticas
function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = +el.getAttribute('data-target');
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (target === 100 ? '%' : '');
      if (current >= target) clearInterval(timer);
    }, 25);
  });
}

// Inicializar el IntersectionObserver para las animaciones de reveal
const revObs = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

// Aplicar el IntersectionObserver a todos los elementos con clase reveal
document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach(el => revObs.observe(el));

// Inicializar el IntersectionObserver para los contadores
const statsObs = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObs.disconnect();
      }
    });
  },
  { threshold: 0.3 }
);

const statsEl = document.querySelector('.statsbar');
if (statsEl) statsObs.observe(statsEl);

// Inicializar el menú móvil
const ham = document.getElementById('ham');
const mobMenu = document.getElementById('mobMenu');
ham.addEventListener('click', () => {
  ham.classList.toggle('active');
  mobMenu.classList.toggle('open');
});

// Cerrar el menú móvil al hacer clic fuera de él
document.addEventListener('click', (e) => {
  if (mobMenu.classList.contains('open') && !mobMenu.contains(e.target) && !ham.contains(e.target)) {
    closeMenu();
  }
});

// Inicializar el botón de "Volver arriba"
const btt = document.getElementById('btt');
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 50);
  if (btt) btt.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

// Inicializar el preloader
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hide');
  }, 2000);
});

// Inicializar el PWA Install Bubble
const installBubble = document.getElementById('installBubble');
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (window.innerWidth <= 1024) {
    installBubble.classList.add('show');
  }
});

installBubble.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    installBubble.classList.remove('show');
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  if (installBubble) installBubble.classList.remove('show');
});

// Registrar el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registrado:', registration.scope);
      })
      .catch(error => {
        console.error('Error al registrar el ServiceWorker:', error);
      });
  });
}

// Inicializar todo al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar el menú de usuario
  document.getElementById('userAvatarBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!document.getElementById('userMenuContainer').contains(e.target)) {
      document.getElementById('userDropdown').classList.remove('active');
    }
  });

  // Inicializar el menú de usuario en móviles
  const mobAccederBtn = document.getElementById('mobAccederBtn');
  if (mobAccederBtn) {
    mobAccederBtn.addEventListener('click', () => {
      closeMenu();
      abrirAuth();
    });
  }

  // Inicializar el modal de autenticación
  document.getElementById('authOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarAuth();
  });

  // Inicializar el modal de la tienda
  document.getElementById('shopOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarTienda();
  });

  // Inicializar el modal de perfil
  document.getElementById('perfilOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarPerfil();
  });

  // Inicializar el panel de administración
  document.getElementById('adminOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cerrarAdminPanel();
  });

  // Cerrar modales con la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarAuth();
      cerrarTienda();
      cerrarPerfil();
      cerrarAdminPanel();
    }
  });

  // Inicializar el nav active link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
});