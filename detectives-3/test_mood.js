// Prueba de AMBIENTES (4C-4a): `def.mood` ∈ claro · inquietante · macabro y sus textos oscuros (sin tocar la biblia).
// Comprueba: reparto de G.pickMood; que un caso `claro` NO lleva ninguna frase oscura; que en `macabro` todo personaje tiene su tema «¿Ha notado algo raro?» y cada
// frase oscura lleva su REMATE justo detrás; que los hechos (solución, pistas, mentiras, sospechosos, salas, colocación, capítulos) son los MISMOS en los tres ambientes;
// que el caso 1 no cambia. Uso: node test_mood.js [semillas]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const N = +process.argv[2] || 300;
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const MD = G.GEN_DATA.compile.mood;
const longest = (s) => String(s).split(/\{\w+\}/).reduce((a, b) => (b.length > a.length ? b : a), '').trim(); // el trozo literal más largo (el resto son variables)
// todos los textos oscuros de los bancos: los pares [susto, remate] y los textos sueltos
const pairs = [], singles = [];
const walk = (x) => { if (typeof x === 'string') singles.push(x); else if (Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string') pairs.push(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
walk(MD.tone); walk(MD.traits); walk(MD.ally); walk(G.GEN_DATA.clueTpl.matiz); walk(G.GEN_DATA.compile.macabro.sit.items); walk(G.GEN_DATA.compile.macabro.giro); // 4C-4c-2: situaciones macabras y giro del testigo también son «oscuros»
const frags = singles.concat(...pairs).map(longest).filter((s) => s.length >= 14);
ok('bancos oscuros: el reparto es 50/32/18 y los tres ambientes existen', G.MOODS.join() === 'claro,inquietante,macabro' && G.MOOD_WEIGHTS.claro === 50 && G.MOOD_WEIGHTS.inquietante === 32 && G.MOOD_WEIGHTS.macabro === 18);
ok(`bancos oscuros: ${pairs.length} pares [susto, remate], todos con las dos partes escritas`, pairs.length >= 100 && pairs.every((p) => p[0].trim() && p[1].trim()), `${pairs.length}`);

// 1) reparto por semilla (azar propio)
{ const c = { claro: 0, inquietante: 0, macabro: 0 }; for (let s = 1; s <= 5000; s++) c[G.pickMood(s)]++;
  const pm = c.macabro / 5000;
  ok(`reparto de G.pickMood en 5000 semillas: ${JSON.stringify(c)} (macabro ${(pm * 100).toFixed(1)} %, meta 12-25 %)`, c.claro > 0 && c.inquietante > 0 && pm >= 0.12 && pm <= 0.25);
  ok('G.pickMood es determinista', G.pickMood(77) === G.pickMood(77)); }

// 2) casos en los tres ambientes con la misma semilla
let gen = 0, fail = 0, factsBad = 0, claroDark = 0, claroTopics = 0, macNoTopic = 0, macNoRemate = 0, inqHave = 0, inqTot = 0, epilogueBad = 0, forcedBad = 0, aliadoBad = 0, aliadoN = 0, titleSame = 0;
// HECHOS = lo que decide si el caso es justo. Desde 4C-4b el ambiente añade objetos de decoración (charcos, mancha, silla, ventana con sombra) y desde 4C-4c-1 añade un matiz al TEXTO de unas pistas:
// y desde 4D-2 el RELLENO de curiosidades `cur_*` (opcional, sin pista ni banderas, R-4/R-5): se coloca DESPUÉS de los objetos de ambiente y por eso su número y su baldosa dependen del ambiente; tampoco es un hecho y se quita antes de comparar (como en test_filler.js);
// y desde 4C-4c-2 las situaciones macabras `sit_*` (objetos sin pista) y el tema `f_giro` (solo texto); ninguna de estas cosas es un hecho, así que se quitan antes de comparar (los puntos, fuentes, iconos y tipos de cada pista sí se comparan).
const AT = G.GEN_DATA.compile.atmos, ATS = new Set(AT.puddles.concat([AT.stain, AT.window, AT.chair]));
const noAtmos = (rooms) => JSON.parse(JSON.stringify(rooms, (k, v) => (Array.isArray(v) && ['props', 'decals', 'decor'].indexOf(k) >= 0 ? ((f) => (f.length || k === 'props' ? f : undefined))(v.filter((q) => !(q && (q.id === 'amb_silla' || String(q.id).indexOf('sit_') === 0 || String(q.id).indexOf('cur_') === 0 || ATS.has(q.sprite))))) : v)));
const noText = (clues) => Object.keys(clues).map((k) => { const c = Object.assign({}, clues[k]); delete c.text; return [k, c]; });
const MZ = []; Object.values(G.GEN_DATA.clueTpl.matiz).forEach((o) => Object.values(o).forEach((a) => a.forEach((p) => MZ.push(JSON.stringify(' ' + p[0] + ' ' + p[1]).slice(1, -1)))));
const noMatiz = (s) => MZ.reduce((a, m) => a.split(m).join(''), s); // las salas COPIAN el texto de la pista, y ahí sí aparece el matiz (solo texto, no es un hecho)
// desde A4 3/4-b1 la charla grabada (`chat.lines[].text`) y el texto de los pasos llevan sabor del ambiente: es solo texto, no un hecho (se conservan quién habla, herramientas, tiempos y sitios)
const noStepText = (rooms) => { Object.values(rooms).forEach((rm) => rm.props.forEach((p) => { (p.steps || []).forEach((st) => { delete st.text; }); if (p.chat) (p.chat.lines || []).forEach((l) => { delete l.text; }); })); return rooms; };
const facts = (d) => noMatiz(JSON.stringify([d.solution, noText(d.clues), d.lies, d.suspects, noStepText(noAtmos(d.rooms)), d.placement, d.chapters, Object.keys(d.npcs)]));
for (let s = 1; s <= N; s++) {
  const R = {}; let skip = false;
  G.MOODS.forEach((m) => { const r = G.generateCase(s, { mood: m }); if (!r.def) { skip = true; fail++; } else R[m] = r.def; });
  if (skip) continue; gen++;
  if (R.claro.mood !== 'claro' || R.inquietante.mood !== 'inquietante' || R.macabro.mood !== 'macabro') forcedBad++;
  if (facts(R.claro) !== facts(R.inquietante) || facts(R.claro) !== facts(R.macabro)) factsBad++;
  // claro: ni un tema oscuro ni una frase de los bancos oscuros
  const js = JSON.stringify(R.claro);
  if (frags.some((f) => js.indexOf(f.replace(/"/g, '\\"')) >= 0)) claroDark++;
  if (Object.keys(R.claro.npcs).some((k) => R.claro.npcs[k].topics.some((t) => t.id === 'f_raro' || t.id === 'a_noche' || t.id === 'f_giro'))) claroTopics++;
  if (R.claro.epilogue.win.length >= R.macabro.epilogue.win.length || R.macabro.epilogue.win.length !== R.claro.epilogue.win.length + 1 || R.macabro.epilogue.win.slice(-1)[0].who !== 'luna' || R.inquietante.epilogue.win.length !== R.claro.epilogue.win.length + 1) epilogueBad++;
  if (R.claro.title === R.macabro.title || R.claro.blurb === R.macabro.blurb) titleSame++;
  // macabro: todo personaje (menos gatos y el aliado) tiene el tema «raro» y cada frase lleva susto + remate seguidos
  Object.keys(R.macabro.npcs).filter((k) => !R.macabro.npcs[k].cat && k !== 'aliado').forEach((k) => {
    const t = R.macabro.npcs[k].topics.find((x) => x.id === 'f_raro');
    if (!t) { macNoTopic++; return; }
    const txt = t.responses[0][0], hit = pairs.some((p) => { const a = txt.indexOf(longest(p[0])), b = txt.indexOf(longest(p[1])); return a >= 0 && b > a; });
    if (!hit) macNoRemate++;
  });
  Object.keys(R.inquietante.npcs).filter((k) => !R.inquietante.npcs[k].cat && k !== 'aliado').forEach((k) => { inqTot++; if (R.inquietante.npcs[k].topics.some((x) => x.id === 'f_raro')) inqHave++; });
  // aliado: el tema de la noche solo en no-claro, y con remate
  ['inquietante', 'macabro'].forEach((m) => { const al = R[m].npcs.aliado; if (!al) return; aliadoN++; const t = al.topics.find((x) => x.id === 'a_noche'); if (!t || !pairs.some((p) => { const x = t.responses[0][0], a = x.indexOf(longest(p[0])), b = x.indexOf(longest(p[1])); return a >= 0 && b > a; })) aliadoBad++; });
}
ok(`${gen} semillas × 3 ambientes generados sin fallos (${fail} fallos)`, fail === 0 && gen >= N * 0.98);
ok('el ambiente pedido se refleja en def.mood', forcedBad === 0, `${forcedBad}`);
ok('los HECHOS no cambian con el ambiente: solución, pistas (todo menos el texto), mentiras, sospechosos, salas (sin objetos de ambiente), colocación y capítulos idénticos', factsBad === 0, `${factsBad} casos`);
ok('ningún caso `claro` lleva una frase oscura de los bancos ni temas «raro» o «noche»', claroDark === 0 && claroTopics === 0, `${claroDark} con frase, ${claroTopics} con tema`);
ok('título y sinopsis cambian en los casos oscuros', titleSame === 0, `${titleSame}`);
ok('`macabro`: todo personaje tiene «¿Ha notado algo raro?»', macNoTopic === 0, `${macNoTopic} sin tema`);
ok('`macabro`: cada frase oscura lleva su remate justo detrás (par susto + remate)', macNoRemate === 0, `${macNoRemate} sin remate`);
ok(`\`inquietante\`: uno de cada dos personajes tiene el tema «raro» (${(inqHave / inqTot * 100).toFixed(0)} %)`, inqHave / inqTot >= 0.4 && inqHave / inqTot <= 0.6);
ok(`el aliado de policía (${aliadoN} casos) tiene su tema de la noche con remate en los ambientes oscuros`, aliadoBad === 0 && aliadoN > 0, `${aliadoBad}`);
ok('el epílogo oscuro añade UNA línea final de Lali con escalofrío (en inquietante y macabro)', epilogueBad === 0, `${epilogueBad}`);
// 3) el ambiente por defecto sale de la semilla y el caso 1 no cambia
{ const r = G.generateCase(11), r2 = G.generateCase(11);
  ok('sin pedirlo, el ambiente sale de la semilla (G.pickMood) y es reproducible', r.def.mood === G.pickMood(11) && JSON.stringify(r.def) === JSON.stringify(r2.def)); }
{ let h = 0; const j = JSON.stringify(G.CASES.tarta); for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) >>> 0;
  ok('caso 1 intacto (hash 74937935) y sin campo `mood`', h === 74937935 && G.CASES.tarta.mood === undefined, String(h)); }
console.log(bad ? `✗ ${bad} fallos` : '✓ ambientes: todo en orden');
process.exit(bad ? 1 : 0);
