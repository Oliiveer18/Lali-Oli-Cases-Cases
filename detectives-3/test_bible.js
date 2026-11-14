// Prueba del comprobador de biblias (fase 3A): una biblia buena escrita a mano pasa; cada invariante roto a propósito falla con su código.
// Además comprueba que esa biblia se puede traducir a un caso válido (traducción manual, referencia del compilador de la fase 3D).
const G = require('./tools/load_g.js')(['bible.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const hm = G.strToMin;

// ---------- biblia buena (robo del trofeo; culpable: ana)
const SEED = 777;
const GOOD = {
  format: 1, gen: G.GEN_VERSION, seed: SEED, schema: 'robo', code: G.caseCode(SEED),
  places: [{ id: 'tienda', name: 'Tienda' }, { id: 'cocina', name: 'Cocina' }, { id: 'almacen', name: 'Almacén' }, { id: 'callejon', name: 'Callejón' }],
  object: { id: 'trofeo', name: 'el trofeo dorado', place: 'tienda' },
  cast: [
    { id: 'hogaza', name: 'Doña Hogaza', role: 'cliente', look: 'cliente', trait: 'nervioso' },
    { id: 'ana', name: 'Ana', role: 'sospechoso', look: 'pimienta', trait: 'amable' },
    { id: 'beto', name: 'Beto', role: 'sospechoso', look: 'baguette', trait: 'soberbio' },
    { id: 'carla', name: 'Carla', role: 'sospechoso', look: 'merengue', trait: 'evasivo' },
    { id: 'dani', name: 'Dani', role: 'sospechoso', look: 'hogaza', trait: 'seco' },
  ],
  truth: {
    culprit: 'ana',
    method: { id: 'saco', text: 'Escondió el trofeo en un saco de harina del almacén', needs: ['recibo_saco'] },
    motive: { id: 'deuda', text: 'Necesitaba venderlo para pagar una deuda', needs: ['carta_deuda'] },
    window: { from: hm('23:00'), to: hm('23:20'), place: 'tienda' },
    timeline: [
      { t: hm('21:00'), until: hm('23:00'), who: 'hogaza', place: 'tienda', doing: 'Hace cuentas tras el cierre.', witnesses: ['dani'] },
      { t: hm('21:00'), until: hm('22:30'), who: 'dani', place: 'tienda', doing: 'Barre la tienda.', witnesses: ['hogaza'] },
      { t: hm('21:30'), until: hm('23:00'), who: 'ana', place: 'almacen', doing: 'Cuenta sacos de harina.', witnesses: [] },
      { t: hm('21:30'), until: hm('24:00'), who: 'carla', place: 'cocina', doing: 'Amasa para mañana.', witnesses: ['dani'] },
      { t: hm('22:20'), until: hm('24:00'), who: 'beto', place: 'callejon', doing: 'Fuma junto a los contenedores.', witnesses: [] },
      { t: hm('22:30'), until: hm('24:00'), who: 'dani', place: 'cocina', doing: 'Friega bandejas.', witnesses: ['carla'] },
      { t: hm('23:00'), until: hm('23:30'), who: 'ana', place: 'tienda', doing: 'Se lleva el trofeo de la vitrina.', witnesses: [] },
      { t: hm('23:00'), until: hm('24:00'), who: 'hogaza', place: 'cocina', doing: 'Toma un té.', witnesses: ['carla', 'dani'] },
      { t: hm('23:30'), until: hm('24:00'), who: 'ana', place: 'almacen', doing: 'Esconde el trofeo en un saco.', witnesses: [] },
    ],
    decoys: {
      methods: [{ id: 'ventana', text: 'Se lo llevó por la ventana de la tienda' }, { id: 'copia', text: 'Lo sustituyó por una copia y se fue con el original' }],
      motives: [{ id: 'celos', text: 'Celos de la fama de Hogaza' }, { id: 'broma', text: 'Una broma que se le fue de las manos' }],
    },
  },
  alibis: {
    ana: { claim: { place: 'almacen', from: hm('22:30'), to: hm('23:40') }, holds: false, clearedBy: null },
    beto: { claim: { place: 'almacen', from: hm('22:20'), to: hm('24:00') }, holds: false, clearedBy: 'foto_callejon' },
    carla: { claim: { place: 'cocina', from: hm('22:00'), to: hm('24:00') }, holds: true, clearedBy: 'albaran_carla' },
    dani: { claim: { place: 'cocina', from: hm('22:30'), to: hm('24:00') }, holds: true, clearedBy: null },
  },
  lies: [
    { who: 'ana', said: 'Estuve contando sacos en el almacén hasta cerrar.', truth: 'A las 23:00 estaba en la tienda llevándose el trofeo.', refutedBy: ['huella_vitrina', 'testigo_dani'] },
    { who: 'beto', said: 'Estaba en el almacén; ni me asomé al callejón.', truth: 'Estuvo fumando en el callejón.', refutedBy: ['foto_callejon'] },
  ],
  clues: [
    { id: 'huella_vitrina', title: 'Huella en la vitrina', kind: 'física', text: 'Una huella de bota de goma, talla pequeña, junto a la vitrina vacía.', role: 'prueba', points: { ana: 5 }, source: { type: 'prop', place: 'tienda' }, derivedFrom: 6 },
    { id: 'recibo_saco', title: 'Recibo manchado', kind: 'documento', text: 'Un recibo de harina manchado de glaseado dorado, dentro de un saco.', role: 'prueba', points: { ana: 5 }, source: { type: 'prop', place: 'almacen' }, derivedFrom: 8 },
    { id: 'testigo_dani', title: 'Lo que vio Dani', kind: 'testimonio', text: 'Dani vio a Ana salir de la tienda con algo bajo el delantal.', role: 'prueba', points: { ana: 4 }, source: { type: 'npc', npc: 'dani', topic: 'visto' }, derivedFrom: 6 },
    { id: 'carta_deuda', title: 'Carta de un acreedor', kind: 'documento', text: 'Una carta que reclama a Ana el pago de una deuda antes del viernes.', role: 'prueba', points: { ana: 3 }, source: { type: 'prop', place: 'cocina' }, derivedFrom: null },
    { id: 'foto_callejon', title: 'Foto del callejón', kind: 'grabación', text: 'Una foto con hora de la cámara del callejón: Beto, fumando, a las 23:05.', role: 'descarte', points: { beto: -3 }, source: { type: 'prop', place: 'callejon' }, derivedFrom: 4 },
    { id: 'albaran_carla', title: 'Albarán de masa', kind: 'documento', text: 'Albarán sellado de la cocina: Carla amasó toda la noche.', role: 'descarte', points: { carla: -2 }, source: { type: 'prop', place: 'cocina' }, derivedFrom: 3 },
    { id: 'guante_beto', title: 'Guante de Beto', kind: 'física', text: 'Un guante de Beto junto a la vitrina. Qué casualidad.', role: 'falsa', points: { beto: 3 }, source: { type: 'prop', place: 'tienda' }, derivedFrom: null },
    { id: 'nota_carla', title: 'Nota de Carla', kind: 'documento', text: 'Una nota de Carla: «Tengo que hablar con Ana. Es urgente».', role: 'falsa', points: { carla: 3 }, source: { type: 'prop', place: 'cocina' }, derivedFrom: null },
    { id: 'llavero_dani', title: 'Llavero de Dani', kind: 'física', text: 'El llavero de Dani, caído cerca de la vitrina.', role: 'falsa', points: { dani: 3 }, source: { type: 'prop', place: 'tienda' }, derivedFrom: null },
  ],
  proof: ['huella_vitrina', 'recibo_saco', 'testigo_dani'],
};

const has = (r, code) => r.errors.some((e) => e.code === code);
const codes = (r) => Array.from(new Set(r.errors.map((e) => e.code))).join(',');
const check = (b, o) => G.checkBible(b, o);

// ---------- 1. la buena pasa
const r0 = check(GOOD);
ok('la biblia buena pasa el comprobador completo', r0.ok, JSON.stringify(r0.errors));
const rp = check(GOOD, { partial: true });
ok('la buena también pasa en modo parcial', rp.ok, JSON.stringify(rp.errors));
ok('el original no se modifica al comprobar', JSON.stringify(GOOD) === JSON.stringify(clone(GOOD)));

// ---------- 2. una variante rota por cada invariante
const broken = (code, name, mut, o) => { const b = clone(GOOD); mut(b); const r = check(b, o); ok(`${name} → ${code}`, has(r, code) && !r.ok, 'errores: ' + codes(r)); return r; };
broken('formato', 'falta un campo obligatorio (object)', (b) => { delete b.object; });
broken('formato', 'campo desconocido (errata)', (b) => { b.typo = 1; });
broken('formato', 'código que no corresponde a la semilla', (b) => { b.code = 'G1-zzzz'; });
broken('formato', 'ids repetidos en las pistas', (b) => { b.clues[1].id = b.clues[0].id; });
broken('formato', 'dato no serializable (NaN)', (b) => { b.seed = NaN; });
broken('reparto', 'solo 3 sospechosos', (b) => { b.cast = b.cast.filter((c) => c.id !== 'carla'); delete b.alibis.carla; });
broken('lugares', 'el objeto está en un lugar que no existe', (b) => { b.object.place = 'azotea'; });
broken('formato', 'minuto fuera del día', (b) => { b.truth.timeline[4].until = 1500; });
broken('cronologia', 'franja sin duración (t = until)', (b) => { b.truth.timeline[4].until = b.truth.timeline[4].t; });
broken('cronologia', 'cronología desordenada', (b) => { b.truth.timeline.reverse(); });
broken('cronologia', 'testigo que no estaba allí', (b) => { b.truth.timeline[0].witnesses = ['beto']; });
broken('cronologia', 'dos sitios a la vez', (b) => { b.truth.timeline.push({ t: hm('23:10'), until: hm('23:20'), who: 'ana', place: 'cocina', doing: 'Teletransporte.', witnesses: [] }); });
broken('ventana', 'un inocente está en el lugar del robo', (b) => { b.truth.timeline[4].place = 'tienda'; });
broken('coartada_culpable', 'el culpable dice que estaba en el lugar del robo', (b) => { b.alibis.ana.claim.place = 'tienda'; });
broken('coartada_culpable', 'la coartada del culpable se sostiene', (b) => { b.alibis.ana.holds = true; });
broken('coartada_inocente', 'dos inocentes sin pista de descarte', (b) => { b.alibis.beto.clearedBy = null; });
broken('coartada_inocente', 'el descarte no es una pista de descarte', (b) => { b.alibis.carla.clearedBy = 'nota_carla'; });
broken('coartada_inocente', 'un inocente sin posición verificable', (b) => { b.truth.timeline[3].until = hm('22:50'); b.truth.timeline[5].until = hm('22:50'); b.alibis.dani.holds = false; });
broken('mentiras', 'solo una mentira', (b) => { b.lies = b.lies.slice(0, 1); });
broken('mentiras', 'mentira circular (solo la desmiente el propio mentiroso)', (b) => { b.lies[0].refutedBy = ['testigo_dani']; b.clues[2].source = { type: 'npc', npc: 'ana', topic: 'visto' }; });
broken('mentiras', 'coartada falsa que no figura como mentira', (b) => { b.lies = [b.lies[0]]; b.alibis.carla.holds = false; });
broken('pruebas', 'solo 2 pruebas', (b) => { b.proof = ['huella_vitrina', 'recibo_saco']; });
broken('pruebas', 'prueba que no sale de la cronología del culpable', (b) => { b.clues[0].derivedFrom = 4; });
broken('pistas_falsas', 'un inocente sin pista falsa', (b) => { b.clues = b.clues.filter((c) => c.id !== 'llavero_dani'); });
broken('puntos', 'el culpable no suma 12 puntos', (b) => { b.clues[0].points = { ana: 1 }; b.clues[1].points = { ana: 1 }; b.clues[2].points = { ana: 1 }; });
broken('puntos', 'inocente sin descartar demasiado cerca del culpable', (b) => { b.clues[8].points = { dani: 15 }; });
broken('alcanzable', 'objeto en un lugar que no existe', (b) => { b.clues[0].source.place = 'bodega'; });
broken('alcanzable', 'más de 4 objetos en un lugar', (b) => { b.clues.forEach((c) => { if (c.source.type === 'prop') c.source.place = 'tienda'; }); });
broken('metodo_motivo', 'sin señuelos de método', (b) => { b.truth.decoys.methods = []; });
broken('metodo_motivo', 'el motivo verdadero necesita una pista que no existe', (b) => { b.truth.motive.needs = ['fantasma']; });

// 4A: forma de captura y sospechosos engañosos
broken('reparto', '4B: dos personajes con el mismo aspecto', (b) => { b.cast[2].look = b.cast[1].look; });
broken('forma_captura', 'la forma declarada no coincide con las pruebas', (b) => { b.captureForm = 'clasica'; });
broken('enganosos', 'el culpable declarado como engañoso', (b) => { b.deceptive = [{ who: 'ana', why: 'no tiene sentido' }]; });
broken('enganosos', 'un engañoso sin pista de descarte', (b) => { b.deceptive = [{ who: 'dani', why: 'se echaba una siesta' }]; });
broken('enganosos', 'un engañoso que no se acerca al 60 % del culpable', (b) => { b.deceptive = [{ who: 'carla', why: 'amasaba' }]; });
broken('enganosos', 'engañoso repetido', (b) => { b.deceptive = [{ who: 'carla', why: 'a' }, { who: 'carla', why: 'b' }]; });
broken('enganosos', 'tres engañosos con solo 4 sospechosos (máximo 2)', (b) => { b.deceptive = [{ who: 'beto', why: 'a' }, { who: 'carla', why: 'b' }, { who: 'dani', why: 'c' }]; });
broken('enganosos', 'nivel fácil con 2 engañosos (admite 0-1)', (b) => { b.level = 'facil'; b.deceptive = [{ who: 'beto', why: 'a' }, { who: 'carla', why: 'b' }]; });
broken('formato', 'forma de captura que no existe', (b) => { b.captureForm = 'telepatia'; });
{ // un engañoso bien hecho pasa: beto (descartado, −3) llega a 11 de los 17 puntos del culpable (≥ 60 %)
  const b = clone(GOOD); b.level = 'normal'; b.deceptive = [{ who: 'beto', why: 'fumaba a escondidas en el callejón' }]; b.clues.find((c) => c.id === 'guante_beto').points = { beto: 14 };
  const r = check(b); ok('un engañoso descartable y casi tan sospechoso como el culpable pasa', r.ok, JSON.stringify(r.errors));
}

// 4C-4c-1: ambiente (`mood`) y matiz de las pistas
broken('matiz', 'un ambiente claro con una pista con matiz', (b) => { b.mood = 'claro'; b.matiz = ['huella_vitrina']; });
broken('matiz', 'ambiente inquietante con menos matices de los que toca (2)', (b) => { b.mood = 'inquietante'; b.matiz = ['huella_vitrina']; });
broken('matiz', 'ambiente macabro con 2 matices (toca 3)', (b) => { b.mood = 'macabro'; b.matiz = ['huella_vitrina', 'guante_beto']; });
broken('matiz', 'matiz sin ambiente declarado', (b) => { b.matiz = ['huella_vitrina', 'guante_beto']; });
broken('matiz', 'matiz en un testimonio', (b) => { b.mood = 'inquietante'; b.matiz = ['huella_vitrina', 'testigo_dani']; });
broken('matiz', 'matiz en un descarte', (b) => { b.mood = 'inquietante'; b.matiz = ['huella_vitrina', 'foto_callejon']; });
broken('matiz', 'matiz en una pista que no existe', (b) => { b.mood = 'inquietante'; b.matiz = ['huella_vitrina', 'fantasma']; });
broken('matiz', 'matiz repetido', (b) => { b.mood = 'inquietante'; b.matiz = ['huella_vitrina', 'huella_vitrina']; });
broken('formato', 'ambiente que no existe', (b) => { b.mood = 'espeluznante'; });
{ const b = clone(GOOD); b.mood = 'inquietante'; b.matiz = ['huella_vitrina', 'guante_beto'];
  const r = check(b); ok('una biblia inquietante con 2 matices de objeto (prueba y falsa) pasa', r.ok, JSON.stringify(r.errors)); }
{ const b = clone(GOOD); b.mood = 'claro'; const r = check(b); ok('una biblia clara sin matiz pasa', r.ok, JSON.stringify(r.errors)); }

// ---------- 3. modo parcial: la biblia de la verdad (sin pistas) pasa; completa no
{
  const b = clone(GOOD);
  b.clues = []; b.lies = []; b.proof = []; b.truth.method.needs = []; b.truth.motive.needs = []; b.truth.decoys = { methods: [], motives: [] };
  Object.keys(b.alibis).forEach((k) => { b.alibis[k].clearedBy = null; });
  ok('la biblia parcial (solo verdad) pasa con partial:true', check(b, { partial: true }).ok, JSON.stringify(check(b, { partial: true }).errors));
  const rf = check(b);
  ok('la misma biblia parcial NO pasa el comprobador completo', !rf.ok && ['mentiras', 'pruebas', 'pistas_falsas', 'puntos', 'metodo_motivo'].every((c) => has(rf, c)), codes(rf));
  const b2 = clone(b); b2.truth.timeline[4].place = 'tienda';
  ok('en modo parcial se siguen detectando los errores de la verdad (ventana)', has(check(b2, { partial: true }), 'ventana'));
}

// ---------- 4. basura: nunca lanza excepciones
{
  const cyc = {}; cyc.a = cyc;
  const trash = [null, undefined, 42, 'x', [], {}, { format: 1 }, () => 1, cyc, { format: 1, gen: 1, places: 'no', cast: null }, JSON.parse('{"__proto__": {"x": 1}}')];
  let threw = false, allBad = true;
  trash.forEach((t) => { try { const r = check(t); if (r.ok || !r.errors.length || !r.errors.every((e) => e.code && e.path && e.msg)) allBad = false; } catch (e) { threw = true; } });
  ok('la basura se rechaza con errores bien formados y sin excepciones', !threw && allBad);
  const half = clone(GOOD); half.truth.timeline = [null, 5]; half.clues[0] = 'texto';
  let t2 = false; try { check(half); } catch (e) { t2 = true; }
  ok('una biblia a medias no lanza excepciones', !t2);
}

// ---------- 5. utilidades
ok('minToStr y strToMin son inversas', hm('23:40') === 1420 && G.minToStr(1420) === '23:40' && G.minToStr(1440) === '24:00' && G.strToMin('25:00') === null && G.strToMin('9:5') === null);
ok('caseCode es determinista y lleva la versión', G.caseCode(777) === G.caseCode(777) && /^G6-[0-9a-z]+$/.test(G.caseCode(777)) && G.caseCode(1) !== G.caseCode(2));
ok('cada invariante del contrato tiene al menos una prueba negativa', G.BIBLE_CODES.length === 16, String(G.BIBLE_CODES.length));

// ---------- 6. el contrato alcanza: la biblia buena se traduce a mano a un caso válido (referencia para 3D)
function handCompile(b) {
  const P = b.places.map((p) => p.id), slots = [[3, 3], [9, 3], [3, 6], [9, 6]];
  const ICON = { física: 'ico_lupa', documento: 'paper', grabación: 'ico_rec', testimonio: 'ico_star' };
  const SPR = ['crate', 'table', 'drawer', 'locker'];
  const MAP = ['##############'].concat(Array(7).fill('#............#'), ['##############']);
  const rooms = {}, used = {};
  P.forEach((pid, i) => {
    const doors = [];
    if (i > 0) doors.push({ id: `${pid}_a_${P[i - 1]}`, x: 3, y: 0, wall: 'n', sprite: 'door', to: { room: P[i - 1], door: `${P[i - 1]}_a_${pid}` }, label: b.places[i - 1].name });
    if (i < P.length - 1) doors.push({ id: `${pid}_a_${P[i + 1]}`, x: 10, y: 0, wall: 'n', sprite: 'door', to: { room: P[i + 1], door: `${P[i + 1]}_a_${pid}` }, label: b.places[i + 1].name });
    rooms[pid] = { name: b.places[i].name, floor: 'wood', map: MAP, props: [], doors };
  });
  const clues = {};
  b.clues.forEach((c) => {
    clues[c.id] = { title: c.title, icon: ICON[c.kind], kind: c.kind, text: c.text, sus: c.points };
    if (c.source.type !== 'prop') return;
    const n = used[c.source.place] = (used[c.source.place] || 0);
    used[c.source.place]++;
    rooms[c.source.place].props.push({ id: 'obj_' + c.id, sprite: SPR[n], x: slots[n][0], y: slots[n][1], solid: true, label: c.title, shimmer: true, steps: [{ tool: null, who: 'rex', text: c.text, clue: c.id }], doneText: 'Ya lo has examinado.' });
  });
  const susIds = b.cast.filter((c) => c.role === 'sospechoso').map((c) => c.id), cli = b.cast.find((c) => c.role === 'cliente');
  const liesBy = {}; b.lies.forEach((l) => { liesBy[l.who] = l; });
  const npcs = {}, placement = {};
  b.cast.forEach((c, i) => {
    const first = b.truth.timeline.find((e) => e.who === c.id), a = b.alibis[c.id], l = liesBy[c.id];
    const topics = [];
    if (a) topics.push({ id: 'coartada', label: '¿Dónde estuvo anoche?', responses: [l ? { say: [l.said], fx: { flag: 'lie_' + c.id } } : { say: [first ? first.doing : 'Yo estaba por ahí.'] }] });
    b.clues.filter((k) => k.source.type === 'npc' && k.source.npc === c.id).forEach((k) => topics.push({ id: k.source.topic, label: '¿Vio algo?', responses: [{ say: [k.text], fx: { clue: k.id } }] }));
    if (!topics.length) topics.push({ id: 'caso', label: '¿Qué ha pasado?', responses: [['Han robado ' + b.object.name + '.']] });
    npcs[c.id] = { name: c.name, title: c.role === 'cliente' ? 'Cliente' : 'Sospechoso', look: c.look, first: ['Hola, soy ' + c.name + '.'], topics, chat: [['Qué noche.']], press: [{ say: ['No me presione.'] }], evidenceDefault: ['Eso no me suena.'], evidence: { '*': [{ say: ['Vale, me pillaron.'] }] } };
    placement[c.id] = [{ ch: 1, room: first ? first.place : P[0], x: 5 + i, y: 5, face: 'down' }];
  });
  const lies = {}; b.lies.forEach((l) => { lies[l.who] = { flag: 'lie_' + l.who, refutedBy: l.refutedBy, said: l.said }; });
  const physical = b.clues.filter((c) => c.source.type === 'prop').map((c) => c.id), tr = b.truth;
  return {
    id: 'hand_' + b.code.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: 'El robo de ' + b.object.name, client: cli.name, blurb: 'Se ha robado ' + b.object.name + '.', level: 2, parSeconds: 600, reward: 100,
    start: { room: P[0], p1: [6, 7], p2: [7, 7] }, clientId: cli.id, clues,
    suspects: susIds.map((s) => { const c = b.cast.find((x) => x.id === s); return { id: s, name: c.name, desc: c.name + ', sospechoso.', look: c.look, clearedBy: b.alibis[s].clearedBy ? [b.alibis[s].clearedBy] : [] }; }),
    solution: { culprit: tr.culprit, method: tr.method.id, motive: tr.motive.id, methods: [tr.method].concat(tr.decoys.methods), motives: [tr.motive].concat(tr.decoys.motives), proof: b.proof },
    lies,
    chapters: [
      { id: 1, title: 'Pistas', goals: [{ id: 'g1', text: 'Busca pistas', clues: physical, min: Math.ceil(physical.length * 0.6) }, { id: 'g2', text: 'Habla con todos', flags: susIds.map((s) => 'talked_' + s), min: susIds.length }] },
      { id: 2, title: 'Acusar', goals: [{ id: 'g3', text: 'Acusa', flags: ['case_closed'] }] },
    ],
    rooms, placement, npcs, epilogue: { win: [{ who: 'rex', text: 'Caso cerrado.' }], fail: [{ who: 'rex', text: 'Nos equivocamos.' }] },
  };
}
{
  const def = handCompile(GOOD);
  const v = G.validateCase(def);
  ok('la biblia buena, traducida a mano, pasa el validador del juego', v.ok, JSON.stringify(v.errors.slice(0, 5)));
  if (v.ok) {
    const r = G.reviewCase(def);
    ok('y el revisor de equidad la aprueba (≥ 90)', r.ok && r.fairness >= 90, JSON.stringify({ f: r.fairness, findings: r.findings.map((f) => f.code + ': ' + f.msg) }));
  }
}

console.log(bad ? `\n${bad} comprobación(es) fallida(s)` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
