TANK.registerComponent('Player')

.includes(['Ship', 'ShipHud', 'ProgressIndicator'])

.construct(function()
{
  this.zdepth = 100;
  this.shakeTime = 0;

  this.headingPos = [0, 0];
  this.headingLeft = false;
  this.headingRight = false;
  this.speedUp = false;
  this.speedDown = false;
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  //
  // Camera shake
  //
  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  //
  // Listen for player death
  //
  this.listenTo(this._entity, 'explode', function()
  {
    TANK.main.Game.addStory('You exploded.');
    TANK.main.dispatchTimed(3, 'gamelose');
  });

  //
  // Listen for collisions
  //
  this.listenTo(this._entity, 'collide', function(obj)
  {
    if (obj.Bullet && obj.Bullet.owner !== this._entity)
      this.shakeCamera(0.1);
    if (obj.FuelCell)
    {
      TANK.main.Game.givePlayerFuel(1);
      obj._parent.removeChild(obj);
    }
  });

  //
  // Camera shake message
  //
  this.listenTo(TANK.main, 'camerashake', function(duration)
  {
    this.shakeCamera(duration);
  });

  //
  // Key input
  //
  this.listenTo(TANK.main, 'keydown', function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = true;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = true;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = true;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = true;
  });

  this.listenTo(TANK.main, 'keyup', function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = false;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = false;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = false;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = false;
  });

  //
  // Update loop
  //
  this.update = function(dt)
  {
    // Check for warp jammer
    var warpJammers = TANK.main.getChildrenWithComponent('WarpJammer');
    if (warpJammers && Object.keys(warpJammers).length)
    {
      if (!ship.warpJammed)
      {
        ship.warpJammed = true;
        TANK.main.Game.addEventLog('Warp drive is being jammed!');
      }
      ship.warpCharge = 0;
    }
    else if (ship.warpJammed)
    {
      ship.warpJammed = false;
      TANK.main.Game.addEventLog('Warp drive is no longer jammed');
    }

    // Heading controls
    if (this.headingLeft)
      ship.heading = t.rotation - 0.3;
    if (this.headingRight)
      ship.heading = t.rotation + 0.3;

    // Speed controls
    if (this.speedUp)
      ship.desiredSpeed += dt * 80;
    if (this.speedDown)
      ship.desiredSpeed -= dt * 80;

    // Shoot
    if (TANK.main.Input.isDown(TANK.Key.LEFT_ARROW))
      this._entity.Weapons.fireGuns('left');
    if (TANK.main.Input.isDown(TANK.Key.RIGHT_ARROW))
      this._entity.Weapons.fireGuns('right');
    if (TANK.main.Input.isDown(TANK.Key.UP_ARROW))
      this._entity.Weapons.fireGuns('front');
    if (TANK.main.Input.isDown(TANK.Key.DOWN_ARROW))
      this._entity.Weapons.fireGuns('back');

    // Camera follow
    TANK.main.Renderer2D.camera.x = t.x;
    TANK.main.Renderer2D.camera.y = t.y;

    // Camera shake
    if (this.shakeTime > 0)
    {
      this.shakeTime -= dt;
      TANK.main.Renderer2D.camera.x += -5 + Math.random() * 10;
      TANK.main.Renderer2D.camera.y += -5 + Math.random() * 10;
    }
  };

  //
  // Render
  //
  this.draw = function(ctx, camera)
  {

  };
});