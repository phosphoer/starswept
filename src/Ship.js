TANK.registerComponent("Ship")

.includes(["Pos2D", "Velocity", "Lights", "Collider2D", "Weapons"])

.construct(function()
{
  this.zdepth = 2;
  this.image = new Image();
  this.imageEngine = new Image();
  this.imageLighting =
  {
    left: new Image(),
    right: new Image(),
    front: new Image(),
    back: new Image()
  };
  this.imageLoaded = false;

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
  this._entity.Collider2D.collisionLayer = "ships";
  this._entity.Collider2D.collidesWith = ["bullets"];

  // Get some data from ship
  this.image.src = this.shipData.image;
  this.imageEngine.src = this.shipData.imageEngine;
  for (var i in this.imageLighting)
    this.imageLighting[i].src = this.shipData.imageLighting[i];
  this.health = this.shipData.health;

  // Create damage buffer
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();

  // Wait for main image to load
  var that = this;
  this.image.addEventListener("load", function()
  {
    that.imageLoaded = true;

    // Set sizes for things
    that._entity.Lights.lights = that.shipData.lights;
    that._entity.Lights.width = that.image.width;
    that._entity.Lights.height = that.image.height;
    that._entity.Lights.redrawLights();
    that._entity.Collider2D.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Collider2D.height = that.image.height * TANK.main.Game.scaleFactor;
    that._entity.Weapons.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Weapons.height = that.image.height * TANK.main.Game.scaleFactor;

    // Setup damage buffer
    that.mainBuffer.createBuffer(that.image.width, that.image.height);
    that.damageBuffer.createBuffer(that.image.width, that.image.height);
    that.decalBuffer.createBuffer(that.image.width, that.image.height);
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

  // Add damage decals to the ship
  this.addDamage = function(x, y, radius)
  {
    // Cut out radius around damage
    this.damageBuffer.setPixelRadiusRand(x, y, radius - 2, [255, 255, 255, 255], 0.7, radius, [0, 0, 0, 0], 0.0);

    // Draw burnt edge around damage
    this.decalBuffer.setPixelRadius(x, y, radius - 1, [200, 100, 0, 255], radius, [0, 0, 0, 50]);


    this.damageBuffer.applyBuffer();
    this.decalBuffer.applyBuffer();
  };

  // Explode the ship
  this.explode = function()
  {
    // Remove object and spawn particles
    TANK.main.removeChild(this._entity);
    for (var i = 0; i < 60; ++i)
    {
      var e = TANK.createEntity("Glow");
      var rotation = Math.random() * Math.PI * 2;
      var speed = 75 + Math.random() * 150;
      e.Pos2D.x = t.x - this.image.width / 2 + Math.random() * this.image.width / 2;
      e.Pos2D.y = t.y - this.image.height / 2 + Math.random() * this.image.height / 2;
      e.Velocity.x = Math.cos(rotation) * speed;
      e.Velocity.y = Math.sin(rotation) * speed;
      e.Glow.alphaDecay = 0.3 + Math.random() * 0.5;
      e.Glow.friction = 0.99 - Math.random() * 0.08;
      e.Glow.innerRadius = 4 + Math.random() * 6.5;
      e.Glow.radius = e.Glow.innerRadius + 7 + Math.random() * 14;
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
      if (Math.random() < 0.05)
      {
        var x = Math.random() * this.image.width;
        var y= Math.random() * this.image.height;
        this.addDamage(x, y, 3 + Math.random() * 8);

        var e = TANK.createEntity("Glow");
        var rotation = Math.random() * Math.PI * 2;
        var speed = 75 + Math.random() * 150;
        e.Pos2D.x = t.x - this.image.width / 2 + Math.random() * this.image.width / 2;
        e.Pos2D.y = t.y - this.image.height / 2 + Math.random() * this.image.height / 2;
        e.Velocity.x = Math.cos(rotation) * speed;
        e.Velocity.y = Math.sin(rotation) * speed;
        e.Glow.alphaDecay = 0.3 + Math.random() * 0.5;
        e.Glow.friction = 0.99 - Math.random() * 0.08;
        e.Glow.innerRadius = 4 + Math.random() * 6.5;
        e.Glow.radius = e.Glow.innerRadius + 7 + Math.random() * 14;
        e.Glow.colorA = "rgba(255, 255, 210, 0.6)";
        e.Glow.colorB = "rgba(255, 255, 150, 0.3)";
        e.Glow.colorC = "rgba(180, 20, 20, 0.0)";
        e.Life.life = 5;
        TANK.main.addChild(e);
      }

      this.deadTimer -= dt;
      return;
    }

    // Apply heading logic
    var headingVec = [Math.cos(this.heading), Math.sin(this.heading)];
    var dir = TANK.Math2D.getDirectionToPoint([0, 0], t.rotation, headingVec);
    if (dir < -0.1)
      v.r -= dt * this.shipData.turnAccel;
    else if (dir > 0.1)
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

    // Handle engine alpha
    if (this.thrustOn)
      this.thrustAlpha += dt;
    else
      this.thrustAlpha -= dt;
    this.thrustAlpha = Math.max(0, this.thrustAlpha);
    this.thrustAlpha = Math.min(1, this.thrustAlpha);

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

  this.redrawShip = function()
  {
    this.mainBuffer.context.save();
    this.mainBuffer.context.clearRect(0, 0, this.mainBuffer.width, this.mainBuffer.height);
    this.mainBuffer.context.drawImage(this.image, 0, 0);

    // Draw lighting
    var lightDir = [Math.cos(TANK.main.Game.lightDir), Math.sin(TANK.main.Game.lightDir)];
    this.mainBuffer.context.globalAlpha = Math.max(0, TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + Math.PI / 2), Math.sin(t.rotation + Math.PI / 2)]));
    this.mainBuffer.context.drawImage(this.imageLighting.right, 0, 0);

    this.mainBuffer.context.globalAlpha = Math.max(0, TANK.Math2D.dot(lightDir, [Math.cos(t.rotation - Math.PI / 2), Math.sin(t.rotation - Math.PI / 2)]));
    this.mainBuffer.context.drawImage(this.imageLighting.left, 0, 0);

    this.mainBuffer.context.globalAlpha = Math.max(0, TANK.Math2D.dot(lightDir, [Math.cos(t.rotation), Math.sin(t.rotation)]));
    this.mainBuffer.context.drawImage(this.imageLighting.front, 0, 0);

    this.mainBuffer.context.globalAlpha = Math.max(0, TANK.Math2D.dot(lightDir, [Math.cos(t.rotation + Math.PI), Math.sin(t.rotation + Math.PI)]));
    this.mainBuffer.context.drawImage(this.imageLighting.back, 0, 0);

    // Draw damage buffer
    this.mainBuffer.context.globalAlpha = 1;
    this.mainBuffer.context.globalCompositeOperation = "source-atop";
    this.mainBuffer.context.drawImage(this.decalBuffer.canvas, 0, 0);
    this.mainBuffer.context.globalCompositeOperation = "destination-out";
    this.mainBuffer.context.drawImage(this.damageBuffer.canvas, 0, 0);
    this.mainBuffer.context.restore();
  };

  this.draw = function(ctx, camera)
  {
    if (!this.imageLoaded)
      return;

    ctx.save();

    // Set up transform
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.image.width / -2, this.image.height / -2);

    // Draw the main ship buffer
    this.redrawShip();
    ctx.drawImage(this.mainBuffer.canvas, 0, 0);

    // Draw engine
    if (this.thrustOn || this.thrustAlpha > 0)
    {
      ctx.globalAlpha = this.thrustAlpha;
      ctx.drawImage(this.imageEngine, 0, 0);
    }

    ctx.restore();
  };
});