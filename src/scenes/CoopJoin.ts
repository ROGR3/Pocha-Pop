// Join a stall: scan the host's QR (phones) or type the short code / address.
import Phaser from 'phaser';
import { PROTO, parseQr, resolveCode } from '../logic/netproto';
import { isTauri } from '../logic/save';
import { IS_ANDROID } from '../game/ime';
import { createTransport, joinSession } from '../game/net';
import { G } from '../game/state';
import { TypeBox } from '../game/typebox';
import { C, button, cssRect, fadeIn, goto, iconButton, snapText, txt } from '../game/ui';

export class CoopJoinScene extends Phaser.Scene {
  private box!: TypeBox;
  private status!: Phaser.GameObjects.Text;
  private code = '';
  private busy = false;
  private ownIp: string | null = null;
  private unsub?: () => void;
  private builtW = 0;

  constructor() { super('CoopJoin'); }

  create() {
    fadeIn(this);
    this.busy = false;
    const W = this.scale.width, H = this.scale.height;
    this.builtW = W;
    this.add.rectangle(0, 0, W, H, 0x262b44).setOrigin(0, 0);
    txt(this, W / 2, 8, 'Připojit se', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
    let y = 34;
    if (isTauri() && IS_ANDROID) {
      button(this, W / 2, y + 12, W - 48, 26, 'Naskenovat QR', () => void this.scan(), { icon: 'camera' });
      y += 36;
      txt(this, W / 2, y, 'nebo napiš kód z hostitelova displeje', { size: 'xs', color: C.grey, origin: [0.5, 0] });
      y += 14;
    } else {
      txt(this, W / 2, y, 'Napiš kód z hostitelova displeje (např. 43.1) nebo celou adresu.', { size: 's', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 24 });
      y += 30;
    }
    this.box = new TypeBox(this, 12, y, W - 24, 36, 'Klepni a napiš kód');
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.reopen());
    this.tapY = y;
    y += 44;
    button(this, W / 2, y + 10, 120, 22, 'Připojit', () => void this.connectCode(), { style: 'wood', icon: 'wifi' });
    y += 30;
    this.status = txt(this, W / 2, y, '', { size: 's', color: C.grey, origin: [0.5, 0], align: 'center', wrap: W - 24 });
    iconButton(this, 16, Math.max(y + 40, H - 16), 'back', () => this.onBack());

    G.ime.activate();
    G.ime.setInputMode('decimal');
    G.ime.setTapArea(cssRect(this, 12, this.tapY, W - 24, 36));
    this.unsub = G.ime.subscribe((s) => {
      const clean = s.text.replace(/,/g, '.').replace(/[^0-9.:]/g, '').slice(0, 21);
      if (clean !== s.text && !s.composing) G.ime.setText(clean);
      this.code = clean;
      this.box.set(clean, false);
    });
    G.ime.onKey = (e) => { if (e.key === 'Enter') void this.connectCode(); };
    void createTransport().localIps().then((ips) => { this.ownIp = ips.find((ip) => !ip.startsWith('127.')) ?? ips[0] ?? null; });
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => {
      this.unsub?.();
      G.ime.onKey = null;
      G.ime.setInputMode('text');
      G.ime.deactivate();
      this.game.events.off('layout', this.relayout, this);
    });
  }

  private tapY = 0;

  private relayout() {
    if (this.scale.width !== this.builtW) { this.scene.restart(); return; }
    G.ime.setTapArea(cssRect(this, 12, this.tapY, this.scale.width - 24, 36));
  }

  private say(s: string, color = C.grey) {
    this.status.setText(s).setColor(color);
    snapText(this.status);
  }

  private async connectCode() {
    if (this.busy) return;
    if (!this.code) { this.say('Napiš kód stánku', C.orange); return; }
    const a = resolveCode(this.code, this.ownIp);
    if (!a) {
      this.say(this.ownIp ? 'Tomu kódu nerozumím – napiš ho přesně jako na hostitelově displeji.' : 'Neznám svou adresu – napiš celou adresu (např. 192.168.43.1).', C.pink);
      return;
    }
    await this.connect(a.ip, a.port);
  }

  private async scan() {
    if (this.busy) return;
    try {
      const bs = await import('@tauri-apps/plugin-barcode-scanner');
      let perm = await bs.checkPermissions();
      if (perm !== 'granted') perm = await bs.requestPermissions();
      if (perm !== 'granted') { this.say('Bez fotoaparátu to nepůjde – napiš kód.', C.orange); return; }
      G.ime.deactivate();
      const r = await bs.scan({ windowed: false, formats: [bs.Format.QRCode] });
      G.ime.activate();
      const q = parseQr(r.content);
      if (!q) { this.say('Tohle není QR kód stánku Pocha Pop.', C.pink); return; }
      if (q.proto !== PROTO) { this.say('Jiná verze hry – aktualizuj', C.pink); return; }
      await this.connect(q.ip, q.port);
    } catch (e) {
      console.warn('scan', e);
      G.ime.activate();
      this.say('Skenování se nepovedlo – napiš kód.', C.orange);
    }
  }

  private async connect(ip: string, port: number) {
    this.busy = true;
    this.say(`Připojuji k ${ip}:${port}…`, C.light);
    try {
      await joinSession(this.game, `${ip}:${port}`);
      G.audio.play('bell');
      goto(this, 'Coop', {});
    } catch (e) {
      this.busy = false;
      this.say((e as Error).message, C.pink);
      G.audio.play('error');
    }
  }

  onBack() { goto(this, 'Coop'); }
}
