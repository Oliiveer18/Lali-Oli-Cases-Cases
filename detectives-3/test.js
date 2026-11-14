// Ejecuta TODAS las pruebas: construye, valida casos, pruebas unitarias y (si hay Chromium) pruebas en navegador.
// Uso: npm test   ·   npm run test:fast (sin navegador)   ·   npm test -- --seeds=500 --jobs=4   ·   CHROME=/ruta/chrome npm test
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const fast = process.argv.includes('--fast');
const SRC = ['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js', 'logic.js'];
const cases = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => /^case\d+\.js$/.test(f)).sort();
const steps = [
  ['Construir', ['build.js']],
  ['Composición del juego (módulos y orden)', ['test_build.js']],
  ['Validar casos', ['test_validate.js'].concat(SRC.slice(0, 5), cases, ['logic.js', 'schema.js'])],
  ['Revisor de equidad', ['test_review.js'].concat(SRC.slice(0, 5), cases, ['logic.js', 'schema.js', 'review.js'])],
  ['Bot de recorrido', ['test_bot.js'].concat(SRC.slice(0, 5), cases, ['logic.js', 'schema.js', 'review.js', 'world.js', 'companion.js', 'bot.js'])],
  ['Nota de calidad final', ['test_quality.js'].concat(SRC.slice(0, 5), cases, ['logic.js', 'schema.js', 'review.js', 'world.js', 'companion.js', 'bot.js', 'quality.js'])],
  ['Comprobador de biblias', ['test_bible.js']],
  ['La verdad (genTruth)', ['test_gen_truth.js']],
  ['Aspectos de personaje (pool generado)', ['test_looks.js']],
  ['Voz y tono de los casos (4B-2)', ['test_voice.js']],
  ['Pistas y mentiras (genClues)', ['test_gen_clues.js']],
  ['Testimonios por mentira (v7, reparto de herramientas S1)', ['test_testimonios.js']],
  ['Reparto de herramientas por nivel (v7, S2)', ['test_reparto_niveles.js']],
  ['Situaciones macabras 1-3 (v7, S3)', ['test_situaciones.js']],
  ['Compilador y generador (generateCase)', ['test_compile.js']],
  ['Marco de temáticas (4F-0a)', ['test_themes.js']],
  ['Marco en biblia, caso, huella y código (4F-0a)', ['test_marco.js']],
  ['Monedas sueltas: se cobran de verdad en el mundo real y solo si se resuelve el caso (4F-0a subpaso 4)', ['test_monedas.js']],
  ['Huella de caso (unicidad, 1000 semillas)', ['test_fingerprint.js']],
  ['Duración por nivel v7 (TIEMPOS-3): datos contiguos, bot con v7 en memoria, 0 atascos, techo 45 y mínimo 20, medianas ordenadas, informe mín/media/máx, con mutaciones', ['test_duracion.js']],
  ['Reparto del trabajo Oli/Lali: definición común y banda 40-60, con mutaciones (A4 4/4-1)', ['test_reparto.js']],
  ['Tiempos muertos de cada detective (EQ-7): medida común, umbral 240 s y bot, con mutaciones (A4 4/4-4)', ['test_tiempo_muerto.js']],
  ['Ambientes y textos oscuros (4C-4a)', ['test_mood.js']],
  ['Atmósfera II: ajustes y objetos de ambiente (4C-4b, 600 semillas)', ['test_atmos.js']],
  ['Atmósfera III-2: situaciones macabras y giro del testigo (4C-4c-2, 1500 semillas)', ['test_macabro.js']],
  ['Medidor barato de duración y calidad (4D-1, par y recompensa por caso)', ['test_meter.js']],
  ['Medidor con la receta v7 (4F-0b 3/4-d): v6 idéntico, error frente al bot por nivel, con mutaciones', ['test_meter_v7.js']],
  ['Nota de calidad v3 por nivel: anti-saturación, nivel en el caso, pelados y manipulados (S3b-1 de 4D-2, 40 casos por nivel)', ['test_quality_spread.js']],
  ['Capítulos y relleno de duración (4D-2: 3 capítulos, curiosidades, charlas, alcanzabilidad y bot)', ['test_filler.js']],
  ['Plantillas de sala (4C-1a y 4C-2a, 5000 semillas)', ['test_rooms.js']],
  ['Despacho del dueño en reserva (4F-0b 2/4: datos, arte, curiosidades y charlas; ningún caso lo usa)', ['test_despacho.js']],
  ['Iconos de los objetos (lo libre lleva la mano, no la lupa; con herramienta, su icono)', ['test_iconos.js']],
  ['Mecánica con herramientas (4C-1b, 5000 semillas)', ['test_mech.js']],
  ['Vigilante y textos del caso por datos', ['test_watcher.js']],
  ['Grabadora: charlas en puntos de escucha (A4 2/4)', ['test_grabadora.js']],
  ['Grabadora: objetivo g2c «Graba las charlas» (c3 subpaso 3)', ['test_g2c.js']],
  ['Charla grabada en casos generados: capítulos, A* real, zona libre, bot y mutaciones (A4 3/4-b1)', ['test_charlas.js']],
  ['Compañero IA con iniciativa: avisos, candidatos, decisiones, partidas simuladas y mutaciones (A5 IA-1)', ['test_companion.js']],
  ['Arte de policía y comisaría (4C-3a)', ['test_police.js']],
  ['Animación de objetos y ambiente (4C-3b-1)', ['test_anim.js']],
  ['Escenas con aliado de policía (4C-3b-2, 5000 semillas)', ['test_ally.js']],
  ['Coherencia lógica de los casos (2000 semillas)', ['test_logic.js']],
  ['Acusación: intentos, descuento, gate y ofensa (FIX-3d)', ['test_accuse.js']],
  ['Acusar por razones, v7 (CL-3): huecos por nivel, candado de motivo y método, estrellas, bot', ['test_acusar_razones.js']],
  ['Datos de duración v7 (CL-5a): engaños Normal 2-3 · Difícil 3, charlas Difícil 3, v6 intacto', ['test_cl5a.js']],
  ['Puzles de Difícil v7 (CL-5c-b): justicia J1-J6, banco, recentPuzzles, Fácil/Normal/v6 sin puzles, con mutaciones', ['test_puzles_cl5c.js']],
  ['Validador de puzles generados (CL-5c-c 1/4): J1-J4, con mutaciones', ['test_validador_puzles.js']],
  ['Revisor, medidor y huella con puzles (CL-5c-c 2/4): J5-J6, con mutaciones', ['test_puzles_revisor.js']],
  ['Más UV para Lali (c4 2b-1): UV media ≥ 1,3 por caso, solo sostén de documento o física, texto propio por tipo, con mutación', ['test_uv_c4.js']],
  ['GRAB-4 (c4 2c): todo caso lleva ≥ 1 charla grabada con pista de sostén, 3 semillas de regresión y 3 mutaciones', ['test_grab4.js']],
  ['c4-3 2/4: datos de las charlas señuelo (tabla por nivel, interruptor apagado, banda de grabadora, textos y plantilla) y 3 mutaciones', ['test_charla_datos.js']],
  ['c4-3 3/4-a: una pista falsa de objeto pasa a grabación señuelo (≤ 1 por caso, sala sin charla real, solo cambia el tipo) y 3 mutaciones', ['test_charla_senuelo_a.js']],
  ['c4-3 3/4-b (1)+(2): la falsa-grabación nunca lleva lupa y se monta como charla señuelo con pareja libre (o vuelve a su tipo) y 5 mutaciones', ['test_charla_senuelo_b.js']],
  ['c4b GRAB-3: reacción nerviosa a la grabación (cobertura, propias intactas, sin fuga, v6 sin ella) y 4 mutaciones', ['test_grab_reac.js']],
  ['c4-3 3/4-b (4): la refutación real del inocente que miente se entrega como charla grabada de tono sospechoso (`tracesGrab`, cifra por nivel) y 5 mutaciones', ['test_refuta_charla.js']],
  ['c4-4 · 2: el balanceador libera UV señuelo de Lali (mínimo necesario) en vez de rechazar el caso con Oli < 40 %, y 3 mutaciones', ['test_balancea_lali.js']],
  ['TIEMPOS-1: duración oficial por nivel en los datos v7 (20-28 · 28-36 · 36-45, medianas 24/32/40, techo 45), solo datos, v6 intacto, y 5 mutaciones', ['test_tiempos1.js']],
  ['TIEMPOS-2: con v7 la nota de calidad y el medidor usan 20-28 · 28-36 · 36-45 y techo 45 (46 min = error); v5/v6 intactos; 6 mutaciones', ['test_tiempos2.js']],
  ['Duración de Difícil v7 con puzles (CL-5c-d): 0 atascos, 0 casos > 45, mediana 36-40,5, con mutación', ['test_duracion_puzles.js']],
  ['Globos de diálogo dentro de la zona segura (FIX-4a parte 2)', ['test_bubble.js']],
  ['Ayudante común de texto (FIX-4a c)', ['test_textfit.js']],
  ['Menú con desplazamiento (FIX-6a)', ['test_menuscroll.js']],
  ['Textos de menú sin pisarse (FIX-6a tercio 2)', ['test_menutexto.js']],
  ['Pestaña Sospechosos: el nombre no pisa la descripción, con mutación (FIX-6a fallo 5)', ['test_sospechosos.js']],
  ['Mostrar prueba con botón «Mostrar prueba» y «Volver», con mutación (FIX-6b fallo 7)', ['test_mostrar_prueba.js']],
  ['Acusación fallada visible en Acusar y compartida online entre 2 jugadores, con mutación (FIX-6b fallo 8)', ['test_acusar_fallo.js']],
  ['Informe del caso: textos reales, que caben, Pausa y pestaña «Caso», con mutación (A3 INTRO-1)', ['test_intro.js']],
  ['Prueba masiva (5000 semillas, ~1 min)', ['test_mass.js']],
  ['Relé de respaldo online: MQTT simulado (v0.7.39)', ['test_relay.js']],
  ['Pruebas unitarias', ['tools/unit_test.js']],
];
if (!fast) {
  const { launchable } = (() => { try { require('./tools/cdp.js'); } catch (e) {} return { launchable: true }; })();
  const hasChrome = process.env.CHROME ? fs.existsSync(process.env.CHROME) : (() => { try { return fs.readdirSync('/opt/pw-browsers').some((d) => /^chromium-/.test(d)); } catch (e) { return false; } })() || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].some((p) => fs.existsSync(p));
  if (hasChrome && launchable) {
    [
      ['Arranque sin errores', 'smoke.js', [/escena: Title · errores: \[\]/, /logs \[\]/]],
      ['Generador dentro del juego (navegador)', 'gen_browser_test.js', [/index escena: Title · errores: \[\]/, /artifact escena: Title · errores: \[\]/, /index módulos: \["function","function","function","function","function","function","function","undefined","undefined","undefined"\]/, /artifact módulos: \["function","function","function","function","function","function","function","undefined","undefined","undefined"\]/, /index generar 25 casos y su huella en el navegador, problemas: \[\]/, /artifact generar 25 casos y su huella en el navegador, problemas: \[\]/, /index casos en el menú: \["tarta"\]/, /artifact casos en el menú: \["tarta"\]/, /index caso 1 válido: true/, /index texto de la puerta: ¡Puerta abierta con la llave de Hogaza!/, /index logs \[\]/, /artifact logs \[\]/]],
      ['Animación de objetos (navegador, 4C-3b-1)', 'anim_browser_test.js', [/index\.html · caso 1: animados 0 · errores \[\] · OK/, /artifact\.html · caso 1: animados 0 · errores \[\] · OK/, /animación en navegador OK/]],
      ['Cargar código de caso (navegador, MP)', 'codigo_browser_test.js', [/Todo en orden/]],
      ['Casos de prueba en «Elegir caso» (navegador)', 'pruebas_browser_test.js', [/Todo en orden/]],
      ['HUD: sala actual y rótulo al entrar (navegador, FIX-2)', 'hud_sala_browser_test.js', [/Todo en orden/]],
      ['Franjas laterales táctiles (navegador, FIX-4a parte 1)', 'franjas_browser_test.js', [/Todo en orden/]],
      ['Globos de diálogo en cada puerta (navegador, FIX-4a parte 2)', 'burbujas_browser_test.js', [/Todo en orden/]],
      ['Aviso «gira el teléfono» en vertical (navegador, FIX-4c)', 'rotar_browser_test.js', [/Todo en orden/]],
      ['Informe del caso al empezar, en la Pausa y en el Cuaderno (navegador, A3 INTRO-1)', 'intro_browser_test.js', [/Todo en orden/]],
      ['Estrés del táctil: 400 pasos aleatorios y 60 diálogos con el dedo apoyado (navegador, FIX-6c 4/4)', 'touch_stress_browser_test.js', [/Todo en orden/]],
      ['Dedo apoyado durante un diálogo o transición: el stick lo coge al acabar (navegador, FIX-6c 3/4)', 'touch_dialog_browser_test.js', [/Todo en orden/]],
      ['Varios dedos a la vez (navegador, FIX-6c 2/4)', 'touch_multi_browser_test.js', [/Todo en orden/]],
      ['Dedos fantasma: el táctil no se queda atascado (navegador, FIX-6c 1/4)', 'touch_stuck_browser_test.js', [/Todo en orden/]],
      ['Diagnóstico del táctil (navegador, FIX-6c parte LOW)', 'diag_browser_test.js', [/Todo en orden/]],
      ['Acusación: selector, corazones, fallo y fin de partida (navegador, FIX-3)', 'accuse_browser_test.js', [/Todo en orden/]],
      ['Atmósfera II (navegador, 4C-4b)', 'atmos_browser_test.js', [/atmósfera en navegador OK/]],
      ['Escenas con aliado (navegador, 4C-3b-2)', 'ally_browser_test.js', [/index\.html · exterior .* · OK/, /index\.html · interrogatorio .* · OK/, /artifact\.html · reconstruccion .* · OK/, /escenas con aliado en navegador OK/]],
      ['Sigilo (Normal y Difícil)', 'stealth_test.js', [/normal grabación conseguida: true/, /hard grabación conseguida: true/]],
      ['Online (sala simulada)', 'online_test.js', [/A remoteHere true B remoteHere true/, /hidden false/, /aiTakeover true/, /tras vuelta: B en juego true me 1 A aiTakeover false pistas A 2 B 2/, /continuar: A pistas 2 B pistas 2 B en juego true/, /logs \[\]/]],
      ['Puertas en las 4 paredes', 'doors_test.js', [/"ok":true,"errores":\[\]/, /s puerta_tienda: \{"libre":true,"foco":true,"spots":true,"camino":true,"flecha":true\}/, /w puerta_almacen: \{"libre":true,"foco":true,"spots":true,"camino":true,"flecha":true\}/, /e puerta_trasera: \{"libre":true,"foco":true,"spots":true,"camino":true,"flecha":true\}/, /errores \[\] logs \[\]/]],
      ['Reconexión del anfitrión', 'rejoin_test.js', [/conectados true true/, /A reenlazado true \| B reenlazado true \| logs \[\]/]],
      ['Online P2P (PeerJS simulado)', 'peer_test.js', [/A ve a B true \| B ve a A true/, /B arranca solo true/, /pistas A 1 B 1/, /A: IA al mando true \| logs \[\]/]],
      ['Online con el camino directo bloqueado: solo relé (v0.7.39)', 'relay_browser_test.js', [/enlace A respaldo B respaldo \| A ve a B true \| B ve a A true/, /B arranca solo true/, /pistas A 1 B 1/, /logs \[\]/]],
      ['Online: el joystick táctil mueve al detective (toques reales, v0.7.40)', 'touch_online_test.js', [/modo de entrada solo/, /MUEVE true \| \w+ ?/, /solo: .* MUEVE true \| logs \[\]/]],
    ].forEach(([n, f, must]) => steps.push([n, ['tools/' + f], must]));
  } else console.log('(sin Chromium: se omiten las pruebas de navegador; define CHROME=/ruta/al/chrome)\n');
}
// Filtro: --only=a,b  (o ONLY=a,b) ejecuta solo los pasos cuyo nombre, archivo o grupo contenga alguna de esas palabras (sin tildes ni mayúsculas).
// «Construir» siempre se ejecuta. Grupos: navegador, touch, online. Ejemplos: --only=intro,accuse · --only=touch · --only=online
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const GROUPS = [['navegador', /^tools\/(?!unit_test)/], ['touch', /touch_(stress|dialog|multi|stuck|online)|franjas_browser|diag_browser/], ['online', /online_test|rejoin_test|peer_test|relay_browser|touch_online/]];
const tagsOf = (s) => GROUPS.filter(([, re]) => re.test(s[1][0])).map(([g]) => g);
const onlyArg = (process.argv.find((x) => x.startsWith('--only=')) || '').slice(7) || process.env.ONLY || '';
if (onlyArg) {
  const words = onlyArg.split(',').map(norm).filter(Boolean);
  const keep = steps.filter((s, i) => i === 0 || words.some((w) => norm(s[0]).includes(w) || norm(s[1][0]).includes(w) || tagsOf(s).includes(w)));
  if (keep.length === 1) { console.log('--only=' + onlyArg + ': ningún paso coincide. Prueba con parte del nombre, del archivo o un grupo (navegador, touch, online).'); process.exit(1); }
  steps.length = 0; keep.forEach((s) => steps.push(s));
  console.log('Pasos seleccionados (' + (steps.length - 1) + '): ' + steps.slice(1).map((s) => s[0].split(' (')[0]).join(' · ') + '\n');
}
// pruebas de navegador: deben mostrar cada frase esperada y ningún error
// Ejecución en paralelo: «Construir» va primero y solo (genera dist/); el resto se reparte entre JOBS procesos.
// Opciones: --jobs=N (o JOBS=N; por defecto min(núcleos, 4); 1 = secuencial como antes)
//           --seeds=N (o SEEDS=N): tope de semillas de las pruebas masivas (por defecto, las de siempre; p. ej. 500 en el día a día)
const os = require('os'), { spawn } = require('child_process');
const arg = (k) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : ''; };
const JOBS = Math.max(1, +(arg('jobs') || process.env.JOBS) || Math.min(os.cpus().length, 4));
if (arg('seeds')) process.env.SEEDS = arg('seeds');
const BAD = /ERR:|EXC:|console\.error/;
const TIMEOUT = JOBS > 1 ? 360000 : 240000; // en paralelo cada paso va más lento: margen mayor
const runStep = ([name, args, must]) => new Promise((resolve) => {
  const t0 = Date.now(); let out = '';
  const p = spawn('node', args, { cwd: __dirname, env: process.env, detached: true });
  p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
  const timer = setTimeout(() => { try { process.kill(-p.pid, 'SIGTERM'); } catch (e) {} setTimeout(() => { try { process.kill(-p.pid, 'SIGKILL'); } catch (e) {} }, 3000); out += '\n(tiempo agotado)'; }, TIMEOUT);
  p.on('close', (code) => {
    clearTimeout(timer);
    try { process.kill(-p.pid, 'SIGKILL'); } catch (e) {} // red de seguridad: nada del paso (Chrome incluido) sobrevive
    const bad = code !== 0 || (must && (BAD.test(out) || must.some((m) => !m.test(out))));
    resolve({ name, bad, out, secs: (Date.now() - t0) / 1000 });
  });
});
(async () => {
  const T0 = Date.now(), results = new Array(steps.length);
  let next = 1, shown = 0, failed = 0;
  const flush = () => { while (shown < steps.length && results[shown]) { const r = results[shown++]; console.log((r.bad ? '✗ ' : '✓ ') + r.name + '  (' + r.secs.toFixed(0) + ' s)'); if (r.bad) { failed++; console.log(r.out.split('\n').map((l) => '    ' + l).join('\n')); } } };
  results[0] = await runStep(steps[0]); flush();
  if (results[0].bad) { console.log('\nLa construcción falla: no se sigue.'); process.exit(1); }
  await Promise.all(Array.from({ length: Math.min(JOBS, steps.length - 1) }, async () => {
    while (next < steps.length) { const i = next++; results[i] = await runStep(steps[i]); flush(); }
  }));
  spawnSync('pkill', ['-9', '-f', 'loc-chrome-']);
  console.log(failed ? `\n${failed} paso(s) con fallos` : '\nTodo en orden');
  console.log(`(${((Date.now() - T0) / 1000).toFixed(0)} s · ${JOBS} en paralelo${process.env.SEEDS ? ' · máx. ' + process.env.SEEDS + ' semillas' : ''})`);
  process.exit(failed ? 1 : 0);
})();
