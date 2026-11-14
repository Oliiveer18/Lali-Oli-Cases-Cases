// baseline.js — NÚMEROS DE PARTIDA de la fábrica de casos (fase 4.0). Mide el estado actual para poder comprobar que cada subfase MEJORA.
// Uso: node tools/baseline.js [semillasHuella=5000] [semillasCalidad=60] [--write]   (--write guarda docs/BASELINE.json con los resultados)
// Modo --comparar [--base=ruta]: mide UNA vez y compara con docs/BASELINE.json SIN reescribirlo (usa las mismas semillas que el fichero salvo que se pasen otras). Dice «IDÉNTICO» o qué cambió; código 0 = idéntico, 1 = cambió, 2 = no se pudo comparar. Sustituye a repetir calidad_niveles.js + regenerar a ojo.
// Mide: huella de caso (unicidad), calidad y duración (bot: mínimo/media/máximo de minutos por nivel y casos fuera de tope; TIEMPOS-4), forma de las biblias, tamaño de salas y longitud de diálogos. Caso 1 como vara de medir.
const fs = require('fs'), path = require('path');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const args = process.argv.slice(2).filter((a) => !a.startsWith('--')), WRITE = process.argv.includes('--write'), COMPARE = process.argv.includes('--comparar');
const BASE_ARG = (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7), BASE_PATH = BASE_ARG ? path.resolve(BASE_ARG) : path.join(__dirname, '..', 'docs', 'BASELINE.json');
let BASE = null;
if (COMPARE) {
  if (WRITE) { console.error('--comparar no escribe nada: quita --write (para regenerar el fichero, ejecuta sin --comparar).'); process.exit(2); }
  try { BASE = JSON.parse(fs.readFileSync(BASE_PATH, 'utf8')); } catch (e) { console.error('No puedo leer la línea base (' + BASE_PATH + '): ' + e.message); process.exit(2); }
}
const NF = +args[0] || (BASE && BASE.fingerprintSeeds) || 5000, NQ = +args[1] || (BASE && BASE.qualitySeeds) || 60;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), r1 = (x) => Math.round(x * 10) / 10;
const rng = (a) => ({ min: r1(Math.min(...a)), media: r1(avg(a)), max: r1(Math.max(...a)) });

// diálogo de un def: temas por personaje, líneas de charla, caracteres de respuestas y de pistas
function dialogue(def) {
  const npcs = Object.values(def.npcs), say = (x) => (Array.isArray(x) ? x : (x && x.say) || []);
  const topics = npcs.map((n) => (n.topics || []).length);
  let chars = 0, lines = 0;
  npcs.forEach((n) => (n.topics || []).forEach((t) => (t.responses || []).forEach((rs) => say(rs).forEach((l) => { chars += String(l).length; lines++; }))));
  return { npcs: npcs.length, topicsPerNpc: avg(topics), chatLines: avg(npcs.map((n) => (n.chat || []).length)), pressLines: avg(npcs.map((n) => (n.press || []).length)), charsPerLine: lines ? chars / lines : 0 };
}
function rooms(def) { const R = Object.values(def.rooms); return { rooms: R.length, propsPerRoom: avg(R.map((r) => (r.props || []).length)), emptyRooms: R.filter((r) => !(r.props || []).length).length }; }

const t0 = Date.now(), out = { version: G.VERSION, genVersion: G.GEN_VERSION, fingerprintSeeds: NF, qualitySeeds: NQ };

// 1) huella de caso
const fps = [], shapes = {}, dl = [], rm = [], lookUse = {};
let repeatedLooks = 0;
for (let s = 0; s < NF; s++) {
  const r = G.generateCase(s); if (r.error) continue;
  fps.push(G.caseFingerprint(r.def, r.bible));
  const ls = r.bible.cast.map((c) => c.look); ls.forEach((l) => { lookUse[l] = (lookUse[l] || 0) + 1; }); if (new Set(ls).size !== ls.length) repeatedLooks++; // 4B: aspectos
  const b = r.bible, k = `${b.proof.length} pruebas · ${b.lies.length} mentiras · ${b.cast.filter((c) => c.role === 'sospechoso').length} sospechosos`;
  shapes[k] = (shapes[k] || 0) + 1;
  if (s < 300) { dl.push(dialogue(r.def)); rm.push(rooms(r.def)); }
}
const st = G.fingerprintStats(fps);
out.fingerprint = { n: st.n, distinct: st.distinct, topShare: r1(st.topShare * 100) + ' %', fields: st.fields, topShareByField: Object.fromEntries(Object.entries(st.topShareByField).map(([k, v]) => [k, r1(v * 100) + ' %'])), goals: G.fingerprintGoals(st) };
out.shapes = shapes;
out.looks = { distinctUsed: Object.keys(lookUse).length, poolSize: (G.GEN_LOOK_IDS || []).length, casesWithRepeatedLook: repeatedLooks };
out.dialogue = { topicsPerNpc: r1(avg(dl.map((d) => d.topicsPerNpc))), chatLines: r1(avg(dl.map((d) => d.chatLines))), pressLines: r1(avg(dl.map((d) => d.pressLines))), charsPerLine: r1(avg(dl.map((d) => d.charsPerLine))) };
out.rooms = { rooms: r1(avg(rm.map((x) => x.rooms))), propsPerRoom: r1(avg(rm.map((x) => x.propsPerRoom))), emptyRoomsPerCase: r1(avg(rm.map((x) => x.emptyRooms))) };

// 2) calidad con el bot POR NIVEL (S3b-2; regla del usuario: nunca una media mezclada). Unidad = par (caso, dificultad): el caso se genera en cada nivel y el bot juega en su dificultad.
const LEVELS = ['facil', 'normal', 'dificil'], pq = {}, MQ = (x, f) => x.map(f);
LEVELS.forEach((L) => {
  const rows = [], par = [], rew = [], estMin = [], ch = [];
  for (let s = 0; s < NQ; s++) {
    const r = G.generateCase(s * 7919 + 1, { register: true, level: L }); if (r.error) continue;
    const Q = G.qualityCase(r.def); rows.push(Q); par.push(r.def.parSeconds); rew.push(r.def.reward); estMin.push(r.meter ? r.meter.humanMinutes : 0);
    const pc = (Q.bot.perChapter || []).map((c) => c.seconds), tot = pc.reduce((a, b) => a + b, 0) || 1; ch.push(Math.max(...pc) / tot * 100);
  }
  const bd = G.QUALITY_CFG.bandOf(L), parts = {}; Object.keys(rows[0].parts).forEach((k) => { parts[k] = r1(avg(MQ(rows, (x) => x.parts[k]))); });
  pq[L] = { casos: rows.length, calidad: rng(MQ(rows, (x) => x.quality)), intrinseca: r1(avg(MQ(rows, (x) => x.intrinseca))), ajuste: r1(avg(MQ(rows, (x) => x.ajuste))), aceptados: rows.filter((x) => x.accept).length + '/' + rows.length, errores: rows.filter((x) => !x.ok).length,
    minutosHumanos: rng(MQ(rows, (x) => x.bot.humanMinutes)), banda: bd[0] + '-' + bd[1], techo: G.QUALITY_CFG.ceilingOf(), minimoAbsoluto: G.QUALITY_CFG.floorOf(),
    fueraDeTope: { sobreTopeNivel: rows.filter((x) => x.bot.humanMinutes > bd[1]).length, sobreTecho: rows.filter((x) => x.bot.humanMinutes > G.QUALITY_CFG.ceilingOf()).length, bajoMinimo: rows.filter((x) => x.bot.humanMinutes < G.QUALITY_CFG.floorOf()).length }, enBanda_pct: Math.round(100 * rows.filter((x) => x.bot.humanMinutes >= bd[0] && x.bot.humanMinutes <= bd[1]).length / rows.length), partes: parts, // TIEMPOS-4: casos fuera de tope (de su nivel / techo duro / mínimo absoluto)
    capituloMasLargo_pct: rng(ch), parSeconds: rng(par), reward: rng(rew), minutosEstimadosMedidor: rng(estMin) };
});
out.quality = { QUALITY_VERSION: G.QUALITY_VERSION, QUALITY_MIN: G.QUALITY_MIN, porNivel: pq };
const Q1 = G.qualityCase(G.CASES.tarta), d1 = dialogue(G.CASES.tarta), f1 = G.caseFingerprint(G.CASES.tarta);
out.caso1 = { calidad: Q1.quality, minutosHumanos: Q1.bot.humanMinutes, topicsPerNpc: r1(d1.topicsPerNpc), charsPerLine: r1(d1.charsPerLine), propsPerRoom: r1(rooms(G.CASES.tarta).propsPerRoom), mecanicas: f1.mechanic };
out.segundos = Math.round((Date.now() - t0) / 1000);

if (COMPARE) compareAndExit(); // no vuelve
console.log(JSON.stringify(out, null, 2));
if (WRITE) { const p = path.join(__dirname, '..', 'docs', 'BASELINE.json'); fs.writeFileSync(p, JSON.stringify(out, null, 2) + '\n'); console.log('Guardado ' + p); }

// ---- --comparar: diferencias entre lo medido ahora y la línea base, sin escribir nada
function compareAndExit() {
  const now = JSON.parse(JSON.stringify(out)), IGNORE = new Set(['segundos']), diffs = [], notes = [];
  const walk = (a, b, p) => {
    if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => walk(a[k], b[k], p ? p + '.' + k : k)); return; }
    if (a !== b) diffs.push({ p, a, b });
  };
  walk(BASE, now, '');
  const real = diffs.filter((d) => !IGNORE.has(d.p) && d.p !== 'version');
  if (BASE.version !== now.version) notes.push('etiqueta de versión: ' + BASE.version + ' → ' + now.version + ' (no cuenta como cambio de medidas)');
  if (BASE.fingerprintSeeds !== NF || BASE.qualitySeeds !== NQ) notes.push('OJO: se midió con otras semillas que la línea base (' + NF + '/' + NQ + ' frente a ' + BASE.fingerprintSeeds + '/' + BASE.qualitySeeds + '): las diferencias no son fiables');
  console.log('LÍNEA BASE · ' + (path.relative(process.cwd(), BASE_PATH).startsWith('..') ? BASE_PATH : path.relative(process.cwd(), BASE_PATH)) + ' · ' + NF + ' huellas · ' + NQ + ' casos por nivel · medido en ' + out.segundos + ' s');
  LEVELS.forEach((L) => { const q = now.quality.porNivel[L]; console.log('  ' + L.padEnd(7) + ' nota ' + q.calidad.min + '/' + q.calidad.media + '/' + q.calidad.max + ' · minutos ' + q.minutosHumanos.min + '/' + q.minutosHumanos.media + '/' + q.minutosHumanos.max + ' · aceptados ' + q.aceptados + ' · en banda ' + q.banda + ': ' + q.enBanda_pct + ' % · sobre el tope ' + q.fueraDeTope.sobreTopeNivel + ' · sobre el techo ' + q.techo + ': ' + q.fueraDeTope.sobreTecho + ' · bajo ' + q.minimoAbsoluto + ': ' + q.fueraDeTope.bajoMinimo); });
  console.log('  huellas distintas ' + now.fingerprint.distinct + ' de ' + now.fingerprint.n + ' · caso 1: nota ' + now.caso1.calidad + ', ' + now.caso1.minutosHumanos + ' min');
  notes.forEach((n) => console.log('  ' + n));
  if (!real.length) { console.log('RESULTADO: IDÉNTICO a la línea base (no hace falta regenerarla).'); process.exit(0); }
  console.log('RESULTADO: CAMBIÓ (' + real.length + ' valores). Antes → ahora:');
  real.slice(0, 40).forEach((d) => console.log('  ' + d.p + ': ' + JSON.stringify(d.a) + ' → ' + JSON.stringify(d.b)));
  if (real.length > 40) console.log('  … y ' + (real.length - 40) + ' más');
  console.log('Si el cambio es intencionado: node tools/baseline.js --write (regenera docs/BASELINE.json).');
  process.exit(1);
}
