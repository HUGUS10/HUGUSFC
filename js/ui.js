/* ==========================================================================
   HUGUS FC — ui.js
   Interacciones globales de interfaz: nav, menú móvil, toasts, reveal on
   scroll, preloader, instalación PWA, botón volver arriba, nav inferior activo.
   ========================================================================== */

/* ---------- Menú móvil ---------- */
function toggleMenu() {
  const ham = document.getElementById("ham");
  const menu = document.getElementById("mobMenu");
  if (!ham || !menu) return;
  const open = menu.classList.toggle("open");
  ham.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  ham.setAttribute("aria-expanded", open ? "true" : "false");
}

function closeMenu() {
  const ham = document.getElementById("ham");
  const menu = document.getElementById("mobMenu");
  if (!ham || !menu) return;
  menu.classList.remove("open");
  ham.classList.remove("open");
  document.body.classList.remove("menu-open");
}

/* ---------- Menú de usuario (dropdown) ---------- */
function toggleUserMenu() {
  const dd = document.getElementById("userDropdown");
  if (!dd) return;
  dd.classList.toggle("open");
}

document.addEventListener("click", (e) => {
  const container = document.getElementById("userMenuContainer");
  const dd = document.getElementById("userDropdown");
  if (!container || !dd) return;
  if (!container.contains(e.target)) dd.classList.remove("open");
});

/* ---------- Toasts ---------- */
function showToast(message, type = "success", duration = 3200) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "opacity .25s ease, transform .25s ease";
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/* ---------- Scroll: nav compacto + back to top + bottom nav activo ---------- */
function initScrollEffects() {
  const nav = document.getElementById("mainNav");
  const btt = document.getElementById("btt");

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (btt) btt.classList.toggle("show", y > 500);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function marcarNavActivo() {
  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".bottom-nav .nav-item").forEach((item) => {
    const href = (item.getAttribute("href") || "").toLowerCase();
    item.classList.toggle("active", href === page || (page === "" && href === "index.html"));
  });
}

/* ---------- Reveal on scroll (IntersectionObserver) ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal, .reveal-l, .reveal-r");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Contador animado del statsbar ---------- */
function initContadores() {
  const nums = document.querySelectorAll(".st-n[data-target]");
  if (!nums.length) return;

  const animar = (el) => {
    const target = parseInt(el.getAttribute("data-target"), 10) || 0;
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    nums.forEach(animar);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animar(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  nums.forEach((el) => io.observe(el));
}

/* ---------- Preloader con progreso ---------- */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  const fill = document.getElementById("preFill");
  const pct = document.getElementById("prePercent");
  if (!preloader) return;

  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(progress + Math.random() * 18, 96);
    if (fill) fill.style.width = progress + "%";
    if (pct) pct.textContent = Math.round(progress) + "%";
  }, 140);

  window.addEventListener("load", () => {
    clearInterval(tick);
    if (fill) fill.style.width = "100%";
    if (pct) pct.textContent = "100%";
    setTimeout(() => {
      preloader.classList.add("hide");
      document.body.classList.remove("loading");
    }, 280);
  });
}

/* ---------- PWA: instalación ---------- */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

async function instalarApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      showToast("¡App instalada correctamente!", "success");
    }
    deferredPrompt = null;
    return;
  }

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (esIOS) {
    showToast("En iPhone: toca Compartir → 'Agregar a inicio'", "success", 4500);
  } else {
    showToast("Tu navegador ya tiene la app instalada o no es compatible.", "error", 4000);
  }
}

/* ---------- PWA: forzar actualización del Service Worker ---------- */
async function forzarActualizacion() {
  if (!("serviceWorker" in navigator)) {
    showToast("Tu navegador no soporta actualizaciones automáticas.", "error");
    return;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      showToast("No hay una versión instalada para actualizar.", "error");
      return;
    }
    await reg.update();
    showToast("Buscando actualizaciones...", "success");
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => window.location.reload(), 800);
    } else {
      setTimeout(() => showToast("Ya tienes la última versión.", "success"), 1200);
    }
  } catch (err) {
    console.error(err);
    showToast("No se pudo comprobar actualizaciones.", "error");
  }
}

/* ---------- Registro del Service Worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("No se pudo registrar el Service Worker:", err);
    });
  });
}

/* ---------- Init global ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const ham = document.getElementById("ham");
  if (ham) ham.addEventListener("click", toggleMenu);

  document.querySelectorAll(".mob-menu a").forEach((a) => a.addEventListener("click", closeMenu));

  initScrollEffects();
  marcarNavActivo();
  initReveal();
  initContadores();
  initPreloader();
});