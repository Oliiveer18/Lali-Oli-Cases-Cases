# DECISIONES FINALES (29 oct, cp. 278) · resueltas por Claude por delegación del usuario («lo más equilibrado y profesional»)
Aquí NO se discute nada: es la respuesta oficial a toda pregunta que estuviera abierta. Si un doc antiguo dice «decidir», manda ESTE fichero. Cada decisión: qué, y por qué en una línea.

## A. Forma de trabajar (autorización general del usuario, 29 oct)
- **A1.** La IA final encadena los pasos de `docs/PASOS_IA.md` SIN pedir permiso entre ellos, hasta acabar o hasta quedarse sin contexto. (Antes: un subpaso por cuenta y permiso cada vez. Ya no rige.)
- **A2.** Un paso que falla 2 veces la misma prueba → se deshace con la copia de seguridad, se marca `BLOQUEADO` con 3 líneas de causa y se SIGUE con el siguiente paso que no dependa de él. Nunca se queda parada.
- **A3.** Los pasos «tú» (P1, P2, HITO 1, P3, HITO final, 6C, 7C, iPhone real, voces 7D) NO los hace la IA ni la bloquean: se apuntan en `docs/PENDIENTE_DE_PERSONA.md`. P1, P2, HITO 1 y P3 se dan por «no bloqueantes»: la receta avanza y los códigos de prueba se regeneran (ver B1).
- **A4.** Nada se recorta sin permiso, SALVO las dos palancas ya aprobadas: (a) escenarios: si el museo supera un techo de «caro» (ESCENARIOS §5.3 se CONFIRMA tal cual: ≤ 1 paquete MEDIUM, ≤ 30 sprites nuevos, ≥ 50 % de objetos reutilizados, 0 atascos en 5000 semillas), se aplica la palanca de 2 escenarios por temática y el resto queda en la lista «después del HITO»; (b) un paso `BLOQUEADO` (A2).
- **A5.** Modelo LOW/MEDIUM ya no se distingue: los pasos MEDIUM se parten en subpasos más pequeños (datos → código → pruebas → medición → cierre), guardando entre ellos.

- **A6.** (29 oct) El usuario NO quiere reabrir el chat: se trabaja en UNA sola pasada (`GUIA_IA_FINAL.md` §0): sin parar, sin preguntar, con ahorro de contexto, proyecto siempre entregable y salto de emergencia al cierre (F53, F57, F58) si el contexto se acaba.

- **A7.** (29 oct) La IA final es **Cursor con Composer 2.5** (modo Agente, con terminal y git). Deshacer = git; ZIP en `entregas/`; reglas siempre cargadas en `AGENTS.md` y `.cursor/rules/`; prompt de arranque en `docs/PROMPT_CURSOR.md`; puesta en marcha del usuario en `docs/CURSOR_PUESTA_EN_MARCHA.md`; recetas en `docs/RECETAS.md`.

## B. Receta y versión
- **B1.** `GEN_VERSION` 6→7 se hace YA (paso F02), sin esperar a P1. Los códigos `G6-…` pasan a `G7-…` en menú, HOJA_APUNTES y MP_GUION. La copia G6 se conserva en `docs/` como referencia. Es la ÚNICA subida antes del HITO final.
- **B2.** Cualquier paquete posterior que cambie lo que genera una semilla: regenerar códigos de prueba y anotarlo, SIN subir versión. Desde el HITO final la receta queda congelada.
- **B3.** `BASELINE.json` pasa a medir v7 al subir la versión (`node tools/baseline.js --write`, con la diferencia anotada).
- **B4.** (P3) En Fácil NO se ocultan sospechosos (`easyHidden` queda como está). Si algún texto de Fácil dice un número fijo de sospechosos que no se cumple, se reescribe el texto SIN número.
- **B5.** (P4) La puerta de calidad es REAL: `generateCase` reintenta (máx. 6 intentos, semilla derivada) hasta nota ≥ `QUALITY_MIN`; si ninguno llega, entrega el mejor y lo registra. Se hace en F53 (4D-3), no antes.
- **B6.** (P5) La duración se calibra solo con el bot y el contenido; no hace falta que el usuario cronometre. Sus tiempos reales (P2/HITO) se leen cuando juegue, pero no se esperan.
- **B7.** (P6) Las reglas de calidad provisionales (`shift` de perfiles, línea larga 220, coartadas excluidas de repetición) se dan por BUENAS.
- **B8.** (P20/R4) Tabla de rangos y pesos: para cada cifra del generador, mínimo = percentil 10 y máximo = percentil 90 de lo medido con ≥ 150 casos por nivel, redondeados; pesos = reparto medido, salvo situaciones macabras (fijo 25/50/25). Se anota en `docs/EQUILIBRIO_Y_COMPLETITUD.md`. Los límites DUROS siguen siendo solo: 0 atascos y techo 45 min.
- **B9.** (P21) Pistas libres: opción C. Se acepta el suelo actual y la meta pasa a «35-45 % por caso, mínimo 2 libres en Fácil». No se toca la receta por esto.
- **B10.** (c4-4 pendiente C) Los «engañosos» al 60 % de la receta CL-5a se dejan como están (rechazos 29 · 68 · 76 de 300 aceptables).
- **B11.** (HERR-2) El reparto objetivo por herramienta se mide como informe, no como bloqueo: ninguna herramienta abusiva (lupa baja; ganzúa, UV y grabadora suben) y todas con uso real en cada nivel.

## C. Pruebas y entorno
- **C1.** `ws` NO se declara en `package.json` (el usuario decidió el 21 oct no instalarla). Cuando falta, la prueba del relé cuenta como **SALTADA, no roja** (el log dice `SALTADO: falta el módulo ws`). Se arregla en F01 dentro de `tools/cierre.js`.
- **C2.** `vendor/peerjs.min.js`: SÍ se descarga (PeerJS 1.5.4 con `npm pack peerjs@1.5.4`, red permitida en npm) y se guarda en `vendor/`; se reconstruye y se pasan las pruebas online. Si alguna online falla, se deshace y se anota (F01).
- **C3.** `test_intro`: al subir a v7 se añade la mutación propia de la rama v7 de `caseBriefing` y la prueba audita también casos v7.
- **C4.** `test_uv_c4`: tras la subida a v7 se vuelve a medir UV señuelo Fácil/Difícil; si el margen es < 0,05 se sube N a 200, no se toca el motor.
- **C5.** Pruebas pesadas (`npm test` completo, ≥ 100 casos por nivel) solo al cerrar BLOQUE (F22, F36, F49, F53, F57). Entre medias: pruebas que vigilan lo tocado + 40 casos por nivel (decir la muestra).
- **C6.** Pruebas de navegador: se ejecutan si hay Chromium; si no, SALTADAS (nunca rojas).
- **C7.** Medición por temática (pedida en TIEMPOS-6): se hace UNA vez en F53, cuando ya existen las 6 temáticas.

## D. Contenido y variedad
- **D1.** Metas confirmadas: 15 escenarios (9 salas candidatas cada uno; Fácil 4 · Normal 5 · Difícil 6), curiosidades ≈ 400, charlas ≈ 300, nombres ≥ 100, manías y muletillas ≈ 40 de cada, historias base por temática 12-15. Si el tiempo no da, el orden de prioridad es el de PASOS_IA (lo último que se escribe es lo primero que se acorta, y se anota).
- **D2.** Los 4 escenarios por elegir (4H-4): **biblioteca, restaurante, balneario y estadio**. Razón: encajan con las 6 temáticas, reutilizan mucho arte (estanterías del museo, mesas de la panadería, taquillas, gradas) y evitan lo caro o delicado (hospital, crucero, aeropuerto). Quedan en reserva: hospital, crucero, universidad, aeropuerto.
- **D2b.** Tabla de los 15 escenarios (cada temática 5, cada escenario sirve a 2): robo = panadería, museo, mercado, estación, estadio · sabotaje = teatro, cine, parque, restaurante, balneario · desaparecido = granja, parque, mercado, hotel, estación · concurso = panadería, circo, granja, restaurante, estadio · impostor = mansión, circo, cine, hotel, biblioteca · sobrenatural = museo, mansión, teatro, biblioteca, balneario. Nuevos y su orden: hotel y estación (4H-3), biblioteca, restaurante, balneario y estadio (4H-4). Si la palanca de recorte (A4) quita escenarios, cada temática conserva ≥ 3.
- **D3.** Los 5 ejes de variedad E1-E5 (`VARIEDAD.md` §3) se APRUEBAN. E4 (identidad compuesta) vive en 4P. 4F-0c y 4F-0d se HACEN (el usuario quiere el juego completo); si bloquean, aplica A2.
- **D4.** Las «~10 frases sueltas a aprobar» tras cada 4G se sustituyen por: linter 4V-2 en verde + una hoja `docs/MUESTRA_FRASES.md` que se regenera al final para que el usuario la lea cuando quiera. No bloquea.
- **D5.** Los defectos de `MUESTRA_AMBIENTES.md` y de la lista de defectos (género del noir macabro, «Soy muy correcto con los difuntos») se arreglan en 4G-1; `calle_plaza` (baldosa 16,8) en 4H-0; `G.findPath` con varias baldosas candidatas en 6B.
- **D6.** 4F-0f (Despacho como escena de robo) queda OPCIONAL: solo se hace si todo lo demás está cerrado (paso F56b). El Despacho ya aporta pistas de motivo y dinero.
- **D7.** NO hay prueba intermedia P1.5 tras 4F-4 (el usuario no quiere mini-pruebas extra).
- **D8.** Coleccionables (13): se hacen (F44). 7D voces habladas: FUERA de esta pasada (el usuario las dejó para el final de todo).
- **D9.** `CL-5c-c 3/4` y el bloque IA (H47b-e) se hacen en la parte final (F50-F52), como pidió el usuario.
- **D10.** Z0 (caso 1 oficial): la IA construye el caso 1 NUEVO con el generador (mejor semilla Normal, nota ≥ 85) y lo deja como `caso_1_v2`; el caso 1 antiguo NO se borra ni se toca. Qué es «el principal» lo elige el usuario en el HITO final (por defecto sigue el antiguo).

## E. Reglas de caso libre y acusación (ya cerradas, solo por si acaso)
- Todo lo de P12-P18, P22, P23 está RESPONDIDO en `PREGUNTAS_PENDIENTES.md` (histórico) y en `CASO_LIBRE_Y_ACUSACION.md` §11-12. FIX-3: (a) al fallar del todo se PIERDEN las monedas halladas (P1); (b) rumor falso solo «sin pruebas» (P2). P8: el botón «Cargar código de caso» se CONSERVA (sirve para repetir y compartir casos).
