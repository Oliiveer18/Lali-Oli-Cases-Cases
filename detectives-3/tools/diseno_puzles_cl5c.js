// diseno_puzles_cl5c.js — CL-5c subpaso a (SOLO MEDIR; nada de src/ cambia): ¿es posible hacer los puzles JUSTOS con lo que ya genera genTruth/genClues?
// Uso: GENV=7 node tools/diseno_puzles_cl5c.js [N=200] [nivel=dificil]
// Mide, sobre N casos con la receta v7: (A) cuántas pistas existentes imprimen una hora y si esas horas sirven para ordenar sucesos; (B) cuántos sucesos de truth.timeline son «aptos» para un puzle
// (inocente, fuera de la ventana del robo, sin tocar coartadas) y cuántos casos admiten una línea de 3 / 4 sucesos con horas separadas ≥ 10 min y textos distintos; (C) cuántos casos admiten un código (HHMM de un suceso apto);
// (D) hueco libre para colocar 3-4 pistas de ambiente (props por sala < 4, más testimonios de personajes). Informe: /tmp/diseno_puzles_cl5c.json
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const args = process.argv.slice(2), N = +args[0] > 0 ? +args[0] : 200, L = args.find((a) => /^(facil|normal|dificil)$/.test(a)) || 'dificil';
const pct = (k, n) => Math.round((1000 * k) / n) / 10;
const seeds = []; for (let i = 1; i < 4000 && seeds.length < N; i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true, level: L }); if (!r.error && r.def.genLevel === L && r.bible) seeds.push([sd, r.bible]); }
const o = { N: seeds.length, nivel: L, genV: G.GEN_VERSION };
let aConHora = 0, aDistintas = 0, aTL3 = 0, aTL4 = 0, aSinFalsa = 0;
const hist = { aptos: {}, cadena: {} }; let tl3 = 0, tl4 = 0, cod = 0, ambos = 0, libresMin = 99, libresSum = 0, sinWit = 0;
seeds.forEach(([sd, b]) => {
  const tr = b.truth, w = tr.window, cu = tr.culprit, tl = tr.timeline;
  // (A) horas impresas en pistas reales (no falsas): ¿cuántas horas DISTINTAS y cuántos sucesos con pista propia y hora distinta?
  const times = {}; let n = 0;
  b.clues.filter((c) => c.role !== 'falsa').forEach((c) => { const m = c.text.match(/\b\d{1,2}:\d{2}\b/g); if (m) { n++; m.forEach((t) => { times[t] = 1; }); } });
  if (n) aConHora++; if (Object.keys(times).length >= 3) aDistintas++;
  const evT = {}; b.clues.filter((c) => c.role !== 'falsa' && Number.isInteger(c.derivedFrom)).forEach((c) => { const m = c.text.match(/\b\d{1,2}:\d{2}\b/); if (m) evT[c.derivedFrom] = m[0]; });
  const dist = Object.keys(evT).map((k) => evT[k]).filter((x, i, a) => a.indexOf(x) === i).length; if (dist >= 3) aTL3++; if (dist >= 4) aTL4++;
  // (B) sucesos aptos
  const ok = tl.map((e, i) => ({ e, i })).filter(({ e }) => e.who !== cu && (e.until <= w.from || e.t >= w.to)).sort((x, y) => x.e.t - y.e.t);
  hist.aptos[ok.length] = (hist.aptos[ok.length] || 0) + 1;
  const chain = []; ok.forEach(({ e, i }) => { if ((!chain.length || e.t - chain[chain.length - 1].e.t >= 10) && !chain.some((c) => c.e.doing === e.doing)) chain.push({ e, i }); });
  hist.cadena[Math.min(chain.length, 6)] = (hist.cadena[Math.min(chain.length, 6)] || 0) + 1;
  if (chain.length >= 3) tl3++; if (chain.length >= 4) tl4++; if (ok.length >= 1) cod++; if (chain.length >= 3 && ok.length >= 1) ambos++;
  // (D) hueco: props por sala (tope 4) y personajes que pueden contar algo (testimonios)
  const cnt = {}; b.places.forEach((p) => { cnt[p.id] = 0; }); b.clues.forEach((c) => { if (c.source.type === 'prop') cnt[c.source.place]++; });
  const libres = b.places.reduce((s, p) => s + Math.max(0, 4 - cnt[p.id]), 0); libresMin = Math.min(libresMin, libres); libresSum += libres;
});
o.A_pistas_existentes = { 'casos con alguna pista real que imprime hora': pct(aConHora, o.N) + ' %', 'casos con ≥3 horas distintas impresas': pct(aDistintas, o.N) + ' %', 'casos con ≥3 sucesos con pista propia y hora distinta (línea de tiempo SIN pistas nuevas)': pct(aTL3, o.N) + ' %', 'idem ≥4': pct(aTL4, o.N) + ' %' };
o.B_sucesos_aptos = { 'sucesos aptos por caso (hist.)': hist.aptos, 'cadena válida (≥10 min, textos distintos; hist., 6 = 6 o más)': hist.cadena, 'casos con línea de 3': pct(tl3, o.N) + ' %', 'casos con línea de 4': pct(tl4, o.N) + ' %' };
o.C_codigo = { 'casos con algún suceso apto (código posible)': pct(cod, o.N) + ' %', 'casos que admiten línea de 3 Y código': pct(ambos, o.N) + ' %' };
o.D_hueco = { 'huecos de objeto libres (sala < 4 objetos de pista) mínimo': libresMin, media: Math.round((10 * libresSum) / o.N) / 10 };
console.log(JSON.stringify(o, null, 1)); fs.writeFileSync('/tmp/diseno_puzles_cl5c.json', JSON.stringify(o, null, 1));
