// c4b · paso 1 (cp. 256, LOW, SOLO LECTURA): ¿cómo reacciona hoy un sospechoso al enseñarle una prueba de tipo «grabación»? Uso: GENV=7 node tools/grab3_diag_c4b.js [N=40]
// Cuenta, por nivel, las pistas «grabación» (con o sin charla), su rol, y por cada (pista, sospechoso al que señala) si el sospechoso tiene frase PROPIA (`evidence[pista]`) o cae en la genérica (`evidence['*']`/`evidenceDefault`). Mira si algún texto de reacción nombra la grabación.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 40, LV = ['facil', 'normal', 'dificil'], RX = /grabaci|grabad|cinta|micr[oó]f|REC\b|o[ií]d[oa]s?\b|escuch/i;
const out = {}; const muestra = { propia: {}, generica: new Set() };
LV.forEach((L) => {
  const a = { casos: 0, grab: 0, conCharla: 0, objeto: 0, porRol: {}, pares: 0, propios: 0, genericos: 0, porRolPares: {}, nombraGrab: 0, textosRev: 0, sinSujeto: 0 };
  for (let i = 1; i <= N; i++) {
    const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; a.casos++;
    const b = r.bible, def = r.def, props = []; Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((p) => props.push(p)));
    b.clues.filter((c) => c.kind === 'grabación').forEach((c) => {
      a.grab++; a.porRol[c.role] = (a.porRol[c.role] || 0) + 1;
      const pr = props.find((p) => p.id === 'obj_' + c.id); if (pr && pr.listen) a.conCharla++; else a.objeto++;
      const liar = b.lies.filter((l) => (l.refutedBy || []).indexOf(c.id) >= 0).map((l) => l.who);
      const subj = Array.from(new Set(Object.keys(c.points || {}).concat(liar)));
      if (!subj.length) a.sinSujeto++;
      subj.forEach((s) => { const nd = def.npcs[s]; if (!nd) return; a.pares++;
        const propia = !!nd.evidence[c.id]; if (propia) a.propios++; else { a.genericos++; (nd.evidence['*'] || [{ say: nd.evidenceDefault }]).forEach((e) => (e.say || []).forEach((t) => muestra.generica.add(typeof t === 'string' ? t : t.text))); }
        const k = c.role + (propia ? ':propia' : ':generica'); a.porRolPares[k] = (a.porRolPares[k] || 0) + 1;
        const ev = nd.evidence[c.id]; if (ev) JSON.stringify(ev).replace(/\\"/g, '"') && (RX.test(JSON.stringify(ev)) ? a.nombraGrab++ : 0); });
    });
  }
  out[L] = a;
});
console.log(JSON.stringify(out, null, 1));
console.log('Ejemplos de reacción GENÉRICA (cualquier prueba sin frase propia):'); Array.from(muestra.generica).slice(0, 8).forEach((t) => console.log(' · ' + t));
