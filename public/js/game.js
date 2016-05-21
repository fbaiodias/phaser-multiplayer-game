/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

function preload () {
  game.load.image('earth', 'assets/light_sand.png');
  game.load.spritesheet('guy', 'assets/guygun.png', 150, 95);
  game.load.spritesheet('enemy', 'assets/guygun.png', 0, 0);
  game.load.image('bullet', 'assets/bullet.jpg');
  
}

var socket; // Socket connection

var land;

var player;

var enemies;

var currentSpeed = 0;

var speed = 5;

var cursors;

var bullets;

var fireRate = 100;
var nextFire = 0;

function create () {
  socket = io.connect();

  // Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-500, -500, 1000, 1000);

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth');
  land.fixedToCamera = true;

  // The base of our player
  var startX = Math.round(Math.random() * (1000) - 500);
  var startY = Math.round(Math.random() * (1000) - 500);
  
  player = game.add.sprite(startX, startY, 'guy');
  
  player.anchor.setTo(0.5, 0.5);
  player.animations.add('move', [0], 20, false);
  player.animations.add('attack', [1, 2, 3], 20, false);

  // This will force it to decelerate and limit its speed
  // player.body.drag.setTo(200, 200)
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400);
  player.body.collideWorldBounds = true;

  // Create some baddies to waste :)
  enemies = [];
  
cursors = {
  w: game.input.keyboard.addKey(Phaser.Keyboard.W),
  a: game.input.keyboard.addKey(Phaser.Keyboard.A),
  s: game.input.keyboard.addKey(Phaser.Keyboard.S),
  d: game.input.keyboard.addKey(Phaser.Keyboard.D),
};

  player.bringToTop();

  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
  game.camera.focusOnXY(0, 0);

/* cursors = game.input.keyboard.createCursorKeys() Default up down right left controls */

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
};

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server');

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill();
  });
  enemies = [];

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

  // Avoid possible duplicate players
  var duplicate = playerById(data.id);
  if (duplicate) {
    console.log('Duplicate player!');
    return;
  }

  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y));
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

 if (cursors.a.isDown) {
  if (game.input.activePointer.isDown) {
    player.body.x -= speed;
    player.animations.play('attack');
  }
  else {
    player.body.x -= speed;
    player.animations.play('move');
  }
  }
  
  else if (cursors.d.isDown) {
    if (game.input.activePointer.isDown) {
    player.body.x += speed;
    player.animations.play('attack');
    }
    else {
    player.body.x += speed;
    player.animations.play('move');
  }
  }

  if (cursors.w.isDown) {
    if (game.input.activePointer.isDown) {
    player.body.y -= speed;
    player.animations.play('attack');
    }
    else {
    player.body.y -= speed;
    player.animations.play('move');
  }
  }
  else if (cursors.s.isDown) {
    if (game.input.activePointer.isDown) {
    player.body.y += speed;
    player.animations.play('attack');
    }
    else {
    player.body.y += speed;
    player.animations.play('move');    
  }
  }
  else if (game.input.activePointer.isDown) {
    player.animations.play('attack');
    }


// if (cursors.up.isDown) {
//   if (game.input.activePointer.isDown) {
//     game.physics.arcade.moveToPointer(player)
//     player.animations.play('attack');
//   }
//   else {
//     game.physics.arcade.moveToPointer(player)
//     player.animations.play('move');
//   }
//   }
  
//   else if (cursors.down.isDown) {
//     if (game.input.activePointer.isDown) {
//     game.physics.arcade.moveToPointer(player)
//     player.animations.play('attack');
//     }
//     else {
//     player.body.x += speed;
//     player.animations.play('move');
//   }
//   }

//   if (cursors.w.isDown) {
//     if (game.input.activePointer.isDown) {
//     player.body.y -= speed;
//     player.animations.play('attack');
//     }
//     else {
//     player.body.y -= speed;
//     player.animations.play('move');
//   }
//   }
//   else if (cursors.s.isDown) {
//     if (game.input.activePointer.isDown) {
//     player.body.y += speed;
//     player.animations.play('attack');
//     }
//     else {
//     player.body.y += speed;
//     player.animations.play('move');    
//   }
//   }
//   else if (game.input.activePointer.isDown) {
//     player.animations.play('attack');
//     }






  player.rotation = game.physics.arcade.angleToPointer(player);
  // player.movement = game.physics.arcade.moveToPointer(player)
  game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity);


  land.tilePosition.x = -game.camera.x;
  land.tilePosition.y = -game.camera.y;

  socket.emit('move player', { x: player.x, y: player.y });
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
