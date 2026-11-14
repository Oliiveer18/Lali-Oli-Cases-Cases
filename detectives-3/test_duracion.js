// Prueba de la DURACIÓN POR NIVEL (3-bis 3/3; reescrita en TIEMPOS-3, cp. 263 para la duración OFICIAL v7). Uso: node test_duracion.js
//   DUR_N = casos por nivel con el bot (def. 100) · DUR_NM = casos por nivel en cada mutación (def. 40) · DUR_ESTRICTO=0 = vuelve a solo límites duros (por defecto la prueba es ESTRICTA desde TIEMPOS-6: tope de CADA nivel y rango completo)
// Minutos = los del BOT jugando (`bot.humanMinutes`, bot × 1,7), que es lo que puntúa `quality.js`. El medidor (`meterSeconds`) NO se usa: da menos minutos (Difícil ≈ 34 frente a ≈ 39 reales).
// La receta v7 se activa SOLO en memoria (G.GEN_VERSION = 7; no sube la versión del generador). Con v6 NO hay medición: solo se comprueba que sus datos `today`/`targetMin` siguen intactos.
// EXIGE (datos v7 `durationV7`): rangos CONTIGUOS (tope de uno = mínimo del siguiente, sin solape ni hueco) · medianas dentro de su rango y separadas ≥ 6 min · mínimo absoluto 20 y techo 45 en los extremos.
// EXIGE (medición): 0 errores de generación · 0 atascos del bot · NINGÚN caso por encima del techo (45) ni por debajo del mínimo (20) · medianas ORDENADAS (Fácil < Normal < Difícil) con separación ≥ 4 min ·
//   sospechosos y salas medios que suben con el nivel.
// INFORMA por nivel: mínimo / mediana / media / máximo, % dentro de su rango y cuántos casos pasan del TOPE de su nivel (28 / 36 / 45).
// ESTRICTA por defecto (TIEMPOS-6, cp. 267): «ningún caso pasa del tope de su nivel» (28 / 36 / 45) y «≥ 90 % dentro del rango completo». Medido con N=300 tras el relleno 24 · 32 · 39 (cp. 266): 0 casos sobre el tope en los tres niveles.
//   Sus mutaciones (29 / 37 / 46 min) se comprueban sobre esta lógica. DUR_ESTRICTO=0 la relaja a los límites duros (0 atascos y techo 45, ROADMAP R3).
// MUTACIONES (deben hacer fallar): datos con rangos solapados / con hueco / medianas a 5 min / techo 46 / mínimo 18 / mediana fuera de rango · los 3 niveles con el relleno de Fácil · Normal y Difícil intercambiados ·
//   relleno fijo a 23,5 en todos · un caso de 46 min · un caso de 19 min · (estricto) un caso de 29 en Fácil, de 37 en Normal y de 46 en Difícil.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const GV0 = G.GEN_VERSION;
const N = +process.env.DUR_N || 100, NM = +process.env.DUR_NM || 40, ESTRICTO = process.env.DUR_ESTRICTO !== '0', STEP = 7919, MIN_SEP_DATOS = 6, MIN_SEP_MEDIDA = 4, EN_RANGO = 0.9;
const LEVELS = ['facil', 'normal', 'dificil'], DIFF = { facil: 'easy', normal: 'normal', dificil: 'hard' };
const clone = (x) => JSON.parse(JSON.stringify(x)), r1 = (x) => Math.round(x * 10) / 10, mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

// 0) con v6 solo se vigilan los datos (el generador v6 no cambia: lo comprueban `casos_sin_cambios` y las pruebas de v6)
const L6 = G.GEN_DATA.compile.levels;
ok(LEVELS.every((L) => L6[L] && L6[L].today && L6[L].goal && L6[L].targetMin !== undefined), 'v6: perfil completo (goal, today, targetMin) en los 3 niveles');
ok(LEVELS.every((L) => L6[L].targetMin === L6[L].today.median), 'v6: el relleno apunta a la mediana `today` de su nivel');
ok(L6.facil.today.median < L6.normal.today.median && L6.normal.today.median < L6.dificil.today.median, 'v6: medianas `today` ordenadas');

// 1) los DATOS oficiales v7: lista de fallos (vacía = bien)
const datos = (dv) => {
  const f = [], R = (L) => dv.levels[L].range, M = (L) => dv.levels[L].median;
  if (R('facil')[0] !== dv.floor) f.push('Fácil no empieza en el mínimo ' + dv.floor);
  if (dv.floor !== 20) f.push('mínimo absoluto ≠ 20');
  if (dv.ceiling !== 45 || R('dificil')[1] !== dv.ceiling) f.push('techo ≠ 45 o Difícil no acaba en el techo');
  if (R('facil')[1] !== R('normal')[0]) f.push('Fácil y Normal no son contiguos (' + R('facil')[1] + ' / ' + R('normal')[0] + ')');
  if (R('normal')[1] !== R('dificil')[0]) f.push('Normal y Difícil no son contiguos (' + R('normal')[1] + ' / ' + R('dificil')[0] + ')');
  LEVELS.forEach((L) => { if (!(R(L)[0] < R(L)[1])) f.push(L + ': rango vacío'); if (M(L) < R(L)[0] || M(L) > R(L)[1]) f.push(L + ': mediana ' + M(L) + ' fuera de ' + R(L).join('-')); });
  if (!(M('facil') + MIN_SEP_DATOS <= M('normal') && M('normal') + MIN_SEP_DATOS <= M('dificil'))) f.push('medianas separadas menos de ' + MIN_SEP_DATOS + ' min: ' + LEVELS.map(M).join(' / '));
  return f;
};
const DV = G.GEN_DATA.compile.durationV7;
ok(!!DV && !!DV.levels, 'existen los datos oficiales `durationV7`');
const fd = datos(DV);
ok(fd.length === 0, 'datos v7: ' + fd.join('; '));
console.log('  datos v7: ' + LEVELS.map((L) => L + ' ' + DV.levels[L].range.join('-') + ' (mediana ' + DV.levels[L].median + ')').join(' · ') + ' · mínimo ' + DV.floor + ' · techo ' + DV.ceiling);
const mutDatos = (nombre, cambia) => { const d = clone(DV); cambia(d); const f = datos(d); ok(f.length > 0, 'MUTACIÓN de datos no detectada «' + nombre + '»'); };
mutDatos('rangos solapados (Normal empieza en 26)', (d) => { d.levels.normal.range[0] = 26; });
mutDatos('hueco entre Fácil y Normal (Normal empieza en 29)', (d) => { d.levels.normal.range[0] = 29; });
mutDatos('hueco entre Normal y Difícil (Difícil empieza en 37)', (d) => { d.levels.dificil.range[0] = 37; });
mutDatos('medianas a 5 min (Normal 35, Difícil 40)', (d) => { d.levels.normal.median = 35; });
mutDatos('techo 46', (d) => { d.ceiling = 46; d.levels.dificil.range[1] = 46; });
mutDatos('mínimo 18', (d) => { d.floor = 18; d.levels.facil.range[0] = 18; });
mutDatos('mediana de Normal fuera de su rango', (d) => { d.levels.normal.median = 37; });

// 2) medición: el bot juega cada caso en la dificultad de su nivel (v7 en memoria)
const medir = (n) => {
  const out = {};
  for (const L of LEVELS) {
    const mins = [], sus = [], salas = []; let errores = 0, atascos = 0;
    for (let i = 1; i <= n; i++) {
      const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) { errores++; continue; }
      const o = G.qualityCase(r.def, { difficulty: DIFF[L] });
      if (o.bot && o.bot.finished) mins.push(o.bot.humanMinutes); else atascos++;
      salas.push(G.meterFeatures(r.def).rooms); sus.push(Object.values(r.def.npcs).filter((x) => !x.cat && x.id !== 'aliado').length);
    }
    out[L] = { mins, errores, atascos, sus: mean(sus), salas: mean(salas) };
  }
  return out;
};
// veredicto: lista de fallos. `estricto` añade el tope de cada nivel y el rango completo (desactivado por defecto)
const veredicto = (m, estricto) => {
  const f = [], floor = DV.floor, ceil = DV.ceiling;
  for (const L of LEVELS) {
    const o = m[L], rg = DV.levels[L].range;
    if (!o.mins.length) { f.push(L + ': sin casos'); continue; }
    if (o.errores) f.push(L + ': ' + o.errores + ' errores de generación');
    if (o.atascos) f.push(L + ': ' + o.atascos + ' atascos del bot');
    if (Math.min(...o.mins) < floor) f.push(L + ': un caso de ' + r1(Math.min(...o.mins)) + ' min, por debajo del mínimo ' + floor);
    if (Math.max(...o.mins) > ceil) f.push(L + ': un caso de ' + r1(Math.max(...o.mins)) + ' min, por encima del techo ' + ceil);
    if (estricto) {
      if (Math.max(...o.mins) > rg[1]) f.push(L + ': un caso de ' + r1(Math.max(...o.mins)) + ' min, por encima del tope de su nivel ' + rg[1]);
      const ent = o.mins.filter((x) => x >= rg[0] && x <= rg[1]).length / o.mins.length;
      if (ent < EN_RANGO) f.push(L + ': solo ' + Math.round(ent * 100) + ' % dentro de ' + rg.join('-') + ' (mín ' + EN_RANGO * 100 + ' %)');
    }
  }
  const [a, b, c] = LEVELS.map((L) => med(m[L].mins));
  if (!(a + MIN_SEP_MEDIDA <= b && b + MIN_SEP_MEDIDA <= c)) f.push('medianas no ordenadas con separación ≥ ' + MIN_SEP_MEDIDA + ': ' + [a, b, c].map(r1).join(' / '));
  if (!(m.facil.sus <= m.normal.sus && m.normal.sus <= m.dificil.sus && m.facil.sus < m.dificil.sus)) f.push('sospechosos medios no suben con el nivel: ' + LEVELS.map((L) => r1(m[L].sus)).join(' / '));
  if (!(m.facil.salas <= m.normal.salas && m.normal.salas <= m.dificil.salas && m.facil.salas < m.dificil.salas)) f.push('salas medias no suben con el nivel: ' + LEVELS.map((L) => r1(m[L].salas)).join(' / '));
  return f;
};
const resumen = (m) => LEVELS.map((L) => { const a = m[L].mins; return L + ' mín/mediana/media/máx ' + [Math.min(...a), med(a), mean(a), Math.max(...a)].map(r1).join('/'); }).join(' · ');
const informe = (m) => LEVELS.forEach((L) => {
  const a = m[L].mins, rg = DV.levels[L].range, ent = a.filter((x) => x >= rg[0] && x <= rg[1]).length, sobre = a.filter((x) => x > rg[1]).length, bajo = a.filter((x) => x < rg[0]).length;
  console.log('  ' + L.padEnd(8) + 'n=' + a.length + ' · min ' + r1(Math.min(...a)) + ' · mediana ' + r1(med(a)) + ' · media ' + r1(mean(a)) + ' · máx ' + r1(Math.max(...a)) + ' · en ' + rg.join('-') + ': ' + Math.round(100 * ent / a.length) + ' % · sobre el tope ' + rg[1] + ': ' + sobre + ' · bajo ' + rg[0] + ': ' + bajo + ' · sospechosos ' + r1(m[L].sus) + ' · salas ' + r1(m[L].salas));
});

G.GEN_VERSION = 7;
let real;
try {
  real = medir(N);
  console.log('  ' + N + ' casos/nivel (bot, v7 en memoria):'); informe(real);
  const fr = veredicto(real, ESTRICTO);
  ok(fr.length === 0, 'duración por nivel (' + (ESTRICTO ? 'estricta' : 'límites duros') + '): ' + fr.join('; '));
  if (!ESTRICTO) console.log('  · exigencia por nivel (tope 28/36/45 y rango completo): relajada con DUR_ESTRICTO=0; en estricta daría: ' + (veredicto(real, true).filter((x) => /tope de su nivel|dentro de/.test(x)).join('; ') || 'nada'));

  // 3) MUTACIONES de la receta: cada una debe hacer fallar el veredicto (de límites duros)
  const LV0 = G.GEN_DATA.compile.levels, base = clone(LV0);
  const mut = (nombre, cambia) => {
    G.GEN_DATA.compile.levels = clone(base); let m;
    try { cambia(G.GEN_DATA.compile.levels); m = medir(NM); } finally { G.GEN_DATA.compile.levels = LV0; }
    const fm = veredicto(m, false); console.log('  mutación «' + nombre + '» (' + NM + '/nivel): ' + resumen(m) + ' → ' + (fm.length ? 'detectada' : 'NO detectada'));
    ok(fm.length > 0, 'MUTACIÓN no detectada «' + nombre + '»');
  };
  mut('los 3 niveles usan el relleno de Fácil', (lv) => { lv.normal.targetMinV7 = lv.facil.targetMinV7; lv.dificil.targetMinV7 = lv.facil.targetMinV7; });
  mut('Normal y Difícil intercambiados', (lv) => { const t = lv.normal.targetMinV7; lv.normal.targetMinV7 = lv.dificil.targetMinV7; lv.dificil.targetMinV7 = t; });
  mut('el relleno ignora el nivel (todos a 23,5)', (lv) => { LEVELS.forEach((L) => { lv[L].targetMinV7 = 23.5; }); });
  ok(G.GEN_DATA.compile.levels === LV0 && JSON.stringify(LV0) === JSON.stringify(base), 'las mutaciones restauran el perfil de niveles');

  // 4) casos fuera de los límites, inyectados en la medición real
  const inyecta = (L, min) => { const m = clone(real); m[L].mins.push(min); return m; };
  ok(veredicto(inyecta('dificil', 46), false).some((x) => /techo/.test(x)), 'MUTACIÓN: un caso de 46 min en Difícil debe fallar (techo ' + DV.ceiling + ')');
  ok(veredicto(inyecta('facil', 46), false).some((x) => /techo/.test(x)), 'MUTACIÓN: un caso de 46 min en Fácil debe fallar (techo ' + DV.ceiling + ')');
  ok(veredicto(inyecta('facil', 19), false).some((x) => /mínimo/.test(x)), 'MUTACIÓN: un caso de 19 min debe fallar (mínimo ' + DV.floor + ')');
  ok(veredicto(inyecta('normal', 19), false).some((x) => /mínimo/.test(x)), 'MUTACIÓN: un caso de 19 min en Normal debe fallar (mínimo ' + DV.floor + ')');
  { const m = clone(real); m.facil.errores = 1; m.normal.atascos = 1; const f = veredicto(m, false); ok(f.some((x) => /errores de generación/.test(x)) && f.some((x) => /atascos/.test(x)), 'MUTACIÓN: un error de generación y un atasco del bot deben fallar'); }
  // lógica estricta (la que se activará en TIEMPOS-6): un caso de 29 / 37 / 46 min sobre el tope de su nivel
  // (sobre una medición LIMPIA sintética —todo en su mediana—, porque la real ya tiene casos de Normal sobre 36)
  const limpia = () => { const m = {}; LEVELS.forEach((L, i) => { m[L] = { mins: Array(20).fill(DV.levels[L].median), errores: 0, atascos: 0, sus: 5 + i, salas: 4 + i }; }); return m; };
  ok(veredicto(limpia(), true).length === 0, 'la medición limpia sintética pasa también en modo estricto');
  const tope = (L, min) => { const m = limpia(); m[L].mins.push(min); return veredicto(m, true).some((x) => /tope de su nivel/.test(x)); };
  ok(tope('facil', 29), 'MUTACIÓN estricta: un caso de 29 min en Fácil debe fallar (tope ' + DV.levels.facil.range[1] + ')');
  ok(tope('normal', 37), 'MUTACIÓN estricta: un caso de 37 min en Normal debe fallar (tope ' + DV.levels.normal.range[1] + ')');
  ok(tope('dificil', 46), 'MUTACIÓN estricta: un caso de 46 min en Difícil debe fallar (tope ' + DV.levels.dificil.range[1] + ')');
  ok(!tope('facil', 28) && !tope('normal', 36) && !tope('dificil', 45), 'estricta: 28 / 36 / 45 min justo en el tope NO fallan');
  { const m = limpia(); m.facil.mins.push(29); ok(veredicto(m, false).length === 0, 'sin modo estricto, 29 min en Fácil solo se informa (no falla)'); }
} finally { G.GEN_VERSION = GV0; }

console.log(fails ? `✗ ${fails} de ${checks} comprobaciones fallan` : `✓ duración por nivel: ${checks} comprobaciones correctas`);
process.exit(fails ? 1 : 0);
