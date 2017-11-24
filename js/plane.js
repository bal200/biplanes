
/* The Plane object
 * An extension of the sprite class */
Plane = function(x,y, dir, startFrame) {
  Phaser.Sprite.call(this, game, x, y, 'plane');
  //this.animations.add('fly', [1,2,3,4], 10, true);

  game.physics.enable(this, Phaser.Physics.ARCADE);
  this.anchor.set(0.5, 0.5);
  this.scale.set(0.55,0.55);
  this.body.setSize(50,50,25,25);
  this.body.allowGravity = false;
  this.startFrame=startFrame;
  this.myReset(dir);
  myGame.planesGroup.add(this); /* group */
  myGame.updateSignal.add(this.update, this); /* we need to recalc each update, so subscribe */
  this.events.onKilled.add(this.onKilled ,this);
  this.bulletTime=0;
  this.audio=false;
};
Plane.prototype = Object.create(Phaser.Sprite.prototype);
Plane.prototype.constructor = Plane;
Plane.prototype.setParent=function(p){ this.myParent=p; }

Plane.prototype.myReset = function (dir){ 
  //this.frame = 0;
  this.direction=dir; /* which way the planes pointing */
  this.frame = (this.direction==LEFT ? this.startFrame+0 : this.startFrame+1);
  this.angle = (this.direction==LEFT ? 270 : 90); /* 0 points the plane straight up */
  this.engineSpeed = 0; /* these 2 speed figures are combined for actual speed */
  this.pitchSpeed = 0;  /* engineSpeed set by user, pitchSpeed set from climbing or goning down */
  this.body.allowGravity = false;
  this.stalled = false;
  this.flying = false; /* if in the air or on the ground */
  this.body.velocity.setTo(0,0);
};

/****************************************************************************************/

/* amount of acceleration to add in pixels per sec, per sec */
Plane.prototype.accelerate = function ( amount ){
  if (this.alive) {
    this.engineSpeed += amount;
    this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);
    if (this.audio) this.audio.start();
  }
};
Plane.prototype.decelerate = function ( amount ){ 
  this.engineSpeed -= amount;
  this.engineSpeed=Phaser.Math.clamp(this.engineSpeed, 0, MAX_ENGINE_SPEED);
  if (this.audio && this.engineSpeed==0) this.audio.stop();
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
/* Used by sound effects to determine sound pitch */
Plane.prototype.engineNoiseSpeed = function() {
  if (this.stalled) return 0;
  return (this.pitchSpeed + this.engineSpeed);
};
Plane.prototype.calcPitch = function (ang){
  var yDelta = (newVector(PITCH_POWER/*200*/, ang)).y;
  var diff = yDelta - this.pitchSpeed;
  if (this.pitchSpeed>50 && diff<0) { /* if were going fast, dont spoil our fun! */
    this.pitchSpeed += (diff * (PITCH_LERP/4));
  }else{  
    this.pitchSpeed += (diff * PITCH_LERP/*0.02*/);
  }
};
/* called by the collision detection, set the plane to 'on the ground' mode */
Plane.prototype.land = function (){
  if (this.flying==true) {
    this.flying = false;
    this.angle = (this.pointingDirection()==LEFT ? 270 : 90);
    this.unstall();
    this.pitchSpeed=0;
    //this.y=680; /* @TODO: object detection */
    console.log("land");
  }
};
Plane.prototype.pointingDirection = function() {
  if (this.getAngle() >= 180) return LEFT;
  else  return RIGHT;
};
Plane.prototype.takeOff = function (){
  if (this.flying==false) {
    if (/*this.body.speed*/vectorToPower(this.body.velocity) > 40) {
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
Plane.prototype.shoot = function ( who ) {
  if (game.time.now > this.bulletTime) {
    myGame.bullets.shoot(this.x, this.y, this.getAngle(), who);
    this.bulletTime = game.time.now + SHOOT_SPEED;
  }
};
Plane.prototype.hitGround = function (ground){
  //var v = this.body.velocity.y;
  var v = Math.abs( this.deltaY );
  console.log("Touching "+ground.body.touching.up);
  if (ground.body.touching.up) {
    if (v < CRASH_SPEED/*0.9*/) { /* check were not hitting the ground hard */
      this.land(); console.log("hit ground soft");
    }else{ /* crash */
      this.kill(); console.log("HIT ground HARD");
    }
  }else{ /* if we didnt touch the top of an object, we cant have landed */
    this.kill(); console.log("HIT an object");
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
  if (this.audio) this.audio.stop();
  this.myParent.onKilled(); /* let the AI or controller know too */
}

/* Callback when the player or enemy plane is shot.  */
Plane.prototype.planeToBulletHandler = function(bullet){
  //if (bullet.whos == ENEMY) { /* check weve not clipped our own bullet */
    this.kill(); /* kill the plane */
    bullet.kill(); /* kill the bullet too */
  //}
}

/* Take over control at the end of the game */
Plane.prototype.victory = function(){
  //this.targetDir = this.plane.angle;
  this.victoryLogicHandler();
}
Plane.prototype.victoryLogicHandler = function() {
  // @TODO: Unstall enemy
  var plane = this.plane;
  if (plane.flying) {
    /* check if were too low */
    if (plane.y >550)  this.angleTo(45);
    else if (this.canISeePlayer()) {

      if (this.heightDifference() > 100) {/* if player is much higher, ensure enemy dont stall */
        this.angleTo(65);/* UP */
      }else { /* otherwise point towards player */
        this.targetDir = this.angleToPlayer() + game.rnd.between(-10, +10);
      }
    }else{ /* can't see player */
      this.angleTo(90); /* just cruise level for now */

    }
    if (this.playerIsInSights()) {
      this.shootAtPlayer();
    }
  }else{ /* on the ground */
    if (vectorToPower(plane.body.velocity) > 220)  this.angleTo(45); /* take off if fast enough */
  }
  this.logicTimer=game.time.events.add(/*time*/game.rnd.between(230, 270), function() {
    this.logicHandler();
  }, this);
}

/*** NOT USED  */
Plane.prototype.flyStart = function () {
  this.animations.play('fly');
  this.flying=true;
}
Plane.prototype.flyStop = function () {
  this.animations.stop();
  this.frame=0;
  this.flying=false;
}
  