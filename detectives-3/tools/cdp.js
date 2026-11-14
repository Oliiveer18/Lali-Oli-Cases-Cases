// Herramienta de pruebas: lanza Chromium sin cabeza y lo controla por el protocolo CDP (sin dependencias).
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os'), path = require('path');
const findChrome = () => { if (process.env.CHROME) return process.env.CHROME; const c = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']; try { const base = '/opt/pw-browsers'; fs.readdirSync(base).filter((d) => /^chromium-/.test(d)).forEach((d) => c.unshift(path.join(base, d, 'chrome-linux/chrome'))); } catch (e) {} return c.find((p) => fs.existsSync(p)) || 'chromium'; };
const CHROME = findChrome();
let seq = 0;
exports.launch = async function (url, opts) {
  opts = opts || {};
  // puerto libre pedido al sistema (varias pruebas pueden lanzar Chrome a la vez en paralelo sin chocar)
  const port = await new Promise((res) => { const s = require('net').createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
  const dir = path.join(os.tmpdir(), 'loc-chrome-' + port);
  fs.mkdirSync(dir, { recursive: true });
  const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--window-size=' + (opts.w || 1280) + ',' + (opts.h || 720), 'about:blank'], { stdio: 'ignore', detached: true });
  // Chrome lanza hijos (renderer, GPU): se mata el GRUPO entero, también si la prueba muere antes de close()
  const killGroup = () => { try { process.kill(-proc.pid, 'SIGKILL'); } catch (e) { try { proc.kill('SIGKILL'); } catch (e2) {} } try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} };
  process.on('exit', killGroup);
  ['SIGINT', 'SIGTERM'].forEach((sg) => process.on(sg, () => { killGroup(); process.exit(1); }));
  let info;
  for (let i = 0; i < 60; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (info.length) break; } catch (e) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  const page = info.find((p) => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const pending = {}, logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text));
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('console.error: ' + d.params.args.map((a) => a.value || a.description).join(' '));
  };
  const send = (method, params) => new Promise((res) => { const id = ++seq; pending[id] = res; ws.send(JSON.stringify({ id, method, params: params || {} })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opts.w || 1280, height: opts.h || 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, opts.wait || 1500));
  const api = {
    logs,
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return 'ERR: ' + (r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text); return r.result.result.value; },
    async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); },
    async key(code, ms) {
      const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code === 'Space' ? ' ' : code;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode: 0 });
      await new Promise((r) => setTimeout(r, ms || 80));
      await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key });
      await new Promise((r) => setTimeout(r, 60));
    },
    async hold(code, ms) { const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code; await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key }); await new Promise((r) => setTimeout(r, ms)); await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key }); },
    async down(code) { const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code; await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key }); },
    async up(code) { const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code; await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key }); },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    close() { try { ws.close(); } catch (e) {} killGroup(); },
  };
  return api;
};
