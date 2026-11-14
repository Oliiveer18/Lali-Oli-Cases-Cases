// Prueba de la animación de objetos y ambiente (4C-3b-1): tabla G.ANIMS, mecanismo del mundo y que nada de lo anterior cambia.
// Comprueba: fotogramas y resplandores existentes, la sirena coincide con G.sirenFrame, parpadeos y ondas que de verdad cambian, desfase por objeto,
// tope de objetos animados por sala, dibujo de cientos de fotogramas sin errores con el mundo real, que decoración animada sale del lienzo estático,
// que el estado de la animación no se guarda ni se envía, la respiración de los personajes y que el caso 1 y el generador no cambian (hash 74937935).
// Uso: node test_anim.js  (el aspecto visual se revisa con tools/anim_sheet.js)
const fs = require('fs'), path = require('path');
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const IDS = Object.keys(G.ANIMS);

ok('hay 8 animaciones (coche, cinta h y v, charco, farola, mesa de interrogatorio, silla mecedora y ventana oscura)', IDS.length === 8 && ['police_car_0', 'police_tape_h', 'police_tape_v', 'decal_puddle', 'lamp_post_blink', 'interrogation_table', 'rocking_chair', 'window_dark'].every((k) => G.ANIMS[k]), IDS.join());
{ const miss = []; IDS.forEach((id) => { const a = G.ANIMS[id]; a.frames.forEach((f) => { if (!G.spr[f]) miss.push(f); }); if (a.glow) a.glow.sprites.forEach((f) => { if (!G.spr[f]) miss.push(f); }); if (!G.spr[id]) miss.push(id); });
  ok('todos los fotogramas, resplandores y ids de caso existen como sprite', miss.length === 0, miss.join()); }
ok('el id que usa el caso es el primer fotograma de su animación (o un id que ya existe)', IDS.every((id) => G.ANIMS[id].frames[0] === id || G.spr[id]));
ok('fps válidos, seq dentro de rango y un resplandor por fotograma', IDS.every((id) => { const a = G.ANIMS[id]; return a.fps > 0 && (!a.seq || a.seq.every((i) => i >= 0 && i < a.frames.length)) && (!a.glow || a.glow.sprites.length === a.frames.length); }));
{ const sizes = IDS.every((id) => { const a = G.ANIMS[id], w = G.spr[a.frames[0]].tw, h = G.spr[a.frames[0]].th; return a.frames.every((f) => G.spr[f].tw === w && G.spr[f].th === h); });
  ok('todos los fotogramas de una animación miden lo mismo (no saltan de tamaño)', sizes); }
{ const seen = {}; const d = []; (src('sprites_a.js') + src('sprites_b.js') + src('sprites_c.js') + src('ui.js')).replace(/\b(?:S|D|defSprite)\('([a-z0-9_]+)'/g, (m, id) => { if (seen[id]) d.push(id); seen[id] = 1; });
  const rt = G.sprDup.filter((id) => !/^(luna|rex)_(down|up|side)_[01]$/.test(id)); // Lali y Oli se redefinen a propósito (arte a medida)
  ok('los sprites nuevos no pisan ids existentes (ningún id definido dos veces, ni en el código ni al cargar)', d.length === 0 && rt.length === 0, d.concat(rt).join()); }

// sirena y fotogramas que cambian
{ let diff = 0; for (let t = 0; t < 60; t += 0.01) if (G.animFrame('police_car_0', t) !== G.sirenFrame(t)) diff++; ok(`la sirena animada coincide con G.sirenFrame (6000 instantes, ${diff} diferencias)`, diff === 0); }
ok('un id sin animación se devuelve tal cual (lamp_post del caso 1 no parpadea)', G.animFrame('lamp_post', 3.3) === 'lamp_post' && G.animState('lamp_post', 1) === null && G.animFrame('bowl', 2, 'x') === 'bowl');
IDS.forEach((id) => { const set = {}; for (let t = 0; t < 30; t += 0.05) set[G.animFrame(id, t, 'k1')] = 1; ok(`${id}: muestra ≥ 2 fotogramas distintos en 30 s (${Object.keys(set).length})`, Object.keys(set).length >= 2); });
{ let lit = 0, n = 0, dim = 0, run = 0, maxRun = 0; for (let t = 0; t < 240; t += 0.25) { n++; const f = G.animFrame('lamp_post_blink', t, 'f'); if (f === 'lamp_post_blink') { lit++; run = 0; } else { dim++; run++; maxRun = Math.max(maxRun, run); } }
  ok(`la farola está encendida ≥ 80 % del tiempo y parpadea de verdad (${Math.round(100 * lit / n)} % encendida, ${dim} muestras flojas, racha máx ${maxRun})`, lit / n >= 0.8 && dim >= 5 && maxRun <= 3); }
{ let diffA = 0; for (let t = 0; t < 60; t += 0.1) if (G.animFrame('lamp_post_blink', t, 'a') !== G.animFrame('lamp_post_blink', t, 'b')) diffA++; ok(`el desfase por objeto funciona: dos farolas no parpadean a la vez (${diffA} instantes distintos)`, diffA > 0);
  let diffS = 0; for (let t = 0; t < 60; t += 0.1) if (G.animFrame('police_car_0', t, 'a') !== G.animFrame('police_car_0', t, 'b')) diffS++; ok('dos coches de policía sincronizados (sin desfase)', diffS === 0); }
{ const s0 = G.animState('police_car_0', 0), s1 = G.animState('police_car_0', 0.4); ok('el resplandor de la sirena alterna rojo-azul y azul-rojo a la vez que el coche', s0.glow.sprite === 'police_glow_0' && s1.glow.sprite === 'police_glow_1' && s0.name === 'police_car_0' && s1.name === 'police_car_1'); }
ok('G.animState es determinista (mismo instante y objeto → mismo resultado)', JSON.stringify(G.animState('lamp_post_blink', 7.7, 'z')) === JSON.stringify(G.animState('lamp_post_blink', 7.7, 'z')));

// mundo real: tope por sala, estático sin animados, dibujo de cientos de fotogramas
const t1 = G.CASES.tarta;
const clone = (o) => JSON.parse(JSON.stringify(o));
const mkWorld = (def) => { const st = new G.CaseState(def, 'normal'); const w = new G.World(st, { mode: 'solo' }); st.chapter = 1; w.enterRoom(def.start.room); w.onChapter(); w.out.length = 0; return { st, w }; };
const makeDef = () => { const def = clone(t1), room = def.rooms[def.start.room];
  room.decals = (room.decals || []).concat([0, 1, 2, 3].map((i) => ({ sprite: 'decal_puddle', x: 2 + i, y: 3 })));
  room.decor = (room.decor || []).concat([{ sprite: 'lamp_post_blink', x: 1, y: 2 }, { sprite: 'police_tape_h', x: 3, y: 4 }, { sprite: 'police_tape_v', x: 5, y: 4 }, { sprite: 'police_tape_h', x: 7, y: 4 }, { sprite: 'police_tape_h', x: 8, y: 4 }]);
  return def; };
{ const { w } = mkWorld(makeDef());
  ok(`tope: como mucho ${G.ANIM_MAX_PER_ROOM} objetos animados por sala (9 pedidos → ${w.room.animCount})`, w.room.animCount === G.ANIM_MAX_PER_ROOM && w.room.animDecor.length === G.ANIM_MAX_PER_ROOM && w.room.animSkip.size === G.ANIM_MAX_PER_ROOM);
  const calls = []; const real = G.drawSpr; G.drawSpr = function (ctx, name, x, y, opt) { calls.push(name); return real.apply(this, arguments); };
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => ((t[k] = v), true) });
  w.vig = {}; // el lienzo simulado de Node no da degradados: se salta la viñeta (no tiene que ver con la animación)
  let err = null; const names = {};
  try { for (let i = 0; i < 600; i++) { w.update(1 / 60, true); calls.length = 0; w.draw(ctx, 1 / 60); calls.forEach((n) => { names[n] = (names[n] || 0) + 1; }); } } catch (e) { err = e; }
  G.drawSpr = real;
  ok('600 fotogramas de dibujo con el mundo real sin errores (10 s de juego)', !err, err && err.stack);
  ok('en pantalla salen varios fotogramas de la cinta, de la farola y de sus resplandores', names.police_tape_h && (names.police_tape_h_w1 || names.police_tape_h_w2) && names.lamp_post_blink && names.lamp_post_dim && names.lamp_glow_0, JSON.stringify(Object.keys(names).filter((n) => /tape|lamp/.test(n))));
}
{ const { w } = mkWorld(t1); ok('caso 1: ningún objeto animado en la sala de arranque', w.room.animCount === 0 && w.room.animDecor.length === 0); }
{ // la decoración animada no está en el lienzo estático: con el stub se comprueba por llamadas de dibujo al construirlo
  const calls = []; const real = G.drawSpr; G.drawSpr = function (ctx, name) { calls.push(name); return real.apply(this, arguments); };
  mkWorld(makeDef()); G.drawSpr = real;
  ok('lo animado no se pinta en el lienzo estático; lo que pasa del tope sí, quieto (3 charcos), igual que el resto de la decoración', !calls.includes('lamp_post_blink') && !calls.some((n) => /^police_tape/.test(n)) && calls.includes('wall_top') && calls.filter((n) => n === 'decal_puddle').length === 3, calls.filter((n) => /puddle|tape|lamp/.test(n)).join()); }

// no se guarda ni se envía
{ const files = ['net.js', 'core.js', 'logic.js', 'play.js', 'scenes.js'].map(src).join('\n'); ok('el estado de la animación no se guarda ni se envía (net, guardado y lógica no la mencionan)', !/animOn|animState|animFrame|animDecor|G\.ANIMS/.test(files)); }
{ const { st } = mkWorld(makeDef()); ok('el estado del caso (lo que se guarda y se comparte) no contiene nada de animación', !/anim|glow/i.test(JSON.stringify({ f: st.flags, p: st.progress, c: st.clues, m: st.moved }))); }

// respirar
{ const { w } = mkWorld(t1), a = w.players[0], b = w.players[1]; const seen = new Set(); let moveDiff = 0;
  for (let t = 0; t < 20; t += 0.05) { w.time = t; seen.add(w.breath(a)); }
  ok(`en reposo los personajes respiran: 1 px lógico, a ratos (valores ${[...seen].join('/')})`, seen.size === 2 && seen.has(0) && seen.has(G.S / 3));
  let diff = 0; for (let t = 0; t < 20; t += 0.05) { w.time = t; if (w.breath(a) !== w.breath(b)) diff++; } ok('Oli y Lali no respiran a la vez', diff > 0);
  const lines = [], real = G.drawSpr; G.drawSpr = function (ctx, name, x, y) { lines.push([name, y]); return real.apply(this, arguments); };
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => ((t[k] = v), true) });
  a.moving = false; w.time = 0.3; w.drawActor(ctx, a); const yRest = lines[lines.length - 1][1]; a.moving = true; a.anim = 0; w.drawActor(ctx, a); const yMove = lines[lines.length - 1][1]; G.drawSpr = real;
  ok('andando no respira: con el paso en fase 0 la altura es exactamente la de reposo sin respiración', yMove !== undefined && yMove === yRest + w.breath(a)); }

// nada de lo anterior cambia
ok('el caso 1 es idéntico byte a byte (hash 74937935)', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok);
ok('los sprites del caso 1 no están en la tabla de animaciones (sigue viéndose igual)', (() => { const used = []; JSON.stringify(G.CASES.tarta, (k, v) => { if (typeof v === 'string' && G.ANIMS[v]) used.push(v); return v; }); return used.length === 0; })());
{ const allowed = ['police_car_0', 'interrogation_table', 'rocking_chair', 'window_dark'], seen = new Set(); let outside = 0;
  for (let s = 0; s < 300; s++) { const r = G.generateCase(s); if (r.def) JSON.stringify(r.def, (k, v) => { if (typeof v === 'string' && (G.ANIMS[v] || /_blink$|_dim$|_lit$|_w\d$|_g\d$|police_glow|lamp_glow/.test(v))) { seen.add(v); if (allowed.indexOf(v) < 0) outside++; } return v; }); }
  const gen = ['gen_data.js', 'gen_themes.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'].map(src).join('\n');
  ok('el generador usa solo cuatro animados: coche patrulla y mesa de interrogatorio (escena del aliado, 4C-3b-2) y silla mecedora y ventana oscura (ambiente, 4C-4b); ni cinta, ni farola, ni charco de agua todavía', seen.size === 4 && outside === 0 && !/lamp_post_blink|police_tape|decal_puddle/.test(gen), `vistos ${[...seen].join()} fuera ${outside}`); }
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
