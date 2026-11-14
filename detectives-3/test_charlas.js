// Prueba de la CHARLA GRABADA en los casos GENERADOS (A4 HERR-1 3/4-b1, v0.7.55). Uso: node test_charlas.js [semillas=250] [semillasBot=24]
// Demuestra, con casos que de verdad salen de `generateCase` (los que llevan el objeto `rec_charla`):
//  (1) la charla sale en ~40 % de los casos y todos validan; los dos charlan de verdad (no gatos, ni aliado, ni vigilantes), sin pista y sin tocar la historia;
//  (2) capítulo 1: a y b en su sitio de siempre; capítulo 2: en el rincón (a y b juntos, mirándose); capítulo 3: VUELVEN a su sitio original;
//  (3) capítulo 2 con el A* REAL (`G.findPath`, con los personajes como obstáculos): desde el inicio y desde cada puerta se llega a a, a b, a la zona y al hueco del detective;
//  (4) la zona y el hueco del detective están LIBRES (ni pared, ni objeto, ni decorado, ni otro personaje) y nada más cae sobre a ni b;
//  (5) mundo real: Lali se pone en el hueco, graba y salen las frases, en orden y en boca de a y de b; el paso queda hecho;
//  (6) el BOT gana el caso con charla (la charla es opcional: no puede atascarlo) y llega al capítulo 3 con a y b de vuelta;
//  (7) MUTACIONES: roturas del generador y del motor que esta prueba DEBE detectar.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 250, NB = +process.argv[3] || 24;

function suite(G, opt) {
  opt = opt || {};
  const fails = []; let checks = 0;
  const ok = (c, m) => { checks++; if (!c) fails.push(m); };
  const TS = G.TS;
  G.save.data.upgrades = {};
  const seedOf = (i) => i * 7919 + 1;
  let n = 0, withChat = 0, withClue = 0, errors = 0, botDone = 0, paths = 0;
  const bad = () => ''; // (el detalle de cada fallo ya va en el mensaje)
  const tileOfNpc = (nn) => [Math.floor(nn.x / TS), Math.floor((nn.y - 1) / TS)];

  for (let i = 0; i < N; i++) {
    const seed = seedOf(i), r = G.generateCase(seed);
    n++;
    if (r.error) { errors++; continue; }
    const d = r.def;
    let rid = null, pr = null;
    Object.keys(d.rooms).forEach((k) => { const p = d.rooms[k].props.find((q) => q.listen && q.chat); if (p) { rid = k; pr = p; } });
    if (!pr) continue;
    withChat++;
    const tag = `semilla ${seed}`;
    const A = pr.chat.a, B = pr.chat.b;
    const T = G.GEN_DATA.rooms; // plantilla de la sala: su rincón
    const tpl = [].concat.apply([], Object.values(T).map((l) => [].concat(l))).find((t) => t.id === d.rooms[rid].template);
    const L = tpl && tpl.listen;
    ok(!!L, `${tag}: la sala de la charla tiene rincón (listen)`);
    if (!L) continue;

    // ---- (1) formato y casting
    const v = G.validateCase(d);
    ok(v.ok && v.errors.length === 0, `${tag}: el caso con charla valida ` + JSON.stringify(v.errors) + bad('val', tag));
    const watchers = []; Object.values(d.rooms).forEach((rm) => rm.props.forEach((p) => { if (p.watcher) watchers.push(p.watcher); }));
    ok(A !== B && d.npcs[A] && d.npcs[B] && !d.npcs[A].cat && !d.npcs[B].cat && A !== 'aliado' && B !== 'aliado', `${tag}: a y b son dos sospechosos distintos (no gatos, no el aliado)` + bad('cast', tag));
    ok(watchers.indexOf(A) < 0 && watchers.indexOf(B) < 0, `${tag}: ni a ni b son vigilantes del sigilo` + bad('watch', tag + ' ' + A + '/' + B + ' vigilantes ' + watchers.join(',')));
    const stClue = pr.steps[0].clue, bc = stClue && r.bible.clues.find((c) => c.id === stClue);
    if (G.GEN_VERSION >= 6 && stClue) { ok(!!bc && bc.kind === 'grabación' && bc.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(bc.role) >= 0 && pr.id === 'obj_' + stClue, `${tag}: charla CON PISTA (b2): la pista es una grabación de sostén de la biblia y el objeto es obj_<pista>` + bad('pista', tag)); withClue++; }
    ok(!pr.steps.some((s) => s.fx || s.requires) && (G.GEN_VERSION >= 6 || !stClue) && pr.listen === true && pr.chapterMin === 2 && pr.chat.lines.length >= 2 && pr.steps.length === 1 && pr.steps[0].tool === 'grabadora', `${tag}: la charla es opcional (sin pista, sin bandera, chapterMin 2, un paso de grabadora)` + bad('opt', tag));
    ok(pr.chat.lines.some((l) => l.who === A) && pr.chat.lines.some((l) => l.who === B) && pr.chat.lines.every((l) => l.who === A || l.who === B), `${tag}: los dos hablan y solo ellos` + bad('who', tag));
    ok(pr.steps[0].time >= G.listenMinSeconds(pr.chat) - 1e-9, `${tag}: se graba el tiempo que piden las frases` + bad('time', tag));

    // ---- (2) colocación por capítulos (lo que ve el motor)
    const mkState = (ch) => { const st = new G.CaseState(d, 'normal'); st.chapter = ch; return st; };
    const orig = {}; [A, B].forEach((id) => { orig[id] = mkState(1).placementOf(id); });
    [[A, L.a], [B, L.b]].forEach(([id, sp]) => {
      const p1 = mkState(1).placementOf(id), p2 = mkState(2).placementOf(id), p3 = mkState(3).placementOf(id);
      ok(p1 && p2 && p3, `${tag}: ${id} tiene sitio en los 3 capítulos` + bad('pl', tag));
      if (!(p1 && p2 && p3)) return;
      ok(p2.room === rid && p2.x === sp.x && p2.y === sp.y && p2.face === sp.face, `${tag}: capítulo 2 → ${id} está en el rincón de charla` + bad('ch2', `${tag} ${id} ${JSON.stringify(p2)} esperado ${JSON.stringify(sp)}`));
      ok(p3.room === p1.room && p3.x === p1.x && p3.y === p1.y, `${tag}: capítulo 3 → ${id} VUELVE a su sitio original` + bad('ch3', `${tag} ${id} cap1 ${p1.room}:${p1.x},${p1.y} cap3 ${p3.room}:${p3.x},${p3.y}`));
      ok(!(p1.room === rid && p1.x === sp.x && p1.y === sp.y), `${tag}: el sitio original de ${id} no es ya el rincón (si no, no se vería el cambio)` + bad('ch1', tag));
    });
    const pa2 = mkState(2).placementOf(A), pb2 = mkState(2).placementOf(B);
    ok(pa2 && pb2 && pa2.room === pb2.room && Math.abs(pa2.x - pb2.x) === 1 && pa2.y === pb2.y && pa2.face === 'right' && pb2.face === 'left', `${tag}: en el capítulo 2 a y b están juntos y mirándose` + bad('juntos', tag));

    // ---- (4) zona y hueco libres en el capítulo 2
    const mkWorld = (ch) => { const st = mkState(ch), w = new G.World(st, { mode: 'solo' }); w.enterRoom(rid, null); w.onChapter(); w.out.length = 0; return { st, w }; };
    {
      const { w } = mkWorld(2), rm = d.rooms[rid];
      const tiles = { zona: [[L.x, L.y], [L.x + 1, L.y]], hueco: [[L.x, L.y + 1], [L.x + 1, L.y + 1]], 'a': [[L.a.x, L.a.y]], 'b': [[L.b.x, L.b.y]] };
      const solidAt = (x, y) => w.room.isSolidTile(x, y);
      // nada sólido en la zona (la propia charla no es sólida), en el hueco ni donde están a y b — salvo los propios a y b, que no cuentan como suelo ocupado por objetos
      Object.keys(tiles).forEach((k) => tiles[k].forEach(([x, y]) => {
        ok(!solidAt(x, y), `${tag}: ${k} (${x},${y}) libre de pared y de objetos sólidos` + bad('libre_' + k, `${tag} ${k} ${x},${y}`));
        const over = rm.props.filter((p) => !p.chat && x >= p.x && x < p.x + (p.w || 1) && y >= p.y && y < p.y + (p.h || 1));
        ok(over.length === 0, `${tag}: ${k} (${x},${y}) sin ningún otro objeto encima` + bad('encima_' + k, `${tag} ${k} ${x},${y} ${over.map((p) => p.id).join(',')}`));
        const dec = (rm.decor || []).concat(rm.decals || []).filter((q) => q.x === x && q.y === y);
        ok(dec.length === 0, `${tag}: ${k} (${x},${y}) sin decorado encima` + bad('decor_' + k, `${tag} ${k} ${x},${y}`));
      }));
      // ningún otro personaje (ni gato) en el hueco, la zona ni encima de a o b
      const watch = w.npcsHere().filter((nn) => nn.id !== A && nn.id !== B);
      const ban = new Set(['zona', 'hueco'].flatMap((k) => tiles[k].map(([x, y]) => x + ',' + y)).concat([L.a.x + ',' + L.a.y, L.b.x + ',' + L.b.y]));
      ok(!watch.some((nn) => { const [x, y] = tileOfNpc(nn); return ban.has(x + ',' + y); }), `${tag}: ningún otro personaje pisa la zona, el hueco ni el sitio de la charla` + bad('npc_encima', tag));
      const na = w.npcs[A], nb = w.npcs[B];
      ok(na.room === rid && nb.room === rid && tileOfNpc(na).join() === [L.a.x, L.a.y].join() && tileOfNpc(nb).join() === [L.b.x, L.b.y].join(), `${tag}: a y b están en sus baldosas en el capítulo 2` + bad('npc_sitio', tag));

      // ---- (3) A* real: desde el inicio de la sala y desde cada puerta
      const origins = [[6, 7]].concat(rm.doors.map((dd) => { const ii = G.doorInside(dd); return [ii.x, ii.y]; }));
      origins.forEach(([ox, oy]) => {
        const go = (x, y, what) => { paths++; const p = G.findPath(w, ox, oy, x, y); ok(!!p, `${tag}: A* real, desde ${ox},${oy} se llega a ${what} (${x},${y}) en el capítulo 2` + bad('astar_' + what, `${tag} desde ${ox},${oy}`)); return p; };
        go(L.a.x, L.a.y, 'a'); go(L.b.x, L.b.y, 'b');
        go(L.x, L.y, 'la zona'); go(L.x + 1, L.y, 'la zona');
        const ph = go(L.x, L.y + 1, 'el hueco del detective');
        if (ph) { const last = ph.length ? ph[ph.length - 1] : { x: (ox + 0.5) * TS, y: (oy + 1) * TS - 6 }; ok(Math.floor(last.x / TS) === L.x && Math.floor((last.y - 1) / TS) === L.y + 1 || (ox === L.x && oy === L.y + 1), `${tag}: el camino acaba EN el hueco del detective` + bad('astar_fin', tag)); }
      });
    }

    // ---- (5) mundo real: Lali graba y salen las frases (en 12 casos: es lo más lento)
    if (withChat <= 12) {
      const { st, w } = mkWorld(2), lu = w.players.find((p) => p.id === 'luna'), na = w.npcs[A], nb = w.npcs[B], pp = w.room.props.find((q) => q.listen && q.chat);
      ok(!!pp, `${tag}: el objeto «rec_charla» aparece en el capítulo 2` + bad('obj2', tag));
      if (pp) {
        lu.tools = ['uv', 'grabadora']; lu.toolIdx = 1;
        // el hueco del detective son 2 baldosas bajo la zona; un objeto pegado puede ganar el foco desde una de ellas, pero desde alguna de las dos debe verse la charla
        for (const hx of [L.x, L.x + 1]) for (const fy of [1.25, 1.5, 1.9]) { if (lu.focus && lu.focus.p === pp) break; lu.x = (hx + 0.5) * TS; lu.y = (L.y + fy) * TS; lu.work = null; lu.path = null; lu.task = null; lu.focus = w.findFocus(lu); }
        ok(lu.focus && lu.focus.kind === 'prop' && lu.focus.p === pp && lu.focus.needs === 'grabadora' && lu.focus.mine === true && !lu.focus.quiet, `${tag}: desde el hueco Lali ve «Usar Grabadora» en la charla` + bad('foco', tag + ' ' + JSON.stringify(lu.focus && { k: lu.focus.kind, n: lu.focus.needs, q: lu.focus.quiet })));
        if (lu.focus && lu.focus.p === pp) {
          w.interact(lu);
          ok(lu.work && lu.work.chat && lu.work.chat.lines.length === pr.chat.lines.length, `${tag}: al grabar empieza la charla` + bad('empieza', tag));
          const seen = []; const last = {};
          for (let t = 0; t < pr.steps[0].time + 0.6 && lu.work; t += 0.05) {
            w.stepWork(lu, 0.05); w.updateNPCs(0.05);
            [[A, na], [B, nb]].forEach(([id, nn]) => { if (nn.bubble && nn.bubble.chat && nn.bubble.text !== last[id]) { last[id] = nn.bubble.text; seen.push({ who: id, text: nn.bubble.text }); } });
          }
          ok(seen.length === pr.chat.lines.length && seen.every((s, k) => s.who === pr.chat.lines[k].who && s.text === pr.chat.lines[k].text), `${tag}: las frases salen una vez, en orden y en boca de quien toca` + bad('frases', tag + ' ' + JSON.stringify(seen.map((s) => s.who))));
          ok(!lu.work && st.progress[pp.key] === 1, `${tag}: al acabar el paso queda hecho` + bad('hecho', tag));
        }
      }
      // capítulo 3: el objeto ya no tiene a nadie → «Nadie habla aquí»
      const w3 = mkWorld(3).w, pp3 = w3.room.props.find((q) => q.listen && q.chat);
      ok(!pp3 || w3.chatReady(pp3) === false, `${tag}: en el capítulo 3 ya no hay charla que grabar (a y b se han ido)` + bad('ch3_nadie', tag));
    }

    // ---- (6) el bot gana el caso con charla (opcional: no atasca)
    if (opt.bot !== false && botDone < NB) {
      botDone++;
      const Q = G.qualityCase(d), b = Q.bot;
      ok(b.finished && b.win, `${tag}: el bot gana el caso con charla ` + (b.stuck ? b.stuck.msg : '') + bad('bot', tag));
    }
  }

  // ---------------------------------------------------------------- (1) estadística global
  ok(errors === 0, `ningún caso se queda sin generar (${errors} de ${n})` + bad('gen', 'errores'));
  if (G.GEN_VERSION >= 6) ok(withChat >= n * 0.8, `b2: la charla CON PISTA sale en ≥ 80 % de los casos (${withChat} de ${n}; con pista ${withClue})` + bad('prob', `${withChat}/${n}`));
  else ok(withChat >= n * 0.3 && withChat <= n * 0.55, `la charla sale en ~40 % de los casos (${withChat} de ${n})` + bad('prob', `${withChat}/${n}`));
  ok(paths > 100, `se comprobaron suficientes caminos con el A* real (${paths})`);
  return { fails, checks, withChat, n, paths, botDone };
}

// ================================================================ ejecución real
const real = suite(loadG(EXTRA));
real.fails.slice(0, 25).forEach((f) => console.log('  ✗ ' + f));
if (real.fails.length > 25) console.log(`  … y ${real.fails.length - 25} más`);
console.log(`${real.checks} comprobaciones en ${real.withChat} casos con charla (de ${real.n}); ${real.paths} caminos con el A* real; bot en ${real.botDone}; ${real.fails.length} fallos`);
let bad = real.fails.length;

// ================================================================ mutaciones: la fábrica o el motor roto DEBE hacer fallar la prueba (sin el bot salvo la última: es lo más lento)
const { mutador } = require('./tools/mutar.js'); // P-3/3: DESDE = texto (se ignora el formato) o expresión regular anclada a lo esencial; ver tools/mutar.js
const MUT = [
  ['compile.js', 'Object.assign({}, o, { ch: 3 })]; });', '{ ch: 3, room: pid, x: sp.x, y: sp.y, face: sp.face }]; });', 'a y b no vuelven a su sitio en el capítulo 3', false],
  ['compile.js', "placement[id] = [o, { ch: 2, room: pid, x: sp.x, y: sp.y, face: sp.face }, Object.assign({}, o, { ch: 3 })];", 'placement[id] = [o, Object.assign({}, o, { ch: 3 })];', 'a y b nunca van al rincón', false],
  ['compile.js', "[[ia, L.a], [ib, L.b]].forEach", "[[ia, L.a], [ib, L.a]].forEach", 'a y b en la misma baldosa', false],
  ['compile.js', "add(L.a.x, L.a.y); add(L.b.x, L.b.y); add(L.x, L.y + 1); add(L.x + 1, L.y + 1);", '', 'no reservar el rincón ni el hueco del detective', false],
  ['compile.js', "watchers.indexOf(id) < 0), lrooms", "true), lrooms", 'la pareja puede ser un vigilante', false],
  ['compile.js', "chapterMin: 2, steps: [stp]", "chapterMin: 1, steps: [stp]", 'la charla existe ya en el capítulo 1 (sin nadie)', false],
  ['compile.js', "who: i % 2 === 0 ? ia : ib, text", "who: ia, text", 'solo habla uno', false],
  ['compile.js', "cand.length >= 2 && lrooms.length", "cand.length >= 2 && false", 'nunca hay charla', false],
  ['world.js', "if (w.chat) this.playChat(w);", '', 'el motor no reproduce la charla', false],
  ['world.js', "return !!(na && nb && na.room === this.roomId && nb.room === this.roomId);", "return true;", 'el motor graba aunque no haya nadie', false],
  ['companion.js', "world.npcsHere().forEach((n) => { if (!n.cat) blockedNpc", "world.npcsHere().forEach((n) => { if (false) blockedNpc", 'el A* real ignora a los personajes', 'opcional'],
];
MUT.forEach(([file, from, to, name, flag]) => {
  const optional = flag === 'opcional', m = mutador(file, from, to);
  let r;
  try { r = suite(loadG(EXTRA, m.patch), { bot: false }); } catch (e) { r = { fails: ['ERROR: ' + e.message], checks: 0 }; }
  if (!m.ok && !optional) { console.log(`  ✗ mutación «${name}»: ${m.motivo} en ${file} (actualiza el patrón de la prueba; el código no tiene por qué estar mal)`); bad++; return; }
  const caught = m.ok && r.fails.length > 0 && !/^ERROR/.test(r.fails[0]);
  if (optional) { console.log(`  (informativa) «${name.slice(0, 40)}…»: ${caught ? 'detectada' : 'no cae'}${m.ok ? '' : ' [' + m.motivo + ']'}`); return; }
  console.log(`  mutación «${name}»: ${caught ? 'detectada (' + r.fails.length + ' fallos)' : 'NO DETECTADA ✗' + (r.fails[0] ? ' ' + r.fails[0] : '')}`);
  if (!caught) bad++;
});
console.log(bad ? `\n✗ ${bad} problemas` : '\nCharlas en orden: casos generados, capítulos 1-3, A* real, zona y hueco libres, mundo, bot y mutaciones detectadas.');
process.exit(bad ? 1 : 0);
