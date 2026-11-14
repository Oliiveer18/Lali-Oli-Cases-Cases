// c4-3 3/4-a (cp. 242): CHARLA SEÑUELO, parte 1 (gen_clues.js). Una a una: node test_charla_senuelo_a.js [N=100]
// Interruptor APAGADO (en memoria; se entrega ENCENDIDO desde c4-3 4/4): ninguna pista falsa es «grabación». Encendido en memoria (v7): como máximo 1 por caso; solo una falsa de OBJETO; su sala no tiene una grabación de sostén;
// solo cambia el TIPO (título, texto, puntos, fuente y derivación idénticos a los del caso con el interruptor apagado); el % de casos con señuelo cae en su rango por nivel; el bot gana.
// Mutaciones: sin filtro de sala con charla real · acepta rumores · sin tabla (siempre 1).
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'], N = +process.argv[2] || 100;
const RANGO = { facil: [20, 62], normal: [28, 72], dificil: [38, 82] }; // % de casos con señuelo (tabla 45/55/60 % × factibilidad; medido 41 · 49 · 62)
let bad = 0, checks = 0; const late = []; /* «el patrón encaja» se mira al final: m.ok se rellena al cargar el archivo (FIX-OK, cp. 247) */ const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } };
// KEY sin `text`: el MATIZ (4C-4c-1, solo ambiente inquietante/macabro) reparte frases de ambiente con el azar `r`; al pasar una falsa a «grabación» el matiz gasta una tirada distinta y cambia la FRASE de ambiente de otras 1-2 pistas (hallado en FIX-OK-2, cp. 248, semilla difícil 308842; inofensivo, anotado en el CHECKLIST). Lo estructural (id, título, rol, puntos, fuente, derivación y tipo) sí debe ser idéntico.
// los `rastro_` los cambia 3/4-b (4) (refutación real en charla; los vigila test_refuta_charla.js), no el señuelo: la comparación de más abajo los ignora
const KEY = (c) => JSON.stringify([c.id, c.title, c.role, c.points, c.source, c.derivedFrom]);
const KNOWN_ERR = { 443465: 'difícil: v7 la rechaza en 8 intentos desde antes de c4-3 (cp. 244); revisada en c4-4 (cp. 251): no es un fallo, es la cola de un rechazo alto de v7 (con 16 intentos da caso); ver docs/INFORME_C44_PASO1.txt' }; // semillas que ya fallaban con el interruptor apagado: no son culpa de este paso (FIX-OK-2, cp. 248)
const gc = (Gx, s, L) => Gx.genClues(Gx.genTruth(s, { level: L }), { mood: Gx.pickMood(s, Gx.DEFAULT_THEME) }); // lo mismo que el 1.er intento de generateCase
const MOFF = mutador('gen_data.js', 'charlaSenuelos: true', 'charlaSenuelos: false'); // c4-3 4/4: el interruptor se APAGA en memoria para comparar
function medir(patch, on, solo) { // → por nivel { n, err, con, mas, mala, soloTipo, win }
  const m = null; /* c4-3 4/4 (cp. 250): el interruptor ya viene ENCENDIDO; «apagado» es el parche MOFF */
  const pts = [m && m.patch, patch].filter(Boolean), comp = pts.length ? (f, t) => pts.reduce((x, q) => q(f, x), t) : undefined; // los parches son funciones (fichero, texto) → texto
  const G = require('./tools/load_g.js')(MOD, comp); G.GEN_VERSION = 7;
  const Goff = on ? require('./tools/load_g.js')(MOD, MOFF.patch) : null; if (Goff) Goff.GEN_VERSION = 7; const o = {};
  LV.forEach((L) => { const x = o[L] = { n: 0, err: 0, con: 0, mas: 0, mala: 0, soloTipo: 0, win: 0 };
    for (let i = 1; x.n < N && i < N * 6; i++) { const sd = i * 7919 + 1; let bo; try { bo = gc(G, sd, L); } catch (e) { x.err++; continue; } x.n++; // nivel gen_clues (antes generateCase: con el interruptor encendido el reparto Oli/Lali rechaza más semillas y el caso cambia entero; eso es de c4-4)
      const d = bo.clues.filter((c) => c.role === 'falsa' && c.kind === 'grabación'); if (d.length === 1) x.con++; if (d.length > 1) x.mas++;
      const real = {}; bo.clues.forEach((c) => { if (c.kind === 'grabación' && c.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0) real[c.source.place] = 1; });
      d.forEach((c) => { if (c.source.type !== 'prop' || real[c.source.place]) x.mala++; });
      if (Goff && x.n <= 40) { const bf = gc(Goff, sd, L), A = {}; bf.clues.forEach((c) => { A[c.id] = c; }); const dif = bo.clues.filter((c) => !/^rastro_/.test(c.id) && (!A[c.id] || KEY(A[c.id]) !== KEY(c) || A[c.id].kind !== c.kind)).length; if (dif <= d.length) x.soloTipo++; }
      if (x.n <= 3) { const r = G.generateCase(sd, { level: L }); if (r.error) { if (!KNOWN_ERR[sd]) x.err++; } else if (G.botPlay(r.def).win) x.win++; } } });
  return o;
}
const OFF = (() => { const G = require('./tools/load_g.js')(MOD, MOFF.patch); G.GEN_VERSION = 7; let n = 0, g = 0; LV.forEach((L) => { for (let i = 1; i <= 30; i++) { const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; n++; if (r.bible.clues.some((c) => c.role === 'falsa' && c.kind === 'grabación')) g++; } }); return { n, g }; })();
late.push(() => ok('mutación «apagar el interruptor»: el patrón encaja', MOFF.ok !== false)); ok(`interruptor APAGADO (en memoria): ninguna pista falsa es grabación (${OFF.g} de ${OFF.n})`, OFF.g === 0 && OFF.n >= 85);
function revisar(S, etiqueta) { const f = []; LV.forEach((L) => { const x = S[L], pct = Math.round(100 * x.con / x.n); if (x.err) f.push(L + ' errores ' + x.err); if (x.mas) f.push(L + ' más de 1 señuelo'); if (x.mala) f.push(L + ' señuelo en sala con charla real o de rumor'); if (pct < RANGO[L][0] || pct > RANGO[L][1]) f.push(`${L} ${pct} % fuera de ${RANGO[L].join('-')}`); if (x.soloTipo < Math.min(40, x.n)) f.push(L + ' cambia algo más que el tipo'); if (x.win !== 3) f.push(L + ' el bot no gana'); }); return f; }
const S = medir(null, true), F = revisar(S);
console.log('  señuelos por caso (con interruptor en memoria): ' + LV.map((L) => L + ' ' + Math.round(100 * S[L].con / S[L].n) + ' %').join(' · '));
ok('interruptor encendido en memoria: ' + (F.join(' · ') || 'todo en regla'), F.length === 0);
{ const m1 = mutador('gen_clues.js', '&& !realRoom[q.source.place]', ''); late.push(() => ok('mutación «sin filtro de sala»: el patrón encaja', m1.ok !== false)); ok('mutación «sin filtro de sala» detectada', revisar(medir(m1.patch, true)).length > 0);
  const m2 = mutador('gen_clues.js', "q.source.type === 'prop' && q.kind !== 'grabación'", "q.kind !== 'grabación'"); late.push(() => ok('mutación «acepta rumores»: el patrón encaja', m2.ok !== false)); ok('mutación «acepta rumores» detectada', revisar(medir(m2.patch, true)).length > 0);
  const m3 = mutador('gen_clues.js', /(0xc43c43[\s\S]*?)n = tbl\[i\]\[0\]; break;/, '$1n = 1; break;'); late.push(() => ok('mutación «sin tabla (siempre 1)»: el patrón encaja', m3.ok !== false)); ok('mutación «sin tabla» detectada', revisar(medir(m3.patch, true)).length > 0); }
late.forEach((g) => g()); console.log(bad ? `✗ ${bad} fallos de ${checks}` : `✓ test_charla_senuelo_a: ${checks} comprobaciones`); process.exit(bad ? 1 : 0);
