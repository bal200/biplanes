
Player = function(x,y, dir, startFrame) {
  this.x=x; this.y=y; this.dir=dir;
  this.score=0;
  this.plane = new Plane(x,y, dir, startFrame);
  this.plane.setParent(this);
  this.ai = null; /* were human, so no AI needed to control plane */
}
/* called when your plane died, to update score and respawn */
Player.prototype.onKilled = function() {
  game.time.events.add(1500, function() {
    if (myGame.gameMode==GAME) {
      this.respawnPlane();
    }
  }, this);
  myGame.enemy.scored();
};
Player.prototype.scored = function() {
  this.score++;
  myGame.scoreboard.scored(PLAYER);
  if (this.score >= 7) myGame.endGame(WIN);
};

Player.prototype.respawnPlane = function() {
  this.plane.revive();
  this.plane.x=this.x; this.plane.y=this.y;
  this.plane.myReset(this.dir);
};

Player.prototype.victoryRoll = function() {
  this.ai = new AI(this.plane, null, /*respawn place*/this.x,this.y,this.dir);
  this.ai.startVictoryAI();

}
/* for Learning class to know if the player has mastered taking off successfully */
Player.prototype.isAirbourne = function() {
  if (this.plane.y < 550 && !this.plane.stalled) return true;
  return false;
}

function playerToEnemyHandler(player, enemy) {
  /* Do nothing for now. */
}


