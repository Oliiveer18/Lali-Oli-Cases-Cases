// Prueba de las mecánicas de los casos generados: herramientas (4C-1b: lupa, ganzúa y luz UV) y empujar (4C-2b-1), elegidas por el compilador desde la semilla.
// Comprueba: bancos de texto, 5000 semillas aceptadas con ≥ 1 herramienta, cada herramienta ≤ 1 vez por caso, pista adecuada en su hueco (ganzúa → documento en la «cerradura»;
// uv → documento con tinta invisible en el «rincón oscuro»; lupa → física o foto en un hueco normal), quien habla es quien lleva la herramienta, nada se pisa,
// los 7 conjuntos aparecen y ninguno domina, el bot juega y gana una muestra, determinismo y caso 1 intacto. Uso: node test_mech.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const M = G.GEN_DATA.compile.mech, RT = G.GEN_DATA.rooms, ALLT = [].concat(...Object.values(G.GEN_DATA.rooms)), TOOLS = ['lupa', 'ganzua', 'uv'];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// ---- 4C-2b-1 · PRIMERO el bot: ¿entiende empujar (`coop`), mover (`fx.moveProp`) y lo oculto por bandera (`visible`)? El caso 1 ya lo usa (nevera). Se comprueba antes de generar nada con empujar.
{ const r = G.botPlay(G.CASES.tarta), log = r.log || [];
  const iPush = log.findIndex((l) => /examina Nevera pesadísima/.test(l)), iClue = log.findIndex((l) => /examina Cuenco escondido → glaseado_salado/.test(l));
  ok('bot: gana el caso 1 y aparta la nevera (coop + moveProp) ANTES de coger la pista que estaba detrás (visible por bandera)', r.finished && r.win && iPush >= 0 && iClue > iPush, `win ${r.win} · empujar ${iPush} · pista ${iClue}`);
  const d = JSON.parse(JSON.stringify(G.CASES.tarta)); const nv = d.rooms.cocina.props.find((p) => p.id === 'nevera'); delete nv.steps[0].fx.flag;
  const v = G.validateCase(d), r2 = G.botPlay(d);
  ok('control negativo: si empujar no pone la bandera, la pista queda oculta para siempre; el validador lo rechaza y el bot no la consigue', !v.ok && !(r2.log || []).some((l) => /glaseado_salado/.test(l)), `validador ${v.ok} · bot ${r2.win}`); }
ok('bancos: 7 conjuntos (todas las combinaciones de lupa, ganzúa y uv) y 3 frases o más por herramienta', M.sets.length === 7 && new Set(M.sets.map((x) => x.slice().sort().join())).size === 7 && M.sets.every((x) => x.every((t) => TOOLS.indexOf(t) >= 0)) && TOOLS.every((t) => M[t].length >= 3 && M[t].every((x) => typeof x === 'string' && /[.!]$/.test(x))));
ok('las herramientas las llevan Oli (lupa, ganzúa) y Lali (uv)', G.toolOwner('lupa') === 'rex' && G.toolOwner('ganzua') === 'rex' && G.toolOwner('uv') === 'luna');
ok('cada plantilla (todas las variantes) tiene sitio para la ganzúa (cerradura) y la luz UV (rincón)', ALLT.every((t) => t.special.cerradura && t.special.rincon));

const N = +process.env.SEEDS ? Math.min(5000, +process.env.SEEDS) : 5000; let rejected = 0, noTool = 0, dup = 0, wrongWho = 0, wrongSpot = 0, wrongClue = 0, overlap = 0, uvBad = 0, lockBad = 0, lostClue = 0, why = '';
const mechs = {}, mechAll = {}, sets = {}; let pushCases = 0, pushBad = 0, hiddenBad = 0, blocked = 0, pushMany = 0; const PK = M.pushKinds; const pushSeeds = [];
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s), def = r.def;
  if (!def) { rejected++; why = why || `semilla ${s}: ${r.error}`; continue; }
  const used = {}, solidTiles = {};
  const fp = G.caseFingerprint(def, r.bible); mechAll[fp.mechanic] = (mechAll[fp.mechanic] || 0) + 1; { const bs = fp.mechanic.split('+').filter((x) => x !== 'empujar' && x !== 'sigilo' && x !== 'grabadora').join('+') || 'solo_leer'; mechs[bs] = (mechs[bs] || 0) + 1; }
  Object.keys(def.rooms).forEach((rid) => {
    const rm = def.rooms[rid], t = ALLT.filter((x) => x.id === rm.template)[0];
    rm.props.forEach((p) => {
      if (p.solid) { const k = rid + p.x + ',' + p.y; if (solidTiles[k]) overlap++; solidTiles[k] = 1; }
      if (p.chat) return; // A4 3/4-b1: la charla grabada es una curiosidad (paso con grabadora SIN pista): se comprueba en test_charlas, no aquí
      (p.steps || []).forEach((st) => {
        if (!st.tool || st.tool === 'coop') return; // empujar (coop) se comprueba aparte
        used[st.tool] = (used[st.tool] || 0) + 1;
        if (st.who !== G.toolOwner(st.tool)) wrongWho++;
        const clue = def.clues[st.clue], tl = st.tool;
        if (!clue) { lostClue++; return; }
        if (tl === 'ganzua') {
          const sp = t.special.cerradura;
          if (clue.kind !== 'documento') wrongClue++;
          if (p.x !== sp.x || p.y !== sp.y) wrongSpot++;
          const open = sp.open === undefined ? 'drawer' : sp.open;
          if (!p.solid || (open ? !(p.swap && p.swap.sprite === open && p.swap.flag === st.fx.flag) : !!p.swap) || !st.fx || !st.fx.flag) lockBad++;
        } else if (tl === 'uv') {
          const sp = t.special.rincon;
          if (clue.kind !== 'documento' && !(G.GEN_VERSION >= 7 && clue.kind === 'física')) wrongClue++; // c4-2b-1: en v7 la UV también toma objetos físicos (mancha)
          if (p.x !== sp.x || p.y !== sp.y) wrongSpot++;
          if (!p.uvOnly || p.solid || p.sprite !== 'uv_text') uvBad++;
        } else if (tl === 'lupa') {
          if (clue.kind !== 'física' && clue.kind !== 'grabación') wrongClue++;
          if (!t.slots.some((q) => q[0] === p.x && q[1] === p.y)) wrongSpot++;
        }
      });
    });
  });
  { // empujar: objeto pesado en el hueco «empujable» + pista física o documento oculta en la baldosa que deja libre
    let n = 0;
    Object.keys(def.rooms).forEach((rid) => {
      const rm = def.rooms[rid], t = ALLT.filter((x) => x.id === rm.template)[0];
      rm.props.filter((p) => (p.steps || []).some((s) => s.tool === 'coop')).forEach((p) => {
        n++; const s0 = p.steps[0], mv = s0.fx && s0.fx.moveProp, sp = t.special.empujable, cid = p.id.replace(/^push_/, ''), hid = rm.props.filter((q) => q.id === 'obj_' + cid)[0], clue = def.clues[cid];
        if (p.x !== sp.x || p.y !== sp.y || !p.solid || s0.who !== 'luna' || !mv || mv.id !== p.id || mv.dx !== sp.dx || mv.dy !== sp.dy || !s0.fx.flag || s0.clue) pushBad++;
        if (!hid || hid.x !== sp.x || hid.y !== sp.y || hid.solid || !hid.visible || hid.visible.flag !== s0.fx.flag || !clue || PK.indexOf(clue.kind) < 0 || hid.steps[0].tool || hid.steps[0].clue !== cid || M.hidden[clue.kind].indexOf(hid.sprite) < 0) hiddenBad++;
        const tx = p.x + sp.dx, ty = p.y + sp.dy;
        if (rm.map[ty][tx] === '#' || rm.props.some((q) => q.id !== p.id && q.solid && q.x === tx && q.y === ty)) blocked++;
      });
    });
    if (n) { pushCases++; if (pushSeeds.length < 150) pushSeeds.push(s); } if (n > 1) pushMany++;
  }
  sets[Object.keys(used).sort().join('+')] = 1;
  if (!Object.keys(used).length) noTool++;
  if (Object.values(used).some((n) => n > 1)) dup++;
}
ok(`${N} semillas: todas generan un caso aceptado`, rejected === 0, why);
ok('todo caso generado usa al menos una herramienta (ya no hay casos «solo leer»)', noTool === 0 && !mechs.solo_leer, `sin herramienta ${noTool}`);
ok('ninguna herramienta se usa más de una vez por caso', dup === 0);
ok('quien habla en cada paso con herramienta es quien la lleva', wrongWho === 0);
ok('cada herramienta está en su hueco: ganzúa en «cerradura», uv en «rincón oscuro», lupa en un hueco normal', wrongSpot === 0, `${wrongSpot}`);
ok('la pista encaja con la herramienta (documento para ganzúa y uv; física o foto para la lupa)', wrongClue === 0 && lostClue === 0, `${wrongClue}/${lostClue}`);
ok('el cajón (o buzón) cerrado cambia de dibujo al abrirse y el marcado UV solo se ve con luz UV', lockBad === 0 && uvBad === 0, `${lockBad}/${uvBad}`);
ok('ningún objeto sólido pisa a otro en la misma sala', overlap === 0, `${overlap}`);
{ const tot = Object.values(mechs).reduce((a, b) => a + b, 0), top = Math.max(...Object.values(mechs)) / tot;
  const q3 = (mechs['ganzua+lupa+uv'] || 0) / tot; // b2 paso 3 (decisión del usuario, 22 oct): con GEN_VERSION 6 la CUOTA pone lupa, ganzúa y UV en casi todos los casos; la variedad ya no se mide aquí sino en la huella completa (siguiente comprobación)
  ok(G.GEN_VERSION >= 6 ? `cuota de herramientas (GEN_VERSION 6): lupa+ganzúa+UV juntas en ≥ 90 % de los casos (${(q3 * 100).toFixed(0)} %)` : `aparecen los 7 conjuntos de herramientas y ninguno pasa del 40 % (el mayor: ${(top * 100).toFixed(0)} %)`, G.GEN_VERSION >= 6 ? q3 >= 0.9 : Object.keys(mechs).length === 7 && top <= 0.4, JSON.stringify(mechs));
  const tot2 = Object.values(mechAll).reduce((a, b) => a + b, 0), top2 = Math.max(...Object.values(mechAll)) / tot2;
  ok(`con empujar, la huella de mecánicas pasa de 7 a ${Object.keys(mechAll).length} combinaciones y ninguna pasa del 40 % (la mayor: ${(top2 * 100).toFixed(0)} %)`, Object.keys(mechAll).length >= 12 && top2 <= 0.4, JSON.stringify(mechAll));
  ok(`empujar sale en ${(pushCases / N * 100).toFixed(0)} % de los casos (entre el 30 % y el 60 %) y nunca más de una vez por caso`, pushCases / N >= 0.3 && pushCases / N <= 0.6 && pushMany === 0, `${pushCases}/${pushMany}`); }
ok('empujar: el objeto pesado está en el hueco «empujable», lo apartan los dos (Lali, paso coop con bandera y moveProp en la dirección de la plantilla)', pushBad === 0, `${pushBad}`);
ok('empujar: la pista (física o documento) está oculta en la baldosa que queda libre, visible solo con la bandera, y nadie más la usa', hiddenBad === 0, `${hiddenBad}`);
ok('empujar: la baldosa a la que se desliza el objeto está libre (ni pared ni otro objeto sólido)', blocked === 0, `${blocked}`);
ok('bancos de empujar: ≥ 3 frases, ≥ 3 objetos pesados con sprite que existe, sprites de lo oculto que existen', M.push.length >= 3 && M.push.every((x) => /[.!]$/.test(x)) && M.pushables.length >= 3 && M.pushables.every((q) => G.spr[q.sprite] && q.label) && Object.values(M.hidden).every((l) => l.length && l.every((sp) => G.spr[sp])) && typeof M.done.push === 'string');
{ let win = 0, ordered = 0, n = 0, why3 = '';
  pushSeeds.forEach((s) => {
    const def = G.generateCase(s).def, r = G.botPlay(def), log = r.log || [];
    const hid = Object.keys(def.rooms).reduce((a, rid) => a.concat(def.rooms[rid].props.filter((q) => q.visible && q.visible.flag && /^movido_/.test(q.visible.flag) && /^obj_/.test(q.id))), [])[0], cid = hid.id.slice(4);
    const i0 = log.findIndex((l) => /examina (Caja pesadísima|Barril enorme|Carretilla atascada)$/.test(l)), i1 = log.findIndex((l) => l.endsWith('→ ' + cid)); // coincidencia exacta: los ids de pista comparten prefijos
    n++; if (r.win) win++; else why3 = why3 || `semilla ${s}: ${JSON.stringify(r.stuck)}`; if (i0 >= 0 && i1 > i0) ordered++; else why3 = why3 || `semilla ${s}: empujar ${i0}, pista ${i1}`;
  });
  ok(`bot: juega ${n} casos generados con empujar: gana todos, y en todos aparta el objeto antes de coger la pista oculta (${ordered}/${n})`, n >= 100 && win === n && ordered === n, why3); }

// ---- 4C-2b-2 · sigilo: un vigilante generado en la sala de su pista (azar propio, ≤ 1 por caso)
{ let n = 0, w = 0, many = 0, bad = 0, badRoom = 0, badNpc = 0, badSafe = 0, bany = 0, win = 0, ordered = 0, diffs = 0, why4 = ''; const rhy = {}, tools = {}; const strip = (def) => { const d = JSON.parse(JSON.stringify(def)); d.chapters.forEach((c) => c.goals.forEach((g) => { delete g.min; })); /* b2 paso 3: el mínimo del cap. 1 depende de cuántas pistas son libres (la del vigilante no lo es) */ Object.values(d.rooms).forEach((r) => r.props.forEach((q) => { if (q.watcher) { delete q.watcher; delete q.steps[0].time; q.steps[0].text = q.steps[0].text.replace(/^.*?[.!] (?=\S)/, ''); } })); Object.values(d.npcs).forEach((q) => { delete q.watch; }); return JSON.stringify(d); };
  for (let sd = 0; sd < (+process.env.SEEDS ? Math.min(1500, +process.env.SEEDS) : 1500); sd++) { const seed = sd * 11 + 3, r = G.generateCase(seed); if (!r.def) continue; n++;
    const ws = []; Object.keys(r.def.rooms).forEach((rn) => r.def.rooms[rn].props.forEach((q) => { if (q.watcher) ws.push([rn, q]); }));
    if (!ws.length) continue; w++; if (ws.length > 1) many++;
    const [rn, q] = ws[0], st0 = q.steps[0], cl = r.def.clues[st0.clue], nw = r.def.npcs[q.watcher];
    if (!(q.id.indexOf('obj_') === 0 && !st0.tool && st0.time === M.watchTime && (st0.who === 'rex' || st0.who === 'luna') && M.watchKinds.indexOf(cl.kind) >= 0)) bad++;
    if (!((r.def.placement[q.watcher] || []).some((pl) => pl.room === rn)) || nw.cat) badRoom++;
    if (!nw.watch || M.watchSpotted.indexOf(nw.watch.spotted) < 0) badNpc++;
    const cfg = G.watchConfig(r.def, q.watcher); ['normal', 'hard'].forEach((k) => { if (G.watchSafeSeconds(cfg, k) < st0.time + G.WATCH_MARGIN - 1e-9) badSafe++; }); rhy[JSON.stringify(nw.watch.period || 'defecto')] = 1;
    if (Object.values(r.def.npcs).filter((x) => x.watch).length !== 1) bany++;
    if (w <= 150) { const f = G.caseFingerprint(r.def, r.bible); if (!/sigilo/.test(f.mechanic)) bad++; const q2 = G.qualityCase(r.def); if (q2.bot.win && q2.ok) win++; else why4 = why4 || `semilla ${seed}: ${JSON.stringify(q2.bot.stuck)}`; }
    if (w <= 100) { const saved = M.watchChance, savedV6 = M.watchChanceV6, LS = G.GEN_DATA.compile.listen, sl = LS.chance; LS.chance = 0; const r1 = G.generateCase(seed); M.watchChance = 0; M.watchChanceV6 = 0; const r0 = G.generateCase(seed); M.watchChance = saved; M.watchChanceV6 = savedV6; LS.chance = sl; const hasPush = r1.def && Object.values(r1.def.rooms).some((rm) => rm.props.some((q) => /^push_/.test(q.id))); /* b2 paso 3: con GEN_VERSION 6 el sigilo se reserva ANTES que el empujón, así que sin sigilo el empujón puede elegir otra pista; solo se compara donde no hay empujón */ if (!(G.GEN_VERSION >= 6 && hasPush) && (!r1.def || !r0.def || (G.GEN_VERSION >= 6 ? ['clues', 'solution', 'lies', 'suspects'].some((k) => JSON.stringify(r1.def[k]) !== JSON.stringify(r0.def[k])) : strip(r1.def) !== strip(r0.def)))) diffs++; /* b1: la pareja de la charla grabada evita a los vigilantes, así que se compara sin charla */ } }
  ok(`sigilo sale en ${(w / n * 100).toFixed(0)} % de los casos (GEN_VERSION 6, b2 paso 3: probabilidad 0,6 en GEN_VERSION 6: entre 50 y 70 %; antes 25-55 %) y nunca más de un vigilante por caso`, (G.GEN_VERSION >= 6 ? w / n >= 0.5 && w / n <= 0.7 : w / n >= 0.25 && w / n <= 0.55) && many === 0 && bany === 0, `${w}/${n} · varios ${many} · npc con watch ≠ 1: ${bany}`);
  ok('sigilo: la pista es de objeto (física o documento), sin herramienta, con el tiempo del banco y habla Oli o Lali (voz alternada, b1); sale en la huella como «sigilo»', bad === 0, `${bad}`);
  ok('sigilo: el vigilante está en la sala de su pista (placement), no es un gato y trae su frase del banco', badRoom === 0 && badNpc === 0, `sala ${badRoom} · npc ${badNpc}`);
  ok('sigilo: la ventana segura supera la acción + 1 s en Normal y Difícil con cada ritmo', badSafe === 0 && Object.keys(rhy).length >= 3, `${badSafe} · ritmos ${Object.keys(rhy).join(' / ')}`);
  ok('sigilo: sin sigilo (watchChance 0) el mismo caso sale idéntico, salvo el vigilante (azar propio: no altera nada más; con GEN_VERSION 6 se compara la historia: pistas, solución, mentiras y sospechosos, porque la charla con pista evita al vigilante y mueve la colocación — ya ocurría antes del paso 3)', diffs === 0, `${diffs} diferencias`);
  ok(`bot: juega 150 casos con vigilante, gana todos y pasa la puerta de calidad, sin errores graves (${win}/150)`, win === Math.min(150, w) && w >= 150, why4);
  ok('bancos de sigilo: ≥ 3 frases de examen, ≥ 3 frases de «te ven», ≥ 3 ritmos, el tiempo de la acción cabe en la ventana más corta', M.watch.length >= 3 && M.watchSpotted.length >= 3 && M.watchRhythms.length >= 3 && M.watch.concat(M.watchSpotted).every((x) => /[.!?]$/.test(x)) && M.watchTime + G.WATCH_MARGIN <= 3.5); }

// el bot juega y gana una muestra (lo que pide una herramienta se hace con ella) y la nota de calidad la acepta
// S3b-2: la prueba mide lo que es de ESTA prueba (el bot termina, gana y no hay errores graves) POR NIVEL; la nota mínima (QUALITY_MIN = 55) NO se baja
// y su aceptación solo se INFORMA por nivel (Difícil rechaza algunos hoy: es correcto hasta que haya contenido de 4F; decisión del usuario del 20 oct).
{ let fin = 0, win = 0, acc = 0, n = 0, minM = 99, maxM = 0, why2 = ''; const L = {};
  for (let s = 0; s < 300; s++) { const r = G.generateCase(s * 13 + 5); if (!r.def) continue; const q = G.qualityCase(r.def); n++; if (q.bot.finished) fin++; if (q.bot.win) win++; if (q.ok) acc++; else why2 = why2 || `semilla ${s * 13 + 5}: ${q.quality}`; minM = Math.min(minM, q.bot.humanMinutes); maxM = Math.max(maxM, q.bot.humanMinutes);
    const l = (L[q.level] = L[q.level] || { n: 0, ok: 0, acc: 0 }); l.n++; if (q.ok) l.ok++; if (q.accept) l.acc++; }
  console.log('   (informe por nivel) ' + Object.keys(L).map((k) => `${k}: ${L[k].n} casos, ${L[k].ok} sin errores, ${L[k].acc} aceptados por nota`).join(' · '));
  ok(`bot: ${n} casos jugados, ${fin} terminados, ${win} ganados, ${acc} sin errores graves en la puerta de calidad, en cada nivel (duración ${minM}-${maxM} min)`, n === 300 && fin === n && win === n && acc === n && Object.keys(L).every((k) => L[k].ok === L[k].n), why2); }
{ const a = JSON.stringify(G.generateCase(4321).def), b = JSON.stringify(G.generateCase(4321).def); ok('determinismo: la misma semilla da el mismo caso y las mismas herramientas', a === b); }
ok('el caso 1 no cambia (idéntico byte a byte al de la v0.7.24)', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok);
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
