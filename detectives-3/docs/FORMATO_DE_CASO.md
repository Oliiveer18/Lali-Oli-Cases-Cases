# FORMATO OFICIAL DE UN CASO · versión 1
Creado en v0.7.7 (fábrica de casos, fase 1B-2). La fuente de verdad es `src/schema.js`; este documento lo explica en cristiano.

Un caso es un objeto JavaScript (datos puros, sin funciones) que se registra con `G.CASES[def.id] = def` en un archivo `src/caseN.js`.
Se comprueba con `G.validateCase(def)` (que llama primero a `G.checkCaseFormat(def)`) y todos los casos pasan por `npm test`.

## Cómo se comprueba (dos niveles)
1. **Forma** (`schema.js`): campos obligatorios, tipos, valores permitidos y erratas. Un campo que no existe en el formato se rechaza («campo desconocido… ¿errata?»). Si la forma está mal, solo se informa de eso.
2. **Referencias cruzadas** (`schema.js`) y **validador clásico + simulación** (`logic.js`): que todo lo que se nombra exista y que una partida perfecta pueda resolver el caso.

Esto NO mide si el caso es justo ni divertido (solo culpable encaja, mentiras refutables, duración…): eso es la fase 2.

Los errores salen con la ruta del dato, p. ej. `caso.rooms.cocina.props[cajon].steps[0].tool: la herramienta «ariete» no existe`.

## Convenciones
- **Ids** de salas, personajes y pistas: letras, números y `_`, empezando por letra (`cocina`, `huellas_botas`). Ids de objetos y puertas: letras, números y `_`. El `id` del caso: solo minúsculas, números y `_`.
- **Coordenadas**: baldosas enteras (`x` columna, `y` fila, desde 0 arriba a la izquierda). Una baldosa mide `G.TS` píxeles.
- **Mapa** (`map`): lista de filas de texto. `#` = pared, cualquier otro carácter = suelo. Todas las filas con la misma longitud y **el borde todo pared**.
- **Texto**: siempre no vacío. Las listas de frases (`say`, `first`…) tienen al menos una.
- `null` solo se admite donde se indica (`sprite`, `tool`).

## Campos del caso
| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | sí | Identificador del caso (debe coincidir con su clave en `G.CASES`). |
| `title`, `client`, `blurb` | sí | Título, nombre del cliente y sinopsis (se ve en la tarjeta del caso). |
| `level` | sí | Número de caso (entero ≥ 1). |
| `parSeconds` | sí | Tiempo de referencia en segundos (≥ 60); da la 2.ª estrella y el límite de Difícil. |
| `reward` | sí | Dinero base (entero ≥ 0). |
| `start` | sí | `{ room, p1:[x,y], p2:[x,y] }`: sala y baldosas de arranque (suelo libre, distintas entre sí). **La sala de arranque define qué sala está abierta desde el principio.** |
| `clientId` | sí | Id del personaje que es el cliente (no puede ser un gato). |
| `clues` | sí (≥ 1) | Pistas por id (ver abajo). |
| `suspects` | sí (≥ 2) | Lista de sospechosos. |
| `solution` | sí | Culpable, método, motivo y pruebas. |
| `chapters` | sí (≥ 1) | Capítulos en orden. |
| `rooms` | sí (≥ 1) | Salas por id. |
| `npcs` | sí (≥ 1) | Personajes por id. |
| `epilogue` | sí | `{ win:[líneas], fail:[líneas], timeout?:[líneas] }`. `timeout` (opcional, desde v0.7.21) son las frases de «se acabó el tiempo» (Difícil); si falta, el cliente dice una frase neutra. |
| `placement` | no | Dónde está cada personaje en cada capítulo. **Todo personaje necesita colocación.** |
| `lies` | no | Mentiras desmontables por personaje. |
| `banter` | no | Charla del compañero IA por jugador (`rex`, `luna`). |
| `tools`, `startTool` | no | Reparto de herramientas (fase 1A). |
| `mood` | no | Ambiente (4C-4a): `claro`, `inquietante` o `macabro`. Solo cambia TEXTOS (título, sinopsis, saludo y relato del cliente, tema «¿Ha notado algo raro?», tema de la noche del aliado y una línea final del epílogo); los hechos del caso no cambian. Los casos generados lo llevan; el caso 1 no (equivale a `claro`). |
| `genLevel` | no | Dificultad con la que se generó el caso (S3b-1): `facil`, `normal` o `dificil` (la de la biblia; cambia el nº de engañosos 0-1 / 1-2 / 2-3). **No es `level`** (ese es el número de caso). La nota de calidad (`G.qualityCase`) lo usa para elegir el perfil y la dificultad del bot (`facil`→`easy`, `normal`→`normal`, `dificil`→`hard`). Los casos generados lo llevan; el caso 1 (hecho a mano) no: se mide con la dificultad que se le pida. |
| `genDecoys` | no | Nº de engañosos del caso generado (S3b-1; entero ≥ 0; 0-1 en facil, 1-2 en normal, 2-3 en dificil, con 4 sospechosos 2 como mucho). Solo lo usa la nota de calidad para comprobar el rango del nivel. Va junto a `genLevel`. |
| `format` | no | Versión del formato (por defecto 1). Un caso de una versión futura se rechaza. |
| `detectives` | no | Nombres (heredado; el motor usa `G.ROLES`). |

### Pista (`clues[id]`)
`title`, `icon` (un sprite que exista, p. ej. `ico_lupa`), `kind` (`física`, `documento`, `grabación`, `testimonio`, `deducción`), `text` obligatorios. Opcional `sus: { sospechosoId: número }` (positivo acusa, negativo exculpa).

### Sospechoso (`suspects[]`)
`id`, `name`, `desc`, `look` (un aspecto de `G.LOOKS`, o `cat`), `clearedBy` (lista de pistas que lo descartan, puede ir vacía). Opcional `easyHidden`. Aviso si no hay un personaje con su mismo id.

### Solución (`solution`)
`culprit` (id de sospechoso), `method` y `motive` (ids correctos), `methods` y `motives` (≥ 2 opciones `{ id, text, needs? }`), `proof` (≥ 3 pistas que de verdad señalan al culpable, sin repetir).

### Capítulos (`chapters[]`)
`id` (1, 2, 3… en orden), `title`, `goals` (≥ 1). Opcional `intro` y `outro` (líneas `{ who, text }`).
Objetivo: `id` (único en todo el caso), `text` y **exactamente uno** de `clue` (una pista), `clues` (varias, con `min` opcional) o `flags` (banderas, con `min` opcional). El último capítulo debería tener un objetivo con la bandera `case_closed` (acusar).
`who` puede ser `rex`, `luna`, `narrator` o el id de un personaje.

### Sala (`rooms[id]`)
Obligatorios: `name`, `map`, `props`, `doors`. Opcionales: `floor` (`wood`, `tile`, `cobble`, `grass`, `carpet`, `lab`), `wallStyle` (`stone`), `ambient` (color CSS), `template` (id de la plantilla de sala de la que sale, solo informativo; desde v0.7.25), `decor` y `decals` (`{ sprite, x, y, w?, h?, big? }`).
Todas las salas deben ser alcanzables por puertas desde la sala de arranque.

**Objeto (`props[]`)**: `id`, `sprite` (nombre o `null` para una zona invisible), `x`, `y` obligatorios. Opcionales: `w`, `h`, `dy`, `solid`, `label`, `shimmer`, `steps`, `doneText`, `denied`, `visible` (condición), `chapterMin`, `uvOnly`, `uvMark`, `swap`, `ref`, `pigeon`, `listen`, `watcher`.
- Un objeto no puede salirse del mapa por los lados (`w` × `h` desde `x,y`).
- `steps[]` (pasos de examen): `who`, `text` obligatorios; `tool` (`lupa`, `ganzua`, `uv`, `grabadora`, `coop` o `null`), `time`, `clue`, `fx`, `requires` (condición), `mini` (minijuego `code` o `timeline`).
- `watcher`: id del personaje que vigila esa acción (sigilo). **Desde v0.7.21 vale para cualquier personaje y cualquier sala**: vigila mientras esté en la sala del objeto (según `placement`), mirando y dejando de mirar en ciclos (en Fácil nunca mira). El ritmo, las caras y la frase se ajustan en `npcs.<id>.watch` (ver abajo). El validador exige: personaje existente, no gato, presente en esa sala en algún capítulo y una **ventana segura** (ciclo − mirada) de al menos la duración de cada paso del objeto + 1 s en Normal y Difícil (si no, sería imposible sin mejoras: el bug de la v0.5.1).

**Puerta (`doors[]`)**: ver la fase 1B-1 en el documento maestro. `id`, `x`, `sprite`, `to:{room,door}` obligatorios; `y`, `wall` (`n`, `s`, `e`, `w`), `lockedSprite`, `label`, `locked` (`tool`, `time`, `chapterMin`, `denied`, `text`; en una puerta que se abre sola, sin `tool`, `text` es el aviso que se muestra al abrirla —si falta, «¡Puerta abierta!»—), `firstOpen` (`who`, `text`, `clue`). La puerta de destino debe existir y apuntar de vuelta.

### Personaje (`npcs[id]`)
Obligatorios: `name`, `title`, `look` (de `G.LOOKS`; los gatos, con `cat: true`, quedan exentos), `first` (primera frase), `topics` (≥ 1), `evidenceDefault`, `evidence`.
Opcionales: `chat`, `press`, `cat`, `petReward` (solo gatos), `watch` (solo vigilantes).
- `watch` (v0.7.21), todo opcional; lo que falte toma `G.WATCH_DEFAULTS` (los valores del caso 1): `{ period:{normal:6.5, hard:6.0}, look:{normal:1.7, hard:2.0}, offset:2, face:{watching:'left', idle:'right'}, spotted:'¡Eh! ¿Quién anda ahí?' }`. `period` = segundos de un ciclo; `look` = segundos que mira en cada ciclo (menor que `period`); `offset` = desfase; `face` = hacia dónde mira cuando vigila y cuando no; `spotted` = lo que dice cuando te pilla. Aviso si ningún objeto lo nombra en `watcher`.
- Tema: `{ id, label, responses, show? }`; los ids de tema no se repiten dentro de un personaje.
- Respuesta: lista de frases (atajo) o `{ say, when?, fx? }`. Se usa la primera cuya condición `when` se cumple.
- `evidence`: respuesta por id de pista; la clave `'*'` vale para cualquier otra prueba.

### Condiciones (`when`, `show`, `visible`, `requires`)
Todas opcionales y combinables: `clue`, `notClue`, `anyClue`, `flag`, `notFlag`, `trustMin`, `trustMax`, `pressureMin`, `chapterMin`, `chapterMax`, `flagCountMin:{prefix,min}`, `any:[…]`, `not:{…}`.
Una condición `flag` o un objetivo `flags` que nadie puede cumplir nunca es un **error**; un `notFlag` desconocido es un aviso (probable errata).

### Efectos (`fx`)
`clue`, `flag`, `unflag`, `trust`, `pressure`, `lockFor`, `money`, `sfx` (uno de `G.SFX_NAMES`; desde v0.7.34 incluye `creak`, el crujido de la atmósfera), `moveProp:{id,dx,dy}` (el objeto debe existir en la misma sala).

### Banderas que pone el propio motor
`talked_<personaje>`, `case_closed`, `cat_reward`, `unlocked_<puerta>` (puertas con `locked`), `refuted_<personaje>` (personajes con mentira) y `<personaje>_pres_<prueba>` (al enseñar una prueba de `solution.proof`). Pueden usarse en condiciones y objetivos sin que ningún `fx` las ponga.

### Mentiras (`lies[personajeId]`)
`flag` (la que pone el personaje al mentir; **algún diálogo suyo debe ponerla**), `refutedBy` (pistas que la desmontan), `said` (la frase de la mentira).

### Colocación (`placement[personajeId]`)
Lista de `{ ch, room, x, y, face?, wander? }` con `ch` (capítulo desde el que vale) **en orden creciente** y dentro de los capítulos que existen; `face`: `up`, `down`, `left`, `right`; `wander`: lista de baldosas `[x, y]` de suelo de esa sala.

## Cómo añadir un caso nuevo
1. Crea `src/case2.js` copiando la estructura de `case1.js` y registra `G.CASES[def.id] = def`.
2. `node build.js` lo incluye solo (`case*.js` se cargan automáticamente).
3. `npm run test:fast`: el formato, el validador y la simulación dan los errores con su ruta.
4. Añade pruebas de navegador si el caso introduce mecánicas nuevas.

## Punto de escucha con charla (`props[].chat`, A4 HERR-1 2/4)
Un objeto con `listen: true` y un paso `tool: 'grabadora'` puede llevar `chat: { a, b, lines: [{ who, text }, …] }` (mín. 2 frases): dos personajes del caso (no gatos, `who` ∈ {a, b}, los dos hablan) que charlan mientras se graba. Reglas del validador: el paso dura ≥ 1,2 s por frase (`G.listenMinSeconds`); `a` y `b` coinciden en esa sala en algún capítulo ≥ `chapterMin` según `placement`. Motor: quien graba debe quedarse quieto; las frases salen como burbujas en orden, repartidas en la duración del paso; los dos se miran; moverse o cortar la grabación los calla; la charla NO se acelera con el micrófono mejorado (que solo alarga el alcance: 40 px × `listenRange`); si falta uno de los dos en la sala el objeto dice «Nadie habla aquí». `listen: true` sin `chat` (murmullo de Baguette, caso 1) sigue valiendo y cuenta como sigilo. Plantillas: `template.listen = { x, y, w, h, a:{x,y,face}, b:{x,y,face} }` (zona 2×1 con los personajes encima; fuera de `special` a propósito, para no alterar los huecos reservados). Online: las burbujas de la charla solo las ve quien graba.

## Charla grabada en casos generados y cartel de primer uso (A4 3/4-b1, v0.7.55)
- **Charla generada** (`compile.js`, azar propio `seed ^ 0x1157e`, ~40 % de los casos): objeto `rec_charla` (`sprite:null`, `listen:true`, `chapterMin:2`, un paso `grabadora` de 1,2 s × frases, `chat {a,b,lines}`, SIN `clue`). `a` y `b` = dos sospechosos (no gatos, ni aliado, ni vigilantes). `placement` de ambos = [sitio original, `ch 2` → rincón de la plantilla (`template.listen`), `ch 3` → sitio original] (ordenado por `ch`). La zona, los dos sitios y el hueco del detective (2 baldosas bajo la zona) quedan reservados. Textos: `G.GEN_DATA.compile.listen` (humor; nada del crimen). El medidor no la cuenta como paso de la historia.
- **Charla con pista (`GEN_VERSION` ≥ 6, b2 paso 2):** una pista de sostén «grabación» de una sala con `template.listen` se entrega desde la charla: objeto `obj_<id de la pista>` con `listen`, `chat`, `chapterMin: 2` y `clue` en el paso de la grabadora (pareja con azar propio `seed ^ 0x1157f`; si no hay pareja la pista se coloca como objeto normal). Con v6 la charla aparece en ~95 % de los casos.
- **Mecánicas de v6 (b2 paso 3):** `okGate` (una pista solo queda tras herramienta, empujón, sigilo o charla si no es la única del método ni del móvil y cada mentira que desmonta conserva otra refutación libre); sigilo con probabilidad `MECH.watchChanceV6` 0,6; cadena ganzúa→UV (la pista de la UV aparece al abrir el cajón de la ganzúa, bandera `abierto_<pista>`, textos `MECH.chain`, azar `seed ^ 0xc4a1`); la pista de la charla cuenta en el objetivo del cap. 2 («Escucha a los testigos») y el mínimo del objetivo «Busca pistas» del cap. 1 es `min(ceil(60 %), pistas libres)`.
- **Voz alternada:** `who` de las pistas libres, del hueco «empujable» y de las situaciones `sit_` = par/impar de `G.hash(code:voz:id)` → Oli/Lali. Las de herramienta siguen con su dueño. `who` solo decide retrato y voz del cartel; el `by` del motor no cambia.
- **Cartel de primer uso:** `G.TOOLS[x].first` (texto breve con humor). Al empezar a usar una herramienta por primera vez se muestra un aviso con su icono (evento `tooltip`, 4,2 s) y se pone la bandera `tip_<herramienta>` del caso (se guarda con la partida a medias y se sincroniza online). No lo dispara el compañero remoto.
- **Pruebas:** `test_charlas.js` (en `test.js`).
