// Prueba de 4D-2 «Capítulos y duración»: 3 capítulos (Pistas / Interrogatorio / Acusar), relleno de duración (curiosidades `cur_N` y charlas de detalle `f_chN`),
// que el relleno NO cambia ningún hecho del caso, que todo lo examinable sigue alcanzable (A* real, con los personajes como obstáculos y también tras empujar),
// que `G.findPath` llega a un objeto sólido aunque la baldosa «más cercana en orden de lectura» sea una bolsa cerrada, y que el bot (reparto del tiempo
// por capítulo solo con la HISTORIA; el relleno aparte en `fillSeconds`) no se atasca y llega a ≥ 20 min. Uso: node test_filler.js [semillas=1500] [semillasBot=120]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 1500, NB = +process.argv[3] || 120;
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0; return h; };
const EX = G.GEN_DATA.compile.extra;
const isCur = (id) => /^cur_\d+$/.test(id), isChat = (id) => /^f_ch\d+$/.test(id);

ok('el relleno tiene datos: ≥ 20 curiosidades con sprite, etiqueta y remate, y ≥ 20 charlas; topes y objetivo de duración fijados', EX && EX.curios.length >= 20 && EX.curios.every((c) => c.sprite && G.spr[c.sprite] && c.label && c.text && c.text.length === 2) && EX.chat.length >= 20 && EX.chat.every((c) => c[0] && c[1]) && EX.targetMin >= 23 && EX.maxCurioPerRoom >= 6 && EX.maxChatPerNpc === 2, JSON.stringify({ targetMin: EX && EX.targetMin, maxCurioPerRoom: EX && EX.maxCurioPerRoom, maxChatPerNpc: EX && EX.maxChatPerNpc }));

// ---- 1) estructura: tres capítulos, relleno dentro de los topes y sin tocar nada más
const S = { n: 0, invalid: 0, chap: 0, g1: 0, g2: 0, g2b: 0, g2bBad: 0, g3: 0, curios: 0, curioRoomOver: 0, curioClue: 0, curioFmt: 0, chatOver: 0, chatMiss: 0, dupIds: 0, shortMeter: 0, sinCuriosNoTarget: 0, solidBad: 0, coinBad: 0 };
const isCoinFx = (fx) => !!EX.coins && Object.keys(fx).every((k) => k === 'money' || k === 'sfx') && fx.money === EX.coins.amount && fx.sfx === 'pickup'; // 4F-0a/4: la ÚNICA excepción permitida en una curiosidad
const mins = [];
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s); if (r.error) continue;
  const d = r.def; S.n++;
  if (!G.validateCase(d).ok) S.invalid++;
  const ch = d.chapters, titles = ch.map((c) => c.title).join('/');
  if (ch.length !== 3 || titles !== 'Pistas/Interrogatorio/Acusar' || ch.some((c, i) => c.id !== i + 1)) S.chap++;
  const g1 = ch[0].goals[0], g2 = ch[1].goals, g3 = ch[2].goals[0];
  const phys = Object.keys(d.clues);
  if (!(g1 && g1.id === 'g1' && g1.clues.length >= 1 && g1.min >= 1 && g1.min <= g1.clues.length && g1.clues.every((c) => phys.indexOf(c) >= 0))) S.g1++;
  if (!(g2[0] && g2[0].id === 'g2' && g2[0].min === d.suspects.length)) S.g2++;
  if (g2.length > 2) S.g2bBad++;
  if (g2[1]) { S.g2b++; if (!(g2[1].id === 'g2b' && g2[1].min >= 1 && g2[1].min <= g2[1].clues.length && g2[1].clues.every((c) => phys.indexOf(c) >= 0))) S.g2bBad++; }
  if (!(g3 && g3.id === 'g3' && g3.flags && g3.flags[0] === 'case_closed')) S.g3++;
  // relleno
  const ids = []; let cur = 0, coinCur = 0; const curIds = [];
  Object.keys(d.rooms).forEach((rid) => {
    let n = 0; const here = d.rooms[rid].props.map((p) => p.id); if (new Set(here).size !== here.length) S.dupIds++;
    d.rooms[rid].props.forEach((p) => { ids.push(p.id); if (isCur(p.id)) curIds.push(p.id); if (isCur(p.id)) { cur++; n++; if (!p.solid || !p.steps || p.steps.length !== 1 || !p.label || !p.sprite || !G.spr[p.sprite] || !p.steps[0].text || p.steps[0].tool) S.curioFmt++; if (p.steps && p.steps.some((x) => x.clue || x.requires || (x.fx && !isCoinFx(x.fx)))) S.curioClue++; if (p.steps && p.steps.some((x) => x.fx && isCoinFx(x.fx))) coinCur++; if (p.watcher) S.curioClue++; } });
    if (n > EX.maxCurioPerRoom) S.curioRoomOver++;
  });
  S.curios += cur;
  if (coinCur > ((EX.coins && EX.coins.n) || 0)) S.coinBad++;
  if (new Set(curIds).size !== curIds.length) S.dupIds++;
  Object.keys(d.npcs).forEach((id) => {
    const n = d.npcs[id], c = (n.topics || []).filter((t) => isChat(t.id)).length;
    if (c > EX.maxChatPerNpc) S.chatOver++;
    if (!n.cat && id !== 'aliado' && n.topics && c !== EX.maxChatPerNpc && EX.chat.length >= 2 * Object.keys(d.npcs).length) S.chatMiss++;
  });
  const m = G.meterCase(d, { fairness: r.review.fairness }); mins.push(m.humanMinutes);
  if (m.humanMinutes < 20) S.shortMeter++;
}
ok(`${S.n} casos generados, todos válidos (${S.invalid} inválidos)`, S.n > 0 && S.invalid === 0);
ok('todos con 3 capítulos «Pistas» · «Interrogatorio» · «Acusar» (ids 1-3) y sus objetivos g1, g2, g3', S.chap === 0 && S.g1 === 0 && S.g2 === 0 && S.g3 === 0, JSON.stringify(S));
ok(`«Escucha a los testigos» (g2b) solo cuando hay testimonios (${S.g2b} de ${S.n} casos), con mínimo válido y pistas que existen`, S.g2bBad === 0 && S.g2b > S.n * 0.3, 'g2b ' + S.g2b + ' · mal ' + S.g2bBad);
ok(`curiosidades: ${(S.curios / S.n).toFixed(1)} por caso, sólidas, de 1 paso sin pista, bandera, herramienta ni vigilante (salvo las monedas, como mucho ${(EX.coins||{}).n || 0} por caso), con etiqueta y sprite, y como mucho ${EX.maxCurioPerRoom} por sala`, S.curios / S.n >= 5 && S.curioFmt === 0 && S.curioClue === 0 && S.curioRoomOver === 0 && S.coinBad === 0, JSON.stringify(S));
ok('charlas de detalle: como mucho 2 por personaje y todo personaje que habla las tiene; ids de objeto únicos en cada sala e ids `cur_N` únicos en todo el caso', S.chatOver === 0 && S.chatMiss === 0 && S.dupIds === 0, JSON.stringify(S));
ok(`el medidor estima ≥ 20 min en todos los casos (mín. ${Math.min(...mins)}, media ${(mins.reduce((a, b) => a + b, 0) / mins.length).toFixed(1)})`, S.shortMeter === 0, S.shortMeter + ' casos');

// ---- 2) el relleno no cambia ningún hecho: igual que sin relleno, quitando lo `cur_*` y `f_ch*` (y par/reward, que salen del medidor)
{ const saved = { t: EX.targetMin, c: EX.maxCurioPerRoom, h: EX.maxChatPerNpc }; let diff = 0, first = null, withFill = 0, total = 0;
  const strip = (d) => { const o = JSON.parse(JSON.stringify(d)); delete o.parSeconds; delete o.reward; Object.keys(o.rooms).forEach((rid) => { o.rooms[rid].props = o.rooms[rid].props.filter((p) => !isCur(p.id)); }); Object.keys(o.npcs).forEach((id) => { if (o.npcs[id].topics) o.npcs[id].topics = o.npcs[id].topics.filter((t) => !isChat(t.id)); }); return JSON.stringify(o); };
  for (let s = 0; s < 200; s++) {
    const a = G.generateCase(s * 31 + 5); if (a.error) continue; total++;
    EX.targetMin = 0; EX.maxCurioPerRoom = 0; EX.maxChatPerNpc = 0;
    const b = G.generateCase(s * 31 + 5);
    EX.targetMin = saved.t; EX.maxCurioPerRoom = saved.c; EX.maxChatPerNpc = saved.h;
    if (b.error) { diff++; continue; }
    if (JSON.stringify(a.def).length !== JSON.stringify(b.def).length) withFill++;
    if (strip(a.def) !== strip(b.def)) { diff++; if (!first) first = s * 31 + 5; }
  }
  ok(`quitando el relleno, el caso es idéntico al de sin relleno: pistas, mentiras, sospechosos, solución y resto de objetos (${total} semillas, ${withFill} con relleno)`, diff === 0 && withFill > total * 0.9, `${diff} distintos; primero: ${first}`); }

// ---- 3) todo lo examinable sigue alcanzable con el A* REAL (personajes de pie como obstáculos; desde el inicio y desde cada puerta; antes y después de empujar)
{ let paths = 0, fails = 0, first = null;
  for (let s = 0; s < 150; s++) {
    const d = G.generateCase(s * 7 + 1).def; if (!d) continue;
    [false, true].forEach((pushed) => {
      const st = new G.CaseState(d, 'normal'), w = new G.World(st, { mode: 'solo' });
      if (pushed) Object.keys(d.rooms).forEach((rid) => d.rooms[rid].props.forEach((p) => (p.steps || []).forEach((sp) => { if (sp.fx && sp.fx.moveProp) { const mv = st.moved[sp.fx.moveProp.id] || { dx: 0, dy: 0 }; mv.dx += sp.fx.moveProp.dx; mv.dy += sp.fx.moveProp.dy; st.moved[sp.fx.moveProp.id] = mv; } })));
      Object.keys(d.rooms).forEach((rid) => {
        w.enterRoom(rid, null); const rm = d.rooms[rid];
        const origins = [[6, 7]].concat(rm.doors.map((dd) => { const i = G.doorInside(dd); return [i.x, i.y]; }));
        origins.forEach(([ox, oy]) => {
          const target = (x, y, what) => { paths++; if (!G.findPath(w, ox, oy, x, y)) { fails++; if (!first) first = `${s}/${rid}/${pushed ? 'empujado' : 'inicio'}/desde ${ox},${oy}: ${what} en (${x},${y})`; } };
          w.npcsHere().forEach((n) => { if (!n.cat) target(Math.floor(n.x / G.TS), Math.floor((n.y - 1) / G.TS), 'personaje ' + n.id); });
          rm.props.forEach((p) => { if (p.steps && (!p.visible)) target(p.x, p.y, 'objeto ' + p.id); });
        });
      });
    });
  }
  ok(`con el A* real se llega a todo personaje y a todo objeto examinable, curiosidades incluidas (${paths} caminos en 150 semillas × inicio/empujado × cada origen)`, fails === 0 && paths > 5000, `${fails} fallos; el primero: ${first}`); }

// ---- 4) G.findPath: el destino sólido se aborda por la baldosa libre más cercana ALCANZABLE, no por una bolsa cerrada (semilla 24611318)
{ const W = 13, H = 7, mk = () => [...Array(H)].map((_, y) => [...Array(W)].map((_, x) => x === 0 || y === 0 || x === W - 1 || y === H - 1));
  const world = (sol) => ({ room: { w: W, h: H, isSolidTile: (x, y) => x < 0 || y < 0 || x >= W || y >= H || sol[y][x] }, npcsHere: () => [] });
  const endTile = (p) => { const l = p && p[p.length - 1]; if (!l) return null; const px = Array.isArray(l) ? l[0] : l.x, py = Array.isArray(l) ? l[1] : l.y; return [Math.floor(px / G.TS), Math.floor((py - 1) / G.TS)]; };
  const a = mk(); a[2][3] = true; a[1][2] = true; a[1][4] = true; // objetivo (3,2); la baldosa (3,1), la primera en orden de lectura, queda encerrada entre pared, dos objetos y el propio objetivo
  const pa = G.findPath(world(a), 9, 5, 3, 2, 6000), ea = endTile(pa);
  ok('findPath llega a un objeto sólido cuya baldosa libre más cercana en orden de lectura es una bolsa cerrada (acaba junto al objeto, no en la bolsa)', !!pa && !!ea && !(ea[0] === 3 && ea[1] === 1) && Math.abs(ea[0] - 3) + Math.abs(ea[1] - 2) <= 2, JSON.stringify(ea));
  const b = mk(); b[2][3] = true; [[10, 5], [12, 5], [11, 4], [11, 6]].forEach(([x, y]) => { b[y][x] = true; }); // el jugador (11,5) está encerrado y lejos del objetivo: ninguna baldosa alcanzable cerca
  ok('findPath devuelve null si desde donde está el jugador no se puede llegar a ninguna baldosa cercana al objetivo', G.findPath(world(b), 11, 5, 3, 2, 6000) === null);
  const c = mk(); c[2][3] = true; const pc = G.findPath(world(c), 9, 5, 3, 2, 6000), ec = endTile(pc);
  ok('si la baldosa más cercana ya era alcanzable, el resultado es el de siempre (3,1)', !!ec && ec[0] === 3 && ec[1] === 1, JSON.stringify(ec)); }

// ---- 5) bot: reparto del tiempo por capítulo solo con la historia; el relleno aparte; sin atascos y ≥ 20 min
{ let stuck = [], short = [], sumBad = 0, noFill = 0, warnCh = 0, fillShare = [], story = [0, 0, 0], n = 0, chapErr = 0, mn = 1e9;
  for (let i = 0; i < NB; i++) {
    const seed = (i + 7) * 104729 + 3, r = G.generateCase(seed); if (r.error) continue;
    const Q = G.qualityCase(r.def), b = Q.bot;
    if (!b.finished || !b.win) { stuck.push(seed); continue; }
    n++; mn = Math.min(mn, b.humanMinutes); if (b.humanMinutes < 20) short.push(seed + ':' + b.humanMinutes);
    if (b.perChapter.length !== 3 || b.perChapter.some((c) => !(c.seconds > 0) || c.fillSeconds === undefined)) chapErr++;
    const fillSum = b.perChapter.reduce((a, c) => a + c.fillSeconds, 0), storySum = b.perChapter.reduce((a, c) => a + c.seconds, 0);
    if (Math.abs(fillSum + storySum - b.botSeconds) > 6 || fillSum !== b.stats.fillSeconds && Math.abs(fillSum - b.stats.fillSeconds) > 3) sumBad++;
    if (!(fillSum > 0)) noFill++;
    fillShare.push(fillSum / b.botSeconds);
    b.perChapter.forEach((c, k) => { story[k] += c.seconds / storySum; });
    if (Q.findings.some((f) => f.code === 'capitulo_largo' || f.code === 'capitulo_corto')) warnCh++;
  }
  ok(`bot: ${n} casos jugados hasta el final y ganados, 0 atascos`, stuck.length === 0 && n > NB * 0.95, 'atascos: ' + stuck.join(','));
  ok(`bot: ≥ 20 min en todos (mín. ${mn} min)`, short.length === 0, short.join(' '));
  ok('bot: cada capítulo registra su tiempo de historia y su `fillSeconds`; historia + relleno = tiempo total del bot', chapErr === 0 && sumBad === 0, `chapErr ${chapErr} · sumBad ${sumBad}`);
  ok(`bot: el relleno es real (${(fillShare.reduce((a, b) => a + b, 0) / fillShare.length * 100).toFixed(0)} % del tiempo) y todos los casos lo tienen; reparto de la historia ${story.map((x) => (x / n * 100).toFixed(0) + ' %').join(' / ')}`, noFill === 0 && story.every((x) => x / n > 0.05));
  ok(`bot: avisos de capítulo largo/corto en ${warnCh} de ${n} casos (≤ 8 %: el relleno opcional ya no cuenta en el reparto)`, warnCh <= n * 0.08, warnCh + ' casos'); }

// ---- 5b) semillas que atascaban al bot durante 4D-2 (regresiones): cada una con la causa que arregló una pieza distinta
{ const REG = { 3770247: 'aimOk (bolsa cerrada por el aliado)', 8587781: 'connOk tras empujar (curiosidad pegada al empujable)', 13091128: 'aimOk de la propia curiosidad', 24611318: 'G.findPath alcanzable', 16337727: 'connOk por origen (puerta aislada)' };
  const fails = [];
  Object.keys(REG).forEach((seed) => { const r = G.generateCase(+seed); if (r.error) { fails.push(seed + ' (error de generación)'); return; } const Q = G.qualityCase(r.def); if (!Q.bot.finished || !Q.bot.win || Q.bot.humanMinutes < 20) fails.push(seed + ' ' + REG[seed] + ': ' + (Q.bot.stuck ? Q.bot.stuck.msg : Q.bot.humanMinutes + ' min')); });
  ok('las 5 semillas que atascaban al bot en 4D-2, con las guardas de conectividad del relleno puestas (' + Object.keys(REG).join(', ') + ') se juegan hasta el final y duran ≥ 20 min', fails.length === 0, fails.join(' | ')); }

// ---- 6) el caso 1 no cambia
ok('el caso 1 sigue idéntico (hash 74937935; GEN_VERSION ' + G.GEN_VERSION + ' >= 5: la versión del generador no toca el caso 1)', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.GEN_VERSION >= 5);
console.log(bad ? `\n${bad} FALLO(S)` : '\nTODO OK');
process.exit(bad ? 1 : 0);
