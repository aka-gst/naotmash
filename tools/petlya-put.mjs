import { launch } from './cdp-mini.mjs';
const url = process.argv[2] || 'http://127.0.0.1:8735/index.html?quiet';
const c = await launch();
try {
  const out = [];
  for (const [w, h] of [[375, 812], [450, 900], [768, 1024], [1280, 720]]) {
    await c.view(w, h); await c.goto(url);
    const r = await c.ev(`(async()=>{ const n=window.naotmash; n.scene({weapon:0,crowd:10,spread:42,seed:31,hy:0.5,radius:84});
      let p=0, s=n.state().герой; for(let i=0;i<132;i++){ n.step(1/60); const t=n.state().герой; p+=Math.hypot(t.x-s.x,t.y-s.y); s=t; } return {p:Math.round(p), win:n.state().окно}; })()`);
    out.push(w + 'x' + h + ': ' + r.p);
  }
  console.log(out.join(' | '));
} finally { c.close(); }
