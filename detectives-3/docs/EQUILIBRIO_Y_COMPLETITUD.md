# EQUILIBRIO OLI/LALI Y DEFINICIÓN DE «JUEGO COMPLETO»
Creado el 22 oct (checkpoint 89, solo documentación, sin código). Fuente de verdad del **equilibrio entre los dos detectives** y de **qué significa «terminado»** al cerrar el roadmap. Lo leen A4, A5, P1, cada paquete de contenido y Z1. Medición: `node tools/reparto_herramientas.js [N]` (checkpoint 88).

## 1. Decisión del usuario (22 oct)
Oli lleva demasiado trabajo con herramienta (**68 % frente a 32 % de Lali**; 78/22 en tiempo) y hay que **nivelar el juego entero**, no solo ese número, y dejarlo **completo en todos los sentidos al acabar oficialmente el roadmap**. Para igualar, **Lali gana trabajo; Oli no pierde**. El dueño de cada herramienta no cambia (Oli = lupa y ganzúa; Lali = UV y grabadora) salvo que el usuario pida lo contrario antes de A4 2/4.

## 2. Punto de partida medido (300 casos generados, 22 oct)
| Medida | Hoy | Meta |
|---|---|---|
| Trabajo con herramienta Oli/Lali (número) | 68/32 | 40-60 por detective, por caso |
| Ídem en tiempo (segundos) | 78/22 | 40-60 |
| Casos fuera de 40-60 | 87 % | 0 % (el revisor rechaza) |
| Herramientas: lupa/ganzúa/UV/**grabadora** | 34/34/32/**0** % | cada una ≥ 1 pista en ≥ 80 % de los casos; ninguna > 40 % |
| Trabajo con herramienta en cap. 2 y 3 | 0 | trabajo para los dos en los 3 capítulos |
| Carteles de pista dichos por Oli | 96 % | ningún detective > 60 % |
| Pasos con herramienta por caso | ~1,7 (+0,5 coop) | los que pidan los 4 tipos de deducción (se fija en A4 3/4) |
| Pistas de sostén sin herramienta (denominador EQ-6, medido 22 oct en 300 casos) | **86 % libres** (2 % sigilo, 12 % con herramienta; ~8,0 pistas de sostén por caso, ~0,9 con herramienta) | ~25 % libres (≈ 75 % con herramienta, ≈ 6 por caso) |
| Caso 1 (reservado) | Oli 8 pasos/Lali 3 (≈ 73/27) | **no se toca hasta Z0**; se informa. Decidido (22 oct): se REHACE al final del proyecto (Z0), incluido su reparto Oli/Lali |

## 3. Reglas de equilibrio (EQ) — las cumple TODO paquete que añada pistas, escenas o temáticas
- **EQ-1 Reparto 40-60 %** del trabajo con herramienta por detective, en **número y en tiempo**, por caso y **por capítulo**. Lo comprueba el revisor (rechaza el caso). Es red de seguridad; el diseño busca 50/50 por construcción (EQ-3). **Cambio decidido el 24 oct (cp. 177, aún sin código; solo `GEN_VERSION >= 7`):** el reparto se exige sobre el caso entero (número y tiempo) y NO se empareja ningún paso (nada de «una lupa de Oli por cada charla de Lali»); por capítulo solo si es muy exagerado (CP. 178: sin porcentaje por capítulo; lo «muy exagerado» lo vigila EQ-7, la espera máxima). v6 conserva el EQ-1 por caso y por capítulo.
- **EQ-2 Los tres capítulos dan trabajo a los dos.** Cap. 1 (Pistas): herramientas. Cap. 2 (Interrogatorio): la grabadora escucha charlas/testigos y refuta mentiras (Lali) mientras Oli lleva acceso y presión; «Mostrar prueba» y charlas alternan quién actúa. Cap. 3 (Acusar): decisión compartida (cómo se mide la participación se define en A4 3/4; no hay herramienta en Acusar). **Cambio decidido el 24 oct (cp. 179, aún sin código): el caso deja de depender de capítulos como cerrojo (paquete CL); EQ-2 pasa a «trabajo para los dos a lo largo de todo el caso» (por tramos de la partida), con los capítulos como simple guía. Ver `docs/CASO_LIBRE_Y_ACUSACION.md` §6.**
- **EQ-3 Cadenas de dos pasos** (Oli abre con ganzúa, Lali lee con UV/graba) en ~1/3 de las pistas con herramienta: da un paso a cada detective y obliga a cooperar.
- **EQ-4 Voz alternada:** los carteles de pista sin herramienta, charlas, curiosidades, situaciones y epílogos reparten la voz; ningún detective dice > 60 % (`who` solo decide retrato y voz; el motor guarda aparte quién la hizo, `by`).
- **EQ-5 Cada herramienta lleva a una deducción distinta:** lupa → «cómo»; ganzúa → acceso y oportunidad; UV → «por qué»; grabadora → «quién» y refutar mentiras (`lies`). Ninguna sobra ni se sustituye por otra. La grabadora usa el campo `listen` (puntos donde dos personajes charlan); si no encaja en las plantillas de sala, se sustituye por una **cámara** (comparar la sala antes y después).
- **EQ-6 ~25 % de pistas sin herramienta** (decisión del usuario; excepción a «cada pista exige una»), contado sobre **las pistas de sostén** = pistas de la biblia con objeto (`source.type` prop) y `role` prueba, descarte o refuta (las que cuentan para Acusar); NO entran curiosidades, situaciones, señuelos (`falsa`) ni las que cuenta un personaje (se informan aparte). Fijado en A4 3/4-a (22 oct); medido hoy: 86 % libres. Son la parte flexible: las puede hacer cualquiera.
- **EQ-7 Sin tiempos muertos ni dependencia de un solo jugador:** en solitario la IA cubre al otro con iniciativa propia (A5) y el jugador puede cambiar con «Detective»; en online cada móvil lleva su rol y ninguno espera sin nada propio que hacer durante un capítulo entero (**umbral fijado en A4 4/4-4, 23 oct: ningún detective espera más de 240 s seguidos sin nada propio ni compartido y los dos tienen al menos una acción propia en el caso**; definición en `G.idleOf`/`G.idleIssues`/`G.IDLE`, `src/logic.js`; medida con `node tools/tiempo_muerto.js [N]`; prueba `test_tiempo_muerto.js`).
- **EQ-8 «Necesita: …» visible** cuando falta la herramienta, cartel breve la primera vez que se usa cada una, y mensaje claro cuando la herramienta la tiene el otro («¡Eso es trabajo para Lali!»).
- **EQ-9 Medir siempre:** cada paquete que toque pistas, salas o temáticas ejecuta `tools/reparto_herramientas.js` y apunta el reparto en su cierre; las pruebas de calidad se informan por nivel (regla 7 de SESION).

## 4. Dónde se cumple cada regla (en orden del roadmap)
| Paso | Qué hace por el equilibrio |
|---|---|
| **A4 1/4** (HECHO) | Medir y fijar reglas (este documento) |
| **A4 2/4** (HECHO, checkpoint 90) | Mecánica de la grabadora (EQ-5, EQ-2): `listen` + `chat`, charlas en puntos del mapa; encaja en las 16 plantillas, sin cámara |
| **A4 3/4** | Generador: cadenas de 2 pasos (EQ-3), ~25 % libres (EQ-6), voz alternada (EQ-4), trabajo en cap. 2 (EQ-2), cartel de primer uso y «Necesita» (EQ-8). **`GEN_VERSION` 5→6: parar y avisar antes.** Textos con humor |
| **A4 4/4** | Revisor (rechaza fuera de 40-60 y herramientas sin uso: EQ-1, EQ-5), bot, medidor, informe de reparto, `test_` nuevo con mutación; umbral de EQ-7 |
| **A5 IA-1 ✅ (23 oct)** | EQ-7 en solitario: la IA va a las pistas de SU herramienta con iniciativa y avisa con humor; nunca resuelve el caso |
| **P1** | Hoja corta con 2 preguntas nuevas: «¿se sintió igual de útil cada detective?» y «¿alguna herramienta sobró o faltó?» |
| **B1-B2 (4F-0a/0b/0e)** | Más salas y duración: el reparto 40-60 debe seguir cumpliéndose con 4-6 salas; medir antes y después |
| **B4 (4H-0 museo)**, **B5 (4T-1)**, **B6 (4T-2)** | Cada escenario/temática nueva: huecos de herramienta en sus plantillas para las 4 herramientas, cadenas y voz alternada; informe de reparto en el cierre |
| **B7 (4E-2)** / **H1 HITO 1** | H1: el usuario y su pareja dicen si el reparto se siente justo en online con dos móviles |
| **C1 (4F-1…4F-4)** | Señuelos, pistas cruzadas, testigos que cambian y giros deben repartir su trabajo entre los dos (las pistas cruzadas son cadenas por naturaleza) |
| **C2 (4H-1, 4T-3…5, 4F-0c/0d)** | Cada paquete de contenido cumple EQ-1…EQ-9 antes de añadir su entrada al menú |
| **C3 (4H-2, 4G-1…6, 4D-3)** | Objeto estrella, secretos y epílogo con voz alternada; 4D-3 calibra con el reparto en 10 000 semillas y recalibra el medidor |
| **D (5A, 5B, 5C, 6A-6C, 7A-7C)** | 5A: los 2 esquemas nuevos respetan EQ; 6B: 10 000 semillas incluyen el informe de reparto; 7A tutorial enseña las 4 herramientas y los dos roles |
| **Z1 (final)** | Auditoría de equilibrio y completitud (ver §5) |

## 5. Definición de «juego completo» (lo que debe ser verdad al cerrar el roadmap = Z1)
**Contenido:** 6 temáticas (Robo, Sabotaje, Desaparecido, Concurso amañado, Impostor, ¿Sobrenatural?) con Aleatorio y Mezclado; escenarios del plan (9, o los que queden tras la palanca de recorte decidida en 4H-0) con 4-6 salas por caso; 3 dificultades con rangos de duración (Fácil 20-28 · Normal 28-36 · Difícil 36-45 min, techo 45 (provisionales)); engañosos 0-3; escenas con policías; ambiente claro/inquietante/macabro con humor negro ligero.
**Equilibrio:** EQ-1…EQ-9 verdaderos en 10 000 semillas, por nivel y por temática; las 4 herramientas con uso real; ambos detectives con trabajo a lo largo de todo el caso (cp. 179: los capítulos pasan a guía; ver `docs/CASO_LIBRE_Y_ACUSACION.md` §6); solitario (IA con iniciativa) y online jugables sin ventajas de rol.
**Calidad (por nivel, siempre informada por separado):** nota > 80, jugabilidad ≥ 50, ≥ 20 min, 0 atascos del bot, casos únicos (huella), 100 % aceptados por el revisor.
**Producto:** botón «Caso nuevo» y pantalla Crear caso (Temática/Aleatorio/Mezclado + Dificultad), informe del caso, tutorial, créditos, memoria de partidas, caso 1 intacto, textos que caben en iPhone (también «Texto grande»), táctil sin bloqueos, online por internet con dos móviles reales (datos móviles distintos) repetido, alojamiento definitivo.
**Pruebas y pruebas tuyas:** `npm test` completo en verde (salvo lo saltado a propósito y anotado), HITO 1 y HITO 2 jugados por el usuario con su pareja, P1/P2/P3 cerradas con su lista de fallos resuelta, pruebas en varios iPhone/Android (7C).
**Documentación:** maestro, ROADMAP, LEEME y CHECKLIST sin filas pendientes; informe final de reparto y de calidad por nivel y temática.

## 6. Decisiones abiertas (resolver DENTRO del paso indicado, sin bloquear)
1. ~~Denominador exacto del ~25 % libre~~ **RESUELTA (A4 3/4-a, 22 oct):** pistas de sostén (objeto con role prueba/descarte/refuta; ver EQ-6), medidas con `node tools/reparto_herramientas.js [N]`. **Consecuencia a decidir en 3/4-b:** llegar a ~25 % libre exige pasar de ~0,9 a ~6 pistas de sostén con herramienta por caso (afecta a duración y reparto); si resulta inviable, ajustar la meta y avisar (decisión 6).
2. Cómo se mide la participación en Interrogatorio (cap. 2) y Acusar (cap. 3) → A4 3/4 (la grabadora ya puede dar trabajo en el cap. 2 con `chapterMin: 2` en el punto de escucha).
3. ~~Dónde escucha la grabadora~~ **RESUELTA (A4 2/4):** en un «rincón de charla» por plantilla (`template.listen`: personajes a y b juntos, zona de escucha 2×1 debajo, hueco para el detective); encaja en las 16 (`node tools/escucha_plantillas.js`). Quién charla (dos personajes presentes a la vez en esa sala) lo decide el generador en A4 3/4; el validador ya exige que coincidan.
4. ~~Umbral de tiempo muerto de EQ-7~~ **RESUELTA (A4 4/4-4, 23 oct):** 240 s de espera seguida (medido con el bot, 300 casos por nivel: máx. Fácil 190 s · Normal 215 s · Difícil 103 s; mediana 22-60 s) y ≥ 1 acción propia en el caso. Es una cota PESIMISTA (el bot es un solo andarín y la voz de una pista libre es cosmética). Se juzgan los capítulos con trabajo con herramienta (hoy 1 y 2). El trabajo con herramienta del cap. 1 es opcional para avanzar, por eso «propia» se exige en el caso entero. Solo se mide: el revisor no lo exige todavía.
5. ~~¿Equilibrar el caso 1 (≈ 73/27)?~~ **Decidido (22 oct): se rehace entero al final (Z0), con el equilibrio incluido.**
6. Porcentajes finales: si alguno resulta inviable al medir, se ajusta y se avisa.

## Actualización A4 3/4-b1 (22 oct, checkpoint 97)
Medido con 300 casos (semillas i*7919+1; informe completo en `docs/INFORME_REPARTO_B1.txt`): **VOZ** de las pistas libres 1 788 Oli / 1 794 Lali (**50/50; antes de b1 100 % Oli**); situaciones 55 % Oli (antes 100 %); pistas con herramienta 68 % Oli (siguen con su dueño); curiosidades 52 % Oli. Trabajo obligado Oli/Lali (con la charla grabada, que es de Lali, en 124 casos de 300): **55/45 en número, 43/57 en tiempo**; 278 de 300 casos siguen fuera de 40-60 en algún eje (decisión: lo ataca b2, receta nueva con `GEN_VERSION` 6). EQ-8 (cartel de primer uso) HECHO. Pistas de sostén libres siguen en ~86 % (meta ~25 %: b2).

b2 paso 3 (22 oct, `GEN_VERSION` 6; informe `docs/INFORME_REPARTO_B2_PASO3.txt`, 300 casos): trabajo obligado Oli/Lali **51/49 en número, 38/62 en tiempo** (las charlas grabadas de Lali pesan ~4,8 s); 300 de 300 casos fuera de 40-60 en algún eje (el tiempo de Lali sobra por las charlas: lo ajusta el paso 4). Pistas de sostén: 72 % libres, 2 % con sigilo, 27 % con herramienta (lupa 77, ganzúa 156, UV 139, grabadora 262) frente a la meta ~25 % libres. Voz de pistas libres 51 % Oli. El cap. 1 usa herramientas desde el principio; el cap. 2 es solo de Lali (grabadora).

## Actualización A4 4/4-1 (22 oct, checkpoint 125)
**Definición única de EQ-1** (código: `G.workShare` y `G.workIssues` en `src/logic.js`; la usan el revisor, el informe y las pruebas): trabajo = pasos de objeto con herramienta y puertas con herramienta (dueño por `G.toolOwner`); mide número y segundos base (`G.stepBaseSeconds`); capítulo = `chapterMin` del objeto (1 si falta) o `locked.chapterMin` de la puerta; los pasos `coop` (empujar entre los dos) NO cuentan y se informan aparte; un capítulo sin trabajo con herramienta no se juzga (hoy el cap. 3 no tiene herramientas; su participación sigue pendiente de definir); bordes 40 y 60 incluidos. Medición: `node tools/reparto_herramientas.js [N]` (bloque EQ-1). Prueba: `node test_reparto.js` (8 mutaciones).
**Estado FINAL tras A4 4/4 (23 oct, 300 casos, `GEN_VERSION` 6; `docs/INFORME_REPARTO_A4_4de4.txt`):** cumplen EQ-1 300 de 300 (100 %); Oli 50 % en número y 46 % en tiempo (mediana); cap. 1 y cap. 2 sin ningún caso fuera de banda; pistas libres 51 % Oli / 49 % Lali; EQ-7: 0 incumplimientos en 900 casos (3 niveles). Lo de abajo es el punto de partida de A4 4/4-1, ya superado.
**Estado medido en A4 4/4-1 (120 casos, `GEN_VERSION` 6):** 0 % de los casos cumple EQ-1: caso entero Oli 50 % en número y 36 % en tiempo (mediana); cap. 1 Oli 2 pasos contra Lali 1 (67/33 en número); cap. 2 solo Lali (charla grabada). El subpaso 4/4-2 construye el equilibrio en el generador; el revisor (4/4-3) lo exige después.

## 7. Actualización CASO LIBRE (24 oct, checkpoint 179, SOLO documentación)
Decisión del usuario: el caso deja de tener fases como cerrojo y se puede acusar en cualquier momento, siempre que se hayan desbloqueado las razones que pide la dificultad (Fácil = culpable · Normal = culpable y motivo · Difícil = culpable, motivo y método). La duración sale del contenido, no de las fases. Paquete **CL** (ROADMAP §4.0-bis y §4.3 fila 21e). Qué cambia en el equilibrio, **todo con `GEN_VERSION >= 7` y sin código todavía**:
- **EQ-1** ya se mide solo sobre el caso entero (cp. 177-178) y sin parejas de pasos. Sin cambios más.
- **EQ-2** se reformula (arriba): trabajo para los dos a lo largo de todo el caso, no por capítulo.
- **EQ-7** (esperas): hoy se juzga por capítulo (`G.idleOf`, `G.idleIssues`); en CL-4 pasa a medirse sin capítulos (tramos de tiempo o dependencias). Se conservan el umbral de 240 s y «≥ 1 acción propia por caso» hasta que CL-4 diga otra cosa. La comprobación de EQ-7 en v7 que falta en c3 se hace con el criterio de hoy.
- **Z1 / definición de «completo» (§5):** «ambos detectives con trabajo en los 3 capítulos» ya está sustituido por «a lo largo de todo el caso».
- **Caso 1:** sigue con capítulos (usa `chapterMin`) y reservado hasta Z0; ese caso se rehace con el equilibrio y el formato nuevos.
Detalle, riesgos y plan: `docs/CASO_LIBRE_Y_ACUSACION.md`.
