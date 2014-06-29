this.Action = this.Action || {};

Action.AIAttack = function(e, target)
{
  this.target = target;
  this.attackDistanceMin = 350;
  this.attackDistanceMax = 550;
  this.giveUpTimer = 5;

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
        return true;
    }

    // Get direction to target
    var targetPos = [this.target.Pos2D.x, this.target.Pos2D.y];
    var targetVelocity = [this.target.Velocity.x, this.target.Velocity.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // We should move to engage the target
    // Depending on the layout of our ship, this either means attempting
    // to line up a broadside, or aligning our fore-guns with the target
    // If we are too close we should turn to get farther away
    if (targetDist < this.attackDistanceMin)
    {
      ship.heading = targetDir + Math.PI;
      ship.setSpeedPercent(1);
    }
    // We want to get to a minimum distance from the target before attempting to aim at it
    else if (targetDist > this.attackDistanceMax)
    {
      ship.heading = targetDir;
      ship.setSpeedPercent(1);
    }
    else
    {
      // Aim at a right angle to the direction to the target, to target with a broadside
      ship.heading = targetDir + Math.PI / 2;

      // Slow down to half speed while circling
      ship.setSpeedPercent(0.5);
    }
  };
};
this.Action = this.Action || {};

Action.AIDefend = function(e, target)
{ 
  this.timer = 0;
  this.stayTime = 20;
  this.defendPos = [0, 0];
  this.desiredDist = 200;
  this.maxDefendDist = 600;
  this.aggroDistance = 800;
  this.scanTimer = 1;

  this.update = function(dt)
  {
    var t = e.Pos2D;

    // Pick a new defend position
    this.timer -= dt;
    if (this.timer <= 0)
    {
      this.pickNewPos();
      this.timer = this.stayTime;
    }

    // Move to the control point and stop
    var dist = TANK.Math2D.pointDistancePoint(this.defendPos, [t.x, t.y]);
    if (dist > this.desiredDist * 3)
      e.Ship.moveTowards(this.defendPos);
    else if (dist > this.desiredDist)
      e.Ship.moveTowards(this.defendPos, 0.3)
    else
      e.Ship.setSpeedPercent(0);

    // Once we are in our defend location, we should attack any enemy ships
    // that come near the location
    this.scanTimer -= dt;
    if (dist <= this.desiredDist && this.scanTimer < 0)
    {
      this.scanTimer = 1;

      var ships = TANK.main.getChildrenWithComponent("Ship");
      for (var i in ships)
      {
        // Skip ships on our team
        var obj = ships[i];
        if (obj.Ship.faction.team === e.Ship.faction.team)
          continue;

        // If we see a ship, clear our order queue, attack the ship, and then go back to defending this point
        if (TANK.Math2D.pointDistancePoint([obj.Pos2D.x, obj.Pos2D.y], this.defendPos) <= this.aggroDistance)
        {
          e.AIShip.clearOrders();
          e.AIShip.addOrder(new Action.AIAttack(e, obj));
          e.AIShip.addOrder(new Action.AIDefend(e, target));
        }
      }
    }
  };

  this.pickNewPos = function()
  {
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * this.maxDefendDist;
    var offsetVec = [Math.cos(angle) * dist, Math.sin(angle) * dist];
    this.defendPos = TANK.Math2D.add([target.Pos2D.x, target.Pos2D.y], offsetVec);
  };
};

Action.AIDefendNearest = function(e)
{
  this.update = function(dt)
  {
    // Look at all friendly control points and give a defend
    // order for the nearest one
    var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
    var minDist = Infinity;
    var nearest = null;
    for (var i in controlPoints)
    {
      var obj = controlPoints[i];
      var dist = TANK.Math2D.pointDistancePoint([obj.Pos2D.x, obj.Pos2D.y], [e.Pos2D.x, e.Pos2D.y]);
      if (dist < minDist)
      {
        minDist = dist;
        nearest = obj;
      }
    }

    e.AIShip.addOrder(new Action.AIDefend(e, nearest));
    return true;
  };
};

this.Action = this.Action || {};

Action.AIEscort = function(e, target)
{
  this.target = target;
  this.giveUpTimer = 5;
  this.desiredDist = 300;
  this.aggroDistance = 500;
  this.scanTimer = 1;

  this.update = function(dt)
  {
    var t = e.Pos2D;
    var v = e.Velocity;

    // Give up if we can't find our target
    if (!this.target || !TANK.main.getChild(this.target._id))
    {
      this.giveUpTimer -= dt;
      if (this.giveUpTimer < 0)
        return true;
    }

    // Move towards the target ship
    var targetPos = [target.Pos2D.x, target.Pos2D.y];
    var targetSpeedPercent = (target.Ship.desiredSpeed / target.Ship.shipData.maxSpeed);
    var dist = TANK.Math2D.pointDistancePoint(targetPos, [t.x, t.y]);
    if (dist > this.desiredDist * 3)
      e.Ship.moveTowards(targetPos);
    else if (dist > this.desiredDist)
      e.Ship.moveTowards(targetPos, targetSpeedPercent + 0.2)
    else
    {
      e.Ship.setSpeedPercent(targetSpeedPercent);
      e.Ship.heading = target.Ship.heading;
    }

    // Once we are in our defend location, we should attack any enemy ships
    // that come near the location
    this.scanTimer -= dt;
    if (dist <= this.desiredDist && this.scanTimer < 0)
    {
      this.scanTimer = 1;

      var ships = TANK.main.getChildrenWithComponent("Ship");
      for (var i in ships)
      {
        // Skip ships on our team
        var obj = ships[i];
        if (obj.Ship.faction.team === e.Ship.faction.team)
          continue;

        // If we see a ship, clear our order queue, attack the ship, and then go back to defending this point
        if (TANK.Math2D.pointDistancePoint([obj.Pos2D.x, obj.Pos2D.y], targetPos) <= this.aggroDistance)
        {
          e.AIShip.clearOrders();
          e.AIShip.addOrder(new Action.AIAttack(e, obj));
          e.AIShip.addOrder(new Action.AIEscort(e, target));
        }
      }
    }
  };
};

(function()
{

TANK.registerComponent("AIFaction")
.includes("Faction")
.construct(function()
{
  this.currentCaptureTarget = null;
  this.projects = [];

  this.idleShipScanTime = 5;
  this.idleShipScanTimer = 0;
  this.idleShips = [];
})
.initialize(function()
{
  var faction = this._entity.Faction;
  var that = this;

  this.calculateControlPointThreat = function(e)
  {
    // Find how many enemy ships are near the planet
    var ships = TANK.main.getChildrenWithComponent("Ship");
    var numShips = 0;
    for (var i in ships)
    {
      var dist = TANK.Math2D.pointDistancePoint([e.Pos2D.x, e.Pos2D.y], [ships[i].Pos2D.x, ships[i].Pos2D.y]);
      if (dist < 700 && ships[i].Ship.faction.team !== faction.team)
        ++numShips;
    }

    return Math.max(Math.round(numShips * 1.5), 1);
  };

  this.update = function(dt)
  {
    // Find idle ships
    this.idleShipScanTimer -= dt;
    if (this.idleShipScanTimer <= 0)
    {
      this.idleShips = [];
      this.idleShipScanTimer = this.idleShipScanTime;
      var ships = TANK.main.getChildrenWithComponent("AIShip");
      for (var i in ships)
      {
        if (ships[i].AIShip.idle)
          this.idleShips.push(ships[i]);
      }
    } 

    // If we don't have a current capture target, find one and create a project for it
    if (!this.currentCaptureTarget)
    {
      console.log("AI: No capture target, picking a new one...");
      var controlPoints = TANK.main.getChildrenWithComponent("ControlPoint");
      for (var i in controlPoints)
      {
        var e = controlPoints[i];
        if (!e.ControlPoint.faction || e.ControlPoint.faction.team !== faction.team)
        {
          console.log("AI: Found capture target, assigning ships...");
          this.currentCaptureTarget = e;
          var threat = this.calculateControlPointThreat(this.currentCaptureTarget);
          var captureProject = new AIProject(this);
          captureProject.target = e;
          captureProject.order = "AIDefend";
          captureProject.buildCombatGroup(threat);
          captureProject.acquireShips();
          captureProject.completeCondition = function()
          {
            return e.ControlPoint.faction === faction;
          };
          this.projects.push(captureProject);
          break;
        }
      }
    }

    // Update existing projects
    for (var i = 0; i < this.projects.length; ++i)
    {
      this.projects[i].update(dt);
      if (this.projects[i].complete)
        this.projects[i] = null;
    }
    this.projects = this.projects.filter(function(val) {return val !== null;});
  };
});

function AIProject(aiFaction)
{
  this.target = null;
  this.order = "";
  this.shipsQueued = 0;
  this.shipsRequired = [];
  this.ready = false;
  this.inProgress = false;
  this.complete = false;

  this.completeCondition = function()
  {
    return false;
  };

  this.buildCombatGroup = function(num)
  {
    this.shipsRequired = [];
    for (var i = 0; i < num; ++i)
    {
      var ship = {type: "frigate"};
      this.shipsRequired.push(ship);
    }
  };

  this.acquireShips = function()
  {
    // Assign any existing idle ships
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      for (var j = 0; j < aiFaction.idleShips.length; ++j)
      {
        if (aiFaction.idleShips[j] && aiFaction.idleShips[j].Ship.shipData.type === this.shipsRequired[i].type)
        {
          this.shipsRequired[i].assignedShip = aiFaction.idleShips[j];
          aiFaction.idleShips[j] = null;
          break;
        }
      }
    }
    console.log("AI: Found " + aiFaction.idleShips.length + " idle ships...");
    aiFaction.idleShips = aiFaction.idleShips.filter(function(val) {return val !== null;});

    // Queue ships for construction to fill remaining places
    var that = this;
    for (var i = 0; i < this.shipsRequired.length; ++i)
    {
      if (!this.shipsRequired[i].assignedShip)
      {
        ++this.shipsQueued;
        console.log("AI: Queued ship for build...");
        aiFaction._entity.Faction.buyShip(this.shipsRequired[i].type, function(e, requiredShip)
        {
          console.log("AI: ...Ship for target complete");
          requiredShip.assignedShip = e;
        }, this.shipsRequired[i]);
      }
    }
  };

  this.update = function(dt)
  {
    // Check if the project is ready
    if (!this.inProgress && this.shipsRequired.length > 0)
    {
      this.ready = true;
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        if (!this.shipsRequired[i].assignedShip)
          this.ready = false;
      }
    }

    // Once the project is ready, assign allocated ships to the target
    if (this.ready && !this.inProgress)
    {
      this.inProgress = true;
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        this.shipsRequired[i].assignedShip.AIShip.giveContextOrder(this.target);
      }
    }

    // Check if the project is complete
    this.complete = this.completeCondition();
    if (this.complete)
    {
      // If so, cancel all orders for the assigned ships
      for (var i = 0; i < this.shipsRequired.length; ++i)
      {
        var item = this.shipsRequired[i];
        if (item.assignedShip && TANK.main.getChild(item.assignedShip._id))
        {
          item.assignedShip.AIShip.clearOrders();
        }
      }
    }
  };
};

})();
TANK.registerComponent("AIShip")

.includes(["Ship"])

.construct(function()
{
  this.idle = true;
  this.actions = [];
  this.removedActions = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;
  var v = this._entity.Velocity;
  var ship = this._entity.Ship;

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, pos, owner)
  {

  });

  // Get the name of a context order
  this.getContextOrder = function(target)
  {
    if (!target)
      return null;

    // Do something with a ship
    if (target.Ship)
    {
      // Attack the ship if it is an enemy
      if (target.Ship.faction.team !== ship.faction.team)
        return "Attack";
      else
        return "Escort";
    }
    // Go to a control point
    else if (target.ControlPoint)
    {
      if (target.ControlPoint.faction.team !== ship.faction.team)
        return "Capture";
      else
        return "Defend";
    }

    return null;
  };

  // Handle being given an order to do something with an object
  this.giveContextOrder = function(target)
  {
    if (!target)
      return;

    // Do something with a ship
    if (target.Ship)
    {
      this.clearOrders();
      // Attack the ship if it is an enemy
      if (target.Ship.faction.team != ship.faction.team)
        this.addOrder(new Action.AIAttack(this._entity, target));
      // Otherwise, escort the ship
      else
        this.addOrder(new Action.AIEscort(this._entity, target));
    }
    // Go to a control point
    else if (target.ControlPoint)
    {
      this.clearOrders();
      if (target.ControlPoint.faction.team !== ship.faction.team)
        this.addOrder(new Action.AIDefend(this._entity, target));
      else
        this.addOrder(new Action.AIDefend(this._entity, target));
    }
  };

  // Add an action to the queue
  this.addOrder = function(order)
  {
    this.actions.push(order);
    this.idle = false;
  };

  // Clear the current queue of orders
  this.clearOrders = function()
  {
    this.actions = [];
  };

  this.update = function(dt)
  {
    // If we have no orders, go defend the nearest control point
    if (this.actions.length === 0)
    {
      this.addOrder(new Action.AIDefendNearest(this._entity));
      this.idle = true;
    }

    // Run current orders
    if (this.actions.length > 0)
    {
      var done = this.actions[0].update(dt);
      if (done || this.actions[0]._done === true)
        this.actions.splice(0, 1);
    }

    // Always scan for enemies in range and fire guns if they come within
    // sights
    var ships = TANK.main.getChildrenWithComponent("Ship");
    for (var i in ships)
    {
      // Skip ships on our team
      var e = ships[i];
      if (e.Ship.faction.team === ship.faction.team)
        continue;

      // Try to shoot at this ship if it is in range
      if (TANK.Math2D.pointDistancePoint([e.Pos2D.x, e.Pos2D.y], [t.x, t.y]) <= this._entity.Weapons.maxRange)
        this.fireGunsAtTarget(e);
    }
  };

  // Attempt to fire guns at a given target, if it is in our sights
  this.fireGunsAtTarget = function(target)
  {
    var targetPos = [target.Pos2D.x, target.Pos2D.y];
    var targetVelocity = [target.Velocity.x, target.Velocity.y];
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);
    var targetDir = Math.atan2(targetPos[1] - t.y, targetPos[0] - t.x);

    // Check each gun and see if it is facing the target and in range
    // If so, fire
    for (var i in this._entity.Weapons.guns)
    {
      var guns = this._entity.Weapons.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        if (guns[j].reloadTimer > 0)
          continue;
        var distFromGun = TANK.Math2D.pointDistancePoint(targetPos, guns[j].worldPos);
        var targetVec = TANK.Math2D.subtract(targetPos, guns[j].worldPos);
        targetVec = TANK.Math2D.scale(targetVec, 1 / distFromGun);
        var gunDir = [Math.cos(guns[j].angle + t.rotation), Math.sin(guns[j].angle + t.rotation)];
        var dot = TANK.Math2D.dot(gunDir, targetVec);
        if (Math.abs(1 - dot) < 0.05 && distFromGun < guns[j].range)
        {
          this._entity.Weapons.fireGun(j, i);
        }
      }
    }
  };
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
    if (e.Ship.faction.team === ship.faction.team)
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
  this.damage = 0.2;
  this.trailEffect = "mediumRailTrail";
  this.size = 3;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this._entity.Collider2D.collisionLayer = "bullets";
  this._entity.Collider2D.collidesWith = ["ships"];

  this.trailEmitter = ParticleLibrary[this.trailEffect]();

  TANK.main.Renderer2D.add(this);

  this.listenTo(this._entity, "collide", function(obj)
  {
    if (this.owner === obj)
      return;

    // Special ship collision logic
    var hit = true;
    if (obj.Ship)
    {
      hit = false;
      if (this.owner.Ship && this.owner.Ship.faction === obj.Ship.faction)
        return;

      var testPos = [t.x, t.y];
      var shipPos = [obj.Pos2D.x, obj.Pos2D.y];
      var shipHalfSize = TANK.Math2D.scale([obj.Ship.collisionBuffer.width / 2, obj.Ship.collisionBuffer.height / 2], TANK.main.Game.scaleFactor);
      testPos = TANK.Math2D.subtract(testPos, shipPos);
      testPos = TANK.Math2D.rotate(testPos, -obj.Pos2D.rotation);
      testPos = TANK.Math2D.add(testPos, shipHalfSize);
      testPos = TANK.Math2D.scale(testPos, 1 / TANK.main.Game.scaleFactor);
      var p = obj.Ship.collisionBuffer.getPixel(testPos[0], testPos[1]);
      if (p[3] > 0)
      {
        // Do damage
        obj.dispatch("damaged", this.damage, [this._entity.Velocity.x, this._entity.Velocity.y], [t.x, t.y], this.owner);
        this._entity.Life.life = 0;
        this.stopListeningTo(this._entity, "collide");
        obj.Ship.addDamage(testPos[0], testPos[1], this.damage * (30 + Math.random() * 30));

        // Spawn effect
        ParticleLibrary.damageMedium(t.x, t.y, t.rotation + Math.PI);
        hit = true;
      }
    }

    if (!hit)
      return;

    // Shake screen if on camera
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2)
      TANK.main.dispatch("camerashake", 0.1 / dist);
  });

  this.update = function(dt)
  {
    this.trailEmitter.Pos2D.x = t.x;
    this.trailEmitter.Pos2D.y = t.y;
  };

  this.draw = function(ctx, camera)
  {
    ctx.save();
    ctx.globalCompositeOperation = "lighten";
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(1, 2);
    ctx.rotate(t.rotation);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, this.size, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
})

.uninitialize(function()
{
  TANK.main.removeChild(this.trailEmitter);
});
TANK.registerComponent("Clickable")

.includes("Pos2D")

.construct(function()
{
  this.width = 0;
  this.height = 0;
  this.radius = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  this.checkClick = function(pos)
  {
    if (this.radius)
    {
      return TANK.Math2D.pointDistancePoint(pos, [t.x, t.y]) < this.radius;
    }

    return TANK.Math2D.pointInAABB(pos, [t.x, t.y], [this.width, this.height]);
  };
});
TANK.registerComponent("ControlPoint")

.includes(["Planet", "OrderTarget"])

.construct(function()
{
  this.zdepth = 0;
  this.faction = null;
  this.value = 10;
  this.moneyTime = 5;
  this.moneyTimer = 0;
  this.pendingFaction = null;
  this.capturePercent = 0;
  this.captureDistance = 500;
  this.passiveCapture = 0.05
  this.queuedShips = [];
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this._entity.Clickable.radius = this._entity.Planet.radius * TANK.main.Game.scaleFactor;

  this.tryCapture = function(faction, amount)
  {
    // If no one is trying to capture us currently, start being captured by them
    if (!this.pendingFaction)
      this.pendingFaction = faction;

    // If the faction is currently trying to capture us, then increase their capture percent
    if (this.pendingFaction === faction)
      this.capturePercent += amount;

    // If the faction is trying to restore us, then decrease the capture percent
    if (this.pendingFaction && this.pendingFaction.team !== faction.team)
      this.capturePercent -= amount;

    // If our capture percent reaches 1, transition ownerships
    if (this.capturePercent >= 1)
    {
      this.capturePercent = 0;

      var oldFaction = this.faction;

      // If we are currently owned, move to neutral state
      // Otherwise, we are now owned by pending faction
      if (this.faction)
        this.faction = null;
      else
        this.faction = this.pendingFaction;

      this.pendingFaction = null;

      if (oldFaction)
        oldFaction.removeControlPoint(this);
      if (this.faction)
        this.faction.addControlPoint(this);

      if (!this.faction)
        console.log("Team " + oldFaction.team + " lost its control point");
      else
        console.log("Team " + this.faction.team + " gained a control point");
    }

    // If our capture percent reaches 0, lose the pending faction
    if (this.capturePercent <= 0 && this.pendingFaction)
    {
      this.capturePercent = 0;
      this.pendingFaction = null;
    }
  };

  this.buyShip = function(shipType, callback, data)
  {
    var shipData = new Ships[shipType]();

    if (this.faction.money >= shipData.cost)
    {
      this.faction.money -= shipData.cost;
      this.queuedShips.push({shipData: shipData, time: shipData.buildTime, callback: callback, data: data});
      return true;
    }

    return false;
  };

  this.draw = function(ctx, camera)
  {
    if (camera.z >= 8)
    {
      // Draw strategic icon
      ctx.save();
      ctx.fillStyle = this.faction ? this.faction.color : "#555";
      ctx.lineWidth = 2;
      ctx.translate(t.x - camera.x, t.y - camera.y);

      ctx.beginPath();
      ctx.arc(0, 0, 300, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (this.faction && this.faction.team === 0)
    {
      // Draw queue
      ctx.save();
      ctx.fillStyle = "#ddd";
      ctx.font =  20 * camera.z + "px sans-serif";
      ctx.translate(t.x - camera.x, t.y - camera.y);
      for (var i = 0; i < this.queuedShips.length; ++i)
      {
        var timeRemaining = Math.round(this.queuedShips[i].time);
        ctx.fillText(this.queuedShips[i].shipData.name + " - " + timeRemaining + " seconds", 400, -400 + i * 40);
      }
      ctx.restore();
    }
  };

  this.update = function(dt)
  {
    // Passively re-capture self
    if (this.capturePercent > 0 && this.faction)
      this.tryCapture(this.faction, this.passiveCapture * dt);

    // Earn money
    this.moneyTimer += dt;
    if (this.moneyTimer >= this.moneyTime)
    {
      this.moneyTimer = 0;

      if (this.faction)
        this.faction.money += this.value;
    }

    // Process build queue
    for (var i = 0; i < this.queuedShips.length; ++i)
    {
      var item = this.queuedShips[i];
      item.time -= dt;
      if (item.time <= 0)
      {
        var e = TANK.createEntity("AIShip");
        e.Ship.faction = this.faction;
        e.Ship.shipData = item.shipData;
        e.Pos2D.x = t.x - 400 + Math.random() * 800;
        e.Pos2D.y = t.y - 400 + Math.random() * 800;
        TANK.main.addChild(e);

        this.queuedShips.splice(i, 1);
        --i;

        if (item.callback)
          item.callback(e, item.data);
      }
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

TANK.registerComponent("Faction")

.construct(function()
{
  this.team = 0;
  this.color = "#666";
  this.money = 50;
  this.controlPoints = [];
  this.shipsToBuy = [];
})

.initialize(function()
{
  this.listenTo(this._entity, "buyship", function(ship, callback, data)
  {
    this.buyShip(ship, callback, data);
  });

  this.buyShip = function(type, callback, data)
  {
    // Find a control point with small queue
    var shortestQueueLength = Infinity;
    var chosenControlPoint = null;
    for (var i = 0; i < this.controlPoints.length; ++i)
    {
      if (this.controlPoints[i].queuedShips.length < shortestQueueLength)
      {
        shortestQueueLength = this.controlPoints[i].queuedShips.length;
        chosenControlPoint = this.controlPoints[i];
      }
    }

    if (chosenControlPoint) 
    {
      if (!chosenControlPoint.buyShip(type, callback, data))
      {
        this._entity.dispatchTimed(5, "buyship", type, callback, data);
      }
    }
  };

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
  this.scaleFactor = 3;
  this.factions = [];
  this.barCommands = [];
  this.topBarItems = [];
  this.mousePosWorld = [0, 0];
  this.mousePosScreen = [0, 0];
  this.lightDir = Math.random() * Math.PI * 2;

  this.currentLevel = -1;
  this.pendingLoad = false;
})

.initialize(function()
{
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
    name: "Build Fighter",
    activate: function()
    {
      that.factions[0].buyShip("fighter");
    }
  });
  this.barCommands.push(
  {
    name: "Build Frigate",
    activate: function()
    {
      that.factions[0].buyShip("frigate");
    }
  });

  this.barUI.on("activate", function(e)
  {
    e.context.activate();
  });

  // Money counter
  this.topBarItems.push({name: ""});

  this.updateMousePos = function(pos)
  {
    this.mousePosScreen = [pos[0], pos[1]];
    this.mousePosWorld = pos;
    this.mousePosWorld[0] -= window.innerWidth / 2;
    this.mousePosWorld[1] -= window.innerHeight / 2;
    this.mousePosWorld[0] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[1] *= TANK.main.Renderer2D.camera.z;
    this.mousePosWorld[0] += TANK.main.Renderer2D.camera.x;
    this.mousePosWorld[1] += TANK.main.Renderer2D.camera.y;
  };

  this.loadLevelNow = function(index)
  {
    var level = Levels[index];

    // Create faction entities
    for (var i = 0; i < level.factions.length; ++i)
    {
      var e = level.factions[i].player ? TANK.createEntity("Faction") : TANK.createEntity("AIFaction");
      e.Faction.team = level.factions[i].team;
      e.Faction.color = level.factions[i].color;
      this.factions.push(e.Faction);
      TANK.main.addChild(e);
    }

    // Create control points
    for (var i = 0; i < level.controlPoints.length; ++i)
    {
      var cp = level.controlPoints[i];
      e = TANK.createEntity("ControlPoint");
      e.Pos2D.x = cp.x;
      e.Pos2D.y = cp.y;
      this.factions[cp.faction].addControlPoint(e.ControlPoint);
      TANK.main.addChild(e);
    }

    // Create ships
    for (var i = 0; i < level.ships.length; ++i)
    {
      e = level.ships[i].player ? TANK.createEntity("Player") : TANK.createEntity("AIShip");
      e.Pos2D.x = level.ships[i].x;
      e.Pos2D.y = level.ships[i].y;
      e.Ship.shipData = new Ships[level.ships[i].ship];
      e.Ship.faction = this.factions[level.ships[i].faction];
      TANK.main.addChild(e);
    }
  };

  this.goToLevel = function(index)
  {
    // Send out a message to all existing level objects to be destroyed
    TANK.main.dispatch("levelCleanup");
    this.factions = [];

    // Set current level marker and set a pending load
    this.currentLevel = index;
    this.pendingLoad = true;
  };

  this.listenTo(TANK.main, "scanforplayership", function(faction, pos)
  {
    console.log("Looking for ship to transfer to...");
    var ships = TANK.main.getChildrenWithComponent("Ship");
    var closestShip = null;
    var minDist = Infinity;
    if (!pos)
      pos = [0, 0];
    for (var i in ships)
    {
      if (ships[i].Ship.faction !== faction)
        continue;

      var shipPos = [ships[i].Pos2D.x, ships[i].Pos2D.y];
      var dist = TANK.Math2D.pointDistancePoint(pos, shipPos);
      if (dist < minDist)
      {
        minDist = dist;
        closestShip = ships[i];
        console.log("Found ship " + i);
      }
    }

    if (closestShip)
    {
      console.log("Transferring to ship " + closestShip._id);
      // Transfer control to closest ship
      closestShip.removeComponent("AIShip");
      closestShip.removeComponent("AIWatch");
      closestShip.addComponent("Player");
    }
    else
    {
      // If we couldn't find a ship to transfer control to, inform the game to wait for
      // a new ship to be built
      TANK.main.dispatchTimed(3, "scanforplayership", faction, pos);
    }
  });

  this.listenTo(TANK.main, "mousemove", function(e)
  {
    this.updateMousePos([e.x, e.y]);
  });

  this.listenTo(TANK.main, "touchmove", function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
  });
  this.listenTo(TANK.main, "touchstart", function(e)
  {
    this.updateMousePos([e.touches[0].clientX, e.touches[0].clientY]);
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

  this.listenTo(TANK.main, "start", function()
  {
    // var e = TANK.createEntity("Faction");
    // e.Faction.team = 0;
    // e.Faction.color = "#5d5";
    // this.factions.push(e.Faction);
    // TANK.main.addChild(e);

    // e = TANK.createEntity("Faction");
    // e.Faction.team = 1;
    // e.Faction.color = "#d55";
    // this.factions.push(e.Faction);
    // TANK.main.addChild(e);

    // e = TANK.createEntity("ControlPoint");
    // this.factions[0].addControlPoint(e.ControlPoint);
    // TANK.main.addChild(e);

    // e = TANK.createEntity("ControlPoint");
    // e.Pos2D.x = 2000;
    // e.Pos2D.y = 2000;
    // this.factions[1].addControlPoint(e.ControlPoint);
    // TANK.main.addChild(e);

    // e = TANK.createEntity("Player");
    // e.Pos2D.x = 0;
    // e.Pos2D.y = 0;
    // e.Ship.shipData = new Ships.frigate();
    // e.Ship.faction = this.factions[0];
    // TANK.main.addChild(e);

    this.goToLevel(0);
  });

  this.update = function(dt)
  {
    // Load levels
    if (this.pendingLoad)
    {
      this.loadLevelNow(this.currentLevel);
      this.pendingLoad = false;
    }

    // Update faction money count
    this.topBarUI.set("items[0].name", "Funds: " + this.factions[0].money);
  };
});

TANK.registerComponent("Glow")

.includes(["Pos2D", "Velocity", "Life"])

.construct(function()
{
  this.zdepth = 5;
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
var Guns = {};


Guns.smallRail = function()
{
  this.image = new Image();
  this.image.src = "res/small-rail.png";
  this.shootEffect = "gunFireSmall";
  this.trailEffect = "smallRailTrail";
  this.screenShake = 0;
  this.reloadTime = 1;
  this.reloadTimer = 0;
  this.range = 500;
  this.damage = 0.01;
  this.projectileSpeed = 900;
  this.projectileSize = 1;
  this.recoil = 2;
  this.x = 0;
  this.y = 0;
};

Guns.mediumRail = function()
{
  this.image = new Image();
  this.image.src = "res/medium-rail.png";
  this.shootEffect = "gunFireMedium";
  this.trailEffect = "mediumRailTrail";
  this.screenShake = 0.5;
  this.reloadTime = 5;
  this.reloadTimer = 0;
  this.range = 800;
  this.damage = 0.1;
  this.projectileSpeed = 800;
  this.projectileSize = 3;
  this.recoil = 7;
  this.x = 0;
  this.y = 0;
};

var Levels = [];

Levels[0] = 
{
  name: "Sample Level",
  factions: 
  [
    {player: true, team: 0, color: "#5d5"},
    {player: false, team: 1, color: "#d55"}
  ],
  controlPoints: 
  [
    {x: 0, y: 0, faction: 0},
    {x: 2000, y: 2000, faction: 1}
  ],
  ships:
  [
    {player: true, faction: 0, ship: "frigate", x: 0, y: 0},
    {player: false, faction: 1, ship: "frigate", x: 2000, y: 2000}
  ]
};
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
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(-light.radius + 0.5, -light.radius + 0.5);
      ctx.drawImage(light.buffer.canvas, light.x, light.y);
      ctx.restore();
    }

    ctx.restore();
  };
});
TANK.registerComponent("OrderTarget").includes("Clickable");
var ParticleLibrary = {};

ParticleLibrary.slowMediumFire = function()
{
  var e = TANK.createEntity("ParticleEmitter");
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/particle-fire-1.png";
  emitter.spawnOffsetMin = [-50, -50];
  emitter.spawnOffsetMax = [50, 50];
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 10;
  emitter.spawnPerSecond = 5;
  emitter.particleLifeMin = 4;
  emitter.particleLifeMax = 7;
  emitter.particleRotateSpeedMin = -1;
  emitter.particleRotateSpeedMax = 1;
  emitter.particleAlphaDecayMin = 0.98;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.005;
  return e;
};

ParticleLibrary.explosionMedium = function(x, y)
{
  var obj = {};
  obj.fire = ParticleLibrary.explosionMediumFire(x, y);
  obj.smoke = ParticleLibrary.explosionMediumSmoke(x, y);
  obj.sparks = ParticleLibrary.explosionMediumSparks(x, y);
  obj.fireballs = ParticleLibrary.explosionMediumFireballs(x, y);
  TANK.main.addChild(obj.fire);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  TANK.main.addChild(obj.fireballs);
  return obj;
};

ParticleLibrary.explosionMediumFire = function(x, y)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/particle-fire-1.png";
  emitter.spawnOffsetMin = [-40, -40];
  emitter.spawnOffsetMax = [40, 40];
  emitter.spawnSpeedMin = 150;
  emitter.spawnSpeedMax = 250;
  emitter.spawnScaleMin = 8;
  emitter.spawnScaleMax = 14;
  emitter.spawnPerSecond = 200;
  emitter.spawnDuration = 0.2;
  emitter.spawnAlphaMin = 0.7;
  emitter.spawnAlphaMax = 0.8;
  emitter.particleLifeMin = 5;
  emitter.particleLifeMax = 8;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.005;
  return e;
};

ParticleLibrary.explosionMediumFireballs = function(x, y)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.particleImage.src = "res/particle-fire-1.png";
  emitter.spawnOffsetMin = [-60, -60];
  emitter.spawnOffsetMax = [60, 60];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnScaleMin = 2;
  emitter.spawnScaleMax = 4;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.explosionMediumSparks = function(x, y)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnOffsetMin = [-60, -60];
  emitter.spawnOffsetMax = [60, 60];
  emitter.spawnSpeedMin = 350;
  emitter.spawnSpeedMax = 550;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.95;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.5;
  emitter.particleRotateSpeedMax = 0.5;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.explosionMediumSmoke = function(x, y)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 10;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/particle-smoke-1.png";
  emitter.spawnOffsetMin = [-70, -70];
  emitter.spawnOffsetMax = [70, 70];
  emitter.spawnSpeedMin = 50;
  emitter.spawnSpeedMax = 100;
  emitter.spawnScaleMin = 15;
  emitter.spawnScaleMax = 25;
  emitter.spawnPerSecond = 25;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.98;
  emitter.particleFrictionMax = 0.99;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireSmall = function(x, y, angle)
{
  var obj = {};
  obj.smoke = ParticleLibrary.gunFireSmallSmoke(x, y, angle);
  obj.sparks = ParticleLibrary.gunFireSmallSparks(x, y, angle);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  return obj;
};

ParticleLibrary.gunFireSmallSmoke = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/particle-smoke-1.png";
  emitter.spawnOffsetMin = [-8, -8];
  emitter.spawnOffsetMax = [8, 8];
  emitter.spawnSpeedMin = 100;
  emitter.spawnSpeedMax = 150;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 2;
  emitter.spawnScaleMax = 5;
  emitter.spawnPerSecond = 15;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 4;
  emitter.particleLifeMax = 7;
  emitter.particleFrictionMin = 0.96;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireSmallSparks = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 0.5;
  emitter.spawnScaleMax = 0.75;
  emitter.spawnPerSecond = 200;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 1;
  emitter.particleLifeMax = 2;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.gunFireMedium = function(x, y, angle)
{
  var obj = {};
  obj.smoke = ParticleLibrary.gunFireMediumSmoke(x, y, angle);
  obj.sparks = ParticleLibrary.gunFireMediumSparks(x, y, angle);
  TANK.main.addChild(obj.smoke);
  TANK.main.addChild(obj.sparks);
  return obj;
};

ParticleLibrary.gunFireMediumSmoke = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 8;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.blendMode = "source-over";
  emitter.particleImage.src = "res/particle-smoke-1.png";
  emitter.spawnOffsetMin = [-20, -20];
  emitter.spawnOffsetMax = [20, 20];
  emitter.spawnSpeedMin = 100;
  emitter.spawnSpeedMax = 150;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 10;
  emitter.spawnScaleMax = 15;
  emitter.spawnPerSecond = 15;
  emitter.spawnDuration = 0.2;
  emitter.particleLifeMin = 6;
  emitter.particleLifeMax = 9;
  emitter.particleFrictionMin = 0.96;
  emitter.particleFrictionMax = 0.98;
  emitter.particleRotateSpeedMin = -0.25;
  emitter.particleRotateSpeedMax = 0.25;
  emitter.particleAlphaDecayMin = 0.99;
  emitter.particleAlphaDecayMax = 0.995;
  emitter.particleScaleDecayMin = 1.001;
  emitter.particleScaleDecayMax = 1.003;
  return e;
};

ParticleLibrary.gunFireMediumSparks = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 350;
  emitter.spawnSpeedMax = 550;
  emitter.spawnAngleMin = angle - 0.2;
  emitter.spawnAngleMax = angle + 0.2;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 3;
  emitter.particleLifeMax = 5;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  return e;
};

ParticleLibrary.damageMedium = function(x, y, angle)
{
  var e = TANK.createEntity(["ParticleEmitter", "Life"]);
  e.Pos2D.x = x;
  e.Pos2D.y = y;
  e.Life.life = 3;
  var emitter = e.ParticleEmitter;
  emitter.zdepth = 5;
  emitter.alignRotationToSpawnAngle = true;
  emitter.particleImage.src = "res/particle-fire-1.png";
  emitter.spawnOffsetMin = [-5, -5];
  emitter.spawnOffsetMax = [5, 5];
  emitter.spawnSpeedMin = 250;
  emitter.spawnSpeedMax = 350;
  emitter.spawnAngleMin = angle - 0.3;
  emitter.spawnAngleMax = angle + 0.3;
  emitter.spawnScaleMin = 1;
  emitter.spawnScaleMax = 2;
  emitter.spawnPerSecond = 700;
  emitter.spawnDuration = 0.1;
  emitter.particleLifeMin = 3;
  emitter.particleLifeMax = 5;
  emitter.particleFrictionMin = 0.92;
  emitter.particleFrictionMax = 0.95;
  emitter.particleAlphaDecayMin = 0.97;
  emitter.particleAlphaDecayMax = 0.99;
  emitter.particleScaleDecayMin = 0.96;
  emitter.particleScaleDecayMax = 0.98;
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.smallRailTrail = function()
{
  var e = TANK.createEntity(["ParticleEmitter"]);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnPerSecond = 100;
  emitter.particleLifeMin = 0.2;
  emitter.particleLifeMax = 0.3;
  emitter.spawnScaleMin = 0.5;
  emitter.spawnScaleMax = 1;
  emitter.particleAlphaDecayMin = 0.80;
  emitter.particleAlphaDecayMax = 0.85;
  TANK.main.addChild(e);
  return e;
};

ParticleLibrary.mediumRailTrail = function()
{
  var e = TANK.createEntity(["ParticleEmitter"]);
  var emitter = e.ParticleEmitter;
  emitter.particleImage.src = "res/particle-spark-1.png";
  emitter.spawnPerSecond = 200;
  emitter.particleLifeMin = 0.2;
  emitter.particleLifeMax = 0.4;
  emitter.particleAlphaDecayMin = 0.80;
  emitter.particleAlphaDecayMax = 0.85;
  TANK.main.addChild(e);
  return e;
};
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

  this.readBuffer = function()
  {
    this.buffer = this.context.getImageData(0, 0, this.width, this.height);
  };

  this.applyBuffer = function()
  {
    this.context.putImageData(this.buffer, 0, 0);
  };

  this.setPixel = function(x, y, color)
  {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return;

    var index = x * 4 + (y * this.buffer.width * 4);
    this.buffer.data[index + 0] = Math.floor(color[0]);
    this.buffer.data[index + 1] = Math.floor(color[1]);
    this.buffer.data[index + 2] = Math.floor(color[2]);
    this.buffer.data[index + 3] = Math.floor(color[3]);
  };

  this.setPixelRadius = function(centerX, centerY, radiusA, colorA, radiusB, colorB)
  {
    this.setPixelRadiusRand(centerX, centerY, radiusA, colorA, 1, radiusB, colorB, 1);
  };

  this.setPixelRadiusRand = function(centerX, centerY, radiusA, colorA, randA, radiusB, colorB, randB)
  {
    var radius = radiusB || radiusA;
    var xStart = Math.floor(centerX - radius);
    var xEnd = Math.floor(centerX + radius);
    var yStart = Math.floor(centerY - radius);
    var yEnd = Math.floor(centerY + radius);

    // Iterate over the area defined by radius
    for (var x = xStart; x < xEnd; ++x)
    {
      for (var y = yStart; y < yEnd; ++y)
      {
        // Only draw within radius
        var d = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        if (d < radius)
        {
          if (radiusB)
          {
            // If a second color and radius specified, interpolate between colorA and B
            var t = (d - radiusA) / (radiusB - radiusA);
            var rand = randA * (1 - t) + randB * t;
            if (Math.random() >= rand)
              continue;
            var color = [];
            for (var i = 0; i < 4; ++i)
              color[i] = Math.round(colorA[i] * (1 - t) + colorB[i] * t);
            this.setPixel(x, y, color);
          }
          else if (Math.random() < randA)
          {
            // Otherwise just set the color
            this.setPixel(x, y, colorA);
          }
        }
      }
    }
  };

  this.getPixel = function(x, y)
  {
    x = Math.round(x);
    y = Math.round(y);
    var index = x * 4 + (y * this.buffer.width * 4);
    var pixel = [];
    pixel[0] = this.buffer.data[index + 0];
    pixel[1] = this.buffer.data[index + 1];
    pixel[2] = this.buffer.data[index + 2];
    pixel[3] = this.buffer.data[index + 3];
    return pixel;
  };

  this.testRay = function(rayStart, rayDir, precision)
  {
    var p = [rayStart[0], rayStart[1]];
    var len = Math.sqrt(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1]);
    var v = [rayDir[0] / len, rayDir[1] / len];
    if (typeof precision === "undefined")
      precision = 5;
    var hit = false;
    var minSteps = 10;
    while (!hit)
    {
      p[0] += v[0] * precision;
      p[1] += v[1] * precision;
      var pixel = this.getPixel(p[0], p[1]);
      if (pixel && pixel[3] > 0)
        return p;
      if (!pixel)
      {
        --minSteps;
        if (minSteps < 0)
          return null;
      }
    }
  };
}
(function()
{

TANK.registerComponent("Planet")

.includes(["Pos2D", "Collider2D"])

.construct(function()
{
  this.zdepth = 0;
  this.radius = 128;
  this.atmosColor = 
  [
    Math.round(100 + Math.random() * 150), 
    Math.round(100 + Math.random() * 150), 
    Math.round(100 + Math.random() * 150), 
    0.8
  ];
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
  this.lightSize = Math.floor(this.size * 1.25);
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
  grad = this.lightBuffer.context.createRadialGradient(x - this.radius / 4, y, this.radius * 1.2, x, y, this.radius * 1.8);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.0)");
  grad.addColorStop(0.6, "rgba(0, 0, 0, 0.6)");
  grad.addColorStop(0.8, "rgba(0, 0, 0, 0.7)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.9)");

  this.lightBuffer.context.fillStyle = grad;
  this.lightBuffer.context.beginPath();
  this.lightBuffer.context.arc(0, 0, this.radius, 2 * Math.PI, false);
  this.lightBuffer.context.fill();
  this.lightBuffer.context.closePath();

  this.draw = function(ctx, camera, dt)
  {
    if (camera.z >= 8)
      return;

    ctx.save();

    // Draw planet
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);
    ctx.translate(this.size / -2, this.size / -2);
    ctx.drawImage(this.pixelBuffer.canvas, 0, 0);

    // Draw lighting
    var sizeDiff = (this.lightSize - this.size) / 2;
    ctx.translate((this.lightSize) / 2 - sizeDiff, (this.lightSize) / 2 - sizeDiff);
    ctx.rotate(TANK.main.Game.lightDir + Math.PI);
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
  this.clickTimer = 1;

  this.headingPos = [0, 0];
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
    var mousePos = TANK.Math2D.subtract(TANK.main.Game.mousePosScreen, [window.innerWidth / 2, window.innerHeight / 2]);
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      // var pos = TANK.Math2D.rotate(this.fireButtons[i].pos, t.rotation);
      var pos = TANK.Math2D.scale(this.fireButtons[i].pos, TANK.main.Game.scaleFactor);
      pos = TANK.Math2D.add(pos, this.headingPos);
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
        if (targets[i].Clickable.checkClick(TANK.main.Game.mousePosWorld))
        {
          this.pendingOrder = this.selectedShips[0].AIShip.getContextOrder(targets[i]);
          this.pendingTarget = targets[i];
          return;
        }
      }
    }

    // Handle the beginning of a selection drag if the mouse down was outside
    // of the heading radius
    var distToHUD = TANK.Math2D.pointDistancePoint(this.headingPos, mousePos);
    if (distToHUD > this.headingRadiusScaled && !TANK.main.Game.zooming)
    {
      this.selecting = true;
      this.selectPos = [TANK.main.Game.mousePosWorld[0], TANK.main.Game.mousePosWorld[1]];
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

    TANK.main.Game.zooming = false;
    this.mouseDown = false;
    this.fireButtonDown = false;
    this.selecting = false;
    this.pendingTarget = null;
    this.pendingOrder = null;
  };

  this.mouseMoveHandler = function(e)
  {
    // Handle changing heading
    if (this.mouseDown && !this.fireButtonDown && !this.selecting && !this.pendingTarget)
    {
      var mousePos = TANK.Math2D.subtract(TANK.main.Game.mousePosScreen, [window.innerWidth / 2, window.innerHeight / 2]);

      var dist = TANK.Math2D.pointDistancePoint(this.headingPos, mousePos);
      if (dist < this.headingRadiusScaled)
      {
        // Ignore if we are too close to center
        if (dist > this.headingRadiusScaled * 0.1)
        {
          // Get heading
          var newHeading = Math.atan2(mousePos[1] - this.headingPos[1], mousePos[0] - this.headingPos[0]);
          ship.heading = newHeading;

          // Get speed
          ship.desiredSpeed = (dist / this.headingRadiusScaled) * ship.shipData.maxSpeed;
        }
        else
          ship.desiredSpeed = 0;
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

        // Skip ships not on our faction
        if (ships[i].Ship.faction !== this._entity.Ship.faction)
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
    this.headingRadius = 50;
    this.headingRadiusScaled = this.headingRadius * TANK.main.Game.scaleFactor;
    this.headingPos = [window.innerWidth / 2 - this.headingRadiusScaled - 30, window.innerHeight / 2 - this.headingRadiusScaled - 60];
    this.fireButtons =
    [
      {side: "left", pos: [0, -this.headingRadius * 0.75], radius: 6},
      {side: "right", pos: [0, this.headingRadius * 0.75], radius: 6},
      {side: "front", pos: [this.headingRadius * 0.75, 0], radius: 6},
      {side: "back", pos: [-this.headingRadius * 0.75, 0], radius: 6},
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

    // Draw context order text
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

    // Draw player HUD
    ctx.save();
    ctx.scale(camera.z, camera.z);
    ctx.translate(this.headingPos[0], this.headingPos[1]);
    ctx.scale(TANK.main.Game.scaleFactor, TANK.main.Game.scaleFactor);

    // Draw compass
    // Outer circle
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.headingRadius, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, this.headingRadius * 0.1, Math.PI * 2, false);
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
    var startPos = [Math.cos(ship.heading), Math.sin(ship.heading)];
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
    ctx.lineTo(startPos[0] + Math.cos(ship.heading) * (this.headingRadius) * speedPercent,
               startPos[1] + Math.sin(ship.heading) * (this.headingRadius) * speedPercent);
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
    ctx.fillStyle = "rgba(255, 80, 80, 0.5)";

    // Front Back
    for (var i = 0; i < this.fireButtons.length; ++i)
    {
      drawGun(this.fireButtons[i]);
    }

    ctx.restore();
  };
});
TANK.registerComponent("Ship")

.includes(["Pos2D", "Velocity", "Lights", "Collider2D", "Weapons", "OrderTarget"])

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

  // Create texture buffers
  this.mainBuffer = new PixelBuffer();
  this.damageBuffer = new PixelBuffer();
  this.decalBuffer = new PixelBuffer();
  this.collisionBuffer = new PixelBuffer();

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
    that._entity.Clickable.width = that.image.width * TANK.main.Game.scaleFactor;
    that._entity.Clickable.height = that.image.height * TANK.main.Game.scaleFactor;
    that._entity.Weapons.width = that.image.width;
    that._entity.Weapons.height = that.image.height;

    // Setup texture buffers
    that.mainBuffer.createBuffer(that.image.width, that.image.height);
    that.damageBuffer.createBuffer(that.image.width, that.image.height);
    that.decalBuffer.createBuffer(that.image.width, that.image.height);
    that.collisionBuffer.createBuffer(that.image.width, that.image.height);
    that.collisionBuffer.context.drawImage(that.image, 0, 0);
    that.collisionBuffer.readBuffer();
  });

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
    if (typeof speedPercent === "undefined")
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
      TANK.main.dispatchTimed(1, "scanforplayership", this.faction, [t.x, t.y]);
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
      TANK.main.dispatch("camerashake", 0.5);
  };

  // Damage response
  this.listenTo(this._entity, "damaged", function(damage, dir, pos, owner)
  {
    // Affect trajectory
    v.x += dir[0] * 0.02;
    v.y += dir[1] * 0.02;
    var dir = TANK.Math2D.getDirectionToPoint([t.x, t.y], t.rotation, [t.x + dir[0], t.y + dir[1]]);
    v.r += dir * 0.5;

    // Do damage
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

    // Draw team indicator
    if (camera.z < 8)
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
      ctx.strokeStyle = "rgba(150, 255, 150, 0.8)";
      ctx.strokeRect(0, 0, this.image.width, this.image.height);
    }

    ctx.restore();
  };
});
var Ships = {};

Ships.fighter = function()
{
  this.type = "fighter";
  this.name = "Fighter";
  this.image = "res/fighter.png";
  this.imageEngine = "res/fighter-engine.png";
  this.imageLighting =
  {
    left: "res/fighter-lit-left.png",
    right: "res/fighter-lit-right.png",
    front: "res/fighter-lit-front.png",
    back: "res/fighter-lit-back.png"
  };
  this.maxTurnSpeed = 1.0;
  this.maxSpeed = 250;
  this.accel = 35;
  this.turnAccel = 2.0;
  this.health = 0.2;
  this.cost = 5;
  this.buildTime = 2;
  this.guns =
  {
    front:
    [
      {
        type: "smallRail",
        x: 19,
        y: 14
      }
    ]
  },
  this.lights =
  [
    {
      x: 3, y: 6, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 2, y: 15, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 4, y: 22, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 13, y: 15, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
      states:
      {
        on: {alpha: 0.5},
        off: {alpha: 0.2}
      }
    }
  ];
};

Ships.frigate = function()
{
  this.type = "frigate";
  this.name = "Frigate";
  this.image = "res/frigate.png";
  this.imageEngine = "res/frigate-engine.png";
  this.imageLighting =
  {
    left: "res/frigate-lit-left.png",
    right: "res/frigate-lit-right.png",
    front: "res/frigate-lit-front.png",
    back: "res/frigate-lit-back.png"
  };
  this.maxTurnSpeed = 0.35;
  this.maxSpeed = 150;
  this.accel = 15;
  this.turnAccel = 1.2;
  this.health = 1;
  this.cost = 30;
  this.buildTime = 5;
  this.guns =
  {
    left:
    [
      {
        type: "mediumRail",
        x: 20,
        y: 3
      },
      {
        type: "mediumRail",
        x: 40,
        y: 3
      }
    ],
    front:
    [
      {
        type: "mediumRail",
        x: 78,
        y: 28
      }
    ],
    right:
    [
      {
        type: "mediumRail",
        x: 20,
        y: 45
      },
      {
        type: "mediumRail",
        x: 40,
        y: 45
      }
    ],
    back:
    [
      {
        type: "mediumRail",
        x: 23,
        y: 30
      }
    ]
  },
  this.lights =
  [
    {
      x: 6, y: 3, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 6, y: 43, colorA: [210, 210, 255], colorB: [150, 150, 255], state: "off", isEngine: true,
      states:
      {
        on: {radius: 10, alpha: 0.8},
        off: {radius: 6, alpha: 0.3}
      }
    },
    {
      x: 49, y: 3, radius: 6, colorA: [255, 180, 180], colorB: [255, 150, 150], state: "off", blinkTime: 1.5,
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
  this.zdepth = 3;
  this.guns =
  {
    left: [],
    right: [],
    front: [],
    back: []
  };
  this.height = 10;
  this.width = 5;
  this.maxRange = 0;
})

.initialize(function()
{
  var t = this._entity.Pos2D;

  TANK.main.Renderer2D.add(this);

  this.addGun = function(gunObj, gunSide)
  {
    var angle;
    if (gunSide === "front")
      angle = 0;
    else if (gunSide === "back")
      angle = Math.PI;
    else if (gunSide === "left")
      angle = Math.PI / -2;
    else if (gunSide === "right")
      angle = Math.PI / 2;

    gunObj.angle = angle;
    this.guns[gunSide].push(gunObj);
  };

  this.removeGun = function(gunObj, gunSide)
  {
    for (var i = 0; i < this.guns[gunSide].length; ++i)
    {
      if (this.guns[gunSide][i] === gunObj)
      {
        this.guns[gunSide].splice(i, 1);
        return true;
      }
    }

    return false;
  };

  this.reloadPercent = function(gunSide)
  {
    if (this.guns[gunSide].length === 0)
      return 0;
    var gun = this.guns[gunSide][0]; 
    return 1 - gun.reloadTimer / gun.reloadTime;
  };

  this.fireGun = function(gunIndex, gunSide)
  {
    var gun = this.guns[gunSide][gunIndex];
    if (gun.reloadTimer > 0)
      return;
    gun.reloadTimer = gun.reloadTime;

    var pos = gun.worldPos;

    // Fire bullet
    var e = TANK.createEntity("Bullet");
    e.Pos2D.x = pos[0];
    e.Pos2D.y = pos[1];
    e.Pos2D.rotation = t.rotation + gun.angle;
    e.Velocity.x = Math.cos(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Velocity.y = Math.sin(t.rotation + gun.angle) * gun.projectileSpeed;
    e.Life.life = gun.range / gun.projectileSpeed;
    e.Bullet.owner = this._entity;
    e.Bullet.damage = gun.damage;
    e.Bullet.trailEffect = gun.trailEffect;
    e.Bullet.size = gun.projectileSize;
    TANK.main.addChild(e);

    // Create effect
    ParticleLibrary[gun.shootEffect](pos[0], pos[1], t.rotation + gun.angle);

    // Recoil
    this._entity.Velocity.x -= Math.cos(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.y -= Math.sin(t.rotation + gun.angle) * gun.recoil;
    this._entity.Velocity.r += -gun.recoil * 0.05 + Math.random() * gun.recoil * 0.1;

    // Shake screen
    var camera = TANK.main.Renderer2D.camera;
    var dist = TANK.Math2D.pointDistancePoint([t.x, t.y], [camera.x, camera.y]);
    if (dist < 1) dist = 1;
    if (dist < window.innerWidth / 2 && gun.screenShake > 0)
      TANK.main.dispatch("camerashake", gun.screenShake / (dist * 5));
  };

  this.fireGuns = function(gunSide)
  {
    var guns = this.guns[gunSide];
    for (var i = 0; i < guns.length; ++i)
      this.fireGun(i, gunSide);
  };

  this.update = function(dt)
  {
    // Update all guns
    this.maxRange = 0;
    for (var i in this.guns)
    {
      var guns = this.guns[i];
      for (var j = 0; j < guns.length; ++j)
      {
        // Reload timer
        guns[j].reloadTimer -= dt;
        if (guns[j].reloadTimer < 0)
          guns[j].reloadTimer = 0;

        // Calculate world position of gun
        var pos = [guns[j].x, guns[j].y];
        pos = TANK.Math2D.subtract(pos, [this.width / 2, this.height / 2]);
        pos = TANK.Math2D.rotate(pos, t.rotation);
        pos = TANK.Math2D.scale(pos, TANK.main.Game.scaleFactor);
        pos = TANK.Math2D.add(pos, [t.x, t.y]);
        guns[j].worldPos = pos;

        // Find max range
        this.maxRange = Math.max(this.maxRange, guns[j].range);    
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

    for (var gunSide in this.guns)
    {
      for (var i = 0; i < this.guns[gunSide].length; ++i)
      {
        var gun = this.guns[gunSide][i];
        ctx.save();
        ctx.translate(gun.x, gun.y);
        ctx.rotate(gun.angle);

        if (!gun.image)
        {
          ctx.fillStyle = "#fff";
          ctx.fillRect(-2.5, -2.5, 5, 5);
        }
        else
        {
          ctx.scale(0.5, 0.5);
          ctx.translate(gun.image.width / -2, gun.image.height / -2);
          ctx.drawImage(gun.image, 0, 0);
        }
        ctx.restore();
      }
    }

    ctx.restore();
  };
});

function main()
{
  TANK.createEngine(["Input", "Renderer2D", "Game", "StarField"]);

  TANK.main.Renderer2D.context = document.querySelector("#canvas").getContext("2d");
  TANK.main.Input.context = document.querySelector("#stage");

  TANK.start();
}