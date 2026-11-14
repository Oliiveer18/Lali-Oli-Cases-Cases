// huella_4f0a.js — hash de lo que genera cada semilla (def sin los campos nuevos de 4F-0a). Uso: node tools/huella_4f0a.js [n] → imprime el hash global.
const crypto = require('crypto');
const G = require('./load_g.js')(['bible.js', 'gen_data.js'].concat(require('fs').existsSync(require('path').join(__dirname, '..', 'src', 'gen_themes.js')) ? ['gen_themes.js'] : [], ['gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'meter.js']));
const N = +process.argv[2] || 300, NEW = ['theme', 'goal', 'scenario'];
const h = crypto.createHash('sha256'); const per = [];
for (let i = 0; i < N; i++) {
  const seed = (i * 2654435761 + 12345) >>> 0;
  const r = G.generateCase(seed, process.argv.includes('--sin-monedas') ? { noCoins: true } : {});
  const txt = r.error ? 'ERR ' + seed : JSON.stringify(r.def, (k, v) => (NEW.indexOf(k) >= 0 ? undefined : v));
  const s = crypto.createHash('sha256').update(txt).digest('hex').slice(0, 10); per.push(s); h.update(txt);
}
console.log(JSON.stringify({ n: N, gen: G.GEN_VERSION, hash: h.digest('hex'), first: per.slice(0, 5) }));
