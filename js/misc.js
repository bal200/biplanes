
/***************************************************************************************/
var START_GAME=1;
var PRESSING_WRONG_BUTTONS=2;
var AIRBOURNE=3;
var ENEMY_SHOULD_START=4;
var FINISHED=10;

Learning = function() {
  this.stage=0;
  this.instructionsShowing=false;
  var awardSpeed=false;
  var awardUnstall=false; 
}
Learning.prototype.create = function() {
  myGame.updateSignal.add(this.update, this); /* subscribe to update callback */
};  
Learning.prototype.trigger = function( type ) {
  if (type==ENEMY_SHOULD_START && this.stage==FINISHED) {
    this.startEnemy();
  }
  if (this.stage==FINISHED) return;
  if (type==START_GAME && this.stage==0) {
    this.stage=START_GAME;
    this.showInstructions();

  }else if (type==AIRBOURNE && this.stage==START_GAME) {
    this.stage=FINISHED;
    this.hideInstructions();
    this.startEnemy();
  }
};
Learning.prototype.update = function(count) {
  
  if (count==50) this.trigger(START_GAME);
  if (count==150) {
    this.trigger(ENEMY_SHOULD_START);
  }
  if (myGame.player.isAirbourne()) this.trigger( AIRBOURNE );


};
Learning.prototype.showInstructions = function() {
  if (!this.instructionsShowing){
    this.inst = game.add.sprite(720,300, 'instructions');
    this.inst.alpha=0;
    game.add.tween(this.inst).to({alpha:0.9}, /*duration*/400,
      Phaser.Easing.Cubic.InOut, /*autostart*/true, /*delay*/0, /*repeat*/0, /*yoyo*/false)
      .onComplete.add(function(sprite, tween){ });
    this.instructionsShowing=true;
  }
};
Learning.prototype.hideInstructions = function() {
  if (this.instructionsShowing){
    game.add.tween(this.inst).to({alpha:0.0}, /*duration*/250,
      Phaser.Easing.Cubic.InOut, /*autostart*/true, /*delay*/0, /*repeat*/0, /*yoyo*/false)
      .onComplete.add(function(sprite, tween){
        sprite.destroy();
      });
    this.instructionsShowing=false;
  }
}; 
Learning.prototype.startEnemy = function() {
  if (! myGame.enemy.ai.started) myGame.enemy.ai.startAI(); 
}
/*****************************************************************************/
//Flash(this.x, this.y);

function Flash(x,y) {
  var fl = game.add.sprite(x,y, 'circle_flash');

  fl.scale.set(0.1, 0.1);
  fl.alpha = 1.0;
  fl.anchor.set(0.5, 0.5);
  game.add.tween(fl).to( { alpha:0 }, /*duration*/100,
    Phaser.Easing.Linear.None , /*autostart*/true, /*delay*/200, /*repeat*/0, /*yoyo*/false)
    .onComplete.add(function(sprite, tween){
      sprite.kill();
      sprite.destroy();
  }, this);

  game.add.tween(fl.scale).to( { x:2.0, y:2.0 }, /*duration*/300,
    Phaser.Easing.Linear.None , /*autostart*/true, /*delay*/0, /*repeat*/0, /*yoyo*/false);
}


var Flashy = function ( group ) {
  Phaser.Group.call(this, game); /* create a Group, the parent Class */

  this.enableBody = true;
  this.physicsBodyType = Phaser.Physics.ARCADE;
  group.add( this );

  for (var i = 0; i < 15; i++) {
    var b = this.create(0, 0, 'bullets');
    b.exists = false;  b.visible = false;
    b.checkWorldBounds = true;
    b.body.allowGravity = false;
    b.anchor.set(0.5, 0.5);
    b.frame=3;
    b.whos=0;
    b.events.onKilled.add(function(){
      if (this.tween && this.tween.stop) {
        this.tween.stop();
      }
    } ,b);
    //b.events.onOutOfBounds.add( bulletOnKilled );
  }
};
Flashy.prototype = Object.create(Phaser.Group.prototype);
Flashy.prototype.constructor = Flashy;

Flashy.prototype.shoot = function( x,y, direction, who ) {
  var bullet = this.getFirstExists(false);
  if (bullet) {
    var vec = angleToVector( direction );
    bullet.reset(x + (vec.x*40), y + (vec.y*40));
    var power = BULLET_SPEED;
    bullet.whos = who;
    bullet.alpha = 1.0;
    bullet.body.velocity.x = vec.x * power;
    bullet.body.velocity.y = vec.y * power;
    bullet.angle = direction;
    bullet.frame = 1;
    bullet.tween=game.add.tween(bullet).to( { alpha:0 }, /*duration*/200,
      Phaser.Easing.Linear.None , /*autostart*/true, /*delay*/1000, /*repeat*/0, /*yoyo*/false)
      .onComplete.add(function(bullet, tween){
         bullet.kill();
      }, this);
  }
}


/************************ Engine sound effect ****************************************/
EngineNoise = function( player, volume ) {
  this.player=player;
  this.plane = player.plane;
  this.volume=volume;
  player.plane.audio = this; /* so audio object & plane object can talk to each other */

  this.sample = game.add.audio("engine_noise");
  //this.sample.allowMultiple = true;
  //this.sample.addMarker('pitch10', 0.0, 0.30); /* standard */
  //this.sample.addMarker('explosion2', 1.0, 2.0); /*  */
  this.playing=false;
  //this.sample.onLoop.add(this.onLoop, this);
  
}
EngineNoise.prototype.start = function () {
  if (!this.playing) {
    this.playing=true;
    this.sample.play(null,null, /*vol*/this.volume, /*loop*/true /*,force restart*/);
    if (this.sample.usingWebAudio)
      this.sample._sound.playbackRate.value = 0.4;
    this.soundPitchRecalc();
  }
};
EngineNoise.prototype.stop = function () {
  this.playing=false;
  this.sample.stop();
  game.time.events.remove(this.logicTimer);
};
EngineNoise.prototype.soundPitchRecalc = function () {
  /* 0 stop, 130 stall, 200 take off,300 fly level, 500 max; */
  if (this.playing) {
    var speed = this.plane.engineNoiseSpeed();
    var rate=Phaser.Math.clamp((speed*0.003 ), 0.4, 1.5);
    if (this.sample.usingWebAudio)
      this.sample._sound.playbackRate.value = rate;

  }
  this.logicTimer=game.time.events.add(/*time*/50, function() {
    this.soundPitchRecalc();
  }, this);
};

/***************************************************************************************/
/* Manages the score text at the top. params: left player, right player, display group */
Scoreboard = function( left, right, group ) {
  this.left=left; this.right=right; 
  var style = { font: "72px Courier New", fill: "#FFFFFF", 
    /*boundsAlignH: "left",*/ boundsAlignV: "top",
    /*fontWeight: "bold"*/
  };

  this.leftText = game.add.text(0, 0, "0", style);
  //this.leftText.setStyle({boundsAlignH: "left"});
  this.leftText.setTextBounds(15, 15, game.width-(15*2), 100);
  this.leftText.setShadow(1, 1, 'rgba(0,0,0, 0.9)', 0);

  this.rightText = game.add.text(0, 0, "0", style);
  this.rightText.boundsAlignH="right";
  this.rightText.setTextBounds(15, 15, game.width-(15*2), 100);
  this.rightText.setShadow(1, 1, 'rgba(0,0,0, 0.9)', 0);

}
/* called when your plane died, to update score and respawn */
Scoreboard.prototype.scored = function( who ) {
  this.leftText.setText(""+this.left.score);
  this.rightText.setText(""+this.right.score);

};

/********************** END OF GAME PAGES  ********************************************/
/**************************************************************************************/
TitlePage = function( parentGroup, type, myGame ) {
  this.myGame=myGame;
  parentGroup.add( this.group = game.add.group() );
  this.group.x = game.width/2; 
  this.group.y = game.height/2;

  this.group.add( this.backing = game.add.sprite(0,0, 'titlebacking') );
  this.backing.anchor.set(0.5,0.5);
  if (type==WIN) {
    //this.nextButton(120,90,this.group);
    this.homeButton(0,90,this.group, /*green*/true);
    var text="You Win!";
  }
  if (type==LOOSE) {
    this.restartButton(+80,90,this.group, /*green*/true);
    this.homeButton(-80,90,this.group, /*green*/true);
    var text="Computer wins";
  }
  var scoretitle = game.add.text(0,0, myGame.enemy.score+" - "+myGame.player.score,
    {font:'bold 60px Courier', fill:'#FFF', boundsAlignH:'center'/*, boundsAlignV:'middle'*/ });
  scoretitle.setShadow(1, 1, 'rgba(0,0,0,1.0)', 2);
  scoretitle.setTextBounds(-100,-110, 200,100);
  this.group.add(scoretitle);

  var texttitle = game.add.text(0,0, text,
    {font:'bold 25px Courier', fill:'#FFF', boundsAlignH:'center'/*, boundsAlignV:'middle'*/ });
  texttitle.setShadow(1, 1, 'rgba(0,0,0,1.0)', 2);
  texttitle.setTextBounds(-100,-10, 200,80);
  this.group.add(texttitle);

  this.group.alpha = 0;
  game.add.tween(this.group).to({alpha: 1.00}, /*duration*/300,
           Phaser.Easing.Linear.None, /*autostart*/true, /*delay*/0, /*repeat*/0, /*yoyo*/false);
};

TitlePage.prototype.nextButton = function(x,y, group) {
  group.add( button = game.add.button(x,y, 'buttons', function(){
    myGame.closeGame(GAME);
  }, this,5,5,5) );
  button.anchor.set(0.5,0.5);
};
TitlePage.prototype.homeButton = function(x,y, group, green) {
  group.add( button = game.add.button(x,y, 'buttons', function(){
    myGame.closeGame(TITLE_SCREEN);
  }, this,(green ? 0:1),(green ? 0:1),(green ? 0:1)) );
  button.anchor.set(0.5,0.5);
};
TitlePage.prototype.restartButton = function(x,y, group, green) {
  group.add( button=game.add.button(x,y, 'buttons', function(){
    myGame.closeGame(GAME);
  }, this,(green ? 2:3),(green ? 2:3),(green ? 2:3) ) );
  button.anchor.set(0.5,0.5);
};


/****************** ITEMS & DECORATION SPRITES ****************************************/
/* Items are sprites that are hittable and land-on-able */
/* setting invisible=true just makes a zone to hit but invisible */
Items = function(x,y, sprite, group, invisible, scale) {
  Phaser.Sprite.call(this, game, x, y, sprite);
  //this.animations.add('fly', [1,2,3,4], 10, true);
  this.frame = 0;
  if (invisible) this.visible=false;
  game.physics.enable(this, Phaser.Physics.ARCADE);
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0, 0);
  if (scale) this.scale.set(scale,scale);
  this.body.allowGravity = false;
  this.body.immovable = true;
  group.add(this);

};
Items.prototype = Object.create(Phaser.Sprite.prototype);
Items.prototype.constructor = Items;

/* Decorations are sprites that can't be hit */
Decorations = function(x,y, sprite, group) {
  Phaser.Sprite.call(this, game, x, y, sprite);
  //this.animations.add('fly', [1,2,3,4], 10, true);
  this.frame = 0;

  game.physics.enable(this, Phaser.Physics.ARCADE);
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0, 0);
  //this.scale.set(0.5,0.5);
  this.body.allowGravity = false;
  group.add(this);

};
Decorations.prototype = Object.create(Phaser.Sprite.prototype);
Decorations.prototype.constructor = Decorations;


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
/* correct an angle so its within our 0-360 range */
function fixAngle( a ) {
  if (a<0) return a+360;
  if (a>360) return a-360;
  return a;
}
/* Get the direction we need to turn for angle A to meet angle B */
/* returns either +1 or -1, to indicate the direction */
function shortestRouteToAngle( a, b ) {
  if (b<a) b += 360;  /* first put B above A */
  if ((b - a) < 180) return +1;  /* if going forwards is less than 180, then forwards is closest */
  return -1;  /* if above is false, it can only be backwards */
}
