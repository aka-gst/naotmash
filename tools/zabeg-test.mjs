// Проверка «тот же сид — то же расписание». node zabeg-test.mjs [база-url]
import { launch } from './cdp-mini.mjs';
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 560000);
const base = process.argv[2] || 'http://127.0.0.1:8735/index.html';
const U = (seed) => `${base}?quiet&seed=${seed}`;
const keyOf = (l) => l.split(':')[0];
const toMap = (a) => new Map(a.map((l) => [keyOf(l), l]));
function cmp(a, b) { // по пересечению ключей; возвращает {общих, разошлось:[…]}
  const A = toMap(a), B = toMap(b); let n = 0; const bad = [];
  for (const [k, v] of A) if (B.has(k)) { n++; if (B.get(k) !== v) bad.push(k + ' | ' + v + ' | ' + B.get(k)); }
  return { общих: n, разошлось: bad };
}
const c = await launch();
let fail = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'ЗЕЛЁНЫЙ ' : 'КРАСНЫЙ ') + name + ' ' + extra); if (!cond) fail++; };
const reach = (r) => r.волна >= 3 && r.дропов >= 2;
async function sync(seed, bot, w = 450, h = 900) {
  await c.view(w, h); await c.goto(U(seed));
  return c.ev(`naotmash.partiya({bot:'${bot}'})`);
}
async function real(seed, bot, throttle) {
  await c.view(450, 900); await c.goto(U(seed)); await c.throttle(throttle);
  await c.ev(`(()=>{ naotmash.bessmertie(true); const t0=performance.now();
    window.__bot=setInterval(()=>{ const t=(performance.now()-t0)/1000;
      const m='${bot}'==='машет'; const cx=innerWidth/2+(m?150*Math.sin(t*.7):0), cy=innerHeight/2+(m?100*Math.cos(t*.5):0), rr=m?90:120, sp=m?11:7;
      document.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',{clientX:cx+Math.cos(t*sp)*rr,clientY:cy+Math.sin(t*sp)*rr,pointerId:1,bubbles:true})); },16);
    document.querySelector('#start .den').click();
    const cv=document.querySelector('canvas'); cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:innerWidth/2+120,clientY:innerHeight/2,pointerId:1,bubbles:true})); })()`);
  let r;
  for (let i = 0; i < 400; i++) {
    await new Promise((x) => setTimeout(x, 1000));
    r = await c.ev(`(()=>{const f=naotmash.otpechatok(); return {волна:+f.filter(x=>x.startsWith('волна')).length, дропов:f.filter(x=>x.startsWith('дроп')).length, отпечаток:f, сек:Math.round(performance.now()/1000)}})()`);
    if (r.волна >= 3 && r.дропов >= 2 && r.отпечаток.some((l) => l.startsWith('враг 3.'))) break;
  }
  await c.throttle(1);
  return r;
}
try {
  const S = 20261127;
  const a1 = await sync(S, 'стоит'), a2 = await sync(S, 'стоит');
  ok('1 два прогона, один сид: прогон дошёл (≥3 волн, ≥2 дропов)', reach(a1) && reach(a2), `${a1.волна}в/${a1.дропов}д ${a2.волна}в/${a2.дропов}д`);
  ok('1 отпечатки равны', JSON.stringify(a1.отпечаток) === JSON.stringify(a2.отпечаток), `строк ${a1.отпечаток.length}`);
  const m1 = await sync(S, 'машет');
  const c2 = cmp(a1.отпечаток, m1.отпечаток);
  ok('2a боты стоит/машет (синхронно): дошли', reach(m1), `${m1.волна}в/${m1.дропов}д`);
  ok('2a расписание равно по общим ключам', c2.разошлось.length === 0 && c2.общих >= 25, `общих ${c2.общих}, разошлось ${c2.разошлось.length} ${c2.разошлось.slice(0,3).join(' ;; ')}`);
  const rt = await real(S, 'машет', 4);
  const c3 = cmp(a1.отпечаток, rt.отпечаток);
  ok('2b реальное время, бот машет, CPU×4: дошёл', rt.волна >= 3 && rt.дропов >= 2, `${rt.волна}в/${rt.дропов}д за ${rt.сек}с`);
  ok('2b расписание равно синхронному', c3.разошлось.length === 0 && c3.общих >= 25, `общих ${c3.общих}, разошлось ${c3.разошлось.length} ${c3.разошлось.slice(0,3).join(' ;; ')}`);
  const n1 = await sync(S + 1, 'стоит');
  const c4 = cmp(a1.отпечаток, n1.отпечаток);
  ok('3 контроль: сид+1 — отпечаток другой', c4.разошлось.length >= 10, `разошлось ${c4.разошлось.length} из ${c4.общих}`);
  const p1 = await sync(S, 'стоит', 390, 844), p2 = await sync(S, 'стоит', 1280, 720);
  const c5 = cmp(a1.отпечаток, p1.отпечаток), c6 = cmp(a1.отпечаток, p2.отпечаток);
  ok('4 390×844 и 1280×720: виды/края/темы равны', reach(p1) && reach(p2) && c5.разошлось.length === 0 && c6.разошлось.length === 0 && c5.общих >= 25 && c6.общих >= 25,
    `общих ${c5.общих}/${c6.общих}, разошлось ${c5.разошлось.length}/${c6.разошлось.length}`);
} finally { c.close(); }
console.log(fail ? 'ИТОГ: КРАСНЫХ ' + fail : 'ИТОГ: всё зелёное');
