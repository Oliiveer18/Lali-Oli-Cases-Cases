// gen_data.js — BANCOS DE DATOS del generador (fábrica de casos, fase 3B). SOLO DATOS: nada de lógica.
// Los usa G.genTruth (gen_truth.js) y, más adelante, el compilador (3D). Cambiar cualquier banco cambia las salidas:
// si se toca, hay que subir G.GEN_VERSION (src/bible.js) para que el código de caso siga identificando la biblia.
// Plantillas con {llaves}: {obj} = nombre del objeto con artículo, {to} = «a la tienda» / «al almacén», {where} = rincón donde se esconde.
(function (root) {
  'use strict';
  const G = root.G;
  G.GEN_DATA = {
    // aspectos de G.LOOKS que se pueden usar (rex y luna son los detectives; 'cliente' es para el cliente)
    looks: ['hogaza', 'baguette', 'merengue', 'pimienta'].concat(G.GEN_LOOK_IDS || []), // 4B: los 4 de siempre + el pool generado (asp_01…, sprites_b.js); dentro de un caso no se repite ninguno
    clientLook: 'cliente',
    traits: ['nervioso', 'soberbio', 'evasivo', 'amable', 'seco'],

    // personajes posibles (humor suave: todos son de panadería/pastelería). El id no puede ser rex, luna ni narrator.
    names: [
      { id: 'hogaza', name: 'Doña Hogaza' }, { id: 'baguette', name: 'Monsieur Baguette' }, { id: 'merengue', name: 'Merengue' },
      { id: 'pimienta', name: 'Pimienta' }, { id: 'canela', name: 'Canela' }, { id: 'brioche', name: 'Brioche' },
      { id: 'galleta', name: 'Galleta' }, { id: 'churro', name: 'Churro' }, { id: 'sobao', name: 'Don Sobao' },
      { id: 'magdalena', name: 'Magdalena' }, { id: 'trufa', name: 'Trufa' }, { id: 'croqueta', name: 'Croqueta' },
      { id: 'palmera', name: 'Palmera' }, { id: 'rosco', name: 'Rosco' }, { id: 'tostada', name: 'Tostada' },
    ],

    // lugares base (el orden de esta lista fija el orden de los lugares de una biblia)
    places: [
      { id: 'tienda', name: 'Tienda', loc: 'la tienda', to: 'a la tienda' }, { id: 'cocina', name: 'Cocina', loc: 'la cocina', to: 'a la cocina' },
      { id: 'almacen', name: 'Almacén', loc: 'el almacén', to: 'al almacén' }, { id: 'callejon', name: 'Callejón', loc: 'el callejón', to: 'al callejón' },
      { id: 'taller', name: 'Taller', loc: 'el taller', to: 'al taller' },
    ],
    // 4F-0b 2/4: LUGARES EN RESERVA. La 6.ª sala de la panadería (decisión del usuario, 24 oct): el Despacho del dueño. NO está en `places`: ningún caso la elige todavía (el azar de gen_truth y los códigos G6 siguen idénticos).
    // Sus plantillas viven en `rooms.despacho` y sus textos en acts/impossible/hideAt. En 4F-0b 3/4 (GEN_VERSION 6→7) pasa a `places` y se usa en Difícil (6 salas). `name` corto a propósito (sale en rótulos de puerta y del HUD); `loc`/`to` dicen «del dueño».
    reservedPlaces: [
      { id: 'despacho', name: 'Despacho', loc: 'el despacho del dueño', to: 'al despacho del dueño' },
    ],

    // 4C-1a/4C-2a: PLANTILLAS DE SALA (datos puros; cada lugar base tiene una LISTA de variantes; las usa G.compileBible y marca `room.template` con el id de la variante elegida). No cambian GEN_VERSION (no tocan la biblia).
    // La variante de cada sala la elige el compilador con un azar PROPIO de la semilla (`seed ^ 0x5ce4e`) y el peso `weight` de la variante (dato; por defecto 1). El primer elemento de cada lista es la plantilla de 4C-1a.
    // Campos: id, weight, scene, w×h (el mapa se construye con paredes en el borde y `walls` interiores), floor, wallStyle?, ambient?, ch (carácter de suelo), doorX [puerta a la sala anterior, puerta a la siguiente] en la pared norte (y=0),
    //   decor (en la pared), decals (suelo, solo visual), scenery (objetos sólidos de ambiente, sin pista), slots (baldosas para los objetos con pista: [x, y, sprite]; los primeros 4 son los habituales, el resto es reserva),
    //   special = huecos de la mecánica (4C-1b): cerradura {x,y,sprite?,label?,open?} (ganzúa), rincon (rincón oscuro, luz UV) {x,y}, empujable {x,y,dx,dy} (objeto que se podrá empujar hacia dx,dy).
    //   scene (4C-2a): 'interior' (por defecto: salas cerradas y el callejón estrecho) o 'calle' (escenario exterior ABIERTO con curiosos); la huella la deduce de `room.template`.
    //   crowd (4C-2a, solo en 'calle'): ≥ 3 baldosas libres [x, y] para curiosos (solo datos: los usa 4C-3b).
    // Reglas que vigila test_rooms.js para TODAS las variantes: baldosas de arranque (6,7) y (7,7), de personajes (5..11,5) y de acceso a las puertas (doorX,1) siempre libres; todo es alcanzable; nada se pisa; ≥ 6 huecos; los 3 huecos especiales libres.
    rooms: {
      tienda: [
        {
          id: 'tienda_vitrinas', weight: 0.4, w: 16, h: 9, floor: 'wood', ch: '.', walls: [], doorX: [3, 10],
          decor: [{ sprite: 'clock', x: 6, y: 0 }, { sprite: 'window', x: 8, y: 0 }, { sprite: 'painting', x: 13, y: 0 }, { sprite: 'menu_board', x: 14, y: 0 }],
          decals: [{ sprite: 'rug_round', x: 8, y: 6, w: 2, h: 2, big: true }, { sprite: 'decal_crumbs', x: 2, y: 5 }],
          scenery: [{ sprite: 'counter', x: 12, y: 2 }, { sprite: 'counter', x: 13, y: 2 }, { sprite: 'counter', x: 14, y: 2 }, { sprite: 'plant', x: 1, y: 1 }, { sprite: 'plant', x: 14, y: 7 }, { sprite: 'stool', x: 11, y: 3 }],
          slots: [[3, 3, 'display_case'], [8, 3, 'table'], [2, 6, 'drawer'], [13, 5, 'crate'], [12, 7, 'barrel'], [1, 3, 'stool']],
          special: { cerradura: { x: 14, y: 4 }, rincon: { x: 1, y: 7 }, empujable: { x: 5, y: 7, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 4, y: 3, w: 2, h: 1, a: { x: 4, y: 2, face: 'right' }, b: { x: 5, y: 2, face: 'left' } },
        },
        {
          id: 'tienda_escaparate', weight: 0.3, w: 15, h: 9, floor: 'carpet', ch: '.', walls: [], doorX: [4, 11],
          decor: [{ sprite: 'clock', x: 2, y: 0 }, { sprite: 'window', x: 6, y: 0 }, { sprite: 'window', x: 8, y: 0 }, { sprite: 'painting', x: 13, y: 0 }],
          decals: [{ sprite: 'rug_round', x: 9, y: 6, w: 2, h: 2, big: true }, { sprite: 'decal_shine', x: 3, y: 6 }],
          scenery: [{ sprite: 'counter', x: 1, y: 2 }, { sprite: 'counter', x: 1, y: 3 }, { sprite: 'counter', x: 1, y: 4 }, { sprite: 'plant', x: 13, y: 1 }, { sprite: 'plant', x: 13, y: 7 }, { sprite: 'trophy', x: 11, y: 2 }],
          slots: [[5, 3, 'display_case'], [10, 3, 'table'], [3, 6, 'drawer'], [13, 5, 'crate'], [12, 7, 'barrel'], [3, 4, 'stool']],
          special: { cerradura: { x: 13, y: 3 }, rincon: { x: 1, y: 7 }, empujable: { x: 5, y: 7, dx: 0, dy: -1 }, escena: { x: 13, y: 4 } },
          listen: { x: 6, y: 3, w: 2, h: 1, a: { x: 6, y: 2, face: 'right' }, b: { x: 7, y: 2, face: 'left' } },
        },
        {
          id: 'tienda_trastienda', weight: 0.3, w: 14, h: 10, floor: 'tile', ambient: 'rgba(40,20,10,0.10)', ch: '.', walls: [[6, 3], [7, 3]], doorX: [3, 10],
          decor: [{ sprite: 'poster', x: 6, y: 0 }, { sprite: 'clock', x: 8, y: 0 }, { sprite: 'menu_board', x: 12, y: 0 }],
          decals: [{ sprite: 'decal_crumbs', x: 5, y: 6 }],
          scenery: [{ sprite: 'shelf_bread', x: 1, y: 2 }, { sprite: 'shelf_bread', x: 2, y: 2 }, { sprite: 'counter', x: 11, y: 2 }, { sprite: 'counter', x: 12, y: 2 }, { sprite: 'sack_a', x: 12, y: 8 }, { sprite: 'sack_b', x: 11, y: 8 }, { sprite: 'plant', x: 1, y: 8 }],
          slots: [[3, 4, 'table'], [9, 3, 'display_case'], [2, 6, 'drawer'], [12, 5, 'crate'], [10, 8, 'barrel'], [4, 8, 'stool']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 5 }, empujable: { x: 8, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 4, y: 3, w: 2, h: 1, a: { x: 4, y: 2, face: 'right' }, b: { x: 5, y: 2, face: 'left' } },
        },
      ],
      cocina: [
        {
          id: 'cocina_hornos', weight: 0.4, w: 14, h: 9, floor: 'tile', ch: '.', walls: [], doorX: [3, 10],
          decor: [{ sprite: 'window', x: 6, y: 0 }, { sprite: 'clock', x: 8, y: 0 }],
          decals: [{ sprite: 'decal_crumbs', x: 4, y: 6 }],
          scenery: [{ sprite: 'oven', x: 5, y: 1 }, { sprite: 'stove', x: 6, y: 1 }, { sprite: 'sink', x: 7, y: 1 }, { sprite: 'fridge', x: 12, y: 1 }, { sprite: 'sack_a', x: 1, y: 7 }, { sprite: 'sack_b', x: 12, y: 7 }],
          slots: [[2, 3, 'drawer'], [9, 3, 'table'], [2, 5, 'crate'], [11, 6, 'barrel'], [12, 3, 'stool'], [9, 7, 'sack_a']],
          special: { cerradura: { x: 1, y: 3 }, rincon: { x: 1, y: 6 }, empujable: { x: 4, y: 7, dx: 0, dy: -1 }, escena: { x: 12, y: 4 } },
          listen: { x: 4, y: 3, w: 2, h: 1, a: { x: 4, y: 2, face: 'right' }, b: { x: 5, y: 2, face: 'left' } },
        },
        {
          id: 'cocina_obrador', weight: 0.3, w: 16, h: 9, floor: 'tile', ch: '.', walls: [], doorX: [3, 12],
          decor: [{ sprite: 'window', x: 6, y: 0 }, { sprite: 'window', x: 9, y: 0 }, { sprite: 'clock', x: 14, y: 0 }],
          decals: [{ sprite: 'decal_crumbs', x: 8, y: 6 }, { sprite: 'decal_shine', x: 4, y: 4 }],
          scenery: [{ sprite: 'oven', x: 5, y: 1 }, { sprite: 'stove', x: 6, y: 1 }, { sprite: 'sink', x: 7, y: 1 }, { sprite: 'fridge', x: 14, y: 1 }, { sprite: 'lab_table', x: 9, y: 3 }, { sprite: 'lab_table', x: 10, y: 3 }, { sprite: 'sack_a', x: 1, y: 7 }, { sprite: 'sack_b', x: 14, y: 7 }, { sprite: 'coffee', x: 14, y: 3 }],
          slots: [[2, 3, 'drawer'], [12, 3, 'table'], [2, 5, 'crate'], [13, 6, 'barrel'], [4, 7, 'stool'], [9, 7, 'sack_a']],
          special: { cerradura: { x: 1, y: 4 }, rincon: { x: 14, y: 5 }, empujable: { x: 11, y: 7, dx: 0, dy: -1 }, escena: { x: 14, y: 4 } },
          listen: { x: 5, y: 3, w: 2, h: 1, a: { x: 5, y: 2, face: 'right' }, b: { x: 6, y: 2, face: 'left' } },
        },
        {
          id: 'cocina_despensa', weight: 0.3, w: 15, h: 10, floor: 'tile', ambient: 'rgba(30,20,10,0.08)', ch: '.', walls: [], doorX: [3, 10],
          decor: [{ sprite: 'window', x: 5, y: 0 }, { sprite: 'clock', x: 8, y: 0 }, { sprite: 'poster', x: 12, y: 0 }],
          decals: [{ sprite: 'decal_crumbs', x: 7, y: 6 }],
          scenery: [{ sprite: 'oven', x: 5, y: 1 }, { sprite: 'stove', x: 6, y: 1 }, { sprite: 'sink', x: 8, y: 1 }, { sprite: 'fridge', x: 12, y: 1 }, { sprite: 'shelf_flour', x: 12, y: 3 }, { sprite: 'sack_a', x: 1, y: 8 }, { sprite: 'sack_b', x: 2, y: 8 }, { sprite: 'coffee', x: 12, y: 8 }],
          slots: [[3, 3, 'table'], [9, 3, 'drawer'], [2, 6, 'crate'], [11, 6, 'barrel'], [12, 5, 'sack_b'], [8, 8, 'stool']],
          special: { cerradura: { x: 1, y: 4 }, rincon: { x: 12, y: 7 }, empujable: { x: 4, y: 8, dx: 0, dy: -1 }, escena: { x: 13, y: 4 } },
          listen: { x: 4, y: 3, w: 2, h: 1, a: { x: 4, y: 2, face: 'right' }, b: { x: 5, y: 2, face: 'left' } },
        },
      ],
      almacen: [
        {
          id: 'almacen_estantes', weight: 0.4, w: 16, h: 10, floor: 'wood', ambient: 'rgba(15,10,40,0.14)', ch: '.', walls: [[8, 7], [12, 4]], doorX: [3, 10],
          decor: [{ sprite: 'window_night', x: 6, y: 0 }, { sprite: 'poster', x: 13, y: 0 }],
          decals: [],
          scenery: [{ sprite: 'shelf_flour', x: 5, y: 2 }, { sprite: 'shelf_flour', x: 6, y: 2 }, { sprite: 'shelf_bread', x: 7, y: 2 }, { sprite: 'shelf_bread', x: 12, y: 2 }, { sprite: 'shelf_flour', x: 13, y: 2 }, { sprite: 'sack_a', x: 1, y: 2 }, { sprite: 'sack_b', x: 1, y: 3 }, { sprite: 'crate_stack', x: 14, y: 8 }],
          slots: [[3, 3, 'crate'], [9, 3, 'barrel'], [2, 6, 'drawer'], [12, 6, 'table'], [14, 5, 'sack_b'], [4, 8, 'stool']],
          special: { cerradura: { x: 14, y: 3 }, rincon: { x: 1, y: 8 }, empujable: { x: 10, y: 7, dx: 0, dy: -1 }, escena: { x: 14, y: 4 } },
          listen: { x: 10, y: 3, w: 2, h: 1, a: { x: 10, y: 2, face: 'right' }, b: { x: 11, y: 2, face: 'left' } },
        },
        {
          id: 'almacen_cajas', weight: 0.3, w: 18, h: 10, floor: 'wood', ambient: 'rgba(15,10,40,0.14)', ch: '.', walls: [], doorX: [3, 13],
          decor: [{ sprite: 'window_night', x: 6, y: 0 }, { sprite: 'poster', x: 10, y: 0 }, { sprite: 'clock', x: 15, y: 0 }],
          decals: [{ sprite: 'decal_wheel', x: 12, y: 7 }],
          scenery: [{ sprite: 'crate_stack', x: 1, y: 2 }, { sprite: 'crate_stack', x: 2, y: 2 }, { sprite: 'shelf_flour', x: 5, y: 2 }, { sprite: 'shelf_flour', x: 6, y: 2 }, { sprite: 'shelf_bread', x: 15, y: 2 }, { sprite: 'sack_a', x: 16, y: 8 }, { sprite: 'sack_b', x: 16, y: 7 }, { sprite: 'barrel', x: 2, y: 8 }, { sprite: 'wheelbarrow', x: 14, y: 8 }],
          slots: [[3, 4, 'crate'], [9, 3, 'barrel'], [2, 6, 'drawer'], [13, 6, 'table'], [15, 5, 'sack_b'], [5, 8, 'stool']],
          special: { cerradura: { x: 15, y: 3 }, rincon: { x: 1, y: 8 }, empujable: { x: 10, y: 8, dx: 0, dy: -1 }, escena: { x: 16, y: 4 } },
          listen: { x: 7, y: 3, w: 2, h: 1, a: { x: 7, y: 2, face: 'right' }, b: { x: 8, y: 2, face: 'left' } },
        },
        {
          id: 'almacen_sotano', weight: 0.3, w: 14, h: 10, floor: 'cobble', wallStyle: 'stone', ambient: 'rgba(10,10,30,0.28)', ch: '.', walls: [[8, 7], [12, 3]], doorX: [3, 10],
          decor: [{ sprite: 'poster', x: 6, y: 0 }],
          decals: [],
          scenery: [{ sprite: 'barrel', x: 1, y: 2 }, { sprite: 'barrel', x: 1, y: 3 }, { sprite: 'crate_stack', x: 5, y: 2 }, { sprite: 'crate_stack', x: 6, y: 2 }, { sprite: 'shelf_flour', x: 12, y: 2 }, { sprite: 'sack_a', x: 1, y: 8 }, { sprite: 'sack_a', x: 2, y: 8 }],
          slots: [[3, 3, 'barrel'], [9, 3, 'crate'], [2, 6, 'drawer'], [11, 6, 'table'], [12, 5, 'sack_b'], [5, 8, 'stool']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 7 }, empujable: { x: 9, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 7, y: 3, w: 2, h: 1, a: { x: 7, y: 2, face: 'right' }, b: { x: 8, y: 2, face: 'left' } },
        },
      ],
      callejon: [
        {
          id: 'callejon_farolas', weight: 0.3, w: 18, h: 9, floor: 'cobble', wallStyle: 'stone', ambient: 'rgba(24,24,84,0.30)', ch: '_', walls: [], doorX: [3, 10],
          decor: [],
          decals: [],
          scenery: [{ sprite: 'lamp_post', x: 6, y: 2 }, { sprite: 'lamp_post', x: 14, y: 2 }, { sprite: 'trash', x: 12, y: 1 }, { sprite: 'trash', x: 13, y: 1 }, { sprite: 'mailbox', x: 16, y: 1 }, { sprite: 'bush', x: 1, y: 7 }, { sprite: 'bush', x: 3, y: 7 }, { sprite: 'bush', x: 11, y: 7 }, { sprite: 'bush', x: 14, y: 7 }, { sprite: 'bush', x: 16, y: 7 }],
          slots: [[3, 3, 'crate'], [9, 3, 'bench'], [2, 5, 'barrel'], [14, 4, 'trash'], [13, 6, 'crate'], [16, 3, 'stool']],
          special: { cerradura: { x: 16, y: 5, sprite: 'mailbox', label: 'Buzón con candado', open: null }, rincon: { x: 1, y: 1 }, empujable: { x: 4, y: 6, dx: 0, dy: -1 }, escena: { x: 16, y: 4 } },
          listen: { x: 1, y: 3, w: 2, h: 1, a: { x: 1, y: 2, face: 'right' }, b: { x: 2, y: 2, face: 'left' } },
        },
        {
          id: 'callejon_contenedores', weight: 0.3, w: 16, h: 9, floor: 'cobble', wallStyle: 'stone', ambient: 'rgba(24,24,84,0.30)', ch: '_', walls: [], doorX: [3, 10],
          decor: [],
          decals: [{ sprite: 'decal_wheel_h', x: 8, y: 6 }],
          scenery: [{ sprite: 'trash', x: 5, y: 1 }, { sprite: 'trash', x: 6, y: 1 }, { sprite: 'lamp_post', x: 8, y: 2 }, { sprite: 'crate_stack', x: 13, y: 2 }, { sprite: 'crate_stack', x: 14, y: 2 }, { sprite: 'bush', x: 1, y: 7 }, { sprite: 'bush', x: 14, y: 7 }, { sprite: 'wheelbarrow', x: 11, y: 7 }],
          slots: [[3, 3, 'trash'], [9, 3, 'crate'], [2, 5, 'barrel'], [13, 5, 'bench'], [12, 6, 'crate'], [4, 7, 'stool']],
          special: { cerradura: { x: 14, y: 4, sprite: 'mailbox', label: 'Buzón con candado', open: null }, rincon: { x: 1, y: 1 }, empujable: { x: 9, y: 7, dx: 0, dy: -1 }, escena: { x: 3, y: 6 } },
          listen: { x: 1, y: 3, w: 2, h: 1, a: { x: 1, y: 2, face: 'right' }, b: { x: 2, y: 2, face: 'left' } },
        },
        {
          id: 'calle_esquina', weight: 0.2, scene: 'calle', w: 18, h: 10, floor: 'cobble', wallStyle: 'stone', ambient: 'rgba(30,30,70,0.18)', ch: '_', walls: [], doorX: [3, 12],
          decor: [{ sprite: 'window', x: 6, y: 0 }, { sprite: 'window', x: 8, y: 0 }, { sprite: 'menu_board', x: 10, y: 0 }, { sprite: 'poster', x: 14, y: 0 }],
          decals: [{ sprite: 'decal_wheel_h', x: 9, y: 8 }],
          scenery: [{ sprite: 'lamp_post', x: 5, y: 2 }, { sprite: 'lamp_post', x: 14, y: 2 }, { sprite: 'bench', x: 8, y: 2 }, { sprite: 'trash', x: 16, y: 2 }, { sprite: 'mailbox', x: 16, y: 1 }, { sprite: 'bush', x: 1, y: 8 }, { sprite: 'bush', x: 2, y: 8 }, { sprite: 'bush', x: 15, y: 8 }, { sprite: 'bush', x: 16, y: 8 }],
          slots: [[3, 3, 'crate'], [9, 4, 'bench'], [2, 6, 'barrel'], [14, 4, 'trash'], [13, 7, 'crate'], [16, 3, 'stool']],
          special: { cerradura: { x: 16, y: 5, sprite: 'mailbox', label: 'Buzón con candado', open: null }, rincon: { x: 1, y: 1 }, empujable: { x: 5, y: 7, dx: 0, dy: -1 }, escena: { x: 16, y: 4 }, coche: { x: 15, y: 7 } },
          listen: { x: 1, y: 3, w: 2, h: 1, a: { x: 1, y: 2, face: 'right' }, b: { x: 2, y: 2, face: 'left' } },
          crowd: [[11, 3], [12, 3], [11, 7], [12, 7], [14, 6]],
        },
        {
          id: 'calle_plaza', weight: 0.2, scene: 'calle', w: 18, h: 10, floor: 'grass', wallStyle: 'stone', ambient: 'rgba(20,40,40,0.15)', ch: ',', walls: [], doorX: [4, 11],
          decor: [],
          decals: [],
          scenery: [{ sprite: 'lamp_post', x: 5, y: 2 }, { sprite: 'lamp_post', x: 12, y: 2 }, { sprite: 'bench', x: 8, y: 2 }, { sprite: 'bush', x: 15, y: 2 }, { sprite: 'bush', x: 16, y: 2 }, { sprite: 'bush', x: 1, y: 8 }, { sprite: 'bush', x: 3, y: 8 }, { sprite: 'bush', x: 12, y: 8 }, { sprite: 'bush', x: 15, y: 8 }, { sprite: 'plant', x: 16, y: 8 }],
          slots: [[3, 3, 'bench'], [9, 4, 'trash'], [2, 6, 'barrel'], [14, 3, 'crate'], [13, 6, 'bench'], [10, 7, 'stool']],
          special: { cerradura: { x: 16, y: 5, sprite: 'mailbox', label: 'Buzón con candado', open: null }, rincon: { x: 1, y: 2 }, empujable: { x: 4, y: 7, dx: 0, dy: -1 }, escena: { x: 16, y: 4 }, coche: { x: 14, y: 7 } },
          listen: { x: 1, y: 4, w: 2, h: 1, a: { x: 1, y: 3, face: 'right' }, b: { x: 2, y: 3, face: 'left' } },
          crowd: [[6, 3], [7, 3], [11, 3], [12, 7], [14, 5]],
        },
      ],
      taller: [
        {
          id: 'taller_banco', weight: 0.4, w: 14, h: 10, floor: 'lab', ch: '.', walls: [[10, 4]], doorX: [3, 10],
          decor: [{ sprite: 'corkboard', x: 6, y: 0 }, { sprite: 'window_big', x: 8, y: 0 }, { sprite: 'poster', x: 12, y: 0 }],
          decals: [{ sprite: 'decal_shine', x: 9, y: 6 }],
          scenery: [{ sprite: 'lab_table', x: 5, y: 2 }, { sprite: 'lab_table', x: 6, y: 2 }, { sprite: 'files', x: 12, y: 2 }, { sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'locker', x: 12, y: 8 }, { sprite: 'coffee', x: 1, y: 8 }],
          slots: [[2, 4, 'desk'], [8, 3, 'table'], [3, 7, 'crate'], [12, 5, 'drawer'], [12, 7, 'stool'], [9, 8, 'barrel']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 6 }, empujable: { x: 5, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
        {
          id: 'taller_bicis', weight: 0.3, w: 16, h: 9, floor: 'lab', ch: '.', walls: [], doorX: [3, 10],
          decor: [{ sprite: 'corkboard', x: 6, y: 0 }, { sprite: 'window_big', x: 8, y: 0 }, { sprite: 'clock', x: 13, y: 0 }],
          decals: [{ sprite: 'decal_shine', x: 9, y: 5 }, { sprite: 'decal_wheel', x: 5, y: 6 }],
          scenery: [{ sprite: 'lab_table', x: 5, y: 2 }, { sprite: 'lab_table', x: 6, y: 2 }, { sprite: 'lab_table', x: 7, y: 2 }, { sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'locker', x: 14, y: 2 }, { sprite: 'files', x: 13, y: 2 }, { sprite: 'wheelbarrow', x: 14, y: 7 }, { sprite: 'coffee', x: 1, y: 7 }],
          slots: [[2, 4, 'desk'], [9, 3, 'table'], [3, 7, 'crate'], [14, 5, 'drawer'], [11, 7, 'stool'], [12, 4, 'barrel']],
          special: { cerradura: { x: 14, y: 4 }, rincon: { x: 1, y: 5 }, empujable: { x: 9, y: 7, dx: 0, dy: -1 }, escena: { x: 14, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
        {
          id: 'taller_oficina', weight: 0.3, w: 14, h: 10, floor: 'carpet', ch: '.', walls: [[10, 3]], doorX: [3, 10],
          decor: [{ sprite: 'painting', x: 6, y: 0 }, { sprite: 'window', x: 8, y: 0 }, { sprite: 'poster', x: 12, y: 0 }],
          decals: [{ sprite: 'rug_round', x: 7, y: 7, w: 2, h: 2, big: true }],
          scenery: [{ sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'bookshelf', x: 2, y: 2 }, { sprite: 'files', x: 12, y: 2 }, { sprite: 'desk', x: 5, y: 2 }, { sprite: 'coffee', x: 12, y: 8 }, { sprite: 'plant', x: 1, y: 8 }, { sprite: 'sofa', x: 2, y: 8 }],
          slots: [[2, 4, 'desk'], [8, 3, 'table'], [3, 7, 'crate'], [12, 5, 'drawer'], [12, 7, 'stool'], [9, 8, 'barrel']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 6 }, empujable: { x: 5, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
      ],
      // 4F-0b 2/4: 6.ª sala (Despacho del dueño), 3 variantes. SIN USAR todavía (no está en `places`). Misma geometría probada que las del taller (huecos, puertas y rincones ya validados por test_rooms.js), con otro aire: moqueta y madera, estanterías, escritorio del dueño.
      despacho: [
        {
          id: 'despacho_escritorio', weight: 0.4, w: 14, h: 10, floor: 'carpet', ch: '.', walls: [[10, 3]], doorX: [3, 10],
          decor: [{ sprite: 'portrait', x: 6, y: 0 }, { sprite: 'window', x: 8, y: 0 }, { sprite: 'clock', x: 12, y: 0 }],
          decals: [{ sprite: 'rug_round', x: 7, y: 7, w: 2, h: 2, big: true }],
          scenery: [{ sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'bookshelf', x: 2, y: 2 }, { sprite: 'files', x: 12, y: 2 }, { sprite: 'desk_boss', x: 5, y: 2 }, { sprite: 'safe', x: 12, y: 8 }, { sprite: 'plant', x: 1, y: 8 }, { sprite: 'armchair', x: 2, y: 8 }],
          slots: [[2, 4, 'desk'], [8, 3, 'table'], [3, 7, 'chair'], [12, 5, 'drawer'], [12, 7, 'stool'], [9, 8, 'trophy']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 6 }, empujable: { x: 5, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
        {
          id: 'despacho_biblioteca', weight: 0.3, w: 16, h: 9, floor: 'wood', ch: '.', walls: [], doorX: [3, 10],
          decor: [{ sprite: 'painting', x: 6, y: 0 }, { sprite: 'window_night', x: 8, y: 0 }, { sprite: 'clock', x: 13, y: 0 }],
          decals: [{ sprite: 'rug_round', x: 6, y: 5, w: 2, h: 2, big: true }],
          scenery: [{ sprite: 'bookshelf', x: 5, y: 2 }, { sprite: 'bookshelf', x: 6, y: 2 }, { sprite: 'bookshelf', x: 7, y: 2 }, { sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'plant', x: 14, y: 2 }, { sprite: 'files', x: 13, y: 2 }, { sprite: 'globe', x: 14, y: 7 }, { sprite: 'armchair', x: 1, y: 7 }],
          slots: [[2, 4, 'desk'], [9, 3, 'table'], [3, 7, 'chair'], [14, 5, 'drawer'], [11, 7, 'stool'], [12, 4, 'trophy']],
          special: { cerradura: { x: 14, y: 4 }, rincon: { x: 1, y: 5 }, empujable: { x: 9, y: 7, dx: 0, dy: -1 }, escena: { x: 14, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
        {
          id: 'despacho_reservado', weight: 0.3, w: 14, h: 10, floor: 'wood', ambient: 'rgba(15,10,40,0.14)', ch: '.', walls: [[10, 4]], doorX: [3, 10],
          decor: [{ sprite: 'corkboard', x: 6, y: 0 }, { sprite: 'window_night', x: 8, y: 0 }, { sprite: 'portrait', x: 12, y: 0 }],
          decals: [{ sprite: 'decal_shine', x: 9, y: 6 }],
          scenery: [{ sprite: 'desk_boss', x: 5, y: 2 }, { sprite: 'desk', x: 6, y: 2 }, { sprite: 'files', x: 12, y: 2 }, { sprite: 'bookshelf', x: 1, y: 2 }, { sprite: 'safe', x: 12, y: 8 }, { sprite: 'armchair', x: 1, y: 8 }],
          slots: [[2, 4, 'desk'], [8, 3, 'table'], [3, 7, 'chair'], [12, 5, 'drawer'], [12, 7, 'stool'], [9, 8, 'trophy']],
          special: { cerradura: { x: 12, y: 4 }, rincon: { x: 1, y: 6 }, empujable: { x: 5, y: 8, dx: 0, dy: -1 }, escena: { x: 12, y: 6 } },
          listen: { x: 3, y: 3, w: 2, h: 1, a: { x: 3, y: 2, face: 'right' }, b: { x: 4, y: 2, face: 'left' } },
        },
      ],
    },

    // objetos robables y dónde pueden estar (ids de lugares base)
    objects: [
      { id: 'trofeo', name: 'el trofeo dorado', where: ['tienda'] },
      { id: 'receta', name: 'la receta secreta', where: ['cocina', 'almacen'] },
      { id: 'rodillo', name: 'el rodillo de oro', where: ['cocina'] },
      { id: 'hucha', name: 'la hucha del día', where: ['tienda'] },
      { id: 'cuco', name: 'el reloj de cuco', where: ['tienda', 'almacen'] },
      { id: 'libro', name: 'el libro de recetas antiguo', where: ['taller', 'cocina'] },
      { id: 'batidora', name: 'la batidora plateada', where: ['cocina', 'taller'] },
      { id: 'delantal', name: 'el delantal bordado de la abuela', where: ['tienda', 'taller'] },
      { id: 'cartel', name: 'el cartel luminoso', where: ['callejon', 'tienda'] },
      { id: 'bici', name: 'la bicicleta de reparto', where: ['callejon', 'taller'] },
      { id: 'llave', name: 'la llave maestra', where: ['almacen', 'taller'] },
      { id: 'vainilla', name: 'el saco de vainilla', where: ['almacen'] },
    ],

    // cómo sacó el botín (sin pronombres: sirven para objetos masculinos y femeninos)
    methods: [
      { id: 'abrigo', text: 'Salió con el botín escondido bajo el abrigo' },
      { id: 'caja', text: 'Metió el botín en una caja de reparto y lo sacó como un pedido más' },
      { id: 'cesta', text: 'Tapó el botín con un mantel dentro de una cesta de pan' },
      { id: 'ventana', text: 'Sacó el botín por la ventana trasera' },
      { id: 'copia', text: 'Dejó una copia de cartón y se llevó el original' },
      { id: 'carrito', text: 'Escondió el botín en un carrito de la limpieza' },
      { id: 'bolsa', text: 'Disimuló el botín dentro de una bolsa de basura' },
      { id: 'tejado', text: 'Subió el botín al tejado con una cuerda' },
      { id: 'saco', text: 'Metió el botín en un saco de harina' },
    ],

    // por qué lo hizo
    motives: [
      { id: 'deuda', text: 'Necesitaba venderlo para pagar una deuda' },
      { id: 'celos', text: 'Sentía celos del éxito del cliente' },
      { id: 'broma', text: 'Quería gastar una broma que se le fue de las manos' },
      { id: 'herencia', text: 'Estaba convencido de que le pertenecía por herencia' },
      { id: 'regalo', text: 'Quería regalarlo a alguien especial sin pedirlo' },
      { id: 'venganza', text: 'Quería vengarse de un feo del cliente' },
      { id: 'error', text: 'Quería tapar un error que cometió en el trabajo' },
      { id: 'coleccion', text: 'Quería completar su colección secreta' },
      { id: 'chantaje', text: 'Pretendía devolverlo a cambio de dinero' },
    ],

    // qué hace la gente en cada lugar: normal (lo corriente) y secret (algo que da vergüenza contar: motivo de una mentira inocente)
    acts: {
      tienda: {
        normal: ['Ordena las estanterías de la tienda.', 'Atiende a los últimos clientes.', 'Hace cuentas tras el mostrador.', 'Limpia los cristales del escaparate.'],
        secret: ['Se prueba los sombreros del escaparate.', 'Se echa una siesta tras el mostrador.', 'Se zampa el género a escondidas.'],
      },
      cocina: {
        normal: ['Amasa para mañana.', 'Friega bandejas.', 'Prepara la masa del día siguiente.', 'Revisa la temperatura de los hornos.'],
        secret: ['Se zampa un bizcocho entero a escondidas.', 'Ensaya un baile con una cuchara de madera.', 'Llama a escondidas por teléfono a su pretendiente.'],
      },
      almacen: {
        normal: ['Cuenta sacos de harina.', 'Coloca cajas en las estanterías.', 'Revisa los albaranes.', 'Barre el almacén.'],
        secret: ['Echa una cabezada entre los sacos.', 'Lee una novela de misterio tras las cajas.', 'Busca el dulce que escondió el mes pasado.'],
      },
      callejon: {
        normal: ['Saca la basura.', 'Toma el aire junto a los contenedores.', 'Reparte los últimos pedidos.', 'Barre la puerta trasera.'],
        secret: ['Da de comer a escondidas a un gato callejero.', 'Ensaya un discurso en voz alta.', 'Practica pasos de baile sin que nadie lo vea.'],
      },
      taller: {
        normal: ['Afila los cuchillos.', 'Repara una bandeja abollada.', 'Engrasa la amasadora.', 'Ordena las herramientas.'],
        secret: ['Fabrica un regalo sorpresa en secreto.', 'Se echa una partida de cartas a solas.', 'Prueba la bicicleta de reparto dando vueltas.'],
      },
      despacho: { // 4F-0b 2/4 (en reserva)
        normal: ['Revisa las cuentas del dueño.', 'Ordena los papeles del escritorio.', 'Archiva facturas en la carpeta de siempre.', 'Riega la planta del despacho.'],
        secret: ['Se sienta en el sillón del dueño y ensaya su cara de jefe.', 'Se zampa los caramelos del cajón del dueño.', 'Lee el diario del dueño. Solo las partes buenas.'],
      },
    },
    theft: 'Se lleva {obj} sin que nadie lo note.',
    discover: 'Vuelve {to} y descubre que ha desaparecido {obj}.',
    hide: 'Esconde el botín {where}.',
    // 4A: objetos que solo se guardan en un lugar (los usa la forma «objeto_imposible»)
    impossible: {
      tienda: ['la llave del cajón del mostrador', 'el sello de «Pagado» de la caja'],
      cocina: ['la cuchara de madera de la abuela', 'el termómetro del horno grande'],
      almacen: ['el sello de los albaranes', 'la llave de la cámara de la harina'],
      callejon: ['la llave de la puerta trasera', 'el candado del contenedor'],
      taller: ['el cincel dorado de la abuela', 'la llave inglesa de las reparaciones'],
      despacho: ['el sello del dueño', 'la llave de la caja fuerte del despacho'],
    },
    hideAt: { tienda: 'bajo el mostrador', cocina: 'detrás de los hornos', almacen: 'entre las estanterías', callejon: 'tras los contenedores', taller: 'bajo el banco de trabajo', despacho: 'tras el cuadro del dueño' },

    // ---- textos de las pistas y mentiras (3C). Marcadores: {who} nombre del personaje, {wit} el que cuenta algo, {obj} objeto con artículo,
    // {loc} «la cocina», {to} «a la cocina», {pname} «Cocina», {time} «22:35», {where} rincón del escondite, {doing} lo que hacía (en minúscula, sin punto), {desde}/{hasta} horas de una coartada.
    // Evitar «de {loc}» y «a {obj}» (saldría «de el»): usar {pname} o frases con «donde estaba {obj}».
    clueTpl: {
      trace: [ // prueba en el lugar del robo (kind físico/documento/grabación)
        { title: 'Foto de la cámara', kind: 'grabación', text: 'Foto con hora de la cámara de seguridad ({pname}): a las {time} se ve a {who} justo donde estaba {obj}.' },
        { title: 'Huella con glaseado', kind: 'física', text: 'Una huella de zapato manchada de glaseado, justo donde estaba {obj}. Es del número de {who}.' },
        { title: 'Pañuelo con iniciales', kind: 'física', text: 'Un pañuelo con las iniciales de {who}, tirado en {loc} donde estaba {obj}.' },
        { title: 'Cuaderno de visitas', kind: 'documento', text: 'En el cuaderno de {pname}, a las {time}, alguien anotó «{who} pasó por aquí». Justo cuando desapareció {obj}.' },
      ],
      hide: [ // prueba en el escondite del botín
        { title: 'Guante en el escondite', kind: 'física', text: 'Un guante de {who} {where}, con polvo dorado en los dedos.' },
        { title: 'Nota de entrega', kind: 'documento', text: 'Una nota con la letra de {who}: «Guardado {where}. Que nadie lo toque».' },
        { title: 'Foto del escondite', kind: 'grabación', text: 'Foto con hora de la cámara de {pname}: se ve a {who} dejando algo {where}.' },
      ],
      seenBefore: { title: 'Lo que vio {wit}', text: '{wit} vio a {who} merodeando en {loc} poco antes de que desapareciera {obj}.' },
      seenAfter: { title: 'Lo que vio {wit}', text: 'Al llegar {to}, {wit} vio a {who} a punto de marcharse con mucha prisa. Poco después faltaba {obj}.' },
      method: { // cómo sacó el botín (una por método de D.methods; sirve también de señuelo con otro {who})
        abrigo: { title: 'Abrigo con restos', kind: 'física', text: 'El abrigo de {who} tiene manchas de glaseado en el forro, como si hubiera llevado algo escondido.' },
        caja: { title: 'Pedido sospechoso', kind: 'documento', text: 'Un albarán de reparto a nombre de {who}: una caja que nadie encargó, salida a deshora.' },
        cesta: { title: 'Cesta con mantel', kind: 'física', text: 'Una cesta de pan de {who} con un mantel que tapa algo grande. Pesa demasiado.' },
        ventana: { title: 'Ventana forzada', kind: 'física', text: 'La ventana trasera está entreabierta y en el alféizar hay una huella con la talla de {who}.' },
        copia: { title: 'Copia de cartón', kind: 'física', text: 'Una copia de cartón recortada con las tijeras de {who}. Alguien cambió el original.' },
        carrito: { title: 'Carrito de limpieza', kind: 'física', text: 'El carrito de la limpieza tiene huellas de harina y un pañuelo de {who} en el asa.' },
        bolsa: { title: 'Bolsa de basura', kind: 'física', text: 'Una bolsa de basura que huele a glaseado fresco. En la etiqueta, la firma de {who}.' },
        tejado: { title: 'Cuerda en el tejado', kind: 'física', text: 'Una cuerda atada en el tejado con el nudo marinero que solo sabe hacer {who}.' },
        saco: { title: 'Saco de harina pesado', kind: 'física', text: 'Un saco de harina que pesa más de la cuenta. Lleva el sello de {who}.' },
      },
      motive: { // por qué lo hizo (una por móvil de D.motives)
        deuda: { title: 'Carta de un acreedor', kind: 'documento', text: 'Una carta que reclama a {who} el pago de una deuda antes del viernes.' },
        celos: { title: 'Diario amargo', kind: 'documento', text: 'Un diario de {who} con páginas enteras sobre lo mucho que le amarga el éxito del cliente.' },
        broma: { title: 'Lista de bromas', kind: 'documento', text: 'Una lista de {who} titulada «Bromas de la semana». La última está marcada con un «¡Ya!».' },
        herencia: { title: 'Papel amarillento', kind: 'documento', text: 'Un papel viejo que guardaba {who}: «Todo esto era de mi familia».' },
        regalo: { title: 'Papel de regalo', kind: 'física', text: 'Papel de regalo y un lazo a medio cortar, con una dedicatoria de {who}.' },
        venganza: { title: 'Lista de agravios', kind: 'documento', text: 'Una lista de {who} con los feos que le hizo el cliente. El último está subrayado tres veces.' },
        error: { title: 'Informe con error', kind: 'documento', text: 'Un informe de trabajo con un error enorme. {who} lo tenía arrugado en un bolsillo.' },
        coleccion: { title: 'Álbum con un hueco', kind: 'física', text: 'Un álbum de {who} con un hueco vacío del tamaño exacto de lo robado.' },
        chantaje: { title: 'Borrador de rescate', kind: 'documento', text: 'Un borrador de nota de {who}: «Si quieres recuperarlo, trae dinero».' },
      },
      clear: { // descarte: sitúa al inocente en otro lugar durante la ventana
        grabación: { title: 'Foto de la cámara', text: 'Foto con hora de la cámara de seguridad ({pname}): a las {time} se ve a {who} en {loc}: {doing}.' },
        documento: { title: 'Albarán sellado', text: 'Un albarán sellado en {pname} a las {time}. Anotación al margen: «{who}: {doing}».' },
        testimonio: { title: 'Lo que vio {wit}', text: '{wit} jura que {who} estuvo en {loc} todo ese rato: {doing}.' },
      },
      traces: [ // refutación de la mentira de un inocente: rastros de lo que de verdad hacía
        { title: 'Rastros delatores', kind: 'física', text: 'En {loc} quedan pruebas de lo que hacía {who} (y no era lo que dijo): {doing}.' },
        { title: 'Papel arrugado', kind: 'documento', text: 'Un papel arrugado en {pname}: «{who}: {doing}». Con la hora de esa noche.' },
      ],
      tracesLoose: [ // como traces, pero SIN decir dónde está (se usan si la sala del rastro está llena y el objeto acaba en otra sala)
        { title: 'Papel arrugado', kind: 'documento', text: 'Un papel arrugado: «{who}: {doing}». Con la hora de esa noche.' },
        { title: 'Nota olvidada', kind: 'documento', text: 'Una nota olvidada: «{who} — {doing}». Lleva la hora de esa noche.' },
      ],
      tracesGrab: [ // c4-3 2/4 (decisión B, GEN_VERSION >= 7, APAGADO): refutación de la mentira de un inocente que se entrega como CHARLA GRABADA real, de tono SOSPECHOSO (el mismo título que el descarte «Foto de la cámara», para no delatarse). Variables como `clear.grabación`.
        { title: 'Foto de la cámara', kind: 'grabación', text: 'Foto con hora de la cámara de {pname}: a las {time} se ve a {who} en {loc}, y no donde había dicho estar: {doing}.' },
      ],
      falsa: [ // pista falsa genérica contra un inocente
        { title: 'Guante olvidado', kind: 'física', text: 'Un guante de {who} tirado en {loc}. Qué casualidad.' },
        { title: 'Nota urgente', kind: 'documento', text: 'Una nota de {who}: «Tengo que hablar con alguien. Es urgente». Estaba en {loc}.' },
      ],
      // ---- 4A: pruebas de las formas nuevas de captura (G.CAPTURE_FORMS)
      desliz: [ // confesión indirecta: {wit} estaba donde el culpable y le oyó decir lo que solo sabría el ladrón ({where}: el escondite)
        { title: 'Lo que se le escapó a {who}', text: '{wit} oyó a {who} decir que {obj} acabaría {where}. Y así fue.' },
        { title: 'Un comentario de más', text: '{wit} oyó a {who} murmurar que {obj} estaría mejor {where}. Justo donde acabó.' },
        { title: 'Una profecía sospechosa', text: '{wit} oyó a {who} presumir de saber dónde iría a parar {obj}: {where}.' },
      ],
      ausente: [ // testigos cruzados: {wit} estuvo donde el culpable dice haber estado (en {loc}) y no lo vio
        { title: 'Lo que no vio {wit}', text: '{wit} estuvo en {loc} de {desde} a {hasta} y no vio a {who} por ninguna parte, aunque {who} jura que estaba allí.' },
        { title: 'Una silla vacía', text: 'Según {wit}, que estuvo en {loc} de {desde} a {hasta}, {who} nunca apareció por allí. Y {who} dice lo contrario.' },
      ],
      imposible: [ // objeto imposible: aparece en el escondite algo que solo se guarda en el lugar del robo ({Item}/{item} con artículo, {wloc} = «la tienda»)
        { title: 'Un objeto fuera de sitio', kind: 'física', text: 'Una bolsa de {who} {where} con {item} dentro. Solo se guarda en {wloc}, y nadie lo había sacado nunca.' },
        { title: 'Lo que no debería estar aquí', kind: 'física', text: '{Item} apareció {where}, envuelto en un pañuelo de {who}. Su sitio es {wloc}.' },
      ],
      decoyRumor: [ // pista falsa de un sospechoso engañoso cuando no hay hueco para un objeto: suena a culpable
        '{wit} cuenta que {who} no paraba de preguntar por {obj} y de mirar el reloj.',
        '{wit} jura que {who} llevaba toda la noche cuchicheando y escondiendo algo bajo la chaqueta.',
        '{wit} asegura que {who} se quedó sin color en cuanto se mencionó {obj}.',
      ],
      // ---- 4C-4c-1: MATIZ de las pistas de objeto en los ambientes inquietante y macabro. Pares [susto, remate] que se PEGAN al final del texto de la pista (el hecho no cambia).
      // Valen para cualquier objeto: sin género ni número del objeto, sin lugares ni personajes del caso, sin «de el». Por ambiente y por tipo de pista (física · documento · grabación).
      // Humor negro adulto: el remate va SIEMPRE justo después del susto y nada es gráfico. Si se tocan, sube G.GEN_VERSION.
      matiz: {
        inquietante: {
          fisica: [
            ['Al acercarse, la temperatura baja un poquito.', 'Será la corriente, que lleva toda la noche con ganas de protagonismo.'],
            ['Cuesta quitarse la sensación de que algo lo vigila.', 'Seguro que es el propio objeto. Tiene cara de cotilla.'],
            ['Detrás se oye un crujido suave y nadie se ha movido.', 'Las casas también tienen derecho a crujir. Esta es muy expresiva.'],
            ['Una polilla gira a su alrededor, muy despacio, como si lo custodiara.', 'Nunca se ha visto una polilla con tanto sentido del deber.'],
            ['Por un momento parece que algo ha cambiado de sitio.', 'No lo ha hecho. Casi seguro. Anótelo como «casi».'],
            ['Huele a algo que nadie ha cocinado.', 'Hoy, se entiende. Lo de ayer es otro asunto.'],
            ['El silencio de alrededor es un poco demasiado educado.', 'Cuando una sala se calla así, suele estar guardando una opinión.'],
            ['Se oye un tic-tac donde no hay ningún reloj.', 'Será una tubería. Las tuberías hacen tic-tac los martes.'],
          ],
          documento: [
            ['En un rincón, alguien ha dibujado un ojo con bolígrafo.', 'Seguro que es una firma. Una firma que mira.'],
            ['La tinta parece húmeda, aunque lleva horas ahí.', 'Debe de ser buena tinta. O mala compañía.'],
            ['Una línea está tachada con tanta fuerza que ha roto el papel.', 'A alguien le fastidió mucho escribirlo. Los lunes también nos fastidian.'],
            ['Al pasar la mano por encima, el papel está templado.', 'Lo habrán dejado en el radiador. O junto a alguien con fiebre. Lo primero es más cómodo.'],
            ['Abajo, en letra diminuta, pone «no lo leas de noche».', 'Es de noche. Pero ya está leído, así que sigamos.'],
            ['Hay una mancha redonda que podría ser de café o de algo con peor reputación.', 'Se decide por el café. Es lo más sano.'],
            ['Las hojas huelen a humedad de rincón olvidado.', 'Los rincones olvidados también tienen su orgullo.'],
            ['Una palabra está subrayada tantas veces que se ha hecho un agujero.', 'Eso es compromiso con el subrayado. Y quizá con otra cosa.'],
          ],
          grabacion: [
            ['En una esquina de la imagen hay una sombra que no sale en las demás.', 'Un defecto de la cámara. Las cámaras también tienen sus manías.'],
            ['Al ampliarla, a lo lejos parece haber alguien mirando a cámara.', 'Una cámara que mira a otra cámara. Muy de gremio.'],
            ['La imagen tiembla un instante, como si alguien se hubiera asomado.', 'Una mosca. Por algo se llaman «moscas de cámara».'],
            ['Hay un reflejo que no pertenece a nada de lo que se ve.', 'Será la lente. O un fantasma con prisa. La lente sale más barata.'],
            ['El sello de la hora parpadea justo en el momento más tenso.', 'Es de esas cámaras con mucho sentido dramático.'],
            ['Se oye un zumbido grave si se mira fijamente.', 'Es la pantalla. O los nervios. Ambas cosas se arreglan con un café.'],
            ['En el borde de la imagen hay una mancha con forma de mano.', 'Una mancha, nada más. Eso sí, muy colaboradora.'],
            ['Cada vez que se mira, la imagen parece un poco más oscura.', 'Será la vista cansada. Y el caso, que también cansa.'],
          ],
        },
        macabro: {
          fisica: [
            ['Está más frío de lo que debería, como si hubiera pasado la noche en una cámara frigorífica.', 'O es muy mala calefacción, que también es un crimen.'],
            ['Alrededor flota un olor dulzón que nadie quiere identificar.', 'Seguro que es mermelada. Se llama así para que nadie haga preguntas.'],
            ['Detrás de la pared se oye un arañazo suave, con ritmo, como de quien tiene todo el tiempo del mundo.', 'Serán ratones. Los ratones también tienen aficiones, y esta parece el teatro.'],
            ['Se tiene la sensación de que lleva ahí más tiempo que cualquiera de los presentes y de que seguirá cuando todos se vayan.', 'Como los buenos fantasmas y los malos contratos de alquiler.'],
            ['Al tocarlo se oye, clarísima, una risita de alguien que no está.', 'Será la cañería. Una cañería con muchísimo sentido del humor.'],
            ['Una sombra se detiene encima un segundo y se va sin saludar.', 'Educación de sombra: no saludan, pero tampoco molestan.'],
            ['Cuesta mirarlo mucho rato sin que se te erice algo que ni sabías que tenías.', 'Es la nuca, que tiene opinión propia sobre los casos.'],
            ['Se nota una presencia a la espalda, silenciosa y muy interesada.', 'Será Oli, que no entiende el espacio personal. Y si no es Oli, mejor no girarse.'],
          ],
          documento: [
            ['Entre las líneas, con otra letra, alguien ha escrito «sigue mirando».', 'Es un buen consejo para detectives. Mala forma de darlo.'],
            ['Una esquina del papel está chamuscada con forma de mano pequeña.', 'Una mano muy entregada a su trabajo. Pidan referencias, pero no a ella.'],
            ['Al dorso hay una lista de nombres y el último está sin acabar.', 'Será la lista de invitados. Una fiesta con muy mala salida.'],
            ['El papel está pegajoso de algo rojo que huele a fruta.', 'Mermelada, por supuesto. De las que no se olvidan.'],
            ['Hay una fecha rodeada de rojo, a pocos días vista.', 'Una fecha de entrega, seguro. A la entrega, ya se sabe, se la espera con ansia.'],
            ['La tinta de una frase se ha corrido como si la hubieran escrito llorando.', 'O con un bolígrafo mojado. Los profesionales no siempre pueden elegir.'],
            ['Se oye un susurro al acercar la oreja, y no es el papel.', 'Es el pasillo, que opina. El pasillo siempre opina.'],
            ['Alguien ha pasado un dedo por encima y ha dejado una marca limpia, justo donde terminaba la verdad.', 'Un dedo con mucho sentido de la escena.'],
          ],
          grabacion: [
            ['En la imagen, un reflejo del cristal sonríe un poco más que quien lo proyecta.', 'Los reflejos siempre fueron más extrovertidos.'],
            ['La imagen se queda congelada medio segundo con algo muy cerca del objetivo.', 'Una polilla enorme. Con dientes, seguramente, pero polilla.'],
            ['Al fondo se ve una silueta quieta, de pie, sin parpadear.', 'Un perchero. Un perchero con muchísima presencia.'],
            ['La hora de la cámara cambia dos veces mientras se mira.', 'Será que la cámara es sensible. Como todos los testigos.'],
            ['Hay marcas de dedos en el cristal del objetivo, por dentro.', 'Será la limpieza. Se hace desde dentro cuando el personal está comprometido.'],
            ['Al ampliar un rincón aparece una cara que no estaba al principio.', 'Una pareidolia. Se llama así para no tener que llamarlo «cara».'],
            ['La imagen tiene un grano raro, como si alguien respirara sobre la lente.', 'Aliento a menta, por cierto. Alguien se cuida.'],
            ['Cada vez que se parpadea, la silueta del fondo está un poco más cerca.', 'Dejen de parpadear. Es lo único que se puede hacer. Eso o mudarse.'],
          ],
        },
      },
      rumor: '{wit} cuenta que {who} andaba muy raro esa noche y hasta preguntó por {obj}.',
      said: 'Estuve en {loc} de {desde} a {hasta}, sin moverme.',
      truthCulprit: 'En realidad estaba en {loc}: se llevó {obj}.',
      truthLiar: 'En realidad estaba en {loc}: {doing}.',
    },
  };

  // ---- plantillas del compilador (3D-1, ampliadas en 4B parte 2). Sección independiente: NO afecta a genTruth/genClues (no hay que subir GEN_VERSION al tocarla,
  // pero sí cambia el def compilado). Marcadores: {obj} objeto con artículo, {Obj} igual con mayúscula inicial, {cli} cliente, {who} personaje, {other} otro sospechoso,
  // {x1} lo que de verdad hacía en pasado y en primera persona («me zampaba un bizcocho…»), {X1} igual con mayúscula. Los textos NO llevan adjetivos con género (cualquier nombre puede decirlos).
  G.GEN_DATA.compile = {
    clientLevel: 2,
    // ---- TONOS (4B-2): cada caso tiene el suyo. Cambia título, sinopsis, voz del cliente, una coletilla en el saludo, un TEMA de charla con su gag y el cierre del epílogo.
    tones: [
      { id: 'noir', name: 'Cine negro',
        titles: ['Sombras sobre {obj}', 'La noche tenía {obj} y yo no', 'Cuando cae la harina, cae {obj}', 'Todo por {obj}', 'Lluvia sobre la masa: {obj}', 'El caso de {obj}, en blanco y negro', 'Nadie sabe nada de {obj}', '{cli} y la sombra de {obj}'],
        blurbs: ['{cli} entra en el despacho chorreando: anoche desapareció {obj}. Hay {n} sospechosos y todos huelen a mentira recién horneada.', 'Llueve, es de noche y falta {obj}. {cli} quiere respuestas. Entre {n} sospechosos, alguien sabe más de lo que cuenta.', 'En esta ciudad nadie se fía de nadie, y menos hoy: {obj} ha desaparecido. {n} sospechosos, una sola verdad.'],
        tag: '(Fuera llueve. Siempre llueve.)', gagLabel: '¿Qué tal la noche?',
        gag: ['Llovía. Siempre llueve cuando alguien miente.', 'Yo no vi nada, pero lo vi muy de cerca.', 'Esta ciudad se come a los honrados. Y a las magdalenas.', 'Tengo un mal presentimiento. Y migas en el bolsillo.', 'Pregúntele a la lluvia. Es la única que no miente.'],
        cFirst: ['Soy {who}. Me han quitado {obj}. Llueve, y no solo en la calle.', 'Me llamo {who}. Desapareció {obj} y con él, mi paz. Ayúdenme.'],
        cTell: ['Anoche desapareció {obj}. Estaba en {loc}. Ahora no está. Así empiezan los peores días.', 'Estaba en {loc} y ya no está. En esta ciudad las cosas no se pierden: se las llevan.'],
        win: 'Y siguió lloviendo. Caso cerrado.' },
      { id: 'telenovela', name: 'Telenovela',
        titles: ['Pasión y traición: {obj}', 'Lágrimas por {obj}', 'Mi amor, ¿dónde está {obj}?', 'El secreto de {obj}', 'Rivales por {obj}', 'Juré que nunca hablaría de {obj}', 'Cuando el destino se llevó {obj}', '{cli}, {obj} y un pasado oscuro'],
        blurbs: ['{cli} irrumpe entre sollozos: ¡ha desaparecido {obj}! Entre {n} sospechosos hay secretos, miradas y, seguro, un hermano gemelo.', 'Ha desaparecido {obj} y {cli} no puede más. {n} sospechosos y todos tienen algo que ocultar... además de su coartada.', 'Amores, celos y {obj} desaparecido. {cli} exige la verdad. Habrá que interrogar a {n} personas sin que nadie se desmaye.'],
        tag: '(se lleva la mano al pecho)', gagLabel: '¿Cómo lleva la noche?',
        gag: ['¡Ay! ¡Eso me recuerda a cuando mi primo perdió el sombrero!', 'No puedo hablar de esto sin que me tiemblen las manos... ni las cejas.', 'Hay cosas que solo se dicen mirando por la ventana. (mira por la ventana)', 'Todo esto es culpa del destino. Y de alguien más, claro.', '¡Y esperen a saber quién es en realidad mi madre!'],
        cFirst: ['¡Soy {who}! ¡Me han arrebatado {obj}! ¡Ayúdenme!', 'Me llamo {who} y mi corazón está roto: ¡ha desaparecido {obj}!'],
        cTell: ['¡Anoche desapareció {obj}! Estaba en {loc}, ¡y ahora solo queda el vacío!', 'Estaba en {loc}... ¡y alguien se lo ha llevado! ¡Alguien con el corazón de piedra!'],
        win: 'Y así acaba el capítulo. ¡Mañana, más!' },
      { id: 'documental', name: 'Documental de naturaleza',
        titles: ['Vida salvaje: el misterio de {obj}', 'En busca de {obj}', 'Planeta Miga: {obj}', 'La extraña costumbre de llevarse {obj}', 'Así desaparece {obj}', 'Sabana, harina y {obj}', 'Diario de un robo: {obj}', '{cli} ante el misterio de {obj}'],
        blurbs: ['En la selva de la panadería, {cli} descubre que ha desaparecido {obj}. {n} sospechosos, un solo depredador.', 'Cada noche, la panadería duerme. Pero esta, alguien se llevó {obj}. {cli} sigue el rastro entre {n} sospechosos.', 'Observamos a {cli}, que acaba de notar que falta {obj}. A su alrededor, {n} especies de sospechoso, todas con coartada.'],
        tag: '(mira a cámara)', gagLabel: '¿Algo que decir a cámara?',
        gag: ['(a cámara) Perdone, ¿esto sale en la tele?', 'Observen cómo el sospechoso evita la pregunta: es su hábitat natural.', 'Yo solo vengo a pastar... digo, a trabajar.', 'En mi especie la coartada se hereda.', 'Hablen bajito, que se asustan.'],
        cFirst: ['(a cámara) Soy {who}. Y acaban de quitarme {obj}.', 'Soy {who}. Perdón, ¿ya estamos grabando? Me han quitado {obj}.'],
        cTell: ['Anoche desapareció {obj}. Estaba en {loc} tan tranquilo, en su hábitat. Y ahora, nada.', 'Estaba en {loc}. Alguien lo ha cazado. Sin permiso, además.'],
        win: 'Y así, otro misterio vuelve a su ecosistema. Fin del documental.' },
      { id: 'western', name: 'Western',
        titles: ['Duelo al amanecer por {obj}', 'La ley del horno y {obj}', 'Forajidos de panadería: {obj}', 'Mediodía en el horno: {obj}', 'Esta panadería es muy pequeña para {obj}', 'Se busca quien se llevó {obj}', 'Por un puñado de migas y {obj}', '{cli} contra el resto del pueblo: {obj}'],
        blurbs: ['{cli} entra en la panadería de golpe, escupe migas y dice: ha desaparecido {obj}. Hay {n} sospechosos y en este pueblo todo se arregla a charlas.', 'Alguien se ha llevado {obj} al amparo de la noche. {cli} quiere justicia. {n} sospechosos y un solo horno.', 'Un pueblo, {n} sospechosos y {obj} a la fuga. {cli} exige un detective con buen oído.'],
        tag: '(se ajusta el sombrero imaginario)', gagLabel: '¿Cómo va el pueblo?',
        gag: ['Este pueblo es muy pequeño para dos panaderos.', 'En estas tierras la masa madre manda.', 'Yo nunca desenfundo antes del desayuno.', 'Se oye un silbido de viento. Es el horno. Siempre es el horno.', 'Forastero, aquí hasta el pan duro tiene memoria.'],
        cFirst: ['Me llaman {who}. Alguien se ha llevado {obj}. Y eso no se perdona.', '{who}. Han robado {obj} en mi propio pueblo. Que Dios los coja confesados.'],
        cTell: ['Anoche, al caer el sol, desapareció {obj}. Estaba en {loc}. Ahora, el viento.', 'Estaba en {loc} a la hora del ocaso. Ahora solo queda polvo. Y una miga.'],
        win: 'Y el sol se puso sobre la panadería. Justicia hecha.' },
      { id: 'espias', name: 'Espías',
        titles: ['Operación: recuperar {obj}', 'Expediente Miga: {obj}', 'Alto secreto: {obj}', 'Agente doble, pan doble: {obj}', 'Código harina: {obj}', 'El topo y {obj}', 'Cuenta atrás para {obj}', '{cli} necesita un agente: {obj}'],
        blurbs: ['{cli} pide ayuda en clave: ha desaparecido {obj}. Entre {n} sospechosos hay un topo, un confidente y alguien que solo quería un café.', 'Misión: recuperar {obj}. {cli} ya ha hablado demasiado. {n} sospechosos, ninguno es quien dice ser.', 'El expediente cinco, el de {obj}, ha quedado vacío. {cli} sospecha de {n} personas. Todas parecen inocentes. Eso es lo sospechoso.'],
        tag: '(baja la voz)', gagLabel: '¿Algo que informar?',
        gag: ['La contraseña es «el pan no tiene prisa». Ahora diga usted la suya.', 'No puedo confirmarlo ni desmentirlo. Y me han mandado callar.', 'Esta conversación se autodestruirá... en cuanto me coma la prueba.', 'Todos aquí somos agentes dobles. Yo, triple, pero con descuento.', 'Si me pasa algo, busque bajo el mostrador. No sé qué hay, pero busque.'],
        cFirst: ['Soy {who}. Agente, escuche: han sustraído {obj}. Pero no lo diga alto.', 'Mi nombre en clave es {who}. Mi problema: {obj}.'],
        cTell: ['Anoche se esfumó {obj}. Estaba en {loc}. Nadie ha visto nada. Eso lo hace aún más sospechoso.', 'Estaba en {loc} y desapareció sin dejar rastro. Casi sin dejar rastro.'],
        win: 'Misión cumplida. Este informe se autodestruirá en cinco, cuatro... bueno, ya está.' },
      { id: 'cuento', name: 'Cuento de hadas',
        titles: ['Érase una vez {obj}', 'El reino de las migas y {obj}', 'La leyenda de {obj}', 'Y vivieron felices, pero sin {obj}', 'El misterio del horno encantado: {obj}', 'Había una vez un robo: {obj}', 'Tres deseos y {obj}', 'La fábula de {obj}'],
        blurbs: ['Érase una vez {cli}, a quien una noche le desapareció {obj}. Había {n} sospechosos... y todos tenían una excusa mágica.', 'En un reino de masa y harina, {obj} se esfumó. {cli} pide ayuda a los detectives. {n} sospechosos, un hechizo y muchas migas.', 'Cuentan que {obj} desapareció una noche sin luna. {cli} sospecha de {n} personajes. ¡Habrá que descubrir al malvado!'],
        tag: '(sonríe como en un libro ilustrado)', gagLabel: '¿Cuenta algo?',
        gag: ['Eso pasó hace mucho, mucho tiempo... el martes.', 'Y la moraleja es: nunca dejes la masa sola.', 'Esto ya me lo contó un pájaro. Un gorrión muy cotilla.', 'Había una vez una excusa... y era muy mala.', 'Cuéntelo despacito, que me gusta saborearlo.'],
        cFirst: ['Soy {who}. Una noche me desapareció {obj}. Les ruego que me ayuden.', 'Me llamo {who}, y me han robado {obj}. ¡Necesito héroes!'],
        cTell: ['Una noche sin luna desapareció {obj}. Estaba en {loc}. ¡Ahora no está!', 'Estaba en {loc}, sano y salvo. Y de pronto, ¡puf!'],
        win: 'Y colorín colorado, este caso se ha acabado.' },
    ],
    // ---- VOZ por rasgo (4B-2). first: saludo · chat: charla (en orden) · press: presionar · pressHard: presionar con la presión alta ·
    // deny: reacción a una prueba que no les afecta · admit: desmontan su mentira ({x1}) · decoy: explican por qué parecían culpables ({x1}) · confess: el culpable ante una prueba
    // work / cli / oth: tres temas de charla de relleno (trabajo, el cliente, otros sospechosos)
    voice: {
      nervioso: {
        first: ['Ay, hola, soy {who}. Perdone, me tiemblan las manos hoy.', '¡Hola! Soy {who}. No me ponga nervioso... digo, ¡no lo estoy!', 'S-soy {who}. Pregunte, pregunte, pero con cariño.'],
        chat: ['Uf, qué nervios, no paro quieto.', 'Perdone, se me cae todo hoy.', 'Llevo tres cafés... y ni siquiera eran míos.', 'Si me mira fijamente se me olvida hasta mi nombre.', 'Cuando me pongo así, amaso el doble de rápido.', 'Me da cosa hasta respirar fuerte, por si molesta.'],
        press: ['Ya se lo he dicho, ¿qué más quiere de mí?', '¡Ay, ay, ay! ¿Por qué me mira así?', 'No me presione, que me tiembla hasta el delantal.'],
        pressHard: ['¡Basta, basta! ¡Se me va a caer el delantal de los nervios!', '¡Yo solo quería un día tranquilo! ¡Uno!'],
        deny: ['¿Eso? ¡No me suena de nada!', 'Yo no tengo nada que ver, ¡se lo juro por mi delantal!', 'Nunca he visto eso en mi vida... creo.'],
        admit: ['Vale, vale, tienen razón: no estuve donde dije. Es que {x1}. ¡Qué vergüenza!', '¡Me han pillado! Lo cierto es que {x1}. Por favor, no se lo cuenten a nadie.', 'Está bien... {X1}. No quería que nadie lo supiera.'],
        decoy: ['¡No es lo que parece! Lo que pasa es que {x1}. ¡Por eso estaba tan raro!', 'Ya sé que parece sospechoso, pero es que {x1}. Se lo juro.', 'Todo tiene explicación: {x1}. Sí, ya sé que suena fatal.'],
        confess: ['¡Ay, no! ¡Fui yo! ¡Pero no quería! O sí. ¡No lo sé!', 'Vale, vale, lo hice yo. Me ha dado un vuelco el corazón.', 'Me rindo. Fui yo. ¿Me dan un vaso de agua?'],
        work: ['Se trabaja bien, salvo cuando algo se quema. O se cae. O ambas.', 'Aquí hay mucho ajetreo; yo vivo al borde del susto.', 'Me encanta el trabajo, pero no tanto las noches raras como esta.'],
        cli: ['De {cli} lo que más me pone los pelos de punta es lo mucho que se tranquiliza.', 'Con {cli} procuro no hablar mucho: me atasco con las palabras.', 'Pobre {cli}, con lo que ha pasado. Yo en su lugar ya habría salido corriendo.'],
        oth: ['{other} es buena gente, pero hace unos ruidos al comer...', 'De {other} no sé qué decir sin ponerme rojo.', '{other} siempre me pregunta cosas que no sé contestar.'],
      },
      soberbio: {
        first: ['Soy {who}. Espero que no me haga perder el tiempo.', '{who}, a su servicio... bueno, más bien usted al mío.', 'Ah, los detectives. Soy {who}, ya me conocerán de algo.'],
        chat: ['Mi trabajo aquí es, digamos, insustituible.', 'Yo siempre lo hago todo bien.', 'Sin mí esto sería una churrería... con perdón.', 'Mis bizcochos han salido en dos periódicos. Uno era de hace años, pero salieron.', 'No es que sea lo mejor de aquí. Es que los demás dejan el listón en el suelo.', 'Hay quien nace con estrella. Yo nací con delantal de seda.'],
        press: ['¿Me está acusando? ¡A mí!', '¿Sabe con quién habla? Con alguien con muchísima paciencia.', 'Qué falta de respeto. Dígaselo a mi abogado: no tengo, pero lo contrataré.'],
        pressHard: ['¡Esto es un ultraje! ¡Un ultraje con glaseado!', '¡Retire eso ahora mismo o me llevo mi talento a otra panadería!'],
        deny: ['Eso no tiene nada que ver conmigo. Yo estoy por encima.', 'Ridículo. Si hubiera hecho algo, lo habría hecho mejor.', 'Qué ocurrencia. Ni me suena ni me interesa.'],
        admit: ['Está bien. Es que {x1}. Y sí, también se me da de maravilla.', 'De acuerdo, no estuve donde dije: {x1}. Pero que conste que se me da de maravilla.', 'Bah. {X1}. ¿Y qué? Hasta los genios tienen aficiones.'],
        decoy: ['Lo que ve es un malentendido. Lo cierto es que {x1}, y lo hago con una elegancia que usted no entendería.', 'Naturalmente tiene explicación: {x1}. Y no pienso pedir perdón.', 'Es muy sencillo: {x1}. Cualquiera con talento lo habría entendido a la primera.'],
        confess: ['Vaya. Me han descubierto. Admito que fue una obra maestra... con un pequeño fallo.', 'De acuerdo, fui yo. Pero lo hice con estilo.', 'Está bien. Fui yo. No me miren así: a cualquiera le pasa.'],
        work: ['Trabajo aquí por generosidad. Alguien tiene que elevar el nivel.', 'Se trabaja bien cuando se es bueno. Y yo lo soy.', 'Aquí soy el alma del negocio. Los demás, el relleno.'],
        cli: ['{cli} es un cliente aceptable. Podría ser menos cliente, pero en fin.', 'A {cli} le interesa mi opinión, y con razón.', 'Pobre {cli}. En su lugar, habría vigilado mejor... aunque donde estoy yo no hace falta vigilar.'],
        oth: ['De {other} diría que es un aficionado con mucho entusiasmo.', 'De {other} prefiero no hablar: no me gusta compararme.', '{other} tiene sus virtudes. Pocas, pero las tiene.'],
      },
      evasivo: {
        first: ['Hola, soy {who}. Bueno... depende de lo que quiera saber.', '{who}. O eso creo. ¿Por qué lo pregunta?', 'Soy {who}, sí, aunque podría haber sido otra persona.'],
        chat: ['Pues... según como se mire.', '¿Eso es importante?', 'Podría ser, o no. Ahora mismo me inclino por el sí... o el no.', 'Yo estaba por aquí. O por allá. Por donde fuera.', 'Me gusta pensar que las respuestas son como la masa: hay que dejarlas reposar.', '¿Usted cree? Yo, la verdad, no sé qué creo.'],
        press: ['No sé, no recuerdo, puede ser.', '¿Pregunta o afirma? Es que me lío.', 'Si me da un momento... y otro... y otro más...'],
        pressHard: ['¡Vale, vale! Es que no me gusta dar respuestas rápidas, ¡me salen mal!', '¡No me atosigue! Soy un manojo de dudas y me está exprimiendo.'],
        deny: ['Pues no sé, puede que sí o puede que no, pero a mí no me suena.', 'Eso... ¿lo he visto yo? Seguro que no.', 'Podría ser de cualquiera. De cualquiera menos mío.'],
        admit: ['Bueno... si insiste... {x1}. Pero no lo he dicho yo.', 'Pues sí, fíjese: {x1}. Es un detalle sin importancia.', 'Vaya, qué casualidad: {x1}. Digo, que no estuve donde dije.'],
        decoy: ['Esto parece una cosa, pero es otra: {x1}. Lo explico fatal, lo sé.', 'Verá, es que {x1}. Y ahora que lo digo en voz alta suena peor.', 'Hay quien diría que es sospechoso. Yo diría que {x1}. O algo así.'],
        confess: ['Pues... ahora que lo pienso... sí, fui yo. Creo.', 'Si lo ponen así... fui yo. Sin querer. Queriendo un poco.', 'Vale, fui yo. No había forma de seguir evitándolo.'],
        work: ['Pues se trabaja... según el día. Hoy, de otra manera.', 'Aquí hay de todo. Y de nada. Más o menos.', 'Me gusta el trabajo, en general. En particular, ya veremos.'],
        cli: ['{cli}... pues ahí anda. Como todos, ¿no?', 'De {cli} no tengo queja. Ni a favor. Ni en contra.', 'Con {cli} prefiero no mojarme. Soy de secano.'],
        oth: ['{other}, pues sí. Es una persona, ¿no? Eso es seguro.', 'Sobre {other} podría decir mucho. Prefiero no decir nada. O poco.', '{other} es... {other}. Más no sé.'],
      },
      amable: {
        first: ['¡Hola! Soy {who}. Pregunte lo que quiera.', '¡Qué alegría verles! Soy {who}. ¿Les apetece un dulce?', 'Soy {who}, ¡un placer conocerles!'],
        chat: ['Qué bien huele hoy, ¿verdad?', 'Siempre es un placer charlar.', 'Si necesitan algo, lo que sea, aquí estoy. Hasta una servilleta.', 'Qué bonita noche para una investigación. Digo, para una tarta.', 'Me gusta ayudar. Es mi forma de dar las gracias por el pan.', 'Ojalá todos los casos acabaran con abrazos. Y con bizcocho.'],
        press: ['Se lo he contado todo, de verdad.', 'Ay, no se enfade, que le preparo un café.', 'Con lo bien que estábamos hablando... qué lástima.'],
        pressHard: ['¡De verdad que no tengo nada que esconder! Salvo un bocadillo, pero es otro tema.', 'Me duele que dude de mí, con lo que les aprecio.'],
        deny: ['Qué cosa más curiosa. Pero no, no la conozco.', 'Ojalá pudiera ayudar, pero eso no me suena de nada.', 'Uy, no, eso no es mío. Pero qué bonito, eh.'],
        admit: ['Ay, me han pillado: {x1}. Les iba a invitar, pero me dio vergüenza.', 'Tienen razón, no estuve donde dije. Es que {x1}. Perdón, perdón.', 'Bueno, ya que preguntan con tanto cariño: {x1}.'],
        decoy: ['¡No es lo que parece, se lo prometo! Lo que pasa es que {x1}. ¡Qué situación más tonta!', 'Ay, ya sé cómo se ve. Pero es que {x1}. Y mira que lo cuento con una sonrisa.', 'Se lo explico con mucho gusto: {x1}. Parece raro, pero es verdad.'],
        confess: ['Ay, qué pena... fui yo. Lo siento muchísimo, de verdad.', 'Tienen razón. Fui yo. Les debo una disculpa y un pastel.', 'Fui yo. Pero lo hice con todo el cariño... bueno, con algo de cariño.'],
        work: ['Me encanta trabajar aquí: huele a pan y se oye reír.', 'Aquí somos como una familia. Una familia de harina.', 'Se trabaja de maravilla. Salvo hoy, que ha pasado lo que ha pasado.'],
        cli: ['{cli} es un encanto. Qué mala suerte, pobre.', 'A {cli} se le quiere mucho por aquí.', 'Me da mucha pena lo de {cli}. Si puedo ayudar, cuenten conmigo.'],
        oth: ['De {other} podría hablar horas, y todo bueno. Casi todo.', 'Con {other} me llevo de cine. Aunque a veces me quita el último bollo.', '{other} me cae genial. Cuando no habla de sus cosas.'],
      },
      seco: {
        first: ['{who}. Diga.', '{who}. Pregunte.', '{who}. Rápido, que tengo cosas.'],
        chat: ['Mmm.', 'Sí.', 'No.', 'Ajá.', 'Eso es todo lo que hay.', 'Hablo poco. Rinde más.'],
        press: ['Ya lo dije.', 'Lo mismo que antes.', 'No.'],
        pressHard: ['Se acabó. No hay más.', 'Insista lo que quiera. Seguirá igual.'],
        deny: ['No.', 'Ni idea.', 'No es mío.'],
        admit: ['Vale. {X1}. Ya está.', 'Cierto. {X1}. No lo cuente.', 'Lo admito: {x1}. Fin.'],
        decoy: ['Tiene explicación: {x1}. Ya.', 'No es lo que parece. {X1}. Punto.', 'Fácil: {x1}. No hay más.'],
        confess: ['Fui yo.', 'Sí. Fui yo.', 'Vale. Yo. Ya.'],
        work: ['Trabajo. Cobro. Ya.', 'Bien. Normal.', 'Hay mucho que hacer. Lo hago.'],
        cli: ['{cli}. Paga bien. Eso me vale.', 'Bien. Normal.', 'Poco que decir de {cli}.'],
        oth: ['{other}. Habla mucho.', 'Del resto, poco.', '{other} es de los que hablan. Yo no.'],
      },
    },
    // etiquetas de los temas de charla
    labels: { work: '¿Qué tal se trabaja aquí?', cli: '¿Qué opina del cliente?', oth: '¿Qué opina de los demás?', clientSus: '¿Sospecha de alguien?' },
    // el cliente habla de los sospechosos (sin acusar a nadie)
    clientSus: ['De todos y de nadie. Ustedes verán.', 'Sospecho hasta del horno. Aquí cualquiera pudo ser.', 'No quiero acusar a nadie. Pero lo pienso fuerte.'],
    admitMissing: 'Está bien, tienen razón: no estuve donde dije. Es que me da vergüenza contar lo que hacía de verdad.',
    decoyMissing: 'Tiene una explicación tonta, pero tiene una explicación.',
    // ---- MECÁNICA CON HERRAMIENTAS (4C-1b): cada caso lleva uno de estos conjuntos (se elige con un azar propio del compilador); si no hay pista que encaje, esa herramienta se omite.
    // ganzúa → documento guardado en la «cerradura» de la plantilla; uv → documento con tinta invisible en el «rincón oscuro»; lupa → pista física (o foto) en un hueco normal. Las herramientas las llevan Oli (lupa, ganzúa) y Lali (uv).
    mech: {
      // c4b · GRAB-3 (cp. 257, GEN_VERSION >= 7, interruptor `grabReac.on`): frase NERVIOSA que nombra la grabación. Se da a cada sospechoso al que señala una pista «grabación» (charla u objeto) y que NO tenga frase propia (la confesión, la admisión y la explicación tonta no se tocan). SOLO texto: sin presión, sin banderas. MISMA pool para descartes y señuelos (sin fuga). Entradas [frase, peso] por tono (regla R1); sin género, sin lugares, sin confesión.
      grabReac: { on: true, frases: {
        noir: [['¿Me han grabado? Yo solo pasaba por allí. Como todo el mundo en esta ciudad.', 3], ['¿Una grabación? Tosí, y nada más. Seguro que solo se oye que tosí.', 3], ['Eso suena a micrófono, y yo sudo con los micrófonos. Pregunte lo que quiera, pero rápido.', 2]],
        telenovela: [['¡¿Me han grabado?! Qué humillación... ¡y yo sin peinar!', 3], ['¿Una grabación? ¡Cielos! Lo que se oye es un malentendido, ¡lo juro por mi madre!', 3], ['¡Ay, no! ¿Hay cinta? Respiro hondo... y sigo sin saber qué decir.', 2]],
        documental: [['Observen: el sujeto descubre que lo han grabado y se le acelera el pulso. El sujeto soy yo.', 3], ['¿Me han grabado? Qué incómodo. Es como si un documental te pillara despeinado.', 3], ['Una grabación... Ahora entiendo por qué los pájaros huyen del micrófono.', 2]],
        western: [['¿Me han grabado, forastero? Hasta mi caballo se ha puesto nervioso.', 3], ['¿Una grabación? Eso no estaba en el trato. Yo solo me tomaba un vaso de leche.', 3], ['¿Grabado, yo? Se me ha caído el sombrero de la impresión.', 2]],
        espias: [['¿Me han grabado? Imposible: me entrenaron para pasar desapercibido. Y para sudar, al parecer.', 3], ['Una grabación... Dígame que no se oye mi estornudo. Fue un estornudo muy discreto.', 3], ['¿Me han grabado? Código rojo. En el estómago, quiero decir.', 2]],
        cuento: [['¿Me han grabado? Yo creía que el espejo mágico era el único que escuchaba.', 3], ['¡Por las siete lunas! ¿Una grabación? Solo hablaba con una calabaza.', 3], ['¿Una grabación? Qué susto. Yo solo cantaba bajito, como los ratoncitos.', 2]],
      } },
      sets: [['lupa'], ['ganzua'], ['uv'], ['lupa', 'ganzua'], ['lupa', 'uv'], ['ganzua', 'uv'], ['lupa', 'ganzua', 'uv']],
      lupa: ['Con la lupa aparece un detalle diminuto que a simple vista pasaba desapercibido.', 'Bajo la lupa, hasta la pelusa confiesa.', 'La lupa no perdona: se ve algo que antes no se veía.'],
      ganzua: ['¡Clic! La cerradura cede sin hacer ruido y dentro hay algo que alguien quería guardar bien.', '¡Clic! Se abre, y dentro estaba justo lo que no tenía que estar ahí.', 'Un clic limpio, sin un solo chirrido. Dentro había algo interesante.'],
      uv: ['La luz UV revela una escritura que antes no se veía.', 'Bajo la luz UV aparece tinta invisible. Qué elegante.', '¡Brilla! Bajo la linterna UV sale lo que alguien intentó esconder.'],
      labels: { ganzua: 'Cajón con cerradura', uv: 'Marca brillante' },
      // c4-2b-1 (cp. 229, GEN_VERSION >= 7): la UV revela algo CON PESO y con el gesto de pasar la luz. Textos por tipo de marca (no añaden ningún hecho a la biblia: solo dicen cómo se ve lo que la pista ya cuenta).
      // `uvTipos[tipo de pista]` = lista de tipos de marca; cada uno con 3 textos. Documento → tinta invisible · texto borrado · marca de agua; física → mancha. Se elige con un azar propio (seed ^ 0x75c4b1).
      uvTipos: {
        'documento': [
          ['Pasas la luz UV despacio sobre el papel y, línea a línea, aparece una escritura en tinta invisible.', 'Barres el papel con la linterna UV: la tinta invisible se enciende, palabra por palabra.', 'La luz UV recorre la hoja y la tinta invisible brilla como si estuviera deseando que la leyeran.'],
          ['Alguien frotó este papel para borrarlo. La luz UV, pasada con paciencia, recupera lo que decía.', 'Parece un papel limpio, pero bajo la UV asoman las huellas de un texto borrado a conciencia.', 'Con la UV sobre el papel se lee lo que alguien intentó borrar. Mala suerte, borrador.'],
          ['Inclinas la linterna UV y en el papel brilla una marca que a simple vista no existe.', 'Pasas la luz UV por la esquina de la hoja: una marca fluorescente, y debajo, el texto.', 'La UV hace destacar una marca en el papel. Alguien no quería que se leyera, y no ha tenido suerte.'],
        ],
        'física': [
          ['Pasas la luz UV por el objeto y una mancha se enciende donde nadie la veía.', 'Bajo la linterna UV, una mancha invisible empieza a brillar sobre el objeto.', 'La luz UV barre el objeto y delata una mancha que alguien creyó haber limpiado.'],
        ],
      },
      // 4C-2b-1 · empujar: un objeto pesado (paso `coop`, lo empujan los dos) tapa una pista que aparece al apartarlo. Se añade con un azar propio (pushChance), como mucho una vez por caso.
      pushChance: 0.45, pushKinds: ['física', 'documento'],
      push: ['¡Hop! Entre los dos lo deslizan, y por fin se ve lo que había detrás.', '¡Uf! Pesa una barbaridad, pero entre los dos se aparta, y detrás había algo escondido.', 'Empujan a la vez, ¡y cede! Detrás, en el suelo, había algo que nadie quería que se viera.'],
      pushables: [{ sprite: 'crate', label: 'Caja pesadísima' }, { sprite: 'barrel', label: 'Barril enorme' }, { sprite: 'wheelbarrow', label: 'Carretilla atascada' }],
      hidden: { 'física': ['bowl', 'cushion'], documento: ['paper'] },
      // 4C-2b-2 · sigilo: una pista de objeto se examina a la vista de un personaje que vigila; solo se puede cuando no mira (ventana segura ≥ acción + 1 s, validada en Normal y Difícil). Azar propio (watchChance), como mucho una vez por caso.
      watchChance: 0.4, watchChanceV6: 0.6, watchKinds: ['física', 'documento'], watchTime: 2.4, workCap: 3,
      // HERR-2 (4F-0b 3/4-c, GEN_VERSION >= 7): CUOTA de pistas de sostén (objeto con role prueba, descarte o refuta) por herramienta. Con S pistas de sostén, cada herramienta lleva q = clamp(round(share · S), min, max) y quedan ≈ round(share · S) libres
      // (el reparto objetivo del usuario: ~20 % lupa, ~20 % ganzúa, ~20 % UV, ~20 % grabadora y ~20 % libres). Con GEN_VERSION < 7 no se usa (los casos salen idénticos).
      // S2 (cp. 184, reparto por NIVEL; regla R1 del usuario: cada cifra con mínimo, máximo y pesos, en datos). `levels[nivel][herramienta]` = [[cantidad, peso], …]: nº de pistas de sostén con esa herramienta por caso (grabadora = nº de charlas con pista, tope 2).
      // Medias objetivo (decisión del usuario, 24 oct): Fácil lupa 2 · UV 2 · ganzúa 1 · grabadora 1 · Normal 2,5 · 2 · 1,5 · 1,5 · Difícil 3 · 2,5 · 1,5 · 1,5. AJUSTE 25 oct: con ≈ 7 pistas de objeto por caso (los testimonios de S1 quitaron ≈ 1) caben ≈ 4-5 herramientas, así que ganzúa y grabadora de Normal y Difícil bajan a ≈ 1,2 (más lupa y UV, menos ganzúa y grabadora). `libres` = pistas de sostén libres objetivo (mín. 2 = las 2 clave); lo que sobra por encima lo absorben UV y lupa. Lo que no cabe (sala sin rincón, pocas pistas) se queda corto, nunca se fuerza.
      // Oli lleva lupa+ganzúa y Lali UV+grabadora: las medias dejan 3/3, 4/3,5 y 4,5/4 (EQ-1 40-60 %).
      herr2: { share: 0.2, min: 1, max: 3, levels: {
        facil: { lupa: [[1, 25], [2, 50], [3, 25]], uv: [[1, 25], [2, 50], [3, 25]], ganzua: [[0, 20], [1, 60], [2, 20]], grabadora: [[1, 15], [2, 85]], libres: [[2, 100]] },
        normal: { lupa: [[2, 50], [3, 50]], uv: [[1, 25], [2, 50], [3, 25]], ganzua: [[0, 10], [1, 60], [2, 30]], grabadora: [[1, 50], [2, 50]], libres: [[2, 50], [3, 50]] },
        dificil: { lupa: [[2, 25], [3, 50], [4, 25]], uv: [[2, 50], [3, 50]], ganzua: [[0, 10], [1, 60], [2, 30]], grabadora: [[1, 50], [2, 50]], libres: [[2, 50], [3, 50]] },
      }, 
      // c4-2 (cp. 227, GEN_VERSION >= 7): SEÑUELOS CON HERRAMIENTA. `senuelos[nivel][herramienta]` = [[cantidad, peso], …]: nº de pistas FALSAS (role falsa, de objeto) que piden esa herramienta por caso. Medido en c4-1 (INFORME_SENUELOS_C4_PASO1): los señuelos no pedían ninguna y delataban cuáles son falsas.
      // Medias = la proporción de las pistas de sostén (lupa ≈ 22 %, UV ≈ 16 %, ganzúa ≈ 11 %) × nº medio de señuelos por caso (Fácil 4,9 · Normal 9,4 · Difícil 11). c4-2b-3 (cp. 232): señuelos con GANZÚA (`ganzuaSenuelos`) y CADENA DE SEÑUELOS (`cadena` = [[0|1, peso]]: ganzúa falsa → UV falsa de documento) HECHOS pero APAGADOS; la cadena real aparece en ≈ 90 % de las ganzúas de sostén, por eso la de señuelo pesa 90 (si no, «cajón + papel UV» delataría lo verdadero). c4-2b-2 (cp. 230): los señuelos con UV están HECHOS pero APAGADOS (`uvSenuelos: false`): encendidos, el balanceador libera menos lupas y la lupa sube (Fácil 2,19→2,67 · Normal 2,39→3,50 · Difícil 2,66→4,10); se encienden en 2b-4 junto con el recorte de lupa. Mitad 2a: SOLO la lupa se usa (no necesita hueco especial); UV y ganzúa quedan en datos para la mitad 2b. La grabadora de los señuelos = charlas señuelo (c4-3). c4-3 2/4 (cp. 241, DATOS APAGADOS): `senuelos[nivel].charla` = nº de charlas señuelo por caso [[0|1, peso]] (máx. 1; la factibilidad medida en 1/4 es 68 % · 84 % · 84 % de los casos) e interruptor `charlaSenuelos` (false: nada lo lee hasta 3/4). `bandas` = bandas de uso por caso confirmadas por el usuario (solo documentan y las lee quien mida); grabadora 1,0-2,0 (decisión A, 26 oct, antes 1,0-1,5).
      senuelos: {
        facil: { lupa: [[0, 20], [1, 60], [2, 20]], uv: [[0, 30], [1, 50], [2, 20]], ganzua: [[0, 50], [1, 50]], cadena: [[0, 10], [1, 90]], charla: [[0, 55], [1, 45]] },
        normal: { lupa: [[1, 30], [2, 40], [3, 30]], uv: [[0, 25], [1, 75]], ganzua: [[0, 50], [1, 40], [2, 10]], cadena: [[0, 10], [1, 90]], charla: [[0, 45], [1, 55]] },
        dificil: { lupa: [[1, 10], [2, 40], [3, 50]], uv: [[0, 60], [1, 40]], ganzua: [[0, 45], [1, 55]], cadena: [[0, 10], [1, 90]], charla: [[0, 40], [1, 60]] },
      }, // c4-2b-4 paso 1 (cp. 233, GEN_VERSION >= 7): TOPE DE LUPA por caso y nivel, [[tope, peso], …] (R1). Banda del usuario (25 oct): lupa 1,7-2,2 por caso. Se liberan primero las lupas de señuelo y luego las de sostén.
      // c4-2b-4 paso 2 (cp. 234): `cadenaReal[nivel]` = [[0|1, peso]]: si la cadena ganzúa→UV real se pone cuando el caso la permite (iguala la proporción con la cadena de señuelo).
      cadenaReal: { facil: [[0, 45], [1, 55]], normal: [[0, 35], [1, 65]], dificil: [[0, 25], [1, 75]] },
      refGrab: { facil: [[0, 55], [1, 45]], normal: [[0, 45], [1, 55]], dificil: [[0, 40], [1, 60]] }, // c4-3 3/4-b (4) (cp. 249, GEN_VERSION >= 7, APAGADO con `charlaSenuelos`): nº de refutaciones REALES entregadas como charla grabada de tono sospechoso (rastro del inocente que miente → `tracesGrab`), por caso y nivel [[0|1, peso]], máx. 1. Mismas cifras que `senuelos[nivel].charla`: así hay tantas charlas sospechosas verdaderas como señuelo y el tono no delata.
      lupaTope: { facil: [[1, 20], [2, 60], [3, 20]], normal: [[1, 10], [2, 60], [3, 30]], dificil: [[1, 15], [2, 65], [3, 20]] },
      uvFirst: true, uvSenuelos: true, ganzuaSenuelos: true, charlaSenuelos: true, balanceaLali: true, bandas: { lupa: [1.7, 2.2], ganzua: [1.0, 1.5], uv: [1.7, 2.3], grabadora: [1.0, 2.0] }, kinds: { uv: ['documento', 'física'], ganzua: ['documento', 'física'], lupa: ['física', 'documento', 'grabación'] } }, // `kinds`: tipos de pista que acepta cada herramienta, por orden de preferencia (los textos de ganzúa y lupa son genéricos: sirven para un objeto guardado o un detalle diminuto). c4-2b-1 (cp. 229, GEN_VERSION >= 7): la UV toma documentos (tinta, texto borrado, marca) y objetos físicos (mancha), con textos propios por tipo en `mech.uvTipos`; `uvFirst`: en cada ronda de reparto la UV elige antes que la lupa y la ganzúa (la UV es de Lali y la lupa de Oli: Oli usa mucha lupa y Lali poca UV)
      watch: ['Esperas a que se dé la vuelta y, ¡ahora!, lo examinas a toda prisa.', 'Con disimulo, mientras mira para otro lado, echas un vistazo rápido.', 'Un ojo en la pista y otro en el vigilante: en cuanto se despista, lo examinas.'],
      watchSpotted: ['¡Eh! ¿Qué hacéis ahí, vosotros dos?', '¡Quietos! Os he visto... bueno, casi.', '¡Alto! ¿Esa cosa no estaba ahí antes?'],
      // ritmos del vigilante (ventana segura mínima 3,5 s en Difícil frente a los 3,4 s que necesita la acción)
      watchRhythms: [{}, { period: { normal: 7, hard: 6.5 }, look: { normal: 1.8, hard: 2.2 }, offset: 1, face: { watching: 'right', idle: 'left' } }, { period: { normal: 8, hard: 7 }, look: { normal: 2, hard: 2.5 }, offset: 3 }],
      // A4 3/4-b2 paso 3 · cadena de 2 pasos (GEN_VERSION >= 6): la ganzúa abre un cajón y deja un papel que solo la luz UV puede leer. `gz` se añade al final de la pista de la ganzúa; `uv`, al principio de la de la UV.
      chain: { gz: ['Entre los papeles asoma uno con manchas raras: eso se leerá con la linterna UV.', 'Hay también un papel que parece en blanco. Sospechoso: pide luz UV a gritos.', 'Y debajo, una nota con tinta que no se ve. La linterna UV sabrá qué hacer.'], uv: ['Con el papel del cajón delante, la luz UV hace aparecer lo que no se leía.', 'La nota del cajón, bajo la UV, por fin habla.', 'Ahora que el cajón está abierto, la UV revela lo que decía el papel.'] },
      done: { lupa: 'Ya lo has mirado con la lupa.', ganzua: 'Ya está abierto y revisado.', uv: 'Ya has leído la tinta invisible.', push: 'Ya está apartado: ya no estorba.' },
    },
    // ---- ESCENAS CON ALIADO DE POLICÍA (4C-3b-2): el compilador añade a una sala del caso un policía que AYUDA POCO y nunca resuelve (azar propio seed ^ 0xa11e5). Todo lo que dice sale de la biblia (ventana del robo, lugar de una pista de objeto) o es una broma sin nombres:
    // así no cambia lo que sabe el jugador ni la equidad. Escena: exterior (coche patrulla animado + cono, solo en plantillas de calle), comisaría (mostrador), interrogatorio (mesa con lámpara) o reconstrucción (tablón de pistas).
    ally: {
      chance: 0.7, exteriorChance: 0.75,
      kinds: { exterior: { sprite: 'police_car_0', label: 'Coche patrulla', cone: 'Cono de señalización' }, comisaria: { sprite: 'station_counter', label: 'Mostrador de la comisaría' }, interrogatorio: { sprite: 'interrogation_table', label: 'Mesa de interrogatorio' }, reconstruccion: { sprite: 'clue_board', label: 'Tablón de la reconstrucción' } },
      ranks: { agente: { title: 'Agente', names: ['Ramos', 'Molina', 'Rey', 'Campos'], looks: ['agente_a', 'agente_b', 'agente_c'] }, inspector: { title: 'Inspector', names: ['Vidal', 'Ortega', 'Salas', 'Beltrán'], looks: ['inspector_a', 'inspector_b', 'inspector_c'] }, comisario: { title: 'Comisario', names: ['Cabrera', 'Bravo', 'Montero'], looks: ['comisario_a', 'comisario_b'] } },
      byKind: { exterior: ['agente', 'inspector'], comisaria: ['agente', 'comisario'], interrogatorio: ['inspector', 'comisario', 'agente'], reconstruccion: ['inspector', 'agente'] },
      labels: { hecho: '¿Qué dice el parte?', mira: '¿Algún consejo?', error: '¿Tienen algún sospechoso?' },
      personas: {
        serio: {
          first: ['Aquí {who}. Procedan con orden y sin tocar nada.', '{who} al habla. Esto es una investigación, no un mercadillo.', '{who}. Les estaba esperando. Con ganas no, pero esperando.'],
          hecho: ['Según el parte, {obj} desapareció entre las {desde} y las {hasta}. Lo último que consta es que estaba en {loc}.', 'Consta en el parte: {obj}, en {loc}, y ya no estaba entre las {desde} y las {hasta}. Más no puedo decir.', 'Les resumo el parte: {obj} se esfumó entre las {desde} y las {hasta}. Su último sitio conocido, {loc}.'],
          mira: ['Mi consejo profesional: vuelvan a mirar {loc}. Ahí hay algo que no cuadra, y no me corresponde decir qué.', 'Si yo fuera ustedes, que no lo soy, revisaría {loc} otra vez. Con calma.', 'Sin comprometerme: {loc}. Miren bien. Los detalles pequeños son los que hablan.'],
          error: ['Mi hipótesis es el mayordomo. Aquí no hay mayordomo, pero la hipótesis sigue en el expediente.', 'Sospecho de todos por igual. Es un método. Muy poco eficaz, pero método.', 'Apuntaría a quien tenga cara de culpable. El problema es que aquí todos la tienen.'],
          chat: ['Llevo veintidós años en el cuerpo. Lo más emocionante fue un gato en un árbol. El gato ganó.', 'No bebo café de servicio. Me ha visto cosas.', 'Si quieren mi opinión, esto huele a papeleo. Y a algo más, pero sobre todo a papeleo.', 'El procedimiento es sagrado. Mi sentido del humor, en cambio, está en trámite.'],
          press: ['Insistir no acelera la investigación. Pero tampoco la retrasa.', 'Mi paciencia tiene un límite, y lo sabe todo el cuartel.'], deny: ['No me consta.', 'Eso no figura en mi parte.'],
        },
        torpe: {
          first: ['¡Ah! Hola. Estaba aquí... vigilando. Con muchísima atención.', '{who}. Sí, con el café en la mano. Es de servicio, ¿vale?', '{who}, policía. De verdad. Me dieron la placa un martes.'],
          hecho: ['A ver, lo tengo apuntado... {obj}, entre las {desde} y las {hasta}, y estaba en {loc}. Creo. La letra es mía y aun así me cuesta.', 'Pone aquí que {obj} desapareció entre las {desde} y las {hasta}. Y que estaba en {loc}. O era una lista de la compra.', 'Entre las {desde} y las {hasta}: {obj}, {loc}. Lo he leído dos veces y las dos me ha salido igual, así que será verdad.'],
          mira: ['Yo miraría en {loc}. No sé por qué, pero tropecé allí y algo me pareció raro. Puede que fuera el suelo.', 'Prueben en {loc}. Es una corazonada. Mi última corazonada fue una indigestión, pero bueno.', 'Eh... {loc}. Sí, {loc}. Lo he dicho con mucha seguridad, ¿verdad? Pues eso.'],
          error: ['Ya sé quién fue: ¡el que huyó! ...Bueno, nadie ha huido. Entonces el que se quedó. Tengo que pensarlo.', 'Mi teoría es una conspiración de palomas. No tengo pruebas. Tampoco tengo una teoría mejor.', 'Sospecho de... a ver... de mí. Pero tengo coartada: estaba aquí, vigilando, con mucho cuidado.'],
          chat: ['Me caí por las escaleras de la comisaría. Dos veces. La segunda por si acaso la primera no contaba.', 'Esposé a un compañero sin querer. Lo bueno es que no se va a ninguna parte.', 'Siempre llevo una libreta. La uso sobre todo para dibujar patos.', 'Dicen que soy un desastre. Yo prefiero «sorprendente».'],
          press: ['¡No me agobie! Que me tiembla el boli.', 'Vale, vale, tengo prisa por hacerlo bien. Lo cual ya es un riesgo.'], deny: ['Eso... no lo sé. Lo apunto para mirar.', 'Pues ni idea, pero qué buena pregunta.'],
        },
        colega: {
          first: ['¡Eh, compañeros! Pasen, pasen. Invita la casa. La casa es esto.', '{who} al habla. Me han dicho que sois los detectives. Me caéis bien ya.', '¡Por fin gente con ganas! Yo estoy de guardia desde que se inventó el sueño.'],
          hecho: ['Mirad, el parte dice que {obj} desapareció entre las {desde} y las {hasta}. Estaba en {loc}, por si os sirve.', 'Os cuento lo que sé: {obj} se esfumó entre las {desde} y las {hasta}. Última vez, {loc}. De nada.', 'Entre las {desde} y las {hasta}, {obj} dejó de estar. Lo dejaron en {loc}, y ahí acaba mi parte. Lo demás es vuestro.'],
          mira: ['Os doy un truco de poli a poli: mirad otra vez en {loc}. Ahí hay algo que no termina de encajar.', 'Si tuviera que apostar, y no puedo, que me lo prohíben, diría {loc}.', 'Un consejo de colega: {loc}. Y si no sale nada, os invito a un café. Del malo, pero invito.'],
          error: ['Yo lo tengo clarísimo: ha sido alguien. Alguien con manos. Estoy afinando.', 'He apostado con un compañero a que fue el que menos lo parece. Todavía no sé a quién apuesto.', 'Mi teoría es que ha sido el destino. El destino no tiene coartada, así que apunta alto.'],
          chat: ['Llevo tres semanas sin dormir una noche entera. Me siento fenomenal, de verdad, ¿por qué lo preguntáis?', 'Aquí el café lo hace el que pierde a los dados. Hoy me tocó a mí. Perdonadme por anticipado.', 'Siempre quise ser detective. Pero sin los muertos. Así que ya veis.', 'Si resolvéis esto antes que yo, no se lo digáis al jefe. O sí, que me quite el turno de noche.'],
          press: ['Eh, tranquilos, que estamos en el mismo equipo.', 'Vale, vale, os cuento lo que haga falta. Pero sin esposas, ¿eh?'], deny: ['De eso no tengo ni idea, colega.', 'Ahí os he perdido, y eso que soy rápido.'],
        },
      },
    },
    clientFirst: 'Soy {who}. Por favor, ayúdenme: me han quitado {obj}.',
    clientAsk: '¿Qué ha pasado?',
    askWhere: '¿Dónde estuvo anoche?',
    askSaw: '¿Vio algo raro?',
    askCase: '¿Qué ha pasado?',
    win: ['¡Era {culprit}! {method}.', 'Todo porque {motive}.'],
    fail: ['Nos hemos equivocado de culpable. En realidad era {culprit}, que se ha escapado con {obj}.'],
  };

  // lo que hacían de verdad, en primera persona y en pasado (para que el personaje lo cuente al desmontar su mentira). Una entrada por frase de G.GEN_DATA.acts
  G.GEN_DATA.pastFirst = {
    'Ordena las estanterías de la tienda.': 'ordenaba las estanterías', 'Atiende a los últimos clientes.': 'atendía a los últimos clientes', 'Hace cuentas tras el mostrador.': 'hacía cuentas tras el mostrador', 'Limpia los cristales del escaparate.': 'limpiaba los cristales del escaparate',
    'Se prueba los sombreros del escaparate.': 'me probaba los sombreros del escaparate', 'Se echa una siesta tras el mostrador.': 'me echaba una siesta tras el mostrador', 'Se zampa el género a escondidas.': 'me zampaba el género a escondidas',
    'Amasa para mañana.': 'amasaba para mañana', 'Friega bandejas.': 'fregaba bandejas', 'Prepara la masa del día siguiente.': 'preparaba la masa del día siguiente', 'Revisa la temperatura de los hornos.': 'revisaba la temperatura de los hornos',
    'Se zampa un bizcocho entero a escondidas.': 'me zampaba un bizcocho entero a escondidas', 'Ensaya un baile con una cuchara de madera.': 'ensayaba un baile con una cuchara de madera', 'Llama a escondidas por teléfono a su pretendiente.': 'llamaba a escondidas por teléfono a mi pretendiente',
    'Cuenta sacos de harina.': 'contaba sacos de harina', 'Coloca cajas en las estanterías.': 'colocaba cajas en las estanterías', 'Revisa los albaranes.': 'revisaba los albaranes', 'Barre el almacén.': 'barría el almacén',
    'Echa una cabezada entre los sacos.': 'echaba una cabezada entre los sacos', 'Lee una novela de misterio tras las cajas.': 'leía una novela de misterio tras las cajas', 'Busca el dulce que escondió el mes pasado.': 'buscaba el dulce que escondí el mes pasado',
    'Saca la basura.': 'sacaba la basura', 'Toma el aire junto a los contenedores.': 'tomaba el aire junto a los contenedores', 'Reparte los últimos pedidos.': 'repartía los últimos pedidos', 'Barre la puerta trasera.': 'barría la puerta trasera',
    'Da de comer a escondidas a un gato callejero.': 'daba de comer a escondidas a un gato callejero', 'Ensaya un discurso en voz alta.': 'ensayaba un discurso en voz alta', 'Practica pasos de baile sin que nadie lo vea.': 'practicaba pasos de baile sin que nadie me viera',
    'Afila los cuchillos.': 'afilaba los cuchillos', 'Repara una bandeja abollada.': 'reparaba una bandeja abollada', 'Engrasa la amasadora.': 'engrasaba la amasadora', 'Ordena las herramientas.': 'ordenaba las herramientas',
    'Fabrica un regalo sorpresa en secreto.': 'fabricaba un regalo sorpresa en secreto', 'Se echa una partida de cartas a solas.': 'me echaba una partida de cartas a solas', 'Prueba la bicicleta de reparto dando vueltas.': 'probaba la bicicleta de reparto dando vueltas',
    // 4F-0b 2/4-c: Despacho del dueño (en reserva)
    'Revisa las cuentas del dueño.': 'revisaba las cuentas del dueño', 'Ordena los papeles del escritorio.': 'ordenaba los papeles del escritorio', 'Archiva facturas en la carpeta de siempre.': 'archivaba facturas en la carpeta de siempre', 'Riega la planta del despacho.': 'regaba la planta del despacho',
    'Se sienta en el sillón del dueño y ensaya su cara de jefe.': 'me sentaba en el sillón del dueño y ensayaba mi cara de jefe', 'Se zampa los caramelos del cajón del dueño.': 'me zampaba los caramelos del cajón del dueño', 'Lee el diario del dueño. Solo las partes buenas.': 'leía el diario del dueño, solo las partes buenas',
  };

  // ---- 4C-4a: AMBIENTE (`mood`) — textos de compilador (la biblia y `GEN_VERSION` no cambian). `claro` no usa nada de aquí (el caso sale exactamente como antes).
  // Cada entrada oscura es un PAR [susto, remate]: el remate (la gracia) va SIEMPRE justo después del susto. Reglas: humor negro adulto, nada de gore ni de violencia explícita, nada brusco.
  // `inquietante` = una sospecha (pasos, algo caliente, una puerta); `macabro` = un poco más de sombra (sótano, tierra removida, tumbas), pero siempre con remate. Los hechos del caso NO cambian.
  // tone[tono][mood] = { titles: [texto], blurbs/cFirst/cTell/chill: [[susto, remate]] }  ·  traits[rasgo][mood] = [[susto, remate]] (tema «¿Ha notado algo raro?»)  ·  ally[persona][mood] = [[susto, remate]]
  // Variables: {obj} {cli} {n} (sinopsis) · {who} {obj} (saludo) · {obj} {loc} (relato) · {culprit} {obj} {cli} (cierre) · {obj} {other} {who} (rasgos) · {obj} (aliado).
  G.GEN_DATA.compile.mood = {
    labels: { raro: '¿Ha notado algo raro?', noche: '¿Algo raro esta noche?' },
    tone: {
      noir: {
        inquietante: {
          titles: ['La noche en que {obj} dejó de estar', 'Lo que la lluvia no se llevó: {obj}'],
          blurbs: [['{cli} entra en el despacho sin hacer ruido: anoche desapareció {obj} y la puerta estaba cerrada por dentro.', 'Hay {n} sospechosos y una gotera que suena sospechosamente a pasos.'], ['A {cli} le ha desaparecido {obj} y jura que alguien lo vigilaba desde la acera de enfrente.', 'Hay {n} sospechosos. El de la acera de enfrente, por desgracia, era un buzón.']],
          cFirst: [['Soy {who}. Me han quitado {obj}. Y juraría que alguien ha dormido en mi silla.', 'Aunque a lo mejor fui yo: últimamente duermo mucho.'], ['Soy {who}. Falta {obj}, y la puerta seguía cerrada por dentro.', 'Y yo tengo la única llave. Y un poco de sueño.']],
          cTell: [['Anoche desapareció {obj}. Estaba en {loc}. Esta mañana el suelo seguía tibio, como si alguien acabara de irse.', 'O de hacer la siesta. En esta ciudad nadie descansa.'], ['Anoche desapareció {obj}. Estaba en {loc}. Oí un ruido a las tres, y a las tres y cuarto, otra vez.', 'Era el frigorífico. Ahora ya no hace ruido. Eso me inquieta más.']],
          chill: [['Caso cerrado. Pero esa noche el teléfono del despacho sonó una sola vez. Al otro lado no había nadie.', 'Bueno, había alguien: era el del seguro, que quería renovar.'], ['Caso cerrado. Pero al salir, alguien encendió la luz de la trastienda. Dentro no quedaba nadie.', 'Luego recordé que la dejé encendida yo. Siempre lo hago. Casi siempre.']],
        },
        macabro: {
          titles: ['Aquí yace {obj} (descanse en paz, o donde esté)', 'Réquiem por {obj}'],
          blurbs: [['{cli} entra en el despacho y no se sienta: anoche desapareció {obj}, la puerta estaba cerrada por dentro... y vive solo.', 'Hay {n} sospechosos y un cenicero que, juraría, estaba más lleno ayer.'], ['A {cli} le ha desaparecido {obj} y exige discreción: «Cuantos menos lo sepan, menos tendrán que enterrarse».', 'Hay {n} sospechosos. Por si acaso, el detective ha traído su propia pala. Para el jardín, claro.']],
          cFirst: [['Soy {who}. Me han quitado {obj}. Alguien entró anoche y, créame, esta casa no recibe visitas.', 'Ni siquiera la mía. El último invitado se me aburrió y se marchó... de este mundo, creo.'], ['Soy {who}. Falta {obj}, y la puerta estaba cerrada por dentro. Y yo vivo solo.', 'Quiero decir: vivo solo desde el martes.']],
          cTell: [['Anoche desapareció {obj}. Estaba en {loc}. En el suelo había una mancha oscura que nadie recuerda haber hecho.', 'Es de mermelada de mora. Casi seguro. Ya la he probado.'], ['Anoche desapareció {obj}. Estaba en {loc}. En el armario había un traje de más, de la talla de alguien que aquí no trabaja.', 'Es mío. Pero no me acuerdo de haberlo comprado.']],
          chill: [['Caso cerrado. Pero esa noche el sillón del despacho giró solo hacia la ventana. Y se quedó mirando.', 'Se lo dije al casero. Dice que es el muelle. Qué muelle más constante.'], ['Caso cerrado. En la puerta del despacho apareció un cliente nuevo, sin cita y con barro hasta las rodillas.', 'Le pedí que esperase a que se secara. Dijo que no tenía prisa. Ya no.']],
        },
      },
      telenovela: {
        inquietante: {
          titles: ['Lágrimas en el pasillo vacío: {obj}', 'El secreto que susurran las velas: {obj}'],
          blurbs: [['{cli} irrumpe entre sollozos: ¡ha desaparecido {obj}! Y anoche alguien llamó a su puerta con tres golpes suaves.', 'Entre {n} sospechosos hay secretos, miradas y un perro que sabe más de lo que dice.'], ['¡Han robado {obj}! Y {cli} jura que desde entonces las velas se apagan solas cuando alguien miente.', 'Con {n} sospechosos, esta noche se van a apagar muchas velas.']],
          cFirst: [['¡Soy {who}! ¡Me han arrebatado {obj}! ¡Y anoche alguien lloraba en mi pasillo... y no era yo!', 'Bueno, un poco sí. Pero antes. Y por otra cosa.'], ['¡Soy {who}! ¡Falta {obj}! ¡Y mi retrato del salón mira ahora hacia otro lado!', 'Seguro que es el calor. Los retratos también tienen sus cosas.']],
          cTell: [['¡Anoche desapareció {obj}! Estaba en {loc}, ¡y esta mañana quedaba allí un perfume que no es de nadie!', 'Olía a cebolla. Pero con muchísimo dramatismo.'], ['¡Anoche desapareció {obj}! Estaba en {loc}, ¡y oí unos pasos lentos que se detenían tras la puerta!', 'Eran los míos: llevaba toda la noche paseando, ¡sufriendo por mi amor perdido!']],
          chill: [['Y así acaba el capítulo. Pero en la última escena, un retrato del pasillo parpadeó. Un retrato. Parpadeó.', 'Mañana, más. Y ojalá, menos retratos.'], ['Y así acaba el capítulo. Pero alguien deja una rosa negra en el felpudo, sin tarjeta ni remitente.', 'Seguro que es publicidad. De una floristería muy dramática.']],
        },
        macabro: {
          titles: ['Hasta que la muerte nos separe de {obj}', 'Mi amor, no me hables del cementerio: {obj}'],
          blurbs: [['{cli} irrumpe entre sollozos: ¡ha desaparecido {obj}! Y jura que anoche, en el espejo, vio a su tía abuela. Que lleva muerta desde 1987.', 'Entre {n} sospechosos hay secretos, miradas y una tía abuela con mucho tiempo libre.'], ['¡Han robado {obj}! Y en el jardín hay un montículo de tierra removida que nadie recuerda haber removido.', 'Entre {n} sospechosos hay secretos, miradas y alguien con muy buena mano para las petunias.']],
          cFirst: [['¡Soy {who}! ¡Me han arrebatado {obj}! ¡Juro por la tumba de mi marido que daré con el culpable!', 'Mi marido no está muerto, pero ya he mirado precios.'], ['¡Soy {who}! ¡Falta {obj}! ¡Y anoche el reloj de pared marcó la hora de mi muerte!', 'Luego resultó que estaba parado. Pero el susto no me lo quita nadie.']],
          cTell: [['¡Anoche desapareció {obj}! Estaba en {loc}, ¡y bajo la alfombra quedó la silueta de un cuerpo!', 'Era una pila de cojines. Pero con muchísima personalidad.'], ['¡Anoche desapareció {obj}! Estaba en {loc}, ¡y alguien dejó sobre la mesa una tarjeta de pésame con mi nombre!', 'Era por mi cumpleaños. Cumplo cincuenta: aquí todo es un funeral.']],
          chill: [['Y así acaba el capítulo. Pero esa noche, en la colina, se encendió una vela sobre una tumba sin nombre.', 'Seguro que era del casero. Es muy aficionado al romanticismo.'], ['Y así acaba el capítulo. Pero en la última escena se oye un órgano, y nadie en la casa toca el órgano.', 'Tampoco hay órgano. Pero se oye. Qué producción tan cuidada.']],
        },
      },
      documental: {
        inquietante: {
          titles: ['El silencio después de {obj}', 'Vida salvaje: lo que acecha tras {obj}'],
          blurbs: [['En la selva de la panadería, {cli} descubre que ha desaparecido {obj}. Las cámaras captaron algo: una sombra sin dueño.', '{n} sospechosos, un solo depredador y un cámara que prefiere no mirar.'], ['Ha caído la noche en el hábitat de {cli}. Ha desaparecido {obj}, y los animales han dejado de hacer ruido.', 'Con {n} sospechosos, el único que sigue haciendo ruido es el narrador.']],
          cFirst: [['(a cámara) Soy {who}. Me han quitado {obj}. Y alguien ha movido la cámara mientras grababa.', 'Yo creo que fue el trípode. Tiene un carácter.'], ['(a cámara) Soy {who}. Acaban de quitarme {obj}. Y aquí hay algo que no sale en el plano.', 'Siempre hay algo que no sale en el plano. Se llama «presupuesto».']],
          cTell: [['Anoche desapareció {obj}. Estaba en {loc} tan tranquilo, en su hábitat. Esta mañana, huellas que entran, pero que no salen.', 'Los expertos piden no sacar conclusiones. Los expertos están en el almuerzo.'], ['Anoche desapareció {obj}. Estaba en {loc}. Una cámara nocturna grabó una forma moviéndose sin hacer sombra.', 'Revisamos la cinta: era el cámara. Estaba mal peinado.']],
          chill: [['Y así, otro misterio vuelve a su ecosistema. Fin del documental. Aunque la cámara siguió grabando sola.', 'Luego dijeron que se había quedado sin batería. Pero siguió grabando.'], ['Y así termina nuestra expedición. En los créditos, alguien saluda a cámara desde el fondo. Nadie conoce a esa persona.', 'Ya la ficharemos para la segunda temporada.']],
        },
        macabro: {
          titles: ['Depredadores nocturnos: la desaparición de {obj}', 'El último hábitat de {obj}'],
          blurbs: [['En la selva de la panadería, {cli} descubre que ha desaparecido {obj}. Sobre la hierba, la huella de algo grande que arrastró algo más pequeño.', '{n} sospechosos, un solo depredador y un narrador que ha pedido cobrar por adelantado.'], ['El sol cae sobre el hábitat de {cli}. Ha desaparecido {obj}, y bajo el árbol más viejo la tierra está removida.', 'Con {n} sospechosos, el narrador recomienda no excavar. El narrador tiene fobia a las palas.']],
          cFirst: [['(a cámara) Soy {who}. Me han quitado {obj}. Si algo me pasa, esta cámara lo ha visto todo.', 'Y si no, no ha visto nada. Es una cámara muy discreta.'], ['(a cámara) Soy {who}. Acaban de quitarme {obj}. Los depredadores de esta zona no perdonan.', 'Hablo de los patos. Son muy territoriales.']],
          cTell: [['Anoche desapareció {obj}. Estaba en {loc}. Las cámaras captaron a alguien llevándoselo... y volviendo después con las manos vacías y más contento.', 'La ciencia lo llama «trabajo bien hecho». La policía lo llama «pista».'], ['Anoche desapareció {obj}. Estaba en {loc}. En el suelo, una mancha oscura que los expertos prefieren no identificar.', 'Los expertos, de hecho, han pedido un café y se han ido muy rápido.']],
          chill: [['Y así, otro misterio vuelve a su ecosistema. Fin del documental. Pero en la cinta, a las 3:07, algo pasa por detrás de todos... saludando.', 'Hemos decidido no emitir esa parte. Es por el ritmo.'], ['Y así termina la expedición. Pero cuando el equipo recogía, la cámara giró sola y enfocó el sótano.', 'Desde entonces trabajamos con cinta americana sobre el objetivo.']],
        },
      },
      western: {
        inquietante: {
          titles: ['Cuando el viento dejó de soplar por {obj}', 'Silencio en el pueblo: {obj}'],
          blurbs: [['{cli} entra en la panadería de golpe y escupe migas: ha desaparecido {obj}. Y a medianoche alguien silbaba por la calle una canción sin tonada.', 'Hay {n} sospechosos y un solo silbido. Que es el del horno.'], ['Ha caído el sol sobre el pueblo, y con él, {obj}. Los perros llevan una hora sin ladrar.', 'Hay {n} sospechosos. Los perros, por si acaso, ya han puesto una coartada.']],
          cFirst: [['Me llaman {who}. Alguien se ha llevado {obj}. Y el cubo del pozo estuvo moviéndose toda la noche.', 'Aquí no sopla ni una brizna. Seguro que era un cubo mal atado.'], ['Me llaman {who}. Falta {obj}. Y las botas junto a mi puerta estaban frías y mojadas.', 'Yo le dije a mi mujer que dejara de limpiar el barro de noche.']],
          cTell: [['Anoche, al caer el sol, desapareció {obj}. Estaba en {loc}. Al amanecer, el viento traía olor a pólvora vieja.', 'O a pan quemado. Aquí todo huele a algo requemado.'], ['Anoche, al caer el sol, desapareció {obj}. Estaba en {loc}. Alguien dejó un sombrero en el porche con huellas dentro de la copa.', 'No tiene dueño. Bueno, sí: es del sheriff. Pero él dice que no.']],
          chill: [['Y el sol se puso sobre la panadería. Justicia hecha. Pero a lo lejos, un jinete sin caballo cruzó el pueblo despacio.', 'El sheriff dice que era el vecino, que ha perdido el caballo. Y el sombrero. Y la paciencia.'], ['Justicia hecha. Pero en el cementerio de la colina había una tumba nueva, con el sombrero más grande del pueblo encima.', 'Dicen que es del que ganó el concurso de bigotes. Que ya no compite.']],
        },
        macabro: {
          titles: ['Aquí se cava, forastero: {obj}', 'La ley del cementerio y {obj}'],
          blurbs: [['{cli} entra en la panadería de golpe: ha desaparecido {obj}. Y en la colina hay una tumba sin cruz que ayer no estaba.', 'Hay {n} sospechosos y un enterrador que, curiosamente, ha pedido vacaciones.'], ['Ha caído el sol sobre el pueblo, y con él, {obj}. En la puerta del saloon, el sheriff afila un cuchillo de untar mantequilla.', 'Hay {n} sospechosos. Y un sheriff muy aficionado a los desayunos.']],
          cFirst: [['Me llaman {who}. Alguien se ha llevado {obj}. Si lo encuentro, le abro una zanja... en el jardín, para el rosal.', 'Soy jardinero. Entre usted y yo, ando con el abono atrasado.'], ['Me llaman {who}. Falta {obj}. Aquí, forastero, las cosas desaparecen, y las personas también. Pero casi siempre vuelven.', 'Casi.']],
          cTell: [['Anoche, al caer el sol, desapareció {obj}. Estaba en {loc}. Y junto a la puerta, una pala con tierra fresca.', 'Es del enterrador. Dice que es para los maceteros. Y no hay maceteros.'], ['Anoche, al caer el sol, desapareció {obj}. Estaba en {loc}. En la arena, dos surcos como de algo pesado arrastrado.', 'Era el carro de la leche. Pesaba, eso sí, lo suyo.']],
          chill: [['Justicia hecha. Pero esa noche, el viento trajo desde la colina un acordeón sin acordeonista.', 'El alcalde dice que es el viento. El viento no suele pedir pasodobles.'], ['Justicia hecha. Pero en el cementerio apareció una lápida nueva con un nombre que nadie del pueblo conoce.', 'Seguro que el enterrador se ha equivocado de pueblo. Otra vez.']],
        },
      },
      espias: {
        inquietante: {
          titles: ['Expediente Cenizas: {obj}', 'Alto secreto y poca luz: {obj}'],
          blurbs: [['{cli} pide ayuda en clave: ha desaparecido {obj}. Y en el buzón apareció una nota sin sello que dice solo «Te estamos viendo».', 'Entre {n} sospechosos hay un topo, un confidente y alguien con prismáticos que dice que «observa pájaros».'], ['Ha desaparecido {obj}, y el teléfono del cliente suena siempre a la misma hora sin que nadie llame.', 'Entre {n} sospechosos hay un topo y una centralita que, curiosamente, ha dado de baja a todos.']],
          cFirst: [['Soy {who}. Agente, escuche: han sustraído {obj}. Y alguien ha limpiado mis huellas de mi propia puerta.', 'Quizá fui yo. Soy muy limpio. Pero, ¿tanto?'], ['Soy {who}. Han sustraído {obj}. Y desde anoche el periódico llega con el crucigrama ya hecho, y con mi letra.', 'Yo escribo con la izquierda. Y los crucigramas, para mí, son un delito.']],
          cTell: [['Anoche se esfumó {obj}. Estaba en {loc}. Había una silla pegada a la ventana, orientada hacia dentro.', 'Llevo meses sin visitas. Se lo comento por si es relevante.'], ['Anoche se esfumó {obj}. Estaba en {loc}. En el pasillo, el eco de unos pasos repetía los míos medio segundo más tarde.', 'Los vecinos creen que es mi eco. Que, evidentemente, me espía.']],
          chill: [['Misión cumplida. Este informe se autodestruirá en cinco, cuatro... Pero el reloj de pared siguió contando: tres, dos, uno.', 'Era el papel. Aquí todo se autodestruye menos las facturas.'], ['Misión cumplida. Al salir, un coche negro sin matrícula esperaba con el motor en marcha. Nos saludó con las luces.', 'Eran los del seguro. Siempre llegan con luces.']],
        },
        macabro: {
          titles: ['Protocolo Funeral: {obj}', 'Quien lee este expediente ya no existe: {obj}'],
          blurbs: [['{cli} pide ayuda en clave: ha desaparecido {obj}. Su último agente de enlace también, y con la placa puesta.', 'Entre {n} sospechosos hay un topo, un doble y un jardinero con herramientas muy bien afiladas.'], ['Ha desaparecido {obj} y, con él, la memoria de dos testigos. Los dos recuerdan perfectamente que no vieron nada.', 'Entre {n} sospechosos hay un topo y un barbero con demasiado interés en el cuello de los clientes.']],
          cFirst: [['Soy {who}. Han sustraído {obj}. Mi anterior contacto desapareció esta semana. Dicen que se fue de vacaciones... sin maleta.', 'Y sin cabeza para esas cosas. Siempre fue muy despistado.'], ['Soy {who}. Han sustraído {obj}. Si no me encuentran mañana, busquen en la despensa. Está todo en orden.', 'Es una broma de oficio. Aunque le recomiendo mirar. Hay espacio.']],
          cTell: [['Anoche se esfumó {obj}. Estaba en {loc}. En la nevera, una nota: «No abrir hasta que yo lo diga». Sin firma.', 'La he abierto. Era un yogur. Pero hubo un momento de mucha tensión.'], ['Anoche se esfumó {obj}. Estaba en {loc}. En el suelo, un círculo limpio, como si alguien hubiera fregado justo donde cayó... algo.', 'Es mi manía. Friego donde cae. Y sobre todo donde cayó.']],
          chill: [['Misión cumplida. Este informe se autodestruirá. Y quien lo haya leído, por seguridad, deberá olvidar su propio nombre.', 'Lo han intentado. Se acuerda de todo. Qué fastidio de burocracia.'], ['Misión cumplida. Pero en el archivo central, el expediente tiene ahora una página extra con la foto de quien lo abre.', 'Está muy bien enfocada. Alguien nos ha cogido cariño.']],
        },
      },
      cuento: {
        inquietante: {
          titles: ['El bosque que no devolvía {obj}', 'Había una vez {obj}, y un camino que no volvía'],
          blurbs: [['Érase una vez {cli}, a quien una noche sin luna le desapareció {obj}. El bosque estaba más callado de lo normal, y eso nunca es buena señal.', 'Había {n} sospechosos y un búho que, curiosamente, no dijo ni «uh».'], ['Érase una vez {cli}, que perdió {obj} junto a un camino que no llevaba a ningún sitio.', 'Había {n} sospechosos, todos con una excusa mágica y un espejo que no devolvía el reflejo.']],
          cFirst: [['Soy {who}. Una noche me desapareció {obj}. Y desde entonces mi sombra me sigue con retraso.', 'Los sabios dicen que es normal. Se lo he dicho a ella y se ha enfadado.'], ['Soy {who}. Una noche me desapareció {obj}. En el bosque cantaba alguien, pero no era un pájaro.', 'Eran los vecinos. El coro del pueblo ensaya con muchas ganas.']],
          cTell: [['Una noche sin luna desapareció {obj}. Estaba en {loc}. Y en el suelo, un rastro de migas que no iba hacia ningún lado.', 'Se las comieron los pájaros. Y ahora los pájaros no me hablan.'], ['Una noche sin luna desapareció {obj}. Estaba en {loc}. El espejo del pasillo, a las tres, mostró una habitación que no es la mía.', 'Con mejor decoración, la verdad. Pero no era la mía.']],
          chill: [['Y colorín colorado, este caso se ha acabado. Pero cuando cerraron el libro, una página más se pasó sola.', 'Por eso nadie debería prestar libros: siempre vuelven con ideas nuevas.'], ['Y colorín colorado, este caso se ha acabado. Pero en el bosque, una lucecita siguió al grupo hasta la puerta y se quedó esperando.', 'Seguro que era una luciérnaga. Con mucha paciencia. Y sin cita.']],
        },
        macabro: {
          titles: ['Los hermanos que no volvieron a por {obj}', 'El lobo ya no hace dieta: {obj}'],
          blurbs: [['Érase una vez {cli}, a quien una noche sin luna le desapareció {obj}. Cerca de la casita de caramelo, la puerta del horno estaba demasiado limpia.', 'Había {n} sospechosos y una bruja que repetía «yo solo cocino».'], ['Érase una vez {cli}, que perdió {obj}. Y el espejo mágico, preguntado, solo respondió: «Yo no he visto nada. Ni quiero».', 'Había {n} sospechosos y un espejo con muy poca vocación de testigo.']],
          cFirst: [['Soy {who}. Una noche me desapareció {obj}. El último que lo buscó entró en el bosque cantando y salió tarareando otra canción.', 'Desde entonces no habla. Solo tararea. Es una mejora.'], ['Soy {who}. Una noche me desapareció {obj}. Mi abuela siempre decía: «no mires bajo la cama».', 'Yo miré. Había otra abuela. Pero era muy simpática.']],
          cTell: [['Una noche sin luna desapareció {obj}. Estaba en {loc}. Y en el horno, esta mañana, quedaba la huella de un zapato pequeño.', 'Era de la bruja. Dice que «comprobaba la temperatura». Con zapato.'], ['Una noche sin luna desapareció {obj}. Estaba en {loc}. En el pozo, alguien susurraba mi nombre y pedía que no se lo dijera a nadie.', 'Le prometí que no. Se lo cuento solo a usted. Es secreto de pozo.']],
          chill: [['Y colorín colorado, este caso se ha acabado. Pero al fondo del bosque una voz cantó la última estrofa con una letra que nadie le había enseñado.', 'La bruja dice que no fue ella. Pero se sabe la letra.'], ['Y colorín colorado, este caso se ha acabado. En la última página alguien había dibujado una puerta pequeña. Se abrió sola, y asomó una mano que saludaba.', 'Era educada. Eso, en un cuento, ya es raro.']],
        },
      },
    },
    traits: {
      nervioso: {
        inquietante: [['Ay, qué nervios... Anoche oí pasos en la cocina. Cuando entré, el horno estaba caliente. Y yo lo había apagado.', '(traga saliva) Bueno, ¿quiere un bollo?'], ['Es que esta noche me ha parecido ver a alguien en la ventana. Y vivo en un primero. Con rejas.', 'Seguro que era una paloma muy alta.'], ['No quiero asustarle, pero {other} lleva días hablando solo... y a veces le contesta alguien.', 'Yo creo que tiene un loro. Un loro muy educado.']],
        macabro: [['Anoche oí que alguien arrastraba algo pesado por el sótano... y luego, cómo lo ordenaba por colores.', '(se ríe sin ganas) Perdone, estoy tan nervioso que ya no sé si es miedo o es hambre.'], ['¿Raro? Esta mañana había una silla puesta frente a mi cama. Con una taza de té. Todavía caliente.', 'Y yo no bebo té. Pero me lo he bebido. Estaba bueno.'], ['(en voz muy baja) Cada vez que {other} se ríe, la bombilla del pasillo parpadea. Y deja de reírse cuando se apaga.', '(mira al techo) Lo cuento por si alguien quiere apagar la luz. Yo, desde luego, no.']],
      },
      soberbio: {
        inquietante: [['¿Raro, yo? Nada me inquieta. Salvo que anoche alguien movió mi sillón. Un milímetro. Lo noto.', 'Un milímetro, y todo un escándalo.'], ['Anoche un eco repitió mis palabras en el pasillo. Con peor dicción.', 'Una falta de respeto. Lo he denunciado. Aún no me contesta.'], ['Todo es muy normal. Salvo que el reloj lleva dos días marcando mi hora de nacimiento. Un detalle encantador.', 'Probablemente me tiene cariño. Los relojes también tienen buen gusto.']],
        macabro: [['¿Algo raro? Yo no tengo miedo. Pero anoche apareció un cuchillo clavado en mi pan. Sin nota. Un descuido de {other}, seguro.', 'Lo imperdonable: ni una nota de disculpa.'], ['Yo nunca me inquieto. Pero la sombra de {other} se quedó en la pared un minuto entero después de que {other} se fuera.', 'Voy a pedirle a la sombra que se identifique. Con educación. Soy muy correcto con los difuntos.'], ['Se lo digo sin temblar: anoche el espejo me llamó por mi nombre de pila. Que no usa nadie desde que se fue mi madre.', 'Le dije que era Excelentísimo. Se calló. Qué buena educación tienen los espejos.']],
      },
      evasivo: {
        inquietante: [['¿Algo raro? Pues... ¿raro como raro-raro? Es que oí un ruido en el almacén. Pero ya sabe, los ruidos... ¿no?', '(mira a otro lado) Oiga, ¿eso de ahí es una pared?'], ['Yo no soy de ver cosas. Pero la puerta del fondo estaba abierta. Yo la dejé cerrada. O eso creo. ¿Qué día es hoy?', 'No sé de qué me habla, pero me ha entrado mucha hambre.'], ['A mí no me pregunte. Aunque, si me apura, {other} estuvo anoche mirando por la ventana... hacia dentro.', 'Quiero decir: ¡hacia fuera! No sé por qué he dicho dentro.']],
        macabro: [['No sé nada. Y si lo supiera, no sabría contárselo. Pero hay una zona del sótano a la que no bajamos. Por... higiene.', '(sonríe) Una higiene muy sana.'], ['¿Raro? Digamos que anoche alguien arrastró algo envuelto en sábanas. Y que luego fregó. Y que no fui yo, porque yo no friego.', 'Nunca. Es un principio.'], ['Me va a preguntar por la nevera grande. Pues no, no hay nada. Yo no he mirado. ¡Y usted tampoco debería!', '(se ríe) Por el frío, quiero decir. Es sanísimo evitarlo.']],
      },
      amable: {
        inquietante: [['Ay, qué amable por preguntarlo. Pues sí: anoche alguien me deseó buenas noches desde el pasillo... y no era nadie que yo conozca.', 'Qué detalle. Le respondí «igualmente». Por educación.'], ['Ahora que lo dice: el espejo de la entrada me sonríe antes de que yo le sonría.', 'Tiene muy buena educación, aunque a veces me adelanta.'], ['La verdad: huele a flores recién cortadas en el rincón donde no hay flores. Cada noche, a las tres.', 'Es muy considerado. Casi nunca se le ve.']],
        macabro: [['¡Qué bien que pregunte! Mire, anoche, al cerrar, alguien me dio las gracias desde el sótano. Muy bajito. Dos veces.', 'Qué gente tan agradecida. Aunque ahí abajo yo no tengo a nadie.'], ['Aquí me quieren mucho. Demasiado, a veces. Fíjese cómo me miran cuando se apaga la luz.', '(sonríe) Se les ve la sonrisa aunque no haya luz. Qué cosa más bonita.'], ['Todos son un encanto. Hasta {other}, que ayer me preparó un té y me dijo «bébetelo todo», despacio, mirando el reloj.', 'Estaba delicioso. Y me entró un sueño... ¡qué atento!']],
      },
      seco: {
        inquietante: [['Anoche hubo pasos. No eran míos. Los míos son más cortos.', 'Es una cuestión de zancada.'], ['Hubo una luz en el sótano. Se apagó cuando bajé.', 'Es tímida. Como yo. Nos llevamos bien.'], ['No dormí. La puerta se abrió sola. Dos veces. Con educación.', 'No dije nada. Para no fomentar.']],
        macabro: [['No mire en el sótano.', '... Era una broma. ... Quizá.'], ['Si oye que le llaman desde el armario, no conteste. Si contesta, no cierre.', 'Eso me dijo mi abuela. Y ahora vive en el armario.'], ['Anoche vi a alguien entrar en la cocina. Salí a ver. La cocina estaba vacía. El horno, no.', '(se encoge de hombros) Hay quien lo llama sobrecalentamiento.']],
      },
    },
    ally: {
      serio: {
        inquietante: [['En mis años de servicio he visto cosas que no constan en el informe. Esta noche he oído una que no consta ni en mi imaginación.', 'Por lo demás, todo en orden. No se asuste: es lo normal.'], ['El expediente indica silencio absoluto. Pero a las 3:12 sonó algo parecido a un bostezo.', 'Se investigará. Probablemente era yo.']],
        macabro: [['Entre agentes: no se me ocurre bajar solo al sótano. Es un protocolo. Lo acabo de inventar.', 'Pero protocolo es protocolo.'], ['Se lo digo con rigor profesional: esa mancha del suelo no figura en los planos. Ni en la tintorería.', 'Por si acaso he puesto a mi compañero a oler. Es el único con nariz.']],
      },
      torpe: {
        inquietante: [['¿Algo raro? Mi linterna se enciende sola. Pensé que era un fantasma, pero era el botón.', 'Aun así, ha sido mucho rato sin tocarla.'], ['Esta noche he oído susurros detrás del archivador. Los he seguido... y eran mis propias rodillas.', 'Soy muy joven para esos ruidos.']],
        macabro: [['Anoche vi una sombra en la ventana. Entré en pánico y salí corriendo... a por mi café.', 'Al volver, la sombra se lo había bebido. Qué mala educación.'], ['Hay un charco oscuro en la esquina. Lo he pisado dos veces para ver qué era. Sigue sin ser nada. Eso me preocupa muchísimo.', 'No sé qué es peor: que sea nada o que sea algo.']],
      },
      colega: {
        inquietante: [['Entre nosotros: a esta hora el edificio suena a gente. Y no hay gente. Solo nosotros. Y yo ya me he comido el bocadillo.', 'Así que o hay otro bocadillo... o hay otro nosotros.'], ['¿Ha notado que las luces parpadean cuando nadie habla? Yo callo siempre que puedo, por probar.', 'Pues se quedan fijas. Como si escucharan.']],
        macabro: [['Mire, amigo: si oye al fondo un arrastrar de cadenas, no se asuste. Es que hoy toca limpieza de cadenas.', 'Y si no toca, avíseme. Que me he dejado la cena en el sótano.'], ['Hace años, en un caso así, el único testigo desapareció una noche. Se llamaba Paco. Dejó una nota: «Vuelvo enseguida».', 'De eso hace seis años. Aún nos debe el desayuno.']],
      },
    },
  };

  // ---- 4C-4b: OBJETOS DE AMBIENTE según el `mood` (los coloca compile.js con su propio azar seed ^ 0xa7405; solo decoración, nunca cambian hechos ni pistas).
  // puddle = charco de mermelada o de salsa · stain = mancha oscura sin detalle (macabro, nunca gore) · chair = silla que se mece · window = sombra que asoma en una ventana.
  // Los números son la probabilidad de cada uno; `second` = probabilidad de un segundo charco o mancha. Silla y ventana solo en interiores.
  G.GEN_DATA.compile.atmos = {
    mood: {
      claro: { puddle: 0.5, stain: 0, chair: 0, window: 0 },
      inquietante: { puddle: 0.6, stain: 0, chair: 0.55, window: 0.55 },
      macabro: { puddle: 0, stain: 1, chair: 0.8, window: 0.8 },
    },
    second: 0.35,
    puddles: ['decal_jam', 'decal_sauce'], stain: 'decal_stain', chair: 'rocking_chair', window: 'window_dark',
  };
  // ---- 4C-4c-2: SITUACIONES MACABRAS y GIRO DEL TESTIGO (los coloca compile.js con azares PROPIOS seed ^ 0x4c4c2 y seed ^ 0x4c4c3; solo TEXTO y objetos de decoración: no tocan hechos, pistas ni la biblia, así que GEN_VERSION sigue en 5).
  // sit = objetos examinables sin pista (susto + remate, genéricos: sin personajes ni lugares del caso). `soft` = valen también en inquietante. chance = probabilidad de la primera; second = de una segunda (solo macabro).
  // giro = testigo (solo macabro) que insiste en haber visto a alguien que ya no estaba: tema «¿Vio a alguien más?» de un sospechoso o del cliente, sin nombres ni datos del caso.
  G.GEN_DATA.compile.macabro = {
    sit: {
      chance: { inquietante: 0.45, macabro: 1 }, second: 0.5, done: 'Ya lo has examinado.',
      // GEN_VERSION >= 7 (reparto de herramientas, cp. 185): nº de situaciones por caso = [[cantidad, peso], …], en TODOS los casos (mín 1, máx 3; más casos con 2; provisional 25/50/25, a ajustar al medir). Sin escribir situaciones nuevas.
      counts: [[1, 25], [2, 50], [3, 25]],
      items: [
        { sprite: 'crate', label: 'Cajón con triple candado', text: ['Tres candados, dos cadenas y un cartel: «NO ABRIR. EN SERIO». Lo abres igualmente y huele a frío y a secretos.', 'Está lleno de tartas de prueba, todas con una notita que dice «perdón».'] },
        { sprite: 'barrel', label: 'Barril que gotea', soft: true, text: ['Gotea despacio un líquido oscuro, justo al ritmo de tu pulso.', 'Es salsa de arándanos. Lleva así desde 1987 y nadie se atreve a cerrar el grifo.'] },
        { sprite: 'plant', label: 'Maceta con tierra removida', soft: true, text: ['La tierra está recién removida y hay una cruz de palitos clavada en medio.', 'Es la tumba de un cactus. Murió de éxito y de falta de riego.'] },
        { sprite: 'sack_a', label: 'Saco que se mueve', text: ['El saco se encoge un poco cuando lo miras, como si aguantara la respiración.', 'Dentro hay un gato dormido y una calculadora. El gato ya había hecho las cuentas.'] },
        { sprite: 'locker', label: 'Taquilla entreabierta', text: ['Dentro hay un abrigo que todavía está caliente y un cartel de «Vuelvo en cinco minutos».', 'Lleva ahí desde el martes. El abrigo no tiene prisa; el cartel, menos.'] },
        { sprite: 'drawer', label: 'Cajón de las fotos', soft: true, text: ['Hay fotos de la oficina, todas hechas desde dentro del armario.', 'Las hizo el de la limpieza, que «quería otro ángulo». Hay que reconocer que salen bien.'] },
        { sprite: 'table', label: 'Mesa puesta para alguien', text: ['Hay un plato, cubiertos y una servilleta doblada con esmero, y ninguna silla. Nadie recuerda quién puso la mesa.', 'Junto al plato, una nota: «Cumpleaños de nadie». Sin velas, que da mal rollo.'] },
        { sprite: 'sack_b', label: 'Sacos con huellas', soft: true, text: ['Unas huellas pequeñas suben por los sacos y se paran en lo alto, donde no hay nada.', 'Allí arriba hay una galleta mordida y un ratón que ha decidido no declarar.'] },
      ],
    },
    giro: {
      chance: 0.7, label: '¿Vio a alguien más?',
      pairs: [
        ['Había un señor con sombrero sentado en la esquina, mirándonos a todos. Fui a ofrecerle un café y ya no estaba.', 'El café me lo bebí yo. Aquí no se desperdicia nada.'],
        ['Vi a alguien pasar por el pasillo muy despacio y sin hacer ruido. Lo seguí y el pasillo no tenía salida.', 'Me quedé un rato por si volvía. Todavía lo espero, por cortesía.'],
        ['Alguien me dio las buenas noches justo detrás de mí. Me giré y solo había pared. La pared, educada, no contestó.', 'Le devolví el saludo igualmente: nunca se sabe quién escucha.'],
        ['Había una cara en la ventana. Salí a verla y solo quedó el vaho y un «hola» escrito con el dedo.', 'Con muy buena letra, además. Se agradece la caligrafía.'],
        ['Conté a los presentes y salían uno de más. Fui a buscar al que sobraba y volvió a salir la cuenta de siempre.', 'Desde entonces solo cuento hasta donde me conviene.'],
        ['Vi a alguien riéndose en el fondo de la sala, sin hacer ni un ruido. Al acercarme era una percha con gabardina.', 'La percha, eso sí, tenía mala cara.'],
        ['Alguien me tocó el hombro dos veces. Detrás no había nadie, pero se notaba que tenía prisa.', 'Le cedí el paso. Hay que ser educado, aunque sea con las corrientes de aire.'],
        ['Vi una sombra caminando sin su dueño. Se paró, me miró y siguió su camino, muy digna.', 'Era una sombra con clase. Ya no quedan muchas.'],
      ],
    },
  };
  // ---- 4D-2: RELLENO DE DURACIÓN (capítulos y duración). compile.js, con azar PROPIO (seed ^ 0x4d2d2), añade tras todo lo demás objetos «curiosidad» (examinables, sin pista, con remate de Rex o Luna) y temas de charla
  // a los personajes hasta que la duración estimada del caso (medidor, src/meter.js) llegue a `targetMin`; si ya llega, no añade nada. No cambian hechos, pistas ni fuentes. `maxCurioPerRoom` / `maxChatPerNpc` son topes.
  // Textos genéricos (sin personajes ni lugares del caso) y válidos en los tres ambientes. Los sprites son los de las baldosas 1×1 ya usadas por plantillas y situaciones.
  // ---- 3-bis 2/3 (GEN_VERSION >= 6): PERFIL DE DURACIÓN POR NIVEL (decisión del usuario, 22 oct, opción A). La duración de cada nivel es un OBJETIVO con mediana y rango aceptable que SE SOLAPAN
  // (un jugador rápido de Difícil puede acabar a la vez que uno lento de Normal); se exige que la mediana suba con el nivel y que casi ningún caso salga de su rango.
  //  · `goal` = objetivo del JUEGO COMPLETO (mediana y rango ~90 %; se alcanzará con B2 = más lugares y C1 = más profundidad).
  //  · `today` = escala PROVISIONAL con el contenido de hoy (5 lugares, 32 curiosidades; techo ~31 min): es la que usan el relleno, el medidor y la nota hasta B2/C1.
  //  · `suspects` / `extraPlaces`: tamaño del reparto y nº de lugares además del del robo (0-4 → 1-5 lugares). `extraPlacesV7` (GEN_VERSION >= 7, 4F-0b 3/4-b): lo mismo, FIJO por nivel (3/4/5 extra = 4/5/6 salas) y con el Despacho en el sorteo. `targetMin`: hasta dónde rellena compile.js.
  // CL-5a (GEN_VERSION >= 7, decisión del usuario 25 oct, PROPUESTA_CL5 §7): `targetMinV7` = objetivo del relleno con la receta v7 (4F-0b 3/4-d, cp. 266: Fácil 24 · Normal 32 · Difícil 39; antes 23,5 · 31 · 34 con el medidor viejo; calibrado midiendo con el medidor v7 ajustado contra el bot, que ya no va 8-12 % por debajo) y `maxChatPerNpcV7` = tope de charlas de detalle por personaje en ese nivel (Difícil 3; el resto usa `extra.maxChatPerNpc`).
  // Con GEN_VERSION 5 nada de esto se usa (los casos salen idénticos).
  // 3-bis 2/3 · calle (GEN_VERSION >= 6): «el caso lleva escena de calle» es una DECISION PROPIA (azar seed ^ 0x57ee7, G.wantsStreet en gen_truth.js), no un subproducto del nº de salas.
  //  `chance` = probabilidad por caso (igual en los 3 niveles; meta de huella 25-35 %); `place` = lugar cuyas variantes `scene: 'calle'` se usan. Si toca calle, el lugar entra seguro en el caso;
  //  si no toca, ese lugar usa solo variantes de interior. Con GEN_VERSION 5 no se usa (los casos salen idénticos).
  G.GEN_DATA.compile.street = { chance: 0.3, place: 'callejon' };
  G.GEN_DATA.compile.levels = {
    facil:   { goal: { median: 24, range: [20, 28] }, today: { median: 23.5, range: [20, 28] }, suspects: [4, 6], extraPlaces: [2, 4], extraPlacesV7: [3, 3], targetMin: 23.5, targetMinV7: 24 },
    normal:  { goal: { median: 30, range: [25, 36] }, today: { median: 27,   range: [22, 32] }, suspects: [5, 6], extraPlaces: [3, 4], extraPlacesV7: [4, 4], targetMin: 27, targetMinV7: 32 },
    dificil: { goal: { median: 38, range: [31, 46] }, today: { median: 30,   range: [24, 36] }, suspects: [6, 6], extraPlaces: [4, 4], extraPlacesV7: [5, 5], targetMin: 30, targetMinV7: 39, maxChatPerNpcV7: 3 },
  };
  // TIEMPOS-1 (GEN_VERSION >= 7, 27 oct, cp. 261; solo DATOS, el compilador no los lee): duración OFICIAL por dificultad en minutos (decisión del usuario, cp. 170; provisional hasta 4D-3/Z1).
  //  `levels[nivel]` = { median, range: [mínimo, tope] } con rangos CONTIGUOS (sin solape) y medianas separadas 8 min; `floor` = mínimo absoluto (Fácil) y `ceiling` = techo duro (Difícil).
  //  Los minutos NO se enseñan al jugador. El objetivo del RELLENO sigue siendo `targetMinV7` (en minutos del medidor, calibrado midiendo en 4F-0b 3/4-d con el medidor v7 ajustado (el medidor ya coincide con el bot, error medio ≈ 0 %): 24 · 32 · 39 dan, con 300 casos por nivel, medianas reales 23,9 · 31,7 · 39,5, Fácil 20,6-26,8, Normal 27,4-35,9, Difícil 36,1-44,4, 0 casos > 45 y 0 atascos);
  //  NO se iguala a la mediana: subir Difícil a 40 empujaría su máximo (44,3) por encima del techo. TIEMPOS-2 hace que `quality.js` lea estos rangos; v6 sigue con `goal`/`today`.
  G.GEN_DATA.compile.durationV7 = {
    floor: 20, ceiling: 45,
    levels: { facil: { median: 24, range: [20, 28] }, normal: { median: 32, range: [28, 36] }, dificil: { median: 40, range: [36, 45] } },
  };
  G.GEN_DATA.compile.extra = {
    targetMin: 23.5, perCurio: 19, maxCurioPerRoom: 9, maxChatPerNpc: 2, done: 'Ya lo has mirado todo.',
    // 4F-0a subpaso 4: MONEDAS SUELTAS. Unas pocas curiosidades (la 2.ª, la 4.ª y la 6.ª que se crean: sin azar, no mueven nada más) esconden monedas (efecto `money`): en total `n` × `amount` = 15. Solo se cobran si el caso se resuelve (regla P1, logic.js reward()).
    coins: { n: 3, every: 2, amount: 5, lines: ['¡Y debajo había unas monedas olvidadas! (+{n})', 'Entre el polvo brilla algo: ¡monedas sueltas! (+{n})', 'Rex las huele y Luna las recoge. ¡Monedas! (+{n})', 'Alguien las perdió y nadie las echará de menos. ¡Monedas! (+{n})'] },
    meter: { base: -43.04, perTopic: 24.67, perStep: 25.66, perRoom: 33.36 }, // respaldo si G.METER_CFG no está cargado (se actualiza con tools/meter_fit.js)
    curios: [
      { sprite: 'crate', label: 'Caja de «cosas útiles»', text: ['Pone «cosas útiles» y dentro hay un zapato, una cuchara y el manual de instrucciones de otra cosa.', 'Ni un detective lo resuelve: es el cajón de sastre más honesto que he visto.'] },
      { sprite: 'barrel', label: 'Barril de pepinillos', text: ['Un barril con una etiqueta: «Pepinillos de la suerte». Dentro, un pepinillo con gafas.', 'No da suerte, pero tiene pinta de saber de qué va todo esto.'] },
      { sprite: 'plant', label: 'Planta con nombre', text: ['La maceta lleva un cartelito: «Gertrudis. No se le habla de política».', 'Se nota que ha vivido mucho y que ha escuchado demasiado.'] },
      { sprite: 'sack_a', label: 'Saco misterioso', text: ['Un saco con un sello: «Contenido: lo que usted prefiera».', 'Con ese eslogan, la empresa o quiebra o conquista el mundo.'] },
      { sprite: 'sack_b', label: 'Saco de harina medio vacío', text: ['El saco tiene una nota: «Se me ha caído un poco, perdón». Hay un caminito blanco hasta la puerta.', 'Un rastro clarísimo... hacia la hora del café, que es otro caso.'] },
      { sprite: 'locker', label: 'Taquilla de objetos perdidos', text: ['Dentro hay un paraguas, un violín y una nota: «Lo reclamaré mañana». Fecha: 1994.', 'El mañana, en este sitio, es un concepto flexible.'] },
      { sprite: 'drawer', label: 'Cajón de las cosas raras', text: ['Hay llaves que no abren nada, pilas sin sobrino y la foto de alguien que sonríe con demasiada seguridad.', 'Cada objeto tiene derecho a su propio misterio. Este, a varios.'] },
      { sprite: 'table', label: 'Mesa con un tres en raya', text: ['Hay un tres en raya empezado, con una ventaja enorme para las cruces.', 'Quien llevaba los círculos se fue sin despedirse. Mala perdedora, o muy lista.'] },
      { sprite: 'stool', label: 'Taburete cojo', text: ['Cojea de una pata y alguien le ha puesto un posavasos doblado debajo, con mucho cariño.', 'Una reparación muy discreta. Funciona hasta que alguien pregunta.'] },
      { sprite: 'trophy', label: 'Trofeo «Mejor Empleado»', text: ['El trofeo dice «Mejor Empleado del Mes de Marzo». De 2009.', 'Desde entonces no ha habido nadie a su altura. O ningún marzo.'] },
      { sprite: 'crate', label: 'Caja con agujeros', text: ['Tiene agujeros por todos lados y un cartel: «Frágil. Pero con carácter».', 'Dentro solo hay silencio y una lechuga con cara de pocos amigos.'] },
      { sprite: 'barrel', label: 'Barril con altavoz', text: ['Alguien ha metido un altavoz en un barril y suena una canción muy suave. Casi un suspiro.', 'La acústica es increíble. El resto del local, no tanto.'] },
      { sprite: 'plant', label: 'Planta de plástico', text: ['Es de plástico y aun así tiene hojas secas: alguien se las ha pegado para darle realismo.', 'Hay una dedicación que no se aprende, se hereda.'] },
      { sprite: 'sack_a', label: 'Saco con un letrero', text: ['El letrero dice «Prohibido sentarse». Debajo hay una marca de trasero con muy buen gusto.', 'La ley es la ley. Y el cojín, un derecho adquirido.'] },
      { sprite: 'sack_b', label: 'Saco de patatas con opiniones', text: ['Alguien ha escrito en el saco: «Esta patata tiene una coartada».', 'Y no le falta razón: no se ha movido en toda la tarde.'] },
      { sprite: 'locker', label: 'Taquilla con candado de bici', text: ['El candado es de bicicleta y la taquilla no tiene puerta. Seguridad de última generación.', 'Lo que nadie entiende es por qué el candado está cerrado.'] },
      { sprite: 'drawer', label: 'Cajón con instrucciones', text: ['Dentro hay un papel: «Instrucciones para abrir el cajón: ábralo». Y ya lo has hecho.', 'Sin ceremonia ni cuenta atrás. Los mejores manuales son así de cortos.'] },
      { sprite: 'table', label: 'Mesa con una taza', text: ['Hay una taza con la inscripción «Mejor abuela del mundo» y, dentro, un clip.', 'Un gran contraste entre ternura y oficina.'] },
      { sprite: 'stool', label: 'Taburete con cojín', text: ['Tiene un cojín bordado con la frase «Aquí mando yo».', 'Lo ha bordado un gato, está claro. Hay pelos.'] },
      { sprite: 'trophy', label: 'Copa polvorienta', text: ['«Campeón de Dominó por Parejas». Hay una sola copa y un nombre tachado con rotulador.', 'Hay muchas formas de ganar. Esta es la de «y que no se sepa».'] },
      { sprite: 'crate', label: 'Caja con una nota', text: ['Hay una nota pegada: «Vuelvo enseguida». Está amarilla y se le han caído los bordes.', 'Lo de «enseguida» es muy relativo. Para quien espera, claro.'] },
      { sprite: 'barrel', label: 'Barril lleno de paraguas', text: ['Está lleno de paraguas de todos los colores y ninguno es del mismo dueño.', 'Es el barril más democrático de la ciudad: aquí llueve para todos.'] },
      { sprite: 'plant', label: 'Helecho con auriculares', text: ['Un helecho con unos auriculares puestos y un cartel: «Escuchando música. No molestar».', 'Se nota que le va el jazz, porque se mueve un poquito.'] },
      { sprite: 'sack_a', label: 'Saco con mensaje', text: ['En el saco pone «Esto no es un saco». Debajo, en letra pequeña: «Sí lo es».', 'Las ideas, a veces, necesitan una segunda opinión.'] },
      { sprite: 'drawer', label: 'Cajón de las tijeras', text: ['Hay tres tijeras y un cartel: «Devolver. Hablo en serio». Una está atada a la mesa con una cuerda.', 'Si eres tijera y estás leyendo esto, tienes un problema de confianza.'] },
      { sprite: 'locker', label: 'Taquilla con pegatinas', text: ['Está llena de pegatinas de gatitos, de estrellas y una de «Yo amo el papeleo» que nadie se explica.', 'Hay gustos para todo. Incluso para los formularios.'] },
      { sprite: 'table', label: 'Mesa de reuniones', text: ['Un cartel dice «Reunión a las 5». Debajo, otro: «Cancelada». Y debajo: «Cancelada la cancelación».', 'Aquí manda el que tenga más pegamento.'] },
      { sprite: 'stool', label: 'Taburete rosa', text: ['Alguien lo ha pintado de rosa con mucha ilusión, hasta que se acabó la pintura.', 'Un trabajo a medias, pero con el corazón entero.'] },
      { sprite: 'trophy', label: 'Placa conmemorativa', text: ['La placa dice: «A quien encuentre esta placa: enhorabuena, ya está encontrada».', 'Hay que ser muy valiente para escribir eso. Y estar muy aburrido.'] },
      { sprite: 'crate', label: 'Cajón con un mapa', text: ['Lleva pegado un mapa del tesoro con una X enorme y la palabra «Aquí».', 'La X está justo encima del propio cajón. Los mapas modernos van a lo seguro.'] },
      { sprite: 'barrel', label: 'Barril con candado de adorno', text: ['Tiene un candado precioso, con filigrana, sin llave y sin cierre. Solo para presumir.', 'Es el candado más inútil del barrio, y eso que hay mucha competencia.'] },
      { sprite: 'plant', label: 'Maceta con un cartel', text: ['El cartel dice «Prohibido pisar». La maceta está en medio del paso y todo el mundo la rodea con respeto.', 'Es el cartel más obedecido de la historia. Nadie se atreve a preguntar por qué.'] },
    ],
    // CL-5b (GEN_VERSION >= 7, solo Difícil): +8 curiosidades NUEVAS (banco 32 → 40; decisión del usuario 25 oct, PROPUESTA_CL5 §7). Mismo formato y tono que `curios`; se añaden al sorteo SOLO en Difícil con v7 (v6, Fácil y Normal no cambian).
    curiosV7: [
      { sprite: 'crate', label: 'Caja de zapatos sin zapatos', text: ['La caja dice «Zapatos». Dentro hay un calcetín solitario y una nota: «Los zapatos se fueron de viaje».', 'Un calcetín que se quedó atrás. Es lo más triste que he visto hoy.'] },
      { sprite: 'barrel', label: 'Barril de agua de lluvia', text: ['Un letrero reza: «Agua de lluvia certificada». Hay una sola gota y una rana de adorno vigilándola.', 'La gota parece la última de su especie. La rana, su abogada.'] },
      { sprite: 'plant', label: 'Cactus abrazable', text: ['Un cactus con un cartel: «Abrazos gratis». Alguien lo ha firmado con una tirita.', 'La publicidad engañosa más valiente del edificio.'] },
      { sprite: 'sack_a', label: 'Saco de arena de playa', text: ['La etiqueta jura: «Arena de playa auténtica». Dentro hay arena, un cubito de plástico y ni una sola ola.', 'Como playa le falta mar; como saco no está nada mal.'] },
      { sprite: 'drawer', label: 'Cajón de ideas geniales', text: ['La ficha dice «Ideas geniales». Solo contiene una servilleta en la que pone: «comprar servilletas».', 'Una idea genial a medias. Las mejores siempre se quedan en la servilleta.'] },
      { sprite: 'table', label: 'Mesa con un puzle a medias', text: ['Un puzle de mil piezas con novecientas noventa y nueve en su sitio. Falta justo la del centro.', 'Siempre falta la pieza del medio. Es una ley universal, como la de la tostada.'] },
      { sprite: 'stool', label: 'Taburete de la ambición', text: ['Junto al taburete hay una marca de lápiz en la pared y una nota: «Aquí llega mi ambición».', 'La marca está muy alta. O soñaba a lo grande o quería el estante de arriba.'] },
      { sprite: 'trophy', label: 'Medalla de participación', text: ['Una medalla con el lazo mordisqueado y un texto grabado: «Por venir».', 'Premio al esfuerzo más modesto: aparecer. Hay mucha gente que no tiene este mérito.'] },
    ],
    chat: [
      ['¿Cómo se llama su perro?', 'No tengo perro. Tengo un calcetín al que llamo Roberto. Se porta mejor que muchos.'],
      ['¿Qué desayunó hoy?', 'Una tostada y una duda. La tostada estaba buenísima.'],
      ['¿Duerme bien?', 'Como un tronco. Un tronco con insomnio, pero tronco al fin y al cabo.'],
      ['¿Tiene alguna afición?', 'Colecciono tapones de todos los colores. Los de champán no, que eso es de ricos.'],
      ['¿Qué opina del tiempo?', 'Que está nublado a propósito, para que no veamos las cosas con claridad.'],
      ['¿Le gusta este barrio?', 'Mucho. Tiene calles, esquinas y un señor que dice «¡hola!» a las palomas.'],
      ['¿Qué hace en su tiempo libre?', 'Doy vueltas. A las cosas, a la manzana, a veces al mismo chiste.'],
      ['¿Tiene algún miedo?', 'A las escaleras mecánicas. No entiendo adónde van cuando se acaban.'],
      ['¿Cuál es su color favorito?', 'El que combina con el abrigo. Hoy, el verde. Mañana, ya veremos.'],
      ['¿Cree en los fantasmas?', 'Creo en los fantasmas con buenos modales. Los otros, que se vayan.'],
      ['¿Qué lee últimamente?', 'Las instrucciones de la tostadora. Tiene un final que no me esperaba.'],
      ['¿Sabe cocinar?', 'Sé hacer un huevo duro. Llevo años perfeccionando el punto.'],
      ['¿Cómo se relaja?', 'Cuento hasta diez. Si no funciona, hasta once. Es mi técnica avanzada.'],
      ['¿Cuál es su mayor logro?', 'Una vez gané un sorteo. Era el único que participaba, pero igual.'],
      ['¿Qué piensa de los detectives?', 'Que hacen demasiadas preguntas. Esto no es una crítica, es una pregunta.'],
      ['¿Ha viajado mucho?', 'Estuve en la costa una vez. Hacía tanto aire que volví más peinado.'],
      ['¿Tiene hambre?', 'Siempre. Mi estómago tiene la agenda más llena que la suya.'],
      ['¿Qué le gusta de su trabajo?', 'Lo de cobrar. Lo demás es un detalle.'],
      ['¿Le gusta la música?', 'Tarareo. Dicen que desafino, pero lo hago con convicción.'],
      ['¿Qué opina de la hora del café?', 'Es sagrada. Quien me hable antes de las diez firma bajo su propio riesgo.'],
      ['¿Tiene algún truco de la suerte?', 'Piso siempre con el pie derecho. Y si no, con el izquierdo, por si acaso.'],
      ['¿Le gustan los animales?', 'Mucho, sobre todo los que no me miran fijamente. Los gatos, no.'],
      ['¿Qué comería ahora mismo?', 'Una tarta. De la que sea. Si lleva nata, me caso con ella.'],
      ['¿Qué quería ser de pequeño?', 'Farola. Parecía un trabajo tranquilo, con vistas y sin reuniones.'],
      ['¿Qué haría con un millón?', 'Compraría un millón de cosas pequeñas. Y una grande para guardarlas.'],
      ['¿Cuál es su palabra favorita?', '«Ajá». Sirve para todo: asentir, dudar y despedirse.'],
      ['¿Está nervioso?', 'Un poco. Cuando hay detectives, hasta mi sombra se pone derecha.'],
      ['¿Algún consejo para un detective?', 'Que lleve siempre un bolígrafo. Y otro por si el primero tiene secretos.'],
    ],
  };
  // 4F-0b 2/4-c: CURIOSIDADES, TEMAS DE CHARLA Y CHARLAS GRABADAS PROPIAS DEL DESPACHO DEL DUEÑO (EN RESERVA: nadie las lee hasta 4F-0b 3/4; no tocan los bancos generales de arriba, así los casos no cambian).
  // Formato igual que `curios`, `chat` y `listen.mood.*.chats`. Reglas: nada del crimen ni de las pistas, humor con remate, sin pronombres de género del personaje, sprites que existen y caben en un hueco 1×1.
  // `curiosByPlace`: valen en los TRES ambientes (tono neutro); `chatByPlace`: lo que dice la gente de esa sala; `listenByPlace`: charlas grabadas POR AMBIENTE (a empieza y habla en las líneas 0 y 2; b en la 1 y la 3; {a}/{b} = nombres).
  G.GEN_DATA.compile.extra.curiosByPlace = {
    despacho: [
      { sprite: 'safe', label: 'Caja fuerte presumida', text: ['En la puerta hay un cartel: «Aquí dentro hay algo valiosísimo». Debajo, a boli: «Es el cartel».', 'Un tesoro de cartón, sí, pero cerrado con muchísimo estilo.'] },
      { sprite: 'armchair', label: 'Sillón del dueño', text: ['Un sillón gigante con un cojín bordado: «Hoy mando yo». El asiento conserva la forma exacta del dueño.', 'Todos lo miran con respeto. Y con ganas de sentarse en cuanto nadie mire.'] },
      { sprite: 'globe', label: 'Globo con chinchetas', text: ['Cada chincheta marca un país con buena bollería. Son casi todos. En la Antártida hay una nota: «Pendiente de abrir sucursal».', 'Ambición no le falta. Abrigo, tampoco.'] },
      { sprite: 'desk_boss', label: 'Carpeta de «Ideas geniales»', text: ['Sobre el escritorio hay una carpeta que dice «Ideas geniales». Dentro, una servilleta con una rosquilla con patas dibujada.', 'Se nota que el proyecto está en fase de desarrollo. O de siesta.'] },
      { sprite: 'portrait', label: 'Retrato con bigote', text: ['El dueño posa muy serio en el cuadro. Alguien le ha pegado un bigote de papel y, la verdad, le favorece.', 'Los ojos parecen seguirte. Es un truco de pintura. Casi seguro.'] },
      { sprite: 'drawer', label: 'Cajón de los caramelos', text: ['Pone «Prohibido abrir». Dentro hay caramelos y una lista a lápiz con todos los que lo han abierto. Es larguísima.', 'La prohibición es lo más abierto que hay en este despacho.'] },
      { sprite: 'trophy', label: 'Trofeo «Jefe del Año»', text: ['«Jefe del Año». Lo ganó el propio dueño, que fue el único participante y además el jurado.', 'Un triunfo sin discusión posible. Y sin público.'] },
      { sprite: 'table', label: 'Bandejas del correo', text: ['Hay tres bandejas: «Urgente», «No tan urgente» y «Ya veremos». La última tiene una maceta encima.', 'El sistema funciona. Lo que no sabemos es para qué.'] },
    ],
  };
  G.GEN_DATA.compile.extra.chatByPlace = {
    despacho: [
      ['¿Le gusta trabajar cerca del despacho del dueño?', 'Se está muy tranquilo. La moqueta amortigua los pasos. Y las excusas.'],
      ['¿Es verdad que la caja fuerte está vacía?', 'Dentro hay algo importantísimo. No puedo decir qué. Ni yo lo sé, la verdad.'],
      ['¿Qué opina del sillón del dueño?', 'Que es el mueble más disputado de la panadería. Nadie se ha sentado. En público.'],
      ['¿Hay mucho papeleo por aquí?', 'Una montaña. La llamo Gerardo. Cada semana crece y ya tiene vecinos.'],
      ['¿Viene mucho el dueño por aquí?', 'A veces. Entra, mira el retrato, suspira y sale. Es su forma de hacer una reunión.'],
      ['¿Qué tiene que ver el globo con la panadería?', 'Es el plan de expansión. Va por la fase de las chinchetas, que es la más larga.'],
    ],
  };
  G.GEN_DATA.compile.extra.listenByPlace = {
    despacho: {
      claro: [
        ['¿Has visto el cojín del sillón del dueño?', 'Sí. Pone «Hoy mando yo».', 'Pues hoy manda el cojín. El dueño ha salido.', 'Entonces propongo votar. Yo voto cojín.'],
        ['{b}, ¿has tocado la caja fuerte?', 'Solo para ver si estaba fuerte.', '¿Y lo estaba?', 'Mucho. Mi dedo ha perdido el debate.'],
        ['Dicen que en el cajón hay caramelos.', 'Dicen también que está prohibido abrirlo.', '¿Y tú cómo lo sabes?', 'Lo pone el cartel. Y el envoltorio, que ya me lo he leído.'],
      ],
      inquietante: [
        ['¿Esa lámpara del escritorio parpadeaba antes?', 'Siempre. Es una lámpara nerviosa.', 'Pues ahora parpadea con ritmo.', 'Que se aclare, entonces. O dice algo, o apaga y nos deja en paz.'],
        ['El retrato del dueño tiene hoy los ojos distintos.', 'Será la luz.', 'La luz está apagada, {b}.', 'Entonces será el aburrimiento. Los retratos se aburren muchísimo.'],
        ['{b}, ¿por qué mira el sillón hacia la puerta?', 'Porque alguien lo ha girado.', 'Anoche miraba a la ventana.', 'Pues que se decida. Un sillón que cambia de opinión me da más miedo que uno quieto.'],
      ],
      macabro: [
        ['Dentro de la caja fuerte se oye un golpecito. Dos. Tres.', 'Será el viento.', 'Está cerrada, {b}. No hay viento.', 'Entonces es un inquilino. Y viene a pedir la renta.'],
        ['El retrato del dueño estaba sonriendo.', 'Los retratos no sonríen.', 'Este lo hacía con muchos dientes.', 'Apúntalo en el cuaderno. Y gírale la cara a la pared, por educación.'],
        ['Alguien ha dejado un sobre en la mesa: «Para el próximo que se siente».', 'No lo abras.', 'Ya lo he abierto. Está en blanco.', 'Peor. Los mensajes en blanco son los que más se cumplen.'],
      ],
    },
  };
  // ---- A4 HERR-1 3/4-b1: CHARLAS GRABADAS de los casos generados (compile.js, azar propio seed ^ 0x1157e). Cada charla = 4 frases que se turnan a (empieza) y b; {a} y {b} son los nombres de los dos personajes.
  // Regla de contenido: NADA del crimen ni de las pistas (es una curiosidad grabada, no toca la biblia), humor con remate; el ambiente decide el tono. `rec` = lo que dice Lali al acabar la grabación.
  G.GEN_DATA.compile.listen = {
    chance: 0.4,
    label: ['Dos voces cuchicheando', 'Una charla al fondo', 'Murmullo de dos personas'],
    done: 'Ya has grabado esta charla.',
    mood: {
      claro: {
        rec: ['REC. Charla grabada: mucha conversación, cero confesiones y una tortilla muy bien defendida.', 'REC. Listo. No han dicho nada importante, pero lo han dicho con mucho estilo.', 'REC. Grabado. Si esto es una conspiración, es la más aburrida y simpática del barrio.'],
        chats: [
          ['¿Tú crees que el jefe se ha dado cuenta de lo del café?', 'Se ha dado cuenta de que falta el café. De lo demás, no.', 'Pues si pregunta, el café «se evaporó».', 'Eso, échale la culpa al clima.'],
          ['{b}, ¿has traído el bocadillo?', 'Sí. Es de tortilla. Lleva tortilla y un poco de esperanza.', 'Guárdame un trozo, que hoy no he comido.', 'Trato hecho. Tú pones el hambre; yo, la tortilla.'],
          ['Esta semana he ido tres veces al gimnasio.', 'Qué bien. ¿Y has entrado?', 'Hombre, a la puerta he llegado. Con muchas ganas.', 'Pues apunta tres visitas. Yo no se lo cuento a nadie.'],
          ['Anoche soñé que hablaba con una gallina.', '¿Y qué decía?', 'Que no sabía nada. Y era la más convincente del gallinero.', 'Pues que declare a mi lado, que yo nunca sé qué decir.'],
          ['Me han dicho que mi corbata es un grito.', '¿De rabia?', 'De alegría. Pero muy alto.', 'Pues baja el volumen, que la oye hasta el vecino.'],
          ['¿Tienes calderilla?', 'Tengo un clip y una promesa.', '¿Y la promesa cuánto vale?', 'Depende de quién la cumpla. Yo la tengo en oferta.'],
          ['{b}, ¿por qué hablamos en voz baja?', 'Porque aquí hay eco y me da vergüenza escucharme.', 'Pues yo me escucho y me caigo bien.', 'Eso no lo cura ni el eco.'],
        ],
      },
      inquietante: {
        rec: ['REC. Grabado. Ha sonado una tercera voz al fondo; seguro que es la tubería. Seguro.', 'REC. Listo. Ojo: la grabación se enfría sola. Será cosa del micrófono.', 'REC. Charla en la bolsa. Y un susurro que no era de ninguno de los dos. Lo dejamos pasar por educación.'],
        chats: [
          ['¿Has notado que esta sala se enfría cuando uno se queda callado?', 'Eso es la corriente, {a}.', 'Pues la corriente se acaba de callar conmigo.', 'Entonces la corriente es educada. No como tú.'],
          ['Anoche tres puertas se cerraron solas, una detrás de otra.', 'Las puertas hacen eso. Es su trabajo.', 'Pero llevaban ritmo.', 'Pues serán músicos. Que no me despierten otra vez.'],
          ['Juraría que el retrato de la pared me ha guiñado un ojo.', 'Los retratos no guiñan. Parpadean y ya.', 'Pues este lo ha hecho con intención.', 'Entonces dale las buenas noches y que no se ofenda.'],
          ['{b}, ¿oyes eso? Como si alguien arrastrara una silla.', 'Es una silla. Se arrastra sola. Lleva años.', '¿Y no te asusta?', 'Me asusta más la factura de la luz. Esa sí que da miedo.'],
          ['Esta noche no pienso quedarme solo en el edificio.', 'No estás solo. Estoy yo.', 'Eso me asusta más.', 'Ya, a mí también. Por eso hablo bajito.'],
          ['¿Por qué huele a lavanda de repente?', 'Porque alguien ha limpiado. O porque alguien ha vuelto.', 'Prefiero lo primero. Es más barato.', 'Lo segundo viene con compañía. Tú eliges.'],
        ],
      },
      macabro: {
        rec: ['REC. Grabado. En la cinta se oye algo más que dos voces. Yo no pienso rebobinar.', 'REC. Listo. Hay un silencio de fondo que suena demasiado a «nos están escuchando».', 'REC. Charla en la cinta. Y un «gracias» muy bajito desde abajo. Dos veces. Qué educado, el sótano.'],
        chats: [
          ['He oído que en el sótano hay una puerta que nadie recuerda haber puesto.', 'La puse yo. Pero fue hace mucho y estaba de mal humor.', 'No me tranquiliza.', 'A mí tampoco. Por eso está cerrada con tres cerrojos y una disculpa.'],
          ['Anoche alguien me dio las buenas noches desde el armario.', '¿Y tú qué hiciste?', 'Contesté. Por educación.', 'Pues mañana te lo devolverá. Con intereses.'],
          ['¿Has visto esa mancha del suelo? Parece una cara.', 'Es una mancha. Las manchas no tienen cara.', 'Esta sí. Y tiene cara de que no le gusta la fregona.', 'Pues que no mire. Ya la fregaré yo mañana, si me deja.'],
          ['Dicen que aquí hay un fantasma que solo sale cuando nadie lo mira.', 'Qué tímido.', 'Y muy puntual. Siempre aparece justo cuando uno se queda solo.', 'Pues hoy somos dos. A ver si se corta.'],
          ['{b}, tú sigues vivo, ¿verdad?', 'Eso creo. Me duele todo; buena señal.', 'Es que has dejado de hacer sombra.', 'Menuda noticia. Voy a revisar mi sombra.'],
          ['Si oyes un llanto bajo el suelo, no contestes.', '¿Y si me pide perdón?', 'Menos todavía. Es el que más insiste.', 'Entonces haré como que no estoy. Y con suerte, es verdad.'],
        ],
      },
    },
  };
  // GRAB-1 (c3a, GEN_VERSION >= 7): la charla CON PISTA contiene la pista, VELADA. Una de las 4 frases (la 3.ª, de `a`) la insinúa sin confesar y la 4.ª (de `b`) reacciona. Variables: {who} = de quién habla la pista, {prev} = de quién hablaba la charla anterior.
  // Reglas: nada de pronombres de género («lo», «la», «él», «ella») ni lugares concretos; sin confesión; valen en los tres ambientes (tono neutro). `link` es la reacción de `b` en la 2.ª charla: confirma (mismo nombre) o contrasta (otro nombre).
  G.GEN_DATA.compile.listen.veil = {
    roles: {
      prueba: [
        ['Por cierto, entre tú y yo: lo de anoche no fue cosa de un desconocido. {who} sabía muy bien dónde mirar.', 'Chis. Habla bajito, que aquí hasta las paredes toman nota.'],
        ['Y hablando de otra cosa: yo no digo que haya sido {who}. Solo digo que {who} andaba muy interesado en el asunto.', 'Pues yo no he oído nada. Y tú tampoco, ¿verdad?'],
      ],
      descarte: [
        ['Por cierto, con {who} yo no me preocuparía: pasó el rato ocupado, a la vista de todos.', 'Si lo dices tú, que no sueles defender a nadie, será verdad.'],
        ['Sigo dándole vueltas: {who} estaba en otro sitio, y con público. Eso no se inventa.', 'Eso sí. Las coartadas con público son las mejores.'],
      ],
      refuta: [
        ['Por cierto, lo que ha contado {who} no me cuadra. Tenía otra cosa entre manos, y no era para presumir.', 'Mejor no preguntemos. Como preguntemos, nos lo cuentan.'],
        ['{who} dice una cosa y los hechos dicen otra. Yo solo lo comento.', 'Y yo solo lo he oído. Esto queda entre nosotros.'],
      ],
    },
    link: {
      confirma: ['Eso encaja con lo que se murmuraba antes sobre {who}. Dos charlas distintas y el mismo nombre.', 'Dos voces distintas, un solo nombre: {who}. Qué casualidad tan poco casual.'],
      contrasta: ['Antes se hablaba de {prev} y ahora de {who}. O esto es un lío, o alguien está tapando algo.', 'Curioso: de {prev} se decía una cosa y de {who}, otra. Aquí no hay quien se aclare.'],
    },
    // c4-3 2/4 (cp. 241, decisión B del usuario; APAGADO hasta 3/4): CHARLA SEÑUELO. Misma forma que `roles` ([frase 3.ª de `a`, frase 4.ª de `b`]) pero de tono SOSPECHOSO sobre un inocente ({who}): se confunde con la refutación real (`roles.refuta`) y el jugador no aprende «charla que acusa = falsa». Sin pronombres de género, sin lugares, sin confesión. Solo sale con `herr2.charlaSenuelos` encendido.
    senuelo: [
      ['Entre tú y yo: {who} andaba muy nervioso anoche. Y no era por el calor.', 'Nervioso, sí. Pero yo no he dicho nada, ¿eh?'],
      ['No quiero señalar a nadie, pero {who} se marchó de pronto y sin despedirse. Raro, raro.', 'Rarísimo. Aunque quizá solo tenía prisa. O no.'],
      ['Yo solo digo que {who} preguntó demasiado por el asunto. Y nadie había preguntado nada.', 'Qué curioso. Y qué poco me gusta lo curioso.'],
      ['Hay quien dice que {who} sabe más de lo que cuenta. Hay quien dice muchas cosas.', 'Hay quien las dice y hay quien las apunta. Yo apunto.'],
      ['Mira, {who} tenía cara de haber hecho algo. No sé qué. Pero cara tenía.', 'Con cara no se condena a nadie, pero tampoco se olvida.'],
    ],
  };
  // ---- CL-5c-b (GEN_VERSION >= 7, solo Difícil): BANCO DE PUZLES (diseño: docs/DISENO_PUZLES_CL5C.md §5). Textos propios; cada entrada lleva id ESTABLE (pzc_/pzl_/pzt_) para la futura memoria de «no repetir» (opts.recentPuzzles).
  // Variables: {q} pregunta del código · {who} {wit} {to} {loc} {pname} {time} {doing}. Los sprites son los que ya existen como objetos 1×1/altos con pista (sin sprites nuevos).
  G.GEN_DATA.compile.puzzlesV7 = {
    question: '¿a qué hora (HHMM) llegó {who} {to}?',
    denied: 'Todavía no tenéis lo que hace falta. Seguid buscando pistas con horas por la zona.',
    codes: [
      { id: 'pzc_01', sprite: 'locker', label: 'Taquilla con candado', title: 'La taquilla del encargado', hint: 'Cuatro cifras: {q} Alguien lo apuntó en algún sitio.', prize: ['Dentro hay un bocadillo de hace tres semanas, ya con personalidad. Se llama Gerardo.', 'Lo dejamos en paz. Nos ha mirado mal.'] },
      { id: 'pzc_02', sprite: 'drawer', label: 'Cajón con cerradura numérica', title: 'El cajón de los secretos pequeños', hint: 'Cuatro cifras: {q} Mirad bien las horas del cuaderno.', prize: ['Solo hay clips, una pila gastada y una nota: «no abrir». Lo hemos abierto.', 'Rex se ha quedado con un clip. Dice que es de la suerte.'] },
      { id: 'pzc_03', sprite: 'mailbox', label: 'Buzón con combinación', title: 'El buzón que nadie vacía', hint: 'Cuatro cifras: {q} La respuesta está escrita en el caso.', prize: ['Cartas de un banco, un menú de pizza y una postal de «saludos desde ninguna parte».', 'Luna ha guardado la postal. Es la mejor pista del día.'] },
      { id: 'pzc_04', sprite: 'crate', label: 'Caja con candadito', title: 'La caja de las promesas rotas', hint: 'Cuatro cifras: {q} Alguien lo dejó por escrito.', prize: ['Contiene tres promesas rotas, un lazo y un pastel de ayer. El pastel gana.', 'Veredicto de Rex: «crujiente por fuera, misterio por dentro».'] },
      { id: 'pzc_05', sprite: 'files', label: 'Archivador con candado', title: 'El archivador de los expedientes aburridos', hint: 'Cuatro cifras: {q} Buscad la hora en las pistas.', prize: ['Expedientes de hace diez años. Hay uno titulado «Asuntos varios (muy varios)».', 'No lo hemos leído. Lo hemos mirado con respeto.'] },
      { id: 'pzc_06', sprite: 'trophy', label: 'Vitrina con candado', title: 'La vitrina del orgullo', hint: 'Cuatro cifras: {q} Fijaos en las horas apuntadas.', prize: ['Un trofeo de «mejor intento». Está algo ladeado, como el orgullo.', 'Lo hemos enderezado. Se ha vuelto a ladear.'] },
      { id: 'pzc_07', sprite: 'clock', label: 'Reloj con tapa trasera', title: 'El reloj que sabe demasiado', hint: 'Cuatro cifras: {q} El reloj solo se abre con una hora de verdad.', prize: ['Detrás del reloj hay un caramelo pegado. Lleva ahí desde el siglo pasado.', 'Nadie se lo ha comido. Hay límites.'] },
    ],
    lines: [
      { id: 'pzl_01', sprite: 'corkboard', label: 'Tablón de corcho', title: 'La noche, hilo a hilo', hint: 'Toca los papelitos del más antiguo al más reciente.', prize: ['El tablón queda como en una película: hilo rojo y todo.', 'Lali ha pedido más chinchetas. Muchas más.'] },
      { id: 'pzl_02', sprite: 'files', label: 'Carpeta de recortes', title: 'Recortes de la velada', hint: 'Ordénalos según las horas de las pistas.', prize: ['Los recortes encajan como piezas de un puzle con ganas.', 'Rex quiere enmarcarlos. Luna dice que antes, resolver.'] },
      { id: 'pzl_03', sprite: 'table', label: 'Mesa de detectives', title: 'Cada cosa a su hora', hint: 'Mira la hora de cada pista y ponlos en fila.', prize: ['Todo en orden: hasta la mesa parece más lista.', 'Hemos hecho una foto. Para nosotros, de recuerdo.'] },
      { id: 'pzl_04', sprite: 'bookshelf', label: 'Diario de la casa', title: 'Las horas del diario', hint: 'Primero lo más antiguo; el cuaderno tiene las horas.', prize: ['El diario cierra con un golpecito satisfecho.', 'Pone «Fin del capítulo». Qué teatral.'] },
      { id: 'pzl_05', sprite: 'corkboard', label: 'Pizarra de turnos', title: 'Turnos y tropiezos', hint: 'Repasa las pistas: cada una trae su hora.', prize: ['La pizarra queda impecable. Alguien ha dibujado un gato en la esquina.', 'No hemos sido nosotros. Probablemente.'] },
      { id: 'pzl_06', sprite: 'table', label: 'Mesa de reconstrucción', title: 'Reconstruyendo la velada', hint: 'Del suceso más temprano al más tardío.', prize: ['La reconstrucción sale redonda, con su música de fondo imaginaria.', 'Rex tararea. Luna le pide que pare. No para.'] },
    ],
    // Pistas de puzle con hora real (rol «ambiente»): {doing} llega en minúscula y sin punto final. `obj` = objeto en una sala; `npc` = testimonio de un testigo honesto.
    clueObj: [
      { id: 'pzt_01', title: 'Ticket de {who}', kind: 'documento', text: 'Un ticket arrugado en {loc}: «{who}, {time}». A lápiz: {doing}.' },
      { id: 'pzt_02', title: 'Fotograma suelto de {who}', kind: 'grabación', text: 'Fotograma tomado en {loc}, con la hora {time}: {who}, que {doing}.' },
      { id: 'pzt_03', title: 'Hoja de turnos ({pname})', kind: 'documento', text: 'Hoja clavada en {loc}. Anotado a las {time}: «{who} llega {to}». Al margen: {doing}.' },
      { id: 'pzt_04', title: 'Post-it de {who}', kind: 'documento', text: 'Un post-it pegado en {loc}: «{time} — {doing}». Firma: {who}.' },
      { id: 'pzt_05', title: 'Tarjeta de fichaje de {who}', kind: 'documento', text: 'Una tarjeta fichada a las {time} en {loc}. Nombre: {who}. Detrás, a lápiz: {doing}.' },
      { id: 'pzt_06', title: 'Recibo de café de {who}', kind: 'documento', text: 'Recibo de las {time} en {loc}. Pagó {who}; en el reverso: {doing}.' },
    ],
    clueNpc: [
      { id: 'pzt_07', title: 'El recuerdo de {wit}', kind: 'testimonio', text: '{wit} recuerda que {who} llegó {to} a las {time}: {doing}.' },
      { id: 'pzt_08', title: 'Lo que apuntó {wit}', kind: 'testimonio', text: '{wit} lo apuntó: a las {time}, {who} llegó {to}. Y, según {wit}, {doing}.' },
      { id: 'pzt_09', title: 'La memoria de {wit}', kind: 'testimonio', text: 'Según {wit}, {who} llegó {to} a las {time}. Lo que hacía: {doing}.' },
      { id: 'pzt_10', title: 'El reloj de {wit}', kind: 'testimonio', text: '{wit} miró el reloj justo cuando {who} entraba {to}: eran las {time}. Lo que hacía: {doing}.' },
      { id: 'pzt_11', title: 'Palabra de {wit}', kind: 'testimonio', text: '{wit} jura que fue a las {time}: {who} llegó {to} y, según dice, {doing}.' },
    ],
  };
})(typeof window !== 'undefined' ? window : globalThis);
