// Pruebas rápidas sin navegador: guardado, código de sala, hash estable.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sb = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, Uint32Array, parseInt, isFinite, Infinity, Proxy, setTimeout, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary'), unescape, escape, encodeURIComponent, decodeURIComponent };
sb.globalThis = sb; sb.crypto = require('crypto').webcrypto;
sb.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
vm.createContext(sb);
['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js', 'logic.js', 'schema.js', 'net.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), sb, { filename: f }));
const G = sb.G;
let fails = 0;
const t = (name, ok) => { console.log((ok ? '  ok  ' : ' FALLA ') + name); if (!ok) fails++; };

// guardado
const good = G.sanitizeSave({ v: 1, money: 50, rep: 3, upgrades: { speed: 2 }, settings: { difficulty: 'hard' } });
t('guardado válido se acepta', good && good.money === 50 && good.upgrades.speed === 2 && good.settings.difficulty === 'hard' && good.settings.music === true);
t('guardado de versión futura se rechaza', G.sanitizeSave({ v: 99 }) === null);
t('guardado sin versión se rechaza', G.sanitizeSave({ money: 5 }) === null);
t('dinero negativo/NaN → 0', G.sanitizeSave({ v: 1, money: -5, rep: 'x' }).money === 0 && G.sanitizeSave({ v: 1, money: -5, rep: 'x' }).rep === 0);
const evil = G.sanitizeSave(JSON.parse('{"v":1,"__proto__":{"polluted":1},"settings":{"__proto__":{"x":1}}}'));
t('__proto__ se elimina', evil && !('polluted' in evil) && !('x' in evil.settings) && ({}).polluted === undefined);
t('arrays no se cuelan como objetos', G.sanitizeSave({ v: 1, upgrades: [1, 2] }).upgrades && !Array.isArray(G.sanitizeSave({ v: 1, upgrades: [1, 2] }).upgrades));
G.save.data = G.defaultSave(); G.save.data.money = 77;
const exp = G.save.exportCode(); G.save.data = G.defaultSave();
t('exportar → importar conserva la partida', G.save.importCode(exp) && G.save.data.money === 77);
t('importar basura falla sin romper', G.save.importCode('LOC1.@@@') === false && G.save.importCode('hola') === false);
// partida en curso (run) con anidamiento profundo no se pierde
const run = { caseId: 'tarta', st: { clues: { a: { t: 1, via: 'x' } }, npc: { p: { trust: 1 } }, progress: { v: 2 } } };
const rr = G.sanitizeSave({ v: 1, run });
t('la partida guardada (run) sobrevive a la limpieza', rr.run && rr.run.st.clues.a.t === 1 && rr.run.st.npc.p.trust === 1);

// código de sala
const N = G.net;
const codes = new Set(); for (let i = 0; i < 200; i++) codes.add(N.genCode());
t('código de sala de ' + N.CODE_LEN + ' letras', [...codes].every((c) => c.length === N.CODE_LEN && /^[A-Z]+$/.test(c)));
t('códigos distintos entre sí', codes.size > 190);
t('cleanCode recorta y limpia', N.cleanCode('ab-cd efgh') === 'ABCDE');

// hash estable
t('hash estable', G.hash('tarta:pimienta') === G.hash('tarta:pimienta') && G.hash('a') !== G.hash('b'));
// versión
N.remote = { v: G.VERSION }; t('misma versión → sin aviso', !N.versionMismatch());
N.remote = { v: '0.0.1' }; t('versión distinta → aviso', N.versionMismatch());
N.remote = { g: 1 }; t('sin versión (copia antigua) → aviso', N.versionMismatch());
N.remote = null; t('sin compañero → sin aviso', !N.versionMismatch());

// herramientas como datos (fase 1A)
t('toolOwner: valores originales', G.toolOwner('lupa') === 'rex' && G.toolOwner('ganzua') === 'rex' && G.toolOwner('uv') === 'luna' && G.toolOwner('grabadora') === 'luna' && G.toolOwner('coop') === null);
t('toolsOf sin caso = herramientas del rol, y es una copia', G.toolsOf('rex').join() === 'lupa,ganzua' && G.toolsOf('rex') !== G.ROLES.rex.tools);
t('startToolOf: Oli 0, Lali 1 (UV apagada al empezar)', G.startToolOf('rex') === 0 && G.startToolOf('luna') === 1);
const alt = { tools: { rex: ['uv', 'lupa'], luna: ['ganzua', 'grabadora'] }, startTool: { rex: 1 } };
t('un caso puede repartir las herramientas distinto', G.toolOwner('uv', alt) === 'rex' && G.toolOwner('ganzua', alt) === 'luna' && G.startToolOf('rex', alt) === 1 && G.startToolOf('luna', alt) === 1);
t('startTool fuera de rango → 0', G.startToolOf('rex', { startTool: { rex: 9 } }) === 0);
t('roleName', G.roleName('rex') === 'Oli' && G.roleName('luna') === 'Lali');

// puertas en cualquier pared (fase 1B-1)
const TS = G.TS;
t('doorWall: sin wall = norte; desconocida = norte', G.doorWall({ x: 1, y: 0 }) === 'n' && G.doorWall({ wall: 'e' }) === 'e' && G.doorWall({ wall: 'zz' }) === 'n');
t('doorInside en las 4 paredes', JSON.stringify([G.doorInside({ x: 5, y: 0 }), G.doorInside({ x: 5, y: 9, wall: 's' }), G.doorInside({ x: 0, y: 4, wall: 'w' }), G.doorInside({ x: 9, y: 4, wall: 'e' })]) === JSON.stringify([{ x: 5, y: 1 }, { x: 5, y: 8 }, { x: 1, y: 4 }, { x: 8, y: 4 }]));
t('doorSpawn norte = posición de siempre (caso 1 igual que antes)', (() => { const a = G.doorSpawn({ x: 13, y: 0 }, 0), b2 = G.doorSpawn({ x: 13, y: 0 }, 1); return a.x === (13 + 0.5) * TS - 20 && a.y === 2 * TS - 10 && b2.x === (13 + 0.5) * TS + 20 && b2.y === 2 * TS - 10; })());
t('doorSpawn cae dentro de la baldosa de delante en las 4 paredes', [{ x: 5, y: 0 }, { x: 5, y: 9, wall: 's' }, { x: 0, y: 4, wall: 'w' }, { x: 9, y: 4, wall: 'e' }].every((d) => [0, 1].every((i) => { const sp = G.doorSpawn(d, i), ins = G.doorInside(d); return Math.floor(sp.x / TS) === ins.x && Math.floor((sp.y - 0.01) / TS) === ins.y; })));
t('doorRect y doorTarget norte iguales que antes', JSON.stringify(G.doorRect({ x: 3, y: 0 })) === JSON.stringify([3 * TS, 0, TS, TS]) && G.doorTarget({ x: 3, y: 0 }).y === TS * 0.9);
// formato oficial de caso (fase 1B-2)
const coreSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
const sfxPart = coreSrc.slice(coreSrc.indexOf('sfx(name) {'), coreSrc.indexOf('setMode(m)'));
const coreSfx = [...sfxPart.matchAll(/case '(\w+)':/g)].map((m) => m[1]).sort().join();
t('G.SFX_NAMES coincide con los sonidos que suena core.js', coreSfx.length > 0 && coreSfx === G.SFX_NAMES.slice().sort().join());
t('formato de caso: versión 1', G.CASE_FORMAT === 1);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'case1.js'), 'utf8'), sb, { filename: 'case1.js' });
const tarta = G.CASES.tarta;
t('el caso 1 cumple el formato (sin errores ni avisos)', (() => { const r = G.checkCaseFormat(tarta); return r.shapeOk && !r.errors.length && !r.warnings.length; })());
t('suelos válidos: los sprites floor_* sin la variante de madera', G.floorNames().join() === 'wood,tile,cobble,grass,carpet,lab');
const st1 = new G.CaseState(tarta, 'normal');
t('salas accesibles en el capítulo 1: arranque y cocina sí; almacén y callejón no', st1.roomAccessible('tienda') && st1.roomAccessible('cocina') && !st1.roomAccessible('almacen') && !st1.roomAccessible('callejon'));
st1.chapter = 2;
t('salas accesibles desde el capítulo 2: almacén y callejón también', st1.roomAccessible('almacen') && st1.roomAccessible('callejon'));
const altStart = JSON.parse(JSON.stringify(tarta)); altStart.start = { room: 'almacen', p1: [5, 5], p2: [6, 5] };
t('la sala de arranque la define el caso (ya no hay salas fijas en el motor)', new G.CaseState(altStart, 'normal').roomAccessible('almacen') && G.checkCaseFormat(altStart).errors.length === 0);
t('comprobador de formato: lo que no es un caso se rechaza sin reventar', [null, 'x', 7, [], {}].every((x) => { const r = G.checkCaseFormat(x); return r.shapeOk === false && r.errors.length > 0; }));
process.exit(fails ? 1 : 0);
