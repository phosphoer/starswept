TANK.registerComponent("Player")

.includes("Ship")

.construct(function()
{
  this.zdepth = 5;
  this.shakeTime = 0;

  this.headingLeft = false;
  this.headingRight = false;
  this.speedUp = false;
  this.speedDown = false;

  this.fireButtons =
  [
    {side: "left", pos: [0, -60]},
    {side: "right", pos: [0, 60]},
    {side: "front", pos: [100, 0]},
    {side: "back", pos: [-100, 0]},
  ];
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
    var selectionList = [];
    for (var i in selectables)
    {
      var selectable = selectables[i];
      if (e.Collider2D.collide(selectable.Collider2D))
        selectionList.push(selectable);
    }
    selectionList.sort(function(a, b)
    {
      var depthA = a[componentName].selectDepth || 0;
      var depthB = b[componentName].selectDepth || 0;
      return depthA - depthB;
    });

    TANK.main.removeChild(e);
    return selectionList[selectionList.length - 1];
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
    var mousePos = TANK.main.Game.mousePosWorld;
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      var pos = TANK.Math2D.rotate(this.fireButtons[i].pos, t.rotation);
      pos[0] += t.x;
      pos[1] += t.y;
      var dist = TANK.Math2D.pointDistancePoint(pos, mousePos);
      if (dist < 15)
      {
        this.fireButtonDown = true;
        this._entity.Weapons.fireGuns(this.fireButtons[i].side);
        return;
      }
    }
  });

  this.listenTo(TANK.main, "mouseup", function(e)
  {
    this.fireButtonDown = false;
  });

  this.listenTo(TANK.main, "keydown", function(e)
  {
    if (e.keyCode === TANK.Key.W)
      this.speedUp = true;
    if (e.keyCode === TANK.Key.S)
      this.speedDown = true;
    if (e.keyCode === TANK.Key.A)
      this.headingLeft = true;
    if (e.keyCode === TANK.Key.D)
      this.headingRight = true;

    if (e.keyCode === TANK.Key.LEFT_ARROW)
      this._entity.Weapons.fireGuns("left");
    if (e.keyCode === TANK.Key.RIGHT_ARROW)
      this._entity.Weapons.fireGuns("right");
    if (e.keyCode === TANK.Key.UP_ARROW)
      this._entity.Weapons.fireGuns("front");
    if (e.keyCode === TANK.Key.DOWN_ARROW)
      this._entity.Weapons.fireGuns("back");
  });

  this.listenTo(TANK.main, "keyup", function(e)
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

  this.update = function(dt)
  {
    // Handle mouse being held down
    if (TANK.main.Input.isDown(TANK.Key.LEFT_MOUSE) && !this.fireButtonDown)
    {
      var mousePos = TANK.main.Game.mousePosWorld;

      // Get heading
      var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], TANK.main.Game.mousePosWorld);
      if (dist < 200)
      {
        var newHeading = Math.atan2(mousePos[1] - t.y, mousePos[0] - t.x);
        ship.heading = newHeading;

        // Get speed
        ship.desiredSpeed = ((dist - 50) / 150) * ship.shipData.maxSpeed;
      }

    }

    // Heading controls
    if (this.headingLeft)
      ship.heading -= dt * 3;
    if (this.headingRight)
      ship.heading += dt * 3;

    // Speed controls
    if (this.speedUp)
      ship.desiredSpeed += dt * 80;
    if (this.speedDown)
      ship.desiredSpeed -= dt * 80;

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
    if (camera.z > 5)
      return;

    var pos = TANK.main.Game.mousePosWorld;
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);

    // Draw compass
    // Outer circle
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 200, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();

    // Heading line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ship.heading) * 200, Math.sin(ship.heading) * 200);
    ctx.closePath();
    ctx.stroke();

    // Speed line
    ctx.strokeStyle = "rgba(100, 100, 250, 0.8)";
    ctx.lineWidth = 10;
    var speedPercent = ship.desiredSpeed / ship.shipData.maxSpeed;
    var startPos = [Math.cos(ship.heading) * 50, Math.sin(ship.heading) * 50];
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
    ctx.lineTo(startPos[0] + Math.cos(ship.heading) * 150 * speedPercent, startPos[1] + Math.sin(ship.heading) * 150 * speedPercent);
    ctx.closePath();
    ctx.stroke();

    // Draw weapon buttons
    // Front Back
    ctx.rotate(t.rotation);
    ctx.fillStyle = "rgba(255, 80, 80, 0.5)";
    ctx.beginPath();
    ctx.arc(-100, 0, 15, Math.PI * 2, false);
    ctx.arc(100, 0, 15, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    // Left Right
    ctx.beginPath();
    ctx.arc(0, -60, 15, Math.PI * 2, false);
    ctx.arc(0, 60, 15, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
});