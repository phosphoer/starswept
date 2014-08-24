TANK.registerComponent('Ship')

.includes(['Pos2D', 'Velocity', 'Lights', 'Engines', 'Collider2D', 'Weapons', 'OrderTarget'])

.construct(function()
{
  this.zdepth = 2;

  this.thrustOn = false;
  this.thrustAlpha = 0;
  this.heading = 0;
  this.desiredSpeed = 0;

  this.dead = false;

  this.shipData = null;
  this.faction = null;
  this.deadTimer = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  // Set up collision
  this._entity.Collider2D.collisionLayer = 'ships';
  this._entity.Collider2D.collidesWith = ['bullets'];

  // Get some data from ship
  this.image = this.shipData.__proto__.image;
  this.imageNormals = this.shipData.__proto__.imageNormals;
  this.lightBuffers = this.shipData.__proto__.lightBuffers;
  this.health = this.shipData.health;

  // Create texture buffers
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();
  this.collisionBuffer = new PixelBuffer();

  // Set sizes for things
  this._entity.Lights.lights = this.shipData.lights;
  this._entity.Lights.width = this.image.width;
  this._entity.Lights.height = this.image.height;
  this._entity.Lights.redrawLights();
  this._entity.Collider2D.width = this.image.width * TANK.main.Game.scaleFactor;
  this._entity.Collider2D.height = this.image.height * TANK.main.Game.scaleFactor;
  this._entity.Clickable.width = this.image.width * TANK.main.Game.scaleFactor;
  this._entity.Clickable.height = this.image.height * TANK.main.Game.scaleFactor;
  this._entity.Weapons.width = this.image.width;
  this._entity.Weapons.height = this.image.height;
  this._entity.Engines.size = this.shipData.engineSize;

  // Setup texture buffers
  this.mainBuffer.createBuffer(this.image.width, this.image.height);
  this.damageBuffer.createBuffer(this.image.width, this.image.height);
  this.decalBuffer.createBuffer(this.image.width, this.image.height);
  this.collisionBuffer.createBuffer(this.image.width, this.image.height);
  this.collisionBuffer.context.drawImage(this.image, 0, 0);
  this.collisionBuffer.readBuffer();


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

  // Move towards a given point
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

  this.setSpeedPercent = function(percent)
  {
    this.desiredSpeed = Math.min(this.shipData.maxSpeed, this.shipData.maxSpeed * percent);
  };

  // Add damage decals to the ship
  this.addDamage = function(x, y, radius)
  {
    // Cut out radius around damage
    this.damageBuffer.setPixelRadiusRand(x, y, radius - 2, [255, 255, 255, 255], 0.7, radius, [0, 0, 0, 0], 0.0);
    this.damageBuffer.applyBuffer();

    // Draw burnt edge around damage
    this.decalBuffer.setPixelRadius(x, y, radius - 1, [200, 100, 0, 255], radius, [0, 0, 0, 50]);
    this.decalBuffer.applyBuffer();

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

  // Explode the ship
  this.explode = function()
  {
    // If we are the player, we should transfer player control to another ship
    if (this._entity.Player)
    {
      TANK.main.dispatchTimed(1, 'scanforplayership', this.faction, [t.x, t.y]);
    }

    // Remove objects
    TANK.main.removeChild(this._entity);
    TANK.main.removeChild(this.exploder);

    // Create explosion effect
    ParticleLibrary.explosionMedium(t.x, t.y);

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch('camerashake', 0.5);
  };

  this.listenTo(TANK.main, 'systemBattleEnd', function()
  {
    TANK.main.removeChild(this._entity);
  });

  // Damage response
  this.listenTo(this._entity, 'damaged', function(damage, dir, pos, owner)
  {
    // Affect trajectory
    v.x += dir[0] * 0.02;
    v.y += dir[1] * 0.02;
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += dir * 0.5;

    // Do damage
    this.health -= damage;
  });

  this.listenTo(this._entity, 'thrustOn', function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = 'on';
    this._entity.Lights.redrawLights();
  });

  this.listenTo(this._entity, 'thrustOff', function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = 'off';
    this._entity.Lights.redrawLights();
  });

  // Update loop
  this.update = function(dt)
  {
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

    // Handle engine alpha
    if (this.thrustOn)
      this.thrustAlpha += dt;
    else
      this.thrustAlpha -= dt;
    this.thrustAlpha = Math.max(0, this.thrustAlpha);
    this.thrustAlpha = Math.min(1, this.thrustAlpha);

    // Capture nearby control points
    var controlPoints = TANK.main.getChildrenWithComponent('ControlPoint');
    for (var i in controlPoints)
    {
      var e = controlPoints[i];

      // Skip control points that belong to us and aren't contested
      if (e.ControlPoint.faction && e.ControlPoint.faction.team === this.faction.team && !e.ControlPoint.pendingFaction)
        continue;

      // Try to capture or restore control point if it is within range
      var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [e.Pos2D.x, e.Pos2D.y]);
      if (dist < e.ControlPoint.captureDistance)
      {
        e.ControlPoint.tryCapture(this.faction, 0.1 * dt);
        break;
      }
    };
  };

  this.redrawShip = function()
  {
    this.mainBuffer.context.save();
    this.mainBuffer.context.clearRect(0, 0, this.mainBuffer.width, this.mainBuffer.height);
    this.mainBuffer.context.drawImage(this.image, 0, 0);

    // Draw lighting
    this.lightBuffers = this.shipData.__proto__.lightBuffers;
    var lightDir = [Math.cos(TANK.main.Game.lightDir), Math.sin(TANK.main.Game.lightDir)];
    for (var i = 0; i < this.lightBuffers.length; ++i)
    {
      var lightDirOffset = (Math.PI * 2 / this.lightBuffers.length) * i - Math.PI / 2;
      this.mainBuffer.context.globalAlpha = Math.max(0, -TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + lightDirOffset), Math.sin(t.rotation + lightDirOffset)]));
      if (this.mainBuffer.context.globalAlpha > 0)
        this.mainBuffer.context.drawImage(this.lightBuffers[i], 0, 0);
    }

    // Draw damage buffer
    this.mainBuffer.context.globalAlpha = 1;
    this.mainBuffer.context.globalCompositeOperation = 'source-atop';
    this.mainBuffer.context.drawImage(this.decalBuffer.canvas, 0, 0);
    this.mainBuffer.context.globalCompositeOperation = 'destination-out';
    this.mainBuffer.context.drawImage(this.damageBuffer.canvas, 0, 0);
    this.mainBuffer.context.restore();
  };

  this.draw = function(ctx, camera)
  {
    if (!this.lightBuffers)
      return;

    ctx.save();

    // Set up transform
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.image.width / -2, this.image.height / -2);

    // Draw the main ship buffer
    if (camera.z <= 8)
    {
      this.redrawShip();
      ctx.drawImage(this.mainBuffer.canvas, 0, 0);
    }

    if (camera.z >= 6)
    {
      // Draw ship indicator
      ctx.save();
      ctx.globalAlpha = Math.min(1, (camera.z - 6) / 4);
      ctx.scale(this.image.width, this.image.height);

      // Simple triangle for fighter
      ctx.fillStyle = this.faction ? this.faction.shipColor : '#555';
      ctx.beginPath();
      if (this.shipData.class === 1)
      {
        ctx.moveTo(0, 0.1);
        ctx.lineTo(1, 0.5);
        ctx.lineTo(0, 0.9);
      }
      // Arrow for bomber
      else if (this.shipData.class === 2)
      {
        ctx.moveTo(0.0, 0.0);
        ctx.lineTo(1.0, 0.5);
        ctx.lineTo(0.0, 1.0);
        ctx.lineTo(0.3, 0.5);
      }
      // Diamond for frigate
      else if (this.shipData.class === 3)
      {
        ctx.moveTo(0.5, 0.9);
        ctx.lineTo(1.0, 0.5);
        ctx.lineTo(0.5, 0.1);
        ctx.lineTo(0.0, 0.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw team indicator
    if (camera.z <= 6 && this.faction)
    {
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.faction.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-5, -2.5);
      ctx.lineTo(-2.5, -5);

      ctx.moveTo(this.image.width, 0);
      ctx.lineTo(this.image.width + 5, -2.5);
      ctx.lineTo(this.image.width + 2.5, -5);

      ctx.moveTo(this.image.width, this.image.height);
      ctx.lineTo(this.image.width + 5, this.image.height + 2.5);
      ctx.lineTo(this.image.width + 2.5, this.image.height + 5);

      ctx.moveTo(0, this.image.height);
      ctx.lineTo(-5, this.image.height + 2.5);
      ctx.lineTo(-2.5, this.image.height + 5);
      ctx.closePath();
      ctx.fill();
    }

    // Draw selection box
    if (this.selected)
    {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1 * camera.z;
      ctx.strokeStyle = 'rgba(150, 255, 150, 0.8)';
      ctx.strokeRect(0, 0, this.image.width, this.image.height);
    }

    ctx.restore();
  };
});