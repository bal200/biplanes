
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