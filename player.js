
 /* The players object
  * An extension of the sprite class */
Player = function(x,y) {
  Phaser.Sprite.call(this, game, x, y, 'plane');
  //this.animations.add('fly', [1,2,3,4], 10, true);
  this.frame = 0;

  game.physics.enable(this, Phaser.Physics.ARCADE);
  /* make the ship naturally slow to a stop if left */
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0.5, 0.5);
  this.scale.set(0.5,0.5);
  this.body.allowGravity = false;
  game.world.add(this);

  this.engineSpeed = 0;
  this.pitchSpeed = 0;
  this.stalled = false;
  this.flying = false;
  this.angleCorrect = -90; /* to correct for sprites drawn angle different from direction angle */
};
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;


/* amount of acceleration to add in pixels per sec, per sec */
Player.prototype.accelerate = function ( amount ){
  this.engineSpeed += amount;
  this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);

};
Player.prototype.decelerate = function ( amount ){ 
  this.engineSpeed -= amount;
  this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);
};
/* to rotate the ship when turning */
Player.prototype.rotate = function ( rotation ){
  if (this.flying==false && this.body.speed < 40) return; /* if stopped on the ground then dont rotate */
  this.angle += rotation;
  this.angle=fixAngle(this.angle);
  if (this.flying==false)  this.takeOff(); /* we're taking off */
};

Player.prototype.recalcVelocity = function (){
  var ang = this.angle +this.angleCorrect;
  this.calcPitch( ang );
  //this.pitchSpeed=Phaser.Math.clamp(this.pitchSpeed, -100, 200);
  var speed = this.pitchSpeed + this.engineSpeed;
  
  if (speed < STALL_SPEED) this.stall();

  if (this.stalled==false)
    this.body.velocity = newVector(speed, ang);
  
};
Player.prototype.recalcGroundVelocity = function() {
  var ang = this.angle +this.angleCorrect;
  var speed = this.engineSpeed;
  this.body.velocity = newVector(speed, ang);
};

Player.prototype.calcPitch = function (ang){
  var yDelta = (newVector(PITCH_POWER/*200*/, ang)).y;
  this.pitchSpeed += ((yDelta-this.pitchSpeed) * PITCH_LERP/*0.02*/);
};
Player.prototype.land = function (){
  if (this.flying==true) {
    this.flying = false;
    this.angle = 0;
    this.unstall();
    this.pitchSpeed=0;
    //this.y=680; /* @TODO: object detection */
    console.log("land");
  }
};
Player.prototype.takeOff = function (){
  if (this.flying==false) {
    if (this.body.speed > 40) {
      this.flying=true;
      console.log("take off");
    }
  }
};
Player.prototype.stall = function (){
  if (this.stalled==false) {
    this.body.allowGravity = true;
    this.stalled=true;
    console.log("stalled");
  }
};
Player.prototype.unstall = function (){
  if (this.stalled==true) {
    this.body.allowGravity = false;
    this.stalled=false;
    this.pitchSpeed=this.body.speed - this.engineSpeed; // 130-300
    console.log("un-stalled");
  }
};
Player.prototype.checkIfUnStalled = function (){
  if (this.body.speed > (STALL_SPEED+5)) {
    var travelAngle = vectorToAngle(this.body.velocity.x, this.body.velocity.y);
    var ang = fixAngle(this.angle +this.angleCorrect);
    var angleDif = travelAngle - ang;
    //console.log("*****Travel "+travelAngle.toFixed(0)+" angle "+ang.toFixed(0));
    if (Math.abs(angleDif) < 15) {
      this.unstall();
    }
  }
};
Player.prototype.hitGround = function (ground){
  var v = this.body.velocity.y;
  if (this.body.velocity.y < 40) { /* check were not hitting the ground hard */
    console.log("hit ground soft");
    this.land();
  }else{ /* crash */
    console.log("hit ground HARD");
  }
};
Player.prototype.update = function (){
  if (this.flying)
    this.recalcVelocity();
  else
    this.recalcGroundVelocity();
  if (this.stalled) {
    this.checkIfUnStalled();
  }
  if (this.x<0) this.x=game.width;  /* Wrap around the screen */
  if (this.x>game.width) this.x=0;

  //if (this.y>680) this.hitGround();
};

Player.prototype.onKilled = function () {
  myGame.explosions.explode(this.x, this.y, 1.5, 20);
  this.kill();
  /* Just restart the whole game in a few secs */
  game.time.events.add(2000, function() {
    myGame.restartGame();
  }, this);
  if (myGame.score > highScore) highScore = myGame.score;
}

Player.prototype.flyStart = function () {
  this.animations.play('fly');
  this.flying=true;
}
Player.prototype.flyStop = function () {
  this.animations.stop();
  this.frame=0;
  this.flying=false;
}


/* Callback when the player is hit.  */
function playerToBulletHandler(player, bullet) {
  if (bullet.whos == ENEMY) { /* check weve not clipped our own bullet */
    player.onKilled();
    bulletOnKilled(bullet);
  }
}

function playerToEnemyHandler(player, enemy) {
  /* Do nothing for now.  The physics engine will bounce them for now */
}

/* correct an angle so its within our 0-360 range */
function fixAngle(a) {
  if (a<0) return a+360;
  if (a>360) return a-360;
  return a;
}