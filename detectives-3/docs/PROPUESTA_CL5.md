# CL-5 · Diagnóstico de duración por contenido (LOW, solo medir; `src/` y `GEN_VERSION` SIN CAMBIOS)
Estado: **DIAGNÓSTICO COMPLETO (cp. 208-210) y propuesta APROBADA POR EL USUARIO con una corrección (§7: charlas a 3, no a 4)**. El ajuste real (MEDIUM) NO está hecho: ver §7 y el CHECKLIST (CL-5a/CL-5b).
Herramientas: `GENV=7 node tools/palancas_duracion.js 60` (medidor) · `GENV=7 node tools/acusacion_temprana.js 15` · NUEVA `GENV=7 node tools/palancas_cl5.js [N] [exp ...]` (bot, partida completa, minutos humanos = bot × 1,7; cambia datos solo en memoria). `palancas_duracion.js` ahora lee `GENV` (una línea).

## 1. Cifras de partida (reproducidas)
Partida completa, mediana (N=15): Fácil 24,6 · Normal 27,5 · Difícil 31,6. Acusación temprana: 1,3 · 3,1 · 4,1. Ganan 15/15. Con N=40 (`palancas_cl5`): 24,6 · 28,3 · 31,9; 0 atascos; máximos 26,6 · 31,6 · 34,5.
**Rangos (aclarado el 25 oct):** los del ROADMAP §3 (Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45) valen, pero son PROVISIONALES («números que hemos puesto por ahora, no es nada oficial»); las bandas antiguas de v5 se han borrado de los documentos. Con estos, Normal ya entra (28,3) y solo Difícil queda corto (≈ 4 min bajo el mínimo, 8 bajo la mediana).

## 2. Hallazgo clave
El compilador rellena con curiosidades hasta `levels[L].targetMin` (23,5 · 27 · 30 por el medidor). Añadir contenido base (salas, engaños, pasos) **no sube la duración mientras el relleno tenga hueco**: sustituye curiosidades (p. ej. engaños +1 en Fácil: pasos 13,9→15,3, curiosidades 18,4→16,3, minutos 24,6→25,2). La duración la fija `targetMin`; las demás palancas solo suman por encima del tope del relleno (banco de 32 curiosidades, máx. 9 por sala).
Segundo hallazgo: el comentario de `compile.js` («las charlas de detalle no cuentan: el bot no las pregunta») **es falso**: el bot sí las pregunta (caso de prueba, Difícil: 0 charlas 30,7 min · 14 charlas 32,7 · 28 charlas 34,7; banco de 28 charlas ⇒ máx. 2 por personaje con ≈ 7 personajes).

## 3. Minutos por palanca (mediana, N=40 por nivel, mismas semillas)
Todas medidas con el relleno saturado (`curios`) para ver lo que suman de verdad; Δ respecto a «curios».
| Palanca (cambio en memoria) | Fácil | Normal | Difícil |
|---|---|---|---|
| Base v7 (hoy) | 24,6 | 28,3 | 31,9 |
| `targetMin` al máximo (curiosidades 32, tope del banco) | +4,8 | +2,9 | +3,6 |
| Charlas de relleno `maxChatPerNpc` 2→4 (hoy tope del banco con 2) | +2,0 | +1,9 | +2,1 |
| Engaños +1 (`DECOY_RANGE`) | +1,4 | +1,3 | +0,5 (ya 2-3) |
| Sospechosos +1 | +0,7 | +2,0 | **error: 7 sospechosos no cabe** (40/40 semillas fallan) |
| Sala +1 (`extraPlacesV7`) | +0,9 | +1,3 pero **1 caso atascado/216-262 min** | 0 (ya 6 salas = tope del banco) |
| Más pistas con herramienta (+1 por tipo y +1 libre) | 0 | +0,8 | +0,2 |
| Sigilo y empujar siempre (`pushChance`/`watchChanceV6` = 1) | +0,1 | +0,3 | +0,3 |
Suma con curiosidades al máximo y charlas a 4: Fácil 31,4 · Normal 33,1 · Difícil 37,6 (máx. 35,9 · 38,7 · 41,3; 0 casos > 45; 0 atascos). Coste unitario: curiosidad ≈ 0,32 min · charla ≈ 0,14 min · sala ≈ 0,56 min.
Calidad (nota mín/media/máx, cada nivel, base → con curiosidades y charlas): Fácil 75/82,7/88 → 72/76,9/82 · Normal 73/79,9/86 → 73/78,1/83 · Difícil 72/77,1/80 → 71/76,3/80 (todos aceptados 40/40).

## 4. Lectura
Con solo datos (sin contenido nuevo) Difícil llega a ≈ 38 min (curiosidades al máximo + charlas a 4 + 3 engaños + herramientas + sigilo: N=100, mediana 38,1, 32,9–43,8). Para su mediana de 40 hace falta contenido nuevo: un banco de curiosidades mayor (+16 curiosidades). Con +12 sin ajustar el objetivo, 11 de 99 casos pasaban de 45 (saturando el banco el reparto se ensancha); con el objetivo calibrado (el relleno se detiene por caso) el reparto es más estrecho. Salas (tope 6 del banco) y sospechosos (7 no cabe en Difícil) ya están en su tope; la 6.ª sala de Normal dio un caso atascado.

## 5. PROPUESTA (solo Normal y Difícil; Fácil no cambia). Cada cifra con rango y pesos (regla R1)
| Cifra del generador (dato en `gen_data.js`/`bible.js`) | Hoy | Propuesta (rango · pesos) |
|---|---|---|
| **Normal** · engaños `DECOY_RANGE.normal` | [1,2] (50 % / 50 %) | **[2,3]** · 2 → 50 % · 3 → 50 % (el reparto de hoy, solo sube el rango) |
| **Normal** · objetivo del relleno `levels.normal.targetMin` | 27 | **31** · rango [31,31] · peso 100 |
| **Difícil** · engaños `DECOY_RANGE.dificil` | [2,3] (40 % / 60 %) | **[3,3]** · 3 → 100 % |
| **Difícil** · charlas de relleno `extra.maxChatPerNpc` (tope por personaje; solo en Difícil, requiere dato por nivel) | 2 | **4** · rango [4,4] · peso 100 (el banco de 28 charlas llega a ≈ 3,6 por personaje) |
| **Difícil** · banco de curiosidades `extra.curios` | 32 | **48** (+16 curiosidades NUEVAS, contenido: texto + sprite 1×1; máx. 9 por sala, 6 salas = 54 huecos) |
| **Difícil** · objetivo del relleno `levels.dificil.targetMin` | 30 | **35,5** · rango [35,36] · peso 100 (medido 35 / 35,5 / 36) |
Descartado: más pistas con herramienta (+0,2/+0,8 min, y 1 de 100 semillas dio error de generación en Difícil), sigilo/empujar siempre (+0,1-0,3), sala +1 (tope; Normal con 6 salas atascó un caso), sospechosos +1 (Difícil no cabe; Normal +2,0 pero aleja del reparto 5-6 del ROADMAP).
**Efecto medido (N=300 por nivel, mismas semillas, minutos humanos, partida completa; mín · mediana · p90 · máx):**
| Nivel | Hoy | Propuesta | Casos > 45 | Atascos/derrotas |
|---|---|---|---|---|
| Fácil (sin cambios) | 21,6 · 24,5 · 25,9 · 27,8 | igual | 0 | 0 |
| Normal | 24,9 · 28,5 · 30,1 · 33,6 | **26,4 · 32,4 · 34,3 · 36,7** (+3,9) | 0 | 0 |
| Difícil (hoy N=100) | 28,8 · 32,1 · 33,8 · 35,2 | **35,5 · 39,8 · 41,8 · 44,4** (+7,7) | 0 | 0 |
Margen con el techo (Difícil): objetivo 35 → máx. 44,0 (mediana 39,3) · **35,5 → 44,4 (39,8)** · 36 → 44,9 (40,3) · 36,5 → 45,9 y 2 casos > 45 (mediana 40,8). Se propone 35,5 por tener 0,6 min de margen; con 36 queda 0,1.
Nota: la banda de Difícil «36-45» deja ≈ 2 % de casos bajo 36; Normal «28-36» deja una parte de los casos bajo 28 (mín. 26,4) y la cola alta toca 36,7.
**Calidad de CADA nivel (nota mín/media/máx; aceptados; N=300):** Fácil 74/82,7/90 · 300/300 (sin cambios) · Normal hoy 70/80,4/86 → propuesta **73/79,6/86** · 300/300 · Difícil hoy (N=100) 69/77,0/81 → propuesta **63/72,2/80** · 300/300. La caída de Difícil viene de `quality.js`, que aún penaliza pasarse de la banda antigua (24-36, escala `today`); la corrige TIEMPOS-2 (3/4-d: la franja sale de los rangos nuevos y el techo baja a 45). La media de Difícil ya estaba bajo la meta 80 antes de este cambio.
**Acusación temprana:** cifra de hoy 1,3 · 3,1 · 4,1 min (Fácil · Normal · Difícil); NO remedida con la propuesta (los engaños nuevos pueden moverla algo). Se remide en el ajuste real.
Caveat de la medición: el +16 de curiosidades se midió con curiosidades CLONADAS del banco (solo cuenta el tiempo); los textos reales pueden cambiar un poco los segundos por curiosidad.

## 6. Decisiones que necesita el usuario
1. ~~Rangos~~ **RESUELTO (25 oct):** valen los del ROADMAP §3, como cifras provisionales. Con ellos la propuesta deja Normal en 32,4 y Difícil en 39,8 (dentro).
2. ¿Apruebas los 3 cambios de datos (engaños Normal, engaños Difícil, objetivos de relleno) y las charlas por nivel (tope 4 en Difícil)?
3. ¿Apruebas crear 16 curiosidades nuevas (contenido) para Difícil? Sin ellas Difícil queda en ≈ 38.
4. El ajuste real es MEDIUM, detrás de `GEN_VERSION >= 7` (no sube versión; v6 y caso 1 idénticos); incluye remedir la acusación temprana y esperar a TIEMPOS-2 para la nota.

## 7. DECISIONES DEL USUARIO (25 oct, cp. 210) — manda esta sección sobre §5-6
- «Ahora mismo vamos bien con los tiempos»: sin prisa; el ajuste real se hace con calma y solo mientras los tiempos no estén muy descontrolados.
- **Charlas de relleno en Difícil: tope 3 por personaje (NO 4).** Rango [3,3], peso 100. Con 3 el banco actual (28 charlas; ≈ 7,7 personajes × 3 = 23) llega sin ampliarlo: no hacen falta charlas nuevas.
- **Engaños:** Normal [2,3] (50 % / 50 %) · Difícil [3,3] (100 %), como en §5 (3 es el máximo del generador: `G.maxDecoys`).
- **Objetivos del relleno** (§5): Normal 31 · Difícil se recalcula por el cambio de charlas (abajo).
- **Contenido nuevo (aprobado el enfoque, no los textos):** menos curiosidades (**+8**, banco 32→40, no +16) y diversificar con otros tipos de paso: **1-2 pasos tipo puzle** (código o línea de tiempo; el bot los cuenta 25-30 s, ≈ 0,7-0,85 min humanos cada uno; NO medido en el generador). Charlas nuevas: solo si hicieran falta (con tope 3 no).
- **Medición nueva (Difícil, engaños 3 + charlas 3, N=200, mismas semillas, 0 casos > 45, 0 atascos, aceptados 200/200):**
| Banco de curiosidades · objetivo | Mediana | Mín–máx | p90 | Curiosidades usadas | Calidad mín/media/máx |
|---|---|---|---|---|---|
| +8 (40) · 36 | 38,8 | 34,2–43,8 | 41,1 | 37,4 | 65/72,5/79 |
| +16 (48) · 36 | 39,3 | 35,5–42,7 | 41,3 | 39,3 | 63/71,5/79 |
| +16 (48) · 36,5 | **39,8** | 35,8–43,4 | 41,8 | 40,7 | 63/70,8/78 |
  Con 3 charlas el techo queda a ≥ 1,6 min (mejor que con 4: 0,6). Con +8 curiosidades el banco casi se llena (37,4 de 40) y Difícil queda en ≈ 38,8: dentro del rango oficial 36-45 pero ≈ 1 min bajo la mediana 40; ese minuto lo ponen los pasos tipo puzle (por medir) o, si no basta, otras +8 curiosidades.
- **Plan del ajuste real (MEDIUM, detrás de `GEN_VERSION >= 7`):** CL-5a = solo datos (engaños, objetivos, charlas a 3) + remedir los 3 niveles y la acusación temprana; CL-5b = 8 curiosidades nuevas + prueba de 1-2 pasos puzle (medir antes de decidir si hacen falta otras 8 curiosidades). Nota de Difícil baja por la banda antigua de `quality.js` hasta TIEMPOS-2.
- **Rangos (25 oct):** valen los del ROADMAP §3 (20-28 · 28-36 · 36-45, techo 45) como cifras PROVISIONALES, no oficiales; las bandas antiguas se borran de los documentos.

## 8. AJUSTE REAL CL-5a HECHO (25 oct, cp. 212; MEDIUM, solo datos, detrás de `GEN_VERSION >= 7`; v6 y caso 1 idénticos)
Datos: `G.DECOY_RANGE_V7` (Normal [2,3] 50/50 · Difícil [3,3]) · `targetMinV7` (Normal 31 · Difícil 36) · `maxChatPerNpcV7` (Difícil 3). Medido con `GENV=7 node tools/palancas_cl5.js 100 base` (N=100 por nivel, partida completa, minutos humanos; mín–máx · mediana · p90; 0 casos > 45, 0 atascos, aceptados 100/100):
| Nivel | Minutos | Calidad mín/media/máx |
|---|---|---|
| Fácil | 22,3–27,5 · **24,7** · 25,8 | 74/82,8/88 |
| Normal | 27,9–36,7 · **32,5** · 34,3 | 73/79,1/86 |
| Difícil | 31,6–41,9 · **37,1** · 39,8 | 70/76,1/80 |
Acusación temprana (`acusacion_temprana.js 15`, GENV=7): Fácil 1,3 · Normal 3,4 (1,4–8,7) · Difícil 3,9 (1,7–9,4); partida completa 24,6 · 31,6 · 36,6; ganan 15/15 en los tres.
Difícil: el banco de 32 curiosidades se llena (31,9 usadas), así que 36 y 36,5 dan lo mismo; el objetivo solo actúa cuando CL-5b suba el banco a 40 (medido antes: 38,8). Normal máx. 36,7 roza el techo provisional 36 (aceptable, rangos no oficiales). Nota de calidad baja algo por la banda antigua de `quality.js` (TIEMPOS-2). Prueba nueva: `test_cl5a.js` (con mutación). Siguiente: CL-5b.

## 9. CL-5b HECHO (25 oct, cp. 213; MEDIUM, detrás de `GEN_VERSION >= 7`; v6, Fácil y Normal idénticos)
**+8 curiosidades** (`extra.curiosV7`, banco 32 → 40, SOLO Difícil v7; el sorteo de Fácil/Normal no cambia). **Objetivo de Difícil 35,5** (`targetMinV7`): con el banco de 40, objetivo 36 daba máx. 44,4 (margen 0,6). Medido (partida completa, minutos humanos; mín–máx · mediana · p90; 0 atascos): 34 → 34–42,1 · 37,3 · 39,8 · 35 → 34,4–43,1 · 38,2 · 40,9 · **35,5 → 32,7–44,0 · 38,7 · 40,7 (N=300; 300/300 aceptados; calidad 67/74/81)** · 36 → 34,4–44,4 · 39,0 · 41,8 (N=100).
**Pasos tipo puzle (solo medida, `tools/puzle_cl5b.js`, N=100 Difícil; mediana):** base 38,4 · +1 código 39,1 (+0,7) · +1 línea de tiempo 39,2 (+0,8) · +2 (código + línea) 39,9 (+1,5; máx. 44,6) · +2 códigos 39,8 (+1,4). Calidad ≈ −1 punto por puzle. Conclusión: no hacen falta otras +8 curiosidades; 1 puzle encaja (≈ 39,4); 2 exigirían bajar el objetivo ≈ 1 min. Integrarlos exige un diseño justo (código/sucesos deducibles con pistas del caso): pendiente de decisión del usuario.

## 10. DECISIÓN DEL USUARIO (25 oct, cp. 214): LOS PUZLES SE INTRODUCEN, 1 O 2 POR CASO EN DIFÍCIL (SOLO DOCUMENTACIÓN; paquete CL-5c)
**Decidido:** los pasos tipo puzle (§9) entran en el generador de forma profesional. En Difícil cada caso lleva **1 o 2 según el caso**, **media 1,5** (propuesta del usuario; Claude la considera adecuada). Regla R1 (rango y pesos): **[1,2] · 1 → 50 % · 2 → 50 %**. Normal y Fácil no cambian por ahora.
**Efecto esperado (medido en §9, partida completa, minutos humanos):** +0,7 (código) / +0,8 (línea de tiempo) por puzle ⇒ media **+1,1 min** sobre la base (Difícil 38,7 → ≈ 39,8). Con 2 puzles el máximo medido fue 44,6 (margen 0,4), por eso **el objetivo del relleno (`targetMinV7`, hoy 35,5) se recalcula al integrar** (≈ −1 min, ≈ 34,5; se mide, no se supone). Calidad ≈ −1 punto por puzle (65/74/80 → 63/72/78 con 2); la banda antigua de `quality.js` la corrige TIEMPOS-2.
**Diseño propuesto (se confirma al empezar CL-5c; detalle en el CHECKLIST):**
1. **Justicia:** la solución se deduce SOLO con pistas ya obtenibles del caso. Código = una hora (HHMM) o cifra que aparece en una pista real del caso; línea de tiempo = 3-4 sucesos de `truth.timeline`, cada uno enlazado a una pista (`ev.clue`). Ningún puzle puede cerrar el paso a una pista imprescindible (sin dependencia circular): el premio es opcional (curiosidad con remate, monedas o pista extra no necesaria).
2. **Azar propio** (semilla ^ constante nueva, DESPUÉS de todo lo demás): no mueve los casos que ya existen; con `GEN_VERSION >= 7` y nivel Difícil; v6, Fácil y Normal idénticos.
3. **Variedad:** con 1 puzle, código o línea de tiempo (50/50); con 2, uno de cada tipo; textos y títulos de banco propio (no repetir dentro del caso ni en una ventana de casos).
4. **Todo el sistema los conoce:** esquema y validador (ya aceptan `mini`), revisor de equidad, bot (25 s código · 30 s línea) y compañero IA, medidor (cuenta el tiempo del minijuego para que el relleno compense), huella/variedad, EQ y pantalla (la interfaz de minijuegos ya existe del caso 1; comprobar online).
5. **Pruebas:** nueva prueba con mutación (el puzle sin solución deducible se detecta), 0 casos > 45 y 0 atascos con N ≥ 300 por la nueva receta, calidad y minutos de CADA nivel por separado (regla 7).
**CL-5c-a (cp. 215):** diseño de datos y justicia en `docs/DISENO_PUZLES_CL5C.md` (los puzles llevan pistas de ambiente propias con hora real; medido en `tools/diseno_puzles_cl5c.js`).
