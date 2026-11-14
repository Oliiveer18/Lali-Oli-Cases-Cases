// c4-3 3/4-b (cp. 243-244): CHARLA SEÑUELO, parte 2 (compile.js). Una a una: node test_charla_senuelo_b.js [N=100]
// Interruptor `charlaSenuelos` encendido en memoria (v7). (1) la falsa-grabación nunca recibe lupa. (2) se monta como CHARLA GRABADA con pareja libre (sin gatos, sin vigilante, sin repetir
// pareja de otra charla, sin el sujeto de la pista), en una sala con una sola charla; no cuenta en g1 ni g2c ni pide lupa; si no se monta, la pista vuelve a su tipo anterior y es un objeto normal. El bot gana.
// Mutaciones: sin filtro de lupa del señuelo · la charla señuelo cuenta como real (pide lupa) · cuenta en «Busca pistas» · el sujeto charla de sí mismo · no vuelve a su tipo anterior.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'], N = +process.argv[2] || 100;
let bad = 0, checks = 0; const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } }; // OJO: (mensaje, condición); en otras pruebas c4 el orden está al revés y NO falla nunca (ver cp. 243)
const props_len = (def, bible) => Object.keys(def.rooms).reduce((a, p) => a + (def.rooms[p].props || []).filter((q) => q.listen && !bible.clues.some((c) => c.kindAntes && q.id === 'obj_' + c.id)).length, 0); // charlas REALES montadas
function medir(patch, n) { // suma de los 3 niveles
  const on = mutador('gen_data.js', 'charlaSenuelos: false', 'charlaSenuelos: true');
  const espia = (f, t) => f !== 'compile.js' ? t : t // ESPÍAS (solo lectura, en memoria): cuántas veces una herramienta se asigna a la falsa-grabación y cuántas charlas cuenta el reparto (listenN)
    .replace("&& c.source.type === 'prop') || null) : null;", "&& c.source.type === 'prop') || null) : null; if (decoyChat && toolOf[decoyChat.id]) G.__dt = (G.__dt || 0) + 1;")
    .replace('const lupaCh2 = {};', 'G.__ln = listenN; const lupaCh2 = {};');
  const pts = [on.patch, patch, espia].filter(Boolean);
  const G = require('./tools/load_g.js')(MOD, (f, t) => pts.reduce((x, q) => q(f, x), t)); G.GEN_VERSION = 7;
  G.__dt = 0; const o = { herrFalsa: 0, listenN: 0, err: 0, falsas: 0, montadas: 0, conLupa: 0, sinObjeto: 0, pareja: 0, sala: 0, enG1: 0, enG2c: 0, lupasDeMas: 0, noVuelve: 0, bot: 0, botN: 0, sinPaso: 0 };
  LV.forEach((L) => { let k = 0; for (let i = 1; k < n && i < n * 6; i++) { const sd = i * 7919 + 1; G.__ln = undefined; const r = G.generateCase(sd, { level: L }); if (r.error) { o.err++; if (process.env.DBG) console.log('ERR', L, sd, r.error, JSON.stringify(r.fails).slice(0, 260)); continue; } k++;
    if (G.__ln !== undefined && G.__ln !== props_len(r.def, r.bible)) o.listenN++;
    const rooms = r.def.rooms, props = Object.keys(rooms).flatMap((p) => (rooms[p].props || []).map((q) => Object.assign({ _room: p }, q)));
    const decoys = r.bible.clues.filter((c) => c.kindAntes), real = props.filter((q) => q.listen && !decoys.some((c) => q.id === 'obj_' + c.id));
    r.bible.clues.filter((c) => c.role === 'falsa' && (c.kind === 'grabación' || c.kindAntes)).forEach((c) => { o.falsas++;
      const prop = props.find((q) => q.id === 'obj_' + c.id);
      if (!prop) { o.sinObjeto++; return; }
      if ((prop.steps || []).some((s) => s.tool === 'lupa')) o.conLupa++;
      if (!prop.listen) { if (c.kind !== c.kindAntes || r.def.clues[c.id].kind !== c.kindAntes) o.noVuelve++; return; } // no montada: vuelve a su tipo anterior
      o.montadas++;
      const st = prop.steps[0], about = Object.keys(c.points || {})[0], others = real.reduce((a, q) => a.concat([q.chat.a, q.chat.b]), []);
      if (st.tool !== 'grabadora' || st.clue !== c.id) o.sinPaso++;
      if ([prop.chat.a, prop.chat.b].some((x) => x === about || others.indexOf(x) >= 0 || (r.def.npcs[x] || {}).cat) || prop.chat.a === prop.chat.b) o.pareja++;
      if (props.filter((q) => q._room === prop._room && q.listen).length !== 1) o.sala++;
      if (r.def.chapters[0].goals.some((g) => (g.clues || []).indexOf(c.id) >= 0)) o.enG1++;
      if (r.def.chapters[1].goals.some((g) => (g.clues || []).indexOf(c.id) >= 0)) o.enG2c++;
      const lupas2 = props.filter((q) => q.chapterMin === 2 && (q.steps || []).some((s) => s.tool === 'lupa')).length; if (lupas2 > real.length) o.lupasDeMas++; });
    if (k <= 3) { o.botN++; if (G.botPlay(r.def).win) o.bot++; } } });
  o.herrFalsa = G.__dt; return o;
}
function revisar(o) { const f = [], z = (k, m) => { if (o[k]) f.push(o[k] + ' ' + m); };
  if (o.err > Math.ceil(0.03 * 3 * N)) f.push('errores ' + o.err); // v7 ya rechaza alguna semilla con el interruptor apagado (p. ej. dificil 443465): se tolera ≤ 3 %; if (o.falsas < 20) f.push('muy pocas falsas-grabación (' + o.falsas + ')'); if (o.montadas < 10) f.push('muy pocas charlas señuelo montadas (' + o.montadas + ')');
  z('conLupa', 'con lupa'); z('sinObjeto', 'sin objeto'); z('pareja', 'con pareja no válida (sujeto, otra charla o gato)'); z('sala', 'en sala con otra charla'); z('enG1', 'en «Busca pistas»'); z('enG2c', 'en «Graba las charlas»'); z('lupasDeMas', 'casos con más lupas de cap. 2 que charlas reales'); z('herrFalsa', 'veces que se asigna una herramienta a la falsa-grabación'); z('listenN', 'casos donde el reparto cuenta más charlas que las reales'); z('noVuelve', 'no vuelven a su tipo'); z('sinPaso', 'sin paso de grabadora con pista');
  if (o.bot < o.botN) f.push('el bot no gana ' + (o.botN - o.bot)); return f; }
const S = medir(null, N), F = revisar(S);

console.log('  falsas-grabación ' + S.falsas + ' · montadas como charla ' + S.montadas + ' (' + Math.round(100 * S.montadas / S.falsas) + ' %) · bot gana ' + S.bot + '/' + S.botN);
ok('(1)+(2) charla señuelo: ' + (F.join(' · ') || 'todo en regla'), F.length === 0);
const M = [
  ['señuelo de lupa sin filtro', "&& !(c.kind === 'grabación' && G.GEN_VERSION >= 7));", ');'],
  // (el filtro del sostén `fit` es una RED DE SEGURIDAD: la lupa de sostén solo elige «grabación» si no queda ninguna «física», y en 180 casos por mutación no ocurrió; sin mutación propia)
  ['la charla señuelo cuenta como real (pide lupa)', 'if (!decoy) listenN++;', 'listenN++;'],
  ['cuenta en «Busca pistas»', '&& !(decoyOf && decoyChat && c.id === decoyChat.id)', ''],
  ['el sujeto charla de sí mismo', 'if (s2[i] === about || s2[j] === about) continue;\n          pair = [s2[i], s2[j]];', 'pair = [s2[i], s2[j]];'],
  ['no vuelve a su tipo anterior', 'decoyChat.kind = decoyChat.kindAntes || decoyChat.kind;', ''],
];
M.forEach(([nombre, desde, hacia], ix) => { if (process.env.SOLO && +process.env.SOLO !== ix) return; const m = mutador('compile.js', desde, hacia), F2 = revisar(medir(m.patch, N)); // m.ok se rellena al cargar el archivo: se mira DESPUÉS de medir
  ok(`mutación «${nombre}»: el patrón encaja (${m.motivo || 'sí'})`, m.ok !== false); ok(`mutación «${nombre}» detectada`, F2.length > 0); console.log('  · «' + nombre + '»: ' + (F2.length ? 'detectada (' + F2[0] + ')' : 'NO detectada')); });
console.log(bad ? `✗ ${bad} fallos de ${checks}` : `✓ test_charla_senuelo_b: ${checks} comprobaciones`); process.exit(bad ? 1 : 0);
