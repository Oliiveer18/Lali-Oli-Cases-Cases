// test_marco.js — 4F-0a subpaso 2: theme/goal/scenario en biblia, caso y huella; letra en el código; los códigos G6 de siempre NO cambian.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'meter.js'];
let ok = 0, bad = 0;
const t = (c, m) => { if (c) ok++; else { bad++; console.log('  ✗ ' + m); } };
const G = loadG(EXTRA);
const NEW = ['theme', 'goal', 'scenario'];
// 1) los casos de siempre no cambian: hash de 300 semillas (sin los campos nuevos) = el guardado ANTES de tocar nada
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'HUELLA_4F0A_ANTES.json'), 'utf8'));
if (ref.gen === G.GEN_VERSION) {
  const h = crypto.createHash('sha256');
  for (let i = 0; i < ref.n; i++) { const r = G.generateCase((i * 2654435761 + 12345) >>> 0, { noCoins: true }); h.update(r.error ? 'ERR ' + ((i * 2654435761 + 12345) >>> 0) : JSON.stringify(r.def, (k, v) => (NEW.indexOf(k) >= 0 ? undefined : v))); }
  t(h.digest('hex') === ref.hash, 'los casos de las 300 semillas son idénticos a los de antes de 4F-0a (sin las monedas sueltas del subpaso 4)');
} else console.log('  (huella de referencia de otra GEN_VERSION: se omite la comparación)');
// 2) campos nuevos y códigos
['3wje', '2prl', '95yj'].forEach((c) => {
  const sd = G.caseSeedFromCode('G' + G.GEN_VERSION + '-' + c);
  t(!sd.error && sd.theme === 'robo', 'código sin letra = Robo: ' + c);
  const r = G.generateCase(sd.seed, { theme: sd.theme });
  t(!r.error && r.def.theme === 'robo' && r.def.goal === 'acusar' && r.def.scenario === 'panaderia', 'el caso trae robo/acusar/panadería: ' + c);
  t(r.bible.theme === 'robo' && r.bible.goal === 'acusar' && r.bible.scenario === 'panaderia', 'la biblia lo trae: ' + c);
  t(r.code === 'G' + G.GEN_VERSION + '-' + c && r.def.id === 'gen_g' + G.GEN_VERSION + '_' + c, 'el código y el id no cambian: ' + c);
  t(G.validateCase(r.def).ok && G.checkBible(r.bible).ok, 'validador y biblia aceptan el caso');
  const fp = G.caseFingerprint(r.def, r.bible);
  t(fp.theme === 'robo' && fp.scenario === 'panaderia' && !/ \| [te]:/.test(fp.key), 'la huella lleva tema y escenario, y la clave de Robo/panadería no cambia');
});
t(G.caseCode(5, 'robo') === G.caseCode(5) && G.caseCode(5) === 'G' + G.GEN_VERSION + '-5', 'caseCode sin letra para Robo');
t(G.caseCode(5, 'sabotaje') === 'G' + G.GEN_VERSION + 's-5' && G.caseSeedFromCode(G.caseCode(46655, 'sabotaje')).theme === 'sabotaje', 'caseCode con letra y vuelta');
t(G.THEME_IDS.every((th) => { const c = G.caseCode(123456, th), s = G.caseSeedFromCode(c); return s.seed === 123456 && s.theme === th; }), 'ida y vuelta del código en las 6 temáticas');
t(!!G.caseSeedFromCode('G' + G.GEN_VERSION + 'z-abc').error && !!G.caseSeedFromCode('G5-abc').error && !!G.caseSeedFromCode('xx').error, 'letra desconocida, versión vieja y basura dan error');
// 3) temáticas aún no listas: error claro, nunca un caso a medias; y el generador sigue sin consumir azar de más
['sabotaje', 'concurso', 'impostor', 'sobrenatural', 'desaparecido'].forEach((th) => {
  const r = G.generateCase(1234, { theme: th });
  t(!!r.error && /aún no está lista/.test(r.error) && !r.def, 'tema no listo → error claro: ' + th);
});
t(!!G.generateCase(1, { theme: 'nada' }).error, 'tema desconocido → error');
let thrown = false; try { G.genTruth(1, { theme: 'impostor' }); } catch (e) { thrown = /no está lista/.test(e.message); } t(thrown, 'genTruth con tema no listo lanza');
// 5) subpaso 3: ambiente y tonos por temática. Robo no cambia; las demás usan SUS pesos y SUS tonos (se fuerzan «listas» solo dentro de esta prueba, con el contenido de la panadería)
{
  let same = true; for (let sd = 1; sd <= 3000; sd++) if (G.pickMood(sd) !== G.pickMood(sd, 'robo')) same = false;
  t(same, 'pickMood(seed) = pickMood(seed, "robo") en 3000 semillas');
  const cnt = (th) => { const c = { claro: 0, inquietante: 0, macabro: 0 }; for (let sd = 1; sd <= 6000; sd++) c[G.pickMood(sd, th)]++; return c; };
  const sab = cnt('sabotaje'), sob = cnt('sobrenatural'), des = cnt('desaparecido');
  t(sab.macabro === 0 && sab.claro > 5000, 'Sabotaje: casi siempre claro y nunca macabro ' + JSON.stringify(sab));
  t(sob.claro < 600 && sob.macabro > 2000 && sob.inquietante > 2800, '¿Sobrenatural?: inquietante o macabro ' + JSON.stringify(sob));
  t(des.macabro === 0 && des.claro > 2800 && des.inquietante > 2300, 'Desaparecido: claro o inquietante ' + JSON.stringify(des));
  const G2 = loadG(EXTRA); G2.THEMES.sabotaje.ready = true; G2.SCENARIOS.teatro.ready = true;
  let okAll = 0, tonesSeen = new Set(), macabro = 0;
  for (let sd = 1; sd <= 120; sd++) { const r = G2.generateCase(sd * 7919, { theme: 'sabotaje' }); if (r.error) continue; okAll++; tonesSeen.add(r.def.tone); if (r.def.mood === 'macabro') macabro++;
    if (r.def.theme !== 'sabotaje' || r.def.scenario !== 'teatro' || !/^G6s-/.test(r.code) || !G2.THEMES.sabotaje.tones.includes(r.def.tone) || !G2.validateCase(r.def).ok) { t(false, 'caso Sabotaje mal formado (semilla ' + sd * 7919 + ')'); break; } }
  t(okAll > 100 && macabro === 0 && tonesSeen.size === G2.THEMES.sabotaje.tones.length, 'con el marco forzado, Sabotaje genera casos válidos con su letra, su escenario, sus tonos (' + [...tonesSeen].join(',') + ') y nunca macabros (' + okAll + '/120)');
}
// 6) subpaso 4: monedas sueltas. Son el ÚNICO cambio respecto a antes: 3 curiosidades × 5 monedas (15 como mucho), nunca en pistas ni en nada obligatorio
{
  const lines = G.GEN_DATA.compile.extra.coins.lines.map((l) => l.replace('{n}', G.GEN_DATA.compile.extra.coins.amount));
  let n = 0, con15 = 0, soloCur = true, mult5 = true, max = 0, onlyCoins = true;
  for (let i = 1; i <= 150; i++) {
    const sd = (i * 2654435761 + 777) >>> 0, a = G.generateCase(sd, {}), b = G.generateCase(sd, { noCoins: true });
    if (a.error || b.error) continue; n++;
    let tot = 0;
    Object.keys(a.def.rooms).forEach((rk) => (a.def.rooms[rk].props || []).forEach((p) => (p.steps || []).forEach((st) => { if (st.fx && st.fx.money) { tot += st.fx.money; if (!/^cur_/.test(p.id) || st.tool !== null || st.fx.clue || st.fx.flag) soloCur = false; } })));
    if (tot % 5) mult5 = false; if (tot === 15) con15++; max = Math.max(max, tot);
    let ja = JSON.stringify(a.def); lines.forEach((l) => { ja = ja.split(' ' + l).join(''); }); ja = ja.split(',"fx":{"money":5,"sfx":"pickup"}').join('');
    if (ja !== JSON.stringify(b.def)) onlyCoins = false;
    if (b.def.rooms && JSON.stringify(b.def).indexOf('"money"') >= 0) onlyCoins = false;
  }
  t(n > 130, 'casos generados para la prueba de monedas: ' + n);
  t(soloCur, 'las monedas están solo en curiosidades (cur_), sin herramienta, pista ni bandera');
  t(mult5 && max <= 15, 'total de monedas por caso: múltiplo de 5 y como mucho 15 (máximo visto ' + max + ')');
  t(con15 / n >= 0.9, 'el 90 % o más de los casos lleva las 15 monedas (' + con15 + '/' + n + ')');
  t(onlyCoins, 'quitando el texto y el efecto de las monedas, el caso es IDÉNTICO al de antes (son el único cambio)');
}
// 4) mutaciones: el comprobador de biblias debe rechazar campos de temática mal puestos
const r0 = G.generateCase(0x3c0ffee, {}); t(!r0.error, 'caso base');
const MUT = [['temática inventada', (b) => { b.theme = 'piratas'; }], ['objetivo inventado', (b) => { b.goal = 'huir'; }], ['escenario inventado', (b) => { b.scenario = 'castillo'; }], ['objetivo con número', (b) => { b.goal = 7; }], ['código con la letra de otra temática', (b) => { b.code = b.code.replace('-', 's-'); }]];
MUT.forEach(([n, f]) => { const b = JSON.parse(JSON.stringify(r0.bible)); f(b); t(!G.checkBible(b).ok, 'mutación NO detectada: ' + n); });
console.log(bad ? `test_marco: ${bad} fallo(s) de ${ok + bad}` : `test_marco: ${ok} comprobaciones OK (${MUT.length} mutaciones detectadas)`);
process.exit(bad ? 1 : 0);
