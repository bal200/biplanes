
Player = function(x,y, dir) {
  this.x=x; this.y=y; this.dir=dir;
  this.score=0;
  this.plane = new Plane(x,y, dir);
  this.plane.setParent(this);
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
  if (this.score >= 10) myGame.endGame(WIN);
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
    /*boundsAlignH: "left",*/ boundsAlignV: "top",
    /*fontWeight: "bold"*/
  };

  this.leftText = game.add.text(0, 0, "0", style);
  //this.leftText.setStyle({boundsAlignH: "left"});
  this.leftText.setTextBounds(15, 15, game.width-(15*2), 100);
  this.leftText.setShadow(1, 1, 'rgba(0,0,0, 0.8)', 0);

  this.rightText = game.add.text(0, 0, "0", style);
  this.rightText.boundsAlignH="right";
  this.rightText.setTextBounds(15, 15, game.width-(15*2), 100);
  this.rightText.setShadow(1, 1, 'rgba(0,0,0, 0.8)', 0);

}
/* called when your plane died, to update score and respawn */
Scoreboard.prototype.scored = function( who ) {
  this.leftText.setText(""+this.left.score);
  this.rightText.setText(""+this.right.score);

};

/********************** TITLE PAGES & WIN PAGE ****************************************/
/**************************************************************************************/
TitlePage = function( parentGroup, type, myGame ) {
  this.myGame=myGame;
  parentGroup.add( this.group = game.add.group() );
  this.group.x = game.width/2; 
  this.group.y = game.height/2;

  this.group.add( this.backing = game.add.sprite(0,0, 'titlebacking') );
  this.backing.anchor.set(0.5,0.5);
  if (type==WIN) {
    this.nextButton(120,90,this.group);
    this.homeButton(0,90,this.group, /*green*/true);
    var text="You Win!";
  }
  if (type==LOOSE) {
    this.restartButton(0,90,this.group, /*green*/true);
    this.homeButton(-120,90,this.group, /*green*/true);
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
  game.add.tween(this.group).to({alpha: 1.00}, /*duration*/150,
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
    myGame.closeGame(TITLE_SCREEN);
  }, this,(green ? 2:3),(green ? 2:3),(green ? 2:3) ) );
  button.anchor.set(0.5,0.5);
};

