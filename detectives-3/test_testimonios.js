// test_testimonios.js — reparto de herramientas (cp. 184, S1): con GEN_VERSION >= 7 CADA mentira del culpable lleva una refutación por TESTIMONIO de personaje, y la de un inocente
// que miente la lleva siempre que haya un testigo honesto (el descarte pasa a ser testimonio). v6 no cambia (sigue habiendo mentiras solo con objetos). Con mutaciones de gen_clues.js.
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } };
function medir(patch, ver) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = ver;
  let culSin = 0, culTot = 0, inocSin = 0, inocTot = 0, casos = 0, nopts = 0;
  for (let i = 1; i <= 60; i++) {
    const r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error || !r.bible) continue; casos++;
    const by = {}; r.bible.clues.forEach((c) => { by[c.id] = c; });
    r.bible.lies.forEach((l) => { const t = l.refutedBy.some((id) => by[id] && by[id].source.type === 'npc'); if (l.who === r.bible.truth.culprit) { culTot++; if (!t) culSin++; } else { inocTot++; if (!t) inocSin++; } });
    const errs = G.validateCase(r.def); if (errs && errs.length) nopts++;
  }
  return { culSin, culTot, inocSin, inocTot, casos, invalidas: nopts };
}
const quita = (f, t) => (f === 'gen_clues.js' ? t.replace("if (G.GEN_VERSION >= 7 && wit && isLiar(s)) kind = 'testimonio';", '') : t);
const quita2 = (f, t) => (f === 'gen_clues.js' ? t.replace('if (!culRefs.some(isNpc))', 'if (false)') : t);
const v7 = medir(null, 7), v6 = medir(null, 6);
console.log('v7', JSON.stringify(v7), '· v6', JSON.stringify(v6));
ok(v7.casos >= 55, 'v7 genera casos');
ok(v7.culTot > 0 && v7.culSin === 0, 'v7: la mentira del culpable lleva testimonio en todos los casos');
ok(v7.inocSin / v7.inocTot < 0.3, 'v7: menos del 30 % de las mentiras de inocentes quedan solo con objetos (medido 11-24 %: mentirosos sin testigo honesto)');
ok(v6.culSin > 0 && v6.inocSin / v6.inocTot > 0.4, 'v6 NO cambia: sigue habiendo mentiras solo con objetos');
ok(!v7.invalidas, 'v7: todos los casos pasan G.validateCase');
const m1 = medir(quita, 7), m2 = medir(quita2, 7);
ok(m1.inocSin / m1.inocTot >= 0.4, 'mutación «el descarte del mentiroso deja de ser testimonio»: detectada');
ok(m2.culSin > 0, 'mutación «el culpable deja de recibir testimonio»: detectada');
console.log(bad ? 'test_testimonios: ' + bad + ' FALLOS' : 'test_testimonios: OK'); process.exit(bad ? 1 : 0);
