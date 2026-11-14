# CHECKLIST MAESTRO · Lali & Oli Cases
Lista anti-olvido (creada el 19 oct, checkpoint 16). **Cada paso tacha lo suyo** cambiando `[ ]` por `[x]` y regenera el ZIP. Fuente de las filas: `docs/ROADMAP.md` (tabla oficial); si difieren, manda ROADMAP. **Desde el 24 oct el ORDEN de ejecución es el de la sección H (= ROADMAP §4.0-bis).** Al cerrar un paquete se contrasta con `node tools/cupos.js`. No se lee entera al empezar: solo la sección del paso actual.

## A. Filas del roadmap (id · paquete · modelo · estado) — 62 filas: 16 hechas, 1 en curso (4D-2), 45 por empezar (46 pendientes con 4D-2: 31 MEDIUM, 11 LOW, 3 tú + LOW, 1 tuya)
- [x] A2 · FIX-6c · 1/4 y 3/4 · HECHOS (21 oct) · archivados en `docs/HISTORIAL_CHECKLIST.md` («Rotación del 25 oct»).
- [ ] A4 · HERR-1 · Herramientas con sentido y equilibrio Oli/Lali (fallo 4; `docs/EQUILIBRIO_Y_COMPLETITUD.md`) · MEDIUM · 4 subpasos · **4/4 HECHO el 23 oct (A4 4/4 CERRADO); códigos de prueba G6 HECHOS el 23 oct (cp. 130); A4 CERRADO salvo el defecto de prueba de `codigo_browser_test.js` (fila siguiente a G6)**:
  - [ ] 3/4-b2 (receta; `GEN_VERSION` 5→6, PARAR y avisar antes; DISEÑO APROBADO en ROADMAP §4.0b, 22 oct): cuota por caso 3 libres / 1 sigilo / 4 con herramienta (1 por herramienta), CHARLAS CON PISTA para que Lali tenga trabajo útil, siempre otro camino libre, cadenas de 2 pasos, medir en tiempo y por dificultad (EQ-3, EQ-5, EQ-6)
  - [ ] (nota antigua de 3/4-b, sustituida por b1 y b2): deducción por herramienta, cadenas de 2 pasos, ~25 % libres, voz alternada, trabajo en cap. 2, cartel de primer uso y «Necesita» · EQ-2…EQ-6, EQ-8 · **`GEN_VERSION` 5→6: PARAR y avisar antes**
- [ ] P1 · Prueba 1 (tú) · hoja corta con 2 preguntas nuevas de equilibrio (¿igual de útil cada detective?, ¿alguna herramienta sobró o faltó?)
- [ ] Regla permanente: cada paquete que añada pistas, salas o temáticas cumple EQ-1…EQ-9 y apunta su informe de reparto en el cierre (`docs/EQUILIBRIO_Y_COMPLETITUD.md` §4)
- [ ] Z1 · Auditoría final de equilibrio y completitud (cierra el roadmap oficialmente; `docs/EQUILIBRIO_Y_COMPLETITUD.md` §5) · MEDIUM · pendiente, el último de todos; el caso 1 ya NO se decide aquí: se rehace en Z0 (decisión del usuario, 22 oct)
- [ ] Z0 · CASO 1 OFICIAL: rehacerlo con lo aprendido (MEDIUM; casi al final, ANTES de Z1 y de que el usuario lo juegue con su pareja). Decision del usuario (22 oct): el caso 1 se REHACE al final del proyecto, ya sabiendo como se hace bien un caso generado; se puede tocar la historia (culpable, pistas, giro) porque el usuario y su pareja ya la conocen. Hasta entonces sigue intacto y reservado (`test_compile`/`test_mech` lo vigilan byte a byte). Diagnostico de hoy (cp. 119, solo medido): 18,4 min (< minimo oficial 20), calidad 69 con GEN_VERSION 6 (61 con 5); partes bajas depth 38, fill 0, chap 51, obj 67; usa las 7 mecanicas; reparto Oli 8 pasos / Lali 3 (~73/27). Plan (SESION cp. 120): (1) copia del original en `docs/respaldo/` · (2) diagnostico sin editar (leer `src/case1.js`, informe de calidad, repaso como jugador) · (3) acordar alcance · (4) ajustes por tandas midiendo con el bot · (5) sustituir la comprobacion byte a byte de `test_compile`/`test_mech` por una de la version nueva + minimos de calidad (> 80 si se puede) y minutos (>= 20) + equilibrio Oli/Lali · (6) build, `test_build`, BASELINE y docs. Subir `G.VERSION` solo con permiso.
- [ ] 15b2b · 4W-0 Bancos de datos en ficheros pequeños · LOW · pendiente (decidido 19 oct; tras MP, antes de 4V-1)
- [ ] 15b3 · 4V-1 · Medidor de variedad · **LOW** · pendiente (decidido 19 oct)
- [ ] 22b · 4F-0b · Salas 4/5/6 · **MEDIUM** · EN CURSO: 1/4 y 2/4 HECHOS; 3/4 EN CURSO (a hecho, cp. 167; el usuario autoriza con P1 pendiente) (decidido 24 oct: Fácil 4 · Normal 5 · Difícil 6; 6.ª sala = Despacho del dueño; `GEN_VERSION` 6→7 en 3/4 tras P1)
  - [ ] HERR-2 · reparto objetivo por herramienta (propuesta del usuario, 24 oct): de cada 100 pistas, ~20 con lupa, ~20 ganzúa, ~20 UV, ~20 grabadora y ~20 libres (aprox.; hoy ~10/23/22/43 sobre las de herramienta y 73 % libres). Cambia la receta → se hace DENTRO de 4F-0b 3/4 (misma subida GEN_VERSION 6→7, después de P1). Medir con `tools/reparto_herramientas.js`; vigilar duración por nivel (Fácil 20-28), pistas falsas con herramienta en la misma proporción, objetos que encajen con cada herramienta y Oli/Lali 40-60 · MEDIUM · pendiente
- [ ] 4F-0b 3/4 · salas 4/5/6 en compilador, medidor, bot y huella; remedir calidad, minutos y reparto Oli/Lali por nivel; `GEN_VERSION` 6→7 (DESPUÉS de P1) y regenerar G6-3wje, G6-2prl y G6-95yj · **MEDIUM** · pendiente · **26 oct (cp. 246, orden del usuario): la parte del COMPAÑERO IA de este paso se aplaza a H47e; el resto se hace en su sitio**
  - [ ] 4F-0b 3/4-c · HERR-2: ~20 % por herramienta y ~20 % libres sobre pistas de sostén; señuelos igual; objetos que encajen · **MEDIUM** · c3, c4, c4b y c5 CERRADOS (cp. 259; solo queda CL-5c-c 3/4, aplazado a H47b) · EN CURSO (24 oct, cp. 173): dividido en 5 subpasos, ZIP completo tras CADA UNO (regla de oro del usuario, 24 oct); todo detrás de `GEN_VERSION >= 7` (v6 IDÉNTICO, `casos_sin_cambios 60`):
    - [x] c3 · CERRADO (24 oct, cp. 187) · fila archivada en `docs/HISTORIAL_CHECKLIST.md` («Rotación del 25 oct»).
    - [x] **PAQUETE CL · CASO LIBRE Y ACUSACIÓN POR RAZONES — CERRADO el 25 oct (cp. 225) salvo CL-5c-c 3/4 (aplazado a H47b)** (decidido por el usuario, 24 oct, cp. 179; SE INTERCALA AQUÍ: después de cerrar c3 y del paquete de reparto de herramientas (orden del usuario, 24 oct, cp. 188) y ANTES de c4; todo detrás de `GEN_VERSION >= 7`, v6 y caso 1 IDÉNTICOS; sin subida extra de versión; fuente de verdad: `docs/CASO_LIBRE_Y_ACUSACION.md`). Formato nuevo de Acusar: **Fácil = culpable · Normal = culpable y motivo · Difícil = culpable, motivo y método**; cada razón se desbloquea con sus pistas; sin cerrojo de capítulos; duración por contenido; **estrellas de 1 a 3 según el desempeño (tiempo, fallos, pistas encontradas, etc.), más estrellas = más recompensa, y acertar siempre cobra**. Cada subpaso: ZIP completo con documentos y PARAR.
      - [x] CL-1 … CL-5 (original) · diagnóstico, diseño, acusar por razones, CL-4 omitido, CL-5/5a/5b · HECHOS (cp. 200-225) · archivados en `docs/HISTORIAL_CHECKLIST.md` («Rotación del 25 oct»). Siguen aquí CL-5c y sus subpasos pendientes.
      - [x] CL-5c · **PUZLES EN DIFÍCIL, INTEGRACIÓN PROFESIONAL (decisión del usuario 25 oct, cp. 214):** 1 o 2 pasos tipo puzle por caso (50/50, media 1,5), justos y con pistas del caso; diseño en `PROPUESTA_CL5.md` §10 · **MEDIUM** · **CERRADO el 25 oct (cp. 222) salvo 3/4, aplazado a H47b** (se divide en subpasos al empezar):
        - [x] CL-5c-a · diseño de datos: banco de puzles (códigos y líneas de tiempo con textos propios), de dónde sale la solución en cada caso y cómo se enlaza con sus pistas (sin dependencia circular); confirmar el diseño con el usuario · **diseño HECHO y entregado el 25 oct (cp. 215, `docs/DISENO_PUZLES_CL5C.md`); CONFIRMADO por el usuario el 25 oct (D1-D3 aceptadas); siguiente: b**
        - [x] CL-5c-b · generador (`gen_clues.js` `puzzleClues` + `compile.js` pasos `pz_N`, `GEN_VERSION >= 7`, solo Difícil, azar propio): 1-2 puzles por caso con premio; v6, Fácil y Normal idénticos · **HECHO el 25 oct (cp. 217): N=300 Difícil 0 sin puzle · prueba nueva `test_puzles_cl5c.js` (J1-J6, 11 mutaciones, en `test.js`); siguiente: c (esquema/validador, revisor, bot, compañero, medidor, pantalla/online) solo con permiso**
        - [ ] CL-5c-c · puzles: validador, revisor, bot, compañero IA, medidor, huella y pantalla/online · **MEDIUM** · DIVIDIDO EN 4 (25 oct, orden del usuario; ZIP tras cada uno y PARAR):
          - [x] CL-5c-c 1/4 · validador (`logic.js`, reglas J1-J4 de los `pz_N`) + `test_validador_puzles.js` con 3 mutaciones, en `test.js` · **HECHO el 25 oct (cp. 218)**
          - [x] CL-5c-c 2/4 · revisor de equidad (J5-J6), medidor y huella (`fingerprint.js`) · **MEDIUM** · **HECHO el 25 oct (cp. 219): `test_puzles_revisor.js` con 8 mutaciones, en `test.js`; v6, Fácil y Normal idénticos; Difícil solo cambia par/reward**
          - [ ] CL-5c-c 3/4 · bot y compañero IA resuelven los puzles (hoy el bot cuenta 25/30 s fijos) · **MEDIUM** · **APLAZADO AL FINAL por el usuario (25 oct): pasa a la fila H47b (justo antes del hito); no bloquea 4/4 ni CL-5c-d** (el bot ya gana con y sin puzles)
          - [x] CL-5c-c 4/4 · pantalla y online: el minijuego del caso 1 reutilizado para `pz_N`, con prueba de navegador si hay · **MEDIUM** · **HECHO el 25 oct (cp. 221): aviso «faltan N pistas», título que no se corta, prueba `tools/puzle_browser_test.js` (14 OK) y capturas**
        - [x] CL-5c-d · recalcular `targetMinV7` de Difícil, remedir los 3 niveles (N ≥ 300, 0 casos > 45, 0 atascos, calidad por nivel) y pruebas con mutación · **MEDIUM** · **HECHO el 25 oct (cp. 222): `targetMinV7` Difícil 35,5 → 34; N=300: Fácil 24,5 · Normal 32,4 · Difícil 38,0 (máx. 43,2), 0 > 45, 0 atascos; `test_duracion_puzles.js` con mutación**
      - [x] CL-6 · pruebas con mutación, `dist/`, documentos y cierre del paquete CL · HECHO (cp. 223-225) · archivado en `docs/HISTORIAL_CHECKLIST.md` («Rotación del 25 oct»).
    - [x] c4 · c4b · c5 · CERRADOS (cp. 226-259; GRAB-2/3/4, señuelos, balanceador, frase nerviosa, mutaciones y medición) · filas archivadas en `docs/HISTORIAL_CHECKLIST.md` («Rotación del 27 oct, cp. 259»).
  - [x] 4F-0b 3/4-d · medidor, bot y huella; remedir calidad, minutos y Oli/Lali de CADA nivel · **HECHO el 28 oct (cp. 266)**: medidor v7 (`METER_CFG.v7`, error medio ≈ 0-3 % frente al bot), `targetMinV7` 24 · 32 · 39, N=300: 0 > 45, 0 atascos, Normal 0 sobre 36; Oli/Lali 100 % en 40-60; `test_meter_v7.js` nueva; `npm test` completo SIN terminar
  - [x] DEFECTO · `test_g2c.js` en rojo en v7 · **LOW** · **HECHO el 29 oct (cp. 268)**: causa = la prueba contaba como charla real la charla señuelo `falsa_*` (interruptor `charlaSenuelos`, cp. 250), que `g2c` excluye a propósito; motor correcto, v6/v7 sin relación. Arreglada SOLO la prueba (filtra `falsa_*` y comprueba que el señuelo no está en `g2c`): v7 720 comprobaciones, 0 fallos · v6 226, 0 · 5 mutaciones detectadas con la base en verde. `src/` sin cambios.
  - [x] `npm test` completo · **HECHO el 29 oct (cp. 277)**: 95 de 95 en verde, 0 rojos (arreglos solo de pruebas: `test_g2c` cp. 268, `test_uv_c4` cp. 272, `test_intro` cp. 275; `ws` instalado en el entorno, no declarado en `package.json`).
  - [ ] 4F-0b 3/4-e · `GEN_VERSION` 6→7, códigos G7-…, menú, HOJA_APUNTES, MP_GUION, versión y huella (`--guardar`, con copia G6) · pendiente
  - [ ] **GRAB-R1** · riesgo en la grabadora, SOLO Normal y Difícil (no Fácil): reusar el vigilante de sigilo que ya existe, a veces hay que esperar a que no miren; sin mecánica nueva · MEDIUM · pendiente, DESPUÉS de 4F-0b 3/4 y antes del HITO (cambia receta: sin subir versión, solo regenerar códigos de prueba, ROADMAP §4.0-bis) · decidido 24 oct, cp. 175
  - [ ] **GRAB-R2** · banco grande de charlas con piezas intercambiables (hoy ≈ 7 por ambiente; meta del maestro ≈ 300 charlas) para que no se note que se repiten; junto al paquete 4P-1 · MEDIUM · pendiente (sin subir versión) · decidido 24 oct, cp. 175
  - [x] **TIEMPOS-1** · (dentro de 3/4-d, MEDIUM, `GEN_VERSION` ≥ 7 solamente; v6 idéntico) `src/gen_data.js`: `durationV7` con medianas 24/32/40, rangos [20,28]/[28,36]/[36,45], mínimo 20 y techo 45 · **HECHO el 27 oct (cp. 261)**: solo datos (v6 y v7 idénticos); `targetMinV7` NO se iguala a la mediana (calibrado: 23,5 · 31 · 34 dan 25 · 33 · 39 reales y 0 > 45); `test_tiempos1.js` con 5 mutaciones; `calidad_niveles.js` lee los datos
  - [x] **TIEMPOS-2** · (3/4-d) `src/quality.js`: con v7 la franja del nivel sale de `durationV7` y `ceiling` 60→45; v6 sigue con `today` y techo 60, v5 con bandas duras; `meter.js` igual · **HECHO el 27 oct (cp. 262)**: `test_tiempos2.js` (153 comprobaciones, 6 mutaciones); v7 N=100: 0 errores, 100 % aceptados, máx. Difícil 44,4 (a 0,6 min del techo)
  - [x] **TIEMPOS-3** · (3/4-d/e) `test_duracion.js`: rangos CONTIGUOS (sin solape), medianas separadas ≥ 6 min, **exige solo «ningún caso pasa del tope de su nivel» (28/36/45) y ninguno < 20**; INFORMA mínimo/media/máximo por nivel; «dentro del rango completo» queda como bloque desactivado hasta 4D-3/Z1; mutaciones nuevas (caso de 29/37/46 min por nivel; 23,5 fijo); `test_quality_spread.js` ajustado (escalas `today`/`goal`) · **HECHO el 27 oct (cp. 263)**: mide con el bot y v7 en memoria; el tope por nivel (28/36/45) NO se exige (Normal pasa de 36 en ≈ 6 %): solo se informa, modo `DUR_ESTRICTO=1` desactivado hasta TIEMPOS-6; `test_quality_spread` con escalas `today`/`goal`/`v7`
  - [x] **TIEMPOS-4** · (3/4-d) `tools/palancas_duracion.js` (`BAND`), `tools/duracion_niveles.js` y `tools/baseline.js`: informe de CADA nivel con **mínimo / media / máximo** de minutos y casos fuera de tope; `BASELINE.json` regenerado al final · **HECHO el 27 oct (cp. 264)**: franja oficial de la versión activa, `GENV=7` para medir v7, campos `techo`/`minimoAbsoluto`/`fueraDeTope`; BASELINE regenerado (v6 idéntico salvo los 9 campos nuevos)
  - [x] **TIEMPOS-5** · (3/4-e / HOJA_APUNTES) pregunta nueva de P2: «minutos reales por caso» para calibrar el medidor (en P1 el usuario jugó 10-15 min lo que el medidor estimaba en > 20); **NO mostrar minutos al jugador** (ni menú ni pantallas) · **HECHO el 27 oct (cp. 265)**: la hoja pide minutos de reloj, corto/justo/largo, modo de juego, nivel y código; sin tocar pantallas
  - [x] **TIEMPOS-6** · (4D-3 / Z1) activar la exigencia de rango completo (mínimo y tope) por nivel y por temática; comprobar que par y recompensa siguen proporcionados (recompensa 30 + 4/min + 10/nivel; límite de Difícil = 1,2 × par ≈ 1,9 × el tiempo estimado) · **HECHO el 29 oct (cp. 267)**: `test_duracion` ESTRICTA por defecto (tope por nivel y ≥ 90 % en rango; N=300 con 0 casos fuera de tope); par/recompensa proporcionados (`tools/par_recompensa_v7.js`); la parte «por temática» NO se midió (queda a decidir)
  - [ ] 4F-0b 4/4 · pruebas y cierre · LOW · pendiente
- [ ] 22b2 · 4F-0e Objetivos de duración por dificultad · LOW · pendiente (decidido 19 oct; justo tras 4F-0b) · cifras CONFIRMADAS el 24 oct (Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45; ROADMAP §3): aquí solo datos y avisos de «te pasas del tope» + mínimo real por nivel
- [ ] 22b3 · 4F-0f · Despacho como escena de robo (objetos nuevos que viven en el despacho; opcional) · MEDIUM · anotado 24 oct (cp. 169), se decide tras 4F-0b 3/4-d
- [ ] 4H · variedad de salas en Difícil: **REQUISITO (24 oct, cp. 171)**: 9 salas candidatas por escenario; Fácil 4, Normal 5 y Difícil 6 de las 9 (126 / 126 / 84 combinaciones); 4V-1 mide la variedad de salas POR NIVEL
- [ ] 22c · 4F-0c · Hora, clima, espejo y paleta (E1, E2) · **MEDIUM** · pendiente (propuesta 19 oct)
- [ ] 22d · 4F-0d · Forma del caso y arranque (E3, E5; la identidad compuesta E4 pasa a 4P, cp. 171) · **MEDIUM** · pendiente (propuesta 19 oct)
- [ ] 22d2 · 4P-1 · Banco GENÉRICO de personajes (nombres y apellidos por separado ≥ 100, manías y muletillas ~40, relaciones y voz; reglas de no repetir en un caso). Los oficios (8-12) y secretos de cada escenario se escriben dentro de su paquete 4H (cp. 172) · **MEDIUM** · pendiente (propuesta 24 oct, cp. 171; antes de P2; SIN subida extra de `GEN_VERSION`)
- [ ] 22d3 · 4P-2 · Aspectos de personaje por capas (ampliar `G.LOOK_PARTS`; los 36 aspectos actuales NO cambian; hoja de muestra para el usuario) · **MEDIUM** · pendiente (propuesta 24 oct, cp. 171)
- [ ] 22e · 4V-2 · Linter de contenido · **LOW** · pendiente (cp. 172: ADELANTADO a la fase de preparación, tras 4V-1, antes de escribir textos nuevos)
- [ ] 22e2 · SAVE-1 · Verificar el guardado a medias con casos generados (recarga, `snapshot` completo, compatibilidad por versión, online; prueba de navegador nueva) · **LOW** · pendiente (cp. 172; antes de P2)
- [ ] 22e3 · SAVE-2 · Arreglar lo que falle SAVE-1 · **MEDIUM** · pendiente (condicional, cp. 172) (propuesta 19 oct)
- [ ] 22 · 4F-1 · Señuelos (idea 5) · **MEDIUM** · pendiente
- [ ] 23 · 4F-2 · Pistas cruzadas (6) · **MEDIUM** · pendiente
- [ ] 24 · 4F-3 · Testigos que cambian de versión (7) · **MEDIUM** · pendiente
- [ ] 25 · 4F-4 · Giro del caso (10) · **MEDIUM** · pendiente
- [ ] 26 · 4F-5 · Rutina de personajes (9) · **MEDIUM** · antes de P2 (bloque de receta; traída el 24 oct) · **26 oct (cp. 246, orden del usuario): la parte del COMPAÑERO IA de este paquete se aplaza a H47e; el resto se hace en su sitio**
- [ ] 26a · 4H-0 · Piloto de escenarios · **MEDIUM** · pendiente (decidido 19 oct; cp. 172: paso 0 amplía la panadería a 9 salas candidatas y el paquete cierra con PERF-1)
- [ ] 26b · 4H-1 · Escenarios I · **MEDIUM** · pendiente (decidido 19 oct, tras 4H-0)
- [ ] 26c · 4H-2 · Escenarios II · **MEDIUM** · pendiente (decidido 19 oct)
- [ ] 26c2 · 4H-3 · Hotel y estación (9 salas candidatas cada uno) · **MEDIUM** · pendiente (traídos del «fuera del camino», 24 oct, cp. 171)
- [ ] 26c3 · 4H-4 · Cuatro escenarios más por elegir con el usuario (15 en total) · **MEDIUM** · pendiente (24 oct, cp. 171)
- [ ] 26c4 · PERF-1 · Chequeo de tamaño y rendimiento al cerrar 4H-0 (tamaño de `dist/`, carga y memoria en iPhone; fijar presupuesto) · **LOW** · pendiente (cp. 172)
- [ ] 26c5 · PERF-2 · Lo mismo al cerrar 4H-2, comparando con el presupuesto · **LOW** · pendiente (cp. 172)
- [ ] 26d · 4T-1 · Temática Robo · **MEDIUM** · pendiente
- [ ] 26e · 4T-2 · Temática Sabotaje · **MEDIUM** · pendiente
- [ ] 26f · 4T-3 · Temática Concurso amañado · **MEDIUM** · pendiente
- [ ] 26g · 4T-4 · Temática Impostor · **MEDIUM** · pendiente
- [ ] 26h · 4T-5 · Temática ¿Sobrenatural? · **MEDIUM** · pendiente
- [ ] 26i · 4T-6 · Temática Desaparecido · **MEDIUM** · antes del HITO final (traída el 24 oct)
- [ ] 26j · 4T-7 · Mezcla (toque secundario) · **MEDIUM** · antes del HITO final (traída el 24 oct)
- [ ] 27 · 4G-1 · Objeto estrella y textos propios (1, 2, 15) · **MEDIUM** · pendiente
- [ ] 28 · 4G-2 · Secretos y reacciones (8, 11) · **MEDIUM** · pendiente
- [ ] 29 · 4G-3 · Vida (12; coleccionables 13 pasan a después del HITO) · **MEDIUM** · pendiente
- [ ] 30 · 4G-4 · Epílogo personalizado (4) · **MEDIUM** · pendiente
- [ ] 31 · 4G-5a · Bancos grandes I (17) · **MEDIUM** · pendiente
- [ ] 32 · 4G-5b · Bancos grandes II (17) · **MEDIUM** · pendiente
- [ ] 33 · 4G-6 · Revisor de amor (18) · **MEDIUM** · pendiente
- [ ] 15c · 4D-3 · Calibración · **LOW** (sube a medium si una meta falla 2 veces) · pendiente
- [ ] 16 · 4E-1 · Botón y semilla (semilla SIEMPRE nueva; repetir un caso a propósito con su código; **memoria básica de «no repetir»**: últimos casos e ingredientes) · **LOW** · pendiente
- [ ] 17 · 4E-2 · Crear caso (Aleatorio pesa lo menos reciente; historial de los DOS jugadores en online) · **MEDIUM** · pendiente
- [ ] 18 · HITO · tú · — · pendiente
- [ ] 19a · 5A · Esquemas nuevos · **MEDIUM** · pendiente
- [ ] 19b · 5B-1 · Escenarios: arte · **MEDIUM** · pendiente (recortable)
- [ ] 19c · 5B-2 · Escenarios: plantillas y frases · **LOW** · pendiente
- [ ] 19d · 5C · Memoria COMPLETA de partidas e ingredientes y «no repetir» (16; incluye textos sueltos y la prueba de «sensación de repetición» de 20 casos por nivel; la parte básica entra con 4E-1/4E-2) · **LOW** · pendiente
- [ ] 20a · 6A · Frases y humor por tandas · **LOW** (MEDIUM si hay que tocar lógica) · pendiente
- [ ] 20b · 6B · Rendimiento y escala · **LOW** · pendiente
- [ ] 20c · 6C · Prueba online repetida · tú + LOW · pendiente
- [ ] 21a · 7A · Tutorial integrado · **MEDIUM** · pendiente
- [ ] 21b · 7B · Créditos y pantalla final · **LOW** · pendiente
- [ ] 21c · 7C · Lanzamiento v1.0 · tú + LOW · pendiente

## B. Cierre de 4D-2 (ABIERTA; solo con permiso explícito)
- [ ] Pruebas de navegador (las `tools/*_browser_test.js`) si hay navegador disponible
- [x] **(S3b: S3b-1 y S3b-2 CERRADOS el 20 oct; ANTES de S4; solo con permiso)** Arreglar la nota de calidad (`src/quality.js`). Principio: cada parte de la nota con razón lógica explicable; cubrir textos, personajes, objetos, pistas, mentiras, ritmo y duración. **Unidad de medida = par (caso, dificultad).** **REGLA DEL USUARIO: en toda prueba de casos se informa la calidad de CADA nivel (Fácil/Normal/Difícil) por separado, nunca mezclada.** Detalle en `docs/SESION.md` y maestro §10 (checkpoint 21). Dos sesiones:
  - [ ] **(fila nueva, antes de MP, aparte de S3b)** `vendor/peerjs.min.js`: bajar PeerJS 1.5.4 (ver `vendor/LEEME.txt`), guardarlo en `vendor/`, `node build.js` y probar el online con 2 móviles; hoy el build avisa «falta vendor/peerjs.min.js» y la versión web carga PeerJS desde un CDN
  - [x] (idea, fila nueva) Bot que modele el coste de cada dificultad y duración por profundidad: ver SESION.md «DECISIONES pendientes» (a); con 4F-0e y calibrando en MP → DESCARTADA (29 oct): cubierta por TIEMPOS-1…6; ver DECISIONES_FINALES
  - [ ] **(HALLAZGO 20 oct, decisión pendiente, NO tocar en S3b)** `G.generateCase` ignora la nota de calidad: solo reintenta por biblia, validador y equidad, así que un caso con nota < `QUALITY_MIN` (hoy ~20 % de los Difícil) SE ENTREGA. Difícil no es jugable de verdad hasta 4F. Decidir en 4D-3 / puerta de calidad de VARIEDAD.md si el generador descarta y reintenta por nota (cambia qué caso sale de cada semilla → código G5-… y huella) → DECIDIDO (29 oct, B5): puerta de calidad real, se hace en F53 (4D-3)
  - [x] (decisión del usuario, cambio de receta) `easyHidden` en casos Fácil generados: ver SESION.md (b); mejor con la subida 5→6 de 4F-0a → DECIDIDO (29 oct, B4): NO se ocultan sospechosos en Fácil
  - [ ] Contrastar la nota con la opinión real del usuario tras MP

## C. Defectos conocidos sin corregir (maestro §0.0)
- [ ] 1. Concordancia de género en el noir macabro (Doña Hogaza «vive solo» → «sola»); bancos de 4C-4a
- [ ] 2. «Soy muy correcto con los difuntos» (Palmera en western macabro): revisar género
- [ ] 3. Plantilla `calle_plaza`: baldosa (16,8) cerrada; objetos de ambiente de 4C-4b podrían caer en bolsa cerrada (`test_macabro` solo vigila `sit_*`)
- [ ] 4. Mejora: `G.findPath` pruebe varias baldosas candidatas

## D. Pendiente del usuario (maestro §0.5)
- [x] **(24 oct, cp. 172) Decidir si se hace una prueba intermedia P1.5 tras 4F-4** (propuesta de Claude; ROADMAP §4.4 punto 10). Hasta que diga que sí, no se hace. → DECIDIDO (29 oct, D7): NO hay P1.5
- [x] (cp. 171) Elegir los 4 escenarios de 4H-4 (candidatos en ROADMAP §3) y confirmar las metas de curiosidades (~400) y charlas (~300). → DECIDIDO (29 oct, D1/D2): metas confirmadas; 4H-4 = biblioteca, restaurante, balneario, estadio
- [ ] Leer `docs/MUESTRA_AMBIENTES.md` y decidir cuándo corregir los defectos de la sección C → (29 oct, D5): los defectos se arreglan en F37/F23/F49
- [ ] **MP:** (se me da la calidad de cada nivel de la muestra) jugar UN caso generado de prueba (código elegido por el bot; el caso 1 queda reservado para jugarlo con su pareja) + online con 2 móviles reales, tras cerrar 4D-2
- [x] Aprobar o recortar los 5 ejes de variedad E1-E5 (`VARIEDAD.md` §3) al abrir 4F-0c y 4F-0d → DECIDIDO (29 oct, D3): E1-E5 aprobados
- [x] Confirmar al abrir 4F-0a la subida única de `GEN_VERSION` 5 → 6 · RESUELTO (cp. 157): la subida a 6 la hizo A4 y 4F-0a NO la sube (sigue en 6); ver `docs/SESION.md` cp. 157
- [x] Antes de 4H-0: confirmar techos de «caro» (`ESCENARIOS.md` §5.3) y si la panadería recibe 6.ª sala → DECIDIDO (29 oct, A4): techos de «caro» confirmados; 6.ª sala ya hecha
- [x] Aprobar ~10 frases sueltas (`MUESTRA_FRASES.md`) al cerrar cada paquete de 4G → DECIDIDO (29 oct, D4): sustituido por linter + MUESTRA_FRASES.md sin bloquear
- [ ] Verificar en iPhone real: botones, barra de Safari, rendimiento y audio tras el primer toque (maestro §9)

## E. Metas de completitud (maestro §0.3g; medir con `node tools/cupos.js`)
- [ ] **(24 oct, cp. 171) Metas nuevas por la variedad «infinita»:** escenarios 15 · salas candidatas por escenario 9 · nombres ≥ 100 · aspectos de personaje por capas (meta en §0.3g) · curiosidades ~400 y charlas ~300 (propuesta, a confirmar) · historias base por temática 12-15. **`tools/cupos.js` aún tiene las metas antiguas (11 escenarios, 8 salas…): actualizarlo en el paquete que lo use (LOW).**
- [ ] Mínimos del HITO y metas finales de v1.0 según la tabla de §0.3g (escenarios 9→11, curiosidades 200→300, charlas 150→220, nombres 60→100, etc.). Se tacha cada fila al cerrar el paquete que la llena.

## F. Fuera del camino (tras el HITO final) / opcional
- [ ] 7D voces habladas (último, opcional) · escenarios 10-11 (hotel, estación) · metas finales. **4F-5, 4T-6, 4T-7 y coleccionables (13) YA NO están aquí: se traen antes del HITO final (24 oct, ver sección H).**

## G. Duración por dificultad (decidida el 19 oct; maestro §0.3i)
- [ ] 4F-0e: rangos por nivel en generador y avisos en el medidor (LOW, tras 4F-0b)
- [ ] Recalibrar medidor (`node tools/meter_fit.js`, LOW) al cerrar 4F-4
- [ ] Recalibrar medidor al cerrar 4G-5b
- [ ] Recalibrar medidor al cerrar 4T-5
- [ ] Recalibrar medidor al cerrar 4H-2
- [ ] 4D-3: cada dificultad en su rango (Fácil > 20, Difícil < 60), medido por temática
- [ ] 4D-3: par (1,6 × estimado, 1,05-2,4 ×) y recompensa (30 + 4/min + 10/nivel) siguen proporcionados con casos largos
- [ ] Comprobar en el código si el juego guarda y retoma un caso a medias: **HALLAZGO 24 oct (cp. 172): SÍ existe** (autosave cada 30 s, al pausar y al salir; «Continuar caso», también online). Falta verificarlo con casos generados, versiones y online → filas SAVE-1 y SAVE-2 (antes de P2; casos de 36-45 min)

- [x] (decisiones del usuario aún sin confirmar, FIX-3) (a) al fallar del todo se conservan las monedas halladas (`bonusMoney`); (b) un rumor falso solo se marca «sin pruebas» (no se desmiente con pista física). Comportamiento actual = provisional → RESUELTO (P1/P2 del 21 oct): se pierden las monedas; rumor solo «sin pruebas»
- [ ] (20 oct) Preguntas sin responder para el usuario: ver `docs/PREGUNTAS_PENDIENTES.md` (P1-P9; ninguna bloquea FIX-4a)
- [ ] (21 oct) 4F-0a: añadir unas pocas monedas sueltas (efectos `money`, total pequeño ~10-20) a los casos automáticos (cambia la receta: junto a GEN_VERSION 5→6)

- [ ] Pendiente de fondo (4F/4D-3): la ventana de Difícil de «temas por personaje» da 0-11/100 con el contenido de hoy (no hay gradiente); decidir con contenido real si se baja la ventana o se espera a 4F (opción B descartada por ahora).
- [ ] Menor: la línea-resumen de `test_quality_spread.js` imprime la banda dura antigua y no los rangos solapados de `bandOf`; decidir si se alinea.
- [ ] Observación (cp. 134, LOW, para 4D-3/4F): al pelar un caso, la parte intrínseca de la nota SUBE de media +0,5 a +0,7 en los tres niveles (componentes de reparto `chap` y `fill` mejoran, `walk` y `text` empeoran). En Fácil y Normal lo tapa la caída de profundidad; en Difícil (suelo) la nota sube 1 punto en 12 de 40 casos. Revisar con contenido real de 4F si `chap`/`fill` deben premiar quitar relleno.

## P. Paquete corto de proceso (23 oct, LOW, solo `tools/` y pruebas; pedido del usuario)
- [ ] P-3b · (opcional, LOW) migrar al mismo ayudante las demás pruebas con frase literal: test_companion, test_grabadora, test_sospechosos, test_watcher, test_acusar_fallo, test_intro, test_mostrar_prueba

## Q. Paquete de proceso «menos espera en las pruebas» (23 oct, LOW, solo `tools/`; pedido del usuario)

## H. ORDEN DEFINITIVO DE EJECUCIÓN (24 oct, cp. 159; = ROADMAP §4.0-bis; marca cada paso al cerrarlo)
Principio: receta primero, luego se congela, al final lo que solo añade; juego lo más completo posible antes del HITO único final.
- [ ] H1 · P1 (tú, en curso)
- [x] H2 · 4F-0b 2/4 · MEDIUM — 6.ª sala (Despacho del dueño) · HECHO (cp. 164)
- [ ] H3 · 4F-0b 3/4 · MEDIUM — salas 4/5/6 + HERR-2 (reparto ~20 % por herramienta) + `GEN_VERSION` 6→7 (tras P1)
- [ ] H4 · 4F-0b 4/4 · LOW — pruebas y cierre
- [ ] H5 · 4F-0e · LOW — rangos de duración por nivel y avisos
- [ ] H6 · 4E-1 · LOW — botón «Caso nuevo» con semilla nueva + memoria básica de «no repetir»
- [ ] H7 · 4W-0 · LOW — partir bancos de datos
- [ ] H8 · 4V-1 · LOW — medidor de variedad
- [ ] H8b · 4V-2 · LOW — linter de contenido (ADELANTADO, cp. 172: antes de escribir textos nuevos)
- [ ] H8c · SAVE-1 · LOW — verificar el guardado a medias con casos generados (cp. 172)
- [ ] H8d · SAVE-2 · MEDIUM (condicional) — arreglar lo que falle SAVE-1 (cp. 172)
- [ ] H9 · 4F-1 señuelos · MEDIUM
- [ ] H10 · 4F-2 pistas cruzadas · MEDIUM
- [ ] H11 · 4F-3 testigos que cambian de versión · MEDIUM
- [ ] H12 · 4F-4 giro del caso · MEDIUM
- [ ] H13 · 4F-5 rutina de personajes · MEDIUM (traída) · **26 oct (cp. 246, orden del usuario): la parte del COMPAÑERO IA de este paquete se aplaza a H47e; el resto se hace en su sitio**
- [ ] H14 · 5A esquemas de misterio nuevos · MEDIUM (traída)
- [ ] H15 · 4F-0c hora, clima, espejo y paleta · MEDIUM (recortable solo con permiso)
- [ ] H16 · 4F-0d forma del caso y arranque · MEDIUM (recortable solo con permiso)
- [ ] H16b · 4P-1 banco GENÉRICO de personajes (oficios y secretos de escenario van en 4H) · MEDIUM (nuevo, cp. 171; ajustado cp. 172)
- [ ] H16c · 4P-2 aspectos de personaje por capas · MEDIUM (nuevo, cp. 171)
- [ ] H18 · P2 (tú)
- [ ] H19 · 4H-0 piloto de escenarios (museo, capa de temática y panadería a 9 salas) · MEDIUM
- [ ] H19b · PERF-1 · LOW — chequeo de tamaño y rendimiento (cp. 172)
- [ ] H20 · 4T-1 Robo · MEDIUM
- [ ] H21 · 4T-2 Sabotaje · MEDIUM
- [ ] H22 · 4E-2 pantalla Crear caso (+ historial de los dos jugadores en online) · MEDIUM
- [ ] H23 · HITO 1 (tú y tu pareja, online en dos móviles)
- [ ] H24 · 4H-1 teatro, cine, circo y mansión · MEDIUM
- [ ] H25 · 4T-3 Concurso · MEDIUM
- [ ] H26 · 4T-4 Impostor · MEDIUM
- [ ] H27 · 4T-5 ¿Sobrenatural? · MEDIUM
- [ ] H28 · P3 (tú)
- [ ] H29 · 4H-2 mercado, granja y parque · MEDIUM
- [ ] H29a · PERF-2 · LOW — chequeo de tamaño y rendimiento con 9 escenarios (cp. 172)
- [ ] H29b · 4H-3 hotel y estación · MEDIUM (nuevo, cp. 171)
- [ ] H29c · 4H-4 cuatro escenarios más (hasta 15) · MEDIUM (nuevo, cp. 171)
- [ ] H30 · 4G-1 objeto estrella y textos propios · MEDIUM
- [ ] H31 · 4G-2 secretos y reacciones · MEDIUM
- [ ] H32 · 4G-3 vida (eventos de ambiente) · MEDIUM
- [ ] H33 · 4G-4 epílogo personalizado · MEDIUM
- [ ] H34 · 4G-5a bancos grandes I (COMPLETOS) · MEDIUM
- [ ] H35 · 4G-5b bancos grandes II (COMPLETOS) · MEDIUM
- [ ] H36 · 4G-6 revisor de amor · MEDIUM
- [ ] H37 · 4T-6 Desaparecido · MEDIUM (traída)
- [ ] H38 · 4T-7 Mezcla · MEDIUM (traída)
- [ ] H39 · Coleccionables (13) · MEDIUM (traídos)
- [ ] H40 · 5B-1 arte de escenarios extra · MEDIUM (se mantiene; recortable solo con permiso)
- [ ] H41 · 5B-2 plantillas y frases · LOW
- [ ] H42 · 5C memoria COMPLETA de partidas y «no repetir» + prueba de «sensación de repetición» · LOW
- [ ] H43 · 6A frases y humor por tandas · LOW
- [ ] H44 · 6B rendimiento y escala (10.000 semillas) · LOW
- [ ] H45 · 4D-3 calibración final con todo el contenido · LOW (MEDIUM si una meta falla 2 veces)
- [ ] H46 · 7A tutorial integrado · MEDIUM
- [ ] H47 · Z0 rehacer el caso 1 oficial · MEDIUM
- [ ] H47b · CL-5c-c 3/4 · bot y compañero IA resuelven los puzles (el bot deja de contar 25/30 s fijos y los resuelve de verdad; el compañero IA los usa con sus pistas) · MEDIUM (aplazado al final por el usuario, 25 oct)
- [ ] H47c · **BLOQUE IA DE LALI Y OLI (aplazado al final por el usuario, 26 oct, cp. 245; solo con su permiso, justo antes del HITO)** · compañero IA y charla señuelo. Pasos: **(a) LOW** medir 60 casos por nivel qué hace la IA de Lali con la charla señuelo (`aiCandidates` de `companion.js` solo filtra herramienta, capítulo y `chatReady`, no distingue señuelo de real) y cuánto tarda · **(b) MEDIUM** según lo medido y la decisión del usuario (¿la IA la ignora o la usa como una pista cualquiera?), marcarla en el compilador y filtrarla en `aiCandidates`, con prueba con mutación y v6 IDÉNTICO · **(c) LOW** ampliar la medición del bot a ≈ 60 casos por nivel (hoy 9 casos) · pendiente
- [ ] H47d · **IA de Lali y Oli · cierre del bloque** · **LOW** (sube a MEDIUM si una meta falla 2 veces): remedir reparto Oli/Lali (40-60 % por caso), minutos de CADA nivel (techo 45) y calidad por nivel con la IA jugando; con H47b y H47c hechos; documentos y ZIP · pendiente
- [ ] H47e · **IA de Lali y Oli · lo que arrastran otros paquetes (aplazado por el usuario, 26 oct, cp. 246)** · adaptar el compañero IA a: salas 4/5/6 (4F-0b 3/4), rutina de personajes (4F-5), Desaparecido/`localizar` (4T-6) y cualquier paquete que cambie rutas, tiempos o pistas · **MEDIUM** (LOW si solo repite pruebas) · pendiente · mientras tanto esos paquetes se cierran SIN tocar `companion.js`; si algo cambia lo que la IA ve, se anota aquí en vez de arreglarlo
- [ ] H48 · HITO ÚNICO FINAL (tú y tu pareja, online en dos móviles) — receta CONGELADA
- [ ] H49 · arreglos de lo que salga · 6C prueba online repetida (tú + LOW) · 7B créditos (LOW) · 7C lanzamiento v1.0 (tú + LOW)
- [ ] H50 · Z1 auditoría final de equilibrio y completitud · MEDIUM
- [ ] H51 · 7D voces habladas (último, opcional)

**Reglas del orden definitivo (profesionales, 24 oct):**
- **Receta antes que contenido que solo añade.** Todo lo que cambia lo que genera una semilla va en el paso 3 (o antes), para que P2, HITO 1 y P3 se jueguen ya con la receta casi final.
- **`GEN_VERSION`:** la ÚNICA subida prevista es 6→7 en 4F-0b 3/4, después de P1 (hoy hay códigos G6 en uso en P1). Hasta el HITO final los códigos son de prueba: si un paquete posterior cambia lo que genera una semilla, se regeneran los códigos de prueba del menú y se anota en su cierre, sin nueva subida. Desde el HITO final la receta está congelada: cualquier cambio posterior sube `GEN_VERSION`. Una temática o escenario nuevo con letra propia no rompe los códigos de las demás. Si una tarea parece pedir una subida fuera de esto, se PARA y se avisa.
- **Cierre de cada paquete:** pruebas automáticas, remedir calidad y minutos de CADA nivel, informe de reparto Oli/Lali (EQ-1…EQ-9), documentos al día, ZIP y PARAR. Solo con permiso explícito para el siguiente.
- **Cuándo juega el usuario:** P1, P2, HITO 1, P3 y el HITO FINAL; entre medias, solo cuando haga falta o él lo pida. No hay mini-pruebas extra.
- **Modelo:** MEDIUM si toca receta, humor, arte o lógica; LOW para medir, pulir o repetir pruebas con patrón ya probado. Un LOW que falla 2 veces la misma prueba sube a MEDIUM.
- **Nada se recorta sin permiso del usuario.** Lo recortable (4F-0c/0d, 5B-1) se marca en la checklist con el dato de 4V-1 y decide él.
- **Documentos:** al abrir un paquete se lee solo su sección de ROADMAP/CHECKLIST; al cerrarlo se tacha, se anota en SESION y se actualiza LEEME.

## R. Regla de variedad por rangos y medición sin restricciones (24 oct, cp. 185; decidido por el usuario; SOLO documentación)
- [x] REPARTO DE HERRAMIENTAS (cp. 184-193, 25 oct) · S1 testimonios por mentira MEDIUM · S2 reparto por nivel MEDIUM · S3 situaciones 1-3 MEDIUM · S4 cierre LOW · HECHO; `test_testimonios`, `test_reparto_niveles`, `test_situaciones`. Cifras (R1/R4): `herr2.levels` y `macabro.sit.counts` en `gen_data.js` (situaciones 1/2/3 = 25/50/25; herramientas por nivel con mín/máx/pesos). Pendiente: decisión sobre libres 39-43 %.
- [ ] R1 · **Toda cifra del generador lleva mínimo, máximo y pesos** (en datos, no en lógica): ninguna estadística debe ser siempre igual entre casos. Aplica a situaciones macabras (1-3), testimonios, charlas, señuelos, curiosidades, reparto de herramientas y número de pistas. Cada paquete que toque una cifra anota aquí su rango y pesos.
- [ ] R2 · **Cada caso es una mezcla con variedad; misma receta para todos:** todos llevan situaciones macabras (1-3, más casos con 2) usando SOLO las que ya existen; la sensación de más o menos macabro sale del número. Sin escribir situaciones suaves nuevas (descartado por el usuario, 24 oct) y sin tipos de ambiente en conversación ni documentos. El jugador no lo elige.
- [ ] R3 · **Rangos por nivel: solo medir y registrar.** Límites duros únicos: 0 atascos del bot y techo de 45 min. Objetivos medidos (se informan por nivel, no bloquean): tiempos 20-28 / 28-36 / 36-45, EQ-1 40-60 %, mínimo 2 libres en Fácil, % libres y reparto de herramientas. Topes finos al final, con datos.
- [ ] R4 · Rangos y pesos concretos de cada cifra (P20; situaciones macabras ya decididas: más casos con 2, provisional 25/50/25): proponer una tabla con la primera medición y aprobarla con el usuario.


## I. EJECUCIÓN FINAL POR LA IA (29 oct, cp. 278; decisión del usuario) — la fuente de los pasos es `docs/PASOS_IA.md`
- Cómo trabajar: `docs/GUIA_IA_FINAL.md` · decisiones: `docs/DECISIONES_FINALES.md` · lo que te toca a ti: `docs/PENDIENTE_DE_PERSONA.md` (lo crea F01).
- Cada tarjeta Fxx de PASOS_IA lista qué filas de esta checklist tachar al cerrarla (4F-0b, 4F-0e, GRAB-R1/R2, 4E-1/2, 4W-0, 4V-1/2, SAVE-1/2, 4F-1…5, 5A, 4F-0c/0d, 4P-1/2, 4H-0…4, PERF-1/2, 4T-1…7, 4G-1…6, coleccionables, 5B, 5C, 6A, 6B, CL-5c-c 3/4, H47c-e, 4D-3, 7A, Z0, 7B, Z1).
- Pasos «tú» (no los hace la IA): H1 P1, H18 P2, H23 HITO 1, H28 P3, H48 HITO final, H49 6C/7C, iPhone real, H51 voces.
- [ ] I1 · IA final: F01-F58 cerrados o BLOQUEADOS con causa (`grep -c "ESTADO: \[x\]" docs/PASOS_IA.md`)
