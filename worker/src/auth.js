import { json, generarSalt, hashPassword, generarToken, passwordEsSegura } from "./utils.js";

export async function handleRegister(request, env) {
  const body = await request.json();
  const usuario = (body.usuario || "").trim();
  const nombreCompleto = (body.nombreCompleto || "").trim();
  const password = body.password || "";

  if (usuario.length < 3) {
    return json({ error: "El nombre de usuario debe tener al menos 3 caracteres." }, 400);
  }
  if (nombreCompleto.length < 3) {
    return json({ error: "Indica tu nombre y apellidos." }, 400);
  }
  if (!passwordEsSegura(password)) {
    return json({ error: "La contraseña debe tener al menos 8 caracteres, con letras y números." }, 400);
  }

  const existente = await env.DB.prepare("SELECT id FROM usuarios WHERE nombre = ?").bind(usuario).first();
  if (existente) {
    return json({ error: "Ese nombre de usuario ya existe." }, 400);
  }

  const salt = generarSalt();
  const hash = await hashPassword(password, salt);
  const ahora = new Date().toISOString();

  const nuevoUsuario = await env.DB.prepare(
    "INSERT INTO usuarios (nombre, nombre_completo, pin_hash, pin_salt, creado_en) VALUES (?, ?, ?, ?, ?) RETURNING id"
  )
    .bind(usuario, nombreCompleto, hash, salt, ahora)
    .first();

  const token = await crearSesion(env, nuevoUsuario.id);
  return json({ token, usuario, nombreCompleto });
}

export async function handleLogin(request, env) {
  const body = await request.json();
  const usuario = (body.usuario || "").trim();
  const password = body.password || "";

  const fila = await env.DB.prepare(
    "SELECT id, pin_hash, pin_salt, nombre_completo FROM usuarios WHERE nombre = ?"
  )
    .bind(usuario)
    .first();

  if (!fila) {
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  const hashCalculado = await hashPassword(password, fila.pin_salt);
  if (hashCalculado !== fila.pin_hash) {
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  const token = await crearSesion(env, fila.id);
  return json({ token, usuario, nombreCompleto: fila.nombre_completo });
}

export async function crearSesion(env, usuarioId) {
  const token = generarToken();
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

  await env.DB.prepare(
    "INSERT INTO sesiones (token, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)"
  )
    .bind(token, usuarioId, ahora.toISOString(), expira.toISOString())
    .run();

  return token;
}

export async function verificarSesion(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const sesion = await env.DB.prepare(
    "SELECT usuario_id, expira_en FROM sesiones WHERE token = ?"
  )
    .bind(token)
    .first();

  if (!sesion) return null;
  if (new Date(sesion.expira_en) < new Date()) {
    await env.DB.prepare("DELETE FROM sesiones WHERE token = ?").bind(token).run();
    return null;
  }

  const nuevaExpira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("UPDATE sesiones SET expira_en = ? WHERE token = ?")
    .bind(nuevaExpira, token)
    .run();

  return sesion.usuario_id;
}

export async function handleLogout(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token) {
    await env.DB.prepare("DELETE FROM sesiones WHERE token = ?").bind(token).run();
  }
  return json({ ok: true });
}
