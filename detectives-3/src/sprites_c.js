// sprites_c.js — sprites extra para los casos (cuenco, paloma, huellas horizontales, etc.)
(function (root) {
  'use strict';
  const G = root.G;
  const P = G.PAL;
  const D = G.defSprite;
  const OUT = { outline: '#2a1b30' };
  const px = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  D('bowl', 16, 16, (c) => {
    px(c, P.white, 3, 8, 10, 6); px(c, P.grey, 3, 13, 10, 1); px(c, P.grey, 4, 14, 8, 1);
    px(c, P.pink2, 3, 6, 10, 3); px(c, P.pink, 4, 6, 4, 1); px(c, P.white, 9, 7, 1, 1); px(c, P.white, 6, 8, 1, 1);
    px(c, P.wood3, 11, 3, 1, 5);
  }, OUT);
  D('pigeon', 16, 16, (c) => {
    px(c, P.grey2, 4, 8, 8, 5); px(c, P.grey, 5, 8, 6, 3); px(c, P.grey2, 10, 5, 4, 4); px(c, P.yellow, 14, 7, 2, 1);
    px(c, P.ink, 12, 6, 1, 1); px(c, P.greyD, 2, 9, 3, 2); px(c, P.orange, 6, 13, 1, 2); px(c, P.orange, 9, 13, 1, 2);
    px(c, '#8e5bc4', 10, 9, 3, 1);
  }, OUT);
  // 4F-0b 2/4-b: ARTE DEL DESPACHO DEL DUEÑO (16×16, mismo estilo y contorno que el resto). Los usan las plantillas rooms.despacho.
  D('safe', 16, 16, (c) => { // caja fuerte
    px(c, P.greyD, 2, 2, 12, 13); px(c, P.grey2, 3, 3, 10, 11); px(c, P.grey, 4, 4, 8, 9); px(c, P.greyD, 4, 4, 8, 1);
    px(c, P.yellow, 7, 7, 4, 4); px(c, P.ink, 8, 8, 2, 2); px(c, P.yellow, 6, 8, 1, 2); px(c, P.red, 12, 6, 1, 3); px(c, P.greyD, 3, 14, 2, 1); px(c, P.greyD, 11, 14, 2, 1);
  }, OUT);
  D('armchair', 16, 16, (c) => { // sillón del dueño
    px(c, P.red2, 3, 2, 10, 7); px(c, P.red, 4, 3, 8, 5); px(c, P.red2, 1, 7, 3, 7); px(c, P.red2, 12, 7, 3, 7); px(c, P.red, 4, 8, 8, 5);
    px(c, P.red2, 4, 12, 8, 1); px(c, P.pink, 6, 4, 2, 1); px(c, P.wood3, 2, 14, 2, 2); px(c, P.wood3, 12, 14, 2, 2);
  }, OUT);
  D('globe', 16, 16, (c) => { // globo terráqueo con pie
    px(c, P.blue, 4, 2, 8, 8); px(c, P.blue2, 3, 4, 10, 4); px(c, P.green, 5, 3, 3, 3); px(c, P.green2, 8, 6, 3, 2); px(c, P.cream, 5, 3, 1, 1);
    px(c, P.wood3, 7, 10, 2, 3); px(c, P.wood2, 4, 13, 8, 2); px(c, P.yellow, 3, 5, 1, 4);
  }, OUT);
  D('desk_boss', 16, 16, (c) => { // escritorio grande del dueño con lámpara y carpeta
    px(c, P.wood3, 0, 6, 16, 3); px(c, P.wood1, 0, 5, 16, 2); px(c, P.wood2, 1, 9, 14, 6); px(c, P.woodD, 7, 10, 2, 3); px(c, P.wood3, 1, 14, 3, 2); px(c, P.wood3, 12, 14, 3, 2);
    px(c, P.green, 2, 3, 2, 3); px(c, P.green2, 1, 2, 4, 2); px(c, P.cream, 8, 3, 5, 3); px(c, P.ink, 9, 4, 3, 1); px(c, P.yellow, 14, 4, 1, 2);
  }, OUT);
  D('portrait', 16, 16, (c) => { // retrato del dueño (decoración de pared)
    px(c, P.yellow, 3, 1, 10, 13); px(c, P.woodD, 4, 2, 8, 11); px(c, P.cream2, 5, 3, 6, 9); px(c, P.skin2, 6, 4, 4, 4); px(c, P.ink, 7, 5, 1, 1); px(c, P.ink, 9, 5, 1, 1);
    px(c, P.brown, 6, 3, 4, 1); px(c, P.purple2, 5, 8, 6, 3); px(c, P.red, 7, 8, 2, 1);
  }, OUT);
  D('decal_wheel_h', 16, 16, (c) => {
    px(c, 'rgba(50,40,40,0.5)', 0, 3, 16, 2); px(c, 'rgba(50,40,40,0.5)', 0, 11, 16, 2);
    px(c, 'rgba(200,50,70,0.8)', 4, 3, 2, 2); px(c, 'rgba(200,50,70,0.8)', 10, 11, 2, 2); px(c, 'rgba(200,50,70,0.8)', 13, 3, 1, 2);
  });
  D('decal_shine', 16, 16, (c) => {
    px(c, 'rgba(255,255,255,0.22)', 2, 2, 12, 12);
  });
  D('poster', 16, 16, (c) => {
    px(c, P.white, 2, 1, 12, 13); px(c, P.red, 3, 2, 10, 3); px(c, P.ink, 4, 6, 8, 1); px(c, P.ink, 4, 8, 6, 1); px(c, P.ink, 4, 10, 7, 1);
    px(c, P.yellow, 9, 11, 3, 2);
  }, OUT);
  D('lab_table', 16, 16, (c) => {
    px(c, P.greyD, 1, 9, 2, 7); px(c, P.greyD, 13, 9, 2, 7);
    px(c, '#d9e8ee', 0, 4, 16, 6); px(c, '#f4fafc', 0, 4, 16, 1); px(c, P.grey, 0, 9, 16, 1);
    px(c, P.purple, 3, 1, 3, 4); px(c, P.glow, 3, 2, 3, 2); px(c, P.green, 9, 2, 3, 3); px(c, '#fff', 10, 2, 1, 1);
  }, OUT);
  D('window_big', 16, 16, (c) => {
    px(c, P.wood3, 0, 0, 16, 14); px(c, '#a9dcf0', 2, 1, 12, 11); px(c, '#d7f1fa', 2, 1, 5, 5);
    px(c, P.wood3, 7, 1, 2, 11); px(c, P.wood3, 2, 6, 12, 2); px(c, P.woodD, 0, 13, 16, 2);
  }, OUT);
  D('cushion', 16, 16, (c) => {
    px(c, P.pink2, 3, 6, 10, 7); px(c, P.pink, 4, 6, 8, 4); px(c, '#c9587a', 3, 12, 10, 1); px(c, P.yellow, 3, 6, 1, 1); px(c, P.yellow, 12, 6, 1, 1);
  }, OUT);
  D('fish', 16, 16, (c) => {
    px(c, P.blue, 3, 6, 8, 5); px(c, P.teal, 4, 6, 6, 2); px(c, P.blue, 11, 5, 3, 7); px(c, P.ink, 5, 7, 1, 1); px(c, '#fff', 3, 9, 6, 1);
  }, OUT);

  // ==========================================================================================================
  // 4C-3a · ARTE DE POLICÍA Y COMISARÍA (mismo estilo y paleta que el caso 1; sin gore). Aún no los usa ningún caso generado (4C-3b).
  // Reutilizables del caso 1 para la comisaría: `counter` (mostrador), `files` (archivador), `corkboard`, `desk`, `bench`, `door_metal`.
  // police_car_0 / police_car_1 = el mismo coche con la sirena en rojo-azul y azul-rojo: G.sirenFrame(t) devuelve el id que toca en el instante t (segundos).
  // ==========================================================================================================
  const COP = { navy: '#27386d', navyD: '#14204a', gold: '#f2c94c', steel: '#9aa3b5', steelD: '#6d7587', ink2: '#15192e' };
  const policeCar = (c, redLeft) => {
    const L = redLeft ? 'rgba(255,70,90,0.95)' : 'rgba(80,140,255,0.95)', R = redLeft ? 'rgba(80,140,255,0.95)' : 'rgba(255,70,90,0.95)';
    px(c, 'rgba(0,0,0,0.25)', 2, 14, 28, 2);                                        // sombra
    px(c, P.white, 1, 6, 30, 7); px(c, '#dfe3ee', 1, 12, 30, 1);                     // carrocería
    px(c, COP.navy, 1, 9, 30, 2); px(c, P.white, 12, 9, 8, 2);                       // franja azul con hueco para la puerta
    px(c, P.white, 7, 2, 18, 5); px(c, '#dfe3ee', 7, 6, 18, 1);                      // cabina
    px(c, '#9fd3ec', 8, 3, 7, 3); px(c, '#9fd3ec', 17, 3, 7, 3); px(c, '#d7f1fa', 9, 3, 2, 1); px(c, '#d7f1fa', 18, 3, 2, 1); // ventanillas
    px(c, COP.navyD, 15, 3, 2, 3);                                                   // montante
    px(c, COP.ink2, 13, 1, 6, 2); px(c, L, 13, 0, 3, 3); px(c, R, 16, 0, 3, 3);       // barra de luces
    px(c, redLeft ? 'rgba(255,70,90,0.30)' : 'rgba(80,140,255,0.30)', 9, 0, 6, 1); px(c, redLeft ? 'rgba(80,140,255,0.30)' : 'rgba(255,70,90,0.30)', 17, 0, 6, 1); // destellos
    px(c, P.yellow, 1, 7, 2, 2); px(c, P.red, 29, 7, 2, 2);                          // faros y piloto
    px(c, COP.navy, 21, 7, 1, 1); px(c, COP.ink2, 5, 12, 6, 3); px(c, COP.ink2, 21, 12, 6, 3); px(c, COP.steel, 7, 13, 2, 1); px(c, COP.steel, 23, 13, 2, 1); // ruedas
  };
  D('police_car_0', 32, 16, (c) => policeCar(c, true), OUT);
  D('police_car_1', 32, 16, (c) => policeCar(c, false), OUT);
  G.sirenFrame = (t) => 'police_car_' + (Math.floor((t || 0) * 3) % 2);

  D('police_tape_h', 16, 16, (c) => { // cinta de precinto horizontal
    px(c, P.yellow, 0, 6, 16, 4); for (let x = -2; x < 16; x += 4) { px(c, COP.ink2, x + 1, 6, 1, 1); px(c, COP.ink2, x + 2, 7, 1, 1); px(c, COP.ink2, x + 3, 8, 1, 1); px(c, COP.ink2, x + 4, 9, 1, 1); }
    px(c, 'rgba(0,0,0,0.18)', 0, 10, 16, 1);
  });
  D('police_tape_v', 16, 16, (c) => { // cinta de precinto vertical
    px(c, P.yellow, 6, 0, 4, 16); for (let y = -2; y < 16; y += 4) { px(c, COP.ink2, 6, y + 1, 1, 1); px(c, COP.ink2, 7, y + 2, 1, 1); px(c, COP.ink2, 8, y + 3, 1, 1); px(c, COP.ink2, 9, y + 4, 1, 1); }
    px(c, 'rgba(0,0,0,0.18)', 10, 0, 1, 16);
  });
  D('cone', 16, 16, (c) => { // cono de tráfico
    px(c, COP.ink2, 3, 13, 10, 2); px(c, P.orange, 6, 3, 4, 3); px(c, P.orange, 5, 6, 6, 3); px(c, P.orange, 4, 9, 8, 4);
    px(c, P.white, 6, 6, 4, 1); px(c, P.white, 5, 9, 6, 1); px(c, '#e08a2a', 9, 4, 1, 9); px(c, COP.ink2, 7, 2, 2, 1);
  }, OUT);
  D('decal_puddle', 16, 16, (c) => { // charco de agua
    px(c, 'rgba(70,110,150,0.50)', 3, 6, 10, 5); px(c, 'rgba(70,110,150,0.50)', 5, 4, 7, 9); px(c, 'rgba(70,110,150,0.50)', 2, 8, 12, 2);
    px(c, 'rgba(210,235,255,0.60)', 6, 6, 3, 1); px(c, 'rgba(210,235,255,0.45)', 5, 8, 2, 1);
  });
  D('decal_stain', 16, 16, (c) => { // mancha oscura sin detalle
    px(c, 'rgba(38,22,34,0.62)', 4, 5, 8, 6); px(c, 'rgba(38,22,34,0.62)', 6, 3, 5, 10); px(c, 'rgba(38,22,34,0.62)', 3, 7, 10, 3);
    px(c, 'rgba(38,22,34,0.40)', 12, 11, 2, 2); px(c, 'rgba(38,22,34,0.40)', 2, 4, 2, 1);
  });
  D('decal_jam', 16, 16, (c) => { // charco de mermelada (versión absurda de la mancha)
    px(c, 'rgba(176,36,72,0.78)', 4, 6, 9, 5); px(c, 'rgba(176,36,72,0.78)', 6, 4, 5, 9); px(c, 'rgba(176,36,72,0.78)', 3, 8, 11, 2);
    px(c, 'rgba(255,170,190,0.75)', 6, 6, 2, 1); px(c, 'rgba(255,255,255,0.7)', 6, 6, 1, 1); px(c, 'rgba(176,36,72,0.78)', 13, 10, 1, 1);
  });
  D('station_counter', 16, 16, (c) => { // mostrador de comisaría (azul y acero, con timbre)
    px(c, COP.navyD, 0, 6, 16, 9); px(c, COP.navy, 0, 4, 16, 3); px(c, COP.steel, 0, 4, 16, 1); px(c, COP.navy, 1, 8, 6, 6); px(c, COP.navy, 9, 8, 6, 6);
    px(c, COP.steelD, 2, 9, 4, 1); px(c, COP.steelD, 10, 9, 4, 1); px(c, COP.gold, 11, 2, 3, 2); px(c, COP.ink2, 12, 1, 1, 1); px(c, P.white, 3, 2, 4, 2); px(c, COP.steelD, 3, 3, 3, 1);
  }, OUT);
  D('cell_bars', 16, 32, (c) => { // celda con rejas (ocupa 2 baldosas de alto)
    px(c, '#2b2f3f', 1, 2, 14, 28); px(c, '#3a3f54', 1, 24, 14, 6); px(c, COP.steelD, 0, 0, 16, 3); px(c, COP.steelD, 0, 29, 16, 3); px(c, COP.steel, 0, 0, 16, 1);
    for (let x = 2; x < 15; x += 3) { px(c, COP.steel, x, 3, 1, 26); px(c, '#d9deea', x, 3, 1, 2); px(c, COP.steelD, x + 1, 3, 1, 26); }
    px(c, COP.steelD, 1, 14, 14, 1); px(c, COP.gold, 12, 16, 2, 3); px(c, COP.ink2, 13, 17, 1, 1); px(c, '#9a8a6a', 3, 26, 7, 2);
  }, OUT);
  D('interrogation_table', 16, 16, (c) => { // mesa de interrogatorio con lámpara
    px(c, COP.steelD, 1, 9, 14, 3); px(c, COP.steel, 1, 8, 14, 2); px(c, COP.steelD, 2, 12, 2, 3); px(c, COP.steelD, 12, 12, 2, 3);
    px(c, COP.ink2, 7, 3, 1, 5); px(c, COP.ink2, 5, 2, 5, 1); px(c, P.yellow, 5, 3, 5, 1); px(c, 'rgba(255,240,150,0.35)', 3, 4, 9, 4);
    px(c, P.white, 10, 7, 3, 1); px(c, COP.ink2, 3, 7, 2, 1);
  }, OUT);
  D('clue_board', 16, 16, (c) => { // tablón de pistas: corcho con notas, foto e hilo rojo
    px(c, P.wood3, 0, 0, 16, 15); px(c, '#c99a5e', 1, 1, 14, 13); px(c, '#b58648', 1, 12, 14, 2);
    px(c, P.white, 2, 2, 4, 4); px(c, P.yellow, 8, 3, 4, 3); px(c, '#a9dcf0', 4, 8, 4, 4); px(c, P.pink, 10, 9, 4, 3);
    px(c, COP.ink2, 3, 3, 2, 1); px(c, COP.ink2, 9, 4, 2, 1); px(c, P.red, 4, 5, 1, 1); px(c, P.red, 5, 6, 1, 1); px(c, P.red, 6, 7, 1, 1); px(c, P.red, 7, 8, 1, 1); px(c, P.red, 8, 7, 1, 1); px(c, P.red, 9, 6, 1, 1); px(c, P.red, 10, 8, 1, 1); px(c, P.red, 11, 9, 1, 1);
  }, OUT);
  D('police_sign', 16, 16, (c) => { // cartel de la comisaría (escudo dorado sobre azul)
    px(c, COP.navyD, 1, 2, 14, 11); px(c, COP.navy, 2, 3, 12, 9); px(c, COP.gold, 6, 4, 4, 1); px(c, COP.gold, 5, 5, 6, 3); px(c, COP.gold, 6, 8, 4, 2); px(c, COP.gold, 7, 10, 2, 1);
    px(c, COP.navy, 7, 6, 2, 2); px(c, P.white, 3, 11, 10, 1); px(c, COP.steel, 1, 13, 14, 1);
  }, OUT);

  // ==========================================================================================================
  // 4C-3b-1 · ANIMACIÓN DE OBJETOS Y AMBIENTE (solo visual: no toca lógica, colisiones, guardado ni red).
  // G.ANIMS[id] describe cómo se anima el sprite `id` (el id que usa el caso = su primer fotograma): { frames, fps, seq?, sync?, glow? }.
  //   frames: ids de sprite · fps: pasos por segundo · seq: orden opcional de índices de fotograma (parpadeos) · sync: sin desfase por objeto.
  //   glow: { sprites: [id por fotograma], dx, dy } = resplandor en el suelo (centro en la base del objeto; dx, dy en px lógicos).
  // Un solo reloj (el del mundo). Sin ANIMS el objeto se dibuja como siempre. Como mucho G.ANIM_MAX_PER_ROOM objetos animados por sala (world.js).
  // El caso 1 no cambia: sus sprites (lamp_post…) no se animan; las versiones animadas llevan ids nuevos (lamp_post_blink…).
  // ==========================================================================================================
  const tapeStrip = (c, vertical, k) => { // cinta de precinto con onda: k = 1..3 fase de la onda (el fotograma plano es el sprite original police_tape_h/v); mismas rayas diagonales que el original
    const wave = (i) => Math.round(Math.sin((i + k * 4) / 16 * Math.PI * 2) * 1.2);
    for (let i = 0; i < 16; i++) {
      const o = wave(i), r = (i + 1) % 4;
      if (!vertical) { px(c, P.yellow, i, 6 + o, 1, 4); px(c, COP.ink2, i, 6 + o + r, 1, 1); px(c, 'rgba(0,0,0,0.18)', i, 10 + o, 1, 1); }
      else { px(c, P.yellow, 6 + o, i, 4, 1); px(c, COP.ink2, 6 + o + r, i, 1, 1); px(c, 'rgba(0,0,0,0.18)', 10 + o, i, 1, 1); }
    }
  };
  [1, 2, 3].forEach((k) => { D('police_tape_h_w' + k, 16, 16, (c) => tapeStrip(c, false, k)); D('police_tape_v_w' + k, 16, 16, (c) => tapeStrip(c, true, k)); });

  const puddle = (c, a, b) => { // charco con destello que se mueve (a, b = posiciones del brillo)
    px(c, 'rgba(70,110,150,0.50)', 3, 6, 10, 5); px(c, 'rgba(70,110,150,0.50)', 5, 4, 7, 9); px(c, 'rgba(70,110,150,0.50)', 2, 8, 12, 2);
    px(c, 'rgba(210,235,255,0.60)', a[0], a[1], 3, 1); px(c, 'rgba(210,235,255,0.45)', b[0], b[1], 2, 1);
    px(c, 'rgba(255,255,255,0.85)', a[0] + 1, a[1], 1, 1);
  };
  D('decal_puddle_g1', 16, 16, (c) => puddle(c, [8, 5], [5, 9]));
  D('decal_puddle_g2', 16, 16, (c) => puddle(c, [9, 8], [4, 7]));

  const lampPost = (c, lit) => { // farola animada: copia de lamp_post con el farol encendido o flojo
    px(c, P.greyD, 7, 8, 2, 22); px(c, P.greyD, 5, 29, 6, 2); px(c, P.greyD, 6, 6, 4, 2);
    if (lit) { px(c, '#fff2a8', 4, 0, 8, 7); px(c, '#ffe36a', 5, 1, 6, 5); } else { px(c, '#a89c5c', 4, 0, 8, 7); px(c, '#8f8446', 5, 1, 6, 5); }
    px(c, P.greyD, 4, 0, 8, 1);
  };
  D('lamp_post_blink', 16, 32, (c) => lampPost(c, true), OUT);
  D('lamp_post_dim', 16, 32, (c) => lampPost(c, false), OUT);

  const lampTable = (c, lit) => { // mesa de interrogatorio con la lámpara a pleno o parpadeando
    px(c, COP.steelD, 1, 9, 14, 3); px(c, COP.steel, 1, 8, 14, 2); px(c, COP.steelD, 2, 12, 2, 3); px(c, COP.steelD, 12, 12, 2, 3);
    px(c, COP.ink2, 7, 3, 1, 5); px(c, COP.ink2, 5, 2, 5, 1); px(c, lit ? P.yellow : '#8f8446', 5, 3, 5, 1); px(c, lit ? 'rgba(255,240,150,0.35)' : 'rgba(255,240,150,0.10)', 3, 4, 9, 4);
    px(c, P.white, 10, 7, 3, 1); px(c, COP.ink2, 3, 7, 2, 1);
  };
  D('interrogation_table_lit', 16, 16, (c) => lampTable(c, true), OUT);
  D('interrogation_table_dim', 16, 16, (c) => lampTable(c, false), OUT);

  // Resplandores de suelo (sin contorno, con tramado en el borde): elipse dividida en dos colores o de un color cálido.
  const glow = (c, w, h, colL, colR, a0, a1, a2) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), d = Math.sqrt(nx * nx + ny * ny);
      if (d >= 1) continue;
      const a = d < 0.45 ? a0 : d < 0.75 ? a1 : ((x + y) % 2 ? a2 : 0);
      if (a <= 0) continue;
      const col = x < w / 2 ? colL : colR;
      px(c, 'rgba(' + col + ',' + a + ')', x, y, 1, 1);
    }
  };
  D('police_glow_0', 48, 24, (c) => glow(c, 48, 24, '255,70,90', '80,140,255', 0.38, 0.22, 0.12));
  D('police_glow_1', 48, 24, (c) => glow(c, 48, 24, '80,140,255', '255,70,90', 0.38, 0.22, 0.12));
  D('lamp_glow_0', 32, 16, (c) => glow(c, 32, 16, '255,226,120', '255,226,120', 0.32, 0.18, 0.10));
  D('lamp_glow_1', 32, 16, (c) => glow(c, 32, 16, '255,226,120', '255,226,120', 0.10, 0.06, 0.03));

  // ==========================================================================================================
  // 4C-4b · OBJETOS DE AMBIENTE (solo arte; los coloca el compilador según `def.mood`, ver «4C-4b» en compile.js).
  // Silla que se mece (rocking_chair + _f/_b), ventana nocturna con una sombra que asoma de vez en cuando (window_dark + window_shadow)
  // y charco de salsa (decal_sauce). La mancha oscura es decal_stain y la mermelada decal_jam (4C-3a). Sin gore: nada de detalle.
  // ==========================================================================================================
  const rockingChair = (c, dx) => { // dx = -1/0/+1: la silla se inclina hacia atrás/reposo/delante (la base curva no se mueve)
    px(c, P.woodD, 2, 14, 12, 1); px(c, P.woodD, 1, 13, 1, 1); px(c, P.woodD, 14, 13, 1, 1);          // patines curvos
    px(c, P.wood3, 4 + dx, 12, 1, 2); px(c, P.wood3, 11 + dx, 12, 1, 2);                              // patas
    px(c, P.wood1, 3 + dx, 9, 10, 2); px(c, P.woodD, 3 + dx, 11, 10, 1);                              // asiento
    px(c, P.wood3, 4 + dx * 2, 1, 8, 1); px(c, P.wood3, 4 + dx * 2, 2, 1, 7); px(c, P.wood3, 11 + dx * 2, 2, 1, 7); // respaldo: travesaño y montantes
    [6, 8, 10].forEach((x) => px(c, P.wood3, x + dx * 2, 3, 1, 6));                                     // barrotes
    px(c, P.woodD, 3 + dx, 7, 1, 3); px(c, P.woodD, 12 + dx, 7, 1, 3);                                // reposabrazos
  };
  D('rocking_chair', 16, 16, (c) => rockingChair(c, 0), OUT);
  D('rocking_chair_f', 16, 16, (c) => rockingChair(c, 1), OUT);
  D('rocking_chair_b', 16, 16, (c) => rockingChair(c, -1), OUT);

  const nightWindow = (c, shadow) => { // la ventana de noche del caso 1 (window_night) con o sin silueta detrás del cristal
    px(c, P.wood3, 1, 0, 14, 14); px(c, '#2c3a73', 3, 2, 10, 10);
    if (shadow) { px(c, '#0b0a1c', 6, 3, 4, 3); px(c, '#0b0a1c', 7, 6, 2, 1); px(c, '#0b0a1c', 4, 7, 8, 5); px(c, '#1a1838', 7, 4, 1, 1); } // cabeza y hombros
    else { px(c, '#fff2a8', 10, 3, 2, 2); px(c, '#fff', 5, 4, 1, 1); }
    px(c, P.wood3, 7, 2, 2, 10); px(c, P.wood3, 3, 6, 10, 2); px(c, P.woodD, 0, 13, 16, 2); px(c, P.wood1, 0, 12, 16, 1);
  };
  D('window_dark', 16, 16, (c) => nightWindow(c, false), OUT);
  D('window_shadow', 16, 16, (c) => nightWindow(c, true), OUT);

  D('decal_sauce', 16, 16, (c) => { // charco de salsa de tomate (versión absurda de la mancha, hermana de decal_jam)
    px(c, 'rgba(206,64,36,0.78)', 3, 7, 10, 4); px(c, 'rgba(206,64,36,0.78)', 5, 5, 7, 8); px(c, 'rgba(206,64,36,0.78)', 2, 9, 12, 2);
    px(c, 'rgba(255,164,120,0.75)', 7, 7, 2, 1); px(c, 'rgba(255,255,255,0.65)', 7, 7, 1, 1);
    px(c, 'rgba(206,64,36,0.78)', 13, 6, 1, 1); px(c, 'rgba(206,64,36,0.78)', 1, 12, 1, 1); px(c, 'rgba(206,64,36,0.6)', 14, 12, 1, 1);
  });

  G.ANIM_MAX_PER_ROOM = 6;
  const blinkSeq = (n, spots) => { const a = new Array(n).fill(0); spots.forEach((i) => { a[i] = 1; }); return a; };
  G.ANIMS = {
    police_car_0: { frames: ['police_car_0', 'police_car_1'], fps: 3, sync: true, glow: { sprites: ['police_glow_0', 'police_glow_1'], dx: 0, dy: -4 } },
    police_tape_h: { frames: ['police_tape_h', 'police_tape_h_w1', 'police_tape_h_w2', 'police_tape_h_w3'], fps: 4 },
    police_tape_v: { frames: ['police_tape_v', 'police_tape_v_w1', 'police_tape_v_w2', 'police_tape_v_w3'], fps: 4 },
    decal_puddle: { frames: ['decal_puddle', 'decal_puddle_g1', 'decal_puddle_g2', 'decal_puddle_g1'], fps: 2 },
    lamp_post_blink: { frames: ['lamp_post_blink', 'lamp_post_dim'], fps: 4, seq: blinkSeq(48, [20, 22, 23, 39]), glow: { sprites: ['lamp_glow_0', 'lamp_glow_1'], dx: 0, dy: -2 } },
    interrogation_table: { frames: ['interrogation_table_lit', 'interrogation_table_dim'], fps: 4, seq: blinkSeq(40, [14, 16, 30]) },
    // 4C-4b: la silla se mece despacio (3 pasos en un vaivén) y la sombra asoma 0,75 s cada 13 s (el id estático es la ventana sin sombra)
    rocking_chair: { frames: ['rocking_chair', 'rocking_chair_f', 'rocking_chair', 'rocking_chair_b'], fps: 1.4 },
    window_dark: { frames: ['window_dark', 'window_shadow'], fps: 4, seq: blinkSeq(52, [34, 35, 36]) },
  };
  const animPhase = (key) => (key === undefined || key === null ? 0 : G.hash(String(key)) % 997);
  // Estado de la animación del sprite `id` en el instante t (segundos del reloj del mundo): { name, glow } o null si no se anima.
  // `key` desfasa a cada objeto (id del objeto) para que no parpadeen todos a la vez; con `sync` no hay desfase.
  G.animState = (id, t, key) => {
    const a = G.ANIMS[id];
    if (!a) return null;
    const n = a.seq ? a.seq.length : a.frames.length;
    const step = Math.floor((t || 0) * a.fps + (a.sync ? 0 : animPhase(key)));
    const idx = a.seq ? a.seq[((step % n) + n) % n] : ((step % n) + n) % n;
    const g = a.glow ? { sprite: a.glow.sprites[idx], dx: a.glow.dx || 0, dy: a.glow.dy || 0 } : null;
    return { name: a.frames[idx], idx, glow: g };
  };
  G.animFrame = (id, t, key) => { const s = G.animState(id, t, key); return s ? s.name : id; };

})(typeof window !== 'undefined' ? window : globalThis);
