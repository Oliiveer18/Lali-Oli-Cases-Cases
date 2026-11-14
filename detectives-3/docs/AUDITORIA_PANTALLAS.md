# AUDITORÍA DE PANTALLAS (FIX-4b, 21 oct, v0.7.46)

Herramienta: `tools/auditoria_pantallas.js` (`SHOT=/carpeta node tools/auditoria_pantallas.js`; JSON en `/tmp/auditoria.json`). Solo mide: cuenta textos «fuera», «pisados» y «pequeños» (<8,5 px reales) en 15 pantallas × 5 tamaños. Prioridad: **iPhone 14 horizontal 844×390** y vertical 390×844.

## Cómo leer los números (falsos positivos conocidos)
- «fuera 2/10» en horizontal = los textos «Mover», «ACCIÓN», «Cambiar» y «Detective», que están a propósito en las franjas laterales (fuera del mapa 960×540). NO es un defecto.
- «pisados» y «pequeños» en las pantallas 07-15 incluyen el HUD que queda atenuado DETRÁS del cuaderno/menú; la herramienta no distingue lo tapado. Solo cuentan como hallazgo si se ve en la captura.

## Tabla (textos / fuera / pisados / pequeños / mínimo px)


### iPhone 14 horizontal

| Pantalla | textos | fuera | pisados | pequeños | mín. px |
|---|---|---|---|---|---|
| 01 título | 17 | 0 | 0 | 0 | 8.7 |
| 02 modo de juego | 26 | 0 | 0 | 0 | 10.1 |
| 03 despacho (hub) | 32 | 0 | 0 | 0 | 9.4 |
| 04 sala online | 16 | 0 | 0 | 0 | 9.4 |
| 05 tarjeta de introducción | 6 | 2 | 0 | 0 | 8.6 |
| 06 juego (HUD) | 50 | 10 | 0 | 12 | 6.4 |
| 07 cuaderno · pestaña 1 | 51 | 2 | 4 | 8 | 7.8 |
| 08 cuaderno · pestaña 2 | 67 | 2 | 2 | 8 | 7.8 |
| 09 cuaderno · pestaña 3 | 51 | 2 | 4 | 8 | 7.8 |
| 10 cuaderno · Acusar | 72 | 2 | 5 | 8 | 7.8 |
| 11 Acusar · elegir culpable | 89 | 2 | 5 | 8 | 7.8 |
| 12 Acusar · ¿estáis seguros? | 77 | 2 | 5 | 8 | 7.8 |
| 13 pausa | 56 | 2 | 0 | 8 | 7.8 |
| 14 conversación | 52 | 2 | 0 | 8 | 7.8 |
| 15 resultado | 70 | 2 | 0 | 8 | 7.8 |

### iPhone Pro Max horizontal

| Pantalla | textos | fuera | pisados | pequeños | mín. px |
|---|---|---|---|---|---|
| 01 título | 17 | 0 | 0 | 0 | 9.6 |
| 02 modo de juego | 26 | 0 | 0 | 0 | 11.1 |
| 03 despacho (hub) | 32 | 0 | 0 | 0 | 10.4 |
| 04 sala online | 16 | 0 | 0 | 0 | 10.4 |
| 05 tarjeta de introducción | 6 | 2 | 0 | 0 | 9.4 |
| 06 juego (HUD) | 50 | 10 | 0 | 4 | 7.1 |
| 07 cuaderno · pestaña 1 | 51 | 2 | 4 | 0 | 8.7 |
| 08 cuaderno · pestaña 2 | 67 | 2 | 2 | 0 | 8.7 |
| 09 cuaderno · pestaña 3 | 51 | 2 | 4 | 0 | 8.7 |
| 10 cuaderno · Acusar | 72 | 2 | 5 | 0 | 8.7 |
| 11 Acusar · elegir culpable | 89 | 2 | 5 | 0 | 8.7 |
| 12 Acusar · ¿estáis seguros? | 77 | 2 | 5 | 0 | 8.7 |
| 13 pausa | 56 | 2 | 0 | 0 | 8.7 |
| 14 conversación | 52 | 2 | 0 | 0 | 8.7 |
| 15 resultado | 70 | 2 | 0 | 0 | 8.7 |

### iPhone SE horizontal

| Pantalla | textos | fuera | pisados | pequeños | mín. px |
|---|---|---|---|---|---|
| 01 título | 17 | 0 | 0 | 4 | 8.3 |
| 02 modo de juego | 26 | 0 | 0 | 0 | 9.7 |
| 03 despacho (hub) | 32 | 0 | 0 | 0 | 9 |
| 04 sala online | 16 | 0 | 0 | 0 | 9 |
| 05 tarjeta de introducción | 6 | 2 | 0 | 2 | 6.8 |
| 06 juego (HUD) | 50 | 10 | 0 | 38 | 5.1 |
| 07 cuaderno · pestaña 1 | 51 | 2 | 4 | 35 | 6.2 |
| 08 cuaderno · pestaña 2 | 67 | 2 | 2 | 49 | 6.2 |
| 09 cuaderno · pestaña 3 | 51 | 2 | 4 | 35 | 6.2 |
| 10 cuaderno · Acusar | 72 | 2 | 5 | 41 | 6.2 |
| 11 Acusar · elegir culpable | 89 | 2 | 5 | 47 | 6.2 |
| 12 Acusar · ¿estáis seguros? | 77 | 2 | 5 | 43 | 6.2 |
| 13 pausa | 56 | 2 | 0 | 34 | 6.2 |
| 14 conversación | 60 | 2 | 0 | 34 | 6.2 |
| 15 resultado | 70 | 2 | 0 | 32 | 6.2 |

### tablet horizontal

| Pantalla | textos | fuera | pisados | pequeños | mín. px |
|---|---|---|---|---|---|
| 01 título | 17 | 0 | 0 | 0 | 12.8 |
| 02 modo de juego | 26 | 0 | 0 | 0 | 14.9 |
| 03 despacho (hub) | 32 | 0 | 0 | 0 | 13.9 |
| 04 sala online | 16 | 0 | 0 | 0 | 13.9 |
| 05 tarjeta de introducción | 6 | 2 | 0 | 0 | 10.4 |
| 06 juego (HUD) | 50 | 10 | 0 | 2 | 7.8 |
| 07 cuaderno · pestaña 1 | 51 | 2 | 4 | 0 | 9.5 |
| 08 cuaderno · pestaña 2 | 67 | 2 | 2 | 0 | 9.5 |
| 09 cuaderno · pestaña 3 | 51 | 2 | 4 | 0 | 9.5 |
| 10 cuaderno · Acusar | 72 | 2 | 5 | 0 | 9.5 |
| 11 Acusar · elegir culpable | 89 | 2 | 5 | 0 | 9.5 |
| 12 Acusar · ¿estáis seguros? | 77 | 2 | 5 | 0 | 9.5 |
| 13 pausa | 56 | 2 | 0 | 0 | 9.5 |
| 14 conversación | 60 | 2 | 0 | 0 | 9.5 |
| 15 resultado | 70 | 2 | 0 | 0 | 9.5 |

### iPhone 14 vertical

| Pantalla | textos | fuera | pisados | pequeños | mín. px |
|---|---|---|---|---|---|
| 01 título | 17 | 0 | 0 | 12 | 4.9 |
| 02 modo de juego | 26 | 0 | 0 | 20 | 5.7 |
| 03 despacho (hub) | 32 | 0 | 0 | 28 | 5.3 |
| 04 sala online | 16 | 0 | 0 | 14 | 5.3 |
| 05 tarjeta de introducción | 6 | 2 | 0 | 4 | 4 |
| 06 juego (HUD) | 50 | 10 | 0 | 50 | 3 |
| 07 cuaderno · pestaña 1 | 51 | 2 | 4 | 51 | 3.6 |
| 08 cuaderno · pestaña 2 | 67 | 2 | 2 | 67 | 3.6 |
| 09 cuaderno · pestaña 3 | 51 | 2 | 4 | 51 | 3.6 |
| 10 cuaderno · Acusar | 72 | 2 | 5 | 72 | 3.6 |
| 11 Acusar · elegir culpable | 89 | 2 | 5 | 89 | 3.6 |
| 12 Acusar · ¿estáis seguros? | 77 | 2 | 5 | 77 | 3.6 |
| 13 pausa | 56 | 2 | 0 | 54 | 3.6 |
| 14 conversación | 60 | 2 | 0 | 60 | 3.6 |
| 15 resultado | 70 | 2 | 0 | 68 | 3.6 |

## Hallazgos confirmados a ojo (iPhone 14 horizontal)
1. **Acusar (texto acortado): OK.** Dos líneas, no tapa «¿Quién fue?». (Cierra el pendiente del checkpoint 46.)
2. **HUD: rótulos de objeto «Lupa», «Ganzúa», «Linterna», «Grabadora» ≈ 7,8 px reales** (límite legible ~8,5): pequeños pero se leen. → FIX-4c.
3. **HUD: panel de objetivos** ocupa mucho (arriba izquierda) y sus líneas largas quedan apretadas; «Habla con Merengue y con Pimienta (0/2)» llega al borde. → FIX-4c / ayudante de texto.
4. **Cuaderno y Acusar:** el texto de introducción de Acusar mide ≈ 7,8 px reales (legible pero pequeño). Sin textos cortados ni pisados reales.
5. Título, modo, despacho y sala online: limpios (mínimo 8,7-10,1 px).

## Hallazgos en iPhone 14 VERTICAL (390×844)
- El juego (960×540) se reduce a ~0,4× y queda en una franja central: textos de 4,3-6,6 px reales (nombre del caso, capítulo, ubicación, «Mover»). **Ilegible en vertical.** Decisión pendiente del usuario: ¿pedir girar el móvil (aviso «gira el teléfono») o aceptar vertical? Recomendación: aviso de girar, porque el juego está pensado en horizontal.

## Pendiente (no hecho aquí)
- Los otros tamaños (Pro Max, SE, tablet) están en la tabla pero NO se miraron las capturas; SE (667×375) es el más justo.
- Prueba en móvil real: no hecha.
- FIX-4a (a) globos pegados entre sí, (b) globo bajo el panel de dinero, (c) ayudante común de texto → chat MEDIUM, usando este informe.


## REPETICIÓN TRAS FIX-4c (21 oct, v0.7.50)
Se repitió `tools/auditoria_pantallas.js` en los 5 tamaños (en vertical el script ahora solo comprueba el aviso, porque el juego se detiene). Sin errores de consola.
- **iPhone 14 vertical (390×844): el aviso «gira el teléfono» SALE** (cierra P10). Captura revisada: legible y opaca.
- **iPhone 14 horizontal, juego (HUD):** textos pequeños (<8,5 px) **12 → 4** (quedan «Cambiar» 7,1 px y «Detective» 6,4 px, los botones de la franja derecha; antes también los rótulos de herramientas); **cuaderno: 8 → 0** (mínimo 7,8 → 8,6 px, gracias al texto de Acusar y al ayudante). 0 textos pisados en el HUD.
- **Pro Max:** HUD 4 pequeños (mín. 7,1 px). **Tablet:** HUD 2 pequeños (mín. 7,8 px).
- **iPhone SE (667×375), el más justo:** HUD 38 pequeños (mín. 5,1 px); cuaderno 35 pequeños (mín. 6,8 px). Es la pantalla más pequeña; no se actuó (el móvil del usuario es iPhone 14).
- «Pisados» 6-8 en pantallas 07-15 del iPhone 14: son pares del HUD que queda DETRÁS del cuaderno («Habla con Merengue…» con «Aún no habéis encontrado…», «Linterna» con el pie del cuaderno…) = falso positivo conocido; no se ve en las capturas.
- **Capturas del HUD (844×390 y 667×375) revisadas:** sin choques (checkpoint 55).
**Hallazgo nuevo (no arreglado, opcional):** los rótulos «Cambiar» y «Detective» de los botones de la franja derecha miden 6-7 px reales; subirlos (p. ej. a 13 px) sería un retoque pequeño.
