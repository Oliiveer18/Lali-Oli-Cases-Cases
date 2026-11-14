// palancas_duracion.js — b2 paso 3-bis, parte 1/3: ¿qué contenido hace falta para que cada nivel llegue a su banda? (solo lectura)
// Uso: node tools/palancas_duracion.js [N=120] [paso=7919]   (semilla = i*paso+1; los 3 niveles con la MISMA semilla)
// Mide, por (salas, sospechosos), los segundos humanos que da el contenido BASE (sin curiosidades de relleno), cuánto relleno falta
// para el objetivo de cada nivel y si el banco de curiosidades alcanza. Informe en /tmp/palancas_duracion.json.
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV; // CL-5: GENV=7 mide la receta v7 sin subir la versión (solo en memoria)
const N = +process.argv[2] || 120, STEP = +process.argv[3] || 7919;
const Q = G.QUALITY_CFG, BAND = { facil: Q.bandOf('facil'), normal: Q.bandOf('normal'), dificil: Q.bandOf('dificil') }, CEIL = Q.ceilingOf(), FLOOR = Q.floorOf(); // TIEMPOS-4: la franja oficial de la versión activa (v7 con GENV=7: 20-28 · 28-36 · 36-45, techo 45); antes bandas fijas 20-30 · 30-40 · 40-55
const M = G.METER_CFG, EX = G.GEN_DATA.compile.extra;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), r1 = (x) => Math.round(x * 10) / 10;
const rows = [];
for (let i = 1; i <= N; i++) {
  for (const L of ['facil', 'normal', 'dificil']) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
    const f = G.meterFeatures(r.def), sus = Object.values(r.def.npcs).filter((n) => !n.cat && n.id !== 'aliado').length;
    const baseSec = G.meterSeconds(Object.assign({}, f, { curios: 0, chats: 0 }));
    rows.push({ L, rooms: f.rooms, sus, topics: f.topics, steps: f.steps, curios: f.curios, baseSec, sec: G.meterSeconds(f) });
  }
}
const out = { n: N, bank: { curios: EX.curios.length, maxCurioPerRoom: EX.maxCurioPerRoom, places: G.GEN_DATA.places.length }, targetMinActual: EX.targetMin, perLevel: {}, combos: {}, meter: { perRoom: M.perRoom, perTopic: M.perTopic, perStep: M.perStep, perCurio: M.perCurio } };
console.log(`Banco: ${out.bank.curios} curiosidades (máx ${out.bank.maxCurioPerRoom} por sala), ${out.bank.places} lugares. Medidor: sala ${r1(M.perRoom)} s · tema ${r1(M.perTopic)} s · paso ${r1(M.perStep)} s · curiosidad ${r1(M.perCurio)} s. targetMin actual ${EX.targetMin} (igual en los 3 niveles).`);
console.log('\nHOY por nivel (minutos humanos estimados por el MEDIDOR, no por el bot; mín/mediana/media/máx y casos fuera de tope):');
['facil', 'normal', 'dificil'].forEach((L) => {
  const a = rows.filter((x) => x.L === L), mins = a.map((x) => x.sec / 60);
  const inB = a.filter((x) => x.sec / 60 >= BAND[L][0] && x.sec / 60 <= BAND[L][1]).length;
  out.perLevel[L] = { n: a.length, min: r1(Math.min(...mins)), mediana: r1(mins.slice().sort((x, y) => x - y)[mins.length >> 1]), media: r1(mean(mins)), max: r1(Math.max(...mins)), enBanda: Math.round(100 * inB / a.length), sobreTope: mins.filter((x) => x > BAND[L][1]).length, sobreTecho: mins.filter((x) => x > CEIL).length, bajoMinimo: mins.filter((x) => x < FLOOR).length, salas: r1(mean(a.map((x) => x.rooms))), sosp: r1(mean(a.map((x) => x.sus))), temas: r1(mean(a.map((x) => x.topics))), pasos: r1(mean(a.map((x) => x.steps))), curios: r1(mean(a.map((x) => x.curios))) };
  const o = out.perLevel[L]; console.log(`  ${L.padEnd(8)} n=${o.n} · mín/mediana/media/máx ${o.min}/${o.mediana}/${o.media}/${o.max} min · en banda ${BAND[L].join('-')}: ${o.enBanda} % · sobre el tope ${BAND[L][1]}: ${o.sobreTope} · sobre el techo ${CEIL}: ${o.sobreTecho} · bajo ${FLOOR}: ${o.bajoMinimo} · salas ${o.salas} · sospechosos ${o.sosp} · temas ${o.temas} · pasos ${o.pasos} · curiosidades ${o.curios}`);
});
console.log('\nCONTENIDO BASE (sin relleno) por combinación salas × sospechosos (todos los niveles juntos): minutos base y relleno que falta para cada centro de banda:');
const TARGET = { facil: Q.medianOf('facil'), normal: Q.medianOf('normal'), dificil: Q.medianOf('dificil') }; // centro = mediana oficial de cada nivel
const keys = {}; rows.forEach((x) => { (keys[x.rooms + 'x' + x.sus] = keys[x.rooms + 'x' + x.sus] || []).push(x); });
Object.keys(keys).sort().forEach((k) => {
  const a = keys[k], base = mean(a.map((x) => x.baseSec)) / 60, cap = Math.min(EX.curios.length, EX.maxCurioPerRoom * a[0].rooms);
  const need = {}; ['facil', 'normal', 'dificil'].forEach((L) => { need[L] = Math.max(0, Math.ceil((TARGET[L] * 60 - base * 60) / M.perCurio)); });
  out.combos[k] = { n: a.length, baseMin: r1(base), curiosCap: cap, curiosNecesarias: need, techoMin: r1(base + cap * M.perCurio / 60) };
  console.log(`  ${k.replace('x', ' salas × ')} sosp. (n=${a.length}) · base ${r1(base)} min · techo con ${cap} curiosidades ${r1(base + cap * M.perCurio / 60)} min · curiosidades para el centro de banda: Fácil ${need.facil} · Normal ${need.normal} · Difícil ${need.dificil}`);
});
fs.writeFileSync('/tmp/palancas_duracion.json', JSON.stringify(out, null, 1));
console.log('\nInforme: /tmp/palancas_duracion.json');
