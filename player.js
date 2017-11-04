
Player = function(x,y, dir) {
  this.x=x; this.y=y; this.dir=dir;
  this.score=0;
  this.plane = new Plane(x,y, dir);
  this.plane.setParent(this);
}
/* called when your plane died, to update score and respawn */
Player.prototype.onKilled = function() {
  this.respawnPlane()
};

Player.prototype.respawnPlane = function() {
  game.time.events.add(1500, function() {
    this.plane.revive();
    this.plane.x=this.x; this.plane.y=this.y;
    this.plane.myReset(this.dir);
  }, this);
};

/****************************************************************************************/
 /* The Plane object
  * An extension of the sprite class */
Plane = function(x,y, dir) {
  Phaser.Sprite.call(this, game, x, y, 'plane');
  //this.animations.add('fly', [1,2,3,4], 10, true);

  game.physics.enable(this, Phaser.Physics.ARCADE);
  /* make the ship naturally slow to a stop if left */
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0.5, 0.5);
  this.scale.set(0.5,0.5);
  this.body.allowGravity = false;
  this.myReset(dir);
  myGame.planesGroup.add(this); /* group */
  myGame.updateSignal.add(this.update, this); /* we need to recalc each update, so subscribe */
  this.events.onKilled.add(this.onKilled ,this);
};
Plane.prototype = Object.create(Phaser.Sprite.prototype);
Plane.prototype.constructor = Plane;
Plane.prototype.setParent=function(p){ this.myParent=p; }

Plane.prototype.myReset = function (dir){ 
  //this.frame = 0;
  this.direction=dir; /* which way the planes pointing */
  this.frame = (this.direction==LEFT ? 0 : 1);
  this.angle = (this.direction==LEFT ? 270 : 90); /* 0 points the plane straight up */
  this.engineSpeed = 0; /* these 2 speed figures are combined for actual speed */
  this.pitchSpeed = 0;  /* engineSpeed set by user, pitchSpeed set from climbing or goning down */
  this.body.allowGravity = false;
  this.stalled = false;
  this.flying = false; /* if in the air or on the ground */
  this.body.velocity.setTo(0,0);
};

/* amount of acceleration to add in pixels per sec, per sec */
Plane.prototype.accelerate = function ( amount ){
  this.engineSpeed += amount;
  this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);
};
Plane.prototype.decelerate = function ( amount ){ 
  this.engineSpeed -= amount;
  this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);
};
Plane.prototype.rotate = function ( rotation ){
  if (this.flying==false && this.body.speed < 40) return; /* if stopped on the ground then dont rotate */
  this.angle += rotation;
  this.angle=fixAngle(this.angle);
  if (this.flying==false)  this.takeOff(); /* we're taking off */
};
Plane.prototype.getAngle = function() {
  return fixAngle( this.angle );
};
/* run each upate, to alter speed if climbing or going down  */
Plane.prototype.recalcVelocity = function (){
  var ang = this.angle;
  this.calcPitch( ang );
  //this.pitchSpeed=Phaser.Math.clamp(this.pitchSpeed, -100, 200);
  var speed = this.pitchSpeed + this.engineSpeed;
  
  if (speed < STALL_SPEED) this.stall();

  if (this.stalled==false)
    this.body.velocity = newVector(speed, ang);
  
};
Plane.prototype.recalcGroundVelocity = function() {
  var ang = this.angle;
  var speed = this.engineSpeed;
  this.body.velocity = newVector(speed, ang);
};

Plane.prototype.calcPitch = function (ang){
  var yDelta = (newVector(PITCH_POWER/*200*/, ang)).y;
  this.pitchSpeed += ((yDelta-this.pitchSpeed) * PITCH_LERP/*0.02*/);
};
Plane.prototype.land = function (){
  if (this.flying==true) {
    this.flying = false;
    this.angle = -90;
    this.unstall();
    this.pitchSpeed=0;
    //this.y=680; /* @TODO: object detection */
    console.log("land");
  }
};
Plane.prototype.takeOff = function (){
  if (this.flying==false) {
    if (this.body.speed > 40) {
      this.flying=true;
      console.log("take off");
    }
  }
};
Plane.prototype.stall = function (){
  if (this.stalled==false) {
    this.body.allowGravity = true;
    this.stalled=true;
    console.log("stalled");
  }
};
Plane.prototype.unstall = function (){
  if (this.stalled==true) {
    this.body.allowGravity = false;
    this.stalled=false;
    this.pitchSpeed=this.body.speed - this.engineSpeed; // 130-300
    console.log("un-stalled");
  }
};
Plane.prototype.checkIfUnStalled = function (){
  if (this.body.speed > (STALL_SPEED+5)) {
    var travelAngle = vectorToAngle(this.body.velocity.x, this.body.velocity.y);
    var ang = fixAngle(this.angle);
    var angleDif = travelAngle - ang;
    //console.log("*****Travel "+travelAngle.toFixed(0)+" angle "+ang.toFixed(0));
    if (Math.abs(angleDif) < 15) {
      this.unstall();
    }
  }
};
Plane.prototype.hitGround = function (ground){
  //var v = this.body.velocity.y;
  var v = Math.abs( this.deltaY );
  console.log("v "+v);
  if (v < 0.9/*40*/) { /* check were not hitting the ground hard */
    console.log("hit ground soft");
    this.land();
  }else{ /* crash */
    console.log("hit ground HARD");
    this.kill();
    //this.x=1210; this.y=665;
    //this.engineSpeed = 0; this.pitchSpeed = 0;
    //this.angle=(this.direction==LEFT ? 270 : 90);
  }
};
Plane.prototype.update = function (){
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

Plane.prototype.onKilled = function () {
  myGame.explosions.explode(this.x, this.y, 1.0, 40);
  this.myParent.onKilled(); /* let the AI or controller know too */

  /* Just restart the whole game in a few secs */
  //game.time.events.add(1500, function() {
     // @TODO respawning
     //myGame.respawnPlayerSignal.dispatch();
    //myGame.restartGame();
  //}, this);

}

Plane.prototype.flyStart = function () {
  this.animations.play('fly');
  this.flying=true;
}
Plane.prototype.flyStop = function () {
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

