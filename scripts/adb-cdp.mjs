// Drive the game on a phone over adb + Chrome DevTools Protocol (needs the
// debuggable build: `npm run tauri android build -- --apk --debug`, package
// cz.rogr.pochapop.debug). Evaluates JS in the WebView, `__pocha` is there.
// Usage: node scripts/adb-cdp.mjs '<js expression>'      (prints the JSON result)
//        import { cdp } from './adb-cdp.mjs'; const page = await cdp(); await page.eval('1+1')
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import WebSocket from 'ws';

export const ADB = process.env.ADB ?? (process.env.ANDROID_HOME ? `${process.env.ANDROID_HOME}/platform-tools/adb` : 'adb');
export const PKG = process.env.POCHA_PKG ?? 'cz.rogr.pochapop.debug';

export const adb = (...args) => execFileSync(ADB, args, { encoding: 'utf8' }).trim();

export async function cdp(port = 9333) {
  const pid = adb('shell', 'pidof', PKG);
  if (!pid) throw new Error(`${PKG} is not running`);
  adb('forward', `tcp:${port}`, `localabstract:webview_devtools_remote_${pid}`);
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = list.find((t) => t.type === 'page');
  if (!target) throw new Error('no page in the WebView');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0;
  const waiting = new Map();
  ws.on('message', (d) => {
    const m = JSON.parse(String(d));
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; waiting.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  // the WebView's offset on the screen (status bar) in physical px
  const desc = JSON.parse(target.description || '{}');
  const screenY = desc.screenY ?? 0, screenX = desc.screenX ?? 0;
  const page = {
    send,
    /** Evaluate an expression (promises awaited), return its JSON value. */
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
      return r.result?.result?.value;
    },
    close() { ws.close(); },
    /**
     * Real tap (adb input) on a game object: a Button by its label in the active
     * scene, or logical coordinates {x, y}.
     */
    async tap(what) {
      const pt = await page.eval(`(() => {
        const P = window.__pocha, sc = P.game.scene.getScenes(true)[0];
        const w = ${JSON.stringify(what)};
        let x = w.x, y = w.y;
        if (typeof w === 'string') {
          const all = []; const walk = (l) => l.forEach((o) => { all.push(o); if (o.list) walk(o.list); });
          walk(sc.children.list);
          const b = all.find((o) => o.label && o.label.text === w && o.visible);
          if (!b) return null;
          const m = b.getWorldTransformMatrix(); x = m.tx; y = m.ty;
        }
        const r = P.game.canvas.getBoundingClientRect(), k = r.width / P.game.scale.width, d = devicePixelRatio;
        return [Math.round((r.left + x * k) * d), Math.round((r.top + y * k) * d)];
      })()`);
      if (!pt) throw new Error(`nothing to tap: ${JSON.stringify(what)}`);
      adb('shell', 'input', 'tap', String(pt[0] + screenX), String(pt[1] + screenY));
      return pt;
    },
    scene() { return page.eval('window.__pocha.game.scene.getScenes(true).map((s) => s.scene.key)[0]'); },
  };
  return page;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const page = await cdp();
  console.log(JSON.stringify(await page.eval(process.argv[2] ?? 'location.href'), null, 1));
  page.close();
}
