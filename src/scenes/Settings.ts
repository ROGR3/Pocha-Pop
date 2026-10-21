import Phaser from 'phaser';
export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create() { this.add.text(10, 10, 'Settings', { fontFamily: 'Galmuri11', fontSize: '12px' }); }
}
