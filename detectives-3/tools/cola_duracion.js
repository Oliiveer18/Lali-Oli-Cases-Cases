// cola_duracion.js — b2 paso 3-bis, subpaso 1: ¿qué suma en los casos largos? (solo lectura)
// Uso: node tools/cola_duracion.js [N=150] [paso=7919]   (semilla = i*paso+1; cada nivel con su dificultad)
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 150, STEP = +process.argv[3] || 7919, LONG = +process.env.LONG || 40;
const D = { facil: 'easy', normal: 'normal', dificil: 'hard' };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), r1 = (x) => Math.round(x * 10) / 10;
['facil', 'normal', 'dificil'].forEach((L) => {
  const rows = [];
  for (let i = 1; i <= N; i++) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
    const def = r.def, bot = G.botPlay(def, { difficulty: D[L] }), s = bot.stats || {}, f = G.meterFeatures(def);
    let tools = 0, chat = 0, sneak = 0, push = 0;
    Object.values(def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { if (p.chat) chat++; (p.steps || []).forEach((st) => { if (st.tool && !p.chat) tools++; if (st.tool === 'sigilo') sneak++; if (st.coop || st.push) push++; }); }));
    rows.push({ acts: bot.actions, fb: s.fallbackActions || 0, ch: bot.perChapter.map((c) => c.seconds), seed: i * STEP + 1, min: bot.humanMinutes, bot: bot.botSeconds, walk: s.walkSeconds || 0, fill: s.fillSeconds || 0, read: s.readSeconds || 0, work: s.workSeconds || 0, stealth: s.stealthWait || 0, f, tools, chat, sneak, meter: G.meterSeconds(f) / 60 });
  }
  const L40 = rows.filter((x) => x.min > LONG), sh = rows.filter((x) => x.min <= LONG);
  const col = (a, k) => r1(mean(a.map((x) => x[k])));
  console.log(`\n${L} n=${rows.length} · min ${Math.min(...rows.map((x) => x.min))}/${r1(mean(rows.map((x) => x.min)))}/${Math.max(...rows.map((x) => x.min))} · > ${LONG} min: ${L40.length}`);
  const show = (n, a) => a.length && console.log(`  ${n.padEnd(8)} n=${String(a.length).padEnd(3)} bot s ${col(a, 'bot')} · andar ${col(a, 'walk')} · relleno ${col(a, 'fill')} · leer ${col(a, 'read')} · trabajo ${col(a, 'work')} · sigilo-esp ${col(a, 'stealth')} · pasos-herr ${col(a, 'tools')} · charla ${col(a, 'chat')} · salas ${r1(mean(a.map((x) => x.f.rooms)))} · temas ${r1(mean(a.map((x) => x.f.topics)))} · pasos ${r1(mean(a.map((x) => x.f.steps)))} · curios ${r1(mean(a.map((x) => x.f.curios)))} · medidor min ${r1(mean(a.map((x) => x.meter)))} · acciones ${col(a, 'acts')} · de ayuda floja ${col(a, 'fb')} (${r1(100 * mean(a.map((x) => x.fb / Math.max(1, x.acts))))} %) · cap1 ${r1(mean(a.map((x) => x.ch[0])))} s, cap2 ${r1(mean(a.map((x) => x.ch[1] || 0)))} s`);
  show('largos', L40); show('resto', sh);
  L40.slice(0, 6).forEach((x) => console.log(`    semilla ${x.seed}: ${x.min} min (bot ${x.bot}s: andar ${x.walk}, relleno ${x.fill}, trabajo ${x.work}, sigilo ${x.stealth}) herr ${x.tools}, charla ${x.chat}, salas ${x.f.rooms}`));
});
