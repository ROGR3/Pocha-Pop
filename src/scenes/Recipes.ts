import Phaser from 'phaser';
export class RecipesScene extends Phaser.Scene {
  constructor() { super('Recipes'); }
  create() { this.add.text(10, 10, 'Recipes', { fontFamily: 'Galmuri11', fontSize: '12px' }); }
}
