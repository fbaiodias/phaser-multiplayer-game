/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('earth', 'assets/light_sand.png');
  game.load.spritesheet('dude', 'assets/dude.png', 64, 64);
  game.load.spritesheet('enemy', 'assets/dude.png', 64, 64);
}

var socket; // Socket connection
var land;
var player;
var enemies;
var currentSpeed = 0;
var cursors;

function create () {
  socket = io.connect();

  // Resize our game world to be a 2000 x 2000 square
  // game.world.setBounds(-500, -500, 1000, 1000)
  // game.world.setBounds(0, 0, 400, 800);

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth');
  land.fixedToCamera = true;


  var bmd = game.add.bitmapData(96, 16);
  var grd = bmd.context.createLinearGradient(0, 0, 0, 32);

  grd.addColorStop(0, '#8ED6FF');
  grd.addColorStop(1, '#004CB3');
  bmd.context.fillStyle = grd;
  bmd.context.fillRect(0, 0, 96, 16);
  game.cache.addBitmapData('blueShade', bmd);

  const red = game.world.height - 15;
  const blu = 15;

  player = game.add.sprite(game.world.centerX, game.world.height - 15, game.cache.getBitmapData('blueShade'));

  //game.add.sprite(startX, startY, 'dude');
  player.anchor.setTo(0.5, 0.5);
  // player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  // player.animations.add('stop', [3], 20, true);

  // This will force it to decelerate and limit its speed
  // player.body.drag.setTo(200, 200)
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;

  // Create some baddies to waste :)
  enemies = [];

  player.bringToTop();

  // game.camera.follow(player)
  // game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
  // game.camera.focusOnXY(0, 0)

  cursors = game.input.keyboard.createCursorKeys();

  // Start listening for events
  setEventHandlers();
}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected);

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect);

  // New player message received
  socket.on('new player', onNewPlayer);

  // Player move message received
  socket.on('move player', onMovePlayer);

  // Player removed message received
  socket.on('remove player', onRemovePlayer);
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill();
  })
  enemies = [];

  console.log('socketconnected in GAME.JS');
  console.log(player);

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y });
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id);

  console.log('creating new remote player.......');

  // Avoid possible duplicate players
  var duplicate = playerById(data.id);
  if (duplicate) {
    console.log('Duplicate player!')
    return;
  }

  console.log('new remote player ? ');
  console.log(data);

  const y = data.team === 'red' ? 15: game.world.height - 15;

  // Add new player to the remote players array

  console.log('put enemy at y ' + y );
  enemies.push(new RemotePlayer(data.id, game, player, data.x, y));
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id);

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  // Update player position
  movePlayer.player.x = data.x;
  movePlayer.player.y = data.y;
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id);

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  removePlayer.player.kill()

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update () {
  // for (var i = 0; i < enemies.length; i++) {
  //   if (enemies[i].alive) {
  //     enemies[i].update()
  //     game.physics.arcade.collide(player, enemies[i].player)
  //   }
  // }

  // game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y

  if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
    player.x -= 4;
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
    player.x += 4;
  }

  socket.emit('move player', { x: player.x, y: player.y })
}

function render () {

}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }

  return false
}
