// FIX-3d: acusación con intentos, descuento, gate (gatos / no interrogados) y ofensa. Una a una: node test_accuse.js [N=40]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 40;
let bad = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
const LV = { easy: 'facil', normal: 'normal', hard: 'dificil' };
const TABLE = { easy: { strikes: 3, cut: [0, 0.16, 0.5] }, normal: { strikes: 2, cut: [0, 0.5] }, hard: { strikes: 1, cut: [0] } };

// 1) tabla de G.DIFFS
Object.keys(TABLE).forEach((d) => {
  const D = G.DIFFS[d];
  ok(D.strikes === TABLE[d].strikes, d + ': intentos ' + D.strikes);
  ok(JSON.stringify(D.wrongCut) === JSON.stringify(TABLE[d].cut), d + ': wrongCut ' + JSON.stringify(D.wrongCut));
  ok(D.wrongCut.length === D.strikes - (d === 'easy' ? 0 : 0) || D.wrongCut.length <= D.strikes, d + ': longitud de wrongCut');
  ok(D.wrongTime === 0, d + ': wrongTime 0');
  ok(D.board === (d === 'easy' ? 1 : d === 'normal' ? 3 : 4), d + ': board');
});

const cases = [];
for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) cases.push(r.def); }
ok(cases.length === N, 'se generaron ' + cases.length + ' casos');

const stat = { easy: { win: 0, n: 0 }, normal: { win: 0, n: 0 }, hard: { win: 0, n: 0 } };
let gatedCat = 0, gatedFresh = 0, offenseChecks = 0, rumors = 0;
cases.forEach((def0, idx) => {
  Object.keys(TABLE).forEach((d) => {
    const mk = () => JSON.parse(JSON.stringify(def0));
    // 2) gate: sin hablar con nadie, nadie se puede acusar; los gatos nunca
    const st = new G.CaseState(mk(), d);
    const sol = st.def.solution;
    const lst = st.accuseList();
    ok(lst.every((x) => !st.isCatSuspect(x.s)), d + ' ' + idx + ': hay un gato en la lista de acusar');
    st.def.suspects.filter((s) => st.isCatSuspect(s)).forEach((s) => { const r = st.accuse({ culprit: s.id, method: sol.method, motive: sol.motive, proof: [] }); ok(r.blocked && st.wrong === 0, d + ' ' + idx + ': gato acusable'); gatedCat++; });
    const cand = lst.find((x) => !st.interrogated(x.s.id));
    if (cand) { const r = st.accuse({ culprit: cand.s.id, method: sol.method, motive: sol.motive, proof: [] }); ok(r.blocked && st.wrong === 0 && !st.failed, d + ' ' + idx + ': no interrogado acusable'); gatedFresh++; }
    // 3) ofensa: falla con gateOff, el acusado se ofende, no hay pistas nuevas, termina a los 40 s, al calmar y no cuenta tiempo
    const s2 = new G.CaseState(mk(), d); s2.gateOff = true;
    const inn = s2.def.suspects.find((s) => s.id !== sol.culprit && !s2.isCatSuspect(s) && s2.def.npcs[s.id]);
    if (inn && TABLE[d].strikes > 1) {
      const t0 = s2.timePenalty, c0 = s2.clueCount();
      const w = s2.accuse({ culprit: inn.id, method: 'x', motive: 'x', proof: [] });
      ok(!w.ok && !w.blocked && s2.wrong === 1 && w.offended === inn.id && w.strikesLeft === TABLE[d].strikes - 1, d + ' ' + idx + ': fallo mal contado');
      ok(s2.timePenalty === t0, d + ' ' + idx + ': penalización de tiempo');
      ok(s2.isOffended(inn.id), d + ' ' + idx + ': no se ofende');
      const tp = s2.def.npcs[inn.id].topics && s2.def.npcs[inn.id].topics[0];
      if (tp) { const rr = s2.ask(inn.id, tp.id); ok(rr && rr.offended === true, d + ' ' + idx + ': el ofendido habla normal'); ok(s2.clueCount() === c0, d + ' ' + idx + ': pista nueva de un ofendido'); if (rr && rr.rancor) rumors++; offenseChecks++; }
      s2.time += G.OFFEND_SECS + 1; ok(!s2.isOffended(inn.id), d + ' ' + idx + ': la ofensa no termina a los 40 s');
      const s3 = new G.CaseState(mk(), d); s3.gateOff = true; s3.accuse({ culprit: inn.id, method: 'x', motive: 'x', proof: [] }); s3.calmAll(); ok(!s3.isOffended(inn.id), d + ' ' + idx + ': calmAll no calma');
    }
    // 4) recompensa por fallos con el bot (acierta tras k fallos) y fin sin recompensa
    for (let k = 0; k <= TABLE[d].strikes; k++) {
      const b = G.botPlay(mk(), { difficulty: d, failFirst: k });
      stat[d].n++;
      if (k < TABLE[d].strikes) {
        ok(b.win && b.fails.length === k, d + ' ' + idx + ' k=' + k + ': el bot no gana (' + b.reason + ')');
        if (b.win) {
          const cut = TABLE[d].cut[Math.min(k, TABLE[d].cut.length - 1)];
          ok(Math.abs(b.reward.cut - cut) < 1e-9, d + ' ' + idx + ' k=' + k + ': descuento ' + b.reward.cut);
          const base = def0.reward * G.DIFFS[d].mult * (1 + 0.25 * (b.reward.stars - 1));
          ok(Math.abs(b.reward.money - Math.round(base * (1 - cut)) - 0) <= 400, d + ' ' + idx + ' k=' + k + ': dinero fuera de rango');
          ok(b.reward.stars <= (k > 0 ? 2 : 3), d + ' ' + idx + ' k=' + k + ': estrellas con fallos');
          stat[d].win++;
        }
      } else {
        ok(!b.win && b.reason === 'acusacion_fallida', d + ' ' + idx + ': agotar intentos debe perder (' + b.reason + ')');
        ok(b.reward && b.reward.stars === 0, d + ' ' + idx + ': estrellas al perder');
        // FIX-5 (P1): sin caso resuelto no hay dinero alguno (tampoco las monedas sueltas)
        ok(b.reward && b.reward.money === 0, d + ' ' + idx + ': recompensa al perder ' + (b.reward && b.reward.money));
      }
    }
  });
});
// FIX-5 (P1): fallo total -> dinero 0 aunque bonusMoney > 0; ganar -> base + sueltas
Object.keys(TABLE).forEach((d) => {
  const c1 = G.CASES.tarta;
  const lose = new G.CaseState(JSON.parse(JSON.stringify(c1)), d); lose.bonusMoney = 37; lose.failed = true;
  ok(lose.reward().money === 0 && lose.reward().stars === 0, 'P1 ' + d + ': fallo total debe dar 0 aunque haya monedas sueltas (' + lose.reward().money + ')');
  const open = new G.CaseState(JSON.parse(JSON.stringify(c1)), d); open.bonusMoney = 37;
  ok(open.reward().money === 0, 'P1 ' + d + ': caso sin resolver debe dar 0');
  const win = new G.CaseState(JSON.parse(JSON.stringify(c1)), d); win.closed = true; win.bonusMoney = 37;
  const r0 = new G.CaseState(JSON.parse(JSON.stringify(c1)), d); r0.closed = true; r0.bonusMoney = 0;
  ok(win.reward().money === r0.reward().money + 37 && r0.reward().money > 0, 'P1 ' + d + ': ganar = base + sueltas (' + win.reward().money + ' vs ' + r0.reward().money + ')');
});
// caso 1 (a mano): el gato no aparece en la lista ni se puede acusar; semilla intacta
{
  const c1 = G.CASES.tarta; let catN = 0;
  Object.keys(TABLE).forEach((d) => {
    const st = new G.CaseState(JSON.parse(JSON.stringify(c1)), d), sol = st.def.solution;
    ok(st.accuseList().every((x) => !st.isCatSuspect(x.s)), 'caso 1 ' + d + ': gato en la lista');
    st.def.suspects.filter((s) => st.isCatSuspect(s)).forEach((s) => { catN++; const r = st.accuse({ culprit: s.id, method: sol.method, motive: sol.motive, proof: [] }); ok(r.blocked && st.wrong === 0, 'caso 1 ' + d + ': gato acusable'); });
    const b = G.botPlay(JSON.parse(JSON.stringify(c1)), { difficulty: d, failFirst: TABLE[d].strikes - 1 });
    ok(b.win && b.fails.length === TABLE[d].strikes - 1, 'caso 1 ' + d + ': el bot no gana con fallos (' + b.reason + ')');
  });
  gatedCat += catN; console.log('caso 1: gatos sospechosos bloqueados ' + catN);
}
Object.keys(stat).forEach((d) => console.log(`${d}: ${cases.length} casos · ${stat[d].n} partidas simuladas (0..${TABLE[d].strikes} fallos) · ganadas con fallos permitidos ${stat[d].win}`));
console.log(`gate: gatos bloqueados ${gatedCat} · no interrogados bloqueados ${gatedFresh} · ofensas comprobadas ${offenseChecks} (con rencor/rumor ${rumors})`);
console.log(`comprobaciones ${checks} · fallos ${bad}`);
process.exit(bad ? 1 : 0);
