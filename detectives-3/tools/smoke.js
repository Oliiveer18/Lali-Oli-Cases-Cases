const { launch } = require('./cdp');
const SC = require('os').tmpdir();
(async () => {
  const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 2500 });
  console.log('escena:', await b.eval('G.scene && G.scene.constructor.name'), '· errores:', await b.eval('JSON.stringify(G.errors)'));
  await b.shot(SC + '/01_title.png');
  console.log('logs', b.logs.slice(0, 5));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
