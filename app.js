/*****Biplanes Game
 ***** By Andy Ballard
 *****
 *****
 */

/*****************************************************************/
var PLAYER=1, ENEMY=2;
/* CALIBRATING VARIABLES */
var STALL_SPEED = 160; /* the speed a plane will engine stall at  */
var PITCH_POWER = 215; /* The addition or loss of speed from going up or down */
var PITCH_LERP = 0.02; /* The speed the up or down of the plane can change the speed */
var MAX_ENGINE_SPEED = 310; /* the Pitch can add more speed on though */
var TURN_SPEED = 5; /* speed the plane rotates at */
var ACCELERATE_SPEED = 3; /* speed the planes get upto full speed when pressing accelerator button */
var BULLET_SPEED = 850; /* speed the bullets travel */
var SHOOT_SPEED = 350; /* reload gun speed */

/**********************************************************/
var LEFT=1, RIGHT=2;
/**********************************************************/
var game = new Phaser.Game(1280, 720, Phaser.CANVAS,'game');
var myGame;

var highScore=0;

var playState = {
  preload: function() {
    myGame = this;
    this.count=0;
    /* use the whole window up */
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    /* if the full screen button is pressed, use this scale mode: */
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    game.load.spritesheet('plane', 'img/biplane.png', 100, 100);
    game.load.image("background", "img/background.png");
    game.load.image("ground", "img/ground.png");
    game.load.spritesheet("bullets", "img/bullet15wh.png", 15,15);
    game.load.spritesheet("boom", "img/explosion96wh.png", 96,96);
    game.load.image("fullscreenbutton", "img/fullscreenbutton.png");

  },
  /**********  Create Function  ************************************************/
  /*****************************************************************************/
  create: function() {
    this.updateSignal = new Phaser.Signal();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 100;
    game.scale.onSizeChange.add(this.onSizeChange, this);

    game.stage.backgroundColor = '#050505';

    game.add.tileSprite(0,0, 1280, 720, 'background');
    game.world.setBounds(-5,-5, game.width+10,game.height+10);

    this.items = game.add.group(); /* hitable game objects, like ground */
    this.ground = new Items(0,690, 'ground', this.items, /*invisible*/true);    

    this.decorations = game.add.group(); /* non-hitable sprites for decoration */
    this.groundDecor = new Decorations(0,670, 'ground', this.decorations);    
    
    this.bullets = new Bullets(game.world);

    this.player = new Plane(1210, 665, LEFT);

    this.explosions = new Explosions(game.world);

    this.fullScreenButton = game.add.button(0,20, 'fullscreenbutton', this.fullScreenButtonPress, this,0,0,0);    
    /**** Register our keyboard buttons ***/
    this.cursors = game.input.keyboard.createCursorKeys();
    this.spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.bulletTime=0; /* timer to limit shooting reload speed */


  },
  /**********  Start Function  ************************************************/
  /*****************************************************************************/
  start: function() {

    this.isStarted = true;

    this.enemys = new Enemys(game.world, /*count*/50);

    /*** Register Touch screen event handlers found in touchcontrols.js ***/
    //game.input.onDown.add(pointerOnDown, this);
    //game.input.onUp.add(pointerOnUp, this);

    /* Our touch controls handler. Pick which one to use here! */
    //this.touchControl = new TouchControl1( this.player ); /* flick the screen controls */
    if (!game.device.desktop) {
      this.touchControl = new TouchControl2( this.player, this ); /* joystick */
    }
    /* start camera on the player */
    game.camera.x = this.player.x-(game.width/2); game.camera.y = this.player.y-(game.height/2);
    /* camera to loosely follow the player */
    game.camera.follow(this.player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1/*lerp*/);
  },

  /**********  Update Function  ************************************************/
  /*****************************************************************************/
  update: function() {
    //if (this.isStarted) {
      this.count++;
      /* Fade in from Black at start of Game */
      if (this.count==1) game.camera.flash(0x000000, 600, true);

      if (this.cursors.up.isDown) {
        this.player.accelerate(ACCELERATE_SPEED);
      }
      else if (this.cursors.down.isDown) {
        this.player.decelerate(ACCELERATE_SPEED);
      }
      if (this.cursors.left.isDown) {
        this.player.rotate(-TURN_SPEED);
      }
      else if (this.cursors.right.isDown) {
        this.player.rotate(+TURN_SPEED);
      }
      if (this.spacebar.isDown) {
        this.fireButtonClick();
      }

      //this.player.update();
      /* anyone else whos got stuff to run on the Update cycle */
      this.updateSignal.dispatch(this.count);

      game.physics.arcade.collide(this.player, this.bullets, this.playerToBulletHandler, null, this);

      game.physics.arcade.collide(this.player, this.items, this.playerToItemHandler, null, this);
      
    //}

  },

  render: function() {
    var speed = vectorToPower(this.player.body.velocity);
    game.debug.text("Scrn "+game.scale.width.toFixed(0)+","+game.scale.height.toFixed(0)
    +" cam "+game.camera.x+","+game.camera.y
    +" pitchSpeed "+this.player.pitchSpeed.toFixed(0)
    +" speed "+speed.toFixed(0)
    , 2, 14, "#00ff00");
  },

  fireButtonClick: function() {
    if (game.time.now > this.bulletTime) {
      this.bullets.playerShoot(this.player.x, this.player.y, this.player.angle);
      this.bulletTime = game.time.now + SHOOT_SPEED;
    }
  },
  playerToBulletHandler: function(plane, bullet) {
  },
  playerToItemHandler: function(plane, item) {
    plane.hitGround(item);
  },

  onSizeChange: function() {
    if (this.touchControl) {
      this.touchControl.onSizeChange();
    }

    if (this.highScoreText)
      this.highScoreText.setTextBounds(0,game.height*0.78, game.width,game.height*0.10);
  },
  restartGame: function() {
    game.camera.fade(0x000000, 300);  /* fade to black */
    game.time.events.add(500, function() {
      /* destroys and respawns a new Game object */
      game.state.restart();
    }, this);
  },
  shutdown: function() {
    /* delete all the things! */
    if (this.touchControl){
      if (this.touchControl.stick) this.touchControl.stick.destroy();
      if (this.touchControl.buttonA) this.touchControl.buttonA.destroy();
      this.touchControl=null;
      this.count=0;
    }
    this.isStarted=false;
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

game.device.whenReady(function() {
  game.state.start('play');
});

/************** VECTOR LIBRARY STUFF *********************************************/
function newVector( power, angle ){
  var vec = new Phaser.Point(0,-1 * power);
  vec = vec.rotate(0,0, angle, true);
  return vec;
}
/* convert an angle (degrees) into a vector.  Assumes 0 degrees is pointing up */
function angleToVector( angle ) {
  var vec = new Phaser.Point(0,-1);
  vec = vec.rotate(0,0, angle, true);
  return vec;
}
/* convert a Vector to an Angle (degrees). the vector doesnt have to be normalised */
function vectorToAngle( x,y ) {
  ang = (Phaser.Math.radToDeg(
            Phaser.Math.angleBetween(0,0, x,y /*vec.x, vec.y*/) )) + 90;
  if (ang<0) ang+=360;
  return ang;
}
/* Work out the power of a vector, ignoring its direction */
function vectorToPower( vec ) {
  return (new Phaser.Point(0,0)).distance(vec);
}
/* The Squared function, or x to the power of 2, but also keeps the sign */
function squared( n ) {
  return (n>=0) ? n*n : -(n*n);
}

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

