// casos_sin_cambios.js — prueba de «los casos no cambian» (4F-0b 2/4). Genera N casos por nivel (Fácil/Normal/Difícil) y imprime un resumen + huella SHA-1 de TODO el caso generado.
// Uso: node tools/casos_sin_cambios.js [N=120] [--guardar]   · con --guardar escribe docs/HUELLA_CASOS_4F0B.json (la «foto» de hoy); sin él COMPARA con esa foto y dice IDÉNTICO o qué semillas cambian.
// Sirve para demostrar que un cambio de DATOS en reserva (p. ej. el Despacho) no mueve ni un caso ni un código G6. Los códigos de prueba G6-3wje / G6-2prl / G6-95yj se miran aparte con su dificultad.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = parseInt(process.argv.find((a) => /^\d+$/.test(a)) || '120', 10), FILE = path.join(__dirname, '..', 'docs', 'HUELLA_CASOS_4F0B.json');
const levels = ['facil', 'normal', 'dificil'], out = { N, version: G.GEN_VERSION, niveles: {} };
const sha = (o) => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);
levels.forEach((lv) => {
  const h = [];
  for (let i = 0; i < N; i++) { const seed = 1000 + i * 7919; const r = G.generateCase(seed, { level: lv, difficulty: lv }); h.push(r.error ? 'ERR' : sha([r.code, r.def || r.caseDef || r.case || r])); }
  out.niveles[lv] = h;
});
if (process.argv.includes('--guardar')) { fs.writeFileSync(FILE, JSON.stringify(out)); console.log('Guardada la foto de', N, 'casos × 3 niveles en docs/HUELLA_CASOS_4F0B.json (GEN_VERSION ' + out.version + ')'); process.exit(0); }
if (!fs.existsSync(FILE)) { console.log('No hay foto previa: ejecuta antes con --guardar'); process.exit(1); }
const prev = JSON.parse(fs.readFileSync(FILE, 'utf8')); let diff = 0;
levels.forEach((lv) => { const a = prev.niveles[lv] || [], b = out.niveles[lv]; let d = 0; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) d++; diff += d; console.log(lv.padEnd(8), d === 0 ? 'IDÉNTICO' : d + ' casos distintos', `(${b.length} casos)`); });
console.log(diff === 0 ? 'RESULTADO: IDÉNTICO (ningún caso cambia)' : 'RESULTADO: HAY CAMBIOS (' + diff + ')'); process.exit(diff === 0 ? 0 : 1);
