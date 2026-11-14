// Prueba de las pistas y mentiras generadas (fase 3C): 3000 semillas → genTruth + genClues pasan G.checkBible COMPLETO, son deterministas y no tocan la entrada.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const N = 3000;
const dist = (m, k) => { m[k] = (m[k] || 0) + 1; };
const show = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]).map((k) => `${k} ${m[k]}`).join(' · ');

// 1. cada semilla pasa el comprobador completo (los 13 invariantes), sin reintentos internos
const fails = [], retries = [], roles = {}, kinds = {}, srcs = {}, liarsN = {}, cleared = {}, perClue = [];
const text = [], sloppy = [], dupTopic = [], decoyNeeds = { con: 0, sin: 0 };
let maxPlace = 0;
for (let s = 0; s < N; s++) {
  const b0 = G.genTruth(s), i = G.genCluesInfo(b0), b = i.bible, r = G.checkBible(b);
  if (!r.ok) { if (fails.length < 3) fails.push(`semilla ${s}: ${JSON.stringify(r.errors.slice(0, 3))}`); continue; }
  if (i.attempts > 1) retries.push(s);
  const cu = b.truth.culprit, per = {}, tp = {};
  b.clues.forEach((c) => {
    dist(roles, c.role); dist(kinds, c.kind); dist(srcs, c.source.type);
    text.push(c.title + ' | ' + c.text);
    if (c.source.type === 'prop') per[c.source.place] = (per[c.source.place] || 0) + 1;
    else { const k = c.source.npc + '|' + c.source.topic; if (tp[k]) dupTopic.push(s); tp[k] = 1; }
  });
  maxPlace = Math.max(maxPlace, ...Object.keys(per).map((k) => per[k]));
  b.lies.forEach((l) => { text.push(l.said + ' | ' + l.truth); });
  dist(liarsN, b.lies.length);
  dist(cleared, Object.keys(b.alibis).filter((k) => b.alibis[k].clearedBy).length + '/' + (Object.keys(b.alibis).length - 1));
  perClue.push(b.clues.length);
  ['methods', 'motives'].forEach((k) => b.truth.decoys[k].forEach((d) => { decoyNeeds[(d.needs || []).length ? 'con' : 'sin']++; }));
}
ok(`${N} semillas: genTruth + genClues pasan G.checkBible completo`, !fails.length, fails.join('\n   '));
ok(`ninguna necesita reintento interno (${retries.length} de ${N})`, retries.length === 0, 'semillas: ' + retries.slice(0, 10));
ok('la biblia de entrada no se modifica (sigue siendo parcial)', (() => { const b = G.genTruth(7), s = JSON.stringify(b); G.genClues(b); return s === JSON.stringify(b); })());

// 2. forma de lo que entrega: cada cosa del contrato queda rellena
let shape = 0;
for (let s = 0; s < N; s += 3) {
  const b = G.genClues(G.genTruth(s)), tr = b.truth, cu = tr.culprit, ids = b.clues.map((c) => c.id);
  const score = b.clues.reduce((a, c) => a + (c.points[cu] || 0), 0);
  const inn = Object.keys(b.alibis).filter((k) => k !== cu);
  if (b.proof.length < 3 || score < 12 || !tr.method.needs.length || !tr.motive.needs.length
    || b.lies.length < 2 || b.lies.length !== Object.keys(b.alibis).filter((k) => !b.alibis[k].holds).length
    || inn.some((k) => !b.alibis[k].clearedBy)
    || !b.proof.concat(tr.method.needs, tr.motive.needs).every((x) => ids.indexOf(x) >= 0)
    || !b.clues.some((c) => c.role === 'falsa')) shape++;
}
ok('toda biblia tiene ≥ 3 pruebas (≥ 12 puntos), needs de método y móvil, ≥ 2 mentiras (= quienes tienen holds:false) y todos los inocentes descartados', shape === 0, shape + ' casos');
// 2b. auditoría de SENTIDO (independiente de checkBible): lo que un jugador vería como ilógico
const sense = {}, flag = (k, s, m) => { sense[k] = sense[k] || []; if (sense[k].length < 2) sense[k].push(s + ': ' + m); };
for (let s = 0; s < N; s++) {
  const b = G.genClues(G.genTruth(s)), cu = b.truth.culprit, w = b.truth.window, tl = b.truth.timeline, name = {}, score = {};
  b.cast.forEach((c) => { name[c.id] = c.name; score[c.id] = 0; });
  b.clues.forEach((c) => Object.keys(c.points).forEach((k) => { score[k] += c.points[k]; }));
  const dset = {}; b.deceptive.forEach((d) => { dset[d.who] = 1; });
  b.cast.filter((c) => c.role === 'sospechoso' && c.id !== cu).forEach((c) => {
    if (dset[c.id]) { if (score[cu] - score[c.id] < 3) flag('engañoso_supera_al_culpable', s, c.id); if (score[c.id] < 0.6 * score[cu]) flag('engañoso_poco_sospechoso', s, c.id); } // el engañoso queda cerca, pero por debajo
    else if (score[cu] - score[c.id] < 8) flag('culpable_no_destaca', s, c.id);
  });
  b.clues.forEach((c) => {
    const k = Object.keys(c.points)[0];
    if (c.role !== 'refuta' && k && c.text.indexOf(name[k]) < 0 && c.title.indexOf(name[k]) < 0) flag('texto_sin_nombre', s, c.id);
    if (c.source.type === 'npc') {
      if (!name[c.source.npc]) flag('npc_inexistente', s, c.id);
      if (k && c.source.npc === k) flag('habla_de_si', s, c.id);
      if (c.source.npc === cu && c.role !== 'falsa') flag('culpable_aporta_pista', s, c.id);
      if (/^ausente_/.test(c.id)) { // estuvo donde el culpable dice haber estado, toda la ventana, sin mentir sobre sí mismo
        const ac = b.alibis[cu].claim;
        if (!tl.some((e) => e.who === c.source.npc && e.place === ac.place && e.t <= w.from && e.until >= w.to) || b.alibis[c.source.npc].holds === false) flag('ausente_no_estaba', s, c.id);
      } else if (c.derivedFrom !== null && tl[c.derivedFrom].witnesses.indexOf(c.source.npc) < 0) flag('testigo_no_estaba', s, c.id);
    }
    (c.text.match(/\b\d\d:\d\d\b/g) || []).forEach((h) => { const m = G.strToMin(h); if (m < w.from || m > w.to) flag('hora_fuera_de_ventana', s, c.id + ' ' + h); });
    if (c.role === 'descarte' && c.points[cu]) flag('descarte_al_culpable', s, c.id);
  });
  b.lies.forEach((l) => { if (!/\d\d:\d\d a \d\d:\d\d/.test(l.said) || !l.truth) flag('mentira_mal_escrita', s, l.who); });
}
ok('auditoría de sentido en ' + N + ' semillas: el culpable destaca ≥ 8 puntos (los engañosos entre el 60 % y su sospecha − 3), cada texto nombra a su sospechoso, nadie habla de sí mismo, los testigos estuvieron allí, las horas caen en la ventana', !Object.keys(sense).length, JSON.stringify(sense));
ok('sin textos con marcadores sin rellenar ni «de el» / «a el» / «undefined»', (() => { text.forEach((t) => { if (/[{}]|\bde el\b|\ba el\b|undefined|NaN|\?\?:\?\?/.test(t) && sloppy.length < 5) sloppy.push(t); }); return !sloppy.length; })(), sloppy.join('\n   '));
ok('lo que dicen los mentirosos lleva las dos horas bien escritas («de 22:10 a 23:20»)', (() => { let n = 0; for (let s = 0; s < 300; s++) G.genClues(G.genTruth(s)).lies.forEach((l) => { if (!/^Estuve en (el|la) \S+ de \d\d:\d\d a \d\d:\d\d, sin moverme\.$/.test(l.said)) n++; }); return n === 0; })());
ok('ningún personaje tiene dos temas con el mismo id', !dupTopic.length, 'semillas: ' + dupTopic.slice(0, 5));
ok(`como mucho 4 objetos por lugar (máximo visto: ${maxPlace})`, maxPlace <= 4);
ok('los señuelos de método y móvil casi siempre tienen una pista falsa que los apoya', decoyNeeds.con > decoyNeeds.sin * 3, JSON.stringify(decoyNeeds));

// 2c. 4A: forma de captura y engañosos de cada biblia
{
  const per = {}, dc = {}, lv = {}, bad4 = {};
  const f4 = (k, s, m) => { bad4[k] = bad4[k] || []; if (bad4[k].length < 2) bad4[k].push(s + ': ' + m); };
  for (let s = 0; s < N; s++) {
    const b = G.genClues(G.genTruth(s)), cu = b.truth.culprit, form = b.captureForm, want = G.CAPTURE_FORMS[form].proof;
    dist(per, form); dist(dc, b.deceptive.length); dist(lv, b.level);
    if (b.proof.map((id) => id.split('_')[0]).sort().join() !== want.slice().sort().join()) f4('proof_no_es_de_la_forma', s, form + ' ' + b.proof);
    if (!b.lies.find((l) => l.who === cu).refutedBy.length) f4('mentira_culpable_sin_refutar', s, form);
    b.deceptive.forEach((d) => {
      const own = b.clues.filter((c) => c.role === 'falsa' && c.points[d.who] > 0);
      if (own.length < 3) f4('engañoso_con_menos_de_3_pistas', s, d.who + ' ' + own.length);
      if (!b.alibis[d.who].clearedBy) f4('engañoso_sin_descarte', s, d.who);
      const dsc = b.clues.find((c) => c.id === b.alibis[d.who].clearedBy);
      if (dsc && dsc.text.toLowerCase().replace(/\.$/, '').indexOf(d.why.toLowerCase().replace(/\.$/, '')) < 0 && dsc.text.indexOf(d.why.charAt(0).toLowerCase() + d.why.slice(1, -1)) < 0) f4('descarte_no_cuenta_la_explicacion', s, d.who + ' | ' + dsc.text + ' | ' + d.why);
    });
  }
  ok('las pruebas de cada biblia son exactamente las de su forma de captura; el culpable siempre tiene mentira refutable', !bad4.proof_no_es_de_la_forma && !bad4.mentira_culpable_sin_refutar, JSON.stringify(bad4));
  ok('cada engañoso lleva ≥ 3 pistas falsas, un descarte, y el descarte cuenta su explicación graciosa', !bad4.engañoso_con_menos_de_3_pistas && !bad4.engañoso_sin_descarte && !bad4.descarte_no_cuenta_la_explicacion, JSON.stringify(bad4));
  ok('salen las 4 formas de captura, ninguna por encima del 40 %', Object.keys(per).length >= 4 && Math.max.apply(null, Object.values(per)) <= 0.4 * N, show(per));
  ok('salen los recuentos de engañosos 0, 1, 2 y 3, ninguno por encima del 40 %', ['0', '1', '2', '3'].every((k) => dc[k] > 0) && Math.max.apply(null, Object.values(dc)) <= 0.4 * N, show(dc));
  console.log('  formas: ' + show(per) + '  |  engañosos: ' + show(dc) + '  |  niveles: ' + show(lv));
}

// 2d. 4C-4c-1: MATIZ por ambiente. Solo cambian TEXTOS: hechos idénticos en los tres ambientes; claro sin matiz; inquietante 2 y macabro 3 pistas de objeto con su par [susto, remate] al final.
{
  const TM = G.GEN_DATA.clueTpl.matiz, KEY = { 'física': 'fisica', 'documento': 'documento', 'grabación': 'grabacion' }, M = G.MOODS;
  const allPairs = []; ['inquietante', 'macabro'].forEach((m) => Object.keys(TM[m]).forEach((k) => TM[m][k].forEach((pr) => allPairs.push(pr))));
  const bad5 = {}, f5 = (k, s, m) => { bad5[k] = bad5[k] || []; if (bad5[k].length < 2) bad5[k].push(s + ': ' + m); };
  const facts = (b) => JSON.stringify([b.clues.map((c) => [c.id, c.role, c.kind, c.points, c.source, c.derivedFrom]), b.lies, b.proof, b.alibis, b.truth]);
  const cnt = {}; let withMatiz = 0;
  for (let s = 0; s < N; s++) {
    const t0 = G.genTruth(s), B = {}; M.forEach((m) => { B[m] = G.genClues(t0, { mood: m }); });
    const sin = G.genClues(t0); // sin ambiente: como claro
    if (sin.matiz || sin.mood) f5('sin_mood_con_matiz', s, 'una biblia sin { mood } no debe llevar mood ni matiz');
    M.forEach((m) => {
      const b = B[m], mz = b.matiz || [];
      if (b.mood !== m) f5('mood_no_se_guarda', s, m);
      if (mz.length !== G.MATIZ_COUNT[m]) f5('nº_de_matices', s, m + ' ' + mz.length);
      if (facts(b) !== facts(B.claro)) f5('los_hechos_cambian_con_el_ambiente', s, m);
      if (!G.checkBible(b).ok) f5('biblia_no_pasa', s, m);
      const seen = {};
      b.clues.forEach((c) => {
        const c0 = B.claro.clues.filter((x) => x.id === c.id)[0];
        if (mz.indexOf(c.id) < 0) { if (c.text !== c0.text) f5('texto_cambia_sin_matiz', s, m + ' ' + c.id); return; }
        if (c.source.type !== 'prop' || ['prueba', 'falsa', 'refuta'].indexOf(c.role) < 0) f5('matiz_en_pista_no_permitida', s, c.id);
        const tail = c.text.slice(c0.text.length), pr = (TM[m][KEY[c.kind]] || []).filter((q) => tail === ' ' + q[0] + ' ' + q[1])[0];
        if (c.text.indexOf(c0.text) !== 0 || !pr) f5('matiz_no_es_un_par_del_banco', s, m + ' ' + c.id + ' → ' + tail);
        else { if (seen[pr[0]]) f5('matiz_repetido_en_el_caso', s, pr[0]); seen[pr[0]] = 1; }
      });
      if (m === 'claro' && B.claro.clues.some((c) => allPairs.some((q) => c.text.indexOf(q[0]) >= 0 || c.text.indexOf(q[1]) >= 0))) f5('claro_con_frase_oscura', s, '');
      dist(cnt, m + ':' + mz.length); if (mz.length) withMatiz++;
    });
  }
  ok('matiz (' + N + ' semillas × 3 ambientes): los HECHOS no cambian (ids, roles, puntos, fuentes, mentiras, pruebas, coartadas, verdad), y toda biblia pasa checkBible', !bad5.los_hechos_cambian_con_el_ambiente && !bad5.biblia_no_pasa && !bad5.mood_no_se_guarda && !bad5.sin_mood_con_matiz, JSON.stringify(bad5));
  ok('matiz: claro 0, inquietante 2 y macabro 3 pistas de objeto (prueba/falsa/refuta) y solo se AÑADE texto al final (par [susto, remate] del banco de su tipo, sin repetir)', !bad5.nº_de_matices && !bad5.matiz_en_pista_no_permitida && !bad5.matiz_no_es_un_par_del_banco && !bad5.matiz_repetido_en_el_caso && !bad5.texto_cambia_sin_matiz, JSON.stringify(bad5));
  ok('matiz: ningún caso claro lleva una frase del banco oscuro', !bad5.claro_con_frase_oscura, JSON.stringify(bad5));
  ok('matiz: bancos completos (2 ambientes × 3 tipos × ≥ 8 pares, todos con susto y remate, sin «de el», sin llaves ni lugares)', ['inquietante', 'macabro'].every((m) => ['fisica', 'documento', 'grabacion'].every((k) => TM[m][k] && TM[m][k].length >= 8 && TM[m][k].every((pr) => pr.length === 2 && pr[0].trim() && pr[1].trim() && !/\bde el\b|\ba el\b|[{}]|\b(la tienda|la cocina|el almacén|el callejón|el taller)\b/i.test(pr.join(' '))))));
  console.log('  matiz: ' + show(cnt));
}

// 3. determinismo: misma semilla ⇒ mismo JSON, y distintas semillas ⇒ pistas distintas
let det = 0;
for (let s = 0; s < N; s += 7) { if (JSON.stringify(G.genClues(G.genTruth(s))) !== JSON.stringify(G.genClues(G.genTruth(s)))) det++; }
ok('determinismo: dos llamadas con la misma semilla dan JSON idéntico (429 semillas)', det === 0);
const uniq = new Set(); for (let s = 0; s < 300; s++) uniq.add(JSON.stringify(G.genClues(G.genTruth(s)).clues));
ok(`las pistas varían (${uniq.size} conjuntos distintos en 300 semillas)`, uniq.size > 290);
ok('semillas raras no lanzan y dan biblia completa válida', [4294967295, 4294967296 + 5, 0, 12.7].every((s) => G.checkBible(G.genClues(G.genTruth(s))).ok));
ok('si la entrada no es una biblia parcial válida no se oculta: checkBible la rechaza', (() => { const b = G.genTruth(5); b.truth.window.place = 'nada'; let r; try { r = G.checkBible(G.genClues(b)); } catch (e) { return true; } return !r.ok; })());

const mean = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log('\nDistribución en ' + N + ' semillas');
console.log('  roles    : ' + show(roles));
console.log('  clase    : ' + show(kinds) + '  |  fuente: ' + show(srcs));
console.log('  mentiras : ' + show(liarsN) + '  |  descartes: ' + show(cleared));
console.log(`  pistas por caso: media ${mean(perClue)} (mín ${Math.min.apply(null, perClue)}, máx ${Math.max.apply(null, perClue)})`);
console.log(bad ? `\n${bad} comprobación(es) fallaron` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
