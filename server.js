var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')({
  transports: ["websocket"]
}).listen(server);

var players = {};
var current_leader;

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
  };

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
    
    const leader = Object.keys(players).reduce((acc, cur) => {
      const obj = players[cur];
      return acc.x < obj.x ? { x:obj.x, leader: obj.playerId } : acc;
    }, { x: 0, leader: "" });

    if (current_leader != leader.leader) {
      // emit to everyone who the new leader is
      socket.emit('playerLeader', leader.leader);
      socket.broadcast.emit('playerLeader', leader.leader);
    }

    current_leader = leader.leader;
  });
});

server.listen(8081, function () {
  console.log(`http://localhost:${server.address().port}`);
});
