const { launch } = require('./cdp');
const SC = require('os').tmpdir();
const mode = process.argv[2] || 'coop';
exports.start = async function (mode, diffDown) {
  const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 1800 });
  await b.key('Enter'); await b.wait(300);
  if (mode === 'solo') await b.key('ArrowLeft');
  await b.key('Enter'); await b.wait(300);
  await b.key('Enter'); await b.wait(300); await b.key('Enter'); await b.wait(300);
  for (let i = 0; i < (diffDown === undefined ? 1 : diffDown); i++) await b.key('ArrowDown');
  await b.key('Enter'); await b.wait(800);
  b.skipModals = async (max) => { for (let i = 0; i < (max || 40); i++) { const n = await b.eval('G.scene.modals.length'); if (!n) return i; await b.key('Enter', 60); await b.wait(150); } return -1; };
  return b;
};
if (require.main === module) (async () => {
  const b = await exports.start(mode);
  console.log('modales cerrados en', await b.skipModals(), 'pulsaciones');
  console.log('errores:', await b.eval('JSON.stringify(G.errors)'));
  await b.wait(500);
  await b.shot(SC + '/06_world.png');
  console.log(await b.eval('JSON.stringify({room:G.scene.world.roomId, p:G.scene.world.players.map(p=>[p.x|0,p.y|0]), cam:G.scene.world.cam[0], split:G.scene.world.split})'));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
