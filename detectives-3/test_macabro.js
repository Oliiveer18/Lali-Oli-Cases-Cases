// Prueba de la ATMÓSFERA III, parte 2 (4C-4c-2): SITUACIONES MACABRAS del escenario (objetos `sit_*`) y GIRO DEL TESTIGO (tema `f_giro`).
// Comprueba: bancos completos (cada situación y cada giro es un PAR [susto, remate], sprites existentes, genéricos); claro NUNCA lleva ni una ni otro; inquietante 0-1 situaciones y solo las `soft`;
// macabro 1-2 situaciones y el giro solo en macabro (≈ 70 %), nunca en el cliente y como mucho uno por caso; cada texto sale TAL CUAL del banco (susto + remate);
// los objetos están dentro del mapa, en suelo libre, sin tapar objetos, puertas ni personajes y SIN CORTAR la sala; no llevan pista, bandera, herramienta ni vigilante (no cambian ningún hecho);
// determinismo; el bot sigue ganando; GEN_VERSION y caso 1 no se tocan (hash 74937935). Uso: node test_macabro.js [semillas]
const fs = require('fs'), path = require('path');
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'review.js', 'bot.js']);
const N = +process.argv[2] || (+process.env.SEEDS ? Math.min(1500, +process.env.SEEDS) : 1500);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const MX = G.GEN_DATA.compile.macabro, SIT = MX.sit, GIR = MX.giro;
const joined = (it) => it.text[0] + ' ' + it.text[1];
const pairText = (p) => p[0] + ' ' + p[1];

// ---- 1) bancos
ok('bancos: ≥ 8 situaciones (≥ 4 `soft` para inquietante), cada una con sprite existente, etiqueta y un par [susto, remate] completo', SIT.items.length >= 8 && SIT.items.filter((q) => q.soft).length >= 4 && SIT.items.every((q) => G.spr[q.sprite] && q.label && Array.isArray(q.text) && q.text.length === 2 && q.text.every((t) => t.trim().length >= 20 && /[.!?»]$/.test(t))));
ok('bancos: etiquetas distintas entre sí y frases todas distintas', new Set(SIT.items.map((q) => q.label)).size === SIT.items.length && new Set(SIT.items.map(joined)).size === SIT.items.length);
ok('bancos: ≥ 8 giros del testigo, cada uno con susto y remate, sin repetir', GIR.pairs.length >= 8 && GIR.pairs.every((p) => p.length === 2 && p.every((t) => t.trim().length >= 20 && /[.!?»]$/.test(t))) && new Set(GIR.pairs.map(pairText)).size === GIR.pairs.length && GIR.label);
ok('bancos: probabilidades válidas (primera situación inquietante entre 0,2 y 0,7; macabro seguro; segunda entre 0,2 y 0,8; giro entre 0,4 y 0,9)', SIT.chance.inquietante >= 0.2 && SIT.chance.inquietante <= 0.7 && SIT.chance.macabro === 1 && SIT.second >= 0.2 && SIT.second <= 0.8 && GIR.chance >= 0.4 && GIR.chance <= 0.9);
// genéricos: ni nombres de personajes ni lugares del caso (los textos se reutilizan en todos los casos)
{ const txt = SIT.items.map(joined).concat(GIR.pairs.map(pairText)).join(' ');
  ok('bancos: textos sin llaves de variables ({…}) ni marcas de plantilla', !/[{}]/.test(txt)); }

// ---- 2) casos en los tres ambientes
const bfs = (rm, extraSolid) => { // casillas alcanzables desde los accesos de las puertas, con los objetos sólidos (más `extraSolid` opcional)
  const W = rm.map[0].length, H = rm.map.length, solid = {}, seen = {}, q = [];
  rm.props.forEach((p) => { if (p.solid && p !== extraSolid) for (let yy = 0; yy < (p.h || 1); yy++) for (let xx = 0; xx < (p.w || 1); xx++) solid[(p.x + xx) + ',' + (p.y + yy)] = 1; });
  rm.doors.forEach((d) => { const i = G.doorInside(d); const k = i.x + ',' + i.y; seen[k] = 1; q.push([i.x, i.y]); });
  while (q.length) { const a = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => { const nx = a[0] + d[0], ny = a[1] + d[1], k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= W || ny >= H || rm.map[ny][nx] === '#' || seen[k] || solid[k]) return; seen[k] = 1; q.push([nx, ny]); }); }
  return seen;
};
const S = { claro: { n: 0, sit: 0, giro: 0 }, inquietante: { n: 0, sit: 0, giro: 0, c0: 0, c1: 0 }, macabro: { n: 0, sit: 0, giro: 0, c0: 0, c1: 0, c2: 0 } };
const P = { notSoft: 0, over: 0, text: 0, outside: 0, overlap: 0, door: 0, npc: 0, cut: 0, unreach: 0, hasClue: 0, gTopic: 0, gClient: 0, gMany: 0, gText: 0, nomap: 0, noRoom: 0 };
const softSprites = new Set(SIT.items.filter((q) => q.soft).map((q) => q.label));
const itemByLabel = {}; SIT.items.forEach((q) => { itemByLabel[q.label] = q; });
for (let s = 0; s < N; s++) {
  G.MOODS.forEach((m) => {
    const r = G.generateCase(s, { mood: m }); if (!r.def) { P.nomap++; return; }
    const d = r.def, T = S[m]; T.n++;
    const sits = []; Object.keys(d.rooms).forEach((rid) => d.rooms[rid].props.forEach((p) => { if (String(p.id).indexOf('sit_') === 0) sits.push({ rid, p }); }));
    T.sit += sits.length; if (m !== 'claro') T['c' + sits.length] = (T['c' + sits.length] || 0) + 1;
    if (m === 'inquietante' && sits.length > 1) P.over++;
    if (m === 'macabro' && sits.length > 2) P.over++;
    if (new Set(sits.map((o) => o.p.id)).size !== sits.length) P.over++;
    sits.forEach(({ rid, p }) => {
      const rm = d.rooms[rid], it = itemByLabel[p.label];
      if (!it || p.sprite !== it.sprite || !p.steps || p.steps.length !== 1 || p.steps[0].text !== joined(it)) P.text++; // el texto es el par del banco, sin tocar
      if (it && m === 'inquietante' && !it.soft) P.notSoft++;
      if (p.x < 1 || p.y < 1 || p.x >= rm.map[0].length - 1 || p.y >= rm.map.length - 1 || rm.map[p.y][p.x] === '#') P.outside++;
      if (rm.props.some((o) => o !== p && o.x === p.x && o.y === p.y)) P.overlap++;
      if (rm.doors.some((dr) => { const i = G.doorInside(dr); return (i.x === p.x && i.y === p.y) || (dr.x === p.x && dr.y === p.y); })) P.door++;
      if (Object.keys(d.placement).some((k) => d.placement[k].some((q) => q.room === rid && q.x === p.x && q.y === p.y))) P.npc++;
      if (p.steps[0].clue || p.steps[0].fx || p.steps[0].tool || p.watcher || p.visible || p.listen) P.hasClue++; // objeto sin pista ni efectos: no cambia ningún hecho
      const with_ = bfs(rm), without = bfs(rm, p);
      if (Object.keys(without).some((k) => !with_[k] && k !== p.x + ',' + p.y)) P.cut++; // el objeto corta la sala
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some((dd) => with_[(p.x + dd[0]) + ',' + (p.y + dd[1])])) P.unreach++; // no se puede llegar a examinarlo
    });
    // giro del testigo
    const gir = []; Object.keys(d.npcs).forEach((k) => { const t = (d.npcs[k].topics || []).find((x) => x.id === 'f_giro'); if (t) gir.push({ k, t }); });
    T.giro += gir.length;
    if (gir.length > 1) P.gMany++;
    const client = r.bible.cast.find((c) => c.role === 'cliente');
    gir.forEach(({ k, t }) => {
      if (m !== 'macabro') P.gTopic++;
      if (client && k === client.id) P.gClient++;
      if (d.npcs[k].cat || k === 'aliado') P.gClient++;
      if (t.label !== GIR.label || !t.responses || t.responses.length !== 1 || !GIR.pairs.some((p) => t.responses[0][0] === pairText(p))) P.gText++;
    });
  });
}
ok(`${S.claro.n + S.inquietante.n + S.macabro.n} casos (${N} semillas × 3 ambientes) generados sin fallos`, P.nomap === 0, `${P.nomap} sin caso`);
ok('claro: NUNCA lleva situaciones ni giro', S.claro.sit === 0 && S.claro.giro === 0, JSON.stringify(S.claro));
ok(`inquietante: 0 o 1 situación (solo las \`soft\`) y nunca giro; con 1 en el ${(100 * S.inquietante.c1 / S.inquietante.n).toFixed(0)} % de los casos (meta 30-60 %)`, P.over === 0 && P.notSoft === 0 && S.inquietante.giro === 0 && S.inquietante.c1 / S.inquietante.n >= 0.3 && S.inquietante.c1 / S.inquietante.n <= 0.6, JSON.stringify(S.inquietante) + JSON.stringify(P));
ok(`macabro: 1 o 2 situaciones (sin ninguna en ${(100 * S.macabro.c0 / S.macabro.n).toFixed(1)} % de los casos; con 2 en el ${(100 * S.macabro.c2 / S.macabro.n).toFixed(0)} %)`, S.macabro.c0 / S.macabro.n <= 0.05 && S.macabro.c2 / S.macabro.n >= 0.3 && S.macabro.c2 / S.macabro.n <= 0.7, JSON.stringify(S.macabro));
ok(`giro: solo en macabro, en el ${(100 * S.macabro.giro / S.macabro.n).toFixed(0)} % de esos casos (meta 55-85 %), como mucho uno por caso, nunca en el cliente, el aliado ni un gato, y con el par del banco`, P.gTopic === 0 && P.gMany === 0 && P.gClient === 0 && P.gText === 0 && S.macabro.giro / S.macabro.n >= 0.55 && S.macabro.giro / S.macabro.n <= 0.85, JSON.stringify(P));
ok('cada situación sale TAL CUAL del banco: susto + remate en un solo paso, sin pista, bandera, herramienta ni vigilante', P.text === 0 && P.hasClue === 0, JSON.stringify(P));
ok('las situaciones están dentro del mapa, en suelo libre, sin tapar objetos, puertas ni personajes', P.outside === 0 && P.overlap === 0 && P.door === 0 && P.npc === 0, JSON.stringify(P));
ok('las situaciones no cortan ninguna sala y se puede llegar a examinarlas', P.cut === 0 && P.unreach === 0, JSON.stringify(P));

// ---- 2b) con el A* REAL del bot y del compañero IA (G.findPath, con los personajes de pie como obstáculos): se llega a toda persona y a todo objeto examinable (la regresión de la semilla 21)
{ let paths = 0, fails = 0, firstFail = null;
  for (let s = 0; s < 150; s++) G.MOODS.forEach((m) => {
    const d = G.generateCase(s, { mood: m }).def; if (!d) return;
    const st = new G.CaseState(d, 'normal'), w = new G.World(st, { mode: 'solo' });
    Object.keys(d.rooms).forEach((rid) => {
      w.enterRoom(rid, null); const rm = d.rooms[rid], di = rm.doors.length ? G.doorInside(rm.doors[0]) : { x: 6, y: 7 };
      const target = (x, y, what) => { paths++; if (!G.findPath(w, di.x, di.y, x, y)) { fails++; if (!firstFail) firstFail = `${s}/${m}/${rid}: ${what} en (${x},${y})`; } };
      w.npcsHere().forEach((n) => { if (!n.cat) target(Math.floor(n.x / G.TS), Math.floor((n.y - 1) / G.TS), 'personaje ' + n.id); });
      rm.props.forEach((p) => { if (p.steps && (!p.visible)) target(p.x, p.y, 'objeto ' + p.id); });
    });
  });
  ok(`con el A* real se llega a todo personaje y a todo objeto examinable (${paths} caminos en 150 semillas × 3 ambientes)`, fails === 0 && paths > 3000, `${fails} fallos; el primero: ${firstFail}`); }

// ---- 3) determinismo, hechos y bot
{ let det = 0, facts = 0;
  for (let s = 0; s < 60; s++) G.MOODS.forEach((m) => { const a = G.generateCase(s, { mood: m }), b = G.generateCase(s, { mood: m }); if (JSON.stringify(a.def) !== JSON.stringify(b.def)) det++; });
  ok('determinismo: la misma semilla y ambiente dan el mismo caso (60 semillas × 3)', det === 0, String(det));
  // las situaciones no mueven ningún hecho: en macabro, las pistas, mentiras, sospechosos y solución son los de claro
  for (let s = 0; s < 150; s++) { const c = G.generateCase(s, { mood: 'claro' }).def, m = G.generateCase(s, { mood: 'macabro' }).def; if (!c || !m) continue;
    const f = (d) => JSON.stringify([d.solution, Object.keys(d.clues).sort(), d.lies, d.suspects, d.placement && Object.keys(d.placement).sort(), d.chapters]);
    if (f(c) !== f(m)) facts++; }
  ok('los hechos (solución, pistas, mentiras, sospechosos, capítulos) son idénticos en claro y macabro (150 semillas)', facts === 0, String(facts));
  let win = 0, n = 0, unacc = 0;
  for (let s = 0; s < 40; s++) { const d = G.generateCase(s, { mood: 'macabro' }).def; if (!d) continue; ['easy', 'normal', 'hard'].forEach((df) => { const r = G.botPlay(d, { difficulty: df }); n++; if (r.win) win++; }); if (!G.validateCase(d).ok || !G.reviewCase(d).ok) unacc++; }
  ok(`el bot gana ${win}/${n} partidas en casos macabros (Fácil, Normal y Difícil) y todos validan y pasan el revisor`, win === n && n >= 100 && unacc === 0, `${win}/${n} · ${unacc}`); }

// ---- 4) lo que no se toca
ok('GEN_VERSION es 6 (la biblia, genTruth y genClues no cambian) y el caso 1 es idéntico (hash 74937935)', G.GEN_VERSION === 6 && hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.CASES.tarta.mood === undefined);
{ const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
  ok('genClues y genTruth no mencionan las situaciones ni el giro (esto vive solo en el compilador y los datos)', !/macabro\.(sit|giro)|sit_|f_giro/.test(src('gen_clues.js') + src('gen_truth.js') + src('bible.js'))); }
console.log(bad ? `✗ ${bad} fallos` : '✓ situaciones macabras y giro: todo en orden');
process.exit(bad ? 1 : 0);
