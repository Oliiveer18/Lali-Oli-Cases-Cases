# CASO LIBRE Y ACUSACIÓN POR RAZONES
Creado el 24 oct (checkpoint 179, **solo documentación, sin código**). Fuente de verdad de dos decisiones del usuario que van juntas: **(1) el caso deja de depender de fases/capítulos como cerrojo** y **(2) lo que hay que demostrar para acusar depende de la dificultad y se desbloquea con pistas**. Lo leen CL-1…CL-6 (paquete CL), c4/c4b/c5 de 4F-0b 3/4, 4F-0b 3/4-d/e, 4D-3 y Z1. Estado: **DISEÑO DECIDIDO A MEDIAS** (Acusar fijado en §11, cp. 198; estrellas y recompensa: propuesta A de §12 ELEGIDA por el usuario el 25 oct, cp. 200; objetivos y duración en §13, cp. 201; **DISEÑO CL-2 APROBADO por el usuario el 25 oct, cp. 202, con una corrección: v7 SIN capítulos en el juego, §13.1**) (§1 y §3 son decisión del usuario; §4-§7 son la propuesta de Claude para llevarlo a cabo; las dudas abiertas están en §8). Nada de esto está en el código.

## 1. Decisiones del usuario (24 oct, durante c3, cp. 177-179)
1. **Sin fases como cerrojo.** Quien quiera jugársela pronto y acusar «porque cree que tiene las pistas adecuadas» puede hacerlo; no hay que esperar a la tercera fase.
2. **Qué hay que demostrar depende de la dificultad** (formato nuevo, ver §3): **Fácil = culpable · Normal = culpable y motivo · Difícil = culpable, motivo y método.**
3. **«Demostrar» = desbloquear.** Para poder hacer oficial cada razón hay que haber desbloqueado esa razón, es decir, haber conseguido las pistas que la sostienen. No basta con adivinarla.
4. **La duración sale del CONTENIDO, no de fases que obliguen a esperar:** suficientes pistas, herramientas que descubrir, charlas con los personajes, engaños, etc. («lo que debe haber en un caso profesional de este juego»).
5. **Estrellas de 1 a 3 según el desempeño; más estrellas, más recompensa.** Al acertar, el jugador obtiene de 1 a 3 estrellas según el **tiempo tardado, los intentos fallidos, las pistas encontradas, etc.** (los criterios exactos se fijan en CL-2, pregunta Q7). **Acertar siempre da recompensa (mínimo 1 estrella): no hay «cierre flojo» ni se reduce la recompensa solo por haber reunido pocas pruebas** (ya es bastante duro fallar o no ganar el caso). Fallar sigue costando lo de hoy (§2).
6. **Paquete aparte.** c3 se cierra como está; el caso libre se apunta en el roadmap como paquete propio (paquete **CL**), antes de seguir añadiendo contenido (escenarios, personajes).
7. **Decisiones anteriores que siguen vigentes:** no se empareja ningún paso entre Oli y Lali (cp. 177) y EQ-1 (40-60 %) se mide sobre el caso entero, no por capítulo (cp. 177-178).

**Propuestas de Claude que el usuario no ha objetado (a confirmar al abrir CL-2):** (a) los capítulos pasan a ser una **guía de objetivos** («ya tienes el método», «falta el motivo»), no un cerrojo; (b) CL se coloca entre c3 y c4 (§7); (c) los tiempos oficiales por nivel se miden con la partida COMPLETA (§6).

## 2. Cómo funciona Acusar HOY (leído en el código en el cp. 179, solo lectura; v0.7.60)
**Pantalla y reglas** (`src/play.js`, `src/logic.js`, `CaseState.accuse()`):
- Es la pestaña «Acusar» del cuaderno (`tabsDef()`), con los huecos «¿Quién fue?», «¿Cómo lo hizo?», «¿Por qué?» y «Pruebas clave» según el nivel, y el botón ¡ACUSAR! con confirmación.
- **Ni la pantalla ni `accuse()` miran el capítulo.** (`grep` de `chapter` en `play.js`: solo guardado y recuperación de partida.) El capítulo 3 «Acusar» es un objetivo del guion, no un bloqueo de la pantalla.
- **Único candado: el culpable.** Solo se puede acusar a quien se ha interrogado (`interrogated()`: se ha hablado con él al menos una vez, o una pista lo señala o lo descarta). Los gatos no se pueden acusar. Si se intenta, no cuenta como fallo. (`gateOff` apaga el candado solo para las pruebas del bot.)
- **Las razones NO tienen candado.** Se puede elegir método y motivo sin haber encontrado ninguna pista. Cada opción lleva una lista `needs` (pistas que la sostienen), pero hoy solo sirve para la etiqueta «hay pistas / sin pistas» en Fácil y Normal (`autoMark`). El validador (`src/logic.js`) comprueba que los `needs` existen y que con todas las pistas se pueden tener; `src/gen_truth.js` los deja vacíos y los rellena una fase posterior del generador (según su cabecera; **no comprobado en casos generados: lo mira CL-1**).

**Qué pide cada nivel hoy** (`G.DIFFS`, `boardOptions()`):
| Nivel | `board` | Hay que acertar | Intentos | Descuento por fallo (acumulado) | Otros |
|---|---|---|---|---|---|
| Fácil | 1 | culpable + motivo | 3 | 0 · 16 % · 50 % | 3 sospechosos visibles |
| Normal | 3 | culpable + método + motivo | 2 | 0 · 50 % | |
| Difícil | 4 | culpable + método + motivo + pruebas (hasta 3; ≥ 2 de las clave y ya encontradas) | 1 | 0 | límite de tiempo 1,2 × par |

**Recompensa** (`reward()`): sin caso resuelto no hay nada; si se resuelve, base × dificultad × (1 + 0,25 × (estrellas − 1)) menos el descuento por fallos, más las monedas sueltas. **Estrellas:** 1 por ganar + 1 si se llega dentro del tiempo par + 1 si no hay fallos **y se ha encontrado ≥ 80 % de las pistas**. Tras un fallo, el acusado se ofende unos 40 s.

**Dónde pesan hoy los capítulos** (lista PARCIAL; la completa es CL-1): `chapterMin` en objetos y puertas (`src/bot.js`, `src/companion.js`, `src/compile.js`: las charlas grabadas son `chapterMin: 2`; el **caso 1 también lo usa** en puertas y en una visibilidad, y está reservado hasta Z0); la pista «ya tenemos suficiente, acusad» solo salta en el último capítulo (`src/logic.js`); el validador exige un objetivo `case_closed` en el último capítulo (`src/schema.js`); EQ-1 por capítulo en v6 (`G.workIssues`) y EQ-7 (`G.idleOf`).

## 3. Diseño decidido: qué hay que demostrar por nivel
| Nivel | HOY | DECIDIDO (cp. 179) |
|---|---|---|
| **Fácil** | culpable + motivo | **culpable** |
| **Normal** | culpable + método + motivo | **culpable + motivo** |
| **Difícil** | culpable + método + motivo + pruebas clave | **culpable + motivo + método** |

Cómo se «demuestra» cada razón (propuesta, a cerrar en CL-2):
- **Culpable:** ~~se mantiene el candado de hoy~~ **SUPERADO el 25 oct (cp. 198, §11): sin candado; la lista de sospechosos está siempre abierta.**
- **Motivo y método:** la opción solo se puede elegir (y la acusación formalizar) cuando se han conseguido sus pistas `needs`. Mientras no, aparece bloqueada con 🔒, igual que hoy el culpable no interrogado, y sin que cuente como fallo.
- **Pruebas clave:** la selección de pruebas desaparece de la pantalla de Acusar (las pruebas pasan a ser el candado de cada razón). Es la interpretación de Claude de «difícil: culpable, motivo y método»; pregunta Q1.
- **Acusar en cualquier momento:** si ya se tienen las razones que pide el nivel, se puede acusar aunque queden pistas por ver. Quien acierta pronto termina antes y cobra lo mismo (regla 5).

### Estrellas (decisión del usuario, 24 oct, cp. 179)
- Al resolver el caso el jugador obtiene **de 1 a 3 estrellas**; **más estrellas, más recompensa.** Acertar da siempre al menos 1 estrella y su recompensa; fallar del todo sigue sin dar nada.
- Dependen del **desempeño**: **tiempo tardado, intentos fallidos, pistas encontradas, etc.** («etc.» = otros criterios que se decidan en CL-2).
- **Hoy ya existe un sistema parecido** (`reward()` en `src/logic.js`, leído en este cp.): 1 estrella por ganar, +1 si se llega dentro del tiempo par, +1 si no hay fallos y se ha encontrado ≥ 80 % de las pistas; recompensa = base × dificultad × (1 + 0,25 × (estrellas − 1)), es decir ×1 / ×1,25 / ×1,5, menos el descuento por fallos. **Se parte de él**; lo que CL-2 tiene que definir es cómo se reparten esos criterios (hoy «sin fallos» y «≥ 80 % de pistas» van juntos en una sola estrella; el usuario los nombra por separado), si hay más criterios, y si los fallos **además** de quitar estrellas siguen aplicando el descuento de monedas (hoy sí, los dos). Pregunta Q7.
- Con el caso libre, quien acierta pronto y con pocas pistas puede sacar 1 o 2 estrellas y quien lo hace completo y limpio, 3: el atajo es legítimo, pero no es la mejor forma de ganar.

## 4. Reglas del caso libre (CL-R)
- **CL-R1** Ningún cerrojo por fase o capítulo sobre Acusar, sobre el culpable ni sobre las razones: solo dependencias reales.
- **CL-R2** Un objeto, una puerta o un testimonio se bloquea solo por una **dependencia con sentido** (la llave, el nombre del sospechoso, la grabación), nunca por «aún no toca». El caso se abre solo según lo que has visto.
- **CL-R3** Cada razón que pide el nivel tiene al menos una vía de pistas **siempre alcanzable** sin pasos imposibles (el validador ya lo exige para `needs`; se amplía a «alcanzable por cualquier orden razonable»).
- **CL-R4** **Estrellas de 1 a 3 y recompensa según ellas** (§3, «Estrellas»). Acertar siempre cobra (mínimo 1 estrella); pocas pruebas reunidas no son una penalización aparte, solo cuentan como un criterio más del desempeño.
- **CL-R5** **La duración sale del contenido:** el caso debe tener cantidad y variedad suficientes de pistas, herramientas, charlas, engaños y personajes para que una partida COMPLETA dure lo oficial (§6). Quien acusa pronto termina antes: no hay «tiempo mínimo forzado».
- **CL-R6** ~~Los capítulos pasan a guía.~~ **CORREGIDO por el usuario el 25 oct (cp. 202 y 203): en v7 NO hay capítulos, pero SÍ una GUÍA de objetivos (qué se puede hacer), sin cerrojos** (§13.1). Además orientan los 🔒 de Acusar y las pistas de ayuda. El caso 1 y v6 conservan capítulos hasta Z0 (P17).
- **CL-R7** Equilibrio Oli/Lali: EQ-1 sobre el caso entero (ya decidido) y EQ-7 (esperas) medido **sin capítulos** (por tramos de tiempo o por dependencias). Sin pasos emparejados.
- **CL-R8** Todo detrás de **`GEN_VERSION >= 7`**. v6 (códigos `G6-…`) y el caso 1 se quedan idénticos hasta Z0.

## 5. Piezas afectadas (a confirmar en CL-1; nada de esto se toca antes)
| Pieza | Qué cambia |
|---|---|
| `boardOptions()`, `accuse()`, `accKey()` (`src/logic.js`) | Nuevo formato por nivel (§3), candado por razón con `needs`, sin selección de pruebas |
| Pantalla Acusar (`src/play.js`) | Huecos según el formato nuevo, 🔒 y texto de bloqueo en motivo y método |
| `G.caseBriefing` y avisos de tutorial | El texto de «qué hay que hacer» se compone con las razones del nivel |
| Pista de ayuda «acusad» (`logic.js`) | Pasa a salir cuando se tienen las razones del nivel, no solo en el último capítulo |
| `src/compile.js`, `src/bot.js`, `src/companion.js` | `chapterMin` sustituido por dependencias; el bot acusa en cuanto puede; el compañero IA no depende del capítulo |
| Revisor, medidor, EQ-7 (`G.workIssues`, `G.idleOf`, `tools/`) | Sin capítulos; EQ-1 caso entero (ya hecho en v7) |
| Validador y `src/schema.js` | `case_closed` ya no tiene que ser el objetivo del último capítulo; comprobar `needs` alcanzables |
| Duración, calidad (`src/quality.js`) | Remedir con partida completa y con acusación temprana |
| Pruebas | `test_accuse`, `test_acusar_fallo`, `test_reparto`, `test_tiempo_muerto`, `test_duracion`, `test_bot`, `test_compile`, `test_mech`, `test_charlas`; nuevas con mutación |
| Caso 1 | **No se toca** (usa `chapterMin`); el motor conserva el soporte «con capítulos» para v6 y el caso 1 hasta Z0 |

## 6. Impacto en equilibrio, duración y tiempos oficiales
- **EQ-2 («los tres capítulos dan trabajo a los dos»)** y la definición de «completo» de Z1 («ambos detectives con trabajo en los 3 capítulos») se reformulan: **trabajo para los dos a lo largo de todo el caso** (por tramos de la partida), no por capítulo. Se fija en CL-2/CL-4.
- **EQ-7 (esperas):** hoy mide por capítulo; pasa a medir esperas seguidas sin capítulos (el umbral de 240 s y «≥ 1 acción propia por caso» se conservan hasta que CL-4 diga otra cosa).
- **Tiempos provisionales (Fácil 20-28 · Normal 28-36 · Difícil 36-45, mín. 20, techo 45; ROADMAP §3):** se mantienen. Cambia **cómo se miden**: con el bot jugando la partida COMPLETA (recoge todo antes de acusar). Una acusación temprana de un jugador real puede acabar antes y es legítimo; los rangos describen una partida completa. Hoy se exige solo no pasarse del tope e informar el mínimo (sin cambio). Pregunta Q5.
- **Calidad y «jugabilidad»** (`src/quality.js`): se remiden en CL-5; hoy dependen del número de capítulos.

## 7. Dónde va en el roadmap y plan por subpasos (propuesta de Claude)
**Orden:** c3 (se cierra COMO ESTÁ: EQ-7 en v7, pistas libres hacia 26-30 %, pruebas, `dist/` y documentos) → **paquete CL** → c4, c4b, c5 (se adaptan al caso libre) → 4F-0b 3/4-d → 4F-0b 3/4-e (`GEN_VERSION` 6→7). **Por qué antes de c4 y de 3/4-e:** c4 generaliza el balanceador «por capítulo» y 3/4-e libera los códigos G7; hacerlo después obligaría a una segunda subida de versión (v8) y a rehacer lo de c4. Todo CL va detrás de `GEN_VERSION >= 7` (v7 sigue en desarrollo hasta 3/4-e), sin subida extra. Si el usuario prefiere otro orden, se mueve sin coste en la checklist.

| Subpaso | Qué hace | Modelo | Entrega |
|---|---|---|---|
| **CL-1** | Diagnóstico de SOLO LECTURA: lista completa de dónde se usan capítulos y `chapterMin` (generador, bot, compañero IA, medidor, revisor, EQ-7, validador, caso 1, textos); en 200 casos por nivel: `needs` rellenos y alcanzables, nº de pistas por razón y **en qué momento de la partida del bot se tendrían las razones** (cuándo se PODRÍA acusar) | **LOW** | `docs/INFORME_CASO_LIBRE_CL1.txt` + SESION; `src/` sin cambios |
| **CL-2** | Diseño por escrito con el usuario: respuestas a las preguntas abiertas de §8 (incluidos los criterios de las estrellas), grafo de «qué desbloquea qué», textos de bloqueo, objetivos como guía, cómo se mide la duración | **LOW** (+ usuario) | Este documento actualizado; **aprobación del usuario antes de tocar código** |
| **CL-3** | Acusar por razones: formato por nivel, candado por razón, pantalla, textos, bot que acusa en cuanto puede | **MEDIUM** | v7; v6 IDÉNTICO; ZIP |
| **CL-4** | Quitar los capítulos de v7: dependencias reales en lugar de `chapterMin`, sin pantallas ni datos de capítulo; adaptar bot, compañero IA, medidor, revisor, EQ-7 y validador | **MEDIUM** | v7; v6 y caso 1 IDÉNTICOS; ZIP |
| **CL-5** | Duración por contenido: remedir por nivel con partida completa y con acusación temprana; ajustar contenido (charlas, pistas, engaños) hasta los rangos oficiales sin pasarse del tope | **MEDIUM** (LOW si solo mide) | Informe por nivel; ZIP |
| **CL-6** | Pruebas con mutación, `dist/`, documentos y cierre | **LOW** | ZIP; PARAR |

Cada subpaso: ZIP completo con los documentos al día y PARAR (regla de oro del usuario), solo con permiso explícito para el siguiente.

## 8. Preguntas abiertas (provisional hasta que el usuario responda; también en `PREGUNTAS_PENDIENTES.md`, P12-P18)
- **Q1 (P12) · ¿Desaparece «Pruebas clave» de la pantalla de Acusar?** Provisional: SÍ (Difícil pide culpable, motivo y método; las pruebas pasan a ser el candado de cada razón).
- ~~**Q2 (P13) · ¿Cómo se demuestra al culpable?**~~ **SUSTITUIDA (25 oct, cp. 198, §11):** no hay candado en el culpable; la lista de sospechosos está siempre abierta.
- **Q3 (P14) · Intentos y descuentos por fallo:** hoy 3 / 2 / 1 con descuentos 0-16-50 % / 0-50 % / 0. Con menos razones que acertar en Fácil y Normal, ¿se mantienen? Provisional: se mantienen.
- ~~**Q4 (P15) · Estrellas**~~ **RESPONDIDA (24 oct):** habrá de 1 a 3 estrellas según tiempo, fallos, pistas encontradas, etc., y a más estrellas, más recompensa (§3, «Estrellas»). Una acusación temprana con pocas pistas cobra menos que una completa y limpia, y eso es lo querido.
- **Q7 (P18) · Criterios exactos de las estrellas** (**RESUELTA el 25 oct, cp. 200: propuesta A de §12**): ¿cuántos criterios y cuáles (tiempo, intentos fallidos, pistas encontradas, otros)?, ¿qué umbral da cada estrella?, ¿los fallos siguen aplicando además el descuento de monedas? Provisional: los de hoy (§3). Se decide en CL-2.
- **Q5 (P16) · Tiempos oficiales:** ¿se miden con la partida completa del bot (propuesta de §6) o con otra regla? Provisional: partida completa.
- **Q6 (P17) · Caso 1:** sigue con capítulos y `chapterMin` hasta Z0. Provisional: se conserva el soporte con capítulos en el motor solo para v6 y el caso 1.

## 9. Riesgos
- **Acusar demasiado pronto sin pistas suficientes** no rompe nada (el candado de razones lo evita), pero un caso con pocas pistas por razón dejaría acusar en pocos minutos: CL-1 mide cuándo se podría acusar en cada nivel para fijar un mínimo de contenido.
- **Tocar `chapterMin` toca el generador, el bot, el compañero IA y varias pruebas a la vez** (§5): por eso es un paquete aparte con diagnóstico y diseño antes del código, y no se mezcla con c3.
- **La duración deja de estar «garantizada» por las fases:** pasa a depender de que haya contenido suficiente (CL-5). Mientras falte contenido, quedarse corto sigue sin ser un fallo; pasarse del tope sí.
- **Caso 1 y v6** deben seguir idénticos: `casos_sin_cambios 60`, `test_compile` y `test_mech` lo vigilan.

## Respuestas del usuario (24 oct, cp. 188)
- **Orden:** primero el paquete de reparto de herramientas; después el paquete CL.
- **P12** SÍ: desaparece «Pruebas clave» en Acusar; las pruebas son el candado de cada razón.
- **P13** ~~Se ENDURECE: para acusar al culpable hace falta una pista que lo señale~~ **SUSTITUIDA el 25 oct (cp. 198, §11): sin candado en el culpable.**
- **P14** SÍ: intentos y descuentos se mantienen (3 / 2 / 1).
- **P16** SÍ: tiempos oficiales con la partida completa del bot.
- **P17** SÍ: el caso 1 queda con capítulos hasta Z0.
- **P18** DELEGADA en Claude: estrellas de 1 a 3 por una mezcla profesional de tiempo tardado, pistas encontradas, fallos y otros; criterios y umbrales propuestos en CL-2 y revisados por el usuario.

## Respuestas del usuario (25 oct, tras CL-1, cp. 196)
- **Resultado de CL-1** (detalle en `INFORME_CASO_LIBRE_CL1.txt`): `needs` de método y motivo siempre rellenos y alcanzables (1 pista de objeto cada uno); 0 de 600 casos sin pista que señale al culpable (4-5 por caso); razones disponibles de mediana en el minuto 0,4 Fácil · 1,6 Normal · 4,1 Difícil (la partida del bot dura 24,6 / 28,5 / 31,7 min).
- **P22** SE ACEPTA: 1 sola pista por razón (culpable, motivo y método) y se puede acusar en cualquier momento, aunque sea pronto: «en un caso real no tienes límites; aquí tienes que saber lo que haces». Acusar pronto y mal ya se castiga con fallos, estrellas y recompensa (P14, P15, P18). NO se piden 2-3 señales ni 2 pistas por razón.
- **P23** NO: acusar nunca obliga a hablar con nadie; las `needs` pueden seguir siendo solo de objeto. El generador no cambia por esto.
- **Criterio de producto (usuario):** el juego debe ser fácil, simple, intuitivo y profesional; las reglas de Acusar se explican en una frase y la pantalla las muestra (🔒 + «falta la pista de…»).

## 10. CL-2 · subpaso 1 de 3 · qué desbloquea qué y textos de bloqueo (propuesta de Claude, 25 oct, LOW; pendiente del OK del usuario)
**Hallazgo que cambia el diseño (revisado en el código):** si cada OPCIÓN se desbloquea con su propia pista (`needs`) y cada SOSPECHOSO con la pista que lo señala, el jugador adivina por eliminación: con las pistas del culpable ya encontradas (el bot las tiene a los 0,4-4 min), solo queda desbloqueado él y «elegir» es mirar la única opción que no lleva 🔒. Eso va contra el criterio del usuario («tienes que saber lo que haces»).
**Propuesta (B): el candado es del HUECO, no de cada opción.** Una regla para los tres, fácil de contar en una frase: **«Cada hueco de Acusar se abre cuando tienes al menos una pista sobre ese tema; entonces eliges entre TODAS las opciones.»**
| Hueco | Se abre con (pista que ya existe en el caso) | Niveles que lo piden |
|---|---|---|
| ¿Quién fue? | ~~1 pista que señale o descarte a algún sospechoso~~ **SIN candado (§11, cp. 198)** | Fácil · Normal · Difícil |
| ¿Por qué? (motivo) | 1 pista de cualquier opción de motivo (`needs` de la verdadera o de un señuelo) | Normal · Difícil |
| ¿Cómo lo hizo? (método) | 1 pista de cualquier opción de método | Difícil |
Sin capítulos ni «tiempo mínimo». Gatos no acusables (se mantiene). Lo que no se pide en el nivel no aparece (Fácil solo «¿Quién fue?»). Acertar exige elegir la opción verdadera; fallar cuenta como hoy (intentos y descuentos 3 / 2 / 1, P14). Las marcas «hay pistas / sin pistas» de Fácil y Normal se mantienen como están (`autoMark`).
**Alternativa (A), la de §3:** candado por opción y por sospechoso (más estricto, pero con la fuga por eliminación). Si el usuario prefiere A, se asume esa fuga o se compensa con más señuelos desbloqueados desde el principio.
**Textos de bloqueo (propuesta, tono simple):** («¿Quién fue?» ya no lleva 🔒 ni texto de bloqueo, §11) · «¿Por qué?» 🔒 «Aún no tenéis pistas sobre el motivo. Buscad qué ganaba con ello.» · «¿Cómo lo hizo?» 🔒 «Aún no tenéis pistas sobre el método. Buscad cómo lo hizo.» · Botón ¡ACUSAR! apagado: «Falta elegir: [quién fue / por qué / cómo]». Intentar un hueco bloqueado NO cuenta como fallo.
**Texto de «qué hay que hacer» (`G.caseBriefing`):** Fácil «Descubrid quién fue.» · Normal «Descubrid quién fue y por qué.» · Difícil «Descubrid quién fue, por qué y cómo.» + «Podéis acusar cuando queráis; si falláis, perdéis un intento.»
**Pista de ayuda «acusad» (hoy solo en el último capítulo):** sale cuando se tienen las pistas de las razones VERDADERAS del nivel (`needs` de motivo/método verdaderos; ~~y una pista que señale al culpable~~ ya no se exige, §11), una sola vez; no obliga y no bloquea nada.
**Bot y medición:** el bot acusa en cuanto tiene esas razones verdaderas (para saber cuándo se podría); los tiempos oficiales se siguen midiendo con la partida COMPLETA (P16), con una segunda cifra «acusación temprana» solo informativa.
**RESUELTO el 25 oct (cp. 198, §11): variante de B sin candado en ¿Quién fue?.** ~~Pendiente del usuario: ¿B o A?~~ Quedan para los subpasos 2 y 3: estrellas (P18) y recompensa; objetivos como guía y medición de la duración.

## 11. Decisión final de Acusar (25 oct, cp. 198; el usuario confirma con «sí» lo hablado en otra sesión; SOLO DOCUMENTACIÓN, nada implementado)
**Regla en una frase:** *la lista de sospechosos está siempre abierta; solo el motivo y el método se abren con una pista.*
| Hueco | Candado | Niveles que lo piden |
|---|---|---|
| ¿Quién fue? | **Ninguno, nunca.** Lista completa de sospechosos desde el principio; se puede elegir a cualquiera (los gatos siguen sin salir ni poder acusarse) | Fácil · Normal · Difícil |
| ¿Por qué? | Se abre con al menos 1 pista de motivo | Normal · Difícil |
| ¿Cómo lo hizo? | Se abre con al menos 1 pista de método | Difícil |
- **Sustituye a P13** («para acusar al culpable hace falta una pista que lo señale», 24 oct, cp. 188) y quita el único candado que existe hoy (`interrogated()`: 🔒 «Aún no habéis hablado con esta persona»). Los candados solo quedan donde de verdad hace falta una pista, y el jugador nunca ve un 🔒 sobre algo que ya conoce.
- **Es la variante de B (§10)** (candado del HUECO, luego se elige entre TODAS las opciones) aplicada solo a motivo y método; ¿Quién fue? queda sin candado. No hay candado por opción ni por sospechoso (A descartada).
- **Acertar sin pistas** es suerte y lo castiga el sistema de siempre: un fallo cuesta intentos, estrellas y recompensa (P14, P18). Intentar un hueco bloqueado no cuenta como fallo.
- **Efectos para el diseño:** (1) en Fácil (solo «¿Quién fue?») se puede acusar desde el primer segundo; (2) las cifras de «se podría acusar» del informe CL-1 (mediana 0,4 / 1,6 / 4,1 min) incluían la pista del culpable: ya solo valen para motivo y método y se vuelven a medir en CL-3; (3) P22 (1 pista por razón) se mantiene para motivo y método; (4) el texto de bloqueo del culpable desaparece (quedan los de motivo y método de §10); (5) la pista de ayuda «acusad» ya no depende de una pista del culpable (su disparo en Fácil, sin candados, se cierra en el subpaso 3: objetivos como guía).
- **Sigue:** CL-2 subpaso 2 (estrellas P18 y recompensa), después subpaso 3 y aprobación del diseño antes de tocar código.

## 12. CL-2 · subpaso 2 de 3 · estrellas (P18) y recompensa (propuesta de Claude, 25 oct, cp. 199, LOW; pendiente del OK del usuario)
**Punto de partida (`reward()`, `src/logic.js` ~683, leído hoy):** 1★ por resolver · +1★ si `elapsed() ≤ parSeconds` (par = tiempo estimado del caso × `parFactor`, o sea «algo más rápido que la media», `src/meter.js`) · +1★ si 0 fallos **y** ≥ 80 % de pistas. Recompensa = base del caso (135-155) × dificultad (1 / 1,6 / 2,4) × (1 + 0,25 × (★ − 1)), menos el descuento por fallos (0-16-50 % / 0-50 % / 0), más monedas sueltas; sin caso resuelto, 0 (P1). `rep` = ★ × 5.
**Problemas que corrige el nuevo diseño:** (1) con acusar en cualquier momento (§11), un acierto de suerte en Fácil a los 30 s cumple «dentro del par» y saca 2★ sin investigar; (2) «sin fallos» y «≥ 80 % de pistas» van pegados en una estrella y el usuario los nombra por separado; (3) en Difícil (1 intento) «sin fallos» es siempre cierto, así que no distingue nada.
**Propuesta A (recomendada) · escalera de tres peldaños, una frase por estrella:**
| ★ | Qué dice la pantalla de resultados | Condición |
|---|---|---|
| ★ | «Caso resuelto» | Acertar (siempre; mínimo 1★) |
| ★★ | «Investigación completa» | + haber encontrado ≥ 80 % de las pistas |
| ★★★ | «Impecable» | + sin fallos **y** dentro del tiempo par |
Cada peldaño exige el anterior. La pantalla muestra qué le faltó («Te faltó: sin fallos»). **Los tres criterios del usuario cuentan:** pistas encontradas (2.ª), fallos y tiempo tardado (3.ª). Acertar de suerte o con atajo = 1★ (cobra, pero poco); investigar a fondo = 2★; hacerlo limpio y a tiempo = 3★. Umbral del 80 % = el de hoy.
**Recompensa (sin cambios de fórmula):** ×1 / ×1,25 / ×1,5 y el descuento por fallos de hoy se mantienen (P14, ya decidido: los fallos quitan monedas además de costar la 3.ª estrella). Caso típico (base 145), ganando: Fácil 145 / 181 / 218 · Normal 232 / 290 / 348 · Difícil 348 / 435 / 522. Fallo total = 0. Monedas sueltas solo si se resuelve (P1). `rep` = ★ × 5.
**Efecto por nivel:** Fácil y Normal: un fallo deja el máximo en 2★ (como hoy, `test_accuse` ya lo comprueba). Difícil: no puede fallar, así que 3★ = ≥ 80 % de pistas + dentro del par (el límite de tiempo es 1,2 × par: hay margen entre 2★ y perder por tiempo).
**Alternativa B:** mantener la estructura de hoy con tres medallas independientes (rápido · minucioso · limpio) y 1★ + las que cumplas con tope 3. Más generosa y más simple de programar, pero un acierto de suerte pronto en Fácil sacaría 3★ (rápido + sin fallos) sin investigar. No recomendada.
**Cambio respecto a §3:** ahí se decía que quien acierta pronto y con pocas pistas «puede sacar 1 o 2 estrellas»; con A saca 1★ (2★ solo con ≥ 80 % de pistas).
**Impacto en CL-3 (código, NO hecho):** solo `reward()` (dos condiciones) y el texto de la pantalla final; detrás de `GEN_VERSION >= 7`, de modo que v6 y el caso 1 conservan la fórmula de hoy (CL-R8); `test_accuse` actualizada con mutación (nuevo caso: acierto temprano con < 80 % = 1★). Los umbrales se remiden en CL-5 con el bot (partida completa y acusación temprana).
**DECIDIDO el 25 oct (cp. 200): el usuario elige A.** Queda el subpaso 3 (objetivos como guía y medición de la duración) y la aprobación del diseño completo.

## 13. CL-2 · subpaso 3 de 3 · objetivos como guía y medición de la duración (propuesta de Claude, 25 oct, cp. 201, LOW; pendiente de la aprobación del diseño)
### 13.1 CORRECCIÓN DEL USUARIO (25 oct, cp. 202 y 203): v7 NO tiene capítulos, pero SÍ una guía de objetivos
**El usuario aclara que ya había dicho que los capítulos no iban a estar.** Esto sustituye a «capítulos como guía» (propuesta de Claude, cp. 179 y 201; nunca fue decisión suya): los puntos 1, 4 y 5 de abajo quedan **SUPERADOS**; el punto 3 (pista «acusad») sigue con la corrección de abajo; lo demás del diseño (§10-§13.3) está aprobado.
**Qué significa (propuesta de Claude para CL-4, a revisar con el usuario):**
1. **Los casos v7 no llevan capítulos:** ni «Cap. N · título», ni tarjetas de cambio de capítulo, ni «Continuar caso · cap. N», ni objetivos agrupados por capítulo. La tarjeta de inicio del caso se conserva.
2. **La GUÍA, versión SIMPLE (elegida por el usuario el 25 oct, cp. 204; la de cinco líneas del cp. 203 queda descartada):** una lista corta, visible desde el principio, que **usa los mismos nombres y estados que los huecos de Acusar** (así guía y Acusar son un solo sistema) y **no bloquea nada**:
   - **¿Quién fue?** siempre disponible, sin estado (no hay candado, §11).
   - **¿Por qué?** (Normal y Difícil): «sin pistas» → «ya tienes pistas» (= el hueco de Acusar se ha abierto).
   - **¿Cómo lo hizo?** (solo Difícil): igual.
   - **Busca pistas:** barra de progreso hasta el 60 % de las pistas físicas.
   Fácil: solo «¿Quién fue?» y «Busca pistas». **Desaparecen «Habla con todos» y «Acusa»** (las pistas de ayuda ya empujan a hablar y el botón de Acusar ya está). Sin «Cap. N» ni tarjetas de etapa. Siguen orientando los 🔒 de Acusar con «falta la pista de…» (§10-§11), las pistas de ayuda de Fácil y Normal y la pista «acusad» (razones verdaderas del nivel + ≥ 60 % de las pistas físicas).
3. **Datos y validador (v7):** no se exige ningún capítulo (los objetivos de la guía van en una lista plana, sin agrupar) ni `case_closed` en el último (la bandera `case_closed` se sigue poniendo al acertar). Todo cerrojo `chapterMin` (puertas, lupa, charlas grabadas) pasa a dependencia real (CL-R2); la colocación de personajes por capítulo pasa a dependencia o franjas de tiempo.
4. **Motor:** conserva capítulos solo para v6 y el caso 1 (P17), hasta Z0. CL-4 sube de tamaño: esquema, validador, bot, compañero IA, pantalla y tarjetas se tocan para v7; sigue MEDIUM, pero se puede dividir en dos subpasos si hace falta (se decide en CL-4).
**Texto anterior de §13.1 (SUPERADO salvo el punto 3):** objetivos como guía (CL-R6).
**Hoy (CL-1 §A):** 3 capítulos fijos en el generador: «Pistas» (≥ 60 % de las pistas físicas) · «Interrogatorio» (hablar con todos, testigos, charlas grabadas en v7) · «Acusar» (objetivo con la bandera `case_closed`). El capítulo avanza solo al cumplir todos sus objetivos (`checkAdvance()`), y de él cuelgan cerrojos reales (puertas con `locked.chapterMin`, lupa y charlas grabadas con `chapterMin: 2`, colocación de personajes por capítulo, pista «acusad» solo en el último, bot y compañero IA que esperan).
**Propuesta (v7; v6 y caso 1 sin tocar):**
1. **Se conservan los tres capítulos y sus objetivos como GUÍA**, con el mismo avance por progreso y las mismas tarjetas, para no tocar esquema, validador ni pantalla. **Pero no abren ni cierran nada:** ningún objeto, puerta, personaje ni la pantalla Acusar depende del capítulo; cada cerrojo se sustituye por una dependencia real (CL-R2), uno a uno en CL-4 (lista en el informe CL-1 §A.7).
2. **Lo que explica por qué no se puede acusar ya no son los capítulos, sino los 🔒 de ¿Por qué? y ¿Cómo lo hizo?** (§11), con su texto «falta la pista de…». La guía solo orienta.
3. **Pista de ayuda «acusad»** («Creo que ya tenemos suficiente…»): una sola vez, cuando se tienen **las pistas de las razones verdaderas del nivel** (§10) **y** se ha cumplido el objetivo «Busca pistas» (≥ 60 % de las pistas físicas). Misma regla en los tres niveles; no obliga ni bloquea; sin la segunda condición saldría en el minuto 0,4-4 (CL-1) y sería prematura. Sigue sin haber pistas de ayuda en Difícil (`hintFirst: Infinity`, «sin ayudas»; a confirmar en CL-3).
4. **Colocación de personajes por capítulo** (charla de rincón en el cap. 2): pasa a depender de la dependencia o de franjas de tiempo, nunca del capítulo; se concreta en CL-4 con el bot.
5. **`case_closed` en el último capítulo** se mantiene (es la guía «Acusa»); el aviso del validador no cambia.
### 13.2 Medición de la duración (P16, CL-5)
1. **Cifra OFICIAL:** el bot juega la partida **COMPLETA** (todas las pistas alcanzables, tras lo cual acusa), en minutos humanos (segundos × 1,7 / 60, igual que `bot_masa`). Rangos provisionales: Fácil 20-28 · Normal 28-36 · Difícil 36-45, tope 45. Hoy se exige no pasarse del tope e informar cuántos casos quedan bajo el mínimo; **subir el contenido hasta el mínimo del nivel es decisión de CL-5** (v7 medido en cp. 192-193: Fácil 22,3-27,2 · Normal 25,0-31,6 · Difícil 28,8-34,6).
2. **Cifra INFORMATIVA «acusación temprana»:** el bot acusa en cuanto tiene las razones del nivel (cifras de CL-1, remedidas en CL-3 porque el culpable ya no cuenta, §11). Solo informa; nunca falla una prueba.
3. **La duración sale del contenido:** el generador ya rellena hasta la meta de tiempo del nivel (cp. 192); CL-5 ajusta charlas, pistas y engaños con esa palanca, sin «tiempo mínimo forzado».
4. **Equilibrio sin capítulos (CL-R7):** EQ-1 (40-60 %) sobre el caso entero, como ya está en v7. **EQ-7** (esperas): se conserva el umbral de 240 s y «≥ 1 acción propia por caso», medidos sobre el tiempo corrido de la partida completa, sin dividir por capítulos. **EQ-2 y la definición de «completo» (Z1):** «ambos detectives con trabajo en cada tercio del tiempo de la partida completa» en lugar de «en los 3 capítulos».
5. **Calidad (`src/quality.js`):** los avisos `capitulo_largo`/`capitulo_corto` pasan a medirse por tercios del tiempo de la partida completa y solo informan.
### 13.3 Resumen del diseño CL-2 para APROBAR (§10-§13)
| Tema | Decisión |
|---|---|
| ¿Quién fue? | Sin candado; lista de sospechosos siempre abierta (§11) |
| ¿Por qué? / ¿Cómo lo hizo? | Se abren con ≥ 1 pista de ese tema (Normal y Difícil / Difícil) (§11) |
| Qué pide cada nivel | Fácil culpable · Normal culpable y motivo · Difícil culpable, motivo y método; «Pruebas clave» desaparece |
| Acusar | En cualquier momento; 1 pista por razón (P22); sin testimonio obligatorio (P23); intentos 3 / 2 / 1 y descuentos de hoy (P14) |
| Estrellas | ★ resolver · ★★ ≥ 80 % de pistas · ★★★ + sin fallos y dentro del par (A, §12); recompensa ×1 / ×1,25 / ×1,5 |
| Capítulos y guía | **Sin capítulos en v7**; **sí una guía simple que refleja los huecos de Acusar (¿Quién fue? · ¿Por qué? · ¿Cómo lo hizo? · Busca pistas), sin cerrojos** (corrección del usuario, cp. 202-204); pista «acusad» con razones verdaderas + ≥ 60 % de pistas físicas (§13.1) |
| Duración | Oficial = partida completa del bot; temprana = informativa; EQ-7 y EQ-2 sin capítulos (§13.2) |
| Caso 1 y v6 | Idénticos hasta Z0; todo detrás de `GEN_VERSION >= 7` |
**APROBADO por el usuario el 25 oct (cp. 202)** con la corrección de §13.1 (sin capítulos). El siguiente paso oficial es CL-3 (MEDIUM): acusar por razones.
