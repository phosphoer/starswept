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