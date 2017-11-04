
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
  myGame.enemy.scored();
};
Player.prototype.scored = function() {
  this.score++;
  myGame.scoreboard.scored(PLAYER);
};

Player.prototype.respawnPlane = function() {
  this.plane.revive();
  this.plane.x=this.x; this.plane.y=this.y;
  this.plane.myReset(this.dir);
};





function playerToEnemyHandler(player, enemy) {
  /* Do nothing for now.  The physics engine will bounce them for now */
}

/***************************************************************************************/
/* Manages the score text at the top. params: left player, right player, display group */
Scoreboard = function( left, right, group ) {
  this.left=left; this.right=right; 
  var style = { font: "40px Courier New", fill: "#FFFFFF", 
    //align: "left", // the alignment of the text is independent of the bounds, try changing to 'center' or 'right'
    /*boundsAlignH: "left",*/ boundsAlignV: "top",
    /*fontWeight: "bold"*/
    //wordWrap: true, wordWrapWidth: 300
  };

  this.leftText = game.add.text(0, 0, "0", style);
  //this.leftText.setStyle({boundsAlignH: "left"});
  this.leftText.setTextBounds(15, 35, game.width-(15*2), 100);
  this.leftText.setShadow(1, 1, 'rgba(0,0,0, 0.8)', 0);

  this.rightText = game.add.text(0, 0, "0", style);
  this.rightText.boundsAlignH="right";
  this.rightText.setTextBounds(15, 35, game.width-(15*2), 100);
  this.rightText.setShadow(1, 1, 'rgba(0,0,0, 0.8)', 0);

}
/* called when your plane died, to update score and respawn */
Scoreboard.prototype.scored = function( who ) {
  this.leftText.setText(""+this.left.score);
  this.rightText.setText(""+this.right.score);

};

