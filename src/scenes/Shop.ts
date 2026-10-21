import Phaser from 'phaser';
export class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }
  create() { this.add.text(10, 10, 'Shop', { fontFamily: 'Galmuri11', fontSize: '12px' }); }
}
