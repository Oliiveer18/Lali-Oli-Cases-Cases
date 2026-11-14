// FIX-6b (fallo 7): «Mostrar una prueba…» ya NO enseña la prueba al elegirla. Elegir solo la selecciona y abre dos botones:
// «Mostrar prueba» (la enseña, una sola vez) y «Volver» (vuelve a la lista sin enseñar nada). Sin navegador, con mutación.
// Una a una: node test_mostrar_prueba.js
const loadG = require('./tools/load_g.js');
const EXTRA = ['net.js', 'play.js'];
const MUT = [['elegir enseña la prueba al instante (comportamiento antiguo)', "else this.openConfirm(it.id);", "else this.apply(this.st.present(this.id, it.id), null);"],
             ['«Volver» también enseña la prueba', "if (r.back || r.chosen === 1) { this.stage = 'pick'; return; }", "if (r.back || r.chosen === 1) { this.apply(this.st.present(this.id, this.confId), null); return; }"]];
function run(patchEdit) { const problems = []; try { return run0(patchEdit, problems); } catch (e) { problems.push('excepción: ' + e.message); return problems; } }
function run0(patchEdit, problems) {
  const G = loadG(EXTRA, patchEdit ? (f, t) => (f === 'play.js' ? t.replace(patchEdit[1], patchEdit[2]) : t) : undefined);
  const U = G.ui; G.audio = G.audio || {}; G.audio.sfx = () => {}; G.speak = () => {}; G.award = () => {};
  const ok = (c, m) => { if (!c) problems.push(m); };
  const calls = [];
  const clues = {}; const order = [];
  for (let i = 0; i < 3; i++) { clues['c' + i] = { title: 'Prueba ' + i, icon: 'ico_clue', text: 'Texto de la prueba ' + i }; order.push('c' + i); }
  const st = { def: { npcs: { n1: { name: 'Baguette', cat: false } }, clues }, clueOrder: order, shown: {}, topicsFor: () => [], clueCount: () => 3, startTalk: () => null,
    present: (id, c) => { calls.push(c); st.shown[id + ':' + c] = true; return { lines: ['Reacciona.'] }; }, isLocked: () => false, npc: { n1: { trust: 0, pressure: 0 } }, testimony: {}, lockLeft: () => 0 };
  const t = new G.PlayModals.Talk({ st, dir: { bump() {} } }, 'n1');
  const nk = () => ({ up: false, down: false, left: false, right: false, ok: false, back: false });
  const press = (k) => { G.input = G.input || {}; G.input.menu = Object.assign(nk(), { [k]: true }); G.input.mouse = { moved: false, clicked: false, x: -1, y: -1 }; const r = t.update(0.016); G.input.menu = nk(); return r; };
  ok(t.stage === 'menu', 'al abrir la charla estamos en el menú, no en ' + t.stage);
  t.openPicker(); ok(t.stage === 'pick', 'openPicker deja la lista de pruebas');
  const first = () => { t.pick.sel = t.pick.items.findIndex((i) => i.id === 'c1'); };
  first(); press('ok');
  ok(t.stage === 'confirm', 'elegir una prueba abre los botones (etapa ' + t.stage + ')');
  ok(calls.length === 0, 'elegir NO enseña la prueba (se enseñó ' + calls.length + ' veces)');
  ok(t.pick.items[t.pick.sel].id === 'c1', 'la prueba elegida sigue seleccionada');
  // la ficha y los botones no pisan el panel de diálogo (y 352) ni se salen por arriba
  const gm = t.pickGeom(); ok(gm.py >= 0 && gm.py + gm.ph + 8 + 44 <= 352, 'ficha + botones caben sobre el panel de diálogo: ' + JSON.stringify(gm));
  // dibujar no falla
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'measureText' ? () => ({ width: 50 }) : () => {}), set: (o, k, v) => ((o[k] = v), true) });
  try { t.draw(ctx); } catch (e) { ok(false, 'dibujar la etapa de confirmación falla: ' + e.message); }
  // Volver (2.º botón y tecla atrás): vuelve a la lista sin enseñar nada
  t.conf.sel = 1; press('ok'); ok(t.stage === 'pick', 'botón Volver vuelve a la lista'); ok(calls.length === 0, 'Volver no enseña nada');
  first(); press('ok'); ok(t.stage === 'confirm', 'se puede volver a elegir'); press('back'); ok(t.stage === 'pick' && calls.length === 0, 'tecla atrás en los botones vuelve a la lista sin enseñar');
  // Mostrar prueba: la enseña UNA vez, con la prueba elegida
  first(); press('ok'); t.conf.sel = 0; press('ok');
  ok(calls.length === 1 && calls[0] === 'c1', 'Mostrar prueba enseña la elegida una sola vez: ' + JSON.stringify(calls));
  ok(t.stage === 'say', 'tras enseñarla habla el personaje (etapa ' + t.stage + ')');
  // lista larga (19 pruebas): la ficha y los botones siguen cabiendo
  for (let i = 3; i < 19; i++) { clues['c' + i] = { title: 'Prueba ' + i, icon: 'ico_clue', text: 'x' }; order.push('c' + i); }
  t.openPicker(); first(); press('ok'); const g2 = t.pickGeom();
  ok(t.stage === 'confirm' && g2.py >= 0 && g2.py + g2.ph + 52 <= 352, 'con 19 pruebas la ficha y los botones caben: ' + JSON.stringify(g2));
  return problems;
}
const base = run(); let fails = base.length; base.forEach((p) => console.log('✗ ' + p));
MUT.forEach(([nm, a, b]) => { const pr = run([null, a, b]); if (!pr.length) { fails++; console.log('✗ la mutación NO se detecta: ' + nm + ' (¿cambió el texto de play.js?)'); } });
console.log(fails ? 'FALLOS: ' + fails : 'Mostrar prueba con botón: flujo, ficha y botones dentro de la pantalla, con ' + MUT.length + ' mutaciones detectadas');
process.exit(fails ? 1 : 0);
