import Phaser from 'phaser';
export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  create() { this.add.text(10, 10, 'Result', { fontFamily: 'Galmuri11', fontSize: '12px' }); }
}
