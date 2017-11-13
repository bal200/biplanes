

var menuState = {
  preload: function() {
    myGame = this;
    this.count=0;
    /* use the whole window up */
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    /* if the full screen button is pressed, use this scale mode: */
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.load.image("ribbon", "img/ribbon700w.png");
    game.load.image("biplane", "img/biplane550w.png");
    game.load.image("pilot", "img/aviator125w.png");
    game.load.image("sky", "img/sky720h.jpg");
    game.load.spritesheet("buttons", "img/buttons103w47h.png", 103,47);

  },
  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.scale.onSizeChange.add(this.onSizeChange, this);

    //game.stage.backgroundColor = '#94e1f3'; /* sky blue */
    game.add.tileSprite(0,0, 1280, 720, 'sky');
    game.world.setBounds(-5,-5, game.width+10,game.height+10);

    this.ribbon = game.add.sprite(game.width/2, game.height/2, 'ribbon');
    this.ribbon.anchor.set(0.5, 0.5); this.ribbon.scale.set(0.85,0.85);

    this.planeGroup = game.add.group(); //this.planeGroup.anchor.set(0.5, 0.5);
    this.planeGroup.x=game.width/2; this.planeGroup.y=game.height/2;
    this.plane = game.add.sprite(0,0, 'biplane');
    this.plane.anchor.set(0.5, 0.5); //this.scale.set(0.5,0.5);
    this.planeGroup.add(this.plane);

    startButton=game.add.button(game.width/2, game.height*0.85, 'buttons', function(){
      this.closeMenu(GAME);
    }, this,4,4,4 );
    startButton.anchor.set(0.5,0.5);

    //this.target={x:0, y:0};

    this.wobble = [ new Wobble(20, 2000, 100),
            /*new Wobble(6, 600, 1000),*/
              new Wobble(1, 400, 600) ];

    this.combineWobbles();

  },
  update: function() {
    this.count++;
    /* Fade in from Black at start of Game */
    if (this.count==1) game.camera.flash(0x000000, 600, true);

    this.combineWobbles();

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
  },
  combineWobbles: function() {
    this.plane.x=0; this.plane.y=0;
    for (var n=0; n<this.wobble.length; n++) {
      this.plane.x += this.wobble[n].x;
      this.plane.y += this.wobble[n].y;
    }

  },
  closeMenu: function( toGameMode ) { /* Fade to black and end this game screen */
    game.camera.fade(0x000000, 300);  /* fade to black */
    game.time.events.add(350, function() {
      game.stage.backgroundColor = '#000000';
      if (toGameMode == GAME) {
        game.state.start('play');
        //}else if (toGameMode == TITLE_SCREEN) {
        //  game.state.start('play');
      }
    }, this);
  },
  shutdown: function() {
    /* delete all the things! */
    this.count=0;
  },
  onSizeChange: function() {
    if (this.touchControl) {
      this.touchControl.onSizeChange();
    }

  },
  fullScreenButtonPress: function() {
    if (game.scale.isFullScreen)
      game.scale.stopFullScreen();
    else
      game.scale.startFullScreen(false);
  },
};


Wobble = function( range, duration, frequency ) {
  this.x=0; this.y=0;
  this.range = range;
  this.dur = duration;
  this.frequency = frequency;

  this.logic();
  //this.plane.x += ((this.target.x - this.plane.x) * 0.02);
  //this.plane.y += ((this.target.y - this.plane.y) * 0.02);
  //if (game.rnd.between(0,20) == 1) { /* Random time */
  // var x = this.plane.x + game.rnd.between(-20,20);
  // var y = this.plane.y + game.rnd.between(-20,20);
  // var duration = game.rnd.between(1000,2500);
  // game.add.tween(this.plane).to({x:x, y:y}, /*duration*/duration,
  //   Phaser.Easing.Back.InOut , /*autostart*/true, /*delay*/0, 
  //   /*repeat*/0, /*yoyo*/false);
  // //}
  // this.logicTimer=game.time.events.add(/*time*/game.rnd.between(duration, duration+500), function() {
  //   this.planeWobble();
  // }, this);
};

Wobble.prototype.logic = function() {
  var x = game.rnd.between(-this.range,this.range);
  var y = game.rnd.between(-this.range,this.range);
  var dur = game.rnd.between(this.dur*0.80, this.dur*1.20);
  var freq = this.frequency;

  game.add.tween(this).to({x:x, y:y}, /*duration*/dur,
    Phaser.Easing.Quadratic.InOut , /*autostart*/true, /*delay*/0, 
    /*repeat*/0, /*yoyo*/true);
//this.x=x;this.y=y;

  this.logicTimer=game.time.events.add(/*time*/game.rnd.between(dur*2, (dur*2)+freq), function() {
    this.logic();
  }, this);
};

Wobble.prototype.stopLogic = function() {
  game.time.events.remove( this.logicTimer );
};

