// salas_4f0b.js — 4F-0b subpaso 1 (medición, sin cambiar nada): ¿cuántas salas usa hoy cada caso generado, por nivel?
// Uso: node tools/salas_4f0b.js [N=300] [inicio=1] [paso=7919]   (semilla = i*paso+1; mismo reparto que calidad_niveles.js)
// Imprime, por nivel: distribución de nº de salas, salas posibles (D.places + callejón), y cuántas veces sale cada sala.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV; // 4F-0b 3/4-b: GENV=7 mide la receta nueva sin subir la versión del repositorio
const args = process.argv.slice(2).filter((a) => !/^--/.test(a)), N = +args[0] || 300, I0 = +args[1] || 1, STEP = +args[2] || 7919;
const LEVELS = ['facil', 'normal', 'dificil'], r1 = (x) => Math.round(x * 10) / 10;
const D = G.GEN_DATA, posibles = D.places.map((p) => p.id);
console.log('salas del escenario (GEN_DATA.places):', posibles.length, posibles.join(', '), '· callejón (escena de calle, ~30 %):', JSON.stringify(D.compile.street));
LEVELS.forEach((L) => {
  const dist = {}, uso = {}, mins = []; let n = 0, err = 0, calle = 0;
  for (let i = I0; i < I0 + N; i++) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L });
    if (r.error) { err++; continue; }
    const ids = Object.keys(r.def.rooms || {}); n++;
    dist[ids.length] = (dist[ids.length] || 0) + 1;
    ids.forEach((id) => { uso[id] = (uso[id] || 0) + 1; });
    if (ids.indexOf('callejon') >= 0) calle++;
  }
  const media = Object.keys(dist).reduce((a, k) => a + k * dist[k], 0) / n;
  console.log(L.padEnd(8) + 'casos ' + n + (err ? ' (errores ' + err + ')' : '') + ' · salas por caso: ' + Object.keys(dist).sort().map((k) => k + '→' + dist[k]).join('  ') + ' · media ' + r1(media) + ' · con callejón ' + Math.round(100 * calle / n) + ' %');
  console.log('        uso de cada sala: ' + Object.keys(uso).sort().map((k) => k + ' ' + Math.round(100 * uso[k] / n) + ' %').join(' · '));
});
const g = D.compile.levels; console.log('config actual (extraPlaces = salas EXTRA además de la del robo): ' + LEVELS.map((L) => L + ' ' + JSON.stringify(G.GEN_VERSION >= 7 && g[L].extraPlacesV7 ? g[L].extraPlacesV7 : g[L].extraPlaces)).join(' · '));
