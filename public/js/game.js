/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

function preload () {
  game.load.image('space', 'assets/starfield.jpg');
  game.load.image('fighter', 'assets/Human-Fighter.png');
  game.load.image('enemy', 'assets/Fighter.png');
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
  game.world.setBounds(-500, -500, 1000, 1000);

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'space');
  land.fixedToCamera = true;

  // The base of our player
  var startX = Math.round(Math.random() * (1000) - 500);
  var startY = Math.round(Math.random() * (1000) - 500);
  player = game.add.sprite(startX, startY, 'fighter');
  player.anchor.setTo(0.5, 0.5);

  // This will force it to decelerate and limit its speed
  // player.body.drag.setTo(200, 200)
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;

  // Create some baddies to waste :)
  enemies = [];

  player.bringToTop();

  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);

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
  console.log('Connected to socket server');

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill();
  });
  enemies = [];

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y, angle: player.angle });
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id);

  // Avoid possible duplicate players
  var duplicate = playerById(data.id);
  if (duplicate) {
    console.log('Duplicate player!');
    return;
  }

  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
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
  movePlayer.player.angle = data.angle;
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id);

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  removePlayer.player.kill();

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1);
}

function update () {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update();
      game.physics.arcade.collide(player, enemies[i].player);
    }
  }

  if (cursors.left.isDown) {
    player.angle -= 4;
  } else if (cursors.right.isDown) {
    player.angle += 4;
  }

  if (cursors.up.isDown) {
    // The speed we'll travel at
    currentSpeed = 300;
  } else {
    if (currentSpeed > 0) {
      currentSpeed -= 4;
    }
  }

  game.physics.arcade.velocityFromRotation(player.rotation - 90, currentSpeed, player.body.velocity);

  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;

  socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });
}

function render () {

}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i];
    }
  }

  return false;
}
