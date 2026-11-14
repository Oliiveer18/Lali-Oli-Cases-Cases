# MP · Mini-prueba jugable (guion para el usuario) · actualizado 24 oct 2026 (códigos G6, v0.7.60)
> **Los códigos `G5-…` de pruebas anteriores ya NO valen** (el juego lo avisa: «código de otra versión del generador»). Estos `G6-…` valen mientras no cambie `compile.js`/`gen_data.js` con `GEN_VERSION` 6: **si se toca el generador, hay que volver a elegirlos.** Elegidos con una variante de `tools/elegir_mp.js` (ventanas de duración por nivel; la herramienta original filtra 21,5-26 min y no sirve para Normal y Difícil con v6).

**Los móviles deben mostrar la versión 0.7.60.** Ninguno de estos casos es el caso 1 (el de la tarta sigue reservado para ti y tu pareja).

| Prueba | Código | Título | Nivel | Tono | Salas / sospechosos | Herramientas | Nota | Bot (min) |
|---|---|---|---|---|---|---|---|---|
| **1** | `G6-3wje` | Expediente Miga: la llave maestra | **Fácil** | espías | 4 / 5 | ganzúa + grabadora + lupa + UV | 81 | 25,3 |
| **2** | `G6-2prl` | Cuando cae la harina, cae la bicicleta de reparto | **Normal** | noir | 4 / 5 | empujar + ganzúa + grabadora + lupa + UV | 78 | 27,9 |
| 3 (opcional) | `G6-95yj` | Todo por el saco de vainilla | **Difícil** | noir | 5 / 6 | empujar + ganzúa + grabadora + lupa + UV | 76 | 33,0 |

Todos: ambiente claro, el bot los gana sin atascos, el nivel sale NATURAL de la semilla (el código basta para reproducirlo) y cada código se comprobó (de nuevo el 23 oct, ya con v0.7.56): carga y regenera el MISMO caso (misma semilla, mismo JSON, mismo nivel natural).
Alternativas por si no te gusta alguno — Fácil: `G6-16ru` (cuento), `G6-4x78` (cuento), `G6-5fj5` (documental) · Normal: `G6-2jnm` (cuento), `G6-4evb` (documental), `G6-74mv` (western) · Difícil: `G6-av29` (telenovela), `G6-bpm4` (cuento), `G6-59f6` (documental). (`G6-2djn` NO se recomienda: el título es el de la prueba antigua y ya conoces esa historia.)

**Novedades que verás respecto a la prueba anterior (A4 4/4 y A5 IA-1):** cap. 1 = abrir con ganzúa (Oli) y leer con UV (Lali); cap. 2 = lupa (Oli) y charla grabada (Lali); cartel de primer uso de cada herramienta; informe del caso al empezar; en Normal y Difícil los casos duran algo más que en Fácil.
**Novedad de A5 IA-1 (compañero IA en solitario, v0.7.56):** si juegas solo, la IA ya NO espera a que pulses «Llamar a…»: se ofrece por su cuenta a los objetos que piden SU herramienta, tras una espera (Fácil 10 s · Normal 14 s · Difícil 20 s desde que el objeto está a la vista, para que vayas tú primero) y con 8 s de descanso entre tareas. Deja en paz lo que estás haciendo o tienes cerca, lo cooperativo, las puertas, acusar y enseñar pruebas. Avisa con frases con humor al ir y al acabar (según la herramienta y el tono del caso). No adivina las marcas UV ocultas: solo las hace cuando se ven. Los casos y sus códigos NO cambian.

## Cómo cargarlo
1. Abre el juego (versión web `dist/web/index.html` para jugar online; el artefacto de Claude no conecta la sala online).
2. Menú principal → **«Cargar código de caso»** → pega el código (p. ej. `G6-3wje`) → Aceptar. Pasa solo a «Elegir caso» y el caso aparece desbloqueado.
3. Elige el caso y, al elegir dificultad, **elige la de la tabla** (Fácil / Normal / Difícil).
4. **Online con 2 móviles:** los DOS deben cargar el MISMO código ANTES de crear/unirse a la sala. Modo «2 jugadores online», uno crea la sala (código de 5 letras) y el otro se une.
(Acceso provisional hasta 4E-1. Si recargas la página hay que volver a cargar el código.)

## Calidad por nivel (regla: siempre por nivel, nunca mezclada)
**Muestra de 60 casos por nivel con `GEN_VERSION` 6 (nota mín / media / máx con el bot, informe del 23 oct):** Fácil 73 / 82,2 / 88 (60/60 aceptados) · Normal 70 / 78,3 / 86 (60/60) · Difícil 69 / 74,2 / 79 (60/60). Duración humana mediana (bot): 24,7 / 28,7 / 31,8 min; rangos PROVISIONALES 20-28 · 22-32 · 24-36 (100 % dentro en los tres).
**Los 3 casos de arriba:** la nota de la tabla es la de su nivel natural. (No se da la nota del mismo caso en otra dificultad: esa medida no es fiable con esta herramienta.)

## Guion: 8 preguntas (apunta la respuesta al jugar)
1. ¿Entendiste el objetivo?
2. ¿Cuándo te aburriste?
3. ¿Qué pista no se entendió?
4. ¿Te atascaste? ¿Dónde?
5. ¿Cuánto duró (aprox.)?
6. ¿Hizo gracia algún texto? ¿Cuál?
7. ¿El compañero IA ayudó o molestó?
8. ¿Acusaste bien por lógica o por suerte?
Extra online: ¿se conectaron a la primera?, ¿se vieron/oyeron los mismos objetos y pistas en los dos móviles?, ¿hubo cortes o retrasos?
Extra A4 4/4: ¿Oli y Lali tuvisteis trabajo parecido?, ¿alguien esperó mucho sin hacer nada?, ¿se entendió la charla grabada?

Extra A5 IA-1 (compañero IA en solitario):
- a. ¿La IA se ofrece por su cuenta cuando toca, o te molesta (se mete en lo tuyo, va a un objeto que ibas a hacer tú, o se ofrece demasiado pronto)?
- b. ¿Los avisos con humor de la IA ayudan (te dicen qué ha hecho o dónde mirar) o estorban (tapan algo, cansan, se repiten)?
- c. ¿La IA te deja demasiado trabajo, demasiado poco, o el justo?

## Después
Lo que falle pasa a filas del CHECKLIST (sección de defectos). Luego, con permiso: 4W-0 → 4V-1 → 4F-0a.
