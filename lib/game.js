const util = require('util');
const http = require('http');
const path = require('path');
const ecstatic = require('ecstatic');
const io = require('socket.io');

const Player = require('./Player');

const port = process.env.PORT || 3000;

const teams = {
  blu: null,
  red: null
};

let socket;
let players;


const server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err;
  }

  init();
})

function init () {
  players = [];
  socket = io.listen(server);

  setEventHandlers();
}

const setEventHandlers = () => {
  socket.sockets.on('connection', onSocketConnection);
}

function updateTeams(id) {
  if (!teams.blu) {
    teams.blu = id;
    return 'blu';
  } else if (!teams.red) {
    teams.red = id;
    return 'red';
  }
}

// New socket connection
function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id)

  // updateTeams(client.id);

  console.log('socket connected: ');
  console.log('teams: ');
  console.log(teams);

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  // Listen for move player message
  client.on('move player', onMovePlayer)
}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  const removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return;
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)
  // Broadcast removed player to connected socket clients

  if (teams.blu === this.id) teams.blu = null;
  if (teams.red === this.id) teams.red = null;

  console.log('client disconnected. teams now: ');
  console.log(teams);

  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  console.log('new player joined?');
  const team = updateTeams(this.id);
  const newPlayer = new Player(data.x, data.y, team);
  newPlayer.id = this.id;

  let playerTeam = null;

  console.log('called updateTeams');
  console.log('team is  >? ' + team);
  const newPlayerData = {
    team,
    id: newPlayer.id,
    x: newPlayer.getX(),
    y: newPlayer.getY()
  };

  console.log('added new player on team ~' + newPlayerData.team + '~ with id ' + newPlayerData.id);

  console.log('teams');
  console.log(teams);

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', newPlayerData);

  // Send existing players to the new player
  let existingPlayer;
  for (let i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()})
  }

  // Add new player to the players array
  players.push(newPlayer)
}

// Player has moved
function onMovePlayer (data) {
  // Find player in array
  const movePlayer = playerById(this.id);

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id);
    return;
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {
    id: movePlayer.id,
    x: movePlayer.getX(),
    y: movePlayer.getY()
  });
}

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID
function playerById (id) {
  for (let i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i];
    }
  }

  return false;
}
