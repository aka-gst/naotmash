// Мини-драйвер CDP без зависимостей: свой headless Chrome, свой порт, гасится по PID.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9435;
const PROFILE = process.env.NAO_PROFILE || process.env.HOME + '/dev/trash/naotmash-zabeg/profile';   // свой профиль, не Сергея
export async function launch() {
  mkdirSync(PROFILE, { recursive: true });
  const proc = spawn(CHROME, ['--headless=new', '--mute-audio', '--user-data-dir=' + PROFILE,
    '--remote-debugging-port=' + PORT, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  let list;
  for (let i = 0; i < 60; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (list.length) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  const tab = list.find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (d) => d.error ? rej(new Error(method + ': ' + JSON.stringify(d.error))) : res(d.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  const api = {
    pid: proc.pid, send,
    async goto(url) { await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true }); await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, 1500)); },
    async view(w, h, mobile = false) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); },
    async throttle(rate) { await send('Emulation.setCPUThrottlingRate', { rate }); },
    async ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result.value; },
    async shot(path) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path, Buffer.from(r.data, 'base64')); },
    close() { try { ws.close(); } catch {} try { process.kill(proc.pid); } catch {} setTimeout(() => process.exit(0), 200); },
  };
  return api;
}
