// FIX-1 (puerta atrapada): para cada sala y cada puerta de casos generados, entra por esa puerta con el G.doorSpawn REAL
// (los dos jugadores) y comprueba, con la colisión real (World.hits) y con el A* del compañero, que nadie queda atrapado.
// OLD=1 prueba el spawn antiguo (sin sala) para medir cuántos fallos había.
// Uso: node tools/puertas_masa.js [N=200] [inicio=1] [paso=7919] | node tools/puertas_masa.js G6-2djn
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const TS = G.TS;
const arg = process.argv[2];
let seeds = [];
if (arg && /^G\d+-/i.test(arg)) { const r = G.caseSeedFromCode(arg); if (r.error) throw new Error(r.error); seeds = [r.seed]; }
else { const N = +arg || 200, I0 = +process.argv[3] || 1, STEP = +process.argv[4] || 7919; for (let i = I0; i < I0 + N; i++) seeds.push(i * STEP + 1); }

// región alcanzable con la colisión real, en pasos de 2 px (los jugadores se mueven a 1-3 px por fotograma)
function region(w, a, sx, sy) {
  const STEP = 4, key = (x, y) => x * 4096 + y, seen = new Set(), q = [[Math.round(sx), Math.round(sy)]];
  if (w.hits(a, q[0][0], q[0][1])) return { size: 0, seen, blocked: true };
  seen.add(key(q[0][0], q[0][1]));
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || seen.has(k) || w.hits(a, nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return { size: seen.size, seen };
}
// Un jugador está atrapado si, desde su aparición, no puede llegar a la mayor zona libre de la sala (la que contiene
// las demás puertas) o su zona es diminuta.
function check(def, roomId, door, withNpcs) {
  const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'solo' });
  st.chapter = 1; w.onChapter();
  if (!withNpcs) w.npcs = {};
  w.enterRoom(roomId, null, true);
  const room = w.room, d = room.doors.find((x) => x.id === door.id);
  const bad = [];
  const ref = G.doorInside(d), refx = (ref.x + 0.5) * TS, refy = (ref.y + 1) * TS - 10;
  w.players.forEach((p, i) => {
    const sp = G.doorSpawn(d, i, process.env.OLD ? undefined : room); p.x = sp.x; p.y = sp.y; p.room = roomId;
    const R = region(w, p, p.x, p.y);
    // zona principal = la mayor desde el centro de la baldosa de entrada si está libre; si no, el resto de puertas
    const others = room.doors.filter((x) => x.id !== d.id).map((x) => G.doorInside(x));
    const reachOther = others.length === 0 ? true : others.some((o) => R.seen.has(Math.round((o.x + 0.5) * TS / 2) * 2 * 4096 + Math.round(((o.y + 1) * TS - 10) / 2) * 2) || (function () { for (let dx = -6; dx <= 6; dx += 2) for (let dy = -6; dy <= 6; dy += 2) if (R.seen.has((Math.round((o.x + 0.5) * TS / 2) * 2 + dx) * 4096 + Math.round(((o.y + 1) * TS - 10) / 2) * 2 + dy)) return true; return false; })());
    if (R.blocked) bad.push({ i, why: 'aparece dentro de un sólido' });
    else if (R.size < 400) bad.push({ i, why: 'zona diminuta (' + R.size + ')' });
    else if (!reachOther) bad.push({ i, why: 'no llega a otra puerta' });
    // A* del compañero hasta la baldosa de la puerta contraria
    const sx = Math.floor(p.x / TS), sy = Math.floor((p.y - 1) / TS);
    if (!R.blocked && others.length) {
      const o = others[0], path = G.findPath(w, sx, sy, o.x, o.y);
      if (!path) bad.push({ i, why: 'A* sin camino a otra puerta' });
    }
  });
  return bad;
}
let rooms = 0, doors = 0, fails = [], genErr = 0;
for (const seed of seeds) {
  const r = G.generateCase(seed, { register: true });
  if (r.error) { genErr++; continue; }
  const def = JSON.parse(JSON.stringify(r.def));
  for (const rid of Object.keys(def.rooms)) {
    rooms++;
    for (const door of def.rooms[rid].doors) {
      doors++;
      for (const withNpcs of [false, true]) {
        let bad; try { bad = check(def, rid, door, withNpcs); } catch (e) { bad = [{ i: -1, why: 'excepción ' + e.message }]; }
        if (bad.length) fails.push({ seed, room: rid, door: door.id, wall: door.wall || 'n', npcs: withNpcs, bad });
      }
    }
  }
}

// Red de seguridad: se mete a un jugador dentro de un sólido (y en una baldosa cerrada) y World.unstick lo recoloca.
{
  const r = G.generateCase(seeds[0], { register: true }), def = JSON.parse(JSON.stringify(r.def));
  const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'solo' }); w.enterRoom(def.start.room, null, true);
  const room = w.room; let tests = 0, ok = 0;
  for (let ty = 0; ty < room.h; ty++) for (let tx = 0; tx < room.w; tx++) if (room.isSolidTile(tx, ty) && tx > 0 && ty > 0 && tx < room.w - 1 && ty < room.h - 1) {
    const p = w.players[0]; p.x = (tx + 0.5) * TS; p.y = (ty + 0.5) * TS; tests++;
    w.unstick(p); if (w.boxFree(p.x, p.y) && !w.unstick(p)) ok++;
  }
  console.log(`red de seguridad: ${ok}/${tests} recolocaciones correctas desde dentro de un sólido`);
  if (ok !== tests) { fails.push({ seed: seeds[0], room: def.start.room, door: '-', bad: [{ why: 'unstick falla' }] }); }
}

// Falsos positivos: ningún punto libre y conectado con una puerta (centro de baldosa libre) debe ser recolocado.
{
  let fp = 0, pts = 0;
  const defs = [G.CASES.tarta].filter(Boolean).map((d) => JSON.parse(JSON.stringify(d)));
  seeds.slice(0, 6).forEach((sd) => { const r = G.generateCase(sd, { register: true }); if (!r.error) defs.push(JSON.parse(JSON.stringify(r.def))); });
  defs.forEach((def) => Object.keys(def.rooms).forEach((rid) => {
    const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'solo' }); w.enterRoom(rid, null, true);
    const room = w.room, main = w.mainTiles(); if (!main) return;
    for (let ty = 0; ty < room.h; ty++) for (let tx = 0; tx < room.w; tx++) {
      if (!main.has(ty * 1000 + tx)) continue;
      const p = w.players[0]; p.x = (tx + 0.5) * TS; p.y = (ty + 0.5) * TS + 10; if (!w.boxFree(p.x, p.y)) continue;
      pts++; const x0 = p.x, y0 = p.y; if (w.unstick(p) || p.x !== x0 || p.y !== y0) fp++;
    }
  }));
  console.log(`falsos positivos de unstick: ${fp}/${pts} puntos libres (caso 1 + ${defs.length - 1} generados)`);
  if (fp) fails.push({ seed: 0, room: '-', door: '-', bad: [{ why: 'unstick mueve a quien no está atrapado' }] });
}
console.log(`casos ${seeds.length} · errores gen ${genErr} · salas ${rooms} · puertas ${doors} · fallos ${fails.length}`);
fails.slice(0, 12).forEach((f) => console.log(JSON.stringify(f)));
const bySeed = new Set(fails.map((f) => f.seed)); console.log('semillas con fallo:', bySeed.size);
process.exit(fails.length ? 1 : 0);
