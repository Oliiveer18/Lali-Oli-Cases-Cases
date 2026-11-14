// test_situaciones.js — situaciones macabras 1-3 por caso (cp. 185, S3, GEN_VERSION >= 7): todos los casos llevan de 1 a 3 (más con 2) con las situaciones existentes; v6 NO cambia. Con mutación.
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } };
function medir(patch, ver) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = ver; const h = { 0: 0, 1: 0, 2: 0, 3: 0 }; let casos = 0, cur = 0, inval = 0;
  for (let i = 1; i <= 90; i++) {
    const r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error || !r.def) continue; casos++;
    let n = 0, c = 0; Object.keys(r.def.rooms).forEach((rid) => (r.def.rooms[rid].props || []).forEach((p) => { if (/^sit_/.test(p.id)) n++; else if (/^cur_/.test(p.id)) c++; }));
    h[Math.min(n, 9)] = (h[Math.min(n, 9)] || 0) + 1; cur += c; const e = G.validateCase(r.def); if (e && e.length) inval++;
  }
  return { h, casos, cur: cur / (casos || 1), inval };
}
const v7 = medir(null, 7), v6 = medir(null, 6);
console.log('v7', JSON.stringify(v7), '· v6', JSON.stringify(v6));
ok(v7.casos >= 80, 'v7 genera casos');
ok(v7.h[0] <= v7.casos * 0.05, 'v7: casi todos los casos llevan al menos 1 situación (si no hay hueco se omite)');
ok(!Object.keys(v7.h).some((k) => +k > 3 && v7.h[k]), 'v7: nunca más de 3 situaciones');
ok(v7.h[2] > v7.h[1] && v7.h[2] > v7.h[3], 'v7: más casos con 2 que con 1 o con 3');
ok(v7.inval === 0, 'v7: todos los casos pasan G.validateCase');
ok(v6.h[0] > v7.h[0], 'v6 NO cambia: sigue habiendo casos sin situaciones (ambiente claro)');
const quita = (f, t) => (f === 'compile.js' ? t.replace('G.GEN_VERSION >= 7 && MX.sit.counts', 'false') : t);
const m = medir(quita, 7);
ok(m.h[0] > v7.h[0] + 10, 'mutación «v7 sin situaciones en todos los casos»: detectada');
console.log(bad ? 'test_situaciones: ' + bad + ' FALLOS' : 'test_situaciones: OK'); process.exit(bad ? 1 : 0);
