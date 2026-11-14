// Prueba del ICONO que ofrece el juego al acercarse a un objeto (24 oct): lo LIBRE (sin herramienta) lleva la mano, nunca la lupa; con herramienta, el icono de ESA herramienta.
// Uso: node test_iconos.js   · Demuestra con casos generados reales (sin navegador) y una MUTACIÓN (volver a poner la lupa a todo) que la prueba la detecta.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
function suite(G) {
  const fails = []; let checks = 0, libres = 0, conTool = 0, lupaLibre = 0;
  const ok = (c, m) => { checks++; if (!c) fails.push(m); };
  const TS = G.TS;
  for (let i = 0; i < 12; i++) {
    const r = G.generateCase(1000 + i * 7919, { level: ['facil', 'normal', 'dificil'][i % 3], difficulty: ['facil', 'normal', 'dificil'][i % 3] });
    if (r.error) continue;
    const def = r.def || r.caseDef || r.case;
    const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'solo' });
    Object.keys(def.rooms).forEach((rid) => {
      w.enterRoom(rid, null); w.onChapter(); w.out.length = 0;
      const rex = w.players.find((p) => p.id === 'rex');
      w.room.props.forEach((p) => {
        const info = w.propStepInfo(p); if (!info || !p.steps || info.done || (p.uvOnly && !w.revealed(p)) || p.chat) return;
        rex.x = (p.x + p.w / 2) * TS; rex.y = (p.y + p.h / 2) * TS + 4; rex.work = null; rex.path = null; rex.task = null;
        const f = w.findFocus(rex); if (!f || f.p !== p || !f.step) return; // otro objeto más cercano: se salta
        const s = f.step;
        if (s.tool === 'coop' || (s.mini && !s.tool)) return; // empujar y minijuegos tienen su propio icono
        if (s.tool && G.TOOLS[s.tool]) { conTool++; ok(f.icon === G.TOOLS[s.tool].icon, `caso ${i} ${p.id}: con ${s.tool} debe ofrecer su icono (${G.TOOLS[s.tool].icon}), ofrece ${f.icon}`); }
        else { libres++; if (f.icon === 'ico_lupa') lupaLibre++; ok(f.icon === 'ico_hand', `caso ${i} ${p.id}: objeto libre debe ofrecer la mano, ofrece ${f.icon}`); }
      });
    });
  }
  ok(libres >= 20, `se probaron objetos libres de verdad (${libres})`);
  ok(conTool >= 10, `se probaron objetos con herramienta de verdad (${conTool})`);
  ok(lupaLibre === 0, 'ningún objeto libre ofrece la lupa');
  return { fails, checks, libres, conTool };
}
const real = suite(loadG(EXTRA));
console.log(real.fails.length ? real.fails.slice(0, 8).map((m) => '  ✗ ' + m).join('\n') : `  OK · ${real.checks} comprobaciones (${real.libres} objetos libres con la mano, ${real.conTool} con herramienta con su icono)`);
let bad = real.fails.length;
const from = "icon: 'ico_hand', verb: 'Examinar' }", to = "icon: 'ico_lupa', verb: 'Examinar' }";
let applied = false;
const m = suite(loadG(EXTRA, (f, t) => { if (f !== 'world.js') return t; if (t.indexOf(from) < 0) throw new Error('la mutación no encaja: el patrón cambió'); applied = true; return t.replace(from, to); }));
console.log(applied && m.fails.length > 0 ? `  OK · mutación «todo lo libre con lupa»: detectada (${m.fails.length} fallos)` : '  ✗ mutación «todo lo libre con lupa»: NO detectada'); if (!(applied && m.fails.length > 0)) bad++;
console.log(bad ? '✗ ' + bad + ' problemas' : 'Todo en orden'); process.exit(bad ? 1 : 0);
