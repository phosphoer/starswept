TANK.registerComponent('Ship')

.includes(['Pos2D', 'Velocity', 'LightingAndDamage', 'Engines', 'PixelCollider', 'Weapons', 'SoundEmitter', 'ShipIndicator'])

.construct(function()
{
  this.zdepth = 2;

  this.thrustOn = false;
  this.thrustAlpha = 0;
  this.heading = 0;
  this.desiredSpeed = 0;
  this.warpCharge = 0;
  this.warpChargeTime = 5;
  this.warpJammed = false;
  this.fuel = 0;
  this.shieldTimer = 5;
  this.shieldRecharging = false;

  this.dead = false;

  this.iff = 0;
  this.shipType = '';
  this.shipData = null;
  this.deadTimer = 0;
})

.serialize(function(serializer)
{
  serializer.property(this, 'shipType', '');
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Get some data from ship
  if (!this.shipData && this.shipType)
    this.shipData = new Ships[this.shipType]();
  this.resource = TANK.main.Resources.get(this.shipData.resource);
  this.health = this.shipData.health;
  this.fuel = this.shipData.maxFuel;
  this.width = this.resource.diffuse.width;
  this.height = this.resource.diffuse.height;

  // Set up shield
  this.shieldObj = TANK.createEntity('Shield');
  this._entity.addChild(this.shieldObj);
  this.shieldObj.Shield.health = this.shipData.shield;
  this.shieldObj.Shield.maxHealth = this.shipData.shield;
  this.shieldObj.Shield.regenRate = this.shipData.shieldGen;
  this.shieldObj.Shield.radius = this.shipData.shieldRadius;
  this.shieldObj.Pos2D.x = t.x;
  this.shieldObj.Pos2D.y = t.y;

  // Set up collision
  this._entity.PixelCollider.collisionLayer = 'ships';
  this._entity.PixelCollider.collidesWith = ['bullets', 'pickups'];
  this._entity.PixelCollider.setImage(this.resource.diffuse);

  // Set up lighting
  this._entity.LightingAndDamage.setResource(this.resource);

  // Create texture buffers
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();

  // Set sizes for things
  this._entity.Weapons.width = this.width;
  this._entity.Weapons.height = this.height;
  this._entity.Engines.size = this.shipData.engineSize;
  this._entity.Engines.color = 'rgba(' + this.shipData.engineColor.join(', ') + ', 0)';
  this._entity.Engines.drawEngine();

  // Add weapons
  for (var gunSide in this.shipData.guns)
  {
    var guns = this.shipData.guns[gunSide];
    for (var j = 0; j < guns.length; ++j)
    {
      var gunData = guns[j];
      var gun = new Guns[gunData.type]();
      gun.x = gunData.x;
      gun.y = gunData.y;
      this._entity.Weapons.addGun(gun, gunSide);
    }
  };

  //
  // Move towards a given point
  //
  this.moveTowards = function(pos, speedPercent)
  {
    this.heading = Math.atan2(pos[1] - t.y, pos[0] - t.x);

    // Set speed
    if (typeof speedPercent === 'undefined')
      this.setSpeedPercent(1)
    else
      this.setSpeedPercent(speedPercent)

    // If not facing in the right direction just turn off engines
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, pos);
    if (Math.abs(dir) > 0.3)
      this.setSpeedPercent(0);
  };

  //
  // Set speed
  //
  this.setSpeedPercent = function(percent)
  {
    this.desiredSpeed = Math.min(this.shipData.maxSpeed, this.shipData.maxSpeed * percent);
  };

  //
  // Apply damage
  //
  this.addDamage = function(x, y, radius)
  {
    this._entity.LightingAndDamage.addDamage(x, y, radius);
    this._entity.SoundEmitter.play('hit-01');

    // Do damage to weapons on the ship
    for (var side in this._entity.Weapons.guns)
    {
      var guns = this._entity.Weapons.guns[side];
      for (var i = 0; i < guns.length; ++i)
      {
        var gun = guns[i];
        if (TANK.Math2D.pointDistancePoint([x, y], [gun.x, gun.y]) < radius)
        {
          this._entity.Weapons.removeGun(gun, side);
          i = 0;
        }
      }
    }
  };

  this.addRandomDamage = function(radius)
  {
    var x = Math.random() * this.width;
    var y = Math.random() * this.height;
    this.addDamage(x, y, radius);
  };

  //
  // Explode the ship
  //
  this.explode = function()
  {
    this._entity.dispatch('explode');

    // Remove objects
    TANK.main.removeChild(this._entity);
    TANK.main.removeChild(this.exploder);

    // Create explosion effect
    ParticleLibrary.explosionMedium(t.x, t.y);
    this._entity.SoundEmitter.play(this.shipData.explodeSound);

    // Create some fuel spawns
    var numFuelCells = Math.round(Math.random() * 2);
    for (var i = 0; i < numFuelCells; ++i)
    {
      var e = TANK.createEntity('FuelCell');
      e.Pos2D.x = t.x;
      e.Pos2D.y = t.y;
      TANK.main.addChild(e);
    }

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch('camerashake', 0.5);
  };

  //
  // Gun firing response
  //
  this.listenTo(this._entity, 'gunfired', function(gun)
  {
    this.shieldObj.Shield.disable(gun.shieldDisableTime);
  });

  //
  // Shield damage response
  //
  this.listenTo(this.shieldObj, 'shielddamaged', function(from)
  {
    this._entity.dispatch('aggro', from);
  });

  //
  // Collision response
  //
  this.listenTo(this._entity, 'collide', function(obj, pixelPos)
  {
    var objPos = [obj.Pos2D.x, obj.Pos2D.y];
    var bullet = obj.Bullet;

    if (bullet && bullet.owner !== this._entity)
    {
      // Do damage
      this.addDamage(pixelPos[0], pixelPos[1], bullet.damage * (30 + Math.random() * 30));
      this._entity.dispatch('damaged', bullet.damage, [obj.Velocity.x, obj.Velocity.y], objPos, bullet.owner);
      obj.Life.life = 0;

      // Spawn effect
      ParticleLibrary[bullet.damageEffect](objPos[0], objPos[1], obj.Pos2D.rotation + Math.PI);

      // Shake screen if on camera
      var camera = TANK.main.Renderer2D.camera;
      var dist = TANK.Math2D.pointDistancePoint(objPos, [camera.x, camera.y]);
      if (dist < 1) dist = 1;
      if (dist < window.innerWidth / 2)
        TANK.main.dispatch('camerashake', 0.1 / dist);
    }
  });

  //
  // Damage response
  //
  this.listenTo(this._entity, 'damaged', function(damage, dir, pos, owner)
  {
    // Affect trajectory
    v.x += dir[0] * damage * 0.1;
    v.y += dir[1] * damage * 0.1;
    var leftOrRight = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += leftOrRight * damage;

    this.health -= damage;
    this._entity.dispatch('aggro', owner);
  });

  //
  // Update loop
  //
  this.update = function(dt)
  {
    // Update shield
    this.shieldObj.Pos2D.x = t.x;
    this.shieldObj.Pos2D.y = t.y;

    // Check if dead
    if (this.health < 0 && !this.dead)
    {
      this.deadTimer = 2.5 + Math.random() * 1.5;
      this.dead = true;
      this.exploder = ParticleLibrary.slowMediumFire();
      TANK.main.addChild(this.exploder);
    }

    // Explode after a bit of time
    if (this.deadTimer < 0)
      this.explode();
    if (this.dead)
    {
      this.exploder.Pos2D.x = t.x;
      this.exploder.Pos2D.y = t.y;
      this.deadTimer -= dt;

      if (Math.random() < 0.1)
        this.addDamage(-50 + Math.random() * 100, -50 + Math.random() * 100, 4 + Math.random() * 4);
      return;
    }

    // Apply heading logic
    var headingVec = [Math.cos(this.heading), Math.sin(this.heading)];
    var currentVec = [Math.cos(t.rotation), Math.sin(t.rotation)]
    var headingDot = TANK.Math2D.dot(headingVec, currentVec);
    var dir = TANK.Math2D.getDirectionToPoint([0, 0], t.rotation, headingVec);
    if (Math.abs(1 - headingDot) > 0.01 && dir < 0)
      v.r -= dt * this.shipData.turnAccel;
    else if (Math.abs(1 - headingDot) > 0.01 && dir > 0)
      v.r += dt * this.shipData.turnAccel;
    else
      v.r *= 0.95;

    // Calculate some values for speed logic
    this.desiredSpeed = Math.min(this.desiredSpeed, this.shipData.maxSpeed);
    this.desiredSpeed = Math.max(this.desiredSpeed, 0);
    var currentSpeed = v.getSpeed();
    var moveVec = [v.x, v.y];
    var moveAngle = Math.atan2(v.y, v.x);
    var dirToHeading = TANK.Math2D.getDirectionToPoint([0, 0], moveAngle, headingVec);
    var headingSpeedVec = TANK.Math2D.scale(headingVec, this.desiredSpeed);
    var correctionVec = TANK.Math2D.subtract(headingSpeedVec, moveVec);

    // If we are moving significantly in the wrong direction, or not fast enough,
    // then we should apply thrust
    if (this.desiredSpeed > 0 && (Math.abs(dirToHeading) > 0.1 || currentSpeed < this.desiredSpeed - 1))
    {
      v.x += Math.cos(t.rotation) * dt * this.shipData.accel;
      v.y += Math.sin(t.rotation) * dt * this.shipData.accel;
      if (!this.thrustOn)
        this._entity.dispatch('ThrustOn');
      this.thrustOn = true;
    }
    // Otherwise, turn off the thrusters
    else
    {
      if (this.thrustOn)
        this._entity.dispatch('ThrustOff');
      this.thrustOn = false;
    }
    // Slow down if moving faster than we want
    if (currentSpeed > this.desiredSpeed + 1)
    {
      v.x *= 0.99;
      v.y *= 0.99;
    }
    // Correct trajectory
    v.x += correctionVec[0] * dt * 0.07;
    v.y += correctionVec[1] * dt * 0.07;

    // Cap movement
    if (Math.abs(v.r) > this.shipData.maxTurnSpeed)
      v.r *= 0.95;
    if (currentSpeed > this.shipData.maxSpeed)
    {
      var moveAngle = Math.atan2(v.y, v.x);
      v.x = Math.cos(moveAngle) * this.shipData.maxSpeed;
      v.y = Math.sin(moveAngle) * this.shipData.maxSpeed;
    }

    // Timers
    this.reloadTimer -= dt;
    this.warpCharge += dt;

    // Handle engine alpha
    if (this.thrustOn)
      this.thrustAlpha += dt;
    else
      this.thrustAlpha -= dt;
    this.thrustAlpha = Math.max(0, this.thrustAlpha);
    this.thrustAlpha = Math.min(1, this.thrustAlpha);
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Set up transform
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.resource.diffuse.width / -2, this.resource.diffuse.height / -2);

    // Draw the main ship buffer
    this._entity.LightingAndDamage.redraw();
    ctx.drawImage(this._entity.LightingAndDamage.mainBuffer.canvas, 0, 0);

    ctx.restore();
  };
});