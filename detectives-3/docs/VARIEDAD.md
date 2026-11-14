# VARIEDAD Y PROFESIONALIDAD · Lali & Oli Cases
Documento nuevo (19 oct, 5.ª tanda; **solo diseño, nada implementado**; todos los números marcados BORRADOR los confirma el usuario al abrir el paquete). Complementa `ESCENARIOS.md`, `FICHAS_TEMATICAS.md`, `ROADMAP.md` (§4.3: 4V-1, 4F-0c, 4F-0d, 4V-2) y `DOCUMENTO_MAESTRO.md` (§0.3b, regla R-11, y §0.3f).

> **ACTUALIZACIÓN 24 oct (cp. 171, solo diseño):** el usuario pide que el aleatorio nunca dé sensación de repetir. Se añaden: memoria básica de «no repetir» con 4E-1/4E-2 (completa en 5C), aleatorio que pesa lo menos reciente, historial de los dos jugadores en online, prueba de «sensación de repetición» (20 casos seguidos por nivel, con topes entre casos consecutivos), repetir un caso a propósito con su código, y el paquete nuevo 4P (personajes y aspectos por capas). Ver ROADMAP §3 («Variedad «infinita»…») y DOCUMENTO_MAESTRO §0.3j.

## 1. La meta, en una frase
**Cada caso se siente distinto del anterior y con el mismo nivel profesional, siempre.** Son dos promesas diferentes y se vigilan por separado:
- **Variedad percibida.** Al empezar el caso N+1 el jugador no reconoce los mismos ingredientes. Tener muchas combinaciones teóricas **no basta**: lo que cuenta es lo que el jugador nota.
- **Suelo de profesionalidad.** Ningún caso baja de un mínimo de calidad, ni por mala suerte del azar. No se mide solo la media: se mide el peor caso.
Hay que hacer las dos cosas **a la vez** y **poco a poco**: primero medir, después añadir ejes de variedad, después llenar de contenido.

## 2. Qué nota el jugador (los 4 niveles de ingredientes)
| Nivel | Cuándo se nota | Ingredientes | Regla |
|---|---|---|---|
| **A · Al instante** | Al entrar en el caso | Temática, escenario, aspecto del sitio (paleta, espejo), ambiente, tono, hora y clima, cómo empieza el caso, personajes principales | **Entre casos consecutivos deben cambiar** (la memoria de 5C lo vigila) |
| **B · En la primera media hora** | Al investigar | Historia base, culpable, método, móvil, mecánicas, giro, forma del caso, objeto estrella y gag | **Entre casos consecutivos deben cambiar** |
| **C · Al jugar varios casos** | Al repetir | Frases, charlas, curiosidades, nombres, chistes, estructuras de frase, muletillas | **No se repiten en una ventana de 10 casos** (BORRADOR) |
| **D · No se nota** | Nunca | Semilla, orden interno, pesos | Libre |
Los niveles A y B hacen que «parezca otro juego»; el nivel C es el que delata a un generador cuando se juega mucho. Hasta ahora el proyecto se ha centrado en B; este documento añade A y C.

## 3. Ejes de variedad: los que hay y los nuevos (lo que NO es «más historias y textos»)
**Ya hechos:** escenario (panadería), 16 variantes de sala, ambiente (3), tono (6), 36 aspectos de personaje, 28 combinaciones de mecánicas, 0-3 engañosos, calle con curiosos, aliado de policía (~70 %). **En plan:** temática (5 antes del HITO), escenarios (9), 4-6 salas, historias base, señuelos, giro, objeto estrella.
**Ejes nuevos propuestos** (cambian cómo se SIENTE un caso sin escribir cientos de textos; **a aprobar**):
| # | Eje nuevo | Qué es | Coste | Paquete |
|---|---|---|---|---|
| E1 | **Hora y clima** | Amanecer, día, atardecer o noche; despejado, lluvia, niebla o viento. Cambia luz, sonido, un par de textos y el humor del caso. Va ligado al ambiente (no se mezcla noche macabra con día soleado sin motivo) | Bajo-medio (usa la capa visual de 4C-4b) | 4F-0c |
| E2 | **Espejo y paleta de sala** | Cada plantilla de sala puede salir **espejada** y con **una de 3 paletas** (suelo y paredes). Multiplica las variantes **sin arte nuevo** | Bajo; riesgo: puertas, objetos y huecos especiales (se comprueba con el A* real). Se prueba primero en la panadería y en el piloto del museo | 4F-0c |
| E3 | **Forma del caso** | Arquetipos de estructura que cambian el ritmo y el orden de las pistas. Propuesta inicial de 4: **clásico** (sala a sala), **dos frentes** (dos líneas de pista que se cruzan), **cascada** (cada pista abre la siguiente), **de interrogatorio** (más charla, menos registro). Nunca por reloj (R-6) | Medio (toca `genClues` y `compile.js`) | 4F-0d |
| E4 | **Identidad compuesta de personaje** | Aspecto (36) × oficio del escenario × manía × muletilla × relación con la víctima. Aunque el aspecto se repita, el personaje se siente otro | Medio (datos y texto) | 4F-0d |
| E5 | **Arranque del caso** | Distintos «ganchos»: llega la clienta, suena el teléfono, la policía pide ayuda, alguien encuentra algo. Es lo primero que se ve (nivel A) | Medio-bajo (textos y escena) | 4F-0d |
Ya planificados en otros paquetes y que cuentan como ejes: epílogo (4G-4), eventos de ambiente (4G-3), objeto estrella (4G-1). **Aplazado:** esquemas de misterio nuevos (5A, tras el HITO; E3 prepara el terreno).
**Todos estos ejes cambian la receta del generador**, por eso entran **antes de cerrar 4F** (`GEN_VERSION` ya estará en 6; hasta el HITO no hay códigos guardados). Después del HITO, cada eje nuevo sube la versión.

## 4. Reglas de variedad (V-1 … V-8)
- **V-1 Ejes independientes.** Cada eje se elige con su propio azar (`seed ^ constante`) y no depende de otro salvo por reglas explícitas de coherencia (p. ej. hora ↔ ambiente). Un eje nuevo nunca cambia los hechos del caso (R-5).
- **V-2 Texto por piezas, no por frases fijas.** Cada momento del caso (saludo, pista, charla, remate, epílogo) tiene **al menos 3 estructuras de frase** distintas con huecos (`{local}`, `{sospechoso}`, `{objeto}`, `{cliente}`), sinónimos y concordancia de género. Se evita que dos frases de un mismo caso empiecen igual.
- **V-3 Cada caso tiene una «firma».** Un objeto estrella, un gag y un personaje o escena memorables, **distintos de los del caso anterior**. Lo que el jugador cuenta después es la firma, no la receta.
- **V-4 Ventana anti-repetición entre casos.** La memoria de 5C pasa de «memoria de partidas» a **memoria de ingredientes** (niveles A, B y C de los últimos casos). «Caso nuevo» prueba N semillas y propone la de **menor solapamiento**. **La memoria solo elige qué semilla se propone; nunca cambia lo que genera un código (R-9).** Dentro de un caso ya se evita repetir aspectos; se extiende a frases y curiosidades.
- **V-5 Pesos sin favoritos.** Cada banco y cada eje usa pesos planos por defecto; el medidor (§6) detecta valores que salen demasiado o casi nunca y se corrigen en los datos.
- **V-6 Profundidad antes que anchura (en cada banco).** Un banco no se amplía hasta que todo lo que ya tiene pasa la puerta de calidad (§5). Mejor un cupo cerrado y excelente que uno grande y desigual.
- **V-7 Cupos mínimos por tipo de ingrediente (BORRADOR).** Los números ya decididos están en `ESCENARIOS.md` §4 (6 salas, 2 variantes, ~12 curiosidades, 8 charlas por escenario; ~8 historias por temática). Los nuevos, a fijar al abrir 4F-0d: **~24 manías, ~24 muletillas, ~8 oficios por escenario, ~6 ganchos de arranque por temática**.
- **V-8 Sin textos en vivo.** El generador sigue siendo determinista y de código cerrado: no se planean textos generados al vuelo durante la partida (romperían R-9 y el control de calidad). La variedad viene de más ejes, más piezas bien escritas y mejor mezcla. *(Propuesta; el usuario la confirma.)*

## 5. Suelo de profesionalidad: la puerta de calidad de contenido
Ningún ingrediente nuevo (frase, charla, curiosidad, historia, sala, aspecto) entra en un banco sin pasar la **puerta de calidad**:
| # | Comprobación | Cómo |
|---|---|---|
| C-1 | Tono correcto y **remate** en todo lo oscuro (regla de oro de lo macabro) | Linter + muestra del usuario |
| C-2 | **Concordancia de género** y número con los huecos | Linter con las plantillas de 4G-1 |
| C-3 | Sin nombres propios sueltos ni referencias a otros casos | Linter |
| C-4 | Sin duplicados ni casi-duplicados (ni la misma apertura de frase) | Linter |
| C-5 | Longitud dentro del rango de pantalla (iPhone en vertical) | Linter |
| C-6 | **No revela al culpable** ni contradice las pistas (los textos de relleno no pueden decidir el caso, R-4) | Revisor de equidad |
| C-7 | Coherente con su escenario y su temática | Revisión + tabla de §3 de `ESCENARIOS.md` |
| C-8 | Se puede ver y hacer en iPhone y en ordenador (R-1) | Prueba de navegador |
- **Linter automático (4V-2, LOW):** C-1 a C-5 se vigilan solos en cada ejecución de pruebas; un banco que falla bloquea el cierre del paquete.
- **Revisor de amor (4G-6):** nota 0-100 por caso (variedad, densidad por sala, coherencia, cobertura de ambiente); aquí gana una **nota de variedad** (§6).
- **Muestra del usuario:** ~10 frases sueltas por paquete (ya vigente, `MUESTRA_FRASES.md`). El usuario puede rechazar un banco entero.
- **Suelo, no solo media:** además de «calidad media > 80», se exige que el **5 % peor** de los casos esté por encima de un mínimo (BORRADOR: nota ≥ 75) y **0 casos con equidad < 90**.

## 6. El medidor de variedad (paquete 4V-1, LOW; se construye lo primero, sin cambiar el generador)
Mide con las 5000 semillas ya habituales (10.000 al final, 6B) y entrega un informe:
| Medida | Qué responde | Meta (BORRADOR) |
|---|---|---|
| **Uso por valor** de cada eje A/B | ¿Hay favoritos u olvidados? | Ningún valor sale más de 1,5 × ni menos de 0,5 × su peso esperado |
| **Distancia entre pares** | De los ejes principales (A+B), ¿cuántos cambian entre dos casos al azar? | ≥ 7 de 10 en el 95 % de los pares |
| **Secuencias de 5 casos** (con la regla V-4) | ¿Hay casos seguidos que se sientan iguales? | 0 repiten escenario + historia; ≤ 1 repite tono o ambiente |
| **Repetición de texto** (nivel C) | ¿Se repiten frases en una ventana de 5 casos? | ≤ 2 % de las frases |
| **Nota de variedad por caso** | Resumen 0-100 para el revisor de amor | Media > 80 y mínimo > 60 |
**Primera tarea de 4V-1:** medir cómo está HOY (con la panadería sola) para saber cuánta variedad hay de verdad y fijar las metas con datos, no a ojo. El HITO añade una pregunta al jugador: **«¿reconociste algo del caso anterior?»**.

## 7. Cuántas combinaciones hay (orden de magnitud, ESTIMACIÓN)
Producto de los ejes conocidos, sin contar textos: 5 temáticas × 3 escenarios × ~8 historias × 3 ambientes × 6 tonos × 28 mecánicas × 22 formas de elegir 4-6 salas × ~32 variantes de sala × ~58.900 formas de elegir 4 aspectos de 36 ≈ **10¹² (del orden de billones) combinaciones teóricas**, sin contar los ejes nuevos (hora, clima, espejo, paleta, forma, arranque, identidad compuesta), que lo multiplican otra vez.
**Pero esa cifra NO es lo que cuenta**, porque los ejes no se perciben por igual. Por eso el objetivo se mide en **distancia percibida** (§6) y no en número de combinaciones. «Infinito» aquí es *en la práctica*: tantas combinaciones y tan repartidas que jugar mil casos no deja de sorprender; no es literal.

## 8. Plan por paquetes (detalle y filas en `ROADMAP.md` §4.3)
| Orden | Paquete | Qué hace | Modelo |
|---|---|---|---|
| 1 | **4V-1 Medidor de variedad** | Informe de §6 sobre el estado actual; no cambia el generador | LOW |
| 2 | **4F-0c Hora, clima, espejo y paleta** (E1, E2) | Ejes visuales y sonoros; cuidado con puertas y huecos | MEDIUM |
| 3 | **4F-0d Forma, identidad y arranque** (E3, E4, E5) | Ejes de estructura y de personajes | MEDIUM |
| 4 | **4V-2 Linter de contenido** | Puerta de calidad automática (C-1 a C-5), antes de escribir contenido nuevo | LOW |
| 5 | **4H / 4T / 4G** (ya planificados) | Cada paquete de contenido cierra con **informe de variedad + linter** (regla **R-11**) | MEDIUM |
| 6 | **4D-3** | Calibra con metas de variedad **por temática y por dificultad** | LOW |
| 7 | **5C** | Memoria de **ingredientes** (V-4) | LOW |
| 8 | **6B** | Informe de variedad con 10.000 semillas | LOW |
**Regla R-11 (cierre de paquete, se añade a R-1…R-10):** todo paquete que añada contenido cierra con el **linter en verde** y con el **informe de variedad** comparado con el anterior (no puede empeorar ninguna medida de §6). Si empeora, se corrige antes de cerrar.

## 9. Lo que NO se hace (por ahora)
- No se amplía ningún banco antes de existir el linter (4V-2) y el medidor (4V-1).
- No se añaden ejes nuevos distintos de E1-E5 sin aprobarlos; cada uno cambia la receta.
- Sin textos generados en vivo (V-8).
- Los esquemas de misterio nuevos (5A) siguen después del HITO.

## 10. Dudas abiertas (no bloquean; se cierran al abrir cada paquete)
1. ¿Se aprueban los 5 ejes nuevos (E1-E5) o se quita alguno? (Aprobar o recortar al abrir 4F-0c y 4F-0d.)
2. ¿Los cuatro arquetipos de **forma del caso** (E3) son los adecuados? Cada forma nueva multiplica pruebas.
3. El **espejo** (E2) puede no servir para todas las plantillas (puertas y huecos); el piloto del museo decide si se aplica a todas o solo a algunas.
4. Los números de las metas de §6 y los cupos de V-7 son BORRADOR; se fijan con la medición real de 4V-1.
5. Ventana de repetición de nivel C: 10 casos (V-4 y §2) frente a la ventana de 5 del medidor (§6). Se unifica al ver los datos de 4V-1.
