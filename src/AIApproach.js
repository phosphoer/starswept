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
