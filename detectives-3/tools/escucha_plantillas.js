// escucha_plantillas.js — A4 HERR-1 2/4: ¿dónde puede escuchar la grabadora en CADA plantilla de sala? (solo lectura)
// Para cada plantilla busca un «rincón de charla»: dos personajes uno junto al otro (a y b), la zona de escucha justo debajo
// (2×1) y un hueco libre para el detective debajo de la zona; todo en baldosas libres, alcanzable desde el arranque (6,7) y
// sin pisar nada reservado (puertas, huecos de objetos, huecos especiales, multitud, carril central del capítulo...).
// Uso: node tools/escucha_plantillas.js            → tabla y resumen (sale con código 1 si alguna plantilla no encaja)
//      node tools/escucha_plantillas.js --json     → solo el JSON {plantilla: {x,y,w,h,a:{x,y,face},b:{x,y,face}}}
const G = require('./load_g.js')(['gen_data.js', 'bible.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
// (copia de la lógica de `reservedOf` de compile.js: lo que la fábrica ya considera ocupado)
function reserved(t) {
  const res = new Set(), add = (x, y) => res.add(y * 64 + x);
  add(6, 7); add(7, 7); for (let x = 5; x <= 11; x++) add(x, 5);
  (t.doorX || []).forEach((x) => { add(x, 1); add(x, 0); });
  Object.keys(t.special || {}).forEach((k) => { const sp = t.special[k]; add(sp.x, sp.y); if (sp.dx !== undefined) add(sp.x + sp.dx, sp.y + sp.dy); if (k === 'coche') add(sp.x + 1, sp.y); });
  (t.slots || []).forEach((q) => add(q[0], q[1]));
  (t.crowd || []).forEach((q) => add(q[0], q[1]));
  (t.scenery || []).forEach((q) => add(q.x, q.y));
  (t.decor || []).concat(t.decals || []).forEach((q) => { for (let yy = 0; yy < (q.h || 1); yy++) for (let xx = 0; xx < (q.w || 1); xx++) add(q.x + xx, q.y + yy); });
  return res;
}
function solid(t) { // lo que NO se puede pisar (para comprobar que se llega)
  const s = new Set(), add = (x, y) => s.add(y * 64 + x);
  (t.scenery || []).forEach((q) => add(q.x, q.y));
  (t.slots || []).forEach((q) => add(q[0], q[1]));
  (t.crowd || []).forEach((q) => add(q[0], q[1]));
  Object.keys(t.special || {}).forEach((k) => { const sp = t.special[k]; add(sp.x, sp.y); if (k === 'coche') add(sp.x + 1, sp.y); });
  return s;
}
function reach(t, blocked) {
  const map = G.roomMap(t), seen = new Set([7 * 64 + 6]), q = [[6, 7]];
  while (q.length) {
    const [x, y] = q.shift();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy, k = ny * 64 + nx;
      if (nx < 0 || ny < 0 || ny >= t.h || nx >= t.w || map[ny][nx] === '#' || blocked.has(k) || seen.has(k)) return;
      seen.add(k); q.push([nx, ny]);
    });
  }
  return seen;
}
function spotFor(t) {
  const res = reserved(t), map = G.roomMap(t), bl = solid(t), cand = [];
  for (let y = 2; y <= t.h - 4; y++) for (let x = 1; x <= t.w - 3; x++) {
    const tiles = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2]];
    if (tiles.some(([a, b]) => map[b][a] === '#' || res.has(b * 64 + a))) continue;
    const extra = new Set(bl); tiles.slice(0, 2).forEach(([a, b]) => extra.add(b * 64 + a)); // los dos personajes ocupan su baldosa
    const r = reach(t, extra);
    if (!tiles.slice(2).every(([a, b]) => r.has(b * 64 + a))) continue;
    // reparto de espacio: lejos de lo reservado (más es mejor) y sin bloquear el paso (las baldosas libres alcanzables no bajan)
    let near = 99; res.forEach((k) => { const rx = k % 64, ry = (k / 64) | 0; tiles.forEach(([a, b]) => { near = Math.min(near, Math.abs(a - rx) + Math.abs(b - ry)); }); });
    const r0 = reach(t, bl).size, r1 = reach(t, extra).size;
    if (r1 < r0 - 2) continue; // taparía una zona entera
    cand.push({ x, y, near, y2: y });
  }
  cand.sort((p, q) => q.near - p.near || p.y2 - q.y2 || p.x - q.x);
  const c = cand[0];
  return c ? { x: c.x, y: c.y + 1, w: 2, h: 1, a: { x: c.x, y: c.y, face: 'right' }, b: { x: c.x + 1, y: c.y, face: 'left' }, _cands: cand.length, _near: c.near } : null;
}
const out = {}, fail = [];
Object.values(G.GEN_DATA.rooms).forEach((l) => [].concat(l).forEach((t) => { const s = spotFor(t); if (s) out[t.id] = s; else fail.push(t.id); }));
if (process.argv.includes('--json')) { Object.keys(out).forEach((k) => { delete out[k]._cands; delete out[k]._near; }); console.log(JSON.stringify(out)); process.exit(0); }
Object.keys(out).forEach((k) => { const s = out[k]; console.log(k.padEnd(20), `zona ${s.x},${s.y} ${s.w}×${s.h}  a(${s.a.x},${s.a.y}) b(${s.b.x},${s.b.y})  candidatos ${s._cands}  distancia a lo reservado ${s._near}`); });
console.log(`\n${Object.keys(out).length} de ${Object.keys(out).length + fail.length} plantillas con rincón de charla` + (fail.length ? ' · SIN ENCAJE: ' + fail.join(', ') : ''));
process.exit(fail.length ? 1 : 0);
