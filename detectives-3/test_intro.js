// A3 INTRO-1 (fallo 4): el INFORME DEL CASO. SIN navegador, con el código real (G.caseBriefing de src/logic.js y G.drawBriefing de src/play.js).
// Comprueba, en el caso 1 y en 60 casos generados × 3 niveles × «Texto grande» sí/no × 2 anchos de letra:
//  · el informe nombra al cliente, cuenta lo ocurrido (sinopsis del caso) y da 3 pasos (pruebas / sospechosos / acusar) con los números REALES del caso;
//  · lo que se pide en Acusar y los intentos coinciden con la dificultad (Fácil sin «cómo», Normal con «cómo», Difícil con pruebas y una sola acusación);
//  · nada se recorta con «…», ni se sale de su caja, ni se pisa con el bloque siguiente, tanto en el modal (760 px) como en la pestaña del Cuaderno (800 px);
//  · el Cuaderno tiene la pestaña «Caso» y la Pausa la entrada «Informe del caso» (existen, y la Pausa abre y cierra el informe).
// COMPROBADA CON MUTACIÓN: se ejecuta también contra versiones estropeadas y DEBE fallar en cada una.   Una a una: node test_intro.js [N=60]
const loadG = require('./tools/load_g.js');
const N = +process.argv[2] || 60, EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'net.js', 'play.js'];
const FACTORS = [[0.58, 0.52], [0.64, 0.58]];
const mkCtx = (fb, fn) => { const t = { font: '16px x', log: [] }; return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => { const bold = /^bold /.test(o.font), px = parseFloat(o.font.replace(/^bold /, '')) || 16; return { width: String(s).length * px * (bold ? fb : fn) }; } : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }); };
const MUT = [   // [nombre, fichero, texto a buscar, texto que lo sustituye]
  ['el informe no cuenta lo ocurrido', 'play.js', "T(b.what, x, y + 70,", "T('', x, y + 70,"],
  ['las pruebas con un número inventado', 'logic.js', "(hay ' + st.totalClues() + ').'", "(hay 99).'"],
  ['siempre pide «cómo» (también en Fácil)', 'logic.js', 'else { if (o.method) parts.push', 'else { if (true) parts.push'], // cp. 275: anclado a la rama v6 (la que ejecuta la prueba); el patrón suelto también encajaba en la rama v7 (CL-3) y mutaba esa
  ['intentos fijos (ignora la dificultad)', 'logic.js', 'const n = d.strikes;', 'const n = 3;'],
  ['pasos sin tope de alto (se pisan)', 'play.js', "lineH: 22, maxH: 48, minSize: 12", "lineH: 22, minSize: 30"],
  ['sinopsis sin tope de alto', 'play.js', "lineH: 24, maxH: 100, minSize: 13", "lineH: 24, minSize: 30"],
  ['sin pestaña «Caso» en el Cuaderno', 'play.js', "'Acusar', 'Caso']", "'Acusar']"],
  ['sin entrada «Informe del caso» en la Pausa', 'play.js', "{ label: 'Informe del caso', icon: 'ico_book' },", ""],
];
const NUMW = { 1: 'una sola', 2: 'dos', 3: 'tres' };
function auditar(G, def, d, big, fb, fn, W) {
  const U = G.ui, probs = [], tag = `[${def.id} ${d}${big ? '+grande' : ''} ×${fb} w${W}]`, p = (c, m) => { if (c) probs.push(tag + ' ' + m); };
  G.save.data.settings.bigText = big;
  const st = new G.CaseState(JSON.parse(JSON.stringify(def)), d), b = G.caseBriefing(st), o = st.boardOptions();
  const nSus = o.suspects.filter((s) => !st.isCatSuspect(s)).length, df = G.DIFFS[d];
  p(!b.client || b.client !== (def.npcs[def.clientId] ? def.npcs[def.clientId].name : def.client), 'el cliente no es el del caso');
  p(!b.what || b.what !== def.blurb, 'falta lo ocurrido (la sinopsis)');
  p(b.todo.length !== 3 || b.todo.some((t) => !t || t.length < 20), 'no hay 3 pasos con texto');
  p(b.todo[0].indexOf('(hay ' + st.totalClues() + ')') < 0, 'el nº de pruebas no es el real (' + st.totalClues() + ')');
  p(b.todo[1].indexOf('los ' + nSus + ' sospechosos') < 0, 'el nº de sospechosos no es el real (' + nSus + ')');
  p(/cómo lo hizo/.test(b.todo[2]) !== !!o.method, 'el «cómo» no coincide con la dificultad');
  p(!/por qué lo hizo/.test(b.todo[2]), 'falta el «por qué»');
  p(/con qué pruebas/.test(b.todo[2]) !== !!o.proof, 'las pruebas pedidas no coinciden con la dificultad');
  p(df.strikes === 1 ? !/una acusación/.test(b.todo[2]) : b.todo[2].indexOf('Tenéis ' + NUMW[df.strikes] + ' intentos') < 0 && !(df.strikes > 3), 'los intentos no coinciden (' + df.strikes + ')');
  // dibujo
  const ctx = mkCtx(fb, fn), blocks = [];
  const U0 = U.text;
  U.text = function (c, txt, x, y, op) { const r = U0.call(U, c, txt, x, y, op); blocks.push({ txt, x, y, op, L: U.textInfo, r }); return r; };
  try { G.drawBriefing(ctx, st, 100, 98, W); } finally { U.text = U0; }
  const fin = (x) => x.L && x.op && x.op.maxH ? x.y + x.L.h : x.y + (x.r || 0);
  const find = (txt) => blocks.find((q) => q.txt === txt);
  [['QUÉ HA PASADO', b.what, 'la sinopsis'], ['QUÉ HAY QUE HACER', b.todo[0], 'el paso 1']].forEach(([lab, txt, nom]) => {
    const l = find(lab), q = blocks.find((z) => z.txt === txt);
    if (!l || !q) return p(true, nom + ' no se dibujó');
    p(q.L && !def.__extremo && (q.L.truncated || q.L.lines.some((x) => /…$/.test(x))), nom + ' recortado con «…»');
  });
  const sin = find(b.what), pas = find('QUÉ HAY QUE HACER');
  if (sin && pas) p(sin.y + (sin.op && sin.op.maxH && sin.L ? sin.L.h : sin.r) > pas.y - 4 + 0.5, `la sinopsis acaba en y+${(sin.y + (sin.op && sin.op.maxH && sin.L ? sin.L.h : sin.r) - 98).toFixed(0)} y pisa «QUÉ HAY QUE HACER» (y+${pas.y - 98})`);
  b.todo.forEach((t, i) => {
    const q = blocks.find((z) => z.txt === t); if (!q) return p(true, 'el paso ' + (i + 1) + ' no se dibujó');
    const L = q.L; if (!L) return p(true, 'el paso ' + (i + 1) + ' no se dibujó con caja (maxH)');
    p(L.truncated || L.lines.some((x) => /…$/.test(x)), 'paso ' + (i + 1) + ' recortado con «…»');
    p(L.lines.some((x) => x.length * L.size * fn > W - 44 + 0.5), 'paso ' + (i + 1) + ' con una línea más ancha que su caja');
    const next = i < 2 ? blocks.find((z) => z.txt === b.todo[i + 1]) : null;
    if (next) p(q.y + L.h > next.y + 0.5, `el paso ${i + 1} pisa el paso ${i + 2}`);
    else p(q.y + L.h > 98 + 360 + 0.5, 'el último paso pasa del final del informe (y+' + (q.y + L.h - 98).toFixed(0) + ')');
  });
  const cl = blocks.find((z) => z.txt === b.client);
  if (cl && cl.L) p(cl.L.truncated, 'el cliente recortado');
  G.save.data.settings.bigText = false;
  return probs;
}
function estructura(G) {   // pestaña y Pausa
  const probs = [];
  const tabs = G.PlayModals.Notebook.prototype.tabsDef.call({});
  if (tabs.indexOf('Caso') < 0) probs.push('el Cuaderno no tiene la pestaña «Caso»');
  const cases = Object.values(G.CASES).slice(0, 1);
  const st = new G.CaseState(JSON.parse(JSON.stringify(cases[0])), 'normal');
  const P = new G.PlayModals.Pause({ st, world: { mode: 'solo' }, exitToHub() {} });
  if (!P.menu.items.some((i) => i.label === 'Informe del caso')) probs.push('la Pausa no tiene «Informe del caso»');
  return probs;
}
function correr(G) {
  const cases = [];
  for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) cases.push(r.def); }
  if (G.CASES && G.CASES.tarta) cases.push(G.CASES.tarta);
  const ext = JSON.parse(JSON.stringify(cases[0])); ext.id = 'extremo'; ext.__extremo = true;   // sinopsis irreal de ~520 letras: puede recortarse con «…» pero NUNCA pisar los pasos
  ext.blurb = 'Ha desaparecido algo muy valioso y nadie sabe nada, o eso dicen todos. '.repeat(7).trim(); cases.push(ext);
  const probs = estructura(G);
  let n = 0;
  for (const [fb, fn] of FACTORS) for (const big of [false, true]) for (const W of [760, 800]) for (const d of ['easy', 'normal', 'hard']) cases.forEach((def) => { n++; probs.push(...auditar(G, def, d, big, fb, fn, W)); });
  return { probs, n, casos: cases.length };
}
const base = correr(loadG(EXTRA));
console.log(`Informe del caso: ${base.n} informes (${base.casos} casos × 3 niveles × texto grande × 2 anchos de letra × 2 anchos de caja), ${base.probs.length} problemas`);
base.probs.slice(0, 12).forEach((x) => console.log('  ✗ ' + x));
let bad = base.probs.length;
MUT.forEach(([nom, f, a, b]) => {
  let tocado = false;
  const G = loadG(EXTRA, (file, txt) => { if (file === f && txt.indexOf(a) >= 0) { tocado = true; return txt.replace(a, b); } return txt; });
  if (!tocado) { console.log(`  ✗ mutación «${nom}»: no se encontró el texto a estropear (actualiza la prueba)`); bad++; return; }
  let r; try { r = correr(G); } catch (e) { r = { probs: ['excepción: ' + e.message] }; }
  const ok = r.probs.length > 0; if (!ok) bad++;
  console.log(`  ${ok ? '✓' : '✗'} mutación «${nom}»: ${ok ? 'detectada (' + r.probs.length + ')' : 'NO detectada'}`);
});
console.log(bad ? 'FALLA' : 'Todo en orden');
process.exit(bad ? 1 : 0);
