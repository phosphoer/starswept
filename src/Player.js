TANK.registerComponent("Player")

.includes("Ship")

.construct(function()
{
  this.zdepth = 5;
  this.shakeTime = 0;
  this.clickTimer = 1;

  this.headingLeft = false;
  this.headingRight = false;
  this.speedUp = false;
  this.speedDown = false;
  this.fireButtons = [];
  this.selectedShips = [];
})

.initialize(function()
{
  var ship = this._entity.Ship;
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.clearSelection = function()
  {
    for (var i = 0; i < this.selectedShips.length; ++i)
      this.selectedShips[i].Ship.selected = false;
    this.selectedShips = [];
  };

  this.shakeCamera = function(duration)
  {
    this.shakeTime = duration;
  };

  this.mouseDownHandler = function(e)
  {
    this.mouseDown = true;

    // Handle double tap
    if (this.clickTimer < .3)
    {
        TANK.main.dispatch("doubleclick", e);
        return;
    }
    this.clickTimer = 0;

    // Handle tapping a fire button
    var mousePos = TANK.main.Game.mousePosWorld;
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      var pos = TANK.Math2D.rotate(this.fireButtons[i].pos, t.rotation);
      pos = TANK.Math2D.scale(pos, TANK.main.Game.scaleFactor);
      pos[0] += t.x;
      pos[1] += t.y;
      var dist = TANK.Math2D.pointDistancePoint(pos, mousePos);
      if (dist < this.fireButtons[i].radius * TANK.main.Game.scaleFactor)
      {
        this.fireButtonDown = true;
        this._entity.Weapons.fireGuns(this.fireButtons[i].side);
        return;
      }
    }

    // Handle giving an order to an already made selection
    if (this.selectedShips.length > 0)
    {
      var targets = TANK.main.getChildrenWithComponent("OrderTarget");
      for (var i in targets)
      {
        if (targets[i].Clickable.checkClick(mousePos))
        {
          this.pendingOrder = this.selectedShips[0].AIShip.getContextOrder(targets[i]);
          this.pendingTarget = targets[i];
          return;
        }
      }
    }

    // Handle the beginning of a selection drag if the mouse down was outside
    // of the heading radius
    var distToPlayer = TANK.Math2D.pointDistancePoint([t.x, t.y], mousePos);
    if (distToPlayer > this.headingRadiusScaled && !this.zooming)
    {
      this.selecting = true;
      this.selectPos = [mousePos[0], mousePos[1]];
      this.selectRadius = 0;
    }
  };

  this.mouseUpHandler = function(e)
  {
    // Handle giving an order to an already made selection
    var mousePos = TANK.main.Game.mousePosWorld;
    if (this.selectedShips.length > 0 && this.pendingOrder)
    {
      var targets = TANK.main.getChildrenWithComponent("OrderTarget");
      for (var i in targets)
      {
        if (targets[i].Clickable.checkClick(mousePos))
        {
          for (var j = 0; j < this.selectedShips.length; ++j)
            this.selectedShips[j].AIShip.giveContextOrder(targets[i]);
          this.clearSelection();
          break;
        }
      }
    }

    // If we were in selection mode, we should find out what we selected
    if (this.selecting)
    {
      // Only ships in our faction can be selected
      this.clearSelection();
      var ships = TANK.main.getChildrenWithComponent("AIShip");
      for (var i in ships)
      {
        if (ships[i].Ship.faction === ship.faction)
        {
          if (TANK.Math2D.pointDistancePoint([ships[i].Pos2D.x, ships[i].Pos2D.y], this.selectPos) < this.selectRadius)
          {
            this.selectedShips.push(ships[i]);
            ships[i].Ship.selected = true;
          }
        }
      }
    }

    this.zooming = false;
    this.mouseDown = false;
    this.fireButtonDown = false;
    this.selecting = false;
    this.pendingTarget = null;
    this.pendingOrder = null;
  };

  this.mouseMoveHandler = function(e)
  {
    if (this.mouseDown && !this.fireButtonDown && !this.selecting && !this.pendingTarget)
    {
      var mousePos = TANK.main.Game.mousePosWorld;

      // Get heading
      var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], TANK.main.Game.mousePosWorld);
      if (dist < this.headingRadiusScaled)
      {
        var newHeading = Math.atan2(mousePos[1] - t.y, mousePos[0] - t.x);
        ship.heading = newHeading;

        // Get speed
        ship.desiredSpeed = ((dist - this.speedStartScaled) /
                            (this.headingRadiusScaled - this.speedStartScaled)) * ship.shipData.maxSpeed;
      }
    }
  };

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (obj.Bullet && obj.Bullet.owner !== this._entity)
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
      this.zooming = true;
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

  this.listenTo(TANK.main, "doubleclick", function(e)
  {
    // If we double click a ship in the same faction, we can
    // transfer control to it
    var ships = TANK.main.getChildrenWithComponent("Ship");
    for (var i in ships)
    {
        // Skip our own ship
        if (ships[i] === this._entity)
            continue;

        // Check if mouse is over the ship
        var shipPos = [ships[i].Pos2D.x, ships[i].Pos2D.y];
        var shipSize = [ships[i].Collider2D.width, ships[i].Collider2D.height];
        if (TANK.Math2D.pointInOBB(TANK.main.Game.mousePosWorld, shipPos, shipSize, ships[i].Pos2D.rotation))
        {
            // Transfer control to the ship
            this._entity.removeComponent("Player");
            this._entity.addComponent("AIShip");
            ships[i].addComponent("Player");
            ships[i].removeComponent("AIShip");
            ships[i].removeComponent("AIWatch");
        }
    }
  });

  this.listenTo(TANK.main, "mousedown", this.mouseDownHandler);
  this.listenTo(TANK.main, "mouseup", this.mouseUpHandler);
  this.listenTo(TANK.main, "mousemove", this.mouseMoveHandler);
  this.listenTo(TANK.main, "touchstart", this.mouseDownHandler);
  this.listenTo(TANK.main, "touchend", this.mouseUpHandler);
  this.listenTo(TANK.main, "touchmove", this.mouseMoveHandler);

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
    // Timers
    this.clickTimer += dt;

    // Calculate selection radius
    if (this.selecting)
    {
      this.selectRadius = TANK.Math2D.pointDistancePoint(this.selectPos, TANK.main.Game.mousePosWorld);
    }

    // Check if mouse is still over order target
    if (this.pendingTarget)
    {
      if (this.pendingTarget.Clickable.checkClick(TANK.main.Game.mousePosWorld))
        this.pendingOrder = this.selectedShips[0].AIShip.getContextOrder(this.pendingTarget);
      else
        this.pendingOrder = null;
    }

    // Calculate HUD size
    this.headingRadius = Math.max(ship.image.width, ship.image.height) * 0.75;
    this.speedStart = this.headingRadius * 0.25;
    this.headingRadiusScaled = this.headingRadius * TANK.main.Game.scaleFactor;
    this.speedStartScaled = this.speedStart * TANK.main.Game.scaleFactor;

    this.fireButtons =
    [
      {side: "left", pos: [0, -ship.image.height * 0.75], radius: 6},
      {side: "right", pos: [0, ship.image.height * 0.75], radius: 6},
      {side: "front", pos: [ship.image.width * 0.75, 0], radius: 6},
      {side: "back", pos: [-ship.image.width * 0.75, 0], radius: 6},
    ];

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
    // Draw selection radius
    if (this.selecting)
    {
      ctx.save()
      ctx.translate(-camera.x, -camera.y);

      // Inner circle
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(this.selectPos[0], this.selectPos[1], 10 * camera.z, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      // Selection radius
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(this.selectPos[0], this.selectPos[1], this.selectRadius, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    if (this.pendingOrder)
    {
      var mousePos = TANK.main.Game.mousePosWorld;
      ctx.save()
      ctx.translate(-camera.x, -camera.y);
      var fontSize = 20 * camera.z;
      ctx.font = fontSize + "px sans-serif";
      ctx.fillStyle = "#ddd";
      ctx.fillText(this.pendingOrder, mousePos[0], mousePos[1]);
      ctx.restore();
    }

    if (camera.z > 5)
      return;

    // Draw player HUD
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    // Draw compass
    // Outer circle
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.headingRadius, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();

    // Heading line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ship.heading) * this.headingRadius, Math.sin(ship.heading) * this.headingRadius);
    ctx.closePath();
    ctx.stroke();

    // Speed line
    ctx.strokeStyle = "rgba(100, 100, 250, 0.8)";
    ctx.lineWidth = 1.5;
    var speedPercent = ship.desiredSpeed / ship.shipData.maxSpeed;
    var startPos = [Math.cos(ship.heading) * this.speedStart, Math.sin(ship.heading) * this.speedStart];
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
    ctx.lineTo(startPos[0] + Math.cos(ship.heading) * (this.headingRadius - this.speedStart) * speedPercent,
               startPos[1] + Math.sin(ship.heading) * (this.headingRadius - this.speedStart) * speedPercent);
    ctx.closePath();
    ctx.stroke();

    var that = this;
    function drawGun(gun)
    {
      ctx.beginPath();
      ctx.moveTo(gun.pos[0], gun.pos[1]);
      ctx.arc(gun.pos[0], gun.pos[1], gun.radius, that._entity.Weapons.reloadPercent(gun.side) * Math.PI * -2, false);
      ctx.lineTo(gun.pos[0], gun.pos[1]);
      ctx.closePath();
      ctx.fill();
    }

    // Draw weapon buttons
    ctx.rotate(t.rotation);
    ctx.fillStyle = "rgba(255, 80, 80, 0.5)";

    // Front Back
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      drawGun(this.fireButtons[i]);
    }

    ctx.restore();
  };
});