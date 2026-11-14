// Prueba de las ESCENAS CON ALIADO DE POLICÍA (4C-3b-2): cada caso generado puede llevar un policía que ayuda poco y nunca resuelve, con su escena (exterior con coche patrulla, comisaría, interrogatorio o reconstrucción).
// Comprueba en 5000 semillas: todas aceptadas, ≥ 50 % con aliado, los 4 tipos de escena y los 3 rangos aparecen, el objeto de escena está en su hueco reservado (el coche, de 2 baldosas, solo en calle), el aliado está en esa sala sobre una baldosa libre de la fila de personajes,
// NO resuelve el caso (ni nombra a ningún sospechoso, ni da pistas, banderas o descartes: sus respuestas son texto sin efectos), el parte coincide con la ventana del robo y el consejo apunta al lugar de una pista de objeto, el aliado no es sospechoso,
// el bot gana una muestra, determinismo, el caso 1 no cambia. Uso: node test_ally.js [semillas]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || (+process.env.SEEDS ? Math.min(5000, +process.env.SEEDS) : 5000);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const A = G.GEN_DATA.compile.ally, ALLT = [].concat(...Object.values(G.GEN_DATA.rooms)), PL = {}; G.GEN_DATA.places.forEach((p) => { PL[p.id] = p; });

ok('bancos: 4 escenas, 3 rangos con nombres y aspectos que existen, 3 personas con 3 saludos, 3 partes, 3 consejos, 3 teorías, 4 charlas y 2 de cada reacción',
  Object.keys(A.kinds).length === 4 && Object.keys(A.ranks).length === 3 && Object.values(A.ranks).every((r) => r.names.length >= 3 && r.looks.every((l) => G.LOOKS[l]) && G.POLICE_LOOKS[r.title.toLowerCase()].join() === r.looks.join()) && Object.keys(A.personas).length === 3 &&
  Object.values(A.personas).every((p) => p.first.length === 3 && p.hecho.length === 3 && p.mira.length === 3 && p.error.length === 3 && p.chat.length === 4 && p.press.length === 2 && p.deny.length === 2) && Object.values(A.kinds).every((k) => G.spr[k.sprite]));
ok('cada plantilla tiene el hueco de escena y las de calle el del coche', ALLT.every((t) => t.special.escena && (t.scene === 'calle') === !!t.special.coche));

let rejected = 0, withAlly = 0, why = '', kinds = {}, ranks = {}, pers = {}, bits = { room: 0, spot: 0, car: 0, tile: 0, fx: 0, name: 0, window: 0, hint: 0, susp: 0, raw: 0, label: 0, dupNpc: 0 };
const say = (x) => (Array.isArray(x) ? x : (x && x.say) || []);
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s), def = r.def; if (!def) { rejected++; why = why || `semilla ${s}: ${r.error}`; continue; }
  const n = def.npcs.aliado; if (!n) continue; withAlly++;
  const pl = (def.placement.aliado || [])[0], rm = def.rooms[pl && pl.room], b = r.bible;
  if (!rm) { bits.room++; continue; }
  const t = ALLT.filter((x) => x.id === rm.template)[0], pr = rm.props.filter((p) => /^poli_/.test(p.id)), spr = pr.map((p) => p.sprite).join();
  const kind = Object.keys(A.kinds).filter((k) => A.kinds[k].sprite === (pr[0] && pr[0].sprite))[0]; kinds[kind] = (kinds[kind] || 0) + 1;
  ranks[n.title] = (ranks[n.title] || 0) + 1;
  if (kind === 'exterior') { const c = pr.find((p) => p.id === 'poli_coche'), q = pr.find((p) => p.id === 'poli_cono'); if (!(t.scene === 'calle' && c && c.x === t.special.coche.x && c.y === t.special.coche.y && c.w === 2 && c.solid && q && q.x === t.special.escena.x && q.y === t.special.escena.y)) bits.car++; }
  else if (!(t.scene !== 'calle' && pr.length === 1 && pr[0].x === t.special.escena.x && pr[0].y === t.special.escena.y && pr[0].solid)) bits.spot++;
  // el aliado va en la fila de personajes (5..11, 5), sin pisar a nadie de esa sala
  const same = Object.keys(def.placement).filter((id) => id !== 'aliado' && def.placement[id].some((q) => q.room === pl.room && q.x === pl.x && q.y === pl.y));
  if (pl.y !== 5 || pl.x < 5 || pl.x > 11 || same.length) bits.tile++;
  // NUNCA resuelve: sus respuestas son solo texto (sin pistas, banderas ni descartes) y no nombra a nadie del caso
  const all = JSON.stringify(n), allText = n.topics.map((q) => JSON.stringify(q.responses)).join('') + JSON.stringify(n.chat) + JSON.stringify(n.first);
  if (n.topics.some((q) => JSON.stringify(q.responses).indexOf('"fx"') >= 0 || JSON.stringify(q.responses).indexOf('clue') >= 0) || n.evidence['*'].some((e) => e.fx)) bits.fx++;
  if (b.cast.some((c) => allText.indexOf(c.name) >= 0 || allText.indexOf(c.name.split(' ')[0] + ' ') >= 0 && c.name.split(' ')[0].length > 3)) bits.name++;
  if (/\{\w+\}|undefined|\[object|(?:^|[^\p{L}\p{N}_])(?:de|a) el /iu.test(all)) bits.raw++;
  // el parte cuenta la ventana del robo y el objeto; el consejo apunta al lugar de una pista de objeto
  const hecho = n.topics.find((q) => q.id === 'a_hecho'), mira = n.topics.find((q) => q.id === 'a_mira'), W = b.truth.window;
  if (!hecho || hecho.responses[0][0].indexOf(G.minToStr(W.from)) < 0 || hecho.responses[0][0].indexOf(G.minToStr(W.to)) < 0) bits.window++;
  const propPlaces = b.clues.filter((c) => c.source.type === 'prop').map((c) => PL[c.source.place].loc);
  if (!mira || !propPlaces.some((l) => mira.responses[0][0].indexOf(l) >= 0)) bits.hint++;
  if (def.suspects.some((q) => q.id === 'aliado') || def.clues.aliado || (def.solution && def.solution.culprit === 'aliado')) bits.susp++;
  if (n.title.toLowerCase() !== Object.keys(A.ranks).filter((k) => A.ranks[k].looks.indexOf(n.look) >= 0)[0]) bits.label++;
}
const pct = withAlly / (N - rejected);
ok(`${N} semillas: todas generan un caso aceptado`, rejected === 0, why);
ok(`al menos el 50 % de los casos llevan aliado (${(pct * 100).toFixed(0)} %)`, pct >= 0.5 && pct <= 0.85, pct);
ok(`aparecen las 4 escenas ${JSON.stringify(kinds)} y los 3 rangos ${JSON.stringify(ranks)}, y ninguna escena pasa del 40 %`, Object.keys(kinds).length === 4 && Object.keys(ranks).length === 3 && Math.max(...Object.values(kinds)) / withAlly <= 0.4, JSON.stringify(kinds));
ok('el objeto de escena está en su hueco reservado (el coche, de 2 baldosas, solo en calle; con su cono)', bits.room === 0 && bits.spot === 0 && bits.car === 0, JSON.stringify(bits));
ok('el aliado está en la fila de personajes de su sala y no pisa a nadie', bits.tile === 0, bits.tile);
ok('NO resuelve el caso: sus respuestas no dan pistas, banderas ni descartes y no nombra a ningún personaje', bits.fx === 0 && bits.name === 0, JSON.stringify(bits));
ok('el parte coincide con la ventana del robo y el consejo apunta al lugar de una pista de objeto', bits.window === 0 && bits.hint === 0, JSON.stringify(bits));
ok('el aliado no es sospechoso ni culpable, su rango coincide con su aspecto y no hay marcadores sueltos ni «de el»', bits.susp === 0 && bits.label === 0 && bits.raw === 0, JSON.stringify(bits));

// el bot juega y gana una muestra (con aliado y sin él) y la huella lo refleja
{ let n = 0, win = 0, fin = 0, conAliado = 0, why2 = '';
  for (let s = 0; s < 300; s++) { const r = G.generateCase(s * 17 + 3); if (!r.def) continue; n++; if (r.def.npcs.aliado) conAliado++; const q = G.qualityCase(r.def); if (q.bot.finished) fin++; if (q.bot.win) win++; else why2 = why2 || `semilla ${s * 17 + 3}: ${q.quality}`; }
  ok(`bot: ${n} casos jugados (${conAliado} con aliado), ${fin} terminados, ${win} ganados`, n === 300 && fin === n && win === n && conAliado > 100, why2); }
{ const r = G.generateCase(5), fp = G.caseFingerprint(r.def, r.bible); ok('la huella declara el aliado («' + fp.ally + '») y forma parte de la clave', /^(exterior|comisaria|interrogatorio|reconstruccion):(agente|inspector|comisario)$/.test(fp.ally) && fp.key.indexOf(fp.ally) >= 0); }
{ const a = JSON.stringify(G.generateCase(4321).def), c = JSON.stringify(G.generateCase(4321).def); ok('determinismo: la misma semilla da el mismo caso, el mismo aliado y la misma escena', a === c); }
ok('el caso 1 no cambia (idéntico byte a byte) y no tiene aliado', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok && !G.CASES.tarta.npcs.aliado);
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
