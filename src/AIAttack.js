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