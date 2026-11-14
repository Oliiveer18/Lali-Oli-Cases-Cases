# PASOS PARA LA IA FINAL (29 oct, cp. 278) · una tarjeta por paso, en ORDEN
Cómo se usa: ver `docs/GUIA_IA_FINAL.md` (leer su §0: una sola pasada, sin parar). Busca el siguiente con `grep -n "ESTADO: \[ \]" docs/PASOS_IA.md | head -1` y lee solo su tarjeta (~12 líneas). Estados: `[ ]` pendiente · `EN CURSO` · `[x] HECHO` · `BLOQUEADO`. Decisiones: `docs/DECISIONES_FINALES.md` (D-xx/B-xx/C-xx se citan abajo). Estado de partida: v0.7.60 · cp. 277 · `GEN_VERSION` 6 · `npm test` 95/95 verde.
Atajo para ver una fila de especificación: `grep -n "4F-2" docs/ROADMAP.md | head` y `sed -n 'N,Np' docs/ROADMAP.md`. Para ver cómo se hizo algo parecido antes: `grep -n "palabra" docs/HISTORIAL_SESION.md | head` y `sed -n` (solo ese rango).

## PARTE A · cerrar la receta v7

### F01 · Preparar el entorno
ESTADO: [x] HECHO (14 nov): `tools/cierre.js` cuenta como SALTADA (no roja) toda prueba que imprima `SALTADO:`; build con PeerJS incluido; online verde (6 de 8, 2 saltadas por falta de `ws`)
LEER: `docs/RECETAS.md` (entero, una vez) · `vendor/LEEME.txt` · `grep -n "SALTADO" tools/cierre.js relay_browser_test.js tools/*.js | head`
HAZ: (0) Si no hay repositorio git: `git init && git add -A && git commit -m "base v0.7.60 cp277"` (el `.gitignore` ya existe). Comprueba `node -v` ≥ 18 y `node build.js`. (1) Que la prueba del relé cuente como SALTADA (no roja) si falta `ws` (C1): en `tools/cierre.js` imita cómo trata ya otras pruebas «SALTADO» (p. ej. sin Chromium). No toques `package.json`. (2) PeerJS (C2): SOLO si `vendor/peerjs.min.js` no existe o `node build.js` avisa de que falta (si ya imprime «PeerJS incluido dentro del juego», sáltate esto): `cd /tmp && npm pack peerjs@1.5.4 && tar xzf peerjs-1.5.4.tgz && cp package/dist/peerjs.min.js <proyecto>/vendor/peerjs.min.js`; `node build.js` ya no debe avisar «falta vendor/peerjs.min.js». (3) Completa `docs/PENDIENTE_DE_PERSONA.md` (ya existe un borrador) con: P1/P2/HITO 1/P3/HITO final jugar casos y online con 2 móviles · 6C prueba online repetida · 7C lanzamiento v1.0 y alojamiento · verificar en iPhone real (botones, barra de Safari, rendimiento, audio) · elegir si el caso 1 nuevo (Z0) sustituye al antiguo · leer `docs/MUESTRA_FRASES.md` · 7D voces (opcional, último).
PRUEBAS: `node tools/cierre.js suite --solo="relé"` y `--solo="Online"` (si hay Chromium).
HECHO CUANDO: relé SALTADA sin `ws`; build sin aviso de PeerJS; pruebas online verdes (si alguna online falla con PeerJS, restaura el fichero anterior y anótalo); el fichero de pendientes existe.

### F02 · 4F-0b 3/4-e · `GEN_VERSION` 6→7 (la ÚNICA subida)
ESTADO: [ ]
LEER: SESION.md cp. 277 y cp. 272 · `grep -n "5 → 6\|5→6" docs/HISTORIAL_SESION.md | head` (así se hizo la subida anterior: imítala) · `grep -n "GEN_VERSION" src/*.js | head -30`
HAZ: (1) `GEN_VERSION` = 7. (2) Los códigos de caso pasan a prefijo `G7-…`; regenera con las mismas semillas los códigos de menú que hoy son `G6-3wje`, `G6-2prl`, `G6-95yj` y actualiza `docs/HOJA_APUNTES_PRUEBAS.md` y `docs/MP_GUION.md`. (3) Sube `G.VERSION` a 0.7.61 (donde esté: `grep -rn "0.7.60" src package.json LEEME.txt`). (4) Huella: guárdala con `--guardar` conservando la copia G6 (mira el cp. de la subida anterior). (5) `node tools/baseline.js --write` (B3) y anota qué cambia. (6) `test_intro.js`: añade la mutación de la rama v7 de `caseBriefing` y haz que audite casos v7 (C3). (7) Vuelve a medir UV señuelo Fácil/Difícil (C4: `test_uv_c4.js`; si el margen < 0,05, sube su N a 200). (8) Cualquier prueba que fije «6» o «G6» se actualiza.
PRUEBAS (una a una): test_fingerprint, test_intro, test_uv_c4, test_g2c, test_cl5a, test_compile, test_quality_spread, test_tiempos1, test_tiempos2, test_duracion, test_meter_v7, test_atmos, test_charla_datos, test_grabadora, test_reparto_niveles, test_build; después `node tools/cierre.js linea --bg` (+ espera): nota y minutos de cada nivel.
HECHO CUANDO: todo verde con `GEN_VERSION` 7; 0 atascos; Fácil/Normal/Difícil dentro de 20-28 · 28-36 · 36-45; Oli/Lali 40-60 %; docs con G7.

### F03 · 4F-0b 4/4 · cierre del bloque salas 4/5/6
ESTADO: [ ]
LEER: CHECKLIST filas 22b y 4F-0b (`grep -n "4F-0b" docs/CHECKLIST_MAESTRO.md`)
HAZ: `node tools/cierre.js suite --bg` (+ esperas, `--seguir`) hasta 100 % verde (memoria de verdes ayuda). Medir 100 casos por nivel (calidad, minutos, Oli/Lali, herramientas por caso: lupa 1,9-2,2 · ganzúa 1,0-1,2 · UV 1,7-1,9 · grabadora 1,6-1,8). Tacha en CHECKLIST: 4F-0b 3/4, 3/4-c, 3/4-e, 4/4, HERR-2, 22b, H3, H4, 4F-0e (ver F04) y las filas de P1-dependencia. Rota docs (GUIA §4.5).
PRUEBAS: suite completa verde.
HECHO CUANDO: suite verde, filas tachadas, medición anotada en SESION.

### F04 · 4F-0e rangos de duración (verificar y tachar) + tabla R4
ESTADO: [ ]
LEER: SESION.md cp. 261-267 (TIEMPOS-1…6) · `sed -n 1,25p tools/duracion_niveles.js` (argumentos)
HAZ: TIEMPOS-1…6 ya hicieron lo que pedía 4F-0e. Comprueba que pasan test_tiempos1, test_tiempos2, test_duracion, test_meter_v7; si sí, tacha 22b2, H5 y la fila «4F-0e: rangos…» de CHECKLIST. Después mide ≥ 150 casos por nivel (cifras del generador: nº de pistas, curiosidades, charlas, señuelos, situaciones macabras, herramientas) y escribe en `docs/EQUILIBRIO_Y_COMPLETITUD.md` la tabla mín/máx/pesos (regla B8: p10-p90 redondeado; situaciones macabras 25/50/25). Si algún dato del generador NO tiene mín/máx/pesos en datos, créalos en `gen_data.js` con esos valores SIN cambiar lo que genera (comprobar con `casos_sin_cambios`, ver F07).
PRUEBAS: las 4 de arriba + test_situaciones, test_reparto_niveles.
HECHO CUANDO: filas tachadas y tabla escrita.

### F05 · GRAB-R1 · riesgo en la grabadora (solo Normal y Difícil)
ESTADO: [ ]
LEER: CHECKLIST fila GRAB-R1 (`grep -n "GRAB-R1" docs/CHECKLIST_MAESTRO.md`) · `src/` vigilante (`grep -n "watcher\|vigilante" src/*.js | head`) · `test_watcher.js`, `test_grabadora.js`
HAZ: En Normal y Difícil, a veces al grabar hay que esperar a que no miren (reusa el vigilante de sigilo que ya existe; sin mecánica nueva; Fácil sin riesgo). Cifras (frecuencia por caso) en DATOS con mín/máx/pesos (p. ej. Normal 0-1, Difícil 0-2, pesos 50/50 y 30/50/20). La IA compañera y el bot deben seguir pudiendo ganar (el bot espera la ventana segura). Cambia receta: regenera códigos de prueba, NO subas versión.
PRUEBAS: test_grabadora, test_grab4, test_grab_reac, test_charlas, test_watcher, test_mech, test_bot (vía `cierre bot`), test_intro; medir 40 casos/nivel: 0 atascos, grabadora por caso no baja de 1,6.
HECHO CUANDO: verde y medido; fila GRAB-R1 tachada.

### F06 · 4E-1 · botón «Caso nuevo» con semilla nueva + memoria básica
ESTADO: [ ]
LEER: ROADMAP fila 4E-1 · `grep -n "Caso nuevo\|Cargar código\|newSeed\|randomSeed" src/*.js | head -20`
HAZ: «Caso nuevo» genera SIEMPRE una semilla nueva; el código de sala es la semilla (los dos móviles generan el mismo caso); cualquier caso se repite a propósito con su código («Cargar código de caso» se CONSERVA, P8). Memoria básica «no repetir»: guarda en `localStorage` (con try/catch) los últimos 12 casos e ingredientes (escenario, temática, objeto estrella); al elegir semilla nueva, descarta las que repitan los 3 últimos escenarios si hay alternativa. El caso 1 sigue siendo el principal; los generados se desbloquean al terminarlo (si ya es así, no toques).
PRUEBAS: prueba nueva `test_caso_nuevo.js` (20 llamadas seguidas = 20 semillas distintas; misma semilla = mismo caso; memoria evita repetir escenario 3 veces seguidas; mutación: sin memoria falla); test «Elegir caso», «Cargar código de caso», test_fingerprint.
HECHO CUANDO: verde; CHECKLIST 4E-1 y H6 tachadas.

## PARTE B · herramientas de variedad y de calidad

### F07 · 4W-0 · partir los bancos de datos
ESTADO: [ ]
LEER: ROADMAP fila 4W-0 · `grep -n "^G.GEN_DATA\|^  [a-zA-Z]*: {" src/gen_data.js | head -60` (mapa de bancos) · `build.js`
HAZ: Parte `src/gen_data.js` (~120 KB) en ficheros por banco en `src/data/` (p. ej. `herramientas.js`, `charlas.js`, `curiosidades.js`, `macabro.js`, `compile.js`…) SIN cambiar ningún valor. `build.js` y los tests que lean `gen_data.js` por ruta deben encontrar los nuevos (usa `grep -rn "gen_data" . --include=*.js | grep -v node_modules`). Orden de carga: respétalo en `build.js`.
PRUEBAS: la herramienta de «casos sin cambios» (`grep -rn "casos_sin_cambios" tools package.json | head -3`) con 60 casos y la huella de 5000 semillas deben salir IDÉNTICAS; caso 1 intacto; `test_build` 14/14; `npm run test:fast`.
HECHO CUANDO: idéntico; `dist/` reconstruido; documenta el mapa de bancos en `docs/FORMATO_DE_CASO.md` (3 líneas).

### F08 · 4V-1 · medidor de variedad (+ metas en `tools/cupos.js`)
ESTADO: [ ]
LEER: `docs/VARIEDAD.md` §6 · `docs/DOCUMENTO_MAESTRO.md` §0.3g (metas) · `tools/cupos.js`
HAZ: Crea `tools/variedad.js`: sobre N semillas (por defecto 300/nivel) informa uso por valor de cada eje, distancia entre pares de casos, secuencias de 5 casos seguidos y repetición de texto; solo informa, NO cambia el generador. Actualiza `tools/cupos.js` con las metas de D1 (escenarios 15 · salas 9 · nombres ≥ 100 · curiosidades ≈ 400 · charlas ≈ 300 · manías y muletillas ≈ 40 · historias base 12-15) para que diga cuánto falta. Fija en `VARIEDAD.md` §6 las metas con la primera medición.
PRUEBAS: `test_variedad.js` nueva (smoke con N=40; una mutación: si todos los casos fueran iguales el informe lo detecta).
HECHO CUANDO: `node tools/variedad.js` y `node tools/cupos.js` imprimen informe; filas 4V-1 y H8 tachadas.

### F09 · 4V-2 · linter de contenido
ESTADO: [ ]
LEER: `docs/VARIEDAD.md` §5 · `tools/mutar.js`
HAZ: `tools/linter_textos.js` revisa los bancos de texto: duplicados y aperturas repetidas, concordancia de género (las plantillas con `{…}` tienen que dar bien en masculino y femenino), nombres propios sueltos, longitud (≤ 220 caracteres por línea), y que el humor macabro cierre con remate. Salida: lista con fichero y línea; código de salida ≠ 0 si hay errores. Añádelo a la suite (`tools/cierre.js` perfil `suite`) y a `package.json` (`npm run lint:textos`). Arregla los avisos de los bancos actuales si son ≤ 25; si hay más, apúntalos en `docs/PENDIENTE_LINTER.md` y haz que el linter solo falle con avisos NUEVOS (guarda el listado base).
PRUEBAS: `test_linter.js` con 4 mutaciones (duplicado, género roto, línea de 300 caracteres, sin remate) que el linter debe detectar.
HECHO CUANDO: linter en la suite en verde; filas 4V-2 y H8b tachadas.

### F10 · SAVE-1 · verificar el guardado a medias con casos generados
ESTADO: [ ]
LEER: ROADMAP fila SAVE-1 (22e2) · `grep -n "sv.run\|snapshot\|Continuar caso" src/*.js | head -30` · una prueba `tools/*_browser_test.js` existente como modelo
HAZ: Prueba nueva que (1) genera un caso `G7-…`, juega a medias (examinar una pista, hablar, grabar una charla, gastar monedas), (2) recarga (nueva instancia/página), (3) comprueba que «Continuar caso» lo vuelve a compilar desde su código y que el `snapshot` conserva TODO (charla grabada, IA con iniciativa, monedas, cuaderno, sala, tiempo), (4) un `snapshot` de otra versión (`GEN_VERSION` distinta) no rompe: avisa y ofrece reiniciar, (5) online: el anfitrión recarga y la sala sigue. Si no hay Chromium, haz la parte de lógica (snapshot→restaurar→snapshot igual) sin navegador y deja la de navegador escrita pero saltada.
PRUEBAS: la nueva + las de guardado existentes.
HECHO CUANDO: informe escrito en SESION (qué pasa y qué falla). Si TODO pasa: F11 se marca «no hacía falta» y se tacha.

### F11 · SAVE-2 · arreglar lo que falle SAVE-1 (condicional)
ESTADO: [ ]
LEER: el informe de F10.
HAZ: Solo si F10 encontró fallos: registrar el caso generado al reanudar, completar el `snapshot`, compatibilidad por versión, reanudación online. Si no hubo fallos: tacha como «no necesario».
PRUEBAS: la prueba de F10 completa en verde; test «Continuar caso».
HECHO CUANDO: verde; filas SAVE-2, H8c, H8d y 22e2/22e3 tachadas.

## PARTE C · receta (bloque 4F)
Regla del bloque: cada paso cambia lo que genera una semilla → al cerrar, regenera los códigos de prueba del menú y anótalo; NO subas `GEN_VERSION` (B2). Cifras variables con mín/máx/pesos en datos (B8). Mide 40 casos por nivel al cerrar cada paso.

### F12 · 4F-1 señuelos (verificar y completar)
ESTADO: [ ]
LEER: ROADMAP fila 4F-1 (`grep -n "4F-1" docs/ROADMAP.md | head -3`) · `grep -n "senuelo\|señuelo" src/compile.js | head -30` · pruebas test_charla_senuelo_a/b, test_uv_c4, test_ganzua_c4
HAZ: Ya existen señuelos de objeto, de herramienta y de charla (cp. 187-259). La fila pide «pistas falsas con consecuencias, justas y refutables». Comprueba esas tres cosas: (1) consecuencia: acusar apoyándose en un señuelo falla y se nota (frase y/o descuento); (2) justas: todo señuelo se puede refutar con una pista (`refutedBy`) alcanzable; (3) hay señuelos en los tres niveles con mín/máx/pesos en datos. Si las tres se cumplen, tacha el paso; si falta alguna, añade solo lo que falte.
PRUEBAS: test_charla_senuelo_a/b, test_refuta_charla, test_testimonios, test_gen_clues, test_validate, bot (`cierre bot`).
HECHO CUANDO: verde y tachados 4F-1, 22 y H9.

### F13 · 4F-2 pistas cruzadas
ESTADO: [ ]
LEER: ROADMAP fila 4F-2 · `grep -n "cuaderno\|notebook" src/*.js | head -20` · `docs/FORMATO_DE_CASO.md`
HAZ: Dos pistas que, al tenerlas las dos, producen solas una «deducción» en el cuaderno (una línea nueva con texto propio). El generador crea 0-2 por caso (Fácil 0-1, Normal 0-2, Difícil 1-2; pesos en datos); las dos pistas siempre alcanzables; la deducción apunta a culpable, motivo o método y NUNCA es obligatoria (hay otro camino). Texto de cada deducción: banco pequeño por tono (≥ 6 por tono, con remate). El validador y el revisor comprueban que ambas pistas existen y se alcanzan; el bot las ignora sin perder.
PRUEBAS: prueba nueva `test_cruzadas.js` (con mutación: una pista inalcanzable debe detectarse), test_validate, test_review, test_logic, bot, test_textfit.
HECHO CUANDO: verde; tachados 4F-2, 23, H10.

### F14 · 4F-3 testigos que cambian de versión
ESTADO: [ ]
LEER: ROADMAP fila 4F-3 · `grep -n "lies\|testimon" src/compile.js | head -30` · test_testimonios.js
HAZ: Un testigo (0-2 por caso; Fácil 0-1, Normal 0-1, Difícil 1-2) cambia su coartada o declaración al presionarlo o al enseñarle una prueba concreta; en el cuaderno la versión vieja se muestra tachada y la nueva queda. Debe convivir con el giro del testigo de 4C-4c-2 (un testigo no puede tener las dos cosas). Siempre refutable con una pista alcanzable.
PRUEBAS: prueba nueva `test_versiones.js` (mutación: no tachar la versión vieja → detectada), test_testimonios, test_refuta_charla, test_validate, test_charlas, bot, test_textfit.
HECHO CUANDO: verde; tachados 4F-3, 24, H11.

### F15 · 4F-4 giro del caso
ESTADO: [ ]
LEER: ROADMAP fila 4F-4 · `grep -n "giro" docs/VARIEDAD.md docs/ROADMAP.md src/compile.js | head -20`
HAZ: Entre el 15 % y el 20 % de los casos (Fácil 10-15 %, Normal 15-20 %, Difícil 20-25 %, en datos) llevan un giro de caso que cambia algo a mitad (a partir del capítulo 2). Si `VARIEDAD.md` no trae lista cerrada, usa estos 4: (a) el cómplice: otro sospechoso ayudó; (b) la víctima exagera: lo robado era menos o más de lo dicho; (c) objeto cambiado: lo que se buscaba estaba ya en otra sala; (d) falsa pista plantada: una pista clave resulta ser puesta por el culpable. Cada giro: texto con remate, nueva pista y un cambio visible en el cuaderno. Convive con el giro del testigo (no coinciden en el mismo caso).
PRUEBAS: prueba nueva `test_giro_caso.js` (frecuencia dentro del rango en 300 casos/nivel; mutación: giro sin pista nueva → detectada), test_validate, bot (0 atascos), test_quality_spread.
HECHO CUANDO: verde; tachados 4F-4, 25, H12.

### F16 · 4F-5 rutina de personajes (SIN tocar `companion.js`)
ESTADO: [ ]
LEER: ROADMAP fila 4F-5 · `grep -n "sala\b.*npc\|npc.*room\|npcRoom" src/*.js | head -20`
HAZ: Los personajes cambian de sala por capítulo o por hechos del caso (NUNCA por reloj); en el cuaderno hay un «localizador» (dónde está cada uno ahora). Rutinas en datos (2-3 por escenario). La IA compañera NO se adapta aquí: si algo que ella ve cambia, apúntalo en la tarjeta F52 (nota). El bot sí debe poder seguir ganando.
PRUEBAS: prueba nueva `test_rutina.js`, test_logic, test_sospechosos, test_watcher, bot, test_companion (debe seguir verde sin tocarlo; si se rompe, aplica A2 y anótalo en F52).
HECHO CUANDO: verde; tachados 4F-5, 26, H13.

### F17 · 5A esquemas de misterio nuevos
ESTADO: [ ]
LEER: ROADMAP fila 5A · `docs/BIBLIA_DEL_CASO.md` (esquemas) · `grep -n "scheme\|esquema" src/compile.js | head -20`
HAZ: Añade 2 esquemas de misterio nuevos con su validador y textos (imita un esquema existente). NO subas `GEN_VERSION` (el ROADMAP lo decía, la decisión B2 lo anula): regenera códigos de prueba.
PRUEBAS: test_bible, test_gen_truth, test_validate, test_review, test_mass (masiva), bot.
HECHO CUANDO: verde en 300 casos/nivel con 0 atascos; tachados 5A, 19a, H14.

### F18 · 4F-0c hora, clima, espejo y paleta (E1, E2)
ESTADO: [ ]
LEER: `docs/VARIEDAD.md` §3 (E1, E2) · `grep -n "palette\|paleta\|flip\|mirror" src/*.js | head`
HAZ: Hora del día y clima ligados al ambiente (cielo, luz, ruido); espejo horizontal y 3 paletas por plantilla de sala. Sin arte nuevo. El camino (A*) debe respetar puertas y huecos tras el espejo. La huella gana los campos nuevos. Cifras con pesos en datos.
PRUEBAS: test_rooms, test_looks, test_atmos, test_fingerprint, test_mass; 5000 semillas con espejo: 0 atascos (R-10).
HECHO CUANDO: verde; tachados 4F-0c, 22c, H15.

### F19 · 4F-0d forma del caso y arranque (E3, E5)
ESTADO: [ ]
LEER: `docs/VARIEDAD.md` §3 (E3, E5)
HAZ: 4 formas de caso (clásico, dos frentes, cascada, de interrogatorio) y varios «ganchos» de arranque (primera escena/frase). La identidad compuesta (E4) NO va aquí (4P). Pesos en datos; Fácil solo clásico y cascada.
PRUEBAS: test_intro, test_validate, test_review, bot, test_fingerprint, test_mass.
HECHO CUANDO: verde; tachados 4F-0d, 22d, H16.

### F20 · 4P-1 banco genérico de personajes + GRAB-R2 banco de charlas
ESTADO: [ ]
LEER: ROADMAP filas 4P-1 y GRAB-R2 · DOCUMENTO_MAESTRO §0.3g · `grep -n "names\|apellid" src/gen_data.js src/data/*.js | head`
HAZ: Nombres ≥ 100 y apellidos ≥ 100 por separado, manías ≈ 40, muletillas ≈ 40, relaciones y voz; reglas: no repetir oficio, manía ni aspecto dentro de un caso y dejar siempre a alguien reconocible por su muletilla. GRAB-R2: banco de charlas con piezas intercambiables hasta ≈ 300 charlas posibles (hoy ≈ 7 por ambiente). Todo por tandas de ~25 líneas: escribe, pasa el linter (F09), guarda.
PRUEBAS: test_linter, test_charla_datos, test_charlas, test_grabadora, test_bible, test_voice, `node tools/variedad.js` (la repetición de texto debe bajar), bot.
HECHO CUANDO: metas de `tools/cupos.js` alcanzadas para nombres, manías y muletillas; tachados 4P-1, 22d2, H16b, GRAB-R2.

### F21 · 4P-2 aspectos de personaje por capas
ESTADO: [ ]
LEER: ROADMAP fila 4P-2 · `grep -n "LOOK_PARTS" src/*.js | head` · `tools/looks_sheet.js`, `test_looks.js`
HAZ: Amplía `G.LOOK_PARTS` (más pelo, color, ropa, accesorios, gafas) hasta la meta de §0.3g. Los 36 aspectos actuales NO cambian (comprobar que siguen idénticos). Genera la hoja de muestra con `tools/looks_sheet.js` y guárdala en `docs/`.
PRUEBAS: test_looks (ampliada: los 36 antiguos idénticos; ningún caso repite aspecto entre sus sospechosos), test_sospechosos, test_fingerprint.
HECHO CUANDO: verde; tachados 4P-2, 22d3, H16c.

### F22 · Cierre del bloque de receta
ESTADO: [ ]
HAZ: (1) Recalibra el medidor: `node tools/meter_fit.js 200 0 7` (pide aprobar con la medición; acepta si el error medio por nivel ≤ 3 %). (2) `node tools/baseline.js --write` y anota el cambio. (3) Suite completa (`cierre suite`). (4) Mide 150 casos por nivel: calidad, minutos, Oli/Lali, herramientas, libres 35-45 % (B9). (5) Rota documentos y comprueba tamaños. Tacha las filas «Recalibrar medidor al cerrar 4F-4».
HECHO CUANDO: suite verde y medición anotada.

## PARTE D · escenarios y temáticas
Regla del bloque: cada escenario nuevo = 9 salas candidatas, 2 variantes por sala, ≈ 12 curiosidades, 8 charlas, oficios (8-12) y secretos, reutilizando arte (≥ 50 % de objetos con sprite ya existente, ≤ 30 sprites nuevos). Mira SIEMPRE cómo está hecha la panadería (`grep -n "panader" src/*.js src/data/*.js | head`) y copia esa estructura. Cada paso termina con 0 atascos en 1000 semillas por nivel y linter en verde.

### F23 · 4H-0 piloto de escenarios (panadería a 9 salas + museo)
ESTADO: [ ]
LEER: `docs/ESCENARIOS.md` §5 (techos CONFIRMADOS) y §2-3 · ROADMAP fila 4H-0
HAZ: Paso 00 (tabla, receta R2.1): amplía `G.SCENARIOS` y `G.THEMES` a los 15 escenarios de DECISIONES D2b con `ready: false` salvo la panadería, y cambia `G.checkThemes` y `test_themes.js` de «9 escenarios · 3 por temática · cada escenario sirve a 2» a «15 · 5 por temática · cada escenario sirve a 2»; los códigos y la generación NO deben cambiar (`casos_sin_cambios` idéntico). Paso 0: panadería de 6 a 9 salas candidatas (Fácil 4, Normal 5, Difícil 6 de las 9; que Difícil varíe) y comprobar que Robo y Concurso se sienten distintos en la misma panadería (criterio de §5.1). Arregla la baldosa (16,8) cerrada de `calle_plaza` (D5). Paso 1: escenario museo completo. Rellena la tabla de techos de §5.3 con los valores reales. Decisión automática (A4): si el museo supera algún techo, aplica la palanca (2 escenarios por temática) y apunta en `ESCENARIOS.md` y en SESION qué escenarios quedan fuera.
PRUEBAS: test_rooms, test_themes, test_marco, test_fingerprint, test_mass, bot en 1000 semillas/nivel, test_macabro (incluye objetos de ambiente fuera de bolsas cerradas).
HECHO CUANDO: tabla de techos rellena y decisión anotada; tachados 4H-0, 26a, 4H, H19.

### F24 · PERF-1 · tamaño y rendimiento
ESTADO: [ ]
LEER: ROADMAP fila PERF-1
HAZ: Mide `dist/index.html`, `dist/web/index.html`, `dist/artifact.html`, tiempo de generar un caso (ms, 100 casos) y memoria (Node `process.memoryUsage`). Escribe el PRESUPUESTO en `docs/ESCENARIOS.md` (p. ej. +25 % sobre lo medido hoy como máximo al final). Si ya lo supera, carga los bancos de texto por partes (lo que prepara 4W-0).
HECHO CUANDO: presupuesto escrito; tachados PERF-1, 26c4, H19b.

### F25 · 4T-1 temática Robo
ESTADO: [ ]
LEER: `docs/FICHAS_TEMATICAS.md` (ficha de Robo) · ROADMAP fila 4T-1
HAZ: Pulir la que ya existe: variantes de cómo se hizo (distracción, trabajo interno, coartada imposible), 6-8 historias base, capítulos y epílogo propios, ficha de presentación. El caso 1 intacto.
PRUEBAS: test_themes, test_marco, test_bible, test_gen_truth, test_linter, bot, test_mass.
HECHO CUANDO: verde; tachados 4T-1, 26d, H20.

### F26 · 4T-2 temática Sabotaje
ESTADO: [ ]
LEER: `docs/FICHAS_TEMATICAS.md` §3 (Sabotaje) · ROADMAP fila 4T-2
HAZ: Objetivo: algo roto o estropeado; mini-juego de ordenar los hechos (cronología), pistas de herramientas y residuos, giro de accidente en cadena, 6-8 historias base, ficha completa. Escenarios compatibles según la tabla temática→escenarios.
PRUEBAS: test_themes, test_marco, test_validate, test_review, test_linter, bot, test_mass, test_puzles_cl5c si tocas puzles.
HECHO CUANDO: verde; tachados 4T-2, 26e, H21.

### F27 · 4E-2 pantalla «Crear caso»
ESTADO: [ ]
LEER: ROADMAP fila 4E-2 · `docs/ESCENARIOS.md` §2 · `grep -n "menú\|menu" src/ui*.js src/*.js | head -20`
HAZ: Pantalla con Temática (las que estén listas + Aleatorio + Mezclado) y Dificultad (Fácil · Normal · Difícil), y nada más (sin «Personalizar»). Las temáticas aparecen leyendo los datos (campo de «lista»), así que las que se terminen después aparecen solas. El código guarda temática, toque y dificultad. «Aleatorio» pesa lo menos reciente. En online, al crear la sala se junta el historial de los dos jugadores. Textos y botones caben en 844×390 y 667×375 (test_textfit, test_menutexto).
PRUEBAS: test_menutexto, test_textfit, test_menuscroll, prueba de menú nueva, tests de código (`G7-…` ida y vuelta), online (`cierre --solo="Online"`).
HECHO CUANDO: verde; tachados 4E-2, 17, H22.

### F28 · 4H-1 teatro, cine, circo y mansión
ESTADO: [ ]
LEER: ROADMAP fila 4H-1 · ESCENARIOS.md (cupos por escenario)
HAZ: Un escenario por vez, en este orden: teatro, cine, circo, mansión (completan más temáticas los dos primeros). Tras CADA escenario: pruebas de abajo, guardar, ZIP. Si F23 aplicó la palanca de recorte, haz solo los que quedaron.
PRUEBAS: test_rooms, test_themes, test_linter, test_macabro, test_fingerprint, bot 1000/nivel, test_mass.
HECHO CUANDO: verde por escenario; tachados 4H-1, 26b, H24.

### F29 · 4T-3 Concurso amañado
ESTADO: [ ]
LEER: `FICHAS_TEMATICAS.md` ficha Concurso · ROADMAP 4T-3
HAZ: Participantes, jueces y organizador con rol propio; actas y puntuaciones que comparar; sobornos como pista; 6-8 historias base; ficha completa.
PRUEBAS: como F26.
HECHO CUANDO: verde; tachados 4T-3, 26f, H25.

### F30 · 4T-4 Impostor
ESTADO: [ ]
LEER: `FICHAS_TEMATICAS.md` ficha Impostor · ROADMAP 4T-4
HAZ: Fichas de identidad con versiones, preguntas de control, desenmascarado con animación; arte nuevo de disfraces (pocos sprites: reutiliza `G.LOOK_PARTS` de F21); 6-8 historias base.
PRUEBAS: como F26 + test_anim, test_looks.
HECHO CUANDO: verde; tachados 4T-4, 26g, H26.

### F31 · 4T-5 ¿Sobrenatural?
ESTADO: [ ]
LEER: `FICHAS_TEMATICAS.md` ficha Sobrenatural · ROADMAP 4T-5
HAZ: Sucesos por capítulo con sonido, explicación absurda de cada fenómeno, final doble (culpable y truco), ambiente inquietante o macabro con remate; 6-8 historias base. Recalibra el medidor al terminar (`meter_fit.js 200 0 7`).
PRUEBAS: como F26 + test_atmos, test_macabro, test_voice.
HECHO CUANDO: verde; tachados 4T-5, 26h, H27 y «Recalibrar al cerrar 4T-5».

### F32 · 4H-2 mercado, granja y parque + PERF-2
ESTADO: [ ]
HAZ: Igual que F28 (uno por uno). Al cerrar: PERF-2 (repite F24 con 9 escenarios y compara con el presupuesto; si se supera, carga bancos por partes). Recalibra el medidor.
HECHO CUANDO: verde; tachados 4H-2, 26c, 26c5, H29, H29a.

### F33 · 4H-3 hotel y estación
ESTADO: [ ]
HAZ: Igual que F28, dos escenarios (9 salas candidatas cada uno, oficios y secretos propios).
HECHO CUANDO: verde; tachados 4H-3, 26c2, H29b.

### F34 · 4H-4 biblioteca, restaurante, balneario y estadio
ESTADO: [ ]
LEER: DECISIONES D2
HAZ: Igual que F28 con los cuatro de D2, hasta 15 escenarios. Cada temática debe tener al menos 5 escenarios compatibles (`tools/cupos.js` lo dice).
HECHO CUANDO: verde; 15 escenarios (o los que permita A4) y tachados 4H-4, 26c3, H29c.

### F35 · 4T-6 Desaparecido
ESTADO: [ ]
LEER: `FICHAS_TEMATICAS.md` ficha Desaparecido · ROADMAP 4T-6 · `grep -n "goal\|acusar\|localizar" src/logic.js src/schema.js | head -30`
HAZ: La de más riesgo. Objetivo final `localizar` (cambia la lógica de cierre en `logic.js`, esquema, validador, revisor y bot), rastros que seguir, escena final. Parte en subpasos: (1) esquema y validador, (2) lógica de cierre, (3) generador y datos, (4) bot, (5) textos. La IA compañera NO se adapta aquí (nota para F52). Acusar sigue funcionando en el resto de temáticas SIN cambios (prueba de regresión).
PRUEBAS: test_logic, test_accuse, test_acusar_fallo, test_validate, test_review, test_themes, bot en 1000/nivel, test_mass.
HECHO CUANDO: verde; tachados 4T-6, 26i, H37.

### F36 · 4T-7 Mezcla (toque secundario)
ESTADO: [ ]
LEER: ROADMAP fila 4T-7
HAZ: Temática principal + un toque de otra con tabla de parejas compatibles (en datos); cada pareja pasa la prueba masiva. Al cerrar: SUITE COMPLETA, medición de 150 casos por nivel y rotación de docs.
PRUEBAS: test_themes, test_mass por pareja, suite completa.
HECHO CUANDO: verde; tachados 4T-7, 26j, H38.

## PARTE E · contenido y vida

### F37 · 4G-1 objeto estrella y textos propios
ESTADO: [ ]
LEER: ROADMAP fila 4G-1 · `docs/MUESTRA_AMBIENTES.md` sección de defectos
HAZ: Objeto estrella y gag recurrente; plantillas con huecos del caso y concordancia de género; variantes por ambiente y temática; arregla los defectos 1 y 2 (género: «vive solo»→«sola»; «Soy muy correcto con los difuntos») y los de `MUESTRA_AMBIENTES.md` (D5).
PRUEBAS: test_linter, test_macabro, test_voice, test_textfit, test_charla_datos, bot.
HECHO CUANDO: verde; tachados 4G-1, 27, H30 y defectos 1-2.

### F38 · 4G-2 secretos y reacciones
ESTADO: [ ]
HAZ: Curiosidades con segundo paso y pista extra pequeña; reacciones de Rex y Luna. Por tandas de 25 textos con linter. Cifras con mín/máx/pesos.
PRUEBAS: como F37 + test_mech.
HECHO CUANDO: verde; tachados 4G-2, 28, H31.

### F39 · 4G-3 vida (eventos de ambiente)
ESTADO: [ ]
HAZ: Eventos de ambiente solo visuales o sonoros (sin afectar a pistas ni tiempo). Pruebas de rendimiento: no baja de 30 fps en la prueba de animación; `test_anim`, `test_atmos`.
HECHO CUANDO: verde; tachados 4G-3, 29, H32.

### F40 · 4G-4 epílogo personalizado
ESTADO: [ ]
HAZ: El cierre recuerda lo que hizo el jugador (pistas halladas, fallos, tiempo, quién ayudó más, herramienta favorita) con frases en banco por tono; sin saltarse el linter.
PRUEBAS: test_intro, test_textfit, test_linter, test_accuse.
HECHO CUANDO: verde; tachados 4G-4, 30, H33.

### F41 · 4G-5a bancos grandes I (COMPLETOS)
ESTADO: [ ]
HAZ: ≈ 100 curiosidades por ambiente (meta total ≈ 400), por tandas de 25: escribe → `node tools/linter_textos.js` → `node tools/variedad.js` → guarda. Ninguna tanda con más de 3 avisos sin arreglar.
HECHO CUANDO: `tools/cupos.js` marca la meta de curiosidades; tachados 4G-5a, 31, H34.

### F42 · 4G-5b bancos grandes II (COMPLETOS)
ESTADO: [ ]
HAZ: ≈ 100 charlas, reacciones y eventos (meta ≈ 300 charlas) con el mismo método de F41.
HECHO CUANDO: meta de charlas alcanzada; tachados 4G-5b, 32, H35.

### F43 · 4G-6 revisor de amor
ESTADO: [ ]
LEER: ROADMAP fila 4G-6
HAZ: Herramienta que da nota de detalle y variedad sobre 5000 semillas por nivel y se vuelve prueba obligatoria con umbrales sacados de la primera medición (el umbral = medición − 5 %).
HECHO CUANDO: verde; tachados 4G-6, 33, H36.

### F44 · Coleccionables
ESTADO: [ ]
LEER: ROADMAP §4.5 · `grep -n "coleccion" docs/ROADMAP.md | head`
HAZ: Pestaña «Colección», guardado y sincronización online. Los objetos coleccionables salen de las curiosidades y objetos de ambiente ya existentes (sin arte nuevo). Entra en SAVE (usa la prueba de F10).
PRUEBAS: prueba nueva `test_coleccion.js`, prueba de F10, online.
HECHO CUANDO: verde; tachados coleccionables y H39.

### F45 · 5B-1 arte de escenarios extra
ESTADO: [ ]
HAZ: Solo si los presupuestos de F24/F32 lo permiten (tamaño). Mejora el arte de los escenarios con más repetición (lo dice `tools/variedad.js`); máximo 30 sprites nuevos.
HECHO CUANDO: tachado 5B-1, 19b, H40 (o BLOQUEADO/«no hacía falta» con el dato de tamaño).

### F46 · 5B-2 plantillas y frases
ESTADO: [ ]
HAZ: Textos y bancos de los escenarios nuevos de F45. Si F45 no añadió nada, tacha.
HECHO CUANDO: tachados 5B-2, 19c, H41.

### F47 · 5C memoria completa de partidas y «no repetir»
ESTADO: [ ]
LEER: `docs/VARIEDAD.md` V-4
HAZ: Amplía lo de F06: memoria de lo jugado e ingredientes (niveles A, B, C) y textos sueltos. SOLO decide qué semilla se propone; nunca cambia lo que genera un código. Prueba de «sensación de repetición»: 20 casos seguidos por nivel con la memoria; ningún escenario ni objeto estrella se repite en 3 seguidos.
HECHO CUANDO: verde; tachados 5C, 19d, H42.

### F48 · 6A frases y humor por tandas
ESTADO: [ ]
HAZ: Tandas de 25 frases de humor por tono con linter y prueba masiva. Cierra la sección de «frases sueltas» generando `docs/MUESTRA_FRASES.md` (D4).
HECHO CUANDO: tachados 6A, 20a, H43.

### F49 · 6B rendimiento y escala
ESTADO: [ ]
HAZ: 10.000 semillas por nivel con 0 atascos y 0 errores; rendimiento (ms por caso) dentro del presupuesto de F24; `G.findPath` prueba varias baldosas candidatas (D5). Cierre de bloque: suite completa, 150 casos por nivel, rotar docs.
HECHO CUANDO: verde; tachados 6B, 20b, H44.

## PARTE F · IA, calibración y cierre

### F50 · CL-5c-c 3/4 · bot y compañero IA resuelven los puzles
ESTADO: [ ]
LEER: `docs/DISENO_PUZLES_CL5C.md` · CHECKLIST fila CL-5c-c · `grep -n "puzzle\|puzle" src/bot.js src/companion.js | head -30`
HAZ: El bot deja de contar 25/30 s fijos y resuelve los puzles de verdad; el compañero IA los usa con sus pistas. Subpasos: (1) bot, (2) medidor lee los tiempos reales, (3) compañero IA, (4) pruebas.
PRUEBAS: test_puzles_cl5c, test_puzles_revisor, test_validador_puzles, test_duracion_puzles, test_bot, test_companion, bot en 300/nivel con puzles.
HECHO CUANDO: verde; Difícil sigue ≤ 45 min; tachados CL-5c-c 3/4 y H47b.

### F51 · IA de Lali y Oli · charla señuelo (H47c)
ESTADO: [ ]
LEER: CHECKLIST fila H47c
HAZ: (a) Mide con 60 casos por nivel qué hace la IA de Lali con la charla señuelo. (b) Decisión ya tomada: la IA NO usa las charlas señuelo (`falsa_*`) como pista real; las trata como una charla más pero su conclusión se descarta al cruzarla con una pista que la refute; cámbialo en `companion.js` (`aiCandidates` debe distinguir señuelo de real). Que la IA siga ganando.
PRUEBAS: test_companion, test_ally, test_charla_senuelo_a/b, bot y compañero en 300/nivel.
HECHO CUANDO: verde; tachado H47c.

### F52 · IA de Lali y Oli · adaptar al resto + cierre del bloque (H47e y H47d)
ESTADO: [ ]
LEER: las notas dejadas en F16 y F35; CHECKLIST H47d y H47e
HAZ: Adapta el compañero IA a: salas 4/5/6, rutina de personajes, Desaparecido/`localizar` y lo que cambie rutas, tiempos o pistas. Después remide con la IA jugando: reparto Oli/Lali 40-60 %, minutos por nivel (techo 45), calidad por nivel.
PRUEBAS: test_companion, test_ally, test_relay, bot con compañero en 300/nivel, suite completa.
HECHO CUANDO: verde; tachados H47d y H47e.

### F53 · 4D-3 calibración final + puerta de calidad real (B5)
ESTADO: [ ]
LEER: ROADMAP fila 4D-3 · CHECKLIST líneas de 4D-3
HAZ: (1) Puerta de calidad real (B5). (2) Medición por temática y por dificultad (C7), 150 casos por celda: cada dificultad en su rango (Fácil 20-28, Normal 28-36, Difícil 36-45, techo 45; mínimo Fácil > 20), nota > 80, jugabilidad ≥ 50, par (1,05-2,4 × lo real) y recompensa proporcionados. (3) Si una meta falla en una celda, ajusta SOLO datos (rangos/pesos) y repite; si falla 2 veces, apúntalo en `PENDIENTE_DE_PERSONA.md` con la celda y el dato. (4) Las metas pasan a ser prueba obligatoria (`test_calibracion.js` con los umbrales medidos).
PRUEBAS: suite completa + la nueva.
HECHO CUANDO: tachados 4D-3, 15c, H45.

### F54 · 7A tutorial integrado
ESTADO: [ ]
HAZ: Tutorial dentro del juego (primer caso o botón de ayuda): moverse, examinar, herramientas (lupa, UV, ganzúa, grabadora), cuaderno, acusar. Cortos, saltables, con remate de humor. Se puede repetir desde el menú. Cabe en 844×390 y 667×375.
PRUEBAS: test_menutexto, test_textfit, prueba de navegador nueva (si hay Chromium).
HECHO CUANDO: verde; tachados 7A, 21a, H46.

### F55 · Z0 caso 1 oficial (nuevo, sin tocar el antiguo)
ESTADO: [ ]
LEER: DECISIONES D10 · CHECKLIST fila Z0
HAZ: Busca con el generador la mejor semilla Normal (nota ≥ 85, 0 atascos, varias herramientas) y guárdala como `caso_1_v2` seleccionable; el caso 1 antiguo (semilla 74937935) queda intacto y sigue por defecto. Apunta en PENDIENTE_DE_PERSONA.md que decida cuál es el principal.
HECHO CUANDO: `caso_1_v2` se puede jugar y las pruebas del caso 1 siguen verdes; tachados Z0 y H47.

### F56 · 7B créditos y pantalla final
ESTADO: [ ]
HAZ: Créditos, pantalla final y textos legales sencillos (juego hecho con Claude, sin datos personales, música/arte propios). Cabe en pantallas pequeñas.
HECHO CUANDO: verde; tachados 7B y 21b.

### F56b · 4F-0f Despacho como escena de robo (OPCIONAL, D6)
ESTADO: [ ]
HAZ: SOLO si F01-F56 están cerrados sin BLOQUEADO. Objetos robables nuevos que viven en el Despacho del dueño (sello, llave de la caja fuerte), con sus pistas y pasos; el sorteo puede elegirlo como sala del robo en los tres niveles. Si no, marca «no hecho (opcional)».
HECHO CUANDO: verde y medido, o anotado como no hecho.

### F57 · Z1 auditoría final de equilibrio y completitud
ESTADO: [ ]
LEER: `docs/EQUILIBRIO_Y_COMPLETITUD.md` §5
HAZ: Comprueba la «definición de juego completo»: EQ-1…EQ-9 en 10.000 semillas por nivel y temática, las 4 herramientas con uso real, ambos detectives con trabajo todo el caso, calidad por nivel, documentación sin filas pendientes (salvo las de persona). Escribe el informe en `docs/INFORME_Z1.md`. NO marques el ROADMAP como terminado: eso lo hace el usuario tras sus pruebas.
HECHO CUANDO: informe escrito; tachados Z1, 21d, H50.

### F58 · Cierre y entrega al usuario
ESTADO: [ ]
HAZ: (0) Si lo ejecutas en «salto de emergencia» (GUIA §0.4), lista en `PENDIENTE_DE_PERSONA.md` los pasos NO hechos con su ID y repite este paso al terminar los demás. (1) Suite completa verde. (2) `G.VERSION` a 0.9.0 (candidato al HITO). (3) Actualiza LEEME (Estado y Siguiente: «listo para HITO final»), ROADMAP (§1 dónde estamos), DOCUMENTO_MAESTRO §10 (una entrada) y rota lo viejo. (4) Completa `docs/PENDIENTE_DE_PERSONA.md` con TODO lo que le toca al usuario, en orden y con los códigos de caso a jugar. (5) Lista en SESION los pasos BLOQUEADOS con su causa. (6) ZIP `entregas/lali_oli_cases_v0_9_0_candidato_hito.zip` (GUIA §4.4). (7) PARA.
HECHO CUANDO: ZIP entregado; ESTADO de F58 `[x]`.
