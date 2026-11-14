// case1.js — Caso 1: "La Tarta Fugitiva". Todo el caso es DATOS: mapas, objetos, pistas, diálogos y capítulos.
(function (root) {
  'use strict';
  const G = root.G;
  G.CASES = G.CASES || {};

  const floorRows = (w, h, ch) => {
    const rows = [];
    for (let y = 0; y < h; y++) rows.push(y === 0 || y === h - 1 ? '#'.repeat(w) : '#' + ch.repeat(w - 2) + '#');
    return rows;
  };

  const def = {
    id: 'tarta',
    title: 'La Tarta Fugitiva',
    client: 'Doña Hogaza',
    blurb: 'La Tarta Gigante de Fresa ha desaparecido de la panadería la noche antes del concurso. Hay cuatro sospechosos, una carretilla y mucha sal.',
    level: 1,
    parSeconds: 1500,
    reward: 120,
    start: { room: 'tienda', p1: [11, 9], p2: [12, 9] },
    detectives: { rex: 'Oli', luna: 'Lali' },

    clientId: 'hogaza',
    // mentiras que se pueden desmontar: la bandera la pone el PNJ al mentir; se refuta con estas pistas
    lies: {
      merengue: { flag: 'lie_merengue', refutedBy: ['tenedor_labial', 'testimonio_merengue'], said: 'En su casa, durmiendo. Jamás pisó la panadería.' },
      baguette: { flag: 'lie_baguette', refutedBy: ['huellas_botas', 'grabacion_baguette'], said: 'En su cama, bajo seis mantas. Jamás pisó el callejón.' },
      pimienta: { flag: 'lie_pimienta', refutedBy: ['fichaje_pimienta'], said: 'Se fue a casa a las ocho.' },
    },

    // ------------------------------------------------------------ PISTAS
    clues: {
      vitrina_vacia: { title: 'Vitrina vacía', icon: 'ico_cake', kind: 'física', text: 'La Tarta Gigante ha desaparecido. La vitrina estaba cerrada con llave: no hay cristales rotos ni nada forzado.' },
      nota_cierre: { title: 'Nota de cierre', icon: 'paper', kind: 'documento', text: 'Hogaza anotó que a las 23:00 la tarta seguía en su vitrina. El robo fue DESPUÉS de las once de la noche.', sus: {} },
      tenedor_labial: { title: 'Tenedor con pintalabios', icon: 'ico_uv', kind: 'física', text: 'Con luz UV: un tenedor con nata y restos de pintalabios rosa chicle. Alguien probó la tarta antes del cierre.', sus: { merengue: 1 } },
      huellas_gato: { title: 'Huellas de gato', icon: 'ico_lupa', kind: 'física', text: 'En la ventana: huellas de Bigotes y migas. Entró por el alféizar... pero un gato de 4 kilos no carga una tarta de 15.', sus: { bigotes: -2 } },
      gancho_vacio: { title: 'Gancho vacío', icon: 'ico_key', kind: 'física', text: 'Falta la llave de la puerta trasera (la del llavero con forma de croissant). Alguien la cogió.', sus: {} },
      sacos_cambiados: { title: 'Sacos intercambiados', icon: 'ico_lupa', kind: 'física', text: 'El saco rotulado «AZÚCAR» contiene SAL y el de «SAL» contiene azúcar. Están igualitos y alguien los confundió.', sus: { pimienta: 1 } },
      glaseado_salado: { title: 'Glaseado salado', icon: 'ico_cake', kind: 'física', text: 'Un cuenco de glaseado de fresa casi listo, escondido tras la nevera... y salado como el mar. Alguien lo estropeó con sal.', sus: { pimienta: 2 } },
      receta_uv: { title: 'Receta del concurso', icon: 'ico_uv', kind: 'documento', text: 'Con luz UV, en el cajón: «PIMIENTA decora la tarta este año. Glaseado de fresa». Firmado: Hogaza.', sus: { pimienta: 1 } },
      puerta_sin_forzar: { title: 'Puerta trasera', icon: 'ico_lock', kind: 'física', text: 'El cerrojo está abierto desde DENTRO y sin forzar. Lo hizo alguien con la llave: gente de la casa.', sus: { pimienta: 1, baguette: -1, merengue: -1 } },
      huellas_carretilla: { title: 'Rastro de carretilla', icon: 'ico_lupa', kind: 'física', text: 'Huellas de rueda con gotas de mermelada de fresa. Salen por la puerta trasera hacia la calle.', sus: { pimienta: 1 } },
      huellas_botas: { title: 'Botas del 47', icon: 'ico_lupa', kind: 'física', text: 'Pisadas enormes (¿Don Baguette?) por DEBAJO de las marcas de la carretilla: estuvo allí ANTES.', sus: { baguette: 1 } },
      grabacion_baguette: { title: 'Grabación de Baguette', icon: 'ico_rec', kind: 'grabación', text: 'Baguette le murmura a una paloma que espió la panadería a medianoche y se fue a las 00:30 a la tienda 24 horas.', sus: { baguette: 1 } },
      carretilla_mermelada: { title: 'Carretilla del almacén', icon: 'ico_lupa', kind: 'física', text: 'La carretilla del almacén tiene mermelada de fresa en la rueda: coincide con las huellas del callejón.', sus: { pimienta: 1 } },
      delantal_pimienta: { title: 'Delantal con «P»', icon: 'ico_clue', kind: 'física', text: 'Un delantal con mermelada de fresa y cristales de sal. Lleva una «P» bordada.', sus: { pimienta: 2 } },
      fichaje_pimienta: { title: 'Libro de fichajes', icon: 'paper', kind: 'documento', text: 'Pimienta apuntó su salida: 01:12 de la madrugada. Dijo que se fue a las ocho.', sus: { pimienta: 2 } },
      ticket_baguette: { title: 'Ticket de las 01:05', icon: 'paper', kind: 'documento', text: 'Ticket de la tienda 24 horas a la 01:05: Baguette compraba levadura lejos de aquí cuando salió la carretilla.', sus: { baguette: -2 } },
      testimonio_sombra: { title: 'La sombra del gorro', icon: 'ico_question', kind: 'testimonio', text: 'Baguette, a las 00:30, vio luz en la cocina y una sombra con un gorrito de cocinero canturreando.', sus: { pimienta: 1 } },
      testimonio_merengue: { title: 'Coartada de Merengue', icon: 'ico_question', kind: 'testimonio', text: 'Merengue probó la tarta a las 22:00, se fue a las 22:30 y no tiene llave de la panadería.', sus: { merengue: -2 } },
      testimonio_nervios: { title: 'Pimienta, hecho un flan', icon: 'ico_question', kind: 'testimonio', text: 'Según Merengue, Pimienta estaba muy nervioso porque este año decoraba él la tarta.', sus: { pimienta: 1 } },
      albaran_sacos: { title: 'Albarán del proveedor', icon: 'paper', kind: 'documento', text: 'El proveedor imprimió mal las etiquetas: SAL y AZÚCAR llegaron cruzadas desde el primer día. Nadie sabía que los sacos estaban al revés... ni siquiera Pimienta.', sus: {} },
      cronologia: { title: 'Línea de tiempo de la noche', icon: 'ico_bulb', kind: 'deducción', text: 'Merengue se fue a las 22:30, Hogaza cerró a las 23:00, Baguette se marchó a las 00:30 y compraba levadura a la 01:05. A la 01:12 solo quedaba una persona en la panadería: Pimienta.', sus: { pimienta: 2, baguette: -1 } },
      confesion_pimienta: { title: 'Confesión de Pimienta', icon: 'ico_star', kind: 'testimonio', text: 'Pimienta confiesa: puso sal en vez de azúcar en el glaseado, entró en pánico y sacó la tarta en la carretilla por la puerta trasera.', sus: { pimienta: 5 } },
    },

    // ------------------------------------------------------------ SOSPECHOSOS
    suspects: [
      { id: 'baguette', name: 'Don Baguette', desc: 'Panadero rival. Bigote enorme, botas enormes, ego enorme.', look: 'baguette', clearedBy: ['huellas_botas', 'ticket_baguette'] },
      { id: 'merengue', name: 'Doña Merengue', desc: 'Jueza oficial del concurso. Muy seria con el postre.', look: 'merengue', clearedBy: ['tenedor_labial', 'nota_cierre', 'testimonio_merengue'] },
      { id: 'pimienta', name: 'Pimienta', desc: 'Aprendiz de Hogaza. Nervioso incluso dormido.', look: 'pimienta', clearedBy: [] },
      { id: 'bigotes', name: 'Bigotes', desc: 'El gato de la panadería. Sospechoso por pura costumbre.', look: 'cat', clearedBy: ['huellas_gato'], easyHidden: true },
    ],

    // ------------------------------------------------------------ SOLUCIÓN
    solution: {
      culprit: 'pimienta',
      method: 'carretilla',
      motive: 'error',
      methods: [
        { id: 'carretilla', text: 'La sacó por la puerta trasera en una carretilla', needs: ['huellas_carretilla', 'carretilla_mermelada'] },
        { id: 'ventana', text: 'La pasó por la ventana de la tienda, donde hay huellas de gato', needs: ['huellas_gato'] },
        { id: 'botas', text: 'Se la llevó en brazos por el callejón siguiendo las botas del 47', needs: ['huellas_botas'] },
        { id: 'almacen', text: 'La escondió en el almacén y se la llevó por la mañana', needs: ['gancho_vacio'] },
      ],
      motives: [
        { id: 'error', text: 'Esconder que la estropeó con sal sin querer', needs: ['sacos_cambiados', 'glaseado_salado'] },
        { id: 'concurso', text: 'Sabotear la tarta para que Hogaza perdiera el concurso', needs: ['glaseado_salado'] },
        { id: 'espiar', text: 'Robar la receta secreta de Hogaza para copiarla', needs: ['grabacion_baguette'] },
        { id: 'antojo', text: 'Un antojo de fresas a medianoche (había mermelada por todas partes)', needs: ['carretilla_mermelada'] },
      ],
      // pruebas que de verdad señalan al culpable (para el modo Difícil)
      proof: ['cronologia', 'fichaje_pimienta', 'delantal_pimienta', 'glaseado_salado', 'receta_uv', 'carretilla_mermelada', 'puerta_sin_forzar', 'sacos_cambiados', 'huellas_carretilla', 'confesion_pimienta', 'testimonio_sombra', 'testimonio_nervios'],
    },

    // ------------------------------------------------------------ CAPÍTULOS
    chapters: [
      {
        id: 1,
        title: 'La escena del crimen',
        intro: [
          { who: 'hogaza', text: '¡Ay, ay, ay! ¡La Tarta Gigante de Fresa ha desaparecido! ¡Y el concurso es a las diez!' },
          { who: 'rex', text: 'Tranquila, señora Hogaza. Somos Lali & Oli Cases: detectives (casi) profesionales.' },
          { who: 'luna', text: 'Yo habría puesto «Agencia Lupa y Luz», pero vale. Truco: con el botón de herramienta enciendo mi linterna UV y aparecen cosas invisibles. ¡Empecemos por la tienda y la cocina!' },
        ],
        goals: [
          { id: 'g1', text: 'Examina la vitrina vacía', clue: 'vitrina_vacia' },
          { id: 'g2', text: 'Encuentra la nota de cierre', clue: 'nota_cierre' },
          { id: 'g3', text: 'Registra la cocina (3 pistas)', clues: ['gancho_vacio', 'sacos_cambiados', 'glaseado_salado', 'receta_uv'], min: 3 },
          { id: 'g4', text: 'Habla con Merengue y con Pimienta', flags: ['talked_merengue', 'talked_pimienta'], min: 2 },
        ],
        outro: [
          { who: 'hogaza', text: 'Ahora que lo pienso... ¡la puerta trasera! Esa nunca la miro. ¡Aquí tenéis la llave!' },
          { who: 'luna', text: 'Y el almacén tiene una cerradura de las que a Oli le encantan.' },
          { who: 'rex', text: 'Mi ganzúa y yo estamos de acuerdo.' },
        ],
      },
      {
        id: 2,
        title: 'Huellas en el callejón',
        goals: [
          { id: 'g5', text: 'Abre la puerta trasera y mira el callejón', clue: 'puerta_sin_forzar' },
          { id: 'g6', text: 'Sigue las huellas del callejón', clues: ['huellas_carretilla', 'huellas_botas'], min: 2 },
          { id: 'g7', text: 'Graba a Baguette sin que te vea', clue: 'grabacion_baguette' },
          { id: 'g8', text: 'Registra el almacén (2 pistas)', clues: ['carretilla_mermelada', 'delantal_pimienta', 'fichaje_pimienta'], min: 2 },
        ],
        outro: [
          { who: 'hogaza', text: '¡Ya está! ¡Quiero a todos en la tienda ahora mismo! ¡Se acabaron los secretos!' },
          { who: 'rex', text: 'Me encanta cuando dicen eso.' },
        ],
      },
      {
        id: 3,
        title: 'La hora de la verdad',
        intro: [
          { who: 'luna', text: 'Tenemos a todos reunidos. Hablad con ellos, enseñad pruebas... y cuando lo tengáis claro, abrid el cuaderno y acusad.' },
        ],
        goals: [{ id: 'g9', text: 'Reúne pruebas y acusa al culpable (cuaderno)', flags: ['case_closed'], min: 1 }],
      },
    ],

    // ------------------------------------------------------------ SALAS
    rooms: {
      tienda: {
        name: 'Panadería La Miga Feliz',
        map: floorRows(24, 13, '.'),
        floor: 'wood',
        decor: [
          { sprite: 'window', x: 17, y: 0 }, { sprite: 'menu_board', x: 7, y: 0 }, { sprite: 'clock', x: 12, y: 0 }, { sprite: 'painting', x: 14, y: 0 },
        ],
        decals: [{ sprite: 'rug_round', x: 10, y: 6, w: 2, h: 2, big: true }, { sprite: 'decal_paws', x: 3, y: 1 }],
        props: [
          // mostrador
          ...[7, 8, 9, 10, 12, 13, 14, 15].map((x) => ({ id: 'mostrador' + x, sprite: 'counter', x, y: 3, solid: true })),
          {
            id: 'vitrina', sprite: 'display_empty', x: 11, y: 3, solid: true, label: 'Vitrina de la tarta', shimmer: true,
            steps: [{ tool: null, who: 'rex', text: 'La vitrina está vacía y cerrada con llave. Ni un cristal roto. Solo migas de azúcar rosa... y un hueco muy grande con forma de tarta.', clue: 'vitrina_vacia' }],
            doneText: 'Una vitrina vacía y un hueco con forma de tarta. Qué tristeza.',
          },
          {
            id: 'nota', sprite: 'paper', x: 8, y: 3, dy: -7, solid: false, label: 'Nota del mostrador', shimmer: true,
            steps: [{ tool: null, who: 'luna', text: '«Cierro a las 23:00. La Tarta Gigante sigue en su vitrina. ¡QUE NADIE LA TOQUE! — Hogaza». Entonces desapareció después de las once.', clue: 'nota_cierre' }],
            doneText: '«¡QUE NADIE LA TOQUE!» Subrayado tres veces.',
          },
          {
            id: 'tenedor', sprite: 'uv_lips', x: 13, y: 3, dy: -4, solid: false, uvOnly: true, label: 'Marca brillante', shimmer: true,
            steps: [{ tool: 'uv', who: 'luna', text: 'Bajo la luz UV: un tenedor con nata y... ¡pintalabios rosa chicle! Alguien probó la tarta antes del cierre. ¿Quién usa ese color?', clue: 'tenedor_labial' }],
            doneText: 'Pintalabios rosa chicle. Muy llamativo.',
          },
          ...[7, 9, 13, 15].map((x) => ({ id: 'taburete' + x, sprite: 'stool', x, y: 4, solid: true })),
          { id: 'mesa1', sprite: 'table', x: 4, y: 7, solid: true }, { id: 'silla1a', sprite: 'chair', x: 3, y: 7, solid: true }, { id: 'silla1b', sprite: 'chair', x: 5, y: 7, solid: true },
          { id: 'mesa2', sprite: 'table', x: 19, y: 7, solid: true }, { id: 'silla2a', sprite: 'chair', x: 18, y: 7, solid: true }, { id: 'silla2b', sprite: 'chair', x: 20, y: 7, solid: true },
          { id: 'mesa3', sprite: 'table', x: 5, y: 10, solid: true }, { id: 'silla3', sprite: 'chair', x: 4, y: 10, solid: true },
          { id: 'estante1', sprite: 'shelf_bread', x: 1, y: 2, solid: true }, { id: 'estante2', sprite: 'shelf_bread', x: 22, y: 2, solid: true },
          { id: 'planta1', sprite: 'plant', x: 1, y: 11, solid: true }, { id: 'planta2', sprite: 'plant', x: 22, y: 11, solid: true },
          { id: 'planta3', sprite: 'plant', x: 21, y: 4, solid: true },
          {
            id: 'tablon', sprite: 'corkboard', x: 5, y: 0, solid: true, label: 'Tablón de la noche', shimmer: true,
            visible: { chapterMin: 3 },
            steps: [{
              tool: null, who: 'luna', clue: 'cronologia',
              requires: { clue: ['testimonio_merengue', 'nota_cierre', 'grabacion_baguette', 'ticket_baguette', 'fichaje_pimienta'] },
              mini: { type: 'timeline', verb: 'Ordenar', icon: 'ico_clue', title: 'La noche del crimen', hint: 'Toca los sucesos de lo más antiguo a lo más reciente. Si dudas, repasa las pistas en el cuaderno.', events: [
                { text: 'Merengue prueba la tarta y se marcha', time: '22:00', clue: 'testimonio_merengue' },
                { text: 'Hogaza cierra la panadería', time: '23:00', clue: 'nota_cierre' },
                { text: 'Baguette se va de espiar al callejón', time: '00:30', clue: 'grabacion_baguette' },
                { text: 'Baguette compra levadura en la tienda 24 h', time: '01:05', clue: 'ticket_baguette' },
                { text: 'Pimienta ficha su salida', time: '01:12', clue: 'fichaje_pimienta' },
              ] },
              text: 'Mirad: a la 01:05 Baguette ya estaba a dos calles, comprando levadura. A la 01:12 solo quedaba Pimienta en la panadería. La línea de tiempo no miente.',
            }],
            doneText: 'Cinco papelitos en orden. Lali está muy orgullosa de su tablón.',
          },
          {
            id: 'ventana_gato', sprite: 'window', x: 3, y: 0, solid: true, label: 'Ventana con huellas', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'Huellas de gato y migas en el alféizar. Bigotes entró por aquí... pero un gato de cuatro kilos no carga una tarta de quince. Eso lo descarta casi del todo.', clue: 'huellas_gato' }],
            doneText: 'Huellas de gato. Bigotes estuvo aquí, pero no es el cerebro del crimen.',
          },
        ],
        doors: [{ id: 'puerta_cocina', x: 20, y: 0, sprite: 'door', to: { room: 'cocina', door: 'puerta_tienda' }, label: 'Cocina' }],
        npcs: [],
      },

      cocina: {
        name: 'Cocina',
        map: floorRows(22, 12, ','),
        floor: 'tile',
        decor: [{ sprite: 'window', x: 6, y: 0 }, { sprite: 'menu_board', x: 16, y: 0 }],
        decals: [],
        props: [
          { id: 'fogon1', sprite: 'stove', x: 4, y: 1, solid: true }, { id: 'fogon2', sprite: 'stove', x: 5, y: 1, solid: true }, { id: 'fregadero', sprite: 'sink', x: 8, y: 1, solid: true },
          {
            id: 'ganchos', sprite: 'hooks', x: 9, y: 0, solid: true, label: 'Ganchos de llaves', shimmer: true,
            steps: [{ tool: null, who: 'rex', text: 'Un gancho para cada llave, todos con su etiqueta: «Almacén», «Vitrina»... y «Puerta trasera», que está VACÍO. Alguien ha cogido el llavero con forma de croissant.', clue: 'gancho_vacio' }],
            doneText: 'Un gancho vacío con forma de «alguien ha estado aquí».',
          },
          { id: 'estante_h', sprite: 'shelf_flour', x: 1, y: 2, solid: true }, { id: 'horno', sprite: 'oven', x: 11, y: 2, solid: true },
          {
            id: 'nevera', sprite: 'fridge', x: 17, y: 2, solid: true, label: 'Nevera pesadísima', shimmer: true,
            steps: [{ tool: 'coop', time: 2.2, who: 'luna', text: '¡Hop! Entre los dos la nevera se desliza... y detrás había un hueco con algo escondido.', fx: { flag: 'nevera_movida', moveProp: { id: 'nevera', dx: 1, dy: 0 } } }],
            denied: 'Pesa una tonelada. Hace falta empujar entre dos (¡mantened el botón de acción juntos!).',
            doneText: 'La nevera ya está donde no estorba.',
          },
          {
            id: 'cuenco', sprite: 'bowl', x: 17, y: 2, solid: false, label: 'Cuenco escondido', visible: { flag: 'nevera_movida' }, shimmer: true,
            steps: [{ tool: null, who: 'rex', text: 'Un cuenco de glaseado de fresa casi terminado. Huele a fresa... pero al probar un poquito: ¡PUAJ, sal! Esta mezcla estaba destinada a la tarta.', clue: 'glaseado_salado' }],
            doneText: 'Glaseado salado. Ni los patos lo querrían.',
          },
          {
            id: 'cajon', sprite: 'drawer_locked', x: 2, y: 5, solid: true, label: 'Cajón con cerradura', shimmer: true, swap: { flag: 'cajon_abierto', sprite: 'drawer' },
            steps: [
              { tool: 'ganzua', time: 2.0, who: 'rex', text: '¡Clic! El cajón está abierto. Dentro hay una hoja de papel... pero parece en blanco. ¿O no?', fx: { flag: 'cajon_abierto' } },
              { tool: 'uv', who: 'luna', text: 'Bajo la luz UV aparece el mensaje oculto: «PIMIENTA decora la tarta este año. Glaseado de fresa. — Hogaza». ¡Ese chico llevaba mucha presión!', clue: 'receta_uv' },
            ],
            uvMark: { sprite: 'uv_text', afterStep: 1, dy: -2 },
            doneText: 'Un cajón con una receta de lo más reveladora.',
          },
          { id: 'mesa_trabajo1', sprite: 'table', x: 9, y: 6, solid: true }, { id: 'mesa_trabajo2', sprite: 'table', x: 10, y: 6, solid: true },
          {
            id: 'saco_a', sprite: 'sack_a', x: 18, y: 7, solid: true, label: 'Saco «AZÚCAR»', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'Con la lupa: la etiqueta pone «AZÚCAR» pero lo que sale es blanco, fino y... ¡salado! Y el saco de al lado, «SAL», lleva azúcar. Alguien los cambió de sitio o se confundió.', clue: 'sacos_cambiados' }],
            doneText: 'Dos sacos idénticos con las etiquetas cruzadas.',
          },
          { id: 'saco_b', sprite: 'sack_b', x: 19, y: 7, solid: true, label: 'Saco «SAL»', ref: 'saco_a' },
          { id: 'cajas', sprite: 'crate', x: 20, y: 9, solid: true }, { id: 'barril', sprite: 'barrel', x: 1, y: 9, solid: true }, { id: 'basura', sprite: 'trash', x: 15, y: 9, solid: true },
          { id: 'planta_c', sprite: 'plant', x: 20, y: 2, solid: true },
        ],
        doors: [
          { id: 'puerta_tienda', x: 3, y: 0, sprite: 'door', to: { room: 'tienda', door: 'puerta_cocina' }, label: 'Tienda' },
          {
            id: 'puerta_almacen', x: 13, y: 0, sprite: 'door', lockedSprite: 'door_locked', to: { room: 'almacen', door: 'puerta_cocina' }, label: 'Almacén',
            locked: { tool: 'ganzua', time: 2.4, chapterMin: 2, denied: 'El almacén está cerrado con llave. Todavía no hay motivo para forzar nada... primero hay que registrar la tienda y la cocina.', text: '¡Clic! La cerradura del almacén cede.' },
          },
          {
            id: 'puerta_trasera', x: 19, y: 0, sprite: 'door_metal', lockedSprite: 'door_metal_locked', to: { room: 'callejon', door: 'puerta_trasera' }, label: 'Puerta trasera',
            locked: { tool: null, chapterMin: 2, denied: 'La puerta trasera está cerrada con llave y la llave... bueno, la tiene Hogaza. Ya os la dará.', text: '¡Puerta abierta con la llave de Hogaza!' },
            firstOpen: { who: 'rex', text: 'Esperad... el cerrojo ya estaba descorrido por dentro y no hay marcas de forzado. Quien salió por aquí tenía la llave: era de la casa.', clue: 'puerta_sin_forzar' },
          },
        ],
        npcs: [],
      },

      almacen: {
        name: 'Almacén',
        ambient: 'rgba(15,10,40,0.14)',
        map: floorRows(14, 10, '.'),
        floor: 'wood',
        decor: [],
        decals: [],
        props: [
          { id: 'estante_a1', sprite: 'shelf_flour', x: 6, y: 2, solid: true }, { id: 'estante_a2', sprite: 'shelf_flour', x: 7, y: 2, solid: true }, { id: 'estante_a3', sprite: 'shelf_bread', x: 8, y: 2, solid: true },
          { id: 'cajas_alta', sprite: 'crate_stack', x: 11, y: 2, solid: true },
          {
            id: 'perchero', sprite: 'coat_rack', x: 4, y: 2, solid: true, label: 'Perchero con delantal', shimmer: true,
            steps: [{ tool: null, who: 'luna', text: 'Un delantal colgado, manchado de mermelada de fresa... y con cristales de sal en los bolsillos. En la esquina, una «P» bordada con mucho cariño.', clue: 'delantal_pimienta' }],
            doneText: 'El delantal con la «P». Sabe más de lo que cuenta.',
          },
          {
            id: 'carretilla', sprite: 'wheelbarrow', x: 9, y: 6, solid: true, label: 'Carretilla', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'La rueda de la carretilla tiene mermelada de fresa fresca. Coincide con las huellas del callejón. Alguien ha cargado algo dulce y GRANDE.', clue: 'carretilla_mermelada' }],
            doneText: 'Una carretilla con mermelada en la rueda.',
          },
          { id: 'caja_f', sprite: 'crate', x: 11, y: 5, solid: true },
          {
            id: 'fichajes', sprite: 'paper', x: 11, y: 5, dy: -8, solid: false, label: 'Libro de fichajes', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'El libro de fichajes: la última línea está emborronada... con la lupa: «Pimienta — salida 01:12». ¡Dijo que se fue a las ocho!', clue: 'fichaje_pimienta' }],
            doneText: 'Pimienta, salida 01:12. El borrón no engañó a la lupa.',
          },
          { id: 'barril_a1', sprite: 'barrel', x: 1, y: 6, solid: true }, { id: 'barril_a2', sprite: 'barrel', x: 1, y: 7, solid: true }, { id: 'cajas_a', sprite: 'crate', x: 12, y: 7, solid: true },
          { id: 'saco_extra', sprite: 'sack_a', x: 4, y: 7, solid: true },
          {
            id: 'taquilla', sprite: 'locker', x: 1, y: 3, solid: true, label: 'Taquilla con candado', shimmer: true,
            steps: [{
              tool: null, who: 'rex', clue: 'albaran_sacos',
              mini: { type: 'code', code: '0112', title: 'Taquilla de Hogaza', hint: 'Candado de 4 cifras. Hogaza lo apunta todo... ¿a qué hora (HHMM) salió alguien de la panadería esa noche?' },
              text: '¡Clac! Dentro de la taquilla solo hay un albarán del proveedor: «Etiquetas de SAL y AZÚCAR impresas al revés por error de imprenta». Los sacos llegaron mal desde el principio: nadie los cambió a propósito.',
            }],
            doneText: 'La taquilla de Hogaza, con un albarán muy aclaratorio.',
          },
        ],
        doors: [{ id: 'puerta_cocina', x: 2, y: 0, sprite: 'door', to: { room: 'cocina', door: 'puerta_almacen' }, label: 'Cocina' }],
        npcs: [],
      },

      callejon: {
        name: 'Callejón trasero',
        map: floorRows(30, 10, '_'),
        floor: 'cobble',
        wallStyle: 'stone',
        ambient: 'rgba(24,24,84,0.30)',
        decor: [],
        decals: [
          { sprite: 'decal_boots', x: 6, y: 4 }, { sprite: 'decal_boots', x: 7, y: 4 }, { sprite: 'decal_boots', x: 8, y: 4 },
          { sprite: 'decal_wheel', x: 3, y: 1 }, { sprite: 'decal_wheel', x: 3, y: 2 }, { sprite: 'decal_wheel', x: 3, y: 3 },
          ...[4, 5, 6, 7, 8, 9, 10, 11, 12].map((x) => ({ sprite: 'decal_wheel_h', x, y: 4 })),
        ],
        props: [
          { id: 'farola1', sprite: 'lamp_post', x: 8, y: 2, solid: true }, { id: 'farola2', sprite: 'lamp_post', x: 20, y: 2, solid: true },
          { id: 'basura1', sprite: 'trash', x: 13, y: 1, solid: true }, { id: 'basura2', sprite: 'trash', x: 14, y: 1, solid: true },
          { id: 'cajas_c', sprite: 'crate_stack', x: 25, y: 2, solid: true }, { id: 'banco', sprite: 'bench', x: 17, y: 1, solid: true },
          { id: 'buzon', sprite: 'mailbox', x: 11, y: 1, solid: true },
          ...[2, 5, 9, 14, 19, 24, 27].map((x, i) => ({ id: 'seto' + i, sprite: 'bush', x, y: 8, solid: true })),
          { id: 'paloma', sprite: 'pigeon', x: 23, y: 4, solid: false, pigeon: true },
          {
            id: 'botas', sprite: null, x: 6, y: 4, w: 3, h: 1, solid: false, label: 'Pisadas grandes', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'Pisadas enormes, del 47 al menos. Y mira: las marcas de la carretilla pasan POR ENCIMA, así que estas son anteriores. Solo hay un par de botas así en el pueblo...', clue: 'huellas_botas' }],
            doneText: 'Botas del 47, debajo de las huellas de la carretilla.',
          },
          {
            id: 'rueda', sprite: null, x: 10, y: 4, w: 3, h: 1, solid: false, label: 'Rastro de rueda', shimmer: true,
            steps: [{ tool: 'lupa', who: 'rex', text: 'Una rueda con gotas de mermelada de fresa. Sale de la puerta trasera y se aleja hacia la calle. Alguien llevaba algo MUY pesado.', clue: 'huellas_carretilla' }],
            doneText: 'Gotitas de mermelada. Un rastro dulce y delator.',
          },
          {
            id: 'murmullo', sprite: null, x: 21, y: 3, w: 4, h: 3, solid: false, label: 'Baguette murmurando', shimmer: true, listen: true, watcher: 'baguette',
            steps: [{ tool: 'grabadora', time: 3.0, who: 'luna', text: 'REC. «...Gertrudis, te lo juro: anoche a las doce y pico vine a espiar, ¡solo a espiar! Me fui a las doce y media a por levadura. Si Hogaza se entera de que estuve aquí...» Qué mala coartada para quien dijo que estaba en casa.', clue: 'grabacion_baguette' }],
            doneText: 'Una grabación de Baguette hablando con una paloma.',
          },
        ],
        doors: [{ id: 'puerta_trasera', x: 3, y: 0, sprite: 'door_metal', to: { room: 'cocina', door: 'puerta_trasera' }, label: 'Cocina' }],
        npcs: [],
      },
    },

    // dónde está cada personaje en cada capítulo (la última entrada con ch <= capítulo actual)
    placement: {
      hogaza: [{ ch: 1, room: 'tienda', x: 6, y: 3, face: 'right' }],
      merengue: [{ ch: 1, room: 'tienda', x: 14, y: 6, face: 'left' }, { ch: 3, room: 'tienda', x: 13, y: 8, face: 'up' }],
      pimienta: [{ ch: 1, room: 'cocina', x: 11, y: 7, face: 'left' }, { ch: 3, room: 'tienda', x: 17, y: 8, face: 'left' }],
      baguette: [{ ch: 2, room: 'callejon', x: 22, y: 4, face: 'right' }, { ch: 3, room: 'tienda', x: 7, y: 6, face: 'right' }],
      bigotes: [{ ch: 1, room: 'tienda', x: 4, y: 1, face: 'right', wander: [[4, 1], [6, 2], [2, 4], [8, 9]] }],
    },

    // ------------------------------------------------------------ DIÁLOGOS DE PNJ
    npcs: {
      hogaza: {
        name: 'Doña Hogaza', title: 'Dueña de la panadería', look: 'hogaza',
        first: ['Soy Hogaza, la dueña. Llevo treinta años amasando... y nunca me habían quitado una tarta. ¡Ni un bollo!'],
        topics: [
          {
            id: 'resumen', label: '¿Qué pasó exactamente?',
            responses: [
              { when: { chapterMax: 1 }, say: ['Cerré a las 23:00 con la Tarta en su vitrina. Esta mañana, a las 7:00... ¡un plato vacío y migas! ¡El concurso es a las diez!'] },
              { when: { chapterMax: 2 }, say: ['La tarta salió por algún sitio, eso seguro. Fijaos en puertas, huellas y en quién tiene llaves.'] },
              { say: ['Ya sabéis todo lo que sé yo. ¡Acusad con valentía... y con pruebas!'] },
            ],
          },
          {
            id: 'sospechosos', label: '¿Quién pudo hacerlo?',
            responses: [{ say: ['Don Baguette, que lleva años ganándome concursos con trucos. Doña Merengue, que es la jueza. Mi aprendiz Pimienta, que no pega ojo. Y Bigotes... bueno, Bigotes siempre tiene cara de culpable.'] }],
          },
        ],
        chat: [['Los detectives de ahora llegan más tarde que el pan del domingo... ¡es broma, sois puntuales!'], ['Cuando esto acabe os invito a una napolitana. Con crema. De la buena.']],
        press: [['¿Me interrogáis a MÍ? ¡Si la víctima soy yo! (suspira) Está bien: nada de esto me parece normal.']],
        evidenceDefault: ['Interesante... pero eso lo tenéis que atar vosotros, que para eso os pago.'],
        evidence: {},
      },

      merengue: {
        name: 'Doña Merengue', title: 'Jueza oficial del concurso', look: 'merengue',
        first: ['Doña Merengue, jueza oficial. Si busca culpables, mire a cualquiera que huela a harina... ¡es decir, a todos!'],
        topics: [
          {
            id: 'anoche', label: '¿Dónde estuvo anoche?',
            responses: [
              { when: { flag: 'merengue_cracked' }, say: ['Ya se lo he dicho: vine a las diez a probar un trocito. ¡Es mi trabajo!'] },
              { say: ['¡En mi casa, durmiendo como un bebé! Jamás he pisado esta panadería. ¿Cómo se atreve a preguntar?'], fx: { flag: 'lie_merengue' } },
            ],
          },
          {
            id: 'llave', label: '¿Tiene llave de la panadería?', show: { flag: 'merengue_cracked' },
            responses: [{ say: ['¡Ni una! Hogaza me abrió a las diez y a las diez y media ya estaba en la calle. Pregúntele a ella. Eso sí: la tarta estaba PERFECTA y entera.'], fx: { clue: 'testimonio_merengue' } }],
          },
          {
            id: 'concurso', label: 'Hábleme del concurso',
            responses: [
              { when: { any: [{ trustMin: 1 }, { flag: 'merengue_cracked' }] }, say: ['Pimienta andaba hecho un flan toda la semana: este año decoraba él la tarta y no dormía de los nervios. Pobrecito.'], fx: { clue: 'testimonio_nervios' } },
              { say: ['Es un concurso muy serio y no puedo hablar de eso con cualquiera. (Dime algo amable y quizá te cuente más).'] },
            ],
          },
        ],
        chat: [['¿Que si me gusta el merengue? ¡Es mi apellido, no mi religión! (pero sí, mucho)'], ['Qué educados sois. En el jurado todos son unos gritones.'], ['Usad servilletas, queridos. La vida es demasiado corta para los dedos pegajosos.']],
        press: [
          { when: { pressureMin: 3, notFlag: 'merengue_cracked' }, say: ['¡BASTA! (tose) Está bien, está bien: vine a las diez a probar un trocito. ¡Un trocito!'], fx: { flag: 'merengue_cracked', sfx: 'crack' } },
          { say: ['¡Me está agobiando! ¿Sabe usted quién soy?', 'Soy jueza... y tengo muy mala memoria para las coartadas.'] },
        ],
        evidenceDefault: ['Eso no me suena de nada. ¿Puedo irme ya?'],
        evidence: {
          tenedor_labial: [
            { when: { notFlag: 'merengue_cracked' }, say: ['(se pone roja como una fresa) Ese tenedor... ¡vale, vale! Vine a las diez a probar un trocito. ¡Es mi trabajo! Pero estaba PERFECTA y la dejé entera.'], fx: { flag: 'merengue_cracked', sfx: 'crack' } },
            { say: ['Sí, sí, es mío. Ya lo he confesado: no me lo restregue por la cara.'] },
          ],
          nota_cierre: [
            { when: { flag: 'merengue_cracked' }, say: ['¿Lo ve? Hogaza la vio entera a las once. Yo ya estaba en casa. ¡Soy inocente como una magdalena!'] },
            { say: ['¿Una nota? ¿Y eso qué tiene que ver conmigo?'] },
          ],
        },
      },

      baguette: {
        name: 'Don Baguette', title: 'Panadero rival', look: 'baguette',
        watch: { spotted: '¡Eh! ¿Quién anda ahí?... ah, eras tú, Gertrudis.' },
        first: ['¡Ah, detectives! Soy Don Baguette, el mejor panadero de Villa Migas. Y sí, ya sé lo de la tarta: ¡yo no he sido!'],
        topics: [
          {
            id: 'anoche', label: '¿Dónde estuvo anoche?',
            responses: [
              { when: { flag: 'baguette_cracked' }, say: ['Ya se lo he dicho: espié un poquito, pero soy inocente como el pan de molde.'] },
              { say: ['En mi casa, debajo de seis mantas. Jamás he pisado este callejón de noche. ¡Mi cama es sagrada!'], fx: { flag: 'lie_baguette' } },
            ],
          },
          {
            id: 'sombra', label: '¿Vio algo raro al irse?', show: { flag: 'baguette_cracked' },
            responses: [{ say: ['Al irme, a las doce y media, había luz en la cocina... y una sombra con un gorrito de cocinero PEQUEÑITO, canturreando. ¡Yo me fui a comprar levadura!'], fx: { clue: 'testimonio_sombra' } }],
          },
          {
            id: 'ticket', label: '¿Puede demostrar dónde estaba?', show: { flag: 'baguette_cracked' },
            responses: [{ say: ['¡Pues claro! Mire el ticket de la tienda 24 horas: 01:05. Compré levadura. ¡Estaba a dos calles!'], fx: { clue: 'ticket_baguette' } }],
          },
        ],
        chat: [['¿Mi secreto? Amor, paciencia y mucha, mucha mantequilla.'], ['Esta paloma se llama Gertrudis. No habla, pero escucha mejor que mi mujer.'], ['¿Sabe que mi barra mide medio metro más que la de Hogaza? Es un hecho. Está medido.']],
        press: [
          { when: { pressureMin: 3, notFlag: 'baguette_cracked' }, say: ['¡Está bien, está bien! Vine a espiar un poquito, ¡pero solo a ESPIAR!'], fx: { flag: 'baguette_cracked', sfx: 'crack' } },
          { say: ['¡No me ponga contra las cuerdas, que soy muy sensible... del bigote!'] },
        ],
        evidenceDefault: ['Eso no tiene nada que ver conmigo. ¡Qué ocurrencia!'],
        evidence: {
          huellas_botas: [
            { when: { notFlag: 'baguette_cracked' }, say: ['(traga saliva) ¿Botas del 47? Hay muchísimas... ¡vale, fui yo! Solo vine a espiar la competencia. ¡Pero no me llevé nada!'], fx: { flag: 'baguette_cracked', sfx: 'crack' } },
            { say: ['Sí, son mis botas. Ya me ha pillado una vez, ¡no me las enseñe otra vez!'] },
          ],
          grabacion_baguette: [
            { when: { notFlag: 'baguette_cracked' }, say: ['¡¿Me ha grabado?! ¡Eso es trampa! ¡Era un monólogo con Gertrudis!... Vale, vale: vine a espiar. Pero solo a eso.'], fx: { flag: 'baguette_cracked', sfx: 'crack' } },
            { say: ['Sí, era yo. Gertrudis no ha dicho nada, es una profesional.'] },
          ],
        },
      },

      pimienta: {
        name: 'Pimienta', title: 'Aprendiz de panadero', look: 'pimienta',
        first: ['¡H-hola! Soy Pimienta, el aprendiz. No he hecho nada. ¡Que conste!'],
        topics: [
          {
            id: 'anoche', label: '¿Dónde estuvo anoche?',
            responses: [
              { when: { flag: 'pimienta_confessed' }, say: ['Ya os lo he contado todo... ¡qué vergüenza!'] },
              { when: { flag: 'pimienta_cracked1' }, say: ['Eh... me quedé un poquito más. Para practicar... cosas de repostería. Nada importante.'] },
              { say: ['Me fui a casa a las ocho, ¡palabra de aprendiz! Y luego... no sé nada de ninguna tarta.'], fx: { flag: 'lie_pimienta' } },
            ],
          },
          {
            id: 'glaseado', label: '¿Y el glaseado de la tarta?', show: { any: [{ clue: 'receta_uv' }, { clue: 'testimonio_nervios' }, { clue: 'glaseado_salado' }] },
            responses: [
              { when: { flag: 'pimienta_confessed' }, say: ['Fue mi primera vez decorando. ¡Y me salió salado como el mar!'] },
              { when: { flag: 'pimienta_cracked1' }, say: ['Era mi primera vez decorando... y quedó... digamos que «con carácter». No sé más.'] },
              { say: ['¿Qué glaseado? Yo... no sé nada de glaseados. ¡Soy más de pan!'] },
            ],
          },
          {
            id: 'perdon', label: 'Cuéntanos qué pasó con la tarta', show: { flag: 'pimienta_confessed' },
            responses: [{ say: ['Pagaré la tarta... y fregaré mil bandejas. Está en el contenedor verde de la plaza. ¡Por favor, que nadie la pise!'] }],
          },
        ],
        chat: [['A mí de pequeño me daban miedo las migas. Ahora me dan trabajo.'], ['Gracias por preguntarme con calma. Es que soy muy nervioso: hasta duermo con el gorro puesto.'], ['Mi sueño es hacer un croissant tan perfecto que lloren los franceses.']],
        press: [
          { when: { pressureMin: 3, trustMin: 1, notFlag: 'pimienta_cracked1' }, say: ['(suda) Vale... vale. Me quedé hasta tarde. Pero solo practicando, ¿eh?'], fx: { flag: 'pimienta_cracked1', sfx: 'crack' } },
          { when: { pressureMin: 3, trustMax: 0, notFlag: 'pimienta_cracked1' }, say: ['(se tapa la cara con el gorro) ¡Ya no digo nada sin mi abogado, que es el horno!'], fx: { lockFor: 45, sfx: 'boing' } },
          { say: ['(tiembla) No me mire así, que se me cae la masa.'] },
        ],
        evidenceDefault: ['Eso... eso no prueba nada. ¡Cualquiera pudo hacerlo!'],
        evidence: {
          fichaje_pimienta: [
            { when: { notFlag: 'pimienta_cracked1' }, say: ['(se pone pálido) ¡E-ese libro miente! ¡Es una cuarenta! Bueno... vale, me quedé hasta la una. Pero solo practicando.'], fx: { flag: 'pimienta_cracked1', sfx: 'crack' } },
            { say: ['Sí, me quedé hasta la una y doce. Ya lo he dicho...'] },
          ],
          '*': [
            { when: { flag: 'pimienta_cracked1', notFlag: 'pimienta_confessed', flagCountMin: { prefix: 'pimienta_pres_', min: 2 } }, say: ['(se derrumba y llora sobre el gorro) ¡Vale, vale! ¡Fue sin querer! Los sacos tenían las etiquetas cruzadas y puse SAL en el glaseado... A medianoche la tarta ya era incomible. Entré en pánico, cogí la llave y la saqué en la carretilla por la puerta de atrás.', '¡Está en el contenedor verde de la plaza! Lo siento muchísimo...'], fx: { flag: 'pimienta_confessed', clue: 'confesion_pimienta', sfx: 'success' } },
            { when: { notFlag: 'pimienta_cracked1' }, say: ['Eso... eso no prueba nada. ¡Cualquiera pudo hacerlo!'] },
            { say: ['(traga saliva) Eso... me suena. Pero hace falta algo más para convencerme.'] },
          ],
        },
      },

      bigotes: {
        name: 'Bigotes', title: 'El gato', look: 'cat', cat: true,
        first: ['Miau.'],
        topics: [
          { id: 'hablar', label: 'Hablar con Bigotes', responses: [{ say: ['Miau. (Traducción: «Yo no he sido, pero si hay atún, hablamos»).'] }] },
        ],
        chat: [['Prrrr... (te frota la cabeza en la espinilla).'], ['Miau. (Se tumba panza arriba).'], ['Prrr. (Te deja un calcetín. No es tuyo).']],
        press: [['¡Fffst! (Ni se te ocurra interrogar a un gato.)']],
        evidenceDefault: ['Miau. (Te mira como si le hubieras pedido la declaración de la renta.)'],
        evidence: {},
        petReward: 15,
      },
    },

    // ------------------------------------------------------------ CHARLA DEL COMPAÑERO / HUMOR
    banter: {
      rex: {
        enter: {
          tienda: ['Huele a pan recién hecho y a crimen reciente. Mi combinación favorita.', 'Si me quedo aquí un minuto más, compro dos baguettes.'],
          cocina: ['Una cocina profesional. Aquí nadie ha dejado la sal en el sitio correcto.', 'Mucho acero inoxidable. Demasiado limpio para ser inocente.'],
          almacen: ['Aquí huele a harina y a secretos.', 'Si veo una rata, me retiro.'],
          callejon: ['Un callejón oscuro. Me siento como en una película... de panaderos.', 'Los callejones y yo tenemos una larga historia.'],
        },
        idle: ['Piensa, Oli, piensa... ¿qué haría un detective de verdad? ¿Tomar un café?', 'Esto me recuerda a mi último caso: «El Misterio del Calcetín Desaparecido».', '¿Y si el culpable fuera el mayordomo? Aquí no hay mayordomo. Qué decepción.'],
        theory: {
          pimienta: ['Mmm... mi instinto dice que Pimienta esconde algo. O que necesita unas vacaciones.'],
          baguette: ['Ese Baguette tiene pinta de espiar. Y de tener bigote de villano.'],
          merengue: ['Doña Merengue es muy sospechosa... de comer mucho postre.'],
          bigotes: ['Si el gato es el culpable, exijo una confesión en miaus.'],
        },
        help: ['Voy, voy. Un detective de campo siempre llega a tiempo (más o menos).', 'Dejadme a mí: tengo manos de oro... y una ganzúa.'],
        done: ['¡Listo! ¿Qué os parece?', 'Trabajo limpio. Casi.'],
      },
      luna: {
        enter: {
          tienda: ['Huele a mantequilla. Mi nariz forense se enamora.', 'Por favor, que nadie toque nada con las manos pegajosas.'],
          cocina: ['Una cocina impecable. Sospechosamente impecable.', 'La luz UV y las cocinas: una historia de amor.'],
          almacen: ['Mucho polvo. Mucha harina. Mucha evidencia por catalogar.', 'Aquí hay más cajas que en una mudanza.'],
          callejon: ['Aire fresco... y un poco de olor a basura. Perfecto para una investigación.', 'Cuidado con los charcos: llevo zapatos nuevos.'],
        },
        idle: ['Estoy anotando teorías en mi cabeza. Hay una con un pastel volador.', '¿Alguien más nota que estamos resolviendo el crimen más dulce de la historia?', 'Si algún día monto una agencia propia, el cuaderno será gigante.'],
        theory: {
          pimienta: ['Los datos apuntan a Pimienta, pero no me fío de los datos sin pruebas.'],
          baguette: ['Baguette tiene motivos... y botas muy grandes. Habrá que mirarlas.'],
          merengue: ['Merengue miente con mucha seguridad. Eso me gusta poco.'],
          bigotes: ['No descarto al gato, pero necesito huellas.'],
        },
        help: ['Voy con la luz, no te muevas.', '¡Yo me encargo! Activando modo laboratorio.'],
        done: ['Hecho. Apunta eso en el cuaderno.', 'Listo. Ya podemos presumir de método científico.'],
      },
    },

    epilogue: {
      timeout: [{ who: 'hogaza', text: '¡Se acabó el tiempo! El concurso ha empezado sin vosotros...' }],
      win: [
        { who: 'hogaza', text: '¡Pimienta! ¿Cómo has podido? ¡Y con mi sal! ... Bueno, con MI SAL no, con la que estaba mal rotulada. Culpa mía.' },
        { who: 'pimienta', text: 'Lo siento muchísimo, Doña Hogaza. Prometo fregar mil bandejas.' },
        { who: 'merengue', text: 'Por cierto, la tarta apareció en el contenedor verde... y estaba salada pero «atrevida». ¡Le doy el premio al Postre Más Original!' },
        { who: 'luna', text: 'Un clásico: el culpable es el que más nervioso está.' },
        { who: 'rex', text: 'Caso cerrado. Y yo sin probar la napolitana.' },
      ],
      fail: [
        { who: 'hogaza', text: 'Vaya... os habéis equivocado. El verdadero culpable sonríe en algún rincón. ¡Pero no os rindáis, detectives!' },
      ],
    },
  };

  G.CASES[def.id] = def;
})(typeof window !== 'undefined' ? window : globalThis);
