TANK.registerComponent("Ship")

.interfaces("Drawable")

.requires("Pos2D, Velocity, Lights, Collider")

.construct(function()
{
  this.zdepth = 2;
  this.image = new Image();
  this.image.src = "res/shuttle.png";

  this.lights = 
  [
    {
      x: 0, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states: 
      {
        on: {radius: 4, alpha: 0.8}, 
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 0, y: 5, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 7, y: 0, radius: 2, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
      states: 
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];

  this.up = false;
  this.left = false;
  this.right = false;
  this.down = false;
  this.trailTimer = 0;
  this.dead = false;

  this.relaodTime = 0.5;
  this.reloadTimer = 0;
  this.maxTurnSpeed = 1.5;
  this.maxSpeed = 150;
  this.health = 1;
  this.deadTimer = 0;
})

.initialize(function()
{
  var t = this.parent.Pos2D;
  var v = this.parent.Velocity;

  this.parent.Collider.collisionLayer = "Ships";
  this.parent.Collider.collidesWith = ["Bullets"];

  var that = this;
  this.image.addEventListener("load", function()
  {
    that.parent.Lights.lights = that.lights;
    that.parent.Lights.width = that.image.width;
    that.parent.Lights.height = that.image.height;
    that.parent.Lights.redrawLights();

    that.parent.Collider.width = that.image.width * TANK.Game.scaleFactor;
    that.parent.Collider.height = that.image.height * TANK.Game.scaleFactor;
  });

  this.shoot = function()
  {
    if (this.reloadTimer < 0)
    {
      this.reloadTimer = this.relaodTime;
      var e = TANK.createEntity("Bullet");
      e.Pos2D.x = t.x + Math.cos(t.rotation) * 75;
      e.Pos2D.y = t.y + Math.sin(t.rotation) * 75;
      e.Velocity.x = Math.cos(t.rotation) * 800;
      e.Velocity.y = Math.sin(t.rotation) * 800;
      e.Life.life = 5;
      TANK.addEntity(e);
    }
  };

  // Movement functions
  this.startUp = function() 
  {
    if (this.up || this.dead)
      return;
    this.up = true;
    for (var i = 0; i < this.lights.length; ++i)
      if (this.lights[i].isEngine)
        this.lights[i].state = "on";
    this.parent.Lights.redrawLights();
  };
  this.stopUp = function()
  {
    if (!this.up)
      return;
    this.up = false;
    for (var i = 0; i < this.lights.length; ++i)
      if (this.lights[i].isEngine)
        this.lights[i].state = "off";
    this.parent.Lights.redrawLights();
  };
  this.startLeft = function() {this.left = true;};
  this.stopLeft = function() {this.left = false;};
  this.startRight = function() {this.right = true;};
  this.stopRight = function() {this.right = false;};
  this.startDown = function() {this.down = true;};
  this.stopDown = function() {this.down = false;};

  // Move towards a given point
  this.moveTowards = function(pos)
  {
    var dir = Math.getDirectionToPoint([t.x, t.y], t.rotation, pos);
    if (dir < -0.1)
    {
      this.startLeft();
      this.stopRight();
    }
    else if (dir > 0.1)
    {
      this.startRight();
      this.stopLeft();
    }
    else
    {
      this.startUp();
      this.stopLeft();
      this.stopRight();
      v.r *= 0.95;
    }
  };

  // Explode the ship 
  this.explode = function()
  {
    // Remove object and spawn particles
    TANK.removeEntity(this.parent);
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
      TANK.addEntity(e);
    }

    // Shake screen if on camera
    var camera = TANK.RenderManager.camera;
    var dist = TANK.Math.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < window.innerWidth / 2)
      TANK.dispatchEvent("OnCameraShake", 0.5);
  };

  // Collision response
  this.OnCollide = function(obj)
  {
    if (obj.Bullet)
    {
      v.x += obj.Velocity.x * 0.02;
      v.y += obj.Velocity.y * 0.02;
      var dir = Math.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + obj.Velocity.x, t.y + obj.Velocity.y]);
      v.r += dir * 0.5;
      this.health -= 0.2;
    }
  };

  // Update loop
  this.addEventListener("OnEnterFrame", function(dt)
  {
    // Check if dead
    if (this.health < 0 && !this.dead)
    {
      this.deadTimer = 1.5 + Math.random() * 1.5;
      this.dead = true;
    }

    if (this.deadTimer < 0)
    {
      this.explode();
    }

    if (this.dead)
    {
      this.deadTimer -= dt;
      return;
    }

    // Apply movement
    if (this.up)
    {
      v.x += Math.cos(t.rotation) * dt * 50;
      v.y += Math.sin(t.rotation) * dt * 50;
    }
    if (this.down)
    {
      v.x += Math.cos(t.rotation) * dt * -50;
      v.y += Math.sin(t.rotation) * dt * -50;
    }
    if (this.left)
    {
      v.r -= dt * 2;
    }
    if (this.right)
    {
      v.r += dt * 2;
    }

    // Cap movement
    if (Math.abs(v.r) > this.maxTurnSpeed)
      v.r *= 0.95;
    var speed = Math.sqrt(v.x * v.x + v.y * v.y);
    if (speed > this.maxSpeed)
    {
      var moveAngle = Math.atan2(v.y, v.x);
      v.x = Math.cos(moveAngle) * this.maxSpeed;
      v.y = Math.sin(moveAngle) * this.maxSpeed;
    }

    // Timers
    this.reloadTimer -= dt;
    this.trailTimer -= dt;

    // Spawn engine trail effect
    if (this.trailTimer < 0)
    {
      for (var i = 0; i < this.lights.length; ++i)
      {
        var light = this.lights[i];
        if (light.isEngine && light.state === "on")
        {
          var e = TANK.createEntity("Glow");
          var x = (light.x - this.image.width / 2) * TANK.Game.scaleFactor;
          var y = (light.y - this.image.height / 2) * TANK.Game.scaleFactor;
          e.Pos2D.x = x * Math.cos(t.rotation) - y * Math.sin(t.rotation);
          e.Pos2D.y = y * Math.cos(t.rotation) + x * Math.sin(t.rotation);
          e.Pos2D.x += t.x;
          e.Pos2D.y += t.y;
          e.Velocity.x = Math.cos(t.rotation) * -120;
          e.Velocity.y = Math.sin(t.rotation) * -120;
          e.Glow.alphaDecay = 0.8;
          e.Life.life = 3;
          TANK.addEntity(e);
        }
      }
      this.trailTimer = 0.03;
    }
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();

    // Draw ship
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.Game.scaleFactor, TANK.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.image.width / -2, this.image.height / -2);
    ctx.drawImage(this.image, 0, 0);

    ctx.restore();
  };
});