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
