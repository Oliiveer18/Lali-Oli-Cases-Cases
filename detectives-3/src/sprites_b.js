// sprites_b.js — personajes (generados por parámetros), gato e iconos.
(function (root) {
  'use strict';
  const G = root.G;
  const P = G.PAL;
  const OUT = { outline: '#2a1b30' };

  // Descripciones visuales de los personajes
  G.LOOKS = {
    rex: { skin: P.skin2, hair: '#3b2a20', style: 'short', coat: '#c9a063', coat2: '#a98242', pants: '#4a4a66', hat: 'fedora', hatCol: '#7a4a2b', band: P.red, extra: ['tie'] },
    luna: { skin: P.skin1, hair: '#5f3b8e', style: 'bun', coat: P.teal, coat2: P.teal2, pants: '#2f3c58', hat: 'none', extra: ['glasses'] },
    hogaza: { skin: P.skin1, hair: '#b86b3a', style: 'bun', coat: P.white, coat2: '#e3dac5', pants: '#7a5a8a', hat: 'chef', hatCol: P.white, extra: ['apron_pink', 'round'] },
    baguette: { skin: P.skin3, hair: '#2a1b30', style: 'short', coat: '#3a3f6b', coat2: P.white, pants: '#2a2a3a', hat: 'beret', hatCol: '#2a1b30', extra: ['mustache', 'stripes'] },
    merengue: { skin: P.skin1, hair: P.pink2, style: 'big', coat: P.pink, coat2: P.pink2, pants: '#e6a0b6', hat: 'none', extra: ['glasses', 'pearls'] },
    pimienta: { skin: P.skin2, hair: '#6a4a2a', style: 'short', coat: P.white, coat2: '#e3dac5', pants: '#3a3a52', hat: 'chef_small', hatCol: P.white, extra: ['apron_p', 'sweat'] },
    cliente: { skin: P.skin3, hair: '#2a1b30', style: 'short', coat: P.green, coat2: P.green2, pants: '#3a3a52', hat: 'none', extra: [] },
  };

  function drawChar(c, L, dir, frame) {
    const r = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const side = dir === 'side';
    const up = dir === 'up';
    const round = L.extra.includes('round');
    // piernas
    const ll = frame === 0 ? 4 : 3, rl = frame === 0 ? 3 : 4;
    if (side) {
      r(L.pants, 6, 17, 3, ll); r(P.ink, 6, 17 + ll - 1, 3, 1);
      r(L.pants, 8, 17, 3, rl); r(P.ink, 8, 17 + rl - 1, 4, 1);
    } else {
      r(L.pants, 5, 17, 3, ll); r(P.ink, 5, 17 + ll - 1, 3, 1);
      r(L.pants, 8, 17, 3, rl); r(P.ink, 8, 17 + rl - 1, 3, 1);
    }
    // cuerpo
    const bx = side ? 5 : round ? 3 : 4, bw = side ? 6 : round ? 10 : 8;
    r(L.coat, bx, 11, bw, 7);
    r(L.coat2, bx, 16, bw, 2);
    if (!side) { r(L.coat2, bx, 11, 1, 5); r(L.coat2, bx + bw - 1, 11, 1, 5); }
    if (L.extra.includes('stripes') && !up) for (let y = 12; y < 17; y += 2) r('#c7ccee', bx + 1, y, bw - 2, 1);
    if (L.extra.includes('tie') && dir === 'down') { r(P.red, 7, 11, 2, 1); r(P.red, 7, 12, 2, 4); r(P.red2, 7, 15, 2, 1); }
    if (L.extra.includes('apron_pink') && !up) { r('#f7c6d6', bx + 1, 13, bw - 2, 5); r('#e69ab4', bx + 1, 13, bw - 2, 1); }
    if (L.extra.includes('apron_p') && !up) {
      r('#fff', bx + 1, 12, bw - 2, 6); r('#e3dac5', bx + 1, 17, bw - 2, 1);
      if (dir === 'down') { r(P.red, 6, 13, 3, 1); r(P.red, 6, 14, 1, 3); r(P.red, 8, 14, 1, 1); r(P.red, 6, 15, 3, 1); }
    }
    if (L.extra.includes('pearls') && dir === 'down') { r('#fff', 6, 11, 1, 1); r('#fff', 8, 11, 1, 1); r('#fff', 7, 12, 1, 1); }
    // 4C-3a · piezas de policía: gabardina (solapas y cinturón), cinturón con hebilla, placa dorada y galones del comisario
    if (L.extra.includes('trench')) { if (dir === 'down') { r(L.coat2, 6, 11, 1, 3); r(L.coat2, 9, 11, 1, 3); } r(L.coat2, bx, 15, bw, 1); }
    if (L.extra.includes('belt')) { r('#15192e', bx, 15, bw, 1); if (dir === 'down') r('#f2c94c', 7, 15, 2, 1); }
    if (L.extra.includes('stars') && !side) { r('#f2c94c', bx, 11, 2, 1); r('#f2c94c', bx + bw - 2, 11, 2, 1); }
    if (L.extra.includes('badge') && !up) { r('#f2c94c', 9, 13, 2, 2); r('#fff6c0', 9, 13, 1, 1); }
    // brazos
    if (side) { r(L.coat2, 7, 12, 2, 4); r(L.skin, 7, 16, 2, 1); }
    else {
      r(L.coat2, bx - 1, 12, 1, 4); r(L.skin, bx - 1, 16, 1, 1);
      r(L.coat2, bx + bw, 12, 1, 4); r(L.skin, bx + bw, 16, 1, 1);
    }
    // cabeza
    const hx = side ? 5 : 4, hw = side ? 7 : 8;
    r(L.skin, hx, 4, hw, 8);
    r(L.skin === P.skin3 ? '#8f5a38' : '#d9a273', hx, 11, hw, 1);
    // pelo
    const hc = L.hair;
    if (up) {
      r(hc, hx - 1, 3, hw + 2, 9);
    } else if (L.style === 'big') {
      r(hc, 2, 1, 12, 5); r(hc, 2, 5, 3, 7); r(hc, 11, 5, 3, 7); r(hc, 4, 0, 8, 2); r('#f9c1d0', 5, 1, 3, 1);
    } else {
      r(hc, hx, 3, hw, 3);
      if (side) r(hc, hx, 3, 3, 7); else { r(hc, hx - 0, 4, 1, 4); r(hc, hx + hw - 1, 4, 1, 4); }
      if (L.style === 'bun') { r(hc, 6, 1, 4, 3); if (side) r(hc, 4, 3, 2, 3); }
    }
    // cara
    if (!up) {
      if (side) { r(P.ink, 10, 7, 1, 2); r(L.skin === P.skin3 ? '#8f5a38' : '#d9a273', 12, 8, 1, 2); }
      else { r(P.ink, 6, 7, 1, 2); r(P.ink, 9, 7, 1, 2); r('#c9755a', 7, 10, 2, 1); }
      if (L.extra.includes('mustache')) r('#2a1b30', side ? 9 : 6, 9, side ? 4 : 4, 1);
      if (L.extra.includes('glasses')) {
        if (side) { r('#2a1b30', 9, 6, 3, 1); r('#2a1b30', 9, 9, 3, 1); r('#2a1b30', 9, 7, 1, 2); r('#9fe3ff', 10, 7, 1, 2); }
        else { r('#2a1b30', 5, 6, 3, 1); r('#2a1b30', 8, 6, 3, 1); r('#2a1b30', 5, 9, 3, 1); r('#2a1b30', 8, 9, 3, 1); r('#2a1b30', 5, 7, 1, 2); r('#2a1b30', 10, 7, 1, 2); r('#2a1b30', 7, 7, 2, 1); }
      }
      if (L.extra.includes('sweat')) { r('#8fd6ff', 11, 5, 1, 2); r('#fff', 11, 5, 1, 1); }
      if (L.hair === P.pink2 && !side) r('#f4a6b8', 4, 9, 1, 1);
    }
    // sombrero
    const hatC = L.hatCol || '#444';
    if (L.hat === 'fedora') {
      r(hatC, 5, 0, 6, 4); r(L.band || P.red, 5, 3, 6, 1); r('#5d3920', 3, 4, 10, 1); r(hatC, 4, 4, 8, 1); r('#8f5c33', 6, 0, 3, 1);
    } else if (L.hat === 'beret') {
      r(hatC, 3, 1, 9, 3); r(hatC, 4, 0, 6, 1); r(hatC, 7, -1 + 1, 1, 1); r('#40294a', 5, 1, 3, 1); r(hatC, 3, 4, 10, 1);
    } else if (L.hat === 'chef') {
      r('#fff', 3, 0, 10, 4); r('#fff', 4, -1 + 1, 8, 1); r('#e3dac5', 3, 3, 10, 1); r('#fff', 4, 4, 8, 1); r('#d8d0bc', 4, 4, 8, 1);
    } else if (L.hat === 'chef_small') {
      r('#fff', 4, 0, 8, 4); r('#e3dac5', 4, 3, 8, 1); r('#fff', 5, 4, 6, 1); r('#e3dac5', 5, 4, 6, 1);
    } else if (L.hat === 'police_cap') { // 4C-3a: gorra de agente (copa, cinta oscura, visera y escudo dorado)
      r(hatC, 4, 0, 8, 3); r('#15192e', 4, 3, 8, 1); if (!up) r('#15192e', side ? 6 : 4, 4, side ? 8 : 8, 1); if (!up) r('#f2c94c', side ? 9 : 7, 1, 2, 2);
    } else if (L.hat === 'chief_cap') { // 4C-3a: gorra de comisario (copa clara más ancha, galón dorado y visera)
      r(hatC, 3, 1, 10, 2); r(hatC, 4, 0, 8, 1); r('#15192e', 4, 3, 8, 1); r('#f2c94c', 4, 2, 8, 1); if (!up) r('#15192e', side ? 6 : 4, 4, 8, 1); if (!up) r('#c9a82a', side ? 9 : 7, 0, 2, 1);
    } else if (L.hat === 'bowler') { // 4C-3a: bombín del inspector
      r(hatC, 5, 0, 6, 3); r(hatC, 4, 2, 8, 2); r('#1f1f2a', 3, 4, 10, 1); r('rgba(255,255,255,0.2)', 6, 0, 2, 1);
    }
  }

  G.makeChar = function (id, L) {
    const dirs = ['down', 'up', 'side'];
    dirs.forEach((d) => {
      for (let f = 0; f < 2; f++) {
        G.defSprite(`${id}_${d}_${f}`, 16, 22, (c) => drawChar(c, Object.assign({ extra: [] }, L), d, f), OUT);
      }
    });
  };
  Object.keys(G.LOOKS).forEach((k) => G.makeChar(k, G.LOOKS[k]));

  // ============================================================================
  // 4B · POOL DE ASPECTOS GENERADOS (asp_01…). Combina piezas que ya dibuja drawChar (piel, pelo, peinado, abrigo, pantalón, sombrero, extras):
  // NO hay dibujo nuevo y los 7 aspectos de arriba no cambian. El pool es DATOS puros (sin lienzo) y determinista (G.rng con semilla fija):
  // misma versión del código ⇒ mismos aspectos. Cada aspecto difiere de TODOS los demás (incluidos los 7 de arriba) en ≥ G.LOOK_MIN_DIFF atributos.
  // El generador de casos (gen_data.js, `looks`) reparte estos ids sin repetir ninguno dentro de un caso. Si se toca esta tabla, sube G.GEN_VERSION.
  // ============================================================================
  G.LOOK_POOL_SIZE = 36; G.LOOK_MIN_DIFF = 3;
  G.LOOK_PARTS = {
    skin: [P.skin1, P.skin2, P.skin3],
    hair: ['#2a1b30', '#3b2a20', '#6a4a2a', '#b86b3a', '#d9b25a', '#c8c8d0', '#5f3b8e', '#2f6f9a', '#a8322f', '#1f1f1f', '#8a5a3a', '#e8a0b8'],
    style: ['short', 'bun', 'big'], // (el pool reparte 55 % short, 20 % bun, 25 % big)
    coat: [[P.red, P.red2], [P.blue, P.blue2], [P.green, P.green2], [P.teal, P.teal2], [P.purple, P.purple2], [P.orange, '#c97a2a'], [P.yellow, '#c9a82a'], [P.pink, P.pink2], [P.grey, P.grey2], [P.brown, '#5d3920'], ['#3a3f6b', P.white], ['#2f5f4a', '#1f3f31']],
    pants: ['#4a4a66', '#2f3c58', '#3a3a52', '#7a5a8a', '#2a2a3a', '#6a4a2a', '#2f5f4a', '#8a3a3a'],
    hatCol: ['#7a4a2b', '#2a1b30', '#3a3f6b', '#a8322f', '#2f5f4a', '#c9a063'],
    extra: ['glasses', 'tie', 'stripes', 'sweat', 'round', 'pearls', 'mustache'],
  };
  // Distancia entre dos aspectos = nº de atributos distintos (piel, pelo, peinado, abrigo, pantalón, sombrero, extras). Los colores del sombrero solo cuentan si hay sombrero de color.
  G.lookDiff = function (a, b) {
    const ex = (l) => (l.extra || []).slice().sort().join('+');
    return [a.skin !== b.skin, a.hair !== b.hair, a.style !== b.style, a.coat !== b.coat, a.pants !== b.pants, (a.hat || 'none') !== (b.hat || 'none'), ex(a) !== ex(b)].filter(Boolean).length;
  };
  G.makeLookPool = function () {
    const Pt = G.LOOK_PARTS, r = G.rng(0x10075), pick = (a) => a[Math.floor(r() * a.length)], base = Object.keys(G.LOOKS), pool = [];
    const all = () => base.map((k) => G.LOOKS[k]).concat(pool.map((id) => G.LOOKS[id]));
    for (let tries = 0; pool.length < G.LOOK_POOL_SIZE && tries < 20000; tries++) {
      const sr = r(), style = sr < 0.55 ? 'short' : sr < 0.75 ? 'bun' : 'big', c = pick(Pt.coat), L = { skin: pick(Pt.skin), hair: pick(Pt.hair), style, coat: c[0], coat2: c[1], pants: pick(Pt.pants), hat: 'none', extra: [] };
      // reglas de buen gusto (lo que ya se dibuja bien): sombrero solo con pelo corto (o gorro de cocina con moño); el pelo grande no lleva sombrero
      const hr = r();
      if (style === 'short') L.hat = hr < 0.25 ? 'none' : hr < 0.5 ? 'fedora' : hr < 0.75 ? 'beret' : hr < 0.88 ? 'chef' : 'chef_small';
      else if (style === 'bun' && hr < 0.25) L.hat = 'chef';
      if (L.hat === 'fedora' || L.hat === 'beret') { L.hatCol = pick(Pt.hatCol); if (L.hat === 'fedora') L.band = P.red; }
      if (L.hat === 'chef' || L.hat === 'chef_small') { L.hatCol = P.white; L.coat = P.white; L.coat2 = '#e3dac5'; L.extra.push(r() < 0.5 ? 'apron_pink' : 'apron_p'); }
      const n = Math.floor(r() * 3); // 0-2 extras sueltos, sin duplicar y sin mezclar bigote con perlas
      for (let i = 0; i < n; i++) { const e = pick(Pt.extra); if (L.extra.indexOf(e) < 0 && !(e === 'mustache' && (style !== 'short' || L.extra.indexOf('pearls') >= 0)) && !(e === 'pearls' && L.extra.indexOf('mustache') >= 0) && !(e === 'tie' && L.extra.some((x) => x.indexOf('apron') === 0))) L.extra.push(e); }
      if (all().some((o) => G.lookDiff(L, o) < G.LOOK_MIN_DIFF)) continue;
      const id = 'asp_' + String(pool.length + 1).padStart(2, '0'); G.LOOKS[id] = L; pool.push(id);
    }
    return pool;
  };
  G.GEN_LOOK_IDS = G.makeLookPool();
  G.GEN_LOOK_IDS.forEach((k) => G.makeChar(k, G.LOOKS[k]));

  // ============================================================================
  // 4C-3a · ASPECTOS DE POLICÍA (agente_*, inspector_*, comisario_*). Se definen DESPUÉS del pool: el pool asp_01… y los 7 aspectos de siempre NO cambian.
  // Aún no los usa ningún caso generado (eso es 4C-3b). G.POLICE_LOOKS agrupa los ids por papel.
  // ============================================================================
  (function () {
    const U = ['#2f4a8a', '#223763'], T = (c, c2) => [c, c2];
    const defs = {
      agente_a: { skin: P.skin1, hair: '#3b2a20', style: 'short', coat: U[0], coat2: U[1], pants: '#1f2740', hat: 'police_cap', hatCol: '#2b3a6b', extra: ['badge', 'belt'] },
      agente_b: { skin: P.skin3, hair: '#1f1f1f', style: 'short', coat: U[0], coat2: U[1], pants: '#1f2740', hat: 'police_cap', hatCol: '#2b3a6b', extra: ['badge', 'belt', 'mustache'] },
      agente_c: { skin: P.skin2, hair: '#a8322f', style: 'short', coat: U[0], coat2: U[1], pants: '#1f2740', hat: 'police_cap', hatCol: '#2b3a6b', extra: ['badge', 'belt', 'glasses'] },
      inspector_a: { skin: P.skin2, hair: '#3b2a20', style: 'short', coat: T('#b59e72', '#8f7a54')[0], coat2: '#8f7a54', pants: '#3a3a52', hat: 'fedora', hatCol: '#6c7280', band: '#1f1f2a', extra: ['trench', 'badge'] },
      inspector_b: { skin: P.skin1, hair: '#c8c8d0', style: 'short', coat: '#8a8f9c', coat2: '#646a78', pants: '#2a2a3a', hat: 'bowler', hatCol: '#3a3a52', extra: ['trench', 'badge', 'mustache', 'glasses'] },
      inspector_c: { skin: P.skin3, hair: '#2a1b30', style: 'short', coat: '#6a4a2a', coat2: '#4a3220', pants: '#2f3c58', hat: 'fedora', hatCol: '#2a1b30', band: '#c9a82a', extra: ['trench', 'badge'] },
      comisario_a: { skin: P.skin2, hair: '#c8c8d0', style: 'short', coat: '#27386d', coat2: '#14204a', pants: '#14204a', hat: 'chief_cap', hatCol: '#f4f1e6', extra: ['stars', 'badge', 'belt', 'mustache'] },
      comisario_b: { skin: P.skin3, hair: '#1f1f1f', style: 'short', coat: '#27386d', coat2: '#14204a', pants: '#14204a', hat: 'chief_cap', hatCol: '#f4f1e6', extra: ['stars', 'badge', 'belt', 'glasses'] },
    };
    G.POLICE_LOOKS = { agente: ['agente_a', 'agente_b', 'agente_c'], inspector: ['inspector_a', 'inspector_b', 'inspector_c'], comisario: ['comisario_a', 'comisario_b'] };
    Object.keys(defs).forEach((k) => { G.LOOKS[k] = defs[k]; G.makeChar(k, defs[k]); });
  })();

  // ============================================================================
  // LALI (id interno 'luna') y OLI (id interno 'rex'): pixel art a medida.
  // Se dibujan a partir de mapas de letras (. = transparente). Vista frontal = el arte original;
  // espalda, perfil y pasos se derivan de él. Lienzo 18x24 con el borde ya incluido.
  // ============================================================================
  const CHARS = {
    luna: { // Lali
      pal: { a: '#2a1b30', b: '#e8c46a', c: '#c99a3e', d: '#f8dfcb', e: '#2fb06a', f: '#d9788a', g: '#7fb3e0', h: '#f7e9cb', i: '#fff2a8', j: '#ffd45a', k: '#5d8fc0', l: '#35559a', m: '#f06fa0', n: '#ffffff', o: '#e9a0b8' },
      feet: 2,
      down: [
        '...aaaaaaaaaa...',
        '..abbbbccbbbba..',
        '..abbbbccbbbba..',
        '..abbbbcbbbbba..',
        '..abbddddddbba..',
        '..abbddddddbba..',
        '..abbaaddaabba..',
        '..abbeeddeebba..',
        '..abcddddddcba..',
        '..acbddffddbca..',
        '.aabcghddhgcbaa.',
        'aggcbghhhhibcgga',
        'aggbcghhhhjcbgga',
        'aggcbghhhhgbcgga',
        'aggbcghhhhgcbgga',
        'akkcbllllllbckka',
        'addmmllllllmmdda',
        '.aabbllllllbbaa.',
        '...aallllllaa...',
        '...anonnnnona...',
        '....aaaaaaaa....',
      ],
      side: [
        '..aaaaaaaa..',
        '.abbbbbbbba.',
        '.abbbccbbba.',
        '.abbbbcbbba.',
        '.abbbbbbdda.',
        '.abbbbbbdda.',
        '.abbbbbbdaa.',
        '.abbbbbbdea.',
        '.abbbbbbddda',
        '.abbbbbbdfa.',
        '.abcbggddga.',
        '.acbcggggha.',
        '.abcbgkkgha.',
        '.acbcgkkgha.',
        '.abcbgmmgha.',
        '.acbclddlla.',
        '.ammllllllla',
        '..abbllllla.',
        '...alllllla.',
        '...annnnnnoa',
        '....aaaaaaaa',
      ],
      back(rows) {
        const g = rows.map((r) => r.split(''));
        for (let y = 4; y <= 9; y++) for (let x = 5; x <= 10; x++) g[y][x] = (x + y) % 4 === 0 ? 'c' : 'b';
        for (let x = 6; x <= 9; x++) g[10][x] = 'b';
        for (let y = 11; y <= 14; y++) { for (let x = 6; x <= 10; x++) g[y][x] = 'g'; g[y][6] = 'l'; g[y][9] = 'l'; }
        return g;
      },
    },
    rex: { // Oli
      pal: { a: '#2a1b30', b: '#3d2a1e', c: '#d9453d', d: '#54392a', e: '#241c26', f: '#3a3040', g: '#f3d9c0', h: '#14101a', i: '#f2705e', j: '#6d6578', k: '#c9755a', l: '#4a3426', m: '#d9a98a', n: '#a82f2f', o: '#c9747f', p: '#f09a3e', q: '#6b3a2a', r: '#ffffff', s: '#a85a66', t: '#f7f2e6', u: '#4a9a5a', y: '#cfeaff', z: '#ffffff' },
      feet: 3,
      // mitad izquierda del pelo de Oli = roja, mitad derecha = castaña (en el dibujo: rojo a la derecha de la imagen)
      down: [
        '...aa..a..a.a...',
        '..abbaabaacaca..',
        '..adeeeeeeeeca..',
        '..aeeffffffeea..',
        '.abeeeeeeeeeeca.',
        '.adbggggggggcca.',
        '.abbhhhhhhhhcia.',
        '.adhhzyhhzyhhca.',
        '.abmhyehhyehmia.',
        '.admhhhhhhhhmca.',
        '.abbgggkkgggcia.',
        '.allmggggggmnna.',
        'aooopqoooooooooa',
        'aooooqqrrooooooa',
        'aooooopqrroooooa',
        'aoooorrqqrrooooa',
        'aoossssspqsssooa',
        'aggssssssqqssgga',
        '.aaaooossopqaaa.',
        '...aooossoooa...',
        '...arrraarrra...',
        '..atutttttttua..',
        '...aaaaaaaaaa...',
      ],
      side: [
        '..aa..a.aa..',
        '.abbaabbabba',
        '.adeeeeeeeea',
        '.aefffffffea',
        '.abeeeeeeeea',
        '.adbggggggga',
        '.abbgggghhha',
        '.adbhhhhhyha',
        '.abbmmgghhha',
        '.adbmmggggga',
        '.abbggggggka',
        '.allmgggmaa.',
        '..aoooooooa.',
        '..aopqooooa.',
        '..aoopqoooa.',
        '..aoooqqooa.',
        '..asssspqsa.',
        '..assggsssa.',
        '...aooossoa.',
        '...aooossoa.',
        '...arrrrrrra',
        '..atutttttua',
        '...aaaaaaaa.',
      ],
      back(rows) {
        const g = rows.map((r) => r.split('').reverse()); // espejo: el rojo (izquierda de Oli) pasa a verse a la izquierda
        for (let y = 5; y <= 10; y++) for (let x = 4; x <= 11; x++) { const t = (x + y) % 3 === 0; g[y][x] = x <= 7 ? (t ? 'i' : 'c') : (t ? 'd' : 'b'); }
        return g;
      },
      swapL: { b: 'c', c: 'b', d: 'i', i: 'd', l: 'n', n: 'l' }, // perfil mirando a la izquierda: se ve el lado rojo
    },
  };

  // levanta un pie 1 px (mitad izquierda o derecha) para animar los pasos
  function liftFeet(g, feet, from, to) {
    const H = g.length, o = g.map((r) => r.slice());
    for (let x = from; x < to; x++) {
      for (let y = H - feet; y < H; y++) o[y - 1][x] = g[y][x];
      o[H - 1][x] = '.';
    }
    return o;
  }
  function defGrid(name, g, pal, topRow) {
    const w = g[0].length, h = g.length;
    const ox = Math.floor((18 - w) / 2), oy = 24 - h;
    G.defSprite(name, 18, 24, (c) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = g[y][x];
        if (ch !== '.' && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + ox, y + oy, 1, 1); }
      }
    });
    const s = G.spr[name];
    s.ox = 1; s.oy = 1; s.tw = 16; s.th = 22; s.top = Math.max(0, oy - 1) + (topRow || 0);
  }
  Object.keys(CHARS).forEach((id) => {
    const C = CHARS[id];
    const down = C.down.map((r) => r.split(''));
    const side = C.side.map((r) => r.split(''));
    const views = { down, up: C.back(C.down), side };
    if (C.swapL) views.sideL = side.map((r) => r.slice().reverse().map((ch) => C.swapL[ch] || ch));
    Object.keys(views).forEach((v) => {
      const g = views[v], W = g[0].length, mid = W / 2;
      // frame 0 = quieto, 1 = pie derecho arriba, 2 = pie izquierdo arriba
      defGrid(`${id}_${v}_0`, g, C.pal);
      defGrid(`${id}_${v}_1`, liftFeet(g, C.feet, mid, W), C.pal);
      defGrid(`${id}_${v}_2`, liftFeet(g, C.feet, 0, mid), C.pal);
    });
  });

  // Gato Bigotes (mira a la derecha)
  function drawCat(c, f, sit) {
    const r = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const O = '#f09a3e', D = '#c26a1c', W = '#fff4e0';
    if (sit) {
      r(O, 4, 6, 7, 6); r(D, 5, 6, 1, 3); r(D, 8, 6, 1, 3); r(W, 5, 10, 5, 2);
      r(O, 8, 2, 6, 5); r(O, 8, 1, 2, 2); r(O, 12, 1, 2, 2); r('#f5a8bd', 9, 2, 1, 1); r('#f5a8bd', 12, 2, 1, 1);
      r(P.ink, 10, 4, 1, 1); r(P.ink, 12, 4, 1, 1); r('#f5a8bd', 11, 5, 1, 1);
      r(O, 1, 8 + f, 3, 2); r(D, 1, 8 + f, 1, 2); r(O, 0, 6 + f, 2, 3);
    } else {
      r(O, 2, 5, 9, 5); r(D, 4, 5, 1, 3); r(D, 7, 5, 1, 3);
      r(O, 9, 2, 6, 5); r(O, 9, 1, 2, 2); r(O, 13, 1, 2, 2); r(P.ink, 11, 4, 1, 1); r(P.ink, 13, 4, 1, 1); r('#f5a8bd', 12, 5, 1, 1);
      r(O, f ? 3 : 2, 10, 2, 2); r(O, f ? 8 : 9, 10, 2, 2); r(W, f ? 3 : 2, 11, 2, 1); r(W, f ? 8 : 9, 11, 2, 1);
      r(O, 0, 3 + f, 3, 2); r(D, 0, 3 + f, 1, 2); r(O, 0, 2 + f, 1, 2);
    }
  }
  G.defSprite('cat_sit_0', 16, 12, (c) => drawCat(c, 0, true), OUT);
  G.defSprite('cat_sit_1', 16, 12, (c) => drawCat(c, 1, true), OUT);
  G.defSprite('cat_walk_0', 16, 12, (c) => drawCat(c, 0, false), OUT);
  G.defSprite('cat_walk_1', 16, 12, (c) => drawCat(c, 1, false), OUT);

  // ----- iconos 16x16 -----
  const D = G.defSprite;
  const px = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  D('ico_lupa', 16, 16, (c) => {
    px(c, '#5d3920', 9, 9, 2, 6); px(c, '#5d3920', 8, 8, 2, 2);
    px(c, '#7f5a38', 10, 10, 1, 5);
    px(c, P.grey2, 2, 1, 8, 8); px(c, '#cfeaf2', 3, 2, 6, 6); px(c, '#fff', 4, 3, 2, 2); px(c, P.grey2, 3, 1, 6, 1); px(c, P.grey2, 3, 8, 6, 1);
  }, OUT);
  D('ico_ganzua', 16, 16, (c) => {
    px(c, P.grey, 2, 8, 12, 2); px(c, P.grey2, 2, 10, 12, 1); px(c, P.grey, 11, 5, 2, 4); px(c, P.grey, 8, 6, 2, 3);
    px(c, P.red, 1, 7, 3, 4); px(c, P.red2, 1, 10, 3, 1);
  }, OUT);
  D('ico_uv', 16, 16, (c) => {
    px(c, P.greyD, 2, 6, 7, 5); px(c, P.grey2, 3, 7, 5, 3); px(c, P.purple, 9, 4, 4, 9); px(c, P.glow2, 10, 5, 2, 7);
    px(c, P.greyD, 3, 11, 3, 3);
  }, OUT);
  D('ico_rec', 16, 16, (c) => {
    px(c, P.greyD, 3, 3, 10, 11); px(c, P.grey, 4, 4, 8, 4); px(c, P.ink, 5, 5, 2, 2); px(c, P.ink, 9, 5, 2, 2);
    px(c, P.red, 11, 10, 2, 2); px(c, P.grey2, 4, 10, 5, 1); px(c, P.grey2, 4, 12, 5, 1);
  }, OUT);
  D('ico_hand', 16, 16, (c) => {
    px(c, P.skin1, 4, 6, 8, 7); px(c, P.skin1, 4, 3, 1, 4); px(c, P.skin1, 6, 2, 1, 5); px(c, P.skin1, 8, 2, 1, 5); px(c, P.skin1, 10, 3, 1, 4); px(c, P.skin1, 2, 8, 2, 2);
  }, OUT);
  D('ico_coin', 16, 16, (c) => {
    px(c, P.yellow, 3, 3, 10, 10); px(c, '#c9a000', 3, 11, 10, 2); px(c, '#fff2a8', 5, 4, 3, 2); px(c, '#c9a000', 7, 6, 2, 5); px(c, '#c9a000', 6, 6, 4, 1); px(c, '#c9a000', 6, 10, 4, 1);
  }, OUT);
  D('ico_book', 16, 16, (c) => {
    px(c, P.blue2, 2, 2, 12, 13); px(c, P.blue, 3, 2, 10, 12); px(c, P.white, 4, 3, 8, 10); px(c, P.grey, 5, 5, 6, 1); px(c, P.grey, 5, 7, 6, 1); px(c, P.grey, 5, 9, 4, 1);
    px(c, P.red, 11, 2, 2, 6);
  }, OUT);
  D('ico_bulb', 16, 16, (c) => {
    px(c, P.yellow, 4, 2, 8, 8); px(c, '#fff2a8', 5, 3, 3, 3); px(c, P.grey2, 6, 10, 4, 3); px(c, P.greyD, 6, 13, 4, 1); px(c, '#c9a000', 4, 8, 8, 2);
  }, OUT);
  const STAR = ['......xx......', '......xx......', '.....xxxx.....', '.....xxxx.....', 'xxxxxxxxxxxxxx', '.xxxxxxxxxxxx.', '..xxxxxxxxxx..', '...xxxxxxxx...', '...xxxxxxxx...', '..xxxxxxxxxx..', '..xxxx..xxxx..', '.xxx......xxx.'];
  const drawStar = (c, col, hi) => { STAR.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'x') px(c, col, 1 + x, 2 + y, 1, 1); }); if (hi) { px(c, hi, 6, 4, 1, 2); px(c, hi, 5, 6, 2, 1); } };
  D('ico_star', 16, 16, (c) => drawStar(c, P.yellow, '#fff6c2'), OUT);
  D('ico_star_off', 16, 16, (c) => drawStar(c, '#5a5070', null), OUT);
  D('ico_heart', 16, 16, (c) => {
    px(c, P.red, 2, 4, 5, 5); px(c, P.red, 9, 4, 5, 5); px(c, P.red, 3, 8, 10, 3); px(c, P.red, 5, 11, 6, 2); px(c, P.red, 7, 13, 2, 1); px(c, '#ff9a8f', 3, 5, 2, 2);
  }, OUT);
  D('ico_fire', 16, 16, (c) => {
    px(c, P.orange, 5, 6, 6, 8); px(c, P.red, 4, 9, 8, 5); px(c, P.yellow, 6, 9, 4, 5); px(c, P.orange, 7, 2, 2, 5); px(c, '#fff2a8', 7, 11, 2, 3);
  }, OUT);
  D('ico_lock', 16, 16, (c) => {
    px(c, P.grey, 5, 2, 6, 6); px(c, P.ink, 7, 4, 2, 4); px(c, P.yellow, 3, 7, 10, 7); px(c, '#c9a000', 3, 12, 10, 2); px(c, P.ink, 7, 9, 2, 3);
  }, OUT);
  D('ico_clue', 16, 16, (c) => {
    px(c, P.glow, 2, 2, 12, 12); px(c, P.teal2, 2, 12, 12, 2); px(c, '#fff', 4, 3, 3, 2);
    px(c, P.ink, 7, 5, 3, 1); px(c, P.ink, 9, 6, 1, 2); px(c, P.ink, 7, 8, 3, 1); px(c, P.ink, 7, 10, 2, 1);
  }, OUT);
  D('ico_exclaim', 16, 16, (c) => {
    px(c, P.white, 2, 1, 12, 10); px(c, P.white, 6, 11, 4, 2); px(c, P.red, 7, 3, 2, 5); px(c, P.red, 7, 9, 2, 1);
  }, OUT);
  D('ico_question', 16, 16, (c) => {
    px(c, P.white, 2, 1, 12, 10); px(c, P.white, 6, 11, 4, 2); px(c, P.blue2, 6, 3, 4, 1); px(c, P.blue2, 9, 4, 1, 2); px(c, P.blue2, 7, 6, 2, 1); px(c, P.blue2, 7, 8, 2, 1);
  }, OUT);
  D('ico_key', 16, 16, (c) => {
    px(c, P.yellow, 2, 3, 5, 5); px(c, P.ink, 4, 5, 1, 1); px(c, P.yellow, 7, 5, 7, 2); px(c, P.yellow, 11, 7, 2, 3); px(c, '#c9a000', 7, 6, 7, 1);
  }, OUT);
  D('ico_arrow', 16, 16, (c) => {
    px(c, P.yellow, 6, 1, 4, 8); px(c, P.yellow, 3, 8, 10, 2); px(c, P.yellow, 5, 10, 6, 2); px(c, P.yellow, 7, 12, 2, 2); px(c, '#c9a000', 9, 3, 1, 6);
  }, OUT);
  D('ico_cake', 16, 16, (c) => {
    px(c, P.white, 2, 10, 12, 3); px(c, P.pink2, 3, 6, 10, 5); px(c, P.pink, 3, 5, 10, 2); px(c, P.red, 7, 2, 2, 3);
  }, OUT);
})(typeof window !== 'undefined' ? window : globalThis);
