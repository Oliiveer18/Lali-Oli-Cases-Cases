// c4 · 2b-3 (cp. 232): SEÑUELOS CON GANZÚA Y CADENA DE SEÑUELOS (interruptor `ganzuaSenuelos`, APAGADO en disco hasta 2b-4). Una a una: node test_ganzua_c4.js [N=40]
// Apagado: ninguna ganzúa sobre pistas falsas y ninguna cadena falsa (v7 sin cambios). Encendido (parche en memoria): las falsas de documento o física piden ganzúa, una por sala (cerradura),
// la cadena real sigue siendo real→real, la de señuelo falsa→falsa (nunca mixta), texto de cadena en ambas, y el bot gana. Mutaciones: dos ganzúas en una sala · cadena real con ganzúa falsa · interruptor encendido en disco.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const N = +process.argv[2] || 40, LV = ['facil', 'normal', 'dificil'];
let bad = 0, checks = 0; const late = []; /* «el patrón encaja» se mira al final: m.ok se rellena al cargar el archivo (FIX-OK, cp. 247) */ const ok = (m, c) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
// En disco AMBOS interruptores están encendidos (cp. 234). OFFP = ambos apagados; ON = solo la ganzúa de señuelo (UV de señuelo apagada), como se probó en 2b-3.
const OFFP = (f, t) => (f === 'gen_data.js' ? t.replace('uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: false, ganzuaSenuelos: false') : t);
const ON = (extra) => (f, t) => { if (f === 'gen_data.js') t = t.replace('uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: false, ganzuaSenuelos: true'); return extra ? extra(f, t) : t; };
function medir(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7; const res = {};
  const C = G.GEN_DATA.compile.mech.chain, hasTxt = (s, bank) => bank.some((x) => s.indexOf(x) >= 0);
  LV.forEach((L) => { const R = res[L] = { n: 0, gzF: 0, malKind: 0, dosPorSala: 0, cadR: 0, cadF: 0, cadMix: 0, sinTxtGz: 0, sinTxtUv: 0, uvFSinCadena: 0, win: 0 };
    for (let i = 1; R.n < N && i < N * 6; i++) {
      const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; R.n++;
      const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); const gzIds = {};
      Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (st && st.tool === 'ganzua') gzIds[(p.id || '').replace(/^obj_/, '')] = st; }));
      Object.values(r.def.rooms).forEach((rm) => { let gzSala = 0; (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (!st || !st.tool) return; const id = (p.id || '').replace(/^obj_/, ''), c = byId[id];
        if (st.tool === 'ganzua') { gzSala++; if (c && c.role === 'falsa') { R.gzF++; if (['documento', 'física'].indexOf(c.kind) < 0) R.malKind++; } }
        if (st.tool === 'uv' && p.visible) { const g = p.visible.flag.replace(/^abierto_/, ''), gf = byId[g] && byId[g].role === 'falsa', uf = c && c.role === 'falsa';
          if (uf && gf) { R.cadF++; if (c.kind !== 'documento') R.malKind++; } else if (!uf && !gf) R.cadR++; else R.cadMix++; if (!hasTxt(st.text, C.uv)) R.sinTxtUv++; if (gzIds[g] && !hasTxt(gzIds[g].text, C.gz)) R.sinTxtGz++; } });
        if (gzSala > 1) R.dosPorSala++; });
    }
    const b = G.generateCase(4321, { level: L }); if (b.def && G.botPlay(b.def).win) R.win++; });
  return res;
}
const OFF = medir(OFFP), S = medir(ON()), MIN = { facil: 0.3, normal: 0.5, dificil: 0.5 }, MINC = { facil: 0.1, normal: 0.2, dificil: 0.2 };
LV.forEach((L) => { ok(`${L}: con el interruptor APAGADO no hay ganzúa en pistas falsas (${OFF[L].gzF}) ni cadena falsa (${OFF[L].cadF})`, OFF[L].gzF === 0 && OFF[L].cadF === 0);
  const R = S[L], m = R.gzF / R.n, c = R.cadF / R.n;
  ok(`${L}: señuelos con ganzúa encendidos: ${m.toFixed(2)} por caso (≥ ${MIN[L]})`, m >= MIN[L]);
  ok(`${L}: cadenas de señuelo ${c.toFixed(2)} por caso (≥ ${MINC[L]}) y la cadena real sigue (${(R.cadR / R.n).toFixed(2)} por caso)`, c >= MINC[L] && R.cadR > 0);
  ok(`${L}: ganzúa de señuelo solo en documento o física (${R.malKind}), una por sala (${R.dosPorSala}), cadenas nunca mixtas (${R.cadMix}), con texto de cadena (${R.sinTxtUv} UV · ${R.sinTxtGz} ganzúa sin él)`, R.malKind === 0 && R.dosPorSala === 0 && R.cadMix === 0 && R.sinTxtUv === 0 && R.sinTxtGz === 0);
  ok(`${L}: señuelos con ganzúa encendidos: el bot gana el caso de muestra`, R.win === 1); });
// mutaciones
{ const m1 = mutador('compile.js', '|| gzPlace[c.source.place]) return;', ') return;'); late.push(() => ok('mutación «dos ganzúas en una sala»: el patrón encaja', m1.ok !== false));
  const M1 = medir((f, t) => ON(m1.patch)(f, t)); ok('mutación «dos ganzúas en una sala» detectada', LV.some((L) => M1[L].dosPorSala > 0));
  const m2 = mutador('compile.js', "toolOf[id] === 'ganzua' && !decoyGz[id])[0]", "toolOf[id] === 'ganzua')[0]"); late.push(() => ok('mutación «cadena real con ganzúa falsa»: el patrón encaja', m2.ok !== false));
  const M2 = medir((f, t) => ON(m2.patch)(f, t)); ok('mutación «cadena real con ganzúa falsa» detectada (aparecen cadenas mixtas)', LV.some((L) => M2[L].cadMix > 0));
  const m3 = mutador('gen_data.js', 'uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: true, ganzuaSenuelos: false'); late.push(() => ok('mutación «ganzúa de señuelo apagada en disco»: el patrón encaja', m3.ok !== false));
  const M3 = medir(m3.patch); ok('mutación «ganzúa de señuelo apagada en disco» detectada (ningún señuelo con ganzúa)', LV.every((L) => M3[L].gzF === 0));
  const D = medir(); ok('estado de disco: señuelos con ganzúa encendidos en los 3 niveles', LV.every((L) => D[L].gzF > 0)); }
late.forEach((g) => g()); console.log(bad ? `\n${bad} de ${checks} comprobaciones con fallos` : `\nTodo en orden (${checks} comprobaciones)`);
process.exit(bad ? 1 : 0);
