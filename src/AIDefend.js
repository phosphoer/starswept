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
