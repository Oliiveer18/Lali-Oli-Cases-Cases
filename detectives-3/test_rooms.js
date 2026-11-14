// Prueba de las plantillas de sala (4C-1a y 4C-2a): datos puros en G.GEN_DATA.rooms (lista de variantes con peso por lugar), usadas por el compilador (room.template).
// Comprueba: varias variantes por lugar base (≥ 2; ≥ 3 en el callejón, con variantes de calle y `crowd`), mapas bien formados, huecos libres y alcanzables (arranque, personajes, puertas, objetos, huecos especiales),
// sprites que existen, el compilador las usa en 5000 semillas (casos válidos, ids únicos, determinismo), la huella ve las plantillas y el caso 1 no cambia. Uso: node test_rooms.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const RT = G.GEN_DATA.rooms, PLACES = G.GEN_DATA.places.concat(G.GEN_DATA.reservedPlaces || []).map((p) => p.id), ALLT = [].concat(...PLACES.map((pid) => RT[pid].map((t) => Object.assign({ pid }, t))));
const START = [[6, 7], [7, 7]], NPCROW = [5, 6, 7, 8, 9, 10, 11].map((x) => [x, 5]);
const K = (x, y) => x + ',' + y;

ok('4F-0b 2/4: el Despacho está EN RESERVA (en reservedPlaces, no en places) y tiene ≥ 3 variantes', (G.GEN_DATA.reservedPlaces || []).map((p) => p.id).join() === 'despacho' && !G.GEN_DATA.places.some((p) => p.id === 'despacho') && RT.despacho.length >= 3);
ok('hay una lista de variantes por lugar base (' + PLACES.join(', ') + ')', Object.keys(RT).sort().join() === PLACES.slice().sort().join() && PLACES.every((pid) => Array.isArray(RT[pid])));
ok('≥ 2 variantes por lugar y ≥ 3 en el callejón', PLACES.every((pid) => RT[pid].length >= (pid === 'callejon' ? 3 : 2)), PLACES.map((pid) => pid + ':' + RT[pid].length).join(' '));
ok('los ids de variante son únicos, no vacíos y todos con peso positivo', new Set(ALLT.map((t) => t.id)).size === ALLT.length && ALLT.every((t) => /^[a-z0-9_]+$/.test(t.id) && (t.weight === undefined || t.weight > 0)));
ok('todos los suelos y estilos de pared de las variantes existen en el esquema del caso (G.floorNames; wallStyle solo «stone»)', ALLT.every((t) => G.floorNames().indexOf(t.floor) >= 0 && (!t.wallStyle || t.wallStyle === 'stone')), ALLT.filter((t) => G.floorNames().indexOf(t.floor) < 0).map((t) => t.id + ':' + t.floor).join());
ok('hay ≥ 5 suelos distintos y ≥ 8 tamaños de mapa distintos entre todas las variantes', new Set(ALLT.map((t) => t.floor)).size >= 5 && new Set(ALLT.map((t) => t.w + 'x' + t.h)).size >= 8, [...new Set(ALLT.map((t) => t.floor))].join());
ok('la primera variante de cada lugar es la plantilla de 4C-1a (tienda_vitrinas, cocina_hornos, almacen_estantes, callejon_farolas, taller_banco)', ['tienda_vitrinas', 'cocina_hornos', 'almacen_estantes', 'callejon_farolas', 'taller_banco'].every((id, i) => RT[PLACES[i]][0].id === id));
ok('`scene` solo vale interior o calle, y las de calle son solo del callejón, con `crowd` de ≥ 3 baldosas', ALLT.every((t) => (t.scene === undefined || t.scene === 'interior' || t.scene === 'calle') && ((t.scene === 'calle') === Array.isArray(t.crowd)) && (t.scene !== 'calle' || (t.pid === 'callejon' && t.crowd.length >= 3))));
ok('hay ≥ 2 variantes de calle y los suelos de la calle ya existen (cobble o grass; el de acera/asfalto es arte de 4C-3a)', ALLT.filter((t) => t.scene === 'calle').length >= 2 && ALLT.filter((t) => t.scene === 'calle').every((t) => ['cobble', 'grass'].indexOf(t.floor) >= 0));

// ---- cada plantilla por separado
ALLT.forEach((t) => {
  const pid = t.pid, map = G.roomMap(t), errs = [], W = t.w, H = t.h;
  const free = (x, y) => map[y] && map[y][x] !== undefined && map[y][x] !== '#';
  const solids = new Set(), occ = {}; // baldosas con objeto sólido
  const put = (what, x, y) => { if (!(x >= 1 && y >= 1 && x <= W - 2 && y <= H - 2)) errs.push(`${what} fuera del interior (${x},${y})`); else if (!free(x, y)) errs.push(`${what} sobre una pared (${x},${y})`); if (occ[K(x, y)]) errs.push(`${what} pisa a ${occ[K(x, y)]} en (${x},${y})`); occ[K(x, y)] = what; };
  t.scenery.forEach((q, i) => { put('scenery' + i, q.x, q.y); solids.add(K(q.x, q.y)); if (!G.spr[q.sprite]) errs.push('sprite inexistente ' + q.sprite); });
  t.slots.forEach((q, i) => { put('slot' + i, q[0], q[1]); solids.add(K(q[0], q[1])); if (!G.spr[q[2]]) errs.push('sprite inexistente ' + q[2]); });
  ['cerradura', 'rincon', 'empujable'].forEach((k) => { const q = t.special[k]; if (!q) { errs.push('falta el hueco especial ' + k); return; } put('hueco ' + k, q.x, q.y); });
  if (t.special.escena) { put('escena', t.special.escena.x, t.special.escena.y); solids.add(K(t.special.escena.x, t.special.escena.y)); } // 4C-3b-2: hueco de la escena de policía (objeto sólido de 1 baldosa)
  if (t.special.coche) { const cq = t.special.coche; put('coche', cq.x, cq.y); put('coche (2.ª baldosa)', cq.x + 1, cq.y); solids.add(K(cq.x, cq.y)); solids.add(K(cq.x + 1, cq.y)); if (t.scene !== 'calle') errs.push('solo las plantillas de calle llevan hueco de coche'); }
  if (t.scene === 'calle' && !t.special.coche) errs.push('falta el hueco del coche de policía');
  if (!t.special.escena) errs.push('falta el hueco especial escena');
  const e = t.special.empujable; if (e) { const tx = e.x + e.dx, ty = e.y + e.dy; if (!free(tx, ty) || occ[K(tx, ty)]) errs.push(`el objeto empujable no tiene baldosa libre hacia (${e.dx},${e.dy}): (${tx},${ty})`); if (Math.abs(e.dx) + Math.abs(e.dy) !== 1) errs.push('empuje debe ser de una baldosa en una dirección'); }
  t.decor.concat(t.decals).forEach((q, i) => { if (!G.spr[q.sprite]) errs.push('sprite inexistente ' + q.sprite); if (!(q.x >= 0 && q.x < W && q.y >= 0 && q.y < H)) errs.push('decoración fuera del mapa ' + K(q.x, q.y)); });
  // baldosas reservadas: arranque, fila de personajes y acceso a las puertas, libres de objetos y paredes
  const reserved = START.concat(NPCROW, t.doorX.map((x) => [x, 1]));
  reserved.forEach(([x, y]) => { if (!free(x, y)) errs.push(`baldosa reservada (${x},${y}) es pared o no existe`); if (occ[K(x, y)]) errs.push(`baldosa reservada (${x},${y}) ocupada por ${occ[K(x, y)]}`); });
  t.doorX.forEach((x) => { if (map[0][x] !== '#') errs.push('la puerta ' + x + ' no está en pared'); });
  if (t.doorX[0] === t.doorX[1]) errs.push('las dos puertas están en la misma baldosa');
  if (t.slots.length < 6) errs.push('menos de 6 huecos de objetos');
  if (!map.every((r) => r.length === W) || map.length !== H) errs.push('mapa mal formado');
  // alcanzabilidad desde el arranque (sin cruzar paredes ni objetos sólidos)
  const seen = new Set([K(6, 7)]), q = [[6, 7]];
  while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (free(nx, ny) && !solids.has(K(nx, ny)) && !seen.has(K(nx, ny))) { seen.add(K(nx, ny)); q.push([nx, ny]); } }); }
  reserved.forEach(([x, y]) => { if (!seen.has(K(x, y))) errs.push(`baldosa reservada (${x},${y}) inalcanzable`); });
  if (t.scene === 'calle') (t.crowd || []).forEach(([x, y], i) => { if (!free(x, y)) errs.push(`curioso ${i} sobre una pared (${x},${y})`); else if (occ[K(x, y)]) errs.push(`curioso ${i} pisa a ${occ[K(x, y)]} en (${x},${y})`); else if (!seen.has(K(x, y))) errs.push(`curioso ${i} (${x},${y}) inalcanzable`); });
  if (t.scene === 'calle' && (t.crowd || []).some(([x, y], i, a) => a.findIndex((q) => q[0] === x && q[1] === y) !== i)) errs.push('curiosos repetidos');
  const nextTo = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(K(x + dx, y + dy)));
  t.slots.forEach((s, i) => { if (!nextTo(s[0], s[1])) errs.push(`el hueco ${i} (${s[0]},${s[1]}) no se puede tocar desde ninguna baldosa alcanzable`); });
  ['cerradura', 'rincon'].forEach((k) => { const h = t.special[k]; if (h && !(seen.has(K(h.x, h.y)) || nextTo(h.x, h.y))) errs.push('hueco ' + k + ' inalcanzable'); });
  if (e && !seen.has(K(e.x, e.y)) && !nextTo(e.x, e.y)) errs.push('hueco empujable inalcanzable');
  // con el A* REAL (G.findPath, el del bot y el del compañero IA): si el destino es sólido, elige la baldosa libre más cercana (en orden de lectura); si esa baldosa es un hueco cerrado, no se llega nunca al objeto
  { const sol = map.map((r) => r.split('').map((c) => c === '#')), mk = (x, y) => { if (sol[y] && sol[y][x] !== undefined) sol[y][x] = true; };
    t.scenery.forEach((q) => mk(q.x, q.y)); t.slots.forEach((q) => mk(q[0], q[1])); mk(t.special.cerradura.x, t.special.cerradura.y); mk(t.special.empujable.x, t.special.empujable.y); mk(t.special.escena.x, t.special.escena.y); if (t.special.coche) { mk(t.special.coche.x, t.special.coche.y); mk(t.special.coche.x + 1, t.special.coche.y); }
    const world = { room: { w: W, h: H, isSolidTile: (x, y) => x < 0 || y < 0 || x >= W || y >= H || sol[y][x] }, npcsHere: () => [] };
    t.slots.map((q) => ['hueco', q[0], q[1]]).concat([['cerradura', t.special.cerradura.x, t.special.cerradura.y], ['rincón', t.special.rincon.x, t.special.rincon.y], ['empujable', t.special.empujable.x, t.special.empujable.y], ['escena', t.special.escena.x, t.special.escena.y]].concat(t.special.coche ? [['coche', t.special.coche.x, t.special.coche.y], ['coche', t.special.coche.x + 1, t.special.coche.y]] : []), (t.crowd || []).map((q) => ['curioso', q[0], q[1]]), t.doorX.map((x) => ['puerta', x, 1]))
      .forEach(([k, x, y]) => { if (!G.findPath(world, 6, 7, x, y, 6000)) errs.push(`G.findPath no llega a ${k} (${x},${y}): la baldosa libre más cercana es un hueco cerrado`); }); }
  // 4D-2 (defecto 3): ninguna baldosa libre del interior puede quedar encerrada (una bolsa de suelo cerrada por objetos de ambiente: los objetos de 4C-4b y las curiosidades podrían caer dentro y nadie podría examinarlos)
  { const pockets = []; for (let y = 1; y <= H - 2; y++) for (let x = 1; x <= W - 2; x++) if (free(x, y) && !solids.has(K(x, y)) && !seen.has(K(x, y))) pockets.push(K(x, y)); if (pockets.length) errs.push('bolsa de suelo cerrada en ' + pockets.join(' ')); }
  const freeCount = [...Array(H).keys()].reduce((n, y) => n + [...Array(W).keys()].filter((x) => free(x, y)).length, 0);
  ok(`variante ${t.id} de ${pid} (${t.scene || 'interior'}, ${W}×${H}, suelo ${t.floor}): ${t.scenery.length} objetos de ambiente, ${t.slots.length} huecos, ${freeCount - solids.size} baldosas libres, todo alcanzable`, errs.length === 0, errs.join(' | '));
});

// ---- el compilador las usa
const N = +process.env.SEEDS ? Math.min(5000, +process.env.SEEDS) : 5000; let invalid = 0, noTpl = 0, dupId = 0, wrongTpl = 0, why = '', maxProps = 0; const fpKeys = new Set(), tplUse = {}, sceneUse = { calle: 0, interior: 0 }; let sceneBad = 0, retried = 0, whyR = '', retriedBad = 0, maxAtt = 1; const retriedSeeds = [];
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s), def = r.def;
  if (!def) { invalid++; why = why || `semilla ${s}: ${r.error}`; continue; }
  // Desde A4 4/4 el revisor de reparto (EQ-1) provoca reintentos legítimos (~1,5 %, p. ej. semilla 40). Se acepta ≤ 3 % de reintentos, TODOS con caso aceptado (un reintento escondería una variante rechazada por el validador si se disparase de más).
  if (r.attempts !== 1) { retried++; maxAtt = Math.max(maxAtt, r.attempts); if (retriedSeeds.length < 5) retriedSeeds.push(s); if (!G.validateCase(def).ok) { retriedBad++; whyR = whyR || `semilla ${s}: ${r.attempts} intentos y el caso final no valida`; } }
  Object.keys(def.rooms).forEach((rid) => {
    const rm = def.rooms[rid], ids = rm.props.map((p) => p.id);
    if (!rm.template) noTpl++; else if (!RT[rid].some((t) => t.id === rm.template)) wrongTpl++; else tplUse[rm.template] = (tplUse[rm.template] || 0) + 1;
    if (new Set(ids).size !== ids.length) dupId++;
    maxProps = Math.max(maxProps, rm.props.filter((p) => p.id.indexOf('obj_') === 0).length);
  });
  if (s < 600 && !G.validateCase(def).ok) { invalid++; why = why || `semilla ${s}: ${G.validateCase(def).errors[0]}`; }
  if (s < 1000) fpKeys.add(G.caseFingerprint(def, r.bible).rooms);
  { const sc = G.caseFingerprint(def, r.bible).scene, has = Object.values(def.rooms).some((rm) => RT.callejon.some((t) => t.id === rm.template && t.scene === 'calle')); sceneUse[sc]++; if ((sc === 'calle') !== has) sceneBad++; }
}
ok(`${N} semillas: todas generan un caso aceptado`, invalid === 0, why);
console.log(`  · reintentos del generador: ${retried} de ${N} (${(100 * retried / N).toFixed(2)} %; máx. ${maxAtt} intentos; p. ej. semillas ${retriedSeeds.join(', ') || '-'})`);
ok(`${N} semillas: como mucho el 3 % necesita reintento (revisor EQ-1, A4 4/4) y todas acaban aceptadas (${retried} reintentos = ${(100 * retried / N).toFixed(2)} %)`, retried <= 0.03 * N && retriedBad === 0, whyR || `${retried} reintentos de ${N}`);
ok('todas las salas llevan room.template de una variante de SU lugar', noTpl === 0 && wrongTpl === 0, `sin plantilla ${noTpl}, equivocada ${wrongTpl}`);
ok('ids de objeto únicos en todas las salas (los de ambiente «decoN» no chocan con «obj_…»)', dupId === 0);
ok(`el máximo de objetos con pista en una sala (${maxProps}) cabe en los huecos de su plantilla (≥ 6)`, maxProps <= 6);
{ const per = ALLT.map((t) => tplUse[t.id] || 0), tot = per.reduce((a, b) => a + b, 0);
  const RES = (G.GEN_DATA.reservedPlaces || []).map((p) => p.id), ACT = ALLT.filter((t) => RES.indexOf(t.pid) < 0); // 4F-0b 2/4: las salas en reserva (Despacho) no se usan hasta 4F-0b 3/4
  ok(`4F-0b 2/4: las ${ALLT.length - ACT.length} variantes de las salas en reserva (${RES.join(', ')}) NO salen en ninguno de los ${N} casos`, ALLT.filter((t) => RES.indexOf(t.pid) >= 0).every((t) => !tplUse[t.id]));
  ok(`se usan TODAS las ${ACT.length} variantes de las salas activas en ${N} semillas, cada una cerca de su peso (±30 % relativo dentro de su lugar)`, ACT.every((t) => { const sameP = ALLT.filter((x) => x.pid === t.pid), wsum = sameP.reduce((a, x) => a + (x.weight === undefined ? 1 : x.weight), 0), tp = sameP.reduce((a, x) => a + (tplUse[x.id] || 0), 0), exp = ((t.weight === undefined ? 1 : t.weight) / wsum) * tp; return (tplUse[t.id] || 0) > 0 && Math.abs((tplUse[t.id] || 0) - exp) <= exp * 0.3; }), ACT.map((t) => t.id + ':' + (tplUse[t.id] || 0)).join(' '));
  const cal = sceneUse.calle / N;
  ok(`casos de calle entre el 25 y el 35 % (${(cal * 100).toFixed(1)} %) y la escena de la huella coincide con las plantillas`, cal >= G.FINGERPRINT_GOALS.sceneCalleMin && cal <= G.FINGERPRINT_GOALS.sceneCalleMax && sceneBad === 0, `calle ${sceneUse.calle}, interior ${sceneUse.interior}, incoherentes ${sceneBad}`); }
ok('la huella de caso ve las plantillas (campo rooms con ids de plantilla) y la escena (calle o interior)', [...fpKeys].every((k) => /_/.test(k) && !/mapa_/.test(k)) && fpKeys.size >= 2, [...fpKeys].slice(0, 3).join(' ; '));
{ const a = JSON.stringify(G.generateCase(777).def), b2 = JSON.stringify(G.generateCase(777).def); ok('determinismo: la misma semilla da exactamente el mismo caso', a === b2); }
{ const t0 = G.roomTemplate('tienda'), t1 = G.roomTemplate('callejon', () => 0.99); ok('roomTemplate sin azar devuelve la primera variante; con azar 0,99 la última, completa con los valores por defecto', t0.id === 'tienda_vitrinas' && t1.id === 'calle_plaza' && t1.scene === 'calle' && t0.scene === 'interior' && G.roomScene('calle_plaza') === 'calle' && G.roomScene('tienda_vitrinas') === 'interior' && G.roomScene('inventada') === 'interior'); }
{ const sa = G.compileBible(G.generateCase(55).bible), sb = G.compileBible(G.generateCase(55).bible); ok('el azar de las variantes es propio: recompilar la misma biblia da las mismas variantes', JSON.stringify(Object.values(sa.rooms).map((r) => r.template)) === JSON.stringify(Object.values(sb.rooms).map((r) => r.template))); }
{ const c1 = G.CASES.tarta; ok('el caso 1 no cambia: sin plantillas en sus salas y valida', Object.values(c1.rooms).every((r) => r.template === undefined) && G.validateCase(c1).ok && G.reviewCase(c1).fairness >= 90); }
{ const mk = G.compileBible; ok('si un lugar no tuviera plantilla, hay sala de relleno 14×9 (roomTemplate)', (() => { const t = G.roomTemplate('no_existe'); return t.id === 'relleno' && G.roomMap(t).length === 9 && G.roomMap(t)[0].length === 14 && t.slots.length === 4; })()); }
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
