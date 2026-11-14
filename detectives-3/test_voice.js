// Prueba de VOZ Y TONO (4B parte 2): tonos, temas de charla, frases por rasgo, explicación de los engañosos y de las mentiras, títulos.
// Comprueba en N casos generados: cada caso declara su tono; 3+ temas por personaje; ningún texto con marcadores sueltos; sin frases repetidas
// entre temas de un mismo personaje; los 6 tonos y los 5 rasgos se usan; los engañosos reaccionan ante sus pistas falsas SIN confesar; los mentirosos
// desmontados cuentan lo que de verdad hacían; títulos variados; el banco de «primera persona» cubre todas las actividades; el caso 1 no cambia. Uso: node test_voice.js [semillas]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const N = +process.argv[2] || 1500;
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const D = G.GEN_DATA, T = D.compile;

// bancos: completos y sin marcadores raros
const acts = []; Object.values(D.acts).forEach((p) => acts.push(...p.normal, ...p.secret));
ok(`el banco de primera persona cubre las ${acts.length} actividades`, acts.every((a) => D.pastFirst[a]), acts.filter((a) => !D.pastFirst[a]).join(' | '));
ok('hay 6 tonos con 8 títulos, 3 sinopsis, 5 frases de gag y saludos de cliente', T.tones.length === 6 && T.tones.every((t) => t.titles.length === 8 && t.blurbs.length === 3 && t.gag.length === 5 && t.cFirst.length >= 2 && t.cTell.length >= 2 && t.tag && t.win));
ok('los 5 rasgos tienen voz completa (3 saludos, 6 charlas, 3+2 presionar, 3 de cada reacción y 3 temas)', D.traits.every((r) => { const v = T.voice[r]; return v.first.length === 3 && v.chat.length === 6 && v.press.length === 3 && v.pressHard.length === 2 && ['deny', 'admit', 'decoy', 'confess', 'work', 'cli', 'oth'].every((k) => v[k].length === 3); }));
const vars = /\{(?!(?:who|obj|Obj|cli|other|n|x1|X1|loc)\})\w+\}/;
ok('las plantillas de voz solo usan marcadores conocidos', JSON.stringify([T.voice, T.tones]).match(vars) === null, (JSON.stringify([T.voice, T.tones]).match(vars) || [])[0]);

// casos generados
const tones = {}, traits = {}, titles = new Set(), pairs = new Set(), topics = [], stats = { decoyReact: 0, decoyConf: 0, liarAdmit: 0, rawMarks: 0, dupTopic: 0, noTone: 0, many: 0, plain: 0 };
const say = (x) => (Array.isArray(x) ? x : (x && x.say) || []);
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s); if (r.error) { ok('semilla ' + s + ' aceptada', false, r.error); continue; }
  const d = r.def, b = r.bible;
  if (!d.tone) stats.noTone++; else tones[d.tone] = (tones[d.tone] || 0) + 1;
  titles.add(d.title); pairs.add(d.title + '|' + d.client);
  b.cast.forEach((c) => { traits[c.trait] = (traits[c.trait] || 0) + 1; });
  const all = JSON.stringify(d.npcs) + d.title + d.blurb + JSON.stringify(d.epilogue);
  if (/\{\w+\}/.test(all) || /undefined|\[object/.test(all) || /(?:^|[^\p{L}\p{N}_])(?:de|a) el /iu.test(all)) stats.rawMarks++;
  Object.keys(d.npcs).forEach((id) => {
    const n = d.npcs[id]; if (id !== 'aliado') topics.push(n.topics.length); // el aliado de policía (4C-3b-2) tiene 3 temas a propósito: lo cubre test_ally.js
    const js = n.topics.map((t) => JSON.stringify(t.responses)); if (new Set(js).size !== js.length) stats.dupTopic++;
    if (n.topics.length < 3) stats.few = (stats.few || 0) + 1;
    if (n.topics.length >= 3) stats.many++;
  });
  // engañosos: reaccionan ante sus pistas falsas, con explicación, sin confesar
  (b.deceptive || []).forEach((dc) => {
    const ev = d.npcs[dc.who].evidence, ks = Object.keys(ev).filter((k) => k.indexOf('falsa_' + dc.who) === 0);
    if (ks.length) stats.decoyReact++;
    if (ks.some((k) => /fui yo|lo hice yo|me rindo/i.test(JSON.stringify(ev[k])))) stats.decoyConf++;
  });
  // mentirosos inocentes: al desmontarlos cuentan algo concreto de lo que hacían (no la frase genérica)
  b.lies.filter((l) => l.who !== b.truth.culprit).forEach((l) => {
    const ev = d.npcs[l.who].evidence, k = l.refutedBy.find((x) => ev[x]); if (k && say(ev[k][0]).join(' ') !== T.admitMissing) stats.liarAdmit++;
  });
}
const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
ok('todos los casos declaran su tono', stats.noTone === 0);
ok(`se usan los 6 tonos y ninguno pasa del 25 %: ${JSON.stringify(tones)}`, Object.keys(tones).length === 6 && Math.max(...Object.values(tones)) / N <= 0.25);
ok(`se usan los 5 rasgos: ${JSON.stringify(traits)}`, Object.keys(traits).length === 5);
ok(`3 temas o más por personaje (media ${avg(topics).toFixed(2)}; caso 1: 2,4)`, !stats.few && avg(topics) >= 3.5);
ok('ningún personaje repite la respuesta de un tema en otro', stats.dupTopic === 0, stats.dupTopic);
ok('ningún texto con marcadores sueltos, «undefined» ni «de el»', stats.rawMarks === 0, stats.rawMarks);
ok(`los títulos son variados: ${titles.size} distintos en ${N} casos (${pairs.size} pares título+cliente)`, titles.size / N >= 0.25 && pairs.size / N >= 0.9);
ok(`los engañosos dan su explicación ante sus pistas falsas (${stats.decoyReact}) y nunca confiesan (${stats.decoyConf})`, stats.decoyReact > 0 && stats.decoyConf === 0);
ok(`los mentirosos desmontados cuentan lo que hacían de verdad (${stats.liarAdmit} casos)`, stats.liarAdmit > 0);
// determinismo y caso 1
const a = JSON.stringify(G.generateCase(77).def), c = JSON.stringify(G.generateCase(77).def);
ok('determinismo: la misma semilla da el mismo caso, con las mismas frases', a === c);
try { const G2 = require('./tools/load_g.js')(); ok('el caso 1 (tarta) no declara tono y sigue válido', G2.CASES.tarta && !G2.CASES.tarta.tone && G2.validateCase(G2.CASES.tarta).ok); } catch (e) { ok('caso 1', false, e.message); }
console.log(bad ? `\n✗ ${bad} comprobación(es) fallan` : '\n✓ voz y tono: todo en orden');
process.exit(bad ? 1 : 0);
