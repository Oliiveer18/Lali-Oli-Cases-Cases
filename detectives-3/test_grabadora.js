// Prueba de la GRABADORA con charlas (A4 HERR-1 2/4, v0.7.55). Uso: node test_grabadora.js
// Demuestra: (1) las 19 plantillas de sala (16 + 3 del Despacho en reserva) tienen un rincón de charla válido (`listen`) y los casos generados NO cambian (aún no lo usan);
// (2) formato y validador: un punto de escucha con `chat` (dos personajes y sus frases) se valida y lo imposible se rechaza;
// (3) mundo real sin navegador: al grabar, los dos personajes se turnan las frases (burbujas), se miran, la grabación no se acelera con la mejora del micrófono,
//     el micrófono mejorado alarga el alcance, moverse o parar calla la charla y, si no hay charla ahora, el objeto lo dice;
// (4) el caso 1 (murmullo de Baguette, `listen` sin `chat`) sigue igual; (5) MUTACIONES: 9 roturas del motor que la prueba DEBE detectar.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const clone = (x) => JSON.parse(JSON.stringify(x));

// Todas las comprobaciones viven en suite(G): devuelve la lista de fallos. Se ejecuta con el motor real (debe dar 0) y con motores rotos a propósito (deben dar > 0).
function suite(G) {
  const fails = []; let checks = 0;
  const ok = (c, m) => { checks++; if (!c) fails.push(m); };
  const TS = G.TS;
  G.save.data.upgrades = {};

  // ---------------------------------------------------------------- 1) plantillas
  const tpls = []; Object.values(G.GEN_DATA.rooms).forEach((l) => [].concat(l).forEach((t) => tpls.push(t)));
  ok(tpls.length === 19, `hay 19 plantillas de sala: 16 de siempre + 3 del Despacho en reserva (hay ${tpls.length})`);
  tpls.forEach((t) => {
    const L = t.listen;
    if (!L) { ok(false, `${t.id}: sin rincón de charla («listen»)`); return; }
    const map = G.roomMap(t), blocked = new Set(), add = (x, y) => blocked.add(y * 64 + x);
    (t.scenery || []).forEach((q) => add(q.x, q.y)); (t.slots || []).forEach((q) => add(q[0], q[1])); (t.crowd || []).forEach((q) => add(q[0], q[1]));
    (t.doorX || []).forEach((x) => { add(x, 0); add(x, 1); });
    Object.keys(t.special || {}).forEach((k) => { const sp = t.special[k]; add(sp.x, sp.y); if (sp.dx !== undefined) add(sp.x + sp.dx, sp.y + sp.dy); if (k === 'coche') add(sp.x + 1, sp.y); });
    const tiles = [[L.a.x, L.a.y], [L.b.x, L.b.y], [L.x, L.y], [L.x + 1, L.y], [L.x, L.y + 1], [L.x + 1, L.y + 1]];
    ok(tiles.every(([x, y]) => x >= 1 && y >= 1 && x <= t.w - 2 && y <= t.h - 2 && map[y][x] !== '#' && !blocked.has(y * 64 + x)), `${t.id}: el rincón de charla (personajes, zona y hueco del detective) cae en baldosas libres`);
    ok(L.w === 2 && L.h === 1 && L.b.x === L.a.x + 1 && L.b.y === L.a.y && L.y === L.a.y + 1 && L.x === L.a.x && L.a.face === 'right' && L.b.face === 'left', `${t.id}: a y b juntos mirándose, zona de 2×1 justo debajo`);
  });
  const gen = G.generateCase(11), gdef = gen.def;
  ok(Object.values(gdef.rooms).some((r) => r.props.some((p) => p.chat && p.listen)), 'desde A4 3/4-b1 los casos generados con charla traen un punto de escucha con `chat` (semilla 11)');

  // ---------------------------------------------------------------- caso sintético: un caso generado + un punto de escucha en su 1.ª sala
  const rid = gdef.start.room, T = tpls.filter((t) => t.id === gdef.rooms[rid].template)[0], S = T.listen;
  const names = Object.keys(gdef.npcs).filter((k) => !gdef.npcs[k].cat && k !== 'aliado'), A = names[0], B = names[1];
  const LINES = [{ who: A, text: '¿Seguro que nadie nos ha visto?' }, { who: B, text: 'Chis. Las paredes oyen.' }, { who: A, text: 'Pues la llave sigue en el cajón.' }, { who: B, text: 'Mañana la movemos, tranquilo.' }];
  const mkSyn = (mut) => {
    const d = clone(gdef), room = d.rooms[rid];
    room.props = room.props.filter((p) => !(p.x + (p.w || 1) > S.a.x && p.x < S.a.x + 2 && p.y + (p.h || 1) > S.a.y && p.y < S.a.y + 3)); // sitio libre para la charla
    room.props.push({ id: 'charla', sprite: null, x: S.x, y: S.y, w: S.w, h: S.h, solid: false, label: 'Charla al otro lado', shimmer: true, listen: true,
      chat: { a: A, b: B, lines: clone(LINES) }, steps: [{ tool: 'grabadora', time: 5.0, who: 'luna', text: 'REC. Se esconden algo: la llave y el cajón.' }], doneText: 'Una charla muy sospechosa.' });
    d.placement[A] = [{ ch: 1, room: rid, x: S.a.x, y: S.a.y, face: S.a.face }];
    d.placement[B] = [{ ch: 1, room: rid, x: S.b.x, y: S.b.y, face: S.b.face }];
    if (mut) mut(d);
    return d;
  };
  const errs = (d) => G.validateCase(d).errors.join(' | ');
  const prop = (d) => d.rooms[rid].props.find((p) => p.id === 'charla');

  // ---------------------------------------------------------------- 2) formato y validador
  const syn = mkSyn(), v = G.validateCase(syn);
  ok(G.checkCaseFormat(syn).errors.length === 0, 'formato: un punto de escucha con «chat» es válido ' + JSON.stringify(G.checkCaseFormat(syn).errors));
  ok(v.ok && v.errors.length === 0, 'validador: caso con charla grabada sin errores ' + JSON.stringify(v.errors));
  ok(/listen: true/.test(errs(mkSyn((d) => { delete prop(d).listen; }))), 'validador: «chat» sin listen: true');
  ok(/grabadora/.test(errs(mkSyn((d) => { prop(d).steps[0].tool = 'lupa'; }))), 'validador: la charla se graba con la grabadora, no con otra herramienta');
  ok(/el mismo personaje/.test(errs(mkSyn((d) => { prop(d).chat.b = A; prop(d).chat.lines.forEach((l) => { l.who = A; }); }))), 'validador: a y b iguales');
  ok(/no es un personaje del caso/.test(errs(mkSyn((d) => { prop(d).chat.b = 'nadie'; }))), 'validador: personaje inexistente');
  ok(/gato/.test(errs(mkSyn((d) => { d.npcs[B].cat = true; }))), 'validador: un gato no charla');
  ok(/no es ni «a»/.test(errs(mkSyn((d) => { prop(d).chat.lines[1].who = 'otro'; }))), 'validador: frase de alguien que no es a ni b');
  ok(/nunca habla/.test(errs(mkSyn((d) => { prop(d).chat.lines.forEach((l) => { l.who = A; }); }))), 'validador: si uno de los dos nunca habla no es una charla');
  ok(/necesitan 4\.8 s/.test(errs(mkSyn((d) => { prop(d).steps[0].time = 3; }))), 'validador: grabar dura menos de lo que piden las frases');
  ok(!/necesitan/.test(errs(mkSyn((d) => { prop(d).steps[0].time = 4.8; }))), 'validador: justo el mínimo (4,8 s para 4 frases) vale');
  ok(/nunca están a la vez/.test(errs(mkSyn((d) => { const o = Object.keys(d.rooms).find((r) => r !== rid); d.placement[B] = [{ ch: 1, room: o, x: 6, y: 5, face: 'down' }]; }))), 'validador: los dos nunca coinciden en la sala');
  ok(!/nunca están a la vez/.test(errs(mkSyn((d) => { const o = Object.keys(d.rooms).find((r) => r !== rid); d.placement[B] = [{ ch: 1, room: o, x: 6, y: 5, face: 'down' }, { ch: 2, room: rid, x: S.b.x, y: S.b.y, face: 'left' }]; prop(d).chapterMin = 2; }))), 'validador: coinciden en el capítulo 2 y el objeto sale en el 2: vale');
  ok(/nunca están a la vez/.test(errs(mkSyn((d) => { const o = Object.keys(d.rooms).find((r) => r !== rid); d.placement[B] = [{ ch: 1, room: rid, x: S.b.x, y: S.b.y, face: 'left' }, { ch: 2, room: o, x: 6, y: 5, face: 'down' }]; prop(d).chapterMin = 2; }))), 'validador: coinciden solo en el capítulo 1 pero el objeto sale en el 2');
  ok(G.checkCaseFormat(mkSyn((d) => { prop(d).chat.lines = [LINES[0]]; })).errors.some((e) => /lines/.test(e)), 'formato: una sola frase no es una charla');
  ok(G.checkCaseFormat(mkSyn((d) => { prop(d).chat.volumen = 3; })).errors.some((e) => /volumen/.test(e)), 'formato: campo desconocido en «chat»');
  ok(G.listenMinSeconds({ lines: [1, 2, 3, 4] }) === 4.8 && G.listenMinSeconds(null) === 0, 'G.listenMinSeconds: 1,2 s por frase');

  // ---------------------------------------------------------------- 3) mundo real
  const mkWorld = (def, chapter) => { const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'solo' }); st.chapter = chapter || 1; w.enterRoom(def.start.room, null); w.onChapter(); w.out.length = 0; return { st, w }; };
  const bottom = (S.y + 1) * TS;
  const stand = (p, dist) => { p.x = (S.x + 1) * TS; p.y = bottom + dist + 4; p.work = null; p.path = null; p.task = null; };
  {
    const { st, w } = mkWorld(syn), lu = w.players.find((p) => p.id === 'luna'), na = w.npcs[A], nb = w.npcs[B], pr = w.room.props.find((q) => q.id === 'charla');
    ok(na.room === rid && nb.room === rid && na.x < nb.x && Math.abs(na.y - nb.y) < 1, 'mundo: los dos personajes de la charla están en su sitio');
    ok(w.chatReady(pr) === true && w.chatReady({}) === true, 'mundo: chatReady con los dos presentes (y sin chat siempre vale)');
    // enfoque y duración
    stand(lu, 10); lu.focus = w.findFocus(lu);
    ok(lu.focus && lu.focus.kind === 'prop' && lu.focus.p === pr && lu.focus.needs === 'grabadora' && lu.focus.mine === true && !lu.focus.quiet, 'mundo: Lali ve «Usar Grabadora» en el punto de escucha');
    w.interact(lu);
    ok(lu.work && lu.work.chat && lu.work.chat.a === A && lu.work.chat.lines.length === 4 && lu.work.dur === 5.0, 'mundo: al grabar empieza la charla y dura lo que dice el paso (5,0 s)');
    // la charla frase a frase
    const seen = []; let lastTxt = {}, faceOk = true, chatWith = true;
    for (let t = 0; t < 5.6 && lu.work; t += 0.05) {
      w.stepWork(lu, 0.05); w.updateNPCs(0.05);
      if (lu.work) { if (na.chatWith !== B || nb.chatWith !== A) chatWith = false; if (na.face !== 'right' || nb.face !== 'left') faceOk = false; }
      [[A, na], [B, nb]].forEach(([id, n]) => { if (n.bubble && n.bubble.chat && n.bubble.text !== lastTxt[id]) { lastTxt[id] = n.bubble.text; seen.push({ who: id, text: n.bubble.text, t: lu.work ? lu.work.t : 5 }); } });
    }
    ok(seen.length === 4 && seen.every((s, i) => s.who === LINES[i].who && s.text === LINES[i].text), 'mundo: las 4 frases salen UNA vez, en orden y en boca de quien toca ' + JSON.stringify(seen.map((s) => s.who + ':' + s.text.slice(0, 8))));
    ok(seen.length === 4 && seen.every((s, i) => s.t >= i * 1.25 - 0.06 && s.t <= (i + 1) * 1.25 + 0.06), 'mundo: cada frase sale en su turno (4 turnos de 1,25 s)');
    ok(chatWith && faceOk, 'mundo: mientras graban se miran el uno al otro');
    ok(!lu.work && st.progress[pr.key] === 1, 'mundo: al acabar la grabación el paso queda hecho');
    w.updateNPCs(0.05);
    ok(!na.chatWith && !nb.chatWith && !(na.bubble && na.bubble.chat) && !(nb.bubble && nb.bubble.chat), 'mundo: al acabar se callan y dejan de mirarse');
  }
  { // se interrumpe (otros caminos que dejan `work` a null: cambio de sala, «¡Nos ha visto!», teletransporte...)
    const { w } = mkWorld(syn), lu = w.players.find((p) => p.id === 'luna'), na = w.npcs[A], nb = w.npcs[B];
    stand(lu, 10); lu.focus = w.findFocus(lu); w.interact(lu);
    for (let i = 0; i < 20; i++) { w.stepWork(lu, 0.05); w.updateNPCs(0.05); }
    ok(na.bubble && na.chatWith === B, 'mundo: a mitad de grabación están charlando');
    lu.work = null; w.updateNPCs(0.05);
    ok(!na.chatWith && !nb.chatWith && !(na.bubble && na.bubble.chat) && !(nb.bubble && nb.bubble.chat), 'mundo: si la grabación se corta, la charla se calla sola');
  }
  { // moverse corta la grabación de verdad (jugador humano con grabadora)
    const { w } = mkWorld(syn), rex = w.players[0], na = w.npcs[A];
    rex.tools = ['lupa', 'ganzua', 'grabadora']; rex.toolIdx = 2; stand(rex, 10); rex.focus = w.findFocus(rex); w.interact(rex);
    ok(rex.work && rex.work.chat, 'mundo: el detective humano también puede grabar (si lleva la grabadora)');
    for (let i = 0; i < 12; i++) w.update(0.05, true);
    ok(rex.work && na.bubble, 'mundo: quieto sigue grabando y la charla suena');
    // GRAB-1 (c3): zona muerta. Un roce suave del joystick durante 1 s y un toque rápido a tope (0,1 s) NO cortan; empujar de verdad (> 0,35 s seguidos) sí.
    G.input.p[0].mx = 0.4; for (let i = 0; i < 20; i++) w.update(0.05, true); G.input.p[0].mx = 0;
    ok(rex.work && rex.work.chat, 'mundo: un roce suave del joystick (1 s) no corta la grabación');
    G.input.p[0].mx = 1; w.update(0.05, true); w.update(0.05, true); G.input.p[0].mx = 0; w.update(0.05, true);
    ok(rex.work && rex.work.chat, 'mundo: un toque rápido a tope (0,1 s) no corta la grabación');
    for (let i = 0; i < 12; i++) w.update(0.05, true); // se enfría
    G.input.p[0].mx = 1;
    for (let i = 0; i < 10; i++) w.update(0.05, true);
    G.input.p[0].mx = 0;
    ok(!rex.work, 'mundo: moverse corta la grabación');
    ok(w.out.some((o) => o.t === 'toast' && /Grabación cortada/.test(o.text)), 'mundo: al cortarse avisa con claridad');
    w.update(0.05, true);
    ok(!na.chatWith && !(na.bubble && na.bubble.chat), 'mundo: y la charla se calla');
  }
  { // el micrófono mejorado: más alcance, pero la charla no se acelera
    const { w } = mkWorld(syn), lu = w.players.find((p) => p.id === 'luna'), pr = w.room.props.find((q) => q.id === 'charla');
    stand(lu, 52);
    ok(!(w.findFocus(lu) && w.findFocus(lu).p === pr), 'alcance: a 52 px (sin mejora) no se puede grabar la charla');
    G.save.data.upgrades.grabadora = 1;
    ok(w.findFocus(lu) && w.findFocus(lu).p === pr, 'alcance: con el micrófono nivel 1 (×1,5 = 60 px) sí');
    stand(lu, 80); G.save.data.upgrades.grabadora = 3;
    ok(w.findFocus(lu) && w.findFocus(lu).p === pr, 'alcance: con el micrófono nivel 3 (×2,5 = 100 px) llega aún más lejos');
    G.save.data.upgrades.grabadora = 0;
    stand(lu, 10); G.save.data.upgrades.grabadora = 3;
    lu.focus = w.findFocus(lu); w.interact(lu);
    ok(lu.work && lu.work.dur === 5.0, 'duración: una charla dura 5,0 s aunque el micrófono sea de nivel 3 (no se acelera)');
    ok(w.stepDuration('grabadora', pr.steps[0]) < 2.1, 'duración: un paso de grabadora SIN charla sí se acorta con la mejora (5,0 s → 2,0 s)');
    G.save.data.upgrades = {};
  }
  { // nadie habla ahora
    const { w } = mkWorld(syn), lu = w.players.find((p) => p.id === 'luna'), nb = w.npcs[B], pr = w.room.props.find((q) => q.id === 'charla');
    nb.room = 'otra_sala'; stand(lu, 10); lu.focus = w.findFocus(lu);
    ok(w.chatReady(pr) === false && lu.focus && lu.focus.quiet === true && /Nadie habla/.test(lu.focus.verb), 'silencio: si falta uno de los dos, el objeto dice «Nadie habla aquí»');
    w.interact(lu);
    ok(!lu.work && lu.bubble && /no habla nadie/.test(lu.bubble.text) && w.out.some((e) => e.t === 'denied_soft'), 'silencio: no se graba y Lali lo dice');
  }

  // ---------------------------------------------------------------- 4) caso 1 y huella
  const t1 = G.CASES.tarta, mur = t1.rooms.callejon.props.find((p) => p.id === 'murmullo');
  ok(mur && mur.listen === true && !mur.chat && mur.watcher === 'baguette', 'caso 1: el murmullo de Baguette sigue siendo `listen` sin `chat`');
  ok(G.validateCase(t1).ok && G.validateCase(t1).warnings.length === 0, 'caso 1: sigue validando sin avisos');
  const fp = (d) => G.caseFingerprint(d, gen.bible).mechanic;
  const sinSigilo = (d) => { Object.values(d.rooms).forEach((r) => { r.props = r.props.filter((p) => p.id === 'charla' || !(p.watcher || p.listen)); }); return d; }; // quita otros vigilantes: la huella solo depende de la charla
  ok(/grabadora/.test(fp(sinSigilo(mkSyn()))) && !/sigilo/.test(fp(sinSigilo(mkSyn()))), 'huella: una charla grabada cuenta como grabadora y NO como sigilo (' + fp(sinSigilo(mkSyn())) + ')');
  ok(/sigilo/.test(fp(sinSigilo(mkSyn((d) => { delete prop(d).chat; })))), 'huella: un `listen` sin charla sigue contando como sigilo');
  return { fails, checks };
}

// ================================================================ ejecución real
const real = suite(loadG(EXTRA));
real.fails.forEach((f) => console.log('  ✗ ' + f));
console.log(`${real.checks} comprobaciones, ${real.fails.length} fallos`);
let bad = real.fails.length;

// ================================================================ mutaciones: el motor roto DEBE hacer fallar la prueba
const MUT = [
  ['world.js', 'if (w.chat) this.playChat(w);', '', 'no reproducir la charla'],
  ['world.js', 'G.LISTEN_REACH * (G.stats().listenRange || 1)', 'G.LISTEN_REACH', 'el micrófono no alarga el alcance'],
  ['world.js', "if (chat) return Math.max(0.35, base);", '', 'la charla se acelera con la mejora'],
  ['world.js', 'if (p.chat && !info.done && !this.chatReady(p))', 'if (false)', 'no avisar de que nadie habla'],
  ['world.js', "else if (n.chatWith) { n.chatWith = null; if (n.bubble && n.bubble.chat) n.bubble = null; }", 'else if (n.chatWith) { }', 'la charla no se calla al cortarse'],
  ['world.js', "if (n.chatWith) { const o = this.npcs[n.chatWith]; if (o && o.room === n.room) { this.faceToward(n, o.x, o.y); return; } }", '', 'no se miran'],
  ['schema.js', 'if (def.npcs[ch.a] && def.npcs[ch.b] && !together)', 'if (false)', 'el validador no exige que coincidan en la sala'],
  ['schema.js', 'if (G.stepBaseSeconds(q) < need - 1e-9)', 'if (false)', 'el validador no exige tiempo para las frases'],
  ['fingerprint.js', "(p.listen && !p.chat)", 'p.listen', 'la charla cuenta como sigilo'],
];
MUT.forEach(([file, from, to, name]) => {
  let applied = false;
  let r;
  try {
    r = suite(loadG(EXTRA, (f, text) => { if (f !== file) return text; if (text.indexOf(from) < 0) throw new Error('la mutación no encaja: ' + name); applied = true; return text.replace(from, to); }));
  } catch (e) { r = { fails: ['ERROR: ' + e.message], checks: 0 }; }
  const caught = applied && r.fails.length > 0 && !/ERROR/.test(r.fails[0]);
  console.log(`  mutación «${name}»: ${caught ? 'detectada (' + r.fails.length + ' fallos)' : 'NO DETECTADA ✗' + (r.fails[0] ? ' ' + r.fails[0] : '')}`);
  if (!caught) bad++;
});
console.log(bad ? `\n✗ ${bad} problemas` : '\nGrabadora en orden: formato, validador, mundo, caso 1 y 9 mutaciones detectadas.');
process.exit(bad ? 1 : 0);
