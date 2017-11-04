
Player = function(x,y, dir) {
  this.x=x; this.y=y; this.dir=dir;
  this.score=0;
  this.plane = new Plane(x,y, dir);
  this.plane.setParent(this);
}
/* called when your plane died, to update score and respawn */
Player.prototype.onKilled = function() {
  game.time.events.add(1500, function() {
    this.respawnPlane();
  }, this);
};

Player.prototype.respawnPlane = function() {
  this.plane.revive();
  this.plane.x=this.x; this.plane.y=this.y;
  this.plane.myReset(this.dir);
};





function playerToEnemyHandler(player, enemy) {
  /* Do nothing for now.  The physics engine will bounce them for now */
}

