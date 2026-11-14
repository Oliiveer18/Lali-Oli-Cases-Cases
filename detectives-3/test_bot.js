// Prueba del bot de recorrido (fase 2B-1): el bot resuelve el caso 1 andando y midiendo tiempo, y detecta casos que
// el validador deja pasar pero que en la práctica no se pueden jugar (p. ej. salas partidas por una pared).
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sandbox = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, parseInt, isFinite, Infinity, Proxy, setTimeout };
sandbox.globalThis = sandbox;
sandbox.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
vm.createContext(sandbox);
for (const f of process.argv.slice(2)) vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), sandbox, { filename: f });
const G = sandbox.G;
G.save = { data: { settings: {}, upgrades: {} } };
let bad = 0;
const clone = (o) => JSON.parse(JSON.stringify(o));
const base = G.CASES.tarta;
const play = (mut) => { const d = clone(base); if (mut) mut(d); return G.botPlay(d); };
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };

const r0 = play();
console.log('Caso 1:', JSON.stringify({ ok: r0.ok, bot: r0.minutes + ' min', humano: r0.humanMinutes + ' min', acciones: r0.actions, stats: r0.stats }));
r0.perChapter.forEach((c) => console.log(`  cap ${c.chapter} «${c.title}»: ${c.seconds}s, ${c.actions} acciones`));
ok('el bot resuelve el caso 1', r0.ok && r0.win && r0.reason === 'resuelto' && !r0.stuck, JSON.stringify(r0.stuck));
ok('consigue todas las pistas', r0.stats.clues === r0.stats.cluesTotal, JSON.stringify(r0.stats));
ok('el sospechoso más señalado al acusar es el culpable y tiene ≥ 3 pruebas', r0.stats.topSuspectIsCulprit === true && r0.stats.proofHeld >= 3);
ok('un capítulo registrado por cada capítulo del caso', r0.perChapter.length === base.chapters.length && r0.perChapter.every((c) => c.seconds > 0));
ok('el tiempo es razonable (3–25 min de bot) y se reparte en andar, leer y trabajar', r0.botSeconds >= 180 && r0.botSeconds <= 1500 && r0.stats.walkSeconds > 0 && r0.stats.readSeconds > 0 && r0.stats.workSeconds > 0, r0.botSeconds + 's');
ok('estimación humana mayor que la del bot', r0.humanSeconds > r0.botSeconds);
const r1 = play();
ok('es determinista (mismo caso → mismo resultado)', r1.botSeconds === r0.botSeconds && r1.actions === r0.actions && r1.log.join('|') === r0.log.join('|'));
ok('el bot no modifica el caso original', JSON.stringify(base) === JSON.stringify(G.CASES.tarta) && G.CASES.tarta.rooms.cocina.map.join('') === base.rooms.cocina.map.join(''));

const stuck = (name, mut, chapter) => { const r = play(mut); ok(`${name} → el bot se atasca (aunque el validador lo deje pasar)`, !r.ok && r.reason === 'atasco' && r.stuck && (!chapter || r.stuck.chapter === chapter) && G.validateCase((() => { const d = clone(base); mut(d); return d; })()).ok, JSON.stringify(r.stuck)); };
const wall = (rid, y) => (d) => { d.rooms[rid].map[y] = '#'.repeat(d.rooms[rid].map[y].length); };
stuck('la tienda partida por una pared', wall('tienda', 5), 1);
stuck('la cocina partida por una pared', wall('cocina', 3), 1);
stuck('el almacén partido por una pared', wall('almacen', 4), 2);

{
  const slow = play((d) => { d.rooms.tienda.props.forEach((p) => (p.steps || []).forEach((s) => { s.time = (s.time || 1) + 20; })); });
  ok('si los exámenes tardan más, el caso dura más', slow.ok && slow.botSeconds > r0.botSeconds + 60, slow.botSeconds + ' vs ' + r0.botSeconds);
}
{
  const r = play((d) => { d.title = ''; });
  ok('un caso que no pasa el validador se rechaza (reason invalido)', !r.ok && r.reason === 'invalido' && r.botSeconds === 0);
  const r2 = G.botPlay(null);
  ok('lo que no es un caso no revienta el bot', !r2.ok && !r2.finished);
}
process.exit(bad ? 1 : 0);
