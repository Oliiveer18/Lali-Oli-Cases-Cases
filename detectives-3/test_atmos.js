// Prueba de la ATMÓSFERA II (4C-4b): la capa visual y sonora del ambiente `def.mood` y sus objetos de ambiente. Solo cambia lo que se ve y se oye: no toca hechos, pistas ni red.
// Comprueba: G.moodFx es nulo en claro, sin `mood` y en el caso 1, y da los ajustes de inquietante / macabro (niebla en la calle, polvo en los interiores);
// un caso claro no lleva nada inquietante (silla, ventana oscura, mancha); todo caso macabro lleva mancha y se reparten silla y sombra; los objetos están dentro del mapa,
// en suelo libre, sin tapar ningún camino, objeto o puerta; tope de animados por sala; silla y ventana solo en interiores; determinismo; sonido `creak`; el estado de
// la atmósfera no se guarda ni se envía; el caso 1 no cambia (hash 74937935) y GEN_VERSION no se toca. Uso: node test_atmos.js [semillas]
const fs = require('fs'), path = require('path');
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const N = +process.argv[2] || (+process.env.SEEDS ? Math.min(600, +process.env.SEEDS) : 600);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const AT = G.GEN_DATA.compile.atmos;
const CHAIR = AT.chair, WIN = AT.window, STAIN = AT.stain, PUD = AT.puddles;

// ---- 1) G.moodFx
const base = G.generateCase(3).def;
ok('moodFx es nulo en el caso 1 (sin `mood`)', G.moodFx(G.CASES.tarta, 'tienda') === null);
ok('moodFx es nulo con def sin `mood` y con mood claro', G.moodFx({}, 'x') === null && G.moodFx({ mood: 'claro' }, 'x') === null && G.moodFx(null, 'x') === null);
ok('el caso 1 sigue idéntico byte a byte (hash 74937935) y válido', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok);
{
  const tpls = [];
  for (let s = 1; s <= 60 && tpls.length < 2; s++) { const d = G.generateCase(s).def; if (d) Object.values(d.rooms).forEach((r) => { if (r.template) tpls.push(r.template); }); }
  const all = Array.from(new Set(tpls));
  const calle = all.filter((t) => G.roomScene(t) === 'calle')[0] || (() => { for (let s = 1; s < 400; s++) { const d = G.generateCase(s).def; for (const r of Object.values(d.rooms)) if (r.template && G.roomScene(r.template) === 'calle') return r.template; } })();
  const inter = all.filter((t) => G.roomScene(t) !== 'calle')[0];
  const I = G.moodFx({ mood: 'inquietante' }, inter), M = G.moodFx({ mood: 'macabro' }, inter), Ic = G.moodFx({ mood: 'inquietante' }, calle), Mc = G.moodFx({ mood: 'macabro' }, calle);
  ok('inquietante y macabro dan ajustes (el macabro es más oscuro, más inquieto y más ruidoso)', I && M && M.dark > I.dark && M.hum > I.hum && M.creak < I.creak && M.vig >= I.vig && M.flicker >= I.flicker, JSON.stringify([I, M]));
  ok('niebla en la calle y polvo en los interiores (y la niebla de la calle es más fina que el polvo)', Ic.fog === 'niebla' && Mc.fog === 'niebla' && I.fog === 'polvo' && M.fog === 'polvo' && Ic.fogA < I.fogA && Mc.fogA < M.fogA, JSON.stringify([Ic, I]));
  ok('valores en rango (oscuridad 0..0,5, volumen 0..1, crujido entre 10 y 120 s, opacidad de niebla 0..1)', [I, M, Ic, Mc].every((x) => x.dark > 0 && x.dark <= 0.5 && x.hum >= 0 && x.hum <= 1 && x.creak >= 10 && x.creak <= 120 && x.fogA > 0 && x.fogA <= 1 && x.dipEvery > 0));
}

// ---- 2) objetos de ambiente en N casos
const stats = { claro: { n: 0, bad: 0, jam: 0, sauce: 0 }, inquietante: { n: 0, chair: 0, win: 0, pud: 0, stain: 0 }, macabro: { n: 0, chair: 0, win: 0, pud: 0, stain: 0 } };
const probs = [], count = (arr, sp) => arr.filter((q) => q.sprite === sp).length;
const reach = (room, drop) => { // casillas alcanzables desde el punto de salida (6,7) sin atravesar paredes ni objetos sólidos (opcionalmente sin contar `drop`)
  const h = room.map.length, w = room.map[0].length, g = [];
  for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(room.map[y][x] === '#'); }
  room.props.forEach((q) => { if (q.solid && q !== drop) for (let yy = 0; yy < (q.h || 1); yy++) for (let xx = 0; xx < (q.w || 1); xx++) if (g[q.y + yy] && g[q.y + yy][q.x + xx] !== undefined) g[q.y + yy][q.x + xx] = true; });
  const seen = new Set([7 * w + 6]), st = [[6, 7]];
  while (st.length) { const [x, y] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || g[ny][nx] || seen.has(ny * w + nx)) return; seen.add(ny * w + nx); st.push([nx, ny]); }); }
  return { seen, w };
};
const touches = (R, x, y, ww, hh) => { for (let yy = y - 1; yy <= y + hh; yy++) for (let xx = x - 1; xx <= x + ww; xx++) { if (xx >= x && xx < x + ww && yy >= y && yy < y + hh) continue; if (R.seen.has(yy * R.w + xx)) return true; } return false; };
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s); if (!r.def) { probs.push('sin caso ' + s); continue; }
  const d = r.def, m = d.mood, S = stats[m]; S.n++;
  let chairs = 0, wins = 0, puds = 0, stains = 0, jam = 0, sauce = 0;
  Object.keys(d.rooms).forEach((id) => {
    const room = d.rooms[id], w = room.map[0].length, h = room.map.length, calle = room.template && G.roomScene(room.template) === 'calle';
    const decals = room.decals || [], decor = room.decor || [];
    const c = room.props.filter((q) => q.sprite === CHAIR), wn = decor.filter((q) => q.sprite === WIN), st = decals.filter((q) => q.sprite === STAIN);
    chairs += c.length; wins += wn.length; stains += st.length; jam += count(decals, PUD[0]); sauce += count(decals, PUD[1]); puds = jam + sauce;
    if (calle && (c.length || wn.length)) probs.push(`${s}/${id}: silla o ventana oscura en la calle`);
    // sobre el mapa, en suelo y sin pisar nada sólido
    c.forEach((q) => {
      if (q.x < 1 || q.y < 1 || q.x >= w - 1 || q.y >= h - 1 || room.map[q.y][q.x] === '#') probs.push(`${s}/${id}: silla fuera del suelo (${q.x},${q.y})`);
      if (q.steps && q.steps.length) probs.push(`${s}/${id}: la silla tiene pasos (debe ser solo ambiente)`);
      if (!q.solid) probs.push(`${s}/${id}: la silla debería ser sólida`);
      if (room.props.some((o) => o !== q && o.x === q.x && o.y === q.y)) probs.push(`${s}/${id}: silla encima de otro objeto`);
      if ((q.x === 6 || q.x === 7) && q.y === 7) probs.push(`${s}/${id}: silla en el punto de salida`);
      // no corta ningún camino: todo lo que se alcanzaba sin la silla se sigue alcanzando con ella
      const A = reach(room, q), B = reach(room);
      if (B.seen.size !== A.seen.size - (A.seen.has(q.y * A.w + q.x) ? 1 : 0)) probs.push(`${s}/${id}: la silla aísla una zona de la sala`);
      room.props.forEach((o) => { if (o !== q && o.steps && o.steps.length && touches(A, o.x, o.y, o.w || 1, o.h || 1) && !touches(B, o.x, o.y, o.w || 1, o.h || 1)) probs.push(`${s}/${id}: la silla tapa el acceso a ${o.id || o.sprite}`); });
      room.doors.forEach((dr) => { if (A.seen.has(A.w + dr.x) && !B.seen.has(B.w + dr.x)) probs.push(`${s}/${id}: la silla tapa la puerta ${dr.id}`); });
    });
    wn.forEach((q) => { if (q.y !== 0 || q.x < 0 || q.x >= w) probs.push(`${s}/${id}: ventana oscura fuera de la pared norte (${q.x},${q.y})`); });
    decals.forEach((q) => { if ((q.sprite === STAIN || PUD.indexOf(q.sprite) >= 0) && (q.x < 1 || q.y < 1 || q.x >= w - 1 || q.y >= h - 1 || room.map[q.y][q.x] === '#' || room.props.some((o) => o.solid && q.x >= o.x && q.x < o.x + (o.w || 1) && q.y >= o.y && q.y < o.y + (o.h || 1)))) probs.push(`${s}/${id}: mancha o charco fuera del suelo libre (${q.x},${q.y})`); });
    // tope de animados por sala
    const anim = room.props.filter((q) => G.ANIMS[q.sprite]).length + decor.concat(decals).filter((q) => G.ANIMS[q.sprite]).length;
    if (anim > G.ANIM_MAX_PER_ROOM) probs.push(`${s}/${id}: ${anim} animados (tope ${G.ANIM_MAX_PER_ROOM})`);
  });
  if (m === 'claro') { if (chairs || wins || stains) { S.bad++; probs.push(`${s}: caso claro con objetos inquietantes`); } if (jam) S.jam++; if (sauce) S.sauce++; if (jam + sauce > 2) probs.push(`${s}: más de 2 charcos en un caso claro`); }
  else { if (chairs) S.chair++; if (wins) S.win++; if (puds) S.pud++; if (stains) S.stain++; if (chairs > 1 || wins > 1) probs.push(`${s}: más de una silla o una ventana oscura`); if (stains > 2) probs.push(`${s}: más de 2 manchas`); }
  if (m === 'macabro' && (!stains || puds)) probs.push(`${s}: macabro sin mancha o con charco de comida`);
  if (m === 'inquietante' && stains) probs.push(`${s}: inquietante con mancha oscura (es del macabro)`);
}
ok(`${N} semillas generadas, ninguna con problemas de ambiente (${probs.length})`, probs.length === 0, probs.slice(0, 5).join(' | '));
const pc = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const C = stats.claro, I = stats.inquietante, Ma = stats.macabro;
ok(`hay casos de los tres ambientes (claro ${C.n}, inquietante ${I.n}, macabro ${Ma.n})`, C.n > 0 && I.n > 0 && Ma.n > 0);
ok('claro: nada inquietante, y como mucho charcos de mermelada o salsa', C.bad === 0 && (C.jam + C.sauce) > 0);
ok(`macabro: mancha en el 100 % (${pc(Ma.stain, Ma.n)} %), silla y sombra casi siempre (${pc(Ma.chair, Ma.n)} % / ${pc(Ma.win, Ma.n)} %), ningún charco de comida`, Ma.stain === Ma.n && Ma.pud === 0 && pc(Ma.chair, Ma.n) >= 55 && pc(Ma.win, Ma.n) >= 55);
ok(`inquietante: silla y sombra a veces (${pc(I.chair, I.n)} % / ${pc(I.win, I.n)} %), charcos de comida (${pc(I.pud, I.n)} %), sin manchas`, I.stain === 0 && pc(I.chair, I.n) >= 30 && pc(I.chair, I.n) <= 85 && pc(I.win, I.n) >= 30 && pc(I.win, I.n) <= 85 && I.pud > 0);
ok('el macabro lleva más silla y sombra que el inquietante', pc(Ma.chair, Ma.n) > pc(I.chair, I.n) && pc(Ma.win, Ma.n) > pc(I.win, I.n));

// ---- 3) determinismo, sonido y que nada de esto viaja ni se guarda
{ let same = 0; for (let s = 0; s < 40; s++) if (JSON.stringify(G.generateCase(s * 17).def) === JSON.stringify(G.generateCase(s * 17).def)) same++; ok('determinismo: la misma semilla da el mismo caso con los mismos objetos de ambiente (40/40)', same === 40, same + '/40'); }
ok('docs/BASELINE.json está recalculado con el GEN_VERSION actual (si falla: node tools/baseline.js --write)', G.GEN_VERSION === JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'BASELINE.json'), 'utf8')).genVersion);
ok('el efecto `creak` existe en el juego y en el formato de caso', G.SFX_NAMES.indexOf('creak') >= 0 && /'creak'/.test(src('schema.js')));
ok('el motor tiene el zumbido continuo (G.audio.ambience y humStep)', typeof G.audio.ambience === 'function' && /humStep\s*\(/.test(src('core.js')));
{ const files = ['net.js', 'core.js', 'logic.js', 'scenes.js'].map(src).join('\n'); ok('la atmósfera no se guarda ni se envía (net, guardado y lógica no mencionan moodFx, niebla ni polvo)', !/moodFx|drawFog|drawMood|fogA|dipEvery/.test(files)); }
ok('la atmósfera solo la lee el mundo al dibujar y sonar (world.js y play.js)', /G\.moodFx/.test(src('world.js')) && /ambience/.test(src('play.js')));
{ const used = []; JSON.stringify(G.CASES.tarta, (k, v) => { if (v === CHAIR || v === WIN || v === STAIN || v === PUD[0] || v === PUD[1]) used.push(v); return v; }); ok('el caso 1 no usa ningún objeto de ambiente', used.length === 0); }
ok('la silla y la ventana están en la tabla de animaciones', !!G.ANIMS[CHAIR] && !!G.ANIMS[WIN]);
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
