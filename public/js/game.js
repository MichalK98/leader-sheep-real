const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  title: "Leader Sheep",
  parent: "game",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('intro', 'assets/intro.png');
  this.load.image('pipe', 'assets/pipe.png');
  this.load.spritesheet(
    'player',
    'assets/player.png',
    {frameWidth: 100, frameHeight: 84}
  );
}
  
function create() {
    this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0);
    this.add.image(0, 0, 'intro').setOrigin(0, 0);

    this.anims.create({
      key: 'player-stand',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate:
      10,
    });

    // Slide Animations
    this.anims.create({
      key: 'player-slide',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1
    });
  
    pipes = this.physics.add.staticGroup();
    pipes.create(500, -200, 'pipe');
    pipes.create(650, 600, 'pipe');
    pipes.create(700, 600, 'pipe');
    pipes.create(750, 600, 'pipe');
    pipes.create(800, 600, 'pipe');
    pipes.create(850, 600, 'pipe');
    pipes.create(900, 600, 'pipe');
    pipes.create(950, 600, 'pipe');
    pipes.create(1000, 600, 'pipe');
    pipes.create(1050, 600, 'pipe');
    pipes.create(1100, 600, 'pipe');
    pipes.create(1150, 600, 'pipe');
    pipes.create(1200, 600, 'pipe');
    pipes.create(1250, 600, 'pipe');
    pipes.create(1300, 600, 'pipe');
    pipes.create(1350, 600, 'pipe');
    pipes.create(1400, 600, 'pipe');
    pipes.create(1550, 400, 'pipe');
  
    var self = this;
    this.socket = io({
      transports: ["websocket"]
    });
    this.otherPlayers = this.physics.add.group();
  
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          addPlayer(self, players[id]);
        } else {
          addOtherPlayers(self, players[id]);
        }
      });
    });
  
    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    });
  
    this.socket.on('disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });
  
    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setRotation(playerInfo.rotation);
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
    
    // Cursors
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Camera
    let camera_width = this.cameras.main.width * Number.MAX_VALUE;
    let camera_height = this.cameras.main.height;
  
    // World size
    this.cameras.main.setBounds(0, 0, camera_width, camera_height);
    this.scene.scene.physics.world.setBounds(0, 0, camera_width, camera_height);
  }
  
  function addPlayer(self, playerInfo) {
    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player').setScale(.5);;
    self.player.setCollideWorldBounds(true);
    self.player.setBounce(.2);
  
    self.physics.add.collider(self.player, pipes);

    // Check if you are the leader
    self.socket.on('playerLeader', function (leader) {
      if (playerInfo.playerId == leader) {
        // Camera follow player
        self.cameras.main.startFollow(self.player);
      }
    });
  }
  
  function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player').setScale(.5);;
    otherPlayer.setTint(0xD5D5D5);
    // Add new enemy
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
    otherPlayer.setCollideWorldBounds(true);

    // Check if you are the leader
    self.socket.on('playerLeader', function (leader) {
      if (otherPlayer.playerId == leader) {
        // Camera follow player
        self.cameras.main.startFollow(otherPlayer);
      }
    });
  }
  
  function update() {
    if (this.player) {
      // Jump
      if (this.cursors.up.isDown) {
        if (player_jump) {
          this.player.setVelocityX(200);
          this.player.setVelocityY(-400);
          player_jump = false;
        }
      } else {
        player_jump = true;
      }
  
      // Emit player movement
      var x = this.player.x;
      var y = this.player.y;
      var r = this.player.rotation;
      
      if (this.player.oldPosition) {
        if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || r !== this.player.oldPosition.rotation)) {
          this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
        }
      }
  
      // Rotation
      if (this.player.oldPosition) {
        if (this.player.oldPosition.y > this.player.y) {
          this.player.rotation = -.1;
        } else if (this.player.oldPosition.y < this.player.y) {
          this.player.rotation = .1;
        } else {
          this.player.rotation = 0;
        }
      }

      // Local animations
      if (this.player.body.speed >= 100
          && this.player.y >= 558
          || this.player.body.speed >= 100 
          && this.player.body.touching.down
      ) {
        this.player.anims.play('player-slide', true);
      } else {
        this.player.anims.play('player-stand', true);
      }
  
      // Save old position data
      this.player.oldPosition = {
        x: this.player.x,
        y: this.player.y,
        rotation: this.player.rotation
      };
    }
  }