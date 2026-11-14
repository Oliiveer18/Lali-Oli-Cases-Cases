# LA BIBLIA DEL CASO · contrato v1 (fase 3)
Creado en v0.7.11 (preparación de la fase 3). **Este documento es la fuente de verdad del generador.** No se reabre en 3B-3D: si algo no encaja, se anota en `docs/ESTADO_FASE3.md` y se decide al cerrar la fase.

## Qué es
Una **biblia** es un objeto de datos puros (JSON, sin funciones) que describe la *verdad* de un misterio: quién lo hizo, cómo, por qué, qué pasó hora a hora, qué dice cada uno, quién miente y qué pistas existen. No tiene mapas ni dibujos. Un **compilador** (3D) la convierte en un `def` (formato oficial v1) que pasa por `G.validateCase` y `G.reviewCase`.

```
semilla ──genTruth──▶ biblia (verdad)  ──genClues──▶ biblia (+pistas, mentiras)  ──compileBible──▶ def  ──validate+review──▶ aceptado
```
`G.generateCase(seed)` encadena todo y **siempre devuelve un caso aceptado**: si una semilla sale mal, reintenta de forma determinista con semillas derivadas (`seed`, `seed+0x9e3779b1`, …, máx. 8 intentos). Se mide cuántas aceptan al primer intento (objetivo ≥ 90 %).

## Decisiones cerradas (no reabrir)
1. **Puerta de la fase 3 = validador + revisor** (`validateCase` ok y `reviewCase` ok con equidad ≥ 90, sin errores). La *nota de calidad con bot y duración* (`qualityCase`) **no** se usa aquí: exige mapas reales (comprobado: un caso mínimo da `demasiado_corto`). Se activará en la fase 4 con plantillas de sala.
2. **Un solo esquema: «robo»** (se roba un objeto de un lugar). Sabotaje/desaparición son fase 5; el contrato ya deja el campo `schema` para ellos.
3. **Reparto**: 1 cliente + 4 a 6 sospechosos. Los aspectos salen de `G.LOOKS`, que hoy solo tiene 7 (se pueden repetir en sospechosos distintos). El generador de personajes nuevo es fase 4.
4. **Lugares**: 3 a 5 por caso, de una lista base abstracta (`tienda`, `cocina`, `almacen`, `callejon`, `taller`). Cada lugar será una sala; en 3D son salas de relleno de 14×9 con 4 huecos para objetos.
5. **Determinismo**: solo `G.rng(seed)`. Prohibido `Math.random`, `Date`, orden de claves no estable. Misma semilla + misma `G.GEN_VERSION` ⇒ biblia idéntica byte a byte.
6. **Código de caso** = `G<GEN_VERSION>-<semilla en base 36>`; `G.GEN_VERSION` empieza en 1 y sube si cambia cualquier salida del generador.
7. **Módulos ≤ ~300 líneas** y funciones puras. Textos y bancos de frases viven en `src/gen_data.js`, no mezclados con la lógica.
8. **El caso 1 no se toca.** Los generados se registran en memoria (`G.CASES[def.id]`), nunca en `case*.js`.

## Formato de la biblia
```
{
  format: 1,                 // versión del contrato
  gen: 1,                    // G.GEN_VERSION con que se generó
  seed: 12345,               // entero ≥ 0
  schema: 'robo',
  code: 'G1-9ix',            // código de caso
  places: [ { id:'tienda', name:'Tienda' }, … ],            // 3..5, ids únicos
  object: { id:'tarta', name:'la tarta', place:'tienda' },  // lo robado y dónde estaba
  cast: [ { id, name, role:'cliente'|'sospechoso', look, trait } ],  // trait: 'nervioso'|'soberbio'|'evasivo'|'amable'|'seco'
  truth: {
    culprit: 'pimienta',
    method:  { id:'carretilla', text:'…', needs:['<pista>'] },   // needs: pistas que lo demuestran (≥ 1 en la biblia completa)
    motive:  { id:'error',      text:'…', needs:['<pista>'] },
    window:  { from: 1380, to: 1440, place:'tienda' },      // minutos desde 00:00; el robo ocurre aquí
    timeline: [ { t:1350, until:1380, who:'ana', place:'cocina', doing:'…', witnesses:['beto'] }, … ],
    decoys: { methods:[ { id, text, needs? } ], motives:[ { id, text, needs? } ] }   // señuelos (≥ 1 de cada)
  },
  alibis: { <sospechosoId>: { claim:{ place, from, to }, holds:true|false, clearedBy:'<claveDePista>'|null } },
  lies:   [ { who, said, truth, refutedBy:['<pista>', …] } ],
  clues:  [ { id, title, kind, text, role, points:{<sospechoso>:n}, source:{ type:'prop'|'npc', place?, npc?, topic? }, derivedFrom:<índice de timeline>|null, kindAntes?: <tipo previo; solo una pista falsa que pasó a «grabación» señuelo (c4-3 3/4-b)> } ],
  proof:  ['<pista>', …]     // ≥ 3, todas con role 'prueba'
}
```
`role` de una pista: `prueba` (apunta al culpable), `descarte` (exculpa a un inocente), `falsa` (hace sospechar de un inocente), `refuta` (desmonta una mentira), `ambiente` (da color, sin peso).
`kind` ∈ `física`, `documento`, `grabación`, `testimonio` (los de `FORMATO_DE_CASO.md`; `deducción` no se genera).

## Invariantes que comprueba `G.checkBible(b)` (3A)
Devuelve `{ ok, errors:[{code,path,msg}] }`. Son 14 reglas: las 13 primeras las comprueba `checkBible` (cada una con su código y su prueba negativa); `determinismo` se comprueba en las pruebas de 3B-3D. Con `{ partial:true }` se saltan las reglas de pistas (para la biblia parcial de 3B).
| Código | Regla |
|---|---|
| `formato` | campos obligatorios, tipos, ids únicos, `format`/`gen` correctos, datos serializables |
| `reparto` | 1 cliente y 4-6 sospechosos; `culprit` es sospechoso; `look` existe en `G.LOOKS` |
| `lugares` | 3-5 lugares (3-6 con `GEN_VERSION` >= 7: el Despacho del dueño); `object.place` y toda referencia de lugar existen |
| `cronologia` | tiempos 0-1440 con `t < until`; nadie está en dos sitios a la vez; ordenada; todo `who`/`witnesses` existe |
| `ventana` | solo el culpable está en el lugar del robo durante la ventana; ningún inocente figura allí en la cronología |
| `coartada_inocente` | cada inocente tiene en la ventana una posición en otro lugar **verificable**: `clearedBy` apunta a una pista `descarte` alcanzable. Excepción: máximo 1 inocente sin descarte, que debe tener `falsa` y quedar ≥ 3 puntos por debajo del culpable |
| `coartada_culpable` | `alibis[culprit].holds === false` y su `claim` contradice la cronología |
| `mentiras` | ≥ 2 mentiras (culpable + ≥ 1 inocente); cada una contradice la cronología; cada `refutedBy` tiene ≥ 1 pista cuya fuente **no es el mentiroso** |
| `pruebas` | `proof` ≥ 3, todas `prueba`, `points[culprit] > 0`, derivadas de la cronología (`derivedFrom` del culpable) |
| `pistas_falsas` | cada inocente (salvo decorativos) tiene ≥ 1 pista `falsa` que no está en `proof` |
| `puntos` | suma de puntos contra el culpable ≥ 12; ningún inocente no descartable llega a (culpable − 3) |
| `alcanzable` | toda pista tiene fuente: un objeto en un lugar existente o un tema de un personaje; ≤ 4 objetos por lugar |
| `metodo_motivo` | existen ≥ 2 métodos y ≥ 2 motivos posibles (el verdadero + señuelos) con `needs` alcanzables |
| `determinismo` | (en las pruebas) misma semilla ⇒ `JSON.stringify` idéntico, dos veces |

## Cómo se compila (`G.compileBible`, fase 3D)
Referencia viva: **`tools/spike_compilador.js`** (caso mínimo que ya pasa validador y revisor con equidad 100). Reglas:
- `places` → `rooms`: mapa 14×9 de relleno (borde pared), puertas en la pared norte formando una cadena `a↔b↔c…`; la sala de `start` es el primer lugar. Ocupación máxima 4 objetos sólidos por sala en las baldosas (3,3) (9,3) (3,6) (9,6). **Las baldosas de arranque `p1`/`p2` y las de los personajes deben ser suelo libre** (el validador rechaza una baldosa ocupada por un objeto sólido).
- `clues` con `source.type:'prop'` → objeto con `steps:[{tool:null, who:'rex', text, clue}]`; `source.type:'npc'` → tema del personaje con `fx:{clue}`.
- `cast` → `suspects` (`clearedBy` = pistas `descarte` que lo exculpan) y `npcs`; el cliente es `clientId`. Cada personaje: `first`, tema `coartada`, `chat`, `press`, `evidenceDefault`, `evidence['*']`.
- `lies` → `def.lies[id] = { flag:'lie_<id>', refutedBy, said }` **y** la respuesta del tema `coartada` del mentiroso lleva `fx:{flag:'lie_<id>'}` (si no, el validador la rechaza).
- `truth.method/motive` → `solution.methods`/`motives` (correcto + señuelos) con `needs` = pistas que lo demuestran; `proof` tal cual.
- `chapters`: cap. 1 con objetivos de pistas (`min` ≈ 60 % de las físicas) y de hablar con todos (`talked_<id>`); cap. 2 con `case_closed`.
- `placement`: todos los personajes en cap. 1, sobre baldosas libres.
- `parSeconds` y `reward` provisionales (600 s / 100); se calibran en fase 4 con el bot.
- `epilogue`, `title`, `client`, `blurb` a partir de plantillas de `gen_data.js`.

## Lo que NO hace la fase 3
Mapas reales, decoración, aspectos nuevos, humor fino, `banter` del compañero, bot de recorrido, nota de calidad, botón «Caso nuevo», online. Todo eso es fase 4 en adelante.

## Aclaraciones de 3A (v0.7.12) · el contrato sigue siendo v1
Al implementar `G.checkBible` (`src/bible.js`) hubo que precisar siete puntos. No cambian la idea; el código y `test_bible.js` son la referencia exacta.
1. **Señuelos**: el formato no tenía dónde guardar los métodos/móviles falsos que exige `metodo_motivo`. Ahora `truth.method` y `truth.motive` llevan `needs` (pistas que los demuestran) y existe `truth.decoys` (`methods` y `motives`, ≥ 1 señuelo de cada; `needs` opcional). En una biblia parcial, `needs` va vacío y lo rellena 3C.
2. **`alibis[x].holds`** significa «lo que el sospechoso *dice* coincide con la cronología» (la franja `claim` está cubierta por sus entradas en ese lugar). No significa que sea inocente: un inocente que miente tiene `holds:false` y aun así está, según la cronología, en otro lugar durante la ventana. Todo sospechoso con `holds:false` debe aparecer en `lies` (regla de `mentiras`).
3. **Testigos**: un testigo de una franja debe tener una franja propia en el mismo lugar que se solape con ella (si no, la coartada no sería verificable). Nadie es testigo de sí mismo.
4. **Ventana**: el culpable está presente en el lugar del robo durante *toda* la ventana (franjas que la cubren) y nadie más del reparto, cliente incluido, tiene una franja que se solape con ella en ese lugar. La franja `claim` del culpable debe solaparse con la ventana y la cronología debe contradecirla.
5. **Modo parcial** (`{ partial:true }`): salta solo lo que depende de pistas (`clearedBy`/descartes, `mentiras`, `pruebas`, `pistas_falsas`, `puntos`, `alcanzable`, `metodo_motivo`). Siguen activos `formato`, `reparto`, `lugares`, `cronologia`, `ventana`, `coartada_culpable` y, de `coartada_inocente`, que `holds` sea coherente y que cada inocente esté verificablemente en otro lugar durante la ventana.
6. **Refutaciones y descartes con origen en la cronología**: para cada mentira, al menos una pista de `refutedBy` debe venir de fuera del mentiroso (objeto, o testimonio de otro) y derivar (`derivedFrom`) de una franja *suya* que contradiga su `claim` (otro lugar, franja solapada). Un `clearedBy` debe ser una pista `descarte` derivada de una franja del inocente fuera del lugar del robo y dentro de la ventana. Cada prueba de `proof` deriva de una franja del culpable.
7. **Coherencia de roles y puntos** (`puntos`): `prueba` suma contra el culpable; `falsa` suma contra algún inocente y nunca contra el culpable; `descarte` no suma a nadie; `ambiente` no lleva puntos; solo se puntúa a sospechosos (−20…20). Un inocente sin descarte debe quedar **≥ 3 puntos** por debajo del culpable (alineado con el aviso `inocente_cercano` del revisor) y como mucho uno se queda sin descarte.
Además: los ids `rex`, `luna` y `narrator` están reservados por el motor; cualquier campo desconocido se rechaza (errata); solo se admiten datos serializables (sin ciclos). `src/bible.js` **no** entra aún en `build.js` (el juego no lo necesita hasta la fase 4).

## Cambios de 4A (v0.7.22) · el contrato sigue siendo v1, `GEN_VERSION` 3 (códigos `G3-…`)
La regla «4 pruebas de tipo concreto» ya no es fija. Lo que cambia (`src/bible.js` y `test_bible.js` son la referencia exacta):
1. **Campos nuevos (opcionales; una biblia hecha a mano sin ellos solo debe cumplir `proof ≥ 3`):** `captureForm` (una clave de `G.CAPTURE_FORMS`), `level` (`facil`/`normal`/`dificil`) y `deceptive: [{ who, why }]` (sospechosos engañosos y su explicación).
2. **Formas de captura (`G.CAPTURE_FORMS`):** `clasica` = rastro+testigo+escondite+método · `desliz` = desliz+escondite+método (confesión indirecta: alguien oyó al culpable decir dónde acabaría el botín) · `testigos_cruzados` = ausente+testigo+escondite+método (quien estaba donde el culpable dice haber estado no lo vio; otro lo vio donde no debía) · `objeto_imposible` = rastro+imposible+método (en el escondite aparece algo que solo se guarda en el lugar del robo). Regla `forma_captura`: los prefijos de `proof` (`id.split('_')[0]`) deben ser exactamente los de la forma. Si `testigos_cruzados` no tiene testigo válido, `genTruth` la cambia a `clasica` (ocurre en ~4 % de las semillas).
3. **Nivel y engañosos:** `G.DECOY_RANGE` = fácil 0-1, normal 1-2, difícil 2-3; `G.maxDecoys(nSospechosos)` = 2 con 4 sospechosos, 3 con más (el rango se recorta). **Decisión:** el nivel de la biblia sale de la semilla (35 % fácil, 35 % normal, 30 % difícil) y fija cuántos engañosos hay; la dificultad que elige el jugador NO esconde ni revela engañosos. `G.generateCase(seed, { level, form })` y `G.genTruth(seed, opts)` aceptan esas dos opciones solo para pruebas y herramientas (con ellas, el código de caso no basta para reproducir el caso).
4. **Reglas nuevas de `checkBible`:** `forma_captura` (arriba) y `enganosos`: el engañoso es un sospechoso inocente y no repetido, está dentro del rango de su nivel, **tiene pista de descarte** (`clearedBy`) y suma al menos el `G.DECOY_RATIO` = 60 % de la sospecha del culpable (por eso «parece el culpable perfecto» y aun así se puede descartar). `deceptive[i].why` es la actividad real que explica su aparente culpa; los engañosos nunca son testigos de cargo. Con esto `G.BIBLE_CODES` tiene 15 códigos.
5. **Huella v2:** `decoy` = recuento 0-3 y `capture` = `captureForm`; `G.FINGERPRINT_GOALS` exige ≥ 4 formas, ninguna > 40 % y los cuatro recuentos de engañosos.

## Cambios de 4B · parte de aspectos (v0.7.23) · el contrato sigue siendo v1, `GEN_VERSION` 4 (códigos `G4-…`)
1. **Regla nueva en `reparto`:** dos personajes del mismo caso (cliente incluido) no pueden tener el mismo `look`. La biblia escrita a mano de `test_bible.js` ya la cumplía.
2. **Aspectos:** `G.GEN_DATA.looks` = los 4 de siempre (`hogaza`, `baguette`, `merengue`, `pimienta`) + el pool generado `asp_01…asp_36` (`G.GEN_LOOK_IDS`, definido como datos en `src/sprites_b.js`). `genTruth` los reparte con su propia secuencia de azar (`seed ^ 0x1ca5`) y sin repetir. El cliente sigue usando `cliente`. Los 7 aspectos de siempre no cambian (el caso 1 sigue igual; `test_looks.js` lo comprueba con un hash).
3. Cambiar el pool (`G.LOOK_PARTS`, `G.LOOK_POOL_SIZE`, la semilla `0x10075`) o `G.GEN_DATA.looks` cambia las biblias: hay que subir `G.GEN_VERSION`.

## Decisión para 4C-1a y 4C-1b (fijada por el usuario tras v0.7.24) · `GEN_VERSION` NO cambia
Las subfases **4C-1a** (plantillas de sala, low), **4C-1b** (primera mecánica con herramientas, medium) y **4C-2a** (más plantillas y calle, low) **no cambian `G.GEN_VERSION`** (se queda en 4, códigos `G4-…`) ni el contrato de la biblia (v1): los códigos de caso ya generados siguen reproduciendo la misma biblia. La plantilla de sala (`room.template`) y la mecánica de cada caso se eligen **en el compilador** (`src/compile.js`), de forma determinista desde la semilla y con un azar propio que no altera lo que ya sale de `genTruth`/`genClues`; el `def` compilado sí cambia. Si una subfase posterior (4C-2b o después) necesita que la mecánica quede escrita en la biblia (por ejemplo para el informe o el revisor), se sube entonces `GEN_VERSION` a 5 y se anota aquí. Regla de seguridad: si en 4C-1a, 4C-1b o 4C-2a hiciera falta tocar `genTruth` o `genClues`, se para y se pregunta al usuario antes de subir la versión.

## Nota de 4C-2a (v0.7.27) · sin cambios en la biblia ni en `GEN_VERSION`
`G.GEN_DATA.rooms[lugar]` es ahora una lista de variantes con peso; `room.template` del caso compilado es el id de la variante elegida (por ejemplo `calle_esquina`). La huella deduce `scene` (`calle` o `interior`) de ese id con `G.roomScene`; el formato de caso no gana campos. Toda variante nueva debe pasar `test_rooms.js`, incluida la comprobación con el A* real (`G.findPath`): un hueco cerrado junto a un objeto lo hace inalcanzable para el bot y el compañero IA.

## Nota de 4C-2b-1 (v0.7.28) · sin cambios en la biblia ni en `GEN_VERSION`
Empujar es una mecánica del compilador: elige con un azar propio una pista de objeto (física o documento) que no lleve ya una herramienta y la oculta tras un objeto pesado. La biblia (verdad, pistas, mentiras) no cambia: la misma semilla da la misma biblia que en la v0.7.27.

## Nota de 4C-2b-2 (v0.7.29) · sin cambios en la biblia ni en `GEN_VERSION`
El vigilante se elige en el compilador (azar `seed^0x5161`); no entra en la biblia, `genTruth` ni `genClues`.

## Cambios de 4C-3a (v0.7.30) · el contrato sigue siendo v1, `GEN_VERSION` sigue en 4
Solo arte: 8 aspectos de policía (`G.POLICE_LOOKS`, definidos después del pool: `asp_01…` y los 7 de siempre no cambian) y 13 sprites nuevos. Ningún campo de la biblia ni del formato de caso cambia, y el generador aún no los usa (4C-3b). Un caso ya puede usar esos ids en `look` a mano: existen en `G.LOOKS`.

## Cambios de 4C-3b-1 (v0.7.31) · el contrato sigue siendo v1, `GEN_VERSION` sigue en 4
**4C-3b-2 (v0.7.32):** el aliado de policía y su escena se añaden en el COMPILADOR (azar `seed ^ 0xa11e5`); la biblia no cambia ni `GEN_VERSION` (sigue en 4). Lo que dice el aliado solo repite lo que ya está en la biblia (ventana del robo `truth.window`, objeto, lugar de una pista de objeto) o es una broma sin nombres; sin pistas, banderas ni descartes. Si en el futuro el aliado debe dar datos nuevos, deberá nacer en `genClues`/la biblia y subir `GEN_VERSION`.

Solo animación visual (`G.ANIMS` en `sprites_c.js`, capa animada en `world.js`): ninguna regla de la biblia, ni del formato de caso, ni del compilador cambia. Los ids animados (`police_car_0`, `police_tape_h/v`, `decal_puddle`, `lamp_post_blink`, `interrogation_table`) son sprites normales para el validador; el generador aún no los usa (4C-3b-2).

## Cambios de 4C-4a (v0.7.33) · el contrato sigue siendo v1, `GEN_VERSION` sigue en 4
El ambiente (`def.mood`) se añade en el COMPILADOR con azar propio (`seed ^ 0x4d00d`); la biblia no cambia. Solo cambian textos (títulos, sinopsis, cliente, tema «¿Ha notado algo raro?», aliado y una línea de epílogo); los hechos (pistas, mentiras, solución, salas) son idénticos en los tres ambientes (`test_mood.js` lo comprueba). Cada frase oscura va seguida de su remate gracioso.

## Cambios de 4C-4b (v0.7.34) · sin cambios en la biblia ni en `GEN_VERSION` (sigue en 4)
Atmósfera II es solo capa visual y sonora del ambiente `def.mood`; la biblia, `genTruth`, `genClues`, el validador, el revisor y el bot no cambian. Todo está en el compilador y el motor:
- **Ajustes por ambiente** (`compile.js`): `G.MOOD_FX` y `G.moodFx(def, idPlantilla)`. Devuelve `null` en `claro`, sin `mood` y en el caso 1; en `inquietante` y `macabro` da oscuridad, parpadeo, viñetas, volumen del zumbido, segundos medios entre crujidos y niebla (sala de calle) o polvo (interior). Solo lo lee el mundo al dibujar y sonar: no se guarda ni viaja por la red.
- **Objetos de ambiente** (bloque «4C-4b» de `compileBible`, azar propio `seed ^ 0xa7405`, datos en `GEN_DATA.compile.atmos`): charcos `decal_jam`/`decal_sauce` (claro e inquietante), mancha `decal_stain` (macabro, 1-2), silla `rocking_chair` (objeto sólido sin pasos) y ventana `window_dark` (decoración en la pared norte, solo interiores). La silla solo se coloca donde no corta ningún camino ni tapa un objeto o una puerta; si no hay sitio, se omite. Respeta el tope de animados por sala (`G.ANIM_MAX_PER_ROOM`, 6).
- **Formato de caso:** sin campos nuevos; el efecto de sonido `creak` entra en `G.SFX_NAMES` (y en `schema.js`).
- **Contrato:** los objetos de ambiente se eligen con azar propio, así que por diseño no alteran hechos, pistas ni colocación de lo anterior; añaden decoración, charcos o manchas y, a veces, una silla. Caso 1 idéntico (hash 74937935). Pruebas: `test_atmos.js` y `tools/atmos_browser_test.js`.


## Cambios de 4C-4c-1 (v0.7.35) · SUBE `GEN_VERSION` de 4 a 5 (códigos `G5-…`)
- **Campos opcionales nuevos de la biblia:** `mood` (uno de `G.MOODS`: `claro`, `inquietante`, `macabro`) y `matiz` (lista de ids de pista). Una biblia sin `mood` (hecha a mano, `genClues` sin opciones) NO lleva matiz.
- **Regla nueva `matiz`** (16 reglas en `G.BIBLE_CODES`): el nº de matices es `G.MATIZ_COUNT[mood]` (claro 0 · inquietante 2 · macabro 3; 0 si no hay `mood`); cada id existe, es una pista de OBJETO (`source.type === 'prop'`) de rol `prueba`, `falsa` o `refuta`, y no se repite. Nunca `descarte` ni testimonios.
- **Qué hace el matiz:** al `text` de esas pistas se le pega al final `' ' + susto + ' ' + remate` (un par distinto por pista dentro del caso, del banco `GEN_DATA.clueTpl.matiz[ambiente][tipo]`, tipos `fisica` · `documento` · `grabacion`, 48 pares). Puntos (`points`), fuentes, roles y derivaciones son idénticos en los tres ambientes: el caso sigue siendo igual de justo y resoluble.
- **Orden de decisiones:** `generateCase` decide el ambiente ANTES de las pistas (`opts.mood` o `G.pickMood(s)`) y se lo pasa a `genClues(bible, { mood })`, que lo guarda en `bible.mood`; `compileBible` usa `opts.mood`, si no `bible.mood`, si no `G.pickMood(b.seed)`. Azar propio del matiz: `seed ^ 0x4c4c1` (no mueve el resto). `G.MOODS` y `G.MATIZ_COUNT` viven en `bible.js`; `G.MOOD_WEIGHTS` y `G.pickMood`, en `compile.js`.

## Cambios de 4C-4c-2 (v0.7.36) · SIN cambios en la biblia ni en `GEN_VERSION` (sigue en 5)
- **La biblia no cambia:** ni campos, ni reglas (`G.BIBLE_CODES` sigue en 16), ni `genTruth`, `genClues` o `bible.js`. Todo vive en `compile.js` y `G.GEN_DATA.compile.macabro` (`sit.items` y `giro`), con azares propios: `seed ^ 0x4c4c2` (situaciones) y `seed ^ 0x4c4c3` (giro). Los códigos `G5-…` siguen identificando la receta.
- **Situaciones macabras del escenario:** objeto sólido examinable `sit_0`/`sit_1` sin pista, banderas, herramienta ni vigilante, con un par [susto, remate]. claro 0 · inquietante 0-1 (solo las `soft`) · macabro 1-2. No cambian ningún hecho; solo van en hueco libre que no tapa objetos, puertas ni personajes, no corta la sala y deja una baldosa contigua alcanzable (`npcOk`, `reach`).
- **Giro del testigo:** solo macabro (~70 %), a un personaje que no es el cliente, el aliado ni un gato; añade el tema `f_giro` («¿Vio a alguien más?») con un par [susto, remate]. Solo texto: sin puntos, fuentes ni derivaciones.
- **Para quien compare hechos:** `sit_*` y `f_giro` no son hechos del caso (`test_mood.js` los ignora al comparar ambientes); `test_macabro.js` vigila bancos, colocación, A* real hasta todo personaje y objeto examinable, determinismo y que el bot gane en macabro.

