# CIERRE DE 4C-4c-1 · textos listos para pegar — **HISTÓRICO: YA APLICADOS en v0.7.35**
> **Nota (v0.7.36):** este fichero se conserva solo como registro. Lo que dice de 4C-4c-2 como «pendiente» o «siguiente» quedó superado: **4C-4c-2 está HECHA (v0.7.36)** y **`GEN_VERSION` SE QUEDA EN 5** (la propuesta 5 → 6 quedó DESCARTADA). El estado vigente está en `DOCUMENTO_MAESTRO.md` §0 y `ESTADO_FASE3.md`.
Los usa la tarea única de la próxima sesión (ver `DOCUMENTO_MAESTRO.md` §0.0). Antes de pegar cada texto, comprobar que sigue siendo cierto (p. ej. que la suite salió en verde y los números del baseline). Los huecos «⟦…⟧» se rellenan con lo medido.

## A. `docs/BIBLIA_DEL_CASO.md` · añadir al final, tras «Cambios de 4C-4b»
## Cambios de 4C-4c-1 (v0.7.35) · SUBE `GEN_VERSION` de 4 a 5 (códigos `G5-…`)
- **Campos opcionales nuevos de la biblia:** `mood` (uno de `G.MOODS`: `claro`, `inquietante`, `macabro`) y `matiz` (lista de ids de pista). Una biblia sin `mood` (hecha a mano, `genClues` sin opciones) NO lleva matiz.
- **Regla nueva `matiz`** (16 reglas en `G.BIBLE_CODES`): el nº de matices es `G.MATIZ_COUNT[mood]` (claro 0 · inquietante 2 · macabro 3; 0 si no hay `mood`); cada id existe, es una pista de OBJETO (`source.type === 'prop'`) de rol `prueba`, `falsa` o `refuta`, y no se repite. Nunca `descarte` ni testimonios.
- **Qué hace el matiz:** al `text` de esas pistas se le pega al final `' ' + susto + ' ' + remate` (un par distinto por pista dentro del caso, del banco `GEN_DATA.clueTpl.matiz[ambiente][tipo]`, tipos `fisica` · `documento` · `grabacion`, 48 pares). Puntos (`points`), fuentes, roles y derivaciones son idénticos en los tres ambientes: el caso sigue siendo igual de justo y resoluble.
- **Orden de decisiones:** `generateCase` decide el ambiente ANTES de las pistas (`opts.mood` o `G.pickMood(s)`) y se lo pasa a `genClues(bible, { mood })`, que lo guarda en `bible.mood`; `compileBible` usa `opts.mood`, si no `bible.mood`, si no `G.pickMood(b.seed)`. Azar propio del matiz: `seed ^ 0x4c4c1` (no mueve el resto). `G.MOODS` y `G.MATIZ_COUNT` viven en `bible.js`; `G.MOOD_WEIGHTS` y `G.pickMood`, en `compile.js`.

## B. `docs/ESTADO_FASE3.md` · sustituir la PRIMERA viñeta («PRÓXIMO PASO…») y añadir una nueva viñeta «AHORA»
- **PRÓXIMO PASO: 4C-4c-2 (situaciones macabras del escenario con remate + giro macabro opcional del testigo; toca `genClues`/testimonios; propuesta entonces `GEN_VERSION` 5 → 6, DESCARTADA después: se quedó en 5; medium), SOLO con consentimiento explícito del usuario. NORMA: ZIP completo con cada cambio mínimo razonable y al cerrar cada subfase; después PARAR. Mensaje de arranque en `PROMPTS_FASE4.md`.**
- **AHORA (v0.7.35): 4C-4c-1 (atmósfera III, parte 1: pistas con matiz) HECHA** (`GEN_VERSION` 5): `mood`/`matiz` en la biblia, regla `matiz`, 48 pares [susto, remate] en `clueTpl.matiz`, post-proceso en `gen_clues.js` (azar `seed ^ 0x4c4c1`): solo cambian TEXTOS de 2 (inquietante) o 3 (macabro) pistas de objeto; hechos idénticos. Pruebas arregladas: `test_mood.js` (los HECHOS ignoran el matiz y las listas vacías), `test_police.js` (usos de 4C-4b) y `test_atmos.js` (comprueba que el baseline está recalculado). `BASELINE.json` recalculado (v0.7.35, `genVersion` 5): ⟦números⟧. Caso 1 intacto (74937935). Pendiente del usuario: leer `docs/MUESTRA_AMBIENTES.md` (ahora con matiz).
(Dejar el resto del fichero, máx. 15 líneas útiles: condensar las viñetas más antiguas si hace falta.)

## C. `docs/ROADMAP.md`
- «PRÓXIMO PASO» (sección 1): 4C-4c-2 (situaciones macabras y giro; medium; entonces se pensaba en `GEN_VERSION` 6, descartado) solo con permiso explícito. **4C-4c-1 HECHA (v0.7.35): pistas con matiz inquietante.**
- «Versión»: v0.7.35 (4C-4c-1 hecha, `GEN_VERSION` 5). Siguiente entrega entonces: 4C-4c-2 (ya hecha en v0.7.36).
- Tabla fila 14: partir en dos filas → `14a | **4C-4c-1** Atmósfera III (1) | Pistas con matiz inquietante (2 en inquietante, 3 en macabro; solo texto; sube `GEN_VERSION` a 5) | medium | ✅ v0.7.35` y `14b | **4C-4c-2** Atmósfera III (2) | Situaciones macabras del escenario con remate y giro macabro opcional del testigo | medium | ✅ v0.7.36 (antes pendiente)`.
- Historial (sección 5): `- **v0.7.35** 4C-4c-1: pistas con matiz inquietante (`bible.mood`, `bible.matiz`, regla `matiz`, 48 pares en `clueTpl.matiz`, azar `seed ^ 0x4c4c1`); `GEN_VERSION` 4 → 5; pruebas de 4C-4a/4b/3a ajustadas; baseline recalculado.`

## D. `docs/PLAN_FABRICA_DE_CASOS.md` · en el bloque «4C-4c» (línea ~148) marcar «4C-4c-1 HECHA en v0.7.35 (ver DOCUMENTO_MAESTRO)» y dejar «4C-4c-2 (entonces pendiente; HECHA en v0.7.36)». Actualizar la cabecera «actualizado en v0.7.35».

## E. `LEEME.txt` · línea 1 «… · v0.7.35» y añadir al final
4C-4c-1 HECHA (v0.7.35): pistas con matiz inquietante en los ambientes inquietante (2) y macabro (3); GEN_VERSION 5 (codigos G5-...). PROXIMO PASO: 4C-4c-2 (situaciones macabras y giro del testigo, medium) solo con permiso explicito [HECHA despues en v0.7.36]. NORMA: ZIP completo con cada cambio minimo razonable y al cerrar cada subfase, y PARAR.

## F. `docs/DOCUMENTO_MAESTRO.md` (tras cerrar)
- Cabecera (línea 2) y §0: «Versión publicada: v0.7.35 (4C-4c-1 hecha)»; borrar «NO es una versión cerrada»; quitar la sección 0.2b «EN CURSO» y sustituirla por «0.2 Última subfase cerrada: 4C-4c-1» (resumen corto de lo de A + pruebas arregladas + baseline); borrar este bloque §0.0 y poner en su lugar «Siguiente: 4C-4c-2 (solo con permiso)» [ya superado: 4C-4c-2 HECHA en v0.7.36].
- Tabla §0.1: añadir fila `| 4C-4c-1 | Pistas con matiz inquietante (2/3 pistas de objeto con susto + remate; solo texto; `GEN_VERSION` 5) | v0.7.35 |`.
- §10 (historial): sustituir la entrada «v0.7.35 (NO CERRADA…)» por «v0.7.35: **4C-4c-1 HECHA** …» (A + pruebas arregladas + baseline + muestra regenerada + suite en verde).

## G. `docs/PROMPTS_FASE4.md` · añadir al final
## Mensaje 4C-4c-2 · Atmósfera III, parte 2: situaciones macabras y giro del testigo (Sonnet 5.5 MEDIUM) — 4C-4c-1 HECHA en v0.7.35
Lee `docs/ESTADO_FASE3.md` y el apartado «4C-4c-2» del DOCUMENTO_MAESTRO (§0). Tarea: (1) **situaciones macabras del escenario** (con remate; no cambian los hechos: p. ej. un congelador con candado que resulta lleno de tartas de prueba): objetos o decorados de sala con texto, elegidos por un azar propio; (2) **giro macabro opcional** de un testigo (insiste en que vio a alguien que ya no estaba) sin tocar puntos, fuentes ni derivaciones. `GEN_VERSION` NO subió a 6 (decidido: sigue en 5). Regla de oro: todo momento macabro lleva remate, nada gráfico, y `checkBible`, revisor y `test_logic.js` en verde en 5000 semillas; caso 1 intacto (74937935). Norma: ZIP completo con cada cambio mínimo razonable, 1-2 checkpoints antes del final, suite completa UNA vez al cerrar, y PARAR.
