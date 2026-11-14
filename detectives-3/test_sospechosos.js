// FIX-6a (fallo 5, mitad 2): en la pestaña SOSPECHOSOS del cuaderno el nombre NO pisa la descripción, no se recorta y todo queda dentro de la tarjeta.
// SIN navegador: ejecuta el drawSuspects REAL (src/play.js) con un lienzo que registra cada texto, sobre 60 casos generados × 3 niveles ×
// «Texto grande» sí/no × 2 anchos de letra (medida normal y pesimista), más un caso extremo de 6 tarjetas de 123 px con los nombres y descripciones más largos.
// COMPROBADA CON MUTACIÓN: la prueba se ejecuta también contra 3 versiones estropeadas de drawSuspects y DEBE fallar en cada una.
// Una a una: node test_sospechosos.js [N=60]
const loadG = require('./tools/load_g.js');
const N = +process.argv[2] || 60, EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'net.js', 'play.js'];
const FACTORS = [[0.58, 0.52], [0.64, 0.58]];   // [negrita, normal] × tamaño × nº de caracteres (Trebuchet MS ronda 0,52-0,58; el segundo par es pesimista)
const MUT = [   // [nombre, texto a buscar, texto que lo sustituye]: cada uno reproduce un fallo posible del arreglo
  ['descripción siempre en y+156 (geometría antigua)', 'const dy = Math.max(156, 128 + nmL.h + 4);', 'const dy = 156;'],
  ['nombre sin límite de alto (puede tener 3 líneas o más)', "{ size: 17, bold: true, align: 'center', maxW: cw - 16, maxH: 52, minSize: 13, lineH: 22 }", "{ size: 17, bold: true, align: 'center', maxW: cw - 16, minSize: 13, lineH: 22 }"],
  ['descripción sin tope inferior (pasa de «Sospecha»)', 'maxH: 246 - dy, minSize: 11', 'maxH: 400, minSize: 11'],
];
const mkCtx = (fb, fn) => { const t = { font: '16px x', log: [] }; return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => { const bold = /^bold /.test(o.font), px = parseFloat(o.font.replace(/^bold /, '')) || 16; return { width: String(s).length * px * (bold ? fb : fn) }; } : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }); };

// dibuja la pestaña con la lista de sospechosos dada y devuelve los problemas encontrados
function auditar(G, list, big, fb, fn, tag, st0) {
  const U = G.ui, probs = [], stats = { cards: 0, nm2: 0, descShrunk: 0 };
  G.save.data.settings.bigText = big;
  const cw = Math.min(200, (G.VW - 160) / list.length - 10);
  const st = st0 || { boardOptions: () => ({ suspects: list }), diff: { autoMark: true }, suspicion: () => 0, suspectCleared: () => false };
  const ctx = mkCtx(fb, fn), blocks = [];
  const body = (txt, x, y, o) => { const r = U.text(ctx, txt, x, y, Object.assign({ color: '#000', shadow: false, size: 15, bold: false, lineH: 21 }, o)); if (o && o.maxH) blocks.push({ txt, x, y, L: U.textInfo, maxW: o.maxW, r }); return r; };
  const self = { st, sel: [0, 0, 0, 0] };
  G.PlayModals.Notebook.prototype.drawSuspects.call(self, ctx, '#000', body);
  list.forEach((s, i) => {
    const x = 70 + i * (cw + 12), y = 104; stats.cards++;
    const nm = blocks.find((b) => b.txt === s.name && Math.abs(b.x - (x + cw / 2)) < 0.01);
    const ds = blocks.find((b) => b.txt === s.desc && Math.abs(b.x - (x + 12)) < 0.01);
    const p = (c, m) => { if (c) probs.push(`${tag} «${s.name}» (${Math.round(cw)} px, ${list.length} sosp.): ${m}`); };
    if (!nm) { p(true, 'el nombre no se dibujó con caja (maxH)'); return; }
    if (nm.L.lines.length >= 2) stats.nm2++;
    p(nm.L.truncated || nm.L.lines.some((l) => /…$/.test(l)), 'nombre recortado con «…»');
    p(nm.L.lines.some((l) => ctx.font && l.length * nm.L.size * fb > cw - 16 + 0.5), 'una línea del nombre ancha de más');
    p(nm.y < y + 120, 'el nombre empieza dentro del retrato (y+' + (nm.y - y) + ')');
    const nameBottom = nm.y + nm.L.h;
    if (!ds) { p(!!s.desc, 'la descripción no se dibujó con caja (maxH)'); return; }
    p(nameBottom > ds.y + 0.5, `el nombre (acaba en y+${(nameBottom - y).toFixed(0)}) pisa la descripción (empieza en y+${(ds.y - y).toFixed(0)})`);
    p(ds.y + ds.L.h > y + 250 + 0.5, `la descripción acaba en y+${(ds.y + ds.L.h - y).toFixed(0)} (pasa de «Sospecha», y+250)`);
    p(ds.L.truncated || ds.L.lines.some((l) => /…$/.test(l)), 'descripción recortada con «…»');
    p(ds.L.lines.some((l) => l.length * ds.L.size * fn > cw - 24 + 0.5), 'una línea de la descripción ancha de más');
    if (ds.L.shrunk) stats.descShrunk++;
  });
  G.save.data.settings.bigText = false;
  return { probs, stats };
}

// 1) todo el conjunto de casos y el caso extremo, sobre el código tal cual está
function correr(G) {
  const cases = [];
  for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) cases.push(r.def); }
  if (G.CASES && G.CASES.tarta) cases.push(G.CASES.tarta);
  const probs = [], tot = { cards: 0, nm2: 0, descShrunk: 0 }, pool = [];
  for (const [fb, fn] of FACTORS) for (const big of [false, true]) for (const d of ['easy', 'normal', 'hard']) cases.forEach((def) => {
    const st = new G.CaseState(JSON.parse(JSON.stringify(def)), d), list = st.boardOptions().suspects;
    if (fb === FACTORS[0][0] && !big && d === 'normal' && list.length >= 5) list.forEach((s) => pool.push(s));   // solo de casos con 5-6 tarjetas (las estrechas)
    const r = auditar(G, list, big, fb, fn, `[${d}${big ? '+grande' : ''} ×${fb}]`, st);
    probs.push(...r.probs); Object.keys(tot).forEach((k) => (tot[k] += r.stats[k]));
  });
  // caso extremo: 6 tarjetas (123 px) con los nombres/descripciones más largos de los casos reales de 5-6 tarjetas y un nombre inventado de 23 letras
  const byName = pool.slice().sort((a, b) => b.name.length - a.name.length), byDesc = pool.slice().sort((a, b) => (b.desc || '').length - (a.desc || '').length);
  const worst = [byName[0], byName[1], byDesc[0], byDesc[1], { name: 'Doña Ludmila Escarapela', look: byName[0].look, desc: byDesc[0].desc }, { name: 'Bartolo', look: byName[0].look, desc: 'Siempre llega tarde y mastica ajos crudos delante de todos.' } /* descripción que solo cabe REDUCIENDO la letra (vigila el tope y+250) */];
  for (const [fb, fn] of FACTORS) for (const big of [false, true]) {
    const r = auditar(G, worst.map((s, i) => Object.assign({}, s, { id: 'x' + i })), big, fb, fn, `[extremo 6 tarjetas${big ? '+grande' : ''} ×${fb}]`);
    probs.push(...r.probs); Object.keys(tot).forEach((k) => (tot[k] += r.stats[k]));
  }
  return { probs, tot, casos: cases.length };
}

let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++; };
const G0 = loadG(EXTRA), base = correr(G0);
base.probs.slice(0, 15).forEach((p) => console.log('    ' + p));
ok(base.casos >= N, `casos generados: ${base.casos}`);
ok(base.tot.cards > 3000, `tarjetas dibujadas: ${base.tot.cards} (${base.tot.nm2} con el nombre en 2 líneas; descripción reducida de tamaño en ${base.tot.descShrunk})`);
ok(base.tot.nm2 > 50, 'hay nombres de 2 líneas en la muestra (si no, la prueba no vigilaría nada)');
ok(base.probs.length === 0, `el nombre no pisa la descripción, nada se recorta ni se sale de la tarjeta (problemas: ${base.probs.length})`);
// 2) mutación: contra cada versión estropeada la prueba DEBE encontrar problemas
MUT.forEach(([nombre, de, a]) => {
  let aplicado = false;
  const G1 = loadG(EXTRA, (f, t) => { if (f === 'play.js') { aplicado = t.includes(de); return t.split(de).join(a); } return t; });
  ok(aplicado, 'mutación «' + nombre + '»: el texto a estropear existe en play.js (si cambia el código, actualizar la prueba)');
  const m = correr(G1);
  ok(m.probs.length > 0, `mutación «${nombre}»: la prueba la detecta (${m.probs.length} problemas)`);
});
console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
