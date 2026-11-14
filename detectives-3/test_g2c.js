// Prueba del objetivo g2c «Graba las charlas» (c3 subpaso 3/4, GEN_VERSION >= 7). Uso: node test_g2c.js   (N semillas: G2C_N, por defecto 120)
// Demuestra, con el motor real y SOLO en memoria (v7 sin subir la versión del repositorio):
//  (1) en v7 el objetivo g2c existe en el cap. 2 de todo caso con charlas y exige TODAS (min = nº de charlas, ids = las pistas de las charlas grabadas);
//  (2) g2b (testimonios) NO trae ninguna charla grabada y conserva su 60 %; (3) los casos sin charla no llevan g2c; (3b) la charla señuelo («falsa_*», c4-3) NO cuenta en g2c;
//  (4) en v6 NO hay g2c y las charlas siguen mezcladas en g2b (receta intacta); (5) MUTACIONES: 5 roturas de compile.js que la prueba DEBE detectar.
const loadG = require('./tools/load_g.js');
const { mutador } = require('./tools/mutar.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.env.G2C_N || 120;

function suite(G, ver) {
  G.GEN_VERSION = ver;
  const fails = []; let checks = 0;
  const ok = (c, m) => { checks++; if (!c && fails.length < 12) fails.push(m); };
  const por = { facil: { n: 0, g2c: 0 }, normal: { n: 0, g2c: 0 }, dificil: { n: 0, g2c: 0 } };
  for (let s = 1; s <= N; s++) {
    let gen; try { gen = G.generateCase(1000 + s * 7919); } catch (e) { ok(false, `semilla ${s}: error ${e.message}`); continue; }
    const d = gen.def, ch2 = d.chapters[1], g2b = ch2.goals.find((g) => g.id === 'g2b'), g2c = ch2.goals.find((g) => g.id === 'g2c');
    const listen = [], decoys = []; Object.keys(d.rooms).forEach((k) => d.rooms[k].props.forEach((p) => { if (p.listen && p.chat && /^obj_/.test(p.id)) (/^falsa_/.test(p.id.replace(/^obj_/, '')) ? decoys : listen).push(p.id.replace(/^obj_/, '')); })); // charla señuelo (c4-3, interruptor charlaSenuelos): id «falsa_*»; NO es charla real y no cuenta en g2c
    const tag = `semilla ${s} (${d.genLevel})`;
    if (por[d.genLevel]) { por[d.genLevel].n++; if (g2c) por[d.genLevel].g2c++; }
    if (ver >= 7) {
      if (listen.length) {
        ok(!!g2c, `${tag}: hay ${listen.length} charla(s) y falta g2c`);
        if (g2c) {
          ok(g2c.min === listen.length, `${tag}: g2c exige todas (min ${g2c.min} de ${listen.length})`);
          ok(g2c.clues.length === listen.length && listen.every((id) => g2c.clues.indexOf(id) >= 0), `${tag}: g2c no contiene exactamente las charlas grabadas`);
        }
      } else ok(!g2c, `${tag}: sin charlas pero con g2c`);
      if (g2c) ok(!decoys.some((id) => g2c.clues.indexOf(id) >= 0), `${tag}: g2c contiene una charla señuelo`);
      if (g2b) {
        ok(!g2b.clues.some((id) => listen.indexOf(id) >= 0), `${tag}: g2b trae una charla grabada`);
        ok(g2b.min === Math.ceil(g2b.clues.length * 0.6), `${tag}: g2b ya no es el 60 % (min ${g2b.min} de ${g2b.clues.length})`);
      }
    } else {
      ok(!g2c, `${tag}: en v6 NO debe haber g2c`);
      if (listen.length) ok(!!g2b && listen.every((id) => g2b.clues.indexOf(id) >= 0), `${tag}: en v6 las charlas siguen dentro de g2b`);
    }
  }
  return { fails, checks, por };
}

const real7 = suite(loadG(EXTRA), 7), real6 = suite(loadG(EXTRA), 6);
console.log(`v7: ${real7.checks} comprobaciones, ${real7.fails.length} fallos · v6: ${real6.checks} comprobaciones, ${real6.fails.length} fallos`);
['facil', 'normal', 'dificil'].forEach((k) => console.log(`  ${k}: ${real7.por[k].n} casos, ${real7.por[k].g2c} con g2c`));
real7.fails.concat(real6.fails).forEach((f) => console.log('  ✗ ' + f));
let bad = real7.fails.length + real6.fails.length;
if (!real7.por.facil.g2c || !real7.por.normal.g2c || !real7.por.dificil.g2c) { console.log('  ✗ algún nivel no tiene ningún caso con g2c'); bad++; }

// ---- mutaciones: cada una estropea compile.js en memoria y la suite v7 DEBE detectarla
const MUT = [
  ['g2c deja de existir', /witnessListen\.length \? \[\{ id: 'g2c'[^\]]*\] : \[\]/, '[]'],
  ['g2c ya no exige todas (min -1)', /min: witnessListen\.length \}/, 'min: Math.max(1, witnessListen.length - 1) }'],
  ['g2b vuelve a mezclar las charlas', /G\.GEN_VERSION >= 7 \? witness\.filter\(\(id\) => !isListen\(id\)\) : witness/, 'witness'],
  ['g2c se queda sin las charlas', /clues: witnessListen, min/, 'clues: [], min'],
  ['g2b deja de ser el 60 %', /min: Math\.ceil\(witnessNpc\.length \* 0\.6\)/, 'min: 1'],
];
let miss = 0;
MUT.forEach(([name, from, to]) => {
  const m = mutador('compile.js', from, to);
  let r; try { r = suite(loadG(EXTRA, m.patch), 7); } catch (e) { r = { fails: ['ERROR: ' + e.message], checks: 0 }; }
  if (!m.ok) { console.log(`  ✗ mutación «${name}»: ${m.motivo} (hay que actualizar el patrón)`); miss++; return; }
  const det = r.fails.length > 0;
  console.log(`  ${det ? '✓' : '✗'} mutación «${name}»: ${det ? 'detectada' : 'NO detectada'} (${r.fails.length} fallos)`);
  if (!det) miss++;
});
console.log(bad === 0 && miss === 0 ? 'test_g2c: OK' : `test_g2c: FALLA (${bad} fallos, ${miss} mutaciones sin detectar)`);
process.exit(bad === 0 && miss === 0 ? 0 : 1);
