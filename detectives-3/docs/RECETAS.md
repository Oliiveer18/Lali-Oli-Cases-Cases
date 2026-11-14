# RECETAS (cómo se hacen las tareas repetitivas de este proyecto) · 29 oct, cp. 278
Úsalas cuando una tarjeta diga «imita» o «receta Rx». Si algo no coincide con el código real, MANDA EL CÓDIGO: busca un ejemplo vecino con `grep` e imítalo.

## R1 · Escribir una prueba nueva
1. Copia la forma de una prueba existente pequeña (`test_looks.js`, `test_grab_reac.js`). Cabecera de comentario (qué comprueba, «Uso: node test_xxx.js»).
2. Plantilla mínima:
```js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']); // extras = módulos de src/ que necesites
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
// ... comprobaciones: ok('texto claro de lo que se vigila', condición, 'dato útil si falla');
console.log(bad ? `${bad} FALLOS` : 'Todo en orden');
process.exit(bad ? 1 : 0);
```
3. Muestras: 40 semillas por nivel para pruebas rutinarias, 300+ para las pesadas; siempre semillas fijas (determinista). Las tres dificultades se miden por separado.
4. Añade UNA mutación por cada cosa importante que vigila (receta R6): una prueba que no detecta su mutación no vale.
5. Regístrala en la lista `steps` de `test.js` con el formato `['Nombre claro', ['test_xxx.js']]` (mira las líneas vecinas). La suite por pasos (`node tools/cierre.js suite`) la lee de ahí; comprueba con `node tools/cierre.js --lista suite`.

## R2 · Añadir un ESCENARIO (4H-0…4H-4)
Tablas: `src/gen_themes.js` (`G.SCENARIOS` y `G.THEMES.<tema>.scenarios`). Un escenario NO entra en el generador hasta tener `ready: true` (así el juego sigue funcionando mientras lo construyes).
1. Tabla al día (se hace una vez, en F23): ver `docs/DECISIONES_FINALES.md` D2b (15 escenarios; cada temática 5; cada escenario sirve a 2 temáticas). Cambia `G.checkThemes` y `test_themes.js` de «9 escenarios / 3 por temática» a «15 / 5».
2. Salas: están en `G.GEN_DATA.compile.rooms` (`src/gen_data.js`, o `src/data/…` tras F07). Cada sala = lista de VARIANTES con: `id, weight, w, h, floor, ch, walls, doorX, decor, decals, scenery, slots, special{cerradura, rincon, empujable, escena}, listen`. Copia una variante parecida de la panadería y cambia solo posiciones y sprites. Reglas que vigila `test_rooms.js`: casillas de arranque (6,7) y (7,7), de personajes (5..11,5) y de acceso a puertas libres; todo alcanzable; ≥ 6 huecos; los 3 huecos especiales libres. Pasa `test_rooms.js` tras CADA sala.
3. Sprites: usa SOLO los que ya existen (`grep -o "'[a-z_0-9]*'" src/sprites_a.js | sort -u | head -200`). Meta: ≥ 50 % de objetos con sprite ya existente, ≤ 30 sprites nuevos. Un sprite nuevo se dibuja imitando uno vecino en `src/sprites_*.js` y se comprueba en la hoja de muestra.
4. Cómo se asocian las salas a un escenario y cómo se añadió la 6.ª sala de la panadería: `grep -n "despacho" docs/HISTORIAL_SESION.md | head -5` y `grep -n "despacho" src/compile.js src/gen_data.js | head`. Imítalo.
5. Textos del escenario (por tandas, receta R4): ≈ 12 curiosidades, 8 charlas, oficios (8-12) y secretos.
6. Al terminar: en `G.SCENARIOS` pon `rooms: 9` (candidatas) y `ready: true`; `node test_themes.js`, `test_rooms.js`, `test_marco.js`, `test_fingerprint.js` y bot en 1000 semillas por nivel (0 atascos).
7. Si falla algo y no lo resuelves en 2 intentos: `ready: false` otra vez (el juego vuelve a como estaba) y marca el paso `BLOQUEADO`.

## R3 · Añadir/terminar una TEMÁTICA (4T-x)
1. Ficha: `docs/FICHAS_TEMATICAS.md` (la de la temática). Datos: `G.THEMES.<id>` en `src/gen_themes.js` (`ready`, `scenarios`, `mood`, `tones`, `letter`).
2. Imita Robo en todo (`grep -n "robo" src/*.js | head -30`): historias base, capítulos, epílogo, textos de presentación.
3. No actives `ready: true` hasta que pasen: `test_themes`, `test_marco`, `test_bible`, `test_gen_truth`, `test_validate`, `test_review`, bot en 1000/nivel, `test_mass`.
4. La pantalla «Crear caso» (F27) lista las temáticas con `G.themeReady(id)`; no hay que tocar el menú.

## R4 · Escribir un banco de texto POR TANDAS
Tandas de ≈ 25 líneas. Para cada tanda: (1) escribe en el banco, imitando el formato de las líneas vecinas; (2) `node tools/linter_textos.js` (existe desde F09); (3) la prueba del banco (`test_charla_datos`, `test_voice`, `test_textfit`…); (4) `git commit`. Reglas de estilo: español de España; humor negro suave con remate; concordancia de género (si hay hueco `{…}`, debe sonar bien con él y con ella); ≤ 220 caracteres por línea; sin nombres reales de famosos ni frases de obras con derechos; no repitas aperturas (mira las 10 líneas anteriores). Tras 4 tandas, `node tools/variedad.js`: la repetición de texto no debe subir.

## R5 · Cifra del generador con mínimo, máximo y pesos
Imita `herr2.levels` y `macabro.sit.counts` en `gen_data.js` (`grep -n "herr2\|counts" src/gen_data.js | head`). Forma: por nivel `{ min, max, weights }`. La lógica solo LEE el dato. Anota el rango en `docs/EQUILIBRIO_Y_COMPLETITUD.md`.

## R6 · Mutación (comprobar que una prueba vigila de verdad)
`const { mutador } = require('./tools/mutar.js')`; `mutador(archivo, desde, hacia)`: «desde» = texto (se ignora el formato) o regex anclada. Avisa si el patrón ya no encaja o si no cambia nada. Autoprueba: `node tools/mutar.js --prueba`. Si dice «el patrón ya no encaja», arregla el PATRÓN de la prueba; el código no tiene por qué estar mal.

## R7 · Regenerar códigos de prueba tras un cambio de receta
Los códigos del menú, de `docs/HOJA_APUNTES_PRUEBAS.md` y de `docs/MP_GUION.md` salen de semillas fijas. Búscalos: `grep -rn "G7-\|G6-" src docs | grep -v HISTORIAL | head`. Con el mismo generador, calcula el código de la misma semilla y nivel (la función que lo hace está en `src/compile.js`: `grep -n "G.caseCode\|caseCode" src/*.js | head`) y sustitúyelo. Anótalo en el cierre del paso.

## R8 · Definición de «hecho» de CUALQUIER paso
1. `node build.js && node test_build.js` → 14/14. 2. Las pruebas de la tarjeta, en verde, de una en una. 3. Si tocaste receta: 40 casos por nivel (calidad y minutos por nivel; 0 atascos; Oli/Lali 40-60 %). 4. Textos: linter en verde. 5. `git add -A && git commit`. 6. Tarjeta `[x] HECHO`, filas de CHECKLIST tachadas, checkpoint en SESION. 7. ZIP a `entregas/`.

## R9 · Problemas típicos de este proyecto
- «el patrón ya no encaja» → R6.
- Una prueba pasa «por memoria» aunque cambiaste código: `node tools/cierre.js --sin-memoria` (o `--fresco`). La memoria de verdes es `.cierre_verdes.json`.
- Prueba «SALTADA» (sin `ws`, sin Chromium): normal, no es fallo.
- Prueba larga que parece colgada: ejecútala con `tools/cierre.js` (corre en segundo plano y deja el log en `/tmp/cierre/`, o en `.tmp/cierre/` si no hay `/tmp`) y espera con `--espera=240`.
- Una prueba de calidad/duración «no llega a su mínimo»: no relajes el umbral; ajusta DATOS (R5) o el contenido y repite. Si no lo consigues en 2 intentos: `BLOQUEADO`.
- El caso 1 cambió (huella distinta en `case1`): lo rompiste; `git reset --hard` al commit anterior.
