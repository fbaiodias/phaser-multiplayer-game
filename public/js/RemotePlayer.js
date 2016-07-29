/* global game */

var RemotePlayer = function (index, game, player, startX, startY) {
  var x = startX;
  var y = startY;

  this.game = game;
  this.health = 3;
  this.player = player;
  this.alive = true;

  var bmd = game.add.bitmapData(96, 16);
  var grd = bmd.context.createLinearGradient(0, 0, 0, 32);

  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(1, '#000000');
  bmd.context.fillStyle = grd;
  bmd.context.fillRect(0, 0, 96, 16);
  game.cache.addBitmapData('grey', bmd);


  const red = 15;

  this.player = game.add.sprite(game.world.centerX, red, game.cache.getBitmapData('grey'));

  this.player.anchor.setTo(0.5);

  this.player.name = index.toString();
  game.physics.enable(this.player, Phaser.Physics.ARCADE);
  this.player.body.immovable = true;
  this.player.body.collideWorldBounds = true;
  //
  // this.player.angle = game.rnd.angle();

  this.lastPosition = { x: x, y: y };
  console.log('this player ?');
  console.log(this.player);
}

RemotePlayer.prototype.update = function () {
  // if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y) {
  //   this.player.play('move');
  //   this.player.rotation = Math.PI + game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y)
  // } else {
  //   this.player.play('stop');
  // }

  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
}

window.RemotePlayer = RemotePlayer
