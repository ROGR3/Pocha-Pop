// System-keyboard (IME) input via a hidden, focused <input>.
// No on-screen keyboard of our own: the OS Korean IME composes syllables and
// we read input.value on every input/composition event (value includes the
// syllable still being composed).

export interface ImeState {
  text: string;
  composing: boolean;
}

type Listener = (s: ImeState) => void;

export const IS_ANDROID = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

/** Tap area in CSS pixels (where a tap lands directly on the input → keyboard opens). */
export interface TapArea { left: number; top: number; width: number; height: number }

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
    this.setTapArea(null);
    this.el.blur();
  }

  /**
   * Put the (invisible) input over a screen area. Android only opens the soft
   * keyboard for a real tap on an editable element, so the input itself has to
   * be under the finger – a programmatic focus() is not enough. null parks it.
   */
  setTapArea(a: TapArea | null) {
    const st = this.el.style;
    if (!a) {
      st.left = '0px'; st.top = ''; st.bottom = '0px'; st.width = '1px'; st.height = '1px';
      st.pointerEvents = 'none';
      return;
    }
    st.bottom = '';
    st.left = `${Math.round(a.left)}px`;
    st.top = `${Math.round(a.top)}px`;
    st.width = `${Math.round(a.width)}px`;
    st.height = `${Math.round(a.height)}px`;
    st.pointerEvents = 'auto';
  }

  /** Soft keyboard flavour: 'decimal' for the stall code, 'text' otherwise. */
  setInputMode(mode: 'text' | 'decimal') {
    this.el.inputMode = mode;
  }

  /** Pre-fill the field (editing an existing name). */
  setText(s: string) {
    this.el.value = s;
    this.lastText = s;
    this.notify();
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
   * Clear the field and terminate the IME composition.
   * Desktop (WebKitGTK): blur → value='' → focus resets the composition.
   * Android: no blur – it would hide the soft keyboard and a programmatic
   * focus() can't bring it back. Setting the value makes Chrome restart the
   * IME input connection. Whatever the IME re-inserts from the old word is
   * stripped (see `stale`).
   */
  clear() {
    const old = this.el.value;
    const wasFocused = this.hasFocus();
    if (wasFocused && !IS_ANDROID) this.el.blur();
    this.el.value = '';
    if (IS_ANDROID && wasFocused) { try { this.el.setSelectionRange(0, 0); } catch { /* */ } }
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
