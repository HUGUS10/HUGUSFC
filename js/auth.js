// Constantes para localStorage
const USERS_KEY = 'hugusfc_users';
const SESSION_KEY = 'hugusfc_session';

// Funciones para manejar usuarios
function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Funciones para manejar la sesión
function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Función para registrar un usuario
function registrar() {
    const nombre = document.getElementById('regNombre').value;
    const apellido = document.getElementById('regApellido').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!nombre || !apellido || !email || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }

    const users = getUsers();
    if (users.some(user => user.email === email)) {
        alert('Este correo ya está registrado');
        return;
    }

    const newUser = {
        id: Date.now(),
        nombre,
        apellido,
        email,
        password,
        esAdmin: false
    };

    users.push(newUser);
    saveUsers(users);
    saveSession(newUser);

    alert('Registro exitoso');
    cerrarModalRegistro();
    abrirModalAuth();
}

// Función para iniciar sesión
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }

    const users = getUsers();
    const user = users.find(user => user.email === email && user.password === password);

    if (!user) {
        alert('Correo o contraseña incorrectos');
        return;
    }

    saveSession(user);
    alert('Inicio de sesión exitoso');
    cerrarModalAuth();
    actualizarUI();
}

// Función para cerrar sesión
function logout() {
    clearSession();
    actualizarUI();
    alert('Sesión cerrada');
}

// Función para actualizar la UI según el estado de la sesión
function actualizarUI() {
    const session = getSession();
    const btnAcceder = document.querySelector('.btn-acceder');

    if (session) {
        btnAcceder.textContent = `Hola, ${session.nombre}`;
        btnAcceder.onclick = logout;
    } else {
        btnAcceder.textContent = 'Acceder';
        btnAcceder.onclick = abrirModalAuth;
    }
}

// Funciones para manejar los modales
function abrirModalAuth() {
    document.getElementById('authModal').style.display = 'flex';
}

function cerrarModalAuth() {
    document.getElementById('authModal').style.display = 'none';
}

function mostrarRegistro() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('registroModal').style.display = 'flex';
}

function cerrarModalRegistro() {
    document.getElementById('registroModal').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('registroModal').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
}

// Inicializar la UI al cargar la página
document.addEventListener('DOMContentLoaded', actualizarUI);