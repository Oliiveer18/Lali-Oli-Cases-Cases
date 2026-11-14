# MÉTODO DE TRABAJO (25 oct, cp. 229) · decisión del usuario · leer SOLO si hace falta el detalle
Contexto: el usuario trabaja por chats cortos y cambia de cuenta; lo único que sobrevive es el ZIP. Por eso: subpasos pequeños, ZIP con documentos tras CADA uno, y arranque barato (SESION.md regla 12). La memoria de Claude NO viaja entre cuentas: lo que importa está aquí.

## 1. Tamaño de los pasos (NO se agrandan)
- Un subpaso = un chat = un ZIP (checkpoint). NO se juntan subpasos «para ir más rápido»: el ZIP existe para no perder trabajo.
- Se para solo con: prueba en rojo, meta que falla dos veces o cambio de `GEN_VERSION`. Si el chat se corta a medias, ZIP intermedio con lo hecho y documentos al día.
- Orden dentro del paso (por si hay corte): 1.º código y pruebas del paso · 2.º medición · 3.º informe y documentos · 4.º ZIP.

## 2. Pruebas por impacto (lo que de verdad ahorra tiempo)
En un subpaso intermedio corren SOLO las pruebas que vigilan lo tocado; las pesadas van al cierre de bloque. Mapa (comprobar si el cambio toca otra área):
| Se toca… | Pruebas del paso |
|---|---|
| UV, ganzúa, lupa, grabadora, señuelos, reparto | `test_uv_c4`, `test_mech`, `test_compile`, `test_reparto`, `test_grabadora`, `casos_sin_cambios.js 60` (v6 IDÉNTICO) |
| Pistas / biblia | `test_gen_clues`, `test_bible` |
| Puzles | `test_puzles_cl5c 10`, `test_validador_puzles`, `test_duracion_puzles 20` |
| Duración / calidad | medición rápida (§3) |
| Pantalla / texto | `test_textfit`, `test_menutexto` y `node build.js` + `test_build` |
Pesadas, SOLO al cierre de bloque o si el cambio las toca: `test_puzles_cl5c` (278 s con 40), `test_mass` (197 s), `test_filler` (75 s), `test_cl5a`, `test_quality_spread`. Versiones ligeras para pasos intermedios: `node test_puzles_cl5c.js 10` · `SEEDS=N node test_mass.js` · `node test_filler.js <n> <nb>` (los argumentos existen; el valor «ligero» se confirma al usarlos). Una a una (regla 3), log a fichero y solo `tail`. Sin `npm test` salvo que el usuario lo pida.

## 3. Mediciones: rápida en el paso, completa al cerrar
- Rápida (subpaso): `GENV=7 node tools/palancas_cl5.js 40 base` (≈ 40 s). El informe pone «muestra 40 por nivel · comprobación rápida, NO medición final». Si algún caso pasa de 43 min o hay un atasco, se amplía la muestra ANTES de seguir.
- Completa (cierre de bloque): `GENV=7 node tools/palancas_cl5.js 100 base` o más (≈ 90 s). Da mín–mediana–máx, calidad y atascos de CADA nivel por separado; techo 45 min y 0 atascos son límites duros.

## 4. EQUILIBRIO DE HERRAMIENTAS (decisión del usuario, 25 oct)
- **Un rango NO se da por bueno si no llega a su mínimo.** Una meta no alcanzada se queda ABIERTA (no se cierra con «es suficiente»); se anota qué falta y en qué subpaso se resuelve.
- **Ninguna herramienta puede ser abusiva.** En particular la LUPA de Oli no puede quedarse con mucho uso (hoy 2,25-2,66 pasos por caso): debe BAJAR. Ganzúa, UV y grabadora deben SUBIR hasta su mínimo. No hace falta que sean iguales, pero todas dentro de una banda con mínimo, máximo y pesos en datos (regla R1), y la banda 40-60 % Oli/Lali por caso.
- Las cifras exactas (mín/máx/pesos de cada herramienta, por nivel) se fijan al medir en 2b-4, con el usuario. Hoy: UV 1,40 · 1,34 · 1,49 por caso (objetivo ≈ 2, NO alcanzado), lupa 2,25 · 2,47 · 2,66, ganzúa 0,67 · 0,66 · 0,74, grabadora ≈ 0,8-1,1. Palancas posibles: A) relajar `okGate` solo para la UV con validación de 0 atascos, B) más documentos en la biblia (cambiaría receta: pide permiso y `GEN_VERSION`).
- Cada informe de medición incluye la tabla «herramienta × nivel» y dice cuáles están por debajo del mínimo o por encima del máximo.

## 5. Contenido jugable
Cuando el equilibrio esté dentro de banda, se prioriza contenido (salas, personajes, objetos; ROADMAP §4) sobre más afinado del generador.

## 6. Delegación del usuario (26 oct, cp. 254-255)
Cuando el usuario dice «haz lo más profesional, pero nada innecesario», se decide con DATOS: un subpaso que solo añade margen sin resolver un fallo medido se descarta y se anota el porqué (ej.: c4-4 subpaso 4, 16 intentos: 0 de 9000 semillas sin caso). Si un cambio es necesario, se hace completo (ej.: c4-4 subpaso 2, balanceador). Las decisiones delegadas se apuntan en SESION con su cifra.
