const { launch } = require('./cdp');
const SC = require('os').tmpdir();
const mode = process.argv[2] || 'coop';
(async () => {
  const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 2000 });
  const sc = async () => b.eval('G.scene.constructor.name + (G.scene.state ? ":" + G.scene.state : "")');
  const errs = async () => { const e = await b.eval('JSON.stringify(G.errors)'); if (e !== '[]') console.log('ERRORES:', e); return e; };
  await b.key('Enter'); await b.wait(500); console.log('1', await sc());
  if (mode === 'solo') { await b.key('ArrowLeft'); }
  await b.shot(SC + '/02_mode.png');
  await b.key('Enter'); await b.wait(500); console.log('2', await sc());
  await b.shot(SC + '/03_hub.png');
  await b.key('Enter'); await b.wait(400); console.log('3', await sc());   // Elegir caso
  await b.key('Enter'); await b.wait(400); console.log('4', await sc());   // el caso
  await b.shot(SC + '/04_diff.png');
  await b.key('ArrowDown'); await b.key('Enter'); await b.wait(1200); console.log('5', await sc());  // normal
  await b.shot(SC + '/05_play_card.png');
  await errs();
  console.log('logs', b.logs.slice(0, 5));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
