
var menuState = {
  preload: function() {
    myGame = this;
    this.count=0;
    /* use the whole window up */
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    /* if the full screen button is pressed, use this scale mode: */
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    game.load.image("fullscreenbutton", "img/fullscreenbutton.png");
    game.load.image("ribbon", "img/ribbon700w.png");
    game.load.image("biplane", "img/biplane550w.png");
    game.load.image("pilot", "img/aviator125w.png");
    game.load.image("sky", "img/sky720h.jpg");
    game.load.spritesheet("buttons", "img/buttons103w47h.png", 103,47);
    game.load.spritesheet("smoke", "img/smoke200wh.png", 200,200);
  },
  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.scale.onSizeChange.add(this.onSizeChange, this);

    //game.stage.backgroundColor = '#94e1f3'; /* sky blue */
    game.add.tileSprite(0,0, 1280, 720, 'sky');
    //game.world.setBounds(-5,-5, game.width+10,game.height+10);

    this.clouds = new Clouds( game.world );
    this.clouds.createClouds( 15 );

    this.ribbon = game.add.sprite(game.width/2, game.height/2, 'ribbon');
    this.ribbon.anchor.set(0.5, 0.5); this.ribbon.scale.set(0.85,0.85);

    this.planeGroup = game.add.group(); //this.planeGroup.anchor.set(0.5, 0.5);
    this.planeGroup.x=game.width/2; this.planeGroup.y=game.height/2;
    this.plane = game.add.sprite(0,0, 'biplane');
    this.plane.anchor.set(0.5, 0.5); //this.scale.set(0.5,0.5);
    this.planeGroup.add(this.plane);

    this.inTheClouds = new InTheClouds( game.world );

    startButton=game.add.button(game.width/2, game.height*0.85, 'buttons', function(){
      this.closeMenu(GAME);
    }, this,4,4,4 );
    startButton.anchor.set(0.5,0.5);

    //this.target={x:0, y:0};

    this.wobble = [ new Wobble(20, 2000, 100),
            /*new Wobble(6, 600, 1000),*/
              new Wobble(1, 400, 600) ];

    this.combineWobbles();

    this.fullScreenButton = game.add.button(3,3, 'fullscreenbutton', this.fullScreenButtonPress, this,0,0,0);    
  },
  update: function() {
    this.count++;
    /* Fade in from Black at start of Game */
    if (this.count==1) game.camera.flash(0x000000, 600, true);

    this.combineWobbles();

    if (game.rnd.between(0,200)==1) {
      this.inTheClouds.createClouds( game.rnd.between(2,4) );
    }

    this.clouds.update();


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

/**************************************************************************************/
Wobble = function( range, duration, frequency ) {
  this.x=0; this.y=0;
  this.range = range;
  this.dur = duration;
  this.frequency = frequency;

  this.logic();
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


/**************************************************************************************/
var InTheClouds = function ( group ) {
  Phaser.Group.call(this, game); /* create a Group, the parent Class */
  
  this.createMultiple(20, 'smoke'/*sprite sheet*/);
  group.add( this );
  this.forEach(function(cld) {
    cld.anchor.set(0.5, 0.5);
  });

};
InTheClouds.prototype = Object.create(Phaser.Group.prototype);
InTheClouds.prototype.constructor = InTheClouds;

/* create a big explosion graphic */
InTheClouds.prototype.createClouds = function ( count ) {
  var cld, cloudSize = game.height*2.4;
  var cloudScale = cloudSize/200;
  var alpha = game.rnd.realInRange(0.1, 0.3)
  for (var n=0, dist=0; n<count; n++, dist+=110) {
    if (cld=this.getFirstExists(false)) {
      cld.reset(game.width + cloudSize/2, game.height/2);
      cld.anchor.set(0.5,0.5);
      cld.frame = game.rnd.between(3,5);
      cld.alpha=alpha;
      cld.scale.set(cloudScale, cloudScale);
      dist += (game.rnd.between(1,3)==1 ? 90 : 0);
      game.add.tween(cld).to({x: -(cloudSize/2)}, /*duration*/300, Phaser.Easing.Linear.None,
        /*autostart*/true, /*delay*/dist, /*repeat*/0, /*yoyo*/false)
        .onComplete.add(function(cld, tween){
          cld.kill();
        });

    }
  }

};

/**************************************************************************************/
var Clouds = function ( group ) {
  Phaser.Group.call(this, game); /* create a Group, the parent Class */
  
  this.createMultiple(20, 'smoke'/*sprite sheet*/);
  group.add( this );
  game.physics.enable(this, Phaser.Physics.ARCADE);
  this.forEach(function(cld) {
    cld.anchor.set(0.5, 0.5);
  });

};
Clouds.prototype = Object.create(Phaser.Group.prototype);
Clouds.prototype.constructor = Clouds;

/* create a big explosion graphic */
Clouds.prototype.createClouds = function ( count ) {
  var cld, lev;
  for (var n=0; n<count; n++) { 
    lev = game.rnd.between(1,2); /* lev 1: near+large+fast. lev 2: far+small+slow */
    cloudScale = (lev==1 ? 2.0 : 1.0);
    cloudSpeed = (lev==1 ? 30 : 10);
    if (cld=this.getFirstExists(false)) {
      cld.reset(game.rnd.between(0,game.width), game.rnd.between(0,game.height));
      cld.anchor.set(0.5,0.5);
      cld.frame = game.rnd.between(1,5);
      cld.alpha=0.9;
      cld.angle=game.rnd.between(0, 360);
      cld.scale.set(cloudScale, cloudScale);
      cld.body.velocity = new Phaser.Point(-cloudSpeed, 0);

    }
  }

};

Clouds.prototype.update = function () {
  this.forEach(function(cld) {
    if (cld.x < -200) {cld.x = game.width+200; cld.y=game.rnd.between(0,game.height);}
    if (cld.x > game.width+200) {cld.x = -200; cld.y=game.rnd.between(0,game.height);}
  });

};
