
Enemy = function(x,y, dir, startFrame) {
  this.x=x; this.y=y; this.dir=dir; /* respawn place, dir=LEFT or RIGHT */
  this.score=0;
  this.plane = new Plane(x,y, dir, startFrame);
  this.plane.setParent(this);
  this.ai = new AI(this.plane, myGame.player.plane, /*respawn place*/x,y,dir);
  this.bulletTime=0;
}
Enemy.prototype.onKilled = function() {
  this.ai.stopAI();
  game.time.events.add(1500, function() {
    if (myGame.gameMode==GAME) {
      this.respawnPlane();
      this.ai.startAI();
    }
  }, this);
  myGame.player.scored();
};
Enemy.prototype.scored = function() {
  this.score++;
  myGame.scoreboard.scored(ENEMY);
  if (this.score >= 8) myGame.endGame(LOOSE);
};
Enemy.prototype.respawnPlane = function() {
  this.plane.revive();
  this.plane.x=this.x; this.plane.y=this.y;
  this.plane.myReset(this.dir);
  this.ai.targetDir=this.plane.getAngle();
  this.ai.targetSpeed=0;
};
Enemy.prototype.victoryRoll = function() {
  //this.ai = new AI(this.plane, null, /*respawn place*/this.x,this.y,this.dir);
  this.ai.startVictoryAI();
}

/*----------------------------------------------------------------------------*/
AI = function(plane, enemyPlane, /*respawn place*/x,y,dir) {
  this.x=x; this.y=y; this.dir=dir; /* respawn place, dir=LEFT or RIGHT */
  this.plane = plane;
  this.enemyPlane=enemyPlane;
  //this.parent=enemy;
  this.targetDir=0;
  this.targetSpeed=0;
  myGame.updateSignal.add(this.update, this); /* we need to recalc each update, so subscribe */
  this.started=false; /* Courtesy wait for player */
}
AI.prototype.update = function () {
  var plane = this.plane; if (!plane.alive) return;
  /* Creep towards target angle */
  var angleDiff = Math.abs( this.targetDir - plane.getAngle() );
  var whichWay=shortestRouteToAngle(plane.getAngle(), this.targetDir );
  if ( angleDiff>4 )  plane.rotate(TURN_SPEED * whichWay);

  /* if different from our target speed, creep towards it */
  if (plane.engineSpeed < this.targetSpeed) plane.accelerate(ACCELERATE_SPEED);
  if (plane.engineSpeed > this.targetSpeed) plane.decelerate(ACCELERATE_SPEED);

}
AI.prototype.startVictoryAI = function () {
  this.targetSpeed = 300;
  this.victoryLogicHandler();
}
AI.prototype.victoryLogicHandler = function() {
  var plane = this.plane;
  if (plane.flying) {
    /* check if were too low */
    if (plane.y >550) {
      this.angleTo(45); /* rise UP to middle screen */
    }else if (plane.y >400) { /* too low */
      this.angleTo(60); 
    }else if (plane.y <350) { /* too high */
      this.angleTo(120); 
    }else{ 
      this.angleTo( 90 ); /* just cruise level */
      this.targetSpeed = 190;
    }
  }else{ /* on the ground */
    if (vectorToPower(plane.body.velocity) > 220)  this.angleTo(45); /* take off if fast enough */
  }
  this.logicTimer=game.time.events.add(/*time*/game.rnd.between(230, 270), function() {
    this.victoryLogicHandler();
  }, this);
}

AI.prototype.startAI = function () {
  this.targetSpeed = 300; /* prepare for take off! */
  this.targetDir = this.plane.angle;
  this.started=true;
  this.logicHandler();
  console.log("started AI");
}
AI.prototype.stopAI = function () {
  game.time.events.remove(this.logicTimer);
  this.started=false;
}
/* This AI logic handler gets re-called every 2 secs to change the ufo direction */
AI.prototype.logicHandler = function() {
  // @TODO: Unstall enemy
  var plane = this.plane;
  if (plane.flying) {
    /* check if were too low */
    if (plane.y >540)  this.angleTo(48);
    else if (this.canISeePlayer()) {

      if (this.heightDifference() > 100) {/* if player is much higher, ensure we dont stall */
        this.angleTo(65);/* UP */
      }else { /* otherwise point towards player */
        this.targetDir = this.angleToPlayer() + game.rnd.between(-10, +10);
      }
    }else{ /* can't see player */
      this.angleTo(90); /* just cruise level for now */

    }
    if (this.playerIsInSights()) {
      this.plane.shoot( /*whoami*/ENEMY );
    }
  }else{ /* on the ground */
    if (vectorToPower(plane.body.velocity) > 250)  this.angleTo(50); /* take off if fast enough */
  }
  this.logicTimer=game.time.events.add(/*time*/game.rnd.between(230, 270), function() {
    this.logicHandler();
  }, this);
}
AI.prototype.heightDifference = function() {
  var player = myGame.player.plane;
  var enemy = this.plane;
  if (!player.alive) return 0;
  return (enemy.y - player.y);
};
AI.prototype.canISeePlayer = function() {
  var playerAng = this.angleToPlayer();
  if (playerAng==null) return false;
  var dist = this.distanceToPlayer();
  var angleDiff = Math.abs( playerAng - this.plane.getAngle() );
  if (dist > 600) {
    return (angleDiff < 45);
  }else if (dist > 400) {
    return (angleDiff < 135);
  }else if (dist < 300) {
    return (true);
  }
  //var whichWay=shortestRouteToAngle(plane.getAngle(), this.targetDir );
  //if ( angleDiff>4 )  plane.rotate(TURN_SPEED * whichWay);
};
AI.prototype.distanceToPlayer = function() {
  var player = this.enemyPlane;
  var enemy = this.plane;
  if (!player.alive) return 100000;
  return Phaser.Math.distance(enemy.x,enemy.y, player.x,player.y);
};
AI.prototype.angleToPlayer = function() {
  var player = this.enemyPlane;
  var enemy = this.plane;
  if (!player.alive) return null;
  var ang = (Phaser.Math.radToDeg(
         Phaser.Math.angleBetweenPoints(enemy, player) )) + 90;
  return fixAngle( ang );

};
AI.prototype.angleTo = function( a ) {
  if (this.plane.getAngle() >= 180) {  /* Facing LEFT */
    this.targetDir = 360 - a;
  }else {  /* Facing RIGHT */
    this.targetDir = a;
  }
};

AI.prototype.playerIsInSights = function () {
  var playerAng = this.angleToPlayer();
  if (playerAng==null) return false;
  var dist = this.distanceToPlayer();
  var angleDiff = Math.abs( playerAng - this.plane.getAngle() );
  if (dist > 600) {
    return false; /* too far away to take a shot */
  }else if (dist > 300) {
    return (angleDiff < 25);
  }else if (dist <= 300) {
    return (angleDiff < 35);
  }
  return false;
};
AI.prototype.shootAtPlayer = function () {
  if (game.time.now > this.bulletTime) {
    myGame.bullets.shoot(this.plane.x, this.plane.y, this.plane.getAngle(), ENEMY);
    this.bulletTime = game.time.now + SHOOT_SPEED;
  }
};
