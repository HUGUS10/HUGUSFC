-- ══════════════════════════════════════
-- HUGUS FC — Esquema D1 completo
-- Ejecutar en: Cloudflare Dashboard > D1 > hugusfc-db > Console
-- ══════════════════════════════════════

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT DEFAULT 'user',
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jugadores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  posicion TEXT NOT NULL,
  numero INTEGER NOT NULL,
  detalle TEXT DEFAULT '',
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS noticias (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fecha TEXT NOT NULL,
  resumen TEXT NOT NULL,
  imagen TEXT DEFAULT '',
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partidos (
  id TEXT PRIMARY KEY,
  rival TEXT NOT NULL,
  fecha TEXT NOT NULL,
  lugar TEXT DEFAULT '',
  competencia TEXT DEFAULT '',
  goles_local TEXT DEFAULT '[]',
  goles_visita TEXT DEFAULT '[]',
  resultado TEXT DEFAULT NULL,
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tabla_posiciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  inicial TEXT NOT NULL,
  jg INTEGER DEFAULT 0,
  je INTEGER DEFAULT 0,
  jp INTEGER DEFAULT 0,
  gf INTEGER DEFAULT 0,
  gc INTEGER DEFAULT 0,
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS galeria (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  imagen TEXT DEFAULT '',
  orden INTEGER DEFAULT 0,
  creado_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  expira TEXT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ══════════════════════════════════════
-- DATOS INICIALES
-- ══════════════════════════════════════

-- Admin por defecto (password: hugus2025)
INSERT OR IGNORE INTO usuarios (id, nombre, email, password, rol) VALUES
('admin1', 'Administrador HUGUS', 'admin@hugusfc.com', 'hugus2025', 'admin');

-- Plantilla completa 28 jugadores
INSERT OR IGNORE INTO jugadores (id, nombre, posicion, numero, detalle) VALUES
('j1','Carlos "El Muro" Ramírez','POR',1,'Capitán · 28 años'),
('j2','Miguel Herrera','DEF',2,'Lateral derecho · 24 años'),
('j3','Andrés López','DEF',4,'Central · 26 años'),
('j4','Roberto Sánchez','DEF',5,'Central · 27 años'),
('j5','Diego Torres','DEF',3,'Lateral izquierdo · 23 años'),
('j6','Fernando García','MED',6,'Mediocentro defensivo · 25 años'),
('j7','Javier Morales','MED',8,'Interior · 22 años'),
('j8','Ricardo Díaz','MED',10,'Enganche · 26 años'),
('j9','Eduardo Vargas','MED',7,'Extremo derecho · 23 años'),
('j10','Pablo Reyes','MED',11,'Extremo izquierdo · 24 años'),
('j11','Daniel "El Tanque" Cruz','DEL',9,'Delantero centro · 25 años'),
('j12','Sergio Martínez','DEL',17,'Segundo delantero · 21 años'),
('j13','Alejandro Flores','POR',12,'Portero suplente · 22 años'),
('j14','Cristian Orozco','DEF',14,'Central · 23 años'),
('j15','Gabriel Ríos','DEF',15,'Lateral · 22 años'),
('j16','Matías Castillo','MED',16,'Mediocentro · 20 años'),
('j17','Isaac Paredes','MED',18,'Interior · 21 años'),
('j18','Nicolás Suárez','DEL',19,'Delantero · 22 años'),
('j19','Brandon Lee','DEL',20,'Extremo · 19 años'),
('j20','Óscar Medina','DEF',21,'Lateral · 20 años'),
('j21','Raúl Espinoza','MED',22,'Volante · 21 años'),
('j22','Luis Ángel','POR',13,'Portero · 19 años'),
('j23','Kevin Salazar','DEF',24,'Central · 20 años'),
('j24','Adrián Mendoza','MED',23,'Medio · 19 años'),
('j25','César Jiménez','DEL',25,'Delantero · 20 años'),
('j26','Tomás Valdez','DEF',26,'Defensa · 18 años'),
('j27','Emiliano Rangel','MED',27,'Creativo · 19 años'),
('j28','Iván Contreras','DEL',28,'Puntero · 18 años');

-- Noticias iniciales
INSERT OR IGNORE INTO noticias (id, titulo, categoria, fecha, resumen) VALUES
('n1','HUGUS FC arrasa en el inicio de la temporada 2025','Partido','2025-01-25','Con un contundente 4-1, HUGUS FC demostró por qué es uno de los favoritos al título. Goles de Daniel Cruz (2), Ricardo Díaz y Eduardo Vargas.'),
('n2','Nuevas incorporaciones fortalecen la plantilla','Fichajes','2025-01-10','El club anuncia la llegada de tres refuerzos clave: Brandon Lee (extremo), Óscar Medina (lateral) y Raúl Espinoza (volante).'),
('n3','Convivencia familiar exitosa en Campo HUGUS','Social','2025-01-05','Más de 120 personas asistieron a la primera convivencia del año. Juegos, comida y un partido amistoso entre padres e hijos.'),
('n4','Daniel Cruz: "Este año vamos por el campeonato"','Entrevista','2024-12-28','El goleador estrella habla sobre las aspiraciones del equipo, la importancia de la fe y el hambre de títulos.'),
('n5','Programa de formación infantil arranca en febrero','Categorías','2024-12-20','HUGUS FC abrirá inscripciones para su academia infantil con tres categorías: Sub-10, Sub-13 y Sub-16.'),
('n6','Victoria agónica en el clásico de la ciudad','Partido','2024-12-15','Gol en el minuto 89 de Ricardo Díaz le da la victoria a HUGUS FC ante su máximo rival.');

-- Partidos (próximos y pasados)
INSERT OR IGNORE INTO partidos (id, rival, fecha, lugar, competencia, goles_local, goles_visita, resultado) VALUES
('p1','Águilas Doradas','2025-08-10T16:00','Campo HUGUS','Liga 2025','[]','[]',NULL),
('p2','Leones FC','2025-08-17T18:00','Estadio Municipal','Liga 2025','[]','[]',NULL),
('p3','Real Hermosillo','2025-08-24T16:00','Campo HUGUS','Liga 2025','[]','[]',NULL),
('p4','Tiburones Rojos','2025-09-01T17:00','Campo Norte','Liga 2025','[]','[]',NULL),
('p5','Panteras FC','2025-01-25T16:00','Campo HUGUS','Liga 2025','[{"min":12,"jug":"Daniel Cruz"},{"min":34,"jug":"Ricardo Díaz"},{"min":67,"jug":"Daniel Cruz"},{"min":82,"jug":"Eduardo Vargas"}]','[{"min":55,"jug":"Martín Gómez"}]','4-1'),
('p6','Diablos FC','2025-01-18T18:00','Estadio Municipal','Liga 2025','[{"min":23,"jug":"Ricardo Díaz"},{"min":89,"jug":"Ricardo Díaz"}]','[{"min":41,"jug":"Luis Perea"}]','2-1'),
('p7','Fénix SC','2025-01-11T16:00','Campo HUGUS','Copa 2025','[{"min":15,"jug":"Pablo Reyes"},{"min":38,"jug":"Daniel Cruz"},{"min":56,"jug":"Sergio Martínez"},{"min":72,"jug":"Eduardo Vargas"},{"min":88,"jug":"Nicolás Suárez"}]','[]','5-0');

-- Tabla de posiciones
INSERT OR IGNORE INTO tabla_posiciones (id, nombre, inicial, jg, je, jp, gf, gc) VALUES
('t1','HUGUS FC','H',8,1,0,24,5),
('t2','Águilas Doradas','A',6,2,1,18,10),
('t3','Real Hermosillo','R',5,3,1,16,9),
('t4','Leones FC','L',5,1,3,14,12),
('t5','Diablos FC','D',4,2,3,13,14),
('t6','Tiburones Rojos','T',3,3,3,11,13),
('t7','Panteras FC','P',2,2,5,9,18),
('t8','Fénix SC','F',1,1,7,6,22);

-- Galería
INSERT OR IGNORE INTO galeria (id, titulo, imagen, orden) VALUES
('g1','Victoria 4-1 vs Panteras','/imag/bandera_oficial.png',1),
('g2','Gol de Ricardo Díaz','/imag/camiseta.png',2),
('g3','Plantilla 2025 completa','/imag/bandera.png',3),
('g4','Convivencia familiar','/imag/bandera_oficial.png',4),
('g5','Entrenamiento nocturno','/imag/camiseta.png',5),
('g6','Fans en la grada','/imag/bandera.png',6),
('g7','Campeones 2024','/imag/bandera_oficial.png',7),
('g8','Día del niño en HUGUS','/imag/camiseta.png',8);