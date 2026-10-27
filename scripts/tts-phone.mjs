// Poslech on a real phone over adb (debuggable build cz.rogr.pochapop.debug, see scripts/adb-cdp.mjs).
// SILENT by default: game sounds, ambience and the voice volume are set to 0 before anything else, and
// nothing is tapped (no gesture = WebAudio stays locked). Android TTS still speaks "at volume 0", so
// tts_status, tts://done, the queue and ducking are all real.   LOUD=1 = voice at full volume.
//   adb shell monkey -p cz.rogr.pochapop.debug 1 && node scripts/tts-phone.mjs
import { adb, cdp } from './adb-cdp.mjs';

const LOUD = !!process.env.LOUD;
const page = await cdp();
let failed = false;
const check = (ok, what, extra = '') => { console.log(ok ? 'PASS' : 'FAIL', what, extra); if (!ok) failed = true; };

// 1. silence first
await page.eval(`(() => {
  const P = window.__pocha, s = P.G.data.settings;
  s.sfx = 0; s.ambient = 0; s.voice = ${LOUD ? 1 : 0};
  P.G.applyVolumes(); P.G.audio.setAmbient(null); P.G.audio.setLofi(false); P.G.save.save();
  return true;
})()`);
const vol = await page.eval('window.__pocha.G.speech.volume');
check(LOUD || vol === 0, 'voice volume 0 (silent test)', String(vol));

// 2. status (Android TextToSpeech, Korean voice installed?)
const st = await page.eval('window.__pocha.G.speech.refresh().then(() => ({ backend: window.__pocha.G.speech.backend?.name, ...window.__pocha.G.speech.status }))');
check(st.backend === 'tauri' && st.available, 'tts_status: engine available', JSON.stringify(st));
check(st.korean, 'tts_status: Korean voice installed');

// 3. queue + tts://done + ducking: three customers at once
const r = await page.eval(`(async () => {
  const P = window.__pocha, sp = P.G.speech, t0 = performance.now(), log = [];
  const ducked = [];
  const iv = setInterval(() => ducked.push(P.G.audio.duckMul), 50);
  const said = ['김치 하나 주세요', '물', '떡볶이 둘하고 콜라 주세요'];
  await Promise.all(said.map((text, i) => sp.speak(text, { tag: i, rate: 1, onStart: () => log.push({ i, start: performance.now() - t0 }) })
    .then(() => { const e = log.find((x) => x.i === i); if (e) e.end = performance.now() - t0; })));
  await new Promise((res) => setTimeout(res, 300));
  clearInterval(iv);
  return { log, ducked: [Math.min(...ducked), ducked[ducked.length - 1]] };
})()`);
console.log(JSON.stringify(r));
const L = r.log;
check(L.length === 3 && L.every((x, k) => x.i === k), 'spoken in order');
check(L.every((x, k) => k === 0 || x.start >= L[k - 1].end + 200), 'one at a time, ~250 ms apart', L.map((x) => `${Math.round(x.start)}–${Math.round(x.end)}`).join(' '));
// a lost tts://done would only end by the 4 s safety timeout
check(L.every((x) => x.end - x.start > 150 && x.end - x.start < 3500), 'finished by tts://done (not by the timeout)');
check(r.ducked[0] === 0.4 && r.ducked[1] === 1, 'ambience ducked to 40 % while speaking, back after', JSON.stringify(r.ducked));

// 4. the plugin's own log
const lc = adb('logcat', '-d').split('\n').filter((l) => /init status=|tts/i.test(l) && /pochapop|Tauri|tts/.test(l)).slice(-4).join('\n');
console.log(lc);
check(/init status=0/.test(lc), 'logcat: TextToSpeech initialised');

page.close();
console.log(failed ? 'TTS-PHONE FAILED' : 'TTS-PHONE OK');
process.exitCode = failed ? 1 : 0;
