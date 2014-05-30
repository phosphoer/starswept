this.Action = this.Action || {};

Action.AIApproach = function(e, target)
{
  this.target = target;
  this.optimalDistance = 300;
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
    var targetDist = TANK.Math2D.pointDistancePoint([t.x, t.y], targetPos);

    if (targetDist > this.optimalDistance)
    {
      ship.moveTowards(targetPos);
    }
    else
    {
      ship.desiredSpeed = 0;

      if (v.getSpeed() < 1 && v.r < 0.1)
        this._done = true;
    }
  };

  this.stop = function()
  {
  };
};
