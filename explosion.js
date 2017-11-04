
/******************** Explosions group ****************************************/
/******************************************************************************/
var Explosions = function ( group ) {
  Phaser.Group.call(this, game); /* create a Group, the parent Class */

  /******* Explosions group ********/
  this.createMultiple(5, 'boom'/*sprite sheet*/);
  group.add( this );
  this.forEach(function(exp) {
    exp.anchor.set(0.5, 0.5);
    exp.animations.add('boom');
  });

};
Explosions.prototype = Object.create(Phaser.Group.prototype);
Explosions.prototype.constructor = Explosions;

/* create an explosion graphic */
Explosions.prototype.explode = function ( x,y, size, speed ) {
  if (exp=this.getFirstExists(false)) {
    exp.reset(Math.floor(x), Math.floor(y));
    //exp.scale.set( size );
    exp.play('boom', /*framerate*/speed, /*loop*/false, /*killoncomplete*/true);
    //audio1.play('boom'); /* boom noise */
  }

};


Enemy = function(x,y, dir) {
  this.x=x; this.y=y; this.dir=dir; /* respawn place */
  this.score=0;
  this.plane = new Plane(x,y, dir);
  this.plane.setParent(this);
  this.targetDir=0;
  this.targetSpeed=0;
  myGame.updateSignal.add(this.update, this); /* we need to recalc each update, so subscribe */
  
}
Enemy.prototype.onKilled = function() {
  this.stopAI();
  game.time.events.add(1500, function() {
    // @TODO respawning
    //myGame.respawnPlayerSignal.dispatch();
    this.respawnPlane();
    this.startAI();
  }, this);

  //if (myGame.score > highScore) highScore = myGame.score;
};
Enemy.prototype.respawnPlane = function() {
  this.plane.revive();
  this.plane.x=this.x; this.plane.y=this.y;
  this.plane.myReset(this.dir);
  this.targetDir=this.plane.getAngle();
  this.targetSpeed=0;
};

Enemy.prototype.update = function () {
  if (!this.plane.alive) console.log("enemy not alive");
  var plane = this.plane; if (!plane.alive) return;
  /* Creep towards target angle */
  var angleDiff = Math.abs( this.targetDir - plane.getAngle() );
  var whichWay=shortestRouteToAngle(plane.getAngle(), this.targetDir );
  if ( angleDiff>4 )  plane.rotate(TURN_SPEED * whichWay);

  /* if different from our target speed, creep towards it */
  if (plane.engineSpeed < this.targetSpeed) plane.accelerate(ACCELERATE_SPEED);
  if (plane.engineSpeed > this.targetSpeed) plane.decelerate(ACCELERATE_SPEED);

}
Enemy.prototype.startAI = function () {
  this.targetSpeed = 300; /* prepare for take off! */
  this.targetDir = this.plane.angle;
  this.logicHandler();
}
Enemy.prototype.stopAI = function () {
  game.time.events.remove(this.logicTimer);
}
/* This AI logic handler gets re-called every 2 secs to change the ufo direction */
Enemy.prototype.logicHandler = function() {
  console.log("logicHandler");
  var plane = this.plane;
  if (plane.flying) {
    /* check if were too low */
    if (plane.y >550)  this.angleTo(45);
    else if (this.canISeePlayer()) {
      this.targetDir = this.angleToPlayer() + game.rnd.between(-10, +10);
      //if (this.heightDifference) // @TODO

    }else{ /* can't see player */
      this.angleTo(90); /* just cruise level for now */

    }
  }else{ /* on the ground */
    if (plane.body.speed > 220) this.angleTo(45);
  }
  this.logicTimer=game.time.events.add(/*time*/game.rnd.between(230, 270), function() {
    this.logicHandler();
  }, this);
}
Enemy.prototype.canISeePlayer = function() {
  var playerAng = this.angleToPlayer();
  if (playerAng==null) return false;
  var dist = this.distanceToPlayer();
  var angleDiff = Math.abs( playerAng - this.plane.getAngle() );
  if (dist > 600) {
    return (angleDiff < 45);
  }else if (dist > 350) {
    return (angleDiff < 135);
  }else if (dist < 250) {
    return (true);
  }
  //var whichWay=shortestRouteToAngle(plane.getAngle(), this.targetDir );
  //if ( angleDiff>4 )  plane.rotate(TURN_SPEED * whichWay);
};
Enemy.prototype.distanceToPlayer = function() {
  var player = myGame.player.plane;
  var enemy = this.plane;
  if (!player.alive) return 100000;
  return Phaser.Math.distance(enemy.x,enemy.y, player.x,player.y);
};
Enemy.prototype.angleToPlayer = function() {
  var player = myGame.player.plane;
  var enemy = this.plane;
  if (!player.alive) return null;
  var ang = (Phaser.Math.radToDeg(
         Phaser.Math.angleBetweenPoints(enemy, player) )) + 90;
  return fixAngle( ang );

};
Enemy.prototype.angleTo = function( a ) {
  this.targetDir=a;
};


// @TODO
Enemy.prototype.shootAtPlayer = function ( accuracy ) {
  var coords = new Phaser.Point(this.x, this.y);
  var dir = touchDirection(coords, myGame.player)+game.rnd.between(-accuracy,+accuracy);
  myGame.bullets.enemyShoot(this.x, this.y, dir);
}