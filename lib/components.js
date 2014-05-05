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
        context.addEventListener(this._events[i], eventHandler);
    };

    this.removeListeners = function()
    {
      for (var i = 0; i < this._events.length; ++i)
        context.removeEventListener(this._events[i], eventHandler);
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

  TANK.registerComponent("Pos2D")
  .construct(function ()
  {
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
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
      for (var i in this._drawablesSorted)
        this._drawablesSorted[i].draw(this.context, this.camera, dt);
      this.context.restore();
    };

    // Listen to Components being removed
    this.listenTo(this._entity, "componentremoved", function(component)
    {
      delete this._drawables[component._name + component._entity._id];
      this._sort();
    });
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