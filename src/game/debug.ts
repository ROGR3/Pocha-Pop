// Dev/test helper: emulate a 두벌식 IME typing into the hidden input, producing
// the same intermediate states a real IME shows (ㅎ → 하 → 한 → 하나).
import { composeSyllable, splitSyllable } from '../logic/hangul';
import { G } from './state';

const FINAL_OK = new Set(['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']);

export function imeStates(text: string): string[] {
  const out: string[] = [];
  let done = '';
  const chars = [...text];
  chars.forEach((ch, k) => {
    const s = splitSyllable(ch);
    if (!s) { done += ch; out.push(done); return; }
    const prevCh = [...done].pop();
    const prev = prevCh ? splitSyllable(prevCh) : null;
    if (prev && !prev.final && FINAL_OK.has(s.initial) && k > 0) {
      out.push(done.slice(0, -1) + composeSyllable(prev.initial, prev.medial, s.initial));
    } else out.push(done + s.initial);
    out.push(done + composeSyllable(s.initial, s.medial));
    if (s.final) out.push(done + ch);
    done += ch;
  });
  return out;
}

export async function typeKorean(text: string, delay = 70) {
  const el = G.ime.el;
  el.focus();
  el.dispatchEvent(new CompositionEvent('compositionstart', { data: '' }));
  for (const st of imeStates(text)) {
    el.value = st;
    el.dispatchEvent(new CompositionEvent('compositionupdate', { data: st.slice(-1) }));
    el.dispatchEvent(new InputEvent('input', { data: st.slice(-1), inputType: 'insertCompositionText' }));
    await new Promise((r) => setTimeout(r, delay));
  }
  el.dispatchEvent(new CompositionEvent('compositionend', { data: text.slice(-1) }));
}
