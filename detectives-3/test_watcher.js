// Prueba del VIGILANTE (sigilo) y de los textos que antes eran del caso 1 (v0.7.21). Uso: node test_watcher.js
// Demuestra: (1) el caso 1 se comporta EXACTAMENTE como en la v0.7.20; (2) cualquier caso puede tener su vigilante
// (otro personaje, otra sala, otro ritmo, otra frase); (3) el validador rechaza vigilantes imposibles; (4) la puerta que
// se abre sola y el «se acabó el tiempo» salen de los datos del caso, con valores neutros por defecto.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const clone = (x) => JSON.parse(JSON.stringify(x));
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---- oráculo: la fórmula EXACTA de la v0.7.20 (Baguette, callejón, capítulo 2)
const legacy = (diff, t) => { const per = diff === 'hard' ? 6.0 : 6.5, look = diff === 'hard' ? 2.0 : 1.7; return diff !== 'easy' && ((t + 2) % per) > per - look; };

// 1) funciones puras: el caso 1 no cambia
const t1 = G.CASES.tarta, cfg1 = G.watchConfig(t1, 'baguette');
ok(near(cfg1.period.normal, 6.5) && near(cfg1.period.hard, 6.0) && near(cfg1.look.normal, 1.7) && near(cfg1.look.hard, 2.0) && cfg1.offset === 2, 'valores por defecto = los del caso 1');
ok(cfg1.face.watching === 'left' && cfg1.face.idle === 'right', 'caras por defecto = las del caso 1');
ok(/Gertrudis/.test(cfg1.spotted), 'la frase del caso 1 viene de sus datos (npcs.baguette.watch.spotted)');
let diffs = 0;
['easy', 'normal', 'hard'].forEach((d) => { for (let t = 0; t < 300; t += 0.05) if (G.watchLooking(cfg1, d, t) !== legacy(d, t)) diffs++; });
ok(diffs === 0, `watchLooking coincide con la fórmula de la v0.7.20 en 3 × 6000 instantes (${diffs} diferencias)`);
ok(near(G.watchSafeSeconds(cfg1, 'normal'), 4.8) && near(G.watchSafeSeconds(cfg1, 'hard'), 4.0), 'ventana segura del caso 1: 4,8 s (Normal) y 4,0 s (Difícil)');
ok(G.validateCase(t1).ok && G.validateCase(t1).warnings.length === 0 && G.reviewCase(t1).fairness === 100, 'el caso 1 sigue validando sin avisos y con equidad 100');

// 2) mundo real (sin navegador): el vigilante del caso 1 se comporta igual
const mkWorld = (def, diff, room, door, chapter) => {
  const st = new G.CaseState(def, diff); const w = new G.World(st, { mode: 'solo' });
  st.chapter = chapter || 1; w.enterRoom(room, door); w.onChapter(); w.out.length = 0; return { st, w };
};
['easy', 'normal', 'hard'].forEach((d) => {
  const { w } = mkWorld(t1, d, 'callejon', 'puerta_trasera', 2); const n = w.npcs.baguette; let bad = 0, faceBad = 0;
  for (let t = 0; t < 120; t += 0.07) { w.time = t; w.updateNPCs(0.016); if (!!n.watching !== legacy(d, t)) bad++; if (n.face !== (n.watching ? 'left' : 'right')) faceBad++; }
  ok(bad === 0, `mundo: Baguette vigila igual que en la v0.7.20 (${d}; ${bad} diferencias)`);
  ok(faceBad === 0, `mundo: Baguette mira a ${'izquierda/derecha'} como antes (${d})`);
});
{ // sorprendido: la frase del vigilante sale de los datos
  const { w } = mkWorld(t1, 'normal', 'callejon', 'puerta_trasera', 2); const p = w.players[1], n = w.npcs.baguette, prop = w.room.props.find((q) => q.id === 'murmullo');
  n.watching = true; p.work = { kind: 'prop', target: prop, step: prop.steps[0], tool: 'grabadora', t: 0, dur: 3, tick: 0, watcher: 'baguette' };
  w.stepWork(p, 0.1);
  ok(!p.work && w.out.some((e) => e.t === 'spotted' && e.npc === 'baguette') && /Gertrudis/.test(n.bubble.text), 'mundo: si mira mientras grabas, te ve y dice su frase');
}

// 3) puerta que se abre sola
{
  const { st, w } = mkWorld(t1, 'normal', 'cocina', 'puerta_trasera', 2); const p = w.players[0], d = w.room.doors.find((x) => x.id === 'puerta_trasera');
  ok(w.doorState(d) === 'auto', 'la puerta trasera del caso 1 es automática en el capítulo 2');
  p.focus = { kind: 'door', d, state: 'auto' }; w.interact(p);
  const toast = w.out.find((e) => e.t === 'toast');
  ok(toast && toast.text === '¡Puerta abierta con la llave de Hogaza!' && st.flags['unlocked_puerta_trasera'], 'caso 1: el aviso de la llave de Hogaza sale de locked.text');
  ok(G.autoDoorText({ locked: { tool: null } }) === '¡Puerta abierta!' && G.autoDoorText({}) === '¡Puerta abierta!', 'sin texto propio el aviso es neutro (no nombra a nadie)');
}

// 4) tiempo agotado
ok(/concurso/.test(G.timeoutLines(t1)[0].text) && G.timeoutLines(t1)[0].who === 'hogaza', 'caso 1: «se acabó el tiempo» sale de epilogue.timeout');
const gen = G.generateCase(11), gdef = gen.def;
ok(G.timeoutLines(gdef)[0].who === gdef.clientId && !/concurso|Hogaza/.test(G.timeoutLines(gdef)[0].text), 'un caso generado usa su propio cliente y un texto neutro');

// 5) un caso distinto con su propio vigilante (otro personaje, sala, ritmo, caras y frase)
const placeNpc = Object.keys(gdef.placement)[0], placeRoom = gdef.placement[placeNpc][0].room, ch0 = gdef.placement[placeNpc][0].ch;
const mkSyn = (mut) => {
  const d = clone(gdef); const room = d.rooms[placeRoom], occ = {};
  room.props.forEach((p) => { for (let x = 0; x < (p.w || 1); x++) for (let y = 0; y < (p.h || 1); y++) occ[(p.x + x) + ',' + (p.y + y)] = 1; });
  room.doors.forEach((dr) => { occ[dr.x + ',' + dr.y] = 1; occ[dr.x + ',' + (dr.y + 1)] = 1; });
  let spot = null; for (let y = 2; y < room.map.length - 2 && !spot; y++) for (let x = 2; x < room.map[0].length - 2 && !spot; x++) if (room.map[y][x] === '.' && !occ[x + ',' + y]) spot = { x, y };
  room.props.push({ id: 'espia', sprite: null, x: spot.x, y: spot.y, solid: false, label: 'Charla sospechosa', shimmer: true, listen: true, watcher: placeNpc, steps: [{ tool: 'grabadora', time: 3.0, who: 'luna', text: 'REC. Un secreto a voces.' }] });
  d.npcs[placeNpc].watch = { period: { normal: 8, hard: 7 }, look: { normal: 2, hard: 2.5 }, offset: 1, face: { watching: 'right', idle: 'left' }, spotted: '¡Alto ahí, curiosos!' };
  if (mut) mut(d); return d;
};
const syn = mkSyn(); const vs = G.validateCase(syn);
ok(vs.ok && vs.warnings.length === 0, 'caso distinto con vigilante propio: validateCase sin errores ni avisos ' + JSON.stringify(vs.errors.concat(vs.warnings)));
{
  const cfg = G.watchConfig(syn, placeNpc);
  ok(cfg.period.normal === 8 && cfg.look.hard === 2.5 && cfg.offset === 1 && cfg.face.watching === 'right' && cfg.spotted === '¡Alto ahí, curiosos!', 'ajustes propios del personaje');
  ok(near(G.watchSafeSeconds(cfg, 'normal'), 6) && near(G.watchSafeSeconds(cfg, 'hard'), 4.5), 'ventana segura calculada con sus ritmos');
  ['easy', 'normal', 'hard'].forEach((d) => {
    const { w } = mkWorld(syn, d, placeRoom, null, ch0); const n = w.npcs[placeNpc]; let bad = 0, faceBad = 0;
    for (let t = 0; t < 100; t += 0.07) {
      w.time = t; w.updateNPCs(0.016);
      const exp = d !== 'easy' && ((t + 1) % (d === 'hard' ? 7 : 8)) > (d === 'hard' ? 7 - 2.5 : 8 - 2);
      if (!!n.watching !== exp) bad++; if (n.face !== (n.watching ? 'right' : 'left')) faceBad++;
    }
    ok(bad === 0 && faceBad === 0, `mundo: el vigilante de otro caso sigue SU ritmo y SUS caras (${d}; ${bad}/${faceBad} diferencias)`);
  });
  const { w } = mkWorld(syn, 'normal', placeRoom, null, ch0); const p = w.players[1], n = w.npcs[placeNpc], prop = w.room.props.find((q) => q.id === 'espia');
  n.watching = true; p.work = { kind: 'prop', target: prop, step: prop.steps[0], tool: 'grabadora', t: 0, dur: 3, tick: 0, watcher: placeNpc };
  w.stepWork(p, 0.1);
  ok(!p.work && n.bubble && n.bubble.text === '¡Alto ahí, curiosos!', 'mundo: te ve y dice la frase de SU caso');
  // un personaje que no vigila nada en esta sala no se vuelve vigilante
  const other = Object.keys(gdef.npcs).find((k) => k !== placeNpc && gdef.placement[k] && gdef.placement[k].some((pl) => pl.room === placeRoom && pl.ch === ch0));
  if (other) { const o = w.npcs[other]; let ever = false; for (let t = 0; t < 40; t += 0.1) { w.time = t; w.updateNPCs(0.016); if (o.watching) ever = true; } ok(!ever, 'un personaje sin objeto vigilado no vigila'); }
}

// 6) el validador rechaza lo imposible o absurdo
const errs = (d) => G.validateCase(d).errors.join(' | ');
ok(/gato/.test(errs(mkSyn((d) => { d.npcs[placeNpc].cat = true; }))), 'validador: un gato no puede vigilar');
ok(/nunca está en la sala/.test(errs(mkSyn((d) => { const o = Object.keys(d.rooms).find((r) => r !== placeRoom); const p = d.rooms[placeRoom].props.pop(); p.x = 3; p.y = 3; d.rooms[o].props.push(p); }))), 'validador: el vigilante debe estar en la sala del objeto');
ok(/ventana segura/.test(errs(mkSyn((d) => { d.rooms[placeRoom].props.find((p) => p.id === 'espia').steps[0].time = 6.5; }))), 'validador: acción más larga que la ventana segura (bug de la v0.5.1)');
ok(/ventana segura/.test(errs(mkSyn((d) => { d.npcs[placeNpc].watch.look.hard = 5.5; }))), 'validador: mira demasiado en Difícil');
ok(/menor que el ciclo/.test(errs(mkSyn((d) => { d.npcs[placeNpc].watch.look.normal = 9; }))), 'validador: mirar ≥ ciclo es absurdo');
ok(/no es un personaje/.test(errs(mkSyn((d) => { d.rooms[placeRoom].props.find((p) => p.id === 'espia').watcher = 'nadie'; }))), 'validador: vigilante inexistente');
ok(/watch/.test(G.checkCaseFormat(mkSyn((d) => { d.npcs[placeNpc].watch.rapido = true; })).errors.join(' | ')), 'formato: campo desconocido en watch');
ok(/watch/.test(G.checkCaseFormat(mkSyn((d) => { d.npcs[placeNpc].watch.face.idle = 'arriba'; })).errors.join(' | ')), 'formato: cara inexistente');
ok(/no se usa/.test(G.validateCase(mkSyn((d) => { d.rooms[placeRoom].props = d.rooms[placeRoom].props.filter((p) => p.id !== 'espia'); })).warnings.join(' | ')), 'validador: avisa de un «watch» que ningún objeto usa');
ok(G.validateCase(mkSyn((d) => { delete d.npcs[placeNpc].watch; })).ok, 'sin «watch» valen los valores por defecto (3,0 s de grabación caben en 4,8 y 4,0 s)');
ok(/ventana segura/.test(errs(mkSyn((d) => { delete d.npcs[placeNpc].watch; d.rooms[placeRoom].props.find((p) => p.id === 'espia').steps[0].time = 3.1; }))) && !/en normal/.test(errs(mkSyn((d) => { delete d.npcs[placeNpc].watch; d.rooms[placeRoom].props.find((p) => p.id === 'espia').steps[0].time = 3.1; }))), 'con los valores por defecto, 3,1 s fallan solo en Difícil (4,0 < 4,1)');
ok(G.checkCaseFormat(mkSyn((d) => { d.epilogue.timeout = [{ who: d.clientId, text: 'Tarde.' }]; })).errors.length === 0, 'formato: epilogue.timeout opcional válido');
ok(G.checkCaseFormat(mkSyn((d) => { d.epilogue.timeout = []; })).errors.length > 0, 'formato: epilogue.timeout vacío se rechaza');

// 6) 4C-2b-2: la IA del compañero ESPERA la ventana segura (casos generados con vigilante, Normal y Difícil, varios ritmos)
{
  const found = []; const rhythms = {};
  for (let sd = 1; found.length < 6 && sd < 3000; sd += 7) {
    const r = G.generateCase(sd); if (!r.def) continue;
    const rn = Object.keys(r.def.rooms).find((k) => r.def.rooms[k].props.some((q) => q.watcher)); if (!rn) continue;
    const key = JSON.stringify(r.def.npcs[r.def.rooms[rn].props.find((q) => q.watcher).watcher].watch.period || 'defecto'); if (rhythms[key] && Object.keys(rhythms).length < 3) continue; rhythms[key] = 1;
    found.push({ def: r.def, room: rn });
  }
  ok(found.length === 6 && Object.keys(rhythms).length >= 3, `hay casos generados con vigilante y ≥ 3 ritmos distintos (${Object.keys(rhythms).join(' / ')})`);
  const run = (f, diff, patient) => {
    const st = new G.CaseState(f.def, diff), w = new G.World(st, { mode: 'solo' }); w.enterRoom(f.room); w.onChapter(); w.out.length = 0;
    if (!patient) w.watchClear = () => true;
    const prop = w.room.props.find((q) => q.watcher), ai = w.players[1 - w.human], clue = prop.steps[0].clue;
    ai.x = (prop.x + 0.5) * G.TS; ai.y = (prop.y + 2) * G.TS; w.dispatch(ai, { kind: 'prop', p: prop, step: prop.steps[0] });
    let spotted = 0; for (let t = 0; t < 60 && !st.hasClue(clue); t += 0.05) { w.update(0.05, true); spotted += w.out.filter((e) => e.t === 'spotted').length; w.out.length = 0; }
    return { spotted, got: st.hasClue(clue) };
  };
  let waited = 0, total = 0, impatient = 0;
  found.forEach((f) => ['normal', 'hard'].forEach((d) => { total++; const a = run(f, d, true); if (a.got && a.spotted === 0) waited++; if (run(f, d, false).spotted > 0) impatient++; }));
  ok(waited === total, `la IA consigue la pista sin que la vean nunca (${waited}/${total} casos y dificultades)`);
  ok(impatient > 0, `control negativo: si la IA no esperara, el vigilante la pillaría (${impatient}/${total})`);
}
console.log(fails ? `\n${fails} fallo(s) de ${checks}` : `Vigilante y textos por datos: ${checks} comprobaciones OK`);
process.exit(fails ? 1 : 0);
