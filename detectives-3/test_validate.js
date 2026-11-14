// Prueba sin navegador: carga los módulos con un canvas falso y valida los casos.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sandbox = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, parseInt, isFinite, Infinity, Proxy };
sandbox.globalThis = sandbox;
sandbox.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
vm.createContext(sandbox);
const files = process.argv.slice(2);
for (const f of files) {
  const code = fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const G = sandbox.G;
G.save = { data: { settings: {}, upgrades: {} } };
let bad = 0;
Object.keys(G.CASES).forEach((id) => {
  const r = G.validateCase(G.CASES[id]);
  console.log(`Caso ${id}: ${r.ok ? 'OK' : 'ERRORES'} · pistas alcanzables ${r.reached}/${r.total} · capítulo final ${r.chapter}`);
  r.errors.forEach((e) => console.log('  ERROR:', e));
  r.warnings.forEach((e) => console.log('  aviso:', e));
  if (!r.ok) bad++;
});

// herramientas rotas a propósito: el validador debe protestar
const clone = (o) => JSON.parse(JSON.stringify(o));
const base = G.CASES.tarta;
const expectErr = (name, mut, re) => {
  const d = clone(base); mut(d);
  const r = G.validateCase(d);
  const ok = !r.ok && r.errors.some((e) => re.test(e));
  console.log(`${ok ? 'OK' : 'FALLA'} · validador detecta: ${name}`);
  if (!ok) bad++;
};
expectErr('herramienta inexistente', (d) => { d.tools = { rex: ['martillo'], luna: ['uv'] }; }, /inexistente "martillo"/);
expectErr('herramienta repetida en dos personajes', (d) => { d.tools = { rex: ['lupa', 'ganzua'], luna: ['uv', 'lupa'] }; }, /dos personajes/);
expectErr('herramienta necesaria que nadie lleva', (d) => { d.tools = { rex: ['lupa'], luna: ['uv', 'grabadora'] }; }, /no la lleva ningún personaje/);
expectErr('startTool fuera de rango', (d) => { d.startTool = { luna: 7 }; }, /startTool fuera de rango/);
{
  const d = clone(base); d.tools = { rex: ['uv', 'lupa'], luna: ['ganzua', 'grabadora'] };
  const r = G.validateCase(d);
  console.log(`${r.ok ? 'OK' : 'FALLA'} · caso válido con herramientas repartidas distinto`);
  if (!r.ok) { bad++; r.errors.forEach((e) => console.log('  ERROR:', e)); }
}

// puertas rotas a propósito (fase 1B-1)
const doorOf = (d, rid, id) => d.rooms[rid].doors.find((x) => x.id === id);
expectErr('pared desconocida', (d) => { doorOf(d, 'cocina', 'puerta_tienda').wall = 'x'; }, /pared desconocida/);
expectErr('puerta del sur fuera del muro sur', (d) => { doorOf(d, 'cocina', 'puerta_tienda').wall = 's'; }, /no está en el muro sur/);
expectErr('puerta del este fuera del muro este', (d) => { const o = doorOf(d, 'cocina', 'puerta_tienda'); o.wall = 'e'; o.x = 5; o.y = 4; }, /no está en el muro este/);
expectErr('puerta en una esquina', (d) => { doorOf(d, 'cocina', 'puerta_tienda').x = 0; }, /esquina/);
expectErr('baldosa del muro que no es pared', (d) => { const r = d.rooms.cocina; r.map[0] = r.map[0].slice(0, 3) + ',' + r.map[0].slice(4); }, /no es pared/);
expectErr('delante de la puerta hay pared', (d) => { const r = d.rooms.cocina; r.map[1] = r.map[1].slice(0, 3) + '#' + r.map[1].slice(4); }, /es pared, nadie podría llegar/);
expectErr('objeto sólido delante de la puerta', (d) => { d.rooms.cocina.props.push({ id: 'bloqueo', sprite: 'crate', x: 3, y: 1, solid: true, label: 'Caja' }); }, /objeto sólido delante de la puerta/);
expectErr('dos puertas en la misma baldosa', (d) => { doorOf(d, 'cocina', 'puerta_almacen').x = 3; }, /comparte baldosa/);
expectErr('id de puerta repetido', (d) => { doorOf(d, 'cocina', 'puerta_almacen').id = 'puerta_tienda'; }, /id de puerta repetido/);
{
  const d = clone(base);
  const set = (id, wall, x, y) => { const o = doorOf(d, 'cocina', id); o.wall = wall; o.x = x; o.y = y; };
  set('puerta_tienda', 's', 3, 11); set('puerta_almacen', 'w', 0, 6); set('puerta_trasera', 'e', 21, 4);
  const r = G.validateCase(d);
  console.log(`${r.ok ? 'OK' : 'FALLA'} · caso válido con puertas en sur, oeste y este`);
  if (!r.ok) { bad++; r.errors.forEach((e) => console.log('  ERROR:', e)); }
}
// formato oficial de caso (fase 1B-2): cada caso roto a propósito debe ser rechazado con el mensaje adecuado
expectErr('falta un campo obligatorio', (d) => { delete d.title; }, /falta el campo obligatorio «title»/);
expectErr('errata en un nombre de campo', (d) => { d.parSecond = 5; }, /campo desconocido «parSecond»/);
expectErr('tipo equivocado', (d) => { d.level = '1'; }, /caso\.level: debe ser un número/);
expectErr('número no entero', (d) => { d.rooms.tienda.props[0].x = 1.5; }, /debe ser un número entero/);
expectErr('id de caso con mayúsculas', (d) => { d.id = 'Tarta'; }, /caso\.id/);
expectErr('formato de una versión futura', (d) => { d.format = 2; }, /formato 2/);
expectErr('sala de arranque inexistente', (d) => { d.start.room = 'sotano'; }, /sala de arranque «sotano» no existe/);
expectErr('jugador que arranca dentro de una pared', (d) => { d.start.p1 = [0, 0]; }, /caso\.start\.p1.*es pared/);
expectErr('cliente que no es personaje', (d) => { d.clientId = 'nadie'; }, /cliente «nadie»/);
expectErr('icono de pista inexistente', (d) => { d.clues.vitrina_vacia.icon = 'ico_nada'; }, /icono «ico_nada»/);
expectErr('tipo de pista desconocido', (d) => { d.clues.vitrina_vacia.kind = 'rumor'; }, /valor «rumor»/);
expectErr('sospecha sobre un sospechoso inexistente', (d) => { d.clues.huellas_gato.sus = { fantasma: 1 }; }, /«fantasma» no es un sospechoso/);
expectErr('capítulos mal numerados', (d) => { d.chapters[1].id = 5; }, /deben numerarse 1, 2, 3/);
expectErr('objetivo con pista inexistente', (d) => { d.chapters[0].goals[0].clue = 'nope'; }, /la pista «nope» no existe/);
expectErr('objetivo con una bandera que nadie pone', (d) => { d.chapters[0].goals[3].flags = ['talked_merengue', 'nunca_jamas']; }, /bandera «nunca_jamas» nadie la pone/);
expectErr('objetivo con clue y flags a la vez', (d) => { d.chapters[0].goals[0].flags = ['x']; }, /exactamente uno de clue, clues o flags/);
expectErr('sala a la que no se puede llegar', (d) => { d.rooms.sotano = { name: 'S', map: ['####', '#..#', '####'], props: [], doors: [] }; }, /no hay camino de puertas desde la sala de arranque/);
expectErr('borde del mapa abierto', (d) => { const r = d.rooms.cocina; r.map[5] = r.map[5].slice(0, 21) + '.'; }, /borde del mapa debe ser todo pared/);
expectErr('objeto que se sale del mapa', (d) => { d.rooms.cocina.props.push({ id: 'largo', sprite: 'crate', x: 20, y: 5, w: 5, h: 1 }); }, /se sale del mapa/);
expectErr('suelo desconocido', (d) => { d.rooms.tienda.floor = 'lava'; }, /valor «lava»/);
expectErr('puerta cerrada con herramienta inexistente', (d) => { d.rooms.cocina.doors[1].locked.tool = 'ariete'; }, /herramienta «ariete» no existe/);
expectErr('quien habla no existe', (d) => { d.chapters[0].intro[0].who = 'fantasma'; }, /quien habla, «fantasma»/);
expectErr('personaje sin colocación', (d) => { delete d.placement.merengue; }, /merengue: no tiene colocación/);
expectErr('colocación en capítulos desordenados', (d) => { d.placement.pimienta.reverse(); }, /orden creciente/);
expectErr('personaje colocado fuera del mapa', (d) => { d.placement.hogaza[0].x = 99; }, /fuera de la sala tienda/);
expectErr('sonido inexistente', (d) => { d.npcs.merengue.press[0].fx.sfx = 'bum'; }, /valor «bum»/);
expectErr('condición con pista inexistente', (d) => { d.npcs.merengue.topics[0].responses[0].when = { clue: 'nope' }; }, /la condición usa la pista «nope»/);
expectErr('condición con bandera que nadie pone (errata)', (d) => { d.npcs.merengue.topics[1].show = { flag: 'merengue_crackd' }; }, /exige la bandera «merengue_crackd»/);
expectErr('mentira que el personaje nunca dice', (d) => { d.lies.pimienta.flag = 'lie_otra'; }, /esa mentira nunca se dirá/);
expectErr('mover un objeto que no existe', (d) => { d.rooms.cocina.props.find((p) => p.id === 'nevera').steps[0].fx.moveProp.id = 'zzz'; }, /objeto «zzz» no existe en esta sala/);
expectErr('charla del compañero en una sala inexistente', (d) => { d.banter.rex.enter.sotano = ['hola']; }, /sala «sotano» no existe/);
expectErr('herramientas de un personaje que no existe', (d) => { d.tools = { pepe: ['lupa'] }; }, /«pepe» no es un personaje jugable/);
{
  // formato correcto con el campo opcional de versión: debe aceptarse igual que el caso 1
  const d = clone(base); d.format = 1;
  const r = G.validateCase(d);
  console.log(`${r.ok ? 'OK' : 'FALLA'} · caso con format: 1 explícito`);
  if (!r.ok) { bad++; r.errors.forEach((e) => console.log('  ERROR:', e)); }
  // entradas que no son un caso: no deben reventar
  [null, 'hola', 42, [], {}].forEach((x) => {
    const q = G.validateCase(x);
    const ok = q && q.ok === false && q.errors.length > 0;
    console.log(`${ok ? 'OK' : 'FALLA'} · validateCase(${JSON.stringify(x)}) se rechaza sin reventar`);
    if (!ok) bad++;
  });
  // el id del caso debe coincidir con su clave en G.CASES
  Object.keys(G.CASES).forEach((k) => { const ok = G.CASES[k].id === k; console.log(`${ok ? 'OK' : 'FALLA'} · id del caso «${k}» coincide con su clave`); if (!ok) bad++; });
  // el caso 1 no genera avisos de formato
  const r1 = G.checkCaseFormat(G.CASES.tarta);
  console.log(`${r1.shapeOk && !r1.errors.length && !r1.warnings.length ? 'OK' : 'FALLA'} · el caso 1 pasa el formato sin errores ni avisos`);
  if (!(r1.shapeOk && !r1.errors.length && !r1.warnings.length)) { bad++; console.log(r1); }
}
process.exit(bad ? 1 : 0);
