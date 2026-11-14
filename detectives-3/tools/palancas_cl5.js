// palancas_cl5.js — CL-5 (LOW, solo diagnóstico): ¿cuántos minutos HUMANOS (bot × 1,7, partida COMPLETA) aporta cada palanca de contenido por nivel?
// Uso: GENV=7 node tools/palancas_cl5.js [N=40] [exp1 exp2 a+b+c ...]    (sin experimentos = todos los sueltos; «a+b» = combinación)
// Cada experimento cambia los DATOS EN MEMORIA (nada de src/, GEN_VERSION solo en memoria) y vuelve a la receta v7 de partida antes del siguiente.
// Mismas semillas en todos los experimentos (i*7919+1; se queda con las que salen del nivel pedido al azar natural → comparables con tools/acusacion_temprana.js).
// Por nivel informa: minutos (mediana · media · mín–máx · p90), casos > 45, atascos/derrotas, y la CALIDAD (G.qualityCase; regla 7: cada nivel por separado).
// Informe: /tmp/palancas_cl5.json
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const args = process.argv.slice(2), N = +args[0] > 0 ? +args[0] : 40, EXPS = args.filter((a, i) => !(i === 0 && +a > 0));
const LV = (process.env.LV ? process.env.LV.split(',') : ['facil', 'normal', 'dificil']), C = G.GEN_DATA.compile;
const clone = (x) => JSON.parse(JSON.stringify(x));
const ORIG = { levels: clone(C.levels), extra: clone(C.extra), mech: { pushChance: C.mech.pushChance, watchChanceV6: C.mech.watchChanceV6, herr2: clone(C.mech.herr2) }, decoy: clone(G.DECOY_RANGE_V7) };
const reset = () => { C.levels = clone(ORIG.levels); C.extra = clone(ORIG.extra); C.mech.pushChance = ORIG.mech.pushChance; C.mech.watchChanceV6 = ORIG.mech.watchChanceV6; C.mech.herr2 = clone(ORIG.mech.herr2); G.DECOY_RANGE_V7 = clone(ORIG.decoy); };
const bump = (pairs, d, cap) => pairs.map((p) => [Math.min(cap, Math.max(0, p[0] + d)), p[1]]);
// palancas (L = nivel donde se aplica)
const PAL = {
  base: () => {},
  curios: (L) => { C.levels[L].targetMin = 60; C.levels[L].targetMinV7 = 60; C.extra.targetMin = 60; },                              // relleno de curiosidades hasta el tope del banco (32; máx. 9 por sala)
  charlas: () => { C.extra.maxChatPerNpc = 4; },                                                         // charlas de detalle (humor): el bot NO las pregunta → debe dar 0 min
  sosp: (L) => { const s = C.levels[L].suspects; C.levels[L].suspects = [Math.min(7, s[0] + 1), Math.min(7, s[1] + 1)]; }, // +1 sospechoso (más temas de charla y coartadas)
  enganos: (L) => { const r = G.DECOY_RANGE_V7[L]; G.DECOY_RANGE_V7[L] = [Math.min(3, r[0] + 1), Math.min(3, r[1] + 1)]; }, // +1 engañoso (más descarte y pistas falsas)
  sala: (L) => { const e = C.levels[L].extraPlacesV7; if (e) C.levels[L].extraPlacesV7 = [Math.min(5, e[0] + 1), Math.min(5, e[1] + 1)]; }, // +1 sala (tope del banco: 6 salas con el Despacho)
  sigilo: () => { C.mech.pushChance = 1; C.mech.watchChanceV6 = 1; },                                    // siempre una pista de empujar y una de sigilo
  tm: (L, a) => { C.levels[L].targetMin = +a; C.levels[L].targetMinV7 = +a; },                                                       // tm:NN = objetivo del relleno (min del medidor)
  chat: (L, a) => { C.extra.maxChatPerNpc = +a; },                                                      // chat:N = tope de charlas por personaje
  bcur: (L, a) => { const b = C.extra.curios; for (let i = 0; i < +a; i++) b.push(b[i % 32]); },        // bcur:N = N curiosidades NUEVAS más en el banco (clonadas: solo para medir tiempo)
  bcha: (L, a) => { const b = C.extra.chat; for (let i = 0; i < +a; i++) b.push(b[i % 28]); },          // bcha:N = N charlas NUEVAS más en el banco (clonadas: solo para medir tiempo)
  herr: (L) => { const h = C.mech.herr2.levels[L]; ['lupa', 'uv', 'ganzua'].forEach((t) => { h[t] = bump(h[t], 1, 4); }); h.libres = bump(h.libres, 1, 4); }, // +1 pista de herramienta por tipo y +1 libre
};
const ALIAS = { base: 'base' };
const stat = (a) => { const s = a.slice().sort((x, y) => x - y), m = (x) => Math.round(x * 10) / 10; return a.length ? { n: a.length, med: m(s[s.length >> 1]), media: m(a.reduce((x, y) => x + y, 0) / a.length), min: m(s[0]), max: m(s[s.length - 1]), p90: m(s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]) } : null; };
// semillas por nivel (azar natural del nivel; la receta de partida decide cuáles; se reutilizan en todos los experimentos)
const SEEDS = { facil: [], normal: [], dificil: [] };
reset();
for (let i = 1; i < 2000 && LV.some((k) => SEEDS[k].length < N); i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true }); if (r.error || !r.def.genLevel) continue; if (SEEDS[r.def.genLevel].length < N) SEEDS[r.def.genLevel].push(sd); }
const run = (exp, L) => {
  reset(); C.extra.curios = C.extra.curios.slice(); C.extra.chat = C.extra.chat.slice(); exp.split('+').forEach((p) => { const [k, a] = p.split(':'); if (!PAL[k]) throw new Error('palanca desconocida: ' + p); PAL[k](L, a); });
  const mins = [], q = [], feat = { rooms: [], sus: [], curios: [], steps: [] }; let bad = 0, err = 0, over = 0, acc = 0;
  SEEDS[L].forEach((sd) => {
    const r = G.generateCase(sd, { register: true, level: L }); if (r.error) { err++; return; }
    const x = G.qualityCase(r.def), b = x.bot || {};
    if (!b.win || b.stuck) bad++; if (b.humanMinutes > 45) over++; if (x.accept) acc++;
    mins.push(b.humanMinutes); q.push(x.quality);
    const f = G.meterFeatures(r.def); feat.rooms.push(f.rooms); feat.curios.push(f.curios); feat.steps.push(f.steps); feat.sus.push(Object.values(r.def.npcs).filter((n) => !n.cat && n.id !== 'aliado').length);
  });
  const av = (a) => Math.round(10 * a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)) / 10;
  return { min: stat(mins), calidad: stat(q), atascosODerrotas: bad, sobre45: over, erroresGen: err, aceptados: acc, salas: av(feat.rooms), sosp: av(feat.sus), curios: av(feat.curios), pasos: av(feat.steps) };
};
const list = EXPS.length ? EXPS : ['base'].concat(Object.keys(PAL).filter((k) => k !== 'base'));
const out = { N, genV: G.GEN_VERSION, exps: {} };
console.log(`CL-5 palancas · GEN_VERSION ${G.GEN_VERSION} (en memoria) · N=${N} por nivel · minutos HUMANOS = bot × 1,7, partida completa; Δ = mediana − mediana de «base»\n`);
list.forEach((e) => {
  out.exps[e] = {};
  LV.forEach((L) => {
    const o = out.exps[e][L] = run(e, L), b = (out.exps.base && out.exps.base[L]) || o;
    if (!o.min) { console.log(`${e.padEnd(26)} ${L.padEnd(7)} SIN CASOS: el generador da error en ${o.erroresGen} de ${SEEDS[L].length} semillas (la palanca no cabe)`); return; }
    const d = Math.round((o.min.med - b.min.med) * 10) / 10;
    console.log(`${e.padEnd(26)} ${L.padEnd(7)} med ${String(o.min.med).padStart(5)} (Δ ${(d >= 0 ? '+' : '') + d}) · media ${o.min.media} · ${o.min.min}–${o.min.max} · p90 ${o.min.p90} · >45: ${o.sobre45} · atascos/derrotas ${o.atascosODerrotas} · calidad ${o.calidad.min}/${o.calidad.media}/${o.calidad.max} (med ${o.calidad.med}) · acept. ${o.aceptados}/${o.min.n} · salas ${o.salas} sosp ${o.sosp} curios ${o.curios} pasos ${o.pasos}${o.erroresGen ? ' · ERRORES gen ' + o.erroresGen : ''}`);
  });
  console.log('');
});
reset();
fs.writeFileSync('/tmp/palancas_cl5.json', JSON.stringify(out, null, 1));
console.log('Informe: /tmp/palancas_cl5.json');
