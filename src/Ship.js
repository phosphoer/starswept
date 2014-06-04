TANK.registerComponent("Ship")

.includes(["Pos2D", "Velocity", "Lights", "Collider2D", "Weapons"])

.construct(function()
{
  this.zdepth = 2;
  this.image = new Image();

  this.thrustOn = false;
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

  this._entity.Collider2D.collisionLayer = "ships";
  this._entity.Collider2D.collidesWith = ["bullets"];

  this.image.src = this.shipData.image;
  this.health = this.shipData.health;

  var that = this;
  this.image.addEventListener("load", function()
  {
    that._entity.Lights.lights = that.shipData.lights;
    that._entity.Lights.width = that.image.width;
    that._entity.Lights.height = that.image.height;
    that._entity.Lights.redrawLights();

    that._entity.Collider2D.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Collider2D.height = that.image.height * TANK.main.Game.scaleFactor;
    that._entity.Weapons.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Weapons.height = that.image.height * TANK.main.Game.scaleFactor;
  });

  // Add weapons
  for (var i in this.shipData.guns)
  {
    var gunData = this.shipData.guns[i];
    var gun = this._entity.Weapons.guns[i];
    for (var j in gunData)
      gun[j] = gunData[j];
  };

  // Move towards a given point
  this.moveTowards = function(pos)
  {
    this.heading = Math.atan2(pos[1] - t.y, pos[0] - t.x);
    this.desiredSpeed = this.shipData.maxSpeed;
  };

  // Explode the ship
  this.explode = function()
  {
    // Remove object and spawn particles
    TANK.main.removeChild(this._entity);
    for (var i = 0; i < 150; ++i)
    {
      var e = TANK.createEntity("Glow");
      var rotation = Math.random() * Math.PI * 2;
      var speed = 100 + Math.random() * 300;
      e.Pos2D.x = t.x - 50 + Math.random() * 100;
      e.Pos2D.y = t.y - 50 + Math.random() * 100;
      e.Velocity.x = Math.cos(rotation) * speed;
      e.Velocity.y = Math.sin(rotation) * speed;
      e.Glow.alphaDecay = 0.7 + Math.random() * 0.5;
      e.Glow.friction = 0.99 - Math.random() * 0.05;
      e.Glow.innerRadius = 1 + Math.random() * 1.5;
      e.Glow.radius = e.Glow.innerRadius + 4 + Math.random() * 4;
      e.Glow.colorA = "rgba(255, 255, 210, 0.6)";
      e.Glow.colorB = "rgba(255, 255, 150, 0.3)";
      e.Glow.colorC = "rgba(180, 20, 20, 0.0)";
      e.Life.life = 5;
      TANK.main.addChild(e);
    }

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch("camerashake", 0.5);
  };

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, owner)
  {
    v.x += dir[0] * 0.02;
    v.y += dir[1] * 0.02;
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += dir * 0.5;
    this.health -= damage;
  });

  this.listenTo(this._entity, "thrustOn", function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = "on";
    this._entity.Lights.redrawLights();
  });

  this.listenTo(this._entity, "thrustOff", function()
  {
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = "off";
    this._entity.Lights.redrawLights();
  });

  // Update loop
  this.update = function(dt)
  {
    // Check if dead
    if (this.health < 0 && !this.dead)
    {
      this.deadTimer = 1.5 + Math.random() * 1.5;
      this.dead = true;
    }

    // Explode after a bit of time
    if (this.deadTimer < 0)
      this.explode();
    if (this.dead)
    {
      this.deadTimer -= dt;
      return;
    }

    // Apply heading logic
    var headingVec = [Math.cos(this.heading), Math.sin(this.heading)];
    var dir = TANK.Math2D.getDirectionToPoint([0, 0], t.rotation, headingVec);
    if (dir < -0.1)
      v.r -= dt * 2;
    else if (dir > 0.1)
      v.r += dt * 2;
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
      v.x += Math.cos(t.rotation) * dt * 50;
      v.y += Math.sin(t.rotation) * dt * 50;
      if (!this.thrustOn)
        this._entity.dispatch("ThrustOn");
      this.thrustOn = true;
    }
    // Otherwise, turn off the thrusters
    else
    {
      if (this.thrustOn)
        this._entity.dispatch("ThrustOff");
      this.thrustOn = false;
    }
    // Slow down if moving faster than we want
    if (currentSpeed > this.desiredSpeed + 1)
    {
      v.x *= 0.99;
      v.y *= 0.99;
    }
    // Correct trajectory
    v.x += correctionVec[0] * dt * 0.05;
    v.y += correctionVec[1] * dt * 0.05;

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

    // Capture nearby control points
    var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
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

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Draw ship
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.image.width / -2, this.image.height / -2);
    ctx.drawImage(this.image, 0, 0);

    ctx.restore();
  };
});