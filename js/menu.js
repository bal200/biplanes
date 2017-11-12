

var menuState = {
  preload: function() {
    myGame = this;
    this.count=0;
    /* use the whole window up */
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    /* if the full screen button is pressed, use this scale mode: */
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.load.image("ribbon", "img/ribbon700w.png");
    game.load.image("biplane", "img/biplane550w.png");
    game.load.image("pilot", "img/aviator125w.png");
    game.load.spritesheet("buttons", "img/buttons103w47h.png", 103,47);

  },
  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.scale.onSizeChange.add(this.onSizeChange, this);
    game.stage.backgroundColor = '#94e1f3'; /* sky blue */

    //game.add.tileSprite(0,0, 1280, 720, 'background');
    game.world.setBounds(-5,-5, game.width+10,game.height+10);

    this.ribbon = game.add.sprite(game.width/2, game.height/2, 'ribbon');
    this.ribbon.anchor.set(0.5, 0.5); this.ribbon.scale.set(0.85,0.85);

    this.biplane = game.add.sprite(game.width/2, game.height/2, 'biplane');
    this.biplane.anchor.set(0.5, 0.5); //this.scale.set(0.5,0.5);

    startButton=game.add.button(game.width/2, game.height*0.85, 'buttons', function(){
      this.closeMenu(GAME);
    }, this,4,4,4 );
    startButton.anchor.set(0.5,0.5);


  },
  update: function() {
    this.count++;
    /* Fade in from Black at start of Game */
    if (this.count==1) game.camera.flash(0x000000, 600, true);
    if (this.count==150) {

    }

    if (this.gameMode==GAME) {
      if (this.cursors.up.isDown) {
        this.player.plane.accelerate(ACCELERATE_SPEED);
      }
      else if (this.cursors.down.isDown) {
        this.player.plane.decelerate(ACCELERATE_SPEED);
      }
      if (this.cursors.left.isDown) {
        this.player.plane.rotate(-TURN_SPEED);
      }
      else if (this.cursors.right.isDown) {
        this.player.plane.rotate(+TURN_SPEED);
      }
      if (this.spacebar.isDown) {
        this.fireButtonClick();
      }
    }
  },
  closeMenu: function( toGameMode ) { /* Fade to black and end this game screen */
    game.camera.fade(0x000000, 300);  /* fade to black */
    game.time.events.add(350, function() {
      game.stage.backgroundColor = '#000000';
      if (toGameMode == GAME) {
        game.state.start('play');
      //}else if (toGameMode == TITLE_SCREEN) {
      //  game.state.start('play');
      }
    }, this);
  },
  onSizeChange: function() {
    if (this.touchControl) {
      this.touchControl.onSizeChange();
    }

  },
  fullScreenButtonPress: function() {
    if (game.scale.isFullScreen)
      game.scale.stopFullScreen();
    else
      game.scale.startFullScreen(false);
  },
};