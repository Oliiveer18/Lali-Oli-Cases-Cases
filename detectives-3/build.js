// build.js — une todo en UN solo archivo HTML (dist/index.html) que se juega en cualquier navegador sin instalar nada.
const fs = require('fs'), path = require('path');
// Módulos del juego, en orden de carga. El generador de casos (v0.7.21) entra DESPUÉS del revisor y ANTES de los casos y del mundo:
// solo define funciones (G.generateCase, G.caseFingerprint...) y NO registra ningún caso en G.CASES salvo que se pida con {register:true}.
// Quedan FUERA del juego (solo pruebas y desarrollo): bot.js, quality.js (bot y nota de calidad) y report.js (informe de texto de la biblia).
const engine = ['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js', 'logic.js', 'schema.js', 'review.js'];
const generator = ['bible.js', 'gen_data.js', 'gen_themes.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'meter.js'];
const order = engine.concat(generator);
// los casos se cargan automáticamente (case*.js) antes del motor del mundo
const caseFiles = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => /^case\d+\.js$/.test(f)).sort();
const files = order.concat(caseFiles, ['world.js', 'companion.js', 'relay.js', 'net.js', 'play.js', 'scenes.js']);
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const js = files.map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('\n').replace('__BUILD__', stamp);
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Lali & Oli Cases · Detectives de lo Absurdo</title>
<style>
  html,body{margin:0;height:100%;background:#0d0716;overflow:hidden;touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  body{position:fixed;inset:0}
  canvas{display:block;position:fixed;left:env(safe-area-inset-left,0px);top:env(safe-area-inset-top,0px);width:calc(100vw - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px));height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));object-fit:contain;background:#0d0716;outline:none}
  #nojs{position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:20px sans-serif}
</style>
</head>
<body>
<canvas id="c" tabindex="0"></canvas>
<div id="nojs" style="text-align:center;padding:0 24px">Cargando… Si ves esto más de unos segundos, abre el juego con un navegador (Safari/Chrome), no con la vista previa de Archivos.</div>
<noscript><div id="nojs">Este juego necesita JavaScript.</div></noscript>
<script>
${js}
window.addEventListener('error', function (e) { var n = document.getElementById('nojs'); if (n) n.textContent = 'Error: ' + (e.message || e); });
window.addEventListener('load', function () { var c = document.getElementById('c'); c.focus(); window.__G = window.G; G.boot(c); var n = document.getElementById('nojs'); if (n) n.remove(); if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} } });
</script>
</body>
</html>`;
// variante para publicar como artefacto de Claude (el contenedor aporta <html>/<head>/<body>)
const art = `<title>Lali & Oli Cases</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  :root{color-scheme:dark}
  html,body{height:100%;margin:0;padding-left:0;padding-right:0;background:#0d0716;overflow:hidden;touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  canvas{display:block;width:100%;height:100%;object-fit:contain;background:#0d0716;outline:none}
</style>
<canvas id="c" tabindex="0"></canvas>
<script>
${js}
window.addEventListener('load', function () { var c = document.getElementById('c'); c.focus(); window.__G = window.G; G.boot(c); });
</script>`;
fs.mkdirSync(path.join(__dirname, 'dist', 'web'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), art);
// versión web pública (subir a cualquier alojamiento): online directo con PeerJS, instalable en la pantalla de inicio del iPhone
const iconB64 = fs.readFileSync(path.join(__dirname, 'assets', 'apple-touch-icon.png')).toString('base64');
const iconTags = '<link rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,' + iconB64 + '">\n<link rel="icon" type="image/png" href="data:image/png;base64,' + iconB64 + '">\n<title>';
const web = html
  .replace('<title>', () => iconTags)
  .replace('<meta name="viewport"', '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Lali & Oli Cases">\n<meta name="theme-color" content="#0d0716">\n<meta name="viewport"')
  .replace('viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"', 'viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"')
  .replace('<script>\n/* ===== core.js', '<script>window.__STANDALONE=true;</script>\n<script>(function(){var u=["https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js","https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js","https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js"],i=0;function n(){if(window.Peer||i>=u.length)return;var s=document.createElement("script");s.src=u[i++];s.onload=function(){if(!window.Peer)n();};s.onerror=n;document.head.appendChild(s);}n();})();</script>\n<script>\n/* ===== core.js');
// PeerJS dentro del propio archivo (sin CDN): colocar vendor/peerjs.min.js (v1.5.4) y construir de nuevo
const vend = path.join(__dirname, 'vendor', 'peerjs.min.js');
let webOut = web;
if (fs.existsSync(vend)) {
  const lib = fs.readFileSync(vend, 'utf8').replace(/<\/script/gi, '<\\/script');
  webOut = web.replace(/<script>\(function\(\)\{var u=\[[\s\S]*?n\(\);\}\)\(\);<\/script>/, () => '<script>' + lib + '</script>');
  console.log('PeerJS incluido dentro del juego (' + Math.round(lib.length / 1024) + ' KB), sin CDN');
} else console.log('AVISO: falta vendor/peerjs.min.js → la versión web carga PeerJS desde un CDN (ver vendor/LEEME.txt)');
fs.writeFileSync(path.join(__dirname, 'dist', 'web', 'index.html'), webOut);
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
// service worker: red primero (siempre la versión nueva si hay conexión) y copia sin conexión
const ver = require('fs').readFileSync(path.join(__dirname, 'src', 'core.js'), 'utf8').match(/G\.VERSION = '([^']+)'/)[1];
const sw = `const V = 'loc-${ver}-${stamp.replace(/[^0-9]/g, '')}';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(['./', './index.html'])).catch(() => {})); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !/peerjs/.test(u.href)) return;
  e.respondWith(fetch(r).then((res) => { if (res && res.ok && res.status === 200) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)).catch(() => {}); } return res; }).catch(() => caches.match(r).then((m) => m || caches.match('./index.html'))));
});
`;
fs.writeFileSync(path.join(__dirname, 'dist', 'web', 'sw.js'), sw);
console.log('dist/index.html', Math.round(html.length / 1024) + ' KB · ' + files.length + ' módulos');
