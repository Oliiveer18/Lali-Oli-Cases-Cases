# MEJORAS TRAS LA PRUEBA DEL USUARIO (21 oct, v0.7.51) · SOLO DOCUMENTACIÓN, sin cambios de código
Fuente: el usuario jugó `G5-2djn` (Fácil) y `G5-hhd6` (Normal) en iPhone 14 y dejó 8 fallos + 5 observaciones. Aquí queda todo confirmado por él y cómo entra en el roadmap (ver `ROADMAP.md` §4.0).

## A. Los 8 fallos (confirmados por el usuario)
| # | Fallo | Paquete |
|---|---|---|
| 1 | Menú de charla con el aliado (Agente Rey): lista muy larga; en móvil solo se lee desde «algún consejo» hacia abajo, lo de arriba queda cortado | FIX-6a · **CERRADO (v0.7.52)** |
| 2 | Acusar, elegir motivo: el texto del motivo se solapa con las 2 palabras «sin pistas» y se sale del recuadro | FIX-6a · **CERRADO (v0.7.52)** |
| 3 | Nombres de las pruebas en el menú se salen de su recuadro | FIX-6a · **CERRADO (v0.7.52)** |
| 4 | Falta contexto de cada caso: una intro breve (qué pasó y qué hay que hacer) | INTRO-1 · **CERRADO (v0.7.55)** |
| 5 | Lista de sospechosos: nombre y descripción se pisan cuando son algo más largos (solo en algunos casos) | FIX-6a · **CERRADO (v0.7.52); arreglado en código (checkpoint 68) y VIGILADO por pruebas (checkpoint 69: `test_sospechosos.js` con mutación + `accuse_browser_test` como FALLO); falta cierre de versión. Medido antes (checkpoint 67):** el nombre de 2 líneas pisa la descripción en ~9 % de las tarjetas (13,5 % con 6 sospechosos) |
| 6 | A veces el táctil deja de mover al personaje unos segundos (el usuario duda si es su móvil) | FIX-6c · **CERRADO el 21 oct (checkpoint 83, v0.7.54)**; causa real encontrada: dedo apoyado durante un diálogo/transición no cogía el stick; falta confirmarlo en iPhone real |
| 7 | Enseñar una prueba: hoy se muestra al tocarla, sin tiempo de leer. Quiere seleccionarla, ver su información y pulsar un botón «Mostrar prueba» | FIX-6b · **CERRADO el 21 oct (checkpoint 78, v0.7.53)** |
| 8 | Acusación fallida: lo fallado (persona + «cómo» + «por qué» elegidos) debe verse DENTRO de la pantalla/pestaña de Acusar al ir a acusar de nuevo (decisión del usuario: no una lista aparte) | FIX-6b · **CERRADO el 21 oct (checkpoint 78, v0.7.53)** |

## B. Respuestas a las 8 preguntas (pruebas 1 y 2 juntas)
Objetivo poco claro (falta contexto) · casi nunca se aburrió · entendió la mayoría de pistas · no se atascó; en la prueba 2 agotó los intentos de acusar (acusó por lógica y falló) · duró 10-15 min porque se aceleró y cree que en Normal podría durar más · le hicieron gracia la mayoría de los textos que debían · el compañero IA ayudó casi nada (una vez) · acusó por lógica.

## C. Decisiones de diseño (21 oct)
| # | Tema | Decisión del usuario |
|---|---|---|
| 3 | Compañero IA | **Pistas propias**: la IA usa SU herramienta por iniciativa y avisa con humor de lo que encuentra |
| 4 | Herramientas | Pide la opción que más convenga. **Recomendación de Claude (CONFIRMADA el 21 oct, REVISADA el 22 oct: ver `EQUILIBRIO_Y_COMPLETITUD.md`; el reparto 68/32 obliga a dar más trabajo a Lali):** cada pista exige UNA herramienta concreta, repartidas ~25 % (lupa, ganzúa, UV, grabadora) + cartel breve la primera vez; Oli = lupa y ganzúa, Lali = UV y grabadora (≈ la mitad de las pistas son de Lali; en solitario las hace la IA o el jugador pulsa «Detective» para cambiar) |
| 5 | Duración Normal | **Más pistas y salas** (sin relleno artificial) hasta el rango provisional 28-36 min |
Observación: en las 2 pruebas usó la lupa ~80 % del tiempo; no sabe para qué sirven ganzúa y grabadora; la linterna la usó 1 vez.

## D. Datos del código que apoyan las decisiones (leídos el 21 oct)
- `src/logic.js` líneas 9-18: Oli (`rex`) lleva `['lupa','ganzua']`; Lali (`luna`) lleva `['uv','grabadora']`. En solitario el jugador es Oli por defecto, por eso casi solo usa la lupa.
- Existe el botón «Detective» (cambiar de personaje) solo en 1 jugador (`play.js` ~706).
- Tiempos de acción: lupa 1,3 s · ganzúa 2,0 s · UV 1,0 s · grabadora 3,0 s (hay que quedarse quieto cerca).
- Hoy el compilador pone herramientas en «huecos» de plantilla (4C-1b) y la mayoría de pistas se examinan con la lupa; ganzúa y UV aparecen solo en ~1 pista por mecánica, y la grabadora casi no tiene uso.

## E. Dato que hace falta del usuario para FIX-6c (táctil)
Cuando el personaje no se movía: ¿era justo después de cerrar un diálogo o pulsar ACCIÓN? ¿tenías otro dedo en un botón? ¿pasó más en el caso online o en solitario? (opcional; si no lo recuerda, se reproduce con toques reales automáticos).
**RESPUESTA (21 oct):** pasaba en cualquier momento, sin patrón. Se reproduce con toques automáticos (FIX-6c).

## F. Orden de ejecución
Ver `ROADMAP.md` §4.0 (2.ª versión del 21 oct): bloque A (FIX-6a+6b, FIX-6c, INTRO-1, HERR-1, IA-1, P1), bloque B hasta el HITO 1, tandas C1-C3 con prueba entre una y otra, HITO 2.

## G. Estado al final del checkpoint 69 (21 oct)
**CERRADOS (21 oct, checkpoint 73, v0.7.52): fallos 1, 2, 3 y 5 (FIX-6a CERRADO).** Arreglados en código, con pruebas y capturas revisadas a ojo (`docs/capturas_fix6a/`). Los dos pendientes anotados para FIX-6b (flechas ▲▼ vs «ya mostrada»/«sin pistas»; rótulo «¿Qué prueba le enseñas?» fuera de pantalla) quedaron HECHOS el 21 oct (checkpoint 74, `docs/capturas_fix6b/`). **Fallo 7 (Mostrar prueba): HECHO el 21 oct (checkpoint 75). Fallo 8 (lo fallado visible en Acusar): HECHO el 21 oct (checkpoint 76).** **FIX-6b CERRADO el 21 oct (checkpoint 78, v0.7.53).** Queda el fallo 6 (táctil) en A2 FIX-6c.
Checkpoint 70 (revisión 2b a ojo): flechas ▲▼ sin tapar texto en las capturas, con riesgo si la fila del borde lleva texto a la derecha; con 19 pruebas el rótulo «¿Qué prueba le enseñas?» queda fuera de pantalla (candidato a FIX-6b); motivos reales de ≤ 2 líneas caben. Detalle en SESION.
