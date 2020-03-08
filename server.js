var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')({
  transports: ["websocket"]
}).listen(server);

var players = {};
var current_leader;
var current_leader_x;

var pipes = {};

const pipe_height = 600;
const pipe_marginal = 50;
const pipe_gap = 100;

const pipe_min = -300 + pipe_marginal;
const pipe_max =  200 + pipe_marginal - pipe_gap;

for(let i = 1; i < 10; i++) {
  pipe_random = Math.random() * (pipe_max - pipe_min) + pipe_min;

  pipes[i] = {
    top: {
      x: i * 500,
      y: pipe_random
    },
    bot: {
      x: i * 500,
      y: pipe_random + pipe_height + pipe_gap
    }
  };
}

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 20,
    x: Math.floor(Math.random() * 300) + 100,
    y: 400,
    playerId: socket.id,
  };

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // camera follow
  socket.emit('playerLeader', current_leader);

  // pipes
  socket.emit('pipes', pipes);

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

    if (current_leader_x) {
      // console.log(current_leader_x);
    }

    current_leader = leader.leader;
    current_leader_x = leader.x;
  });
});

server.listen(8081, function () {
  console.log(`http://localhost:${server.address().port}`);
});
