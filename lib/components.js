(function()
{
  "use strict";

  TANK.registerComponent("Collider2D")
  .includes("Pos2D")
  .construct(function ()
  {
    this.width = 0;
    this.height = 0;
    this.ignored = {};
    this.collisionLayer = "";
    this.collidesWith = [""];
  })
  .initialize(function ()
  {
    this.update = function(dt)
    {
      var colliders = this._entity._parent.getChildrenWithComponent("Collider2D");
      for (var i in colliders)
      {
        var collider = colliders[i].Collider2D;
        if (collider === this)
          continue;

        if (this.collidesWith.length > 0 && this.collidesWith.indexOf(collider.collisionLayer) < 0)
          continue;

        if (this.collide(collider))
        {
          this._entity.dispatch("collide", collider._entity);
        }
      }
    };

    this.collide = function (other)
    {
      if (this.width === 0 || this.height === 0)
      {
        return TANK.Math2D.pointInOBB([this._entity.Pos2D.x, this._entity.Pos2D.y],
                               [other._entity.Pos2D.x, other._entity.Pos2D.y], [other.width, other.height],
                               other._entity.Pos2D.rotation);
      }
      else if (other.width === 0 || other.height === 0)
      {
        return TANK.Math2D.pointInOBB([other._entity.Pos2D.x, other._entity.Pos2D.y],
                               [this._entity.Pos2D.x, this._entity.Pos2D.y], [this.width, this.height],
                               this._entity.Pos2D.rotation);
      }
      else
      {
        return TANK.Math2D.AABBInAABB([this._entity.Pos2D.x, this._entity.Pos2D.y], [this.width, this.height],
                               [other._entity.Pos2D.x, other._entity.Pos2D.y], [other.width, other.height]);
      }
      return false;
    };
  });

})();
(function()
{
  "use strict";

  TANK.registerComponent("Image")
  .includes("Pos2D")
  .construct(function ()
  {
    this.zdepth = 0;
    this.image = new Image();
    this.scale = 1;
    this.pivotPoint = [0, 0];
  })
  .initialize(function()
  {
    // Store some components
    var t = this._entity.Pos2D;

    // Check if we can find a render manager to register with
    if (!this._entity._parent)
    {
      console.error("The Entity the Image component was added to has no parent");
      return;
    }
    else if (!this._entity._parent.Renderer2D)
    {
      console.error("The Image component couldn't find a Renderer2D to register with");
      return;
    }

    // Add ourselves to render manager
    this._entity._parent.Renderer2D.add(this);

    // Draw function
    this.draw = function(ctx, camera)
    {
      if (!this.image)
        return;

      ctx.save();
      ctx.translate(t.x - camera.x, t.y - camera.y);
      ctx.rotate(t.rotation);
      ctx.scale(this.scale, this.scale);
      ctx.translate(this.image.width / -2 + this.pivotPoint[0], this.image.height / -2 + this.pivotPoint[1]);
      ctx.drawImage(this.image, 0, 0);
      ctx.restore();
    };
  });

})();
(function()
{
  "use strict";

  TANK.registerComponent("Input")
  .construct(function()
  {
    this.context = null;
    this.mousePos = [0, 0];
    this.lastMousePos = [0, 0];
    this.mouseDelta = [0, 0];

    this._keysHeld = [];

    this._events =
    [
      "keydown",
      "keyup",
      "mousemove",
      "mousedown",
      "mouseup",
      "touchmove",
      "touchstart",
      "touchend",
      "mousewheel",
      "contextmenu",
      "gestureend",
      "gesturechange"
    ];

    this._noContextEvents =
    {
      "keydown": true,
      "keyup": true
    };
  })
  .initialize(function()
  {
    var context = this.context || window;
    var that = this;

    var eventHandler = function(e)
    {
      e.preventDefault();

      var shouldAdd = true;

      if (e.type === "mousemove")
      {
        that.lastMousePos[0] = that.mousePos[0];
        that.lastMousePos[1] = that.mousePos[1];
        that.mousePos[0] = e.x - (that.context ? that.context.offsetLeft : 0);
        that.mousePos[1] = e.y - (that.context ? that.context.offsetTop : 0);
        that.mouseDelta = TANK.Math2D.subtract(that.mousePos, that.lastMousePos);
      }

      if (e.type === "keydown")
      {
        if (that._keysHeld[e.keyCode])
          shouldAdd = false;
        else
          that._keysHeld[e.keyCode] = true;
      }

      if (e.type === "keyup")
      {
        if (!that._keysHeld[e.keyCode])
          shouldAdd = false;
        else
          that._keysHeld[e.keyCode] = false;
      }

      if (e.type === "mousedown")
        that._keysHeld[e.button] = true;
      else if (e.type === "mouseup")
        that._keysHeld[e.button] = false;

      if (shouldAdd)
        that._entity.dispatchNextFrame(e.type, e);
    };

    this.addListeners = function()
    {
      for (var i = 0; i < this._events.length; ++i)
      {
        if (this._noContextEvents[this._events[i]])
          window.addEventListener(this._events[i], eventHandler);
        else
          context.addEventListener(this._events[i], eventHandler);
      }
    };

    this.removeListeners = function()
    {
      for (var i = 0; i < this._events.length; ++i)
      {
        if (this._noContextEvents[this._events[i]])
          window.removeEventListener(this._events[i], eventHandler);
        else
          context.removeEventListener(this._events[i], eventHandler);
      }
    };

    this.isDown = function(keyCode)
    {
      return this._keysHeld[keyCode];
    };

    this.addListeners();
  })
  .uninitialize(function()
  {
    this.removeListeners();
  });

})();
(function()
{
  "use strict";

  var Particle = function()
  {
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.vx = 0;
    this.vy = 0;
    this.vr = 0;
    this.life = 0;
    this.alpha = 1;
    this.scale = 1;
    this.friction = 1;
    this.alphaDecay = 1;
    this.scaleDecay = 1;
  };

  TANK.registerComponent("ParticleEmitter")
  .includes("Pos2D")
  .construct(function()
  {
    this.zdepth = 1;
    this.particleImage = new Image();
    this.blendMode = "lighter";

    this.spawning = true;
    this.spawnOffsetMin = [0, 0];
    this.spawnOffsetMax = [0, 0];
    this.spawnSpeedMin = 10;
    this.spawnSpeedMax = 15;
    this.spawnAngleMin = 0;
    this.spawnAngleMax = Math.PI * 2;
    this.spawnRotationMin = 0;
    this.spawnRotationMax = Math.PI * 2;
    this.spawnAlphaMin = 1;
    this.spawnAlphaMax = 1;
    this.spawnScaleMin = 1;
    this.spawnScaleMax = 1.3;
    this.spawnPerSecond = 10;
    this.spawnDuration = 0;

    this.particleLifeMin = 1;
    this.particleLifeMax = 3;
    this.particleFrictionMin = 0.90;
    this.particleFrictionMax = 0.95;
    this.particleAlphaDecayMin = 0.9;
    this.particleAlphaDecayMax = 0.95;
    this.particleRotateSpeedMin = 0;
    this.particleRotateSpeedMax = 1;
    this.particleScaleDecayMin = 0.95;
    this.particleScaleDecayMax = 0.98;

    this.alignRotationToSpawnAngle = false;
    this.globalForce = [0, 0];
    this.particleUpdateFunc = null;
    this.particleDrawFunc = null;

    this.particles = [];
    this.deleted = [];
    this.spawnTimer = 0;
    this.spawnAccum = 0;
  })
  .initialize(function()
  {
    var t = this._entity.Pos2D;

    // Check if we can find a render manager to register with
    if (!this._entity._parent)
    {
      console.error("The Entity the ParticleEmitter was added to has no parent");
      return;
    }
    else if (!this._entity._parent.Renderer2D)
    {
      console.error("The ParticleEmitter couldn't find a Renderer2D to register with");
      return;
    }

    // Add ourselves to render manager
    this._entity._parent.Renderer2D.add(this);

    this.update = function(dt)
    {
      // Timers
      this.spawnTimer += dt;

      // Stop spawning after specified duration
      if (this.spawnTimer > this.spawnDuration && this.spawnDuration > 0)
        this.spawning = false;

      // Spawn new particles
      if (this.spawning)
      {
        this.spawnAccum += this.spawnPerSecond * dt;
        if (this.spawnAccum >= 1)
        {
          var spawnCount = Math.floor(this.spawnAccum);
          for (var i = 0; i < spawnCount; ++i)
          {
            var p = new Particle();
            var dir = this.spawnAngleMin + Math.random() * (this.spawnAngleMax - this.spawnAngleMin);
            var speed = this.spawnSpeedMin + Math.random() * (this.spawnSpeedMax - this.spawnSpeedMin);
            p.vx = Math.cos(dir) * speed;
            p.vy = Math.sin(dir) * speed;
            p.life = this.particleLifeMin + Math.random() * (this.particleLifeMax - this.particleLifeMin);
            p.x = t.x + this.spawnOffsetMin[0] + Math.random() * (this.spawnOffsetMax[0] - this.spawnOffsetMin[0]);
            p.y = t.y + this.spawnOffsetMin[1] + Math.random() * (this.spawnOffsetMax[1] - this.spawnOffsetMin[1]);
            p.r = this.spawnRotationMin + Math.random() * (this.spawnRotationMax - this.spawnRotationMin);
            p.vr = this.particleRotateSpeedMin + Math.random() * (this.particleRotateSpeedMax - this.particleRotateSpeedMin);
            p.alpha = this.spawnAlphaMin + Math.random() * (this.spawnAlphaMax - this.spawnAlphaMin);
            p.scale = this.spawnScaleMin + Math.random() * (this.spawnScaleMax - this.spawnScaleMin);
            p.friction = this.particleFrictionMin + Math.random() * (this.particleFrictionMax - this.particleFrictionMin);
            p.alphaDecay = this.particleAlphaDecayMin + Math.random() * (this.particleAlphaDecayMax - this.particleAlphaDecayMin);
            p.scaleDecay = this.particleScaleDecayMin + Math.random() * (this.particleScaleDecayMax - this.particleScaleDecayMin);
            if (this.alignRotationToSpawnAngle)
              p.r = dir;
            this.particles.push(p);
          }
          this.spawnAccum -= spawnCount;
        }
      }

      // Update existing particles
      for (var i = 0; i < this.particles.length; ++i)
      {
        var p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vx += this.globalForce[0] * dt;
        p.vy += this.globalForce[1] * dt;
        p.alpha *= p.alphaDecay;
        p.scale *= p.scaleDecay;
        if (this.particleUpdateFunc)
          this.particleUpdateFunc(p, dt);
        if (p.life < 0)
          this.deleted.push(i);
      }

      // Delete dead particles
      for (var i = 0; i < this.deleted.length; ++i)
        this.particles.splice(this.deleted[i], 1);
      this.deleted = [];
    };

    this.draw = function(ctx, camera, dt)
    {
      // Draw particles
      for (var i = 0; i < this.particles.length; ++i)
      {
        ctx.save();
        ctx.globalCompositeOperation = this.blendMode;
        var p = this.particles[i];

        ctx.translate(p.x - camera.x, p.y - camera.y);
        ctx.scale(p.scale, p.scale);
        ctx.rotate(p.r);
        if (this.particleImage.width)
          ctx.translate(-this.particleImage.width / 2, -this.particleImage.height / 2);
        ctx.globalAlpha = p.alpha;

        if (this.particleDrawFunc)
          this.particleDrawFunc(p, ctx, camera, dt);
        else
          ctx.drawImage(this.particleImage, 0, 0);

        ctx.restore();
      }
    };
  });

})();
(function()
{
  "use strict";

  TANK.registerComponent("Pos2D")
  .construct(function()
  {
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
  })
  .serialize(function(serializer)
  {
    serializer.property(this, 'x', 0);
    serializer.property(this, 'y', 0);
  });

})();
(function()
{
  "use strict";

  TANK.registerComponent("Renderer2D")

  .construct(function()
  {
    this.context = null;
    this.camera = {x: 0, y: 0, z: 1};
    this.clearColor = "#000";
    this.nearestNeighbor = true;
    this._drawables = {};
    this._drawablesSorted = [];
  })

  .initialize(function()
  {
    // Add a component to be drawn
    this.add = function(component)
    {
      if (component.zdepth === undefined)
      {
        console.warn("A component was added to Renderer2D with an undefined zdepth");
        component.zdepth = 0;
      }
      this._drawables[component._name + component._entity._id] = component;
      this._sort();
    };

    // Remove a component from drawing
    this.remove = function(component)
    {
      delete this._drawables[component._name + component._entity._id];
      this._sort();
    };

    this._sort = function()
    {
      this._drawablesSorted = [];
      for (var i in this._drawables)
        this._drawablesSorted.push(this._drawables[i]);
      this._drawablesSorted.sort(function (a, b)
      {
        return a.zdepth - b.zdepth;
      });
    };

    this.update = function(dt)
    {
      if (!this.context)
        return;

      // Nearest neighbor
      if (this.nearestNeighbor)
      {
        this.context.imageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
      }

      // Clear screen
      this.context.save();
      this.context.fillStyle = this.clearColor;
      this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
      this.context.restore();

      // Translate camera to center of screen
      // and scale for zoom
      this.context.save();
      this.context.translate(this.context.canvas.width / 2, this.context.canvas.height / 2);
      this.context.scale(1 / this.camera.z, 1 / this.camera.z);

      // Draw all drawables
      var isDirty = false;
      var component;
      for (var i = 0; i < this._drawablesSorted.length; ++i)
      {
        component = this._drawablesSorted[i];
        if (!component._initialized)
        {
          delete this._drawables[component._name + component._entity._id];
          isDirty = true;
        }
        else
          this._drawablesSorted[i].draw(this.context, this.camera, dt);
      }
      this.context.restore();

      if (isDirty)
        this._sort();
    };
  });
})();
(function()
{
  "use strict";

  TANK.registerComponent("Velocity")
  .includes("Pos2D")
  .construct(function()
  {
    this.x = 0;
    this.y = 0;
    this.r = 0;
  })
  .initialize(function()
  {
    this.getSpeed = function()
    {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    this.update = function(dt)
    {
      var t = this._entity.Pos2D;
      t.x += this.x * dt;
      t.y += this.y * dt;
      t.rotation += this.r * dt;
    };
  });

})();