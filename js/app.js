/***** Biplanes Game
 ***** By Andy Ballard
 *****
 *****
 */
/* Blue plane: #2889e4, #1f7bd1, wing: #215fab
  Red Plane:   #db2937, #b41a28, wing: #930913 */
/*****************************************************************/
var PLAYER=1, ENEMY=2;
/******** GAME CALIBRATION VARIABLES ********/
var STALL_SPEED = 160; /* the speed a plane will engine stall at  */
var PITCH_POWER = 215; /* The addition or loss of speed from going up or down */
var PITCH_LERP = 0.02; /* The speed the up or down of the plane can change the speed */
var MAX_ENGINE_SPEED = 310; /* the Pitch can add more speed on though */
var TURN_SPEED = 5; /* speed the plane rotates at */
var ACCELERATE_SPEED = 3; /* speed the planes get upto full speed when pressing accelerator button */
var BULLET_SPEED = 750; /* speed the bullets travel (pixel/s) */
var SHOOT_SPEED = 300; /* reload gun speed (ms) */
var CRASH_SPEED = 0.9; /* Max Y speed when touching ground for safe landing, any faster then crash */

/**********************************************************/
var LEFT=1, RIGHT=2;
var GAME=1, WIN=2, LOOSE=3, TITLE_SCREEN=4; /* Game modes, this.gameMode values */
/**********************************************************/
var game = new Phaser.Game(1280, 720, Phaser.CANVAS,'game');
var myGame;
var learning = new Learning();

var playState = {
  preload: function() {
    myGame = this;
    this.count=0;
    /* use the whole window up */
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    /* if the full screen button is pressed, use this scale mode: */
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    game.load.spritesheet('plane', 'img/biplane.png', 100, 100);
    game.load.image("background", "img/background720h.png");
    game.load.image("ground", "img/ground.png");
    game.load.image("tower", "img/tower.png");
    game.load.spritesheet("bullets", "img/bullet15wh.png", 15,15);
    game.load.spritesheet("boom", "img/explosion96wh.png", 96,96);

    game.load.image("titlebacking", "img/titlebacking.png");
    game.load.spritesheet("buttons", "img/buttons103w47h.png", 103,47);
    game.load.image("instructions", "img/instructions.png");

  },
  /**********  Create Function  ************************************************/
  /*****************************************************************************/
  create: function() {
    game.time.advancedTiming = true;

    this.updateSignal = new Phaser.Signal();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 100;
    game.scale.onSizeChange.add(this.onSizeChange, this);

    game.stage.backgroundColor = '#050505';

    game.add.tileSprite(0,0, 1280, 720, 'background');
    game.world.setBounds(-5,-5, game.width+10,game.height+10);

    this.decorations = game.add.group(); /* non-hitable sprites for decoration */
    this.groundDecor = new Decorations(0,670, 'ground', this.decorations);    

    this.items = game.add.group(); /* hitable game objects, like ground */
    this.ground = new Items(0,690, 'ground', this.items, /*invisible*/true);    
    this.tower = new Items(600,549, 'tower', this.items, /*invisible*/false, /*scale*/0.75);    
    this.tower.body.setSize(60,184-33, 20,33);
    
    this.bullets = new Bullets(game.world);

    this.planesGroup = game.add.group();
    this.player = new Player(1210, 676/*665*/, LEFT, /*sprite color*/0);
    this.enemy = new Enemy(50, 676, RIGHT, /*sprite color*/2);

    this.explosions = new Explosions(game.world);

    this.clouds = new Clouds(game.world);
    this.clouds.gameClouds( 3, 1);
    this.clouds.gameClouds( 3, 2);

    this.fullScreenButton=game.add.button(3,-8, 'buttons', this.fullScreenButtonPress, this,6,6,6);    
    this.scoreboard= new Scoreboard( this.enemy, this.player, game.world );

    /**** Register our keyboard buttons ***/
    this.cursors = game.input.keyboard.createCursorKeys();
    this.spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    //this.bulletTime=0; /* timer to limit shooting reload speed */
    this.gameMode=GAME;

    learning.create();

  },

  /**********  Update Function  ************************************************/
  /*****************************************************************************/
  update: function() {
    this.count++;
    /* Fade in from Black at start of Game */
    if (this.count==1) game.camera.flash(0x000000, 600, true);
    if (this.count==150) {
      this.enemy.ai.startAI();
      console.log("starting AI");
    }

    if (this.gameMode==GAME) {
      if (this.cursors.up.isDown) {
        this.player.plane.accelerate(ACCELERATE_SPEED);
      }
      else if (this.cursors.down.isDown) {
        this.player.plane.decelerate(ACCELERATE_SPEED);
      }
      if (this.cursors.left.isDown) {
        this.player.plane.rotate(-TURN_SPEED);
      }
      else if (this.cursors.right.isDown) {
        this.player.plane.rotate(+TURN_SPEED);
      }
      if (this.spacebar.isDown) {
        this.fireButtonClick();
      }
    }
    /* anyone else whos got stuff to run on the Update cycle */
    this.updateSignal.dispatch(this.count);

    game.physics.arcade.collide(this.planesGroup, this.bullets, this.planeToBulletHandler, null, this);

    game.physics.arcade.collide(this.planesGroup, this.items, this.planeToItemHandler, null, this);
    
    game.physics.arcade.collide(this.bullets, this.items, this.bulletstoItemsHandler, null, this);

  },

  render: function() {
    //var speed = vectorToPower(this.player.plane.body.velocity);
    //game.debug.text(game.time.fps+"fps "
    //+ "Scrn "+game.scale.width.toFixed(0)+","+game.scale.height.toFixed(0)
    //+" cam "+game.camera.x+","+game.camera.y
    //+" plane "+this.player.plane.x.toFixed(0)+","+this.player.plane.y.toFixed(0)
    //+" pitchSpeed "+this.player.plane.pitchSpeed.toFixed(0)
    //+" velocity "+speed.toFixed(0)
    //+" speed "+this.player.plane.body.speed.toFixed(0)
    //, 150, 14, "#00ff00");
    //game.debug.body(this.player.plane);
    //game.debug.body(this.enemy.plane);
    //game.debug.body(this.tower);
  },

  fireButtonClick: function() {
    var plane = this.player.plane;
    if (/*game.time.now > this.bulletTime  && */
       plane.alive && plane.flying) {
      plane.shoot(plane.x, plane.y, plane.angle, PLAYER);
      //this.bulletTime = game.time.now + SHOOT_SPEED;
    }
  },
  planeToBulletHandler: function(plane, bullet) {
    plane.planeToBulletHandler(bullet);
  },
  planeToItemHandler: function(plane, item) {
    plane.hitGround(item);
  },
  bulletstoItemsHandler: function(bullet, item) {
    bullet.kill();
  },
  onSizeChange: function() {
    if (this.touchControl) {
      this.touchControl.onSizeChange();
    }

    if (this.highScoreText)
      this.highScoreText.setTextBounds(0,game.height*0.78, game.width,game.height*0.10);
  },
  endGame: function(result) { /* when someone reaches 10 points, triggers the end screen */
    if (this.enemy) this.enemy.ai.stopAI();
    this.gameMode = result /* WIN or LOOSE */
    if (result==WIN) this.player.victoryRoll();
    if (result==LOOSE) this.enemy.victoryRoll();

    game.time.events.add(1700, function() {
      this.titlePage = new TitlePage(game.world, this.gameMode, myGame);
    }, this);

  },
  closeGame: function( toGameMode ) { /* Fade to black and end this game screen */
    game.camera.fade(0x000000, 300);  /* fade to black */
    game.time.events.add(500, function() {
      if (toGameMode == GAME) {
        game.state.restart(); /* destroys and respawns a new Game object */
      }else if (toGameMode == TITLE_SCREEN) {
        game.state.start('menu');
      }
    }, this);
  },
  shutdown: function() {
    /* delete all the things! */
    this.count=0;
    this.gameMode=0;
  },
  fullScreenButtonPress: function() {
    if (game.scale.isFullScreen)
      game.scale.stopFullScreen();
    else
      game.scale.startFullScreen(false);
  }
};


/**************** Add the States and start ************************************/
game.state.add('play', playState);
game.state.add('menu', menuState);

game.device.whenReady(function() {
  game.state.start('menu');
});


/****** OO ******/
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {
        }
        F.prototype = o;
        return new F();
    };
}
function inheritPrototype(childObject, parentObject) {
    var copyOfParent = Object.create(parentObject.prototype);
    copyOfParent.constructor = childObject;
    childObject.prototype = copyOfParent;
}

