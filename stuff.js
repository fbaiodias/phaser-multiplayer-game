 global Phaser RemotePlayer io 

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload preload, create create, update update, render render })
var speed = 5

function preload () {
  game.load.image('earth', 'assetsscorched_earth.png')
  game.load.spritesheet('dude', 'assetsguy.png', 329, 300)
}

var socket  Socket connection

var land

var player

var enemies

var hits

var currentSpeed = 0

var cursors;

function create () {
  socket = io.connect()

   Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-500, -500, 1000, 1000)

   Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth')
  land.fixedToCamera = true

   The base of our player
  var startX = Math.round(Math.random()  (1000) - 500)
  var startY = Math.round(Math.random()  (1000) - 500)
  player = game.add.sprite(startX, startY, 'dude')
  player.anchor.setTo(0.5, 0.5)
  
  player.animations.add('move-right', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
  player.animations.add('move-up', [8, 9, 10, 11, 12, 13, 14, 15], 20, true)
  player.animations.add('move-left', [56, 57, 58, 59, 60, 61, 62, 63], 20, true)
  player.animations.add('move-down', [32, 33, 34, 35, 36, 37, 38, 39], 20, true)
  player.animations.add('move-up-right', [16, 17, 18, 19, 20, 21, 22, 23], 20, true)
  player.animations.add('move-up-left', [24, 25, 26, 27, 28, 29, 30, 31], 20, true)
  player.animations.add('move-down-left', [48, 49, 50, 51, 52, 53, 54, 55], 20, true)
  player.animations.add('move-down-right', [40, 41, 42, 43, 44, 45, 46, 47], 20, true)
  player.animations.add('stop-moving', [3], 20, true)

   This will force it to decelerate and limit its speed
   player.body.drag.setTo(200, 200)
  game.physics.enable(player, Phaser.Physics.ARCADE);
   player.body.maxVelocity.setTo(300, 300)
  player.body.collideWorldBounds = true
  
   Create some baddies to waste )
  enemies = []
  hits = []

  player.bringToTop()

  game.camera.follow(player)
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
  game.camera.focusOnXY(0, 0)

  cursors = {
  w: game.input.keyboard.addKey(Phaser.Keyboard.W),
  a: game.input.keyboard.addKey(Phaser.Keyboard.A),
  s: game.input.keyboard.addKey(Phaser.Keyboard.S),
  d: game.input.keyboard.addKey(Phaser.Keyboard.D)
}

   Start listening for events
  setEventHandlers()
}

var setEventHandlers = function () {
   Socket connection successful
  socket.on('connect', onSocketConnected)

   Socket disconnection
  socket.on('disconnect', onSocketDisconnect)

   New player message received
  socket.on('new player', onNewPlayer)

   Player move message received
  socket.on('move player', onMovePlayer)

   Player removed message received
  socket.on('remove player', onRemovePlayer)
}

 Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

   Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill()
  })
  
  enemies = [];
  hits = [];

   Send local player data to the game server
  socket.emit('new player', { x player.x, y player.y })
}

 Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

 New player
function onNewPlayer (data) {
  console.log('New player connected', data.id)

   Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }

   Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y))
}

 Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

   Player not found
  if (!movePlayer) {
    console.log('Player not found ', data.id)
    return
  }

   Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
}

 Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

   Player not found
  if (!removePlayer) {
    console.log('Player not found ', data.id)
    return
  }

  removePlayer.player.kill()

   Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update () {
  for (var i = 0; i  enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
       game.physics.arcade.collide(player, enemies[i].player)
    }
  }

  

  if (cursors.a.isDown) {
    player.body.x -= speed;
    player.animations.play('move-left');
  }
  
  else if (cursors.d.isDown) {
    player.body.x += speed;	
    player.animations.play('move-right');
  }

  if (cursors.w.isDown) {
    player.body.y -= speed;	
    player.animations.play('move-up');
  }
  else if (cursors.s.isDown) {
    player.body.y += speed;	
    player.animations.play('move-down');
  }
  else if (cursors.z.isDown) {
    console.log(player.x, player.y)
    hits.push([player.x, player.y])
    console.log(hits)
    player.animations.play('move-down');
  }
  
 
  
    player.rotation = game.physics.arcade.angleToPointer(player);
   if (currentSpeed  0) {
     player.animations.play('move')
   } else {
     player.animations.play('stop')
   }
  
  if (game.input.activePointer.isDown)
    {
          Boom!
         player.animations.play('attack')
    }
    
      player.rotation = game.physics.arcade.angleToPointer(player)


  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y



  /* if (game.input.activePointer.isDown) {
     if (game.physics.arcade.distanceToPointer(player) = 10) {
       currentSpeed = 300

       player.rotation = game.physics.arcade.angleToPointer(player)
     }
   }*/

  socket.emit('move player', { x player.x, y player.y })  Tells the server player's new location
  
}

function render () {

}

 Find player by ID
function playerById (id) {
  for (var i = 0; i  enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }

  return false
}