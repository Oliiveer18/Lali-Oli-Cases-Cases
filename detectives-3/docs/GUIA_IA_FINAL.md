# GUÍA PARA LA IA FINAL · Lali & Oli Cases (léela entera una vez; ≈ 4 minutos)
Eres la IA que TERMINA el proyecto (en Cursor, modo Agente; tienes terminal, git y lectura/edición de ficheros). Hay un plan escrito paso a paso. Tu único trabajo: **hacer los pasos de `docs/PASOS_IA.md` en orden, uno tras otro, sin pedir permiso, y dejar todo guardado tras cada uno.** No inventes, no rediseñes, no decidas: las decisiones ya están en `docs/DECISIONES_FINALES.md`. Si algo no está escrito, haz lo más simple que cumpla el paso e imita lo que ya existe en el código.

## 0. MODO UNA SOLA PASADA (decisión del usuario, 29 oct: NO quiere reabrir el chat)
Trabaja como si no hubiera otra sesión después. Reglas:
1. **No pares, no preguntes, no pidas permiso, no resumas lo hecho a mitad.** Entre un paso y el siguiente solo escribes la línea de guardado (§4). El único mensaje largo es el informe final de F58.
2. **Ahorra contexto como si fuera dinero:** nunca imprimas logs enteros (`tail -15`), nunca releas lo ya leído, nunca abras `HISTORIAL_*`, no copies textos largos en tus respuestas, escribe en ficheros y no en el chat, y no repitas la guía: tras leerla, vuelve a ella solo si dudas.
3. **El proyecto debe estar SIEMPRE en un estado entregable:** tras cada paso, build y `test_build` verdes, ZIP actualizado en `entregas/` y `PASOS_IA.md` al día. Si el contexto se acaba en cualquier momento, lo último guardado es un juego coherente.
4. **Salto de emergencia:** si calculas que has usado ≈ 70 % de tu contexto y aún quedan pasos, haz YA el cierre «mínimo coherente»: F53 (calibración), F57 (auditoría, versión corta) y F58 (cierre y entrega con los BLOQUEADOS y los NO HECHOS listados con su ID en `PENDIENTE_DE_PERSONA.md`). Después, si aún te queda margen, vuelve a los pasos pendientes en orden y repite F58 al terminar.
5. **Prioridad si hay que elegir (de más a menos importante):** (a) receta y estabilidad: F01-F11; (b) variedad de casos: F12-F22; (c) escenarios y temáticas: F23-F36 (un escenario o temática completo vale más que dos a medias); (d) bancos de texto y vida: F37-F43; (e) IA compañera y calibración: F50-F53; (f) extras: F44-F49, F54-F56b.
6. **Nada a medias:** un escenario, temática o banco se termina o se deshace con la copia de seguridad; nunca dejes el generador con datos que el linter o el bot rechacen.
7. Al final entrega un único informe de ≤ 25 líneas: pasos hechos, bloqueados, no hechos, medición por nivel y qué le toca al usuario.

## 1. Arranque (cada vez que empiezas o te quedas sin contexto y vuelves)
1. Lee ESTE fichero y `docs/DECISIONES_FINALES.md` (si ya los conoces, solo la lista de reglas de oro de abajo).
2. Busca tu paso: `grep -n "ESTADO: \[ \]" docs/PASOS_IA.md | head -1` (la primera línea con `[ ]`). Si ves `EN CURSO`, es el que dejaste a medias: `grep -n "ESTADO: EN CURSO" docs/PASOS_IA.md`.
3. Lee SOLO esa tarjeta (con la herramienta de lectura con rango de líneas, o `sed -n`): `sed -n 'N,N+14p' docs/PASOS_IA.md` (N = la línea del `### Fxx`). NO leas `PASOS_IA.md` entero, ni `HISTORIAL_*`, ni `gen_data.js` (120 KB) ni `compile.js` (48 KB) enteros: usa `grep -n` y `sed -n` por rangos.
4. Lee lo que la tarjeta diga en «LEER». Nada más.

## 2. El bucle de CADA paso
1. Copia de seguridad con git: `git add -A && git commit -m "antes de Fxx"` (si no hay repositorio: `git init && git add -A && git commit -m "base"`, ya hay `.gitignore`). Esto es tu «deshacer».
2. Pon `ESTADO: EN CURSO` en la tarjeta.
3. Divide el paso en subpasos pequeños (datos → código → pruebas → medir → cierre). **Guarda tras cada subpaso** (ver §4 «Guardar»): el corte llega sin aviso.
4. Haz el trabajo (tarjeta, «HAZ»). Imita el estilo del código vecino.
5. Pruebas (tarjeta, «PRUEBAS») de una en una (ver §3). Lee solo `tail -15` del log.
6. Cierre del paso: `node build.js && node test_build.js` (debe dar 14/14) · si tocaste la receta: medir 40 casos por nivel (calidad y minutos de CADA nivel por separado; anota la muestra) · actualizar docs (§4) · `ESTADO: [x] HECHO (fecha, 1 línea)` · ZIP.
7. Pasa al siguiente paso. No pares, no preguntes.

**Si algo falla:** (a) lee el error, arregla lo más simple; (b) repite la prueba; (c) segundo fallo de la MISMA prueba → `git reset --hard` al commit «antes de Fxx» (deshacer el paso), pon `ESTADO: BLOQUEADO` + 3 líneas de causa y qué probaste, y SIGUE con el siguiente paso. Un paso bloqueado no frena el resto salvo que otro diga «depende de Fxx».

## 3. Cómo se ejecutan las pruebas (ya probado en este proyecto, en Linux)
- **Sistema:** si el sistema no es Linux/Mac y fallan rutas `/tmp`, usa `.tmp/` dentro del proyecto (ya está en `.gitignore`) y sustituye `setsid nohup … &` por la forma de tu terminal (`node x.js > .tmp/x.log 2>&1` y espera con un `Start-Sleep`/`sleep`). Prefiere SIEMPRE `node tools/cierre.js …` (maneja segundo plano y esperas por ti).
- Una prueba suelta (lo normal): `setsid nohup node test_xxx.js > /tmp/xxx.log 2>&1 &` y luego `sleep 60; tail -15 /tmp/xxx.log` (repite hasta ver «Todo en orden» o el fallo). `test_bot.js` y `test_quality.js` solo corren dentro de la suite.
- Cierre de bloque con el bot: `node tools/cierre.js bot --bg` y después `node tools/cierre.js --espera=240` (repite la espera hasta que acabe).
- Medir calidad y minutos de cada nivel contra la línea base: `node tools/cierre.js linea --bg` + `node tools/cierre.js --espera=240` (dice «IDÉNTICO» o qué cambió, con la nota de cada nivel).
- Duración con el bot, v7 en memoria: `GENV=7 node tools/duracion_niveles.js 40 7919 40` (N=40 casos por nivel).
- Suite completa (`npm test` por pasos) SOLO al cerrar bloque: `node tools/cierre.js suite --bg` y `--espera=285` repetido; si se corta, `node tools/cierre.js --seguir`. Recuerda lo que ya pasó con el mismo código (memoria de verdes).
- Pruebas de mutación: usa `tools/mutar.js`; si dice «el patrón ya no encaja», arregla el PATRÓN de la prueba, no el código.
- Si no hay Chromium las pruebas de navegador se saltan: está bien (decisión C6).
- NUNCA `pkill -f "node test.js"` (se mata a sí mismo): usa `kill <pid>`.

## 4. Guardar = (hazlo tras CADA subpaso, es lo que te salva si se corta)
1. En `docs/PASOS_IA.md`, bajo tu tarjeta, añade UNA línea `  · nota (fecha): lo hecho / lo que falta`.
2. En `docs/SESION.md`: un checkpoint nuevo ARRIBA (máx. 12 líneas): paso, qué hiciste, pruebas verdes, `GEN_VERSION`, qué sigue. Si SESION pasa de 45 KB: mueve los checkpoints viejos (más allá de 12) al principio de `docs/HISTORIAL_SESION.md`, dejando una línea de puntero. Nada se borra.
3. En `docs/CHECKLIST_MAESTRO.md`: cambia `[ ]` por `[x]` en la fila del paquete SOLO cuando el paso entero esté hecho.
4. ZIP: desde la carpeta que CONTIENE `detectives/`: `mkdir -p detectives/entregas && zip -qr detectives/entregas/lali_oli_cases_<paso>.zip detectives -x "detectives/node_modules/*" "detectives/entregas/*" "detectives/.git/*"` (si no hay `zip`, usa `tar -czf`). Además `git commit`. Nada de `present_files`: eso no existe en Cursor.
5. Tamaños máximos (KB): LEEME 4 · SESION 45 · CHECKLIST 40 · ROADMAP 70 · MAESTRO 70 · PASOS_IA 40. Compruébalos con `wc -c` al cerrar cada bloque; si pasan, rota a los `HISTORIAL_*`.

## 5. Reglas de oro (si dudas, gana la más arriba)
1. **No rompas lo que ya funciona.** El caso 1 (semilla 74937935) no se toca (Z0 crea uno nuevo aparte). Si una prueba que antes pasaba se pone roja, tu cambio la rompió.
2. `GEN_VERSION`: solo la subida 6→7 del paso F02. Después, jamás la toques (decisión B2). Cambió lo que genera una semilla → regenera los códigos de prueba del menú y anótalo.
3. **Cero atascos** (0 de 0 en cada medición) y **techo 45 min**. Rangos: Fácil 20-28 · Normal 28-36 · Difícil 36-45. Reparto Oli/Lali 40-60 %. Calidad por nivel: informa SIEMPRE los tres niveles por separado.
4. Ninguna herramienta abusiva: la lupa no sube; ganzúa, UV y grabadora no bajan. Mínimo: en TODOS los casos hay una charla grabada con pista.
5. Textos en español de España, humor negro suave con remate, concordancia de género (la prueba y el linter lo vigilan), sin copiar frases de obras con derechos, sin nombres reales de famosos. Cada texto nuevo pasa por `tools/` linter de 4V-2 cuando exista.
6. Las cifras del generador van en DATOS (`gen_data.js` o `src/data/…` tras 4W-0) con mínimo, máximo y pesos; no en lógica.
7. Un paso toca solo lo suyo. No «aproveches» para limpiar otras cosas.
8. Guarda ANTES de empezar la parte pesada y después de cada subpaso (§4).
9. Si te quedas sin contexto: lo que está en `PASOS_IA.md` (ESTADO + notas) y `SESION.md` es tu memoria. En el chat nuevo empiezas por §1.
10. Lo que necesita a una persona (jugar, iPhone real, elegir) va a `docs/PENDIENTE_DE_PERSONA.md` y NO te bloquea.

## 6. Mapa de documentos (solo por si una tarjeta los nombra)
`docs/RECETAS.md` (cómo se hacen las tareas repetitivas: R1 prueba nueva · R2 escenario · R3 temática · R4 bancos de texto · R5 cifras · R6 mutación · R7 códigos · R8 «hecho» · R9 problemas típicos) · `docs/PROMPT_CURSOR.md` y `docs/CURSOR_PUESTA_EN_MARCHA.md` (para el usuario).
`docs/ROADMAP.md` (§3 decisiones, §4.3 tabla de paquetes) · `docs/CHECKLIST_MAESTRO.md` · `docs/SESION.md` (reglas 1-14 de trabajo) · `docs/METODO_DE_TRABAJO.md` · `docs/FORMATO_DE_CASO.md` y `src/schema.js` (formato de caso) · `docs/BIBLIA_DEL_CASO.md` (contrato del generador) · `docs/ESCENARIOS.md` · `docs/FICHAS_TEMATICAS.md` · `docs/VARIEDAD.md` · `docs/EQUILIBRIO_Y_COMPLETITUD.md` · `docs/CASO_LIBRE_Y_ACUSACION.md` · `docs/DISENO_PUZLES_CL5C.md` · `docs/MUESTRA_AMBIENTES.md`.
