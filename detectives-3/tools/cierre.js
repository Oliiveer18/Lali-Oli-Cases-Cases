// cierre.js — ejecuta pruebas UNA A UNA (nunca dos a la vez), guarda un log por prueba y un RESUMEN de una línea por prueba.
// Pensado para los cierres de paquete: se lanza una vez y se lee un solo resumen, sin esperas a ciegas.
//
// Uso:
//   node tools/cierre.js bot --bg          lanza el perfil «bot» en segundo plano y vuelve al instante
//   node tools/cierre.js --espera=240      espera (máx. 240 s) a que acabe y escribe el resumen; código 0 verde · 1 rojo · 2 sigue corriendo
//   node tools/cierre.js --resumen         escribe el resumen tal como está ahora (sin esperar)
//   node tools/cierre.js --lista           enseña los perfiles
//   node tools/cierre.js test_a.js test_b.js "test.js@--jobs=1@--only=Validar casos"   (lista a medida; «@» separa los argumentos)
// Opciones: --seguir (no parar en el primer rojo) · --timeout=600 (segundos por prueba)
// REINTENTO de rojos ambientales (--reintento=auto|siempre|no; por defecto auto): una prueba que falla se repite UNA vez, a solas, si el fallo parece del entorno
//   (cortada por tiempo, prueba de navegador, o el log habla de ETIMEDOUT/ECONNREFUSED/EADDRINUSE/Chrome/DevTools…). Si pasa al repetir se cuenta como verde pero se marca
//   «✓⟳ … verde TRAS REPETIR» y el FIN lista cuántas fueron (para vigilarlas); si vuelve a fallar es rojo real. `siempre` repite cualquier rojo; `no` no repite nada.
// MEMORIA DE VERDES (Q-2/3): una prueba que pasó en verde NO se repite mientras no cambie nada de lo que usa (src/, vendor/, assets/, build.js, su fichero y lo que éste cargue o
//   lance, los docs/ que lea con nombre y dist/ si la menciona, sus argumentos y la versión de Node). Se muestra como «⏭ … ya en verde con este mismo código» y el FIN cuenta las saltadas
//   y el tiempo ahorrado. Se guarda en .cierre_verdes.json (en el proyecto, para que viaje en el ZIP). Opciones: --fresco (repite todo y reescribe) · --sin-memoria (ni lee ni escribe)
//   · --memoria (enseña qué sigue vigente, sin ejecutar nada). Un rojo borra el verde guardado de esa prueba.
// PERFIL «suite» (Q-3/3): `npm test` (test.js) por pasos. Lee los pasos de test.js y corre cada uno por separado (de uno en uno, con candado, reintento y memoria), con las mismas
//   comprobaciones que test.js (salida esperada y ningún ERR:/EXC:/console.error en las de navegador). «Construir» va primero y SIEMPRE se ejecuta (no se memoriza).
//   node tools/cierre.js suite --bg · suite-rapido (sin navegador, como `npm run test:fast`) · --solo=a,b (solo los pasos cuyo nombre, fichero o grupo —navegador, touch, online— contenga
//   alguna palabra) · --seeds=N (tope de semillas, como test.js) · `--lista suite` enseña los pasos · `--memoria suite` enseña cuáles siguen vigentes.
// Logs: <tmp>/cierre/<prueba>.log · resumen: <tmp>/cierre/resumen.txt · candado: <tmp>/cierre/lock
// Un perfil o una lista corre SIEMPRE de uno en uno; si ya hay un cierre vivo, este se niega a arrancar (evita solapes).
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = process.env.CIERRE_DIR || path.join(os.tmpdir(), 'cierre');
const SUM = path.join(DIR, 'resumen.txt'), LOCK = path.join(DIR, 'lock');

// Perfiles = listas de pruebas (datos; se pueden editar sin tocar el resto).
const PERFILES = {
  bot: ['test_mass.js', 'test_duracion.js', 'test_reparto.js', 'test_tiempo_muerto.js', 'test_charlas.js', 'test_compile.js',
    'test.js@--jobs=1@--only=Validar casos', 'test.js@--jobs=1@--only=Revisor de equidad', 'test.js@--jobs=1@--only=Bot de recorrido'],
  linea: ['tools/baseline.js@--comparar'], // mide UNA vez (unos 2,5 min) y compara con docs/BASELINE.json sin reescribirlo
  rapido: ['test_compile.js', 'test_monedas.js', 'test_marco.js', 'test_filler.js', 'test_meter.js'],
};

const args = process.argv.slice(2);
const flag = (k) => args.some((a) => a === '--' + k || a.startsWith('--' + k + '='));
const val = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const items = args.filter((a) => !a.startsWith('--'));
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const lockPid = () => { try { return +fs.readFileSync(LOCK, 'utf8').trim() || 0; } catch (e) { return 0; } };
const fmt = (s) => (s >= 60 ? Math.floor(s / 60) + ' min ' + String(Math.round(s % 60)).padStart(2, '0') + ' s' : Math.round(s * 10) / 10 + ' s');
const readSum = () => { try { return fs.readFileSync(SUM, 'utf8'); } catch (e) { return ''; } };
const verdict = (t) => (/^FIN /m.test(t) ? (/ 0 en rojo/.test(t) ? 0 : 1) : 2);

if (val('seeds', '')) process.env.SEEDS = val('seeds', '');

// ---- perfil «suite»: los pasos de test.js (se leen de allí: una sola fuente de verdad)
const META = {}; // elemento -> { nombre, base, must, nav, nomem, extra }
function pasosSuite(rapido, solo) {
  const src = fs.readFileSync(path.join(ROOT, 'test.js'), 'utf8'), corte = src.indexOf('const onlyArg');
  if (corte < 0) throw new Error('test.js: no encuentro «const onlyArg»; hay que actualizar tools/cierre.js (perfil suite)');
  const avisos = [];
  const req = (p) => (/cdp\.js$/.test(p) ? {} : require(p));
  const proc = { argv: ['node', 'test.js'].concat(rapido ? ['--fast'] : []), env: process.env, exit() { /* no */ } };
  const cons = { log: (m) => avisos.push(String(m).trim()) };
  const { steps, norm, tagsOf } = new Function('require', '__dirname', 'process', 'console', src.slice(0, corte) + '\nreturn { steps, norm, tagsOf };')(req, ROOT, proc, cons);
  const words = String(solo || '').split(',').map((w) => norm(w)).filter(Boolean);
  const keep = steps.filter((st, i) => i === 0 || !words.length || words.some((w) => norm(st[0]).includes(w) || norm(st[1][0]).includes(w) || tagsOf(st).includes(w)));
  const out = keep.map((st, i) => {
    const item = st[1].join('@'), must = st[2] || null;
    META[item] = { nombre: st[0].split(' (')[0], base: path.basename(st[1][0], '.js'), must, nav: !!must, nomem: st[1][0] === 'build.js',
      extra: sha(JSON.stringify([st[0], st[1], must ? must.map(String) : null])) };
    return item;
  });
  return { items: out, avisos, total: steps.length };
}
const EXPANDE = (it) => (it === 'suite' ? pasosSuite(false, val('solo', '')).items : it === 'suite-rapido' ? pasosSuite(true, val('solo', '')).items : PERFILES[it] ? PERFILES[it] : [it]);

// ---- memoria de verdes
const MEM = process.env.CIERRE_MEMORIA || path.join(ROOT, '.cierre_verdes.json');
const sha = (b) => require('crypto').createHash('sha1').update(b).digest('hex');
let _fh = new Map();
const limpia = () => { _fh = new Map(); }; // se vacía antes y después de cada prueba (algunas regeneran dist/)
// dist/ lleva la hora del build (build.js: «aaaa-mm-dd hh:mm» y «loc-<ver>-aaaammddhhmm»): se ignora para que reconstruir idéntico no caduque nada
const SELLO = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}|(?<=loc-[\w.]+-)\d{12}/g;
const fileHash = (f) => { if (!_fh.has(f)) { let h; try { let b = fs.readFileSync(f); if (f.startsWith(path.join(ROOT, 'dist') + path.sep) && !/\.(png|jpe?g|gif|woff2?|ico|mp3|ogg|wav)$/i.test(f)) b = Buffer.from(b.toString('latin1').replace(SELLO, '#'), 'latin1'); h = sha(b); } catch (e) { h = 'falta'; } _fh.set(f, h); } return _fh.get(f); };
const walk = (d, out) => { try { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (e.name === 'node_modules' || e.name.startsWith('.')) return; const f = path.join(d, e.name); if (e.isDirectory()) walk(f, out); else out.push(f); }); } catch (e) { /* no existe */ } return out; };
// todo de lo que depende una prueba (conservador: ante la duda, se incluye)
function dependencias(item) {
  const principal = path.resolve(ROOT, item.split('@')[0]), vistos = new Set(), extra = new Set(); let usaDist = false;
  const existe = (f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } };
  const visita = (f) => {
    if (vistos.has(f) || !existe(f)) return; vistos.add(f);
    let t; try { t = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const dir = path.dirname(f);
    for (const m of t.matchAll(/require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) { const b = path.resolve(dir, m[1]); [b, b + '.js', path.join(b, 'index.js')].filter(existe).slice(0, 1).forEach(visita); }
    for (const m of t.matchAll(/['"`]([\w.\/-]+\.js)['"`]/g)) { const c = [path.resolve(dir, m[1]), path.resolve(ROOT, m[1]), path.resolve(ROOT, 'tools', m[1]), path.resolve(ROOT, 'src', m[1])].filter(existe); if (c.length) visita(c[0]); }
    for (const m of t.matchAll(/['"]docs['"]\s*,\s*['"]([^'"]+)['"]/g)) extra.add(path.join(ROOT, 'docs', m[1]));
    for (const m of t.matchAll(/\bdocs\/([\w.\-]+\.(?:json|md|txt|js))/g)) extra.add(path.join(ROOT, 'docs', m[1]));
    if (/['"`\/]dist['"`\/]|dist\//.test(t)) usaDist = true;
  };
  visita(principal);
  let fich = Array.from(vistos).concat(Array.from(extra));
  ['src', 'vendor', 'assets'].forEach((d) => walk(path.join(ROOT, d), fich));
  fich.push(path.join(ROOT, 'build.js'));
  if (usaDist) walk(path.join(ROOT, 'dist'), fich);
  return Array.from(new Set(fich)).sort();
}
function huella(item) {
  const h = [item, (META[item] && META[item].extra) || '', process.version, process.env.SEEDS || '', process.env.JOBS || '', process.env.ONLY || '', process.env.CHROME || ''];
  dependencias(item).forEach((f) => h.push(path.relative(ROOT, f) + ':' + fileHash(f)));
  return sha(h.join('\n'));
}
const memLeer = () => { try { const m = JSON.parse(fs.readFileSync(MEM, 'utf8')); return m && m.verdes ? m : { version: 1, verdes: {} }; } catch (e) { return { version: 1, verdes: {} }; } };
const memGuardar = (m) => { const tmp = MEM + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(m, null, 1) + '\n'); fs.renameSync(tmp, MEM); };
const cuando = (iso) => { const m = (Date.now() - Date.parse(iso)) / 60000; return m < 1 ? 'hace un momento' : m < 90 ? 'hace ' + Math.round(m) + ' min' : m < 2880 ? 'hace ' + Math.round(m / 60) + ' h' : 'hace ' + Math.round(m / 1440) + ' días'; };

if (flag('lista') && items.some((x) => /^suite/.test(x))) { const r = pasosSuite(/rapido/.test(items.join(' ')), val('solo', '')); r.items.forEach((it, i) => console.log(String(i + 1).padStart(2) + '. ' + META[it].nombre + '  [' + it.split('@')[0] + (META[it].nomem ? ' · siempre se ejecuta' : '') + ']')); r.avisos.forEach((a) => console.log(a)); process.exit(0); }
if (flag('lista')) { ['suite', 'suite-rapido'].forEach((k) => console.log(k + ': ' + pasosSuite(k === 'suite-rapido', '').items.length + ' pasos de test.js (' + (k === 'suite' ? 'npm test' : 'npm run test:fast') + '), de uno en uno; `--lista ' + k + '` los enseña')); Object.keys(PERFILES).forEach((k) => console.log(k + ': ' + PERFILES[k].map((x) => x.replace(/@/g, ' ')).join(' · '))); process.exit(0); }
if (flag('memoria')) {
  const m = memLeer(), todos = items.length ? Array.from(new Set([].concat(...items.map(EXPANDE)))) : Array.from(new Set([].concat(...Object.values(PERFILES), pasosSuite(false, '').items)));
  todos.forEach((it) => { limpia(); const e = m.verdes[it], nom = META[it] ? META[it].nombre : it.replace(/@/g, ' ');
    if (META[it] && META[it].nomem) { console.log('· siempre se ejecuta  ' + nom); return; }
    console.log((e ? (e.huella === huella(it) ? '⏭ vigente ' : '✗ caducada') : '· sin verde') + '  ' + nom + (e ? '  (verde ' + cuando(e.cuando) + ', ' + fmt(e.seg) + (e.tras ? ', tras repetir' : '') + ')' : '')); });
  process.exit(0);
}
if (flag('resumen')) { const t = readSum(); console.log(t || '(no hay resumen todavía)'); process.exit(verdict(t)); }
if (flag('espera')) {
  const max = +val('espera', 240) || 240, t0 = Date.now();
  let t = readSum();
  while (verdict(t) === 2 && (Date.now() - t0) / 1000 < max) {
    // si el candado ya no está vivo y no hay FIN, el cierre murió: no esperar más
    const p = lockPid(); if ((!p || !alive(p)) && Date.now() - t0 > 3000) break;
    sleep(2000); t = readSum();
  }
  console.log(t || '(no hay resumen todavía)');
  if (verdict(t) === 2) console.log('… sigue corriendo o se interrumpió (mira `node tools/cierre.js --resumen`).');
  process.exit(verdict(t));
}

// resolver la lista a ejecutar
const esPerfil = items.length === 1 && (PERFILES[items[0]] || /^suite(-rapido)?$/.test(items[0]));
const lista = esPerfil ? EXPANDE(items[0]) : items;
const perfil = esPerfil ? items[0] : 'a medida';
if (!lista.length) { console.log('Nada que ejecutar. Usa --lista para ver los perfiles.'); process.exit(64); }

// candado: nunca dos cierres a la vez
fs.mkdirSync(DIR, { recursive: true });
const otro = lockPid();
if (otro && otro !== process.pid && alive(otro)) { console.log('Ya hay un cierre en marcha (pid ' + otro + '). No se lanza otro para no solapar pruebas. Mira `node tools/cierre.js --resumen`.'); process.exit(3); }

if (flag('bg')) {
  const rest = process.argv.slice(2).filter((a) => a !== '--bg');
  const child = cp.spawn(process.execPath, [__filename].concat(rest), { cwd: ROOT, detached: true, stdio: 'ignore' });
  child.unref();
  fs.writeFileSync(LOCK, String(child.pid)); // el candado queda al nombre del hijo desde ya
  fs.writeFileSync(SUM, 'CIERRE · perfil ' + perfil + ' · ' + lista.length + ' pruebas · en marcha (pid ' + child.pid + ')\n');
  console.log('Lanzado en segundo plano (pid ' + child.pid + ', ' + lista.length + ' pruebas, de una en una). Espera con: node tools/cierre.js --espera=240');
  process.exit(0);
}

// ejecución en primer plano (también es lo que corre el hijo de --bg)
fs.writeFileSync(LOCK, String(process.pid));
const libera = () => { try { if (lockPid() === process.pid) fs.unlinkSync(LOCK); } catch (e) { /* nada */ } };
process.on('exit', libera);
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => { fs.appendFileSync(SUM, 'FIN · cortado a mano · ' + verdes + ' de ' + lista.length + ' en verde · 1 en rojo (cierre incompleto)\n'); process.exit(130); }));

const TIMEOUT = (+val('timeout', 600) || 600) * 1000, SEGUIR = flag('seguir');
const SINMEM = flag('sin-memoria'), FRESCO = flag('fresco');
const RMODE = String(val('reintento', 'auto')).toLowerCase(), RNO = RMODE === 'no' || RMODE === '0' || RMODE === 'false';
const AMBIENTAL = /ETIMEDOUT|ECONNREFUSED|ECONNRESET|EADDRINUSE|EMFILE|ENOMEM|timed? ?out|Target closed|Protocol error|WebSocket|DevTools|Chrom(e|ium)|puppeteer/i;
fs.writeFileSync(SUM, 'CIERRE · perfil ' + perfil + ' · ' + lista.length + ' pruebas · ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + (SEGUIR ? ' · sigue tras un rojo' : ' · para en el primer rojo') + (SINMEM ? ' · sin memoria de verdes' : FRESCO ? ' · fresco (repite todo)' : ' · con memoria de verdes') + (RNO ? ' · sin reintentos' : ' · reintento ' + (RMODE === 'siempre' ? 'de cualquier rojo' : 'de rojos ambientales')) + '\n');
const mem = SINMEM ? null : memLeer();
let nSuite = 0; const T0 = Date.now(); let verdes = 0, rojos = 0, hechas = 0, ahorro = 0; const faltan = [], tras = [], saltadas = [];
const guarda = (it, x, esTras) => { if (!mem) return; limpia(); mem.verdes[it] = { huella: huella(it), cuando: new Date().toISOString(), seg: Math.round(x.seg * 10) / 10, ultima: (x.txt[x.txt.length - 1] || '').slice(0, 110), tras: !!esTras }; memGuardar(mem); limpia(); };
const olvida = (it) => { if (mem && mem.verdes[it]) { delete mem.verdes[it]; memGuardar(mem); } };

// corre UNA prueba y devuelve { ok, seg, txt (líneas no vacías), r, log }
const MALO = /ERR:|EXC:|console\.error/; // igual que test.js, solo para pasos con salida esperada (navegador)
function corre(partes, log, meta) {
  const fd = fs.openSync(log, 'w'), t = Date.now();
  const r = cp.spawnSync(process.execPath, [partes[0]].concat(partes.slice(1)), { cwd: ROOT, stdio: ['ignore', fd, fd], timeout: TIMEOUT, killSignal: 'SIGKILL' });
  fs.closeSync(fd);
  const txt = fs.readFileSync(log, 'utf8').split('\n').filter((l) => l.trim()), x = { r, log, seg: (Date.now() - t) / 1000, ok: r.status === 0 && !r.signal, txt };
  if (meta && meta.nav) spawnSyncSafe('pkill', ['-9', '-f', 'loc-chrome-']); // que no quede ningún Chrome vivo entre pasos
  if (x.ok && txt.some((l) => /^SALTADO:/.test(l))) { x.salto = txt.find((l) => /^SALTADO:/.test(l)); return x; } // C1: la prueba declara que falta algo del entorno (p. ej. `ws`): SALTADA, no roja
  if (x.ok && meta && meta.must) {
    const out = txt.join('\n'), mal = out.match(MALO), falta = meta.must.filter((m) => !m.test(out));
    if (mal) { x.ok = false; x.motivo = 'la salida contiene «' + mal[0] + '»'; } else if (falta.length) { x.ok = false; x.motivo = 'falta en la salida: ' + String(falta[0]).slice(0, 90) + (falta.length > 1 ? ' (+' + (falta.length - 1) + ')' : ''); }
  }
  return x;
}
const spawnSyncSafe = (c, a) => { try { cp.spawnSync(c, a, { stdio: 'ignore' }); } catch (e) { /* nada */ } };
const motivoDe = (x) => (x.motivo ? x.motivo : x.r.signal ? 'cortada por tiempo (' + fmt(TIMEOUT / 1000) + ')' : 'salida ' + x.r.status);
const malasDe = (x) => { if (x.motivo) return '    | ' + x.motivo + '\n' + x.txt.slice(-2).map((l) => '    | ' + l.slice(0, 200) + '\n').join(''); const m = x.txt.filter((l) => /✗|FALLO|Error|error:/.test(l)).slice(0, 4); return (m.length ? m : x.txt.slice(-3)).map((l) => '    | ' + l.slice(0, 200) + '\n').join(''); };
// ¿parece un fallo del entorno (y no de la lógica)?
const ambiental = (it, x) => x.r.signal || (META[it] && META[it].nav) || /browser_test|navegador|cdp/i.test(it) || AMBIENTAL.test(x.txt.join('\n'));

lista.forEach((it) => {
  const partes = it.split('@'), M = META[it] || null, nombre = M ? M.nombre : partes[0].replace(/\.js$/, '').replace(/.*\//, '') + (partes.length > 1 ? ' [' + partes.slice(1).join(' ') + ']' : '');
  if (rojos && !SEGUIR) { faltan.push(nombre); return; }
  const base = M ? String(++nSuite).padStart(2, '0') + '_' + M.base : nombre.replace(/[^\w.-]+/g, '_'), usaMem = mem && !(M && M.nomem);
  if (usaMem && !FRESCO) { limpia(); const e = mem.verdes[it]; if (e && e.huella === huella(it)) { verdes++; saltadas.push(nombre); ahorro += e.seg || 0; limpia();
    fs.appendFileSync(SUM, '⏭ ' + nombre + ' · SALTADA: ya en verde con este mismo código (' + cuando(e.cuando) + ', tardó ' + fmt(e.seg) + (e.tras ? ', verde tras repetir' : '') + ') · ' + (e.ultima || '') + '\n'); return; } limpia(); }
  const x = corre(partes, path.join(DIR, base + '.log'), M); hechas++;
  if (x.ok && x.salto) { saltadas.push(nombre); fs.appendFileSync(SUM, '⏭ ' + nombre + ' · SALTADA por el entorno · ' + x.salto.slice(0, 110) + '\n'); return; } // no se memoriza: al instalar lo que falta, se ejecuta
  if (x.ok) { verdes++; if (usaMem) guarda(it, x, false); fs.appendFileSync(SUM, '✓ ' + nombre + ' · ' + fmt(x.seg) + ' · ' + (x.txt[x.txt.length - 1] || '').slice(0, 110) + '\n'); return; }
  // rojo: ¿se repite?
  const repite = !RNO && (RMODE === 'siempre' || ambiental(it, x));
  if (!repite) {
    rojos++; olvida(it);
    fs.appendFileSync(SUM, '✗ ' + nombre + ' · ' + fmt(x.seg) + ' · ' + motivoDe(x) + (RNO ? '' : ' · sin repetir (no parece ambiental)') + '\n' + malasDe(x) + '    (log: ' + x.log + ')\n');
    return;
  }
  const y = corre(partes, path.join(DIR, base + '.reintento.log'), M);
  if (y.ok) {
    verdes++; tras.push(nombre);
    if (usaMem) guarda(it, y, true);
    fs.appendFileSync(SUM, '✓⟳ ' + nombre + ' · verde TRAS REPETIR (' + fmt(y.seg) + ') · la 1.ª vez falló: ' + motivoDe(x) + ' en ' + fmt(x.seg) + ' · ' + (y.txt[y.txt.length - 1] || '').slice(0, 90) + '\n    (log de la 1.ª vez: ' + x.log + ')\n');
  } else {
    rojos++; olvida(it);
    fs.appendFileSync(SUM, '✗ ' + nombre + ' · ROJO TAMBIÉN AL REPETIR (' + fmt(x.seg) + ' y ' + fmt(y.seg) + ') · ' + motivoDe(y) + '\n' + malasDe(y) + '    (logs: ' + x.log + ' · ' + y.log + ')\n');
  }
});
fs.appendFileSync(SUM, 'FIN · ' + verdes + ' de ' + lista.length + ' en verde · ' + rojos + ' en rojo' + (faltan.length ? ' · PARADO tras el primer rojo, sin ejecutar: ' + faltan.join(', ') : '') + (saltadas.length ? ' · ' + saltadas.length + ' SALTADA(S) por memoria de verdes (mismo código; ahorro ~' + fmt(ahorro) + '; --fresco las repite)' : '') + (tras.length ? ' · ' + tras.length + ' verde(s) TRAS REPETIR (revisar si se repite): ' + tras.join(', ') : '') + ' · total ' + fmt((Date.now() - T0) / 1000) + '\n');
process.exit(rojos ? 1 : 0);
