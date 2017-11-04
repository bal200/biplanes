
var Bullets = function ( group ) {
  Phaser.Group.call(this, game); /* create a Group, the parent Class */

  this.enableBody = true;
  this.physicsBodyType = Phaser.Physics.ARCADE;
  group.add( this );

  for (var i = 0; i < 15; i++) {
    var b = this.create(0, 0, 'bullets');
    b.exists = false;  b.visible = false;
    b.checkWorldBounds = true;
    b.body.allowGravity = false;
    b.anchor.set(0.5, 0.5);
    b.frame=1;
    b.whos=0;
    b.events.onKilled.add(function(){
      if (this.tween && this.tween.stop) {
        this.tween.stop();
      }
    } ,b);
    //b.events.onOutOfBounds.add( bulletOnKilled );
  }
};
Bullets.prototype = Object.create(Phaser.Group.prototype);
Bullets.prototype.constructor = Bullets;

Bullets.prototype.shoot = function( x,y, direction, who ) {
  var bullet = this.getFirstExists(false);
  if (bullet) {
    var vec = angleToVector( direction );
    bullet.reset(x + (vec.x*60), y + (vec.y*60));
    var power = BULLET_SPEED;
    bullet.whos = who;
    bullet.alpha = 1.0;
    bullet.body.velocity.x = vec.x * power;
    bullet.body.velocity.y = vec.y * power;
    bullet.angle = direction;
    bullet.frame = 1;
    bullet.tween=game.add.tween(bullet).to( { alpha:0 }, /*duration*/200,
      Phaser.Easing.Linear.None , /*autostart*/true, /*delay*/1000, /*repeat*/0, /*yoyo*/false)
      .onComplete.add(function(bullet, tween){
         bullet.kill();
      }, this);

  }
}
Bullets.prototype.enemyShoot = function( x,y, direction ) {
  var bullet = this.getFirstExists(false);
  if (bullet) {
    var vec = angleToVector( direction );
    bullet.reset(x + (vec.x*60), y + (vec.y*60));
    var power = 250; /* bullet speed */
    bullet.whos = ENEMY;
    bullet.alpha = 1.0;
    bullet.body.velocity.x = vec.x * power;
    bullet.body.velocity.y = vec.y * power;
    bullet.angle = direction;
    bullet.frame = 0;
    //bullet.events.onKilled.add(function(){
    //  if (this.tween && this.tween.stop) {
    //    this.tween.stop();
    //  }
    //} ,this);
    bullet.tween=game.add.tween(bullet).to( { alpha:0 }, /*duration*/200,
      Phaser.Easing.Linear.None , /*autostart*/true, /*delay*/1400, /*repeat*/0, /*yoyo*/false)
      .onComplete.add(function(bullet, tween){
         bullet.kill();
      }, this);

  }
}

//bulletOnKilled = function (bullet) {
//  if (bullet.tween && bullet.tween.stop) {
//    bullet.tween.stop();
//    bullet.tween=null;
//  }
//  bullet.kill();
//}

/**************************** ITEMS ****************************************************/
/* Items are sprites that are hittable and land-on-able */
/* setting visible=false just makes a zone to hit but invisible */
Items = function(x,y, sprite, group, invisible) {
  Phaser.Sprite.call(this, game, x, y, sprite);
  //this.animations.add('fly', [1,2,3,4], 10, true);
  this.frame = 0;
  if (invisible) this.visible=false;
  game.physics.enable(this, Phaser.Physics.ARCADE);
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0, 0);
  //this.scale.set(0.5,0.5);
  this.body.allowGravity = false;
  this.body.immovable = true;
  group.add(this);

};
Items.prototype = Object.create(Phaser.Sprite.prototype);
Items.prototype.constructor = Items;

/* Decorations are sprites that can't be hit */
Decorations = function(x,y, sprite, group) {
  Phaser.Sprite.call(this, game, x, y, sprite);
  //this.animations.add('fly', [1,2,3,4], 10, true);
  this.frame = 0;

  game.physics.enable(this, Phaser.Physics.ARCADE);
  //this.body.drag = new Phaser.Point(20,20);
  this.anchor.set(0, 0);
  //this.scale.set(0.5,0.5);
  this.body.allowGravity = false;
  group.add(this);

};
Decorations.prototype = Object.create(Phaser.Sprite.prototype);
Decorations.prototype.constructor = Decorations;