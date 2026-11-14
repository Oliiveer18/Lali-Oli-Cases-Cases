# ESCENARIOS · Lali & Oli Cases
Documento nuevo (19 oct, decidido con el usuario; **solo diseño, nada implementado**). Sustituye a la idea anterior de «13 lugares base» y a la tabla de afinidad temática × lugar de `FICHAS_TEMATICAS.md` §5. Complementa `FICHAS_TEMATICAS.md` (temáticas), `ROADMAP.md` (§4.3: 4F-0a, 4F-0b, 4H-0/1/2, 4T) y `DOCUMENTO_MAESTRO.md` (§0.3d y §0.3e).

> **ACTUALIZACIÓN 24 oct (cp. 171, solo diseño):** los **15 escenarios** (los 9 de este documento + hotel y estación + 4 por elegir) sustituyen a los 9; cada escenario pasa de 6 a **9 salas candidatas** (Fácil usa 4, Normal 5 y Difícil 6); al menos 5 escenarios por temática; algunas salas se comparten entre escenarios con otro aspecto. Donde este documento diga «9 escenarios» o «54 salas», léase 15 escenarios y ≈ 135 salas candidatas. Ver ROADMAP §3 («Escenarios y salas») y DOCUMENTO_MAESTRO §0.3j.

## 1. Vocabulario (para no confundir)
| Palabra | Qué es | Ejemplo |
|---|---|---|
| **Temática** | De qué trata el caso (qué pasó y qué se resuelve) | Robo, Sabotaje… (6) |
| **Escenario** | El sitio completo donde ocurre el caso: un conjunto de salas con arte, objetos y gente propios | panadería, museo, teatro… (9) |
| **Sala** | Cada habitación de un escenario. Es lo que antes los documentos llamaban «lugar» (tienda, cocina, almacén, callejón, taller) | la cocina de la panadería |
| **Variante** | Plantilla concreta de una sala (distinta disposición de muebles) | `tienda_vitrinas` |
Todo documento anterior que diga «lugar» o «13 lugares base» debe leerse así: **escenario** (9 escenarios, 54 salas). Los 5 «lugares» actuales (tienda, cocina, almacén, callejón, taller) son las 5 salas del escenario **panadería**.

## 2. Menú «Crear caso» (SIMPLIFICADO, decidido el 19 oct)
Dos mandos y nada más:
- **Temática:** una de las 6, **Aleatorio** o **Mezclado**. **Antes del HITO** solo hay 5 temáticas + Aleatorio: **Mezclado y Desaparecido pasan a después del HITO** (`ROADMAP.md` §4.5).
- **Dificultad:** Fácil · Normal · Difícil.
**Se elimina «Personalizar»** (a propósito; ver §9). Ambiente, tono, escenario y objeto estrella los elige el generador solo, con valores por defecto según la temática (§7) y con azar propio de la semilla.
- **Aleatorio** (antes «Sorpresa»): primero se sortea la temática (sin repetir la última) y después el escenario dentro de ella.
- **Mezclado:** una **temática principal** con **un toque** de otra (nunca más de dos). **El escenario sale SIEMPRE de la temática principal.** El toque solo aporta pistas, charlas o personajes, nunca el escenario (así no se mezcla un circo con una cocina).
- **Código de caso:** guarda temática, toque y dificultad. El escenario, el ambiente, el tono y el objeto estrella se derivan de la semilla y de la temática, así que el mismo código da el mismo caso en los dos móviles (R-9). Añadir temáticas o escenarios después del HITO sube `GEN_VERSION`.

## 3. Tabla temática → escenarios (cada escenario sirve a exactamente dos temáticas)
| Temática | Sus 3 escenarios |
|---|---|
| Robo | panadería, museo, mercado |
| Sabotaje | teatro, cine, parque (de atracciones) |
| Concurso amañado | panadería, circo, granja |
| Impostor | mansión, circo, cine |
| ¿Sobrenatural? | museo, mansión, teatro |
| Desaparecido | granja, parque, mercado |
Comprobación: panadería (Robo, Concurso) · museo (Robo, Sobrenatural) · mercado (Robo, Desaparecido) · teatro (Sabotaje, Sobrenatural) · cine (Sabotaje, Impostor) · parque (Sabotaje, Desaparecido) · circo (Concurso, Impostor) · granja (Concurso, Desaparecido) · mansión (Impostor, Sobrenatural) → 9 × 2 = 18 casillas = 6 × 3. ✔
**Cómo se arma un caso:** elegida la temática, el generador elige **1 de sus 3 escenarios** y usa **de 4 a 6 de las 6 salas** de ese escenario (según la dificultad, §6). Todo se ve coherente: nunca un circo con una cocina.
**Cada temática pone lo suyo encima** del escenario: pistas, objetos, charlas e historias propias, de modo que un mismo escenario se siente distinto en cada temática (p. ej. la panadería en Robo y en Concurso).
**Nota (19 oct, 4.ª tanda):** con Desaparecido aplazado, mercado, granja y parque se siguen construyendo porque también sirven a Robo, Concurso y Sabotaje.
**Reserva (fuera de alcance hasta después del HITO):** hotel, estación de tren, y los candidatos ya descartados (barco, biblioteca, gimnasio, colegio, peluquería). No se construyen antes del HITO.
**La tabla de afinidad ●/○/· de `FICHAS_TEMATICAS.md` §5 queda SUSTITUIDA por esta.**

## 4. Cupos fijos (para que sea cerrado y no infinito)
**Por escenario:** 6 salas · 2 variantes de plantilla por sala · ~12 curiosidades · 8 charlas.
**Por temática:** ~8 historias base · sus roles propios (juez, víctima, testigo clave…).
**Personajes acotados:** se reutilizan los **36 aspectos** que ya existen; solo se crean aspectos nuevos donde la temática lo exige (disfraces de Impostor, jueces de Concurso, personal del museo o del teatro). Cada aspecto nuevo se anota en el informe del paquete.

### Totales (para que el alcance no crezca sin que nadie lo note)
| Concepto | Cupo | Total |
|---|---|---|
| Escenarios | 9 (panadería ya existe) | 9 (8 nuevos) |
| Salas | 6 por escenario | 54 (la panadería tiene hoy 5: **49 nuevas**, contando una 6.ª sala de panadería; ver §10) |
| Variantes de plantilla | 2 por sala | 108 (la panadería ya tiene 16; **~96 nuevas**) |
| Curiosidades propias de escenario | ~12 por escenario | ~108 |
| Charlas propias de escenario | 8 por escenario | ~72 |
| Historias base | ~8 por temática | ~48 |
| Aspectos de personaje | 36 reutilizados | + los nuevos que exija cada temática |
Un cupo solo se supera con permiso explícito del usuario y anotándolo aquí.
**Lo que NO está medido todavía:** el coste real del arte nuevo (sprites, decorados). Lo mide el piloto (§5).

## 5. Piloto primero, con criterio de «caro» fijado ANTES de empezar
### 5.1 Paso 0 · Probar la capa de temática con la panadería (cero arte nuevo)
La panadería ya existe y sale en dos temáticas (Robo y Concurso). Antes de pintar ninguna sala nueva se comprueba que **un mismo escenario se siente distinto según la temática**: la misma panadería con tema Robo y con tema Concurso. Se compara objetivo, pistas, charlas y personajes. **Criterio de paso (BORRADOR):** el informe de ambos casos muestra textos y pistas propias de cada temática, la huella los distingue, 0 atascos en 500 semillas de cada una y caso 1 intacto. Si falla, se arregla la mecánica de capa antes de gastar arte en el museo.
### 5.2 Paso 1 · Piloto: el escenario museo
Se construye el museo completo (6 salas × 2 variantes, ~12 curiosidades, 8 charlas, los roles que exijan Robo y ¿Sobrenatural?) y se mide.
### 5.3 Criterio de «caro» (BORRADOR; el usuario lo confirma o cambia al abrir 4H-0, antes de empezar)
Se anota por escenario y el techo se fija antes del piloto, para no decidir por sensación:
| Medida | Techo propuesto por escenario |
|---|---|
| Esfuerzo | ≤ 1 paquete MEDIUM (hasta 2 chats con checkpoint) |
| Sprites nuevos | ≤ 30 |
| Reutilización | ≥ 50 % de los objetos de sala con sprite ya existente (hoy hay 156) |
| Salas con bloqueo en pruebas | 0 atascos en 5000 semillas (R-10) |
Se registra el valor real del museo contra cada techo en una tabla del informe de cierre de 4H-0.
### 5.4 Decisión tras el piloto (explícita, sin discutir)
- **Si el museo cumple todos los techos:** se siguen los otros 7 escenarios (4H-1 y 4H-2).
- **Si supera cualquiera:** se activa la **palanca de recorte**: se baja a **2 escenarios por temática** (12 salas por tipo de caso) y el tercero de cada temática queda para después del HITO. Qué escenarios se conservan lo decide el usuario con esta regla: prioridad a los que completan más temáticas jugables.
- La decisión se anota en el maestro (§10) con las cifras reales.

## 6. Dificultad y tamaño del caso
Dificultad ya no es solo engañosos, señuelos y ayuda: **también fija cuántas salas usa el caso** (de las 4-6 del escenario). Propuesta de partida: **Fácil 4 · Normal 5 · Difícil 6** (ajustable en 4D-3). Así la Dificultad tiene un efecto visible sin añadir ningún mando al menú.
Consecuencias a vigilar: la meta de duración (por dificultad: Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45 (provisionales); `ROADMAP.md`, decidido el 19 oct) se calibra **por dificultad** además de por temática; hasta que la panadería tenga 6 salas, Difícil se queda en 5 en ese escenario.

## 7. Valores por defecto por temática (BORRADOR; se cierran en 4F-0a)
El generador elige ambiente y tono con pesos que dependen de la temática:
| Temática | Ambiente (pesos orientativos) |
|---|---|
| Robo | el actual (claro 50 / inquietante 32 / macabro 18) |
| Sabotaje | casi siempre claro |
| Concurso amañado | casi siempre claro |
| Impostor | inquietante frecuente |
| ¿Sobrenatural? | inquietante o macabro (todo momento macabro con remate) |
| Desaparecido | claro o inquietante |
Tono y objeto estrella: azar de la semilla, con una lista corta de tonos recomendados por temática (a cerrar en 4F-0a). Nada de esto es un mando del menú.

## 8. Orden de construcción de escenarios (ordenado por temáticas jugables)
**4H-0** piloto: paso 0 (panadería) + museo, con decisión (§5.4) → **4H-1** teatro, cine, circo y mansión → **4H-2** mercado, granja y parque.
Razón del orden: tras el museo, **teatro y cine** completan más temáticas jugables por cada escenario (Sabotaje, Impostor y Sobrenatural); circo y mansión cierran Concurso e Impostor; mercado, granja y parque cierran Desaparecido, que es la última temática (4T-6). Encaja con el orden de las temáticas (Robo → Sabotaje → Concurso → Impostor → Sobrenatural → Desaparecido → Mezcla). Si se activa la palanca de recorte (§5.4), este orden decide qué escenarios se conservan.
**Dependencias de 4F:** el campo `scenario` (id del escenario) y la tabla de §3 entran en **4F-0a**, porque forman parte de la receta del generador y `GEN_VERSION` solo sube una vez (5 → 6). **4F-0b** pasa a «4 a 6 salas de las 6 del escenario según dificultad».

## 9. Registro de decisiones (para que una sesión futura no las deshaga por error)
| Fecha | Decisión | Motivo |
|---|---|---|
| 19 oct | Se **elimina «Personalizar»** del menú | Evita combinaciones sin sentido y pantallas que hacer; ambiente, tono y escenario los elige el generador |
| 19 oct | «Sorpresa» pasa a llamarse **«Aleatorio»** | Nombre del usuario |
| 19 oct | 18 salas por temática = **3 escenarios × 6 salas** | 18 salas sueltas mezclarían un circo con una cocina |
| 19 oct | Cada escenario sirve a **2 temáticas** (54 salas, no 108) | Evitar el «proyecto infinito» |
| 19 oct | En **Mezclado el escenario sale de la temática principal** | Coherencia visual |
| 19 oct | **Piloto del museo** antes de comprometer los otros 7, con criterio de «caro» fijado antes | Medir el coste real del arte |
| 19 oct | **Hotel y estación de tren** quedan en reserva (después del HITO) | No hacen falta para las 6 temáticas |

## 10. Dudas abiertas (no bloquean; se cierran al abrir el paquete correspondiente)

**Nota 24 oct (cp. 169, solo documentación) · 6.ª sala de la panadería = Despacho del dueño:** en 4F-0b 3/4-b entra en el sorteo con `GEN_VERSION` >= 7 (Difícil siempre; Normal ~79 %; Fácil ~58 %) pero NUNCA es sala del robo (ningún objeto lo lista). Duda abierta para el usuario: ¿convertirlo también en escena de robo (fila 4F-0f del ROADMAP)? Y para el museo y los demás escenarios: que cada escenario tenga más salas posibles que las de Difícil, para que Difícil no use siempre las mismas.
1. **(CERRADA 24 oct: se añade la 6.ª sala, «Despacho del dueño», en 4F-0b 2/4.)** **La panadería tiene 5 salas y el cupo es 6.** Opciones: añadir una 6.ª sala (la cuenta sube a 49 salas nuevas) o aceptar que la panadería es el único escenario de 5. Propuesta: añadirla en 4H-0 (paso 0), porque Difícil usa 6 salas.
2. **Los techos de «caro» de §5.3 son borrador.** El usuario confirma o cambia los números antes del piloto.
3. **Bancos de 4G-5a/5b (meta ~100 curiosidades y ~100 charlas):** las ~108 curiosidades y ~72 charlas de escenario del §4 se solapan con esa meta. Decidir en 4G-5 si se cuentan dentro o aparte.
4. **Valores por defecto (§7) y lista de tonos por temática:** borrador, se cierran en 4F-0a.
5. **Mezclado:** la tabla de parejas compatibles (`FICHAS_TEMATICAS.md` §6) sigue siendo borrador; no cambia por esto.
6. **Variedad:** el espejo y las 3 paletas por sala (E2 de `VARIEDAD.md`) multiplican las variantes sin arte nuevo; el piloto del museo decide si se aplican a todas las plantillas. Cada escenario cierra con el informe de variedad (R-11).
