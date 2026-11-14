# MUESTRA DE CASOS GENERADOS · Lali & Oli Cases v0.7.32

Seis casos de la fábrica (fase 4B parte 2), **uno por tono**, tal como los vería el jugador: título, sinopsis, lo que dice cada personaje, cómo reacciona al presionar y ante las pruebas, y el final. Cada caso trae su **tono** (cine negro, telenovela, documental, western, espías, cuento) con su gag propio.

**Cómo leerlos:** dime qué frases te hacen gracia, cuáles aburren o suenan raras, y si algún tono sobra o falta. Con eso se ajustan los bancos de `src/gen_data.js` (`G.GEN_DATA.compile`).

---

## Caso 1 · tono: noir · semilla 104 · código G4-2w

**Lluvia sobre la masa: la batidora plateada** — cliente: Tostada

> Tostada entra en el despacho chorreando: anoche desapareció la batidora plateada. Hay 5 sospechosos y todos huelen a mentira recién horneada.

Reparto: Tostada (amable) · Doña Hogaza (evasivo, engañoso, miente) · Rosco (soberbio, engañoso, miente) · Merengue (nervioso, engañoso) · Croqueta (seco, CULPABLE) · Brioche (amable).

### Tostada (Cliente)

- **Saludo:** Soy Tostada. Me han quitado la batidora plateada. Llueve, y no solo en la calle. (Fuera llueve. Siempre llueve.)
- **«¿Qué ha pasado?»** → Estaba en la cocina y ya no está. En esta ciudad las cosas no se pierden: se las llevan.
- **«¿Sospecha de alguien?»** → Sospecho hasta del horno. Aquí cualquiera pudo ser.
- **«¿Qué tal la noche?»** → Llovía. Siempre llueve cuando alguien miente.
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** ¡De verdad que no tengo nada que esconder! Salvo un bocadillo, pero es otro tema. (con la presión alta) · Con lo bien que estábamos hablando... qué lástima.

### Doña Hogaza (Sospechoso)

- **Saludo:** Doña Hogaza. O eso creo. ¿Por qué lo pregunta?
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 21:55 a 22:40, sin moverme.
- **«¿Qué opina del cliente?»** → De Tostada no tengo queja. Ni a favor. Ni en contra.
- **«¿Qué tal la noche?»** → Yo no vi nada, pero lo vi muy de cerca.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡Vale, vale! Es que no me gusta dar respuestas rápidas, ¡me salen mal! (con la presión alta) · ¿Pregunta o afirma? Es que me lío.
- **Ante las pruebas:** (Foto de la cámara) Pues sí, fíjese: me echaba una siesta tras el mostrador. Es un detalle sin importancia. · (Papel arrugado) Bueno... si insiste... me echaba una siesta tras el mostrador. Pero no lo he dicho yo.

### Rosco (Sospechoso)

- **Saludo:** Rosco, a su servicio... bueno, más bien usted al mío. (Fuera llueve. Siempre llueve.)
- **«¿Dónde estuvo anoche?»** → Estuve en el almacén de 21:45 a 22:45, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Aquí soy el alma del negocio. Los demás, el relleno.
- **«¿Qué tal la noche?»** → Esta ciudad se come a los honrados. Y a las magdalenas.
- **«¿Vio algo raro?»** → Le cuento que Merengue no paraba de preguntar por la batidora plateada y de mirar el reloj.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Retire eso ahora mismo o me llevo mi talento a otra panadería! (con la presión alta) · ¿Me está acusando? ¡A mí!
- **Ante las pruebas:** (Albarán sellado) Está bien. Es que ensayaba un discurso en voz alta. Y sí, también se me da de maravilla. · (Papel arrugado) Está bien. Es que ensayaba un discurso en voz alta. Y sí, también se me da de maravilla.

### Merengue (Sospechoso)

- **Saludo:** ¡Hola! Soy Merengue. No me ponga nervioso... digo, ¡no lo estoy!
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 21:50 a 22:30, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Me encanta el trabajo, pero no tanto las noches raras como esta.
- **«¿Qué tal la noche?»** → Tengo un mal presentimiento. Y migas en el bolsillo.
- **«¿Vio algo raro?»** → Le juro que Brioche estuvo en la tienda todo ese rato: limpia los cristales del escaparate.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Yo solo quería un día tranquilo! ¡Uno! (con la presión alta) · Ya se lo he dicho, ¿qué más quiere de mí?
- **Ante las pruebas:** (Borrador de rescate) Ya sé que parece sospechoso, pero es que me probaba los sombreros del escaparate. Se lo juro. · (Carrito de limpieza) Todo tiene explicación: me probaba los sombreros del escaparate. Sí, ya sé que suena fatal.

### Croqueta (Sospechoso)

- **Saludo:** Croqueta. Pregunte. (Fuera llueve. Siempre llueve.)
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 21:40 a 22:50, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Hay mucho que hacer. Lo hago.
- **«¿Qué tal la noche?»** → Pregúntele a la lluvia. Es la única que no miente.
- **«¿Vio algo raro?»** → Le cuento que Brioche andaba muy raro esa noche y hasta preguntó por la batidora plateada.
- **Charla:** Mmm. / Sí. …
- **Presionar:** Se acabó. No hay más. (con la presión alta) · No.
- **Ante las pruebas:** (Una silla vacía) Sí. Fui yo. · (Lo que vio Brioche) Fui yo.

### Brioche (Sospechoso)

- **Saludo:** Soy Brioche, ¡un placer conocerles!
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:00 a 22:30, sin moverme.
- **«¿Qué opina de los demás?»** → De Doña Hogaza podría hablar horas, y todo bueno. Casi todo.
- **«¿Qué tal la noche?»** → Llovía. Siempre llueve cuando alguien miente.
- **«¿Vio algo raro?»** → Estuve en la tienda de 22:10 a 22:25 y Croqueta nunca apareció por allí. Y Croqueta dice lo contrario.
- **«¿Vio algo raro?»** → Al llegar a la cocina, vi a Croqueta a punto de marcharse con mucha prisa. Poco después faltaba la batidora plateada.
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** Me duele que dude de mí, con lo que les aprecio. (con la presión alta) · Ay, no se enfade, que le preparo un café.

**Final:** ¡Era Croqueta! Dejó una copia de cartón y se llevó el original. Todo porque sentía celos del éxito del cliente. Y siguió lloviendo. Caso cerrado.

---

## Caso 2 · tono: telenovela · semilla 101 · código G4-2t

**Lágrimas por el reloj de cuco** — cliente: Rosco

> Amores, celos y el reloj de cuco desaparecido. Rosco exige la verdad. Habrá que interrogar a 5 personas sin que nadie se desmaye.

Reparto: Rosco (nervioso) · Croqueta (seco, engañoso, miente) · Monsieur Baguette (evasivo) · Don Sobao (soberbio, miente) · Churro (amable, CULPABLE) · Brioche (nervioso, engañoso).

### Rosco (Cliente)

- **Saludo:** ¡Soy Rosco! ¡Me han arrebatado el reloj de cuco! ¡Ayúdenme! (se lleva la mano al pecho)
- **«¿Qué ha pasado?»** → ¡Anoche desapareció el reloj de cuco! Estaba en la tienda, ¡y ahora solo queda el vacío!
- **«¿Sospecha de alguien?»** → De todos y de nadie. Ustedes verán.
- **«¿Cómo lleva la noche?»** → No puedo hablar de esto sin que me tiemblen las manos... ni las cejas.
- **«¿Vio algo raro?»** → Le juro que Don Sobao estuvo en el callejón todo ese rato: ensaya un discurso en voz alta.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Basta, basta! ¡Se me va a caer el delantal de los nervios! (con la presión alta) · ¡Ay, ay, ay! ¿Por qué me mira así?

### Croqueta (Sospechoso)

- **Saludo:** Croqueta. Rápido, que tengo cosas.
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:05 a 22:45, sin moverme.
- **«¿Qué opina de los demás?»** → Del resto, poco.
- **«¿Cómo lleva la noche?»** → Hay cosas que solo se dicen mirando por la ventana. (mira por la ventana)
- **Charla:** Mmm. / Sí. …
- **Presionar:** Se acabó. No hay más. (con la presión alta) · Lo mismo que antes.
- **Ante las pruebas:** (Lo que vio Monsieur Baguette) Lo admito: me echaba una partida de cartas a solas. Fin. · (Rastros delatores) Vale. Me echaba una partida de cartas a solas. Ya está.

### Monsieur Baguette (Sospechoso)

- **Saludo:** Monsieur Baguette. O eso creo. ¿Por qué lo pregunta? (se lleva la mano al pecho)
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 21:55 a 22:45, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Aquí hay de todo. Y de nada. Más o menos.
- **«¿Cómo lleva la noche?»** → Todo esto es culpa del destino. Y de alguien más, claro.
- **«¿Vio algo raro?»** → Le juro que Croqueta estuvo en el taller todo ese rato: se echa una partida de cartas a solas.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡No me atosigue! Soy un manojo de dudas y me está exprimiendo. (con la presión alta) · ¿Pregunta o afirma? Es que me lío.

### Don Sobao (Sospechoso)

- **Saludo:** Soy Don Sobao. Espero que no me haga perder el tiempo.
- **«¿Dónde estuvo anoche?»** → Estuve en el taller de 21:55 a 22:40, sin moverme.
- **«¿Qué opina de los demás?»** → De Croqueta prefiero no hablar: no me gusta compararme.
- **«¿Cómo lleva la noche?»** → ¡Y esperen a saber quién es en realidad mi madre!
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Esto es un ultraje! ¡Un ultraje con glaseado! (con la presión alta) · ¿Me está acusando? ¡A mí!
- **Ante las pruebas:** (Lo que vio Rosco) Está bien. Es que ensayaba un discurso en voz alta. Y sí, también se me da de maravilla. · (Rastros delatores) Está bien. Es que ensayaba un discurso en voz alta. Y sí, también se me da de maravilla.

### Churro (Sospechoso)

- **Saludo:** Soy Churro, ¡un placer conocerles! (se lleva la mano al pecho)
- **«¿Dónde estuvo anoche?»** → Estuve en el taller de 21:50 a 22:35, sin moverme.
- **«¿Qué opina del cliente?»** → Rosco es un encanto. Qué mala suerte, pobre.
- **«¿Cómo lleva la noche?»** → ¡Ay! ¡Eso me recuerda a cuando mi primo perdió el sombrero!
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** ¡De verdad que no tengo nada que esconder! Salvo un bocadillo, pero es otro tema. (con la presión alta) · Se lo he contado todo, de verdad.
- **Ante las pruebas:** (Huella con glaseado) Fui yo. Pero lo hice con todo el cariño... bueno, con algo de cariño. · (Un objeto fuera de sitio) Tienen razón. Fui yo. Les debo una disculpa y un pastel.

### Brioche (Sospechoso)

- **Saludo:** ¡Hola! Soy Brioche. No me ponga nervioso... digo, ¡no lo estoy!
- **«¿Dónde estuvo anoche?»** → Estuve en el almacén de 21:50 a 22:40, sin moverme.
- **«¿Qué opina del cliente?»** → De Rosco lo que más me pone los pelos de punta es lo mucho que se tranquiliza.
- **«¿Cómo lleva la noche?»** → No puedo hablar de esto sin que me tiemblen las manos... ni las cejas.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Basta, basta! ¡Se me va a caer el delantal de los nervios! (con la presión alta) · Ya se lo he dicho, ¿qué más quiere de mí?
- **Ante las pruebas:** (Carta de un acreedor) ¡No es lo que parece! Lo que pasa es que buscaba el dulce que escondí el mes pasado. ¡Por eso estaba tan raro! · (Cesta con mantel) Ya sé que parece sospechoso, pero es que buscaba el dulce que escondí el mes pasado. Se lo juro.

**Final:** ¡Era Churro! Subió el botín al tejado con una cuerda. Todo porque quería completar su colección secreta. Y así acaba el capítulo. ¡Mañana, más!

---

## Caso 3 · tono: documental · semilla 105 · código G4-2x

**Planeta Miga: el saco de vainilla** — cliente: Merengue

> Observamos a Merengue, que acaba de notar que falta el saco de vainilla. A su alrededor, 4 especies de sospechoso, todas con coartada.

Reparto: Merengue (amable) · Doña Hogaza (nervioso, miente) · Brioche (seco, engañoso, miente) · Don Sobao (soberbio) · Canela (evasivo, CULPABLE).

### Merengue (Cliente)

- **Saludo:** (a cámara) Soy Merengue. Y acaban de quitarme el saco de vainilla. (mira a cámara)
- **«¿Qué ha pasado?»** → Anoche desapareció el saco de vainilla. Estaba en el almacén tan tranquilo, en su hábitat. Y ahora, nada.
- **«¿Sospecha de alguien?»** → Sospecho hasta del horno. Aquí cualquiera pudo ser.
- **«¿Algo que decir a cámara?»** → (a cámara) Perdone, ¿esto sale en la tele?
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** Me duele que dude de mí, con lo que les aprecio. (con la presión alta) · Se lo he contado todo, de verdad.

### Doña Hogaza (Sospechoso)

- **Saludo:** Ay, hola, soy Doña Hogaza. Perdone, me tiemblan las manos hoy.
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:25 a 23:15, sin moverme.
- **«¿Qué opina de los demás?»** → Brioche siempre me pregunta cosas que no sé contestar.
- **«¿Algo que decir a cámara?»** → Observen cómo el sospechoso evita la pregunta: es su hábitat natural.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Basta, basta! ¡Se me va a caer el delantal de los nervios! (con la presión alta) · ¡Ay, ay, ay! ¿Por qué me mira así?
- **Ante las pruebas:** (Albarán sellado) ¡Me han pillado! Lo cierto es que probaba la bicicleta de reparto dando vueltas. Por favor, no se lo cuenten a nadie. · (Rastros delatores) ¡Me han pillado! Lo cierto es que probaba la bicicleta de reparto dando vueltas. Por favor, no se lo cuenten a nadie.

### Brioche (Sospechoso)

- **Saludo:** Brioche. Rápido, que tengo cosas. (mira a cámara)
- **«¿Dónde estuvo anoche?»** → Estuve en el taller de 22:15 a 23:10, sin moverme.
- **«¿Qué opina de los demás?»** → Don Sobao es de los que hablan. Yo no.
- **«¿Algo que decir a cámara?»** → Yo solo vengo a pastar... digo, a trabajar.
- **Charla:** Mmm. / Sí. …
- **Presionar:** Se acabó. No hay más. (con la presión alta) · Ya lo dije.
- **Ante las pruebas:** (Lo que vio Don Sobao) Lo admito: ensayaba un baile con una cuchara de madera. Fin. · (Rastros delatores) Cierto. Ensayaba un baile con una cuchara de madera. No lo cuente.

### Don Sobao (Sospechoso)

- **Saludo:** Don Sobao, a su servicio... bueno, más bien usted al mío.
- **«¿Dónde estuvo anoche?»** → Estuve en la cocina de 22:25 a 23:00, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Trabajo aquí por generosidad. Alguien tiene que elevar el nivel.
- **«¿Algo que decir a cámara?»** → En mi especie la coartada se hereda.
- **«¿Vio algo raro?»** → Oí a Canela decir que el saco de vainilla acabaría detrás de los hornos. Y así fue.
- **«¿Vio algo raro?»** → Le juro que Brioche estuvo en la cocina todo ese rato: ensaya un baile con una cuchara de madera.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Retire eso ahora mismo o me llevo mi talento a otra panadería! (con la presión alta) · ¿Me está acusando? ¡A mí!

### Canela (Sospechoso)

- **Saludo:** Hola, soy Canela. Bueno... depende de lo que quiera saber. (mira a cámara)
- **«¿Dónde estuvo anoche?»** → Estuve en el taller de 21:55 a 23:00, sin moverme.
- **«¿Qué opina de los demás?»** → Sobre Doña Hogaza podría decir mucho. Prefiero no decir nada. O poco.
- **«¿Algo que decir a cámara?»** → Hablen bajito, que se asustan.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡No me atosigue! Soy un manojo de dudas y me está exprimiendo. (con la presión alta) · Si me da un momento... y otro... y otro más...
- **Ante las pruebas:** (Lo que se le escapó a Canela) Vale, fui yo. No había forma de seguir evitándolo. · (Nota de entrega) Pues... ahora que lo pienso... sí, fui yo. Creo.

### Inspector Vidal (Inspector)

- **Saludo:** Inspector Vidal al habla. Esto es una investigación, no un mercadillo.
- **«¿Qué dice el parte?»** → Consta en el parte: el saco de vainilla, en el almacén, y ya no estaba entre las 22:35 y las 22:55. Más no puedo decir.
- **«¿Algún consejo?»** → Mi consejo profesional: vuelvan a mirar el almacén. Ahí hay algo que no cuadra, y no me corresponde decir qué.
- **«¿Tienen algún sospechoso?»** → Mi hipótesis es el mayordomo. Aquí no hay mayordomo, pero la hipótesis sigue en el expediente.
- **Charla:** Llevo veintidós años en el cuerpo. Lo más emocionante fue un gato en un árbol. El gato ganó. / No bebo café de servicio. Me ha visto cosas. …
- **Presionar:** Mi paciencia tiene un límite, y lo sabe todo el cuartel. (con la presión alta) · Insistir no acelera la investigación. Pero tampoco la retrasa.

**Final:** ¡Era Canela! Escondió el botín en un carrito de la limpieza. Todo porque quería completar su colección secreta. Y así, otro misterio vuelve a su ecosistema. Fin del documental.

---

## Caso 4 · tono: western · semilla 102 · código G4-2u

**Palmera contra el resto del pueblo: el saco de vainilla** — cliente: Palmera

> Un pueblo, 6 sospechosos y el saco de vainilla a la fuga. Palmera exige un detective con buen oído.

Reparto: Palmera (evasivo) · Don Sobao (soberbio, engañoso, miente) · Galleta (seco, CULPABLE) · Magdalena (amable) · Croqueta (nervioso, miente) · Pimienta (evasivo) · Monsieur Baguette (soberbio, engañoso).

### Palmera (Cliente)

- **Saludo:** Me llaman Palmera. Alguien se ha llevado el saco de vainilla. Y eso no se perdona. (se ajusta el sombrero imaginario)
- **«¿Qué ha pasado?»** → Estaba en el almacén a la hora del ocaso. Ahora solo queda polvo. Y una miga.
- **«¿Sospecha de alguien?»** → No quiero acusar a nadie. Pero lo pienso fuerte.
- **«¿Cómo va el pueblo?»** → Forastero, aquí hasta el pan duro tiene memoria.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡Vale, vale! Es que no me gusta dar respuestas rápidas, ¡me salen mal! (con la presión alta) · No sé, no recuerdo, puede ser.

### Don Sobao (Sospechoso)

- **Saludo:** Soy Don Sobao. Espero que no me haga perder el tiempo.
- **«¿Dónde estuvo anoche?»** → Estuve en la cocina de 22:25 a 23:25, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Se trabaja bien cuando se es bueno. Y yo lo soy.
- **«¿Cómo va el pueblo?»** → Este pueblo es muy pequeño para dos panaderos.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Esto es un ultraje! ¡Un ultraje con glaseado! (con la presión alta) · ¿Sabe con quién habla? Con alguien con muchísima paciencia.
- **Ante las pruebas:** (Foto de la cámara) Está bien. Es que me probaba los sombreros del escaparate. Y sí, también se me da de maravilla. · (Papel arrugado) Está bien. Es que me probaba los sombreros del escaparate. Y sí, también se me da de maravilla.

### Galleta (Sospechoso)

- **Saludo:** Galleta. Rápido, que tengo cosas. (se ajusta el sombrero imaginario)
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:00 a 23:20, sin moverme.
- **«¿Qué opina del cliente?»** → Poco que decir de Palmera.
- **«¿Cómo va el pueblo?»** → En estas tierras la masa madre manda.
- **«¿Vio algo raro?»** → Le juro que Monsieur Baguette llevaba toda la noche cuchicheando y escondiendo algo bajo la chaqueta.
- **Charla:** Mmm. / Sí. …
- **Presionar:** Se acabó. No hay más. (con la presión alta) · Ya lo dije.
- **Ante las pruebas:** (Un comentario de más) Fui yo. · (Guante en el escondite) Vale. Yo. Ya.

### Magdalena (Sospechoso)

- **Saludo:** ¡Qué alegría verles! Soy Magdalena. ¿Les apetece un dulce?
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:35 a 23:30, sin moverme.
- **«¿Qué opina del cliente?»** → A Palmera se le quiere mucho por aquí.
- **«¿Cómo va el pueblo?»** → Yo nunca desenfundo antes del desayuno.
- **«¿Vio algo raro?»** → Oí a Galleta murmurar que el saco de vainilla estaría mejor bajo el mostrador. Justo donde acabó.
- **«¿Vio algo raro?»** → Le aseguro que Monsieur Baguette se quedó sin color en cuanto se mencionó el saco de vainilla.
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** Me duele que dude de mí, con lo que les aprecio. (con la presión alta) · Ay, no se enfade, que le preparo un café.

### Croqueta (Sospechoso)

- **Saludo:** ¡Hola! Soy Croqueta. No me ponga nervioso... digo, ¡no lo estoy! (se ajusta el sombrero imaginario)
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:25 a 23:30, sin moverme.
- **«¿Qué opina de los demás?»** → Pimienta es buena gente, pero hace unos ruidos al comer...
- **«¿Cómo va el pueblo?»** → Se oye un silbido de viento. Es el horno. Siempre es el horno.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Basta, basta! ¡Se me va a caer el delantal de los nervios! (con la presión alta) · ¡Ay, ay, ay! ¿Por qué me mira así?
- **Ante las pruebas:** (Albarán sellado) Está bien... Me zampaba el género a escondidas. No quería que nadie lo supiera. · (Papel arrugado) Está bien... Me zampaba el género a escondidas. No quería que nadie lo supiera.

### Pimienta (Sospechoso)

- **Saludo:** Hola, soy Pimienta. Bueno... depende de lo que quiera saber.
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:25 a 23:15, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Me gusta el trabajo, en general. En particular, ya veremos.
- **«¿Cómo va el pueblo?»** → Forastero, aquí hasta el pan duro tiene memoria.
- **«¿Vio algo raro?»** → Le aseguro que Monsieur Baguette se quedó sin color en cuanto se mencionó el saco de vainilla.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡Vale, vale! Es que no me gusta dar respuestas rápidas, ¡me salen mal! (con la presión alta) · No sé, no recuerdo, puede ser.

### Monsieur Baguette (Sospechoso)

- **Saludo:** Ah, los detectives. Soy Monsieur Baguette, ya me conocerán de algo. (se ajusta el sombrero imaginario)
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:30 a 23:20, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Trabajo aquí por generosidad. Alguien tiene que elevar el nivel.
- **«¿Cómo va el pueblo?»** → Este pueblo es muy pequeño para dos panaderos.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Esto es un ultraje! ¡Un ultraje con glaseado! (con la presión alta) · ¿Me está acusando? ¡A mí!
- **Ante las pruebas:** (Rumor sobre Monsieur Baguette) Es muy sencillo: me echaba una siesta tras el mostrador. Cualquiera con talento lo habría entendido a la primera. · (Rumor sobre Monsieur Baguette) Lo que ve es un malentendido. Lo cierto es que me echaba una siesta tras el mostrador, y lo hago con una elegancia que usted no entendería.

### Inspector Vidal (Inspector)

- **Saludo:** Inspector Vidal. Les estaba esperando. Con ganas no, pero esperando.
- **«¿Qué dice el parte?»** → Según el parte, el saco de vainilla desapareció entre las 22:40 y las 23:10. Lo último que consta es que estaba en el almacén.
- **«¿Algún consejo?»** → Si yo fuera ustedes, que no lo soy, revisaría el callejón otra vez. Con calma.
- **«¿Tienen algún sospechoso?»** → Sospecho de todos por igual. Es un método. Muy poco eficaz, pero método.
- **Charla:** Llevo veintidós años en el cuerpo. Lo más emocionante fue un gato en un árbol. El gato ganó. / No bebo café de servicio. Me ha visto cosas. …
- **Presionar:** Mi paciencia tiene un límite, y lo sabe todo el cuartel. (con la presión alta) · Insistir no acelera la investigación. Pero tampoco la retrasa.

**Final:** ¡Era Galleta! Metió el botín en una caja de reparto y lo sacó como un pedido más. Todo porque quería gastar una broma que se le fue de las manos. Y el sol se puso sobre la panadería. Justicia hecha.

---

## Caso 5 · tono: espias · semilla 109 · código G4-31

**El topo y la batidora plateada** — cliente: Merengue

> El expediente cinco, el de la batidora plateada, ha quedado vacío. Merengue sospecha de 6 personas. Todas parecen inocentes. Eso es lo sospechoso.

Reparto: Merengue (nervioso) · Palmera (evasivo, engañoso) · Croqueta (soberbio, engañoso, miente) · Tostada (amable) · Galleta (seco) · Brioche (nervioso) · Canela (evasivo, CULPABLE).

### Merengue (Cliente)

- **Saludo:** Soy Merengue. Agente, escuche: han sustraído la batidora plateada. Pero no lo diga alto. (baja la voz)
- **«¿Qué ha pasado?»** → Estaba en el taller y desapareció sin dejar rastro. Casi sin dejar rastro.
- **«¿Sospecha de alguien?»** → De todos y de nadie. Ustedes verán.
- **«¿Algo que informar?»** → Todos aquí somos agentes dobles. Yo, triple, pero con descuento.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Basta, basta! ¡Se me va a caer el delantal de los nervios! (con la presión alta) · Ya se lo he dicho, ¿qué más quiere de mí?

### Palmera (Sospechoso)

- **Saludo:** Soy Palmera, sí, aunque podría haber sido otra persona.
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:40 a 23:20, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Me gusta el trabajo, en general. En particular, ya veremos.
- **«¿Algo que informar?»** → Si me pasa algo, busque bajo el mostrador. No sé qué hay, pero busque.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡No me atosigue! Soy un manojo de dudas y me está exprimiendo. (con la presión alta) · No sé, no recuerdo, puede ser.
- **Ante las pruebas:** (Borrador de rescate) Esto parece una cosa, pero es otra: daba de comer a escondidas a un gato callejero. Lo explico fatal, lo sé. · (Ventana forzada) Esto parece una cosa, pero es otra: daba de comer a escondidas a un gato callejero. Lo explico fatal, lo sé.

### Croqueta (Sospechoso)

- **Saludo:** Croqueta, a su servicio... bueno, más bien usted al mío. (baja la voz)
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:30 a 23:15, sin moverme.
- **«¿Qué opina de los demás?»** → Brioche tiene sus virtudes. Pocas, pero las tiene.
- **«¿Algo que informar?»** → La contraseña es «el pan no tiene prisa». Ahora diga usted la suya.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Esto es un ultraje! ¡Un ultraje con glaseado! (con la presión alta) · ¿Sabe con quién habla? Con alguien con muchísima paciencia.
- **Ante las pruebas:** (Lo que vio Tostada) Bah. Daba de comer a escondidas a un gato callejero. ¿Y qué? Hasta los genios tienen aficiones. · (Rastros delatores) Está bien. Es que daba de comer a escondidas a un gato callejero. Y sí, también se me da de maravilla.

### Tostada (Sospechoso)

- **Saludo:** ¡Qué alegría verles! Soy Tostada. ¿Les apetece un dulce?
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:45 a 23:20, sin moverme.
- **«¿Qué opina de los demás?»** → Con Canela me llevo de cine. Aunque a veces me quita el último bollo.
- **«¿Algo que informar?»** → No puedo confirmarlo ni desmentirlo. Y me han mandado callar.
- **«¿Vio algo raro?»** → Le juro que Croqueta estuvo en el callejón todo ese rato: da de comer a escondidas a un gato callejero.
- **«¿Vio algo raro?»** → Le aseguro que Croqueta se quedó sin color en cuanto se mencionó la batidora plateada.
- **«¿Vio algo raro?»** → Le cuento que Brioche andaba muy raro esa noche y hasta preguntó por la batidora plateada.
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** Me duele que dude de mí, con lo que les aprecio. (con la presión alta) · Ay, no se enfade, que le preparo un café.

### Galleta (Sospechoso)

- **Saludo:** Galleta. Pregunte. (baja la voz)
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:45 a 23:20, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Bien. Normal.
- **«¿Algo que informar?»** → Esta conversación se autodestruirá... en cuanto me coma la prueba.
- **«¿Vio algo raro?»** → Vi a Canela merodeando en el taller poco antes de que desapareciera la batidora plateada.
- **Charla:** Mmm. / Sí. …
- **Presionar:** Insista lo que quiera. Seguirá igual. (con la presión alta) · No.

### Brioche (Sospechoso)

- **Saludo:** Ay, hola, soy Brioche. Perdone, me tiemblan las manos hoy.
- **«¿Dónde estuvo anoche?»** → Estuve en la tienda de 22:40 a 23:20, sin moverme.
- **«¿Qué opina de los demás?»** → De Tostada no sé qué decir sin ponerme rojo.
- **«¿Algo que informar?»** → Todos aquí somos agentes dobles. Yo, triple, pero con descuento.
- **«¿Vio algo raro?»** → Le juro que Tostada estuvo en la tienda todo ese rato: atiende a los últimos clientes.
- **«¿Vio algo raro?»** → Le cuento que Galleta andaba muy raro esa noche y hasta preguntó por la batidora plateada.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Yo solo quería un día tranquilo! ¡Uno! (con la presión alta) · No me presione, que me tiembla hasta el delantal.

### Canela (Sospechoso)

- **Saludo:** Canela. O eso creo. ¿Por qué lo pregunta? (baja la voz)
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:30 a 23:20, sin moverme.
- **«¿Qué opina del cliente?»** → Con Merengue prefiero no mojarme. Soy de secano.
- **«¿Algo que informar?»** → Si me pasa algo, busque bajo el mostrador. No sé qué hay, pero busque.
- **«¿Vio algo raro?»** → Le aseguro que Croqueta se quedó sin color en cuanto se mencionó la batidora plateada.
- **«¿Vio algo raro?»** → Le cuento que Tostada andaba muy raro esa noche y hasta preguntó por la batidora plateada.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡No me atosigue! Soy un manojo de dudas y me está exprimiendo. (con la presión alta) · Si me da un momento... y otro... y otro más...
- **Ante las pruebas:** (Cuaderno de visitas) Vale, fui yo. No había forma de seguir evitándolo. · (Lo que vio Galleta) Vale, fui yo. No había forma de seguir evitándolo.

### Inspector Ortega (Inspector)

- **Saludo:** ¡Por fin gente con ganas! Yo estoy de guardia desde que se inventó el sueño.
- **«¿Qué dice el parte?»** → Os cuento lo que sé: la batidora plateada se esfumó entre las 22:50 y las 23:10. Última vez, el taller. De nada.
- **«¿Algún consejo?»** → Si tuviera que apostar, y no puedo, que me lo prohíben, diría la tienda.
- **«¿Tienen algún sospechoso?»** → Yo lo tengo clarísimo: ha sido alguien. Alguien con manos. Estoy afinando.
- **Charla:** Llevo tres semanas sin dormir una noche entera. Me siento fenomenal, de verdad, ¿por qué lo preguntáis? / Aquí el café lo hace el que pierde a los dados. Hoy me tocó a mí. Perdonadme por anticipado. …
- **Presionar:** Vale, vale, os cuento lo que haga falta. Pero sin esposas, ¿eh? (con la presión alta) · Eh, tranquilos, que estamos en el mismo equipo.

**Final:** ¡Era Canela! Disimuló el botín dentro de una bolsa de basura. Todo porque sentía celos del éxito del cliente. Misión cumplida. Este informe se autodestruirá en cinco, cuatro... bueno, ya está.

---

## Caso 6 · tono: cuento · semilla 118 · código G4-3a

**Y vivieron felices, pero sin la llave maestra** — cliente: Merengue

> Érase una vez Merengue, a quien una noche le desapareció la llave maestra. Había 4 sospechosos... y todos tenían una excusa mágica.

Reparto: Merengue (evasivo) · Galleta (nervioso, CULPABLE) · Pimienta (seco) · Doña Hogaza (amable, engañoso, miente) · Churro (soberbio, engañoso, miente).

### Merengue (Cliente)

- **Saludo:** Soy Merengue. Una noche me desapareció la llave maestra. Les ruego que me ayuden. (sonríe como en un libro ilustrado)
- **«¿Qué ha pasado?»** → Estaba en el almacén, sano y salvo. Y de pronto, ¡puf!
- **«¿Sospecha de alguien?»** → De todos y de nadie. Ustedes verán.
- **«¿Cuenta algo?»** → Había una vez una excusa... y era muy mala.
- **Charla:** Pues... según como se mire. / ¿Eso es importante? …
- **Presionar:** ¡No me atosigue! Soy un manojo de dudas y me está exprimiendo. (con la presión alta) · No sé, no recuerdo, puede ser.

### Galleta (Sospechoso)

- **Saludo:** ¡Hola! Soy Galleta. No me ponga nervioso... digo, ¡no lo estoy!
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:35 a 23:50, sin moverme.
- **«¿Qué opina de los demás?»** → De Pimienta no sé qué decir sin ponerme rojo.
- **«¿Cuenta algo?»** → Cuéntelo despacito, que me gusta saborearlo.
- **«¿Vio algo raro?»** → Le cuento que Churro no paraba de preguntar por la llave maestra y de mirar el reloj.
- **Charla:** Uf, qué nervios, no paro quieto. / Perdone, se me cae todo hoy. …
- **Presionar:** ¡Yo solo quería un día tranquilo! ¡Uno! (con la presión alta) · ¡Ay, ay, ay! ¿Por qué me mira así?
- **Ante las pruebas:** (Una silla vacía) ¡Ay, no! ¡Fui yo! ¡Pero no quería! O sí. ¡No lo sé! · (Lo que vio Pimienta) Vale, vale, lo hice yo. Me ha dado un vuelco el corazón.

### Pimienta (Sospechoso)

- **Saludo:** Pimienta. Rápido, que tengo cosas. (sonríe como en un libro ilustrado)
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:50 a 23:45, sin moverme.
- **«¿Qué opina del cliente?»** → Poco que decir de Merengue.
- **«¿Cuenta algo?»** → Eso pasó hace mucho, mucho tiempo... el martes.
- **«¿Vio algo raro?»** → Estuve en el callejón de 22:55 a 23:25 y Galleta nunca apareció por allí. Y Galleta dice lo contrario.
- **«¿Vio algo raro?»** → Vi a Galleta merodeando en el almacén poco antes de que desapareciera la llave maestra.
- **«¿Vio algo raro?»** → Le cuento que Churro no paraba de preguntar por la llave maestra y de mirar el reloj.
- **«¿Vio algo raro?»** → Le cuento que Churro no paraba de preguntar por la llave maestra y de mirar el reloj.
- **Charla:** Mmm. / Sí. …
- **Presionar:** Se acabó. No hay más. (con la presión alta) · No.

### Doña Hogaza (Sospechoso)

- **Saludo:** ¡Qué alegría verles! Soy Doña Hogaza. ¿Les apetece un dulce?
- **«¿Dónde estuvo anoche?»** → Estuve en el callejón de 22:25 a 23:55, sin moverme.
- **«¿Qué opina del cliente?»** → Me da mucha pena lo de Merengue. Si puedo ayudar, cuenten conmigo.
- **«¿Cuenta algo?»** → Y la moraleja es: nunca dejes la masa sola.
- **Charla:** Qué bien huele hoy, ¿verdad? / Siempre es un placer charlar. …
- **Presionar:** Me duele que dude de mí, con lo que les aprecio. (con la presión alta) · Con lo bien que estábamos hablando... qué lástima.
- **Ante las pruebas:** (Foto de la cámara) Ay, me han pillado: me echaba una partida de cartas a solas. Les iba a invitar, pero me dio vergüenza. · (Rastros delatores) Bueno, ya que preguntan con tanto cariño: me echaba una partida de cartas a solas.

### Churro (Sospechoso)

- **Saludo:** Soy Churro. Espero que no me haga perder el tiempo. (sonríe como en un libro ilustrado)
- **«¿Dónde estuvo anoche?»** → Estuve en el taller de 22:45 a 23:40, sin moverme.
- **«¿Qué tal se trabaja aquí?»** → Se trabaja bien cuando se es bueno. Y yo lo soy.
- **«¿Cuenta algo?»** → Esto ya me lo contó un pájaro. Un gorrión muy cotilla.
- **Charla:** Mi trabajo aquí es, digamos, insustituible. / Yo siempre lo hago todo bien. …
- **Presionar:** ¡Esto es un ultraje! ¡Un ultraje con glaseado! (con la presión alta) · ¿Me está acusando? ¡A mí!
- **Ante las pruebas:** (Albarán sellado) Está bien. Es que daba de comer a escondidas a un gato callejero. Y sí, también se me da de maravilla. · (Papel arrugado) Bah. Daba de comer a escondidas a un gato callejero. ¿Y qué? Hasta los genios tienen aficiones.

**Final:** ¡Era Galleta! Subió el botín al tejado con una cuerda. Todo porque estaba convencido de que le pertenecía por herencia. Y colorín colorado, este caso se ha acabado.

---
