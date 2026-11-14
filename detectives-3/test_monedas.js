// test_monedas.js — 4F-0a subpaso 4: las monedas sueltas de los casos generados se COBRAN de verdad en el juego (mundo real, `World.completeStep`),
// no solo salen en el texto. Comprueba: cada moneda suma exactamente su importe a `bonusMoney`; un caso entero da el total anunciado (15);
// las curiosidades sin moneda no suman nada; el caso 1 no tiene monedas; y la recompensa final solo las incluye si el caso se resuelve (regla P1).
// Uso: node test_monedas.js [semillas=60]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'bot.js', 'quality.js']);
const N = +process.argv[2] || 60;
let bad = 0, n = 0;
const ok = (name, cond, extra) => { n++; if (!cond) { bad++; console.log('FALLA · ' + name); if (extra) console.log('  ', extra); } else console.log('OK · ' + name); };
const EX = G.GEN_DATA.compile.extra.coins;
let casos = 0, monedas = 0, mal = 0, sinMoneda = 0, sinMonedaMal = 0, totMal = 0, primero = null, sfxMal = 0;
for (let s = 0; s < N; s++) {
  const d = G.generateCase(s * 11 + 3).def; if (!d) continue; casos++;
  const st = new G.CaseState(d, 'normal'), w = new G.World(st, { mode: 'solo' });
  let tot = 0;
  Object.keys(d.rooms).forEach((rid) => {
    w.enterRoom(rid, null);
    (d.rooms[rid].props || []).forEach((p) => {
      if (!/^cur_\d+$/.test(p.id)) return;
      const rp = w.room.props.find((x) => x.id === p.id); const step = p.steps[0];
      const antes = st.bonusMoney, before = w.out.length;
      w.completeStep(rp, step, { id: 'rex' });
      const gan = st.bonusMoney - antes;
      if (step.fx && step.fx.money) { monedas++; tot += gan; if (gan !== EX.amount) { mal++; if (!primero) primero = `semilla ${s} ${p.id}: esperaba +${EX.amount}, sumó +${gan}`; } }
      else { sinMoneda++; if (gan !== 0) sinMonedaMal++; }
    });
  });
  const colocado = JSON.stringify(d).split('"money":' + EX.amount).length - 1;
  if (tot !== colocado * EX.amount || tot > EX.n * EX.amount) totMal++;
}
ok(`cada moneda suma su importe (+${EX.amount}) al completar el objeto en el mundo real (${monedas} monedas en ${casos} casos)`, monedas > 0 && mal === 0, primero);
ok(`las curiosidades sin moneda no suman nada (${sinMoneda} comprobadas)`, sinMoneda > 0 && sinMonedaMal === 0);
ok(`cada caso paga exactamente las monedas colocadas y nunca más de ${EX.n * EX.amount} (casos con descuadre: ${totMal})`, totMal === 0);
{ // total por caso: la mayoría llevan las 15
  let full = 0, total = 0;
  for (let s = 0; s < N; s++) { const d = G.generateCase(s * 11 + 3).def; if (!d) continue; total++; if (JSON.stringify(d).split('"money":' + EX.amount).length - 1 === EX.n) full++; }
  ok(`casi todos los casos (≥ 90 %) llevan las ${EX.n} monedas colocadas (${full}/${total})`, full / total >= 0.9);
}
{ const d = G.CASES.tarta, s = JSON.stringify(d); ok('el caso 1 no tiene ninguna moneda suelta', s.indexOf('"money"') < 0); }
{ // regla P1: las monedas solo se cobran si el caso se resuelve (reward() real)
  const d = G.generateCase(3).def, mk = () => { const st = new G.CaseState(d, 'normal'); st.bonusMoney = EX.n * EX.amount; return st; };
  const a = mk(); a.closed = false; const b = mk(); b.closed = true; const c = new G.CaseState(d, 'normal'); c.closed = true;
  ok('regla P1: sin resolver el caso las monedas sueltas no se pagan', a.reward().money === 0, 'pagó ' + a.reward().money);
  ok('con el caso resuelto la recompensa incluye exactamente las monedas sueltas', b.reward().money - c.reward().money === EX.n * EX.amount, b.reward().money + ' vs ' + c.reward().money);
}
{ // las monedas son un EXTRA: la nota, los minutos y cada componente son IDÉNTICOS con y sin ellas (3 niveles)
  const COINS = G.GEN_DATA.compile.extra.coins;
  const med = (opts, L, i, romper) => { const r = G.generateCase(i * 7919 + 1, Object.assign({ register: true, level: L }, opts)); if (r.error) return null;
    if (romper) G.GEN_DATA.compile.extra.coins = Object.assign({}, COINS, { lines: ['frase que no es la de ninguna moneda'] }); // el medidor ya no sabe quitar la frase
    try { const q = G.qualityCase(r.def); return JSON.stringify([q.quality, q.bot.humanMinutes, q.parts]); } finally { G.GEN_DATA.compile.extra.coins = COINS; } };
  let dif = 0, tot = 0, primero2 = null;
  ['facil', 'normal', 'dificil'].forEach((L) => { for (let i = 1; i <= 12; i++) { const a = med({}, L, i), b = med({ noCoins: true }, L, i); tot++; if (a !== b) { dif++; if (!primero2) primero2 = L + ' caso ' + i; } } });
  ok(`la nota con monedas es idéntica a la de sin monedas (${tot} pares, 3 niveles)`, tot > 0 && dif === 0, primero2);
  // mutación: si el medidor dejara de quitar la frase de la moneda (cuenta de nuevo), la prueba tiene que notarlo
  let dif2 = 0; ['facil', 'normal', 'dificil'].forEach((L) => { for (let i = 1; i <= 12; i++) { if (med({}, L, i, true) !== med({ noCoins: true }, L, i)) dif2++; } });
  ok(`mutación detectada: si la frase de la moneda cuenta de nuevo, la nota cambia (${dif2} de ${tot} pares distintos)`, dif2 > 0);
}
console.log(bad ? `\n${bad} FALLO(S)` : `\nTODO OK (${n} comprobaciones)`);
process.exit(bad ? 1 : 0);
