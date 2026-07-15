cat > worker.js << 'ENDWORKER'
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    try {
      let response;
      if (method === 'GET') {
        if (path === '/api/jugadores') response = await env.DB.prepare('SELECT * FROM jugadores ORDER BY numero ASC').all();
        else if (path === '/api/noticias') response = await env.DB.prepare('SELECT * FROM noticias ORDER BY fecha DESC, creado_at DESC').all();
        else if (path === '/api/partidos') response = await env.DB.prepare('SELECT * FROM partidos ORDER BY fecha ASC').all();
        else if (path === '/api/tabla') {
          const r = await env.DB.prepare('SELECT * FROM tabla_posiciones ORDER BY (jg*3+je) DESC, (gf-gc) DESC, gf DESC').all();
          response = { results: r.results.map(t => ({ ...t, jj: t.jg+t.je+t.jp, dg: t.gf-t.gc, pts: t.jg*3+t.je })) };
        }
        else if (path === '/api/galeria') response = await env.DB.prepare('SELECT * FROM galeria ORDER BY orden ASC').all();
        else if (path === '/api/auth/check') {
          const token = (request.headers.get('Authorization')||'').replace('Bearer ','');
          if (!token) return json({authenticated:false}, corsHeaders);
          const s = await env.DB.prepare('SELECT s.*, u.nombre, u.email, u.rol FROM sesiones s JOIN usuarios u ON s.usuario_id=u.id WHERE s.token=? AND s.expira>datetime("now")').bind(token).first();
          return json(s ? {authenticated:true, user:{id:s.usuario_id,nombre:s.nombre,email:s.email,rol:s.rol}} : {authenticated:false}, corsHeaders);
        }
        else { response = await serveStatic(url); }
      } else if (method === 'POST') {
        if (path === '/api/auth/login') {
          const {email, password} = await request.json();
          const u = await env.DB.prepare('SELECT * FROM usuarios WHERE email=? AND password=?').bind(email, password).first();
          if (!u) return json({error:'Correo o contraseña incorrectos'}, 401, corsHeaders);
          const token = 'tk_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,8);
          const exp = new Date(Date.now()+7*86400000).toISOString();
          await env.DB.prepare('INSERT INTO sesiones (token, usuario_id, expira) VALUES (?,?,?)').bind(token, u.id, exp).run();
          return json({token, user:{id:u.id,nombre:u.nombre,email:u.email,rol:u.rol}}, 200, corsHeaders);
        } else if (path === '/api/auth/register') {
          const {nombre, email, password} = await request.json();
          if (!nombre||!email||!password) return json({error:'Faltan campos'}, 400, corsHeaders);
          const ex = await env.DB.prepare('SELECT id FROM usuarios WHERE email=?').bind(email).first();
          if (ex) return json({error:'Este correo ya está registrado'}, 409, corsHeaders);
          const id = 'u_'+Date.now().toString(36);
          await env.DB.prepare('INSERT INTO usuarios (id,nombre,email,password,rol) VALUES (?,?,?,?,?)').bind(id, nombre, email, password, 'user').run();
          return json({message:'Cuenta creada', id}, 201, corsHeaders);
        } else if (path === '/api/auth/logout') {
          const token = (request.headers.get('Authorization')||'').replace('Bearer ','');
          if (token) await env.DB.prepare('DELETE FROM sesiones WHERE token=?').bind(token).run();
          return json({message:'Sesión cerrada'}, 200, corsHeaders);
        } else {
          const auth = await verifyAdmin(request, env);
          if (!auth) return json({error:'No autorizado'}, 401, corsHeaders);
          if (path === '/api/admin/noticias') {
            const {titulo, categoria, fecha, resumen, imagen} = await request.json();
            if (!titulo||!categoria||!fecha||!resumen) return json({error:'Faltan campos'}, 400, corsHeaders);
            const id = 'n_'+Date.now().toString(36);
            await env.DB.prepare('INSERT INTO noticias (id,titulo,categoria,fecha,resumen,imagen) VALUES (?,?,?,?,?,?)').bind(id,titulo,categoria,fecha,resumen,imagen||'').run();
            return json({message:'Noticia creada',id}, 201, corsHeaders);
          } else if (path === '/api/admin/partidos') {
            const {rival, fecha, lugar, competencia} = await request.json();
            if (!rival||!fecha) return json({error:'Faltan campos'}, 400, corsHeaders);
            const id = 'p_'+Date.now().toString(36);
            await env.DB.prepare('INSERT INTO partidos (id,rival,fecha,lugar,competencia,goles_local,goles_visita,resultado) VALUES (?,?,?,?,?,\'[]\',\'[]\',NULL)').bind(id,rival,fecha,lugar||'',competencia||'').run();
            return json({message:'Partido creado',id}, 201, corsHeaders);
          } else if (path === '/api/admin/jugadores') {
            const {nombre, posicion, numero, detalle} = await request.json();
            if (!nombre||!posicion||!numero) return json({error:'Faltan campos'}, 400, corsHeaders);
            const id = 'j_'+Date.now().toString(36);
            await env.DB.prepare('INSERT INTO jugadores (id,nombre,posicion,numero,detalle) VALUES (?,?,?,?,?)').bind(id,nombre,posicion,numero,detalle||'').run();
            return json({message:'Jugador creado',id}, 201, corsHeaders);
          } else if (path === '/api/admin/tabla') {
            const {nombre, inicial, jg, je, jp, gf, gc} = await request.json();
            if (!nombre||!inicial) return json({error:'Faltan campos'}, 400, corsHeaders);
            const id = 't_'+Date.now().toString(36);
            await env.DB.prepare('INSERT INTO tabla_posiciones (id,nombre,inicial,jg,je,jp,gf,gc) VALUES (?,?,?,?,?,?,?,?)').bind(id,nombre,inicial,jg||0,je||0,jp||0,gf||0,gc||0).run();
            return json({message:'Equipo creado',id}, 201, corsHeaders);
          }
          return json({error:'Ruta no encontrada'}, 404, corsHeaders);
        }
      } else if (method === 'DELETE') {
        const auth = await verifyAdmin(request, env);
        if (!auth) return json({error:'No autorizado'}, 401, corsHeaders);
        const id = path.split('/').pop();
        if (path.includes('/noticias/')) await env.DB.prepare('DELETE FROM noticias WHERE id=?').bind(id).run();
        else if (path.includes('/partidos/')) await env.DB.prepare('DELETE FROM partidos WHERE id=?').bind(id).run();
        else if (path.includes('/jugadores/')) await env.DB.prepare('DELETE FROM jugadores WHERE id=?').bind(id).run();
        else if (path.includes('/tabla/')) await env.DB.prepare('DELETE FROM tabla_posiciones WHERE id=?').bind(id).run();
        else return json({error:'Ruta no encontrada'}, 404, corsHeaders);
        return json({message:'Eliminado'}, 200, corsHeaders);
      }
      const h = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k,v]) => h.set(k,v));
      return new Response(response.body, {status:response.status, headers:h});
    } catch(err) {
      return json({error:'Error interno', details:err.message}, 500, corsHeaders);
    }
  }
};

function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json',...extra}});
}

async function verifyAdmin(request, env) {
  const token = (request.headers.get('Authorization')||'').replace('Bearer ','');
  if (!token) return false;
  const s = await env.DB.prepare('SELECT s.*, u.rol FROM sesiones s JOIN usuarios u ON s.usuario_id=u.id WHERE s.token=? AND s.expira>datetime("now") AND u.rol=?').bind(token,'admin').first();
  return !!s;
}

async function serveStatic(url) {
  const path = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    const r = await fetch(new Request(path));
    if (r.status === 200) return r;
  } catch(e) {}
  return json({error:'No encontrado'}, 404);
}
