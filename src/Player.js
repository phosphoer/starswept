TANK.registerComponent("Player")

.includes("Ship")

.construct(function()
{
  this.zdepth = 5;
  this.shakeTime = 0;
  this.shootButtonAlpha = 0;
  this.draggingShootButton = false;
  this.dragSource = null;
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.checkForSelection = function(componentName)
  {
    var selectables = TANK.main.getChildrenWithComponent(componentName);

    // Get cursor pos
    var e = TANK.createEntity("Cursor");
    TANK.main.addChild(e);
    e.Cursor.updatePos();

    var selected = null;
    for (var i in selectables)
    {
      var selectable = selectables[i];
      if (e.Collider2D.collide(selectable.Collider2D))
      {
        selected = selectable;
        break;
      }
    }
    TANK.main.removeChild(e);

    return selected;
  };

  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (obj.Bullet && obj.owner !== this._entity)
      this.shakeCamera(0.1);
  });

  this.listenTo(TANK.main, "camerashake", function(duration)
  {
    this.shakeCamera(duration);
  });

  this.listenTo(TANK.main, "mousewheel", function(e)
  {
    var delta = e.wheelDelta;
    TANK.main.Renderer2D.camera.z += delta * 0.005 * (TANK.main.Renderer2D.camera.z * 0.1);
    if (TANK.main.Renderer2D.camera.z < 1)
      TANK.main.Renderer2D.camera.z = 1;
  });

  this.listenTo(TANK.main, "gesturechange", function(e)
  {
    if (this.draggingShootButton)
      return;

    if (e.scale)
    {
      var scale = 1 / e.scale;
      scale = Math.min(scale, 1.1);
      scale = Math.max(scale, 0.9);
      TANK.main.Renderer2D.camera.z *= scale;
      if (TANK.main.Renderer2D.camera.z < 1)
        TANK.main.Renderer2D.camera.z = 1;
      if (TANK.main.Renderer2D.camera.z > 100)
        TANK.main.Renderer2D.camera.z = 100;
    }
  });

  this.listenTo(TANK.main, "mousedown", function(e)
  {
    this.dragSource = this.checkForSelection("Draggable");
    if (this.dragSource)
    {
      this.dragSource.dispatch("dragstart");
      return;
    }

    var dist = TANK.Math2D.pointDistancePoint(TANK.main.Game.mousePosWorld, [t.x, t.y]);
    if (dist < 50)
    {
      this.draggingShootButton = true;
    }
  });

  this.listenTo(TANK.main, "mouseup", function(e)
  {
    if (this.dragSource)
    {
      this.dragDest = this.checkForSelection("Droppable");
      this.dragSource.dispatch("dragend", this.dragDest);
    }

    this.dragSource = null;
    this.dragDest = null;
    this.draggingShootButton = false;
    this._entity.Weapons.aimAt(null);
    ship.stopUp();
    ship.stopLeft();
    ship.stopRight();
  });

  this.listenTo(TANK.main, "keydown", function(e)
  {
    if (e.keyCode === TANK.Key.W)
      ship.startUp();
    if (e.keyCode === TANK.Key.S)
      ship.startDown();
    if (e.keyCode === TANK.Key.A)
      ship.startLeft();
    if (e.keyCode === TANK.Key.D)
      ship.startRight();
  });

  this.listenTo(TANK.main, "keyup", function(e)
  {
    if (e.keyCode === TANK.Key.W)
      ship.stopUp();
    if (e.keyCode === TANK.Key.S)
      ship.stopDown();
    if (e.keyCode === TANK.Key.A)
      ship.stopLeft();
    if (e.keyCode === TANK.Key.D)
      ship.stopRight();
  });

  this.update = function(dt)
  {
    // Handle mouse being held down
    if (TANK.main.Input.isDown(TANK.Key.LEFT_MOUSE))
    {
      if (this.dragSource)
        return;

      if (this.draggingShootButton)
      {
        this._entity.Weapons.aimAt(TANK.main.Game.mousePosWorld);
        this._entity.Weapons.shoot();
      }
      else
      {
        ship.moveTowards(TANK.main.Game.mousePosWorld);
      }
    }

    // Show shoot button
    var mouseDist = TANK.Math2D.pointDistancePoint(TANK.main.Game.mousePosWorld, [t.x, t.y]);
    if (mouseDist < 75)
    {
      this.shootButtonAlpha += dt * 2;
      if (this.shootButtonAlpha > 0.5)
        this.shootButtonAlpha = 0.5;
    }
    else if (!this.draggingShootButton)
    {
      this.shootButtonAlpha -= dt * 3;
      if (this.shootButtonAlpha < 0)
        this.shootButtonAlpha = 0;
    }

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

  this.draw = function(ctx, camera)
  {
    var pos = TANK.main.Game.mousePosWorld;

    // Draw shoot button
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    if (this.draggingShootButton)
      ctx.translate(pos[0] - camera.x, pos[1] - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.fillStyle = "rgba(255, 50, 50, " + this.shootButtonAlpha + ")";
    ctx.beginPath();
    ctx.arc(0, 0, 2, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // Draw line to shoot button
    if (this.draggingShootButton)
    {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 50, 50, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - camera.x, t.y - camera.y);
      ctx.lineTo(pos[0] - camera.x, pos[1] - camera.y);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  };
});