# PROMPTS DE LA FASE 4 · cómo arrancar cada subfase (Sonnet 5.5, ver «Reglas de modelo» en el plan)
Una subfase = un chat nuevo. Sube el ZIP de la última entrega y pega el mensaje de la subfase. Los mensajes de las demás subfases se escriben al cerrar la anterior (así llevan lo que de verdad se hizo).

## Mensaje 4A · Misterio (Sonnet 5.5 medium)
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP lali_oli_cases_v0_7_21.zip (histórico: la 4A ya está HECHA en v0.7.22). Vamos a hacer la subfase 4A (misterio), con Sonnet 5.5 medium.

LEE SOLO esto (no explores el resto; no leas case1.js, play.js, world.js ni dist/):
- docs/ESTADO_FASE3.md
- docs/PLAN_FABRICA_DE_CASOS.md: las secciones «Misión y estándar de calidad», «Plan definitivo», «Reglas de modelo» y la subfase 4A
- docs/BIBLIA_DEL_CASO.md (con las «Aclaraciones de 3A») y docs/BASELINE.json
- src/bible.js, src/gen_truth.js, src/gen_clues.js, src/compile.js, src/fingerprint.js
- src/gen_data.js (solo las claves y los bancos de pistas, métodos y móviles)
- src/review.js (solo las reglas de equidad: culpable no descartable, inocente cercano, mentiras refutables)
- test_gen_clues.js y test_logic.js (para copiar el estilo de prueba) y tools/load_g.js

MISIÓN (manda sobre todo): cada caso generado debe ser único y profesional. Hoy 5000 semillas dan solo 3 huellas distintas: una única forma de captura (rastro+testigo+escondite+método) y 0 sospechosos engañosos.

OBJETIVO DE 4A:
1. PROTOTIPO primero. Una forma nueva de atrapar al culpable y un sospechoso engañoso, de principio a fin, pasando G.checkBible, G.validateCase y G.reviewCase (equidad ≥ 90). El contrato exige hoy 4 pruebas de tipo concreto (proof ≥ 3: rastro, testigo, escondite, método): hay que ajustar BIBLIA_DEL_CASO.md y bible.js, y anotarlo en ESTADO_FASE3.md. No avances a lo siguiente hasta que el prototipo pase.
2. GENERALIZAR: ≥ 4 formas de captura (p. ej. confesión indirecta, dos testigos que se contradicen, objeto imposible de tener…), ninguna por encima del 40 %. Guarda la forma en bible.captureForm (la huella ya la lee).
3. SOSPECHOSOS ENGAÑOSOS de 0 a 3 por caso según la dificultad y la ocasión del caso (no siempre los hay). Propuesta a confirmar: Fácil 0-1, Normal 1-2, Difícil 2-3; con 4 sospechosos, máximo 2. Cada engañoso parece el culpable perfecto pero es descartable (clearedBy) y tiene una explicación graciosa. Decide y anota si el nivel entra en la generación (G.generateCase(seed, {level})) o si la dificultad esconde/revela engañosos como hace el caso 1 con Bigotes.
4. Cada caso trae su GIRO propio (el gag y el tono van en 4B). El humor básico de las explicaciones va en gen_data.js; el grueso del humor es de 4B.
5. G.GEN_VERSION sube a 3 (códigos G3-…). Actualiza fingerprint.js (el campo decoy pasa a ser el recuento 0-3) y G.FINGERPRINT_GOALS; las metas de captura y engañoso pasan a EXIGIRSE en test_fingerprint.js.
6. Pruebas: test_gen_truth/test_gen_clues/test_bible/test_logic ampliados para las formas nuevas y los engañosos, 5000 semillas aceptadas al primer intento (≥ 90 %), equidad ≥ 90, determinismo, y el caso 1 intacto. Vuelve a ejecutar tools/baseline.js --write y compara con el estado de partida.

NOTA: desde la v0.7.21 el generador y la huella ya están dentro de build.js y el vigilante y los avisos del caso son datos (npcs.<id>.watch, locked.text, epilogue.timeout); no hay que tocar nada de eso en 4A. Si cambias algo del generador, vuelve a ejecutar npm test (incluye test_build.js y el navegador).

NO HAGAS en 4A: personajes y frases (4B), salas y mecánicas (4C), arte, calidad/duración (4D), botón «Caso nuevo» (4E). El caso 1 no se toca.

PROTOCOLO: (1) módulos pequeños, un cambio cada vez; (2) tras cada cambio ejecuta la prueba que toque o npm run test:fast y arregla antes de seguir; (3) entrega el ZIP completo (lali_oli_cases_v0_7_22.zip, con detectives/ dentro, sin node_modules) cuando el prototipo pase y otra vez al terminar; (4) si te quedas sin presupuesto, para, actualiza docs/ESTADO_FASE3.md y entrega lo hecho. Cada entrega incluye: versión subida (src/core.js, package.json, LEEME.txt), docs/DOCUMENTO_MAESTRO.md con su entrada, docs/ROADMAP.md, docs/PLAN_FABRICA_DE_CASOS.md y docs/ESTADO_FASE3.md al día (máximo 15 líneas). Estilo: JavaScript sin dependencias, funciones puras, datos serializables, mensajes de error en español con la ruta del dato, sin Math.random ni Date (solo G.rng). Termina con un resumen de 5 líneas: qué hay, qué prueba lo demuestra, qué toca después.
```

> **4B COMPLETA (v0.7.24).** Los mensajes siguientes se escriben al cerrar la anterior. Orden oficial: **4C-1a (low) → 4C-1b (medium) → 4C-2a (low) → 4C-2b (medium) → 4C-3a → 4C-3b-1 → 4C-3b-2 → 4C-4a/b/c (atmósfera, medium) → 4D → 4E-1 (low) → 4E-2 (medium) → HITO** (ver `ROADMAP.md` §4). Para 4C-1a sube `lali_oli_cases_v0_7_24.zip`, lee `ESTADO_FASE3.md` y el plan, y usa Sonnet 5.5 low. **El hito «el usuario juega 1 caso» del mensaje 4B queda suprimido:** el usuario probará los casos generados al final de la fase 4.

## Mensaje 4B · Personajes (Sonnet 5.5: low para el generador de aspectos, medium para frases y humor)
Hecha la 4A (v0.7.22). **La parte 1 (aspectos, low) está HECHA en v0.7.23**: si abres un chat nuevo para la parte 2, sube lali_oli_cases_v0_7_23.zip, usa este mensaje con solo los puntos 1 (identidad), 3 (frases y humor), 4, 5 y 6, y salta el punto 2 (ya hecho: `G.GEN_LOOK_IDS`, `test_looks.js`; mira «4B EN CURSO» en ESTADO_FASE3.md).
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP lali_oli_cases_v0_7_23.zip. Vamos a hacer la subfase 4B (personajes). Parte 1: generador de aspectos (Sonnet 5.5 low). Parte 2: frases y humor (Sonnet 5.5 medium).

LEE SOLO esto (no explores el resto; no leas case1.js, play.js, world.js ni dist/):
- docs/ESTADO_FASE3.md (incluye lo que deja la 4A)
- docs/PLAN_FABRICA_DE_CASOS.md: «Misión y estándar de calidad», «Plan definitivo», «Reglas de modelo» y la subfase 4B
- docs/BIBLIA_DEL_CASO.md (con «Aclaraciones de 3A» y «Cambios de 4A») y docs/BASELINE.json
- src/gen_data.js (bancos de nombres, rasgos, `compile.voice`, plantillas y `clueTpl`), src/compile.js, src/gen_truth.js (reparto y aspectos) y src/fingerprint.js
- src/sprites_b.js: SOLO `G.LOOKS`, las piezas de aspecto (pelo, sombrero, extras) y cómo se dibuja un aspecto (no toques los 7 aspectos actuales: el caso 1 no cambia)
- test_compile.js, test_logic.js y tools/load_g.js (para copiar el estilo de prueba)

ESTADO DE PARTIDA (v0.7.22, GEN_VERSION 3): 48 huellas en 5000 semillas; solo 7 aspectos (se repiten); 1,4-1,5 temas por personaje (caso 1: 2,4); 69 caracteres por línea (caso 1: 96); cada personaje casi solo tiene la coartada; `deceptive[i].why` es solo la actividad real, sin humor.

OBJETIVO DE 4B:
1. IDENTIDAD DEL CASO: tono, gag recurrente y ambiente propios por caso (la huella v2 gana `tone`); título y cliente que no se repiten de un caso a otro. El giro y el gag del engañoso salen de aquí.
2. GENERADOR DE ASPECTOS (low): más aspectos sobre `G.LOOKS` combinando piezas existentes (pelo, ropa, sombrero, extras), sin dos aspectos iguales en un mismo caso y sin tocar los 7 actuales. Medir cuántos aspectos distintos salen en 5000 semillas.
3. FRASES Y HUMOR (medium): 3-4 temas por personaje, frases por rasgo (nervioso, soberbio, evasivo, amable, seco), reacciones distintas al presionar y más variedad al desmontar cada mentira. Todo en gen_data.js. Por TANDAS: tras cada tanda, enséñame 6-8 muestras reales de diálogo para que las lea antes de seguir.
4. Las frases no pueden romper la lógica: lo que dice cada personaje sale de la biblia (test_logic.js sigue en verde). Sube G.GEN_VERSION a 4 si cambia cualquier salida de genTruth/genClues; si solo cambian plantillas de `compile`, no hace falta.
5. Pruebas: ampliar test_compile/test_logic/test_fingerprint para los temas nuevos, los aspectos sin repetir y el tono; 5000 semillas aceptadas al primer intento (≥ 90 %), equidad ≥ 90, determinismo, caso 1 intacto; volver a ejecutar tools/baseline.js --write y comparar.
6. Regenera docs/MUESTRA_CASOS.md (hoy es de la v0.7.17, G2-…) con casos nuevos para que yo los lea.

NO HAGAS en 4B: salas y mecánicas (4C), arte de policía (4C-3a), calidad y duración (4D), botón «Caso nuevo» (4E). El caso 1 no se toca.

HITO AL CERRAR: yo juego 1 caso generado para corregir el rumbo antes de 4C.

PROTOCOLO: igual que en 4A (módulos pequeños; npm run test:fast tras cada cambio; ZIP completo lali_oli_cases_v0_7_23.zip con detectives/ dentro y sin node_modules, al pasar la parte de aspectos y al terminar; si te quedas sin presupuesto, para, actualiza docs/ESTADO_FASE3.md y entrega lo hecho; cada entrega incluye versión subida (src/core.js, package.json, LEEME.txt) y documentos al día). Termina con un resumen de 5 líneas.
```

> **4C-1a HECHA (v0.7.25).** Siguiente: 4C-1b (Sonnet 5.5 medium).

## Mensaje 4C-1b · Mecánica con herramientas (Sonnet 5.5 medium)
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP lali_oli_cases_v0_7_25.zip. Vamos a hacer SOLO la subfase 4C-1b (mecánica con herramientas), con Sonnet 5.5 medium. No hagas ninguna otra subfase.

LEE SOLO esto: docs/ESTADO_FASE3.md; docs/PLAN_FABRICA_DE_CASOS.md (4C-1 y «Reglas de modelo»); docs/BIBLIA_DEL_CASO.md («Decisión para 4C-1a y 4C-1b»); src/gen_data.js (solo `rooms`); src/compile.js; src/bot.js (qué entiende: herramientas y puertas cerradas; NO sigilo, escuchar ni empujar); src/schema.js y src/logic.js (reglas de herramientas); src/review.js; src/fingerprint.js; test_rooms.js.

OBJETIVO: prototipo con herramientas (ganzúa en el hueco «cerradura», UV en el «rincón oscuro», lupa) elegidas por el compilador desde la semilla (azar propio; GEN_VERSION NO cambia salvo que haga falta tocar genTruth/genClues: entonces para y pregunta). Justicia: la herramienta la lleva alguien, validador, revisor, bot y huella (`mechanic`). Caso 1 intacto. Pruebas ampliadas, 5000 semillas aceptadas, npm test completo en verde.
NO HAGAS: sigilo ni empujar (4C-2b), calle (4C-2a), arte, tono, calidad (4D), botón (4E).
PROTOCOLO: módulos pequeños; test tras cada cambio; ZIP completo lali_oli_cases_v0_7_26.zip (con detectives/, sin node_modules) con versión subida y documentos al día (ESTADO_FASE3 máx. 15 líneas). Resumen final de 5 líneas.
```

> **4C-1b HECHA (v0.7.26).** 4C-2 se divide (decisión del usuario): **4C-2a (low) y, después, 4C-2b (medium)**. Cada una termina con parada; los mensajes de 4C-3a en adelante se escriben al cerrar la anterior.

## Mensaje 4C-2a · Más escenarios: variantes de sala y calle (Sonnet 5.5 LOW)
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP lali_oli_cases_v0_7_26.zip. Vamos a hacer SOLO la subfase 4C-2a (más plantillas de sala y escenario de calle, datos puros), con Sonnet 5.5 low. No hagas 4C-2b ni ninguna otra subfase y PARA al terminar.

LEE SOLO esto: docs/ESTADO_FASE3.md; docs/PLAN_FABRICA_DE_CASOS.md (4C-2a, «Idea del usuario: casos en la CALLE» y «Reglas de modelo»); docs/BIBLIA_DEL_CASO.md («Decisión para 4C-1a y 4C-1b»); src/gen_data.js (solo `rooms`); src/compile.js (`G.roomTemplate`, `G.roomMap` y el bloque de salas); src/fingerprint.js; test_rooms.js; test_mech.js; test_fingerprint.js.

OBJETIVO (todo son DATOS y el patrón de 4C-1a; no se inventa ninguna mecánica):
1. Variantes de sala: cada lugar pasa de 1 plantilla a varias (≥ 2 por lugar, ≥ 3 en el callejón), con otro tamaño, suelo, paredes interiores, decoración y objetos de ambiente. El compilador elige la variante de cada sala con un azar PROPIO de la semilla (constante nueva, p. ej. `seed ^ 0x5ce4e`) y un peso por variante (dato). `room.template` sigue siendo el id de la variante.
2. Calle: variantes exteriores (`scene: 'calle'`; las demás `'interior'`) con mapa abierto y los suelos que YA existen (`cobble`, `grass`: un suelo nuevo de acera o asfalto es arte y va en 4C-3a), con farolas, contenedores, setos, bancos y buzones de los sprites actuales. Cada plantilla de calle reserva `crowd: [[x,y], …]` (≥ 3 baldosas libres para curiosos): SOLO datos, los usa 4C-3b.
3. Toda variante cumple lo que ya vigila test_rooms.js: baldosas de arranque (6,7) y (7,7), de personajes (5..11,5) y de acceso a las puertas libres y alcanzables; ≥ 4 huecos de objeto (los habituales son 6); los 3 huecos `special` (cerradura, rincon, empujable) libres y alcanzables; nada se pisa. El hueco `empujable` sigue SIN mecánica (es de 4C-2b).
4. Huella: campo nuevo `scene` (`calle` si alguna sala del caso es de calle, si no `interior`), deducido de `room.template` consultando las plantillas, SIN añadir campos al formato de caso; sube `G.FINGERPRINT_VERSION`. Metas en `G.FINGERPRINT_GOALS` y exigidas en test_fingerprint.js: casos de calle entre el 25 y el 35 % en 5000 semillas (se ajusta con los pesos, que son datos) y ningún valor de `rooms` por encima del 40 %.
5. Pruebas: ampliar `test_rooms.js` (todas las variantes, reparto, `scene`, `crowd`), actualizar `test_fingerprint.js` (la clave pasa de 5 a 6 campos), mantener `test_mech.js` en verde y el caso 1 idéntico (hash 74937935, como en test_mech.js). Regenerar docs/BASELINE.json (`node tools/baseline.js --write`).

NO TOQUES: genTruth, genClues, `GEN_VERSION` (sigue en 4), bot, validador, revisor ni `compile.mech`. Si algo de eso hiciera falta, PARA y pregúntame. Nada de sigilo ni empujar (4C-2b), arte nuevo (4C-3a), escenas con aliados (4C-3b), atmósfera (4C-4), calidad (4D) ni botón (4E).
CRITERIO LOW: si la misma prueba falla dos veces seguidas, no insistas: explica qué falla y dime que hay que subir a medium.
PROTOCOLO: cambios pequeños y prueba tras cada uno; `npm test` completo al final (si se corta por tiempo, ejecuta por separado los pasos que falten); ZIP completo lali_oli_cases_v0_7_27.zip (con detectives/, sin node_modules) con la versión subida en src/core.js, package.json y LEEME.txt y los documentos al día (ESTADO_FASE3 máx. 15 líneas; añade el mensaje de 4C-2b ya ajustado a lo que hayas hecho si hace falta). Al terminar, resumen final de 5 líneas y PARA.
```

## Mensaje 4C-2b · Sigilo y empujar (Sonnet 5.5 MEDIUM) — 4C-2a HECHA en v0.7.27 (16 variantes, 2 de calle, `scene` en la huella)
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP lali_oli_cases_v0_7_27.zip. Vamos a hacer SOLO la subfase 4C-2b (sigilo y empujar), con Sonnet 5.5 medium. No hagas ninguna otra subfase y PARA al terminar.

LEE SOLO esto: docs/ESTADO_FASE3.md; docs/PLAN_FABRICA_DE_CASOS.md (4C-2b y «Reglas de modelo»); docs/BIBLIA_DEL_CASO.md («Decisión para 4C-1a y 4C-1b»); docs/FORMATO_DE_CASO.md (`watcher`, `watch`, `listen`, `coop`, `fx.moveProp`, `visible`); src/gen_data.js (solo `rooms` y `compile.mech`); src/compile.js; src/bot.js; src/schema.js, src/logic.js y src/world.js (vigilante, ventana segura, empujar, `coop`); src/companion.js; src/review.js; src/fingerprint.js; test_mech.js; test_watcher.js; tools/stealth_test.js.

OBJETIVO:
1. COMPROBAR primero, con pruebas, qué entiende hoy el bot de empujar (`fx.moveProp`, herramienta `coop`) y de sigilo (`watcher`, `npcs.<id>.watch`, ventana segura que exige el validador). Lo que falte se le enseña (con prueba) ANTES de usarlo en casos generados.
2. PROTOTIPO de UNA mecánica de principio a fin y después las demás: empujar usando el hueco `special.empujable` de la plantilla para destapar un objeto con pista oculta (`visible: { flag }`); luego sigilo con un vigilante en una sala de la plantilla; luego escuchar con la grabadora si cabe. Cada una debe pasar validador, revisor, bot, huella y compañero IA.
3. El compilador las añade a los conjuntos de `GEN_DATA.compile.mech` con su azar propio, ≤ 1 por mecánica y caso, y se omiten si no hay pista o sala que encaje; la huella debe mostrar ≥ 5 mecánicas distintas sin que ningún conjunto pase del 40 %.
4. Pruebas: ampliar test_mech.js y test_watcher.js; 5000 semillas aceptadas; el bot gana la muestra; una prueba de navegador con un caso generado con sigilo si es viable; caso 1 idéntico (hash 74937935).
GEN_VERSION: la mecánica de cada caso se elige en el compilador y NO cambia la biblia. Si hiciera falta escribirla en la biblia (revisor, informe), PARA y pregúntame antes de subir `GEN_VERSION` a 5. Si hay que tocar genTruth o genClues, también pregunta.
AVISO (de 4C-2a): `G.rooms` es ahora una LISTA de variantes por lugar (`G.roomVariants(pid)`; el id sale de `room.template`; `G.roomScene`); toda posición que uses (vigilante, objeto empujable) debe ser alcanzable con `G.findPath` (si el destino es sólido, el A* va a la baldosa libre más cercana en orden de lectura; un hueco cerrado lo deja inalcanzable): `test_rooms.js` ya lo vigila para los huecos actuales.
NO HAGAS: más plantillas ni calle (hechas en 4C-2a), arte de policía (4C-3a), aliados (4C-3b), atmósfera (4C-4), calidad (4D), botón (4E).
PROTOCOLO: módulos pequeños; test tras cada cambio; `npm test` completo al final (si se corta por tiempo, ejecuta por separado los pasos que falten); ZIP completo lali_oli_cases_v0_7_28.zip (con detectives/, sin node_modules) con versión subida y documentos al día (ESTADO_FASE3 máx. 15 líneas). Resumen final de 5 líneas y PARA.
```

## Mensaje 4C-2b-2 · Sigilo (Sonnet 5.5 MEDIUM) — 4C-2b-1 (empujar) HECHA en v0.7.28
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP de la v0.7.28. Vamos a hacer SOLO la subfase 4C-2b-2 (sigilo); al terminar, PARA.
LEE SOLO con grep/sed las funciones concretas (no archivos enteros): docs/ESTADO_FASE3.md; docs/PLAN_FABRICA_DE_CASOS.md (4C-2b-2); `watchConfig`/`watchLooking` en logic.js; la parte de vigilante de bot.js y world.js; companion.js; test_watcher.js y tools/stealth_test.js.
HAZ: (1) pruebas del bot con `watcher`, `npcs.<id>.watch` y la ventana segura ANTES de generar nada; (2) vigilante generado en la sala de la pista, con su `watch` y `watcher`; la ventana segura debe cubrir la acción más 1 s de margen, en Normal y Difícil; (3) enseñar al compañero IA a esperar la ventana, o confirmar con una prueba que world.js ya lo cubre; (4) revisor y huella: ≥ 5 mecánicas distintas y ninguna por encima del 40 %; (5) stealth_test.js ampliada con un caso generado. Azar propio (no altera lo demás), como mucho una vez por caso; se omite si no encaja. Escuchar con grabadora: fuera salvo que sobre presupuesto.
NO TOQUES: la biblia, genTruth, genClues, GEN_VERSION. Si hiciera falta, PARA y pregúntame.
PROTOCOLO: durante el trabajo solo pruebas aisladas (test_mech, test_rooms, test_watcher, test_fingerprint); la suite completa UNA vez al cerrar, con la salida a un log y solo el final; guarda un ZIP tras el generador de sigilo y otro tras la IA; caso 1 intacto (hash 74937935); entrega v0.7.29 con ZIP, ESTADO_FASE3.md y el documento maestro con su entrada, y PARA.
```

## ARRANQUE DEL SIGUIENTE CHAT · 4C-3a · Arte de policía (TODO en Sonnet 5.5 MEDIUM) — preparado al cerrar la v0.7.29
Decisión del usuario: de aquí en adelante **todo en medium** (no alternar low/medium). Sube el ZIP `lali_oli_cases_v0_7_29.zip` y pega SOLO este mensaje:
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español, sin explicaciones largas: tengo pocos tokens. Subo el ZIP de la v0.7.29. Hoy: (0) cerrar la v0.7.29 y (1) SOLO la subfase 4C-3a; al terminar, PARA.
LEE SOLO con grep/sed (no archivos enteros): docs/ESTADO_FASE3.md (líneas 1-6) y la tabla de docs/ROADMAP.md; de PLAN_FABRICA_DE_CASOS.md solo el párrafo de 4C-3a («Primero se comprueba qué de los 156 sprites existentes sirve»).
PASO 0 (v0.7.29): la suite completa NO llegó a terminar en el chat anterior (se cortó tras 5 pasos en verde: Construir, Composición, Validar casos, Revisor, Bot). Un comando dura como mucho 300 s: lánzala UNA vez en segundo plano (`nohup sh -c 'npm test > /tmp/full.log 2>&1; echo exit $? >> /tmp/full.log' &`) y consulta el log con `sleep 60; tail -5 /tmp/full.log` sin releer nada más. Si falla «Online (sala simulada)», repítelo solo (ya falló una vez por tiempos al correr junto a otros). Si falla algo de verdad, arréglalo y entrégame el ZIP corregido (v0.7.29) ANTES de seguir.
HAZ 4C-3a: (1) inventario de sprites existentes que sirvan para policía/escena (grep en sprites_a/b/c.js y ui.js; hoja con tools/looks_sheet.js o tools/muestra.js) y lista de lo que falta; (2) dibuja SOLO lo que falta: policías (agente y detective, con ≥ 3 aspectos), comisaría (mostrador, tablón, celda, archivador), coche de policía con sirena animada, cinta de «no pasar», conos, charcos y manchas oscuras sin detalle; mismo estilo y paleta que el caso 1; sin gore; (3) hoja de muestra renderizada (PNG) para que YO la apruebe; (4) pruebas: todos los sprites nuevos existen, se dibujan sin error y no pisan ids existentes; caso 1 intacto (hash 74937935).
NO TOQUES: la biblia, genTruth, genClues, GEN_VERSION, el generador de casos (los sprites nuevos NO se usan todavía en casos: eso es 4C-3b). Si hiciera falta, PARA y pregúntame.
PROTOCOLO (ahorrar tokens): solo pruebas aisladas durante el trabajo; la suite completa UNA vez al cerrar, en segundo plano con log y solo el final; ZIP de seguridad tras los sprites y otro al aprobar la hoja; entrega v0.7.30 con ZIP completo (detectives/, sin node_modules), ESTADO_FASE3.md (máx. 15 líneas) y DOCUMENTO_MAESTRO con su entrada, y PARA.
```
**Si el usuario no aprueba la hoja de muestra:** se corrige en el mismo chat (no se avanza a 4C-3b).

> **4C-3a HECHA y APROBADA (v0.7.30; hoja de muestra aprobada por el usuario).** 4C-3b se divide (decisión del usuario): **4C-3b-1 (animación, medium) y, después, 4C-3b-2 (escenas y aliados, medium)**. Cada una termina con parada.

## NORMA DE ENTREGA (vale para todos los mensajes)
**PROTOCOLO DE ENTREGA (norma fijada por el usuario, vale para TODAS las subfases):** (1) cada vez que se hagan cambios mínimos razonables dentro de una subfase, se entrega al usuario el PROYECTO COMPLETO actualizado en ZIP (`detectives/`, sin `node_modules`) con el documento maestro y el estado al día (checkpoint); (2) al acabar la subfase se entrega todo otra vez (ZIP final + `npm test` completo en verde) y se PARA; (3) NO se avanza a la siguiente subfase sin el consentimiento explícito del usuario; (4) cada subfase se hace con el modelo indicado en la hoja de ruta (Sonnet 5.5 medium desde v0.7.29).

> **4C-3b-2 HECHA (v0.7.32).** Siguiente: **4C-4a (atmósfera I, medium)**, solo con consentimiento del usuario. Mensaje: «Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo lali_oli_cases_v0_7_32.zip. Hoy SOLO la 4C-4a en Sonnet 5.5 MEDIUM. Lee docs/ESTADO_FASE3.md, el «Principio de tono» y 4C-4a de docs/PLAN_FABRICA_DE_CASOS.md y la nota de 4C-3b-2 de docs/BIBLIA_DEL_CASO.md. Lanza npm test una vez. Campo opcional def.mood (claro/inquietante/macabro con G.MOOD_WEIGHTS 50/32/18 y azar propio), bancos de texto macabros ligeros por cada uno de los 6 tonos, tema «¿ha notado algo raro?» y cierre de epílogo con escalofrío, todo con remate gracioso; el aliado de policía puede tener frases según mood. No cambies GEN_VERSION ni la biblia (si hiciera falta, PARA y pregunta). El toque macabro es «a veces, no siempre»: nada brusco ni gore. Cada cambio mínimo razonable: ZIP completo (checkpoint); al acabar, ZIP final con docs al día y PARA.»

## Mensaje de REVISIÓN de 4C-3a y 4C-3b-1 (Sonnet 5.5 MEDIUM) — HECHA (v0.7.31 revisada; el siguiente paso es 4C-3b-2 con permiso del usuario)
**ANTES DE 4C-3b-2: REVISIÓN EN MEDIUM (decisión del usuario, v0.7.31).** 4C-3a (v0.7.30) y 4C-3b-1 (v0.7.31) se hicieron en modo LOW por error, cuando debían ir en MEDIUM. Se hace una revisión en un chat nuevo con Sonnet 5.5 MEDIUM (sube `lali_oli_cases_v0_7_31.zip`). Estado conocido: `npm test` completo 29 pasos en verde, caso 1 idéntico (hash 74937935), `GEN_VERSION` 4. Qué revisar: (a) `src/world.js`: `Room` (marca `animOn`, `animDecor`, `animSkip`, tope `G.ANIM_MAX_PER_ROOM`), `drawAnimLayer`, `drawGlow`, `breath` y el cambio en `drawProp`/`drawActor`/`buildStatic`; riesgos: decoración animada que se pierde, glows con `uvOnly`/objetos movidos (`st.moved`), rendimiento en móvil, la respiración cambia visualmente el caso 1 (`G.ANIM_BREATH`), propiedad `animOn` tras `rebuild`/`enterRoom`; (b) `src/sprites_c.js`: `G.ANIMS`, `G.animState`, fotogramas nuevos (mismo tamaño, sin pisar ids), arte 4C-3a (13 sprites, 8 aspectos de policía en `sprites_b.js`); (c) pruebas: `test_police.js`, `test_anim.js`, `tools/anim_browser_test.js`, `tools/anim_sheet.js`, `tools/police_sheet.js` (¿comprueban de verdad lo que dicen?); (d) documentación coherente con el código (DOCUMENTO_MAESTRO v0.7.30/v0.7.31, ROADMAP, PLAN, ESTADO, BIBLIA); (e) que ningún módulo nuevo falte en los tres HTML (`test_build.js`). Entregable: informe de hallazgos y correcciones; si se corrige algo, ZIP v0.7.31 corregido (o v0.7.32 si cambia código de forma relevante, avisando) y PARAR. La hoja `animacion_v0_7_31.png` sigue pendiente de ver por el usuario. Solo después, y con consentimiento del usuario, se hace 4C-3b-2.
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo lali_oli_cases_v0_7_31.zip. Hoy SOLO una REVISIÓN en medium de 4C-3a y 4C-3b-1 (se hicieron en low). Lee docs/ESTADO_FASE3.md (primeras líneas), la entrada v0.7.31 y v0.7.30 de HISTORIAL_MAESTRO.md y la sección «REVISIÓN» de PROMPTS_FASE4.md; revisa world.js (animación), sprites_c.js, sprites_b.js (aspectos de policía), test_anim.js, test_police.js, tools/anim_*.js. Lanza npm test completo UNA vez (setsid nohup, tail del log). Informa de hallazgos, corrige lo necesario, entrégame el ZIP completo actualizado con la documentación al día y PARA. No empieces 4C-3b-2.
```

## Mensaje 4C-3b-1 · Animación de objetos y ambiente (Sonnet 5.5 MEDIUM)
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español, sin explicaciones largas: tengo pocos tokens. Subo el ZIP lali_oli_cases_v0_7_30.zip. Hoy SOLO la subfase 4C-3b-1 (animación de objetos y ambiente); al terminar, PARA.
LEE SOLO con grep/sed (no archivos enteros): docs/ESTADO_FASE3.md (líneas 1-6) y la tabla de docs/ROADMAP.md; de PLAN_FABRICA_DE_CASOS.md solo el párrafo de 4C-3b-1 y «Reglas de modelo»; src/world.js (cómo dibuja objetos, decals y decoración, y el reloj del dibujo; solo esas partes), src/schema.js (campos de objeto, solo si hace falta un campo nuevo), src/sprites_c.js (`G.sirenFrame` y los sprites de policía), docs/FORMATO_DE_CASO.md (solo si cambia el formato); test_police.js y tools/police_sheet.js.
OBJETIVO: (1) mecanismo general de animación (propuesta: tabla `G.ANIMS` por id de sprite con fotogramas y velocidad; `world.js` elige el fotograma con un reloj solo visual; si de verdad hace falta un campo `anim` en el formato, que sea opcional y documentado); (2) animar: coche de policía con sirena Y resplandor rojo-azul sobre el suelo cercano, cinta de precinto que ondea, farola o lámpara de interrogatorio que parpadea a veces, charco con destello y, si no cuesta, personajes en reposo que respiran; (3) dibujar SOLO los fotogramas que falten, con ids nuevos (el caso 1 no puede cambiar de aspecto); (4) muestra para que YO la apruebe (hoja o vídeo corto con tools/, por ejemplo cuadros sucesivos en un PNG).
REGLAS: no cambia lógica, colisiones, bot, validador ni revisor; el estado de la animación no se guarda ni se envía en el online; ≤ 6 objetos animados por sala y un solo reloj (rendimiento en móvil); caso 1 idéntico (hash 74937935); ningún caso generado usa aún estos objetos (eso es 4C-3b-2).
NO TOQUES: la biblia, genTruth, genClues, GEN_VERSION, el generador de casos. Si hiciera falta, PARA y pregúntame.
PROTOCOLO (ahorrar tokens): prueba aislada tras cada cambio; ZIP de seguridad (checkpoint) tras cada bloque razonable y otro al aprobar la muestra; la suite completa UNA vez al cerrar con `setsid nohup sh -c 'npm test > /tmp/full.log 2>&1; echo exit $? >> /tmp/full.log' > /dev/null 2>&1 &` y consulta con `sleep 60; tail -5 /tmp/full.log`; entrega v0.7.31 con ZIP completo (detectives/, sin node_modules), ESTADO_FASE3.md (máx. 15 líneas) y DOCUMENTO_MAESTRO con su entrada, y PARA.
```

> **4C-3b-1 HECHA (v0.7.31).** Animación disponible para 4C-3b-2: `G.ANIMS` (ids animables: `police_car_0`, `police_tape_h/v`, `decal_puddle`, `lamp_post_blink`, `interrogation_table`; para una farola que parpadea usar `lamp_post_blink`, no `lamp_post`), `G.animState/animFrame`, tope `G.ANIM_MAX_PER_ROOM` = 6 por sala (el resto se dibuja quieto) y sin campo nuevo en el formato: basta usar esos ids de sprite en `props`, `decor` o `decals`. Se prueba con `test_anim.js` (que exige que el generador aún no los use: 4C-3b-2 debe actualizar esa comprobación) y `tools/anim_browser_test.js`.

## Mensaje 4C-3b-2 · Escenas y aliados (Sonnet 5.5 MEDIUM) — solo tras la REVISIÓN en medium y con permiso explícito del usuario
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español, sin explicaciones largas: tengo pocos tokens. Subo el ZIP lali_oli_cases_v0_7_31.zip. Hoy SOLO la subfase 4C-3b-2 (escenas especiales y aliados de policía); al terminar, PARA.
LEE SOLO con grep/sed (no archivos enteros): docs/ESTADO_FASE3.md (líneas 1-6) y la tabla de docs/ROADMAP.md; de PLAN_FABRICA_DE_CASOS.md solo el párrafo de 4C-3b-2 y «Reglas de modelo»; docs/BIBLIA_DEL_CASO.md («Decisión para 4C-1a y 4C-1b» y «Cambios de 4C»); src/compile.js, src/gen_data.js (`rooms`, `compile`), src/fingerprint.js, src/scenes.js, src/companion.js; test_rooms.js, test_mech.js, test_police.js.
OBJETIVO: (1) escenas con aliado: comisaría, interrogatorio y reconstrucción del hecho, más la escena de calle con coche de policía animado, como plantillas o estructuras del compilador con azar propio de la semilla; (2) el aliado (agente, inspector o comisario de `G.POLICE_LOOKS`) tiene personalidad propia, ofrece ayuda limitada (analizar una pista, abrir un permiso, dar un dato de la cronología), a veces se equivoca con gracia y NUNCA resuelve el caso; lo que dice sale de la biblia, así que pasa test_logic.js y el revisor; (3) la huella añade `ally` y amplía `scene` (≥ 3 tipos de escena); meta: ≥ 50 % de los casos con escena especial y aliado. Si algo debe figurar en la biblia, PARA y pregúntame antes de subir `GEN_VERSION` a 5.
NO TOQUES: genTruth, genClues (salvo permiso), caso 1 (hash 74937935), nada de atmósfera (4C-4), calidad (4D) ni botón (4E).
PROTOCOLO (ahorrar tokens): prueba aislada tras cada cambio; ZIP de seguridad (checkpoint) tras cada bloque razonable; la suite completa UNA vez al cerrar (`setsid nohup …` como en 4C-3b-1); entrega v0.7.32 con ZIP completo (detectives/, sin node_modules), ESTADO_FASE3.md (máx. 15 líneas) y DOCUMENTO_MAESTRO con su entrada, y PARA.
```

## Mensaje 4C-4b · Atmósfera II (Sonnet 5.5 MEDIUM) — 4C-4a HECHA en v0.7.33
```
Eres el ingeniero de la fábrica de casos de Lali & Oli Cases. Responde en español. Subo el ZIP de la v0.7.33 y DOCUMENTO_MAESTRO.md. Vamos a hacer SOLO la subfase 4C-4b (atmósfera II: capa visual y sonora del `mood`); al terminar, PARA y envíame el ZIP completo.
LEE con grep/sed lo concreto (no archivos enteros): docs/ESTADO_FASE3.md; docs/PLAN_FABRICA_DE_CASOS.md (capa 2 del diseño de atmósfera y 4C-4b); G.pickMood y def.mood en compile.js; drawAnimLayer y la viñeta/ambient de world.js; el audio procedural de core.js; G.ANIMS en sprites_c.js.
HAZ: luz más tenue por ambiente (viñeta oscura y parpadeo suave de la bombilla en inquietante/macabro), niebla o polvo en la calle, zumbido grave y un crujido con el audio que ya existe, y objetos de ambiente (silla que se mece, sombra en la ventana, mancha oscura sin detalle en macabro, charcos de mermelada o salsa en claro/inquietante) reutilizando el arte de 4C-3a. Solo cambia lo visual y sonoro según `def.mood`: nada de biblia, hechos ni formato de caso salvo lo mínimo. El caso 1 (sin mood = claro) no cambia (hash 74937935).
NO TOQUES: genTruth, genClues, GEN_VERSION, la lógica de pistas; nada de pistas con matiz (4C-4c).
PROTOCOLO: prueba aislada tras cada cambio; ZIP de checkpoint tras cada bloque razonable; suite completa UNA vez al cerrar (`setsid nohup sh -c 'node test.js > /tmp/full.log 2>&1; echo exit $? >> /tmp/full.log' > /dev/null 2>&1 &` y consultar el log); entrega v0.7.34 con ZIP, ESTADO_FASE3.md y documento maestro, y PARA.
```

## (HECHO en v0.7.35) MENSAJE PARA EL PRÓXIMO CHAT · CERRAR 4C-4c-1 (Sonnet 5.5 LOW propuesto; MEDIUM también vale) — copiar y pegar junto con el ZIP `lali_oli_cases_v0_7_34_4C-4c-1_cierre_preparado.zip`
Lee SOLO `docs/DOCUMENTO_MAESTRO.md` §0.0 y sigue sus 7 pasos en orden: parchear las 3 pruebas con `python3 tools/cierre_4c4c1_parches.py`, subir a v0.7.35, `node build.js`, `node tools/baseline.js --write`, `node tools/muestra_mood.js`, documentación con `docs/CIERRE_4C-4C-1_TEXTOS.md`, suite completa UNA vez (`setsid nohup`), y entregar `lali_oli_cases_v0_7_35.zip`. No programes nada nuevo, no toques `genClues`/`bible.js`/`compile.js` ni el caso 1 (74937935), no empieces 4C-4c-2. Al acabar: ZIP completo y PARAR.


## Mensaje 4C-4c-2 · Atmósfera III, parte 2: situaciones macabras y giro del testigo (Sonnet 5.5 MEDIUM) — **HECHA en v0.7.36** (mensaje conservado como registro)
Lee `docs/ESTADO_FASE3.md` y el apartado «4C-4c-2» del DOCUMENTO_MAESTRO (§0). Tarea: (1) **situaciones macabras del escenario** (con remate; no cambian los hechos: p. ej. un congelador con candado que resulta lleno de tartas de prueba): objetos o decorados de sala con texto, elegidos por un azar propio; (2) **giro macabro opcional** de un testigo (insiste en que vio a alguien que ya no estaba) sin tocar puntos, fuentes ni derivaciones. `GEN_VERSION` NO subió a 6 (decidido: se queda en 5). Regla de oro: todo momento macabro lleva remate, nada gráfico, y `checkBible`, revisor y `test_logic.js` en verde en 5000 semillas; caso 1 intacto (74937935). Norma: ZIP completo con cada cambio mínimo razonable, 1-2 checkpoints antes del final, suite completa UNA vez al cerrar, y PARAR.

## (HECHO en v0.7.37) Mensaje 4D-1 · Medidor de duración y calidad (Sonnet 5.5 LOW) — conservado como registro
Lee `docs/ESTADO_FASE3.md` y `docs/ROADMAP.md` §4 (fila 15a). Tarea única: un estimador barato de duración y calidad dentro de `generateCase`, con `parSeconds` y `reward` calculados por caso (no 600/100 fijos) y un informe de metas. Es LOW: no toques `genTruth`, `genClues`, `bible.js`, el validador, el revisor, el formato de caso ni textos de humor; `GEN_VERSION` sigue en 5 y el caso 1 (74937935) no cambia. Si una prueba falla dos veces, para y avisa. Norma: ZIP completo con cada cambio mínimo razonable, suite completa UNA vez al cerrar, y PARAR.

## Mensaje 4D-2 · Capítulos y duración (Sonnet 5.5 MEDIUM) — 4D-1 HECHA en v0.7.37
Lee `docs/ESTADO_FASE3.md` y `docs/ROADMAP.md` §4 (fila 15b). Tarea: llevar los casos generados a ≥ 20 min y jugabilidad ≥ 50 con CONTENIDO real (hoy ~16,2 min de media; solo ~8 % llega a 20). El medidor (`src/meter.js`, `node tools/meter_fit.js`) dice cuánto aporta cada pieza: 1 tema de charla ≈ 23 s, 1 paso de pista ≈ 26 s, 1 sala ≈ 28 s. Diagnostica por qué el capítulo 2 se lleva el 100 % del tiempo (el bot lo mide así tras cerrar los objetivos del 1) y reparte el caso en capítulos con metas (pistas, interrogatorio, acusación). Reglas: `GEN_VERSION` solo sube si tocas `genTruth`/`genClues`/bancos que los afecten (si hiciera falta, PARA y pregunta); el caso 1 (74937935) no cambia; reajusta el medidor si cambia el contenido y recalcula `BASELINE.json`; `checkBible`, revisor y `test_logic.js` en verde. Norma: ZIP completo con cada cambio mínimo razonable, suite completa UNA vez al cerrar, y PARAR.
