# FICHAS DE TEMÁTICA · Lali & Oli Cases
Documento nuevo (19 oct, decidido con el usuario; **solo diseño, nada implementado**). Complementa `ROADMAP.md` (§4.3: paquetes 4F-0a, 4F-0b y 4T-1…4T-7) y `DOCUMENTO_MAESTRO.md` (§0.3d).

## 1. Qué es una «temática» (y qué no)
La **temática** es **de qué trata el caso**: qué ha pasado y qué hay que averiguar. Cambia la historia, el objetivo, las pistas, las mecánicas y los personajes. No se confunde con los otros ejes, que ya existen y son independientes:
| Eje | Qué cambia | Estado |
|---|---|---|
| **Temática** (nuevo) | Qué pasó y cómo se resuelve | 6 propuestas, ver §4 |
| **Ambiente** (`mood`) | Cuánta sombra lleva: claro · inquietante · macabro | hecho (4C-4a/b/c) |
| **Tono** | La voz: cine negro, telenovela, documental, western, espías, cuento | hecho (4B-2) |
| **Escenario** | El sitio y sus 6 salas (ver `ESCENARIOS.md`) | 1 hoy (panadería); 9 con 4H |
| **Objeto estrella** (antes «tema de caso» de 4G-1) | Objeto y gag recurrente que aparece por todo el caso | pendiente (4G-1) |
| **Dificultad** | Engañosos 0-3, señuelos, sigilo, ayuda | en parte hecho; señuelos en 4F-1 |
Cualquier combinación debe ser válida, pero cada temática trae un ambiente, tono y escenarios **por defecto** (p. ej. «¿Sobrenatural?» → ambiente inquietante o macabro).

## 2. Menú «Crear caso» (decidido; se construye en 4E-1 y 4E-2)
- **Caso 1 «La Tarta Fugitiva»** sigue siendo **el caso principal del juego**. Los casos generados **se desbloquean al terminarlo** (así sirve de tutorial).
- Pantalla «Crear caso» (SIMPLIFICADA el 19 oct): **Temática** (las 6 + **Aleatorio** + **Mezclado**) y **Dificultad** (Fácil · Normal · Difícil), y nada más. **Se elimina «Personalizar»**: ambiente, tono, escenario y objeto estrella los elige el generador con valores por defecto de la temática (`ESCENARIOS.md` §2 y §7).
- **Aleatorio** (antes «Sorpresa»): primero se sortea la temática (sin repetir la última) y luego el escenario dentro de ella.
- **Mezclado:** una temática principal más **un toque** de otra (p. ej. robo + impostor), solo con parejas compatibles (§6). No se mezclan más de dos. **El escenario sale siempre de la temática principal**; el toque solo aporta pistas, charlas o personajes.
- **El código del caso guarda las elecciones**, incluida la temática (y el toque). «Aleatorio» y «Mezclado» se resuelven al crear el caso, así que el mismo código da el mismo caso en los dos móviles (R-9) y añadir temáticas nuevas no cambia códigos ya existentes.

## 3. Definición de «temática terminada» (la lista que debe cumplir cada una)
Una temática solo se da por hecha cuando cumple **todos** estos puntos:
1. **Historia propia:** qué pasó, quién, por qué y cómo; **6 a 8 historias base** distintas para que no se repita.
2. **Objetivo y acusación propios** (qué hay que señalar o encontrar al final).
3. **Una o dos mecánicas características** que solo se vean en esa temática.
4. **Tipos de pista propios** y refutación de cada trampa (R-4); el revisor de equidad los entiende.
5. **Personajes con roles propios** (juez, víctima, testigo clave…) y **charlas** pensadas para ese tipo de caso.
6. **Escenarios, objetos y curiosidades** de la temática: sus 3 escenarios (tabla temática → escenarios, `ESCENARIOS.md` §3), con ~12 curiosidades y 8 charlas por escenario.
7. **Capítulos con nombre propio**, escenas de policía e interrogatorio adaptadas, y **epílogo con la revelación** de ese tipo de caso.
8. **Presentación profesional:** portada o ficha del caso, introducción que explique qué se busca, y arte o sonido propios donde haga falta.
9. **Pruebas:** validador, revisor, bot y huella la entienden; 5000 semillas con 0 atascos; calidad > 80; jugabilidad ≥ 50; duración dentro de la meta de su dificultad (Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45 (provisionales); tras 4D-3); caso 1 intacto; ~10 frases sueltas aprobadas por el usuario; **linter en verde e informe de variedad sin empeorar (R-11, `VARIEDAD.md`)**.
Además cada paquete cumple las reglas de integración **R-1…R-10** (maestro §0.3b): todo se puede ver y hacer, alcanzable antes y después de empujar, lo opcional nunca es necesario, el mismo código da el mismo caso.

## 4. Las seis fichas
### 4.1 Robo (la que ya existe)
- **De qué trata:** desaparece un objeto absurdo; hay que averiguar quién se lo llevó.
- **Objetivo final:** acusar al culpable con pruebas.
- **Mecánicas:** herramientas (lupa, ganzúa, UV), empujar, sigilo (ya hechas).
- **Falta para estar completa:** variantes de cómo se hizo (robo con distracción, trabajo interno, coartada imposible), 6-8 historias base, capítulos y epílogo propios, ficha de presentación.
- **Toca:** `genTruth` (variantes), textos, compilador. Riesgo bajo. Paquete 4T-1.
### 4.2 Sabotaje
- **De qué trata:** algo aparece roto o estropeado (la tarta, la noria, el proyector); hay que averiguar quién, cómo y en qué orden.
- **Objetivo final:** acusar y **reconstruir el horario** de lo ocurrido.
- **Mecánicas:** mini-juego de **ordenar los hechos** (cronología); pistas de herramientas usadas y de residuos.
- **Pistas propias:** restos, herramientas fuera de sitio, horarios que no cuadran.
- **Giro frecuente:** fue un accidente en cadena, con remate de humor.
- **Toca:** `genTruth` (evento de daño), nueva pantalla o paso de reconstrucción, validador y bot (entender el orden). Coste medio-bajo. Paquete 4T-2.
### 4.3 Concurso amañado
- **De qué trata:** alguien hizo trampa en un concurso (tarta, feria, función).
- **Objetivo final:** acusar al tramposo y explicar la trampa.
- **Personajes con rol propio:** participantes (sospechosos), jueces, organizador.
- **Pistas propias:** actas y puntuaciones que comparar, ingredientes o trucos, sobornos.
- **Mecánicas:** comparar documentos (actas contra puntuaciones); más interrogatorio y menos registro de salas.
- **Toca:** `genTruth`, tipos de pista de documento, personajes con rol, charlas. Coste medio-bajo. Paquete 4T-3.
### 4.4 Impostor
- **De qué trata:** alguien no es quien dice ser (disfraz o suplantación).
- **Objetivo final:** **desenmascarar** al falso (final con animación de quitarse el disfraz).
- **Mecánicas:** fichas de identidad con **versiones** distintas (enlaza con 4F-3), **preguntas de control** que solo el verdadero sabría, contradicciones entre testimonios.
- **Pocas pistas físicas;** pesa mucho el interrogatorio.
- **Arte nuevo:** disfraces y el momento del desenmascarado.
- **Toca:** `genTruth`, `genClues` (identidad), logic (preguntas de control), arte en `sprites_*`. Coste medio-alto. Paquete 4T-4.
### 4.5 ¿Sobrenatural?
- **De qué trata:** apariciones y ruidos con explicación absurda (el fantasma tenía una explicación muy poco fantasmal).
- **Objetivo final:** acusar al culpable **y revelar el truco** (final doble).
- **Mecánicas:** sucesos que ocurren con el paso de los capítulos en las salas (con sonido), rincones oscuros, UV y sigilo. Cada fenómeno tiene su explicación.
- **Ambiente:** casi siempre inquietante o macabro; **todo momento macabro lleva remate** (regla de oro).
- **Toca:** eventos por capítulo (por hechos del caso, nunca por reloj; R-6), compilador, sonido, textos. Coste medio. Paquete 4T-5.
### 4.6 Desaparecido
- **De qué trata:** falta una mascota, un animal o una persona.
- **Objetivo final:** **localizar a quien falta** (no solo acusar), con escena final. Giro frecuente: se fue solo o a una fiesta; a veces no hay culpable, o alguien lo escondió con buena intención.
- **Mecánicas:** seguir rastros (huellas, pelos, migas), mover objetos.
- **Toca:** **la lógica de cierre del juego** (hoy el final es acusar; hay que añadir un objetivo `goal: localizar` en `logic.js`, el esquema, el validador, el revisor, el bot y la IA). Es la de más riesgo; va la última. Paquete 4T-6.

## 5. Escenarios de cada temática (DECIDIDO el 19 oct; sustituye a la tabla de afinidad ●/○/·)
Cada temática tiene 3 escenarios de 6 salas, y cada escenario sirve a dos temáticas. Un caso elige 1 de los 3 y usa 4-6 de sus salas.
| Temática | Sus 3 escenarios |
|---|---|
| Robo | panadería, museo, mercado |
| Sabotaje | teatro, cine, parque |
| Concurso amañado | panadería, circo, granja |
| Impostor | mansión, circo, cine |
| ¿Sobrenatural? | museo, mansión, teatro |
| Desaparecido | granja, parque, mercado |
Detalle (cupos, totales, piloto, orden, registro de decisiones): `docs/ESCENARIOS.md`. Con Mezclado, el escenario sale de la temática principal.

## 6. Mezcla (toque secundario)
- Una **temática principal** manda: objetivo, acusación y estructura. El **toque** añade una capa pequeña de otra (p. ej. robo + impostor: uno de los sospechosos es un suplantador, pero el objetivo sigue siendo el robo).
- El **escenario** lo pone siempre la principal; el toque no cambia de escenario.
- Solo parejas **compatibles** (tabla en 4T-7). Provisional: el toque Impostor o Sobrenatural va bien con casi todas; el toque Desaparecido solo con Robo o Sobrenatural; Sabotaje y Concurso se mezclan con Robo e Impostor; **no** se usa Desaparecido como principal con otro objetivo final.
- Cada pareja válida entra en la prueba masiva (0 atascos, calidad > 80). Si una pareja falla dos veces, se retira de la lista.

## 7. Orden de construcción y dependencias
1. **4F-0a Marco de temáticas** (campo `theme`, `goal`, `scenario` y tabla temática → escenarios, letra en el código; `GEN_VERSION` 6) y **4F-0b Salas 4-6**, antes que el resto de 4F.
2. **4F-1…4F-5** (señuelos, pistas cruzadas, versiones, giro, rutina): las temáticas los reutilizan.
3. **4H-0 (piloto del museo), 4H-1 y 4H-2** (9 escenarios): las temáticas necesitan sus escenarios. Ver `ESCENARIOS.md` §5 y §8.
4. **4T-1 Robo → 4T-2 Sabotaje → 4T-3 Concurso → 4T-4 Impostor → 4T-5 Sobrenatural.** **4T-6 Desaparecido y 4T-7 Mezcla pasan a DESPUÉS DEL HITO** (decidido el 19 oct, por riesgo; `ROADMAP.md` §4.5). Orden de menor a mayor riesgo; cada una es un paquete (MEDIUM) con ZIP y parada.
5. **4G** (con amor: bancos grandes por ambiente, objeto estrella, epílogo) **después** de las temáticas, para escribirlos sabiendo qué temáticas existen; **4D-3** calibra al final con metas **por temática**; **4E-1/4E-2** construyen el menú; **HITO**.
**Códigos de caso:** hasta el HITO nadie tiene códigos guardados, así que 4F, 4H, 4T y 4G se quedan en `GEN_VERSION` 6 (una sola subida, 5 → 6, en 4F-0a, confirmada con el usuario al abrirla). Después del HITO, todo cambio de lo que genera un código sube la versión.

## 8. Dudas abiertas (no bloquean; se cierran al abrir el paquete correspondiente)
- Compatibilidad de mezcla (§6) y valores por defecto de ambiente y tono por temática (`ESCENARIOS.md` §7): son borrador; el usuario puede cambiar celdas. La tabla de escenarios (§5) ya está decidida.
- Cuántas historias base exactas por temática (propuesta 6-8) y cuántas se escriben en la primera pasada.
- Si el menú muestra un nombre y una frase corta por temática (propuesta: sí, con un icono).
- Si alguna temática de reserva (chantaje o carta anónima, habitación cerrada) entra tras el HITO.
