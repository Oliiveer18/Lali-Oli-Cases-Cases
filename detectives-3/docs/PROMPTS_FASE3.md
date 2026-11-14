# PROMPTS DE LA FASE 3 · cómo trabajar cada subfase con Sonnet 5.5
Una subfase = **un chat nuevo**. Sube el ZIP de la última entrega y pega el mensaje de la subfase. Todo el trabajo va con Sonnet 5.5 (medio, salvo donde se indica «bajo»).

## Por qué así (ahorro de tokens)
- El ZIP se sube entero, pero la sesión **solo lee los archivos que se listan**: no hace falta leer `case1.js` (43 KB), `play.js`, `world.js` ni `dist/`. Con el contrato (`BIBLIA_DEL_CASO.md`) y las APIs listadas basta.
- Los módulos nuevos son pequeños (≤ ~300 líneas): se escriben, se prueban y se entregan antes de seguir.
- `tools/load_g.js` carga el motor sin navegador: `const G = require('./tools/load_g.js')(['bible.js'])`. Las pruebas nuevas lo usan.

## Bloque común (va dentro de cada mensaje)
> Eres el ingeniero de la fábrica de casos de «Lali & Oli Cases». Responde en español. Lee SOLO los archivos que te indico; no explores el resto del proyecto. No reabras las decisiones de `docs/BIBLIA_DEL_CASO.md`; si algo no encaja, anótalo en `docs/ESTADO_FASE3.md` (sección «Notas / desviaciones») y sigue. El caso 1 no se toca.
> Protocolo anti-corte: (1) escribe cada módulo en archivos pequeños; (2) después de cada módulo ejecuta `node test_<x>.js` o `npm run test:fast` y arregla antes de seguir; (3) **entrega un ZIP completo cada vez que un módulo y sus pruebas estén en verde** (no esperes al final); (4) si notas que te quedas sin presupuesto, para, actualiza `docs/ESTADO_FASE3.md` y entrega el ZIP con lo hecho.
> Cada entrega incluye: ZIP completo (`lali_oli_cases_v0_7_X.zip`, con `detectives/` dentro, sin `node_modules`), versión subida (`src/core.js`, `package.json`, `LEEME.txt`), `docs/DOCUMENTO_MAESTRO.md` con su entrada de versión, `docs/ROADMAP.md` y `docs/PLAN_FABRICA_DE_CASOS.md` al día y `docs/ESTADO_FASE3.md` actualizado. Termina con un resumen de 5 líneas: qué hay, qué prueba lo demuestra, qué toca después.
> Estilo: JavaScript sin dependencias, funciones puras y datos serializables, mensajes de error en español con la ruta del dato, sin `Math.random` ni `Date` (solo `G.rng`).

## Mensaje 3A · Comprobador de biblias (Sonnet 5.5 medio) — HECHO en v0.7.12 (se conserva como referencia)
Lee: `docs/ESTADO_FASE3.md`, `docs/BIBLIA_DEL_CASO.md`, `docs/FORMATO_DE_CASO.md` (solo el apartado de `G.LOOKS`/convenciones), `tools/load_g.js`, `tools/spike_compilador.js`, `test_review.js` (solo las 25 primeras líneas, para copiar el estilo de prueba).
Objetivo: crear `src/bible.js` y `test_bible.js`.
1. `G.GEN_VERSION = 1`, `G.minToStr(m)` / `G.strToMin('23:40')`, `G.caseCode(seed)`.
2. `G.checkBible(b)` → `{ ok, errors:[{code,path,msg}] }` con **los 13 invariantes estructurales** de la tabla del contrato (todos menos `determinismo`), un código por invariante, y la opción `{ partial:true }` que salta `coartada_inocente`, `mentiras`, `pruebas`, `pistas_falsas`, `puntos`, `alcanzable` y `metodo_motivo`. Debe tolerar basura (`null`, objetos a medias) sin lanzar excepciones.
3. `test_bible.js`: una biblia **buena escrita a mano** (4 sospechosos, 4 lugares, cronología coherente, ≥ 3 pruebas, 2 mentiras) que pasa, y **una variante rota por cada invariante** que falla con su código exacto. Añádelo a `test.js` como paso «Comprobador de biblias» (cargando `bible.js` tras `review.js`).
4. Para cada biblia buena, comprueba además que se puede traducir a mano a un `def` válido reutilizando la lógica del spike (solo una vez, para confirmar que el contrato alcanza; no es el compilador).
Listo cuando: `npm run test:fast` en verde y 43 comprobaciones en `test_bible.js` correctas. Entrega ZIP v0.7.12.

## Mensaje 3B · La verdad (Sonnet 5.5 medio) — HECHO en v0.7.13 (se conserva como referencia)
Lee: `docs/ESTADO_FASE3.md`, `docs/BIBLIA_DEL_CASO.md` (con las «Aclaraciones de 3A»), `src/bible.js` (solo las utilidades y los códigos), la biblia buena de `test_bible.js` (líneas de `GOOD`, como modelo de datos) y `tools/load_g.js`. No leas más.
Objetivo: `src/gen_data.js` y `src/gen_truth.js`, con `test_gen_truth.js`.
1. `gen_data.js`: bancos (≥ 12 nombres con humor suave, 5 lugares, ≥ 8 objetos robables, ≥ 8 métodos, ≥ 8 motivos, rasgos `trait`, plantillas de «qué hacía» por lugar). Solo datos.
2. `G.genTruth(seed)`: reparto (1 cliente + 4-6 sospechosos, aspectos de `G.LOOKS`), lugares 3-5, objeto robado, culpable, método, móvil, ventana, **cronología** coherente (nadie en dos sitios; solo el culpable en el lugar del robo en la ventana) y `alibis` (culpable: miente y no se sostiene; inocentes: posición verificable en otro lugar). Devuelve una biblia *parcial*: `clues`, `lies` y `proof` = `[]`, `method.needs`/`motive.needs` = `[]`, `clearedBy:null`, y `truth.decoys` completo (≥ 2 señuelos de método y de móvil con texto). **Tú decides quién miente**: el culpable y 1-2 inocentes llevan `holds:false` (los inocentes, verificablemente en otro lugar durante la ventana); 3C creará `lies` a partir de eso. Respeta las reglas de testigos (deben estar en el mismo lugar y franja) y de ventana de las aclaraciones.
3. Prueba: 3000 semillas → cumplen los invariantes de verdad (`reparto`, `lugares`, `cronologia`, `ventana`, `coartada_culpable`) y dos llamadas con la misma semilla dan `JSON.stringify` idéntico; las semillas distintas dan culpables y cronologías variados (muestra la distribución del culpable y del método).
Listo cuando: `npm run test:fast` en verde. Entrega ZIP v0.7.13. (Usa `G.checkBible(b, { partial:true })`; ya existe.)

## Mensaje 3C · Pistas y mentiras (Sonnet 5.5 medio) — HECHO en v0.7.14 (se conserva como referencia)
Lee: `docs/ESTADO_FASE3.md`, `docs/BIBLIA_DEL_CASO.md` (con las «Aclaraciones de 3A»), `src/bible.js`, `src/gen_truth.js` (solo la API y la forma de la salida), `src/gen_data.js` (solo las claves), `tools/spike_compilador.js` (cómo se reparten los puntos de sospecha).
Objetivo: `src/gen_clues.js` y `test_gen_clues.js`.
1. `G.genClues(bible)` (pura, determinista con `G.rng(bible.seed ^ 0x51ed)`): añade `clues`, `lies`, `proof`.
 - ≥ 3 **pruebas** derivadas de eventos de la cronología del culpable (huella, recibo, testigo, cámara…), puntos que sumen ≥ 12 contra él.
 - 1 **descarte** por inocente (coartada verificable) como mucho a un inocente sin descarte; todos los demás con `clearedBy`.
 - ≥ 1 **pista falsa** por inocente, con 2-3 puntos y sin entrar en `proof`.
 - ≥ 2 **mentiras** (culpable + inocente) con `refutedBy` con al menos una pista cuya fuente no sea el mentiroso.
 - Reparte las fuentes: objetos en lugares (máx. 4 por lugar) y temas de personajes.
2. Prueba: 3000 semillas → `genTruth` + `genClues` pasan `G.checkBible` **completo** (los 13 invariantes). Informa del reparto de pistas por rol y de cuántas semillas necesitan algún reintento interno.
Listo cuando: `npm run test:fast` en verde. Entrega ZIP v0.7.14.

## Mensaje 3D-1 · Compilador y generador (Sonnet 5.5 medio) — HECHO en v0.7.15 (se conserva como referencia)
Lee: `docs/ESTADO_FASE3.md`, `docs/BIBLIA_DEL_CASO.md` (sobre todo «Cómo se compila»), `tools/spike_compilador.js` (referencia), `src/bible.js`, `src/gen_clues.js` (solo la API), `src/schema.js` (solo si el validador rechaza algo).
Objetivo: `src/compile.js` y `test_compile.js`.
1. `G.compileBible(bible)` → `def` (reglas del contrato; salas de relleno 14×9; id `gen_<código>`; título, cliente y sinopsis desde plantillas de `gen_data.js`, que puedes ampliar).
2. `G.generateCase(seed)` → `{ def, bible, review, attempts, code }`: encadena `genTruth` → `genClues` → `checkBible` → `compileBible` → `validateCase` + `reviewCase`; si no es aceptado reintenta con `seed + k·0x9e3779b1` (k ≤ 8, determinista). Si tras 8 intentos falla, devuelve `{ error }` **y la prueba debe fallar** (no se oculta).
3. Prueba: 300 semillas aceptadas (validador ok, revisor ok, equidad ≥ 90), tasa de primer intento, y el caso 1 sin cambios (`G.reviewCase(G.CASES.tarta).fairness`). Añade el paso a `test.js`.
Listo cuando: `npm run test:fast` en verde. Entrega ZIP v0.7.15. Si hay muchos reintentos, **corrige la causa en `gen_truth`/`gen_clues`**, no subas el límite de intentos.

## Mensaje 3D-2 · Informe, pruebas masivas y cierre (Sonnet 5.5 bajo) — HECHO en v0.7.16 (se conserva como referencia)
Lee: `docs/ESTADO_FASE3.md`, `src/compile.js` (solo la API), `src/bible.js` (solo la API), `test.js`.
Objetivo:
1. `G.caseReport(bible)` → texto en español legible: título, cliente, el robo, reparto con rasgos, cronología con horas (`G.minToStr`), qué dice cada sospechoso, mentiras y cómo se desmontan, pruebas, descartes y pistas falsas. Una página por caso.
2. `test_mass.js`: 5000 semillas consecutivas → 100 % aceptadas, tasa de primer intento ≥ 90 %, determinismo en una muestra de 200, tiempo total, y cuántos casos distintos (culpable/método/móvil) salieron. Añádelo a `test.js` con un tope de tiempo razonable.
3. Genera `docs/MUESTRA_CASOS.md` con 8 informes de semillas variadas para que el usuario los lea.
4. Cierra la fase: `docs/PLAN_FABRICA_DE_CASOS.md` (fase 3 HECHA), `docs/ROADMAP.md`, `docs/DOCUMENTO_MAESTRO.md`, `docs/ESTADO_FASE3.md` (siguiente: fase 4).
Listo cuando: `npm test` (o `test:fast` si no hay Chromium) en verde. Entrega ZIP v0.7.16 + `docs/MUESTRA_CASOS.md` suelto.

## Después de la fase 3
Tú lees `MUESTRA_CASOS.md` y me dices qué te parece interesante o aburrido. Con eso se ajustan bancos de frases y rasgos y se abre la fase 4 (plantillas de sala, personajes y botón «Caso nuevo»), que tendrá su propio plan de subfases.
