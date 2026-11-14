// Auditoría (sin navegador) de la pestaña SOSPECHOSOS del cuaderno (play.js drawSuspects) con los textos de N casos generados × 3 dificultades.
// NO arregla nada: informa dónde se pisan nombre y descripción. Uso: node tools/auditoria_textos_sospechosos.js [N=300] [factorNegrita=0.58] [factorNormal=0.52]
// Medida de ancho aproximada (sin fuente real): factor × tamaño × nº de caracteres (Trebuchet MS: ~0,52-0,58 em de media). Geometría copiada de drawSuspects.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const U = G.ui, N = +process.argv[2] || 300, FB = +process.argv[3] || 0.58, FN = +process.argv[4] || 0.52;
const mkCtx = () => { const t = { font: '' }; return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => { const bold = /^bold /.test(o.font), px = parseFloat(o.font.replace(/^bold /, '')) || 16; return { width: String(s).length * px * (bold ? FB : FN) }; } : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }); };
const ctx = mkCtx();
const cases = [];
for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) cases.push(r.def); }
if (G.CASES && G.CASES.tarta) cases.push(G.CASES.tarta);
const NAME_Y = 128, DESC_Y = 156, DESC_MAXH = 90, METER_Y = 250;   // relativos a la tarjeta (y = 104)
const res = {};
const rows = [], byCw = {};
let total = 0;
for (const big of [false, true]) {
  G.save.data.settings.bigText = big;
  for (const d of ['easy', 'normal', 'hard']) for (const def of cases) {
    const st = new G.CaseState(JSON.parse(JSON.stringify(def)), d);
    const list = st.boardOptions().suspects, cw = Math.min(200, (G.VW - 160) / list.length - 10);
    list.forEach((s) => {
      total++;
      const nm = U.textLayout(ctx, s.name, { size: 17, bold: true, maxW: cw - 16, maxH: 52, minSize: 13, lineH: 22 });   // geometría de drawSuspects tras el arreglo (checkpoint 68)
      const dy = Math.max(DESC_Y, NAME_Y + nm.h + 4);
      const ds = U.textLayout(ctx, s.desc || '', { size: 14, maxW: cw - 24, lineH: 19, maxH: 246 - dy, minSize: 11, bold: false });
      const nameBottom = NAME_Y + nm.h, overlap = nameBottom > dy || nm.truncated || nameBottom + (ds.h) > 250 + 0.5;
      const key = d + (big ? '+grande' : '');
      if (!big) { const b = (byCw[Math.round(cw) + ' px (' + list.length + ' sosp.)'] = byCw[Math.round(cw) + ' px (' + list.length + ' sosp.)'] || { n: 0, over: 0 }); b.n++; if (overlap) b.over++; }
      const r = (res[key] = res[key] || { n: 0, cw: cw, cwMin: 999, nameOverlap: 0, name1: 0, name2: 0, name3: 0, descShrunk: 0, descTrunc: 0, maxName: 0, maxDesc: 0 });
      r.n++; r.cw = cw; r.cwMin = Math.min(r.cwMin, cw); r.maxName = Math.max(r.maxName, s.name.length); r.maxDesc = Math.max(r.maxDesc, (s.desc || '').length);
      r['name' + Math.min(3, nm.lines.length)]++;
      if (overlap) { r.nameOverlap++; if (rows.length < 400) rows.push({ key, case: def.id, name: s.name, lines: nm.lines.length, nameBottom, cw }); }
      if (ds.shrunk) r.descShrunk++;
      if (ds.truncated) r.descTrunc++;
    });
  }
}
console.log(`Auditoría SOSPECHOSOS · ${cases.length} casos × 3 dificultades (× «Texto grande» sí/no) · ${total} tarjetas · ancho medido ×${FB} negrita / ×${FN} normal`);
console.log('Tarjeta (tras el arreglo del fallo 5): nombre en y+128 (17 px negrita, máx. 52 px, mín. 13 px); la descripción empieza en max(y+156, fin del nombre+4) y llega como mucho a y+246; «Sospecha» en y+250. Cuenta como PISADO: nombre recortado, o nombre/descripción que se solapan, o descripción que pasa de y+250.');
Object.keys(res).forEach((k) => { const r = res[k]; console.log(`  ${k.padEnd(14)} tarjetas ${String(r.n).padStart(5)} · ancho de tarjeta ${r.cwMin.toFixed(0)}-${r.cw.toFixed(0)} px · nombre 1 línea ${r.name1}, 2 líneas ${r.name2}, 3+ ${r.name3} · NOMBRE PISA DESCRIPCIÓN ${r.nameOverlap} (${(100 * r.nameOverlap / r.n).toFixed(1)} %) · descripción reducida ${r.descShrunk}, recortada ${r.descTrunc} · nombre más largo ${r.maxName} car., descripción más larga ${r.maxDesc} car.`); });
const ex = {}; rows.filter((r) => r.key === 'easy' || r.key === 'normal' || r.key === 'hard').forEach((r) => { ex[r.name] = ex[r.name] || r; });
console.log('Por ancho de tarjeta (sin Texto grande, los 3 niveles juntos):'); Object.keys(byCw).sort().forEach((k) => console.log(`  ${k.padEnd(18)} ${String(byCw[k].n).padStart(5)} tarjetas · nombre pisa ${byCw[k].over} (${(100 * byCw[k].over / byCw[k].n).toFixed(1)} %)`));
console.log('Ejemplos de nombres que pisan (sin Texto grande):'); Object.values(ex).slice(0, 12).forEach((r) => console.log(`  [${r.key}] «${r.name}» → ${r.lines} líneas (acaba en y+${r.nameBottom}, tarjeta ${r.cw.toFixed(0)} px) · caso ${r.case}`));
require('fs').writeFileSync('/tmp/auditoria_sospechosos.json', JSON.stringify({ res, ejemplos: Object.values(ex).slice(0, 40) }, null, 1));
