// System-keyboard (IME) input via a hidden, focused <input>.
// No on-screen keyboard of our own: the OS Korean IME composes syllables and
// we read input.value on every input/composition event (value includes the
// syllable still being composed).

export interface ImeState {
  text: string;
  composing: boolean;
}

type Listener = (s: ImeState) => void;

export class Ime {
  readonly el: HTMLInputElement;
  private listeners = new Set<Listener>();
  private composing = false;
  private active = false;
  /** Text that belongs to an already finished word; stripped if the IME re-inserts it. */
  private stale = '';
  private lastText = '';
  onKey: ((e: KeyboardEvent) => void) | null = null;

  constructor(el: HTMLInputElement) {
    this.el = el;
    const update = () => this.emit();
    el.addEventListener('input', update);
    el.addEventListener('compositionstart', () => { this.composing = true; this.emit(); });
    el.addEventListener('compositionupdate', () => { this.composing = true; queueMicrotask(update); });
    el.addEventListener('compositionend', () => { this.composing = false; queueMicrotask(update); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') e.preventDefault();
      this.onKey?.(e);
    });
    el.addEventListener('blur', () => {
      if (this.active) setTimeout(() => this.active && this.focus(), 0);
    });
    // refocus on any tap/click while typing is active
    const refocus = () => { if (this.active) this.focus(); };
    document.addEventListener('pointerup', refocus, true);
    document.addEventListener('touchend', refocus, true);
  }

  get state(): ImeState {
    return { text: this.lastText, composing: this.composing };
  }

  get isActive() { return this.active; }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Enable typing (focus + keyboard). */
  activate() {
    this.active = true;
    this.clear();
    this.focus();
  }

  deactivate() {
    this.active = false;
    this.clear();
    this.el.blur();
  }

  focus() {
    if (document.activeElement !== this.el) {
      try { this.el.focus({ preventScroll: true }); } catch { this.el.focus(); }
    }
  }

  hasFocus() { return document.activeElement === this.el; }

  /**
   * Show the soft keyboard again (Android hides it on Back while the input
   * keeps focus – a plain focus() is then a no-op). Must run in a user gesture.
   */
  reopen() {
    if (!this.active) return;
    if (this.hasFocus()) this.el.blur();
    try { this.el.focus({ preventScroll: true }); } catch { this.el.focus(); }
  }

  /**
   * Clear the field and terminate the IME composition. Blur → value='' →
   * focus resets the composition on Android/WebKitGTK; otherwise the IME
   * would put the rest of the syllable back. Whatever the IME re-inserts
   * from the old word is stripped (see `stale`).
   */
  clear() {
    const old = this.el.value;
    const wasFocused = this.hasFocus();
    if (wasFocused) this.el.blur();
    this.el.value = '';
    this.composing = false;
    this.stale = old;
    this.lastText = '';
    if (wasFocused || this.active) this.focus();
    // drop the stale guard shortly after; a real new word never starts with it
    setTimeout(() => { this.stale = ''; }, 250);
    requestAnimationFrame(() => {
      if (this.stale && this.el.value && this.stale.endsWith(this.el.value)) this.el.value = '';
    });
    this.notify();
  }

  private emit() {
    let v = this.el.value;
    if (this.stale && v) {
      if (this.stale.endsWith(v)) {
        // IME put (part of) the finished word back – drop it
        v = '';
        this.el.value = '';
      } else if (v.startsWith(this.stale)) {
        v = v.slice(this.stale.length);
        this.el.value = v;
      }
    }
    if (v === this.lastText) { this.notify(); return; }
    this.lastText = v;
    this.notify();
  }

  private notify() {
    const s = this.state;
    this.listeners.forEach((l) => l(s));
  }
}
