this.Action = this.Action || {};

Action.AIApproach = function(e, target)
{
  this.target = target;
  this.maxTurnSpeed = 1;
  this.optimalDistance = 300;
  this.giveUpTimer = 5;
  this.aimingAtTarget = false;
  this._blocking = true;

  this.start = function()
  {
  };

  this.update = function(dt)
  {
    var t = e.Pos2D;
    var v = e.Velocity;
    var ship = e.Ship;

    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        e.AIShip.removeBehavior("AIApproach");
      return;
    }

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetVel = this.target.Velocity;
    if (targetVel)
    {
      targetPos[0] += targetVel.x * 1;
      targetPos[1] += targetVel.y * 1;
    }
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, targetPos);
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);

    // Target is to the left
    this.aimingAtTarget = false;
    if (dir < -0.1)
    {
      ship.startLeft();
      ship.stopRight();
    }
    // Target is to the right
    else if (dir > 0.1)
    {
      ship.startRight();
      ship.stopLeft();
    }
    // Aiming at target
    else
    {
      this.aimingAtTarget = true;
      ship.stopRight();
      ship.stopLeft();
      v.r *= 0.95;
    }

    if (targetDist > this.optimalDistance)
    {
      ship.startUp();
    }
    else
    {
      ship.stopUp();

      v.x *= 0.95;
      v.y *= 0.95;
      v.r *= 0.95;

      if (v.getSpeed() < 1 && v.r < 0.1)
        this._done = true;
    }

    // Cap movement
    if (Math.abs(v.r) > this.maxTurnSpeed)
      v.r *= 0.95;
  };

  this.stop = function()
  {
  };
};

this.Action = this.Action || {};

Action.AIAttack = function(e, target)
{
  this.target = target;
  this.maxTurnSpeed = 1;
  this.optimalDistance = 500;
  this.giveUpTimer = 5;
  this._blocking = true;

  this.start = function()
  {
  };

  this.update = function(dt)
  {
    var t = e.Pos2D;
    var v = e.Velocity;
    var ship = e.Ship;

    // Check if target still exists
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        this._done = true;
      return;
    }

    // Get direction to player
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);

    // Approach target
    e.Ship.moveTowards(targetPos);

    // Shoot randomly
    e.Weapons.aimAt(targetPos);
    if (Math.random() < 0.05 && e.Weapons.aimingAtTarget && targetDist < 1500)
    {
      e.Weapons.shoot();
    }
  };

  this.stop = function()
  {
  };
};
TANK.registerComponent("AIFaction")

.includes("Faction")

.construct(function()
{
})

.initialize(function()
{
  var faction = this._entity.Faction;

  this.update = function(dt)
  {
    if (faction.money > 30)
    {
      // Pick a control point to buy a ship at
      var controlPoint = faction.controlPoints[Math.floor(Math.random() * faction.controlPoints.length)];
      controlPoint.buyShip();
    }
  };
});
this.Action = this.Action || {};

Action.AIIdle = function(e)
{
  this._blocking = true;

  this.start = function()
  {
  };

  this.update = function(dt)
  {
    var v = e.Velocity;
    var ship = e.Ship;

    // Stop moving
    ship.stopUp();
    ship.stopLeft();
    ship.stopRight();
    ship.stopDown();

    // Decelarate
    v.x *= 0.95;
    v.y *= 0.95;
    v.r *= 0.95;
  };

  this.stop = function()
  {
  };
};

TANK.registerComponent("AIShip")

.includes(["Ship", "Droppable"])

.construct(function()
{
  this.actions = [];
  this.removedActions = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  this._entity.Droppable.selectDepth = 1;

  // Only draggable if on the player team
  if (ship.team === 0)
  {
    this._entity.addComponent("Draggable");
    this._entity.Draggable.selectDepth = 1;
  }

  // Always watch for enemies
  this._entity.addComponent("AIWatch");

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, owner)
  {
    if (owner && owner.Ship && owner.Ship.team != ship.team && !(this.actions[0] instanceof Action.AIAttack))
    {
      this.prependAction(new Action.AIAttack(this._entity, owner));
    }
  });

  // Reponse to being dragged onto something
  this.listenTo(this._entity, "dragend", function(dest)
  {
    if (!dest)
      return;

    // Attack an enemy ship
    if (dest.Ship && dest.Ship.team != ship.team)
    {
      this.prependAction(new Action.AIAttack(this._entity, dest));
    }
    // Go to a control point
    else if (dest.ControlPoint)
    {
      this.prependAction(new Action.AIApproach(this._entity, dest));
    }
  });

  this.prependAction = function(action, blocking)
  {
    if (blocking !== undefined)
      action._blocking = blocking;
    this.actions.splice(0, 0, action);
    action.start();
  };

  this.appendAction = function(action, blocking)
  {
    if (blocking !== undefined)
      action._blocking = blocking;
    this.actions.push(action);
    action.start();
  };

  this.update = function(dt)
  {
    for (var i = 0; i < this.actions.length; ++i)
    {
      var action = this.actions[i];
      if (action.update)
        action.update(dt);

      if (action._done)
        this.removedActions.push(i);

      if (action._blocking)
        break;
    };

    for (var i = 0; i < this.removedActions.length; ++i)
      this.actions.splice(this.removedActions[i], 1);
    this.removedActions = [];
  };

  this.appendAction(new Action.AIIdle(this._entity));
});
TANK.registerComponent("AIWatch")

.includes("AIShip")

.construct(function()
{
  this.watchRange = 1000;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var ship = this._entity.Ship;

  this.evaluateTarget = function(e)
  {
    if (e.Ship.team === ship.team)
      return;

    var targetPos = [e.Pos2D.x, e.Pos2D.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    if (targetDist < this.watchRange && !(this._entity.AIShip.actions[0] instanceof Action.AIAttack))
    {
      this._entity.AIShip.prependAction(new Action.AIAttack(this._entity, e));
    }
  };

  this.update = function(dt)
  {
    // Iterate over ships and see if any enemies are nearby
    var ships = TANK.main.getChildrenWithComponent("Ship");
    for (var i in ships)
    {
      this.evaluateTarget(ships[i]);
    }
  };
});
TANK.registerComponent("Bullet")

.includes(["Pos2D", "Velocity", "Collider2D", "Life"])

.construct(function()
{
  this.zdepth = 2;
  this.owner = null;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.Collider2D.collisionLayer = "bullets";
  this._entity.Collider2D.collidesWith = ["ships"];

  // Make buffer
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(1, 1);

  // Predraw shape
  this.pixelBuffer.context.fillStyle = "#fff";
  this.pixelBuffer.context.fillRect(0, 0, 1, 1);

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (this.owner === this.obj)
      return;

    obj.dispatch("damaged", 0.2, [this._entity.Velocity.x, this._entity.Velocity.y], this.owner);
    TANK.main.removeChild(this._entity);
    this.stopListeningTo(this._entity, "collide");
  });

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});
TANK.registerComponent("ControlPoint")

.includes(["Planet", "Droppable"])

.construct(function()
{
  this.faction = null;
  this.value = 10;
  this.moneyTime = 5;
  this.moneyTimer = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.buyShip = function()
  {
    if (this.faction.money > 30)
    {
      this.faction.money -= 30;

      var e = TANK.createEntity("AIShip");
      e.Ship.team = this.faction.team;
      e.Pos2D.x = t.x - 400 + Math.random() * 800;
      e.Pos2D.y = t.y - 400 + Math.random() * 800;
      TANK.main.addChild(e);
    }
  };

  this.update = function(dt)
  {
    this.moneyTimer += dt;
    if (this.moneyTimer >= this.moneyTime)
    {
      this.moneyTimer = 0;

      if (this.faction)
        this.faction.money += this.value;
    }
  };
});
TANK.registerComponent("Cursor")

.includes(["Pos2D", "Collider2D"])

.construct(function()
{
  this.zdepth = 5;
})

.initialize(function()
{
  // TANK.main.Renderer2D.add(this);
  this._entity.Collider2D.collisionLayer = "cursors";

  this.update = function(dt)
  {
    this.updatePos();
  };

  this.updatePos = function()
  {
    var t = this._entity.Pos2D;

    t.x = TANK.main.Game.mousePosWorld[0];
    t.y = TANK.main.Game.mousePosWorld[1];
  };

  this.draw = function(ctx, camera)
  {
    var t = this._entity.Pos2D;
    ctx.save();

    ctx.fillStyle = "#fff";
    ctx.fillRect(t.x - camera.x - 25, t.y - camera.y - 25, 50, 50);

    ctx.restore();
  };
});

TANK.registerComponent("Draggable")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 8;
  this.dragging = false;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "dragstart", function()
  {
    this.dragging = true;
  });

  this.listenTo(this._entity, "dragend", function(dest)
  {
    this.dragging = false;
  });

  this.draw = function(ctx, camera)
  {
    if (!this.dragging)
      return;

    var mousePos = TANK.main.Game.mousePosWorld;
    ctx.save();
    ctx.strokeStyle = "#5f5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(t.x - camera.x, t.y - camera.y);
    ctx.lineTo(mousePos[0] - camera.x, mousePos[1] - camera.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };
});

TANK.registerComponent("Droppable");
TANK.registerComponent("Faction")

.construct(function()
{
  this.team = 0;
  this.money = 50;
  this.controlPoints = [];
})

.initialize(function()
{
  this.addControlPoint = function(controlPoint)
  {
    controlPoint.faction = this;
    this.controlPoints.push(controlPoint);
  };

  this.removeControlPoint = function(controlPoint)
  {
    for (var i = 0; i < this.controlPoints.length; ++i)
    {
      if (this.controlPoints[i] === controlPoint)
      {
        this.controlPoints.splice(i, 1);
        break;
      }
    }
  };
});
TANK.registerComponent("Game")

.construct(function()
{
  this.scaleFactor = isMobile.any() ? 4 : 8;
  this.factions = [];
  this.barCommands = [];
  this.topBarItems = [];
  this.mousePosWorld = [0, 0];
})

.initialize(function()
{
  lowLag.init();

  this.barUI = new Ractive(
  {
    el: "barContainer",
    template: "#barTemplate",
    data: {commands: this.barCommands}
  });

  this.topBarUI = new Ractive(
  {
    el: "topBarContainer",
    template: "#topBarTemplate",
    data: {items: this.topBarItems}
  });

  var that = this;
  this.barCommands.push(
  {
    name: "Build Ship",
    activate: function()
    {
      that.factions[0].controlPoints[0].buyShip();
    }
  });

  this.barUI.on("activate", function(e)
  {
    e.context.activate();
  });

  // Money counter
  this.topBarItems.push({name: ""});

  this.update = function(dt)
  {
    // Update faction money count
    this.topBarUI.set("items[0].name", "Funds - " + this.factions[0].money);

    // Update mouse world position
    this.mousePosWorld = [TANK.main.Input.mousePos[0], TANK.main.Input.mousePos[1]];
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  this.listenTo(TANK.main, "start", function()
  {
    var e = TANK.createEntity("Faction");
    e.Faction.team = 0;
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("AIFaction");
    e.Faction.team = 1;
    this.factions.push(e.Faction);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    this.factions[0].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("ControlPoint");
    e.Pos2D.x = 5000;
    e.Pos2D.y = 5000;
    this.factions[1].addControlPoint(e.ControlPoint);
    TANK.main.addChild(e);

    e = TANK.createEntity("Player");
    e.Pos2D.x = 0;
    e.Pos2D.y = 0;
    TANK.main.addChild(e, "Player");

    this.factions[0].controlPoints[0].buyShip();
  });
});
TANK.registerComponent("Glow")

.includes(["Pos2D", "Velocity", "Life"])

.construct(function()
{
  this.zdepth = 1;
  this.radius = 3;
  this.innerRadius = 1;
  this.alpha = 1;
  this.colorA = "rgba(255, 255, 255, 0.2)";
  this.colorB = "rgba(150, 150, 255, 0.05)";
  this.colorC = "rgba(80, 80, 150, 0.0)";
  this.alphaDecay = 0;
  this.friction = 1;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  // Make buffer
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.radius * 2, this.radius * 2);

  TANK.main.Renderer2D.add(this);

  // Draw glow
  this.redraw = function()
  {
    var grad = this.pixelBuffer.context.createRadialGradient(this.radius, this.radius, this.innerRadius, this.radius, this.radius, this.radius);
    grad.addColorStop(0, this.colorA);
    grad.addColorStop(0.5, this.colorB);
    grad.addColorStop(1, this.colorC);
    this.pixelBuffer.context.clearRect(0, 0, this.pixelBuffer.width, this.pixelBuffer.height);
    this.pixelBuffer.context.fillStyle = grad;
    this.pixelBuffer.context.beginPath();
    this.pixelBuffer.context.arc(this.pixelBuffer.width / 2, this.pixelBuffer.height / 2, this.pixelBuffer.width / 2, Math.PI * 2, false);
    this.pixelBuffer.context.fill();
    this.pixelBuffer.context.closePath();
  }

  this.draw = function(ctx, camera, dt)
  {
    if (this.alphaDecay > 0 && this.alpha > 0)
    {
      this.alpha -= this.alphaDecay * dt;
      this.redraw();
      if (this.alpha < 0)
        this.alpha = 0;
    }
    v.x *= this.friction;
    v.y *= this.friction;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(-this.radius, -this.radius);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);
    ctx.restore();
  };
});
TANK.registerComponent("Life")

.construct(function()
{
  this.life = 5;
})

.initialize(function()
{
  this.update = function(dt)
  {
    this.life -= dt;
    if (this.life < 0)
      this._entity._parent.removeChild(this._entity);
  };
});
TANK.registerComponent("Lights")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 4;
  this.width = 0;
  this.height = 0;
  this.lights = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  // Refresh lights function
  this.redrawLights = function()
  {
    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      for (var j in light.states[light.state])
        light[j] = light.states[light.state][j];

      // Draw light glows
      light.buffer = new PixelBuffer();
      light.buffer.createBuffer(light.radius * 2, light.radius * 2);

      // Draw light glows
      var grad = light.buffer.context.createRadialGradient(light.radius, light.radius, 1, light.radius, light.radius, light.radius);
      var colorA = light.colorA.join(",");
      var colorB = light.colorB.join(",");
      grad.addColorStop(0, "rgba(" + colorA + ", " + light.alpha + ")");
      grad.addColorStop(0.5, "rgba(" + colorB + ", " + (light.alpha / 3) + ")");
      grad.addColorStop(1, "rgba(" + colorB + ", 0.0)");
      light.buffer.context.fillStyle = grad;
      light.buffer.context.beginPath();
      light.buffer.context.arc(light.buffer.width / 2, light.buffer.height / 2, light.buffer.width / 2, Math.PI * 2, false);
      light.buffer.context.fill();
      light.buffer.context.closePath();
    }
  };

  this.update = function(dt)
  {
    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      if (light.blinkTime)
      {
        if (!light.blinkTimer)
          light.blinkTimer = 0;
        light.blinkTimer += dt;
        if (light.blinkTimer > light.blinkTime)
        {
          if (light.state === "on")
            light.state = "off";
          else if (light.state === "off")
            light.state = "on";
          light.blinkTimer = 0;
          this.redrawLights();
        }
      }
    }
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.rotate(t.rotation);
    ctx.translate(this.width / -2, this.height / -2);

    for (var i = 0; i < this.lights.length; ++i)
    {
      var light = this.lights[i];
      ctx.save();
      ctx.translate(-light.radius + 0.5, -light.radius + 0.5);
      ctx.drawImage(light.buffer.canvas, light.x, light.y);
      ctx.restore();
    }

    ctx.restore();
  };
});
function PixelBuffer()
{
  this.createBuffer = function(width, height)
  {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.applyBuffer = function()
  {
    this.context.putImageData(this.buffer, 0, 0);
  };

  this.setPixel = function(x, y, color)
  {
    var index = x * 4 + (y * this.buffer.width * 4);
    this.buffer.data[index + 0] = Math.floor(color[0]);
    this.buffer.data[index + 1] = Math.floor(color[1]);
    this.buffer.data[index + 2] = Math.floor(color[2]);
    this.buffer.data[index + 3] = Math.floor(color[3]);
  };

  this.getPixel = function(x, y)
  {
    var index = x * 4 + (y * this.buffer.width * 4);
    var pixel = [];
    pixel[0] = this.buffer.data[index + 0];
    pixel[1] = this.buffer.data[index + 1];
    pixel[2] = this.buffer.data[index + 2];
    pixel[3] = this.buffer.data[index + 3];
    return pixel;
  };
}
(function()
{

TANK.registerComponent("Planet")

.includes(["Pos2D", "Collider2D"])

.construct(function()
{
  this.zdepth = 0;
  this.radius = 48;
  this.atmosColor = [140, 140, 255, 0.8];
  this.heights = [0, 0.3, 0.5, 0.6, 1];
  this.colors =
  [
    [0, 0, 90, 255],
    [30, 30, 255, 255],
    [180, 180, 100, 255],
    [80, 150, 80, 255],
    [255, 255, 255, 255]
  ];

  this.noiseFreq = 0.002 + Math.random() * 0.01;
  this.noiseAmplitude = 0.5 + Math.random() * 3;
  this.noisePersistence = 0.7 + Math.random() * 0.29;
  this.noiseOctaves = 8;
})

.initialize(function()
{
  TANK.main.Renderer2D.add(this);

  this._entity.Collider2D.width = this.radius * 2 * TANK.main.Game.scaleFactor;
  this._entity.Collider2D.height = this.radius * 2 * TANK.main.Game.scaleFactor;
  this._entity.Collider2D.collidesWith.push("cursors");

  // Iterate over every pixel
  this.forEachPixel = function(func)
  {
    for (var i = 0; i < this.size; ++i)
    {
      for (var j = 0; j < this.size; ++j)
      {
        if (TANK.Math2D.pointDistancePoint([i, j], [this.radius, this.radius]) < this.radius)
          func.apply(this, [i, j]);
      }
    }
  };

  // Interpolate between colors at a height
  this.getColorAtHeight = function(height)
  {
    var heightMin = 0;
    var heightMax = this.heights.length - 1;
    for (var i = 1; i < this.heights.length; ++i)
    {
      if (this.heights[i] > height)
      {
        heightMin = i - 1;
        heightMax = i;
        break;
      }
    }

    var color0 = this.colors[heightMin];
    var color1 = this.colors[heightMax];
    var y0 = this.heights[heightMin];
    var y1 = this.heights[heightMax];
    var t = (height - y0) / (y1 - y0);

    var color = [];
    for (var i = 0; i < 4; ++i)
      color[i] = Math.round(color0[i] * (1 - t) + color1[i] * t);

    return color;
  };

  var t = this._entity.Pos2D;

  // Create buffer
  this.size = this.radius * 2;
  this.lightSize = this.size + 8;
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(this.size, this.size);
  this.lightBuffer = new PixelBuffer();
  this.lightBuffer.createBuffer(this.lightSize, this.lightSize);
  this.heightMap = [];

  // Choose colors
  for (var i = 0; i < this.colors.length; ++i)
  {
    var index = Math.floor(Math.random() * PlanetColors[i].length);
    this.colors[i] = PlanetColors[i][index];
  }

  // Fill heightmap
  for (var i = 0; i < this.size; ++i)
  {
    this.heightMap[i] = [];
    for (var j = 0; j < this.size; ++j)
      this.heightMap[i][j] = 0;
  }

  // Calculate height map
  noise.seed(Math.random());
  for (var n = 0; n < this.noiseOctaves; ++n)
  {
    this.forEachPixel(function(i, j)
    {
      this.heightMap[i][j] += noise.perlin2(i * this.noiseFreq, j * this.noiseFreq) * this.noiseAmplitude;
    });
    this.noiseAmplitude *= this.noisePersistence;
    this.noiseFreq *= 2;
  }

  // Normalize height map to [0, 1]
  this.heighestPoint = -Infinity;
  this.lowestPoint = Infinity;
  this.forEachPixel(function(i, j)
  {
    this.heighestPoint = Math.max(this.heighestPoint, this.heightMap[i][j]);
    this.lowestPoint = Math.min(this.lowestPoint, this.heightMap[i][j]);
  });
  this.forEachPixel(function(i, j)
  {
    this.heightMap[i][j] = (-this.lowestPoint + this.heightMap[i][j]) / (-this.lowestPoint + this.heighestPoint);
  });

  // Set color based on height map
  this.forEachPixel(function(i, j)
  {
    var height = this.heightMap[i][j];
    var color = this.getColorAtHeight(height);
    this.pixelBuffer.setPixel(i, j, color);
  });

  this.pixelBuffer.applyBuffer();

  // Draw atmosphere
  var atmosColor = this.atmosColor[0] + "," + this.atmosColor[1] + "," + this.atmosColor[2];
  var atmosColorAlpha = atmosColor + "," + this.atmosColor[3];
  this.lightBuffer.context.translate((this.lightSize) / 2, (this.lightSize) / 2);
  var grad = this.lightBuffer.context.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.1);
  grad.addColorStop(0, "rgba(" + atmosColor + ", 0.0)");
  grad.addColorStop(0.5, "rgba(" + atmosColor + ", 0.0)");
  grad.addColorStop(0.8, "rgba(" + atmosColorAlpha + ")");
  grad.addColorStop(1, "rgba(" + atmosColor + ", 0.0)");
  this.lightBuffer.context.fillStyle = grad;
  this.lightBuffer.context.beginPath();
  this.lightBuffer.context.arc(0, 0, this.radius * 1.2, 2 * Math.PI, false);
  this.lightBuffer.context.fill();
  this.lightBuffer.context.closePath();

  // Draw lighting
  var x = -this.radius;
  var y = 0;
  grad = this.lightBuffer.context.createRadialGradient(x - this.radius / 4, y, this.radius * 1.5, x, y, this.radius * 2.1);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.25, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.25, "rgba(0, 0, 0, 0.3)");
  grad.addColorStop(0.6, "rgba(0, 0, 0, 0.3)");
  grad.addColorStop(0.6, "rgba(0, 0, 0, 0.6)");
  grad.addColorStop(0.8, "rgba(0, 0, 0, 0.6)");
  grad.addColorStop(0.8, "rgba(0, 0, 0, .8)");
  grad.addColorStop(1, "rgba(0, 0, 0, .8)");


  this.lightBuffer.context.fillStyle = grad;
  this.lightBuffer.context.beginPath();
  this.lightBuffer.context.arc(0, 0, this.radius + 1, 2 * Math.PI, false);
  this.lightBuffer.context.fill();
  this.lightBuffer.context.closePath();

  this.draw = function(ctx, camera, dt)
  {
    ctx.save();

    // Draw planet
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.translate(this.size / -2, this.size / -2);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);

    // Draw lighting
    ctx.translate((this.lightSize) / 2 - 4, (this.lightSize) / 2 - 4);
    // ctx.rotate(this.time);
    ctx.translate((this.lightSize) / -2, (this.lightSize) / -2);
    ctx.drawImage(this.lightBuffer.canvas, 0, 0);

    ctx.restore();
  };
});

var PlanetColors =
[
  // Deep water
  [
    [0, 0, 90, 255],
    [90, 0, 90, 255],
    [90, 0, 30, 255],
    [30, 0, 90, 255],
    [30, 30, 90, 255],
  ],
  // Water
  [
    [30, 30, 255, 255],
    [50, 50, 255, 255],
    [255, 30, 255, 255],
    [255, 30, 150, 255],
    [80, 60, 255, 255],
  ],
  // Beach
  [
    [180, 180, 100, 255],
    [180, 100, 180, 255],
    [100, 180, 180, 255],
    [100, 100, 100, 255],
  ],
  // Land
  [
    [80, 150, 80, 255],
    [150, 80, 80, 255],
    [80, 80, 150, 255],
  ],
  // Mountains
  [
    [255, 255, 255, 255],
    [200, 200, 200, 255],
    [200, 250, 200, 255],
    [250, 150, 150, 255],
  ]
];

}());
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
TANK.registerComponent("Ship")

.includes(["Pos2D", "Velocity", "Lights", "Collider2D", "Weapons"])

.construct(function()
{
  this.zdepth = 2;
  this.image = new Image();

  this.up = false;
  this.left = false;
  this.right = false;
  this.down = false;
  this.trailTimer = 0;
  this.dead = false;

  this.shipData = new Ships.transport();
  this.image.src = this.shipData.image;
  this.team = 0;
  this.health = this.shipData.health;
  this.deadTimer = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;

  TANK.main.Renderer2D.add(this);

  this._entity.Collider2D.collisionLayer = "ships";
  this._entity.Collider2D.collidesWith = ["bullets"];

  var that = this;
  this.image.addEventListener("load", function()
  {
    that._entity.Lights.lights = that.shipData.lights;
    that._entity.Lights.width = that.image.width;
    that._entity.Lights.height = that.image.height;
    that._entity.Lights.redrawLights();

    that._entity.Collider2D.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Collider2D.height = that.image.height * TANK.main.Game.scaleFactor;
  });

  // Add weapons
  for (var i = 0; i < this.shipData.guns.length; ++i)
  {
    var gunData = this.shipData.guns[i];
    var gun = this._entity.Weapons.addGun();
    for (var j in gunData)
      gun[j] = gunData[j];
  };

  // Movement functions
  this.startUp = function()
  {
    if (this.up || this.dead)
      return;
    this.up = true;
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = "on";
    this._entity.Lights.redrawLights();
  };
  this.stopUp = function()
  {
    if (!this.up)
      return;
    this.up = false;
    for (var i = 0; i < this.shipData.lights.length; ++i)
      if (this.shipData.lights[i].isEngine)
        this.shipData.lights[i].state = "off";
    this._entity.Lights.redrawLights();
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
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, pos);
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

  // Update loop
  this.update = function(dt)
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
    if (Math.abs(v.r) > this.shipData.maxTurnSpeed)
      v.r *= 0.95;
    var speed = Math.sqrt(v.x * v.x + v.y * v.y);
    if (speed > this.shipData.maxSpeed)
    {
      var moveAngle = Math.atan2(v.y, v.x);
      v.x = Math.cos(moveAngle) * this.shipData.maxSpeed;
      v.y = Math.sin(moveAngle) * this.shipData.maxSpeed;
    }

    // Timers
    this.reloadTimer -= dt;
    this.trailTimer -= dt;

    // Spawn engine trail effect
    if (this.trailTimer < 0 && !isMobile.any())
    {
      for (var i = 0; i < this.shipData.lights.length; ++i)
      {
        var light = this.shipData.lights[i];
        if (light.isEngine && light.state === "on")
        {
          var e = TANK.createEntity("Glow");
          var x = (light.x - this.image.width / 2) * TANK.main.Game.scaleFactor;
          var y = (light.y - this.image.height / 2) * TANK.main.Game.scaleFactor;
          e.Pos2D.x = x * Math.cos(t.rotation) - y * Math.sin(t.rotation);
          e.Pos2D.y = y * Math.cos(t.rotation) + x * Math.sin(t.rotation);
          e.Pos2D.x += t.x;
          e.Pos2D.y += t.y;
          e.Velocity.x = Math.cos(t.rotation) * -120;
          e.Velocity.y = Math.sin(t.rotation) * -120;
          e.Glow.alphaDecay = 0.8;
          e.Life.life = 3;
          TANK.main.addChild(e);
        }
      }
      this.trailTimer = 0.03;
    }
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
var Ships = {};

Ships.frigate = function()
{
  this.image = "res/shuttle.png";
  this.maxTurnSpeed = 1.5;
  this.maxSpeed = 150;
  this.health = 1;
  this.guns =
  [
    {
      reloadTime: 0.5,
      arcAngle: 0,
      arc: Math.PI / 3,
      range: 800
    }
  ];
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
};

Ships.transport = function()
{
  this.image = "res/transport.png";
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 100;
  this.health = 1.5;
  this.guns =
  [
    {
      reloadTime: 0.5,
      arcAngle: Math.PI,
      arc: Math.PI / 4,
      range: 700
    }
  ];
  this.lights =
  [
    {
      x: 3, y: 0, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 0, y: 3, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 3, y: 7, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 4, alpha: 0.8},
        off: {radius: 3, alpha: 0.5}
      }
    },
    {
      x: 7, y: 5, radius: 2, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.25,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};
TANK.registerComponent("StarField")

.construct(function()
{
  this.zdepth = -10;
  this.stars = [];
})

.initialize(function()
{
  this.pixelBuffer = new PixelBuffer();
  this.pixelBuffer.createBuffer(window.innerWidth, window.innerHeight);

  TANK.main.Renderer2D.add(this);

  var i;
  for (i = 0; i < 100; ++i)
  {
    var r =
    this.stars.push(
    {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 0.01 + 0.001,
      size: Math.random() * 3 + 0.1,
      color: "rgba(" + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + Math.round(150 + Math.random() * 100) +
        ", " + (0.5 + Math.random() * 0.5) + ")"
    });
  }

  for (i = 0; i < this.stars.length; ++i)
  {
    var x = (this.stars[i].x);
    var y = (this.stars[i].y);

    this.pixelBuffer.context.fillStyle = this.stars[i].color;
    this.pixelBuffer.context.fillRect(x, y, this.stars[i].size, this.stars[i].size);
  }

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.scale(camera.z, camera.z);
    ctx.drawImage(this.pixelBuffer.canvas, -window.innerWidth / 2, -window.innerHeight / 2);
    ctx.restore();
  };
});

TANK.registerComponent("Template")

.includes("Pos2D")

.construct(function()
{
})

.initialize(function()
{
});
var isMobile = {
    android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    blackberry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    ios: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.android() || isMobile.blackberry() || isMobile.ios() || isMobile.opera() || isMobile.windows());
    }
};
TANK.registerComponent("Weapons")

.includes("Pos2D")

.construct(function()
{
  this.zdepth = 10;
  this.guns = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.addGun = function()
  {
    var gun = {};
    gun.reloadTime = 0.5;
    gun.reloadTimer = 0;
    gun.arcAngle = 0;
    gun.arc = Math.PI / 3;
    gun.angle = 0;
    gun.range = 800;
    this.guns.push(gun);
    return gun;
  };

  this.shoot = function()
  {
    if (!this.targetPos)
    {
      console.warn("Tried to shoot with no target!");
      return;
    }

    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];

      // Don't shoot if gun is aiming outside arc
      var dirLeft = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.arcAngle - gun.arc / 2, this.targetPos);
      var dirRight = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.arcAngle + gun.arc / 2, this.targetPos);
      if (dirLeft < 0 || dirRight > 0)
        continue;

      if (gun.reloadTimer < 0)
      {
        gun.reloadTimer = gun.reloadTime;
        var e = TANK.createEntity("Bullet");
        e.Pos2D.x = t.x + Math.cos(t.rotation + gun.angle + gun.arcAngle) * 75;
        e.Pos2D.y = t.y + Math.sin(t.rotation + gun.angle + gun.arcAngle) * 75;
        e.Velocity.x = Math.cos(t.rotation + gun.angle + gun.arcAngle) * 800;
        e.Velocity.y = Math.sin(t.rotation + gun.angle + gun.arcAngle) * 800;
        e.Life.life = 5;
        e.Bullet.owner = this._entity;
        TANK.main.addChild(e);
      }
    }
  };

  this.aimAt = function(pos)
  {
    if (pos)
      this.targetPos = [pos[0], pos[1]];
    else
      this.targetPos = null;
  };

  this.update = function(dt)
  {
    this.aimingAtTarget = false;
    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];
      gun.reloadTimer -= dt;

      if (this.targetPos)
      {
        gun.aimingAtTarget = false;
        var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation + gun.angle + gun.arcAngle, this.targetPos);
        if (dir < -0.01)
        {
          gun.angle -= dt * 0.5;
        }
        else if (dir > 0.01)
        {
          gun.angle += dt * 0.5;
        }
        else
        {
          gun.aimingAtTarget = true;
          this.aimingAtTarget = true;
        }
      }

      if (gun.angle < gun.arc / -2)
        gun.angle = gun.arc / -2;
      if (gun.angle > gun.arc / 2)
        gun.angle = gun.arc / 2;
    }

  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.rotate(t.rotation);
    ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
    ctx.lineWidth = 2;

    for (var i = 0; i < this.guns.length; ++i)
    {
      var gun = this.guns[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle + gun.angle) * gun.range, Math.sin(gun.arcAngle + gun.angle) * gun.range);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle - gun.arc / 2) * gun.range, Math.sin(gun.arcAngle - gun.arc / 2) * gun.range);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(gun.arcAngle + gun.arc / 2) * gun.range, Math.sin(gun.arcAngle + gun.arc / 2) * gun.range);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(0, 0, gun.range, gun.arcAngle - gun.arc / 2, gun.arcAngle + gun.arc / 2);
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  };
});
function main()
{
  TANK.createEngine(["Input", "Renderer2D", "Game", "StarField"]);

  TANK.main.Renderer2D.context = document.getElementById("canvas").getContext("2d");

  TANK.start();
}